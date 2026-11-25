import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FIRST_RUN_TOTAL,
  LAUNCH_TOTAL,
  LOADING,
  PITCH,
  arrival,
  firstRunGround,
  firstRunMark,
  launchGround,
  launchLift,
  launchMark,
  LAUNCH,
  loadingBreath,
  loadingLift,
  stackedLockup,
} from './logo-motion';

test('the Pitch bars are equal, each one step higher, inside the box', () => {
  const steps = PITCH.bars.slice(1).map((b, i) => PITCH.bars[i].y - b.y);
  assert.deepEqual(steps, [14, 14]);
  for (const b of PITCH.bars) {
    assert.ok(b.x >= PITCH.bounds.x && b.x + PITCH.barWidth <= PITCH.bounds.x + PITCH.bounds.width);
    assert.ok(
      b.y >= PITCH.bounds.y && b.y + PITCH.barHeight <= PITCH.bounds.y + PITCH.bounds.height
    );
  }
});

test('loading lifts each bar 8 % in turn and returns it to rest', () => {
  for (const i of [0, 1, 2]) {
    const start = i * LOADING.stagger;
    assert.equal(loadingLift(start, i), 0);
    const peak = Math.min(...Array.from({ length: 1200 }, (_, t) => loadingLift(t, i)));
    assert.ok(Math.abs(peak + LOADING.lift) < 1e-3, `bar ${i} peaks at ${peak}`);
    assert.equal(loadingLift(start + LOADING.period * 0.8, i), 0);
  }
  // In turn: bar 1 has not left yet when bar 0 is at the top.
  assert.equal(loadingLift(0.2 * LOADING.period, 1) > loadingLift(0.2 * LOADING.period, 0), true);
});

test('loading is seamless across the loop and never jumps', () => {
  for (const i of [0, 1, 2]) {
    let prev = loadingLift(0, i);
    for (let t = 1; t <= 2 * LOADING.period; t++) {
      const v = loadingLift(t, i);
      assert.ok(Math.abs(v - prev) < 0.01, `bar ${i} jumps at ${t} ms`);
      prev = v;
    }
  }
});

test('the catch dips just below the line, softly', () => {
  const lowest = Math.max(...Array.from({ length: 1200 }, (_, t) => loadingLift(t, 0)));
  assert.ok(lowest > 0 && lowest <= LOADING.catch + 1e-9);
});

test('reduced motion breathes between full and dim without moving', () => {
  for (let t = 0; t < 3200; t += 40) {
    const o = loadingBreath(t, 1);
    assert.ok(o <= 1 && o >= 0.45 - 1e-9);
  }
});

test('launch starts on the native splash frame and ends fully gone', () => {
  assert.equal(launchGround(0), 1);
  assert.equal(launchMark(0).opacity, 1);
  for (const i of [0, 1, 2]) assert.equal(launchLift(0, i), 0);
  assert.equal(launchGround(LAUNCH_TOTAL), 0);
  assert.ok(LAUNCH_TOTAL <= 500, 'launch stays instant');
});

test('the mark leaves before the ground, so Glow never washes over the app', () => {
  for (let t = 0; t <= LAUNCH_TOTAL; t += 10) {
    assert.ok(launchMark(t).opacity <= launchGround(t) + 1e-9, `at ${t} ms`);
  }
  // The mark is gone while the ground is still mostly Night.
  assert.equal(launchMark(LAUNCH.groundDelay + 40).opacity, 0);
  assert.ok(launchGround(LAUNCH.groundDelay + 40) > 0.5);
  for (let t = 0; t <= FIRST_RUN_TOTAL; t += 10) {
    assert.ok(firstRunMark(t).opacity <= firstRunGround(t) + 1e-9, `first run at ${t} ms`);
  }
});

test('the screen underneath rises 8 pt and settles', () => {
  assert.equal(arrival(0, 100), 8);
  assert.equal(arrival(1000, 100), 0);
});

test('first run is a moment, not a wait', () => {
  assert.ok(FIRST_RUN_TOTAL <= 2200);
});

test('the stacked lockup follows the brand construction', () => {
  const l = stackedLockup(96);
  assert.ok(l.gap > 0);
  assert.ok(Math.abs(l.symbolHeight / 96 - 86 / 82) < 1e-9);
  assert.ok(l.wordWidth > 96 && l.wordWidth < 2.2 * 96);
});
