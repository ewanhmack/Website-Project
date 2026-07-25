import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import AlbumGrid from "../components/photography/AlbumGrid";
import PhotoEditor from "../components/photography/Editor/PhotoEditor";
import Spinner from "../components/Spinner";
import { shuffle, getPhotoUrl, formatShutterSpeed, focalLengthGroup } from "../utils/photos";
import { PHOTO_TAGS } from "../utils/photoTags";
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

function FilterGroup({ label, options, active, onSelect }) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="pf-group">
      <div className="pf-group-title">{label}</div>
      <div className="pf-group-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`pf-chip ${active === option ? "pf-chip--active" : ""}`}
            onClick={() => onSelect(active === option ? null : option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Photography() {
  const [allPhotos, setAllPhotos] = useState(null);
  const [visiblePages, setVisiblePages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState(null);
  const [activeLens, setActiveLens] = useState(null);

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

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, "photography"));
        const cats = categoriesSnapshot.docs.map((d) => d.id);

        const photosByCategory = await Promise.all(
          cats.map(async (category) => {
            const snap = await getDocs(collection(db, "photography", category, "photos"));
            return snap.docs.map((d) => ({ ...d.data(), id: d.id, category }));
          })
        );

        if (!alive) {
          return;
        }

        setCategories(cats);
        setAllPhotos(shuffle(photosByCategory.flat()));
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

  const gridPages = useMemo(() => {
    if (!allPhotos) {
      return [];
    }
    const pages = [];
    for (let i = 0; i < allPhotos.length; i += GRID_PAGE_SIZE) {
      pages.push(allPhotos.slice(i, i + GRID_PAGE_SIZE));
    }
    return pages.slice(0, visiblePages);
  }, [allPhotos, visiblePages]);

  const gridHasMore = allPhotos ? visiblePages * GRID_PAGE_SIZE < allPhotos.length : false;

  const loadMoreGrid = useCallback(() => {
    setVisiblePages((n) => n + 1);
  }, []);

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

  const availableTags = useMemo(() => {
    if (!allPhotos) {
      return [];
    }
    const present = new Set();
    allPhotos.forEach((photo) => (photo.tags || []).forEach((tag) => present.add(tag)));
    return PHOTO_TAGS.filter((tag) => present.has(tag));
  }, [allPhotos]);

  const availableLenses = useMemo(() => {
    if (!allPhotos) {
      return [];
    }
    const present = new Set();
    allPhotos.forEach((photo) => {
      const group = focalLengthGroup(photo.metadata?.lensModel);
      if (group) {
        present.add(group);
      }
    });
    return Array.from(present).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [allPhotos]);

  const filteredGridPages = useMemo(() => {
    return gridPages.map((page) =>
      page.filter((photo) => {
        if (activeCategory !== "all" && photo.category !== activeCategory) {
          return false;
        }
        if (activeTag && !(photo.tags || []).includes(activeTag)) {
          return false;
        }
        if (activeLens && focalLengthGroup(photo.metadata?.lensModel) !== activeLens) {
          return false;
        }
        return true;
      })
    );
  }, [gridPages, activeCategory, activeTag, activeLens]);

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
        <div style={{ marginTop: 24 }}>
          <Spinner label="Loading photos…" />
        </div>
      ) : null}

      {loaded && error ? (
        <div className="error-banner" role="alert">
          Couldn't load photos ({error}). Check Firestore connection.
        </div>
      ) : null}

      {loaded && !error ? (
        <div className="photography-body">
          <div className="photography-main">
            <AlbumGrid
              pages={filteredGridPages}
              loadedMap={loadedMap}
              markLoaded={markLoaded}
              onSelectPhoto={openPhoto}
            />
            {gridHasMore ? (
              <div ref={gridSentinelRef} style={{ height: 1 }} />
            ) : null}
          </div>

          <aside className="photography-sidebar" aria-label="Filter photos">
            <FilterGroup
              label="Type"
              options={categories}
              active={activeCategory === "all" ? null : activeCategory}
              onSelect={(value) => setActiveCategory(value ?? "all")}
            />
            <FilterGroup label="Tags" options={availableTags} active={activeTag} onSelect={setActiveTag} />
            <FilterGroup label="Lens" options={availableLenses} active={activeLens} onSelect={setActiveLens} />
          </aside>
        </div>
      ) : null}

      <PhotoModal photo={selectedPhoto} onClose={closePhoto} />
    </div>
  );
}
