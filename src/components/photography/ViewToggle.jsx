import React from "react";

export default function ViewToggle({ view, setView }) {
  const isGrid = view === "grid";
  return (
    <div className="view-toggle" role="group" aria-label="Toggle view">
      <button
        type="button"
        className={`view-switch ${isGrid ? "is-on" : ""}`}
        role="switch"
        aria-checked={isGrid}
        aria-label={isGrid ? "Album grid view on" : "Carousel view on"}
        onClick={() => setView((v) => (v === "grid" ? "carousel" : "grid"))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setView((v) => (v === "grid" ? "carousel" : "grid"));
          }
        }}
      >
        <span className="track">
          <span className="thumb" />
          <span className="label off">Carousels</span>
          <span className="label on">Album Grid</span>
        </span>
      </button>
    </div>
  );
}
