import assert from 'node:assert/strict';
import { test } from 'node:test';

import { expandWorkout, totalSeconds } from './intervals';

const repeaters = {
  prepSeconds: 10,
  blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 6, restSeconds: 180, sets: 6 }],
};
const maxHangs = {
  prepSeconds: 10,
  blocks: [{ hangSeconds: 10, pauseSeconds: 0, reps: 1, restSeconds: 180, sets: 5 }],
};

test('repeaters expand to prep, 6 hangs and 5 pauses per set, rests between sets, done', () => {
  const xs = expandWorkout(repeaters);
  // 1 prep + 6 sets × (6 hang + 5 pause) + 5 rests + 1 done
  assert.equal(xs.length, 1 + 6 * 11 + 5 + 1);
  assert.equal(xs[0].phase, 'prep');
  assert.equal(xs[1].phase, 'hang');
  assert.equal(xs[2].phase, 'pause');
  assert.equal(xs[xs.length - 1].phase, 'done');
  const rests = xs.filter((i) => i.phase === 'rest');
  assert.equal(rests.length, 5);
  assert.equal(totalSeconds(xs), 10 + 6 * (6 * 7 + 5 * 3) + 5 * 180);
});

test('zero-length pauses are skipped for single-rep sets', () => {
  const xs = expandWorkout(maxHangs);
  assert.deepEqual(
    xs.map((i) => i.phase),
    ['prep', 'hang', 'rest', 'hang', 'rest', 'hang', 'rest', 'hang', 'rest', 'hang', 'done']
  );
});

test('set and rep counters are 0-based with totals', () => {
  const xs = expandWorkout(repeaters);
  const lastHangOfSet2 = xs.filter((i) => i.phase === 'hang' && i.setIndex === 1).at(-1)!;
  assert.equal(lastHangOfSet2.repIndex, 5);
  assert.equal(lastHangOfSet2.repCount, 6);
  assert.equal(lastHangOfSet2.setCount, 6);
});
