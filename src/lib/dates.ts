const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday 00:00 local time of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return d;
}

/** The seven days (Monday to Sunday) of the week containing `date`, at local midnight. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "Today", "Yesterday", "3 days ago", then a short date once it is older than a week. */
export function relativeDay(iso: string, now = new Date()): string {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY_MS
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Always minutes and seconds: 7 -> "0:07", 180 -> "3:00", 3725 -> "62:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Compact: under a minute as "7s", otherwise as m:ss. */
export function formatShort(totalSeconds: number): string {
  return totalSeconds < 60 ? `${Math.round(totalSeconds)}s` : formatClock(totalSeconds);
}

/** Local time of day, e.g. "18:42". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Stable key for grouping by calendar day in local time. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Monday-to-Sunday rows covering the whole month of `date`. The first and last rows may
 * spill into the neighbouring months so every row is a full week.
 */
export function monthGrid(date: Date): Date[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const rows: Date[][] = [];
  const cursor = startOfWeek(first);
  while (cursor <= last) {
    rows.push(weekDays(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return rows;
}

/** "September 2026" in the device locale. */
export function formatMonth(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** First day of the month `offset` months away from `date` (negative = earlier). */
export function addMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}
