import { MAX_GRADE, MIN_GRADE } from './grades';
import type { ProblemStatus } from './logbook';
import { climbable } from './problems';
import type { Problem } from './types';

export type ProblemTab = 'all' | 'projects' | 'sent' | 'saved' | 'mine';
export type ProblemSort = 'popular' | 'rated' | 'easiest' | 'hardest' | 'name';

export const SORTS: { id: ProblemSort; label: string }[] = [
  { id: 'popular', label: 'Most climbed' },
  { id: 'rated', label: 'Top rated' },
  { id: 'easiest', label: 'Easiest first' },
  { id: 'hardest', label: 'Hardest first' },
  { id: 'name', label: 'A to Z' },
];

export type ProblemFilter = {
  tab: ProblemTab;
  query: string;
  gradeMin: number;
  gradeMax: number;
  sort: ProblemSort;
  hideSent: boolean;
  /** Hide problems that need a hold set the wall does not have. */
  onlyMyHolds: boolean;
};

export const DEFAULT_FILTER: ProblemFilter = {
  tab: 'all',
  query: '',
  gradeMin: MIN_GRADE,
  gradeMax: MAX_GRADE,
  sort: 'popular',
  hideSent: false,
  onlyMyHolds: true,
};

/** Filters the user has changed in the sheet, for the badge on its button. */
export function activeFilterCount(filter: ProblemFilter, range: [number, number]): number {
  return (
    Number(filter.gradeMin > range[0] || filter.gradeMax < range[1]) +
    Number(filter.sort !== DEFAULT_FILTER.sort) +
    Number(filter.hideSent) +
    Number(!filter.onlyMyHolds)
  );
}

/** The easiest and hardest grade in a list, to bound the range control. */
export function gradeRange(problems: Problem[]): [number, number] {
  const grades = problems.flatMap((p) => (p.grade === undefined ? [] : [p.grade]));
  return grades.length ? [Math.min(...grades), Math.max(...grades)] : [MIN_GRADE, MAX_GRADE];
}

/** Problems per grade index across the whole scale, for the histogram. */
export function gradeHistogram(problems: Problem[]): number[] {
  const counts = Array.from({ length: MAX_GRADE + 1 }, () => 0);
  for (const p of problems) if (p.grade !== undefined) counts[p.grade] += 1;
  return counts;
}

const compare: Record<ProblemSort, (a: Problem, b: Problem) => number> = {
  popular: (a, b) => (b.sends ?? 0) - (a.sends ?? 0),
  rated: (a, b) => (b.stars ?? 0) - (a.stars ?? 0) || (b.sends ?? 0) - (a.sends ?? 0),
  easiest: (a, b) => (a.grade ?? 99) - (b.grade ?? 99) || (b.sends ?? 0) - (a.sends ?? 0),
  hardest: (a, b) => (b.grade ?? -1) - (a.grade ?? -1) || (b.sends ?? 0) - (a.sends ?? 0),
  name: (a, b) => a.name.localeCompare(b.name),
};

/**
 * The list the Climb tab shows. Own problems ignore the grade range when they are open and
 * are never hidden for their hold sets.
 */
export function filterProblems(
  problems: Problem[],
  filter: ProblemFilter,
  holdSets: number[],
  status: Map<string, ProblemStatus>,
  /** Hearted problem ids, for the Saved tab. */
  saved: readonly string[] = []
): Problem[] {
  const query = filter.query.trim().toLowerCase();
  const kept = problems.filter((p) => {
    const s = status.get(p.id);
    if (filter.tab === 'mine' && !p.custom) return false;
    if (filter.tab === 'saved' && !saved.includes(p.id)) return false;
    if (filter.tab === 'sent' && !s?.sent) return false;
    if (filter.tab === 'projects' && (!s || s.sent || s.tries === 0)) return false;
    if (filter.hideSent && filter.tab !== 'sent' && s?.sent) return false;
    if (filter.onlyMyHolds && !climbable(p, holdSets)) return false;
    if (p.grade !== undefined && (p.grade < filter.gradeMin || p.grade > filter.gradeMax)) {
      return false;
    }
    if (query && !p.name.toLowerCase().includes(query) && !p.setter.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
  return kept.sort(compare[filter.sort]);
}

/**
 * When nothing matches only because of hold sets: how many problems would show with every
 * set on the wall. Lets the empty state say why.
 */
export function hiddenByHoldSets(
  problems: Problem[],
  filter: ProblemFilter,
  holdSets: number[],
  status: Map<string, ProblemStatus>,
  saved: readonly string[] = []
): number {
  if (!filter.onlyMyHolds) return 0;
  const all = { ...filter, onlyMyHolds: false };
  return (
    filterProblems(problems, all, holdSets, status, saved).length -
    filterProblems(problems, filter, holdSets, status, saved).length
  );
}
