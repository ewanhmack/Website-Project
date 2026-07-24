import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPhotoUrl, formatShutterSpeed } from "../../utils/photos";
import Spinner from "../Spinner";

const BREAKPOINTS = [
  { minWidth: 1800, columns: 5 },
  { minWidth: 1400, columns: 4 },
  { minWidth: 1000, columns: 3 },
  { minWidth: 700, columns: 2 },
  { minWidth: 0, columns: 1 },
];

function columnsForWidth(width) {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth).columns;
}

function useColumnCount() {
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 3 : columnsForWidth(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setColumns((prev) => {
        const next = columnsForWidth(window.innerWidth);
        return prev === next ? prev : next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return columns;
}

function stablePhotoId(photo, index) {
  return photo.id ? `${photo.category || ""}-${photo.id}` : `${photo.image}-${index}`;
}

// Aspect ratios are learned once per photo URL and reused forever (across
// pages, re-filters, and re-renders) instead of being re-probed every time.
// A cached value of `null` means "probe in flight, not resolved yet" so we
// never kick off the same photo twice.
const aspectRatioCache = new Map();
const FALLBACK_RATIO = 0.75;
const PROBE_TIMEOUT_MS = 4000;

function probeAspectRatio(url, onSettled) {
  if (aspectRatioCache.has(url)) {
    return;
  }

  aspectRatioCache.set(url, null);

  const finish = (value) => {
    if (aspectRatioCache.get(url) === null) {
      aspectRatioCache.set(url, value);
      onSettled();
    }
  };

  const img = new Image();
  img.onload = () => {
    finish(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : FALLBACK_RATIO);
  };
  img.onerror = () => {
    finish(FALLBACK_RATIO);
  };
  img.src = url;

  setTimeout(() => finish(FALLBACK_RATIO), PROBE_TIMEOUT_MS);
}

function isRatioKnown(url) {
  return aspectRatioCache.has(url) && aspectRatioCache.get(url) !== null;
}

function formatExposureLine(metadata) {
  if (!metadata) {
    return "";
  }

  const parts = [
    formatShutterSpeed(metadata.shutterSpeed),
    metadata.aperture,
    metadata.iso ? `ISO ${metadata.iso}` : "",
  ].filter((part) => part && String(part).trim().length > 0);

  return parts.join(" · ");
}

function AlbumTile({ photo, id, isLoaded, isFirst, markLoaded, onSelectPhoto }) {
  const exposureLine = formatExposureLine(photo.metadata);

  return (
    <figure className={`album-item ${isLoaded ? "is-loaded" : ""}`}>
      <button
        type="button"
        className="album-item-button"
        onClick={() => {
          onSelectPhoto(photo);
        }}
        aria-label={`Open ${photo.header || "photo"}`}
      >
        <img
          src={getPhotoUrl(photo)}
          alt={photo.header || "Photo"}
          loading={isFirst ? "eager" : "lazy"}
          fetchPriority={isFirst ? "high" : "auto"}
          decoding="async"
          onLoad={() => {
            markLoaded(id);
          }}
        />
        <span className="album-item-overlay" aria-hidden="true">
          {photo.category ? (
            <span className="album-item-badge">{photo.category}</span>
          ) : null}
          {photo.header ? (
            <span className="album-item-title">{photo.header}</span>
          ) : null}
          {exposureLine ? (
            <span className="album-item-exposure">{exposureLine}</span>
          ) : null}
        </span>
      </button>
    </figure>
  );
}

// Columns are packed once, continuously, across every page: each page is
// only appended to the running shortest-column state, never repacked as a
// standalone block. That's what keeps a column flowing directly beneath its
// own last photo (no gap) while guaranteeing a photo already on screen never
// moves once placed (no jump when a new page of results arrives).
export default function AlbumGrid({ pages, loadedMap, markLoaded, onSelectPhoto }) {
  const columnCount = useColumnCount();
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    pages.flat().forEach((photo) => {
      probeAspectRatio(getPhotoUrl(photo), bump);
    });
  }, [pages, bump]);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    const heights = Array(columnCount).fill(0);

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const pageItems = pages[pageIndex];
      const pageReady = pageItems.every((photo) => isRatioKnown(getPhotoUrl(photo)));

      if (!pageReady) {
        break;
      }

      pageItems.forEach((photo, index) => {
        const ratio = aspectRatioCache.get(getPhotoUrl(photo)) || FALLBACK_RATIO;
        const height = 1 / ratio;

        let shortest = 0;
        for (let i = 1; i < heights.length; i += 1) {
          if (heights[i] < heights[shortest]) {
            shortest = i;
          }
        }

        cols[shortest].push({ photo, pageIndex, index });
        heights[shortest] += height;
      });
    }

    return cols;
    // `tick` is intentionally unused in the body — it exists purely to
    // invalidate this memo once more photos finish probing their dimensions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, columnCount, tick]);

  const hasAnyTiles = columns.some((col) => col.length > 0);

  if (pages.length > 0 && !hasAnyTiles) {
    return (
      <div className="album-grid stylised full-bleed" aria-label="Album (all photos)">
        <div className="album-grid-loading">
          <Spinner label="Loading photos…" />
        </div>
      </div>
    );
  }

  return (
    <div className="album-grid stylised full-bleed" aria-label="Album (all photos)">
      <div className="album-columns-row">
        {columns.map((entries, columnIndex) => (
          <div className="album-column" key={columnIndex}>
            {entries.map(({ photo, pageIndex, index }) => {
              const id = stablePhotoId(photo, index);
              return (
                <AlbumTile
                  key={id}
                  photo={photo}
                  id={id}
                  isLoaded={!!loadedMap[id]}
                  isFirst={pageIndex === 0 && index === 0}
                  markLoaded={markLoaded}
                  onSelectPhoto={onSelectPhoto}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
