import type { Session, WorkoutTimings } from '../store/types';
import { validate } from '../workout-steps';
import * as engine from './engine';
import { expandWorkout } from './intervals';

/** What the runner needs besides the clock to show a run again. */
export type RunInfo = {
  /** The saved workout the run belongs to, if any. */
  workoutId?: string;
  name: string;
  /** Prefill for the save prompt after a temporary workout. */
  saveNameDefault?: string;
  timings: WorkoutTimings;
  /** ISO time the run started. */
  startedAt: string;
};

/** A run in progress, written at every interval change so a closed app can pick it up again. */
export type ActiveRun = RunInfo &
  engine.RunPosition & { /** ISO time of the checkpoint. */ savedAt: string };

export function checkpointFrom(
  state: engine.EngineState,
  now: number,
  info: RunInfo,
  wallClock = new Date()
): ActiveRun | null {
  const at = engine.position(state, now);
  return at ? { ...info, ...at, savedAt: wallClock.toISOString() } : null;
}

/** The session an unfinished run leaves in history when it is saved instead of continued. */
export function sessionFromCheckpoint(run: ActiveRun): Omit<Session, 'id'> {
  const intervals = expandWorkout(run.timings);
  const ended = engine.end(engine.restore(intervals, run, 0), 0);
  return {
    ...(run.workoutId ? { workoutId: run.workoutId } : {}),
    workoutName: run.name,
    snapshot: run.timings,
    startedAt: run.startedAt,
    completedAt: new Date(new Date(run.startedAt).getTime() + run.elapsedMs).toISOString(),
    completedSets: engine.completedSets(ended),
    totalSets: intervals[0]?.setCount ?? 0,
    completed: false,
    hangs: engine.hangResults(ended),
  };
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** A checkpoint read back from storage, or null for anything malformed. */
export function parseActiveRun(value: unknown): ActiveRun | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const timings = v.timings as WorkoutTimings | undefined;
  if (
    typeof v.name !== 'string' ||
    typeof v.startedAt !== 'string' ||
    typeof v.savedAt !== 'string' ||
    Number.isNaN(Date.parse(v.startedAt)) ||
    !isCount(v.index) ||
    !isCount(v.phaseElapsedMs) ||
    !isCount(v.elapsedMs) ||
    !Array.isArray(v.performedMs) ||
    !v.performedMs.every(isCount) ||
    (v.workoutId !== undefined && typeof v.workoutId !== 'string') ||
    (v.saveNameDefault !== undefined && typeof v.saveNameDefault !== 'string') ||
    typeof timings !== 'object' ||
    timings === null ||
    !Array.isArray(timings.steps)
  ) {
    return null;
  }
  try {
    if (validate(timings.steps).length) return null;
  } catch {
    return null;
  }
  return {
    ...(v.workoutId ? { workoutId: v.workoutId as string } : {}),
    name: v.name,
    ...(v.saveNameDefault ? { saveNameDefault: v.saveNameDefault as string } : {}),
    timings,
    startedAt: v.startedAt,
    savedAt: v.savedAt,
    index: v.index,
    phaseElapsedMs: v.phaseElapsedMs,
    elapsedMs: v.elapsedMs,
    performedMs: v.performedMs as number[],
  };
}
