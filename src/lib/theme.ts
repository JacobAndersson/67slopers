import { DefaultTheme, type Theme } from 'expo-router';

/**
 * Pulse / amber palette, mirrored from the CSS variables in `src/global.css`.
 * The app has one appearance: no themes, no dark mode. Use these values only where a
 * Tailwind class cannot be used (native tab bar, navigation theme, inline styles).
 * Keep both files in sync.
 */
export const THEME = {
  background: 'hsl(60.000 23.077% 97.451%)',
  foreground: 'hsl(100.000 4.615% 12.745%)',
  card: 'hsl(0.000 0.000% 100.000%)',
  cardForeground: 'hsl(100.000 4.615% 12.745%)',
  popover: 'hsl(0.000 0.000% 100.000%)',
  popoverForeground: 'hsl(100.000 4.615% 12.745%)',
  primary: 'hsl(100.000 4.615% 12.745%)',
  primaryForeground: 'hsl(0.000 0.000% 100.000%)',
  secondary: 'hsl(42.295 85.915% 86.078%)',
  secondaryForeground: 'hsl(100.000 4.615% 12.745%)',
  muted: 'hsl(200.000 30.612% 90.392%)',
  mutedForeground: 'hsl(75.000 8.163% 19.216%)',
  accent: 'hsl(40.000 71.429% 87.647%)',
  accentForeground: 'hsl(100.000 4.615% 12.745%)',
  destructive: 'hsl(0.000 58.621% 34.118%)',
  destructiveForeground: 'hsl(0.000 0.000% 100.000%)',
  border: 'hsl(75.000 8.696% 81.961%)',
  input: 'hsl(81.429 5.785% 47.451%)',
  ring: 'hsl(32.692 100.000% 30.588%)',
  chart1: 'hsl(40.385 92.857% 67.059%)',
  chart2: 'hsl(40.000 71.429% 87.647%)',
  chart3: 'hsl(32.692 100.000% 30.588%)',
  chart4: 'hsl(75.000 8.163% 19.216%)',
  chart5: 'hsl(200.000 30.612% 90.392%)',
  radius: '0.75rem',
} as const;

export type ThemeColor = keyof typeof THEME;

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: THEME.background,
    border: THEME.border,
    card: THEME.card,
    notification: THEME.destructive,
    primary: THEME.primary,
    text: THEME.foreground,
  },
};
