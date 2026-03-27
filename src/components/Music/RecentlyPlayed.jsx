import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 25;

function timeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 60) {
    return "just now";
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes ago`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`;
  }
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function RecentlyPlayed() {
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const listRef = useRef(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const q = query(
          collection(db, "music", "recently-played", "tracks"),
          orderBy("played_at", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => d.data());
        setTracks(data);
      } catch (err) {
        setError("Couldn't load recently played tracks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  if (loading) {
    return <p className="muted">Loading...</p>;
  }

  if (error) {
    return <p className="muted">{error}</p>;
  }

  if (!tracks.length) {
    return <p className="muted">No tracks yet.</p>;
  }

  const totalPages = Math.ceil(tracks.length / PAGE_SIZE);
  const pageTracks = tracks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <h2 className="music-stats-heading" style={{ paddingBottom: "0.5em", paddingLeft: "1.1em", paddingRight: "1.1em" }}>Music History</h2>
      <ul className="recently-played-list" ref={listRef}>
        {pageTracks.map((track, i) => (
          <li key={track.played_at} className="recently-played-row">
            <span className="recently-played-index">
              {(page - 1) * PAGE_SIZE + i + 1}
            </span>
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
            <span className="recently-played-time">
              {timeAgo(track.played_at)}
            </span>
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="recently-played-pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ←
          </button>
          {Array.from({ length: 5 }, (_, i) => Math.max(1, page - 2) + i)
            .filter((p) => p >= 1 && p <= totalPages)
            .map((p) => (
              <button
                key={p}
                className={`pagination-btn ${p === page ? "pagination-btn--active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            →
          </button>
        </div>
      ) : null}
    </>
  );
}