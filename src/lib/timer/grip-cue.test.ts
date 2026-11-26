import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gripCue } from './grip-cue';
import { expandWorkout, type Interval } from './intervals';

/** Each interval as "phase:shown", the way the runner walks through the run. */
const shown = (run: Interval[]) =>
  run.map((interval, i) => `${interval.phase}:${gripCue(run, i).show ? 'board' : '-'}`);

test('the grip cue: first grip before the first hang, new grip when it changes', () => {
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 30 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 30 },
      { kind: 'hang', seconds: 7, holds: ['b'] },
    ],
  });
  assert.deepEqual(gripCue(run, 0), { holds: ['a'], prefix: 'First grip', show: true });
  assert.deepEqual(gripCue(run, 1), { holds: ['a'], prefix: null, show: true });
  assert.deepEqual(gripCue(run, 2), { holds: ['a'], prefix: null, show: false });
  assert.deepEqual(gripCue(run, 4), { holds: ['b'], prefix: 'New grip', show: true });
});

test('the board shows through Get ready and the first hang, then hides on repeats of the grip', () => {
  // Repeaters: two sets of three reps on one grip.
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      {
        kind: 'repeat',
        times: 2,
        steps: [
          {
            kind: 'repeat',
            times: 3,
            steps: [
              { kind: 'hang', seconds: 7, holds: ['l', 'r'] },
              { kind: 'rest', seconds: 3 },
            ],
          },
          { kind: 'rest', seconds: 180 },
        ],
      },
    ],
  });
  assert.deepEqual(shown(run), [
    'prep:board',
    'hang:board',
    'pause:-',
    'hang:-',
    'pause:-',
    'hang:-',
    'pause:-',
    'rest:-',
    'hang:-',
    'pause:-',
    'hang:-',
    'pause:-',
    'hang:-',
    'pause:-',
    'rest:-',
    'done:-',
  ]);
});

test('a new grip brings the board back for the rest before it and its first hang', () => {
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 60 },
      { kind: 'hang', seconds: 7, holds: ['a'] },
      { kind: 'rest', seconds: 60 },
      { kind: 'hang', seconds: 7, holds: ['b'] },
      { kind: 'rest', seconds: 60 },
      { kind: 'hang', seconds: 7, holds: ['b'] },
    ],
  });
  assert.deepEqual(shown(run), [
    'prep:board',
    'hang:board',
    'rest:-',
    'hang:-',
    'rest:board',
    'hang:board',
    'rest:-',
    'hang:-',
    'done:-',
  ]);
  assert.equal(gripCue(run, 4).prefix, 'New grip');
  assert.deepEqual(gripCue(run, 4).holds, ['b']);
});

test('a workout whose hangs have no grip never shows the board', () => {
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      { kind: 'hang', seconds: 7 },
      { kind: 'rest', seconds: 30 },
      { kind: 'hang', seconds: 7 },
    ],
  });
  assert.deepEqual(shown(run), ['prep:-', 'hang:-', 'rest:-', 'hang:-', 'done:-']);
});

test('a single hang shows the board from Get ready to its end', () => {
  const run = expandWorkout({
    steps: [
      { kind: 'prep', seconds: 10 },
      { kind: 'hang', seconds: 10, holds: ['a'] },
    ],
  });
  assert.deepEqual(shown(run), ['prep:board', 'hang:board', 'done:-']);
});
