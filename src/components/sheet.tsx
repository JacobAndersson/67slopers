import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { EASE_OUT } from '@/lib/motion';

/** The iOS sheet curve: quick off the mark, long settle. */
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);
const OPEN_MS = 320;
const CLOSE_MS = 200;
/** A flick this fast (px/s) closes the sheet however far it has travelled. */
const FLICK = 500;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
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
      shown.set(withTiming(1, { duration: OPEN_MS, easing: EASE_SHEET }));
    } else {
      shown.set(
        withTiming(0, { duration: CLOSE_MS, easing: EASE_OUT }, (finished) => {
          if (finished) runOnJS(unmount)();
        })
      );
    }
  }, [open, shown, drag, unmount]);

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
          <Animated.View className="absolute inset-0 bg-foreground/45" style={scrim}>
            <Pressable accessibilityLabel="Close" onPress={onClose} className="flex-1" />
          </Animated.View>
          <Animated.View
            className="w-full max-w-3xl gap-4 self-center rounded-t-3xl bg-background px-6 pt-3"
            style={[{ paddingBottom: insets.bottom + 16 }, panel]}>
            <GestureDetector gesture={pan}>
              <View className="gap-4">
                <View className="h-1 w-10 self-center rounded-full bg-border" />
                <View className="flex-row items-center justify-between">
                  <Text variant="h4">{title}</Text>
                  {action ? (
                    <Pressable onPress={action.onPress} hitSlop={12} accessibilityRole="button">
                      <Text className="text-sm font-medium">{action.label}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
