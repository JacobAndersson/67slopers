import { useKeepAwake } from 'expo-keep-awake';
import { useNavigation, useRouter } from 'expo-router';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { SkipBackIcon } from 'phosphor-react-native/src/icons/SkipBack';
import { SkipForwardIcon } from 'phosphor-react-native/src/icons/SkipForward';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BoardView } from '@/components/board-view';
import { TimerPhaseLabel } from '@/components/timer-phase-label';
import { BrainrotBoundary } from '@/components/brainrot-boundary';
import { FeelPicker } from '@/components/feel';
import { SessionFacts } from '@/components/session-facts';
import { WorkoutSettings } from '@/components/workout-settings';
import { CLIPS } from '@/lib/brainrot/generated';
import {
  bucketsByGame,
  createBucketRotation,
  hangOrdinal,
  splitHeight,
} from '@/lib/brainrot/rotation';
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
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { getBoard, gripName } from '@/lib/boards';
import { formatClock } from '@/lib/dates';
import { useStore } from '@/lib/store/store';
import { EASE_OUT } from '@/lib/motion';
import { measure } from '@/lib/perf';
import { THEME } from '@/lib/theme';
import type { Feel, WorkoutTimings } from '@/lib/store/types';
import { shouldShowBoard } from '@/lib/timer/board-visibility';
import { sessionFromCheckpoint, type ActiveRun } from '@/lib/timer/checkpoint';
import type { Phase } from '@/lib/timer/intervals';
import { nextUp } from '@/lib/timer/next-up';
import { useCues } from '@/lib/timer/useCues';
import { useRunCheckpoint } from '@/lib/timer/useRunCheckpoint';
import { useTimer } from '@/lib/timer/useTimer';
import { cn } from '@/lib/utils';
import { holdsInWorkout } from '@/lib/workout-steps';
import { setsLine } from '@/lib/workout-summary';

/**
 * Flat background per phase, so the state reads from across the room without the digits.
 * Theme values rather than classes because the colour is tweened with Reanimated.
 */
const PHASE_COLOR: Record<Phase, string> = {
  prep: THEME.accent,
  hang: THEME.chart1,
  pause: THEME.secondary,
  rest: THEME.muted,
  done: THEME.background,
};

const BrainrotVideo = lazy(() => import('@/components/brainrot-video'));

const BG_TRANSITION_MS = 250;
/** The board never grows past this (dp), so the band above the digits always holds it. */
const BOARD_MAX_WIDTH = 340;
/** How long the board takes to fade in or out. */
const SLOT_MS = 250;
/** How long the timer panel takes to glide into and out of the Gen Z split. */
const SPLIT_MS = 300;
/** The display tick; the rising fill glides between ticks over the same span. */
const FILL_STEP_MS = 100;
/** Beat between the timer stopping and the summary fading in. */
const SUMMARY_DELAY_MS = 900;

/** The finish word settles in with a little weight; only a completed workout earns it. */
const donePop = () => {
  'worklet';
  return {
    initialValues: { transform: [{ scale: 0.9 }] },
    animations: {
      transform: [{ scale: withSpring(1, { duration: 350, dampingRatio: 0.8 }) }],
    },
  };
};

/** Summary blocks follow each other in, after the finish word has faded out. */
const summaryEnter = (index: number) =>
  FadeInDown.duration(300)
    .delay(150 + index * 50)
    .easing(EASE_OUT)
    .withInitialValues({ transform: [{ translateY: 8 }] });

const PHASE_LABEL: Record<Phase, string> = {
  prep: 'Get ready',
  hang: 'Hang',
  pause: 'Rest',
  rest: 'Rest',
  done: 'Done',
};

/** Equal bands above and below the digits: whatever fills one, the digits stay centred. */
const BAND = { flex: 1, flexBasis: 0 } as const;

/** Two quiet lines on the phase colour: what it is, then which one. */
function Announcement({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center gap-1">
      <Text
        className="text-center text-xs uppercase tracking-wide text-muted-foreground font-semibold"
        numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-center text-xl font-semibold">{value}</Text>
    </View>
  );
}

type RunnerProps = {
  timings: WorkoutTimings;
  /** Display name for the session. */
  name: string;
  /** The saved workout this run belongs to. Absent for a temporary workout. */
  workoutId?: string;
  /** Prefill for the "save this workout" prompt shown after a temporary workout. */
  saveNameDefault?: string;
  /** An unfinished run picked up from its checkpoint: opens paused where it stood. */
  resume?: ActiveRun;
  /** Count down as soon as the timer opens (Start on Home) instead of waiting for Play. */
  autoStart?: boolean;
};

