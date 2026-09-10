import { useKeepAwake } from 'expo-keep-awake';
import { useNavigation, useRouter } from 'expo-router';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, XIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BoardView } from '@/components/board-view';
import { FeelPicker } from '@/components/feel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getBoard, gripName } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { THEME } from '@/lib/theme';
import type { Feel, WorkoutTimings } from '@/lib/store/types';
import type { Phase } from '@/lib/timer/intervals';
import { useTimer } from '@/lib/timer/useTimer';
import { holdsInWorkout } from '@/lib/workout-steps';
import { setsLine } from '@/lib/workout-summary';

/**
 * Flat background per phase, so the state reads from across the room without the digits.
 * Theme values rather than classes because the colour is tweened with Reanimated.
 */
const PHASE_COLOR: Record<Phase, string> = {
  prep: THEME.accent,
  hang: THEME.primary,
  pause: THEME.secondary,
  rest: THEME.muted,
  done: THEME.background,
};

const BG_TRANSITION_MS = 250;

const PHASE_LABEL: Record<Phase, string> = {
  prep: 'Get ready',
  hang: 'Hang',
  pause: 'Rest',
  rest: 'Rest',
  done: 'Done',
};

type RunnerProps = {
  timings: WorkoutTimings;
  /** Display name for the session. */
  name: string;
  /** The saved workout this run belongs to. Absent for a temporary workout. */
  workoutId?: string;
  /** Prefill for the "save this workout" prompt shown after a temporary workout. */
  saveNameDefault?: string;
};

/**
 * Full-screen timer. Opens ready on the first interval and waits for Play; while running
 * only Pause is shown, Back and Skip appear when paused. Ending (or finishing) leads to
 * the grade step, plus an offer to save the workout when it was not a saved one.
 */
