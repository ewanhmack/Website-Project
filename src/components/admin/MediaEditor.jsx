import React, { useState } from "react";
import { resolveMediaSrc } from "../../utils/projects";
import { mediaTypeFromSrc, youtubeIdFrom } from "../../utils/projectsExtras";

const EMPTY_MEDIA = { src: "", caption: "", blurb: "" };

function MediaPreview({ src }) {
  if (!src) {
    return <div className="ap-media-preview ap-media-preview--empty">No src</div>;
  }

  const type = mediaTypeFromSrc(src);

  if (type === "youtube") {
    const id = youtubeIdFrom(src);
    return (
      <div className="ap-media-preview">
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt="YouTube thumbnail"
        />
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

export default function MediaEditor({ media, onChange }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const add = () => {
    onChange([...media, { ...EMPTY_MEDIA }]);
    setActiveIndex(media.length);
  };

  const update = (index, key, value) => {
    onChange(media.map((m, i) => i === index ? { ...m, [key]: value } : m));
  };

  const remove = (index) => {
    const next = media.filter((_, i) => i !== index);
    onChange(next);
    setActiveIndex(Math.min(activeIndex, Math.max(0, next.length - 1)));
  };

  const prev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const next = () => setActiveIndex((i) => Math.min(media.length - 1, i + 1));

  return (
    <div className="ap-section">
      <div className="ap-section-header">
        <span>Media</span>
        <button type="button" className="ap-add-btn" onClick={add}>+ Add Media</button>
      </div>

      {media.length === 0 ? (
        <p className="ap-empty">No media yet.</p>
      ) : (
        <div className="ap-media-carousel">
          <div className="ap-media-carousel-preview">
            <MediaPreview src={media[activeIndex]?.src} />
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
              <button
                type="button"
                className="ap-remove-btn"
                onClick={() => remove(activeIndex)}
              >
                ✕ Remove
              </button>
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