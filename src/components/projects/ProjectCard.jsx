import React from "react";
import { Link } from "react-router-dom";
import { MEDIA_BASE, firstImage, getMediaArray } from "../../utils/projects";
import { slugify, mediaTypeFromSrc, youtubeIdFrom } from "../../utils/projectsExtras";

export default function ProjectCard({ project }) {
  const slug = slugify(project.header);

  // pick a representative image
  let img = firstImage(project);
  if (!img) {
    const m0 = (getMediaArray(project) || [])[0];
    if (m0 && mediaTypeFromSrc(m0.src) === "youtube") {
      const id = youtubeIdFrom(m0.src);
      img = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
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
          {img ? (
            <img
              src={/^https?:\/\//i.test(img) ? img : MEDIA_BASE + img}
              alt={project.header}
            />
          ) : (
            <div className="no-image" aria-hidden>
              No image
            </div>
          )}
        </div>
        <div className="project-body">
          <h3 className="project-title">{project.header}</h3>
          {project.description && (
            <p className="project-desc">{project.description}</p>
          )}
          {project.tech?.length ? (
            <div className="tags-inline">
              {project.tech.slice(0, 4).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              {project.tech.length > 4 && (
                <span className="tag more">
                  +{project.tech.length - 4}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
