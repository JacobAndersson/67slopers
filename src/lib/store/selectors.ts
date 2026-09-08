import { isSameDay, weekDays } from '../dates';
import type { Session } from './types';

export function latestSession(sessions: Session[]): Session | undefined {
  return [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

export function sessionsOnDay(sessions: Session[], day: Date): Session[] {
  return sessions
    .filter((s) => isSameDay(new Date(s.completedAt), day))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

/** Sessions for the Monday–Sunday week containing `date`, grouped per day. */
export function sessionsByWeekDay(
  sessions: Session[],
  date: Date
): { day: Date; sessions: Session[] }[] {
  return weekDays(date).map((day) => ({ day, sessions: sessionsOnDay(sessions, day) }));
}

export function lastSessionForWorkout(sessions: Session[], workoutId: string): Session | undefined {
  return latestSession(sessions.filter((s) => s.workoutId === workoutId));
}
