import React, { useEffect, useMemo, useState } from "react";
import "./photography.css";
import "./PageStyles.css";

const IMG_BASE = "images/photos/"; // adjust if needed

// Fisher–Yates
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Preload a list of image URLs, resolve when all have loaded (or errored)
function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const img = new Image();
          img.onload = () => res(true);
          img.onerror = () => res(false);
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

  // For grid: ensure ALL images are loaded before showing
  const [gridReady, setGridReady] = useState(false);

  useEffect(() => {
    fetch("data/photography.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json || { Portraits: [], Landscapes: [] }))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoaded(true));
  }, []);

  // Build a flat list and preload for grid view
  const flatShuffled = useMemo(() => {
    const list = [];
    Object.entries(data || {}).forEach(([category, arr]) => {
      (arr || []).forEach((item) => list.push({ ...item, category }));
    });
    return shuffle(list);
  }, [data]);

  useEffect(() => {
    if (!loaded || error) return;
    const urls = flatShuffled.map((x) => `${IMG_BASE}${x.image}`);
    preloadImages(urls).then(() => setGridReady(true));
  }, [loaded, error, flatShuffled]);

  return (
    <div className="page-container">
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">
              Browse by carousel or view the complete album grid.
            </p>
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
          {/* Portraits: 3-up, slim tiles */}
          <Carousel
            title="Portraits"
            items={data.Portraits || []}
            perView={3}
            variant="portraits"
          />
          {/* Landscapes: 1-up, compact wide */}
          <Carousel
            title="Landscapes"
            items={data.Landscapes || []}
            perView={1}
            variant="landscapes"
          />
        </div>
      )}

      {loaded && !error && view === "grid" && (
        <>
          {!gridReady && (
            <div className="muted" style={{ marginTop: 24 }}>
              Preloading album…
            </div>
          )}
          {gridReady && (
            <section aria-label="Album (all photos at once)" className="album-grid stylised">
              {flatShuffled.map((item, i) => (
                <figure className="album-item" key={`${item.image}-${i}`}>
                  <img src={`${IMG_BASE}${item.image}`} alt={item.header || "Photo"} />
                  <figcaption className="album-cap">
                    <span className="album-title">{item.header}</span>
                    <span className="album-chip">{item.category}</span>
                  </figcaption>
                </figure>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Carousel({ title, items, perView, variant }) {
  // Build slides
  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += perView) out.push(items.slice(i, i + perView));
    return out.length ? out : [[]];
  }, [items, perView]);

  const [idx, setIdx] = useState(0);
  const total = pages.length;

  const go = (n) => setIdx((prev) => (n + total) % total);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  return (
    <section className={`carousel-block ${variant}`} aria-label={`${title} carousel`}>
      <div className="carousel-head-row">
        <h3 className="carousel-title">{title}</h3>
        <div className="dots compact" role="tablist" aria-label={`${title} pages`}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === idx}
              className={`dot ${i === idx ? "active" : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`${title} page ${i + 1} of ${total}`}
            />
          ))}
        </div>
      </div>

      <div className="carousel-shell">
        <button className="arrow left" aria-label={`Previous ${title}`} onClick={prev}>‹</button>

        <div className="viewport">
          <div
            className="track"
            style={{ width: `${total * 100}%`, transform: `translateX(-${idx * (100 / total)}%)` }}
          >
            {pages.map((page, pIndex) => (
              <div className="slide" key={`page-${pIndex}`} style={{ width: `${100 / total}%` }}>
                <div className={`tiles ${variant === "portraits" ? "tiles-3" : "tiles-1"}`}>
                  {page.map((it, i) => (
                    <figure className="tile" key={`${it.image}-${i}`}>
                      <img
                        src={`${IMG_BASE}${it.image}`}
                        alt={it.header || "Photo"}
                      />
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
    </section>
  );
}
