import React from "react";
import { Link } from "react-router-dom";

export default function SSError() {
  return (
    <div style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 12 }}>Oops…</h1>
      <p className="ss-muted">That didn't go too well.</p>
      <Link to="/songshack" style={{ color: "#6c63ff", marginTop: 24, display: "inline-block" }}>
        Back to Home
      </Link>
    </div>
  );
}