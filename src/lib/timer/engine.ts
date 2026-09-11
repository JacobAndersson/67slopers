import type { HangResult } from '../store/types';
import type { Interval } from './intervals';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done' | 'ended';

/**
 * Pure timer state. Every duration is derived from a monotonic clock value passed in
 * by the caller (`performance.now()` in the app, fake numbers in tests), never from
 * tick counts, so the display can refresh at any rate without drifting.
 */
export type EngineState = {
  intervals: Interval[];
  index: number;
  status: TimerStatus;
  /** Clock ms at which the workout started. */
  startedAt: number;
  /** Clock ms at which the current interval started. */
  phaseStartedAt: number;
  /** Clock ms when the current pause began, while paused. */
  pausedAt: number | null;
  /** Total ms spent paused inside the current interval. */
  pausedTotal: number;
  /**
   * Ms actually spent in each interval already left, by index, pauses excluded. An interval
   * that ran out is logged at its full length, a skipped one at the time it had run, and Back
   * forgets the intervals it returns over, so the log is what was really done.
   */
  performedMs: number[];
};

/** The engine waits in `idle` on the first interval until `start` is called. */
export function createEngine(intervals: Interval[], now: number): EngineState {
  const first = intervals[0];
  return {
    intervals,
    index: 0,
    status: !first || first.phase === 'done' ? 'done' : 'idle',
    startedAt: now,
    phaseStartedAt: now,
    pausedAt: null,
    pausedTotal: 0,
    performedMs: [],
  };
}

export function start(state: EngineState, now: number): EngineState {
  if (state.status !== 'idle') return state;
  return {
    ...state,
    status: 'running',
    startedAt: now,
    phaseStartedAt: now,
    pausedAt: null,
    pausedTotal: 0,
    performedMs: [],
  };
}

export function current(state: EngineState): Interval {
  return state.intervals[state.index];
}

/** The last hang before the current interval, if any: what the hands were on. */
export function previousHang(state: EngineState): Interval | undefined {
  for (let i = state.index - 1; i >= 0; i--) {
    if (state.intervals[i].phase === 'hang') return state.intervals[i];
  }
  return undefined;
}

/** The next hang after the current interval, if any: what to set up for during a rest. */
export function nextHang(state: EngineState): Interval | undefined {
  for (let i = state.index + 1; i < state.intervals.length; i++) {
    if (state.intervals[i].phase === 'hang') return state.intervals[i];
  }
  return undefined;
}

export function next(state: EngineState): Interval | undefined {
  return state.intervals[state.index + 1];
}

/** Milliseconds elapsed inside the current interval, excluding pauses. */
export function elapsedMs(state: EngineState, now: number): number {
  if (state.status === 'idle') return 0;
  const end = state.status === 'paused' && state.pausedAt !== null ? state.pausedAt : now;
  return Math.max(0, end - state.phaseStartedAt - state.pausedTotal);
}

export function remainingSeconds(state: EngineState, now: number): number {
  return Math.max(0, current(state).seconds - elapsedMs(state, now) / 1000);
}

/** 0..1 through the current interval. */
export function progress(state: EngineState, now: number): number {
  const seconds = current(state).seconds;
  if (seconds <= 0) return 1;
  return Math.min(1, elapsedMs(state, now) / (seconds * 1000));
}

/** The log with the current interval recorded as `ms`. */
function logCurrent(state: EngineState, ms: number): number[] {
  const log = state.performedMs.slice(0, state.index);
  log[state.index] = ms;
  return log;
}

function moveTo(
  state: EngineState,
  index: number,
  startAt: number,
  performedMs: number[]
): EngineState {
  const clamped = Math.min(index, state.intervals.length - 1);
  const isDone = state.intervals[clamped].phase === 'done';
  const paused = state.status === 'paused';
  return {
    ...state,
    index: clamped,
    status: isDone ? 'done' : paused ? 'paused' : 'running',
    phaseStartedAt: startAt,
    pausedAt: paused && !isDone ? startAt : null,
    pausedTotal: 0,
    performedMs,
  };
}

/**
 * Advances past every interval whose time has fully elapsed at `now`. Each new interval
 * starts exactly when the previous one ended, so a late tick (or a stretch in the
 * background) never shifts the schedule.
 */
