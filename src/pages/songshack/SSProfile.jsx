import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useSongShackAuth } from "../../utils/songshack/useSongShackAuth";
import { getUser, updateUser } from "../../utils/songshack/users";
import { getAlbums } from "../../utils/songshack/albums";

export default function SSProfile() {
  const { user, loading: authLoading } = useSongShackAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [form, setForm] = useState({ firstName: "", surname: "", username: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      navigate("/songshack/login");
      return;
    }

    Promise.all([getUser(user.uid), getAlbums()]).then(([userData, albumData]) => {
      setProfile(userData);
      setAlbums(albumData);
      if (userData) {
        setForm({
          firstName: userData.firstName || "",
          surname: userData.surname || "",
          username: userData.username || "",
          favouriteAlbumId: userData.favouriteAlbumId || "",
        });
      }
    });
  }, [user, authLoading]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateUser(user.uid, form);
      setSuccess("Profile updated.");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/songshack");
  };

  if (authLoading || !profile) {
    return <div className="ss-loading">Loading…</div>;
  }

  return (
    <div className="ss-profile-card">
      <h2>Your Profile</h2>

      {[
        { label: "First Name", key: "firstName" },
        { label: "Surname", key: "surname" },
        { label: "Username", key: "username" },
      ].map(({ label, key }) => (
        <div className="ss-profile-field" key={key}>
          <label>{label}</label>
          <input
            type="text"
            value={form[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}

      <div className="ss-profile-field">
        <label>Favourite Album</label>
        <select
          value={form.favouriteAlbumId || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, favouriteAlbumId: e.target.value }))}
        >
          <option value="">None</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.title} — {a.artist}</option>
          ))}
        </select>
      </div>

      {error ? <p className="ss-error">{error}</p> : null}
      {success ? <p style={{ color: "#4caf82", fontSize: "0.85rem", marginTop: 8 }}>{success}</p> : null}

      <button className="ss-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>

      <button
        className="ss-btn"
        style={{ marginTop: 12, background: "transparent", border: "1px solid #2a2a3a", color: "#a0a0b8" }}
        onClick={handleLogout}
      >
        Log Out
      </button>
    </div>
  );
}