import { formatClock } from '../dates';
import { sameGrip } from './grip-cue';
import type { Interval } from './intervals';

export type NextUp = { label: string; value: string };

/** "7 s", "3:00": how long a coming interval is, as the timer says it. */
export const spokenDuration = (seconds: number) =>
  seconds >= 60 ? formatClock(seconds) : `${seconds} s`;
const withLabel = (value: string, label?: string) => (label ? `${value} · ${label}` : value);

/** The timer's word for an interval: a rest that closes a set is Recover. */
export function intervalWord(interval: Pick<Interval, 'phase' | 'recover'>): string {
  if (interval.phase === 'prep') return 'Get ready';
  if (interval.phase === 'hang') return 'Hang';
  if (interval.phase === 'done') return 'Done';
  return interval.recover ? 'Recover' : 'Rest';
}

/**
 * The Next line above the controls (design: timer-prep, timer-hang-next, timer-newgrip,
 * timer-recover). Inside a set the hang and short rest alternate and the timer says nothing; it
 * speaks only when the pattern breaks: Get ready says the first hang, the last hang of a set of
 * reps (and the short rest after it) names the long rest, a rest before a new grip names the
 * hang, a long rest that leads into a new set names the set, and the last hang says Done.
 */
export function nextUp(intervals: Interval[], index: number): NextUp | null {
  const current = intervals[index];
  if (!current || current.phase === 'done') return null;
  const after = intervals.slice(index + 1);
  const coming = after[0];
  if (current.phase === 'prep') {
    if (!coming || coming.phase === 'done') return null;
    return {
      label: 'Next',
      value: withLabel(`${intervalWord(coming)} ${spokenDuration(coming.seconds)}`, coming.label),
    };
  }
  const nextHang = after.find((i) => i.phase === 'hang');
  if (!nextHang) return { label: 'Next', value: 'Done' };
  const previousHang = intervals
    .slice(0, index + (current.phase === 'hang' ? 0 : 1))
    .findLast((i) => i.phase === 'hang');
  const newGrip =
    current.phase !== 'hang' &&
    !!previousHang &&
    !!nextHang.holds?.length &&
    !sameGrip(previousHang.holds, nextHang.holds);
  if (current.phase === 'rest' && nextHang.setIndex !== current.setIndex) {
    return {
      label: 'Next',
      value: withLabel(`Set ${nextHang.setIndex + 1} of ${nextHang.setCount}`, nextHang.label),
    };
  }
  if (newGrip) {
    return {
      label: 'Next',
      value: withLabel(`Hang ${spokenDuration(nextHang.seconds)}`, nextHang.label),
    };
  }
  if (current.phase === 'rest') return null;
  // A hang, or the short rest after one: is a long rest what the reps lead to?
  const then = after.find((i) => i.phase !== 'pause');
  if (then?.phase !== 'rest' || current.repCount <= 1) return null;
  return {
    label: 'Next',
    value: withLabel(`${intervalWord(then)} ${spokenDuration(then.seconds)}`, then.label),
  };
}
