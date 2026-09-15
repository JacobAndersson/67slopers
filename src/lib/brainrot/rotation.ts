import type { EngineState } from '../timer/engine';

/** Initial prep belongs to hang zero; subsequent recovery belongs to the preceding hang. */
export function hangOrdinal(state: Pick<EngineState, 'intervals' | 'index'>): number {
  let ordinal = -1;
  for (let i = 0; i <= state.index; i++) {
    if (state.intervals[i]?.phase === 'hang') ordinal++;
  }
  return Math.max(0, ordinal);
}

export function shuffledCycle(
  ids: readonly string[],
  random: () => number,
  last?: string
): string[] {
  const result = [...new Set(ids)];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result[0] === last) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

/** Run-scoped ledger: stable on Back and toggling, independent of the timer clock. */
export function createClipRotation(ids: readonly string[], random = Math.random) {
  const failed = new Set<string>();
  const assignments: (string | undefined)[] = [];
  let bag: string[] = [];
  let last: string | undefined;
  return {
    clipAt(ordinal: number): string | undefined {
      for (let i = assignments.length; i <= ordinal; i++) {
        bag = bag.filter((id) => !failed.has(id));
        if (!bag.length)
          bag = shuffledCycle(
            ids.filter((id) => !failed.has(id)),
            random,
            last
          );
        const id = bag.shift();
        assignments.push(id);
        if (id) last = id;
      }
      return assignments[ordinal];
    },
    fail(id: string) {
      failed.add(id);
    },
    hasFailed(id: string) {
      return failed.has(id);
    },
  };
}

export function shouldPlay(status: EngineState['status'], active: boolean): boolean {
  return active && status === 'running';
}

/** Clip ids grouped by their content bucket (game), in first-seen bucket order. */
export function bucketsByGame(clips: readonly { id: string; game: string }[]): string[][] {
  const buckets = new Map<string, string[]>();
  for (const clip of clips) {
    const bucket = buckets.get(clip.game);
    if (bucket) bucket.push(clip.id);
    else buckets.set(clip.game, [clip.id]);
  }
  return [...buckets.values()];
}

/**
 * Run-scoped ledger over content buckets: each cycle plays every bucket once (in shuffled
 * order, never the same bucket twice in a row), dealing each bucket's clips without repeat
 * until its deck is exhausted. Stable on Back and toggling, like `createClipRotation`.
 */
export function createBucketRotation(
  buckets: readonly (readonly string[])[],
  random = Math.random
) {
  const present = buckets.filter((bucket) => bucket.length > 0);
  const bucketPick = createClipRotation(
    present.map((_, index) => String(index)),
    random
  );
  const inners = present.map((ids) => createClipRotation(ids, random));
  const counts = present.map(() => 0);
  const assigned: (string | undefined)[] = [];
  const findBucket = (id: string) => present.findIndex((ids) => ids.includes(id));
  return {
    clipAt(ordinal: number): string | undefined {
      for (let i = assigned.length; i <= ordinal; i++) {
        const pick = bucketPick.clipAt(i);
        const bucket = pick === undefined ? -1 : Number(pick);
        const inner = bucket >= 0 ? inners[bucket] : undefined;
        if (!inner) {
          assigned.push(undefined);
          continue;
        }
        const n = counts[bucket]++;
        assigned.push(inner.clipAt(n));
      }
      return assigned[ordinal];
    },
    fail(id: string) {
      const bucket = findBucket(id);
      if (bucket >= 0) inners[bucket].fail(id);
    },
    hasFailed(id: string) {
      const bucket = findBucket(id);
      return bucket >= 0 && inners[bucket].hasFailed(id);
    },
  };
}

export function splitHeight(total: number, required: number, enabled: boolean): number {
  if (!enabled) return total;
  // The video takes the larger share: the timer keeps 40% or what it measured,
  // whichever is more. If less than 120 points remain, video is temporarily hidden.
  const top = Math.max(total * 0.4, required);
  return total - top >= 120 ? top : total;
}

/** Same crop on Android, iOS and web; portrait runners sit below the frame centre. */
export function coverFrame(
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
  focalY = 0.5
) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return {
    width: renderedWidth,
    height: renderedHeight,
    left: (width - renderedWidth) / 2,
    top: (height - renderedHeight) * focalY,
  };
}
