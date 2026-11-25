import type { TimerStatus } from './engine';
import type { Phase } from './intervals';

/**
 * The living field behind the session ground, as the target it chases. A phase change only moves
 * the target; every frame the field eases toward it, so a change retargets a system that is
 * already running and never restarts an animation (ElevenLabs' rule, borrowed).
 */
export type Energy = {
  /** How far the field's tones swing either side of the ground: 0 is a flat ground, 1 full. */
  amplitude: number;
  /** How fast the field drifts, in noise cells per second. */
  speed: number;
  /** How much each slow breath takes the amplitude down and back: 0 is steady, 1 a full breath. */
  breath: number;
};

/** A stopped clock: the field settles flat and still. */
export const STILL: Energy = { amplitude: 0, speed: 0, breath: 0 };

/** What each running phase asks of the field: Get ready low and slow, Hang high, rests breathe. */
export const ENERGY: Record<Phase, Energy> = {
  prep: { amplitude: 0.3, speed: 0.05, breath: 0 },
  hang: { amplitude: 1, speed: 0.16, breath: 0 },
  pause: { amplitude: 0.35, speed: 0.04, breath: 1 },
  rest: { amplitude: 0.35, speed: 0.04, breath: 1 },
  done: STILL,
};

/** The field's target: the phase's energy while the clock runs; idle, paused or done is still. */
export function energyTarget(status: TimerStatus, phase: Phase): Energy {
  return status === 'running' ? ENERGY[phase] : STILL;
}

/**
 * Time constants of the chase, in ms. Energy arrives as an event (a hang starting is about 95%
 * there in three time constants, under 300 ms) and leaves as a decay (about 2 s to settle). The
 * breath fades in and out slowly either way, so a rest never starts on a sudden dip.
 */
const TAU: Record<keyof Energy, { rise: number; fall: number }> = {
  amplitude: { rise: 90, fall: 650 },
  speed: { rise: 90, fall: 650 },
  breath: { rise: 900, fall: 900 },
};

function approach(
  current: number,
  target: number,
  dtMs: number,
  tau: { rise: number; fall: number }
) {
  'worklet';
  const ms = target > current ? tau.rise : tau.fall;
  return target + (current - target) * Math.exp(-dtMs / ms);
}

/**
 * One frame of the chase. Each value moves toward its target by a share that depends only on the
 * time that passed (`1 - e^(-dt/tau)`), so 60 and 120 Hz land on the same values, and it never
 * passes the target.
 */
export function chase(current: Energy, target: Energy, dtMs: number): Energy {
  'worklet';
  return {
    amplitude: approach(current.amplitude, target.amplitude, dtMs, TAU.amplitude),
    speed: approach(current.speed, target.speed, dtMs, TAU.speed),
    breath: approach(current.breath, target.breath, dtMs, TAU.breath),
  };
}

/** The field as it runs: its energy, and how far it has drifted through the noise. */
export type Field = { energy: Energy; drift: number };

export const FLAT: Field = { energy: STILL, drift: 0 };

/**
 * Advance the field by one frame. Drift is the integral of speed, so a change of speed bends the
 * motion instead of jumping it, and a still field stays where it stopped.
 */
export function stepField(field: Field, target: Energy, dtMs: number): Field {
  'worklet';
  const energy = chase(field.energy, target, dtMs);
  const drift = field.drift + ((field.energy.speed + energy.speed) / 2) * (dtMs / 1000);
  return { energy, drift };
}

/** One breath, in and out, at a resting climber's pace. */
export const BREATH_MS = 5000;
/** At full breath the bottom of each breath takes the amplitude down by this share. */
const BREATH_DEPTH = 0.6;

/** The amplitude the field shows at `clockMs`: its energy, swelling with the breath. */
export function swell(energy: Energy, clockMs: number): number {
  'worklet';
  const out = 0.5 - 0.5 * Math.cos((2 * Math.PI * clockMs) / BREATH_MS);
  return energy.amplitude * (1 - BREATH_DEPTH * energy.breath * out);
}
