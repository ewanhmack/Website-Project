import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../components/css/projects.css";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import ProjectCard from "../components/projects/ProjectCard";
import SkeletonGrid from "../components/projects/SkeletonGrid";
import { useProjects } from "../utils/useProjects";
import { deriveProjectDomain, PROJECT_DOMAINS } from "../utils/projectsExtras";

export default function Programming() {
  const { projects, loading, error } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const activeDomain = searchParams.get("domain") ?? "all";

  const searched = useMemo(() => {
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

  const filtered = useMemo(() => {
    const base =
      activeDomain === "all"
        ? searched
        : searched.filter((p) => deriveProjectDomain(p) === activeDomain);

    if (activeDomain !== "all") {
      return base;
    }

    // Group by domain (Web, then Game Dev, then Hardware & CV) while
    // preserving each project's relative order within its own domain.
    return [...base].sort(
      (a, b) =>
        PROJECT_DOMAINS.indexOf(deriveProjectDomain(a)) -
        PROJECT_DOMAINS.indexOf(deriveProjectDomain(b))
    );
  }, [searched, activeDomain]);

  const featuredProjects = useMemo(
    () => filtered.filter((p) => p.featured),
    [filtered]
  );
  const restProjects = useMemo(
    () => filtered.filter((p) => !p.featured),
    [filtered]
  );

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

      {!loading && !error ? (
        <div className="container domain-filters" role="group" aria-label="Filter by domain">
          <button
            type="button"
            className={`period-btn ${activeDomain === "all" ? "active" : ""}`}
            onClick={() => setParam("domain", "")}
          >
            All
          </button>
          {PROJECT_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              className={`period-btn ${activeDomain === domain ? "active" : ""}`}
              onClick={() => setParam("domain", domain)}
            >
              {domain}
            </button>
          ))}
        </div>
      ) : null}

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
            <>
              {featuredProjects.length > 0 ? (
                <ul className="featured-projects-grid" role="list">
                  {featuredProjects.map((p) => (
                    <ProjectCard key={p.header} project={p} featured />
                  ))}
                </ul>
              ) : null}

              {restProjects.length > 0 ? (
                <>
                  {featuredProjects.length > 0 ? (
                    <h2 className="projects-subheading">All projects</h2>
                  ) : null}
                  <ProjectsGrid projects={restProjects} />
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <footer className="projects-footer container">
        <Link to="/" className="ghost">← Back home</Link>
      </footer>
    </main>
  );
}