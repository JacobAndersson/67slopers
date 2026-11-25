import type { WorkoutTimings } from './store/types';
import { expandWorkout, type Interval } from './timer/intervals';

/** One piece of a workout's shape: what kind of time it is and how long. */
export type ShapeKind = 'prep' | 'hang' | 'rest' | 'recover';
export type ShapePiece = { kind: ShapeKind; seconds: number };

/** Rests shorter than this read as part of the hangs around them. */
const SHORT_REST = 30;

/**
 * A workout as plain bars, time left to right (brand book p.40): hangs with the short rests
 * between them are one piece, a rest of 30 s or more is its own, a rest that closes a set is
 * Recover, Get ready is Get ready.
 */
export function workoutShape(timings: WorkoutTimings | Interval[]): ShapePiece[] {
  const intervals = Array.isArray(timings) ? timings : expandWorkout(timings);
  const out: ShapePiece[] = [];
  for (const interval of intervals) {
    if (interval.phase === 'done' || interval.seconds <= 0) continue;
    let kind: ShapeKind;
    if (interval.phase === 'prep') kind = 'prep';
    else if (interval.phase === 'hang') kind = 'hang';
    else if (interval.recover) kind = 'recover';
    else kind = interval.seconds < SHORT_REST ? 'hang' : 'rest';
    const last = out.at(-1);
    if (last && last.kind === kind && kind === 'hang') last.seconds += interval.seconds;
    else out.push({ kind, seconds: interval.seconds });
  }
  return out;
}

/**
 * Widths for the pieces so they fill `width` exactly with `gap` between them, every piece at
 * least `min` wide (a pill, not a dot).
 */
export function shapeWidths(pieces: ShapePiece[], width: number, gap: number, min: number) {
  if (!pieces.length) return [];
  const usable = width - gap * (pieces.length - 1);
  const total = pieces.reduce((n, p) => n + p.seconds, 0);
  const raw = pieces.map((p) => Math.max(min, (usable * p.seconds) / total));
  const k = usable / raw.reduce((n, w) => n + w, 0);
  return raw.map((w) => w * k);
}
