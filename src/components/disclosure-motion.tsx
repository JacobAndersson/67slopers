import { ChevronDownIcon } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import Animated, {
  cubicBezier,
  Easing,
  FadeIn,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';

const DURATION_MS = 150;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const REVEAL = FadeIn.duration(DURATION_MS).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

/** A short reveal for controls opened by the user; closing removes them immediately. */
export function EditorReveal({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <Animated.View entering={REVEAL} className={className}>
      {children}
    </Animated.View>
  );
}

/** The indicator follows the disclosure state without moving the surrounding layout. */
export function DisclosureChevron({ expanded }: { expanded: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={{
        transform: [{ rotate: expanded ? '180deg' : '0deg' }],
        transitionProperty: 'transform',
        transitionDuration: reduced ? 0 : DURATION_MS,
        transitionTimingFunction: CSS_EASE_OUT,
      }}>
      <Icon as={ChevronDownIcon} className="size-4 text-muted-foreground" />
    </Animated.View>
  );
}
