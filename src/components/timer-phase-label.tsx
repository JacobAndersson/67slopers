import { useEffect, useRef } from 'react';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { LIFT, SPRING_SETTLE } from '@/lib/motion';

/** The set line follows the word by this much: lift, then settle. */
const LINE_DELAY_MS = 40;

/**
 * The phase word (44/900) and its set line. A state is never shown without its word, so on a
 * change both arrive at full opacity 8 pt low and lift into place on the Rivet spring, the line a
 * beat after the word; no fade (brand motion review). The digits and the ground never move with
 * them. Reduced motion: they simply appear.
 */
export function TimerPhaseLabel({
  label,
  line,
  color,
}: {
  label: string;
  line: string;
  color: string;
}) {
  const previous = useRef(label);
  const word = useSharedValue(0);
  const sub = useSharedValue(0);
  useEffect(() => {
    if (previous.current === label) return;
    previous.current = label;
    const spring = { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System };
    word.set(LIFT);
    sub.set(LIFT);
    word.set(withSpring(0, spring));
    sub.set(withDelay(LINE_DELAY_MS, withSpring(0, spring), ReduceMotion.System));
  }, [label, word, sub]);
  const wordStyle = useAnimatedStyle(() => ({ transform: [{ translateY: word.get() }] }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sub.get() }] }));
  return (
    <>
      <Animated.View style={wordStyle}>
        <Text
          className="type-phase"
          maxFontSizeMultiplier={1.3}
          style={{ color }}
          numberOfLines={1}
          adjustsFontSizeToFit
          role="heading">
          {label}
        </Text>
      </Animated.View>
      <Animated.View style={lineStyle}>
        <Text
          className="type-num mt-2 text-[26px] leading-[29px]"
          style={{ color }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {line}
        </Text>
      </Animated.View>
    </>
  );
}
