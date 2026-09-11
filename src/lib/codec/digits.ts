/** "123456789" as "1234 5678 9", for reading a code aloud or typing it. */
export function groupDigits(digits: string, size = 4): string {
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += size) groups.push(digits.slice(i, i + size));
  return groups.join(' ');
}

/**
 * The code in whatever was scanned, pasted or typed: the `code` parameter of a link, otherwise
 * the longest run of digits (spaces and dashes between groups allowed), so a shared message
 * such as "Repeaters 7:3 · 1234 5678 9012" yields the code and not the 7 or the 3.
 */
export function normalizeDigits(input: string): string {
  const param = /[?&]code=(\d+)/.exec(input);
  if (param) return param[1];
  let best = '';
  for (const run of input.match(/\d(?:[\d -]*\d)?/g) ?? []) {
    const digits = run.replace(/\D/g, '');
    if (digits.length > best.length) best = digits;
  }
  return best;
}
