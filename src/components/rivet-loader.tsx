import { View } from 'react-native';
import {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { PitchMark } from '@/components/rivet-mark';
import { Text } from '@/components/ui/text';
import { loadingBreath, loadingLift, PITCH } from '@/lib/logo-motion';

/**
 * Rivet's loading state: the three Pitch bars lift in turn, then settle with a soft catch (1.2 s loop,
 * brand book p.42). Runs on the UI thread, so it keeps moving while JS is busy. Reduced motion: the bars
 * breathe instead. Use it for waits a person can see (searching for the board, opening a workout); it
 * is never a reason to delay anything.
 */
export function RivetLoader({
  size = 40,
  color,
  label,
  labelClassName,
}: {
  /** Tight width of the symbol in px. */
  size?: number;
  color: string;
  /** Optional words under it; they are also what a screen reader says. */
  label?: string;
  labelClassName?: string;
}) {
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);
  useFrameCallback((frame) => {
    clock.set(frame.timeSinceFirstFrame);
  });
  const box = (size / PITCH.bounds.width) * PITCH.box;

  const s0 = useAnimatedStyle(() =>
    reduced
      ? { opacity: loadingBreath(clock.get(), 0) }
      : { transform: [{ translateY: loadingLift(clock.get(), 0) * box }] }
  );
  const s1 = useAnimatedStyle(() =>
    reduced
      ? { opacity: loadingBreath(clock.get(), 1) }
      : { transform: [{ translateY: loadingLift(clock.get(), 1) * box }] }
  );
  const s2 = useAnimatedStyle(() =>
    reduced
      ? { opacity: loadingBreath(clock.get(), 2) }
      : { transform: [{ translateY: loadingLift(clock.get(), 2) * box }] }
  );
  const styles = [s0, s1, s2] as const;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      className="items-center gap-4">
      {/* Room above for the lift so nothing clips. */}
      <View style={{ paddingTop: box * 0.1 }}>
        <PitchMark width={size} color={color} barStyles={styles} />
      </View>
      {label ? <Text className={labelClassName ?? 'type-sub text-muted'}>{label}</Text> : null}
    </View>
  );
}
