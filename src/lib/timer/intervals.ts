import type { Step, WorkoutTimings } from '../store/types';

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
 * A set is one round of a top-level repeat, or a hang that sits outside any repeat. Prep and
 * rest steps at the top level belong to the set they follow.
 */
export function countSets(steps: Step[]): number {
  return steps.reduce((n, s) => n + (s.kind === 'repeat' ? s.times : s.kind === 'hang' ? 1 : 0), 0);
}

/** The final round of a repeat with `skipLastRest`: trailing rest steps are dropped. */
export function trimTrailingRests(steps: Step[]): Step[] {
  let end = steps.length;
  while (end > 0 && steps[end - 1].kind === 'rest') end--;
  return steps.slice(0, end);
}

type Ctx = { depth: number; repIndex: number; repCount: number };

/**
 * Flattens a workout into the exact sequence the timer runs. Repeats unroll round by round;
 * the rounds of a top-level repeat are the sets, the rounds of a repeat inside it are the reps.
 * A rest inside an inner repeat becomes a `pause` (between reps), any other rest stays `rest`.
 * Zero-length steps are skipped; the list always ends in a zero-length `done`.
 */
export function expandWorkout(timings: WorkoutTimings): Interval[] {
  const setCount = countSets(timings.steps);
  const out: Interval[] = [];
  let setIndex = 0;
  let setDone = false;

  // Rests after a set keep that set's index; the next set opens on its first hang or round.
  const openSet = () => {
    if (setDone) {
      setIndex++;
      setDone = false;
    }
  };
  const currentSet = () => Math.min(setIndex, Math.max(0, setCount - 1));

  const walk = (steps: Step[], ctx: Ctx) => {
    for (const step of steps) {
      if (step.kind === 'repeat') {
        for (let r = 0; r < step.times; r++) {
          const last = r === step.times - 1;
          const inner = last && step.skipLastRest ? trimTrailingRests(step.steps) : step.steps;
          if (ctx.depth === 0) {
            openSet();
            walk(inner, { depth: 1, repIndex: 0, repCount: 1 });
            setDone = true;
          } else {
            walk(inner, { depth: ctx.depth + 1, repIndex: r, repCount: step.times });
          }
        }
        continue;
      }
      if (ctx.depth === 0 && step.kind === 'hang') openSet();
      if (step.seconds > 0) {
        const phase: Phase = step.kind === 'rest' && ctx.depth >= 2 ? 'pause' : step.kind;
        out.push({
          phase,
          seconds: step.seconds,
          setIndex: currentSet(),
          setCount,
          repIndex: ctx.repIndex,
          repCount: ctx.repCount,
          ...(step.label ? { label: step.label } : {}),
        });
      }
      if (ctx.depth === 0 && step.kind === 'hang') setDone = true;
    }
  };

  walk(timings.steps, { depth: 0, repIndex: 0, repCount: 1 });

  out.push({
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
