import type { BoardId } from '../boards/generated';

/** Timed step kinds: `prep` is the get-ready countdown, `hang` is work, `rest` is passive. */
export type StepKind = 'prep' | 'hang' | 'rest';

export type TimedStep = {
  kind: StepKind;
  seconds: number;
  /** Free text shown on the timer, e.g. "20 mm half crimp". */
  label?: string;
  /** Hold ids on the workout's board for a hang: a mirrored pair or one centre hold. */
  holds?: string[];
};

/**
 * Runs its steps `times` rounds in a row. May contain one more level of repeats, no deeper.
 * A rest at the end of the round is skipped on the final round, so "hang, rest" × 6 ends on
 * the hang.
 */
export type RepeatStep = {
  kind: 'repeat';
  times: number;
  steps: Step[];
};

export type Step = TimedStep | RepeatStep;

/**
 * The canonical, id-free workout structure: an ordered list of steps and repeats. This is what
 * gets persisted, snapshotted on sessions and encoded for sharing. Editors add ids on top; see
 * `src/lib/workout-steps.ts`.
 */
export type WorkoutTimings = {
  /** The hangboard the holds refer to; absent means no board. */
  board?: BoardId;
  steps: Step[];
};

export type Workout = WorkoutTimings & {
  id: string;
  name: string;
  /** What it trains and how to pick the hold or load; copied from a built-in workout. */
  description?: string;
  isPreset: boolean;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
};

/** How the session felt, graded once it ends. */
export type Feel = 'weak' | 'normal' | 'strong';

export const FEELS: Feel[] = ['weak', 'normal', 'strong'];

export const FEEL_LABELS: Record<Feel, string> = {
  weak: 'Weak',
  normal: 'Normal',
  strong: 'Strong',
};

/** One hang as it was done: planned seconds, and seconds actually hung (less when skipped). */
export type HangResult = { planned: number; actual: number };

export type Session = {
  id: string;
  /** Absent when the session ran an unsaved (temporary) workout. */
  workoutId?: string;
  workoutName: string;
  /** The workout as it was run, so later edits never rewrite history. */
  snapshot: WorkoutTimings;
  startedAt: string;
  completedAt: string;
  /** Sets whose every hang ran its full length. */
  completedSets: number;
  totalSets: number;
  completed: boolean;
  /** Every hang started, in order. Absent on sessions recorded before this was tracked. */
  hangs?: HangResult[];
  feel?: Feel;
  note?: string;
};

/** Timer cues, remembered across workouts. Both default to on. */
export type Settings = {
  sound: boolean;
  vibration: boolean;
  genZMode: boolean;
};

export const DEFAULT_SETTINGS: Settings = { sound: true, vibration: true, genZMode: false };

/** Timings to run without saving them first. Lives in memory only. */
export type Draft = {
  name?: string;
  timings: WorkoutTimings;
  /** The saved workout this is an earlier version of, so the run joins its history. */
  workoutId?: string;
};
