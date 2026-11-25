import { CalendarXIcon } from 'phosphor-react-native/src/icons/CalendarX';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat';
import { useMemo } from 'react';
import { View } from 'react-native';

import { MetricGrid } from '@/components/metric-grid';
import { ProblemRow } from '@/components/problem-row';
import { MissingScreen } from '@/components/missing-screen';
import { Screen } from '@/components/screen';
import { LargeTitle, SectionHeader } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DOT } from '@/lib/copy';
import { formatShortDate, formatTime } from '@/lib/dates';
import { getLayout, parseBoardKey } from '@/lib/moonboard/boards';
import { startRun } from '@/lib/moonboard/circuits';
import { gradeLabel } from '@/lib/moonboard/grades';
import { formatMinutes } from '@/lib/moonboard/heat';
import { boardSessions, entryLabel, sessionMinutes } from '@/lib/moonboard/logbook';
import { findProblem } from '@/lib/moonboard/problems';
import type { Problem } from '@/lib/moonboard/types';
import { useClimb, useClimbSession } from '@/lib/store/climb';

/** "Mon 16 Nov". */
function dayDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${formatShortDate(date)}`;
}

/**
 * One evening on the board (design: climb-session): how long, how much went, and every problem in the order tried.
 * "Climb these again" keeps them as a circuit and starts it.
 */
export default function BoardSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const log = useClimb((s) => s.log);
  const custom = useClimb((s) => s.custom);
  const scale = useClimb((s) => s.gradeScale);
  const setup = useClimb((s) => s.setup);
  const addCircuit = useClimb((s) => s.addCircuit);
  const setRun = useClimbSession((s) => s.setRun);
  const session = useMemo(() => boardSessions(log).find((s) => s.id === id), [log, id]);
  // Only the problems this session touched are looked up, not the whole board.
  const problems = useMemo(() => {
    const found = new Map<string, Problem>();
    for (const entry of session?.entries ?? []) {
      const problem =
        found.get(entry.problemId) ?? findProblem(session!.board, custom, entry.problemId);
      if (problem) found.set(entry.problemId, problem);
    }
    return found;
  }, [session, custom]);

  if (!session) {
    return (
      <MissingScreen
        icon={CalendarXIcon}
        title={'This session is\nno longer here.'}
        body="It was deleted from your history."
      />
    );
  }
  const where = parseBoardKey(session.board);
  const rows = getLayout(where.layout).rows;
  const unique = [...new Set(session.entries.map((e) => e.problemId))];
  const onThisBoard = !!setup && setup.layout === where.layout && setup.angle === where.angle;

  return (
    <Screen
      header={<TopBar />}
      contentClassName="gap-0"
      footer={
        onThisBoard ? (
          <Button
            size="lg"
            onPress={() => {
              const circuit = addCircuit({
                board: session.board,
                name: `Session ${formatShortDate(session.startedAt)}`,
                problemIds: unique.filter((problemId) => problems.has(problemId)),
              });
              setRun(startRun(circuit));
              router.push(`/climb/circuit/${circuit.id}/run`);
            }}>
            <Icon as={RepeatIcon} size={20} className="text-on-action" />
            <Text>Climb these again</Text>
          </Button>
        ) : undefined
      }>
      <LargeTitle
        title="Board session"
        sub={`${dayDate(session.startedAt)}${DOT}${formatTime(session.startedAt)} to ${formatTime(session.endedAt)}\n${getLayout(where.layout).name}${DOT}${where.angle}°`}
      />
      <View className="mt-5" />
      <MetricGrid
        items={[
          { label: 'Time', value: formatMinutes(sessionMinutes(session)) },
          { label: 'Sends', value: `${session.sends} of ${unique.length}` },
          {
            label: 'Hardest send',
            value: session.hardest !== undefined ? gradeLabel(session.hardest, scale) : '–',
          },
          { label: 'Tries', value: String(session.tries) },
        ]}
      />
      <SectionHeader title="Problems" className="mt-8" />
      <View className="mt-2">
        {session.entries.map((entry) => {
          // A deleted own problem still shows by the name and grade it had.
          const problem: Problem = problems.get(entry.problemId) ?? {
            id: entry.problemId,
            name: entry.name,
            setter: 'No longer in the app',
            grade: entry.grade,
            holdSets: [],
            start: [],
            hold: [],
            finish: [],
          };
          return (
            <ProblemRow
              key={entry.id}
              problem={problem}
              rows={rows}
              scale={scale}
              right={entryLabel(entry)}
              onPress={
                onThisBoard && problems.has(entry.problemId)
                  ? () => router.push(`/climb/problem/${entry.problemId}`)
                  : undefined
              }
            />
          );
        })}
      </View>
    </Screen>
  );
}
