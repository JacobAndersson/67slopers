import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BREATH_MS,
  chase,
  ENERGY,
  energyTarget,
  FLAT,
  STILL,
  stepField,
  swell,
  type Energy,
  type Field,
} from './energy';

/** Run the chase for `ms` in frames of `dt` (the last one shortened to land on `ms`). */
function run(from: Energy, target: Energy, ms: number, dt: number): Energy[] {
  const out: Energy[] = [];
  let energy = from;
  for (let t = 0; t < ms - 1e-9; t += dt) {
    energy = chase(energy, target, Math.min(dt, ms - t));
    out.push(energy);
  }
  return out;
}
const last = <T>(list: T[]) => list[list.length - 1];
const KEYS = ['amplitude', 'speed', 'breath'] as const;

test('a running phase sets the target, and any stopped clock asks for still', () => {
  assert.deepEqual(energyTarget('running', 'hang'), ENERGY.hang);
  assert.deepEqual(energyTarget('running', 'rest'), ENERGY.rest);
  for (const status of ['idle', 'paused', 'done', 'ended'] as const)
    assert.deepEqual(energyTarget(status, 'hang'), STILL);
});

test('the hang is the high phase, Get ready and the rests are low, and only rests breathe', () => {
  for (const phase of ['prep', 'pause', 'rest'] as const) {
    assert.ok(ENERGY[phase].amplitude <= ENERGY.hang.amplitude / 2, phase);
    assert.ok(ENERGY[phase].speed <= ENERGY.hang.speed / 2, phase);
  }
  assert.equal(ENERGY.hang.breath, 0);
  assert.ok(ENERGY.rest.breath > 0 && ENERGY.pause.breath > 0);
  assert.deepEqual(ENERGY.done, STILL);
});

test('a hang arrives like an event: 90% of the way within 300 ms', () => {
  const from = ENERGY.rest;
  const at300 = last(run(from, ENERGY.hang, 300, 16));
  for (const key of ['amplitude', 'speed'] as const) {
    const covered = (at300[key] - from[key]) / (ENERGY.hang[key] - from[key]);
    assert.ok(covered >= 0.9, `${key} covered ${covered}`);
  }
});

test('it never passes its target, rising or falling, whatever the frame times', () => {
  const jitter = [4, 16, 33, 8, 100, 16, 250, 1];
  let energy = STILL;
  for (const target of [ENERGY.hang, ENERGY.rest, STILL, ENERGY.prep, ENERGY.hang]) {
    for (let i = 0; i < 200; i++) {
      const next = chase(energy, target, jitter[i % jitter.length]);
      for (const key of KEYS) {
        const before = target[key] - energy[key];
        const after = target[key] - next[key];
        assert.ok(Math.sign(after) === Math.sign(before) || after === 0, key);
        assert.ok(Math.abs(after) <= Math.abs(before), key);
      }
      energy = next;
    }
  }
});

test('the frame rate does not change where it lands', () => {
  const at = (dt: number) => last(run(ENERGY.rest, ENERGY.hang, 1000, dt));
  const reference = at(1000 / 60);
  for (const dt of [1000 / 30, 1000 / 120, 7, 1000]) {
    const other = at(dt);
    for (const key of KEYS) assert.ok(Math.abs(other[key] - reference[key]) < 1e-9, `${dt} ${key}`);
  }
});

test('pausing decays the field instead of cutting it, and it settles still', () => {
  const frames = run(ENERGY.hang, STILL, 3000, 16);
  assert.ok(frames[5].amplitude > 0.8 * ENERGY.hang.amplitude, 'still visible 100 ms in');
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i].amplitude <= frames[i - 1].amplitude);
  assert.ok(last(frames).amplitude < 0.02 && last(frames).speed < 0.01);
});

test('resuming retargets from where the decay stands, never from zero or from the end', () => {
  const decayed = last(run(ENERGY.hang, STILL, 400, 16));
  const resumed = run(decayed, ENERGY.hang, 300, 16);
  assert.ok(resumed[0].amplitude > decayed.amplitude, 'moves on from the decayed value');
  assert.ok(resumed[0].amplitude < ENERGY.hang.amplitude - 0.05, 'does not jump to the target');
  const covered =
    (last(resumed).amplitude - decayed.amplitude) / (ENERGY.hang.amplitude - decayed.amplitude);
  assert.ok(covered >= 0.9);
});

test('the field drifts with its speed, bends instead of jumping, and stops when still', () => {
  let field: Field = FLAT;
  const steps: number[] = [];
  const drive = (target: Energy, ms: number) => {
    for (let t = 0; t < ms; t += 16) {
      const next = stepField(field, target, 16);
      steps.push(next.drift - field.drift);
      field = next;
    }
  };
  drive(ENERGY.hang, 2000);
  const moving = field.drift;
  assert.ok(moving > 0.2, `drifted ${moving}`);
  drive(STILL, 5000);
  for (const step of steps) assert.ok(step >= 0 && step <= ENERGY.hang.speed * 0.016 + 1e-12);
  const stopped = field.drift;
  drive(STILL, 1000);
  assert.ok(field.drift - stopped < 1e-3);
});

test('a breath swells the amplitude down and back once every BREATH_MS', () => {
  const samples = (energy: Energy) =>
    Array.from({ length: 51 }, (_, i) => swell(energy, (i / 50) * BREATH_MS));
  for (const value of samples(ENERGY.hang)) assert.equal(value, ENERGY.hang.amplitude);
  const breathing = samples(ENERGY.rest);
  assert.ok(Math.max(...breathing) <= ENERGY.rest.amplitude + 1e-12);
  assert.ok(Math.min(...breathing) < 0.6 * ENERGY.rest.amplitude);
  assert.ok(Math.min(...breathing) > 0);
  assert.ok(Math.abs(breathing[0] - last(breathing)) < 1e-12, 'one breath is one cycle');
});
