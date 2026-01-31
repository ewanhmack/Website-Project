import React from "react";
import { IMG_BASE } from "../../utils/photos";

export default function AlbumGrid({ items, loadedMap, markLoaded, onSelectPhoto }) {
  return (
    <section className="album-grid stylised full-bleed" aria-label="Album (all photos)">
      {items.map((photo, index) => {
        const id = `${photo.image}-${index}`;
        const isLoaded = !!loadedMap[id];
        const isFirst = index === 0;

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
