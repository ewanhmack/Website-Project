import React, { useState } from "react";
import LinksEditor from "./LinksEditor";
import MediaEditor from "../MediaEditor/MediaEditor";

export default function ProjectForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          header: initial.header || "",
          description: initial.description || "",
          longDescription: initial.longDescription || "",
          tech: (initial.tech || []).join(", "),
          links: initial.links || [],
          media: initial.media || [],
          featured: initial.featured || false,
        }
      : {
          header: "",
          description: "",
          longDescription: "",
          tech: "",
          links: [],
          media: [],
          featured: false,
        }
  );
  const [formError, setFormError] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.header.trim()) {
      setFormError("Title is required.");
      return;
    }

    setFormError("");

    onSave({
      header: form.header.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
      links: form.links,
      media: form.media,
      featured: form.featured,
    });
  };

  return (
    <div className="ap-form">
      {formError ? (
        <div className="error-banner" role="alert">{formError}</div>
      ) : null}

      <div className="ap-field">
        <label>Title *</label>
        <input
          type="text"
          value={form.header}
          onChange={(e) => set("header", e.target.value)}
          placeholder="Project title"
        />
      </div>

      <div className="ap-field">
        <label>Short Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="One-line description"
        />
      </div>

      <div className="ap-field">
        <label>Long Description</label>
        <textarea
          rows={5}
          value={form.longDescription}
          onChange={(e) => set("longDescription", e.target.value)}
          placeholder="Full project write-up"
        />
      </div>

      <div className="ap-field">
        <label>Tech (comma separated)</label>
        <input
          type="text"
          value={form.tech}
          onChange={(e) => set("tech", e.target.value)}
          placeholder="React, TypeScript, Firebase"
        />
      </div>

      <div className="ap-field ap-field-checkbox">
        <label>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          {" "}Featured (shown in the highlighted section above the main grid)
        </label>
      </div>

      <LinksEditor links={form.links} onChange={(val) => set("links", val)} />
      <MediaEditor
        media={form.media}
        onChange={(val) => set("media", val)}
        projectHeader={form.header}
      />

      <div className="ap-form-actions">
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}