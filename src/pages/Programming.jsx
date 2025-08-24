import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../pages/projects.css";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import SkeletonGrid from "../components/projects/SkeletonGrid";

const DATA_URL = `${import.meta.env.BASE_URL}data/projects.json`;

export default function Programming() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || "Failed to load projects.");
          setLoading(false);
        }
      });
    return () => (cancelled = true);
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (q) {
      const query = q.toLowerCase();
      list = list.filter(p =>
        [p.header, p.description, p.longDescription]
          .filter(Boolean)
          .some(txt => String(txt).toLowerCase().includes(query))
      );
    }
    return list;
  }, [projects, q]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
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
              onChange={e => setParam("q", e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
            {q && (
              <button className="ghost" onClick={() => setParam("q", "")} aria-label="Clear search">×</button>
            )}
          </div>
        </div>
      </header>

      {loading && <SkeletonGrid count={9} />}
      {error && (
        <div className="error container" role="alert">
          <strong>Couldn’t load projects.</strong>
          <div className="subtle">{error}</div>
        </div>
      )}
      {!loading && !error && (
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
      )}

      <footer className="projects-footer container">
        <Link to="/" className="ghost">← Back home</Link>
      </footer>
    </main>
  );
}
