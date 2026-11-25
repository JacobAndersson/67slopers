import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { EASE_OUT, REDUCED_FADE_MS, SPRING_SETTLE } from '@/lib/motion';

const CLOSE_MS = 200;
/** A flick this fast (px/s) closes the sheet however far it has travelled. */
const FLICK = 500;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** A text action beside the title, such as "Reset". */
  action?: { label: string; onPress: () => void };
  children: ReactNode;
};

/**
 * A bottom sheet over the current screen. It slides up by its own height and leaves the way
 * it came; tapping the dimmed area or dragging it down closes it. Reduced motion fades it.
 */
export function Sheet({ open, onClose, title, action, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  // Stays mounted while the closing animation plays.
  const [mounted, setMounted] = useState(open);
  const shown = useSharedValue(0);
  const drag = useSharedValue(0);

  const unmount = useCallback(() => setMounted(false), []);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      drag.set(0);
      // Rivet's lift: the sheet rises on the 380/32 spring; reduced motion is a short crossfade.
      shown.set(
        reducedMotion
          ? withTiming(1, { duration: REDUCED_FADE_MS })
          : withSpring(1, { ...SPRING_SETTLE, overshootClamping: true })
      );
    } else {
      shown.set(
        withTiming(
          0,
          { duration: reducedMotion ? REDUCED_FADE_MS : CLOSE_MS, easing: EASE_OUT },
          (finished) => {
            if (finished) runOnJS(unmount)();
          }
        )
      );
    }
  }, [open, shown, drag, unmount, reducedMotion]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onChange((event) => {
      drag.set(Math.max(0, drag.get() + event.changeY));
    })
    .onEnd((event) => {
      if (drag.get() > 120 || event.velocityY > FLICK) runOnJS(onClose)();
      else drag.set(withTiming(0, { duration: CLOSE_MS, easing: EASE_OUT }));
    });

  const scrim = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const panel = useAnimatedStyle(() => ({
    opacity: reducedMotion ? shown.get() : 1,
    transform: [{ translateY: reducedMotion ? 0 : (1 - shown.get()) * height + drag.get() }],
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      {/* A modal is its own native root, so gestures need their own root view inside it. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Animated.View className="absolute inset-0 bg-scrim" style={scrim}>
            <Pressable accessibilityLabel="Close" onPress={onClose} className="flex-1" />
          </Animated.View>
          <Animated.View
            className="w-full max-w-3xl gap-5 self-center rounded-t-card bg-surface px-6 pt-2.5 dark:border dark:border-b-0 dark:border-line-strong"
            style={[
              {
                paddingBottom: Math.max(insets.bottom, 24) + 28,
                shadowColor: '#0B0F1C',
                shadowOpacity: 0.18,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: -8 },
                elevation: 24,
              },
              panel,
            ]}>
            <GestureDetector gesture={pan}>
              <View className="gap-4">
                <View className="h-[5px] w-11 self-center rounded-full bg-line-strong" />
                {title ? (
                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="type-title" role="heading">
                      {title}
                    </Text>
                    {action ? (
                      <Pressable onPress={action.onPress} hitSlop={12} accessibilityRole="button">
                        <Text className="type-body-b">{action.label}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
