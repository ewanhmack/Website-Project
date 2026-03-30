import React, { useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useProjects } from "../../../utils/useProjects.js";
import ProjectForm from "../ProjectForm/ProjectForm";
import "../../css/AdminProjects.css";
import { resolveMediaSrc } from "../../../utils/projects";

export default function AdminProjects() {
  const { projects, loading, error } = useProjects();
  const [mode, setMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await addDoc(collection(db, "projects"), { ...data, order: projects.length });
      setMode(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "projects", editTarget.id), data);
      setMode(null);
      setEditTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    try {
      await deleteDoc(doc(db, "projects", project.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="muted ap-loading">Loading…</div>;
  }

  if (error) {
    return <div className="error-banner" role="alert">{error}</div>;
  }

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <h1>Manage Projects</h1>
        <div className="ap-page-actions">
          <button onClick={() => { setMode("add"); setEditTarget(null); }}>
            + Add Project
          </button>
        </div>
      </div>

      {mode === "add" ? (
        <div className="ap-card ap-card--form">
          <h2>New Project</h2>
          <ProjectForm
            onSave={handleAdd}
            onCancel={() => setMode(null)}
            saving={saving}
          />
        </div>
      ) : null}

      {mode === "edit" && editTarget ? (
        <div className="ap-card ap-card--form">
          <h2>Edit — {editTarget.header}</h2>
          <ProjectForm
            initial={editTarget}
            onSave={handleEdit}
            onCancel={() => { setMode(null); setEditTarget(null); }}
            saving={saving}
          />
        </div>
      ) : null}

      <div className="ap-grid">
        {projects.map((project) => {
          const thumb = project.media?.find((m) => m.src);
          const isEditing = mode === "edit" && editTarget?.id === project.id;

          return (
            <div
              key={project.id}
              className={`ap-tile${isEditing ? " ap-tile--editing" : ""}`}
            >
              <div
                className={`ap-tile-image${!thumb ? " ap-tile-image--empty" : ""}`}
                onClick={() => { setEditTarget(project); setMode("edit"); }}
              >
                {thumb ? (
                  <img src={resolveMediaSrc(thumb.src)} alt={project.header} />
                ) : (
                  <span className="ap-tile-image-placeholder">🖼</span>
                )}
              </div>

              <div className="ap-tile-info">
                <span className="ap-tile-title">{project.header}</span>
                <div className="ap-tile-actions">
                  {deleteConfirm?.id === project.id ? (
                    <>
                      <button onClick={() => handleDelete(project)}>Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="ap-delete-btn" onClick={() => setDeleteConfirm(project)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}