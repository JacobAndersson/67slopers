/**
 * The words the Rivet screens use for training data, in one place so every screen says the same
 * thing the same way (brand rule 09, quiet copy): plain words, ` · ` between facts.
 */
import { DAY_MS, formatClock, formatShortDate, startOfDay, startOfWeek } from './dates';
import type { Workout } from './store/types';
import { countSets } from './timer/intervals';
import type { LogItem } from './training-log';
import { estimateDuration } from './workout-summary';

/** The separator between facts on one line. */
export const DOT = '  ·  ';
/** The same in a caps label, whose tracking already opens it up. */
export const LABEL_DOT = ' · ';

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const NUMBER_WORDS = [
  'no',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

/** Small counts in words, as the copy says them: "six", "Two" (with `capital`); 11 and up in digits. */
export function countWord(n: number, capital = false): string {
  const word = NUMBER_WORDS[n] ?? String(n);
  return capital ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** "Today", "Yesterday", the weekday within the week ("Mon"), then "12 Nov". */
export function shortDay(iso: string, now = new Date()): string {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY_MS
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
  return formatShortDate(iso);
}

/** "Mon" / "Tue, 10 Nov": the heading of a day in a list of sessions. */
export function dayHeading(iso: string, now = new Date()): string {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY_MS
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const date = new Date(iso);
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return `${date.toLocaleDateString(undefined, { weekday: 'short' })}, ${formatShortDate(date)}`;
}

/**
 * The second line of a session row: "Yesterday · 6/6 sets", "Mon · 9 problems, 2 sends". In a
 * list grouped by day, `when` is the time of day instead.
 */
export function sessionLine(item: LogItem, now = new Date(), when?: string): string {
  const day = when ?? shortDay(item.at, now);
  if (item.kind === 'climb') {
    const problems = new Set(item.session.entries.map((e) => e.problemId)).size;
    return [day, `${plural(problems, 'problem')}, ${plural(item.session.sends, 'send')}`].join(DOT);
  }
  const s = item.session;
  return [
    day,
    `${s.completedSets}/${s.totalSets} sets`,
    ...(s.completed ? [] : ['ended early']),
  ].join(DOT);
}

/** A session's title: the workout's name, or "Board session". */
export function sessionTitle(item: LogItem): string {
  return item.kind === 'climb' ? 'Board session' : item.session.workoutName;
}

export type WeekDayBar = {
  label: string;
  name: string;
  minutes: number;
  kind: 'hang' | 'board' | null;
  today: boolean;
};

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** This week, Monday first: minutes trained each day, and whether the board or hangs led. */
export function weekBars(items: LogItem[], now = new Date()): WeekDayBar[] {
  const monday = startOfWeek(now).getTime();
  const today = Math.floor((startOfDay(now).getTime() - monday) / DAY_MS);
  const days = LETTERS.map((label, i) => ({
    label,
    name: NAMES[i],
    minutes: 0,
    board: 0,
    hang: 0,
    today: i === today,
  }));
  for (const item of items) {
    const i = Math.floor((startOfDay(new Date(item.at)).getTime() - monday) / DAY_MS);
    if (i < 0 || i > 6) continue;
    days[i].minutes += item.minutes;
    days[i][item.kind === 'climb' ? 'board' : 'hang'] += item.minutes;
  }
  return days.map(({ board, hang, ...day }) => ({
    ...day,
    kind: day.minutes ? (board > hang ? 'board' : 'hang') : null,
  }));
}

/** "2 sessions · 4-week streak" above the week. */
export function weekSummary(items: LogItem[], streak: number, now = new Date()): string {
  const monday = startOfWeek(now).getTime();
  const count = items.filter((item) => Date.parse(item.at) >= monday).length;
  const parts = [plural(count, 'session')];
  if (streak > 0) parts.push(`${streak}-week streak`);
  return parts.join(DOT);
}

/**
 * The Home greeting set large on two lines: a full stop unless it already ends in punctuation,
 * the words split in half ("Good\nmorning.", "Morning,\nfresh skin.").
 */
export function greetingLines(text: string): string {
  const ended = /[.?!…]$/.test(text) ? text : `${text}.`;
  const words = ended.split(' ');
  if (words.length < 2) return ended;
  const half = Math.floor(words.length / 2);
  return `${words.slice(0, half).join(' ')}\n${words.slice(half).join(' ')}`;
}

/** A workout card's line: "6 sets · 20:52 · Medium edges", the tail (grip, last day) optional. */
export function workoutMeta(workout: Workout, tail?: string): string {
  return [plural(countSets(workout.steps), 'set'), formatClock(estimateDuration(workout)), tail]
    .filter(Boolean)
    .join(DOT);
}
