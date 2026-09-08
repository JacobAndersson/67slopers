const plugin = require('tailwindcss/plugin');
const { hairlineWidth } = require('nativewind/theme');

// NativeWind sets NATIVEWIND_OS to the platform it is compiling for ('web' or unset on web).
const isWeb = process.env.NATIVEWIND_OS === undefined || process.env.NATIVEWIND_OS === 'web';

// Geist Mono is loaded one file per weight (see src/lib/fonts.ts), each under its own
// family name. The `font-*` weight utilities below select the matching family.
const GEIST_MONO = {
  400: 'GeistMono_400Regular',
  500: 'GeistMono_500Medium',
  600: 'GeistMono_600SemiBold',
  700: 'GeistMono_700Bold',
  800: 'GeistMono_800ExtraBold',
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
  black: 800,
};

const geistMonoWeights = plugin(({ addUtilities }) => {
  const utilities = {};
  for (const [name, weight] of Object.entries(FONT_WEIGHTS)) {
    // The family name already carries the weight, so no numeric weight is set on
    // native: React Native would otherwise look up a separate "bold" typeface on
    // Android (and fall back to the system font) or re-pick a face by weight on iOS.
    // On web every family is registered at the default weight, so pin 400 there to
    // stop the browser from synthesizing a bolder face on top of the real one.
    utilities[`.font-${name}`] = isWeb
      ? { fontFamily: GEIST_MONO[weight], fontWeight: '400' }
      : { fontFamily: GEIST_MONO[weight] };
  }
  addUtilities(utilities);
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: [GEIST_MONO[400]],
        mono: [GEIST_MONO[400]],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate'), geistMonoWeights],
};
