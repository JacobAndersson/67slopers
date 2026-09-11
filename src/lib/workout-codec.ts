import { BOARD_IDS, getBoard, type BoardId } from './boards';
import { Decoder, Encoder } from './codec/arith';
import { hasValidCheckDigit, withCheckDigit } from './codec/check';
import { normalizeDigits } from './codec/digits';
import { isNeedsUpdate, NEEDS_UPDATE, needsUpdate } from './codec/errors';
import { M, secondsCoder, STEP_KINDS, type CodecStepKind } from './codec/models';
import { normalizeText, readText, writeText } from './codec/text';
import { codecGrips } from './codec/vocab';
import { PRESETS } from './store/presets';
import type { Step, TimedStep } from './store/types';
import { validateWorkout } from './workout-board';
import { cloneSteps, LIMITS, sameTimings } from './workout-steps';

/**
 * A workout as a short decimal code, for QR codes, share messages and typing from a poster.
 *
 * The workout is arithmetic-coded (see `codec/arith.ts`) against a frozen model of what
 * hangboard workouts look like (`codec/models.ts`): an unchanged built-in workout is just its
 * index; otherwise the name, board, steps, durations, repeat counts, labels and grips are
 * coded with probabilities that make common choices (a 10 s get-ready, 7:3 repeaters, three
 * minutes between sets, dictionary words like "half crimp") nearly free. Digits suit QR numeric
 * mode, which packs them at 3.3 bits each. A final Damm check digit catches typing mistakes,
 * and decoding re-encodes the result, so only the one canonical code for a workout is accepted.
 */
export type DecodedWorkout =
  | { ok: true; name?: string; board?: BoardId; steps: Step[]; description?: string }
  | { ok: false; error: string };

export type ShareableWorkout = { name?: string; board?: BoardId; steps: Step[] };

export const CODEC_ERRORS = {
  notACode: 'This is not a 67slopers workout code.',
  typo: 'That code does not add up. Check the digits for a typo.',
  needsUpdate: NEEDS_UPDATE,
} as const;

const PRESET = 0;
const CUSTOM = 1;
const NO_HOLDS = 0;
const SAME_HOLDS = 1;
const NEW_HOLDS = 2;

type Context = { grips: string[][] | null; previousGrip: number; timedSteps: number };

/** The code for a valid workout. Throws with the first validation problem otherwise. */
export function encodeWorkout(workout: ShareableWorkout): string {
  const errors = validateWorkout(workout);
  if (errors.length) throw new RangeError(errors[0]);
  const enc = new Encoder();
  enc.encode(M.version, 0);
  const name = normalizeText(workout.name ?? '');
  const preset = workout.board
    ? -1
    : PRESETS.findIndex((p) => p.name === name && sameTimings({ steps: p.steps }, workout));
  if (preset >= 0) {
    enc.encode(M.workoutKind, PRESET);
    enc.encode(M.presetIndex, preset);
    return withCheckDigit(enc.finish());
  }
  enc.encode(M.workoutKind, CUSTOM);
  enc.encode(M.hasName, name ? 1 : 0);
  if (name) writeText(enc, name);
  const board = getBoard(workout.board);
  enc.encode(M.hasBoard, board ? 1 : 0);
  if (board) enc.encode(M.boardIndex, BOARD_IDS.indexOf(board.id as BoardId));
  const context: Context = {
    grips: board ? codecGrips(board) : null,
    previousGrip: -1,
    timedSteps: 0,
  };
  writeSteps(enc, workout.steps, 0, context);
  return withCheckDigit(enc.finish());
}

export function decodeWorkout(input: string): DecodedWorkout {
  const digits = normalizeDigits(input);
  if (digits.length < 2) return { ok: false, error: CODEC_ERRORS.notACode };
  if (!hasValidCheckDigit(digits)) return { ok: false, error: CODEC_ERRORS.typo };
  let workout: ShareableWorkout & { description?: string };
  try {
    workout = readWorkout(new Decoder(digits.slice(0, -1)));
  } catch (e) {
    return {
      ok: false,
      error: isNeedsUpdate(e) ? CODEC_ERRORS.needsUpdate : CODEC_ERRORS.notACode,
    };
  }
  // Any digit string decodes to something; only the exact code of a valid workout counts.
  try {
    if (encodeWorkout(workout) !== digits) return { ok: false, error: CODEC_ERRORS.notACode };
  } catch {
    return { ok: false, error: CODEC_ERRORS.notACode };
  }
  return { ok: true, ...workout };
}

