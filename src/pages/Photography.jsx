import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import "./photography.css";
import "./PageStyles.css";

const IMG_BASE = "images/photos/";

// Fisher–Yates shuffle
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ================== MAIN ================== */
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

  useLayoutEffect(() => {
    if (loaded && !error) {
      // measure on initial paint & when view changes
      requestAnimationFrame(measureActive);
    }
  }, [view, loaded, error, measureActive]);

  useEffect(() => {
    const onR = () => requestAnimationFrame(measureActive);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [measureActive]);

  // Progressive grid: fade tiles in as they load
  const [loadedMap, setLoadedMap] = useState({});
  const markLoaded = useCallback((id) => {
    setLoadedMap((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    // re-measure after images load to animate container height
    requestAnimationFrame(measureActive);
  }, [measureActive]);

  return (
    <div className="page-container">
      {/* Header */}
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">
              Browse by carousel or view the complete album grid.
            </p>
          </div>

          <div className="view-toggle" role="group" aria-label="Toggle view">
            {/* View toggle switch (Carousel ⇄ Grid) */}
            <button
              type="button"
              className={`view-switch ${view === "grid" ? "is-on" : ""}`}
              role="switch"
              aria-checked={view === "grid"}
              aria-label={view === "grid" ? "Album grid view on" : "Carousel view on"}
              onClick={() => setView((v) => (v === "grid" ? "carousel" : "grid"))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setView((v) => (v === "grid" ? "carousel" : "grid"));
                }
              }}
            >
              <span className="track">
                <span className="thumb" />
                <span className="label off">Carousels</span>
                <span className="label on">Album Grid</span>
              </span>
            </button>

          </div>
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
          Couldn’t load photos ({error}). Check{" "}
          <code>public/data/photography.json</code>.
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
              <Carousel title="Portraits" items={data.Portraits || []} perView={3} />
              <Carousel title="Landscapes" items={data.Landscapes || []} perView={1} />
            </div>
          </div>

          {/* GRID PANEL */}
          <div
            ref={gridRef}
            className={`view-panel ${view === "grid" ? "is-active" : ""}`}
            aria-hidden={view !== "grid"}
          >
            <section
              className="album-grid stylised full-bleed"
              aria-label="Album (all photos)"
            >
              {flat.map((p, i) => {
                const id = `${p.image}-${i}`;
                const isLoaded = !!loadedMap[id];
                const isFirst = i === 0; // boost LCP a bit
                return (
                  <figure
                    className={`album-item ${isLoaded ? "is-loaded" : ""}`}
                    key={id}
                  >
                    <img
                      src={`${IMG_BASE}${p.image}`}
                      alt={p.header || "Photo"}
                      loading={isFirst ? "eager" : "lazy"}
                      fetchPriority={isFirst ? "high" : "auto"}
                      decoding="async"
                      onLoad={() => markLoaded(id)}
                    />
                  </figure>
                );
              })}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============== PURE FLEX-TRACK CAROUSEL =============== */
function Carousel({ title, items, perView }) {
  const shuffled = useMemo(() => shuffle(items || []), [items]);

  const slides = useMemo(() => {
    const out = [];
    for (let i = 0; i < shuffled.length; i += perView) {
      out.push(shuffled.slice(i, i + perView));
    }
    return out.length ? out : [[]];
  }, [shuffled, perView]);

  const [index, setIndex] = useState(0);
  const total = slides.length;

  const go = (n) => setIndex((prev) => (n + total) % total);
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  return (
    <section className="carousel" aria-label={`${title} carousel`}>
      <div className="carousel-shell">
        <button className="arrow left" aria-label={`Previous ${title}`} onClick={prev}>
          ‹
        </button>

        <div className="viewport">
          <div className="track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {slides.map((slide, s) => (
              <div className="slide" key={s}>
                <div className={`tiles tiles-${perView}`}>
                  {slide.map((it, i) => {
                    const isFirst = index === 0 && s === 0 && i === 0;
                    return (
                      <figure className="tile" key={`${it.image}-${i}`}>
                        <img
                          src={`${IMG_BASE}${it.image}`}
                          alt={it.header || "Photo"}
                          loading={isFirst ? "eager" : "lazy"}
                          fetchPriority={isFirst ? "high" : "low"}
                          decoding="async"
                        />
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="arrow right" aria-label={`Next ${title}`} onClick={next}>
          ›
        </button>
      </div>

      <div className="carousel-head-row" style={{ marginLeft: "30px" }}>
        <h3 className="carousel-title" >{title}</h3>
        <div className="dots compact" role="tablist" style={{ marginRight: "50px" }} aria-label={`${title} pages` } >
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`${title} page ${i + 1} of ${total}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
