export const MEDIA_BASE = "images/projects/";

export const STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/website-project-deb45.firebasestorage.app/o/";

export function storageUrl(path) {
  const encoded = encodeURIComponent(path);
  return `${STORAGE_BASE}${encoded}?alt=media`;
}

export function resolveMediaSrc(src) {
  if (!src) {
    return "";
  }

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  const cleaned = src.replace(/^\/+/, "");
  const fullPath = cleaned.startsWith(MEDIA_BASE) ? cleaned : `${MEDIA_BASE}${cleaned}`;
  return storageUrl(fullPath);
}

export function getMediaArray(project) {
  if (Array.isArray(project?.media) && project.media.length) {
    return project.media;
  }

  const src = project?.image ? project.image : null;

  return src
    ? [{ src, caption: project.header || "", blurb: project.description || "" }]
    : [];
}

export function firstImage(project) {
  const m = getMediaArray(project);
  return m[0]?.src || null;
}