/**
 * Full-screen timer. Opens ready on the first interval and waits for Play; while running
 * only Pause is shown, Back and Skip appear when paused; the X ends it. Ending (or finishing) leads to
 * the grade step, plus an offer to save the workout when it was not a saved one.
 */
export function Runner({
  timings,
  name,
  workoutId,
  saveNameDefault = '',
  resume,
  autoStart = false,
}: RunnerProps) {
  useKeepAwake();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const [rootHeight, setRootHeight] = useState(height);
  const [rotation] = useState(() => createBucketRotation(bucketsByGame(CLIPS)));
  const [restart, setRestart] = useState(0);

  const addSession = useStore((s) => s.addSession);
  const updateSession = useStore((s) => s.updateSession);
  const addWorkout = useStore((s) => s.addWorkout);
  const timer = useTimer(timings, resume);
  const settings = useStore((s) => s.settings);
  useCues(timer.engineState, settings);
  const idle = timer.status === 'idle';
  const paused = timer.status === 'paused';
  const finished = timer.status === 'done' || timer.status === 'ended';
  const isDraft = !workoutId;

  const [startedAt] = useState(() => resume?.startedAt ?? new Date().toISOString());
  const [feel, setFeel] = useState<Feel | undefined>();
  const [saveName, setSaveName] = useState(saveNameDefault);
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const leaving = useRef(false);
  /** True when the confirm dialog itself paused a running timer, so Keep going resumes it. */
  const pausedForConfirm = useRef(false);
  const askConfirm = useCallback(() => {
    pausedForConfirm.current = timer.status === 'running';
    if (pausedForConfirm.current) timer.pause();
    setConfirmOpen(true);
  }, [timer]);
  const keepGoing = useCallback(() => {
    setConfirmOpen(false);
    if (pausedForConfirm.current) {
      pausedForConfirm.current = false;
      timer.resume();
    }
  }, [timer]);
  /** Set once the finished run has been written to history. */
  const sessionId = useRef<string | null>(null);
  /**
   * The summary waits a beat after the timer stops, so the finish lands instead of
   * flashing straight into the form. The session is still written immediately.
   */
  const [showSummary, setShowSummary] = useState(false);
  useEffect(() => {
    if (!finished) return;
    const id = setTimeout(() => setShowSummary(true), SUMMARY_DELAY_MS);
    return () => clearTimeout(id);
  }, [finished]);

  // A checkpoint follows the run, so a closed app can pick it up again from Home. An older
  // unfinished run still waiting there is kept in history as ended when this one starts.
  const runInfo = useMemo(
    () => ({ workoutId, name, saveNameDefault, timings, startedAt }),
    [workoutId, name, saveNameDefault, timings, startedAt]
  );
  useRunCheckpoint(timer.engineState, runInfo, finished, (older) =>
    addSession(sessionFromCheckpoint(older))
  );

  // Start on Home counts down at once; the overview's Start still opens ready and waits for Play.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || resume || autoStarted.current) return;
    autoStarted.current = true;
    timer.start();
  }, [autoStart, resume, timer]);
  useEffect(() => {
    if (timer.status === 'running') measure('start', 'start → countdown');
  }, [timer.status]);

  // Leaving mid-workout (X, hardware back, gesture) asks first. Before Play, and after
  // finishing, leaving is free.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (leaving.current || idle || finished) return;
      e.preventDefault();
      askConfirm();
    });
  }, [navigation, idle, finished, timer, askConfirm]);

  // The session is written the moment the timer stops, so closing the app on the summary
  // loses nothing. The grade and the save prompt only add to it.
  const { status, elapsedSeconds, completedSets, totalSets, hangResults } = timer;
  useEffect(() => {
    if (!finished || sessionId.current) return;
    sessionId.current = addSession({
      workoutId,
      workoutName: name,
      snapshot: timings,
      startedAt,
      // The session ends when the timer stopped, not when Finish was tapped.
      completedAt: new Date(
        new Date(startedAt).getTime() + Math.round(elapsedSeconds * 1000)
      ).toISOString(),
      completedSets,
      totalSets,
      completed: status === 'done',
      hangs: hangResults,
    }).id;
  }, [
    finished,
    addSession,
    workoutId,
    name,
    timings,
    startedAt,
    elapsedSeconds,
    completedSets,
    totalSets,
    status,
    hangResults,
  ]);

  const grade = (next: Feel) => {
    const value = feel === next ? undefined : next;
    setFeel(value);
    if (sessionId.current) updateSession(sessionId.current, { feel: value });
  };

  const finish = () => {
    const trimmed = saveName.trim();
    if (isDraft && trimmed && sessionId.current) {
      const saved = addWorkout({ name: trimmed, ...timings });
      updateSession(sessionId.current, { workoutId: saved.id, workoutName: trimmed });
    }
    leaving.current = true;
    router.dismissTo('/');
  };

  const onClose = () => {
    if (idle) {
      leaving.current = true;
      if (router.canGoBack()) router.back();
      else router.dismissTo('/');
    } else if (finished) {
      finish();
    } else {
      askConfirm();
    }
  };

  const interval = timer.interval;
  const secondsLeft = Math.ceil(timer.remainingSeconds);
  const countdown = interval.seconds >= 60 ? formatClock(secondsLeft) : String(secondsLeft);
  const board = getBoard(timings.board);
  const allHolds = useMemo(() => holdsInWorkout(timings.steps), [timings]);
  // The board is a setup cue: first prep shows the opening grip (or the opening hang
  // itself when a workout starts there), then only rests (or pauses between reps) where
  // the next grip differs. Later hangs and same-grip rests hide it.
  const shownHolds = timer.previousHang
    ? (timer.nextHang?.holds ?? [])
    : (interval.holds ?? timer.nextHang?.holds ?? []);
  const showBoard = shouldShowBoard({
    phase: interval.phase,
    previousHang: timer.previousHang,
    nextHang: timer.nextHang,
    currentHolds: interval.holds,
    hasBoard: !!board,
    finished,
  });
  const holdsCaption = board ? gripName(board, shownHolds) : '';
  const holdsPrefix = timer.previousHang
    ? 'Next grip'
    : interval.phase === 'hang'
      ? 'Grip'
      : 'First grip';
  const compact = settings.genZMode && !finished;
  // The board sits in the band above the digits, which stay where they are whether it shows
  // or not. Only the Gen Z split, short on room, opens a slot for it instead. Its content is
  // measured once laid out; until then the board's aspect plus the caption is a close estimate.
  const boardWidth = Math.min(width - 80, BOARD_MAX_WIDTH);
  const [slotContent, setSlotContent] = useState(0);
  const slotEstimate = board ? (boardWidth * board.height) / board.width + 70 : 0;
  const slotHeight = slotContent || slotEstimate;
  const slotOpen = useSharedValue(showBoard ? 1 : 0);
  useEffect(() => {
    slotOpen.set(withTiming(showBoard ? 1 : 0, { duration: SLOT_MS }));
  }, [showBoard, slotOpen]);
  const slotStyle = useAnimatedStyle(() => ({
    height: (compact ? slotOpen.get() : 1) * slotHeight,
    opacity: slotOpen.get(),
  }));
  const showRep = interval.repCount > 1 && interval.phase !== 'rest';
  const set = `Set ${interval.setIndex + 1} of ${interval.setCount}`;
  const counter = showRep
    ? `Rep ${interval.repIndex + 1} of ${interval.repCount} · ${set}`
    : interval.phase === 'rest' && timer.previousHang
      ? `${set} done`
      : set;
  // Said only when the pattern breaks; the name of the workout fills the line before Start.
  const announced = idle
    ? { label: name, value: 'Press Start when ready' }
    : nextUp(timer.engineState.intervals, timer.engineState.index, showBoard);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [controlsHeight, setControlsHeight] = useState(96);
  const requiredHeight =
    insets.top +
    24 +
    headerHeight +
    controlsHeight +
    106 * fontScale +
    (showBoard ? slotHeight : 0);
  const panelHeight = splitHeight(rootHeight, requiredHeight, compact);
  const split = panelHeight < rootHeight;
  // Toggling Gen Z mode, or finishing a run, glides the timer panel to its new share
  // instead of jumping; the video below fades in and out around the glide.
  const panelHeightValue = useSharedValue(panelHeight);
  useEffect(() => {
    panelHeightValue.set(withTiming(panelHeight, { duration: SPLIT_MS }));
  }, [panelHeight, panelHeightValue]);
  const animatedPanelStyle = useAnimatedStyle(() => ({ height: panelHeightValue.get() }));
  const ordinal = hangOrdinal(timer.engineState);
  const clipId = compact ? rotation.clipAt(ordinal) : undefined;
  const clip = CLIPS.find((entry) => entry.id === clipId);
  // Fit the actual timer panel, including wrapped labels and board guidance.
  const digitSize = Math.min(
    (width * 0.9) / (countdown.length * 0.62 * fontScale),
    split
      ? Math.max(96, (panelHeight - requiredHeight + 106 * fontScale) / (1.1 * fontScale))
      : height * 0.24
  );

  const hanging = !idle && !finished && interval.phase === 'hang';
  const background = idle || finished ? THEME.background : PHASE_COLOR[interval.phase];
  const backgroundValue = useSharedValue(background);
  // What the previous render showed, so a hang that ran to its end switches instantly: the
  // rising fill has already painted the whole screen in the pause colour by then.
  const last = useRef({ hanging, progress: timer.progress });
  useEffect(() => {
    const completedHang = last.current.hanging && last.current.progress >= 0.95 && !hanging;
    backgroundValue.set(withTiming(background, { duration: completedHang ? 0 : BG_TRANSITION_MS }));
  }, [background, backgroundValue, hanging]);
  useEffect(() => {
    last.current = { hanging, progress: timer.progress };
  });
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: backgroundValue.get() }));

  // During a hang the pause colour climbs from the bottom with the hang's progress. The root
  // is measured because the window height leaves out the status bar on Android.
  const fill = useSharedValue(0);
  useEffect(() => {
    if (!hanging) {
      fill.set(0);
      return;
    }
    fill.set(withTiming(timer.progress, { duration: FILL_STEP_MS, easing: Easing.linear }));
  }, [hanging, timer.progress, fill]);
  const fillStyle = useAnimatedStyle(() => ({ height: fill.get() * panelHeight }));

  return (
    <View
      className="flex-1 bg-background"
      onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}>
      <Animated.View style={[{ overflow: 'hidden' }, backgroundStyle, animatedPanelStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: PHASE_COLOR.pause,
            },
            fillStyle,
          ]}
        />
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            minHeight: compact ? Math.max(panelHeight, requiredHeight) : panelHeight,
            paddingHorizontal: 24,
            paddingTop: insets.top + 8,
            paddingBottom: split ? 12 : insets.bottom + 16,
          }}>
          <View className="gap-1" onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <View className="flex-row items-center justify-between gap-3">
              <Button variant="ghost" size="icon" accessibilityLabel="Close" onPress={onClose}>
                <Icon as={XIcon} className="size-6" />
              </Button>
              <View className="flex-1 items-center">
                {finished ? (
                  <Text className="text-center font-medium" numberOfLines={2}>
                    {name}
                  </Text>
                ) : (
                  <TimerPhaseLabel
                    label={idle ? 'Ready' : paused ? 'Paused' : PHASE_LABEL[interval.phase]}
                  />
                )}
              </View>
              {finished ? <View className="w-11" /> : <WorkoutSettings />}
            </View>
            {finished ? null : (
              <View className="items-center gap-0.5">
                {/* Kept in place before Start, so pressing it moves nothing. */}
                <Text
                  className={cn(
                    'text-center text-sm text-muted-foreground font-medium',
                    idle && 'opacity-0'
                  )}>
                  {counter}
                </Text>
                {interval.label && !idle ? (
                  <Text className="text-center text-sm text-muted-foreground font-medium">
                    {interval.label}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {finished ? (
            showSummary ? (
              <View className="w-full max-w-3xl gap-6 self-center py-6">
                <Animated.View entering={summaryEnter(0)} className="gap-2">
                  <Text className="text-3xl tracking-tight font-bold">
                    {timer.status === 'done' ? 'Workout complete' : 'Workout ended'}
                  </Text>
                  <Text variant="muted">Your session is saved.</Text>
                </Animated.View>
                <Animated.View entering={summaryEnter(1)} className="gap-6">
                  <SessionFacts
                    snapshot={timings}
                    elapsedSeconds={timer.elapsedSeconds}
                    completedSets={timer.completedSets}
                    totalSets={timer.totalSets}
                    hangs={timer.hangResults}
                  />
                </Animated.View>
                <Animated.View entering={summaryEnter(2)} className="gap-3">
                  <Text className="text-xl font-semibold">How did you feel?</Text>
                  <FeelPicker value={feel} onChange={grade} />
                </Animated.View>
                <Animated.View entering={summaryEnter(3)} className="gap-2">
                  <Label nativeID="run-note">Session note (optional)</Label>
                  <Textarea
                    aria-labelledby="run-note"
                    value={note}
                    numberOfLines={3}
                    placeholder="Holds, load, or something to remember."
                    onChangeText={(value) => {
                      setNote(value);
                      if (sessionId.current)
                        updateSession(sessionId.current, { note: value.trim() || undefined });
                    }}
                  />
                </Animated.View>
                {isDraft ? (
                  <Animated.View entering={summaryEnter(4)} className="gap-2">
                    <Text className="text-xl font-semibold">Save this workout?</Text>
                    <Input
                      value={saveName}
                      onChangeText={setSaveName}
                      placeholder="Give it a name to keep it"
                      autoCapitalize="sentences"
                      returnKeyType="done"
                    />
                    <Text variant="muted">Leave it empty to finish without saving.</Text>
                  </Animated.View>
                ) : null}
                <Animated.View entering={summaryEnter(isDraft ? 5 : 4)}>
                  <Button size="lg" onPress={finish}>
                    <Text className="text-lg">
                      {isDraft && saveName.trim() ? 'Save and finish' : 'Finish'}
                    </Text>
                  </Button>
                </Animated.View>
              </View>
            ) : (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(150)}
                className="flex-1 items-center justify-center gap-2">
                <Animated.View entering={timer.status === 'done' ? donePop : undefined}>
                  <Text className="text-5xl tracking-tight font-bold">
                    {timer.status === 'done' ? 'Done' : 'Ended'}
                  </Text>
                </Animated.View>
                <Text className="text-2xl">
                  {setsLine(timer.completedSets, timer.totalSets)} ·{' '}
                  {formatClock(timer.elapsedSeconds)}
                </Text>
              </Animated.View>
            )
          ) : (
            <>
              <View className="flex-1 justify-center">
                <View style={compact ? undefined : BAND}>
                  {board ? (
                    <Animated.View style={[{ overflow: 'hidden' }, slotStyle]}>
                      <View
                        className="items-center gap-4 pt-4"
                        onLayout={(e) => setSlotContent(e.nativeEvent.layout.height)}>
                        <BoardView
                          board={board}
                          holds={shownHolds}
                          mounted={allHolds}
                          animated
                          spotlight
                          style={{ width: boardWidth }}
                        />
                        {holdsCaption ? (
                          <Announcement label={holdsPrefix} value={holdsCaption} />
                        ) : null}
                      </View>
                    </Animated.View>
                  ) : null}
                </View>
                <Text
                  className="text-center tracking-tight font-bold"
                  style={{ fontSize: digitSize, lineHeight: digitSize * 1.1 }}
                  accessibilityLiveRegion="polite">
                  {countdown}
                </Text>
                <View style={compact ? undefined : BAND} className="pt-4">
                  {announced && !compact ? (
                    <Animated.View
                      key={`${announced.label}:${announced.value}`}
                      entering={FadeIn.duration(200)}>
                      <Announcement {...announced} />
                    </Animated.View>
                  ) : null}
                </View>
              </View>

              <View
                className="w-full max-w-3xl self-center"
                onLayout={(e) => setControlsHeight(e.nativeEvent.layout.height)}>
                <View className="flex-row items-center justify-center gap-3">
                  {paused ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-lg"
                      accessibilityLabel="Back"
                      onPress={() => {
                        setRestart((value) => value + 1);
                        timer.back();
                      }}>
                      <Icon as={SkipBackIcon} weight="bold" className="size-7" />
                    </Button>
                  ) : null}
                  <Button
                    className={cn(
                      'flex-1 rounded-lg bg-foreground active:bg-foreground/80',
                      compact ? 'h-16' : 'h-20'
                    )}
                    accessibilityLabel={idle ? 'Start' : paused ? 'Resume' : 'Pause'}
                    onPress={idle ? timer.start : paused ? timer.resume : timer.pause}>
                    <Icon
                      as={idle || paused ? PlayIcon : PauseIcon}
                      weight="bold"
                      className="size-7 text-background"
                    />
                    <Text className="text-lg font-semibold">
                      {idle ? 'Start' : paused ? 'Resume' : 'Pause'}
                    </Text>
                  </Button>
                  {paused ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-lg"
                      accessibilityLabel="Skip"
                      onPress={timer.skip}>
                      <Icon as={SkipForwardIcon} weight="bold" className="size-7" />
                    </Button>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
      {split ? (
        <Animated.View
          entering={FadeIn.duration(SPLIT_MS)}
          exiting={FadeOut.duration(SPLIT_MS)}
          style={{ flex: 1 }}
          className="overflow-hidden bg-muted">
          {clip ? (
            <BrainrotBoundary>
              <Suspense fallback={<View className="flex-1 bg-muted" />}>
                <BrainrotVideo
                  key={`${ordinal}:${restart}:${clip.id}`}
                  clip={clip}
                  playing={timer.status === 'running'}
                  onFailure={() => rotation.fail(clip.id)}
                />
              </Suspense>
            </BrainrotBoundary>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text variant="muted">Video unavailable</Text>
            </View>
          )}
        </Animated.View>
      ) : null}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !open && keepGoing()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be saved with the sets you completed so far.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={keepGoing}>
              <Text>Keep going</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => timer.end()}>
              <Text>End</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
