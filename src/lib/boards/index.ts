import { BOARD_MANIFESTS, type BoardId } from './generated';
import type { BoardManifest, HoldManifest } from './types';

export type { BoardId } from './generated';
export type { BoardManifest as Board, HoldManifest as Hold } from './types';

export const BOARD_IDS = Object.keys(BOARD_MANIFESTS) as BoardId[];

export function isBoardId(id: unknown): id is BoardId {
  return typeof id === 'string' && id in BOARD_MANIFESTS;
}

export function getBoard(id: string | undefined): BoardManifest | undefined {
  return isBoardId(id) ? BOARD_MANIFESTS[id] : undefined;
}

export function getHold(board: BoardManifest, id: string): HoldManifest | undefined {
  return board.holds.find((h) => h.id === id);
}

/**
 * What a hang can be done on: a mirrored pair (both hands), a centre hold (both hands on
 * it), or a hold with no twin (one hand). Selection is symmetric by design, so this is the
 * unit the picker offers and a step stores as `holds`.
 */
export type Grip = {
  /** The left or only hold's id. */
  id: string;
  holdIds: string[];
  name: string;
  row: number;
  hold: HoldManifest;
};

export function grips(board: BoardManifest): Grip[] {
  const out: Grip[] = [];
  for (const hold of board.holds) {
    if (hold.pair && hold.side === 'right') continue; // its left twin represents the pair
    const twin = hold.pair ? getHold(board, hold.pair) : undefined;
    const holdIds = twin ? [hold.id, twin.id] : [hold.id];
    // A pair with different holds on each side (the 2000's top edges) names both.
    const name =
      twin && twin.label !== hold.label
        ? `${nameFor(hold, true)} + ${nameFor(twin, true)}`
        : nameFor(hold);
    out.push({ id: hold.id, holdIds, name, row: hold.row, hold });
  }
  return out.sort((a, b) => a.row - b.row || a.hold.box.x - b.hold.box.x);
}

/** The grip whose holds are exactly `holdIds`, in any order. */
export function gripFor(board: BoardManifest, holdIds: string[]): Grip | undefined {
  const wanted = [...holdIds].sort().join(',');
  return grips(board).find((g) => [...g.holdIds].sort().join(',') === wanted);
}

/** "Medium edges · 20 mm", "20° sloper", "Jugs", "Deep top edge · 40 mm (left)". */
export function gripName(board: BoardManifest, holdIds: string[] | undefined): string {
  if (!holdIds?.length) return '';
  const grip = gripFor(board, holdIds);
  if (grip) return grip.name;
  return holdIds.map((id) => getHold(board, id)?.label ?? id).join(' + ');
}

/** One hold's name; `single` keeps it singular even when it belongs to a pair. */
function nameFor(hold: HoldManifest, single = false): string {
  let label = hold.label.replace(/\s*\(.*\)$/, '');
  if (hold.pair && !single) label = pluralise(label);
  const parts = [label];
  if (hold.depth !== null && !/\d\s*mm/.test(label)) parts.push(`${hold.depth} mm`);
  let name = parts.join(' · ');
  if (!hold.pair && hold.side !== 'center') name += hold.side === 'left' ? ' (left)' : ' (right)';
  return name;
}

function pluralise(label: string): string {
  return /s$/i.test(label) ? label : `${label}s`;
}

/** Rows as the picker groups them. */
export function rowTitle(row: number): string {
  return row === 1 ? 'Top' : `Row ${row}`;
}
