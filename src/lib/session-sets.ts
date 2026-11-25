import { countWord } from './copy';
import type { HangResult, WorkoutTimings } from './store/types';
import { expandWorkout } from './timer/intervals';

/** One set as it was done: seconds hung of seconds planned; `ran` is false when it never started. */
export type SetResult = { planned: number; actual: number; ran: boolean };

/**
 * A session's hangs added up per set, in order, for "Hangs, as done". Sets the session never
 * reached are listed as not run.
 */
export function setResults(snapshot: WorkoutTimings, hangs: HangResult[] = []): SetResult[] {
  const planned = expandWorkout(snapshot).filter((i) => i.phase === 'hang');
  const sets: SetResult[] = [];
  planned.forEach((interval, i) => {
    const set = (sets[interval.setIndex] ??= { planned: 0, actual: 0, ran: false });
    set.planned += interval.seconds;
    const done = hangs[i];
    if (done) {
      set.actual += Math.min(done.actual, done.planned);
      set.ran = true;
    }
  });
  return sets.filter(Boolean);
}

/** "All six sets, every hang to the end." / "Ended early. Saved with the sets you finished." */
export function sessionVerdict(completed: boolean, totalSets: number): string {
  if (!completed) return 'Ended early. Saved with the sets you finished.';
  if (totalSets === 1) return 'The whole set, every hang to the end.';
  return `All ${countWord(totalSets)} sets, every hang to the end.`;
}
