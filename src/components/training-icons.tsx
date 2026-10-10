import type { Icon, IconProps, IconWeight } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import Svg, { G, Path } from 'react-native-svg';

/** The dock needs Regular and Fill; both share the existing Icon wrapper's props. */
function IconBase({
  weights,
  name,
  size = 24,
  color = 'currentColor',
  weight = 'regular',
  mirrored,
  style,
  testID,
  title,
  titleId,
}: IconProps & { weights: Map<IconWeight, ReactElement>; name: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color}
      style={[style, mirrored ? { transform: [{ scaleX: -1 }] } : undefined]}
      testID={testID ?? `${name}-${weight}`}
      accessibilityLabel={title}
      aria-labelledby={titleId}>
      {weights.get(weight === 'fill' ? 'fill' : 'regular')}
    </Svg>
  );
}

/** Custom dock artwork; editable masters: Penpot / 08 Dock icon studies. */
const deadHang = new Map<IconWeight, ReactElement>([
  [
    'regular',
    <G key="regular">
      <Path
        d="M4 2H20Q21 2 21 3V4.5H3V3Q3 2 4 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.6 8a1.4 1.4 0 1 1 2.8 0a1.4 1.4 0 1 1 -2.8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 4.5L8 8Q8.25 8.75 8.75 9.25L10.25 11.25H13.75L15.25 9.25Q15.75 8.75 16 8L17 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.25 11.25V16.25L8.75 21.25M13.75 11.25V16.25L15.25 21.25"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>,
  ],
  [
    'fill',
    <G key="fill">
      <Path d="M4 2H20Q21 2 21 3V4.5H3V3Q3 2 4 2Z" fill="currentColor" />
      <Path d="M10.6 8a1.4 1.4 0 1 1 2.8 0a1.4 1.4 0 1 1 -2.8 0Z" fill="currentColor" />
      <Path
        d="M7 4.5L8 8Q8.25 8.75 8.75 9.25L10.25 11.25H13.75L15.25 9.25Q15.75 8.75 16 8L17 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.25 11.25H13.75V16.25L15.25 21.25H12.75L12 18L11.25 21.25H8.75L10.25 16.25Z"
        fill="currentColor"
      />
    </G>,
  ],
]);

export const DeadHangIcon: Icon = ({ weight = 'regular', ...props }: IconProps) => (
  <IconBase
    {...props}
    weight={weight === 'fill' ? 'fill' : 'regular'}
    weights={deadHang}
    name="deadHang"
  />
);

const moonBoard = new Map<IconWeight, ReactElement>([
  [
    'regular',
    <G key="regular">
      <Path
        d="M6 3H18Q19 3 19 4V21H5V4Q5 3 6 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 18.25H19"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6.75l1-.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.75 6.25l1 .5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 10.5l.5 1"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 11.25l1-.75"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 15.5l1-.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 14.75l1 .5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>,
  ],
  [
    'fill',
    <G key="fill">
      <Path
        d="M6 3H18Q19 3 19 4V21H5V4Q5 3 6 3ZM7.45 6.5a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM14.2 6.5a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM7.7 11a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM13.95 10.9a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM7.45 15.25a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM14.45 15a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0ZM6.5 18V19.5H17.5V18Z"
        fill="currentColor"
      />
    </G>,
  ],
]);

export const MoonBoardIcon: Icon = ({ weight = 'regular', ...props }: IconProps) => (
  <IconBase
    {...props}
    weight={weight === 'fill' ? 'fill' : 'regular'}
    weights={moonBoard}
    name="moonBoard"
  />
);
