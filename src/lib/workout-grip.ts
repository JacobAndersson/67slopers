import { getBoard, gripShortName } from './boards';
import type { Workout } from './store/types';

/**
 * The first grip a workout hangs on, without its depth: "Medium edges". This pulls in the board
 * manifests, so Home loads it after its first frame (see `useFirstGrip`).
 */
export function firstGrip(workout: Workout): string | undefined {
  const board = getBoard(workout.board);
  if (!board) return undefined;
  const find = (steps: Workout['steps']): string[] | undefined => {
    for (const step of steps) {
      if (step.kind === 'repeat') {
        const inner = find(step.steps);
        if (inner) return inner;
      } else if (step.kind === 'hang' && step.holds?.length) return step.holds;
    }
  };
  const holds = find(workout.steps);
  return holds ? gripShortName(board, holds) : undefined;
}
