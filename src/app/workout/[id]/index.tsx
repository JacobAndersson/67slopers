import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { FeelBadge } from '@/components/feel';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatClock, formatShort, relativeDay } from '@/lib/dates';
import { lastSessionForWorkout } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import { estimateDuration, setsLine } from '@/lib/workout-summary';

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-lg border border-border bg-card px-2 py-4">
      <Text variant="muted">{label}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-4xl tracking-tight font-bold">{value}</Text>
        {unit ? <Text variant="muted">{unit}</Text> : null}
      </View>
    </View>
  );
}

export default function WorkoutOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === id));
  const sessions = useStore((s) => s.sessions);
  const last = useMemo(
    () => (id ? lastSessionForWorkout(sessions, id) : undefined),
    [sessions, id]
  );

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

  const block = workout.blocks[0];
  const total = estimateDuration(workout);
  const sequence =
    `${block.sets} ${block.sets === 1 ? 'set' : 'sets'} of ${block.reps} × ${block.hangSeconds}s ` +
    (block.reps > 1 ? `hangs with ${block.pauseSeconds}s between reps` : 'hang') +
    (block.sets > 1 ? `, ${formatShort(block.restSeconds)} rest between sets.` : '.');

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
        <View className="flex-row gap-3">
          <Tile label="Hang" value={String(block.hangSeconds)} unit="s" />
          <Tile label="Reps" value={String(block.reps)} />
          {block.reps > 1 ? (
            <Tile label="Pause" value={String(block.pauseSeconds)} unit="s" />
          ) : null}
        </View>
        <View className="flex-row gap-3">
          <Tile label="Sets" value={String(block.sets)} />
          <Tile label="Rest" value={formatShort(block.restSeconds)} />
          <Tile label="Prep" value={String(workout.prepSeconds)} unit="s" />
        </View>

        <View className="gap-1">
          <Text>{sequence}</Text>
          <Text variant="muted">About {formatClock(total)} in total.</Text>
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
