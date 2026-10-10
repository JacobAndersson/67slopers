import { formatClock } from '../dates';
import type { Interval } from './intervals';

export type NextUp = { label: string; value: string };

const duration = (seconds: number) => (seconds >= 60 ? formatClock(seconds) : `${seconds}s`);
const withLabel = (value: string, label?: string) => (label ? `${value} · ${label}` : value);

/**
 * What to announce under the digits. Inside a set the hang and short rest alternate and the
 * timer says nothing; it speaks only when the pattern breaks: the last hang of a set of reps
 * (and the short rest after it) before a long rest, a long rest that leads into a new set, and
 * the last hang of the workout. `boardShown` means the board is on screen with the grip to
 * set up, which already says what comes next.
 */
export function nextUp(intervals: Interval[], index: number, boardShown: boolean): NextUp | null {
  const current = intervals[index];
  if (boardShown || !current || current.phase === 'prep' || current.phase === 'done') return null;
  const after = intervals.slice(index + 1);
  const nextHang = after.find((i) => i.phase === 'hang');
  if (!nextHang) return { label: 'Next', value: 'Done' };
  if (current.phase === 'rest') {
    if (nextHang.setIndex === current.setIndex) return null;
    return {
      label: 'Next',
      value: withLabel(`Set ${nextHang.setIndex + 1} of ${nextHang.setCount}`, nextHang.label),
    };
  }
  // A hang, or the short rest after one: is a long rest what the reps lead to?
  const then = after.find((i) => i.phase !== 'pause');
  if (then?.phase !== 'rest' || current.repCount <= 1) return null;
  return { label: 'Next', value: withLabel(`Rest ${duration(then.seconds)}`, then.label) };
}
