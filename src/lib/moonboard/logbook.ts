import type { BoardKey, LogEntry, Problem } from './types';

/** A quiet gap this long ends a board session. */
export const SESSION_GAP_MS = 30 * 60 * 1000;
/** A lone entry still took some time on the wall. */
const MIN_SESSION_MS = 5 * 60 * 1000;

/** ISO timestamps order as plain strings; `localeCompare` would only be slower. */
const byTime = (a: LogEntry, b: LogEntry) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);

export type ProblemStatus = {
  sent: boolean;
  /** Every go ever logged on the problem. */
  tries: number;
  /** Goes it took the first time it went; 1 is a flash. */
  sentOnTry?: number;
  lastAt?: string;
};

/** What the log says about each problem, by problem id. */
export function statusByProblem(log: LogEntry[]): Map<string, ProblemStatus> {
  const out = new Map<string, ProblemStatus>();
  const oldestFirst = [...log].sort(byTime);
  for (const entry of oldestFirst) {
    const status = out.get(entry.problemId) ?? { sent: false, tries: 0 };
    status.tries += entry.tries;
    if (entry.sent && !status.sent) {
      status.sent = true;
      status.sentOnTry = status.tries;
    }
    status.lastAt = entry.at;
    out.set(entry.problemId, status);
  }
  return out;
}

/** "Sent · flash", "Sent · 3 tries", "Project · 5 tries"; nothing when untouched. */
export function statusLabel(status: ProblemStatus | undefined): string | null {
  if (!status || status.tries === 0) return null;
  if (status.sent)
    return status.sentOnTry === 1 ? 'Sent · flash' : `Sent · ${status.sentOnTry} tries`;
  return `Project · ${status.tries} ${status.tries === 1 ? 'try' : 'tries'}`;
}

/** One entry in words: "Sent on try 3", "Flash", "4 tries · no send". */
export function entryLabel(entry: Pick<LogEntry, 'tries' | 'sent'>): string {
  if (entry.sent) return entry.tries <= 1 ? 'Flash' : `Sent on try ${entry.tries}`;
  return `${entry.tries} ${entry.tries === 1 ? 'try' : 'tries'} · no send`;
}

export type BoardSession = {
  /** The id of its first entry; stable as later entries join. */
  id: string;
  board: BoardKey;
  startedAt: string;
  endedAt: string;
  /** Oldest first. */
  entries: LogEntry[];
  sends: number;
  tries: number;
  /** Grade index of the hardest send, if any. */
  hardest?: number;
  circuitId?: string;
};

/** Groups the log into sessions: entries on one board with no long gap between them. */
export function boardSessions(log: LogEntry[]): BoardSession[] {
  const oldestFirst = [...log].sort(byTime);
  const sessions: BoardSession[] = [];
  for (const entry of oldestFirst) {
    const last = sessions[sessions.length - 1];
    const gap = last ? Date.parse(entry.at) - Date.parse(last.endedAt) : Infinity;
    if (last && last.board === entry.board && gap <= SESSION_GAP_MS) {
      last.entries.push(entry);
      last.endedAt = entry.at;
    } else {
      sessions.push({
        id: entry.id,
        board: entry.board,
        startedAt: entry.at,
        endedAt: entry.at,
        entries: [entry],
        sends: 0,
        tries: 0,
      });
    }
  }
  for (const session of sessions) {
    // A problem sent twice in one session is still one send.
    session.sends = new Set(session.entries.filter((e) => e.sent).map((e) => e.problemId)).size;
    session.tries = session.entries.reduce((n, e) => n + e.tries, 0);
    const sentGrades = session.entries.filter((e) => e.sent && e.grade !== undefined);
    if (sentGrades.length) session.hardest = Math.max(...sentGrades.map((e) => e.grade!));
    const circuits = new Set(session.entries.map((e) => e.circuitId));
    if (circuits.size === 1) session.circuitId = session.entries[0].circuitId;
  }
  return sessions.reverse();
}

/** Minutes on the wall: first to last entry, never less than a few minutes. */
export function sessionMinutes(session: Pick<BoardSession, 'startedAt' | 'endedAt'>): number {
  const ms = Date.parse(session.endedAt) - Date.parse(session.startedAt);
  return Math.round(Math.max(ms, MIN_SESSION_MS) / 60000);
}

/** Entries for one problem, newest first. */
export function entriesFor(log: LogEntry[], problemId: string): LogEntry[] {
  return log.filter((e) => e.problemId === problemId).sort((a, b) => byTime(b, a));
}

/** The problem last visited on a board. */
export function lastProblemId(log: LogEntry[], board: BoardKey): string | undefined {
  let last: LogEntry | undefined;
  for (const entry of log) {
    if (entry.board === board && (!last || entry.at > last.at)) last = entry;
  }
  return last?.problemId;
}

/** What to log for a problem, with the name and grade it has now; the store adds id and time. */
export function makeEntry(
  problem: Pick<Problem, 'id' | 'name' | 'grade'>,
  board: BoardKey,
  input: Pick<LogEntry, 'tries' | 'sent'> &
    Partial<Pick<LogEntry, 'felt' | 'stars' | 'note' | 'circuitId'>>
): Omit<LogEntry, 'id' | 'at'> {
  return {
    problemId: problem.id,
    board,
    name: problem.name,
    grade: problem.grade,
    ...input,
    tries: Math.max(1, Math.round(input.tries)),
  };
}
