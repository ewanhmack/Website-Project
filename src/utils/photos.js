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

// Parses either the raw EXIF date format ("YYYY:MM:DD HH:MM:SS", as produced
// by the Python processing script) or an ISO 8601 string (as produced by the
// admin upload flow) into a Date. Returns null if the value can't be parsed.
export function parseCreatedDateTime(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const rawText = String(value).trim();

  if (rawText.length === 0) {
    return null;
  }

  const exifMatch = rawText.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );
  const isoText = exifMatch
    ? `${exifMatch[1]}-${exifMatch[2]}-${exifMatch[3]}T${exifMatch[4]}:${exifMatch[5]}:${exifMatch[6]}`
    : rawText;

  const date = new Date(isoText);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Formats createdDateTime metadata as a human-readable date/time, e.g.
// "27 Mar 2026, 21:56". Falls back to the raw value if it can't be parsed.
export function formatCreatedDateTime(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const rawText = String(value).trim();

  if (rawText.length === 0) {
    return "";
  }

  const date = parseCreatedDateTime(rawText);

  if (!date) {
    return rawText;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Groups distinct lens models by their focal length range (e.g.
// "EF-S18-55mm f/3.5-5.6 III" and "EF-S18-55mm f/3.5-5.6 IS" both become
// "18-55mm") so the same physical range filters together regardless of the
// exact lens/mount variant.
export function focalLengthGroup(lensModel) {
  if (!lensModel) {
    return null;
  }
  const match = lensModel.match(/(\d+(?:-\d+)?)\s*mm/i);
  if (!match) {
    return null;
  }
  return `${match[1]}mm`;
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