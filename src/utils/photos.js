export const IMG_BASE = "images/photos/";

export function getPhotoUrl(photo) {
  if (photo.storageUrl) {
    return photo.storageUrl;
  }
  return `${IMG_BASE}${photo.image}`;
}

export function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}