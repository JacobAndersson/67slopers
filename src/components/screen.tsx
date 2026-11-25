import { cssInterop } from 'nativewind';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedRef, type AnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '@/lib/use-theme';

import { cn } from '@/lib/utils';

// The scroll view is Reanimated's so drag-to-reorder lists can auto-scroll it from a worklet.
cssInterop(Animated.ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

type ScreenProps = PropsWithChildren<{
  /** Scroll the content (default) or keep it fixed. */
  scroll?: boolean;
  /** A dock-level screen: no native header above it, the dock floating over its end. */
  tab?: boolean;
  /** Pinned above the bottom safe area, for the screen's primary action. */
  footer?: ReactNode;
  /** Fixed above the content: the screen's top bar. */
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

type ScreenScroll = {
  /** Scrolls the content by `dy` pixels (positive = further down the page). */
  scrollBy: (dy: number) => void;
  /** The scroll view itself, for components that drive scrolling from Reanimated. */
  scrollableRef: AnimatedRef<Animated.ScrollView>;
};

const ScreenScrollContext = createContext<ScreenScroll | null>(null);

/** Lets inputs deep in a scrolling screen pull themselves above the keyboard. */
export function useScreenScroll(): ScreenScroll | null {
  return useContext(ScreenScrollContext);
}

const CONTENT = 'w-full max-w-3xl self-center gap-4 px-6 pt-6 pb-6';
/** Room a scrolling tab leaves so its last row clears the dock. */
const DOCK_CLEARANCE = 132;
/** A dock-level screen's title sits this far under the safe area (design: y 104 under a 54 pt inset). */
const TAB_TOP = 50;
/** The column `CONTENT` describes, for lists that cannot take class names. */
const COLUMN = { maxWidth: 768, gutter: 24 };

/**
 * The content padding of a dock-level screen, for a tab that scrolls its own list instead of
 * using `Screen`: clear of the status bar above and of the dock below, in the same column.
 */
export function useTabContentStyle() {
  const insets = useSafeAreaInsets();
  return {
    width: '100%' as const,
    maxWidth: COLUMN.maxWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: COLUMN.gutter,
    paddingTop: insets.top + TAB_TOP,
    paddingBottom: DOCK_CLEARANCE + insets.bottom,
  };
}

/** Shared page frame under the native header: centered column, optional pinned footer. */
export function Screen({
  scroll = true,
  tab = false,
  footer,
  header,
  className,
  contentClassName,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useRef(0);
  const api = useMemo<ScreenScroll>(
    () => ({
      scrollBy: (dy) =>
        scrollRef.current?.scrollTo({ y: Math.max(0, offset.current + dy), animated: true }),
      scrollableRef: scrollRef,
    }),
    [scrollRef]
  );

  // Footer screens pin their primary action above the nav bar; screens without a
  // footer (Home, session view) need the inset on the scroll content itself, or the
  // last rows slide under the gesture bar on edge-to-edge Android. Never pad the
  // scroll view or gesture root: that breaks Sortable.Grid measuring and drag preview.
  // Only padding that depends on the device goes inline; the fixed 24 pt stays in the classes,
  // where a screen's own `contentClassName` can override it. (An inline key, even undefined,
  // would beat the class.)
  const tabStyle = useTabContentStyle();
  const padding = tab
    ? { paddingTop: tabStyle.paddingTop, paddingBottom: tabStyle.paddingBottom }
    : footer
      ? undefined
      : { paddingBottom: Math.max(24, insets.bottom + 12) };

  return (
    <ScreenScrollContext.Provider value={api}>
      <View className={cn('flex-1 bg-canvas', className)}>
        {header}
        {scroll ? (
          <Animated.ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName={cn(CONTENT, contentClassName)}
            contentContainerStyle={padding}
            keyboardShouldPersistTaps="handled"
            onScroll={(e) => {
              offset.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={64}>
            {children}
          </Animated.ScrollView>
        ) : (
          <View className={cn('flex-1', CONTENT, contentClassName)} style={padding}>
            {children}
          </View>
        )}
        {tab ? <StatusFade height={insets.top + 28} /> : null}
        {footer ? (
          <View
            className="w-full max-w-3xl self-center border-t border-line bg-canvas px-6 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
            {footer}
          </View>
        ) : null}
      </View>
    </ScreenScrollContext.Provider>
  );
}

/** Content scrolling up fades into the canvas under the status bar, mirroring the dock's fade. */
function StatusFade({ height }: { height: number }) {
  const { theme } = useAppTheme();
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="status-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.canvas} stopOpacity={1} />
            <Stop offset="0.6" stopColor={theme.canvas} stopOpacity={0.94} />
            <Stop offset="1" stopColor={theme.canvas} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#status-fade)" />
      </Svg>
    </View>
  );
}
