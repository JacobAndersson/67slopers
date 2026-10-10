import { dayKey, isSameDay } from './dates';
import { boardSessions, sessionMinutes, type BoardSession } from './moonboard/logbook';
import type { LogEntry } from './moonboard/types';
import { streakOfWeeks } from './store/selectors';
import type { Session } from './store/types';

/** One row of the training log: a timer session or a board session. */
export type LogItem =
  | { kind: 'hang'; id: string; at: string; minutes: number; session: Session }
  | { kind: 'climb'; id: string; at: string; minutes: number; session: BoardSession };

function hangMinutes(session: Session): number {
  const ms = Date.parse(session.completedAt) - Date.parse(session.startedAt);
  return Math.max(1, Math.round(ms / 60000));
}

/** Everything trained, newest first. */
export function trainingLog(sessions: Session[], log: LogEntry[]): LogItem[] {
  const hang: LogItem[] = sessions.map((session) => ({
    kind: 'hang',
    id: session.id,
    at: session.completedAt,
    minutes: hangMinutes(session),
    session,
  }));
  const climb: LogItem[] = boardSessions(log).map((session) => ({
    kind: 'climb',
    id: session.id,
    at: session.endedAt,
    minutes: sessionMinutes(session),
    session,
  }));
  return [...hang, ...climb].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

export function itemsOnDay(items: LogItem[], day: Date): LogItem[] {
  return items.filter((item) => isSameDay(new Date(item.at), day));
}

/** Consecutive weeks with any training, counting back; an empty current week does not break it. */
export function trainingStreak(items: LogItem[], now = new Date()): number {
  return streakOfWeeks(
    items.map((item) => item.at),
    now
  );
}

/** The days with any training, as `dayKey`s, for marking a calendar. */
export function trainedDays(items: LogItem[]): Set<string> {
  return new Set(items.map((item) => dayKey(new Date(item.at))));
}

/** Sessions and minutes since a date, for the figures above the heat calendar. */
export function totalsSince(items: LogItem[], since: Date): { sessions: number; minutes: number } {
  const recent = items.filter((item) => Date.parse(item.at) >= since.getTime());
  return { sessions: recent.length, minutes: recent.reduce((n, item) => n + item.minutes, 0) };
}
