import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { COLUMNS } from '@/lib/moonboard/boards';
import { EASE_OUT } from '@/lib/motion';
import { holdName, parseHold } from '@/lib/moonboard/grid';
import { ROLES, type ProblemHolds, type Role } from '@/lib/moonboard/types';
import { useAppTheme } from '@/lib/use-theme';
import { nunito } from '@/lib/fonts';
import { describeHolds } from '@/lib/moonboard/names';
import { WALL } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** How wide the full board is drawn on a screen of this width: 252 pt on a phone, never huge. */
export const boardWidthFor = (screenWidth: number) => Math.min(screenWidth - 138, 340);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** A lit hold's halo: the LED colour at 36 %. */
const HALO = 0.36;

/** The halo of a lit hold. It fades in when the lights come on, one hold after another. */
function Halo({
  cx,
  cy,
  r,
  color,
  order,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  order: number;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(
      withDelay(
        reducedMotion ? 0 : order * 20,
        withTiming(HALO, { duration: reducedMotion ? 120 : 160, easing: EASE_OUT })
      )
    );
  }, [opacity, order, reducedMotion]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.get() }));
  return <AnimatedCircle cx={cx} cy={cy} r={r} fill={color} animatedProps={animatedProps} />;
}

/**
 * Which grid positions carry a hold in the drawing. A schematic, not the real hold map (that
 * needs the licensed layout): about four in five positions, the same on every screen.
 */
function occupied(col: number, row: number) {
  const seed = (col * 73 + row * 151 + col * row * 31 + 7) % 97;
  return seed < 80;
}

type MoonBoardProps = {
  width: number;
  rows: number;
  holds?: ProblemHolds;
  /** The lights are showing these holds: draw their halos. */
  lit?: boolean;
  /** Column letters and row numbers round the edge. */
  labels?: boolean;
  /** Corner radius of the board's card. */
  radius?: number;
  /** Tapping a position, while setting a problem. */
  onHoldPress?: (hold: string) => void;
  /** The colour of the role being placed, for the loupe. */
  loupeColor?: string;
};

/**
 * The wall as a diagram (design/rivet/app/boards.py `moonwall`): a white card with the grid's
 * holds as small Raised dots, the problem ringed in the wall's LED colours. Shape carries the
 * role as well as colour: start and finish have a centre dot, finish a second ring, a hold is
 * a plain ring. Lit holds get a soft halo that comes on from the start to the finish.
 */
