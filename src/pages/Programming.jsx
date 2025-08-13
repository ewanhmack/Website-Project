import React, { useEffect, useState } from "react";
import "./projects.css";
import "./PageStyles.css";

export default function Programming() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

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
            const hasImg = p.image && p.image.trim().length > 0;
            const imgSrc = hasImg ? `images/projects/${p.image}` : null;

            return (
              <article key={`${title}-${i}`} className="project-card" tabIndex={0}>
                <figure className="project-media">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={
                        p.header
                          ? `Preview of ${p.header}`
                          : "Project preview"
                      }
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
    </div>
  );
}
