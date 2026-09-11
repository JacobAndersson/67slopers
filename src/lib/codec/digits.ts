/**
 * The workout code in scanned QR data or a link: the `code` parameter of a
 * `slopers67://import?code=` link, or the data itself when it is nothing but digits. Anything
 * else is not a 67slopers code and gives an empty string.
 */
export function normalizeDigits(input: string): string {
  const param = /[?&]code=(\d+)(?:[&#]|$)/.exec(input);
  if (param) return param[1];
  const trimmed = input.trim();
  return /^\d+$/.test(trimmed) ? trimmed : '';
}
