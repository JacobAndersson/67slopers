import { startOfDay, startOfWeek } from '../dates';

export const HEAT_WEEKS = 16;
/** Strength of each level, as the share of the accent colour. */
export const HEAT_STEPS = [0, 0.24, 0.46, 0.7, 0.94];
/** Minutes of training in a day that fill the scale. */
const FULL_DAY_MINUTES = 90;

export type HeatDay = {
  date: Date;
  minutes: number;
  /** 0 to 4. */
  level: number;
  /** After today: not drawn. */
  future: boolean;
};

export type TrainedSpan = { at: string; minutes: number };

/** 0 for nothing, then four steps up to a full day. Any training at all shows. */
export function heatLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.min(4, 1 + Math.floor((minutes / FULL_DAY_MINUTES) * 4));
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

/** "38 h", "1 h 12", "48 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 10 || rest === 0) return `${hours} h`;
  return `${hours} h ${rest.toString().padStart(2, '0')}`;
}
