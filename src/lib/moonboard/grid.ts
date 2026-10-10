import { COLUMNS } from './boards';

export type Cell = { col: number; row: number };

/** "E6" -> column 4, row 5 (both from 0, row 0 at the bottom). Null when it is not a hold. */
export function parseHold(hold: string, rows = 18): Cell | null {
  const col = COLUMNS.indexOf(hold[0]?.toUpperCase() ?? '');
  const row = Number(hold.slice(1)) - 1;
  if (col < 0 || !Number.isInteger(row) || row < 0 || row >= rows) return null;
  return { col, row };
}

export function holdName(cell: Cell): string {
  return `${COLUMNS[cell.col]}${cell.row + 1}`;
}

export type Wiring = {
  /** The strip starts on the right-hand side of the wall. */
  mirror?: boolean;
  /** The strip starts at the top. */
  reverse?: boolean;
};

/**
 * The LED behind a hold. The strip runs up column A from A1 (LED 0), down column B, and so
 * on: A18 is 17, B18 is 18, K18 is 197 on an 18-row board.
 */
export function ledIndex(cell: Cell, rows: number, wiring: Wiring = {}): number {
  const col = wiring.mirror ? COLUMNS.length - 1 - cell.col : cell.col;
  const row = wiring.reverse ? rows - 1 - cell.row : cell.row;
  return col * rows + (col % 2 === 0 ? row : rows - 1 - row);
}
