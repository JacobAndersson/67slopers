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
  };
}

export function current(state: EngineState): Interval {
  return state.intervals[state.index];
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

function moveTo(state: EngineState, index: number, startAt: number): EngineState {
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
    s = moveTo(s, s.index + 1, s.phaseStartedAt + s.pausedTotal + durationMs);
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
  return moveTo(state, state.index + 1, now);
}

/** Restart the current interval if more than two seconds in, otherwise go back one. */
export function back(state: EngineState, now: number): EngineState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  const target = elapsedMs(state, now) > 2000 ? state.index : Math.max(0, state.index - 1);
  return moveTo(state, target, now);
}

export function end(state: EngineState): EngineState {
  if (state.status === 'done') return state;
  return { ...state, status: 'ended', pausedAt: null };
}

/** Sets whose final hang has been completed. */
export function completedSets(state: EngineState): number {
  const lastHangIndex = new Map<number, number>();
  state.intervals.forEach((interval, i) => {
    if (interval.phase === 'hang') lastHangIndex.set(interval.setIndex, i);
  });
  if (state.status === 'done') return lastHangIndex.size;
  let n = 0;
  for (const i of lastHangIndex.values()) if (i < state.index) n++;
  return n;
}
