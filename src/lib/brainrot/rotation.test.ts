import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  coverFrame,
  createClipRotation,
  hangOrdinal,
  shouldPlay,
  shuffledCycle,
  splitHeight,
} from './rotation';
import { expandWorkout } from '../timer/intervals';
import * as engine from '../timer/engine';

test('shuffle exhausts each cycle and avoids adjacent repeats; Back is stable', () => {
  const rotation = createClipRotation(['a', 'b', 'c', 'a'], () => 0.7);
  const result = Array.from({ length: 30 }, (_, i) => rotation.clipAt(i));
  for (let i = 0; i < result.length; i += 3) assert.equal(new Set(result.slice(i, i + 3)).size, 3);
  for (let i = 1; i < result.length; i++) assert.notEqual(result[i], result[i - 1]);
  assert.equal(rotation.clipAt(0), result[0]);
  assert.equal(rotation.clipAt(19), result[19]);
});

test('failed clips keep the current assignment but leave future cycles', () => {
  const rotation = createClipRotation(['a', 'b'], () => 0);
  const first = rotation.clipAt(0)!;
  rotation.fail(first);
  assert.equal(rotation.clipAt(0), first);
  for (let i = 1; i < 10; i++) assert.notEqual(rotation.clipAt(i), first);
  rotation.fail(rotation.clipAt(1)!);
  assert.equal(rotation.clipAt(10), undefined);
  assert.equal(createClipRotation([]).clipAt(4), undefined);
  assert.deepEqual(
    shuffledCycle(['x'], () => 0, 'x'),
    ['x']
  );
});

const intervals = expandWorkout({
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
            { kind: 'hang', seconds: 7 },
            { kind: 'rest', seconds: 3 },
          ],
        },
        { kind: 'rest', seconds: 30 },
      ],
    },
  ],
});

test('nested hang ordinals retain the preceding hang through recovery', () => {
  let expected = -1;
  intervals.forEach((interval, index) => {
    if (interval.phase === 'hang') expected++;
    assert.equal(hangOrdinal({ intervals, index }), Math.max(0, expected));
  });
});

test('clock catch-up, pause/resume, back/restart, skip never reshuffle', () => {
  let state = engine.start(engine.createEngine(intervals, 0), 0);
  assert.equal(hangOrdinal(state), 0);
  state = engine.tick(state, 21000);
  assert.equal(hangOrdinal(state), 1);
  state = engine.pause(state, 22000);
  const ordinal = hangOrdinal(state);
  assert.equal(shouldPlay(state.status, true), false);
  state = engine.resume(state, 23000);
  assert.equal(hangOrdinal(state), ordinal);
  assert.equal(shouldPlay(state.status, false), false);
  state = engine.tick(state, 25000);
  assert.equal(hangOrdinal(engine.back(state, 25000)), ordinal);
  assert.equal(hangOrdinal(engine.tick(state, 72000)), 3);
  assert.equal(shouldPlay('done', true), false);
  assert.equal(shouldPlay('ended', true), false);
  assert.equal(shouldPlay('idle', true), false);
});

test('no hangs, consecutive hangs, long hang and adaptive layout', () => {
  const intervals = expandWorkout({ steps: [{ kind: 'rest', seconds: 60 }] });
  assert.equal(hangOrdinal({ intervals, index: 0 }), 0);
  const consecutive = expandWorkout({
    steps: [
      { kind: 'hang', seconds: 120 },
      { kind: 'hang', seconds: 7 },
    ],
  });
  assert.equal(hangOrdinal({ intervals: consecutive, index: 1 }), 1);
  assert.equal(splitHeight(800, 380, true), 400);
  assert.equal(splitHeight(800, 480, true), 480);
  assert.equal(splitHeight(500, 420, true), 500);
  assert.equal(splitHeight(800, 380, false), 800);
});

test('cover crop retains aspect ratio and favours the lower portrait action', () => {
  const portrait = coverFrame(390, 422, 404, 720, 0.65);
  assert.equal(portrait.width, 390);
  assert.ok(portrait.height > 422);
  assert.ok(portrait.top < (422 - portrait.height) / 2);
  const landscape = coverFrame(390, 422, 720, 404);
  assert.equal(landscape.height, 422);
  assert.ok(landscape.left < 0);
  assert.equal(landscape.top, 0);
});
