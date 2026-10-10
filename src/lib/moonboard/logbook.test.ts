import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  boardSessions,
  entriesFor,
  entryLabel,
  lastProblemId,
  makeEntry,
  sessionMinutes,
  statusByProblem,
  statusLabel,
} from './logbook';
import type { LogEntry } from './types';

const entry = (
  id: string,
  problemId: string,
  at: string,
  tries: number,
  sent: boolean,
  grade = 5
) =>
  ({
    id,
    problemId,
    board: '2019-40',
    at: `2026-10-09T${at}:00.000Z`,
    tries,
    sent,
    name: problemId,
    grade,
  }) as LogEntry;

test('status adds up tries and remembers which try sent it', () => {
  const status = statusByProblem([
    entry('1', 'a', '18:00', 4, false),
    entry('2', 'a', '18:20', 2, true),
    entry('3', 'a', '18:40', 1, true),
    entry('4', 'b', '18:30', 1, true),
    entry('5', 'c', '18:35', 3, false),
  ]);
  assert.deepEqual(status.get('a'), {
    sent: true,
    tries: 7,
    sentOnTry: 6,
    lastAt: '2026-10-09T18:40:00.000Z',
  });
  assert.equal(statusLabel(status.get('a')), 'Sent · 6 tries');
  assert.equal(statusLabel(status.get('b')), 'Sent · flash');
  assert.equal(statusLabel(status.get('c')), 'Project · 3 tries');
  assert.equal(statusLabel(status.get('z')), null);
});

test('entries read as words', () => {
  assert.equal(entryLabel({ tries: 1, sent: true }), 'Flash');
  assert.equal(entryLabel({ tries: 3, sent: true }), 'Sent on try 3');
  assert.equal(entryLabel({ tries: 1, sent: false }), '1 try · no send');
  assert.equal(entryLabel({ tries: 4, sent: false }), '4 tries · no send');
});

test('a long quiet gap or another board starts a new session', () => {
  const sessions = boardSessions([
    entry('1', 'a', '10:00', 1, true, 3),
    entry('2', 'b', '10:25', 2, true, 7),
    entry('3', 'c', '10:50', 5, false, 9),
    entry('4', 'a', '18:00', 1, true, 3),
    { ...entry('5', 'x', '18:10', 1, true), board: '2016-40' },
  ]);
  assert.equal(sessions.length, 3);
  const morning = sessions[2];
  assert.equal(morning.id, '1');
  assert.equal(morning.entries.length, 3);
  assert.equal(morning.sends, 2);
  assert.equal(morning.tries, 8);
  assert.equal(morning.hardest, 7);
  assert.equal(sessionMinutes(morning), 50);
  assert.equal(sessions[0].board, '2016-40');
});

test('a problem sent twice in a session is one send', () => {
  const [session] = boardSessions([
    entry('1', 'a', '10:00', 1, true),
    entry('2', 'a', '10:10', 1, true),
    entry('3', 'b', '10:20', 2, false),
  ]);
  assert.equal(session.sends, 1);
  assert.equal(session.tries, 4);
});

test('a session of one entry still counts a few minutes', () => {
  const [only] = boardSessions([entry('1', 'a', '10:00', 1, true)]);
  assert.equal(sessionMinutes(only), 5);
  assert.equal(only.hardest, 5);
});

test('entriesFor and lastProblemId read newest first', () => {
  const log = [
    entry('1', 'a', '10:00', 1, false),
    entry('2', 'b', '11:00', 1, true),
    entry('3', 'a', '12:00', 2, true),
  ];
  assert.deepEqual(
    entriesFor(log, 'a').map((e) => e.id),
    ['3', '1']
  );
  assert.equal(lastProblemId(log, '2019-40'), 'a');
  assert.equal(lastProblemId(log, '2016-40'), undefined);
});

test('makeEntry snapshots the name and grade and never logs zero tries', () => {
  const made = makeEntry({ id: 'a', name: 'A', grade: 4 }, '2019-40', { tries: 0, sent: true });
  assert.equal(made.tries, 1);
  assert.equal(made.name, 'A');
  assert.equal(made.grade, 4);
});
