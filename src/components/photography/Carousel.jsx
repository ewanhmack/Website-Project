import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { IMG_BASE, shuffle } from "../../utils/photos";

function useMatchMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const handler = () => {
      setMatches(mediaQueryList.matches);
    };

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener?.("change", handler);

    return () => {
      mediaQueryList.removeEventListener?.("change", handler);
    };
  }, [query]);

  return matches;
}

export default function Carousel({
  title,
  items,
  perView,
  perViewSm,
  variant,
  onMediaLoad,
  onSelectPhoto,
}) {
  const isSmall = useMatchMedia("(max-width: 700px)");
  const effectivePerView = isSmall && perViewSm ? perViewSm : perView;

  const data = useMemo(() => shuffle(items || []), [items]);

  const slides = useMemo(() => {
    const out = [];

    for (let index = 0; index < data.length; index += effectivePerView) {
      out.push(data.slice(index, index + effectivePerView));
    }

    if (out.length === 0) {
      return [[]];
    }

    return out;
  }, [data, effectivePerView]);

  const [activeIndex, setActiveIndex] = useState(0);
  const total = slides.length;

  const go = (nextIndex) => {
    setActiveIndex((prev) => (nextIndex + total) % total);
  };

  const prev = () => {
    go(activeIndex - 1);
  };

  const next = () => {
    go(activeIndex + 1);
  };

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, total - 1)));
  }, [total]);

  const viewportRef = useRef(null);
  const ratiosRef = useRef({});
  const [viewportHeight, setViewportHeight] = useState(null);

  const updateHeight = useCallback(() => {
    if (variant !== "landscape") {
      return;
    }

    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const current = slides[activeIndex]?.[0];
    const key = current?.image;
    const ratio = key ? ratiosRef.current[key] : undefined;

    if (ratio) {
      const width = viewportElement.clientWidth;
      const newHeight = width / ratio;
      setViewportHeight(newHeight);
      onMediaLoad?.();
    }
  }, [activeIndex, slides, variant, onMediaLoad]);

  useEffect(() => {
    if (variant !== "landscape") {
      return;
    }

    const onResize = () => updateHeight();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [variant, updateHeight]);

  const handleImgLoad = useCallback(
    (event, imageName) => {
      const imageElement = event.currentTarget;

      if (imageElement?.naturalWidth && imageElement?.naturalHeight) {
        ratiosRef.current[imageName] =
          imageElement.naturalWidth / imageElement.naturalHeight;
      }

      if (variant === "landscape") {
        updateHeight();
      }

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
          style={
            variant === "landscape" && viewportHeight
              ? { height: `${viewportHeight}px` }
              : undefined
          }
        >
          <div
            className="track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, slideIndex) => (
              <div className="slide" key={`${title}-slide-${slideIndex}`}>
                <div className={`tiles tiles-${effectivePerView}`}>
                  {slide.map((item, itemIndex) => {
                    const isFirst =
                      activeIndex === 0 && slideIndex === 0 && itemIndex === 0;

                    return (
                      <figure className="tile" key={`${item.image}-${slideIndex}-${itemIndex}`}>
                        <button
                          type="button"
                          className="tile-button"
                          onClick={() => {
                            onSelectPhoto?.(item);
                          }}
                          aria-label={`Open ${item.header || "photo"}`}
                        >
                          <img
                            src={`${IMG_BASE}${item.image}`}
                            alt={item.header || "Photo"}
                            loading={isFirst ? "eager" : "lazy"}
                            fetchPriority={isFirst ? "high" : "low"}
                            decoding="async"
                            onLoad={(event) => handleImgLoad(event, item.image)}
                          />
                        </button>
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
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              role="tab"
              aria-selected={dotIndex === activeIndex}
              className={`dot ${dotIndex === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(dotIndex)}
              aria-label={`${title} page ${dotIndex + 1} of ${total}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
