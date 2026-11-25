import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { LayoutAnimationConfig, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { EASE_OUT, fadeIn, fadeOut } from '@/lib/motion';
import { COUNT_LEADING, countSlots, slotEm } from '@/lib/timer/count';

/**
 * A changed digit travels this share of the count's size (a few points): the new one in ROLL_MS,
 * the old one out in half that, so the two barely overlap.
 */
const ROLL = 0.05;
const ROLL_MS = 220;
/** Room either side of a glyph inside its slot, in em, so the slot never clips it. */
const BLEED_EM = 0.1;

/**
 * A counting-down drum: the new digit comes down from above as the old one leaves below, both
 * fading. Strong ease-out, so the new digit reads within a few frames.
 */
function roll(from: number, to: number, opacityFrom: number, opacityTo: number, ms: number) {
  return () => {
    'worklet';
    const timing = { duration: ms, easing: EASE_OUT };
    return {
      initialValues: { opacity: opacityFrom, transform: [{ translateY: from }] },
      animations: {
        opacity: withTiming(opacityTo, timing),
        transform: [{ translateY: withTiming(to, timing) }],
      },
    };
  };
}

/**
 * The interval's count in fixed slots (`shape`, see src/lib/timer/count.ts), so the layout never
 * moves: only a digit that changes rolls, a few points inside its own slot, with a fade. Under
 * reduced motion it crossfades in place. Key it by `shape`: a new shape is a new set of slots,
 * which appears at once with the interval's other changes.
 */
export function TimerCount({
  text,
  shape,
  size,
  color,
  reduced,
  label,
}: {
  text: string;
  shape: string;
  /** Drawn size in pt, system font scale included. */
  size: number;
  color: string;
  reduced: boolean;
  label: string;
}) {
  const shift = Math.round(size * ROLL);
  const [enter, exit] = useMemo(
    () =>
      reduced
        ? [fadeIn(), fadeOut()]
        : ([roll(-shift, 0, 0, 1, ROLL_MS), roll(0, shift, 1, 0, ROLL_MS / 2)] as const),
    [reduced, shift]
  );
  const lineHeight = Math.round(size * COUNT_LEADING);
  const bleed = BLEED_EM * size;
  return (
    <LayoutAnimationConfig skipEntering skipExiting>
      <View className="flex-row" accessible accessibilityLabel={label}>
        {countSlots(text, shape).map((char, i) => (
          <View key={i} style={{ width: slotEm(shape[i]) * size, height: lineHeight }}>
            <Animated.View
              key={char}
              entering={enter}
              exiting={exit}
              className="absolute top-0 items-center"
              style={{ left: -bleed, right: -bleed }}>
              <Text
                allowFontScaling={false}
                className="font-black"
                style={{ color, fontSize: size, lineHeight }}>
                {char}
              </Text>
            </Animated.View>
          </View>
        ))}
      </View>
    </LayoutAnimationConfig>
  );
}
