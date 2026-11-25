import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  measure,
  ReduceMotion,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';

import { EASE_OUT, LIFT, SPRING_SETTLE } from '@/lib/motion';

/** How long a row is held before it lifts. A tap, or a scroll, is over well before. */
const HOLD_MS = 220;
/** Rows step aside, and the dropped row lands, on this: quick, with no bounce to speak of. */
const SETTLE = { ...SPRING_SETTLE, reduceMotion: ReduceMotion.System };
/** Long enough for a dropped row and its neighbours to settle before rows return to flow. */
const SETTLE_MS = 700;
/** The drop slot fades in this fast. */
const LIFT_MS = 160;
/** Near the top or bottom of the screen the list scrolls under the finger. */
const SCROLL_EDGE = 96;
const SCROLL_SPEED = 16;

/**
 * Reanimated's frame callbacks throw in a browser, which collapsed the whole list there. The
 * browser scrolls a held row's page itself, so on web edge-scrolling is simply off.
 */
const useEdgeScroll: typeof useFrameCallback =
  Platform.OS === 'web'
    ? () => ({ setActive: () => {}, isActive: false, callbackId: -1 })
    : useFrameCallback;

/** In a browser, a held mouse would select the text it is dragged across. */
function holdSelection(held: boolean) {
  if (Platform.OS !== 'web') return;
  document.body.style.userSelect = held ? 'none' : '';
  if (held) window.getSelection()?.removeAllRanges();
}

export type DragRow = {
  key: string;
  /** How many rows, from this one on, travel when it is dragged. 0: it cannot be dragged. */
  size: number;
};

export type DragSlot = { valid: boolean; depth: number };

type Active = { key: string; start: number; size: number };

type Layout = {
  /** Where each measured row's top is. */
  y: Record<string, number>;
  total: number;
  /** While dragging: the rows in the air, and the gap held open for them. */
  lifted: Record<string, boolean> | null;
  gapTop: number;
  gapHeight: number;
  /** One row in the air, not a group. */
  solo: boolean;
};

type ListState = {
  layout: SharedValue<Layout>;
  ready: boolean;
  /** The same as `ready`, for the UI thread: rows are placed absolutely, not in flow. */
  placed: SharedValue<boolean>;
  reportHeight: (key: string, height: number) => void;
  gestureFor: (key: string) => GestureType;
};

const ListContext = createContext<ListState | null>(null);
const RowContext = createContext<{
  key: string;
  raise: SharedValue<number>;
  solo: SharedValue<boolean>;
} | null>(null);

type DragListProps = {
  rows: DragRow[];
  /** For every row that can be dragged: the gaps it may land in, in column order. */
  slots: Record<string, DragSlot[]>;
  /**
   * `air` is set for rows in the air: the row they are held by, and the depth of the gap they
   * are over.
   */
  renderRow: (key: string, air: { heldBy: string; landing: number } | null) => ReactNode;
  /** What shows in the gap held open under a dragged row. */
  renderGap: (depth: number) => ReactNode;
  onDrop: (key: string, slot: number) => void;
  /** A row was lifted or let go, whether or not it moved. */
  onTouch?: () => void;
  /** The scroll view the list is in, so it can scroll while a row is held near an edge. */
  scrollRef?: AnimatedRef<Animated.ScrollView>;
};

/**
 * A column of rows that can be picked up and put down anywhere in it. Hold a row and it lifts;
 * the others open a gap where it would land and it settles there on release.
 *
 * Every row is placed by a transform that the UI thread works out from the order and the
 * measured heights, never by where React put it. So nothing waits for a render while a row is
 * dragged, and when the drop changes the data the rows are already where the new order wants
 * them: no frame shows the old order.
 */
