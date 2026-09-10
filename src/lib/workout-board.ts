import { getBoard, gripFor } from './boards';
import type { Step, WorkoutTimings } from './store/types';
import { validate } from './workout-steps';

/**
 * Board-aware validation: everything `validate` checks, plus that hold choices refer to real
 * grips on the workout's board. Kept out of `workout-steps.ts` so the board manifests (and
 * their image requires) only load with the screens that need them.
 */
export function validateWorkout(timings: WorkoutTimings): string[] {
  const errors = validate(timings.steps);
  const board = getBoard(timings.board);
  if (timings.board && !board) errors.push('Unknown hangboard.');
  const problems = new Set<string>();
  const walk = (steps: Step[]) => {
    for (const s of steps) {
      if (s.kind === 'repeat') {
        walk(s.steps);
        continue;
      }
      if (!s.holds?.length) continue;
      if (!board) problems.add('Pick a hangboard or clear the hold choices.');
      else if (!gripFor(board, s.holds)) problems.add(`Unknown holds for the ${board.name}.`);
    }
  };
  walk(timings.steps);
  return [...errors, ...problems];
}
