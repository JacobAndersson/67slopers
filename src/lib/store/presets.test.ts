import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validate } from '../workout-steps';
import { estimateDuration } from '../workout-summary';
import { LEVELS, makePresetWorkouts, PRESETS, SEEDED_PRESET_IDS, templateSteps } from './presets';

test('every preset is valid, unique and between five and forty minutes', () => {
  const ids = PRESETS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  assert.equal(new Set(PRESETS.map((p) => p.name)).size, PRESETS.length, 'names are unique');
  for (const preset of PRESETS) {
    assert.deepEqual(validate(preset.steps), [], preset.name);
    assert.ok(preset.description.length > 40, `${preset.name} has a description`);
    const minutes = estimateDuration(preset) / 60;
    assert.ok(minutes >= 5 && minutes <= 40, `${preset.name} lasts ${minutes.toFixed(1)} min`);
  }
});

test('each level has at least three presets', () => {
  for (const level of LEVELS) {
    assert.ok(PRESETS.filter((p) => p.level === level).length >= 3, level);
  }
});

test('seeding copies the three starters with stable ids and independent steps', () => {
  const seeded = makePresetWorkouts(new Date('2026-01-01T00:00:00Z'));
  assert.deepEqual(
    seeded.map((w) => w.name),
    SEEDED_PRESET_IDS.map((id) => PRESETS.find((p) => p.id === id)!.name)
  );
  assert.ok(seeded.every((w) => w.isPreset));
  assert.deepEqual(
    seeded.map((w) => w.id),
    SEEDED_PRESET_IDS.map((id) => `seeded-${id}`),
    'seeded ids are deterministic so SSR and hydration agree'
  );
  const source = PRESETS.find((p) => p.id === SEEDED_PRESET_IDS[0])!;
  assert.deepEqual(seeded[0].steps, source.steps);
  assert.notEqual(seeded[0].steps, source.steps, 'steps are cloned, not shared');
  assert.deepEqual(templateSteps(), source.steps);
});
