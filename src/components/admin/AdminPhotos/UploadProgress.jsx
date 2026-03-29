import React from "react";

export default function UploadProgress({ items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="aph-progress-list">
      {items.map((item) => (
        <div key={item.name} className="aph-progress-item">
          <span className="aph-progress-name">{item.name}</span>
          <span className={`aph-progress-status aph-progress-status--${item.status}`}>
            {item.status === "converting" ? "Converting…" : null}
            {item.status === "uploading" ? "Uploading…" : null}
            {item.status === "done" ? "✓ Done" : null}
            {item.status === "error" ? `✕ ${item.error}` : null}
          </span>
        </div>
      ))}
    </div>
  );
}