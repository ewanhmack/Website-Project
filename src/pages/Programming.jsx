import React, { useEffect, useState, useCallback, useRef } from "react";
import "./projects.css";
import "./PageStyles.css";

const MEDIA_BASE = "images/projects/"; // base for images

export default function Programming() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // NEW: modal state
  const [openProject, setOpenProject] = useState(null); // the full project object
  const [slide, setSlide] = useState(0); // which media item is showing

  useEffect(() => {
    fetch("data/projects.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoaded(true));
  }, []);

  // Open modal on card click/Enter
  const open = useCallback((project) => {
    setOpenProject(project);
    setSlide(0);
  }, []);

  // Close modal
  const close = useCallback(() => {
    setOpenProject(null);
    setSlide(0);
  }, []);

  // Arrow navigation in modal
  const next = useCallback(() => {
    if (!openProject) return;
    const m = getMediaArray(openProject);
    setSlide((s) => (s + 1) % Math.max(1, m.length));
  }, [openProject]);

  const prev = useCallback(() => {
    if (!openProject) return;
    const m = getMediaArray(openProject);
    const len = Math.max(1, m.length);
    setSlide((s) => (s - 1 + len) % len);
  }, [openProject]);

  // Keyboard handlers while modal is open
  useEffect(() => {
    if (!openProject) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    // Prevent background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openProject, close, next, prev]);

  return (
    <div className="page-container">
      <header className="projects-header">
        <h2>Programming Projects</h2>
        <p className="muted">
          Selected work across Unreal Engine, graphics (SFML/SEG), and web.
        </p>
      </header>

      {!loaded && (
        <div className="muted" style={{ marginTop: 24 }}>
          Loading projects…
        </div>
      )}

      {loaded && error && (
        <div className="error-banner" role="alert">
          Couldn’t load projects ({error}). Check{" "}
          <code>public/data/projects.json</code>.
        </div>
      )}

      {loaded && !error && (
        <section aria-label="Projects Grid" className="projects-grid">
          {projects.map((p, i) => {
            const title = p.header || "Untitled project";
            const desc = p.description || "";
            const hasImg = !!firstImage(p);
            const imgSrc = hasImg ? MEDIA_BASE + firstImage(p) : null;

            return (
              <article
                key={`${title}-${i}`}
                className="project-card"
                tabIndex={0}
                onClick={() => open(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(p);
                  }
                }}
                aria-label={`Open ${title}`}
              >
                <figure className="project-media">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={p.header ? `Preview of ${p.header}` : "Project preview"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="project-placeholder" aria-label="No image available">
                      <span className="project-placeholder-text">No image</span>
                    </div>
                  )}
                </figure>

                <div className="project-body">
                  <h3 className="project-title">{title}</h3>
                  <p className="project-desc">{desc}</p>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {openProject && (
        <ProjectModal
          project={openProject}
          slide={slide}
          setSlide={setSlide}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      )}
    </div>
  );
}

/** ---------- Helpers ---------- **/

// Allow backward-compat: if your current JSON only has `image` + `description`,
// we wrap it into a media array. New JSON will provide `media: [{src, caption, blurb}]`.
function getMediaArray(project) {
  if (Array.isArray(project.media) && project.media.length) return project.media;
  const src = project.image ? project.image : null;
  return src
    ? [{ src, caption: project.header || "", blurb: project.description || "" }]
    : [];
}

function firstImage(project) {
  const m = getMediaArray(project);
  return m[0]?.src || null;
}

/** ---------- Modal Component ---------- **/

function ProjectModal({ project, slide, setSlide, onPrev, onNext, onClose }) {
  const media = getMediaArray(project);
  const current = media[slide] || {};
  const dialogRef = useRef(null);

  // Focus trap (simple)
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
    // move initial focus
    first?.focus();
    return () => el.removeEventListener("keydown", handle);
  }, []);

  const total = Math.max(1, media.length);

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        ref={dialogRef}
      >
        <header className="modal-head">
          <h3 id="project-modal-title" className="modal-title">
            {project.header || "Project"}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="modal-body">
          {media.length > 0 ? (
            <figure className="modal-figure">
              <div className="modal-media-shell">
                <button className="modal-arrow left" onClick={onPrev} aria-label="Previous">‹</button>

                <img
                  className="modal-media"
                  src={MEDIA_BASE + (current.src || "")}
                  alt={current.caption ? `Slide: ${current.caption}` : "Project media"}
                  loading="eager"
                />

                <button className="modal-arrow right" onClick={onNext} aria-label="Next">›</button>
              </div>

              {/* Per-image description box */}
              <figcaption className="modal-caption">
                <div className="modal-caption-top">
                  <span className="modal-slide-idx" aria-live="polite">
                    {slide + 1} / {total}
                  </span>
                  {current.caption && <strong className="modal-caption-title">{current.caption}</strong>}
                </div>
                {current.blurb && <p className="modal-caption-text">{current.blurb}</p>}
              </figcaption>

              {/* Dots */}
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

          {/* Optional global description (project-level) */}
          {project.longDescription && (
            <div className="modal-project-desc">
              <h4>About this project</h4>
              <p>{project.longDescription}</p>
            </div>
          )}

          {/* Optional metadata: tech stack / links */}
          {(project.tech?.length || project.links?.length) && (
            <div className="modal-meta">
              {project.tech?.length ? (
                <div className="meta-block">
                  <h5>Tech</h5>
                  <ul className="tag-list">
                    {project.tech.map((t, i) => (
                      <li key={i} className="tag">{t}</li>
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
