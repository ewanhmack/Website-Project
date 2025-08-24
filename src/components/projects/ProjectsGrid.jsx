import React from "react";
import ProjectCard from "./ProjectCard";

export default function ProjectsGrid({ projects }) {
  return (
    <ul className="projects-grid" role="list">
      {projects.map(p => (
        <ProjectCard key={p.header} project={p} />
      ))}
    </ul>
  );
}