export function DragList({
  rows,
  slots,
  renderRow,
  renderGap,
  onDrop,
  scrollRef,
  onTouch,
}: DragListProps) {
  const keys = useMemo(() => rows.map((row) => row.key), [rows]);
  const order = useSharedValue<string[]>(keys);
  const sizes = useSharedValue<Record<string, number>>({});
  const slotInfo = useSharedValue<Record<string, DragSlot[]>>(slots);
  const heights = useSharedValue<Record<string, number>>({});
  const active = useSharedValue<Active | null>(null);
  const slot = useSharedValue(0);
  const startTop = useSharedValue(0);
  const translation = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const touchY = useSharedValue(0);
  const fallbackRef = useRef(null) as unknown as AnimatedRef<Animated.ScrollView>;
  const scroll = useScrollOffset(scrollRef ?? fallbackRef);

  const [drag, setDrag] = useState<{ key: string; slot: number } | null>(null);
  const [ready, setReady] = useState(false);
  // Rows sit in normal flow at rest, so screen readers meet them in order; from a lift until the
  // drop has settled they are placed absolutely by the UI thread. Both put every row in the
  // same place, so the switch does not show.
  const [placing, setPlacingState] = useState(false);
  const placedShared = useSharedValue(false);
  const setPlacing = useCallback(
    (on: boolean) => {
      setPlacingState(on);
      placedShared.set(on);
    },
    [placedShared]
  );
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    []
  );
  const measured = useRef<Record<string, number>>({});
  const wanted = useRef(keys);

  useEffect(() => {
    order.set(keys);
    wanted.current = keys;
    sizes.set(Object.fromEntries(rows.map((row) => [row.key, row.size])));
  }, [keys, rows, order, sizes]);
  useEffect(() => {
    slotInfo.set(slots);
  }, [slots, slotInfo]);

  const reportHeight = useCallback(
    (key: string, height: number) => {
      if (measured.current[key] === height) return;
      measured.current = { ...measured.current, [key]: height };
      heights.set(measured.current);
      // Until every row has been measured once they sit in normal flow, which looks the same.
      if (wanted.current.every((k) => measured.current[k] !== undefined)) setReady(true);
    },
    [heights]
  );
  /** The top of the rows in the air: the finger, and any scrolling since they were lifted. */
  const blockTop = useDerivedValue(() => {
    const a = active.get();
    if (!a) return 0;
    const ids = order.get();
    const h = heights.get();
    let total = 0;
    let block = 0;
    for (let i = 0; i < ids.length; i++) {
      const height = h[ids[i]] ?? 0;
      total += height;
      if (i >= a.start && i < a.start + a.size) block += height;
    }
    const top = startTop.get() + translation.get() + scroll.get() - startScroll.get();
    return Math.min(Math.max(top, -12), total - block + 12);
  });

  const layout = useDerivedValue<Layout>(() => {
    const ids = order.get();
    const h = heights.get();
    const a = active.get();
    const y: Record<string, number> = {};
    let top = 0;
    if (!a) {
      for (const id of ids) {
        if (h[id] === undefined) continue;
        y[id] = top;
        top += h[id];
      }
      return { y, total: top, lifted: null, gapTop: 0, gapHeight: 0, solo: false };
    }
    const lifted: Record<string, boolean> = {};
    let block = 0;
    for (let i = a.start; i < a.start + a.size; i++) {
      lifted[ids[i]] = true;
      block += h[ids[i]] ?? 0;
    }
    const at = slot.get();
    let rest = 0;
    let gapTop = -1;
    for (let i = 0; i < ids.length; i++) {
      if (i >= a.start && i < a.start + a.size) continue;
      if (rest === at) {
        gapTop = top;
        top += block;
      }
      y[ids[i]] = top;
      top += h[ids[i]] ?? 0;
      rest++;
    }
    if (gapTop < 0) {
      gapTop = top;
      top += block;
    }
    let offset = blockTop.get();
    for (let i = a.start; i < a.start + a.size; i++) {
      y[ids[i]] = offset;
      offset += h[ids[i]] ?? 0;
    }
    return { y, total: top, lifted, gapTop, gapHeight: block, solo: a.size === 1 };
  });

  const tick = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
  }, []);
  const onSlot = useCallback(
    (next: number) => {
      setDrag((current) => (current ? { ...current, slot: next } : current));
      tick();
    },
    [tick]
  );

  // A row lands in the gap its top edge has passed half of the row above or below: the same
  // test both ways, so it never flickers between two gaps. Gaps it may not use are skipped.
  useAnimatedReaction(
    () => (active.get() ? blockTop.get() : null),
    (top) => {
      const a = active.get();
      if (top === null || !a) return;
      const ids = order.get();
      const h = heights.get();
      const info = slotInfo.get()[a.key] ?? [];
      let above = 0;
      let rest = 0;
      let compact = 0;
      for (let i = 0; i < ids.length; i++) {
        if (i >= a.start && i < a.start + a.size) continue;
        const height = h[ids[i]] ?? 0;
        if (compact + height / 2 < top) above = rest + 1;
        compact += height;
        rest++;
      }
      let next = above;
      if (!info[next]?.valid) {
        next = slot.get();
        for (let d = 1; d <= rest; d++) {
          if (info[above - d]?.valid) {
            next = above - d;
            break;
          }
          if (info[above + d]?.valid) {
            next = above + d;
            break;
          }
        }
      }
      if (next !== slot.get()) {
        slot.set(next);
        runOnJS(onSlot)(next);
      }
    }
  );

  // Held near the top or bottom edge, the list scrolls and the row stays under the finger.
  const frames = useEdgeScroll((frame) => {
    // Named explicitly: the worklet plugin only recognises `useFrameCallback` by its name.
    'worklet';
    if (!active.get() || !scrollRef) return;
    const box = measure(scrollRef);
    if (!box) return;
    const y = touchY.get();
    let speed = 0;
    if (y < box.pageY + SCROLL_EDGE) speed = -(1 - Math.max(0, y - box.pageY) / SCROLL_EDGE);
    else if (y > box.pageY + box.height - SCROLL_EDGE) {
      speed = 1 - Math.max(0, box.pageY + box.height - y) / SCROLL_EDGE;
    }
    if (speed === 0) return;
    const step = speed * SCROLL_SPEED * ((frame.timeSincePreviousFrame ?? 16) / 16);
    scrollTo(scrollRef, 0, Math.max(0, scroll.get() + step), false);
  }, false);

  // The gestures are made once per row; what they call on release is read when it happens.
  const latest = useRef({ onDrop, onTouch });
  useEffect(() => {
    latest.current = { onDrop, onTouch };
  }, [onDrop, onTouch]);

  const onLift = useCallback(
    (key: string, at: number) => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      setPlacing(true);
      frames.setActive(true);
      holdSelection(true);
      latest.current.onTouch?.();
      setDrag({ key, slot: at });
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    },
    [frames, setPlacing]
  );
  const onRelease = useCallback(
    (key: string, at: number, moved: boolean) => {
      frames.setActive(false);
      holdSelection(false);
      latest.current.onTouch?.();
      setDrag(null);
      if (moved) latest.current.onDrop(key, at);
      settleTimer.current = setTimeout(() => setPlacing(false), SETTLE_MS);
    },
    [frames, setPlacing]
  );

  const gestures = useRef(new Map<string, GestureType>());
  const gestureFor = useCallback(
    (key: string) => {
      const existing = gestures.current.get(key);
      if (existing) return existing;
      const drop = () => {
        'worklet';
        const a = active.get();
        if (!a || a.key !== key) return;
        const at = slot.get();
        const ids = order.get();
        const block = ids.slice(a.start, a.start + a.size);
        const rest = [...ids.slice(0, a.start), ...ids.slice(a.start + a.size)];
        // The order changes here, on the UI thread, in the frame the finger lifts.
        order.set([...rest.slice(0, at), ...block, ...rest.slice(at)]);
        active.set(null);
        translation.set(0);
        runOnJS(onRelease)(key, at, at !== a.start);
      };
      const pan = Gesture.Pan()
        .activateAfterLongPress(HOLD_MS)
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .onStart((event) => {
          if (active.get()) return;
          const ids = order.get();
          const start = ids.indexOf(key);
          const size = sizes.get()[key] ?? 0;
          const top = layout.get().y[key];
          if (start < 0 || size === 0 || top === undefined) return;
          startTop.set(top);
          startScroll.set(scroll.get());
          translation.set(0);
          touchY.set(event.absoluteY);
          slot.set(start);
          active.set({ key, start, size });
          runOnJS(onLift)(key, start);
        })
        .onUpdate((event) => {
          if (active.get()?.key !== key) return;
          translation.set(event.translationY);
          touchY.set(event.absoluteY);
        })
        .onFinalize(drop);
      gestures.current.set(key, pan);
      return pan;
    },
    [
      active,
      layout,
      onLift,
      onRelease,
      order,
      scroll,
      sizes,
      slot,
      startScroll,
      startTop,
      touchY,
      translation,
    ]
  );

  const height = useSharedValue(0);
  const sized = useSharedValue(false);
  useAnimatedReaction(
    () => layout.get().total,
    (total) => {
      if (!sized.get()) {
        height.set(total);
        sized.set(total > 0);
      } else height.set(withSpring(total, SETTLE));
    }
  );
  // At rest the list takes its natural height again; the value is reset, not just dropped,
  // because a style Reanimated has written stays on the native view.
  const frameStyle = useAnimatedStyle(() => ({
    height: placedShared.get() ? height.get() : 'auto',
  }));

  const gapY = useSharedValue(0);
  const gapShown = useSharedValue(0);
  useAnimatedReaction(
    () => {
      const l = layout.get();
      return l.lifted ? l.gapTop : null;
    },
    (top, previous) => {
      if (top === null) {
        gapShown.set(0);
        return;
      }
      if (previous === null || previous === undefined) {
        gapY.set(top);
        gapShown.set(withTiming(1, { duration: LIFT_MS, easing: EASE_OUT }));
      } else gapY.set(withSpring(top, SETTLE));
    }
  );
  const gapStyle = useAnimatedStyle(() => ({
    height: layout.get().gapHeight,
    opacity: gapShown.get(),
    transform: [{ translateY: gapY.get() }],
  }));

  const context = useMemo(
    () => ({ layout, ready: ready && placing, placed: placedShared, reportHeight, gestureFor }),
    [layout, ready, placing, placedShared, reportHeight, gestureFor]
  );
  const sizeOf = useMemo(() => new Map(rows.map((row) => [row.key, row.size])), [rows]);
  const liftedKeys = useMemo(() => {
    if (!drag) return null;
    const start = keys.indexOf(drag.key);
    return new Set(keys.slice(start, start + (sizeOf.get(drag.key) ?? 0)));
  }, [drag, keys, sizeOf]);
  const landing = drag ? (slots[drag.key]?.[drag.slot]?.depth ?? 0) : 0;

  return (
    <ListContext.Provider value={context}>
      {/* Holding a row must not start a text selection in a browser. */}
      <Animated.View className="select-none" style={frameStyle}>
        {ready && placing ? (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, gapStyle]}>
            {drag ? renderGap(landing) : null}
          </Animated.View>
        ) : null}
        {rows.map((row) => (
          <Row key={row.key} rowKey={row.key}>
            {renderRow(
              row.key,
              drag && liftedKeys?.has(row.key) ? { heldBy: drag.key, landing } : null
            )}
          </Row>
        ))}
      </Animated.View>
    </ListContext.Provider>
  );
}

