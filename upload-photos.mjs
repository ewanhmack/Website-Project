// upload-photos.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'website-project-deb45.firebasestorage.app',
});

const bucket = getStorage().bucket();
const db = getFirestore();

const PHOTOS_DIR = './public/images/photos';
const PROJECTS_DIR = './public/images/projects';

const uploadFile = async (localPath, storagePath) => {
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2100',
  });

  return url;
};

const uploadDirectory = async (localDir, storagePrefix) => {
  const entries = readdirSync(localDir);

  for (const entry of entries) {
    const localPath = join(localDir, entry);
    const stat = statSync(localPath);

    if (stat.isDirectory()) {
      await uploadDirectory(localPath, `${storagePrefix}/${entry}`);
    } else {
      const ext = extname(entry).toLowerCase();
      if (!['.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp4'].includes(ext)) {
        continue;
      }

      const storagePath = `${storagePrefix}/${entry}`;
      console.log(`  Uploading: ${storagePath}`);
      await uploadFile(localPath, storagePath);
    }
  }
};

const updateFirestoreUrls = async () => {
  console.log('Updating Firestore storageUrls...');

  const categories = await db.collection('photography').get();

  for (const categoryDoc of categories.docs) {
    const photos = await categoryDoc.ref.collection('photos').get();

    for (const photoDoc of photos.docs) {
      const { image } = photoDoc.data();
      const storagePath = `images/photos/${image}`;
      const file = bucket.file(storagePath);

      try {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '01-01-2100',
        });
        await photoDoc.ref.update({ storageUrl: url });
      } catch {
        console.warn(`  Could not get URL for ${image}`);
      }
    }
  }

  console.log('Firestore URLs updated.');
};

const run = async () => {
  console.log('Uploading photos...');
  await uploadDirectory(PHOTOS_DIR, 'images/photos');

  console.log('Uploading project media...');
  await uploadDirectory(PROJECTS_DIR, 'images/projects');

  await updateFirestoreUrls();

  console.log('All done.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});