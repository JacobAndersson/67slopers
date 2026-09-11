import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { BoardView } from '@/components/board-view';
import { Screen } from '@/components/screen';
import { StepList, StepListBoardProvider } from '@/components/step-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getBoard } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { decodeWorkout } from '@/lib/workout-codec';
import { holdsInWorkout, sameTimings, withIds } from '@/lib/workout-steps';
import { estimateDuration } from '@/lib/workout-summary';

/**
 * A workout from a scanned, linked or typed code. Everything it needs is in the code, so it is
 * shown straight away, offline; nothing is saved until the user chooses to.
 */
export default function ImportScreen() {
  const { code = '' } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const addWorkout = useStore((s) => s.addWorkout);
  const setDraft = useStore((s) => s.setDraft);
  const result = useMemo(() => decodeWorkout(code), [code]);
  const steps = useMemo(() => (result.ok ? withIds(result.steps) : []), [result]);

  if (!result.ok) {
    return (
      <>
        <Stack.Screen options={{ title: 'Shared workout' }} />
        <Screen>
          <Text className="text-lg">{result.error}</Text>
          <Button variant="outline" className="self-start" onPress={() => router.replace('/scan')}>
            <Text>Scan again</Text>
          </Button>
        </Screen>
      </>
    );
  }

  const name = result.name ?? 'Shared workout';
  const board = getBoard(result.board);
  const timings = { ...(result.board ? { board: result.board } : {}), steps: result.steps };
  const saved = workouts.find((w) => w.name === name && sameTimings(w, timings));

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <Screen
        footer={
          <View className="flex-row gap-3">
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onPress={() => {
                setDraft({ name: result.name, timings });
                router.replace('/workout/run');
              }}>
              <Text>Start</Text>
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onPress={() => {
                const workout =
                  saved ??
                  addWorkout({
                    name,
                    ...(result.description ? { description: result.description } : {}),
                    ...timings,
                  });
                router.replace(`/workout/${workout.id}`);
              }}>
              <Text>{saved ? 'Open saved copy' : 'Save'}</Text>
            </Button>
          </View>
        }>
        <Text variant="muted">
          {saved
            ? 'You already have this workout.'
            : 'Shared with you. Save it to your workouts, or start it without saving.'}
        </Text>
        {result.description ? <Text>{result.description}</Text> : null}

        {board ? (
          <View className="gap-1">
            <BoardView board={board} holds={holdsInWorkout(result.steps)} />
            <Text variant="muted">{board.name}</Text>
          </View>
        ) : null}

        <StepListBoardProvider board={board}>
          <StepList steps={steps} parentId={null} depth={0} />
        </StepListBoardProvider>

        <Text variant="muted">About {formatClock(estimateDuration(timings))} in total.</Text>
      </Screen>
    </>
  );
}
