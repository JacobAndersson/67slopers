import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';

import { BoardView } from '@/components/board-view';
import { Screen } from '@/components/screen';
import { StepList, StepListBoardProvider } from '@/components/step-list';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WorkoutFacts } from '@/components/workout-facts';
import { getBoard } from '@/lib/boards';
import { useStore } from '@/lib/store/store';
import { decodeWorkout } from '@/lib/workout-codec';
import { holdsInWorkout, sameTimings, withIds } from '@/lib/workout-steps';

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
          <Button
            variant="outline"
            className="self-start"
            onPress={() => router.replace(Platform.OS === 'web' ? '/' : '/scan')}>
            <Text>{Platform.OS === 'web' ? 'Back to home' : 'Scan again'}</Text>
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
      <Stack.Screen options={{ title: 'Shared workout' }} />
      <Screen
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              className="min-w-28 flex-1"
              onPress={() => {
                setDraft({ name: result.name, timings });
                router.replace('/workout/run');
              }}>
              <Text>Start</Text>
            </Button>
            <Button
              size="lg"
              className="min-w-40 flex-1"
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
        <Text selectable className="text-3xl tracking-tight font-bold">
          {name}
        </Text>
        <View className="rounded-lg bg-secondary p-4">
          <Text>
            {saved
              ? 'You already have this workout.'
              : 'Shared with you. Save it to your workouts, or start it without saving.'}
          </Text>
        </View>
        {result.description ? <Text>{result.description}</Text> : null}

        <WorkoutFacts timings={timings} />

        {board ? (
          <View className="gap-3 rounded-lg border border-border bg-card p-4">
            <Text className="font-medium">{board.name}</Text>
            <BoardView board={board} holds={holdsInWorkout(result.steps)} />
          </View>
        ) : null}

        <Text className="pt-2 text-xl font-semibold">The workout</Text>
        <StepListBoardProvider board={board}>
          <StepList steps={steps} parentId={null} depth={0} />
        </StepListBoardProvider>
      </Screen>
    </>
  );
}
