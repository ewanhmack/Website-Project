import React, { useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useProjects } from "../../utils/useProjects.js";
import ProjectForm from "./ProjectForm";
import "./AdminProjects.css";

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

      <div className="ap-list">
        {projects.map((project) => (
          <div key={project.id}>
            {mode === "edit" && editTarget?.id === project.id ? (
              <div className="ap-card ap-card--form">
                <h2>Edit — {project.header}</h2>
                <ProjectForm
                  initial={editTarget}
                  onSave={handleEdit}
                  onCancel={() => { setMode(null); setEditTarget(null); }}
                  saving={saving}
                />
              </div>
            ) : (
              <div className="ap-card ap-card--row">
                <div className="ap-card-info">
                  <strong>{project.header}</strong>
                  <span className="ap-tech-preview muted">
                    {(project.tech || []).slice(0, 3).join(", ")}
                  </span>
                </div>
                <div className="ap-card-actions">
                  <button
                    className="ghost"
                    onClick={() => { setEditTarget(project); setMode("edit"); }}
                  >
                    Edit
                  </button>
                  {deleteConfirm?.id === project.id ? (
                    <>
                      <button onClick={() => handleDelete(project)}>Confirm Delete</button>
                      <button className="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="ghost ap-delete-btn" onClick={() => setDeleteConfirm(project)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}