import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/admin/AdminDashboard";

export default function Admin() {
  const navigate = useNavigate();

  return (
    <>
      <div className="admin-content-header">
        <h1>Dashboard</h1>
      </div>

      <div className="admin-quick-actions">
        <button className="admin-card" onClick={() => navigate("/admin/projects")}>
          <span className="admin-card-icon">🗂️</span>
          <span className="admin-card-title">Manage Projects</span>
          <span className="admin-card-desc">Add, edit, or delete portfolio projects</span>
        </button>
        <button className="admin-card" onClick={() => navigate("/admin/photos")}>
          <span className="admin-card-icon">📷</span>
          <span className="admin-card-title">Manage Photos</span>
          <span className="admin-card-desc">Upload and organise photography</span>
        </button>
      </div>

      <AdminDashboard />
    </>
  );
}