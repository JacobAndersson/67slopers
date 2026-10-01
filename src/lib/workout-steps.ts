import { newId } from './store/ids';
import type { RepeatStep, Step, StepKind, TimedStep, WorkoutTimings } from './store/types';

/** Editor bounds. Steppers clamp to these and `validate` rejects anything outside them. */
export const LIMITS = {
  maxSteps: 50,
  /** A repeat may contain a repeat, but no deeper. */
  maxDepth: 2,
  times: { min: 1, max: 99 },
  seconds: {
    prep: { min: 1, max: 120 },
    hang: { min: 1, max: 300 },
    rest: { min: 1, max: 900 },
  },
} as const;

export const STEP_NAMES: Record<StepKind, string> = {
  prep: 'Get ready',
  hang: 'Hang',
  rest: 'Rest',
};

/** Steps as the editor holds them: the stored shape plus an id per node for keys and edits. */
export type EditableTimedStep = TimedStep & { id: string };
export type EditableRepeatStep = Omit<RepeatStep, 'steps'> & { id: string; steps: EditableStep[] };
export type EditableStep = EditableTimedStep | EditableRepeatStep;

export type StepPatch =
  | Partial<Pick<TimedStep, 'kind' | 'seconds' | 'label' | 'holds'>>
  | Partial<Pick<RepeatStep, 'times'>>;

// --- Conversions -------------------------------------------------------------------------

export function cloneSteps(steps: Step[]): Step[] {
  return steps.map((s) =>
    s.kind === 'repeat'
      ? { ...s, steps: cloneSteps(s.steps) }
      : { ...s, ...(s.holds ? { holds: [...s.holds] } : {}) }
  );
}

export function withIds(steps: Step[]): EditableStep[] {
  return steps.map((s) =>
    s.kind === 'repeat' ? { ...s, id: newId(), steps: withIds(s.steps) } : { ...s, id: newId() }
  );
}

export function stripIds(steps: EditableStep[]): Step[] {
  return steps.map((s) => {
    if (s.kind === 'repeat') {
      return { kind: 'repeat', times: s.times, steps: stripIds(s.steps) };
    }
    const out: TimedStep = { kind: s.kind, seconds: s.seconds };
    if (s.label) out.label = s.label;
    if (s.kind === 'hang' && s.holds?.length) out.holds = [...s.holds];
    return out;
  });
}

/** Same structure, new ids everywhere (duplicates, presets). */
export function withFreshIds(steps: EditableStep[]): EditableStep[] {
  return withIds(stripIds(steps));
}

// --- Factories ---------------------------------------------------------------------------

const DEFAULT_SECONDS: Record<StepKind, number> = { prep: 10, hang: 7, rest: 60 };

export function newTimedStep(kind: StepKind, seconds = DEFAULT_SECONDS[kind]): EditableTimedStep {
  return { id: newId(), kind, seconds };
}

/** Garmin's "add repeat" default, translated: 6 × (hang 7 s, rest 3 s). */
export function newRepeat(): EditableRepeatStep {
  return {
    id: newId(),
    kind: 'repeat',
    times: 6,
    steps: [newTimedStep('hang', 7), newTimedStep('rest', 3)],
  };
}

// --- Queries -----------------------------------------------------------------------------

