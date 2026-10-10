import { canNest, findStep, removeStep, type EditableStep } from './workout-steps';

/**
 * The builder draws a workout as one flat column of rows, so a step can be dragged anywhere in
 * it: a repeat is a head row, its steps, and a foot row. Where a row sits between heads and
 * feet says which repeat it belongs to, so dropping a row in a gap of this column is a move in
 * the tree. Everything here is pure; the gestures live in `src/components/drag-list.tsx`.
 */
export type Row = {
  /** Unique in the column: the step id, or `<repeat id>/end` for a foot. */
  key: string;
  /** The step or repeat the row belongs to. */
  id: string;
  kind: 'step' | 'head' | 'foot';
  /** 0 at the top level, 1 inside a repeat, 2 inside a repeat in a repeat. */
  depth: number;
  /** How many rows travel when this one is dragged: 1 for a step, the whole repeat for a head, 0 for a foot, which stays put. */
  size: number;
};

export const footKey = (repeatId: string) => `${repeatId}/end`;

export function flattenSteps(steps: EditableStep[], depth = 0): Row[] {
  const rows: Row[] = [];
  for (const step of steps) {
    if (step.kind !== 'repeat') {
      rows.push({ key: step.id, id: step.id, kind: 'step', depth, size: 1 });
      continue;
    }
    const inner = flattenSteps(step.steps, depth + 1);
    rows.push({ key: step.id, id: step.id, kind: 'head', depth, size: inner.length + 2 });
    rows.push(...inner);
    rows.push({ key: footKey(step.id), id: step.id, kind: 'foot', depth, size: 0 });
  }
  return rows;
}

/** A gap between rows, as a place in the tree. */
export type Slot = {
  /** The repeat the gap is inside, `null` at the top level. */
  parentId: string | null;
  /** The position among that parent's steps. */
  index: number;
  depth: number;
  /** Whether the dragged step may go there: repeats only nest so deep. */
  valid: boolean;
};

/**
 * Every gap the row `key` could be dropped in. Its own rows are taken out of the column
 * first; slot `s` is the gap before what is then row `s`, and the last slot is the end.
 */
export function slotsFor(steps: EditableStep[], key: string): Slot[] {
  const rows = flattenSteps(steps);
  const start = rows.findIndex((row) => row.key === key);
  const dragged = findStep(steps, key);
  if (start < 0 || !dragged || rows[start].size === 0) return [];
  const rest = [...rows.slice(0, start), ...rows.slice(start + rows[start].size)];
  const without = removeStep(steps, key);

  const slots: Slot[] = [];
  // The repeats the walk is inside, with how many of their steps it has passed.
  const open: { id: string | null; count: number }[] = [{ id: null, count: 0 }];
  for (let s = 0; s <= rest.length; s++) {
    const here = open[open.length - 1];
    slots.push({
      parentId: here.id,
      index: here.count,
      depth: open.length - 1,
      valid: here.id === null || canNest(without, here.id, dragged),
    });
    const row = rest[s];
    if (!row) break;
    if (row.kind === 'head') open.push({ id: row.id, count: 0 });
    else if (row.kind === 'foot') {
      open.pop();
      open[open.length - 1].count++;
    } else here.count++;
  }
  return slots;
}

/** Moves a step, or a repeat with everything in it, to a place in the tree. */
export function moveStepTo(
  steps: EditableStep[],
  id: string,
  parentId: string | null,
  index: number
): EditableStep[] {
  const step = findStep(steps, id);
  if (!step || (parentId !== null && findStep([step], parentId))) return steps;
  const without = removeStep(steps, id);
  if (parentId !== null && !canNest(without, parentId, step)) return steps;
  const insert = (children: EditableStep[]) => [
    ...children.slice(0, index),
    step,
    ...children.slice(index),
  ];
  const into = (list: EditableStep[]): EditableStep[] =>
    list.map((s) =>
      s.kind !== 'repeat'
        ? s
        : s.id === parentId
          ? { ...s, steps: insert(s.steps) }
          : { ...s, steps: into(s.steps) }
    );
  return parentId === null ? insert(without) : into(without);
}

/** The column after dropping row `key` in slot `slot`: what the drag shows before the tree changes. */
export function rowsAfterDrop(rows: Row[], key: string, slot: number): Row[] {
  const start = rows.findIndex((row) => row.key === key);
  if (start < 0) return rows;
  const block = rows.slice(start, start + rows[start].size);
  const rest = [...rows.slice(0, start), ...rows.slice(start + rows[start].size)];
  return [...rest.slice(0, slot), ...block, ...rest.slice(slot)];
}
