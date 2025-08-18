import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { IMG_BASE, shuffle } from "../../utils/photos";

/** Match a CSS media query in React */
function useMatchMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    setMatches(m.matches);
    m.addEventListener?.("change", handler);
    return () => m.removeEventListener?.("change", handler);
  }, [query]);
  return matches;
}

/**
 * Props:
 * - title: string
 * - items: array of { image, header? }
 * - perView: number (desktop)
 * - perViewSm?: number (<=700px)
 * - variant?: "portrait" | "landscape"
 * - onMediaLoad?: fn() -> notify parent to re-measure
 */
export default function Carousel({
  title,
  items,
  perView,
  perViewSm,
  variant,
  onMediaLoad,
}) {
  const isSmall = useMatchMedia("(max-width: 700px)");
  const pv = isSmall && perViewSm ? perViewSm : perView;

  const data = useMemo(() => shuffle(items || []), [items]);

  // Build slides using effective perView (so Portraits becomes 1-up on small)
  const slides = useMemo(() => {
    const out = [];
    for (let i = 0; i < data.length; i += pv) out.push(data.slice(i, i + pv));
    return out.length ? out : [[]];
  }, [data, pv]);

  const [index, setIndex] = useState(0);
  const total = slides.length;
  const go = (n) => setIndex((prev) => (n + total) % total);
  const prev = () => go(index - 1);
  const next = () => go(index + 1);
  useEffect(() => { setIndex((i) => Math.min(i, Math.max(0, total - 1))); }, [total]);

  /* ====== LANDSCAPE: dynamic viewport height from image AR ====== */
  const viewportRef = useRef(null);
  const ratiosRef = useRef({}); // imageName -> aspect ratio (w/h)
  const [vh, setVh] = useState(null);

  const updateHeight = useCallback(() => {
    if (variant !== "landscape") return;
    const el = viewportRef.current;
    if (!el) return;

    // For perView=1, slide has exactly one image
    const current = slides[index]?.[0];
    const key = current?.image;
    const ratio = key ? ratiosRef.current[key] : undefined;

    if (ratio) {
      const w = el.clientWidth;
      const newH = w / ratio; // height = width / (w/h)
      setVh(newH);
      onMediaLoad?.(); // notify parent to re-measure stage height
    }
  }, [index, slides, variant, onMediaLoad]);

  useEffect(() => {
    if (variant !== "landscape") return;
    const onR = () => updateHeight();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [variant, updateHeight]);

  const handleImgLoad = useCallback(
    (e, imageName, isFirst) => {
      const img = e.currentTarget;
      if (img?.naturalWidth && img?.naturalHeight) {
        ratiosRef.current[imageName] = img.naturalWidth / img.naturalHeight;
      }
      // First paints + any landscape resize should prompt measuring
      if (variant === "landscape") updateHeight();
      onMediaLoad?.();
    },
    [variant, updateHeight, onMediaLoad]
  );

  return (
    <section
      className={`carousel ${variant ? `carousel--${variant}` : ""}`}
      aria-label={`${title} carousel`}
    >
      <div className="carousel-shell">
        <button className="arrow left" aria-label={`Previous ${title}`} onClick={prev}>
          ‹
        </button>

        <div
          className="viewport"
          ref={viewportRef}
          /* For landscape, override CSS height with computed height */
          style={variant === "landscape" && vh ? { height: `${vh}px` } : undefined}
        >
          <div className="track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {slides.map((slide, s) => (
              <div className="slide" key={`${title}-slide-${s}`}>
                <div className={`tiles tiles-${pv}`}>
                  {slide.map((it, i) => {
                    const isFirst = index === 0 && s === 0 && i === 0;
                    return (
                      <figure className="tile" key={`${it.image}-${s}-${i}`}>
                        <img
                          src={`${IMG_BASE}${it.image}`}
                          alt={it.header || "Photo"}
                          loading={isFirst ? "eager" : "lazy"}
                          fetchPriority={isFirst ? "high" : "low"}
                          decoding="async"
                          onLoad={(e) => handleImgLoad(e, it.image, isFirst)}
                          style={{ cursor: "default" }}
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
        <h3 className="carousel-title">{title}</h3>
        <div
          className="dots compact"
          role="tablist"
          style={{ marginRight: "50px" }}
          aria-label={`${title} pages`}
        >
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
