import { useFocusEffect, useRouter } from 'expo-router';
import { ScanIcon } from 'phosphor-react-native/src/icons/Scan';
import { useCallback, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

import { ActiveRunCard } from '@/components/active-run-card';
import { BoardCard } from '@/components/board-card';
import { CalendarStats, WeekCalendar } from '@/components/calendar';
import { HangCard } from '@/components/hang-card';
import { LogRow } from '@/components/log-row';
import { SlabBrand } from '@/components/slab-brand';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { greeting } from '@/lib/greetings';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import { trainedDays, trainingLog, trainingStreak } from '@/lib/training-log';

const PREVIEW = 3;

/**
 * A few words that follow the clock, then both ways to train at the same weight, whichever was
 * used last on top: the last workout one tap from running, the last problem one tap from lit.
 * Below them the streak, the week and the three latest sessions of either kind. An unfinished
 * run always comes first.
 */
export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const scale = useClimb((s) => s.gradeScale);

  // Home stays mounted under everything else: coming back to it in the evening must not
  // still say good morning.
  const [hello, setHello] = useState(() => greeting(new Date()));
  useFocusEffect(useCallback(() => setHello(greeting(new Date())), []));

  const sorted = useMemo(() => sortWorkoutsByLastUsed(workouts, sessions), [workouts, sessions]);
  const [next] = sorted;
  const last = useMemo(
    () => (next ? lastSessionForWorkout(sessions, next.id) : undefined),
    [sessions, next]
  );
  // Board sessions count towards the streak and mark their days, like timer sessions.
  const training = useMemo(() => {
    const items = trainingLog(sessions, log);
    return {
      items,
      streak: trainingStreak(items),
      days: trainedDays(items),
      // Whichever way of training was used last leads.
      climbFirst: items[0]?.kind === 'climb',
    };
  }, [sessions, log]);

  return (
    <Screen tab>
      <View className="min-h-11 flex-row items-center justify-between">
        <SlabBrand />
        {
          // Browsers cannot read QR codes with expo-camera, so scanning is a phone feature.
          Platform.OS === 'web' ? null : (
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Scan a code"
              onPress={() => router.push('/scan')}>
              <Icon as={ScanIcon} className="size-6" />
            </Button>
          )
        }
      </View>
      <Text className="pt-2 text-3xl font-extrabold" role="heading">
        {hello}
      </Text>
      <ActiveRunCard />
      <View className={training.climbFirst ? 'flex-col-reverse gap-3' : 'gap-3'}>
        <HangCard workout={next} last={last} />
        <BoardCard />
      </View>

      <CalendarStats streak={training.streak} sessions={training.items.length} />
      <WeekCalendar trained={training.days} />

      <SectionHeader
        title="Recent sessions"
        actionLabel={training.items.length > PREVIEW ? 'View all' : undefined}
        onAction={() => router.push('/sessions')}
      />
      {training.items.length > 0 ? (
        <View>
          {training.items.slice(0, PREVIEW).map((item) => (
            <LogRow
              key={`${item.kind}${item.id}`}
              item={item}
              scale={scale}
              onPress={() =>
                router.push(
                  item.kind === 'hang' ? `/session/${item.id}` : `/climb/session/${item.id}`
                )
              }
            />
          ))}
        </View>
      ) : (
        <Text variant="muted">No sessions yet.</Text>
      )}
    </Screen>
  );
}
