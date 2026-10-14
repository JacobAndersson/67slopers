import { memo, useEffect, useMemo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
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
import { cn } from '@/lib/utils';

/** How wide the full board is drawn on a screen of this width: room either side, never huge. */
export const boardWidthFor = (screenWidth: number) => Math.min(screenWidth - 96, 340);

function roleColors(theme: ReturnType<typeof useAppTheme>['theme']): Record<Role, string> {
  return { start: theme.holdStart, hold: theme.holdMove, finish: theme.holdFinish };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const GLOW = 0.2;

/** The halo of a lit hold. It fades in when the lights come on, one hold after another. */
function Glow({
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
        withTiming(GLOW, { duration: 120, easing: EASE_OUT })
      )
    );
  }, [opacity, order, reducedMotion]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.get() }));
  return <AnimatedCircle cx={cx} cy={cy} r={r} fill={color} animatedProps={animatedProps} />;
}

/** Schematic placeholders, not the physical grip shapes. Exact artwork needs licensed assets. */
function blob(col: number, row: number) {
  const seed = (col * 73 + row * 151 + col * row * 31) % 97;
  return {
    rx: 0.17 + ((seed * 7) % 11) / 100,
    ry: 0.13 + ((seed * 13) % 9) / 100,
    angle: ((seed * 29) % 150) - 75,
  };
}

type MoonBoardProps = {
  width: number;
  rows: number;
  holds?: ProblemHolds;
  /** The lights are showing these holds: draw their glow. */
  lit?: boolean;
  labels?: boolean;
  /** Tapping a position, while setting a problem. */
  onHoldPress?: (hold: string) => void;
};

/**
 * The wall as a schematic: a hold at every grid position, the problem ringed in the colours
 * of the lights. Start is green, holds are blue, finish is red with a second ring.
 */
