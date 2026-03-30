import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlbums, getReviews } from "../../utils/songshack/albums";

export default function SSRanking() {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const albums = await getAlbums();

      const withRatings = await Promise.all(
        albums.map(async (album) => {
          const reviews = await getReviews(album.id);
          const avg = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
          return { ...album, avgRating: avg, reviewCount: reviews.length };
        })
      );

      withRatings.sort((a, b) => b.avgRating - a.avgRating);
      setRanked(withRatings);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <div className="ss-loading">Loading…</div>;
  }

  return (
    <>
      <h1 className="ss-page-title">Rankings</h1>
      <p className="ss-page-sub">Albums ranked by average user rating.</p>

      {ranked.map((album, index) => (
        <Link
          key={album.id}
          to={`/songshack/album/${album.id}`}
          className="ss-ranking-row"
        >
          <span className="ss-rank-number">{index + 1}</span>
          <img src={album.coverPhoto} alt={album.title} />
          <div className="ss-ranking-info">
            <h3>{album.title}</h3>
            <p>{album.artist}</p>
          </div>
          <span className="ss-ranking-rating">
            {album.avgRating > 0 ? `★ ${album.avgRating.toFixed(1)}` : "Not rated"}
          </span>
        </Link>
      ))}
    </>
  );
}