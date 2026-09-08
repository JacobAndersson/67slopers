import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { LatestSessionCard } from '@/components/latest-session-card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SessionRow } from '@/components/session-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { MonthCalendar } from '@/components/month-calendar';
import { WorkoutCard } from '@/components/workout-card';
import { useStore } from '@/lib/store/store';

const PREVIEW = 3;

export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);

  const savedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [workouts]
  );
  const latestSessions = useMemo(
    () => [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [sessions]
  );

  return (
    <Screen
      footer={
        <Button size="lg" onPress={() => router.push('/workout/new')}>
          <Text>New workout</Text>
        </Button>
      }>
      <MonthCalendar sessions={sessions} />

      <SectionHeader
        title="Your workouts"
        actionLabel={savedWorkouts.length > PREVIEW ? 'View all' : undefined}
        onAction={() => router.push('/workouts')}
      />
      {savedWorkouts.length > 0 ? (
        <View className="gap-2">
          {savedWorkouts.slice(0, PREVIEW).map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </View>
      ) : (
        <Text variant="muted">No saved workouts. Create one below.</Text>
      )}

      <SectionHeader
        title="Latest workouts"
        actionLabel={latestSessions.length > PREVIEW ? 'View all' : undefined}
        onAction={() => router.push('/sessions')}
      />
      {latestSessions.length > 0 ? (
        <View className="gap-2">
          <LatestSessionCard session={latestSessions[0]} />
          {latestSessions.slice(1, PREVIEW).map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onPress={() => router.push(`/session/${session.id}`)}
            />
          ))}
        </View>
      ) : (
        <Text variant="muted">No sessions yet. Pick a workout above and press Start.</Text>
      )}
    </Screen>
  );
}
