/**
 * The line that opens Home: a couple of words, never a sentence. It follows the clock on the phone: a part of the day picks the
 * pool, a few weekdays add their own lines, and the choice holds for that part of that day so
 * the screen does not change its mind between two glances.
 */

type Part = { from: number; lines: string[] };

/** Parts of the day by the hour they start at, in order. Late night wraps past midnight. */
const PARTS: Part[] = [
  {
    from: 0,
    lines: [
      'Still up?',
      'Midnight session',
      'Night shift',
      'Midnight chalk',
      'One last go',
      'Late one',
      'Quiet hours',
      'Go to bed',
      'Insomnia gains',
      'Shh, neighbours',
      'Sleep is training too',
      'Up late again',
    ],
  },
  {
    from: 5,
    lines: [
      'Dawn patrol',
      'Up early',
      'First light',
      'Rise and hang',
      'Early bird',
      'Coffee first',
      'Sunrise session',
      'Cold holds',
      'Good morning, early one',
      'Before work?',
      'Morning, fresh skin',
      'Up with the sun',
    ],
  },
  {
    from: 9,
    lines: [
      'Good morning',
      'Morning',
      'Fresh skin',
      'Chalk up',
      'Rise and crimp',
      'Sending day',
      'Morning, crusher',
      'Fingers awake?',
      'Hello, sunshine',
      'Top of the morning',
      'Ready to pull?',
      'Warm up first',
    ],
  },
  {
    from: 12,
    lines: [
      'Lunch break hangs',
      'High noon',
      'Midday pull',
      'Hello there',
      'Lunch crimps',
      'Noon session',
      'Quick set?',
      'Desk break',
      'Good day',
      'Hungry for edges',
      'Midday, crusher',
      'Snack, then hang',
    ],
  },
  {
    from: 14,
    lines: [
      'Good afternoon',
      'Afternoon',
      'Shake it out',
      'Afternoon burn',
      'Project time',
      'Coffee wore off?',
      'Three o clock crimps',
      'Hey there',
      'Afternoon, crusher',
      'Try hard hours',
      'Good conditions',
      'Small holds, big plans',
    ],
  },
  {
    from: 17,
    lines: [
      'Good evening',
      'Evening',
      'Prime time',
      'Clocked out',
      'Chalked up',
      'After work burn',
      'Evening session',
      'Send o clock',
      'Evening, crusher',
      'One more burn',
      'Light it up',
      'Golden hour',
    ],
  },
  {
    from: 21,
    lines: [
      'Night owl',
      'Late session',
      'One more set',
      'Evening wind-down',
      'Last go?',
      'Lights low',
      'Good night, almost',
      'Quiet feet',
      'Late burn',
      'Short and sharp',
      'Before bed',
      'Moonlight session',
    ],
  },
];

/** Extra lines for some days of the week, by `Date#getDay()`, used from morning to evening. */
const DAYS: Record<number, string[]> = {
  0: ['Sunday session', 'Easy Sunday', 'Sunday funday'],
  1: ['Fresh week', 'Monday, fresh skin', 'New week'],
  3: ['Midweek burn', 'Halfway there'],
  5: ['Friday fingers', 'Send it, Friday', 'Weekend ahead'],
  6: ['Weekend warrior', 'Saturday session', 'Big day energy'],
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
