import assert from 'node:assert/strict';
import { test } from 'node:test';

import { backElevation, horizonTilt, spread, wallAngle, type Vec3 } from './geometry';
import { formatAngle, newId, photoMeta, steadyReading } from './meta';
import type { MotionSample, Wall } from './types';

const G = 9.81;
const rad = (deg: number) => (deg * Math.PI) / 180;
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

/** Gravity in the frame of a phone laid with its back on a wall `angle` past vertical, top up. */
function onWall(angle: number): Vec3 {
  return { x: 0, y: -G * Math.cos(rad(angle)), z: G * Math.sin(rad(angle)) };
}

test('a phone held upright looks at the horizon and lies flat on a vertical wall', () => {
  close(backElevation({ x: 0, y: -G, z: 0 }), 0);
  close(horizonTilt({ x: 0, y: -G, z: 0 }), 0);
});

test('face up the camera looks at the floor; face down at the ceiling', () => {
  close(backElevation({ x: 0, y: 0, z: -G }), -90);
  close(backElevation({ x: 0, y: 0, z: G }), 90);
});

test('the back of a phone on an overhang reads the angle past vertical', () => {
  for (const angle of [-10, 0, 25, 40, 60]) close(backElevation(onWall(angle)), angle);
});

test('top up and top down cancel a camera bump', () => {
  // The bump lifts the top of the phone 2° off the wall: the top-up reading looks 2° less steep,
  // the top-down one 2° steeper.
  close(wallAngle(onWall(40 - 2), onWall(40 + 2)), 40);
});

test('the horizon tilt is measured from the nearest way of holding the phone', () => {
  const turned = (deg: number) => ({ x: G * Math.sin(rad(deg)), y: -G * Math.cos(rad(deg)), z: 0 });
  close(horizonTilt(turned(3)), 3);
  close(horizonTilt(turned(-4)), -4);
  close(horizonTilt(turned(90 + 2)), 2);
});

test('spread is zero for a still phone and grows with shake', () => {
  close(spread([onWall(40), onWall(40), onWall(40)]), 0, 1e-5);
  close(spread([onWall(39), onWall(41)]), 1, 1e-6);
});

const sample = (t: number, gravity: Vec3): MotionSample => ({
  t,
  sensorT: t / 1000,
  gravity,
  rotation: null,
  rotationRate: null,
  orientation: 0,
});

test('a wall reading needs a full, still second', () => {
  const still = Array.from({ length: 60 }, (_, i) => sample(i * 20, onWall(40)));
  const reading = steadyReading(still, 1180);
  assert.ok(reading);
  close(reading.angle, 40, 1e-6);
  assert.equal(steadyReading(still.slice(-20), 1180), null, 'less than a second of samples');
  const shaky = still.map((s, i) => sample(s.t, onWall(i % 2 ? 38 : 42)));
  assert.equal(steadyReading(shaky, 1180), null);
});

const wall: Wall = {
  id: 'w1',
  createdAt: '2026-11-25T10:00:00.000Z',
  name: 'Moon 40',
  kind: 'moonboard',
  board: { layout: '2019', angle: 40 },
  statedAngle: 40,
  measured: null,
  notes: '',
};

test('a photo keeps gravity before the press and every sample around it', () => {
  const samples = Array.from({ length: 200 }, (_, i) => sample(i * 20, onWall(-30)));
  const meta = photoMeta({
    id: 'p1',
    wall,
    takenAt: new Date('2026-11-25T10:01:00.000Z'),
    file: 'p1.jpg',
    image: { width: 4000, height: 3000 },
    exif: { FocalLength: 5.1 },
    device: {
      platform: 'android',
      osName: 'Android',
      osVersion: '14',
      brand: 'google',
      manufacturer: 'Google',
      modelName: 'Pixel 8',
      modelId: null,
    },
    appVersion: '1.0.0',
    pictureSize: null,
    zoom: 0,
    pressedAt: 2000,
    savedAt: 2400,
    samples,
  });
  close(meta.motion.cameraElevation!, -30, 1e-6);
  assert.equal(meta.motion.samples[0].t, 1000);
  assert.equal(meta.motion.samples.at(-1)!.t, 2400);
  assert.equal(meta.wall.name, 'Moon 40');
  assert.equal('id' in meta.wall, false);
});

test('ids sort by time and angles read like the rest of the app', () => {
  assert.ok(newId(1000, () => 0.5) < newId(2000, () => 0));
  assert.equal(formatAngle(40), '40°');
  assert.equal(formatAngle(-5), '−5°');
  assert.equal(formatAngle(-0.04, 1), '0.0°');
  assert.equal(formatAngle(39.96, 1), '40.0°');
});