export function findStep(steps: EditableStep[], id: string): EditableStep | undefined {
  for (const s of steps) {
    if (s.id === id) return s;
    if (s.kind === 'repeat') {
      const found = findStep(s.steps, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** The repeat holding `id`, `null` when it sits at the root, `undefined` when not found. */
export function parentOf(steps: EditableStep[], id: string): EditableRepeatStep | null | undefined {
  if (steps.some((s) => s.id === id)) return null;
  for (const s of steps) {
    if (s.kind !== 'repeat') continue;
    if (s.steps.some((c) => c.id === id)) return s;
    const deeper = parentOf(s.steps, id);
    if (deeper) return deeper;
  }
  return undefined;
}

/** 0 for a root step, 1 inside a repeat, 2 inside a repeat inside a repeat. -1 when not found. */
export function depthOf(steps: EditableStep[], id: string, depth = 0): number {
  for (const s of steps) {
    if (s.id === id) return depth;
    if (s.kind === 'repeat') {
      const d = depthOf(s.steps, id, depth + 1);
      if (d >= 0) return d;
    }
  }
  return -1;
}

/** Levels of repeats a step contains: 0 for a timed step, 1 for a repeat of timed steps. */
export function stepDepth(step: Step): number {
  return step.kind === 'repeat' ? 1 + Math.max(0, ...step.steps.map(stepDepth)) : 0;
}

export function maxDepth(steps: Step[]): number {
  return Math.max(0, ...steps.map(stepDepth));
}

export function countTimedSteps(steps: Step[]): number {
  return steps.reduce((n, s) => n + (s.kind === 'repeat' ? countTimedSteps(s.steps) : 1), 0);
}

/** Every hold id used by any hang, in order of first use. */
export function holdsInWorkout(steps: Step[]): string[] {
  const out: string[] = [];
  const walk = (list: Step[]) => {
    for (const s of list) {
      if (s.kind === 'repeat') walk(s.steps);
      else for (const id of s.holds ?? []) if (!out.includes(id)) out.push(id);
    }
  };
  walk(steps);
  return out;
}

/** Drops every hold choice, for when the board changes. */
export function clearHolds<T extends Step | EditableStep>(steps: T[]): T[] {
  return steps.map((s) => {
    if (s.kind === 'repeat') return { ...s, steps: clearHolds(s.steps) };
    if (!s.holds) return s;
    const { holds: _holds, ...rest } = s;
    return rest as T;
  });
}

/** Same board and the same steps, labels, holds, counts and nesting. Names are not compared. */
export function sameTimings(a: WorkoutTimings, b: WorkoutTimings): boolean {
  return (a.board ?? undefined) === (b.board ?? undefined) && sameSteps(a.steps, b.steps);
}

function sameSteps(a: Step[], b: Step[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => {
    const t = b[i];
    if (s.kind === 'repeat' || t.kind === 'repeat') {
      return (
        s.kind === 'repeat' &&
        t.kind === 'repeat' &&
        s.times === t.times &&
        sameSteps(s.steps, t.steps)
      );
    }
    return (
      s.kind === t.kind &&
      s.seconds === t.seconds &&
      (s.label ?? '') === (t.label ?? '') &&
      (s.holds ?? []).join(',') === (t.holds ?? []).join(',')
    );
  });
}

export function hasHang(steps: Step[]): boolean {
  return steps.some((s) => (s.kind === 'repeat' ? hasHang(s.steps) : s.kind === 'hang'));
}

/** Whether `step` may be placed inside the repeat `repeatId` without exceeding the depth limit. */
export function canNest(steps: EditableStep[], repeatId: string, step: Step): boolean {
  const depth = depthOf(steps, repeatId);
  if (depth < 0) return false;
  return depth + 1 + stepDepth(step) <= LIMITS.maxDepth;
}

/** Human-readable problems, empty when the workout can run and be saved. */
export function validate(steps: Step[]): string[] {
  const errors: string[] = [];
  if (!hasHang(steps)) errors.push('Add at least one hang.');
  if (countTimedSteps(steps) > LIMITS.maxSteps) {
    errors.push(`A workout can have at most ${LIMITS.maxSteps} steps.`);
  }
  if (maxDepth(steps) > LIMITS.maxDepth) errors.push('Repeats can only be nested one level deep.');
  if (!stepsInRange(steps)) errors.push('Some step values are out of range.');
  return errors;
}

function stepsInRange(steps: Step[]): boolean {
  return steps.every((s) => {
    if (s.kind === 'repeat') {
      return (
        Number.isInteger(s.times) &&
        s.times >= LIMITS.times.min &&
        s.times <= LIMITS.times.max &&
        stepsInRange(s.steps)
      );
    }
    const range = LIMITS.seconds[s.kind];
    return Number.isInteger(s.seconds) && s.seconds >= range.min && s.seconds <= range.max;
  });
}

// --- Edits (all return a new tree) ------------------------------------------------------

/** Applies `fn` to the children of `parentId` (the root list when null). */
function mapChildren(
  steps: EditableStep[],
  parentId: string | null,
  fn: (children: EditableStep[]) => EditableStep[]
): EditableStep[] {
  if (parentId === null) return fn(steps);
  return steps.map((s) => {
    if (s.kind !== 'repeat') return s;
    if (s.id === parentId) return { ...s, steps: fn(s.steps) };
    return { ...s, steps: mapChildren(s.steps, parentId, fn) };
  });
}

export function updateStep(steps: EditableStep[], id: string, patch: StepPatch): EditableStep[] {
  return steps.map((s) => {
    if (s.id === id) {
      const next = { ...s, ...patch } as EditableStep;
      if (next.kind !== 'hang' && 'holds' in next) delete (next as { holds?: unknown }).holds;
      return next;
    }
    if (s.kind === 'repeat') return { ...s, steps: updateStep(s.steps, id, patch) };
    return s;
  });
}

export function removeStep(steps: EditableStep[], id: string): EditableStep[] {
  return steps
    .filter((s) => s.id !== id)
    .map((s) => (s.kind === 'repeat' ? { ...s, steps: removeStep(s.steps, id) } : s));
}

/** Appends to the children of `parentId` (root when null). Refused when it would nest too deep. */
export function appendTo(
  steps: EditableStep[],
  parentId: string | null,
  step: EditableStep
): EditableStep[] {
  if (parentId !== null && !canNest(steps, parentId, step)) return steps;
  return mapChildren(steps, parentId, (children) => [...children, step]);
}

/** Inserts `step` right after the step `afterId`, in the same list. */
export function insertAfter(
  steps: EditableStep[],
  afterId: string,
  step: EditableStep
): EditableStep[] {
  const parent = parentOf(steps, afterId);
  if (parent === undefined) return steps;
  const parentId = parent === null ? null : parent.id;
  if (parentId !== null && !canNest(steps, parentId, step)) return steps;
  return mapChildren(steps, parentId, (children) => {
    const i = children.findIndex((c) => c.id === afterId);
    return [...children.slice(0, i + 1), step, ...children.slice(i + 1)];
  });
}

export function duplicateStep(steps: EditableStep[], id: string): EditableStep[] {
  const source = findStep(steps, id);
  if (!source) return steps;
  const [copy] = withFreshIds([source]);
  return insertAfter(steps, id, copy);
}

/** Swaps a step with its neighbour. No-op at either end of its list. */
export function moveStep(steps: EditableStep[], id: string, direction: -1 | 1): EditableStep[] {
  const parent = parentOf(steps, id);
  if (parent === undefined) return steps;
  return mapChildren(steps, parent === null ? null : parent.id, (children) => {
    const i = children.findIndex((c) => c.id === id);
    const j = i + direction;
    if (j < 0 || j >= children.length) return children;
    const next = [...children];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

/** Reorders the children of `parentId` to follow `orderedIds`; ids not listed keep their order at the end. */
export function reorderWithin(
  steps: EditableStep[],
  parentId: string | null,
  orderedIds: string[]
): EditableStep[] {
  return mapChildren(steps, parentId, (children) => {
    const byId = new Map(children.map((c) => [c.id, c]));
    const picked = orderedIds.map((id) => byId.get(id)).filter((c): c is EditableStep => !!c);
    const rest = children.filter((c) => !orderedIds.includes(c.id));
    return [...picked, ...rest];
  });
}

/** Lifts a step out of its repeat, placing it right after that repeat. */
export function moveOutOfRepeat(steps: EditableStep[], id: string): EditableStep[] {
  const step = findStep(steps, id);
  const parent = parentOf(steps, id);
  if (!step || !parent) return steps;
  return insertAfter(removeStep(steps, id), parent.id, step);
}

/** Moves a step to the end of the repeat `repeatId`, if the depth limit allows it. */
export function moveIntoRepeat(
  steps: EditableStep[],
  id: string,
  repeatId: string
): EditableStep[] {
  const step = findStep(steps, id);
  if (!step || id === repeatId || findStep([step], repeatId)) return steps;
  const without = removeStep(steps, id);
  if (!canNest(without, repeatId, step)) return steps;
  return appendTo(without, repeatId, step);
}
