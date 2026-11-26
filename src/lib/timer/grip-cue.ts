import type { Interval } from './intervals';

export const sameGrip = (a: string[] | undefined, b: string[] | undefined) =>
  [...(a ?? [])].sort().join(',') === [...(b ?? [])].sort().join(',');

export type GripCue = {
  /** The holds drawn solid on the board. */
  holds: string[];
  /** Said before the grip's name: before the first hang, and when the grip changes. */
  prefix: 'First grip' | 'New grip' | null;
  /** Whether the board and its grip are on screen at all. */
  show: boolean;
};

/**
 * What the board shows: during a hang its own grip; before the first hang the opening grip
 * ("First grip"); in a rest the grip that comes next, called "New grip" when it differs from the
 * last one. The board is only on screen when the grip is news: up to and through the first hang,
 * and from the rest before a change through the first hang on the new grip. Repeats of the same
 * grip hide it, and so does a hang with no grip chosen.
 */
export function gripCue(intervals: Interval[], index: number): GripCue {
  const current = intervals[index];
  if (!current) return { holds: [], prefix: null, show: false };
  const before = intervals.slice(0, index).findLast((i) => i.phase === 'hang');
  if (current.phase === 'hang') {
    const holds = current.holds ?? [];
    return {
      holds,
      prefix: null,
      show: !!holds.length && (!before || !sameGrip(before.holds, holds)),
    };
  }
  const next = intervals.slice(index + 1).find((i) => i.phase === 'hang');
  if (!before) {
    const holds = next?.holds ?? [];
    return { holds, prefix: 'First grip', show: !!holds.length };
  }
  if (!next) return { holds: before.holds ?? [], prefix: null, show: false };
  const holds = next.holds ?? [];
  const changed = !!holds.length && !sameGrip(before.holds, holds);
  return { holds, prefix: changed ? 'New grip' : null, show: changed };
}
