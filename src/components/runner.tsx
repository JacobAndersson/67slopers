import { useKeepAwake } from 'expo-keep-awake';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { SkipForwardIcon } from 'phosphor-react-native/src/icons/SkipForward';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HangboardDiagram } from '@/components/hangboard-diagram';
import { BrainrotBoundary } from '@/components/brainrot-boundary';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { SetBars } from '@/components/data-bars';
import { FeelPicker } from '@/components/feel';
import { Field } from '@/components/field';
import { PitchMark } from '@/components/rivet-mark';
import { TimerPhaseLabel } from '@/components/timer-phase-label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WorkoutSettings } from '@/components/workout-settings';
import { CLIPS } from '@/lib/brainrot/generated';
import {
  bucketsByGame,
  createBucketRotation,
  hangOrdinal,
  splitHeight,
} from '@/lib/brainrot/rotation';
import { getBoard, gripShortName } from '@/lib/boards';
import { countWord, DOT, plural } from '@/lib/copy';
import { sessionVerdict } from '@/lib/session-sets';
import { formatClock } from '@/lib/dates';
import { EASE_OUT, liftIn, REDUCED_FADE_MS, SPRING_SETTLE } from '@/lib/motion';
import { measure } from '@/lib/perf';
import { useStore } from '@/lib/store/store';
import type { Feel, WorkoutTimings } from '@/lib/store/types';
import { PALETTE, SESSION } from '@/lib/theme';
import { gripCue } from '@/lib/timer/grip-cue';
import { sessionFromCheckpoint, type ActiveRun } from '@/lib/timer/checkpoint';
import { energyTarget } from '@/lib/timer/energy';
import type { Interval } from '@/lib/timer/intervals';
import { intervalWord, nextUp, spokenDuration } from '@/lib/timer/next-up';
import { useCues } from '@/lib/timer/useCues';
import { useRunCheckpoint } from '@/lib/timer/useRunCheckpoint';
import { useTimer } from '@/lib/timer/useTimer';
import { useAppTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';
import { workoutFacts } from '@/lib/workout-summary';

const BrainrotVideo = lazy(() => import('@/components/brainrot-video'));
// Skia loads with the field, so only once a timer is open and never on the way to Home.
const HangField = lazy(() => import('@/components/hang-field'));

/** The ground crossfades between states in this long (brand: state change 250 ms). */
const GROUND_MS = 250;
/** How long the timer panel takes to glide into and out of the Gen Z split. */
const SPLIT_MS = 300;
/** The display tick; the rising fill glides between ticks over the same span. */
const FILL_STEP_MS = 100;
/** The quiet beat on Night between the timer stopping and the summary. */
/**
 * Done: the three bars step up, then the word lifts in as the third lands (WORDS_AT), and the
 * screen holds for a breath (or until a tap) before the summary.
 */
const WORDS_AT_MS = 680;
const SUMMARY_DELAY_MS = WORDS_AT_MS + 400 + 1800;
/** Night crossfades to the summary's ground in this long. */
const SUMMARY_GROUND_MS = 120;
/** The Pitch's bars rise with the three closing notes, this far apart. */
const NOTE_MS = 180;

/** Board diagram width on a 390 pt screen (design: x 64, w 262). */
const BOARD_INSET = 64;
/** The interval's count: 240 for one or two digits, 150 for m:ss, 120 for mm:ss (design). */
const countSize = (text: string) => (text.length <= 2 ? 240 : text.length <= 4 ? 150 : 120);

/** Which session colour a running interval wears. */
function stateOf(interval: Interval): keyof typeof SESSION {
  if (interval.phase === 'prep') return 'ready';
  if (interval.phase === 'hang') return 'hang';
  if (interval.phase === 'done') return 'done';
  return interval.recover ? 'recover' : 'rest';
}

/** The big line under the word: "Set 2 of 6 · Rep 4 of 6", "2 of 6 sets done". */
function setLine(interval: Interval): string {
  if (interval.recover) return `${interval.setIndex + 1} of ${interval.setCount} sets done`;
  const set = `Set ${interval.setIndex + 1} of ${interval.setCount}`;
  return interval.repCount > 1
    ? `${set}${DOT}Rep ${interval.repIndex + 1} of ${interval.repCount}`
    : set;
}

/** A 64 pt round control drawn on the session ground: a hairline ring in the ground's ink. */
function GroundButton({
  icon: IconGlyph,
  label,
  color,
  onPress,
}: {
  icon: PhosphorIcon;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="size-16 items-center justify-center rounded-full active:opacity-60"
      style={{ borderWidth: 1, borderColor: `${color}40` }}>
      <IconGlyph size={26} weight="bold" color={color} />
    </Pressable>
  );
}

/** The one big control: Start, Pause or Resume, an 88 pt Ink pill with a word. */
function MainControl({
  icon: IconGlyph,
  label,
  disc,
  glyph,
  wide,
  compact,
  onPress,
}: {
  icon: PhosphorIcon;
  label: string;
  disc: string;
  glyph: string;
  wide?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'flex-row items-center justify-center gap-2.5 rounded-full active:opacity-90',
        wide ? 'flex-1' : 'w-44'
      )}
      style={{ height: compact ? 72 : 88, backgroundColor: disc }}>
      {/* Fill inside the solid pill: it reads at a glance from a metre away (brand review). */}
      <IconGlyph size={28} weight="fill" color={glyph} />
      <Text className="text-2xl font-black" style={{ color: glyph }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The previous ground, fading out over the new one (pause, skip, resume). */
function FadingGround({ color, onDone }: { color: string; onDone: () => void }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(
      withTiming(
        0,
        { duration: GROUND_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.System },
        (finished) => {
          if (finished) runOnJS(onDone)();
        }
      )
    );
  }, [opacity, onDone]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', inset: 0, backgroundColor: color }, style]}
    />
  );
}