export function tick(state: EngineState, now: number): EngineState {
  let s = state;
  while (s.status === 'running') {
    const cur = current(s);
    const durationMs = cur.seconds * 1000;
    const elapsed = now - s.phaseStartedAt - s.pausedTotal;
    if (elapsed < durationMs) break;
    s = moveTo(
      s,
      s.index + 1,
      s.phaseStartedAt + s.pausedTotal + durationMs,
      logCurrent(s, durationMs)
    );
  }
  return s;
}

export function pause(state: EngineState, now: number): EngineState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', pausedAt: now };
}

export function resume(state: EngineState, now: number): EngineState {
  if (state.status !== 'paused' || state.pausedAt === null) return state;
  return {
    ...state,
    status: 'running',
    pausedAt: null,
    pausedTotal: state.pausedTotal + (now - state.pausedAt),
  };
}

/** Jump to the next interval. Works while paused too (stays paused at its start). */
export function skip(state: EngineState, now: number): EngineState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  return moveTo(state, state.index + 1, now, logCurrent(state, elapsedMs(state, now)));
}

/** Restart the current interval if more than two seconds in, otherwise go back one. */
export function back(state: EngineState, now: number): EngineState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  const target = elapsedMs(state, now) > 2000 ? state.index : Math.max(0, state.index - 1);
  return moveTo(state, target, now, state.performedMs.slice(0, target));
}

/** Stops for good; the interval in progress is logged with the time it had run. */
export function end(state: EngineState, now: number): EngineState {
  if (state.status === 'done' || state.status === 'ended') return state;
  const performedMs =
    state.status === 'idle' ? state.performedMs : logCurrent(state, elapsedMs(state, now));
  return { ...state, status: 'ended', pausedAt: null, performedMs };
}

/** Where a run stands: enough to pick it up again after the app was closed. */
export type RunPosition = {
  index: number;
  /** Ms into the current interval, pauses excluded. */
  phaseElapsedMs: number;
  /** Ms since the start, earlier pauses included. */
  elapsedMs: number;
  performedMs: number[];
};

/** The position of a running or paused run at `now`; null when there is nothing to pick up. */
export function position(state: EngineState, now: number): RunPosition | null {
  if (state.status !== 'running' && state.status !== 'paused') return null;
  const clock = state.status === 'paused' && state.pausedAt !== null ? state.pausedAt : now;
  return {
    index: state.index,
    phaseElapsedMs: elapsedMs(state, now),
    elapsedMs: Math.max(0, clock - state.startedAt),
    performedMs: [...state.performedMs],
  };
}

/**
 * A run picked up again at `now`: paused on the interval it stood on, as far into it as it
 * was, with its elapsed time carried over. The time the app was closed does not count.
 */
export function restore(intervals: Interval[], at: RunPosition, now: number): EngineState {
  const index = Math.min(Math.max(0, Math.floor(at.index)), Math.max(0, intervals.length - 1));
  const done = !intervals[index] || intervals[index].phase === 'done';
  return {
    intervals,
    index,
    status: done ? 'done' : 'paused',
    startedAt: now - at.elapsedMs,
    phaseStartedAt: now - at.phaseElapsedMs,
    pausedAt: done ? null : now,
    pausedTotal: 0,
    performedMs: at.performedMs.slice(0, index),
  };
}

/** Every hang that was started, in order, with its planned and actual seconds (0.1 s floor). */
export function hangResults(state: EngineState): HangResult[] {
  const results: HangResult[] = [];
  state.intervals.forEach((interval, i) => {
    const ms = state.performedMs[i];
    if (interval.phase !== 'hang' || ms === undefined) return;
    results.push({ planned: interval.seconds, actual: Math.floor(ms / 100) / 10 });
  });
  return results;
}

/** Sets whose every hang ran its full length: a skipped or cut-short hang does not count. */
export function completedSets(state: EngineState): number {
  const complete = new Map<number, boolean>();
  state.intervals.forEach((interval, i) => {
    if (interval.phase !== 'hang') return;
    const ms = state.performedMs[i];
    const full = ms !== undefined && ms >= interval.seconds * 1000;
    complete.set(interval.setIndex, (complete.get(interval.setIndex) ?? true) && full);
  });
  let n = 0;
  for (const full of complete.values()) if (full) n++;
  return n;
}
