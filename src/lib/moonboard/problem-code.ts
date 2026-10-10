import { LAYOUTS, boardKey, getLayout, parseBoardKey } from './boards';
import { MAX_GRADE } from './grades';
import { parseHold } from './grid';
import { holdCount } from './problems';
import { MAX_HOLDS } from './protocol';
import type { BoardKey, CustomProblem, Feet } from './types';

/** What a shared problem carries: everything needed to climb it, nothing about who set it. */
export type SharedProblem = Pick<
  CustomProblem,
  'board' | 'name' | 'grade' | 'feet' | 'start' | 'hold' | 'finish'
>;

const PREFIX = 'MB1';
const FEET: Record<Feet, string> = { any: 'a', follow: 'f', footless: 'n' };
const BOARDS = LAYOUTS.flatMap((l) => l.angles.map((angle) => boardKey({ layout: l.id, angle })));

/**
 * An own problem as text for a QR code, e.g. `MB1;2019-40;5;f;C4F5;E8H10;F18;Slopers`.
 * Fields are separated by `;`, holds are run together, and the name comes last so it may
 * contain anything.
 */
export function encodeProblemCode(problem: SharedProblem): string {
  return [
    PREFIX,
    problem.board,
    problem.grade ?? '-',
    FEET[problem.feet],
    problem.start.join(''),
    problem.hold.join(''),
    problem.finish.join(''),
    problem.name.trim(),
  ].join(';');
}

function holdsFrom(text: string, rows: number): string[] | null {
  const holds = text.match(/[A-K]\d{1,2}/g) ?? [];
  if (holds.join('') !== text) return null;
  return holds.every((hold) => parseHold(hold, rows)) ? holds : null;
}

/** Reads a code back. Null for anything that is not a complete, climbable problem. */
export function decodeProblemCode(text: string): SharedProblem | null {
  const parts = text.trim().split(';');
  if (parts.length < 8 || parts[0] !== PREFIX) return null;
  const [, board, grade, feet, start, hold, finish, ...name] = parts;
  if (!BOARDS.includes(board as BoardKey)) return null;
  const rows = getLayout(parseBoardKey(board as BoardKey).layout).rows;
  const holds = {
    start: holdsFrom(start, rows),
    hold: holdsFrom(hold, rows),
    finish: holdsFrom(finish, rows),
  };
  if (!holds.start || !holds.hold || !holds.finish) return null;
  if (holds.start.length === 0 || holds.finish.length === 0) return null;
  const all = [...holds.start, ...holds.hold, ...holds.finish];
  if (new Set(all).size !== all.length) return null;
  const feetKey = (Object.keys(FEET) as Feet[]).find((key) => FEET[key] === feet);
  const gradeIndex = grade === '-' ? undefined : Number(grade);
  if (!feetKey) return null;
  if (
    gradeIndex !== undefined &&
    !(Number.isInteger(gradeIndex) && gradeIndex >= 0 && gradeIndex <= MAX_GRADE)
  ) {
    return null;
  }
  const problem: SharedProblem = {
    board: board as BoardKey,
    name: name.join(';').trim().slice(0, 60) || 'Shared problem',
    grade: gradeIndex,
    feet: feetKey,
    start: holds.start,
    hold: holds.hold,
    finish: holds.finish,
  };
  return holdCount(problem) <= MAX_HOLDS + 4 ? problem : null;
}
