import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CopyIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { FeelBadge } from '@/components/feel';
import { Screen } from '@/components/screen';
import { StepList } from '@/components/step-list';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatClock, relativeDay } from '@/lib/dates';
import { lastSessionForWorkout } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import { withIds } from '@/lib/workout-steps';
import { estimateDuration, setsLine } from '@/lib/workout-summary';

export default function WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
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
          <Text variant="muted">This workout no longer exists.</Text>
          <Button variant="outline" className="self-start" onPress={() => router.dismissTo('/')}>
            <Text>Back to home</Text>
          </Button>
        </Screen>
      </>
    );
  }

  const total = estimateDuration(workout);

  return (
    <>
      <Stack.Screen
        options={{
          title: workout.name,
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
            <Text className="text-lg">Start</Text>
          </Button>
        }>
        <StepList steps={steps} parentId={null} depth={0} />

        <Text variant="muted">About {formatClock(total)} in total.</Text>

        <View className="flex-row items-center gap-4">
          <Button
            variant="outline"
            className="self-start"
            onPress={() => {
              const copy = duplicateWorkout(workout.id);
              if (!copy) return;
              // Land on the copy's overview with its edit screen on top, so Save returns to the copy.
              router.replace(`/workout/${copy.id}`);
              router.push(`/workout/${copy.id}/edit`);
            }}>
            <Icon as={CopyIcon} className="size-4" />
            <Text>Duplicate</Text>
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
