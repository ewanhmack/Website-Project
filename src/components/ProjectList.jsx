import React, { useEffect, useState } from "react";
import "./ComponentStyles.css";

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("data/projects.json")
      .then((res) => res.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <div className="muted" style={{ marginTop: 24 }}>Loading projects…</div>;
  }
  if (projects.length === 0) {
    return <div className="muted" style={{ marginTop: 24 }}>No projects yet. Check back soon!</div>;
  }

  return (
    <div className="project-list">
      {projects.map((project, idx) => (
        <div key={idx} className="project-card">
          {project.image && (
            <img
              src={`images/projects/${project.image}`}
              alt={project.header ? `Preview of ${project.header}` : "Project preview"}
              loading="lazy"
            />
          )}
          <h3>{project.header || "Untitled project"}</h3>
          <p>{project.description || ""}</p>
        </div>
      ))}
    </div>
  );
}
export default ProjectList;
