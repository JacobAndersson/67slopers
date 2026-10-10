import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Board, Hold } from '@/lib/boards';
import { BOARD_IMAGES } from '@/lib/boards/generated/images';
import { cn } from '@/lib/utils';

const FADE_MS = 150;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** How far (in dp) a tap may land from a hold's centre and still pick it. */
const TAP_RADIUS = 28;
/** Spotlight: how much of the board's strength is left outside the highlighted holds. */
const SPOTLIGHT_REST = 0.38;
/** Spotlight windows are drawn for a board this wide (dp) and scale with it. */
const SPOTLIGHT_REFERENCE_WIDTH = 310;
const SPOTLIGHT_GROW = 4;
const SPOTLIGHT_RADIUS = 7;

type BoardViewProps = {
  board: Board;
  /** Highlighted hold ids. */
  holds: string[];
  /**
   * Ids to keep mounted at opacity 0 so switching to them is an opacity change, never an image
   * decode. The timer passes every hold used in the workout. Defaults to `holds`.
   */
  mounted?: string[];
  /** Fade highlights in and out instead of switching them. */
  animated?: boolean;
  /**
   * Mark the holds by leaving them alone: the rest of the board fades towards whatever is behind
   * it and the highlighted holds keep their full colour, inside a faint hairline. Nothing is
   * painted on the wood. The timer uses it.
   */
  spotlight?: boolean;
  /** Makes the board tappable; the nearest hold to the tap is reported. */
  onPressHold?: (holdId: string) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A hangboard drawn from pre-rendered images: the base board plus one overlay image per
 * highlighted hold, positioned by fractions from the manifest, so it renders identically at
 * any width without drawing anything at runtime.
 */
export function BoardView({
  board,
  holds,
  mounted,
  animated = false,
  spotlight = false,
  onPressHold,
  className,
  style,
}: BoardViewProps) {
  const images = BOARD_IMAGES[board.id as keyof typeof BOARD_IMAGES];
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ids = mounted ? Array.from(new Set([...mounted, ...holds])) : holds;

  const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);
  const onPress = (e: GestureResponderEvent) => {
    if (!onPressHold || size.width === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const hit = nearestHold(board, locationX / size.width, locationY / size.height, size);
    if (hit) onPressHold(hit.id);
  };

  const content = (
    <>
      <Image
        source={images.base}
        style={[StyleSheet.absoluteFill, spotlight && { opacity: SPOTLIGHT_REST }]}
        contentFit="fill"
        // Bundled assets keep the same resource name across app updates, so a disk cache would
        // keep serving the previous build's artwork. Memory only.
        cachePolicy="memory"
        accessibilityLabel={board.name}
      />
      {ids.map((id) => {
        const hold = board.holds.find((h) => h.id === id);
        const source = images.holds[id];
        if (!hold) return null;
        if (spotlight) {
          return (
            <Spotlit
              key={id}
              hold={hold}
              source={images.base}
              size={size}
              visible={holds.includes(id)}
              animated={animated}
            />
          );
        }
        if (!source) return null;
        return (
          <Overlay
            key={id}
            hold={hold}
            source={source}
            visible={holds.includes(id)}
            animated={animated}
          />
        );
      })}
    </>
  );

  const containerStyle = [{ aspectRatio: board.width / board.height }, style];
  if (onPressHold) {
    return (
      <Pressable
        onLayout={onLayout}
        onPress={onPress}
        accessibilityRole="image"
        accessibilityLabel={`${board.name}, tap a hold`}
        className={cn('w-full overflow-hidden', className)}
        style={containerStyle}>
        {content}
      </Pressable>
    );
  }
  return (
    <View
      onLayout={onLayout}
      className={cn('w-full overflow-hidden', className)}
      style={containerStyle}
      accessibilityLabel={board.name}>
      {content}
    </View>
  );
}

function Overlay({
  hold,
  source,
  visible,
  animated,
}: {
  hold: Hold;
  source: number;
  visible: boolean;
  animated: boolean;
}) {
  const { overlay } = hold;
  const position: ViewStyle = {
    position: 'absolute',
    left: `${overlay.x * 100}%`,
    top: `${overlay.y * 100}%`,
    width: `${overlay.w * 100}%`,
    height: `${overlay.h * 100}%`,
  };
  const fade = useFade(visible, animated);

  return (
    <Animated.View style={[position, fade]} pointerEvents="none">
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        cachePolicy="memory"
      />
    </Animated.View>
  );
}

/** A window onto the board at full strength, the size of one hold and a little more. */
function Spotlit({
  hold,
  source,
  size,
  visible,
  animated,
}: {
  hold: Hold;
  source: number;
  size: { width: number; height: number };
  visible: boolean;
  animated: boolean;
}) {
  const fade = useFade(visible, animated);
  if (size.width === 0) return null;
  const scale = size.width / SPOTLIGHT_REFERENCE_WIDTH;
  const grow = SPOTLIGHT_GROW * scale;
  const left = hold.box.x * size.width - grow;
  const top = hold.box.y * size.height - grow;
  const window: ViewStyle = {
    position: 'absolute',
    left,
    top,
    width: hold.box.w * size.width + 2 * grow,
    height: hold.box.h * size.height + 2 * grow,
    borderRadius: SPOTLIGHT_RADIUS * scale,
  };

  return (
    <Animated.View style={[window, fade]} pointerEvents="none">
      <View
        style={[StyleSheet.absoluteFill, { borderRadius: window.borderRadius }]}
        className="overflow-hidden">
        <Image
          source={source}
          style={{
            position: 'absolute',
            left: -left,
            top: -top,
            width: size.width,
            height: size.height,
          }}
          contentFit="fill"
          cachePolicy="memory"
        />
      </View>
      <View
        style={[StyleSheet.absoluteFill, { borderRadius: window.borderRadius }]}
        className="border border-foreground/30"
      />
    </Animated.View>
  );
}

function useFade(visible: boolean, animated: boolean) {
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.set(
      animated
        ? withTiming(visible ? 1 : 0, {
            duration: FADE_MS,
            easing: EASE_OUT,
            reduceMotion: ReduceMotion.System,
          })
        : visible
          ? 1
          : 0
    );
  }, [visible, animated, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.get() }));
}

/** The hold whose centre is closest to a point given as board fractions, within TAP_RADIUS dp. */
export function nearestHold(
  board: Board,
  fx: number,
  fy: number,
  size: { width: number; height: number }
): Hold | undefined {
  let best: Hold | undefined;
  let bestDistance = Infinity;
  for (const hold of board.holds) {
    const { box } = hold;
    const inside = fx >= box.x && fx <= box.x + box.w && fy >= box.y && fy <= box.y + box.h;
    const dx = (fx - (box.x + box.w / 2)) * size.width;
    const dy = (fy - (box.y + box.h / 2)) * size.height;
    const distance = inside ? 0 : Math.hypot(dx, dy);
    if (distance < bestDistance) {
      best = hold;
      bestDistance = distance;
    }
  }
  return bestDistance <= TAP_RADIUS ? best : undefined;
}
