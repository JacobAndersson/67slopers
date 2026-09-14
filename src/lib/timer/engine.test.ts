import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  back,
  completedSets,
  createEngine,
  current,
  end,
  hangResults,
  pause,
  remainingSeconds,
  resume,
  nextHang,
  previousHang,
  skip,
  start,
  tick,
} from './engine';

import { expandWorkout } from './intervals';

/** Engines in these tests are started immediately; the idle state has its own test. */
const running = (intervals: Parameters<typeof createEngine>[0], now: number) =>
  start(createEngine(intervals, now), now);

const twoSets = expandWorkout({
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
        { kind: 'rest', seconds: 60 },
      ],
    },
  ],
});
// prep, hang, pause, hang, pause, rest, hang, pause, hang, pause, rest, done

test('tick advances exactly at the boundary and carries no drift', () => {
  let s = running(twoSets, 1000);
  s = tick(s, 10_999);
  assert.equal(s.index, 0);
  assert.ok(Math.abs(remainingSeconds(s, 10_999) - 0.001) < 1e-6);
  s = tick(s, 11_040); // 40 ms late tick
  assert.equal(current(s).phase, 'hang');
  assert.equal(s.phaseStartedAt, 11_000); // started when prep ended, not when the tick landed
  assert.ok(Math.abs(remainingSeconds(s, 11_040) - 6.96) < 1e-6);
});

test('a long gap advances through several intervals on one tick', () => {
  let s = running(twoSets, 0);
  s = tick(s, 10_000 + 7_000 + 3_000 + 2_500); // 2.5 s into the second hang
  assert.equal(s.index, 3);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 22_500), 4.5);
});

test('pause and resume extend the interval by the paused time', () => {
  let s = running(twoSets, 0);
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
  let s = running(twoSets, 0);
  s = skip(s, 3_000);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 3_000), 7);
  s = pause(s, 4_000);
  s = skip(s, 5_000);
  assert.equal(s.status, 'paused');
  assert.equal(remainingSeconds(s, 9_000), 3); // still paused at the start of the pause
});

test('back restarts after two seconds, otherwise goes to the previous interval', () => {
  let s = running(twoSets, 0);
  s = tick(s, 10_000);
  s = tick(s, 15_000); // 5 s into the hang
  s = back(s, 15_000);
  assert.equal(current(s).phase, 'hang');
  assert.equal(remainingSeconds(s, 15_000), 7);
  s = back(s, 16_000); // only 1 s in: previous interval
  assert.equal(current(s).phase, 'prep');
});

test('completedSets counts sets whose last hang is behind us, and reaches done', () => {
  let s = running(twoSets, 0);
  assert.equal(completedSets(s), 0);
  s = tick(s, 10_000 + 7_000 + 3_000 + 7_000); // second hang of set 1 finished -> pause
  assert.equal(current(s).phase, 'pause');
  assert.equal(completedSets(s), 1);
  s = tick(s, 10_000 + 2 * (7_000 + 3_000 + 7_000 + 3_000 + 60_000));
  assert.equal(s.status, 'done');
  assert.equal(completedSets(s), 2);
});

test('end freezes the engine without counting the current set', () => {
  let s = running(twoSets, 0);
  s = tick(s, 12_000);
  s = end(s, 12_000);
  assert.equal(s.status, 'ended');
  assert.equal(completedSets(s), 0);
  assert.deepEqual(hangResults(s), [{ planned: 7, actual: 2 }], 'the hang in progress is logged');
});

test('a skipped or cut-short hang is logged as done and does not complete its set', () => {
  let s = running(twoSets, 0);
  s = tick(s, 10_000); // first hang starts
  s = tick(s, 20_000); // hang and pause ran out: second hang starts at 20 000
  s = skip(s, 23_450); // skipped 3.45 s in
  assert.equal(current(s).phase, 'pause');
  assert.deepEqual(hangResults(s), [
    { planned: 7, actual: 7 },
    { planned: 7, actual: 3.4 },
  ]);
  assert.equal(completedSets(s), 0, 'set 1 had a short hang');
  s = skip(s, 24_000); // skip the pause: set 1 rest starts
  assert.equal(current(s).phase, 'rest');
  s = skip(s, 24_500); // skip the rest: set 2 starts
  s = tick(s, 24_500 + 7_000 + 3_000 + 7_000 + 3_000 + 60_000);
  assert.equal(s.status, 'done');
  assert.equal(completedSets(s), 1, 'set 2 ran in full');
});

test('pauses do not count as hanging, and Back forgets what it goes back over', () => {
  let s = running(twoSets, 0);
  s = tick(s, 10_000);
  s = pause(s, 12_000);
  s = resume(s, 30_000);
  s = skip(s, 31_000); // 3 s of hanging, 18 s of pause
  assert.deepEqual(hangResults(s), [{ planned: 7, actual: 3 }]);
  s = back(s, 31_500); // straight back onto the hang: its short attempt is forgotten
  assert.equal(current(s).phase, 'hang');
  assert.deepEqual(hangResults(s), []);
  s = tick(s, 38_500);
  assert.deepEqual(hangResults(s), [{ planned: 7, actual: 7 }]);
});

test('end before start logs nothing', () => {
  const s = end(createEngine(twoSets, 0), 5_000);
  assert.equal(s.status, 'ended');
  assert.deepEqual(hangResults(s), []);
});

test('idle waits on the first interval until start is called', () => {
  let s = createEngine(twoSets, 0);
  assert.equal(s.status, 'idle');
  assert.equal(remainingSeconds(s, 5_000), 10); // nothing elapses while idle
  s = tick(s, 20_000);
  assert.equal(s.index, 0);
  s = skip(s, 20_000);
  assert.equal(s.index, 0); // skip and back are no-ops while idle
  s = start(s, 20_000);
  assert.equal(s.status, 'running');
  assert.equal(s.startedAt, 20_000);
  assert.equal(remainingSeconds(s, 24_000), 6);
});

test('previousHang is the last hang before the current interval', () => {
  const e = running(twoSets, 0);
  assert.equal(previousHang(e), undefined, 'nothing before the first hang');
  const onFirstHang = skip(e, 1000);
  assert.equal(previousHang(onFirstHang), undefined, 'the current hang does not count');
  const onPause = skip(onFirstHang, 2000);
  assert.equal(previousHang(onPause)?.phase, 'hang');
  assert.equal(previousHang(onPause)?.repIndex, 0);
});

test('nextHang looks past pauses and rests to the coming hang', () => {
  const e = running(twoSets, 0);
  // Interval 0 is prep; the first hang is next, then a pause, then the second hang.
  assert.equal(nextHang(e)?.phase, 'hang');
  const onHang = skip(e, 1000);
  assert.equal(nextHang(onHang)?.phase, 'hang');
  assert.equal(nextHang(onHang)?.repIndex, 1);
  let last = onHang;
  for (let i = 0; i < 20; i++) last = skip(last, 2000 + i);
  assert.equal(nextHang(last), undefined, 'no hang after the end');
});
