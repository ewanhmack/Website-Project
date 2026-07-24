export const IMG_BASE = "images/photos/";

export function getPhotoUrl(photo) {
  if (photo.storageUrl) {
    return photo.storageUrl;
  }
  return `${IMG_BASE}${photo.image}`;
}

export function formatShutterSpeed(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const rawText = String(value).trim();

  if (rawText.length === 0) {
    return "";
  }

  if (rawText.includes("/")) {
    return rawText;
  }

  const seconds = Number(rawText);

  if (Number.isNaN(seconds)) {
    return rawText;
  }

  if (seconds >= 1) {
    return `${seconds}s`;
  }

  if (seconds <= 0) {
    return rawText;
  }

  const denominator = Math.round(1 / seconds);

  if (denominator <= 0) {
    return rawText;
  }

  return `1/${denominator}`;
}

export function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BUCKET = "website-project-deb45.firebasestorage.app";

export function getPhotoUrlForCanvas(photo) {
  if (photo.image) {
    const encoded = encodeURIComponent(`images/photos/${photo.image}`);
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media`;
  }
  return getPhotoUrl(photo);
}