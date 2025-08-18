import React, { useEffect, useState, useCallback } from "react";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import SkeletonGrid from "../components/projects/SkeletonGrid";
import ProjectModal from "../components/projects/ProjectModal";
import { getMediaArray } from "../utils/projects";
import "../pages/projects.css";      // keep your existing CSS paths
import "../pages/PageStyles.css";    // adjust path if needed

export default function Programming() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [openProject, setOpenProject] = useState(null);
  const [slide, setSlide] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // fetch projects
  useEffect(() => {
    fetch("data/projects.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoaded(true));
  }, []);

  // open/close
  const open = useCallback((project) => {
    setOpenProject(project);
    setSlide(0);
  }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    const EXIT_MS = 220;
    setTimeout(() => {
      setOpenProject(null);
      setSlide(0);
      setIsClosing(false);
    }, EXIT_MS);
  }, []);

  // slide nav
  const next = useCallback(() => {
    if (!openProject) return;
    const m = getMediaArray(openProject);
    setSlide((s) => (s + 1) % Math.max(1, m.length));
  }, [openProject]);

  const prev = useCallback(() => {
    if (!openProject) return;
    const m = getMediaArray(openProject);
    const len = Math.max(1, m.length);
    setSlide((s) => (s - 1 + len) % len);
  }, [openProject]);

  // keyboard + scroll lock while modal open
  useEffect(() => {
    if (!openProject) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openProject, close, next, prev]);

  return (
    <div className="page-container">
      <header className="projects-header">
        <h2>Programming Projects</h2>
        <p className="muted">
          Selected work across Unreal Engine, graphics (SFML/SEG), and web.
        </p>
      </header>

      {!loaded && <SkeletonGrid count={6} />}

      {loaded && error && (
        <div className="error-banner" role="alert">
          Couldn’t load projects ({error}). Check <code>public/data/projects.json</code>.
        </div>
      )}

      {loaded && !error && <ProjectsGrid projects={projects} onOpen={open} />}

      {openProject && (
        <ProjectModal
          project={openProject}
          slide={slide}
          setSlide={setSlide}
          onPrev={prev}
          onNext={next}
          onClose={close}
          isClosing={isClosing}
        />
      )}
    </div>
  );
}
