import React, { useEffect, useRef } from "react";
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

  // Simple focus trap
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handle = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    el.addEventListener("keydown", handle);
    first?.focus();
    return () => el.removeEventListener("keydown", handle);
  }, []);

  return (
    <div
      className="modal-overlay"
      data-state={isClosing ? "closing" : "open"}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body">
          {media.length > 0 ? (
            <figure className="modal-figure">
              <div className="modal-media-shell">
                <button className="modal-arrow left" onClick={onPrev} aria-label="Previous">
                  ‹
                </button>

                {/* Cross-fade per slide */}
                <img
                  key={current.src || slide}
                  className="modal-media fade-swap"
                  src={MEDIA_BASE + (current.src || "")}
                  alt={current.caption ? `Slide: ${current.caption}` : "Project media"}
                  loading="eager"
                />

                <button className="modal-arrow right" onClick={onNext} aria-label="Next">
                  ›
                </button>
              </div>

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
                    />
                  ))}
                </div>
              )}
            </figure>
          ) : (
            <p className="muted">No media available for this project.</p>
          )}

          {project.longDescription && (
            <div className="modal-project-desc">
              <h4>About this project</h4>
              <p>{project.longDescription}</p>
            </div>
          )}

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
}
