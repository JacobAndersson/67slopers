import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shapeWidths, workoutShape } from './workout-shape';

const repeaters = {
  steps: [
    { kind: 'prep' as const, seconds: 10 },
    {
      kind: 'repeat' as const,
      times: 2,
      steps: [
        {
          kind: 'repeat' as const,
          times: 3,
          steps: [
            { kind: 'hang' as const, seconds: 7 },
            { kind: 'rest' as const, seconds: 3 },
          ],
        },
        { kind: 'rest' as const, seconds: 180 },
      ],
    },
  ],
};

test('hangs and short rests merge; a set-closing rest is recover', () => {
  assert.deepEqual(workoutShape(repeaters), [
    { kind: 'prep', seconds: 10 },
    { kind: 'hang', seconds: 30 },
    { kind: 'recover', seconds: 180 },
    { kind: 'hang', seconds: 30 },
    { kind: 'recover', seconds: 180 },
  ]);
});

test('long rests between top-level hangs stay rests', () => {
  const ladder = {
    steps: [
      { kind: 'hang' as const, seconds: 10 },
      { kind: 'rest' as const, seconds: 30 },
      { kind: 'hang' as const, seconds: 15 },
    ],
  };
  assert.deepEqual(
    workoutShape(ladder).map((p) => p.kind),
    ['hang', 'rest', 'hang']
  );
});

test('widths fill the strip exactly and respect the minimum', () => {
  const widths = shapeWidths(workoutShape(repeaters), 300, 3, 25);
  assert.equal(Math.round(widths.reduce((n, w) => n + w, 0) + 3 * 4), 300);
  assert.ok(widths.every((w) => w >= 20));
});
