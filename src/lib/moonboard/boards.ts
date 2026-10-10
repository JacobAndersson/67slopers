import type { Angle, BoardKey, LayoutId, MoonSetup } from './types';

export const COLUMNS = 'ABCDEFGHIJK';

export type Layout = {
  id: LayoutId;
  name: string;
  rows: number;
  angles: Angle[];
  /** Hold sets that exist for this layout, in the order Moon lists them. */
  holdSets: number[];
};

export const LAYOUTS: Layout[] = [
  { id: '2016', name: 'MoonBoard 2016', rows: 18, angles: [40], holdSets: [0, 1, 2] },
  { id: '2017', name: 'Masters 2017', rows: 18, angles: [25, 40], holdSets: [0, 1, 2, 3, 4] },
  { id: '2019', name: 'Masters 2019', rows: 18, angles: [25, 40], holdSets: [0, 1, 2, 4, 5, 6] },
  { id: 'mini2020', name: 'Mini MoonBoard 2020', rows: 12, angles: [40], holdSets: [0, 4, 5, 6] },
];

export type HoldSet = {
  id: number;
  name: string;
  swatch: 'white' | 'black' | 'yellow' | 'red' | 'wood';
};

/** Ids are the ones the benchmark list uses. */
export const HOLD_SETS: HoldSet[] = [
  { id: 0, name: 'Hold set A', swatch: 'white' },
  { id: 1, name: 'Hold set B', swatch: 'black' },
  { id: 2, name: 'Original School Holds', swatch: 'yellow' },
  { id: 3, name: 'Hold set C', swatch: 'red' },
  { id: 4, name: 'Wooden holds A', swatch: 'wood' },
  { id: 5, name: 'Wooden holds B', swatch: 'wood' },
  { id: 6, name: 'Wooden holds C', swatch: 'wood' },
];

export function getLayout(id: LayoutId): Layout {
  return LAYOUTS.find((l) => l.id === id)!;
}

export function getHoldSet(id: number): HoldSet {
  return HOLD_SETS.find((s) => s.id === id)!;
}

export function boardKey(setup: Pick<MoonSetup, 'layout' | 'angle'>): BoardKey {
  return `${setup.layout}-${setup.angle}`;
}

export function parseBoardKey(key: BoardKey): { layout: LayoutId; angle: Angle } {
  const [layout, angle] = key.split('-');
  return { layout: layout as LayoutId, angle: Number(angle) as Angle };
}

/** "Masters 2019 · 40°" */
export function boardLabel(setup: Pick<MoonSetup, 'layout' | 'angle'>): string {
  return `${getLayout(setup.layout).name} · ${setup.angle}°`;
}

/** A fresh setup for a layout: its first angle, every hold set on the wall. */
export function defaultSetup(layout: LayoutId): MoonSetup {
  const l = getLayout(layout);
  return { layout, angle: l.angles[l.angles.length - 1], holdSets: [...l.holdSets] };
}

/** Keeps a setup valid after the layout changes under it. */
export function normalizeSetup(setup: MoonSetup): MoonSetup {
  const l = getLayout(setup.layout);
  const angle = l.angles.includes(setup.angle) ? setup.angle : l.angles[l.angles.length - 1];
  const holdSets = l.holdSets.filter((id) => setup.holdSets.includes(id));
  return { layout: setup.layout, angle, holdSets };
}
