import React, { useEffect, useState } from "react";

function timeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function RecentlyPlayed() {
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

  if (error) {
    return <p className="muted">{error}</p>;
  }

  if (!tracks.length) {
    return <p className="muted">Loading...</p>;
  }

  return (
    <ul className="recently-played-list">
      {tracks.map((track, i) => (
        <li key={i} className="recently-played-row">
          <span className="recently-played-index">{i + 1}</span>
          <img
            src={track.album_art}
            alt={track.album}
            className="recently-played-art"
          />
          <div className="recently-played-body">
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="recently-played-track"
            >
              {track.track}
            </a>
            <span className="recently-played-artist">{track.artist}</span>
          </div>
          <span className="recently-played-time">{timeAgo(track.played_at)}</span>
        </li>
      ))}
    </ul>
  );
}