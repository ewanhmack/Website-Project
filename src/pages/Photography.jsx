import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import ViewToggle from "../components/photography/ViewToggle";
import Carousel from "../components/photography/Carousel";
import AlbumGrid from "../components/photography/AlbumGrid";
import { shuffle, IMG_BASE } from "../utils/photos";
import "./photography.css";
import "./PageStyles.css";

function formatShutterSpeed(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const rawText = String(value).trim();

  if (rawText.length === 0) {
    return "";
  }

  if (rawText.includes("/")) {
    return rawText;
  }

  const seconds = Number(rawText);

  if (Number.isNaN(seconds)) {
    return rawText;
  }

  if (seconds >= 1) {
    return `${seconds}s`;
  }

  if (seconds <= 0) {
    return rawText;
  }

  const denominator = Math.round(1 / seconds);

  if (denominator <= 0) {
    return rawText;
  }

  return `1/${denominator}`;
}

function PhotoModal({ photo, onClose }) {
  useEffect(() => {
    if (!photo) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [photo]);

  useEffect(() => {
    if (!photo) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [photo, onClose]);

  if (!photo) {
    return null;
  }

  const imageSource = `${IMG_BASE}${photo.image}`;
  const title = photo.header || "Photo";
  const category = photo.category || "";

  const metadata = photo.metadata || {};

  const details = [
    ["Shutter Speed", formatShutterSpeed(metadata.shutterSpeed)],
    ["Aperture", metadata.aperture],
    ["ISO", metadata.iso],
    ["Created", metadata.createdDateTime],
    ["Camera Model", metadata.cameraModel],
    ["Lens Model", metadata.lensModel],
  ].filter(([, value]) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      return false;
    }

    return true;
  });

  return createPortal(
    <div
      className="photo-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="photo-modal">
        <button
          type="button"
          className="photo-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="photo-modal-media">
          <img src={imageSource} alt={title} decoding="async" />
        </div>

        <div className="photo-modal-meta">
          <div className="photo-modal-title-row">
            <div className="photo-modal-title">{title}</div>
            {category ? (
              <div className="photo-modal-category">{category}</div>
            ) : null}
          </div>

          {details.length > 0 ? (
            <dl className="photo-modal-details">
              {details.map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{String(value)}</dd>
                </React.Fragment>
              ))}
            </dl>
          ) : (
            <div className="photo-modal-empty muted">
              No metadata available for this photo.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Photography() {
  const [data, setData] = useState({ Portraits: [], Landscapes: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("carousel");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    let alive = true;

    fetch("data/photography.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((json) => {
        if (!alive) {
          return;
        }

        setData(json || { Portraits: [], Landscapes: [] });
      })
      .catch((fetchError) => {
        if (!alive) {
          return;
        }

        setError(fetchError.message || "Failed to load");
      })
      .finally(() => {
        if (!alive) {
          return;
        }

        setLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const flat = useMemo(() => {
    const out = [];

    Object.entries(data || {}).forEach(([category, items]) => {
      (items || []).forEach((item) => out.push({ ...item, category }));
    });

    return shuffle(out);
  }, [data]);

  const openPhoto = useCallback((photo) => {
    setSelectedPhoto(photo);
  }, []);

  const closePhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  // ==== transition stage sizing (limit scroll) ====
  const carouselRef = useRef(null);
  const gridRef = useRef(null);
  const [stageH, setStageH] = useState("auto");

  const measureActive = useCallback(() => {
    const element = view === "carousel" ? carouselRef.current : gridRef.current;

    if (element) {
      setStageH(element.offsetHeight + "px");
    }
  }, [view]);

  useLayoutEffect(() => {
    if (loaded && !error) {
      requestAnimationFrame(() => requestAnimationFrame(measureActive));
    }
  }, [view, loaded, error, measureActive]);

  useEffect(() => {
    const onResize = () => requestAnimationFrame(measureActive);

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [measureActive]);

  // progressive grid load → re-measure
  const [loadedMap, setLoadedMap] = useState({});

  const markLoaded = useCallback(
    (id) => {
      setLoadedMap((prev) => {
        if (prev[id]) {
          return prev;
        }

        return { ...prev, [id]: true };
      });

      requestAnimationFrame(measureActive);
    },
    [measureActive]
  );

  const onCarouselMediaLoad = useCallback(() => {
    requestAnimationFrame(measureActive);
  }, [measureActive]);

  return (
    <div className="page-container photography">
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">
              Browse by carousel or view the complete album grid.
            </p>
          </div>
          <ViewToggle view={view} setView={setView} />
        </div>
      </header>

      {!loaded ? (
        <div className="muted" style={{ marginTop: 24 }} aria-live="polite">
          Loading photos…
        </div>
      ) : null}

      {loaded && error ? (
        <div className="error-banner" role="alert">
          Couldn’t load photos ({error}). Check{" "}
          <code>public/data/photography.json</code>.
        </div>
      ) : null}

      {loaded && !error ? (
        <div className="view-stage" style={{ height: stageH }}>
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
                perViewSm={1}
                variant="portrait"
                onMediaLoad={onCarouselMediaLoad}
                onSelectPhoto={(photo) =>
                  openPhoto({ ...photo, category: "Portraits" })
                }
              />

              <Carousel
                title="Landscapes"
                items={data.Landscapes || []}
                perView={1}
                variant="landscape"
                onMediaLoad={onCarouselMediaLoad}
                onSelectPhoto={(photo) =>
                  openPhoto({ ...photo, category: "Landscapes" })
                }
              />
            </div>
          </div>

          {/* GRID PANEL */}
          <div
            ref={gridRef}
            className={`view-panel ${view === "grid" ? "is-active" : ""}`}
            aria-hidden={view !== "grid"}
          >
            <AlbumGrid
              items={flat}
              loadedMap={loadedMap}
              markLoaded={markLoaded}
              onSelectPhoto={openPhoto}
            />
          </div>
        </div>
      ) : null}

      <PhotoModal photo={selectedPhoto} onClose={closePhoto} />
    </div>
  );
}
