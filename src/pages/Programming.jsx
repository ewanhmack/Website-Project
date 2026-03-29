import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../components/css/projects.css";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import SkeletonGrid from "../components/projects/SkeletonGrid";
import { useProjects } from "../utils/useProjects";

export default function Programming() {
  const { projects, loading, error } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";

  const filtered = useMemo(() => {
    if (!q) {
      return projects;
    }

    const queryLower = q.toLowerCase();

    return projects.filter((p) =>
      [p.header, p.description, p.longDescription]
        .filter(Boolean)
        .some((txt) => String(txt).toLowerCase().includes(queryLower))
    );
  }, [projects, q]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <main className="projects-page">
      <header className="projects-hero container">
        <div className="hero-text">
          <h1>Projects</h1>
          <p>Selected builds, experiments, and coursework. Click any card to view a dedicated project page with full media and write-up.</p>
        </div>
        <div className="hero-actions">
          <div className="input-group">
            <input
              type="search"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
            {q ? (
              <button className="ghost" onClick={() => setParam("q", "")} aria-label="Clear search">×</button>
            ) : null}
          </div>
        </div>
      </header>

      {loading ? <SkeletonGrid count={9} /> : null}

      {error ? (
        <div className="error container" role="alert">
          <strong>Couldn't load projects.</strong>
          <div className="subtle">{error}</div>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No projects match your search.</p>
              <button className="ghost" onClick={() => setSearchParams({}, { replace: true })}>Reset filters</button>
            </div>
          ) : (
            <ProjectsGrid projects={filtered} />
          )}
        </section>
      ) : null}

      <footer className="projects-footer container">
        <Link to="/" className="ghost">← Back home</Link>
      </footer>
    </main>
  );
}