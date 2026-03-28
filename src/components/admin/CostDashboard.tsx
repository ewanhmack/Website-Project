import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./CostDashboard.css";

const PRICING = {
  firestoreReads: 0.06 / 100000,
  firestoreWrites: 0.18 / 100000,
  functionInvocations: 0.4 / 1000000,
  storageReads: 0.004 / 10000,
};

const FREE_TIER = {
  firestoreReads: 50000,
  firestoreWrites: 20000,
  functionInvocations: 2000000,
  storageReads: 50000,
};

const CHART_COLORS = {
  firestoreReads: "#4f46e5",
  firestoreWrites: "#06b6d4",
  functionInvocations: "#a78bfa",
  storageReads: "#f59e0b",
};

const PERIODS = ["daily", "weekly", "monthly", "yearly"];

function calculateCost(metric, count) {
  const billable = Math.max(0, count - (FREE_TIER[metric] ?? 0));
  return billable * (PRICING[metric] ?? 0);
}

function formatCost(usd) {
  if (usd < 0.01) {
    return "< $0.01";
  }
  return `$${usd.toFixed(4)}`;
}

function formatCount(n) {
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return String(n ?? 0);
}

function totalCostFromDoc(doc) {
  return (
    calculateCost("firestoreReads", doc.firestoreReads ?? 0) +
    calculateCost("firestoreWrites", doc.firestoreWrites ?? 0) +
    calculateCost("functionInvocations", doc.functionInvocations ?? 0) +
    calculateCost("storageReads", doc.storageReads ?? 0)
  );
}

function MetricBar({ label, count, metric }) {
  const free = FREE_TIER[metric] ?? 1;
  const cost = calculateCost(metric, count);
  const pct = Math.min(100, Math.round((count / free) * 100));

  return (
    <div className="cd-metric-row">
      <div className="cd-metric-info">
        <span className="cd-metric-label">{label}</span>
        <span className="cd-metric-count">{formatCount(count)}</span>
      </div>
      <div className="cd-metric-bar-wrap">
        <div className="cd-metric-bar">
          <div
            className={`cd-metric-fill ${pct >= 90 ? "cd-metric-fill--warn" : ""}`}
            style={{ width: `${pct}%`, background: CHART_COLORS[metric] }}
          />
        </div>
        <span className="cd-metric-free">{pct}% of free tier</span>
      </div>
      <span className="cd-metric-cost">{formatCost(cost)}</span>
    </div>
  );
}