export function Runner({ timings, name, workoutId, saveNameDefault = '' }: RunnerProps) {
  useKeepAwake();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const addSession = useStore((s) => s.addSession);
  const addWorkout = useStore((s) => s.addWorkout);
  const timer = useTimer(timings);
  const idle = timer.status === 'idle';
  const paused = timer.status === 'paused';
  const finished = timer.status === 'done' || timer.status === 'ended';
  const isDraft = !workoutId;

  const [startedAt] = useState(() => new Date().toISOString());
  const [feel, setFeel] = useState<Feel | undefined>();
  const [saveName, setSaveName] = useState(saveNameDefault);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const leaving = useRef(false);

  // Leaving mid-workout (X, hardware back, gesture) asks first. Before Play, and after
  // finishing, leaving is free.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (leaving.current || idle || finished) return;
      e.preventDefault();
      timer.pause();
      setConfirmOpen(true);
    });
  }, [navigation, idle, finished, timer]);

  const finish = () => {
    // The session ends when the timer stopped, not when Finish was tapped.
    const completedAt = new Date(
      new Date(startedAt).getTime() + Math.round(timer.elapsedSeconds * 1000)
    ).toISOString();
    const trimmed = saveName.trim();
    const savedId = isDraft && trimmed ? addWorkout({ name: trimmed, ...timings }).id : undefined;
    addSession({
      workoutId: workoutId ?? savedId,
      workoutName: savedId ? trimmed : name,
      snapshot: timings,
      startedAt,
      completedAt,
      completedSets: timer.completedSets,
      totalSets: timer.totalSets,
      completed: timer.status === 'done',
      feel,
    });
    leaving.current = true;
    router.dismissTo('/');
  };

  const onClose = () => {
    if (idle) {
      leaving.current = true;
      router.back();
    } else if (finished) {
      finish();
    } else {
      timer.pause();
      setConfirmOpen(true);
    }
  };

  const interval = timer.interval;
  const secondsLeft = Math.ceil(timer.remainingSeconds);
  const countdown = interval.seconds >= 60 ? formatClock(secondsLeft) : String(secondsLeft);
  const board = getBoard(timings.board);
  const allHolds = useMemo(() => holdsInWorkout(timings.steps), [timings]);
  // During a hang the board shows its holds; otherwise the ones to set up for next.
  const shownHolds = (interval.phase === 'hang' ? interval.holds : timer.nextHang?.holds) ?? [];
  const holdsCaption = board ? gripName(board, shownHolds) : '';
  const nextHoldsName =
    board && timer.nextInterval?.holds ? gripName(board, timer.nextInterval.holds) : '';
  // Geist Mono glyphs are about 0.62 em wide: size the digits to fit the width on one line.
  const digitSize = Math.min(
    (width * 0.9) / (countdown.length * 0.62),
    height * (board ? 0.22 : 0.28)
  );
  const showRep = interval.repCount > 1 && interval.phase !== 'rest';

  const background = idle || finished ? THEME.background : PHASE_COLOR[interval.phase];
  const backgroundValue = useSharedValue(background);
  useEffect(() => {
    backgroundValue.set(withTiming(background, { duration: BG_TRANSITION_MS }));
  }, [background, backgroundValue]);
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: backgroundValue.get() }));

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row items-center justify-between">
          <Button variant="ghost" size="icon" accessibilityLabel="Close" onPress={onClose}>
            <Icon as={XIcon} className="size-6" />
          </Button>
        </View>

        {finished ? (
          <View className="flex-1 justify-center gap-6">
            <View className="gap-2">
              <Text className="text-5xl tracking-tight font-bold">
                {timer.status === 'done' ? 'Done' : 'Ended'}
              </Text>
              <Text className="text-2xl">
                {setsLine(timer.completedSets, timer.totalSets)} ·{' '}
                {formatClock(timer.elapsedSeconds)}
              </Text>
            </View>
            <View className="gap-3">
              <Text className="text-xl font-semibold">How did you feel?</Text>
              <FeelPicker
                value={feel}
                onChange={(f) => setFeel((cur) => (cur === f ? undefined : f))}
              />
            </View>
            {isDraft ? (
              <View className="gap-2">
                <Text className="text-xl font-semibold">Save this workout?</Text>
                <Input
                  value={saveName}
                  onChangeText={setSaveName}
                  placeholder="Give it a name to keep it"
                  autoCapitalize="sentences"
                  returnKeyType="done"
                />
                <Text variant="muted">Leave it empty to finish without saving.</Text>
              </View>
            ) : null}
            <Button size="lg" onPress={finish}>
              <Text className="text-lg">
                {isDraft && saveName.trim() ? 'Save and finish' : 'Finish'}
              </Text>
            </Button>
          </View>
        ) : (
          <>
            <View className="mt-6 items-center gap-1">
              <Text className="text-lg uppercase tracking-wide text-muted-foreground font-semibold">
                {PHASE_LABEL[interval.phase]}
              </Text>
              {interval.label ? (
                <Text className="text-lg text-muted-foreground">{interval.label}</Text>
              ) : null}
              {showRep ? (
                <Text className="text-3xl font-semibold">
                  Rep {interval.repIndex + 1}/{interval.repCount}
                </Text>
              ) : null}
              <Text className="text-xl text-muted-foreground font-medium">
                Set {interval.setIndex + 1}/{interval.setCount}
              </Text>
            </View>

            {board ? (
              <View className="mt-4 gap-1">
                <BoardView board={board} holds={shownHolds} mounted={allHolds} animated />
                {holdsCaption ? (
                  <Text className="text-center text-muted-foreground">
                    {interval.phase === 'hang' ? holdsCaption : `Next: ${holdsCaption}`}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="flex-1 items-center justify-center">
              <Text
                className="tracking-tight font-bold"
                style={{ fontSize: digitSize, lineHeight: digitSize * 1.1 }}
                accessibilityLiveRegion="polite">
                {countdown}
              </Text>
              {idle ? (
                <Text className="text-xl text-muted-foreground">{name} · press play to start</Text>
              ) : timer.nextInterval && timer.nextInterval.phase !== 'done' ? (
                <Text className="text-xl text-foreground/60">
                  Next: {PHASE_LABEL[timer.nextInterval.phase]}{' '}
                  {timer.nextInterval.seconds >= 60
                    ? formatClock(timer.nextInterval.seconds)
                    : `${timer.nextInterval.seconds}s`}
                  {timer.nextInterval.label
                    ? ` · ${timer.nextInterval.label}`
                    : nextHoldsName
                      ? ` · ${nextHoldsName}`
                      : ''}
                </Text>
              ) : (
                <Text className="text-xl text-foreground/60">Last one</Text>
              )}
            </View>

            <View className="flex-row items-center justify-center gap-6">
              {paused ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-full"
                  accessibilityLabel="Back"
                  onPress={timer.back}>
                  <Icon as={SkipBackIcon} className="size-7" />
                </Button>
              ) : null}
              <Button
                size="icon"
                className="h-24 w-24 rounded-full bg-foreground active:bg-foreground/80"
                accessibilityLabel={idle ? 'Start' : paused ? 'Resume' : 'Pause'}
                onPress={idle ? timer.start : paused ? timer.resume : timer.pause}>
                <Icon
                  as={idle || paused ? PlayIcon : PauseIcon}
                  className="size-10 text-background"
                />
              </Button>
              {paused ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-full"
                  accessibilityLabel="Skip"
                  onPress={timer.skip}>
                  <Icon as={SkipForwardIcon} className="size-7" />
                </Button>
              ) : null}
            </View>
          </>
        )}
      </View>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be saved with the sets you completed so far.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => timer.resume()}>
              <Text>Keep going</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => timer.end()}>
              <Text>End</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Animated.View>
  );
}
