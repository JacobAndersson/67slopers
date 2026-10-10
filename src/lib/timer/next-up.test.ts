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

const at = (index: number, boardShown = false) => nextUp(intervals, index, boardShown);

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

test('says nothing while hang and short rest alternate', () => {
  assert.equal(at(0), null);
  assert.equal(at(1), null);
  assert.equal(at(2), null);
});

test('announces the long rest on the last hang of a set, and through the short rest after it', () => {
  assert.deepEqual(at(3), { label: 'Next', value: 'Rest 3:00' });
  assert.deepEqual(at(4), { label: 'Next', value: 'Rest 3:00' });
});

test('names the coming set during the long rest', () => {
  assert.deepEqual(at(5), { label: 'Next', value: 'Set 2 of 2' });
});

test('leaves it to the board when the grip changes', () => {
  assert.equal(at(5, true), null);
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
  assert.equal(nextUp(single, 0, false), null);
  assert.deepEqual(nextUp(single, 1, false), { label: 'Next', value: 'Set 2 of 3' });
});
