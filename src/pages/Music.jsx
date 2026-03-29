import React, { useEffect, useState, useCallback, useRef } from "react";
import { collection, getDocs, orderBy, query, limit, startAfter } from "firebase/firestore";
import { db } from "../firebase";
import RecentlyPlayed from "../components/Music/RecentlyPlayed";
import MusicStats from "../components/Music/MusicStats";

const PAGE_SIZE = 25;

export default function Music() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  const cursor = useRef(null);

  const fetchTracks = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const q = cursor.current
        ? query(
            collection(db, "music", "recently-played", "tracks"),
            orderBy("played_at", "desc"),
            startAfter(cursor.current),
            limit(PAGE_SIZE)
          )
        : query(
            collection(db, "music", "recently-played", "tracks"),
            orderBy("played_at", "desc"),
            limit(PAGE_SIZE)
          );

      const snapshot = await getDocs(q);
      const newTracks = snapshot.docs.map((d) => d.data());

      cursor.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setTracks((prev) => isLoadMore ? [...prev, ...newTracks] : newTracks);
    } catch (err) {
      setError("Couldn't load recently played tracks.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    setHasLoadedMore(true);
    fetchTracks(true);
  }, [fetchTracks]);

  return (
    <div className="page-container music">
      <div className="music-hero">
        <h2>Recently Played</h2>
        <p className="muted">Updated every 5 minutes via Spotify.</p>
      </div>
      {!loading && !error ? <MusicStats tracks={tracks} /> : null}
      <RecentlyPlayed
        tracks={tracks}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        hasLoadedMore={hasLoadedMore}
        onLoadMore={handleLoadMore}
        onInfiniteLoad={() => fetchTracks(true)}
      />
    </div>
  );
}