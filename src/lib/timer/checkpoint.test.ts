import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findPreset } from '../store/presets';
import { checkpointFrom, parseActiveRun, sessionFromCheckpoint, type RunInfo } from './checkpoint';
import * as engine from './engine';
import { expandWorkout } from './intervals';

const maxHangs = findPreset('max-hangs')!; // prep 10, 5 × (hang 10, rest 180)
const info: RunInfo = {
  workoutId: 'w1',
  name: 'Max hangs',
  timings: { steps: maxHangs.steps },
  startedAt: '2026-09-11T10:00:00.000Z',
};
const intervals = expandWorkout(info.timings);

/** Started at 0, both prep and first hang ran out, then the rest: 4 s into the second hang. */
function secondHang() {
  let s = engine.start(engine.createEngine(intervals, 0), 0);
  s = engine.tick(s, 10_000);
  s = engine.tick(s, 20_000);
  s = engine.tick(s, 200_000);
  return {
    state: s,
    checkpoint: checkpointFrom(s, 204_000, info, new Date('2026-09-11T10:03:24Z'))!,
  };
}

test('nothing to pick up before the start or after the end', () => {
  const idle = engine.createEngine(intervals, 0);
  assert.equal(checkpointFrom(idle, 0, info), null);
  assert.equal(checkpointFrom(engine.end(engine.start(idle, 0), 5), 5, info), null);
});

test('a checkpoint survives storage and restores paused where the run stood', () => {
  const { state, checkpoint } = secondHang();
  assert.equal(checkpoint.index, 3);
  assert.equal(checkpoint.phaseElapsedMs, 4_000);
  assert.equal(checkpoint.elapsedMs, 204_000);

  const stored = parseActiveRun(JSON.parse(JSON.stringify(checkpoint)));
  assert.deepEqual(stored, checkpoint);
  const restored = engine.restore(intervals, stored!, 9_000_000);
  assert.equal(restored.status, 'paused');
  assert.equal(engine.current(restored).phase, 'hang');
  assert.equal(engine.remainingSeconds(restored, 9_500_000), 6, 'still paused');
  assert.deepEqual(restored.performedMs, state.performedMs);
  const resumed = engine.resume(restored, 9_600_000);
  assert.equal(engine.remainingSeconds(resumed, 9_601_000), 5);
});

test('a paused run checkpoints the time it had run, not the time since', () => {
  const { state } = secondHang();
  const paused = engine.pause(state, 205_000);
  const checkpoint = checkpointFrom(paused, 900_000, info)!;
  assert.equal(checkpoint.phaseElapsedMs, 5_000);
  assert.equal(checkpoint.elapsedMs, 205_000);
});

test('an unfinished run saved from its checkpoint keeps what was done', () => {
  const session = sessionFromCheckpoint(secondHang().checkpoint);
  assert.equal(session.workoutId, 'w1');
  assert.equal(session.completed, false);
  assert.equal(session.totalSets, 5);
  assert.equal(session.completedSets, 1);
  assert.deepEqual(session.hangs, [
    { planned: 10, actual: 10 },
    { planned: 10, actual: 4 },
  ]);
  assert.equal(session.completedAt, '2026-09-11T10:03:24.000Z');
});

test('junk in storage is ignored', () => {
  const { checkpoint } = secondHang();
  const broken = [
    null,
    1,
    'run',
    {},
    { ...checkpoint, index: -1 },
    { ...checkpoint, timings: { steps: 'nope' } },
    { ...checkpoint, timings: { steps: [{ kind: 'rest', seconds: 5 }] } },
    { ...checkpoint, timings: { steps: [{ kind: 'repeat', times: 2 }] } },
    { ...checkpoint, startedAt: 'yesterday' },
  ];
  for (const value of broken) assert.equal(parseActiveRun(value), null, JSON.stringify(value));
});
