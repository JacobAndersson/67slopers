import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ButtonLabel } from '@/components/button-label';
import { ProblemRow } from '@/components/problem-row';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBoard } from '@/hooks/use-board';
import { relativeDay } from '@/lib/dates';
import { circuitGrades, circuitProblems, startRun } from '@/lib/moonboard/circuits';
import { gradeRangeLabel } from '@/lib/moonboard/grades';
import { useClimb, useClimbSession } from '@/lib/store/climb';

/** One circuit: its problems in the order they are climbed, and Start. */
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
  const last = useMemo(() => log.find((e) => e.circuitId === id), [log, id]);

  if (!board || !circuit) {
    return (
      <Screen>
        <Text variant="muted">This circuit no longer exists.</Text>
      </Screen>
    );
  }
  const grades = circuitGrades(problems);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Edit circuit"
              onPress={() => router.push(`/climb/circuit/${circuit.id}/edit`)}>
              <Icon as={PencilSimpleIcon} className="size-6" />
            </Button>
          ),
        }}
      />
      <Screen
        footer={
          <Button
            size="lg"
            disabled={problems.length === 0}
            onPress={() => {
              setRun(startRun({ ...circuit, problemIds: problems.map((p) => p.id) }));
              router.push(`/climb/circuit/${circuit.id}/run`);
            }}>
            <Icon as={PlayIcon} className="size-5 text-primary-foreground" />
            <ButtonLabel>Start circuit</ButtonLabel>
          </Button>
        }>
        <View className="gap-1">
          <Text className="text-3xl font-bold">{circuit.name}</Text>
          <Text variant="muted">
            {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
            {grades ? ` · ${gradeRangeLabel(grades[0], grades[1], board.scale)}` : ''}
          </Text>
          <Text variant="muted">{last ? `Last done ${relativeDay(last.at)}` : 'Not done yet'}</Text>
        </View>
        <Text variant="h4" className="pt-2">
          In order
        </Text>
        {problems.length > 0 ? (
          <View>
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
          <Text variant="muted">
            Empty so far. Open any problem and tap the list icon in its header to add it here.
          </Text>
        )}
      </Screen>
    </>
  );
}
