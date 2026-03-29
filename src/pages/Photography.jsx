import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
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
import ViewToggle from "../components/photography/ViewToggle";
import Carousel from "../components/photography/Carousel";
import AlbumGrid from "../components/photography/AlbumGrid";
import { shuffle, getPhotoUrl } from "../utils/photos";
import "../components/css/photography.css";
import "../components/css/PageStyles.css";

const CAROUSEL_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 20;

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
  const [carouselData, setCarouselData] = useState({});
  const [carouselCursors, setCarouselCursors] = useState({});
  const [carouselHasMore, setCarouselHasMore] = useState({});

  const [gridPhotos, setGridPhotos] = useState([]);
  const [gridCursor, setGridCursor] = useState(null);
  const [gridHasMore, setGridHasMore] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("carousel");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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

  const fetchCarouselPage = useCallback(async (category, cursor = null) => {
    const q = cursor
      ? query(
          collection(db, "photography", category, "photos"),
          orderBy("order"),
          startAfter(cursor),
          limit(CAROUSEL_PAGE_SIZE)
        )
      : query(
          collection(db, "photography", category, "photos"),
          orderBy("order"),
          limit(CAROUSEL_PAGE_SIZE)
        );

    const snap = await getDocs(q);
    const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    const hasMore = snap.docs.length === CAROUSEL_PAGE_SIZE;

    return { photos, lastDoc, hasMore };
  }, []);

  const fetchGridPage = useCallback(async (cursor = null) => {
    if (categories.length === 0) {
      return;
    }

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
        const photos = snap.docs.map((d) => ({ id: d.id, category, ...d.data() }));
        newPhotos.push(...photos);

        if (snap.docs.length > 0) {
          newCursors[category] = snap.docs[snap.docs.length - 1];
        }
      }

      const shuffled = shuffle(newPhotos);
      setGridPhotos((prev) => [...prev, ...shuffled]);
      setGridCursor(newCursors);
      setGridHasMore(newPhotos.length >= GRID_PAGE_SIZE);
    } finally {
      setGridLoading(false);
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

        const initialCarousel = {};
        const initialCursors = {};
        const initialHasMore = {};

        for (const category of cats) {
          const { photos, lastDoc, hasMore } = await fetchCarouselPage(category);
          initialCarousel[category] = photos;
          initialCursors[category] = lastDoc;
          initialHasMore[category] = hasMore;
        }

        if (!alive) {
          return;
        }

        setCarouselData(initialCarousel);
        setCarouselCursors(initialCursors);
        setCarouselHasMore(initialHasMore);
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
    if (categories.length > 0 && view === "grid" && !gridFetchedRef.current) {
      gridFetchedRef.current = true;
      fetchGridPage(null);
    }
  }, [view, categories, fetchGridPage]);

  const loadMoreCarousel = useCallback(async (category) => {
    if (!carouselHasMore[category]) {
      return;
    }

    const cursor = carouselCursors[category];
    const { photos, lastDoc, hasMore } = await fetchCarouselPage(category, cursor);

    setCarouselData((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ...photos],
    }));
    setCarouselCursors((prev) => ({ ...prev, [category]: lastDoc }));
    setCarouselHasMore((prev) => ({ ...prev, [category]: hasMore }));
  }, [carouselCursors, carouselHasMore, fetchCarouselPage]);

  const loadMoreGrid = useCallback(() => {
    if (!gridHasMore || gridLoading) {
      return;
    }
    fetchGridPage(gridCursor);
  }, [gridHasMore, gridLoading, gridCursor, fetchGridPage]);

  const gridSentinelRef = useIntersectionObserver(loadMoreGrid, { rootMargin: "200px" });

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
    return () => window.removeEventListener("resize", onResize);
  }, [measureActive]);

  const [loadedMap, setLoadedMap] = useState({});

  const markLoaded = useCallback((id) => {
    setLoadedMap((prev) => {
      if (prev[id]) {
        return prev;
      }
      return { ...prev, [id]: true };
    });
    requestAnimationFrame(measureActive);
  }, [measureActive]);

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
          Couldn't load photos ({error}). Check Firestore connection.
        </div>
      ) : null}

      {loaded && !error ? (
        <div className="view-stage" style={{ height: stageH }}>
          <div
            ref={carouselRef}
            className={`view-panel ${view === "carousel" ? "is-active" : ""}`}
            aria-hidden={view !== "carousel"}
          >
            <div className="stack">
              {Object.entries(carouselData).map(([category, items]) => (
                <Carousel
                  key={category}
                  title={category}
                  items={items}
                  perView={category === "Portraits" ? 3 : 1}
                  perViewSm={1}
                  variant={category === "Portraits" ? "portrait" : "landscape"}
                  onMediaLoad={onCarouselMediaLoad}
                  onSelectPhoto={(photo) => openPhoto({ ...photo, category })}
                  onLoadMore={carouselHasMore[category] ? () => loadMoreCarousel(category) : null}
                />
              ))}
            </div>
          </div>

          <div
            ref={gridRef}
            className={`view-panel ${view === "grid" ? "is-active" : ""}`}
            aria-hidden={view !== "grid"}
          >
            <AlbumGrid
              items={gridPhotos}
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
        </div>
      ) : null}

      <PhotoModal photo={selectedPhoto} onClose={closePhoto} />
    </div>
  );
}