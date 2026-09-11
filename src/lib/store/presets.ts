import { cloneSteps } from '../workout-steps';
import { newId } from './ids';
import type { RepeatStep, Step, TimedStep, Workout, WorkoutTimings } from './types';

export type PresetLevel = 'beginner' | 'intermediate' | 'advanced';

export type Preset = {
  /** Stable slug, used in the presets route and never shown. */
  id: string;
  name: string;
  level: PresetLevel;
  /** One or two sentences: what it trains and how to pick the hold or load. */
  description: string;
} & WorkoutTimings;

export const LEVELS: PresetLevel[] = ['beginner', 'intermediate', 'advanced'];

export const LEVEL_LABELS: Record<PresetLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const prep = (seconds: number): TimedStep => ({ kind: 'prep', seconds });
const hang = (seconds: number, label?: string): TimedStep =>
  label ? { kind: 'hang', seconds, label } : { kind: 'hang', seconds };
const rest = (seconds: number): TimedStep => ({ kind: 'rest', seconds });
const repeat = (times: number, steps: Step[]): RepeatStep => ({ kind: 'repeat', times, steps });

/**
 * The classic protocols with their standard numbers. Every level gets a few; the three that
 * are seeded into "Your workouts" on first launch are listed in `SEEDED_PRESET_IDS`.
 */
export const PRESETS: Preset[] = [
  // --- Beginner ---
  {
    id: 'first-hangs',
    name: 'First hangs',
    level: 'beginner',
    description:
      'The 10:50 introduction. Jugs or the biggest edge, feet on a chair if you need them. ' +
      'Stop every hang well before your grip starts to open.',
    steps: [prep(10), repeat(2, [repeat(6, [hang(10), rest(50)]), rest(180)])],
  },
  {
    id: 'no-hangs',
    name: 'No-hangs, Emil style',
    level: 'beginner',
    description:
      'Emil Abrahamsson’s daily routine: feet stay on the floor and you load the fingers to ' +
      'about 70–80 % effort. Short and easy on purpose. Twice a day, at least six hours apart.',
    steps: [prep(10), repeat(8, [hang(10, 'Feet on the floor'), rest(50)])],
  },
  {
    id: 'density-hangs',
    name: 'Density hangs',
    level: 'beginner',
    description:
      'Longer hangs at about half effort. Pick a hold you can hang for the full 30 s with ' +
      'something in reserve; the edge sets the difficulty, not added weight.',
    steps: [prep(10), repeat(4, [hang(30), rest(120)])],
  },

  // --- Intermediate ---
  {
    id: 'repeaters-7-3',
    name: 'Repeaters 7:3',
    level: 'intermediate',
    description:
      'The classic strength-endurance set: 7 s on, 3 s off for six reps, six sets with three ' +
      'minutes between. Same edge and grip for every set.',
    steps: [prep(10), repeat(6, [repeat(6, [hang(7), rest(3)]), rest(180)])],
  },
  {
    id: 'max-hangs',
    name: 'Max hangs',
    level: 'intermediate',
    description:
      'Five near-maximal 10 s hangs with three minutes rest. Add weight or shrink the edge ' +
      'until the last hang is hard but clean.',
    steps: [prep(10), repeat(5, [hang(10), rest(180)])],
  },
  {
    id: 'minimum-edge',
    name: 'Minimum edge hangs',
    level: 'intermediate',
    description:
      'Max hangs without added weight: the smallest edge you can hold for 10 s. Move down ' +
      'one edge size when a set feels easy.',
    steps: [prep(10), repeat(5, [hang(10, 'Smallest edge you can hold'), rest(180)])],
  },
  {
    id: 'two-grip-repeaters',
    name: 'Two-grip repeaters',
    level: 'intermediate',
    description:
      'Repeaters split across two grips: three sets on half crimp, then three on open hand. ' +
      'Change the labels to whatever grips you are training.',
    steps: [
      prep(10),
      repeat(3, [repeat(6, [hang(7, 'Half crimp'), rest(3)]), rest(180)]),
      rest(180),
      repeat(3, [repeat(6, [hang(7, 'Open hand'), rest(3)]), rest(180)]),
    ],
  },

  // --- Advanced ---
  {
    id: 'seven-fifty-three',
    name: '7/53 max weight',
    level: 'advanced',
    description:
      'Eric Hörst’s weighted protocol: 7 s hangs with 53 s rest, three per set, three sets. ' +
      'Load so that a single 10 s hang would be your limit, about 96 % of max.',
    steps: [prep(10), repeat(3, [repeat(3, [hang(7, 'Added weight'), rest(53)]), rest(90)])],
  },
  {
    id: 'one-arm-hangs',
    name: 'One-arm hangs',
    level: 'advanced',
    description:
      'For climbers who would need more added weight than is practical. Eight seconds per arm ' +
      'on a big edge or jug; use a pulley or a foot to take weight off if you need to.',
    steps: [prep(10), repeat(5, [hang(8, 'Left arm'), rest(30), hang(8, 'Right arm'), rest(150)])],
  },
  {
    id: 'three-grip-max-hangs',
    name: 'Three-grip max hangs',
    level: 'advanced',
    description:
      'Three max hangs on each of three grips, three minutes between every hang. A full ' +
      'session for climbers who have outgrown a single grip.',
    steps: [
      prep(10),
      repeat(3, [hang(10, 'Half crimp'), rest(180)]),
      rest(180),
      repeat(3, [hang(10, 'Open hand'), rest(180)]),
      rest(180),
      repeat(3, [hang(10, 'Three-finger drag'), rest(180)]),
    ],
  },
];

/** Seeded into "Your workouts" on first launch. Users can edit or delete them. */
export const SEEDED_PRESET_IDS = ['repeaters-7-3', 'max-hangs', 'density-hangs'];

export function findPreset(id: string | undefined): Preset | undefined {
  return id ? PRESETS.find((p) => p.id === id) : undefined;
}

export function presetsByLevel(level: PresetLevel): Preset[] {
  return PRESETS.filter((p) => p.level === level);
}

/** What a blank new workout starts from: repeaters. */
export function templateSteps(): Step[] {
  return cloneSteps(findPreset('repeaters-7-3')!.steps);
}

export function makePresetWorkouts(now = new Date()): Workout[] {
  const iso = now.toISOString();
  return SEEDED_PRESET_IDS.map((id) => {
    const preset = findPreset(id)!;
    return {
      name: preset.name,
      steps: cloneSteps(preset.steps),
      id: newId(),
      isPreset: true,
      createdAt: iso,
      updatedAt: iso,
    };
  });
}
