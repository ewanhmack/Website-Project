import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase";
import { PERIODS, formatCost, formatCount, totalCostFromDoc, type Period } from "../../../utils/admin/costHelper";
import MetricBar from "./MetricBar";
import UsageChart from "./UsageChart";
import "../../css/CostDashboard.css";

export default function CostDashboard() {
  const [allData, setAllData] = useState({ days: [], weeks: [], months: [], years: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [daysSnap, weeksSnap, monthsSnap, yearsSnap] = await Promise.all([
        getDocs(query(collection(db, "_meta", "usage", "days"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "weeks"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "months"), orderBy("lastUpdated", "asc"))),
        getDocs(query(collection(db, "_meta", "usage", "years"), orderBy("lastUpdated", "asc"))),
      ]);

      const toData = (snap) => snap.docs.map((d) => ({ label: d.id, ...d.data() }));

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