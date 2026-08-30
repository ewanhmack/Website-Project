import React, { useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useProjects } from "../../../utils/useProjects.js";
import ProjectForm from "../ProjectForm/ProjectForm";
import Spinner from "../../Spinner";
import "../../css/AdminProjects.css";
import { resolveMediaSrc } from "../../../utils/projects";

function ProjectTile({
  project,
  isEditing,
  isConfirmingDelete,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumb = project.media?.find((m) => m.src);

  return (
    <div className={`ap-tile${isEditing ? " ap-tile--editing" : ""}`}>
      <div
        className={`ap-tile-image${!thumb ? " ap-tile-image--empty" : ""}`}
        onClick={onEdit}
      >
        {thumb ? (
          <>
            {!isLoaded ? (
              <span className="ap-tile-image-loading" aria-hidden="true">
                <span className="spinner" style={{ width: 22, height: 22 }} />
              </span>
            ) : null}
            <img
              src={resolveMediaSrc(thumb.src)}
              alt={project.header}
              className={isLoaded ? "is-loaded" : ""}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <span className="ap-tile-image-placeholder">🖼</span>
        )}
      </div>

      <div className="ap-tile-info">
        <span className="ap-tile-title">{project.header}</span>
        <div className="ap-tile-actions">
          {isConfirmingDelete ? (
            <>
              <button onClick={onConfirmDelete}>Confirm</button>
              <button onClick={onCancelDelete}>Cancel</button>
            </>
          ) : (
            <button className="ap-delete-btn" onClick={onRequestDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const { projects, loading, error } = useProjects();
  const [mode, setMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...data,
        order: projects.length,
      });
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
    return (
      <div className="ap-loading">
        <Spinner label="Loading projects…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <h1>Manage Projects</h1>
        <div className="ap-page-actions">
          <button
            onClick={() => {
              setMode("add");
              setEditTarget(null);
            }}
          >
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
            onCancel={() => {
              setMode(null);
              setEditTarget(null);
            }}
            saving={saving}
          />
        </div>
      ) : null}

      <div className="ap-grid">
        {projects.map((project) => (
          <ProjectTile
            key={project.id}
            project={project}
            isEditing={mode === "edit" && editTarget?.id === project.id}
            isConfirmingDelete={deleteConfirm?.id === project.id}
            onEdit={() => {
              setEditTarget(project);
              setMode("edit");
            }}
            onRequestDelete={() => setDeleteConfirm(project)}
            onCancelDelete={() => setDeleteConfirm(null)}
            onConfirmDelete={() => handleDelete(project)}
          />
        ))}
      </div>
    </div>
  );
}
