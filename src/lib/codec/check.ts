/**
 * Damm check digit: one digit that catches every single wrong digit and every swap of two
 * neighbouring digits, the usual mistakes when a code is typed from a poster.
 */
const TABLE = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
];

export function checkDigit(digits: string): number {
  let interim = 0;
  for (let i = 0; i < digits.length; i++) interim = TABLE[interim][digits.charCodeAt(i) - 48];
  return interim;
}

export function withCheckDigit(digits: string): string {
  return digits + checkDigit(digits);
}

/** True for digits whose last one is the check digit of the rest. */
export function hasValidCheckDigit(digits: string): boolean {
  return /^\d{2,}$/.test(digits) && checkDigit(digits) === 0;
}
