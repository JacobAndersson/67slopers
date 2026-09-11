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

export function splitHeight(total: number, required: number, enabled: boolean): number {
  if (!enabled) return total;
  const top = Math.max(total / 2, required);
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
