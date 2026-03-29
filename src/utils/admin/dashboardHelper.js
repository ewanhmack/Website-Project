export const CHART_COLORS = {
  music: "#4f46e5",
  photos: "#06b6d4",
  functions: "#a78bfa",
};

export function timeAgo(isoString) {
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

export function bucketByDay(items, dateField) {
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

export function bucketFunctionHistory(history) {
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