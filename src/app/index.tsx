import { Stack, useRouter } from 'expo-router';
import { LibraryIcon, PlusIcon, ScanQrCodeIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';

import { ActiveRunCard } from '@/components/active-run-card';
import { CalendarStats, WeekCalendar } from '@/components/calendar';
import { SlabBrand } from '@/components/slab-brand';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SessionRow } from '@/components/session-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { WorkoutCard } from '@/components/workout-card';
import { WorkoutHero } from '@/components/workout-hero';
import { WorkoutRail } from '@/components/workout-rail';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/store';

const PREVIEW = 3;

/**
 * The last-used workout starts in one tap, followed by the week, a saved-workout rail,
 * and the three latest sessions. Recovery always takes priority above the hero.
 */
export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const boardSetupDone = useStore((s) => s.boardSetupDone);

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
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <SlabBrand />,
          // Browsers cannot read QR codes with expo-camera, so scanning is a phone feature.
          headerRight:
            Platform.OS === 'web'
              ? undefined
              : () => (
                  <Button
                    variant="ghost"
                    size="icon"
                    accessibilityLabel="Scan a workout code"
                    onPress={() => router.push('/scan')}>
                    <Icon as={ScanQrCodeIcon} className="size-6" />
                  </Button>
                ),
        }}
      />
      <Screen>
        <ActiveRunCard />
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

        {!boardSetupDone ? (
          <Button variant="outline" onPress={() => router.push('/board-setup')}>
            <Text>Choose your hangboard</Text>
          </Button>
        ) : null}
        <CalendarStats sessions={sessions} />
        <WeekCalendar sessions={sessions} />

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
              <WorkoutRail>
                {others.slice(0, PREVIEW).map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} compact />
                ))}
              </WorkoutRail>
            ) : (
              <Text variant="muted">Tap + to build another workout.</Text>
            )}
          </>
        ) : null}

        <SectionHeader
          title="Recent sessions"
          actionLabel={latestSessions.length > PREVIEW ? 'View all' : undefined}
          onAction={() => router.push('/sessions')}
        />
        {latestSessions.length > 0 ? (
          <View className="gap-2">
            {latestSessions.slice(0, PREVIEW).map((session) => (
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
    </>
  );
}
