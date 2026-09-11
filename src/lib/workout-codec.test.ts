import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findPreset, PRESETS } from './store/presets';
import type { Step } from './store/types';
import { decodeWorkout, encodeWorkout } from './workout-codec';

const ok = (text: string): { name?: string; steps: Step[] } => {
  const result = decodeWorkout(text);
  assert.ok(result.ok, `expected to decode: ${text}`);
  return result;
};

test('presets round-trip and stay short', () => {
  for (const preset of PRESETS) {
    const text = encodeWorkout(preset);
    const decoded = ok(text);
    assert.equal(decoded.name, preset.name);
    assert.deepEqual(decoded.steps, preset.steps);
  }
  const repeaters = encodeWorkout({ steps: findPreset('repeaters-7-3')!.steps });
  assert.equal(repeaters, 'v1 p10 6(6(h7 r3) r180)');
  assert.ok(repeaters.length < 32);
});

test('labels and nesting survive the trip', () => {
  const steps: Step[] = [
    { kind: 'prep', seconds: 10 },
    { kind: 'hang', seconds: 10, label: 'Sloper "big" 🧗' },
    {
      kind: 'repeat',
      times: 3,
      steps: [
        { kind: 'repeat', times: 2, steps: [{ kind: 'hang', seconds: 7 }] },
        { kind: 'rest', seconds: 90, label: 'shake out' },
      ],
    },
  ];
  const text = encodeWorkout({ name: 'Mixed "bag"', steps });
  assert.equal(text, `v1 "Mixed 'bag'" p10 h10"Sloper 'big' 🧗" 3(2(h7) r90"shake out")`);
  const decoded = ok(text);
  assert.equal(decoded.name, "Mixed 'bag'");
  assert.deepEqual(decoded.steps, [
    steps[0],
    { kind: 'hang', seconds: 10, label: "Sloper 'big' 🧗" },
    steps[2],
  ]);
});

test('whitespace is optional and names are optional', () => {
  assert.deepEqual(ok('v1p10 6( 6(h7 r3)r180 )').steps, findPreset('repeaters-7-3')!.steps);
  assert.equal(ok('v1 h7').name, undefined);
  assert.deepEqual(ok('  v1  "  Spaced  "  h7  ').name, 'Spaced');
});

test('bad input is refused with a message and never throws', () => {
  const bad = ['', 'v2 h7', 'v1', 'v1 x7', 'v1 h', 'v1 6(h7', 'v1 h7)', 'v1 6h7', 'v1 "open h7'];
  for (const text of bad) {
    const result = decodeWorkout(text);
    assert.equal(result.ok, false, `expected a refusal for: ${text}`);
  }
  const deep = decodeWorkout('v1 2(2(2(h7)))');
  assert.equal(deep.ok, false);
  assert.match(deep.ok ? '' : deep.error, /nested/);
  const range = decodeWorkout('v1 h0');
  assert.equal(range.ok, false);
  const times = decodeWorkout('v1 100(h7)');
  assert.equal(times.ok, false);
});

test('board and holds round-trip and are checked against the board', () => {
  const steps: Step[] = [
    { kind: 'prep', seconds: 10 },
    {
      kind: 'repeat',
      times: 5,
      steps: [
        { kind: 'hang', seconds: 10, holds: ['edge-22'], label: 'half crimp' },
        { kind: 'rest', seconds: 180 },
      ],
    },
    { kind: 'hang', seconds: 10, holds: ['edge-big-l', 'edge-big-r'] },
  ];
  const text = encodeWorkout({ name: 'Max hangs', board: 'beastmaker-2000', steps });
  assert.equal(
    text,
    'v1 "Max hangs" @beastmaker-2000 p10 5(h10[edge-22]"half crimp" r180) h10[edge-big-l,edge-big-r]'
  );
  const decoded = decodeWorkout(text);
  assert.ok(decoded.ok);
  assert.equal(decoded.board, 'beastmaker-2000');
  assert.deepEqual(decoded.steps, steps);

  assert.equal(decodeWorkout('v1 @beastmaker-3000 h7').ok, false);
  assert.equal(
    decodeWorkout('v1 @beastmaker-1000 h7[edge-22]').ok,
    false,
    'hold from the other board'
  );
  assert.equal(decodeWorkout('v1 h7[sloper-20]').ok, false, 'holds need a board');
  assert.equal(decodeWorkout('v1 @beastmaker-1000 h7[sloper-20').ok, false, 'unterminated');
  const plain = decodeWorkout('v1 @beastmaker-1000 h7');
  assert.ok(plain.ok && plain.board === 'beastmaker-1000' && !('holds' in plain.steps[0]));
});
