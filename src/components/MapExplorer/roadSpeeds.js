// Assumed average speed when a road has no maxspeed tag.
const DEFAULT_SPEED_MPH = {
  motorway: 70,
  trunk: 60,
  primary: 45,
  secondary: 35,
  tertiary: 30,
  motorway_link: 40,
  trunk_link: 40,
  primary_link: 30,
  secondary_link: 25,
  tertiary_link: 25,
  unclassified: 30,
  residential: 20,
  living_street: 10,
  ferry_terminal: 10,
};

// Upper bound on realistic speed per road type. Posted limits are used when
// tagged, but the national limit (60 mph) also applies to single-track lanes,
// so without a cap every country lane would look like a fast shortcut.
const SPEED_CAP_MPH = {
  motorway: 70,
  trunk: 70,
  primary: 60,
  secondary: 50,
  tertiary: 45,
  motorway_link: 50,
  trunk_link: 50,
  primary_link: 40,
  secondary_link: 35,
  tertiary_link: 30,
  unclassified: 35,
  residential: 25,
  living_street: 10,
  ferry_terminal: 10,
};

const FALLBACK_SPEED_MPH = 30;

// No edge may be faster than this, which keeps the fastest-route A* heuristic
// (straight-line distance at this speed) from overestimating.
export const MAX_SPEED_MPH = 70;

export const METRES_PER_MILE = 1609.344;

// Ferries carry their own crossing speed from the snapshot.
export function edgeSpeedMph(highway, taggedSpeedMph) {
  if (highway === "ferry") {
    return Math.min(Math.max(taggedSpeedMph, 1), MAX_SPEED_MPH);
  }
  const cap = SPEED_CAP_MPH[highway] ?? FALLBACK_SPEED_MPH;
  const speed =
    taggedSpeedMph > 0
      ? Math.min(taggedSpeedMph, cap)
      : (DEFAULT_SPEED_MPH[highway] ?? FALLBACK_SPEED_MPH);
  return Math.min(speed, MAX_SPEED_MPH);
}
