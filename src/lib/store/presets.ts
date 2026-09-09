import { cloneSteps } from '../workout-steps';
import { newId } from './ids';
import type { RepeatStep, Step, TimedStep, Workout, WorkoutTimings } from './types';

type Preset = { name: string } & WorkoutTimings;

const prep = (seconds: number): TimedStep => ({ kind: 'prep', seconds });
const hang = (seconds: number): TimedStep => ({ kind: 'hang', seconds });
const rest = (seconds: number): TimedStep => ({ kind: 'rest', seconds });
const repeat = (times: number, steps: Step[]): RepeatStep => ({
  kind: 'repeat',
  times,
  skipLastRest: true,
  steps,
});

/** Built-in workouts seeded on first launch. Users can edit or delete them. */
export const PRESETS: Preset[] = [
  {
    name: 'Repeaters 7:3',
    steps: [prep(10), repeat(6, [repeat(6, [hang(7), rest(3)]), rest(180)])],
  },
  {
    name: 'Max hangs',
    steps: [prep(10), repeat(5, [hang(10), rest(180)])],
  },
  {
    name: 'Density hangs',
    steps: [prep(10), repeat(4, [hang(30), rest(120)])],
  },
];

/** What a new workout starts from: the repeaters preset. */
export function templateSteps(): Step[] {
  return cloneSteps(PRESETS[0].steps);
}

export function makePresetWorkouts(now = new Date()): Workout[] {
  const iso = now.toISOString();
  return PRESETS.map((preset) => ({
    name: preset.name,
    steps: cloneSteps(preset.steps),
    id: newId(),
    isPreset: true,
    createdAt: iso,
    updatedAt: iso,
  }));
}
