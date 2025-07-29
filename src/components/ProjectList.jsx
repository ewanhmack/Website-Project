import React, { useEffect, useState } from "react";
import './ComponentStyles.css';

function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("data/projects.json")
      .then((res) => res.json())
      .then((data) => setProjects(data));
  }, []);

  return (
    <div className="project-list">
      {projects.map((project, idx) => (
        <div key={idx} className="project-card">
          {project.image && (
            <img
              src={`images/${project.image}`}
              alt={project.header}
            />
          )}
          <h3>{project.header}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}

export default ProjectList;