import { resolveMediaSrc } from "./projects";

export function slugify(header = "") {
  return String(header)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");
}

const DOMAIN_HARDWARE = "Hardware & CV";
const DOMAIN_GAME = "Game Dev";
const DOMAIN_WEB = "Web";

export const PROJECT_DOMAINS = [DOMAIN_HARDWARE, DOMAIN_WEB, DOMAIN_GAME];

const HARDWARE_KEYWORDS = [
  "opencv",
  "computer vision",
  "pid control",
  "servo",
  "motor control",
  "raspberry pi",
  "microcontroller",
  "3d printing",
  "arduino",
];

const GAME_KEYWORDS = [
  "unreal engine",
  "blueprints",
  "sfml",
  "opengl",
  "level design",
  "2d physics",
  "procedural generation",
  "day/night cycle",
  "dynamic lighting",
  "debug hud",
  "3d modelling",
  "bounding volume",
];

// Projects don't have an explicit domain field — this derives a rough one
// from the tech tags they already have, so filtering doesn't need any new
// data entry. Checked most-specific-first (hardware, then game) so shared
// tags like "React" or generic "3D" terms don't get misclassified.
export function deriveProjectDomain(project) {
  const haystack = (project?.tech || []).join(" | ").toLowerCase();

  if (HARDWARE_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return DOMAIN_HARDWARE;
  }

  if (GAME_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return DOMAIN_GAME;
  }

  return DOMAIN_WEB;
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

export function derivePosterFromVideoSrc(src = "") {
  if (!src) {
    return null;
  }

  const cleanSrc = src.split("?")[0].split("#")[0];

  if (!cleanSrc.toLowerCase().endsWith(".mp4")) {
    return null;
  }

  return `${cleanSrc.slice(0, cleanSrc.length - 4)}-poster.webp`;
}