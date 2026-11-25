import { formatClock } from '../dates';
import type { Interval } from './intervals';

/**
 * Advance widths of the count's glyphs in Nunito Black, in em: every digit is 0.6 (its figures
 * are tabular without asking), the colon 0.272. The count is set 3% tight.
 */
const DIGIT_EM = 0.6;
const COLON_EM = 0.272;
const TRACKING_EM = -0.03;

/** The count never grows past this (times the system font scale), nor under COUNT_MIN. */
export const COUNT_MAX = 240;
const COUNT_MIN = 56;
/** The widest count of a run may take this share of the screen's width. */
const COUNT_WIDTH = 0.92;
/** The count's line height, as a share of its size. */
export const COUNT_LEADING = 1.02;

/** What an interval's count reads with `left` seconds to go: m:ss from a minute up, else seconds. */
export function countText(intervalSeconds: number, left: number): string {
  return intervalSeconds >= 60 ? formatClock(left) : String(left);
}

/** The slots a text fills: the text with every digit as 0, so "3:00" and "1:30" share them. */
export function shapeOf(text: string): string {
  return text.replace(/\d/g, '0');
}

/**
 * The shape of an interval's slots: its first second's text, the longest it shows. Intervals of
 * the same shape ("7" and "3", "3:00" and "1:30") share their slots.
 */
export function countShape(intervalSeconds: number): string {
  return shapeOf(countText(intervalSeconds, intervalSeconds));
}

/** Width of the slot that holds `char` (a digit or the colon), in em. */
export function slotEm(char: string): number {
  return (char === ':' ? COLON_EM : DIGIT_EM) + TRACKING_EM;
}

/**
 * The count laid into its interval's fixed slots, right-aligned: a digit that drops off ("10" to
 * "9", "10:00" to "9:59") becomes a leading zero ("09"), so the slots stay filled, the count stays
 * centred and every other digit stays where it was.
 */
export function countSlots(text: string, shape: string): string[] {
  return [...text.padStart(shape.length, '0')];
}

/**
 * The drawn size of a count that must fit every shape in `shapes`: as large as the widest allows
 * in COUNT_WIDTH of `width` and in `room` (pt, the height left between header and footer), never
 * past COUNT_MAX at the system's `fontScale`. It is the size on screen, font scale included.
 */
export function countSize(shapes: string[], width: number, room: number, fontScale = 1): number {
  const em = Math.max(0, ...shapes.map((shape) => [...shape].reduce((w, c) => w + slotEm(c), 0)));
  const max = COUNT_MAX * fontScale;
  const byWidth = em > 0 ? (width * COUNT_WIDTH) / em : max;
  return Math.max(COUNT_MIN, Math.min(max, byWidth, room / COUNT_LEADING));
}

/** The shapes a run shows while it counts, one per distinct interval shape. */
export function runShapes(intervals: Interval[]): string[] {
  return [
    ...new Set(intervals.filter((i) => i.phase !== 'done').map((i) => countShape(i.seconds))),
  ];
}