/** One fact on the summary: label left, the figure right, a hairline under it. */
function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="h-14 flex-row items-center justify-between border-b border-line">
      <Text className="type-body text-muted">{label}</Text>
      <Text className="type-num" selectable>
        {value}
      </Text>
    </View>
  );
}

/**
 * Summary blocks follow each other in, lifting 8 pt on the Rivet spring. They start once the
 * ground is fully Snow, so text never sits half-faded on a passing grey.
 */
const summaryEnter = (index: number) => liftIn(SUMMARY_GROUND_MS + index * 50);

/** One bar of the Pitch rising after `delay`, on the Rivet spring (a fade under reduced motion). */
function useRise(delay: number, reduced: boolean) {
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.set(
      reduced
        ? withTiming(1, { duration: REDUCED_FADE_MS, easing: EASE_OUT })
        : withDelay(delay, withSpring(1, SPRING_SETTLE))
    );
  }, [rise, delay, reduced]);
  return useAnimatedStyle(() =>
    reduced ? { opacity: rise.get() } : { transform: [{ scaleY: rise.get() }] }
  );
}

/**
 * The Pitch, its bars rising one by one with the closing notes (brand: Done). Glow celebrates a
 * finished workout; a run ended early gets the mark in Snow at 40%, never a trophy.
 */
