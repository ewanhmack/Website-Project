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

function stripQueryAndHash(value) {
  if (!value) {
    return "";
  }

  return value.split("?")[0].split("#")[0];
}

function joinBaseUrl(baseUrl, relativePath) {
  const base = baseUrl || "/";
  const baseTrimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  const pathTrimmed = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${baseTrimmed}${pathTrimmed}`;
}

function toPublicUrl(value) {
  if (!value) {
    return "";
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const cleaned = stripQueryAndHash(value).replace(/^\/+/, "");
  return joinBaseUrl(baseUrl, cleaned);
}

function resolveProjectMediaSrc(rawSrc) {
  if (!rawSrc) {
    return "";
  }

  if (isAbsoluteUrl(rawSrc)) {
    return rawSrc;
  }

  const cleaned = stripQueryAndHash(rawSrc).replace(/^\/+/, "");

  if (cleaned.startsWith(MEDIA_BASE)) {
    return toPublicUrl(cleaned);
  }

  if (cleaned.startsWith("images/")) {
    return toPublicUrl(cleaned);
  }

  return toPublicUrl(`${MEDIA_BASE}${cleaned}`);
}

function derivePosterFromVideoSrc(videoSrc) {
  if (!videoSrc) {
    return "";
  }

  const cleaned = stripQueryAndHash(videoSrc);
  const lower = cleaned.toLowerCase();

  if (!lower.endsWith(".mp4")) {
    return "";
  }

  return `${cleaned.slice(0, cleaned.length - 4)}-poster.webp`;
}

function resolveThumbForMediaItem(mediaItem) {
  if (!mediaItem) {
    return "";
  }

  if (mediaItem.type === "youtube") {
    const videoId = youtubeIdFrom(mediaItem.src || "");
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }

    return "";
  }

  if (mediaItem.type === "video") {
    const posterSrc = derivePosterFromVideoSrc(mediaItem.src || "");
    if (posterSrc) {
      return resolveProjectMediaSrc(posterSrc);
    }

    return "";
  }

  const thumbCandidate = mediaThumbUrl(mediaItem, MEDIA_BASE);

  if (!thumbCandidate) {
    return "";
  }

  if (isAbsoluteUrl(thumbCandidate)) {
    return thumbCandidate;
  }

  return resolveProjectMediaSrc(thumbCandidate);
}

function resolveRelatedPreview(project) {
  const imageCandidate = firstImage(project);

  if (imageCandidate) {
    return resolveProjectMediaSrc(imageCandidate);
  }

  const mediaArray = getMediaArray(project) || [];

  const firstVideo = mediaArray.find((mediaItem) => {
    const src = mediaItem?.src || "";
    const type = mediaTypeFromSrc(src);
    if (type === "video") {
      return true;
    }
    return false;
  });

  if (firstVideo && firstVideo.src) {
    const posterSrc = derivePosterFromVideoSrc(firstVideo.src);
    if (posterSrc) {
      return resolveProjectMediaSrc(posterSrc);
    }
  }

  const firstYoutube = mediaArray.find((mediaItem) => {
    const src = mediaItem?.src || "";
    const type = mediaTypeFromSrc(src);
    if (type === "youtube") {
      return true;
    }
    return false;
  });

  if (firstYoutube && firstYoutube.src) {
    const videoId = youtubeIdFrom(firstYoutube.src);
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  return toPublicUrl("no-image.png");
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError.message || "Failed to load project");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const project = useMemo(() => {
    return projects.find((candidateProject) => {
      return slugify(candidateProject.header) === slug;
    });
  }, [projects, slug]);

  const media = useMemo(() => {
    if (!project) {
      return [];
    }

    return getMediaArray(project).map((mediaItem) => {
      const type = mediaTypeFromSrc(mediaItem.src);
      let resolvedSrc = mediaItem.src || "";

      if (type === "youtube") {
        const id = youtubeIdFrom(resolvedSrc);
        resolvedSrc = `https://www.youtube.com/embed/${id}`;
      } else {
        resolvedSrc = resolveProjectMediaSrc(resolvedSrc);
      }

      const resolvedThumb = resolveThumbForMediaItem({ ...mediaItem, type });

      return {
        ...mediaItem,
        type,
        _resolvedSrc: resolvedSrc,
        _resolvedThumb: resolvedThumb,
      };
    });
  }, [project]);

  useEffect(() => {
    setIndex(0);
  }, [project?.header]);

  if (loading) {
    return <div className="container pad-y">Loading…</div>;
  }

  if (error) {
    return (
      <div className="container error" role="alert">
        {String(error)}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container pad-y">
        <p>Project not found.</p>
        <Link to="/programming" className="ghost">
          ← Back to Projects
        </Link>
      </div>
    );
  }

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

          {project.description && <p className="lead">{project.description}</p>}

          {project.tech?.length ? (
            <div className="chips">
              {project.tech.map((techItem) => (
                <span key={techItem} className="chip pill disabled" aria-disabled>
                  {techItem}
                </span>
              ))}
            </div>
          ) : null}
        </header>
      </div>

      {media.length > 0 ? (
        <section className="detail-media">
          <div className="container">
            <div className="media-viewer">
              {media[index].type === "image" ? (
                <img
                  src={media[index]._resolvedSrc}
                  alt={media[index].caption || project.header}
                />
              ) : null}

              {media[index].type === "video" ? (
                <video src={media[index]._resolvedSrc} controls playsInline />
              ) : null}

              {media[index].type === "youtube" ? (
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
              ) : null}

              {canPrev || canNext ? (
                <div className="viewer-arrows">
                  <button
                    className="circle"
                    onClick={() => {
                      if (canPrev) {
                        setIndex((currentIndex) => Math.max(0, currentIndex - 1));
                      }
                    }}
                    disabled={!canPrev}
                    aria-label="Previous media"
                  >
                    ‹
                  </button>

                  <button
                    className="circle"
                    onClick={() => {
                      if (canNext) {
                        setIndex((currentIndex) =>
                          Math.min(media.length - 1, currentIndex + 1)
                        );
                      }
                    }}
                    disabled={!canNext}
                    aria-label="Next media"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>

            {media.length > 1 ? (
              <div className="thumbs" role="list">
                {media.map((mediaItem, mediaIndex) => (
                  <button
                    key={`${mediaItem.src}-${mediaIndex}`}
                    className={mediaIndex === index ? "thumb active" : "thumb"}
                    onClick={() => {
                      setIndex(mediaIndex);
                    }}
                    aria-label={`Show ${mediaItem.caption || `media ${mediaIndex + 1}`}`}
                  >
                    <img src={mediaItem._resolvedThumb} alt="" />
                  </button>
                ))}
              </div>
            ) : null}

            {media[index]?.caption ? (
              <figcaption className="caption">{media[index].caption}</figcaption>
            ) : null}

            {media[index]?.blurb ? <p className="blurb">{media[index].blurb}</p> : null}
          </div>
        </section>
      ) : null}

      <section className="container detail-body">
        {project.longDescription ? (
          <p className="long-text">{project.longDescription}</p>
        ) : null}

        {project.links?.length ? (
          <div className="links">
            {project.links.map((linkItem) => (
              <a
                key={linkItem.href}
                href={linkItem.href}
                target="_blank"
                rel="noreferrer noopener"
                className="button"
              >
                {linkItem.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section className="container related">
        <h2>More projects</h2>

        <div className="related-grid">
          {projects
            .filter((candidateProject) => candidateProject !== project)
            .slice(0, 3)
            .map((candidateProject) => {
              const relatedPreviewSrc = resolveRelatedPreview(candidateProject);

              return (
                <Link
                  key={candidateProject.header}
                  to={`/projects/${slugify(candidateProject.header)}`}
                  className="related-card"
                >
                  <div className="thumb-wrap">
                    <img src={relatedPreviewSrc} alt="" />
                  </div>

                  <div className="meta">
                    <h3>{candidateProject.header}</h3>
                    <p>{candidateProject.description}</p>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>
    </article>
  );
}
