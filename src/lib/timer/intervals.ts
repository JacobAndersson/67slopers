import type { WorkoutTimings } from '../store/types';

export type Phase = 'prep' | 'hang' | 'pause' | 'rest' | 'done';

export type Interval = {
  phase: Phase;
  seconds: number;
  /** 0-based set index across the whole workout, and the total number of sets. */
  setIndex: number;
  setCount: number;
  /** 0-based rep within the set, and reps in that set. */
  repIndex: number;
  repCount: number;
  label?: string;
};

/**
 * Flattens a workout into the exact sequence the timer runs: prep once, then per set
 * hang/pause/hang/... with a rest between sets, ending in a zero-length `done`.
 * Zero-length prep, pause and rest intervals are skipped.
 */
export function expandWorkout(timings: WorkoutTimings): Interval[] {
  const setCount = timings.blocks.reduce((n, b) => n + b.sets, 0);
  const out: Interval[] = [];
  const push = (interval: Interval) => {
    if (interval.seconds > 0 || interval.phase === 'done') out.push(interval);
  };

  push({
    phase: 'prep',
    seconds: timings.prepSeconds,
    setIndex: 0,
    setCount,
    repIndex: 0,
    repCount: 1,
  });

  let setIndex = 0;
  for (const block of timings.blocks) {
    for (let s = 0; s < block.sets; s++) {
      for (let r = 0; r < block.reps; r++) {
        const base = { setIndex, setCount, repIndex: r, repCount: block.reps, label: block.label };
        push({ ...base, phase: 'hang', seconds: block.hangSeconds });
        if (r < block.reps - 1) push({ ...base, phase: 'pause', seconds: block.pauseSeconds });
      }
      if (setIndex < setCount - 1) {
        push({
          phase: 'rest',
          seconds: block.restSeconds,
          setIndex,
          setCount,
          repIndex: block.reps - 1,
          repCount: block.reps,
          label: block.label,
        });
      }
      setIndex++;
    }
  }

  push({
    phase: 'done',
    seconds: 0,
    setIndex: Math.max(0, setCount - 1),
    setCount,
    repIndex: 0,
    repCount: 1,
  });
  return out;
}

/** Total workout length in seconds. */
export function totalSeconds(intervals: Interval[]): number {
  return intervals.reduce((n, i) => n + i.seconds, 0);
}
