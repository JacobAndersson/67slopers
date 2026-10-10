import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  cubicBezier,
  useReducedMotion,
  type AnimatedProps,
} from 'react-native-reanimated';

const GLIDE_MS = 200;
const FRAME_MS = 16;
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

const ContainerContext = createContext<RefObject<View | null> | null>(null);

/** The box its `Glide` children measure themselves against. Must be their direct parent. */
export function GlideContainer({ className, children }: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<View>(null);
  return (
    <ContainerContext.Provider value={ref}>
      <View ref={ref} collapsable={false} className={className}>
        {children}
      </View>
    </ContainerContext.Provider>
  );
}

/** Where `node` sits below the top of `container`, read synchronously after a commit. */
function topWithin(node: View, container: View, done: (top: number) => void) {
  if (Platform.OS === 'web') {
    const rect = (v: View) => (v as unknown as HTMLElement).getBoundingClientRect();
    done(rect(node).top - rect(container).top);
  } else {
    node.measureLayout(container, (_left, top) => done(top));
  }
}

type GlideProps = PropsWithChildren<{
  /** Without it this is a plain view: read-only lists never move. */
  active: boolean;
  /** Changes whenever the list may have been rearranged; the position is re-read then. */
  watch: unknown;
  /**
   * A change of this value moves things without a glide. Opening an inline editor is one: its
   * text inputs settle their height a frame late, so the glide would stop short and then jump.
   */
  still?: unknown;
  className?: string;
  entering?: AnimatedProps<object>['entering'];
}>;

/**
 * Slides to its new place when a rearrangement moves it, so it is clear which step went
 * where. The layout itself is never animated: the view is already in its final position and
 * only a transform plays the move back from the old one, which always ends at zero. Reanimated
 * layout transitions were tried here and came to rest on stale positions on Android.
 */
export function Glide({ active, watch, still, className, entering, children }: GlideProps) {
  const container = useContext(ContainerContext);
  const reduced = useReducedMotion();
  const outer = useRef<View>(null);
  const lastTop = useRef<number | null>(null);
  const lastStill = useRef(still);
  const [shift, setShift] = useState({ dy: 0, gliding: false });

  // Runs before the rearranged list is painted: start from where the view was.
  useLayoutEffect(() => {
    const held = lastStill.current !== still;
    lastStill.current = still;
    if (!active || !outer.current || !container?.current) return;
    topWithin(outer.current, container.current, (top) => {
      const previous = lastTop.current;
      lastTop.current = top;
      if (previous === null || held || reduced || Math.abs(previous - top) < 1) return;
      setShift({ dy: previous - top, gliding: false });
    });
  }, [active, watch, still, container, reduced]);

  // One frame later, let go: the transition carries it home.
  useEffect(() => {
    if (shift.dy === 0 || shift.gliding) return;
    // A timer, not requestAnimationFrame: a hidden tab never runs frames, and a view must
    // not be left displaced.
    const id = setTimeout(() => setShift({ dy: 0, gliding: true }), FRAME_MS);
    return () => clearTimeout(id);
  }, [shift]);

  if (!active) {
    return (
      <Animated.View className={className} entering={entering}>
        {children}
      </Animated.View>
    );
  }

  return (
    <View
      ref={outer}
      collapsable={false}
      // Layout changes nobody announced (a disclosure opening above) still move the baseline.
      onLayout={(e) => {
        lastTop.current = e.nativeEvent.layout.y;
      }}>
      <Animated.View
        className={className}
        entering={entering}
        style={{
          transform: [{ translateY: shift.dy }],
          transitionProperty: 'transform',
          transitionDuration: shift.gliding ? GLIDE_MS : 0,
          transitionTimingFunction: CSS_EASE_OUT,
        }}>
        {children}
      </Animated.View>
    </View>
  );
}
