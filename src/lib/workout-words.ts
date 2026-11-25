import { DOT } from './copy';
import { formatClock } from './dates';
import type { RepeatStep, Step, TimedStep, WorkoutTimings } from './store/types';

/** "7 s" under a minute, "3:00" from a minute on. */
export function seconds(value: number): string {
  return value < 60 ? `${value} s` : formatClock(value);
}

const repeats = (steps: Step[]) => steps.filter((s): s is RepeatStep => s.kind === 'repeat');
const timed = (steps: Step[], kind: TimedStep['kind']) =>
  steps.filter((s): s is TimedStep => s.kind === kind);

/** Hang and rest of a set's reps, when the set is a repeat of "hang, rest". */
function reps(set: RepeatStep) {
  const inner = set.steps.find((s): s is RepeatStep => s.kind === 'repeat');
  if (!inner) return null;
  const hang = timed(inner.steps, 'hang')[0];
  const rest = timed(inner.steps, 'rest')[0];
  return hang ? { times: inner.times, hang: hang.seconds, rest: rest?.seconds } : null;
}

/** The rest that closes each round of a top-level repeat. */
function recover(set: RepeatStep): number | undefined {
  const last = set.steps.at(-1);
  return last && last.kind === 'rest' ? last.seconds : undefined;
}

/**
 * A protocol in plain words, as the classic workouts list it (design: builder-presets):
 * "6 sets  ·  6 × 7 s on, 3 s off", "5 × 10 s  ·  rest 3:00", "2 grips  ·  3 sets each, 7 s on,
 * 3 s off", "5 × 8 s each arm  ·  rest 2:30". Empty when there is nothing to say.
 */
export function protocolLine(timings: WorkoutTimings): string {
  const sets = repeats(timings.steps);
  if (sets.length === 0) {
    const hangs = timed(timings.steps, 'hang');
    if (!hangs.length) return '';
    const lengths = hangs.map((h) => h.seconds);
    const low = Math.min(...lengths);
    const high = Math.max(...lengths);
    return `${hangs.length} ${hangs.length === 1 ? 'hang' : 'hangs'}${DOT}${
      low === high ? seconds(low) : `${low}–${high} s`
    }`;
  }
  const [first] = sets;
  const nested = reps(first);
  if (sets.length > 1) {
    const grips = `${sets.length} grips`;
    if (nested)
      return `${grips}${DOT}${first.times} sets each, ${nested.hang} s on, ${nested.rest} s off`;
    const hang = timed(first.steps, 'hang')[0];
    return hang ? `${grips}${DOT}${first.times} × ${seconds(hang.seconds)} each` : grips;
  }
  if (nested) {
    const offs = nested.rest !== undefined ? `, ${nested.rest} s off` : '';
    return `${first.times} sets${DOT}${nested.times} × ${nested.hang} s on${offs}`;
  }
  const hangs = timed(first.steps, 'hang');
  if (!hangs.length) return `${first.times} rounds`;
  const each =
    hangs.length > 1 && hangs.every((h) => /arm/i.test(h.label ?? '')) ? ' each arm' : '';
  const shown = each ? `${seconds(hangs[0].seconds)}${each}` : seconds(hangs[0].seconds);
  const rest = recover(first);
  return `${first.times} × ${shown}${rest !== undefined ? `${DOT}rest ${seconds(rest)}` : ''}`;
}

/**
 * The line under "The workout" on the overview: "6 sets  ·  7 s on, 3 s off  ·  recover 3:00"
 * for sets of reps, the protocol line otherwise.
 */
export function overviewLine(timings: WorkoutTimings): string {
  const sets = repeats(timings.steps);
  const nested = sets.length === 1 ? reps(sets[0]) : null;
  if (!nested) return protocolLine(timings);
  const rest = recover(sets[0]);
  return [
    `${sets[0].times} sets`,
    `${nested.hang} s on${nested.rest !== undefined ? `, ${nested.rest} s off` : ''}`,
    ...(rest !== undefined ? [`recover ${seconds(rest)}`] : []),
  ].join(DOT);
}
