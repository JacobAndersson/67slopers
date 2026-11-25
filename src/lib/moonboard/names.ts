/**
 * How a problem's name is shown: as its setter typed it, except that a name typed all in
 * capitals reads in sentence case, so a list does not shout (brand review: a name is someone
 * else's, so change as little as possible). The stored name is never changed.
 */
export function displayName(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4 || letters !== letters.toUpperCase()) return name;
  const lower = name.toLowerCase();
  // The pronoun keeps its capital, with its contractions: "Sorry I missed", "I'm back".
  return lower.replace(/[a-z]/, (c) => c.toUpperCase()).replace(/\bi\b/g, 'I');
}

/** A problem's holds in words, for a screen reader: "Start A5. Hands E8, E10. Finish J18." */
export function describeHolds(holds: {
  start: string[];
  hold: string[];
  finish: string[];
}): string {
  const parts: string[] = [];
  if (holds.start.length) parts.push(`Start ${holds.start.join(', ')}.`);
  if (holds.hold.length) parts.push(`Hands ${holds.hold.join(', ')}.`);
  if (holds.finish.length) parts.push(`Finish ${holds.finish.join(', ')}.`);
  return parts.join(' ') || 'No holds yet.';
}
