import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CopyIcon, QrCodeIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { BoardView } from '@/components/board-view';
import { FeelBadge } from '@/components/feel';
import { Screen } from '@/components/screen';
import { StepList, StepListBoardProvider } from '@/components/step-list';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { WorkoutFacts } from '@/components/workout-facts';
import { getBoard } from '@/lib/boards';
import { relativeDay } from '@/lib/dates';
import { lastSessionForWorkout } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import { holdsInWorkout, withIds } from '@/lib/workout-steps';
import { setsLine, summaryLine } from '@/lib/workout-summary';

export default function WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const hydrated = useStore((s) => s.hydrated);
  const sessions = useStore((s) => s.sessions);
  const duplicateWorkout = useStore((s) => s.duplicateWorkout);
  const last = useMemo(
    () => (id ? lastSessionForWorkout(sessions, id) : undefined),
    [sessions, id]
  );
  const steps = useMemo(() => (workout ? withIds(workout.steps) : []), [workout]);

  if (!workout) {
    return (
      <>
        <Stack.Screen options={{ title: 'Workout' }} />
        <Screen>
          <Text variant="muted">
            {hydrated ? 'This workout no longer exists.' : 'Opening workout…'}
          </Text>
          {hydrated ? (
            <Button variant="outline" className="self-start" onPress={() => router.dismissTo('/')}>
              <Text>Back to home</Text>
            </Button>
          ) : null}
        </Screen>
      </>
    );
  }

  const board = getBoard(workout.board);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Workout',
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push(`/workout/${workout.id}/edit`)}>
              <Text>Edit</Text>
            </Button>
          ),
        }}
      />
      <Screen
        footer={
          <Button size="lg" onPress={() => router.push(`/workout/${workout.id}/run`)}>
            <Text className="text-lg">Start workout</Text>
          </Button>
        }>
        <View className="gap-3 pb-2">
          <Text selectable className="text-3xl tracking-tight font-bold">
            {workout.name}
          </Text>
          {workout.description ? (
            <Text className="leading-6 text-muted-foreground">{workout.description}</Text>
          ) : null}
        </View>

        <WorkoutFacts timings={workout} />

        {board ? (
          <View className="gap-3 rounded-lg border border-border bg-card p-4">
            <Text className="font-medium">{board.name}</Text>
            <BoardView board={board} holds={holdsInWorkout(workout.steps)} />
          </View>
        ) : null}

        <View className="gap-1 pt-2">
          <Text className="text-xl font-semibold">The workout</Text>
          <Text variant="muted">{summaryLine(workout)}</Text>
        </View>
        <StepListBoardProvider board={board}>
          <StepList steps={steps} parentId={null} depth={0} />
        </StepListBoardProvider>

        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="self-start"
            onPress={() => {
              const copy = duplicateWorkout(workout.id);
              if (!copy) return;
              // Push the copy then its editor, so Save returns to the copy. Two pushes
              // queue in order; replace+push in the same tick raced and could drop Edit.
              router.push(`/workout/${copy.id}`);
              router.push(`/workout/${copy.id}/edit`);
            }}>
            <Icon as={CopyIcon} className="size-4" />
            <Text>Duplicate</Text>
          </Button>
          <Button
            variant="outline"
            className="self-start"
            onPress={() => router.push(`/workout/${workout.id}/share`)}>
            <Icon as={QrCodeIcon} className="size-4" />
            <Text>Share</Text>
          </Button>
        </View>

        {last ? (
          <View className="gap-2">
            <Text variant="muted">
              Last done {relativeDay(last.completedAt)} ·{' '}
              {setsLine(last.completedSets, last.totalSets)}
            </Text>
            {last.feel ? <FeelBadge feel={last.feel} /> : null}
          </View>
        ) : (
          <Text variant="muted">Never done</Text>
        )}
      </Screen>
    </>
  );
}
