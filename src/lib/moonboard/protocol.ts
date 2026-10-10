import { parseHold, ledIndex, type Wiring } from './grid';
import { ROLES, type ProblemHolds, type Role } from './types';

/**
 * The LED kit's Bluetooth protocol, as reverse-engineered by e-sr/moonboard,
 * FabianRig/ArduinoMoonBoardLED and willslawrence/moonboard. Nordic UART, write only:
 * the box never answers.
 */
export const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const UART_WRITE = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
/** Kits advertise as "MoonBoard A" unless renamed. */
export const DEVICE_NAME_PREFIX = 'moonboard';

/** One BLE write carries at most this many bytes. */
export const CHUNK_BYTES = 20;
/** Pause between chunks, as the known-good clients do. */
export const CHUNK_GAP_MS = 30;
/**
 * The box cuts long messages off without saying so, somewhere around 45 holds. Own problems
 * stop well short of it.
 */
export const MAX_HOLDS = 30;

const LETTER: Record<Role, string> = { start: 'S', hold: 'P', finish: 'E' };

export type EncodeOptions = Wiring & {
  rows: number;
  /** Also light the LED above each hold (LED kit V2 and newer). */
  above?: boolean;
};

/**
 * A problem as the box expects it: `l#S5,P9,E18#`. Every message redraws the whole wall.
 * Holds go in ascending LED order; grouped by role the box mis-colours them. Holds that are
 * not on the board are left out.
 */
export function encodeProblem(holds: ProblemHolds, options: EncodeOptions): string {
  const leds: { index: number; letter: string }[] = [];
  for (const role of ROLES) {
    for (const name of holds[role]) {
      const cell = parseHold(name, options.rows);
      if (cell) leds.push({ index: ledIndex(cell, options.rows, options), letter: LETTER[role] });
    }
  }
  leds.sort((a, b) => a.index - b.index);
  const flags = (options.rows === 12 ? 'M' : '') + (options.above ? 'D' : '');
  const body = leds.map((led) => `${led.letter}${led.index}`).join(',');
  return `${flags ? `~${flags}*` : ''}l#${body}#`;
}

/** The message that blanks the wall: a problem with no holds. */
export const CLEAR = 'l##';

/** The four corners in blue, to check wiring and orientation at a glance. */
export function encodeCorners(options: EncodeOptions): string {
  return encodeProblem(cornerHolds(options.rows), { ...options, above: false });
}

/** The corner pattern as holds, so the screen draws exactly what the wall is sent. */
export function cornerHolds(rows: number): ProblemHolds {
  return { start: [], hold: ['A1', 'K1', `A${rows}`, `K${rows}`], finish: [] };
}

/** Splits a message into BLE-sized writes. The protocol is plain ASCII. */
export function chunks(message: string, size = CHUNK_BYTES): string[] {
  const out: string[] = [];
  for (let i = 0; i < message.length; i += size) out.push(message.slice(i, i + size));
  return out;
}

/** True for a name a kit would advertise. */
export function isBoardName(name: string | null | undefined): boolean {
  return !!name && name.toLowerCase().startsWith(DEVICE_NAME_PREFIX);
}
