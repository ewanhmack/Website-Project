import React from "react";

const ASPECT_RATIOS = [0.8, 1.2, 1, 0.7, 1.4, 0.9, 1.1, 0.75, 1.3, 1, 0.85, 1.15];

export default function PhotoGridSkeleton({ count = 15 }) {
  return (
    <div className="photo-grid-skeleton" role="status" aria-label="Loading photos">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="photo-grid-skeleton-item skeleton"
          style={{ aspectRatio: `1 / ${ASPECT_RATIOS[i % ASPECT_RATIOS.length]}` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
