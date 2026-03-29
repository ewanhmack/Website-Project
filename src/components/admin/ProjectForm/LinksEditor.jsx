import React from "react";

const EMPTY_LINK = { label: "", href: "" };

export default function LinksEditor({ links, onChange }) {
  const add = () => onChange([...links, { ...EMPTY_LINK }]);

  const update = (index, key, value) => {
    onChange(links.map((l, i) => i === index ? { ...l, [key]: value } : l));
  };

  const remove = (index) => onChange(links.filter((_, i) => i !== index));

  return (
    <div className="ap-section">
      <div className="ap-section-header">
        <span>Links</span>
        <button type="button" className="ap-add-btn" onClick={add}>+ Add Link</button>
      </div>
      {links.length === 0 ? (
        <p className="ap-empty">No links yet.</p>
      ) : null}
      {links.map((link, index) => (
        <div className="ap-row" key={index}>
          <input
            type="text"
            placeholder="Label (e.g. GitHub Repo)"
            value={link.label}
            onChange={(e) => update(index, "label", e.target.value)}
          />
          <input
            type="text"
            placeholder="URL (e.g. https://github.com/...)"
            value={link.href}
            onChange={(e) => update(index, "href", e.target.value)}
          />
          <button type="button" className="ap-remove-btn" onClick={() => remove(index)}>✕</button>
        </div>
      ))}
    </div>
  );
}