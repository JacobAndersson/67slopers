import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findPreset } from './store/presets';
import { overviewLine, protocolLine } from './workout-words';

const line = (id: string) => protocolLine(findPreset(id)!).replace(/ {2}/g, ' ');

test('classic workouts read as the design lists them', () => {
  assert.equal(line('repeaters-7-3'), '6 sets · 6 × 7 s on, 3 s off');
  assert.equal(line('max-hangs'), '5 × 10 s · rest 3:00');
  assert.equal(line('density-hangs'), '4 × 30 s · rest 2:00');
  assert.equal(line('two-grip-repeaters'), '2 grips · 3 sets each, 7 s on, 3 s off');
  assert.equal(line('one-arm-hangs'), '5 × 8 s each arm · rest 2:30');
  assert.equal(line('three-grip-max-hangs'), '3 grips · 3 × 10 s each');
  assert.equal(line('seven-fifty-three'), '3 sets · 3 × 7 s on, 53 s off');
});

test('the overview line names the recovery', () => {
  assert.equal(
    overviewLine(findPreset('repeaters-7-3')!).replace(/ {2}/g, ' '),
    '6 sets · 7 s on, 3 s off · recover 3:00'
  );
});

test('a workout without repeats counts its hangs', () => {
  const ladder = {
    steps: [
      { kind: 'hang' as const, seconds: 10 },
      { kind: 'hang' as const, seconds: 25 },
    ],
  };
  assert.equal(protocolLine(ladder).replace(/ {2}/g, ' '), '2 hangs · 10–25 s');
});
