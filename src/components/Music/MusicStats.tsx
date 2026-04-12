import React, { useState, useEffect } from "react";

const PERIODS = {
    day: { label: "Today", hours: 24 },
    week: { label: "This week", hours: 168 },
};

const FUNCTIONS_BASE_URL = "https://europe-west2-website-project-deb45.cloudfunctions.net";

function topN(tracks, key, n) {
    const counts = {};
    const meta = {};
    for (const track of tracks) {
        const k = track[key];
        counts[k] = (counts[k] || 0) + 1;
        if (!meta[k]) {
            meta[k] = { album_art: track.album_art, url: track.url };
        }
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([name, count]) => ({ name, count, ...meta[name] }));
}

function StatList({ title, items }) {
    if (!items.length) {
        return (
            <div className="stat-block">
                <h3 className="stat-block-title">{title}</h3>
                <p className="muted">No plays in this period.</p>
            </div>
        );
    }

    return (
        <div className="stat-block">
            <h3 className="stat-block-title">{title}</h3>
            <ul className="stat-list">
                {items.map((item, i) => (
                    <li key={item.name} className="stat-row">
                        <span className="stat-index">{i + 1}</span>
                        <img
                            src={item.album_art}
                            alt={item.name}
                            className="recently-played-art"
                        />
                        <span className="stat-name">{item.name}</span>
                        <span className="stat-count">{item.count} play{item.count !== 1 ? "s" : ""}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function MusicStats() {
    const [period, setPeriod] = useState("week");
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const since = new Date(Date.now() - PERIODS[period].hours * 60 * 60 * 1000).toISOString();

        fetch(`${FUNCTIONS_BASE_URL}/getRecentlyPlayed?since=${encodeURIComponent(since)}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setTracks(data.tracks ?? []);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [period]);

    const topArtists = topN(tracks, "artist", 3);
    const topAlbums = topN(tracks, "album", 3);
    const topTracks = topN(tracks, "track", 3);

    return (
        <section className="music-stats">
            <div className="music-stats-header">
                <h2 className="music-stats-heading">Stats</h2>
                <div className="period-toggle">
                    {Object.entries(PERIODS).map(([key, { label }]) => (
                        <button
                            key={key}
                            className={`period-btn${period === key ? " active" : ""}`}
                            onClick={() => setPeriod(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {loading && <p className="muted">Loading...</p>}
            {error && <p className="muted">Failed to load stats.</p>}
            {!loading && !error && (
                <div className="stat-grid">
                    <StatList title="Top Artists" items={topArtists} />
                    <StatList title="Top Albums" items={topAlbums} />
                    <StatList title="Top Tracks" items={topTracks} />
                </div>
            )}
        </section>
    );
}