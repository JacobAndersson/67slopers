import { create } from 'qrcode';

export type Ecc = 'L' | 'M' | 'Q' | 'H';

export type QrMatrix = {
  /** Modules per side. */
  size: number;
  version: number;
  ecc: Ecc;
  /** Row-major, 1 for a dark module. */
  modules: Uint8Array;
};

/** Modules of white margin a scanner expects around the code. */
export const QUIET_ZONE = 4;

/**
 * The smallest QR code that holds `text` (numeric mode for a digit string), then the strongest
 * error correction that still fits that size: a 21×21 code carrying 30 digits gets level M for
 * free instead of L.
 */
export function makeQr(text: string): QrMatrix {
  let best = create(text, { errorCorrectionLevel: 'L' });
  let ecc: Ecc = 'L';
  for (const level of ['H', 'Q', 'M'] as const) {
    try {
      best = create(text, { errorCorrectionLevel: level, version: best.version });
      ecc = level;
      break;
    } catch {
      // Does not fit at this level; try a weaker one.
    }
  }
  return { size: best.modules.size, version: best.version, ecc, modules: best.modules.data };
}

export function isDark(qr: QrMatrix, row: number, col: number): boolean {
  return qr.modules[row * qr.size + col] === 1;
}

/**
 * One SVG path covering every dark module, in module units offset by the quiet zone. Runs of
 * dark modules in a row become a single rectangle.
 */
export function qrPath(qr: QrMatrix, quiet = QUIET_ZONE): string {
  const parts: string[] = [];
  for (let row = 0; row < qr.size; row++) {
    let col = 0;
    while (col < qr.size) {
      if (!isDark(qr, row, col)) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < qr.size && isDark(qr, row, col + run)) run++;
      parts.push(`M${col + quiet} ${row + quiet}h${run}v1h-${run}z`);
      col += run;
    }
  }
  return parts.join('');
}
