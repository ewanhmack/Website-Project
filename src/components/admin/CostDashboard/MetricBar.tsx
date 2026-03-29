import React from "react";
import { CHART_COLORS, FREE_TIER, calculateCost, formatCount, formatCost } from "../../../utils/admin/costHelper";

interface MetricBarProps {
  label: string;
  count: number;
  metric: string;
}

export default function MetricBar({ label, count, metric }: MetricBarProps) {
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