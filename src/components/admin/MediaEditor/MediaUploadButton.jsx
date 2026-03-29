import React, { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from "../../../firebase";
import { slugify } from "../../../utils/admin/slugify";

export default function MediaUploadButton({ projectHeader, onUploaded, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    e.target.value = "";
    setUploading(true);

    try {
      const folder = slugify(projectHeader) || "misc";
      const storagePath = `images/projects/${folder}/${file.name}`;
      const storageRef = ref(storage, storagePath);

      try {
        await getMetadata(storageRef);
      } catch {
        await uploadBytes(storageRef, file);
      }

      const url = await getDownloadURL(storageRef);
      onUploaded(`${folder}/${file.name}`, url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ap-upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || !projectHeader.trim()}
        title={!projectHeader.trim() ? "Enter a project title first" : "Upload file"}
      >
        {uploading ? "Uploading…" : "↑ Upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </>
  );
}