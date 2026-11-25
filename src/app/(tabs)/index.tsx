import { useFocusEffect, useRouter } from 'expo-router';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { useCallback, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ActiveRunCard, useActiveRun } from '@/components/active-run-card';
import { BoardCard } from '@/components/board-card';
import { ListRow } from '@/components/card';
import { HangCard } from '@/components/hang-card';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { BoardSprayIcon, HangboardIcon } from '@/components/training-icons';
import { Text } from '@/components/ui/text';
import { WeekBars } from '@/components/week-bars';
import { greetingLines, sessionLine, sessionTitle, weekBars, weekSummary } from '@/lib/copy';
import { greeting } from '@/lib/greetings';
import { LAYOUT_SETTLE, REDUCED_FADE_MS } from '@/lib/motion';
import { lastSessionForWorkout, sortWorkoutsByLastUsed } from '@/lib/store/selectors';
import { useClimb } from '@/lib/store/climb';
import { useStore } from '@/lib/store/store';
import { trainingLog, trainingStreak } from '@/lib/training-log';

const PREVIEW = 3;

/**
 * Home (design: page 03, home-home and its states). A few words that follow the clock, then
 * both ways to train at the same weight, whichever was used last on top: the last workout one
 * tap from running, the last problem one tap from lit. Below them this week and the three
 * latest sessions of either kind. An unfinished run comes first and stands in for the workout.
 */
export default function HomeScreen() {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const sessions = useStore((s) => s.sessions);
  const log = useClimb((s) => s.log);
  const setup = useClimb((s) => s.setup);
  const [run, setRun] = useActiveRun();

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
  const training = useMemo(() => {
    const items = trainingLog(sessions, log);
    const streak = trainingStreak(items);
    return {
      items,
      week: weekBars(items),
      summary: weekSummary(items, streak),
      // Whichever way of training was used last leads.
      climbFirst: items[0]?.kind === 'climb',
    };
  }, [sessions, log]);
  const first = training.items.length === 0;
  // On the first run the other seeded classics are named, so Hang is worth a look.
  const others = sorted.slice(1, 3).map((w) => w.name);
  const more =
    others.length === 2
      ? `Two more classics wait in Hang: ${others[0]} and ${others[1]}.`
      : others.length === 1
        ? `One more classic waits in Hang: ${others[0]}.`
        : null;

  // When the unfinished card goes, the cards under it settle into place instead of jumping.
  const hang =
    next && !run ? (
      <Animated.View key="hang" layout={LAYOUT_SETTLE} entering={FadeIn.duration(REDUCED_FADE_MS)}>
        <HangCard workout={next} last={last} top={!training.climbFirst} first={first} />
      </Animated.View>
    ) : null;
  const board = (
    <Animated.View key="board" layout={LAYOUT_SETTLE}>
      <BoardCard top={training.climbFirst} />
    </Animated.View>
  );

  return (
    <Screen tab contentClassName="gap-0">
      <View className="flex-row items-start justify-between">
        <Text
          className="type-large text-[40px] leading-[41px] tracking-[-0.8px]"
          role="heading"
          accessibilityLabel={hello}>
          {greetingLines(hello)}
        </Text>
        {
          // Browsers cannot read QR codes with expo-camera, so scanning is a phone feature.
          Platform.OS === 'web' ? null : (
            <IconButton
              icon={QrCodeIcon}
              label="Scan a code"
              onPress={() => router.push('/scan')}
            />
          )
        }
      </View>

      <View className="mt-7 gap-3">
        {run ? <ActiveRunCard run={run} onGone={() => setRun(null)} /> : null}
        {training.climbFirst ? (
          <>
            {board}
            {hang}
          </>
        ) : (
          <>
            {hang}
            {first && !setup && more ? (
              <Text className="type-sub mb-3 mt-1 text-muted">{more}</Text>
            ) : null}
            {board}
          </>
        )}
      </View>

      {first ? null : (
        <>
          <SectionHeader title="This week" className="mt-9">
            <Text className="type-sub text-muted">{training.summary}</Text>
          </SectionHeader>
          <WeekBars days={training.week} className="mt-8" />

          <SectionHeader
            title="Recent"
            className="mt-6"
            actionLabel={training.items.length > PREVIEW ? 'View all' : undefined}
            onAction={() => router.push('/sessions')}
          />
          <View className="mt-4 gap-2">
            {training.items.slice(0, PREVIEW).map((item) => (
              <ListRow
                key={`${item.kind}${item.id}`}
                icon={item.kind === 'climb' ? BoardSprayIcon : HangboardIcon}
                board={item.kind === 'climb'}
                title={sessionTitle(item)}
                sub={sessionLine(item)}
                chevron
                onPress={() =>
                  router.push(
                    item.kind === 'hang' ? `/session/${item.id}` : `/climb/session/${item.id}`
                  )
                }
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
