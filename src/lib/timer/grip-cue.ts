import type { Interval } from './intervals';

export const sameGrip = (a: string[] | undefined, b: string[] | undefined) =>
  [...(a ?? [])].sort().join(',') === [...(b ?? [])].sort().join(',');

export type GripCue = {
  /** The holds drawn solid on the board. */
  holds: string[];
  /** Said before the grip's name: before the first hang, and when the grip changes. */
  prefix: 'First grip' | 'New grip' | null;
};

/**
 * What the board shows (design: the grip is drawn on the board and named under it, in every
 * state): during a hang its own grip; before the first hang the opening grip ("First grip");
 * in a rest the grip that comes next, called "New grip" when it differs from the last one.
 */
export function gripCue(intervals: Interval[], index: number): GripCue {
  const current = intervals[index];
  if (!current) return { holds: [], prefix: null };
  if (current.phase === 'hang') return { holds: current.holds ?? [], prefix: null };
  const previous = intervals.slice(0, index).findLast((i) => i.phase === 'hang');
  const next = intervals.slice(index + 1).find((i) => i.phase === 'hang');
  if (!previous) return { holds: next?.holds ?? [], prefix: 'First grip' };
  if (!next) return { holds: previous.holds ?? [], prefix: null };
  const changed = !sameGrip(previous.holds, next.holds);
  return { holds: next.holds ?? [], prefix: changed && next.holds?.length ? 'New grip' : null };
}
