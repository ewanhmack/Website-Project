import React from "react";

export default function SkeletonGrid({ count = 6 }) {
  return (
    <section aria-label="Loading projects" className="projects-grid">
      {Array.from({ length: count }).map((_, i) => (
        <article key={i} className="project-card skeleton-card" aria-hidden="true">
          <figure className="project-media">
            <div className="skeleton skeleton-media" />
          </figure>
          <div className="project-body">
            <div className="skeleton skeleton-line skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </article>
      ))}
    </section>
  );
}
