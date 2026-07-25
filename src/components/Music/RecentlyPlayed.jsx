import React, { useRef, useEffect } from "react";
import Spinner from "../Spinner";
import { timeAgo } from "../../utils/time";

export default function RecentlyPlayed({ tracks, loading, loadingMore, error, hasMore, hasLoadedMore, onLoadMore, onInfiniteLoad }) {
  const listRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasLoadedMore || !hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) {
          onInfiniteLoad();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasLoadedMore, hasMore, loadingMore, onInfiniteLoad]);

  if (loading) {
    return (
      <div style={{ padding: "16px 1.1em" }}>
        <Spinner label="Loading recently played…" />
      </div>
    );
  }

  if (error) {
    return <p className="muted">{error}</p>;
  }

  if (!tracks.length) {
    return <p className="muted">No tracks yet.</p>;
  }

  return (
    <>
      <h2 className="music-stats-heading" style={{ paddingBottom: "0.5em", paddingLeft: "1.1em", paddingRight: "1.1em" }}>Music History</h2>
      <ul className="recently-played-list" ref={listRef}>
        {tracks.map((track, i) => (
          <li key={track.played_at} className="recently-played-row">
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
            <span className="recently-played-time">
              {timeAgo(track.played_at)}
            </span>
          </li>
        ))}
      </ul>

      {!hasLoadedMore && hasMore ? (
        <div style={{ textAlign: "center", padding: "16px" }}>
          <button
            className="pagination-btn"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}

      {hasLoadedMore && hasMore ? (
        <div ref={sentinelRef} style={{ height: 1 }} />
      ) : null}

      {hasLoadedMore && loadingMore ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
          <Spinner label="Loading more…" />
        </div>
      ) : null}
    </>
  );
}