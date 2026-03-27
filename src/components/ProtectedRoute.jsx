import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="muted" style={{ padding: 40 }}>Checking auth…</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}