import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MEDIA_BASE, firstImage, getMediaArray } from "../../utils/projects";
import {
  slugify,
  mediaTypeFromSrc,
  youtubeIdFrom,
  mediaThumbUrl,
  isAbsoluteUrl,
} from "../../utils/projectsExtras";
import "../../pages/projects.css";

const DATA_URL = `${import.meta.env.BASE_URL}data/projects.json`;

export default function ProjectDetail() {
  const { slug } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load project");
          setLoading(false);
        }
      });
    return () => (cancelled = true);
  }, []);

  const project = useMemo(
    () => projects.find((p) => slugify(p.header) === slug),
    [projects, slug]
  );

  const media = project
    ? getMediaArray(project).map((m) => {
        const type = mediaTypeFromSrc(m.src);
        let src = m.src || "";
        if (type === "youtube") {
          const id = youtubeIdFrom(src);
          src = `https://www.youtube.com/embed/${id}`;
        } else if (!isAbsoluteUrl(src)) {
          src = MEDIA_BASE + src;
        }
        return { ...m, type, _resolvedSrc: src };
      })
    : [];

  useEffect(() => {
    setIndex(0);
  }, [project?.header]);

  if (loading) return <div className="container pad-y">Loading…</div>;
  if (error)
    return (
      <div className="container error" role="alert">
        {String(error)}
      </div>
    );
  if (!project)
    return (
      <div className="container pad-y">
        <p>Project not found.</p>
        <Link to="/programming" className="ghost">
          ← Back to Projects
        </Link>
      </div>
    );

  const canPrev = index > 0;
  const canNext = index < media.length - 1;

  return (
    <article className="project-detail">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/programming">Projects</Link>
          <span>/</span>
          <span aria-current="page">{project.header}</span>
        </nav>
        <header className="detail-header">
          <h1>{project.header}</h1>
          {project.description && (
            <p className="lead">{project.description}</p>
          )}
          {project.tech?.length ? (
            <div className="chips">
              {project.tech.map((t) => (
                <span key={t} className="chip pill disabled" aria-disabled>
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </header>
      </div>

      {media.length > 0 && (
        <section className="detail-media">
          <div className="container">
            <div className="media-viewer">
              {media[index].type === "image" && (
                <img
                  src={media[index]._resolvedSrc}
                  alt={media[index].caption || project.header}
                />
              )}
              {media[index].type === "video" && (
                <video src={media[index]._resolvedSrc} controls playsInline />
              )}
              {media[index].type === "youtube" && (
                <iframe
                  src={media[index]._resolvedSrc}
                  title={media[index].caption || project.header}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    border: 0,
                    display: "block",
                  }}
                />
              )}
              {(canPrev || canNext) && (
                <div className="viewer-arrows">
                  <button
                    className="circle"
                    onClick={() => canPrev && setIndex((i) => Math.max(0, i - 1))}
                    disabled={!canPrev}
                    aria-label="Previous media"
                  >
                    ‹
                  </button>
                  <button
                    className="circle"
                    onClick={() =>
                      canNext && setIndex((i) => Math.min(media.length - 1, i + 1))
                    }
                    disabled={!canNext}
                    aria-label="Next media"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
            {media.length > 1 && (
              <div className="thumbs" role="list">
                {media.map((m, i) => (
                  <button
                    key={m.src}
                    className={i === index ? "thumb active" : "thumb"}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${m.caption || `media ${i + 1}`}`}
                  >
                    <img src={mediaThumbUrl(m, MEDIA_BASE)} alt="" />
                  </button>
                ))}
              </div>
            )}
            {media[index]?.caption && (
              <figcaption className="caption">{media[index].caption}</figcaption>
            )}
            {media[index]?.blurb && (
              <p className="blurb">{media[index].blurb}</p>
            )}
          </div>
        </section>
      )}

      <section className="container detail-body">
        {project.longDescription ? (
          <p className="long-text">{project.longDescription}</p>
        ) : null}

        {project.links?.length ? (
          <div className="links">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="button"
              >
                {l.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section className="container related">
        <h2>More projects</h2>
        <div className="related-grid">
          {projects
            .filter((p) => p !== project)
            .slice(0, 3)
            .map((p) => (
              <Link
                key={p.header}
                to={`/projects/${slugify(p.header)}`}
                className="related-card"
              >
                <div className="thumb-wrap">
                  <img
                    src={
                      firstImage(p) ? MEDIA_BASE + firstImage(p) : "/no-image.png"
                    }
                    alt=""
                  />
                </div>
                <div className="meta">
                  <h3>{p.header}</h3>
                  <p>{p.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </article>
  );
}
