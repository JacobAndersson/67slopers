import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { expandWorkout } from '../timer/intervals';
import {
  blocksToSteps,
  migrateSessionRecord,
  migrateTimings,
  migrateWorkoutRecord,
  migrateStore,
} from './migrate';
import { findPreset } from './presets';
import type { LegacyTimings } from './migrate';

/** What the v2 expander produced for each legacy workout, captured before the rewrite. */
const fixtures: Record<string, string[]> = JSON.parse(
  readFileSync(new URL('./migrate.fixtures.json', import.meta.url), 'utf8')
);

const legacy: Record<string, LegacyTimings> = {
  repeaters: {
    prepSeconds: 10,
    blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 6, restSeconds: 180, sets: 6 }],
  },
  maxHangs: {
    prepSeconds: 10,
    blocks: [{ hangSeconds: 10, pauseSeconds: 0, reps: 1, restSeconds: 180, sets: 5 }],
  },
  density: {
    prepSeconds: 10,
    blocks: [{ hangSeconds: 30, pauseSeconds: 0, reps: 1, restSeconds: 120, sets: 4 }],
  },
  twoBlocks: {
    prepSeconds: 5,
    blocks: [
      { label: 'A', hangSeconds: 7, pauseSeconds: 3, reps: 2, restSeconds: 60, sets: 2 },
      { label: 'B', hangSeconds: 10, pauseSeconds: 0, reps: 1, restSeconds: 90, sets: 2 },
    ],
  },
  pauseZero: {
    prepSeconds: 10,
    blocks: [{ hangSeconds: 10, pauseSeconds: 0, reps: 3, restSeconds: 60, sets: 2 }],
  },
  singleSet: {
    prepSeconds: 10,
    blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 4, restSeconds: 180, sets: 1 }],
  },
  noPrep: {
    prepSeconds: 0,
    blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 2, restSeconds: 30, sets: 2 }],
  },
};

/** Rep counters only matter on hangs and pauses; v2 stamped them on rests too. */
const normalise = (line: string) =>
  /^(hang|pause)/.test(line) ? line : line.replace(/ r\d+\/\d+/, '');

for (const [name, timings] of Object.entries(legacy)) {
  test(`blocksToSteps keeps the timer sequence for ${name}`, () => {
    const actual = expandWorkout(blocksToSteps(timings)).map((i) =>
      normalise(
        `${i.phase} ${i.seconds} s${i.setIndex}/${i.setCount} r${i.repIndex}/${i.repCount}` +
          (i.label && i.phase === 'hang' ? ` ${i.label}` : '')
      )
    );
    assert.deepEqual(actual, fixtures[name].map(normalise));
  });
}

test('blocksToSteps builds nested repeats', () => {
  assert.deepEqual(blocksToSteps(legacy.repeaters), {
    steps: [
      { kind: 'prep', seconds: 10 },
      {
        kind: 'repeat',
        times: 6,
        steps: [
          {
            kind: 'repeat',
            times: 6,
            steps: [
              { kind: 'hang', seconds: 7 },
              { kind: 'rest', seconds: 3 },
            ],
          },
          { kind: 'rest', seconds: 180 },
        ],
      },
    ],
  });
  // One set of one rep is just a hang.
  assert.deepEqual(
    blocksToSteps({
      prepSeconds: 0,
      blocks: [{ hangSeconds: 20, pauseSeconds: 0, reps: 1, restSeconds: 60, sets: 1 }],
    }),
    { steps: [{ kind: 'hang', seconds: 20 }] }
  );
});

test('records are rewritten and already-migrated or broken data passes through safely', () => {
  const workout = migrateWorkoutRecord({ id: 'w', name: 'Max', ...legacy.maxHangs });
  assert.equal('blocks' in workout, false);
  assert.equal('prepSeconds' in workout, false);
  assert.ok(Array.isArray(workout.steps));

  const session = migrateSessionRecord({ id: 's', snapshot: legacy.density });
  assert.equal((session.snapshot as { steps: unknown[] }).steps.length, 2);

  const steps = [{ kind: 'hang', seconds: 7 }];
  assert.deepEqual(migrateTimings({ steps }), { steps });
  // v3 repeats carried skipLastRest; it is dropped and the board is kept.
  assert.deepEqual(
    migrateTimings({
      board: 'beastmaker-1000',
      steps: [{ kind: 'repeat', times: 2, skipLastRest: false, steps }],
    }),
    { board: 'beastmaker-1000', steps: [{ kind: 'repeat', times: 2, steps }] }
  );
  assert.deepEqual(migrateTimings(null), { steps: [] });
  assert.deepEqual(migrateTimings({ nonsense: true }), { steps: [] });
});

test('v6 gives seeded built-in workouts their description back', () => {
  const out = migrateStore(
    {
      workouts: [
        { id: 'a', name: 'Max hangs', isPreset: true, steps: [] },
        { id: 'b', name: 'Max hangs', isPreset: false, steps: [] },
        { id: 'c', name: 'Max hangs', isPreset: true, description: 'Mine', steps: [] },
      ],
      sessions: [],
    },
    5
  );
  const [seeded, own, edited] = out.workouts as { description?: string }[];
  assert.equal(seeded.description, findPreset('max-hangs')!.description);
  assert.equal(own.description, undefined);
  assert.equal(edited.description, 'Mine');
});
