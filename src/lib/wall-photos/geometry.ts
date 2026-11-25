/**
 * Gravity maths for wall photos. Pure, so `npm test` reaches it.
 *
 * Expo's DeviceMotion `accelerationIncludingGravity` points the way gravity pulls, in the
 * phone's frame, on both platforms: x to the right of the screen, y to its top, z out of the
 * screen. A phone lying face up reads about (0, 0, -9.81); one held upright in portrait reads
 * about (0, -9.81, 0).
 */

export type Vec3 = { x: number; y: number; z: number };

const DEG = 180 / Math.PI;

export function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function normalize(v: Vec3): Vec3 {
  const l = length(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

export function mean(vectors: readonly Vec3[]): Vec3 | null {
  if (!vectors.length) return null;
  const sum = vectors.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y, z: a.z + v.z }), {
    x: 0,
    y: 0,
    z: 0,
  });
  return { x: sum.x / vectors.length, y: sum.y / vectors.length, z: sum.z / vectors.length };
}

/** Angle between two vectors in degrees. */
export function angleBetween(a: Vec3, b: Vec3): number {
  const na = normalize(a);
  const nb = normalize(b);
  const dot = na.x * nb.x + na.y * nb.y + na.z * nb.z;
  return Math.acos(Math.min(1, Math.max(-1, dot))) * DEG;
}

/** Root-mean-square angle, in degrees, of the samples around their mean: how still the phone was. */
export function spread(vectors: readonly Vec3[]): number {
  const m = mean(vectors);
  if (!m || vectors.length < 2) return 0;
  const sq = vectors.reduce((a, v) => a + angleBetween(v, m) ** 2, 0);
  return Math.sqrt(sq / vectors.length);
}

/**
 * How far the back of the phone (where the camera looks) points above the horizon, in degrees.
 *
 * Laid with its back flat on a wall, this is the wall's angle past vertical: 0 on a vertical
 * wall, 40 on a 40° overhang, negative on a slab. Held up to take a photo, it is how far the
 * camera looks up.
 */
export function backElevation(gravity: Vec3): number {
  const g = normalize(gravity);
  return Math.asin(Math.min(1, Math.max(-1, g.z))) * DEG;
}

/**
 * How far the picture's horizon is turned from the nearest of the four ways to hold the phone,
 * in degrees (positive: clockwise). 0 when the phone is held level.
 */
export function horizonTilt(gravity: Vec3): number {
  const roll = Math.atan2(gravity.x, -gravity.y) * DEG;
  return roll - Math.round(roll / 90) * 90;
}

/**
 * The wall's angle from two readings with the phone laid on it, once top up and once top down.
 * A camera bump tilts the phone by the same amount in opposite directions in the two, so the
 * mean cancels it.
 */
export function wallAngle(topUp: Vec3, topDown: Vec3): number {
  return (backElevation(topUp) + backElevation(topDown)) / 2;
}
