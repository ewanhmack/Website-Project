import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase";
import AlbumGrid from "../components/photography/AlbumGrid";
import PhotoEditor from "../components/photography/Editor/PhotoEditor";
import { shuffle, getPhotoUrl, formatShutterSpeed } from "../utils/photos";
import "../components/css/photography.css";
import "../components/css/PageStyles.css";

const GRID_PAGE_SIZE = 20;

function PhotoModal({ photo, onClose }) {
  const [mode, setMode] = useState("view");

  useEffect(() => {
    if (!photo) {
      return;
    }
    setMode("view");
  }, [photo]);

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
        if (mode === "edit") {
          setMode("view");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [photo, onClose, mode]);

  if (!photo) {
    return null;
  }

  const imageSource = getPhotoUrl(photo);
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
      <div className={`photo-modal ${mode === "edit" ? "photo-modal--editor" : ""}`}>
        <button
          type="button"
          className="photo-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {mode === "view" ? (
          <>
            <div className="photo-modal-media">
              <img src={imageSource} alt={title} decoding="async" />
            </div>
            <div className="photo-modal-meta">
              <div className="photo-modal-title-row">
                <div className="photo-modal-title">{title}</div>
                {category ? <div className="photo-modal-category">{category}</div> : null}
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
                <div className="photo-modal-empty muted">No metadata available for this photo.</div>
              )}
              <button
                type="button"
                className="photo-modal-edit-btn"
                onClick={() => setMode("edit")}
              >
                Edit photo
              </button>
            </div>
          </>
        ) : (
          <PhotoEditor photo={photo} onBack={() => setMode("view")} />
        )}
      </div>
    </div>,
    document.body
  );
}

function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return ref;
}

export default function Photography() {
  const [gridPages, setGridPages] = useState([]);
  const [gridCursor, setGridCursor] = useState(null);
  const [gridHasMore, setGridHasMore] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const savedScrollY = useRef(null);

  const openPhoto = useCallback((photo) => {
    savedScrollY.current = window.scrollY;
    setSelectedPhoto(photo);
  }, []);

  const closePhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  useEffect(() => {
    if (selectedPhoto !== null) {
      return;
    }

    if (savedScrollY.current === null) {
      return;
    }

    const y = savedScrollY.current;
    savedScrollY.current = null;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "instant" });
    });
  }, [selectedPhoto]);

  const gridFetchInFlightRef = useRef(false);

  const fetchGridPage = useCallback(async (cursor = null) => {
    if (categories.length === 0 || gridFetchInFlightRef.current) {
      return;
    }

    gridFetchInFlightRef.current = true;
    setGridLoading(true);

    try {
      const perCategory = Math.ceil(GRID_PAGE_SIZE / categories.length);
      const newPhotos = [];
      const newCursors = { ...(cursor ?? {}) };

      for (const category of categories) {
        const catCursor = cursor?.[category] ?? null;
        const q = catCursor
          ? query(
              collection(db, "photography", category, "photos"),
              orderBy("order"),
              startAfter(catCursor),
              limit(perCategory)
            )
          : query(
              collection(db, "photography", category, "photos"),
              orderBy("order"),
              limit(perCategory)
            );

        const snap = await getDocs(q);
        const photos = snap.docs.map((d) => ({ ...d.data(), id: d.id, category }));
        newPhotos.push(...photos);

        if (snap.docs.length > 0) {
          newCursors[category] = snap.docs[snap.docs.length - 1];
        }
      }

      const shuffled = shuffle(newPhotos);

      setGridPages((prev) => {
        const seen = new Set(prev.flat().map((photo) => `${photo.category}-${photo.id}`));
        const deduped = shuffled.filter((photo) => !seen.has(`${photo.category}-${photo.id}`));
        if (deduped.length === 0) {
          return prev;
        }
        return [...prev, deduped];
      });
      setGridCursor(newCursors);
      setGridHasMore(newPhotos.length >= GRID_PAGE_SIZE);
    } finally {
      setGridLoading(false);
      gridFetchInFlightRef.current = false;
    }
  }, [categories]);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, "photography"));
        const cats = categoriesSnapshot.docs.map((d) => d.id);

        if (!alive) {
          return;
        }

        setCategories(cats);
        setLoaded(true);
      } catch (err) {
        if (!alive) {
          return;
        }
        setError(err.message || "Failed to load");
        setLoaded(true);
      }
    };

    init();

    return () => {
      alive = false;
    };
  }, []);

  const gridFetchedRef = useRef(false);

  useEffect(() => {
    if (categories.length > 0 && !gridFetchedRef.current) {
      gridFetchedRef.current = true;
      fetchGridPage(null);
    }
  }, [categories, fetchGridPage]);

  const loadMoreGrid = useCallback(() => {
    if (!gridHasMore || gridLoading) {
      return;
    }
    fetchGridPage(gridCursor);
  }, [gridHasMore, gridLoading, gridCursor, fetchGridPage]);

  const gridSentinelRef = useIntersectionObserver(loadMoreGrid, { rootMargin: "200px" });

  const [loadedMap, setLoadedMap] = useState({});

  const markLoaded = useCallback((id) => {
    setLoadedMap((prev) => {
      if (prev[id]) {
        return prev;
      }
      return { ...prev, [id]: true };
    });
  }, []);

  const filteredGridPages = useMemo(() => {
    if (activeCategory === "all") {
      return gridPages;
    }
    return gridPages.map((page) => page.filter((photo) => photo.category === activeCategory));
  }, [gridPages, activeCategory]);

  return (
    <div className="page-container photography">
      <header className="photos-header">
        <div className="photos-header-row">
          <div>
            <h2>Photography</h2>
            <p className="muted">The complete album, browsable by category.</p>
          </div>
        </div>
      </header>

      {!loaded ? (
        <div className="muted" style={{ marginTop: 24 }} aria-live="polite">
          Loading photos…
        </div>
      ) : null}

      {loaded && error ? (
        <div className="error-banner" role="alert">
          Couldn't load photos ({error}). Check Firestore connection.
        </div>
      ) : null}

      {loaded && !error ? (
        <div>
          {categories.length > 0 ? (
            <div className="category-filters" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`period-btn ${activeCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`period-btn ${activeCategory === category ? "active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          <AlbumGrid
            pages={filteredGridPages}
            loadedMap={loadedMap}
            markLoaded={markLoaded}
            onSelectPhoto={openPhoto}
          />
          {gridLoading ? (
            <div className="muted" style={{ textAlign: "center", padding: 16 }}>
              Loading more…
            </div>
          ) : null}
          {gridHasMore ? (
            <div ref={gridSentinelRef} style={{ height: 1 }} />
          ) : null}
        </div>
      ) : null}

      <PhotoModal photo={selectedPhoto} onClose={closePhoto} />
    </div>
  );
}
