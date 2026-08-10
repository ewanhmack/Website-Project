import React, { useState } from "react";
import { Link } from "react-router-dom";
import { firstImage, getMediaArray, resolveMediaSrc } from "../../utils/projects";
import { slugify, mediaTypeFromSrc, youtubeIdFrom, derivePosterFromVideoSrc } from "../../utils/projectsExtras";

export default function ProjectCard({ project, featured = false }) {
  const slug = slugify(project.header);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  let preview = firstImage(project);

  if (!preview) {
    const mediaArray = getMediaArray(project) || [];
    const firstMedia = mediaArray[0];

    if (firstMedia) {
      const mediaType = mediaTypeFromSrc(firstMedia.src);

      if (mediaType === "youtube") {
        const id = youtubeIdFrom(firstMedia.src);
        preview = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }

      if (!preview && mediaType === "video") {
        preview = firstMedia.poster || firstMedia.thumbnail || derivePosterFromVideoSrc(firstMedia.src);
      }
    }
  }

  return (
    <li className={`project-card ${featured ? "featured" : ""}`} role="listitem">
      <Link
        to={`/projects/${slug}`}
        className="card-link"
        aria-label={`${project.header} – open project page`}
      >
        <div className="project-media">
          {preview ? (
            <>
              {!imgLoaded && !imgError ? (
                <span className="project-media-loading" aria-hidden="true">
                  <span className="spinner" style={{ width: 22, height: 22 }} />
                </span>
              ) : null}
              {imgError ? (
                <div className="no-image" aria-hidden>
                  Couldn't load image
                </div>
              ) : (
                <img
                  key={retryCount}
                  src={resolveMediaSrc(preview)}
                  alt={project.header}
                  loading="lazy"
                  decoding="async"
                  className={imgLoaded ? "is-loaded" : ""}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    if (retryCount < 1) {
                      setRetryCount((n) => n + 1);
                    } else {
                      setImgError(true);
                    }
                  }}
                />
              )}
            </>
          ) : (
            <div className="no-image" aria-hidden>
              No image
            </div>
          )}
        </div>

        <div className="project-body">
          {featured ? <div className="eyebrow">Featured</div> : null}
          <h3 className="project-title">{project.header}</h3>
          {project.description ? (
            <p className="project-desc">{project.description}</p>
          ) : null}

          {project.tech?.length ? (
            <div className="tags-inline">
              {project.tech.slice(0, 4).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {project.tech.length > 4 ? (
                <span className="tag more">+{project.tech.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  );
}