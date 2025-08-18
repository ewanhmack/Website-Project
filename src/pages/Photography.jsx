import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import ViewToggle from "../components/photography/ViewToggle";
import Carousel from "../components/photography/Carousel";
import AlbumGrid from "../components/photography/AlbumGrid";
import { shuffle } from "../utils/photos";
import "./photography.css";
import "./PageStyles.css";

export default function Photography() {
  const [data, setData] = useState({ Portraits: [], Landscapes: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("carousel"); // "carousel" | "grid"

  // fetch data
  useEffect(() => {
    let alive = true;
    fetch("data/photography.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => alive && setData(j || { Portraits: [], Landscapes: [] }))
      .catch((e) => alive && setError(e.message || "Failed to load"))
      .finally(() => alive && setLoaded(true));
    return () => (alive = false);
  }, []);

  // Flat, shuffled list for album grid
  const flat = useMemo(() => {
    const out = [];
    Object.entries(data || {}).forEach(([category, arr]) =>
      (arr || []).forEach((i) => out.push({ ...i, category }))
    );
    return shuffle(out);
  }, [data]);

  /* ========= Transition stage sizing (so page doesn't jump) ========= */
  const stageRef = useRef(null);
  const carouselRef = useRef(null);
  const gridRef = useRef(null);
  const [stageH, setStageH] = useState("auto");

  const measureActive = useCallback(() => {
    const el = view === "carousel" ? carouselRef.current : gridRef.current;
    if (el) setStageH(el.offsetHeight + "px");
  }, [view]);

  // measure on mount + when view changes (double RAF avoids race with CSS class flip)
  useLayoutEffect(() => {
    if (loaded && !error) {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureActive);
      });
    }
  }, [view, loaded, error, measureActive]);

  // re-measure on resize
  useEffect(() => {
    const onR = () => requestAnimationFrame(measureActive);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [measureActive]);

  // Progressive grid: fade tiles in as they load (then re-measure)
  const [loadedMap, setLoadedMap] = useState({});
  const markLoaded = useCallback(
    (id) => {
      setLoadedMap((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
      requestAnimationFrame(measureActive);
    },
    [measureActive]
  );

  // When carousel images load, also re-measure
  const onCarouselMediaLoad = useCallback(() => {
    requestAnimationFrame(measureActive);
  }, [measureActive]);

  return (
    <div className="page-container photography">
      {/* Header */}
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">Browse by carousel or view the complete album grid.</p>
          </div>

          <ViewToggle view={view} setView={setView} />
        </div>
      </header>

      {/* Status */}
      {!loaded && (
        <div className="muted" style={{ marginTop: 24 }} aria-live="polite">
          Loading photos…
        </div>
      )}
      {loaded && error && (
        <div className="error-banner" role="alert">
          Couldn’t load photos ({error}). Check <code>public/data/photography.json</code>.
        </div>
      )}

      {/* Views with animated transition */}
      {loaded && !error && (
        <div className="view-stage" ref={stageRef} style={{ height: stageH }}>
          {/* CAROUSEL PANEL */}
          <div
            ref={carouselRef}
            className={`view-panel ${view === "carousel" ? "is-active" : ""}`}
            aria-hidden={view !== "carousel"}
          >
            <div className="stack">
              <Carousel
                title="Portraits"
                items={data.Portraits || []}
                perView={3}
                onMediaLoad={onCarouselMediaLoad}
              />
              <Carousel
                title="Landscapes"
                items={data.Landscapes || []}
                perView={1}
                onMediaLoad={onCarouselMediaLoad}
              />
            </div>
          </div>

          {/* GRID PANEL */}
          <div
            ref={gridRef}
            className={`view-panel ${view === "grid" ? "is-active" : ""}`}
            aria-hidden={view !== "grid"}
          >
            <AlbumGrid items={flat} loadedMap={loadedMap} markLoaded={markLoaded} />
          </div>
        </div>
      )}
    </div>
  );
}
