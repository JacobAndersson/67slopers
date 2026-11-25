import { Fragment, memo, useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { BOARD_DIAGRAMS } from '@/lib/boards/generated/diagrams';
import { EASE_OUT } from '@/lib/motion';
import { useAppTheme } from '@/lib/use-theme';

type Props = {
  board: string;
  /** Holds drawn solid; the rest are hairlines. */
  active?: readonly string[];
  /** Ink colour; the theme's text colour by default. */
  color?: string;
  /** Hairline width in points at the rendered size. */
  strokeWidth?: number;
  /** Opacity of the hairlines (design `base_alpha`, 0x38 by default). */
  lineOpacity?: number;
  /** Opacity of the board's tint (design `fill_alpha`, 0x10 by default). */
  fillOpacity?: number;
  /** An opaque plate under the tint, so the board hides what is behind it. */
  plate?: string;
  /** Fixed width in points; without it the diagram fills its container's width. */
  width?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Keep every hold mounted and fade fills on a grip change (the timer), so nothing flashes. */
  animated?: boolean;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How long a hold takes to fill or empty when the grip changes. */
const GRIP_FADE_MS = 250;

/** One hold whose fill fades in and out with `on`. */
function FadingHold({ d, on, ink }: { d: string; on: boolean; ink: string }) {
  const shown = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    shown.set(
      withTiming(on ? 1 : 0, {
        duration: GRIP_FADE_MS,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [on, shown]);
  const fill = useAnimatedProps(() => ({ fillOpacity: shown.get() }));
  return <AnimatedPath d={d} fill={ink} animatedProps={fill} />;
}

/**
 * A hangboard as a diagram, true to its layout.json (design/rivet/app/boards.py `hangboard`): the
 * real silhouette, the Beastmaker's wrap-around corner jugs, pill-shaped pockets, edges as
 * separate strips and the lower tier's step. Active holds are solid ink, the rest hairlines.
 * "We photograph, and we diagram": never a render.
 */
export const HangboardDiagram = memo(function HangboardDiagram({
  board,
  active = [],
  color,
  strokeWidth = 1.4,
  lineOpacity = 0x38 / 255,
  fillOpacity = 0x10 / 255,
  plate,
  width: fixed,
  style,
  accessibilityLabel,
  animated,
}: Props) {
  const { theme } = useAppTheme();
  const [measured, setMeasured] = useState(0);
  const diagram = BOARD_DIAGRAMS[board];
  if (!diagram) return null;
  const width = fixed ?? measured;
  const height = (width * diagram.height) / diagram.width;
  const ink = color ?? theme.text;
  // Strokes are set in board millimetres, so scale the point width back.
  const k = width ? width / diagram.width : 1;
  const sw = strokeWidth / k;
  const on = new Set(active);
  return (
    <View
      style={[
        fixed ? { width: fixed } : { alignSelf: 'stretch' },
        { height: height || undefined },
        style,
      ]}
      onLayout={fixed ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}>
      {width ? (
        <Svg
          width={width}
          height={height}
          viewBox={`${-sw} ${-sw} ${diagram.width + 2 * sw} ${diagram.height + 2 * sw}`}>
          {plate ? <Path d={diagram.plate} fill={plate} /> : null}
          <Path
            d={diagram.plate}
            fill={ink}
            fillOpacity={fillOpacity}
            stroke={ink}
            strokeOpacity={lineOpacity}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          {diagram.ledge ? (
            <Rect
              x={diagram.ledge.x}
              y={diagram.ledge.y - sw / 2}
              width={diagram.ledge.w}
              height={sw}
              fill={ink}
              fillOpacity={lineOpacity}
            />
          ) : null}
          {diagram.holds.map((hold) =>
            animated ? (
              <Fragment key={hold.id}>
                <Path
                  d={hold.d}
                  fill="none"
                  stroke={ink}
                  strokeOpacity={lineOpacity}
                  strokeWidth={sw * 0.8}
                />
                <FadingHold d={hold.d} on={on.has(hold.id)} ink={ink} />
              </Fragment>
            ) : on.has(hold.id) ? (
              <Path key={hold.id} d={hold.d} fill={ink} />
            ) : (
              <Path
                key={hold.id}
                d={hold.d}
                fill={hold.faint ? ink : 'none'}
                fillOpacity={hold.faint ? 0x08 / 255 : undefined}
                stroke={ink}
                strokeOpacity={lineOpacity}
                strokeWidth={sw * 0.8}
              />
            )
          )}
        </Svg>
      ) : null}
    </View>
  );
});
