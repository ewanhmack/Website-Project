import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./AdminDashboard.css";

function StatusBadge({ status }) {
  if (!status) {
    return <span className="ad-badge ad-badge--unknown">Unknown</span>;
  }
  return (
    <span className={`ad-badge ad-badge--${status}`}>
      {status === "ok" ? "✓ OK" : "✕ Error"}
    </span>
  );
}

function timeAgo(isoString) {
  if (!isoString) {
    return "Never";
  }
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) {
    return `${diff}s ago`;
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }
  return `${Math.floor(diff / 86400)}d ago`;
}

function bucketByDay(items, dateField) {
  const counts = {};
  for (const item of items) {
    const date = item[dateField]?.slice(0, 10);
    if (!date) {
      continue;
    }
    counts[date] = (counts[date] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({ date: date.slice(5), count }));
}

function bucketFunctionHistory(history) {
  const counts = {};
  for (const item of history) {
    const date = item.timestamp?.slice(0, 10);
    if (!date) {
      continue;
    }
    counts[date] = (counts[date] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));
}

const CHART_COLORS = {
  music: "#4f46e5",
  photos: "#06b6d4",
  functions: "#a78bfa",
};

function MiniChart({ data, color, dataKey = "count" }) {
  if (!data || data.length === 0) {
    return <div className="ad-chart-empty">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text)",
          }}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace("#", "")})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FunctionRunChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="ad-chart-empty">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text)",
          }}
        />
        <Bar dataKey="count" fill={CHART_COLORS.functions} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState(null);
  const [functions, setFunctions] = useState(null);
  const [musicChart, setMusicChart] = useState([]);
  const [photosChart, setPhotosChart] = useState([]);
  const [functionsChart, setFunctionsChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        projectsSnap,
        portraitsSnap,
        landscapesSnap,
        tracksSnap,
        fetchRecentlyPlayedSnap,
        onPhotoUploadedSnap,
        onPhotoDeletedSnap,
        fnHistorySnap,
      ] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "photography", "Portraits", "photos")),
        getDocs(collection(db, "photography", "Landscapes", "photos")),
        getDocs(query(collection(db, "music", "recently-played", "tracks"), orderBy("played_at", "desc"))),
        getDoc(doc(db, "_meta", "functionStatus", "functions", "fetchRecentlyPlayed")),
        getDoc(doc(db, "_meta", "functionStatus", "functions", "onPhotoUploaded")),
        getDoc(doc(db, "_meta", "functionStatus", "functions", "onPhotoDeleted")),
        getDocs(query(
          collection(db, "_meta", "functionStatus", "functions", "fetchRecentlyPlayed", "history"),
          orderBy("timestamp", "desc"),
          limit(200)
        )),
      ]);

      setCounts({
        projects: projectsSnap.size,
        portraits: portraitsSnap.size,
        landscapes: landscapesSnap.size,
        tracks: tracksSnap.size,
      });

      setFunctions({
        fetchRecentlyPlayed: fetchRecentlyPlayedSnap.exists() ? fetchRecentlyPlayedSnap.data() : null,
        onPhotoUploaded: onPhotoUploadedSnap.exists() ? onPhotoUploadedSnap.data() : null,
        onPhotoDeleted: onPhotoDeletedSnap.exists() ? onPhotoDeletedSnap.data() : null,
      });

      const allTracks = tracksSnap.docs.map((d) => d.data());
      setMusicChart(bucketByDay(allTracks, "played_at"));

      const allPortraits = portraitsSnap.docs.map((d) => d.data());
      const allLandscapes = landscapesSnap.docs.map((d) => d.data());
      setPhotosChart(bucketByDay([...allPortraits, ...allLandscapes], "uploadedAt"));

      const fnHistory = fnHistorySnap.docs.map((d) => d.data());
      setFunctionsChart(bucketFunctionHistory(fnHistory));

      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="ad-wrapper">
      <div className="ad-section-header">
        <h2>System Health</h2>
        <div className="ad-header-right">
          {lastRefresh ? (
            <span className="ad-refresh-time">Updated {timeAgo(lastRefresh.toISOString())}</span>
          ) : null}
          <button className="ad-refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="ad-stats-row">
        <div className="ad-stat-card">
          <span className="ad-stat-label">Projects</span>
          <span className="ad-stat-num">{counts?.projects ?? "—"}</span>
        </div>
        <div className="ad-stat-card">
          <span className="ad-stat-label">Portraits</span>
          <span className="ad-stat-num">{counts?.portraits ?? "—"}</span>
        </div>
        <div className="ad-stat-card">
          <span className="ad-stat-label">Landscapes</span>
          <span className="ad-stat-num">{counts?.landscapes ?? "—"}</span>
        </div>
        <div className="ad-stat-card">
          <span className="ad-stat-label">Music tracks</span>
          <span className="ad-stat-num">{counts?.tracks ?? "—"}</span>
        </div>
      </div>

      <div className="ad-charts-grid">
        <div className="ad-chart-card">
          <div className="ad-chart-header">
            <span className="ad-chart-title">Music tracks — last 30 days</span>
          </div>
          <MiniChart data={musicChart} color={CHART_COLORS.music} />
        </div>

        <div className="ad-chart-card">
          <div className="ad-chart-header">
            <span className="ad-chart-title">Photos uploaded — last 30 days</span>
          </div>
          <MiniChart data={photosChart} color={CHART_COLORS.photos} />
        </div>

        <div className="ad-chart-card">
          <div className="ad-chart-header">
            <span className="ad-chart-title">Spotify sync runs — last 14 days</span>
          </div>
          <FunctionRunChart data={functionsChart} />
        </div>
      </div>

      <div className="ad-functions-card">
        <div className="ad-card-title">Function Status</div>
        {[
          { key: "fetchRecentlyPlayed", label: "Spotify sync" },
          { key: "onPhotoUploaded", label: "Photo upload" },
          { key: "onPhotoDeleted", label: "Photo delete" },
        ].map(({ key, label }) => {
          const fn = functions?.[key];
          return (
            <div key={key} className="ad-fn-row">
              <div className="ad-fn-info">
                <span className="ad-fn-name">{label}</span>
                <span className="ad-fn-time">
                  {fn?.lastRun ? timeAgo(fn.lastRun) : "Never run"}
                </span>
                {fn?.lastError ? (
                  <span className="ad-fn-error">{fn.lastError}</span>
                ) : null}
              </div>
              <StatusBadge status={fn?.status} />
            </div>
          );
        })}
      </div>

      <div className="ad-links-row">
        <a
          href="https://console.firebase.google.com/project/website-project-deb45/storage"
          target="_blank"
          rel="noreferrer"
          className="ad-console-link"
        >
          View Storage →
        </a>
        <a
          href="https://console.firebase.google.com/project/website-project-deb45/functions"
          target="_blank"
          rel="noreferrer"
          className="ad-console-link"
        >
          View Functions →
        </a>
        <a
          href="https://console.firebase.google.com/project/website-project-deb45/firestore"
          target="_blank"
          rel="noreferrer"
          className="ad-console-link"
        >
          View Firestore →
        </a>
      </div>
    </div>
  );
}