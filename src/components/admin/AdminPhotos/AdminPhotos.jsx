import React, { useState, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, getMetadata } from "firebase/storage";
import { db, storage } from "../../../firebase";
import exifr from "exifr";
import UploadZone from "./UploadZone";
import UploadProgress from "./UploadProgress";
import "../../css/AdminPhotos.css";

function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error(`Failed to convert ${file.name}`));
            return;
          }
          const webpName = file.name.replace(/\.[^.]+$/, ".webp");
          const webpFile = new File([blob], webpName, { type: "image/webp" });
          resolve({ file: webpFile, width: img.naturalWidth, height: img.naturalHeight });
        },
        "image/webp",
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };

    img.src = url;
  });
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest → Oldest" },
  { value: "oldest", label: "Oldest → Newest" },
  { value: "az",     label: "A → Z" },
  { value: "za",     label: "Z → A" },
];

function applySortAndSearch(photos, sort, search) {
  const filtered = photos.filter((p) =>
    p.image.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered];

  if (sort === "newest") {
    sorted.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  } else if (sort === "oldest") {
    sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } else if (sort === "az") {
    sorted.sort((a, b) => a.image.localeCompare(b.image));
  } else if (sort === "za") {
    sorted.sort((a, b) => b.image.localeCompare(a.image));
  }

  return sorted;
}

export default function AdminPhotos() {
  const [uploadItems, setUploadItems] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("oldest");

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const categoriesSnapshot = await getDocs(collection(db, "photography"));
      const result = {};

      for (const categoryDoc of categoriesSnapshot.docs) {
        const category = categoryDoc.id;
        const photosSnapshot = await getDocs(
          collection(db, "photography", category, "photos")
        );
        result[category] = photosSnapshot.docs
          .map((d) => ({ id: d.id, categoryId: category, ...d.data() }))
          .sort((a, b) => a.order - b.order);
      }

      setPhotos(result);
      if (!activeCategory && Object.keys(result).length > 0) {
        setActiveCategory(Object.keys(result)[0]);
      }
    } finally {
      setLoadingPhotos(false);
    }
  }, [activeCategory]);

  React.useEffect(() => {
    fetchPhotos();
  }, []);

  const updateItem = (name, patch) => {
    setUploadItems((prev) =>
      prev.map((item) => item.name === name ? { ...item, ...patch } : item)
    );
  };

  const handleFiles = async (files) => {
    const newItems = files.map((f) => ({
      name: f.name,
      status: "converting",
      error: null,
    }));

    setUploadItems((prev) => [...prev, ...newItems]);

    for (const file of files) {
      try {
        const [{ file: webpFile, width, height }, exif] = await Promise.all([
          convertToWebP(file),
          exifr.parse(file, {
            pick: ["ExposureTime", "FNumber", "ISO", "DateTimeOriginal", "LensModel", "ImageWidth", "ImageHeight"],
          }).catch(() => ({})),
        ]);

        updateItem(file.name, { status: "uploading" });

        const storageRef = ref(storage, `images/photos/${webpFile.name}`);

        try {
          await getMetadata(storageRef);
          updateItem(file.name, { status: "done" });
          continue;
        } catch {
          // file doesn't exist, proceed
        }

        const customMetadata = {};

        if (exif?.ExposureTime !== undefined) {
          customMetadata.shutterSpeed = String(parseFloat(Number(exif.ExposureTime).toFixed(10)));
        }
        if (exif?.FNumber !== undefined) {
          customMetadata.aperture = `f/${parseFloat(Number(exif.FNumber).toFixed(10))}`;
        }
        if (exif?.ISO !== undefined) {
          customMetadata.iso = String(exif.ISO);
        }
        if (exif?.DateTimeOriginal !== undefined) {
          customMetadata.createdDateTime = new Date(exif.DateTimeOriginal).toISOString();
        }
        if (exif?.LensModel !== undefined) {
          customMetadata.lensModel = String(exif.LensModel);
        }

        customMetadata.imageWidth = exif?.ImageWidth
          ? String(exif.ImageWidth)
          : String(width ?? 0);

        customMetadata.imageHeight = exif?.ImageHeight
          ? String(exif.ImageHeight)
          : String(height ?? 0);

        await uploadBytes(storageRef, webpFile, { customMetadata });

        updateItem(file.name, { status: "done" });
      } catch (err) {
        updateItem(file.name, { status: "error", error: err.message });
      }
    }

    setTimeout(() => {
      fetchPhotos();
      setUploadItems([]);
    }, 5000);
  };

  const handleDelete = async (photo) => {
    try {
      const storagePath = photo.storagePath || `images/photos/${photo.image}`;
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, "photography", photo.categoryId, "photos", photo.id));
      setDeleteConfirm(null);
      fetchPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = Object.keys(photos);
  const activePhotos = applySortAndSearch(
    activeCategory ? (photos[activeCategory] || []) : [],
    sort,
    search
  );

  return (
    <div className="aph-page">
      <div className="aph-page-header">
        <h1>Manage Photos</h1>
      </div>

      <UploadZone onFiles={handleFiles} />
      <UploadProgress items={uploadItems} />

      {loadingPhotos ? (
        <div className="muted aph-loading">Loading photos…</div>
      ) : (
        <>
          <div className="aph-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`aph-tab ${cat === activeCategory ? "aph-tab--active" : ""}`}
                onClick={() => { setActiveCategory(cat); setSearch(""); }}
              >
                {cat}
                <span className="aph-tab-count">{photos[cat]?.length ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="aph-toolbar">
            <div className="aph-search-bar">
              <input
                type="search"
                placeholder="Search by filename…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search photos"
              />
              {search ? (
                <button
                  className="aph-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="aph-sort">
              <label htmlFor="aph-sort-select">Sort</label>
              <select
                id="aph-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activePhotos.length === 0 ? (
            <div className="muted aph-loading">
              {search ? "No photos match your search." : "No photos in this category yet."}
            </div>
          ) : null}

          <div className="aph-grid">
            {activePhotos.map((photo) => (
              <div key={photo.id} className="aph-photo-card">
                <div className="aph-photo-img-wrap">
                  <img
                    src={photo.storageUrl}
                    alt={photo.image}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="aph-photo-footer">
                  <span className="aph-photo-name">{photo.image}</span>
                  {deleteConfirm === photo.id ? (
                    <div className="aph-delete-confirm">
                      <button onClick={() => handleDelete(photo)}>Confirm</button>
                      <button className="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className="aph-delete-btn"
                      onClick={() => setDeleteConfirm(photo.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}