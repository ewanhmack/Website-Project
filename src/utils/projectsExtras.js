import { resolveMediaSrc } from "./projects";

export function slugify(header = "") {
  return String(header)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");
}

export function uniqueTechFromProjects(projects) {
  const set = new Set();
  for (const p of projects) {
    (p.tech || []).forEach((t) => set.add(t));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function isAbsoluteUrl(u = "") {
  return /^https?:\/\//i.test(u);
}

export function isYouTubeUrl(u = "") {
  return /(youtube\.com|youtu\.be)/i.test(u) || /^[a-zA-Z0-9_-]{11}$/.test(u);
}

export function youtubeIdFrom(u = "") {
  if (!u) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(u)) {
    return u;
  }

  try {
    const url = new URL(u);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const i = parts.findIndex((p) => p === "embed" || p === "shorts");

      if (i >= 0 && parts[i + 1]) {
        return parts[i + 1];
      }
    }
  } catch {}

  return null;
}

export function mediaTypeFromSrc(src = "") {
  if (isYouTubeUrl(src)) {
    return "youtube";
  }

  return /\.(mp4|webm|ogg)$/i.test(src) ? "video" : "image";
}

export function mediaThumbUrl(m) {
  if (m?.thumb) {
    return resolveMediaSrc(m.thumb);
  }

  if (mediaTypeFromSrc(m?.src) === "youtube") {
    const id = youtubeIdFrom(m.src);
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }

  return resolveMediaSrc(m?.src || "");
}