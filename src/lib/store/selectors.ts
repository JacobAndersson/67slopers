import { dayKey, isSameDay, startOfWeek } from '../dates';
import type { Session } from './types';

export function latestSession(sessions: Session[]): Session | undefined {
  return [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

export function sessionsOnDay(sessions: Session[], day: Date): Session[] {
  return sessions
    .filter((s) => isSameDay(new Date(s.completedAt), day))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function lastSessionForWorkout(sessions: Session[], workoutId: string): Session | undefined {
  return latestSession(sessions.filter((s) => s.workoutId === workoutId));
}

/** Sessions grouped by local calendar day, keyed with `dayKey`. */
export function sessionsByDay(sessions: Session[]): Map<string, Session[]> {
  const byDay = new Map<string, Session[]>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.completedAt));
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }
  return byDay;
}

/**
 * Consecutive weeks with at least one session, counting back from this week. A week that
 * is still in progress does not break the streak: if it has no session yet, counting starts
 * from last week.
 */
export function weekStreak(sessions: Session[], now = new Date()): number {
  const weeks = new Set(sessions.map((s) => dayKey(startOfWeek(new Date(s.completedAt)))));
  const monday = startOfWeek(now);
  if (!weeks.has(dayKey(monday))) monday.setDate(monday.getDate() - 7);
  let streak = 0;
  while (weeks.has(dayKey(monday))) {
    streak++;
    monday.setDate(monday.getDate() - 7);
  }
  return streak;
}
