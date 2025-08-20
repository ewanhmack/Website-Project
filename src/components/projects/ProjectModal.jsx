// src/components/projects/ProjectModal.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MEDIA_BASE, getMediaArray } from "../../utils/projects";

export default function ProjectModal({
  project,
  slide,
  setSlide,
  onPrev,
  onNext,
  onClose,
  isClosing,
}) {
  const media = getMediaArray(project);
  const current = media[slide] || {};
  const total = Math.max(1, media.length);
  const dialogRef = useRef(null);

  // --- Simple focus trap + prevent scroll on focus (stops jump)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // focus first element WITHOUT scrolling the page
    if (first && typeof first.focus === "function") {
      try { first.focus({ preventScroll: true }); } catch { first.focus?.(); }
    }

    const handle = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        try { last?.focus({ preventScroll: true }); } catch { last?.focus(); }
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        try { first?.focus({ preventScroll: true }); } catch { first?.focus(); }
      }
    };

    el.addEventListener("keydown", handle);
    return () => el.removeEventListener("keydown", handle);
  }, []);

  // --- Close on overlay click (but not on modal content click)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // --- Helpers
  const isVideo = (src = "") => /\.mp4$|\.webm$|\.ogg$/i.test(src);
  const srcUrl = current?.src ? MEDIA_BASE + current.src : null;

  // --- Overlay with ORIGINAL class names so your CSS works as before
  const overlay = (
    <div
      className="modal-overlay"
      data-state={isClosing ? "closing" : "open"}
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="modal"
        data-state={isClosing ? "closing" : "open"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        ref={dialogRef}
      >
        <header className="modal-head">
          <h3 id="project-modal-title" className="modal-title">
            {project.header || "Project"}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close" type="button">
            ×
          </button>
        </header>

        <div className="modal-body">
          {media.length > 0 ? (
            <figure className="modal-figure">
              <div className="modal-media-shell">
                {/* arrows (old classes) */}
                {total > 1 && (
                  <button className="modal-arrow left" onClick={onPrev} aria-label="Previous" type="button">
                    ‹
                  </button>
                )}

                {/* media — image (as before) or video (optional add) */}
                {srcUrl && !isVideo(srcUrl) && (
                  <img
                    key={current.src || slide}
                    className="modal-media fade-swap"
                    src={srcUrl}
                    alt={current.caption ? `Slide: ${current.caption}` : "Project media"}
                    loading="eager"
                  />
                )}
                {srcUrl && isVideo(srcUrl) && (
                  <video
                    key={current.src || slide}
                    className="modal-media fade-swap"
                    src={srcUrl}
                    controls
                    playsInline
                    preload="metadata"
                  />
                )}

                {total > 1 && (
                  <button className="modal-arrow right" onClick={onNext} aria-label="Next" type="button">
                    ›
                  </button>
                )}
              </div>

              {/* caption/top row exactly like old */}
              <figcaption className="modal-caption">
                <div className="modal-caption-top">
                  <span className="modal-slide-idx" aria-live="polite">
                    {slide + 1} / {total}
                  </span>
                  {current.caption && (
                    <strong className="modal-caption-title">{current.caption}</strong>
                  )}
                </div>
                {current.blurb && <p className="modal-caption-text">{current.blurb}</p>}
              </figcaption>

              {/* dots (old structure & classes) */}
              {media.length > 1 && (
                <div className="modal-dots" role="tablist" aria-label="Slides">
                  {media.map((_, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === slide}
                      className={`dot ${i === slide ? "active" : ""}`}
                      onClick={() => setSlide(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      type="button"
                    />
                  ))}
                </div>
              )}
            </figure>
          ) : (
            <p className="muted">No media available for this project.</p>
          )}

          {/* project description (old block & class) */}
          {project.longDescription && (
            <div className="modal-project-desc">
              <h4>About this project</h4>
              {project.longDescription.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* tech + links (unchanged classes) */}
          {(project.tech?.length || project.links?.length) && (
            <div className="modal-meta">
              {project.tech?.length ? (
                <div className="meta-block">
                  <h5>Tech</h5>
                  <ul className="tag-list">
                    {project.tech.map((t, i) => (
                      <li key={i} className="tag">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {project.links?.length ? (
                <div className="meta-block">
                  <h5>Links</h5>
                  <ul className="link-list">
                    {project.links.map((l, i) => (
                      <li key={i}>
                        <a href={l.href} target="_blank" rel="noreferrer">
                          {l.label || l.href}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mount to #modal-root if present, else <body>
  const mountNode = document.getElementById("modal-root") || document.body;
  return createPortal(overlay, mountNode);
}
