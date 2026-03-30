import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { addAlbum } from "../../utils/songshack/albums";
import { useSongShackAuth } from "../../utils/songshack/useSongShackAuth";

const EMPTY_SONG = { track: "", title: "", runtime: "" };

export default function SSNewAlbum() {
  const { user, loading: authLoading } = useSongShackAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", artist: "", genre: "",
    releaseYear: "", producer: "", totalTime: "",
    recommendationScore: "", recommendationDescription: "",
  });
  const [songs, setSongs] = useState([{ ...EMPTY_SONG }]);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateSong = (index, key, value) => {
    setSongs((prev) => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.title || !form.artist || !coverFile) {
      setError("Title, artist, and cover photo are required.");
      return;
    }

    if (songs.length === 0 || songs.some((s) => !s.title || !s.runtime)) {
      setError("Please add at least one song with a title and runtime.");
      return;
    }

    setSaving(true);
    try {
      const storageRef = ref(storage, `ss_covers/${Date.now()}_${coverFile.name}`);
      await uploadBytes(storageRef, coverFile);
      const coverPhoto = await getDownloadURL(storageRef);

      await addAlbum({
        ...form,
        releaseYear: Number(form.releaseYear),
        recommendationScore: parseFloat(form.recommendationScore),
        coverPhoto,
        songs: songs.map((s, i) => ({ ...s, track: i + 1 })),
        addedBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      navigate("/songshack");
    } catch {
      setError("Failed to add album. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="ss-loading">Loading…</div>;
  }

  if (!user) {
    return (
      <p className="ss-login-prompt">
        <Link to="/songshack/login">Login</Link> to add an album.
      </p>
    );
  }

  return (
    <div className="ss-new-album-form">
      <h1>Add New Album</h1>

      {[
        { label: "Title", key: "title" },
        { label: "Artist", key: "artist" },
        { label: "Genre", key: "genre" },
        { label: "Release Year", key: "releaseYear" },
        { label: "Producer", key: "producer" },
        { label: "Total Time (e.g. 42:19)", key: "totalTime" },
        { label: "Recommendation Score (0–10)", key: "recommendationScore" },
      ].map(({ label, key }) => (
        <div className="ss-field" key={key}>
          <label>{label}</label>
          <input
            type="text"
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </div>
      ))}

      <div className="ss-field" style={{ borderBottom: "none" }}>
        <label>Recommendation Description</label>
        <textarea
          rows={4}
          value={form.recommendationDescription}
          onChange={(e) => set("recommendationDescription", e.target.value)}
        />
      </div>

      <div className="ss-field" style={{ borderBottom: "none", marginBottom: 24 }}>
        <label>Cover Photo</label>
        <input
          type="file"
          accept="image/*"
          className="ss-file-input"
          onChange={(e) => setCoverFile(e.target.files[0] || null)}
        />
      </div>

      <h3 style={{ marginBottom: 12 }}>Songs</h3>
      <div className="ss-songs-list">
        {songs.map((song, index) => (
          <div key={index} className="ss-song-row">
            <span className="ss-muted">#{index + 1}</span>
            <input
              type="text"
              placeholder="Title"
              value={song.title}
              onChange={(e) => updateSong(index, "title", e.target.value)}
            />
            <input
              type="text"
              placeholder="Runtime"
              value={song.runtime}
              onChange={(e) => updateSong(index, "runtime", e.target.value)}
            />
            <button
              className="ss-remove-song-btn"
              onClick={() => setSongs((prev) => prev.filter((_, i) => i !== index))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        className="ss-add-song-btn"
        onClick={() => setSongs((prev) => [...prev, { ...EMPTY_SONG }])}
      >
        + Add Song
      </button>

      {error ? <p className="ss-error">{error}</p> : null}

      <button className="ss-btn" onClick={handleSubmit} disabled={saving}>
        {saving ? "Saving…" : "Add Album"}
      </button>
    </div>
  );
}