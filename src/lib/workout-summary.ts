import { formatShort } from './dates';
import type { WorkoutTimings } from './store/types';
import { expandWorkout, totalSeconds } from './timer/intervals';

/** Seconds from the first prep to the final hang, including rests. */
export function estimateDuration(timings: WorkoutTimings): number {
  return totalSeconds(expandWorkout(timings));
}

/** "6 × 6 · 7s / 3s · rest 3:00" style one-liner. Multi-block workouts join their blocks. */
export function summaryLine(timings: WorkoutTimings): string {
  return timings.blocks
    .map((b) => {
      const parts = [`${b.sets} × ${b.reps}`];
      let hang = `${b.hangSeconds}s`;
      if (b.reps > 1 && b.pauseSeconds > 0) hang += ` / ${b.pauseSeconds}s`;
      parts.push(hang);
      if (b.sets > 1 && b.restSeconds > 0) parts.push(`rest ${formatShort(b.restSeconds)}`);
      return parts.join(' · ');
    })
    .join(' + ');
}

/** Sets completed out of the total, e.g. "4/6 sets". */
export function setsLine(completed: number, total: number): string {
  return `${completed}/${total} sets`;
}
