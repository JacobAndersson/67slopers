import assert from 'node:assert/strict';
import { test } from 'node:test';

import { expandWorkout } from './intervals';
import { nextUp } from './next-up';

const intervals = expandWorkout({
  steps: [
    { kind: 'prep', seconds: 10 },
    {
      kind: 'repeat',
      times: 2,
      steps: [
        {
          kind: 'repeat',
          times: 2,
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

const at = (index: number) => nextUp(intervals, index);

test('lists the run this file expects', () => {
  assert.deepEqual(
    intervals.map((i) => i.phase),
    [
      'prep',
      'hang',
      'pause',
      'hang',
      'pause',
      'rest',
      'hang',
      'pause',
      'hang',
      'pause',
      'rest',
      'done',
    ]
  );
});

test('Get ready names the first hang', () => {
  assert.deepEqual(at(0), { label: 'Next', value: 'Hang 7 s' });
});

test('says nothing while hang and short rest alternate', () => {
  assert.equal(at(1), null);
  assert.equal(at(2), null);
});

test('announces the long rest on the last hang of a set, and through the short rest after it', () => {
  assert.deepEqual(at(3), { label: 'Next', value: 'Recover 3:00' });
  assert.deepEqual(at(4), { label: 'Next', value: 'Recover 3:00' });
});

test('names the coming set during the long rest', () => {
  assert.deepEqual(at(5), { label: 'Next', value: 'Set 2 of 2' });
});

test('names the hang when the grip changes within a set', () => {
  const grips = expandWorkout({
    board: 'beastmaker-1000',
    steps: [
      {
        kind: 'repeat',
        times: 1,
        steps: [
          { kind: 'hang', seconds: 7, holds: ['a'] },
          { kind: 'rest', seconds: 30 },
          { kind: 'hang', seconds: 7, holds: ['b'] },
        ],
      },
    ],
  });
  assert.deepEqual(nextUp(grips, 1), { label: 'Next', value: 'Hang 7 s' });
});

test('announces the end from the last hang on', () => {
  assert.equal(at(6), null);
  assert.deepEqual(at(8), { label: 'Next', value: 'Done' });
  assert.deepEqual(at(10), { label: 'Next', value: 'Done' });
});

test('single hangs with a rest after each are their own pattern', () => {
  const single = expandWorkout({
    steps: [
      {
        kind: 'repeat',
        times: 3,
        steps: [
          { kind: 'hang', seconds: 10 },
          { kind: 'rest', seconds: 180 },
        ],
      },
    ],
  });
  assert.equal(nextUp(single, 0), null);
  assert.deepEqual(nextUp(single, 1), { label: 'Next', value: 'Set 2 of 3' });
});