function RisingPitch({ ended }: { ended?: boolean }) {
  const reduced = useReducedMotion();
  const first = useRise(0, reduced);
  const second = useRise(NOTE_MS, reduced);
  const third = useRise(NOTE_MS * 2, reduced);
  return (
    <PitchMark
      width={80}
      color={ended ? 'rgba(248, 246, 243, 0.4)' : PALETTE.glow}
      barStyles={[first, second, third]}
    />
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
 * The session (design page 05): the whole screen becomes the colour of the moment, Get ready
 * Stone, Hang Glow, Rest Glacier, Recover Glacier 200, in both modes, and every state has a
 * word. The interval rises from the bottom in a deeper step of the same colour; the grip is
 * drawn on the board and named under it; set pills show the whole session; Next speaks only
 * when the pattern breaks. While it runs there is one control, Pause; Back and Skip come with
 * Resume, and Paused goes Snow under a band of the phase it stopped in. The X ends it (a sheet
 * asks first). Done is Night for a breath, then the summary: how it felt, the facts, a note,
 * and for an unsaved workout the offer to keep it.
 */
export function Runner({
  timings,
  name,
  workoutId,
  saveNameDefault = '',
  resume,
  autoStart = false,
}: RunnerProps) {
  const { theme, dark } = useAppTheme();
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const leaving = useRef(false);
  /** True when the confirm sheet itself paused a running timer, so Keep going resumes it. */
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
   * The summary waits a beat on Night after the timer stops, so the finish lands instead of
   * flashing straight into the form. The session is still written immediately.
   */
  const [showSummary, setShowSummary] = useState(false);
  const reducedMotion = useReducedMotion();
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

  // Leaving mid-workout (X, hardware back, gesture) asks first. Before Start, and after
  // finishing, leaving is free.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (leaving.current || idle || finished) return;
      e.preventDefault();
      askConfirm();
    });
  }, [navigation, idle, finished, timer, askConfirm]);

  // The session is written the moment the timer stops, so closing the app on the summary
  // loses nothing. The grade, the note and the save prompt only add to it.
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
  const intervals = timer.engineState.intervals;
  const facts = useMemo(() => workoutFacts(timings), [timings]);
  const secondsLeft = Math.ceil(timer.remainingSeconds);
  const count = idle
    ? formatClock(facts.seconds)
    : interval.seconds >= 60
      ? formatClock(secondsLeft)
      : String(secondsLeft);
  const board = getBoard(timings.board);
  // What the board and the Next line show depends only on the interval, not on the tick.
  const cue = useMemo(
    () => gripCue(intervals, timer.engineState.index),
    [intervals, timer.engineState.index]
  );
  const grip = useMemo(
    () => (board && cue.holds.length ? gripShortName(board, cue.holds) : ''),
    [board, cue]
  );
  const upNext = useMemo(() => {
    const up = nextUp(intervals, timer.engineState.index);
    return up ? `${up.label}${DOT}${up.value}` : null;
  }, [intervals, timer.engineState.index]);
  const caption = grip
    ? cue.prefix
      ? `${cue.prefix}${DOT}${grip}`
      : grip
    : (interval.label ?? (interval.phase === 'hang' ? '' : timer.nextHang?.label) ?? '');
  const compact = settings.genZMode && !finished;

  // What the screen wears: Ready on the canvas (Night in dark), a session colour while it
  // runs, Snow with a band of the stopped phase when paused.
  const state = stateOf(interval);
  const ground = idle
    ? dark
      ? theme.surface
      : theme.canvas
    : paused
      ? PALETTE.snow
      : SESSION[state].ground;
  const ink = idle ? theme.text : SESSION[state].fg;
  const disc = ink;
  const glyph = ink === PALETTE.night ? PALETTE.snow : ground;

  const phaseWord = idle ? 'Ready' : paused ? 'Paused' : intervalWord(interval);
  const line = idle
    ? `${plural(facts.sets, 'set')}${DOT}${plural(facts.hangs, 'hang')}`
    : paused
      ? `${intervalWord(interval)}${DOT}Set ${interval.setIndex + 1} of ${interval.setCount}`
      : setLine(interval.phase === 'prep' && timer.nextHang ? timer.nextHang : interval);
  const first = intervals[0];
  const next = idle
    ? first && first.phase !== 'done'
      ? `Starts with ${intervalWord(first)} ${spokenDuration(first.seconds)}`
      : null
    : paused
      ? 'Tap Resume to carry on'
      : upNext;
  // Sets done so far, as pills: during Recover the set just finished counts.
  const setsDone = idle
    ? 0
    : Math.min(interval.setCount, interval.setIndex + (interval.recover ? 1 : 0));

  // Gen Z mode shares the screen with gameplay: the timer keeps 40% or what it needs.
  const [headerHeight, setHeaderHeight] = useState(220);
  const [footerHeight, setFooterHeight] = useState(200);
  const requiredHeight = headerHeight + footerHeight + 110 * fontScale;
  const panelHeight = splitHeight(rootHeight, requiredHeight, compact);
  const split = panelHeight < rootHeight;
  const panelHeightValue = useSharedValue(panelHeight);
  useEffect(() => {
    panelHeightValue.set(withTiming(panelHeight, { duration: SPLIT_MS, easing: EASE_OUT }));
  }, [panelHeight, panelHeightValue]);
  const animatedPanelStyle = useAnimatedStyle(() => ({ height: panelHeightValue.get() }));
  const ordinal = hangOrdinal(timer.engineState);
  const clipId = compact ? rotation.clipAt(ordinal) : undefined;
  const clip = CLIPS.find((entry) => entry.id === clipId);

  const room = panelHeight - headerHeight - footerHeight - 24;
  const digitSize = Math.max(
    56,
    Math.min(
      countSize(count),
      (width * 0.92) / (count.length * 0.58 * fontScale),
      room / (1.02 * fontScale)
    )
  );

  // Ground, fill colour and fill level change in the same commit as the phase word, so a phase
  // change never shows a frame of the old colour (brand motion review). An interval that runs out
  // cuts at once; a change the climber makes (start, pause, resume, back, skip) crossfades: the
  // old ground stays on top and fades out over GROUND_MS. The cause is known where it happens,
  // so `act` starts the fade there.
  const running = !idle && !paused && !finished;
  const index = timer.engineState.index;
  const [fade, setFade] = useState<{ color: string; id: number } | null>(null);
  const act = (action: () => void) => () => {
    setFade((current) => ({ color: ground, id: (current?.id ?? 0) + 1 }));
    action();
  };

  // The interval rises from the bottom, linearly with time, with a 3 pt edge on top, and stops
  // under the header so no control ever sits on its edge. Each interval mounts its own fill, so
  // a new one starts empty instead of sliding down from the last one's level.
  const fillRoom = Math.max(0, panelHeight - headerHeight);
  const fillHeight = (idle || finished ? 0 : timer.progress) * fillRoom;

  // Screen readers hear each new phase once, on both platforms; never the countdown itself.
  useEffect(() => {
    if (!running) return;
    const seconds = interval.seconds;
    const length = seconds >= 60 ? formatClock(seconds) : `${seconds} seconds`;
    AccessibilityInfo.announceForAccessibility(`${phaseWord}, ${length}. ${line}`);
  }, [index, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const buttonsTop = Math.max(insets.top - 6, 8);

  if (finished && !showSummary) {
    const ended = timer.status === 'ended' || timer.completedSets < timer.totalSets;
    return (
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: PALETTE.night }}
        accessibilityRole="button"
        accessibilityHint="Shows the summary"
        onPress={() => setShowSummary(true)}>
        <StatusBar style="light" />
        <View className="items-center">
          <RisingPitch ended={ended} />
          <Animated.View entering={liftIn(WORDS_AT_MS, reducedMotion)} className="items-center">
            <Text
              className="mt-6 font-black"
              style={{
                color: PALETTE.snow,
                fontSize: 96,
                lineHeight: 104,
                letterSpacing: -3,
              }}
              role="heading">
              {ended ? 'Ended' : 'Done'}
            </Text>
            <Text className="type-title mt-1" style={{ color: PALETTE.snow }}>
              {`${timer.completedSets} of ${timer.totalSets} sets${DOT}${formatClock(timer.elapsedSeconds)}`}
            </Text>
            <SetBars
              done={timer.completedSets}
              total={timer.totalSets}
              height={8}
              gap={6}
              color={PALETTE.snow}
              track="rgba(255, 255, 255, 0.16)"
              className="mt-5 w-[222px]"
            />
          </Animated.View>
        </View>
      </Pressable>
    );
  }

  if (finished) {
    const all = timer.status === 'done' && timer.completedSets === timer.totalSets;
    const sub = all
      ? sessionVerdict(true, timer.totalSets)
      : `${timer.completedSets} of ${timer.totalSets} sets. You’ll get ${
          timer.totalSets - timer.completedSets === 1 ? 'it' : 'them'
        } next time.`;
    const hung = timer.hangResults.reduce((seconds, hang) => seconds + hang.actual, 0);
    const full = timer.hangResults.filter((hang) => hang.actual >= hang.planned).length;
    return (
      // Night stays under the summary while its ground fades in, so there is no blank frame.
      <View className="flex-1" style={{ backgroundColor: PALETTE.night }}>
        <Animated.View entering={FadeIn.duration(SUMMARY_GROUND_MS)} className="flex-1 bg-canvas">
          <StatusBar style={dark ? 'light' : 'dark'} />
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-6 pb-8"
            contentContainerStyle={{ paddingTop: insets.top + 38 }}>
            <Animated.View entering={summaryEnter(0)}>
              <SetBars
                done={timer.completedSets}
                total={timer.totalSets}
                stagger={SUMMARY_GROUND_MS}
              />
              <Text className="type-large mt-[22px]" role="heading">
                Session saved
              </Text>
              <Text className="type-body mt-2 text-[20px] leading-[27px] text-muted">{sub}</Text>
            </Animated.View>
            <Animated.View entering={summaryEnter(1)} className="mt-6 gap-3">
              <Text className="type-body-b">How did it feel?</Text>
              <FeelPicker value={feel} onChange={grade} />
            </Animated.View>
            <Animated.View entering={summaryEnter(2)} className="mt-6">
              <FactRow label="Time" value={formatClock(timer.elapsedSeconds)} />
              <FactRow label="Time hanging" value={formatClock(hung)} />
              <FactRow label="Full hangs" value={`${full} of ${facts.hangs}`} />
            </Animated.View>
            <Animated.View entering={summaryEnter(3)} className="mt-6 gap-1.5">
              <Text className="type-body-b">Note</Text>
              <Field
                value={note}
                accessibilityLabel="Note"
                placeholder="Holds, load, or something to remember"
                onChangeText={(value) => {
                  setNote(value);
                  if (sessionId.current)
                    updateSession(sessionId.current, { note: value.trim() || undefined });
                }}
              />
            </Animated.View>
            {isDraft ? (
              <Animated.View entering={summaryEnter(4)} className="mt-6 gap-1.5">
                <Text className="type-body-b">Keep this workout?</Text>
                <Field
                  value={saveName}
                  accessibilityLabel="Workout name"
                  onChangeText={setSaveName}
                  placeholder="Give it a name to keep it"
                  autoCapitalize="sentences"
                  returnKeyType="done"
                />
                <Text className="type-sub mt-1 text-muted">
                  Leave it empty to finish without saving.
                </Text>
              </Animated.View>
            ) : null}
          </ScrollView>
          <View
            className="border-t border-line bg-canvas px-6 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
            <Button size="lg" onPress={finish}>
              <Text>{isDraft && saveName.trim() ? 'Save and finish' : 'Finish'}</Text>
            </Button>
          </View>
        </Animated.View>
      </View>
    );
  }

  const boardWidth = Math.min(width - BOARD_INSET * 2, 300);
  const stoppedGround = SESSION[state].ground;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: compact ? theme.canvas : ground }}
      onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}>
      <StatusBar style={idle && dark ? 'light' : 'dark'} />
      <Animated.View style={[{ overflow: 'hidden', backgroundColor: ground }, animatedPanelStyle]}>
        {fade ? (
          <FadingGround key={fade.id} color={fade.color} onDone={() => setFade(null)} />
        ) : null}
        {/* The interval rising from the bottom in the deeper step of the same colour. */}
        <Animated.View
          key={index}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: fillHeight,
            backgroundColor: SESSION[state].elapsed,
            borderTopWidth: 3,
            borderTopColor: SESSION[state].edge,
            opacity: running || paused ? 1 : 0,
            // Linear between the timer's 100 ms ticks, so the level rises continuously.
            transitionProperty: running ? 'height' : 'none',
            transitionDuration: FILL_STEP_MS,
            transitionTimingFunction: 'linear',
          }}
        />
        {/* The ground's living field, in the ground's own tones; under reduced motion, none. */}
        {reducedMotion ? null : (
          <Suspense fallback={null}>
            <HangField
              width={width}
              height={rootHeight}
              target={energyTarget(status, interval.phase)}
              deep={paused ? SESSION.ready.edge : SESSION[state].edge}
            />
          </Suspense>
        )}
        {paused ? (
          // A stopped clock never looks like a running one: the ground goes Snow and a band
          // of the phase it stopped in stays behind the header.
          <View
            pointerEvents="none"
            className="absolute inset-x-0 top-0"
            style={{ height: headerHeight, backgroundColor: stoppedGround }}
          />
        ) : null}

        <View className="flex-1">
          <View
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            style={{ paddingTop: buttonsTop }}
            className="pb-3">
            <View className="flex-row items-center justify-between px-3">
              <GroundButton
                icon={XIcon}
                label={idle ? 'Close' : 'End session'}
                color={ink}
                onPress={onClose}
              />
              {idle ? (
                <Text
                  className="type-body-b flex-1 px-2 text-center"
                  style={{ color: ink }}
                  numberOfLines={1}>
                  {name}
                </Text>
              ) : null}
              <GroundButton
                icon={SlidersHorizontalIcon}
                label="Session settings"
                color={ink}
                onPress={() => setSettingsOpen(true)}
              />
            </View>
            <View className="mt-2.5 px-6">
              <TimerPhaseLabel label={phaseWord} line={line} color={ink} />
            </View>
          </View>

          {board && !compact ? (
            <View className="items-center pt-3.5">
              <HangboardDiagram
                animated
                board={timings.board!}
                active={cue.holds}
                color={ink}
                width={boardWidth}
                plate={paused ? PALETTE.snow : ground}
                strokeWidth={1.2}
                lineOpacity={0x40 / 255}
                fillOpacity={0x0a / 255}
              />
            </View>
          ) : null}
          {/* Always there, so the digits never move when a caption comes or goes. */}
          <Text className="type-body-b px-6 text-center" style={{ color: ink }} numberOfLines={1}>
            {caption || ' '}
          </Text>

          <View className="flex-1 items-center justify-center pb-4">
            <Text
              className="text-center font-black"
              style={{
                color: ink,
                fontSize: digitSize,
                lineHeight: Math.round(digitSize * 1.02),
                letterSpacing: -0.03 * digitSize,
                // Negative tracking pulls the last glyph past the box; give it back.
                paddingRight: 0.03 * digitSize,
                fontVariant: ['tabular-nums'],
              }}
              numberOfLines={1}
              accessibilityLabel={
                idle ? `${count} in all` : `${count} ${interval.seconds >= 60 ? '' : 'seconds'}`
              }>
              {count}
            </Text>
          </View>

          <View
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            className="items-center px-6"
            style={{ paddingBottom: split ? 12 : Math.max(insets.bottom, 16) + 6 }}>
            <SetBars
              done={setsDone}
              total={interval.setCount}
              current={idle || interval.phase === 'done' ? undefined : interval.setIndex}
              height={8}
              gap={6}
              color={ink}
              track={`${ink}40`}
              className="w-[222px]"
            />
            <Text
              className="type-body-b mt-6 min-h-[26px] text-center text-[19px] leading-[26px]"
              style={{ color: ink }}
              numberOfLines={1}>
              {next ?? ''}
            </Text>
            <View className={cn('w-full flex-row items-center', compact ? 'mt-4' : 'mt-[42px]')}>
              {idle ? (
                <MainControl
                  icon={PlayIcon}
                  label="Start"
                  disc={disc}
                  glyph={glyph}
                  wide
                  compact={compact}
                  onPress={act(timer.start)}
                />
              ) : paused ? (
                <View className="flex-1 flex-row items-center justify-between">
                  <GroundButton
                    icon={ArrowCounterClockwiseIcon}
                    label="Back to the start of this interval"
                    color={ink}
                    onPress={act(() => {
                      setRestart((value) => value + 1);
                      timer.back();
                    })}
                  />
                  <MainControl
                    icon={PlayIcon}
                    label="Resume"
                    disc={disc}
                    glyph={glyph}
                    compact={compact}
                    onPress={act(timer.resume)}
                  />
                  <GroundButton
                    icon={SkipForwardIcon}
                    label="Skip"
                    color={ink}
                    onPress={act(timer.skip)}
                  />
                </View>
              ) : (
                <View className="flex-1 items-center">
                  <MainControl
                    icon={PauseIcon}
                    label="Pause"
                    disc={disc}
                    glyph={glyph}
                    compact={compact}
                    onPress={act(timer.pause)}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
      {split ? (
        <Animated.View
          entering={FadeIn.duration(SPLIT_MS)}
          exiting={FadeOut.duration(SPLIT_MS)}
          style={{ flex: 1 }}
          className="overflow-hidden bg-raised">
          {clip ? (
            <BrainrotBoundary>
              <Suspense fallback={<View className="flex-1 bg-raised" />}>
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
              <Text className="type-sub text-muted">Video unavailable</Text>
            </View>
          )}
        </Animated.View>
      ) : null}
      <WorkoutSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmSheet
        open={confirmOpen}
        onClose={keepGoing}
        title="End the session?"
        body={
          timer.completedSets === 0
            ? 'No full set is in yet. Rivet keeps what you did the moment you end.'
            : `${countWord(timer.completedSets, true)} full ${
                timer.completedSets === 1 ? 'set is' : 'sets are'
              } in. Rivet keeps ${timer.completedSets === 1 ? 'it' : 'them'} the moment you end.`
        }
        safe={{ label: 'Keep going', icon: PlayIcon, onPress: keepGoing }}
        destructive={{ label: 'End and save', plain: true, onPress: () => timer.end() }}
      />
    </View>
  );
}
