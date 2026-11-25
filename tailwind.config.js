const plugin = require('tailwindcss/plugin');
const { hairlineWidth } = require('nativewind/theme');

// NativeWind sets NATIVEWIND_OS to the platform it is compiling for ('web' or unset on web).
const isWeb = process.env.NATIVEWIND_OS === undefined || process.env.NATIVEWIND_OS === 'web';

// Nunito is loaded one file per weight (see src/lib/fonts.ts), each under its own family name.
const NUNITO = {
  400: 'Nunito_400',
  500: 'Nunito_500',
  600: 'Nunito_600',
  700: 'Nunito_700',
  800: 'Nunito_800',
  900: 'Nunito_900',
};

const FONT_WEIGHTS = {
  thin: 400,
  extralight: 400,
  light: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// The family name carries the weight, so no numeric weight is set on native (Android would look
// up a separate bold face). On web every family is registered at 400; pin it so the browser does
// not synthesize a bolder face on top of the real one.
const family = (weight) =>
  isWeb ? { fontFamily: NUNITO[weight], fontWeight: '400' } : { fontFamily: NUNITO[weight] };

// The app type scale (design/rivet/app/ui.py TYPE): size, weight, tracking, line height. These
// are components, not utilities, so a `text-*`, `leading-*`, `tracking-*` or `font-*` utility
// next to one overrides it. Body comes first: it is `Text`'s default and every other style
// defined after it wins over it.
const TYPE = {
  body: [17, 600, 0, 1.35],
  timer: [200, 900, -6, 1.0],
  phase: [44, 900, -1, 1.05],
  large: [34, 900, -0.34, 1.08],
  hero: [28, 900, -0.28, 1.1],
  title: [22, 800, 0, 1.2],
  'body-b': [17, 800, 0, 1.3],
  row: [16, 800, 0, 1.3],
  sub: [15, 700, 0, 1.35],
  caption: [13, 700, 0, 1.3],
  label: [12, 800, 1.68, 1.2],
  num: [22, 900, -0.2, 1.1],
  bignum: [34, 900, -0.5, 1.05],
};

const rivetType = plugin(({ addUtilities, addComponents }) => {
  const utilities = {};
  for (const [name, weight] of Object.entries(FONT_WEIGHTS)) {
    utilities[`.font-${name}`] = family(weight);
  }
  const components = {};
  for (const [name, [size, weight, tracking, leading]] of Object.entries(TYPE)) {
    components[`.type-${name}`] = {
      ...family(weight),
      fontSize: `${size}px`,
      lineHeight: `${Math.round(size * leading)}px`,
      letterSpacing: `${tracking}px`,
      ...(name === 'label' ? { textTransform: 'uppercase' } : {}),
    };
  }
  addComponents(components);
  addUtilities(utilities);
});

const role = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind follows the system by default; a saved preference can override the class.
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: [NUNITO[600]],
      },
      colors: {
        // Rivet roles (src/global.css).
        canvas: role('canvas'),
        surface: role('surface'),
        raised: role('raised'),
        text: role('text'),
        muted: role('muted'),
        muted2: role('muted2'),
        track: role('track'),
        bar: role('bar'),
        action: role('action'),
        'on-action': role('on-action'),
        board: { DEFAULT: role('board'), soft: role('board-soft') },
        dock: { DEFAULT: role('dock'), fg: role('dock-fg'), dim: role('dock-dim') },
        disabled: { DEFAULT: role('disabled-bg'), fg: role('disabled-fg') },
        'segment-tile': role('segment-tile'),
        menu: role('menu'),
        'rest-rail': role('rest-rail'),
        'recover-rail': role('recover-rail'),
        heat: {
          0: role('heat0'),
          1: role('heat1'),
          2: role('heat2'),
          3: role('heat3'),
          4: role('heat4'),
          5: role('heat5'),
          6: role('heat6'),
        },
        line: { DEFAULT: 'var(--line)', strong: 'var(--line2)' },
        scrim: 'var(--scrim)',
        'selected-tile': 'var(--selected-tile)',
        // The brand palette, the same in both modes (session grounds, the wall).
        snow: '#F8F6F3',
        paper: '#F2ECE3',
        night: {
          DEFAULT: '#141A2E',
          deep: '#0B0F1C',
          100: '#E7E8EC',
          200: '#C5C8D2',
          300: '#8C92A6',
          400: '#555D78',
          500: '#2E3650',
        },
        glow: '#F28C6E',
        glacier: {
          100: '#F0F7F9',
          200: '#DDECF1',
          300: '#C3DCE5',
          400: '#9CC3D1',
          500: '#6C9FB2',
          600: '#467B8F',
          700: '#2B5161',
        },
        dusk: {
          100: '#F1F0FA',
          200: '#DEDBF3',
          300: '#BDB7E6',
          400: '#8F88CC',
          500: '#6E66B2',
          600: '#524A8E',
          700: '#363062',
        },
        stone: '#E4E0DA',
        granite: '#6B6E73',
        wall: { start: '#2E9E6B', hold: '#3D6FD6', finish: '#D9483B', foot: '#E0A030' },
      },
      borderRadius: {
        card: '28px',
        input: '12px',
        tile: '12px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [rivetType],
};
