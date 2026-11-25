import type { Vec3 } from './geometry';

/**
 * Wall photos: example data for the wall-angle and hold models. A wall is labelled once, then
 * photographed from many spots; every photo gets a JSON sidecar with everything known at the
 * shutter. Stored as files (`storage.ts`), never in the persisted store.
 */

export type WallKind = 'moonboard' | 'board' | 'gym';

/** A reading with the phone's back laid flat on the wall. */
export type WallReading = {
  /** Degrees past vertical from this reading alone. */
  angle: number;
  /** Mean gravity over the steady second, m/s² in the phone's frame. */
  gravity: Vec3;
  /** How still the phone was, RMS degrees. */
  spread: number;
  samples: number;
};

/** The reference angle: two readings, top up and top down, averaged. */
export type WallMeasurement = {
  angle: number;
  topUp: WallReading;
  topDown: WallReading;
  at: string;
};

export type Wall = {
  id: string;
  createdAt: string;
  name: string;
  kind: WallKind;
  /** The MoonBoard it is, when it is one. */
  board: { layout: string; angle: number } | null;
  /** Degrees past vertical as the gym or board says (negative for a slab). */
  statedAngle: number | null;
  measured: WallMeasurement | null;
  notes: string;
};

export type MotionSample = {
  /** JS clock, ms (`performance.now()`), the same clock as the shutter times. */
  t: number;
  /** The platform's sensor timestamp, seconds. */
  sensorT: number;
  gravity: Vec3;
  /** Radians: alpha around z, beta around x, gamma around y (Expo DeviceMotion). */
  rotation: { alpha: number; beta: number; gamma: number } | null;
  /** Degrees per second. */
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  /** Screen rotation: 0, 90, 180 or -90. */
  orientation: number;
};

export const PHOTO_SCHEMA = 1;

export type PhotoMeta = {
  schema: typeof PHOTO_SCHEMA;
  id: string;
  wallId: string;
  file: string;
  takenAt: string;
  image: { width: number; height: number };
  device: {
    platform: string;
    osName: string | null;
    osVersion: string | null;
    brand: string | null;
    manufacturer: string | null;
    modelName: string | null;
    modelId: string | null;
  };
  app: { version: string | null };
  camera: { facing: 'back'; zoom: number; pictureSize: string | null };
  /** The camera's EXIF as it came back, focal length included. */
  exif: Record<string, unknown> | null;
  motion: {
    /** JS clock when the shutter was pressed and when the photo came back. */
    pressedAt: number;
    savedAt: number;
    /** Mean gravity over the 300 ms before the press. */
    gravity: Vec3 | null;
    spread: number;
    /** Degrees the camera looked above the horizon, from `gravity`. */
    cameraElevation: number | null;
    /** Degrees the horizon was turned. */
    horizonTilt: number | null;
    /** Every sample from a second before the press until the photo came back. */
    samples: MotionSample[];
  };
  /** The wall's labels at the time, so a sidecar stands on its own. */
  wall: Omit<Wall, 'id' | 'createdAt'>;
};
