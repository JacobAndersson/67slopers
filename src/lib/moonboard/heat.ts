import { startOfDay, startOfWeek } from '../dates';

/** The Log shows eight weeks: two months, every day big enough to tap. */
export const HEAT_WEEKS = 8;
/** The most a day can be: level 5 reads the deepest step of the Glacier scale. */
export const HEAT_MAX = 5;

export type HeatDay = {
  date: Date;
  minutes: number;
  /** 0 to 5. */
  level: number;
  /** After today: not drawn. */
  future: boolean;
};

export type TrainedSpan = { at: string; minutes: number };

/**
 * 0 for nothing, then five steps of minutes trained (design/rivet/app/screens_log.py `heat`):
 * under 10, under 20, under 30, under 45, and more.
 */
export function heatLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 20) return 2;
  if (minutes < 30) return 3;
  if (minutes < 45) return 4;
  return HEAT_MAX;
}

/**
 * The calendar as columns of weeks, Monday first, ending with the week that holds `now`.
 * `spans` are training sessions of any kind with their length.
 */
export function heatGrid(spans: TrainedSpan[], now = new Date(), weeks = HEAT_WEEKS): HeatDay[][] {
  const minutes = new Map<number, number>();
  for (const span of spans) {
    const day = startOfDay(new Date(span.at)).getTime();
    minutes.set(day, (minutes.get(day) ?? 0) + span.minutes);
  }
  const today = startOfDay(now).getTime();
  const first = startOfWeek(now);
  first.setDate(first.getDate() - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(first);
      date.setDate(first.getDate() + week * 7 + day);
      const total = minutes.get(date.getTime()) ?? 0;
      return { date, minutes: total, level: heatLevel(total), future: date.getTime() > today };
    })
  );
}

/** Month names to print above the grid: one where each month's first Monday falls. */
export function monthLabels(grid: HeatDay[][]): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = [];
  grid.forEach((column, week) => {
    const monday = column[0].date;
    const previous = week > 0 ? grid[week - 1][0].date : null;
    if (previous && previous.getMonth() !== monday.getMonth()) {
      labels.push({ week, label: monday.toLocaleDateString(undefined, { month: 'short' }) });
    }
  });
  return labels;
}

/** "21 h 40", "1 h 12", "2 h", "48 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest.toString().padStart(2, '0')}`;
}
