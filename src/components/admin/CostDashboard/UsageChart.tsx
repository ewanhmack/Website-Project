import React from "react";
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
import { CHART_COLORS, formatCount, type Period } from "../../../utils/admin/costHelper.ts";
interface UsageChartProps {
  data: Record<string, unknown>[];
  period: Period;
}

export default function UsageChart({ data, period }: UsageChartProps) {
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
            formatter={(v: number) => formatCount(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Area type="monotone" dataKey="firestoreReads" name="Reads" stroke={CHART_COLORS.firestoreReads} fill="url(#grad-firestoreReads)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="firestoreWrites" name="Writes" stroke={CHART_COLORS.firestoreWrites} fill="url(#grad-firestoreWrites)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="functionInvocations" name="Functions" stroke={CHART_COLORS.functionInvocations} fill="url(#grad-functionInvocations)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="storageReads" name="Storage" stroke={CHART_COLORS.storageReads} fill="url(#grad-storageReads)" strokeWidth={2} dot={false} />
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
          formatter={(v: number) => formatCount(v)}
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