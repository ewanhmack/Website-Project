import React from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="admin-signout" onClick={handleSignOut}>Sign out</button>
      </div>
      <p className="admin-email">Logged in as {auth.currentUser?.email}</p>

      <div className="admin-grid">
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
    </div>
  );
}