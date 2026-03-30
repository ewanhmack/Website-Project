import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlbums } from "../../utils/songshack/albums";
import { useSongShackAuth } from "../../utils/songshack/useSongShackAuth";
import { getUser } from "../../utils/songshack/users";

export default function SSHome() {
  const { user } = useSongShackAuth();
  const [albums, setAlbums] = useState([]);
  const [favouriteId, setFavouriteId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlbums().then((data) => {
      setAlbums(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    getUser(user.uid).then((data) => {
      if (data?.favouriteAlbumId) {
        setFavouriteId(data.favouriteAlbumId);
      }
    });
  }, [user]);

  if (loading) {
    return <div className="ss-loading">Loading…</div>;
  }

  return (
    <>
      <h1 className="ss-page-title">SongShack</h1>
      <p className="ss-page-sub">Rate, discuss, and discover albums.</p>

      <h2>Featured Albums</h2>
      <div className="ss-grid">
        {albums.map((album) => (
          <Link
            key={album.id}
            to={`/songshack/album/${album.id}`}
            className="ss-album-card"
          >
            <img src={album.coverPhoto} alt={album.title} />
            <div className="ss-album-card-info">
              {favouriteId === album.id ? (
                <span style={{ color: "#f5c518" }}>★ </span>
              ) : null}
              <h3>{album.title}</h3>
              <p>{album.artist}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}