function Row({ rowKey, children }: { rowKey: string; children: ReactNode }) {
  const { layout, ready, placed: absolute, reportHeight } = useContext(ListContext)!;
  const y = useSharedValue(0);
  const placed = useSharedValue(false);
  /** 1 while the row is in the air, easing back to 0 as it lands. */
  const raise = useSharedValue(0);
  /** Whether it is in the air alone: then it rises and casts a shadow. */
  const solo = useSharedValue(false);

  useAnimatedReaction(
    () => {
      const l = layout.get();
      return { top: l.y[rowKey], lifted: !!l.lifted?.[rowKey], solo: l.solo };
    },
    (now, before) => {
      if (now.top === undefined) return;
      if (now.lifted !== !!before?.lifted) {
        if (now.lifted) solo.set(now.solo);
        raise.set(withSpring(now.lifted ? 1 : 0, SETTLE));
      }
      if (!placed.get() || now.lifted) {
        y.set(now.top);
        placed.set(true);
      } else if (now.top !== before?.top || before?.lifted) {
        y.set(withSpring(now.top, SETTLE));
      }
    }
  );
  // At rest every value is set back explicitly: a style Reanimated has written stays on the
  // native view, and a stale one took rows out of Android's accessibility tree.
  const style = useAnimatedStyle(() =>
    absolute.get()
      ? {
          opacity: placed.get() ? 1 : 0,
          zIndex: raise.get() > 0 ? 10 : 0,
          // A row alone in the air rises 8 pt above where it is held (lift, then settle).
          transform: [{ translateY: y.get() - (solo.get() ? LIFT * raise.get() : 0) }],
        }
      : { opacity: 1, zIndex: 0, transform: [{ translateY: 0 }] }
  );
  const row = useMemo(() => ({ key: rowKey, raise, solo }), [rowKey, raise, solo]);

  return (
    <RowContext.Provider value={row}>
      <Animated.View
        style={[
          ready
            ? { position: 'absolute', left: 0, right: 0, top: 0 }
            : { position: 'relative', left: 0, right: 0, top: 0 },
          style,
        ]}
        onLayout={(event) => reportHeight(rowKey, event.nativeEvent.layout.height)}>
        {children}
      </Animated.View>
    </RowContext.Provider>
  );
}

/**
 * The part of a row that is held to drag it, and that casts the shadow while it is in the
 * air. Outside a `DragList` it is just its children.
 */
export function DragHandle({ children, radius = 8 }: { children: ReactNode; radius?: number }) {
  const list = useContext(ListContext);
  const row = useContext(RowContext);
  if (!list || !row) return children;
  return (
    <Handle gesture={list.gestureFor(row.key)} raise={row.raise} radius={radius} solo={row.solo}>
      {children}
    </Handle>
  );
}

function Handle({
  gesture,
  raise,
  radius,
  solo,
  children,
}: {
  gesture: GestureType;
  raise: SharedValue<number>;
  radius: number;
  /** A row that travels alone casts a shadow; a group in the air is lifted by its own outline. */
  solo: SharedValue<boolean>;
  children: ReactNode;
}) {
  const cast = useAnimatedStyle(() => ({
    boxShadow:
      solo.get() && raise.get() > 0
        ? `0px 14px 30px rgba(11, 15, 28, ${0.22 * raise.get()})`
        : undefined,
  }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ borderRadius: radius }, cast]}>{children}</Animated.View>
    </GestureDetector>
  );
}
