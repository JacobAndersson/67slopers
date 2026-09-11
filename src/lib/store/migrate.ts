import type { RepeatStep, Step, StepKind, TimedStep, WorkoutTimings } from './types';

/** The v2 shape: one prep time and a list of blocks of identical sets. */
export type LegacyBlock = {
  label?: string;
  hangSeconds: number;
  pauseSeconds: number;
  reps: number;
  restSeconds: number;
  sets: number;
};

export type LegacyTimings = { prepSeconds: number; blocks: LegacyBlock[] };

export function isLegacyTimings(value: unknown): value is LegacyTimings {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { blocks?: unknown }).blocks)
  );
}

const timed = (kind: StepKind, seconds: number, label?: string): TimedStep =>
  label ? { kind, seconds, label } : { kind, seconds };

const repeat = (times: number, steps: Step[]): RepeatStep => ({ kind: 'repeat', times, steps });

/**
 * Converts blocks to steps so that the timer runs exactly the same intervals: reps become an
 * inner repeat of hang + rest, sets an outer repeat with the rest after each round, and the
 * rest a block used to put before the next block becomes an explicit step between them.
 */
export function blocksToSteps(legacy: LegacyTimings): WorkoutTimings {
  const steps: Step[] = [];
  if (legacy.prepSeconds > 0) steps.push(timed('prep', legacy.prepSeconds));

  legacy.blocks.forEach((block, i) => {
    const hang = timed('hang', block.hangSeconds, block.label);
    let round: Step = hang;
    if (block.reps > 1) {
      round = repeat(
        block.reps,
        block.pauseSeconds > 0 ? [hang, timed('rest', block.pauseSeconds)] : [hang]
      );
    }
    if (block.sets > 1) {
      steps.push(
        repeat(
          block.sets,
          block.restSeconds > 0 ? [round, timed('rest', block.restSeconds)] : [round]
        )
      );
    } else if (block.reps > 1) {
      // One set of several reps: a one-round outer repeat keeps the inner rounds as reps.
      steps.push(repeat(1, [round]));
    } else {
      steps.push(round);
    }
    const hasNext = i < legacy.blocks.length - 1;
    if (hasNext && block.restSeconds > 0) steps.push(timed('rest', block.restSeconds));
  });

  return { steps };
}

/** v3 repeats carried a `skipLastRest` flag; skipping is now always on, so the key goes. */
function dropSkipLastRest(steps: Step[]): Step[] {
  return steps.map((s) => {
    if (s.kind !== 'repeat') return s;
    const { skipLastRest: _skip, ...rest } = s as RepeatStep & { skipLastRest?: boolean };
    return { ...rest, steps: dropSkipLastRest(rest.steps) };
  });
}

/** Accepts any earlier shape. Anything unreadable becomes an empty workout rather than a crash. */
export function migrateTimings(value: unknown): WorkoutTimings {
  if (isLegacyTimings(value)) return blocksToSteps(value);
  const record = value as { steps?: unknown; board?: unknown } | null;
  const steps = Array.isArray(record?.steps) ? dropSkipLastRest(record.steps as Step[]) : [];
  return typeof record?.board === 'string'
    ? { board: record.board as WorkoutTimings['board'], steps }
    : { steps };
}

/** A persisted workout: replaces `prepSeconds` and `blocks` with `steps`. */
export function migrateWorkoutRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record, ...migrateTimings(record) };
  delete out.prepSeconds;
  delete out.blocks;
  return out;
}

/** A persisted session: migrates its snapshot. */
export function migrateSessionRecord(record: Record<string, unknown>): Record<string, unknown> {
  return { ...record, snapshot: migrateTimings(record.snapshot) };
}
