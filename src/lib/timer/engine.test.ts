import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  back,
  completedSets,
  createEngine,
  current,
  end,
  pause,
  remainingSeconds,
  resume,
  skip,
  tick,
} from './engine';
import { expandWorkout } from './intervals';

const twoSets = expandWorkout({
  prepSeconds: 10,
  blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 2, restSeconds: 60, sets: 2 }],
});
// prep, hang, pause, hang, rest, hang, pause, hang, done

test('tick advances exactly at the boundary and carries no drift', () => {
  let s = createEngine(twoSets, 1000);
  s = tick(s, 10_999);
  assert.equal(s.index, 0);
  assert.ok(Math.abs(remainingSeconds(s, 10_999) - 0.001) < 1e-6);
  s = tick(s, 11_040); // 40 ms late tick
  assert.equal(current(s).phase, 'hang');
  assert.equal(s.phaseStartedAt, 11_000); // started when prep ended, not when the tick landed
  assert.ok(Math.abs(remainingSeconds(s, 11_040) - 6.96) < 1e-6);
});

test('a long gap advances through several intervals on one tick', () => {
  let s = createEngine(twoSets, 0);
  s = tick(s, 10_000 + 7_000 + 3_000 + 2_500); // 2.5 s into the second hang
  assert.equal(s.index, 3);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 22_500), 4.5);
});

test('pause and resume extend the interval by the paused time', () => {
  let s = createEngine(twoSets, 0);
  s = tick(s, 10_000); // hang starts at 10 000
  s = pause(s, 12_000);
  assert.equal(s.status, 'paused');
  assert.equal(remainingSeconds(s, 14_000), 5); // frozen while paused
  s = resume(s, 15_000);
  assert.equal(remainingSeconds(s, 16_000), 4);
  s = tick(s, 20_000);
  assert.equal(current(s).phase, 'pause');
  assert.equal(s.phaseStartedAt, 20_000);
});

test('skip moves to the next interval and restarts its clock', () => {
  let s = createEngine(twoSets, 0);
  s = skip(s, 3_000);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 3_000), 7);
  s = pause(s, 4_000);
  s = skip(s, 5_000);
  assert.equal(s.status, 'paused');
  assert.equal(remainingSeconds(s, 9_000), 3); // still paused at the start of the pause
});

test('back restarts after two seconds, otherwise goes to the previous interval', () => {
  let s = createEngine(twoSets, 0);
  s = tick(s, 10_000);
  s = tick(s, 15_000); // 5 s into the hang
  s = back(s, 15_000);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 15_000), 7);
  s = back(s, 16_000); // only 1 s in: previous interval
  assert.equal(current(s).phase, 'prep');
});

test('completedSets counts sets whose last hang is behind us, and reaches done', () => {
  let s = createEngine(twoSets, 0);
  assert.equal(completedSets(s), 0);
  s = tick(s, 10_000 + 7_000 + 3_000 + 7_000); // second hang of set 1 finished -> rest
  assert.equal(current(s).phase, 'rest');
  assert.equal(completedSets(s), 1);
  s = tick(s, 10_000 + 7_000 + 3_000 + 7_000 + 60_000 + 7_000 + 3_000 + 7_000);
  assert.equal(s.status, 'done');
  assert.equal(completedSets(s), 2);
});

test('end freezes the engine without counting the current set', () => {
  let s = createEngine(twoSets, 0);
  s = tick(s, 12_000);
  s = end(s);
  assert.equal(s.status, 'ended');
  assert.equal(completedSets(s), 0);
});
