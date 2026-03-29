import React from "react";
import { Link } from "react-router-dom";
import { firstImage, getMediaArray, resolveMediaSrc } from "../../utils/projects";
import { slugify, mediaTypeFromSrc, youtubeIdFrom, derivePosterFromVideoSrc } from "../../utils/projectsExtras";

export default function ProjectCard({ project }) {
  const slug = slugify(project.header);

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
    <li className="project-card" role="listitem">
      <Link
        to={`/projects/${slug}`}
        className="card-link"
        aria-label={`${project.header} – open project page`}
      >
        <div className="project-media">
          {preview ? (
            <img
              src={resolveMediaSrc(preview)}
              alt={project.header}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="no-image" aria-hidden>
              No image
            </div>
          )}
        </div>

        <div className="project-body">
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