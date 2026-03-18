import React, { useEffect, useState, useRef } from "react";

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
  const [page, setPage] = useState(1);
  const listRef = useRef(null);

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

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  if (error) {
    return <p className="muted">{error}</p>;
  }

  if (!tracks.length) {
    return <p className="muted">Loading...</p>;
  }

  const totalPages = Math.ceil(tracks.length / PAGE_SIZE);
  const pageTracks = tracks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  return (
    <>
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
      {totalPages > 1 && (
        <div className="recently-played-pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ←
          </button>
          <span className="pagination-label">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
