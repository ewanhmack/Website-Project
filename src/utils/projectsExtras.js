// Extra helpers for projects

export function slugify(header = "") {
  return String(header)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");
}

export function uniqueTechFromProjects(projects) {
  const set = new Set();
  for (const p of projects) (p.tech || []).forEach(t => set.add(t));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// --- URL & media helpers ---
export function isAbsoluteUrl(u = "") {
  return /^https?:\/\//i.test(u);
}

export function isYouTubeUrl(u = "") {
  return /(youtube\.com|youtu\.be)/i.test(u) || /^[a-zA-Z0-9_-]{11}$/.test(u);
}

export function youtubeIdFrom(u = "") {
  if (!u) return null;
  // already an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u;
  try {
    const url = new URL(u);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      // /embed/<id> or /shorts/<id>
      const parts = url.pathname.split("/").filter(Boolean);
      const i = parts.findIndex(p => p === "embed" || p === "shorts");
      if (i >= 0 && parts[i + 1]) return parts[i + 1];
    }
  } catch {}
  return null;
}

export function mediaTypeFromSrc(src = "") {
  if (isYouTubeUrl(src)) return "youtube";
  return /\.(mp4|webm|ogg)$/i.test(src) ? "video" : "image";
}

export function mediaThumbUrl(m, MEDIA_BASE) {
  // explicit thumb overrides everything
  if (m?.thumb) return isAbsoluteUrl(m.thumb) ? m.thumb : MEDIA_BASE + m.thumb;
  // youtube: use HQ thumbnail
  if (mediaTypeFromSrc(m?.src) === "youtube") {
    const id = youtubeIdFrom(m.src);
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  // image/video file: show the file itself as thumb
  return isAbsoluteUrl(m?.src) ? m.src : MEDIA_BASE + (m?.src || "");
}
