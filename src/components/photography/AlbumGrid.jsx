import React from "react";
import { IMG_BASE } from "../../utils/photos";

export default function AlbumGrid({ items, loadedMap, markLoaded }) {
  return (
    <section className="album-grid stylised full-bleed" aria-label="Album (all photos)">
      {items.map((p, i) => {
        const id = `${p.image}-${i}`;
        const isLoaded = !!loadedMap[id];
        const isFirst = i === 0;
        return (
          <figure className={`album-item ${isLoaded ? "is-loaded" : ""}`} key={id}>
            <img
              src={`${IMG_BASE}${p.image}`}
              alt={p.header || "Photo"}
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
              decoding="async"
              onLoad={() => markLoaded(id)}
            />
          </figure>
        );
      })}
    </section>
  );
}
