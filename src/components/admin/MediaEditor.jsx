import React, { useState, useRef, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from "../../firebase";
import { resolveMediaSrc } from "../../utils/projects";
import { mediaTypeFromSrc, youtubeIdFrom } from "../../utils/projectsExtras";

const EMPTY_MEDIA = { src: "", caption: "", blurb: "" };

function slugify(header = "") {
  return String(header)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");
}

function MediaPreview({ src }) {
  if (!src) {
    return <div className="ap-media-preview ap-media-preview--empty">No src</div>;
  }

  const type = mediaTypeFromSrc(src);

  if (type === "youtube") {
    const id = youtubeIdFrom(src);
    return (
      <div className="ap-media-preview">
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="YouTube thumbnail" />
        <span className="ap-media-badge">YouTube</span>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="ap-media-preview">
        <video src={resolveMediaSrc(src)} className="ap-media-preview-video" muted />
        <span className="ap-media-badge">Video</span>
      </div>
    );
  }

  return (
    <div className="ap-media-preview">
      <img src={resolveMediaSrc(src)} alt="Media preview" />
    </div>
  );
}

function MediaUploadButton({ projectHeader, onUploaded, disabled }) {
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

export default function MediaEditor({ media, onChange, projectHeader = "" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pasting, setPasting] = useState(false);

  const update = (index, key, value) => {
    onChange(media.map((m, i) => i === index ? { ...m, [key]: value } : m));
  };

  const add = () => {
    onChange([...media, { ...EMPTY_MEDIA }]);
    setActiveIndex(media.length);
  };

  const remove = (index) => {
    const next = media.filter((_, i) => i !== index);
    onChange(next);
    setActiveIndex(Math.min(activeIndex, Math.max(0, next.length - 1)));
  };

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(media.length - 1, i + 1));

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (!imageItem) {
        return;
      }

      const file = imageItem.getAsFile();
      if (!file) {
        return;
      }

      if (!projectHeader.trim()) {
        return;
      }

      setPasting(true);

      try {
        const folder = slugify(projectHeader);
        const timestamp = Date.now();
        const fileName = `pasted-${timestamp}.png`;
        const storagePath = `images/projects/${folder}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file);
        await getDownloadURL(storageRef);

        const relativePath = `${folder}/${fileName}`;

        if (media.length === 0) {
          onChange([{ src: relativePath, caption: "", blurb: "" }]);
          setActiveIndex(0);
        } else {
          update(activeIndex, "src", relativePath);
        }
      } catch (err) {
        console.error("Paste upload failed:", err);
      } finally {
        setPasting(false);
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [media, activeIndex, projectHeader, onChange]);

  return (
    <div className="ap-section">
      <div className="ap-section-header">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>Media</span>
          {projectHeader.trim() ? (
            <span className="ap-paste-hint">
              {pasting ? "Uploading pasted image…" : "Ctrl+V to paste from clipboard"}
            </span>
          ) : null}
        </div>
        <button type="button" className="ap-add-btn" onClick={add}>+ Add Media</button>
      </div>

      {media.length === 0 ? (
        <p className="ap-empty">No media yet.</p>
      ) : (
        <div className="ap-media-carousel">
          <div className="ap-media-carousel-preview">
            <MediaPreview src={media[activeIndex]?.src} />
            {pasting ? (
              <div className="ap-media-paste-overlay">Uploading…</div>
            ) : null}
            {media.length > 1 ? (
              <div className="ap-media-carousel-arrows">
                <button
                  type="button"
                  onClick={prev}
                  disabled={activeIndex === 0}
                  className="ap-arrow"
                >
                  ‹
                </button>
                <span className="ap-media-counter">
                  {activeIndex + 1} / {media.length}
                </span>
                <button
                  type="button"
                  onClick={next}
                  disabled={activeIndex === media.length - 1}
                  className="ap-arrow"
                >
                  ›
                </button>
              </div>
            ) : null}
          </div>

          <div className="ap-media-fields">
            <div className="ap-media-item-header">
              <span className="ap-media-index">#{activeIndex + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <MediaUploadButton
                  projectHeader={projectHeader}
                  onUploaded={(relativePath) => {
                    update(activeIndex, "src", relativePath);
                  }}
                />
                <button
                  type="button"
                  className="ap-remove-btn"
                  onClick={() => remove(activeIndex)}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="src (e.g. unreal/screenshot.png or https://youtu.be/...)"
              value={media[activeIndex]?.src || ""}
              onChange={(e) => update(activeIndex, "src", e.target.value)}
            />
            <input
              type="text"
              placeholder="Caption"
              value={media[activeIndex]?.caption || ""}
              onChange={(e) => update(activeIndex, "caption", e.target.value)}
            />
            <input
              type="text"
              placeholder="Blurb"
              value={media[activeIndex]?.blurb || ""}
              onChange={(e) => update(activeIndex, "blurb", e.target.value)}
            />
          </div>

          <div className="ap-media-thumbs">
            {media.map((item, index) => (
              <button
                key={index}
                type="button"
                className={`ap-media-thumb ${index === activeIndex ? "ap-media-thumb--active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Media item ${index + 1}`}
              >
                {item.src ? (
                  mediaTypeFromSrc(item.src) === "youtube" ? (
                    <img
                      src={`https://i.ytimg.com/vi/${youtubeIdFrom(item.src)}/hqdefault.jpg`}
                      alt=""
                    />
                  ) : mediaTypeFromSrc(item.src) === "video" ? (
                    <span className="ap-thumb-icon">▶</span>
                  ) : (
                    <img src={resolveMediaSrc(item.src)} alt="" />
                  )
                ) : (
                  <span className="ap-thumb-icon">?</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}