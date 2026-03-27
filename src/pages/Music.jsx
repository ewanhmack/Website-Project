import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import RecentlyPlayed from "../components/Music/RecentlyPlayed";
import MusicStats from "../components/Music/MusicStats";

export default function Music() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const q = query(
          collection(db, "music", "recently-played", "tracks"),
          orderBy("played_at", "desc")
        );
        const snapshot = await getDocs(q);
        setTracks(snapshot.docs.map((d) => d.data()));
      } catch (err) {
        setError("Couldn't load recently played tracks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  return (
    <div className="page-container music">
      <div className="music-hero">
        <h2>Recently Played</h2>
        <p className="muted">Updated every 5 minutes via Spotify.</p>
      </div>
      {error ? <p className="muted">{error}</p> : null}
      {!loading && !error ? <MusicStats tracks={tracks} /> : null}
      <RecentlyPlayed />
    </div>
  );
}