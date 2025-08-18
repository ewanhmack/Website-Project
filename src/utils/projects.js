// Shared helpers + constants used across programming components

export const MEDIA_BASE = "images/projects/";

export function getMediaArray(project) {
  if (Array.isArray(project?.media) && project.media.length) return project.media;
  const src = project?.image ? project.image : null;
  return src
    ? [{ src, caption: project.header || "", blurb: project.description || "" }]
    : [];
}

export function firstImage(project) {
  const m = getMediaArray(project);
  return m[0]?.src || null;
}
