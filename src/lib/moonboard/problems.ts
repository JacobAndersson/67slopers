import type { BoardKey, CustomProblem, Problem } from './types';

/**
 * One benchmark as bundled: id, name, setter, grade, sends, stars x10, average tries x10,
 * hold sets, then start, middle and finish holds as space-separated grid references.
 * Written by `scripts/moonboard-benchmarks.mjs`.
 */
export type ProblemRow = [
  number,
  string,
  string,
  number,
  number,
  number,
  number,
  number[],
  string,
  string,
  string,
];

const split = (holds: string) => (holds ? holds.split(' ') : []);

export function fromRow(row: ProblemRow): Problem {
  const [id, name, setter, grade, sends, stars, tries, holdSets, start, hold, finish] = row;
  return {
    id: `b${id}`,
    name,
    setter,
    grade,
    sends,
    stars: stars / 10,
    tries: tries / 10,
    holdSets,
    start: split(start),
    hold: split(hold),
    finish: split(finish),
  };
}

export function fromCustom(problem: CustomProblem): Problem {
  return {
    id: problem.id,
    name: problem.name,
    setter: 'You',
    grade: problem.grade,
    holdSets: [],
    start: problem.start,
    hold: problem.hold,
    finish: problem.finish,
    custom: true,
  };
}

/** Loads one list on demand, so the others never leave the bundle's cold storage. */
function rows(board: BoardKey): ProblemRow[] {
  switch (board) {
    case '2016-40':
      return require('./data/2016-40.json');
    case '2017-25':
      return require('./data/2017-25.json');
    case '2017-40':
      return require('./data/2017-40.json');
    case '2019-25':
      return require('./data/2019-25.json');
    case '2019-40':
      return require('./data/2019-40.json');
    case 'mini2020-40':
      return require('./data/mini2020-40.json');
    default:
      return [];
  }
}

const cache = new Map<BoardKey, Problem[]>();

/** The benchmarks for a board, most climbed first. Parsed once per board. */
export function benchmarks(board: BoardKey): Problem[] {
  let list = cache.get(board);
  if (!list) {
    list = rows(board).map(fromRow);
    cache.set(board, list);
  }
  return list;
}

/** Every problem on a board: the climber's own first, then the benchmarks. */
export function allProblems(board: BoardKey, custom: CustomProblem[]): Problem[] {
  return [...custom.filter((p) => p.board === board).map(fromCustom), ...benchmarks(board)];
}

export function findProblem(
  board: BoardKey,
  custom: CustomProblem[],
  id: string
): Problem | undefined {
  if (id.startsWith('c')) {
    const own = custom.find((p) => p.id === id);
    return own ? fromCustom(own) : undefined;
  }
  const parsed = cache.get(board);
  if (parsed) return parsed.find((p) => p.id === id);
  // One problem does not need the whole list parsed: Home asks for just the last one.
  const row = rows(board).find((r) => `b${r[0]}` === id);
  return row ? fromRow(row) : undefined;
}

type Summary = Record<
  BoardKey,
  { count: number; sets: Record<string, number>; sample?: ProblemRow }
>;
const summary = (): Summary => require('./data/summary.json');

/** Benchmarks per layout and angle, for the board picker. Reads the summary, not the lists. */
export function benchmarkCount(board: BoardKey): number {
  return summary()[board]?.count ?? 0;
}

/** How many benchmarks need a hold set at all. */
export function countUsing(board: BoardKey, holdSet: number): number {
  return summary()[board]?.sets[holdSet] ?? 0;
}

/** A bare wall, drawn where there is no benchmark to show. */
const NO_SAMPLE: ProblemRow = [0, '', '', 0, 0, 0, 0, [], '', '', ''];

/**
 * The most climbed benchmark of a board, to draw as an example. The lists are not part of the
 * repository (see `scripts/moonboard-benchmarks.mjs`); without them this is an empty wall.
 */
export function sampleProblem(board: BoardKey): Problem {
  return fromRow(summary()[board]?.sample ?? NO_SAMPLE);
}

/** True when every hold set the problem needs is on the wall. Own problems always are. */
export function climbable(problem: Problem, holdSets: number[]): boolean {
  return problem.holdSets.every((id) => holdSets.includes(id));
}

export function countClimbable(board: BoardKey, holdSets: number[]): number {
  return benchmarks(board).filter((p) => climbable(p, holdSets)).length;
}

export function holdCount(problem: Pick<Problem, 'start' | 'hold' | 'finish'>): number {
  return problem.start.length + problem.hold.length + problem.finish.length;
}