export const MoonBoard = memo(function MoonBoard({
  width,
  rows,
  holds,
  lit = false,
  labels = true,
  radius = 24,
  onHoldPress,
  loupeColor = WALL.hold,
}: MoonBoardProps) {
  const { theme } = useAppTheme();
  const [touch, setTouchState] = useState<{ col: number; row: number } | null>(null);
  // The release can arrive before React has re-rendered with the grant, so the hold under the
  // finger is also kept in a ref that the handlers read.
  const touchRef = useRef<{ col: number; row: number } | null>(null);
  const setTouch = (next: { col: number; row: number } | null) => {
    touchRef.current = next;
    setTouchState(next);
  };
  const pad = labels ? 22 : 10;
  const cell = (width - pad - 10) / COLUMNS.length;
  const height = pad + rows * cell + 10;
  const ox = pad;
  const oy = pad - 4;
  const cx = (col: number) => ox + (col + 0.5) * cell;
  const cy = (row: number) => oy + (rows - row - 0.5) * cell;

  const chosen = useMemo(() => {
    const map = new Map<string, Role>();
    for (const role of ROLES) for (const hold of holds?.[role] ?? []) map.set(hold, role);
    return map;
  }, [holds]);

  // The lights come on from the start of the problem to its finish.
  const order = useMemo(() => {
    const byHeight = [...chosen.keys()].sort(
      (a, b) => (parseHold(a, rows)?.row ?? 0) - (parseHold(b, rows)?.row ?? 0)
    );
    return new Map(byHeight.map((hold, index) => [hold, index]));
  }, [chosen, rows]);

  // Every hold of the wall is one path that only changes with its size.
  const dots = useMemo(() => {
    const r = (cell * 0.3) / 2;
    const d: string[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < COLUMNS.length; col += 1) {
        // A hold of the problem is drawn as its ring instead.
        if (!occupied(col, row) || chosen.has(holdName({ col, row }))) continue;
        const x = ox + (col + 0.5) * cell;
        const y = oy + (rows - row - 0.5) * cell;
        d.push(
          `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
        );
      }
    }
    return d.join('');
  }, [rows, cell, ox, oy, chosen]);

  /** The grid position under a touch, or null off the grid. */
  const at = (event: GestureResponderEvent) => {
    // A click on web carries offsets instead of the touch location. Both are relative to
    // this view only because the drawing inside ignores touches (`pointerEvents="none"`).
    const point = event.nativeEvent as typeof event.nativeEvent & {
      offsetX?: number;
      offsetY?: number;
    };
    const x = point.locationX ?? point.offsetX ?? -1;
    const y = point.locationY ?? point.offsetY ?? -1;
    const col = Math.floor((x - ox) / cell);
    const row = rows - 1 - Math.floor((y - oy) / cell);
    return col >= 0 && col < COLUMNS.length && row >= 0 && row < rows ? { col, row } : null;
  };

  const ring = cell * 0.86;
  const board = (
    <Svg width={width} height={height} pointerEvents="none">
      {labels
        ? [...COLUMNS].map((letter, col) => (
            <SvgText
              key={letter}
              x={cx(col)}
              y={16}
              fontSize={10}
              fontFamily={nunito(700)}
              fill={theme.muted}
              textAnchor="middle">
              {letter}
            </SvgText>
          ))
        : null}
      {labels
        ? Array.from({ length: rows }, (_, row) => (
            <SvgText
              key={row}
              x={pad / 2}
              y={cy(row) + 3.5}
              fontSize={10}
              fontFamily={nunito(700)}
              fill={theme.muted}
              textAnchor="middle">
              {row + 1}
            </SvgText>
          ))
        : null}
      <Path d={dots} fill={theme.raised} />
      {[...chosen].map(([hold, role]) => {
        const at = parseHold(hold, rows);
        if (!at) return null;
        const color = WALL[role];
        const x = cx(at.col);
        const y = cy(at.row);
        return (
          <G key={hold}>
            {lit ? (
              <Halo cx={x} cy={y} r={ring * 0.75} color={color} order={order.get(hold) ?? 0} />
            ) : null}
            <Circle
              cx={x}
              cy={y}
              r={ring / 2}
              fill={color}
              fillOpacity={0.14}
              stroke={color}
              strokeWidth={role === 'hold' ? 2 : 2.4}
            />
            {role !== 'hold' ? <Circle cx={x} cy={y} r={ring * 0.18} fill={color} /> : null}
            {role === 'finish' ? (
              <Circle cx={x} cy={y} r={ring / 2 + 3} fill="none" stroke={color} strokeWidth={1.2} />
            ) : null}
          </G>
        );
      })}
    </Svg>
  );

  const frame = 'self-center overflow-hidden border border-line bg-surface';
  const style = { width, height, borderRadius: radius };
  if (!onHoldPress) {
    return (
      <View
        className={frame}
        style={style}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`MoonBoard. ${describeHolds({ start: holds?.start ?? [], hold: holds?.hold ?? [], finish: holds?.finish ?? [] })}`}>
        {board}
      </View>
    );
  }
  // Holds are about 24 pt apart, under a finger: while it is down a loupe above it shows the
  // hold it is on, enlarged and named, and the hold is set when the finger lifts.
  // Near the top it would leave the screen: it moves beside the finger instead, towards the middle.
  const loupe = touch
    ? (() => {
        const x = cx(touch.col);
        const y = cy(touch.row);
        if (y >= 140) return { left: x - 52, top: y - 150, stem: true };
        return { left: x < width / 2 ? x + 36 : x - 140, top: Math.max(0, y - 52), stem: false };
      })()
    : null;
  return (
    <View className="self-center" style={{ width, height }}>
      <View
        accessible
        accessibilityLabel={`Board. ${describeHolds({ start: holds?.start ?? [], hold: holds?.hold ?? [], finish: holds?.finish ?? [] })} Tap a hold to add or remove it, or type one below.`}
        className={frame}
        style={style}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => setTouch(at(event))}
        onResponderMove={(event) => {
          const next = at(event);
          const now = touchRef.current;
          if (next?.col !== now?.col || next?.row !== now?.row) setTouch(next);
        }}
        onResponderRelease={() => {
          const last = touchRef.current;
          setTouch(null);
          if (last) onHoldPress(holdName(last));
        }}
        onResponderTerminationRequest={() => false}
        onResponderTerminate={() => setTouch(null)}>
        {board}
      </View>
      {loupe && touch ? (
        <View
          pointerEvents="none"
          className="absolute items-center"
          style={{ left: loupe.left, top: loupe.top, width: 104 }}>
          <View
            className="size-[104px] items-center justify-center gap-1 rounded-full border-2 border-text bg-surface"
            style={{
              shadowColor: '#0B0F1C',
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            }}>
            <View
              className="mt-2 size-11 rounded-full border-[3px]"
              style={{ borderColor: loupeColor, backgroundColor: `${loupeColor}24` }}
            />
            <Text className="type-caption text-xs">{holdName(touch)}</Text>
          </View>
          {loupe.stem ? <View className="h-8 w-0.5 bg-text" /> : null}
        </View>
      ) : null}
    </View>
  );
});

/**
 * The mini MoonBoard, the one problem thumbnail everywhere (design/rivet/app/boards.py
 * `wall_thumb`): a Raised tile with a faint grid, the problem's holds as ink dots, start and
 * finish as small rings in the wall's LED colours. `height` sets the size; it is 0.69 as wide.
 */
export const ProblemThumb = memo(function ProblemThumb({
  holds,
  rows,
  height = 64,
}: {
  holds: ProblemHolds;
  rows: number;
  height?: number;
}) {
  const { theme } = useAppTheme();
  const width = height * 0.69;
  const pad = height * 0.08;
  const cw = (width - 2 * pad) / COLUMNS.length;
  const ch = (height - 2 * pad) / rows;
  const d = Math.max(3.2, Math.min(cw, ch) * 1.05);
  const ring = d + 1.6;
  const stroke = Math.max(1.2, height / 40);
  const at = (hold: string) => {
    const p = parseHold(hold, rows);
    return p ? { x: pad + (p.col + 0.5) * cw, y: pad + (rows - p.row - 0.5) * ch } : null;
  };
  const grid: string[] = [];
  for (let c = 1; c < COLUMNS.length; c++) grid.push(`M${pad + c * cw} ${pad}V${height - pad}`);
  for (let r = 1; r < rows; r++) grid.push(`M${pad} ${pad + r * ch}H${width - pad}`);
  return (
    <View
      className="overflow-hidden bg-raised"
      style={{ width, height, borderRadius: Math.min(10, height * 0.16) }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Path d={grid.join('')} stroke={theme.text} strokeOpacity={0.08} strokeWidth={0.5} />
        {holds.hold.map((hold) => {
          const p = at(hold);
          return p ? <Circle key={hold} cx={p.x} cy={p.y} r={d / 2} fill={theme.text} /> : null;
        })}
        {(['start', 'finish'] as const).flatMap((role) =>
          holds[role].map((hold) => {
            const p = at(hold);
            return p ? (
              <Circle
                key={role + hold}
                cx={p.x}
                cy={p.y}
                r={ring / 2}
                fill="none"
                stroke={WALL[role]}
                strokeWidth={stroke}
              />
            ) : null;
          })
        )}
      </Svg>
    </View>
  );
});

/** The swatch of one role, as drawn on the wall: a ring, with a dot for start and finish. */
/** A role's ring in its LED colour; the legend adds the centre dot start and finish carry on the wall. */
export function RoleSwatch({
  role,
  size = 15,
  plain,
}: {
  role: Role;
  size?: number;
  /** Just the ring, as on the role picker. */
  plain?: boolean;
}) {
  const r = size / 2;
  return (
    <Svg width={size + 2} height={size + 2}>
      <Circle
        cx={r + 1}
        cy={r + 1}
        r={r - 1}
        fill={WALL[role]}
        fillOpacity={0.14}
        stroke={WALL[role]}
        strokeWidth={2}
      />
      {role !== 'hold' && !plain ? (
        <Circle cx={r + 1} cy={r + 1} r={size / 6} fill={WALL[role]} />
      ) : null}
    </Svg>
  );
}

export const ROLE_LABELS: Record<Role, string> = { start: 'Start', hold: 'Hold', finish: 'Finish' };

/** What the three colours mean; colour is never the only signal. */
export function HoldLegend({ className }: { className?: string }) {
  return (
    <View className={cn('flex-row flex-wrap justify-center gap-x-5 gap-y-1', className)}>
      {ROLES.map((role) => (
        <View key={role} className="flex-row items-center gap-1.5">
          <RoleSwatch role={role} />
          <Text className="type-caption">{ROLE_LABELS[role]}</Text>
        </View>
      ))}
    </View>
  );
}
