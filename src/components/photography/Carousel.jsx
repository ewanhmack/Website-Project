import React, { useMemo, useState } from "react";
import { IMG_BASE, shuffle } from "../../utils/photos";

export default function Carousel({ title, items, perView, onMediaLoad }) {
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
                          onLoad={onMediaLoad}  /* notify parent to re-measure */
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
