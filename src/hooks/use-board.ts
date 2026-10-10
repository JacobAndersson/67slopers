import { useMemo } from 'react';

import { boardKey, getLayout } from '@/lib/moonboard/boards';
import { statusByProblem, type ProblemStatus } from '@/lib/moonboard/logbook';
import { allProblems } from '@/lib/moonboard/problems';
import type { BoardKey, CustomProblem, LogEntry, Problem } from '@/lib/moonboard/types';
import { useClimb } from '@/lib/store/climb';

/** Remembers the last result, so every screen that asks with the same inputs shares one. */
function memoLast<A extends unknown[], R>(compute: (...args: A) => R): (...args: A) => R {
  let last: { args: A; result: R } | undefined;
  return (...args) => {
    if (!last || args.some((arg, i) => arg !== last!.args[i])) {
      last = { args, result: compute(...args) };
    }
    return last.result;
  };
}

/** Every problem on a board and a lookup by id. Rebuilt only when own problems change. */
const problemsOf = memoLast((board: BoardKey, custom: CustomProblem[]) => {
  const problems = allProblems(board, custom);
  const byId = new Map(problems.map((p) => [p.id, p]));
  return { problems, find: (id: string): Problem | undefined => byId.get(id) };
});

/** What the log says about each problem on a board. Rebuilt only when the log changes. */
const statusOf = memoLast((board: BoardKey, log: LogEntry[]): Map<string, ProblemStatus> =>
  statusByProblem(log.filter((entry) => entry.board === board))
);

/**
 * The climber's wall and what is on it: every problem for the layout and angle, and what
 * the log says about each. Null until a board is set up.
 */
export function useBoard() {
  const setup = useClimb((s) => s.setup);
  const custom = useClimb((s) => s.custom);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);
  return useMemo(() => {
    if (!setup) return null;
    const board = boardKey(setup);
    return {
      setup,
      board,
      rows: getLayout(setup.layout).rows,
      scale,
      ...problemsOf(board, custom),
      status: statusOf(board, log),
    };
  }, [setup, custom, log, scale]);
}
