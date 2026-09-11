import type { EngineState } from './engine';
import type { Interval } from './intervals';

/** What plays when an interval ends: a beep as the next one starts, a double beep at the end. */
export type Cue = 'beep' | 'done';

/**
 * Milliseconds until the current interval ends, on the same monotonic clock the engine uses,
 * or null when nothing should be scheduled: idle, paused, or already finished.
 */
export function boundaryIn(state: EngineState, now: number): number | null {
  if (state.status !== 'running') return null;
  const current = state.intervals[state.index];
  if (!current || current.phase === 'done') return null;
  const end = state.phaseStartedAt + state.pausedTotal + current.seconds * 1000;
  return Math.max(0, end - now);
}

/** The cue for crossing into `next`. */
export function cueFor(next: Interval | undefined): Cue {
  return !next || next.phase === 'done' ? 'done' : 'beep';
}