function readWorkout(dec: Decoder): ShareableWorkout & { description?: string } {
  if (dec.decode(M.version) !== 0) needsUpdate();
  if (dec.decode(M.workoutKind) === PRESET) {
    const preset = PRESETS[dec.decode(M.presetIndex)] ?? needsUpdate();
    return { name: preset.name, steps: cloneSteps(preset.steps), description: preset.description };
  }
  const name = dec.decode(M.hasName) ? readText(dec) : undefined;
  const board = dec.decode(M.hasBoard)
    ? (BOARD_IDS[dec.decode(M.boardIndex)] ?? needsUpdate())
    : undefined;
  const manifest = getBoard(board);
  const context: Context = {
    grips: manifest ? codecGrips(manifest) : null,
    previousGrip: -1,
    timedSteps: 0,
  };
  const steps = readSteps(dec, 0, context);
  return { ...(name ? { name } : {}), ...(board ? { board } : {}), steps };
}

function writeSteps(enc: Encoder, steps: Step[], depth: number, context: Context): void {
  M.stepCount[depth].encode(enc, steps.length);
  let previous: 'start' | CodecStepKind = 'start';
  for (const step of steps) {
    enc.encode(M.kind[depth][previous], STEP_KINDS.indexOf(step.kind));
    previous = step.kind;
    if (step.kind === 'repeat') {
      M.times[Math.min(depth, 1)].encode(enc, step.times);
      writeSteps(enc, step.steps, depth + 1, context);
      continue;
    }
    secondsCoder(step.kind, depth).encode(enc, step.seconds);
    const label = normalizeText(step.label ?? '');
    enc.encode(step.kind === 'hang' ? M.hasLabel.hang : M.hasLabel.other, label ? 1 : 0);
    if (label) writeText(enc, label);
    if (step.kind === 'hang' && context.grips) writeHolds(enc, step.holds, context, context.grips);
  }
}

function readSteps(dec: Decoder, depth: number, context: Context): Step[] {
  const count = M.stepCount[depth].decode(dec);
  const steps: Step[] = [];
  let previous: 'start' | CodecStepKind = 'start';
  for (let i = 0; i < count; i++) {
    const kind: CodecStepKind = STEP_KINDS[dec.decode(M.kind[depth][previous])];
    previous = kind;
    if (kind === 'repeat') {
      const times = M.times[Math.min(depth, 1)].decode(dec);
      steps.push({ kind, times, steps: readSteps(dec, depth + 1, context) });
      continue;
    }
    if (++context.timedSteps > LIMITS.maxSteps) throw new RangeError('Too many steps.');
    const step: TimedStep = { kind, seconds: secondsCoder(kind, depth).decode(dec) };
    if (dec.decode(kind === 'hang' ? M.hasLabel.hang : M.hasLabel.other))
      step.label = readText(dec);
    if (kind === 'hang' && context.grips) {
      const holds = readHolds(dec, context, context.grips);
      if (holds) step.holds = holds;
    }
    steps.push(step);
  }
  return steps;
}

function writeHolds(
  enc: Encoder,
  holds: string[] | undefined,
  context: Context,
  grips: string[][]
): void {
  const wanted = [...(holds ?? [])].sort().join(',');
  const index = wanted ? grips.findIndex((g) => [...g].sort().join(',') === wanted) : -1;
  const model = context.previousGrip >= 0 ? M.holdsNext : M.holdsFirst;
  if (index < 0) {
    enc.encode(model, NO_HOLDS);
    return;
  }
  if (index === context.previousGrip) {
    enc.encode(model, SAME_HOLDS);
  } else {
    enc.encode(model, NEW_HOLDS);
    enc.encode(M.gripIndex, index);
  }
  context.previousGrip = index;
}

function readHolds(dec: Decoder, context: Context, grips: string[][]): string[] | undefined {
  const choice = dec.decode(context.previousGrip >= 0 ? M.holdsNext : M.holdsFirst);
  if (choice === NO_HOLDS) return undefined;
  const index = choice === SAME_HOLDS ? context.previousGrip : dec.decode(M.gripIndex);
  const grip = grips[index] ?? needsUpdate();
  context.previousGrip = index;
  return [...grip];
}
