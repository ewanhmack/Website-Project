import React from "react";

export default function Spinner({ label = "Loading…", size = 20 }) {
  return (
    <span className="loading-row" role="status" aria-live="polite">
      <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
