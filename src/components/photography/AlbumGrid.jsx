import React from "react";
import { IMG_BASE } from "../../utils/photos";

export default function AlbumGrid({ items, loadedMap, markLoaded, onSelectPhoto }) {
  const sortedItems = [...items].sort((a, b) => {
    const aLoaded = !!loadedMap[`${a.image}-${items.indexOf(a)}`];
    const bLoaded = !!loadedMap[`${b.image}-${items.indexOf(b)}`];
    return Number(bLoaded) - Number(aLoaded);
  });

  return (
    <section className="album-grid stylised full-bleed" aria-label="Album (all photos)">
      {sortedItems.map((photo, index) => {
        const originalIndex = items.indexOf(photo);
        const id = `${photo.image}-${originalIndex}`;
        const isLoaded = !!loadedMap[id];
        const isFirst = originalIndex === 0;

        return (
          <figure className={`album-item ${isLoaded ? "is-loaded" : ""}`} key={id}>
            <button
              type="button"
              className="album-item-button"
              onClick={() => {
                onSelectPhoto(photo);
              }}
              aria-label={`Open ${photo.header || "photo"}`}
            >
              <img
                src={`${IMG_BASE}${photo.image}`}
                alt={photo.header || "Photo"}
                loading={isFirst ? "eager" : "lazy"}
                fetchPriority={isFirst ? "high" : "auto"}
                decoding="async"
                onLoad={() => {
                  markLoaded(id);
                }}
              />
            </button>
          </figure>
        );
      })}
    </section>
  );
}