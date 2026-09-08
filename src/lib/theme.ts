import { DefaultTheme, type Theme } from 'expo-router';

/**
 * "Stella" palette from tweakcn, mirrored from the CSS variables in `src/global.css`.
 * The app has one appearance: no themes, no dark mode. Use these values only where a
 * Tailwind class cannot be used (native tab bar, navigation theme, inline styles).
 * Keep both files in sync.
 */
export const THEME = {
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(0 0% 0%)',
  card: 'hsl(0 0% 100%)',
  cardForeground: 'hsl(0 0% 0%)',
  popover: 'hsl(0 0% 100%)',
  popoverForeground: 'hsl(0 0% 0%)',
  primary: 'hsl(35 100% 71%)',
  primaryForeground: 'hsl(0 0% 0%)',
  secondary: 'hsl(35 100% 90%)',
  secondaryForeground: 'hsl(0 0% 0%)',
  muted: 'hsl(35 40% 94%)',
  mutedForeground: 'hsl(35 20% 40%)',
  accent: 'hsl(35 100% 85%)',
  accentForeground: 'hsl(0 0% 0%)',
  destructive: 'hsl(0 84% 60%)',
  destructiveForeground: 'hsl(0 0% 98%)',
  border: 'hsl(35 40% 85%)',
  input: 'hsl(35 40% 85%)',
  ring: 'hsl(35 100% 71%)',
  radius: '0.85rem',
  chart1: 'hsl(35 100% 71%)',
  chart2: 'hsl(35 80% 60%)',
  chart3: 'hsl(35 60% 50%)',
  chart4: 'hsl(35 40% 40%)',
  chart5: 'hsl(35 100% 85%)',
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
