// Shared subject-tag taxonomy for photography photos. This is separate from
// the "Landscapes" / "Portraits" Firestore categories, which are actually
// just orientation (tall vs wide), not subject matter.
//
// Used by both the app (admin review UI) and seed-scripts/tagPhotos.mjs, so
// keep this list in sync with whatever tags actually get used.
export const PHOTO_TAGS = [
  "Forest",
  "Mountains",
  "Water",
  "Sky",
  "City",
  "Architecture",
  "Animals",
  "Plants",
  "People",
  "Night",
];
