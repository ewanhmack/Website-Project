import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { firstImage, getMediaArray, resolveMediaSrc } from "../../utils/projects";
import {
  slugify,
  mediaTypeFromSrc,
  youtubeIdFrom,
  mediaThumbUrl,
} from "../../utils/projectsExtras";
import { useProjects } from "../../utils/useProjects";
import "../css/projects.css";

function derivePosterFromVideoSrc(videoSrc) {
  if (!videoSrc) {
    return "";
  }

  const cleaned = videoSrc.split("?")[0].split("#")[0];
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
      return resolveMediaSrc(posterSrc);
    }
    return "";
  }

  return mediaThumbUrl(mediaItem);
}

function resolveRelatedPreview(project) {
  const imageCandidate = firstImage(project);

  if (imageCandidate) {
    return resolveMediaSrc(imageCandidate);
  }

  const mediaArray = getMediaArray(project) || [];

  const firstVideo = mediaArray.find((m) => mediaTypeFromSrc(m?.src || "") === "video");
  if (firstVideo?.src) {
    const posterSrc = derivePosterFromVideoSrc(firstVideo.src);
    if (posterSrc) {
      return resolveMediaSrc(posterSrc);
    }
  }

  const firstYoutube = mediaArray.find((m) => mediaTypeFromSrc(m?.src || "") === "youtube");
  if (firstYoutube?.src) {
    const videoId = youtubeIdFrom(firstYoutube.src);
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  return "";
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { projects, loading, error } = useProjects();
  const [index, setIndex] = useState(0);

  const project = useMemo(() => {
    return projects.find((p) => slugify(p.header) === slug);
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
        resolvedSrc = resolveMediaSrc(resolvedSrc);
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
        <Link to="/projects" className="ghost">
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
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <span aria-current="page">{project.header}</span>
        </nav>

        <header className="detail-header">
          <h1>{project.header}</h1>

          {project.description ? <p className="lead">{project.description}</p> : null}

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
                <img src={media[index]._resolvedSrc} alt={media[index].caption || project.header} />
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
                  style={{ width: "100%", aspectRatio: "16 / 9", border: 0, display: "block" }}
                />
              ) : null}

              {canPrev || canNext ? (
                <div className="viewer-arrows">
                  <button
                    className="circle"
                    onClick={() => { if (canPrev) { setIndex((i) => Math.max(0, i - 1)); } }}
                    disabled={!canPrev}
                    aria-label="Previous media"
                  >
                    ‹
                  </button>
                  <button
                    className="circle"
                    onClick={() => { if (canNext) { setIndex((i) => Math.min(media.length - 1, i + 1)); } }}
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
                    onClick={() => { setIndex(mediaIndex); }}
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
            .filter((p) => p !== project)
            .slice(0, 3)
            .map((p) => (
              <Link
                key={p.header}
                to={`/projects/${slugify(p.header)}`}
                className="related-card"
              >
                <div className="thumb-wrap">
                  <img src={resolveRelatedPreview(p)} alt="" />
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