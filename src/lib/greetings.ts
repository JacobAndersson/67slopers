/**
 * The line that opens Home: a couple of words, never a sentence, in the brand's voice: short,
 * warm, direct, plain, like a coach who climbs (brand book p.10-11). No puns, no exclamation
 * marks, at most one knowing climber line per part of the day. It follows the phone's clock: a
 * part of the day picks the pool, a few weekdays add one line, and the choice holds for that part
 * of that day so the screen does not change its mind between two glances.
 */

type Part = { from: number; lines: string[] };

/** Parts of the day by the hour they start at, in order. Late night wraps past midnight. */
const PARTS: Part[] = [
  { from: 0, lines: ['Still up?', 'Rest is training too', 'Late one'] },
  { from: 5, lines: ['Early one', 'First light', 'Up early'] },
  { from: 9, lines: ['Good morning', 'Morning', 'Fresh skin'] },
  { from: 12, lines: ['Good day', 'Midday', 'Lunch break'] },
  { from: 14, lines: ['Good afternoon', 'Afternoon', 'Project time'] },
  { from: 17, lines: ['Good evening', 'Evening session', 'Evening'] },
  { from: 21, lines: ['Late session', 'Short and sharp', 'Night session'] },
];

/** One extra line for some days of the week, by `Date#getDay()`, used from morning to evening. */
const DAYS: Record<number, string[]> = {
  0: ['Sunday session'],
  1: ['New week'],
  5: ['Friday session'],
  6: ['Weekend session'],
};

/** The hour day lines start and stop at: they read wrong in the small hours. */
const DAY_LINES = { from: 5, until: 21 };

/** Every line the app can greet with. */
export const ALL_GREETINGS: string[] = [
  ...PARTS.flatMap((part) => part.lines),
  ...Object.values(DAYS).flat(),
];

/** The hours each part of the day starts at. */
export const PART_STARTS = PARTS.map((part) => part.from);

function partAt(hour: number): Part {
  return PARTS.findLast((part) => hour >= part.from) ?? PARTS[0];
}

/** A small stable hash, so the same part of the same day always lands on the same line. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The greeting for a moment, by the local clock. */
export function greeting(now: Date): string {
  const hour = now.getHours();
  const part = partAt(hour);
  const daytime = hour >= DAY_LINES.from && hour < DAY_LINES.until;
  const pool = daytime ? [...part.lines, ...(DAYS[now.getDay()] ?? [])] : part.lines;
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${part.from}`;
  return pool[hash(key) % pool.length];
}
