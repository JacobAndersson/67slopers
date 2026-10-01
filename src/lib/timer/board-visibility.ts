import type { Interval, Phase } from './intervals';

export const sameGrip = (a: string[] | undefined, b: string[] | undefined) =>
  [...(a ?? [])].sort().join(',') === [...(b ?? [])].sort().join(',');

type BoardVisibility = {
  phase: Phase;
  previousHang?: Pick<Interval, 'holds'>;
  nextHang?: Pick<Interval, 'holds'>;
  currentHolds?: string[];
  hasBoard: boolean;
  finished: boolean;
};

/**
 * The board is a setup cue, not a during-hang display: show it on the first prep so the
 * opening grip can be set (or on the opening hang itself when a workout starts there),
 * and on a rest (or pause between reps) when the next grip differs from the last one.
 * Everywhere else — hangs after the first, same-grip rests, later preps — it stays
 * hidden so the timer owns the screen.
 */
export function shouldShowBoard({
  phase,
  previousHang,
  nextHang,
  currentHolds,
  hasBoard,
  finished,
}: BoardVisibility): boolean {
  if (!hasBoard || finished) return false;
  if (!previousHang) {
    if (phase === 'prep') return !!nextHang?.holds?.length;
    if (phase === 'hang') return !!(currentHolds?.length ?? 0);
    return false;
  }
  if (
    (phase === 'rest' || phase === 'pause') &&
    previousHang &&
    nextHang?.holds?.length &&
    !sameGrip(previousHang.holds, nextHang.holds)
  )
    return true;
  return false;
}
