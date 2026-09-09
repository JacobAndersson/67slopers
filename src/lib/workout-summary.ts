import { formatShort } from './dates';
import type { Step, WorkoutTimings } from './store/types';
import { expandWorkout, totalSeconds } from './timer/intervals';

/** Seconds from the first prep to the final hang, including rests. */
export function estimateDuration(timings: WorkoutTimings): number {
  return totalSeconds(expandWorkout(timings));
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
