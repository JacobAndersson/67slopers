import assert from 'node:assert/strict';
import { test } from 'node:test';

import { boundaryIn, cueFor } from './cues';
import { createEngine, end, pause, resume, skip, start, tick } from './engine';
import { expandWorkout } from './intervals';

const intervals = expandWorkout({
  steps: [
    { kind: 'prep', seconds: 5 },
    {
      kind: 'repeat',
      times: 2,
      steps: [
        { kind: 'hang', seconds: 7 },
        { kind: 'rest', seconds: 3 },
      ],
    },
  ],
});

test('boundaryIn counts down on the engine clock and pauses with it', () => {
  const idle = createEngine(intervals, 1000);
  assert.equal(boundaryIn(idle, 1000), null, 'nothing before start');

  const running = start(idle, 1000);
  assert.equal(boundaryIn(running, 1000), 5000);
  assert.equal(boundaryIn(running, 3000), 3000);

  const paused = pause(running, 3000);
  assert.equal(boundaryIn(paused, 4000), null, 'nothing while paused');

  const resumed = resume(paused, 6000);
  assert.equal(boundaryIn(resumed, 6000), 3000, 'the pause did not eat the remaining time');
  assert.equal(boundaryIn(resumed, 8500), 500);
});

test('boundaryIn follows skips and ticks into later intervals', () => {
  const running = start(createEngine(intervals, 0), 0);
  const skipped = skip(running, 2000);
  assert.equal(boundaryIn(skipped, 2000), 7000, 'the hang starts at the skip');

  // Ticking exactly past the prep lands on the hang with a full 7 s left.
  const ticked = tick(running, 5000);
  assert.equal(ticked.index, 1);
  assert.equal(boundaryIn(ticked, 5000), 7000);
  assert.equal(boundaryIn(ticked, 5250), 6750);

  assert.equal(boundaryIn(end(running, 100), 100), null, 'nothing once ended');
  const last = { ...running, index: intervals.length - 1 };
  assert.equal(boundaryIn(last, 100), null, 'nothing on the done interval');
});

test('cueFor beeps into every interval and doubles at the end', () => {
  assert.equal(cueFor(intervals[1]), 'beep');
  assert.equal(cueFor(intervals[2]), 'beep');
  assert.equal(cueFor(intervals.at(-1)), 'done');
  assert.equal(cueFor(undefined), 'done');
});
