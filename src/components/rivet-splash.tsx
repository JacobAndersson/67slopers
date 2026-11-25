import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { PitchMark, Wordmark } from '@/components/rivet-mark';
import {
  arrival,
  FIRST_RUN,
  FIRST_RUN_EXIT,
  FIRST_RUN_TOTAL,
  firstRunGlide,
  firstRunGround,
  firstRunMark,
  firstRunName,
  firstRunStep,
  LAUNCH,
  LAUNCH_TOTAL,
  launchGround,
  launchLift,
  launchMark,
  PITCH,
  REDUCED,
  stackedLockup,
} from '@/lib/logo-motion';

/**
 * Mount with the first real frame (after fonts and the store are ready): wraps the app so it arrives,
 * and lays the splash over it until the hand-off has played.
 */
export function SplashHandoff({
  enabled,
  firstRun,
  children,
}: {
  enabled: boolean;
  firstRun: boolean;
  children: ReactNode;
}) {
  const splash = useSplash(enabled, firstRun);
  return (
    <>
      <Arrival splash={splash}>{children}</Arrival>
      {splash.visible ? <RivetSplash splash={splash} /> : null}
    </>
  );
}

/** Brand colours of the launch screen (p.47): Night ground, the symbol in Glow, the name in Snow. */
const NIGHT = '#141A2E';
const GLOW = '#F28C6E';
const SNOW = '#F8F6F3';

/** Width of the symbol; app.json's splash `imageWidth` is the same, so the first frame matches the native one. */
export const SPLASH_SYMBOL_WIDTH = 96;

/** When the Night ground starts to fade, which is when the screen underneath starts to arrive. */
function groundStart(firstRun: boolean) {
  'worklet';
  return firstRun ? FIRST_RUN_EXIT + FIRST_RUN.groundDelay : LAUNCH.groundDelay;
}

function fade(time: number, start: number) {
  'worklet';
  return 1 - Math.min(1, Math.max(0, (time - start) / REDUCED.crossfade));
}

/**
 * One clock for the whole hand-off, shared by the overlay and the screen underneath. Pass `enabled`
 * false on web: there is no native splash to hand off from, so it opens straight onto its content.
 */
export function useSplash(enabled: boolean, firstRun: boolean) {
  const [visible, setVisible] = useState(enabled);
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);
  const finished = useSharedValue(!enabled);
  const done = useCallback(() => setVisible(false), []);
  const total = firstRun ? FIRST_RUN_TOTAL : reduced ? REDUCED.crossfade + 60 : LAUNCH_TOTAL;
  useFrameCallback((frame) => {
    clock.set(frame.timeSinceFirstFrame);
    if (!finished.get() && frame.timeSinceFirstFrame >= total) {
      finished.set(true);
      runOnJS(done)();
    }
  }, visible);
  return { visible, clock, firstRun, reduced };
}

type Splash = ReturnType<typeof useSplash>;

/**
 * The screen underneath arrives with the brand's lift: it rises 8 pt and settles as the Night ground
 * fades (p.18). It is rendered and usable from the first frame; only its offset moves, and only once.
 */
export function Arrival({ splash, children }: { splash: Splash; children: ReactNode }) {
  const { clock, firstRun, reduced, visible } = splash;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduced || !visible ? 0 : arrival(clock.get(), groundStart(firstRun)) },
    ],
  }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

/**
 * The hand-off from the native splash into the app. It starts on exactly the native splash's frame
 * (Night, the Glow symbol centred at the same width) over the already-rendered first screen, and never
 * takes a touch. Layered so the Glow never washes over the app: the mark leaves first, then the ground.
 * - Every launch: the bars lift once in turn, the mark lifts away, the Night fades. Under half a second.
 * - First run: the bars step up in turn as the symbol rises into the stacked lockup, the name lifts in
 *   under it, a beat, then the lockup lifts away and the ground follows.
 * Reduced motion: crossfades only, nothing moves.
 */
export function RivetSplash({ splash }: { splash: Splash }) {
  const { clock, firstRun, reduced } = splash;
  const window = useWindowDimensions();
  // Measure the overlay itself: the native splash centres on the full screen, edge to edge.
  const [area, setArea] = useState({ width: window.width, height: window.height });

  const symbolW = SPLASH_SYMBOL_WIDTH;
  const box = (symbolW / PITCH.bounds.width) * PITCH.box;
  const lockup = stackedLockup(symbolW);
  // First run: the symbol rises by half of what the name adds, so the finished lockup is centred.
  const glide = firstRun && !reduced ? (lockup.total - lockup.symbolHeight) / 2 : 0;

  const ground = useAnimatedStyle(() => {
    const t = clock.get();
    if (reduced) return { opacity: fade(t, firstRun ? FIRST_RUN_EXIT : 60) };
    return { opacity: firstRun ? firstRunGround(t) : launchGround(t) };
  });

  const mark = useAnimatedStyle(() => {
    const t = clock.get();
    if (reduced) {
      return { opacity: fade(t, firstRun ? FIRST_RUN_EXIT : 60), transform: [{ translateY: 0 }] };
    }
    const leave = firstRun ? firstRunMark(t) : launchMark(t);
    const up = firstRun ? glide * firstRunGlide(t) : 0;
    return { opacity: leave.opacity, transform: [{ translateY: -up - leave.lift }] };
  });

  const name = useAnimatedStyle(() => {
    const t = clock.get();
    if (reduced)
      return { opacity: t >= FIRST_RUN.nameDelay ? 1 : 0, transform: [{ translateY: 0 }] };
    const n = firstRunName(t);
    return { opacity: n.opacity, transform: [{ translateY: n.offset }] };
  });

  const lift = (i: number, t: number) => {
    'worklet';
    if (reduced) return 0;
    return (firstRun ? firstRunStep(t, i) : launchLift(t, i)) * box;
  };
  const b0 = useAnimatedStyle(() => ({ transform: [{ translateY: lift(0, clock.get()) }] }));
  const b1 = useAnimatedStyle(() => ({ transform: [{ translateY: lift(1, clock.get()) }] }));
  const b2 = useAnimatedStyle(() => ({ transform: [{ translateY: lift(2, clock.get()) }] }));

  // The symbol is centred on the screen, exactly where the native splash draws it.
  const symbolTop = (area.height - lockup.symbolHeight) / 2;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) =>
        setArea({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
      style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: NIGHT }, ground]} />
      <Animated.View
        style={[
          { position: 'absolute', top: symbolTop, width: area.width, alignItems: 'center' },
          mark,
        ]}>
        <PitchMark width={symbolW} color={GLOW} barStyles={[b0, b1, b2]} />
        {firstRun ? (
          <Animated.View style={[{ marginTop: lockup.gap }, name]}>
            <Wordmark cap={lockup.cap} color={SNOW} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