function UsageChart({ data, period }) {
  if (!data || data.length === 0) {
    return (
      <div className="cd-chart-empty">
        No data yet for this period — will populate as functions run.
      </div>
    );
  }

  if (period === "daily") {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {Object.entries(CHART_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCount} />
          <Tooltip
            contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)" }}
            formatter={(v) => formatCount(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Area type="monotone" dataKey="firestoreReads" name="Reads" stroke={CHART_COLORS.firestoreReads} fill={`url(#grad-firestoreReads)`} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="firestoreWrites" name="Writes" stroke={CHART_COLORS.firestoreWrites} fill={`url(#grad-firestoreWrites)`} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="functionInvocations" name="Functions" stroke={CHART_COLORS.functionInvocations} fill={`url(#grad-functionInvocations)`} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="storageReads" name="Storage" stroke={CHART_COLORS.storageReads} fill={`url(#grad-storageReads)`} strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatCount} />
        <Tooltip
          contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)" }}
          formatter={(v) => formatCount(v)}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Bar dataKey="firestoreReads" name="Reads" fill={CHART_COLORS.firestoreReads} radius={[4, 4, 0, 0]} />
        <Bar dataKey="firestoreWrites" name="Writes" fill={CHART_COLORS.firestoreWrites} radius={[4, 4, 0, 0]} />
        <Bar dataKey="functionInvocations" name="Functions" fill={CHART_COLORS.functionInvocations} radius={[4, 4, 0, 0]} />
        <Bar dataKey="storageReads" name="Storage" fill={CHART_COLORS.storageReads} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CostDashboard() {
  const [allData, setAllData] = useState({ days: [], weeks: [], months: [], years: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [daysSnap, weeksSnap, monthsSnap, yearsSnap] = await Promise.all([
        getDocs(query(collection(db, "_meta", "usage", "days"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "weeks"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "months"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "years"), orderBy("lastUpdated", "asc"))),
      ]);

      const toData = (snap) =>
        snap.docs.map((d) => ({ label: d.id, ...d.data() }));

      setAllData({
        days: toData(daysSnap),
        weeks: toData(weeksSnap),
        months: toData(monthsSnap),
        years: toData(yearsSnap),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = {
    daily: allData.days.map((d) => ({ ...d, label: d.label.slice(8) })),
    weekly: allData.weeks.map((d) => ({ ...d, label: d.label })),
    monthly: allData.months.map((d) => ({ ...d, label: d.label.slice(5) })),
    yearly: allData.years.map((d) => ({ ...d, label: d.label })),
  }[period];

  const currentYear = allData.years.find((y) => y.label === String(new Date().getFullYear())) ?? {};
  const currentMonth = allData.months.slice(-1)[0] ?? {};

  const yearCost = totalCostFromDoc(currentYear);
  const monthCost = totalCostFromDoc(currentMonth);

  if (loading) {
    return <div className="cd-loading muted">Loading cost data…</div>;
  }

  return (
    <div className="cd-wrapper">
      <div className="cd-header">
        <h2>Cost Estimate</h2>
        <button className="ad-refresh-btn" onClick={fetchData}>↻ Refresh</button>
      </div>

      <div className="cd-totals-row">
        <div className="cd-total-card">
          <span className="cd-total-label">This month</span>
          <span className="cd-total-value">{formatCost(monthCost)}</span>
          <span className="cd-total-note">{currentMonth.label ?? "—"}</span>
        </div>
        <div className="cd-total-card">
          <span className="cd-total-label">This year</span>
          <span className="cd-total-value">{formatCost(yearCost)}</span>
          <span className="cd-total-note">Jan 1 – today</span>
        </div>
        <div className="cd-total-card">
          <span className="cd-total-label">Function runs</span>
          <span className="cd-total-value">{formatCount(currentMonth.functionInvocations ?? 0)}</span>
          <span className="cd-total-note">This month</span>
        </div>
        <div className="cd-total-card">
          <span className="cd-total-label">Firestore ops</span>
          <span className="cd-total-value">
            {formatCount((currentMonth.firestoreReads ?? 0) + (currentMonth.firestoreWrites ?? 0))}
          </span>
          <span className="cd-total-note">This month</span>
        </div>
      </div>

      <div className="cd-chart-card">
        <div className="cd-chart-header">
          <span className="cd-card-title">Usage Over Time</span>
          <div className="cd-period-tabs">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`cd-period-btn ${p === period ? "cd-period-btn--active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <UsageChart data={chartData} period={period} />
      </div>

      <div className="cd-metrics-card">
        <div className="cd-card-title">Free Tier Usage — This Month</div>
        <MetricBar label="Firestore Reads" count={currentMonth.firestoreReads ?? 0} metric="firestoreReads" />
        <MetricBar label="Firestore Writes" count={currentMonth.firestoreWrites ?? 0} metric="firestoreWrites" />
        <MetricBar label="Function Invocations" count={currentMonth.functionInvocations ?? 0} metric="functionInvocations" />
        <MetricBar label="Storage Reads" count={currentMonth.storageReads ?? 0} metric="storageReads" />
      </div>

      <div className="cd-disclaimer">
        Estimates based on Firebase Blaze pricing. Storage egress and Auth not included. Free tier resets monthly.
        <a
          href="https://console.firebase.google.com/project/website-project-deb45/usage"
          target="_blank"
          rel="noreferrer"
          className="ad-console-link"
          style={{ marginLeft: 8 }}
        >
          View actual usage →
        </a>
      </div>
    </div>
  );
}