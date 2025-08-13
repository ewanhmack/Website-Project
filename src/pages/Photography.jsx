import React, { useEffect, useMemo, useState } from "react";
import "./photography.css";
import "./PageStyles.css";

const IMG_BASE = "images/photos/"; // change if needed

// Fisher–Yates shuffle
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Preload a list of URLs; resolve when all attempt to load
function preload(urls) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const img = new Image();
          img.onload = img.onerror = () => res(true);
          img.src = u;
        })
    )
  );
}

export default function Photography() {
  const [data, setData] = useState({ Portraits: [], Landscapes: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("carousel"); // "carousel" | "grid"
  const [gridReady, setGridReady] = useState(false);

  useEffect(() => {
    fetch("data/photography.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setData(j || { Portraits: [], Landscapes: [] }))
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoaded(true));
  }, []);

  // Flat, shuffled list for album grid
  const flat = useMemo(() => {
    const out = [];
    Object.entries(data || {}).forEach(([category, arr]) =>
      (arr || []).forEach((i) => out.push({ ...i, category }))
    );
    return shuffle(out);
  }, [data]);

  // Preload all album images so the grid appears at once
  useEffect(() => {
    if (!loaded || error) return;
    preload(flat.map((p) => `${IMG_BASE}${p.image}`)).then(() => setGridReady(true));
  }, [loaded, error, flat]);

  return (
    <div className="page-container">
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">Browse by carousel or view the complete album grid.</p>
          </div>
          <div className="view-toggle" role="group" aria-label="Toggle view">
            <button
              type="button"
              className={`toggle-btn ${view === "carousel" ? "is-active" : ""}`}
              onClick={() => setView("carousel")}
            >
              Carousels
            </button>
            <button
              type="button"
              className={`toggle-btn ${view === "grid" ? "is-active" : ""}`}
              onClick={() => setView("grid")}
            >
              Album Grid
            </button>
          </div>
        </div>
      </header>

      {!loaded && <div className="muted" style={{ marginTop: 24 }}>Loading photos…</div>}
      {loaded && error && (
        <div className="error-banner" role="alert">
          Couldn’t load photos ({error}). Check <code>public/data/photography.json</code>.
        </div>
      )}

      {loaded && !error && view === "carousel" && (
        <div className="stack">
          <Carousel
            title="Portraits"
            items={data.Portraits || []}
            perView={3}
          />
          <Carousel
            title="Landscapes"
            items={data.Landscapes || []}
            perView={1}
          />
        </div>
      )}

      {loaded && !error && view === "grid" && (
        <>
          {!gridReady && <div className="muted" style={{ marginTop: 24 }}>Preloading album…</div>}
          {gridReady && (
            <section className="album-grid stylised" aria-label="Album (all photos)">
              {flat.map((p, i) => (
                <figure className="album-item" key={`${p.image}-${i}`}>
                  <img src={`${IMG_BASE}${p.image}`} alt={p.header || "Photo"} />
                </figure>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* =============== PURE FLEX-TRACK CAROUSEL =============== */
function Carousel({ title, items, perView, tileHeight }) {
  // NEW: shuffle items once per items-change
  const shuffled = useMemo(() => shuffle(items || []), [items]);

  // chunk shuffled items into equally sized slides
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
        <button className="arrow left" aria-label={`Previous ${title}`} onClick={prev}>‹</button>

        <div className="viewport">
          <div
            className="track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide, s) => (
              <div className="slide" key={s}>
                <div className={`tiles tiles-${perView}`}>
                  {slide.map((it, i) => (
                    <figure className="tile" key={`${it.image}-${i}`} style={{ height: tileHeight }}>
                      <img src={`${IMG_BASE}${it.image}`} alt={it.header || "Photo"} />
                      {it.header && <figcaption className="tile-cap">{it.header}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="arrow right" aria-label={`Next ${title}`} onClick={next}>›</button>
      </div>

      <div className="carousel-head-row">
        <h3 className="carousel-title">{title}</h3>
        <div className="dots compact" role="tablist" aria-label={`${title} pages`}>
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
