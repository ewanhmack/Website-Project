import { setGlobalOptions } from "firebase-functions";
import { onObjectFinalized, onObjectDeleted } from "firebase-functions/v2/storage";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { ExifTool } from "exiftool-vendored";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const db = getFirestore();

function getOrientation(width: number, height: number): string {
  if (height > width) {
    return "Portraits";
  }
  return "Landscapes";
}

function stripTrailingZeros(value: number): string {
  return parseFloat(value.toFixed(10)).toString();
}

export const onPhotoUploaded = onObjectFinalized(
  { timeoutSeconds: 120, memory: "512MiB", region: "europe-west2" },
  async (event) => {
    const filePath = event.data.name;

    if (!filePath.startsWith("images/photos/")) {
      return;
    }

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();

    if (ext !== ".webp") {
      return;
    }

    const bucket = getStorage().bucket(event.data.bucket);
    const tempPath = path.join(os.tmpdir(), fileName);

    await bucket.file(filePath).download({ destination: tempPath });

    const exiftool = new ExifTool();
    let metadata: Record<string, string> = {};
    let width = 0;
    let height = 0;

    try {
      const tags = await exiftool.read(tempPath);

      width = tags.ImageWidth ?? 0;
      height = tags.ImageHeight ?? 0;

      if (tags.ExposureTime !== undefined) {
        metadata.shutterSpeed = stripTrailingZeros(Number(tags.ExposureTime));
      }

      if (tags.FNumber !== undefined) {
        metadata.aperture = `f/${stripTrailingZeros(Number(tags.FNumber))}`;
      }

      if (tags.ISO !== undefined) {
        metadata.iso = String(tags.ISO);
      }

      if (tags.DateTimeOriginal !== undefined) {
        metadata.createdDateTime = String(tags.DateTimeOriginal);
      }

      if (tags.LensModel !== undefined) {
        metadata.lensModel = String(tags.LensModel);
      }
    } finally {
      await exiftool.end();
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // ignore cleanup error
      }
    }

    const category = getOrientation(width, height);
    const categoryRef = db.collection("photography").doc(category);

    await categoryRef.set({ name: category }, { merge: true });

    const existingPhotos = await categoryRef
      .collection("photos")
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const nextOrder = existingPhotos.empty
      ? 0
      : (existingPhotos.docs[0].data().order ?? 0) + 1;

    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "01-01-2100",
    });

    await categoryRef.collection("photos").add({
      image: fileName,
      storageUrl: url,
      storagePath: filePath,
      metadata,
      order: nextOrder,
    });

    console.log(`Added ${fileName} to ${category}`);
  }
);

export const onPhotoDeleted = onObjectDeleted(
  { region: "europe-west2" },
  async (event) => {
    const filePath = event.data.name;

    if (!filePath.startsWith("images/photos/")) {
      return;
    }

    const fileName = path.basename(filePath);
    const categories = await db.collection("photography").get();

    for (const categoryDoc of categories.docs) {
      const photos = await categoryDoc.ref
        .collection("photos")
        .where("image", "==", fileName)
        .get();

      for (const photoDoc of photos.docs) {
        await photoDoc.ref.delete();
        console.log(`Deleted Firestore doc for ${fileName} from ${categoryDoc.id}`);
      }
    }
  }
);