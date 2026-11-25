import { useLocalSearchParams, useRouter } from 'expo-router';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useMemo } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ProblemRow } from '@/components/problem-row';
import { Screen } from '@/components/screen';
import { LargeTitle, SectionHeader } from '@/components/section-header';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { DOT, plural, shortDay } from '@/lib/copy';
import { circuitGrades, circuitProblems, startRun } from '@/lib/moonboard/circuits';
import { gradeRangeLabel } from '@/lib/moonboard/grades';
import { useClimb, useClimbSession } from '@/lib/store/climb';

/** One circuit (design: climb-circuit): its problems in the order they are climbed, and Start. */
export default function CircuitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const board = useBoard();
  const circuit = useClimb((s) => s.circuits.find((c) => c.id === id));
  const log = useClimb((s) => s.log);
  const setRun = useClimbSession((s) => s.setRun);
  const problems = useMemo(
    () => (board && circuit ? circuitProblems(circuit, board.find) : []),
    [board, circuit]
  );
  const last = useMemo(
    () =>
      log
        .filter((e) => e.circuitId === id)
        .reduce<string | null>((at, e) => (!at || e.at > at ? e.at : at), null),
    [log, id]
  );

  if (!board || !circuit) {
    return (
      <Screen header={<TopBar />}>
        <Text className="type-hero">This circuit is{'\n'}no longer here.</Text>
      </Screen>
    );
  }
  const grades = circuitGrades(problems);

  return (
    <Screen
      header={
        <TopBar
          right={
            <IconButton
              icon={PencilSimpleIcon}
              label="Edit circuit"
              onPress={() => router.push(`/climb/circuit/${circuit.id}/edit`)}
            />
          }
        />
      }
      contentClassName="gap-0"
      footer={
        <Button
          size="lg"
          disabled={problems.length === 0}
          onPress={() => {
            setRun(startRun({ ...circuit, problemIds: problems.map((p) => p.id) }));
            router.push(`/climb/circuit/${circuit.id}/run`);
          }}>
          <Icon as={PlayIcon} weight="fill" size={20} className="text-on-action" />
          <Text>Start circuit</Text>
        </Button>
      }>
      <LargeTitle
        title={circuit.name}
        sub={[
          plural(problems.length, 'problem'),
          grades ? gradeRangeLabel(grades[0], grades[1], board.scale) : null,
          last ? `last done ${shortDay(last)}` : 'not done yet',
        ]
          .filter(Boolean)
          .join(DOT)}
      />
      <SectionHeader title="In order" className="mt-6" />
      {problems.length > 0 ? (
        <View className="mt-2">
          {problems.map((problem, index) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              rows={board.rows}
              scale={board.scale}
              status={board.status.get(problem.id)}
              index={index}
              onPress={() => router.push(`/climb/problem/${problem.id}`)}
            />
          ))}
        </View>
      ) : (
        <Text className="type-sub mt-3 text-muted">
          Empty so far. Open any problem and tap the list icon at the top to add it here.
        </Text>
      )}
    </Screen>
  );
}
