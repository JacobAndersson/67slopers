import { backElevation, horizonTilt, mean, spread } from './geometry';
import type { MotionSample, PhotoMeta, Wall, WallKind, WallReading } from './types';
import { PHOTO_SCHEMA } from './types';

/** Gravity at the shutter is the mean of this window before the press. */
export const PRESS_WINDOW_MS = 300;
/** Samples kept in a sidecar from this long before the press. */
export const KEEP_BEFORE_MS = 1000;
/** A wall reading is taken once the phone has been this still for this long. */
export const STEADY_MS = 1000;
export const STEADY_SPREAD = 0.25;

/** A sortable, unique id: time first, then a little randomness. */
export function newId(now = Date.now(), random = Math.random): string {
  return `${now.toString(36).padStart(9, '0')}${Math.floor(random() * 36 ** 4)
    .toString(36)
    .padStart(4, '0')}`;
}

export function samplesBetween(samples: readonly MotionSample[], from: number, to: number) {
  return samples.filter((s) => s.t >= from && s.t <= to);
}

/** A wall reading from the last `STEADY_MS` of samples, or null while the phone is moving. */
export function steadyReading(samples: readonly MotionSample[], now: number): WallReading | null {
  const window = samplesBetween(samples, now - STEADY_MS, now);
  if (window.length < 10 || window[0].t > now - STEADY_MS * 0.9) return null;
  const vectors = window.map((s) => s.gravity);
  const s = spread(vectors);
  if (s > STEADY_SPREAD) return null;
  const gravity = mean(vectors)!;
  return { angle: backElevation(gravity), gravity, spread: s, samples: window.length };
}

type PhotoInput = {
  id: string;
  wall: Wall;
  takenAt: Date;
  file: string;
  image: { width: number; height: number };
  exif: Record<string, unknown> | null;
  device: PhotoMeta['device'];
  appVersion: string | null;
  pictureSize: string | null;
  zoom: number;
  pressedAt: number;
  savedAt: number;
  samples: readonly MotionSample[];
};

export function photoMeta(input: PhotoInput): PhotoMeta {
  const before = samplesBetween(input.samples, input.pressedAt - PRESS_WINDOW_MS, input.pressedAt);
  const vectors = before.map((s) => s.gravity);
  const gravity = mean(vectors);
  const { id: _id, createdAt: _createdAt, ...labels } = input.wall;
  return {
    schema: PHOTO_SCHEMA,
    id: input.id,
    wallId: input.wall.id,
    file: input.file,
    takenAt: input.takenAt.toISOString(),
    image: input.image,
    device: input.device,
    app: { version: input.appVersion },
    camera: { facing: 'back', zoom: input.zoom, pictureSize: input.pictureSize },
    exif: input.exif,
    motion: {
      pressedAt: input.pressedAt,
      savedAt: input.savedAt,
      gravity,
      spread: spread(vectors),
      cameraElevation: gravity ? backElevation(gravity) : null,
      horizonTilt: gravity ? horizonTilt(gravity) : null,
      samples: samplesBetween(input.samples, input.pressedAt - KEEP_BEFORE_MS, input.savedAt),
    },
    wall: labels,
  };
}

/** "40°", "−5°" (a slab), with one decimal only when asked. */
export function formatAngle(angle: number, decimals = 0): string {
  const text = Math.abs(angle).toFixed(decimals);
  return `${angle < 0 && Number(text) !== 0 ? '−' : ''}${text}°`;
}

/** The angle a wall is known by: measured (to a tenth) first, then what the board or gym says. */
export function wallAngleLabel(wall: Wall): string | null {
  if (wall.measured) return formatAngle(wall.measured.angle, 1);
  if (wall.statedAngle !== null) return formatAngle(wall.statedAngle);
  return null;
}

export const KIND_LABEL: Record<WallKind, string> = {
  moonboard: 'MoonBoard',
  board: 'Board',
  gym: 'Gym wall',
};
