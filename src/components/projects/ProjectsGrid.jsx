import React from "react";
import ProjectCard from "./ProjectCard";

export default function ProjectsGrid({ projects, onOpen }) {
  return (
    <section aria-label="Projects Grid" className="projects-grid">
      {projects.map((p, i) => (
        <ProjectCard key={(p.header || "project") + "-" + i} project={p} onOpen={onOpen} />
      ))}
    </section>
  );
}
