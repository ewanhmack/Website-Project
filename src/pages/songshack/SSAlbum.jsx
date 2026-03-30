import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAlbum, getReviews, addReview } from "../../utils/songshack/albums";
import { getUser } from "../../utils/songshack/users";
import { useSongShackAuth } from "../../utils/songshack/useSongShackAuth";
import { Timestamp } from "firebase/firestore";

function Stars({ rating, onSelect }) {
  return (
    <div className="ss-star-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={n <= rating ? "active" : ""}
          onClick={() => onSelect && onSelect(n)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SSAlbum() {
  const { id } = useParams();
  const { user } = useSongShackAuth();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    Promise.all([getAlbum(id), getReviews(id)]).then(([albumData, reviewData]) => {
      if (!albumData) {
        navigate("/songshack/error");
        return;
      }
      setAlbum(albumData);
      setReviews(reviewData);
      setLoading(false);
    });
  }, [id]);

  const handleSubmitReview = async () => {
    setReviewError("");
    if (rating === 0) {
      setReviewError("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    try {
      const userData = await getUser(user.uid);
      await addReview(id, {
        user: userData?.username || "Anonymous",
        rating,
        comment: comment.trim(),
        date: Timestamp.now(),
      });

      const updated = await getReviews(id);
      setReviews(updated);
      setRating(0);
      setComment("");
    } catch {
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="ss-loading">Loading…</div>;
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <div className="ss-album-detail">
        <img src={album.coverPhoto} alt={album.title} />
        <div className="ss-album-meta">
          <h2>{album.title}</h2>
          <p><strong>Artist:</strong> {album.artist}</p>
          <p><strong>Genre:</strong> {album.genre}</p>
          <p><strong>Release Year:</strong> {album.releaseYear}</p>
          <p><strong>Producer:</strong> {album.producer}</p>
          <p><strong>Total Time:</strong> {album.totalTime}</p>
          {avgRating ? (
            <p><strong>Average Rating:</strong> <span style={{ color: "#f5c518" }}>★ {avgRating}</span></p>
          ) : null}
          <p style={{ marginTop: 12 }}>{album.recommendationDescription}</p>

          <table className="ss-songs-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Runtime</th>
              </tr>
            </thead>
            <tbody>
              {(album.songs || []).map((song) => (
                <tr key={song.track}>
                  <td>{song.track}</td>
                  <td>{song.title}</td>
                  <td>{song.runtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ss-reviews">
        <h2>Reviews</h2>

        {user ? (
          <div className="ss-review-form">
            <h3>Leave a Review</h3>
            <Stars rating={rating} onSelect={setRating} />
            <textarea
              rows={4}
              placeholder="Write your review…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {reviewError ? <p className="ss-error">{reviewError}</p> : null}
            <button className="ss-btn" onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        ) : (
          <p className="ss-muted" style={{ marginBottom: 24 }}>
            <Link to="/songshack/login" style={{ color: "#6c63ff" }}>Login</Link> to leave a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="ss-muted">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="ss-review-card">
              <div className="ss-review-header">
                <span className="ss-review-user">{review.user}</span>
                <span className="ss-review-date">
                  {review.date?.toDate
                    ? review.date.toDate().toLocaleDateString("en-GB")
                    : review.date}
                </span>
              </div>
              <div className="ss-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              <p className="ss-review-comment">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}