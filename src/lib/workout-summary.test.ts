import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PRESETS } from './store/presets';
import { estimateDuration, setsLine, summaryLine } from './workout-summary';

const [repeaters, maxHangs, density] = PRESETS;

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
        { kind: 'repeat', times: 3, skipLastRest: true, steps: [{ kind: 'hang', seconds: 10 }] },
      ],
    }),
    '20s · rest 1:00 · 3 × 10s'
  );
  assert.equal(summaryLine({ steps: [] }), '');
});

test('estimateDuration counts prep, hangs, pauses and rests between sets', () => {
  assert.equal(estimateDuration(repeaters), 10 + 6 * (6 * 7 + 5 * 3) + 5 * 180);
  assert.equal(estimateDuration(maxHangs), 10 + 5 * 10 + 4 * 180);
  assert.equal(setsLine(4, 6), '4/6 sets');
});
