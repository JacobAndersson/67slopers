import { MAX_HOLDS } from './protocol';
import { holdCount } from './problems';
import type { ProblemHolds, Role } from './types';

export const EMPTY_HOLDS: ProblemHolds = { start: [], hold: [], finish: [] };
/** A problem starts on one or two holds and ends on one or two. */
const LIMIT: Record<Role, number> = { start: 2, hold: MAX_HOLDS, finish: 2 };

export function roleOf(holds: ProblemHolds, hold: string): Role | null {
  if (holds.start.includes(hold)) return 'start';
  if (holds.finish.includes(hold)) return 'finish';
  if (holds.hold.includes(hold)) return 'hold';
  return null;
}

/**
 * Tapping a hold while setting: a free hold takes the chosen role, a hold that already has
 * that role is removed, and a hold with another role changes to the chosen one. A role that
 * is full replaces its oldest hold.
 */
export function tapHold(holds: ProblemHolds, hold: string, role: Role): ProblemHolds {
  const current = roleOf(holds, hold);
  const without: ProblemHolds = {
    start: holds.start.filter((h) => h !== hold),
    hold: holds.hold.filter((h) => h !== hold),
    finish: holds.finish.filter((h) => h !== hold),
  };
  if (current === role) return without;
  if (holdCount(without) >= MAX_HOLDS) return holds;
  const next = [...without[role], hold];
  return { ...without, [role]: next.slice(Math.max(0, next.length - LIMIT[role])) };
}

/** What still stops the draft being a problem, in words; null when it can be saved. */
export function draftProblem(holds: ProblemHolds): string | null {
  if (holds.start.length === 0) return 'add a start hold';
  if (holds.finish.length === 0) return 'add a finish hold';
  return null;
}

/** "2 start · 4 holds · 1 finish" */
export function draftSummary(holds: ProblemHolds): string {
  return `${holds.start.length} start · ${holds.hold.length} ${
    holds.hold.length === 1 ? 'hold' : 'holds'
  } · ${holds.finish.length} finish`;
}
