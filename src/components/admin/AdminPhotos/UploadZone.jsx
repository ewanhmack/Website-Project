import React, { useState, useRef } from "react";

export default function UploadZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      onFiles(files);
    }
  };

  return (
    <div
      className={`aph-dropzone ${dragging ? "aph-dropzone--active" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <span className="aph-dropzone-icon">📷</span>
      <span className="aph-dropzone-text">Drop photos here or click to select</span>
      <span className="aph-dropzone-sub">JPG, PNG, WebP — converted to WebP on upload</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files).filter((f) =>
            f.type.startsWith("image/")
          );
          if (files.length > 0) {
            onFiles(files);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}