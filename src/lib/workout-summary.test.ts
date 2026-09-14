import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findPreset } from './store/presets';
import {
  estimateDuration,
  hangOutcomes,
  hangsLine,
  setsLine,
  summaryLine,
} from './workout-summary';

const repeaters = findPreset('repeaters-7-3')!;
const maxHangs = findPreset('max-hangs')!;
const density = findPreset('density-hangs')!;

test('summaryLine reads sets, reps and rests', () => {
  assert.equal(summaryLine(repeaters), '6 × (6 × 7s / 3s · rest 3:00)');
  assert.equal(summaryLine(maxHangs), '5 × (10s · rest 3:00)');
  assert.equal(summaryLine(density), '4 × (30s · rest 2:00)');
  assert.equal(
    summaryLine({
      steps: [
        { kind: 'prep', seconds: 10 },
        { kind: 'hang', seconds: 20, label: 'warm up' },
        { kind: 'rest', seconds: 60 },
        { kind: 'repeat', times: 3, steps: [{ kind: 'hang', seconds: 10 }] },
      ],
    }),
    '20s · rest 1:00 · 3 × 10s'
  );
  assert.equal(summaryLine({ steps: [] }), '');
});

test('estimateDuration counts prep, hangs, pauses and rests between sets', () => {
  assert.equal(estimateDuration(repeaters), 10 + 6 * (6 * 7 + 6 * 3) + 6 * 180);
  assert.equal(estimateDuration(maxHangs), 10 + 5 * 10 + 5 * 180);
  assert.equal(setsLine(4, 6), '4/6 sets');
});

test('hangOutcomes sorts hangs into done, cut short and skipped', () => {
  const hangs = [
    { planned: 10, actual: 10 },
    { planned: 10, actual: 6.5 },
    { planned: 10, actual: 0.4 },
    { planned: 10, actual: 10 },
  ];
  const outcomes = hangOutcomes(maxHangs, hangs);
  assert.deepEqual(outcomes, { planned: 5, done: 2, cutShort: 1, skipped: 1 });
  assert.equal(hangsLine(outcomes), '2/5 hangs · 1 cut short · 1 skipped');
  assert.equal(hangsLine(hangOutcomes(repeaters, [])), '0/36 hangs');
});