export const MoonBoard = memo(function MoonBoard({
  width,
  rows,
  holds,
  lit = false,
  labels = true,
  onHoldPress,
}: MoonBoardProps) {
  const { theme } = useAppTheme();
  const roleColor = roleColors(theme);
  const left = labels ? 22 : 8;
  const top = labels ? 20 : 8;
  const pad = labels ? 10 : 8;
  const cell = (width - left - pad) / COLUMNS.length;
  const height = top + rows * cell + pad;
  const cx = (col: number) => left + (col + 0.5) * cell;
  const cy = (row: number) => top + (rows - row - 0.5) * cell;

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

  // The whole wall is one path that only changes with its size; the problem's holds are drawn
  // again on top in the dark colour, so a tap rebuilds a handful of shapes and not all of them.
  const wall = useMemo(() => {
    const d: string[] = [];
    const byHold = new Map<string, string>();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < COLUMNS.length; col += 1) {
        const shape = blob(col, row);
        const x = left + (col + 0.5) * cell;
        const y = top + (rows - row - 0.5) * cell;
        const rx = shape.rx * cell;
        const ry = shape.ry * cell;
        const dx = rx * Math.cos((shape.angle * Math.PI) / 180);
        const dy = rx * Math.sin((shape.angle * Math.PI) / 180);
        const arc = `A${rx.toFixed(2)} ${ry.toFixed(2)} ${shape.angle} 1 0 `;
        const one = `M${(x - dx).toFixed(2)} ${(y - dy).toFixed(2)}${arc}${(x + dx).toFixed(2)} ${(y + dy).toFixed(2)}${arc}${(x - dx).toFixed(2)} ${(y - dy).toFixed(2)}Z`;
        d.push(one);
        byHold.set(holdName({ col, row }), one);
      }
    }
    return { all: d.join(''), byHold };
  }, [rows, cell, left, top]);
  const chosenPath = [...chosen.keys()].map((hold) => wall.byHold.get(hold) ?? '').join('');

  const press = onHoldPress
    ? (event: GestureResponderEvent) => {
        // A click on web carries offsets instead of the touch location. Both are relative to
        // this view only because the drawing inside ignores touches (`pointerEvents="none"`).
        const point = event.nativeEvent as typeof event.nativeEvent & {
          offsetX?: number;
          offsetY?: number;
        };
        const x = point.locationX ?? point.offsetX ?? -1;
        const y = point.locationY ?? point.offsetY ?? -1;
        const col = Math.floor((x - left) / cell);
        const row = rows - 1 - Math.floor((y - top) / cell);
        if (col >= 0 && col < COLUMNS.length && row >= 0 && row < rows) {
          onHoldPress(holdName({ col, row }));
        }
      }
    : undefined;

  const board = (
    <Svg width={width} height={height} pointerEvents="none">
      {labels
        ? [...COLUMNS].map((letter, col) => (
            <SvgText
              key={letter}
              x={cx(col)}
              y={14}
              fontSize={10}
              fontFamily="GeistMono_500Medium"
              fill={theme.mutedForeground}
              textAnchor="middle">
              {letter}
            </SvgText>
          ))
        : null}
      {labels
        ? Array.from({ length: rows }, (_, row) => (
            <SvgText
              key={row}
              x={left - 6}
              y={cy(row) + 3.5}
              fontSize={10}
              fontFamily="GeistMono_500Medium"
              fill={theme.mutedForeground}
              textAnchor="end">
              {row + 1}
            </SvgText>
          ))
        : null}
      <Path d={wall.all} fill={theme.border} />
      <Path d={chosenPath} fill={theme.foreground} />
      {[...chosen].map(([hold, role]) => {
        const at = parseHold(hold, rows);
        if (!at) return null;
        const color = roleColor[role];
        return (
          <G key={hold}>
            {lit ? (
              <Glow
                cx={cx(at.col)}
                cy={cy(at.row)}
                r={cell * 0.66}
                color={color}
                order={order.get(hold) ?? 0}
              />
            ) : null}
            <Circle
              cx={cx(at.col)}
              cy={cy(at.row)}
              r={cell * 0.43}
              fill={color}
              fillOpacity={lit ? 0.3 : 0.12}
              stroke={color}
              strokeWidth={Math.max(1.5, cell * 0.11)}
            />
            {role === 'finish' ? (
              <Circle
                cx={cx(at.col)}
                cy={cy(at.row)}
                r={cell * 0.6}
                fill="none"
                stroke={color}
                strokeWidth={Math.max(1, cell * 0.06)}
              />
            ) : null}
            {labels && cell >= 18 ? (
              <SvgText
                x={cx(at.col)}
                y={cy(at.row) + 3.5}
                fontSize={Math.min(11, cell * 0.38)}
                fontFamily="GeistMono_700Bold"
                fill={theme.background}
                textAnchor="middle">
                {hold}
              </SvgText>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );

  const frame = cn(
    'self-center overflow-hidden border border-border bg-card',
    width > 150 ? 'rounded-2xl' : 'rounded-lg'
  );
  return press ? (
    <Pressable
      onPress={press}
      accessibilityLabel="Board. Tap a hold to add or remove it."
      className={frame}
      style={{ width, height }}>
      {board}
    </Pressable>
  ) : (
    <View className={frame} style={{ width, height }}>
      {board}
    </View>
  );
});

/** Every hold of one role as a single path of dots: three nodes per thumbnail, not one per hold. */
function dots(holds: string[], rows: number, cell: number): string {
  const r = Math.max(1.9, cell * 0.62);
  return holds
    .map((hold) => {
      const at = parseHold(hold, rows);
      if (!at) return '';
      const x = 4 + (at.col + 0.5) * cell;
      const y = 4 + (rows - at.row - 0.5) * cell;
      return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    })
    .join('');
}

/** The line of a problem as dots, small enough for a list row. */
export const ProblemThumb = memo(function ProblemThumb({
  holds,
  rows,
  width = 44,
}: {
  holds: ProblemHolds;
  rows: number;
  width?: number;
}) {
  const { theme } = useAppTheme();
  const roleColor = roleColors(theme);
  const cell = (width - 8) / COLUMNS.length;
  const height = rows * cell + 8;
  return (
    <View
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{ width, height }}>
      <Svg width={width} height={height}>
        {ROLES.map((role) => (
          <Path key={role} d={dots(holds[role], rows, cell)} fill={roleColor[role]} />
        ))}
      </Svg>
    </View>
  );
});

/** What the three colours mean; colour is never the only signal. */
export function HoldLegend() {
  return (
    <View className="flex-row justify-center gap-4">
      {ROLES.map((role) => (
        <View key={role} className="flex-row items-center gap-1.5">
          <View
            className={cn(
              'size-2.5 rounded-full border-2',
              role === 'start' && 'border-hold-start bg-hold-start/25',
              role === 'hold' && 'border-hold-move bg-hold-move/25',
              role === 'finish' && 'border-hold-finish bg-hold-finish/25'
            )}
          />
          <Text className="text-xs text-muted-foreground font-medium">
            {role === 'start' ? 'Start' : role === 'hold' ? 'Hold' : 'Finish'}
          </Text>
        </View>
      ))}
    </View>
  );
}
