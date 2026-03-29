export const PRICING: Record<string, number> = {
  firestoreReads: 0.06 / 100000,
  firestoreWrites: 0.18 / 100000,
  functionInvocations: 0.4 / 1000000,
  storageReads: 0.004 / 10000,
};

export const FREE_TIER: Record<string, number> = {
  firestoreReads: 50000,
  firestoreWrites: 20000,
  functionInvocations: 2000000,
  storageReads: 50000,
};

export const CHART_COLORS: Record<string, string> = {
  firestoreReads: "#4f46e5",
  firestoreWrites: "#06b6d4",
  functionInvocations: "#a78bfa",
  storageReads: "#f59e0b",
};

export const PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
export type Period = (typeof PERIODS)[number];

export function calculateCost(metric: string, count: number): number {
  const billable = Math.max(0, count - (FREE_TIER[metric] ?? 0));
  return billable * (PRICING[metric] ?? 0);
}

export function formatCost(usd: number): string {
  if (usd < 0.01) {
    return "< $0.01";
  }
  return `$${usd.toFixed(4)}`;
}

export function formatCount(n: number): string {
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return String(n ?? 0);
}

export function totalCostFromDoc(doc: Record<string, number>): number {
  return (
    calculateCost("firestoreReads", doc.firestoreReads ?? 0) +
    calculateCost("firestoreWrites", doc.firestoreWrites ?? 0) +
    calculateCost("functionInvocations", doc.functionInvocations ?? 0) +
    calculateCost("storageReads", doc.storageReads ?? 0)
  );
}