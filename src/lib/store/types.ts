/** One group of identical sets. Simple mode is a workout with exactly one block. */
export type Block = {
  label?: string;
  hangSeconds: number;
  /** Rest between reps inside a set. Irrelevant when reps is 1. */
  pauseSeconds: number;
  reps: number;
  /** Rest after each set, except the last one of the workout. */
  restSeconds: number;
  sets: number;
};

export type WorkoutTimings = {
  prepSeconds: number;
  blocks: Block[];
};

export type Workout = WorkoutTimings & {
  id: string;
  name: string;
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

export type Session = {
  id: string;
  workoutId: string;
  workoutName: string;
  /** The workout as it was run, so later edits never rewrite history. */
  snapshot: WorkoutTimings;
  startedAt: string;
  completedAt: string;
  completedSets: number;
  totalSets: number;
  completed: boolean;
  feel?: Feel;
  note?: string;
};

export type Settings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};
