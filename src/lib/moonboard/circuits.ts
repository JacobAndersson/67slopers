import type { Circuit, Problem } from './types';

/** Problems of a circuit that still exist, in order. */
export function circuitProblems(circuit: Circuit, lookup: (id: string) => Problem | undefined) {
  return circuit.problemIds.flatMap((id) => {
    const problem = lookup(id);
    return problem ? [problem] : [];
  });
}

/** The easiest and hardest graded problem, or null when none has a grade. */
export function circuitGrades(problems: Problem[]): [number, number] | null {
  const grades = problems.flatMap((p) => (p.grade === undefined ? [] : [p.grade]));
  return grades.length ? [Math.min(...grades), Math.max(...grades)] : null;
}

export function toggleProblem(circuit: Circuit, problemId: string): Circuit {
  const has = circuit.problemIds.includes(problemId);
  return {
    ...circuit,
    problemIds: has
      ? circuit.problemIds.filter((id) => id !== problemId)
      : [...circuit.problemIds, problemId],
  };
}

export type CircuitResult = { problemId: string; tries: number; sent: boolean };

/** A circuit being climbed. Lives in memory; each result is logged as it happens. */
export type CircuitRun = {
  circuitId: string;
  problemIds: string[];
  index: number;
  results: CircuitResult[];
};

export function startRun(circuit: Circuit): CircuitRun {
  return { circuitId: circuit.id, problemIds: [...circuit.problemIds], index: 0, results: [] };
}

/** Records the current problem and steps to the next; past the last one the run is done. */
export function advance(run: CircuitRun, result: Omit<CircuitResult, 'problemId'>): CircuitRun {
  if (isDone(run)) return run;
  return {
    ...run,
    index: run.index + 1,
    results: [...run.results, { problemId: run.problemIds[run.index], ...result }],
  };
}

export function isDone(run: CircuitRun): boolean {
  return run.index >= run.problemIds.length;
}

export function runSummary(run: CircuitRun) {
  return {
    total: run.problemIds.length,
    sent: run.results.filter((r) => r.sent).length,
    tries: run.results.reduce((n, r) => n + r.tries, 0),
  };
}
