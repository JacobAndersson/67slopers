import { useRouter } from 'expo-router';
import { BooksIcon } from 'phosphor-react-native/src/icons/Books';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { WorkoutCard } from '@/components/workout-card';
import { formatClock, relativeDay } from '@/lib/dates';
import { mark } from '@/lib/perf';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';
import { estimateDuration } from '@/lib/workout-summary';

/** The workout library: what is next, every saved workout, and the classics. */
export default function HangScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const sorted = useMemo(() => sortWorkoutsByLastUsed(workouts, sessions), [workouts, sessions]);
  const next = sorted[0];
  const last = useMemo(
    () => (next ? lastSessionForWorkout(sessions, next.id) : undefined),
    [sessions, next]
  );

  return (
    <Screen tab>
      <TabHeader title="Hang">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Classic workouts"
          onPress={() => router.push('/presets')}>
          <Icon as={BooksIcon} className="size-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="New workout"
          onPress={() => router.push('/workout/new')}>
          <Icon as={PlusIcon} className="size-6" />
        </Button>
      </TabHeader>

      {next ? (
        <View className="flex-row items-center gap-4 rounded-2xl bg-secondary p-5">
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens the workout"
            onPress={() => router.push(`/workout/${next.id}`)}
            className="flex-1 gap-1 active:opacity-70">
            <Text className="text-xs font-medium">Next up</Text>
            <Text className="text-lg font-bold" numberOfLines={1}>
              {next.name}
            </Text>
            <Text className="text-xs text-muted-foreground font-medium">
              {formatClock(estimateDuration(next))}
              {last ? ` · last done ${relativeDay(last.completedAt)}` : ' · not done yet'}
            </Text>
          </Pressable>
          <Button
            size="icon"
            className="size-12 rounded-full"
            accessibilityLabel={`Start ${next.name}`}
            onPress={() => {
              mark('start');
              router.push({
                pathname: '/workout/[id]/run',
                params: { id: next.id, autostart: '1' },
              });
            }}>
            <Icon as={PlayIcon} weight="fill" className="size-5 text-primary-foreground" />
          </Button>
        </View>
      ) : null}

      <SectionHeader title="Your workouts" />
      {sorted.length > 0 ? (
        <View className="gap-2">
          {sorted.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </View>
      ) : (
        <Text variant="muted">No saved workouts yet. Start from a classic, or build your own.</Text>
      )}
      <Button variant="outline" onPress={() => router.push('/presets')}>
        <Icon as={BooksIcon} className="size-5" />
        <Text>Classic workouts</Text>
      </Button>
    </Screen>
  );
}
