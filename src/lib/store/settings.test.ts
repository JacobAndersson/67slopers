import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSettings } from './settings';
import { DEFAULT_SETTINGS } from './types';

test('missing settings use defaults', () => {
  for (const value of [undefined, null, {}, false])
    assert.deepEqual(normalizeSettings(value), DEFAULT_SETTINGS);
});
test('old and partial settings preserve false without losing new defaults', () => {
  assert.deepEqual(normalizeSettings({ sound: false, vibration: false }), {
    sound: false,
    vibration: false,
    genZMode: false,
  });
  assert.deepEqual(normalizeSettings({ genZMode: true }), {
    sound: true,
    vibration: true,
    genZMode: true,
  });
  assert.deepEqual(normalizeSettings({ sound: 'false', genZMode: 1 }), DEFAULT_SETTINGS);
});

test('versions 1–4 preserve records and initialize the new preference', async () => {
  const { migrateStore } = await import('./migrate');
  for (const version of [1, 2, 3, 4]) {
    const workout = { id: 'saved', name: 'Test', steps: [{ kind: 'hang', seconds: 7 }] };
    const session = { id: 'session', snapshot: workout };
    const result = migrateStore(
      { workouts: [workout], sessions: [session], settings: { sound: false, vibration: false } },
      version
    );
    assert.deepEqual(result.settings, {
      sound: version === 1,
      vibration: version === 1,
      genZMode: false,
    });
    assert.equal((result.workouts as (typeof workout)[])[0].id, 'saved');
    assert.equal((result.sessions as (typeof session)[])[0].snapshot.steps[0].seconds, 7);
    if (version === 4) assert.equal((result.workouts as (typeof workout)[])[0], workout);
  }
});
