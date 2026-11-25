/** A figure counts up to its value in this long when its screen first arrives. */
export const COUNT_MS = 450;

/**
 * Where a count-up from 0 to `to` stands `elapsedMs` into it: whole numbers, quick at first and
 * settling onto `to` (ease-out), exactly `to` from `durationMs` on.
 */
export function countUp(to: number, elapsedMs: number, durationMs = COUNT_MS): number {
  if (elapsedMs >= durationMs) return to;
  const t = Math.max(0, elapsedMs) / durationMs;
  return Math.round(to * (1 - (1 - t) ** 4));
}
