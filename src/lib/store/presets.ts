import { newId } from './ids';
import type { Workout, WorkoutTimings } from './types';

type Preset = { name: string } & WorkoutTimings;

/** Built-in workouts seeded on first launch. Users can edit or delete them. */
export const PRESETS: Preset[] = [
  {
    name: 'Repeaters 7:3',
    prepSeconds: 10,
    blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 6, restSeconds: 180, sets: 6 }],
  },
  {
    name: 'Max hangs',
    prepSeconds: 10,
    blocks: [{ hangSeconds: 10, pauseSeconds: 0, reps: 1, restSeconds: 180, sets: 5 }],
  },
  {
    name: 'Density hangs',
    prepSeconds: 10,
    blocks: [{ hangSeconds: 30, pauseSeconds: 0, reps: 1, restSeconds: 120, sets: 4 }],
  },
];

export function makePresetWorkouts(now = new Date()): Workout[] {
  const iso = now.toISOString();
  return PRESETS.map((preset) => ({
    ...preset,
    id: newId(),
    isPreset: true,
    createdAt: iso,
    updatedAt: iso,
  }));
}
