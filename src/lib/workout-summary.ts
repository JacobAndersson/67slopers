import { formatShort } from './dates';
import type { HangResult, Step, WorkoutTimings } from './store/types';
import { countSets, expandWorkout, totalSeconds } from './timer/intervals';

/** Seconds from the first prep to the final hang, including rests. */
export function estimateDuration(timings: WorkoutTimings): number {
  return totalSeconds(expandWorkout(timings));
}

/** Facts from the exact interval sequence, including mixed protocols and every rest. */
export function workoutFacts(timings: WorkoutTimings) {
  const intervals = expandWorkout(timings);
  const hangs = intervals.filter((interval) => interval.phase === 'hang');
  return {
    seconds: totalSeconds(intervals),
    hangSeconds: totalSeconds(hangs),
    sets: countSets(timings.steps),
    hangs: hangs.length,
  };
}

/**
 * One-line description, e.g. "6 × (6 × 7s / 3s · rest 3:00)" for repeaters or
 * "5 × (10s · rest 3:00)" for max hangs. Prep and labels are left out.
 */
export function summaryLine(timings: WorkoutTimings): string {
  return describe(timings.steps, 0).join(' · ');
}

function describe(steps: Step[], depth: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.kind === 'repeat') {
      const inner = describe(step.steps, depth + 1);
      if (inner.length === 0) continue;
      parts.push(`${step.times} × ${inner.length > 1 ? `(${inner.join(' · ')})` : inner[0]}`);
    } else if (step.kind === 'hang') {
      const next = steps[i + 1];
      // Inside the reps of a set, a hang and its pause read as one "7s / 3s" pair.
      if (depth >= 2 && next && next.kind === 'rest') {
        parts.push(`${step.seconds}s / ${next.seconds}s`);
        i++;
      } else {
        parts.push(`${step.seconds}s`);
      }
    } else if (step.kind === 'rest') {
      parts.push(`rest ${formatShort(step.seconds)}`);
    }
  }
  return parts;
}

/** Sets completed out of the total, e.g. "4/6 sets". */
export function setsLine(completed: number, total: number): string {
  return `${completed}/${total} sets`;
}

export type HangOutcomes = {
  /** Hangs in the workout as planned. */
  planned: number;
  /** Ran their full length. */
  done: number;
  /** Stopped early, after at least a second. */
  cutShort: number;
  /** Skipped within the first second. */
  skipped: number;
};

/** How a session's hangs went; hangs never reached (the workout was ended) are in none. */
export function hangOutcomes(snapshot: WorkoutTimings, hangs: HangResult[]): HangOutcomes {
  const planned = expandWorkout(snapshot).filter((i) => i.phase === 'hang').length;
  const outcomes: HangOutcomes = { planned, done: 0, cutShort: 0, skipped: 0 };
  for (const hang of hangs) {
    if (hang.actual >= hang.planned) outcomes.done++;
    else if (hang.actual < 1) outcomes.skipped++;
    else outcomes.cutShort++;
  }
  return outcomes;
}

/** "34/36 hangs · 1 cut short · 1 skipped". */
export function hangsLine(outcomes: HangOutcomes): string {
  const parts = [`${outcomes.done}/${outcomes.planned} hangs`];
  if (outcomes.cutShort) parts.push(`${outcomes.cutShort} cut short`);
  if (outcomes.skipped) parts.push(`${outcomes.skipped} skipped`);
  return parts.join(' · ');
}
