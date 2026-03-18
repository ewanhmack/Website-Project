import React from "react";
import RecentlyPlayed from "../components/Music/RecentlyPlayed";

export default function Music() {
  return (
    <div className="page-container music">
      <div className="music-hero">
        <h2>Recently Played</h2>
        <p className="muted">Updated every 30 minutes via Spotify.</p>
      </div>
      <RecentlyPlayed />
    </div>
  );
}