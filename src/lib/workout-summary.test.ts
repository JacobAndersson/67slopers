import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimateDuration, summaryLine } from './workout-summary';

test('summaryLine for repeaters and single-rep sets', () => {
  assert.equal(
    summaryLine({
      prepSeconds: 10,
      blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 6, restSeconds: 180, sets: 6 }],
    }),
    '6 × 6 · 7s / 3s · rest 3:00'
  );
  assert.equal(
    summaryLine({
      prepSeconds: 10,
      blocks: [{ hangSeconds: 10, pauseSeconds: 0, reps: 1, restSeconds: 180, sets: 5 }],
    }),
    '5 × 1 · 10s · rest 3:00'
  );
});

test('estimateDuration counts prep, hangs, pauses and rests between sets', () => {
  assert.equal(
    estimateDuration({
      prepSeconds: 10,
      blocks: [{ hangSeconds: 7, pauseSeconds: 3, reps: 6, restSeconds: 180, sets: 6 }],
    }),
    10 + 6 * (6 * 7 + 5 * 3) + 5 * 180
  );
});
