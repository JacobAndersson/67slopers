import { useRouter } from 'expo-router';
import { LibraryIcon, PlusIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ActiveRunCard } from '@/components/active-run-card';
import { CalendarStats, WeekCalendar } from '@/components/calendar';
import { LatestSessionCard } from '@/components/latest-session-card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SessionRow } from '@/components/session-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { WorkoutCard } from '@/components/workout-card';
import { WorkoutHero } from '@/components/workout-hero';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';

const PREVIEW = 3;

/**
 * The week at a glance, then the workout to do next with a Start that counts down straight
 * away, the other saved workouts (+ builds a new one) and the latest sessions.
 */
export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);

  const sorted = useMemo(() => sortWorkoutsByLastUsed(workouts, sessions), [workouts, sessions]);
  const [next, ...others] = sorted;
  const last = useMemo(
    () => (next ? lastSessionForWorkout(sessions, next.id) : undefined),
    [sessions, next]
  );
  const latestSessions = useMemo(
    () => [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [sessions]
  );

  return (
    <Screen>
      <ActiveRunCard />
      <CalendarStats sessions={sessions} />
      <WeekCalendar sessions={sessions} />

      <SectionHeader title="Next up" />
      {next ? (
        <WorkoutHero workout={next} last={last} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Build your first workout</CardTitle>
            <CardDescription>
              Start from a classic protocol, or put your own together step by step.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <Button size="lg" onPress={() => router.push('/presets')}>
              <Icon as={LibraryIcon} className="size-5 text-primary-foreground" />
              <Text className="text-lg">Classic workouts</Text>
            </Button>
            <Button variant="outline" onPress={() => router.push('/workout/new')}>
              <Text>New workout</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {next ? (
        <>
          <SectionHeader
            title="Your workouts"
            actionLabel={others.length > PREVIEW ? 'View all' : undefined}
            onAction={() => router.push('/workouts')}>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="New workout"
              onPress={() => router.push('/workout/new')}>
              <Icon as={PlusIcon} className="size-6" />
            </Button>
          </SectionHeader>
          {others.length > 0 ? (
            <View className="gap-2">
              {others.slice(0, PREVIEW).map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </View>
          ) : (
            <Text variant="muted">Tap + to build another workout.</Text>
          )}
        </>
      ) : null}

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
        <Text variant="muted">No sessions yet. Press Start to do your first.</Text>
      )}
    </Screen>
  );
}
