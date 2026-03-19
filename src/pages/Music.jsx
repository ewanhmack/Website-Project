import React, { useEffect, useState } from "react";
import RecentlyPlayed from "../components/Music/RecentlyPlayed";
import MusicStats from "../components/Music/MusicStats";

export default function Music() {
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/Website-Project/data/recently-played.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then(setTracks)
      .catch(() => setError("Couldn't load recently played tracks."));
  }, []);

  return (
    <div className="page-container music">
      <div className="music-hero">
        <h2>Recently Played</h2>
        <p className="muted">Updated every 30 minutes via Spotify.</p>
      </div>
      {error && <p className="muted">{error}</p>}
      {!error && <MusicStats tracks={tracks} />}
      {!error && <RecentlyPlayed tracks={tracks} />}
    </div>
  );
}