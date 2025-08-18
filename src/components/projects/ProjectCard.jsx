import React from "react";
import { MEDIA_BASE, firstImage } from "../../utils/projects";

export default function ProjectCard({ project, onOpen }) {
  const title = project.header || "Untitled project";
  const desc = project.description || "";
  const hasImg = !!firstImage(project);
  const imgSrc = hasImg ? MEDIA_BASE + firstImage(project) : null;

  return (
    <article
      className="project-card"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project);
        }
      }}
      aria-label={`Open ${title}`}
    >
      <figure className="project-media">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={project.header ? `Preview of ${project.header}` : "Project preview"}
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
}
