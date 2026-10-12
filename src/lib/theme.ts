import { DefaultTheme, type Theme } from 'expo-router';

/** Semantic colors mirrored in src/global.css; use classes unless an inline color is required. */
export const LIGHT_THEME = {
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
  holdStart: 'hsl(148.000 55.000% 40.000%)',
  holdMove: 'hsl(217.000 69.000% 52.000%)',
  holdFinish: 'hsl(9.000 68.000% 52.000%)',
  holdWood: 'hsl(34.000 46.000% 60.000%)',
  radius: '0.75rem',
} as const;

export const DARK_THEME = {
  background: 'hsl(100 7% 9%)',
  foreground: 'hsl(60 15% 93%)',
  card: 'hsl(100 6% 14%)',
  cardForeground: 'hsl(60 15% 93%)',
  popover: 'hsl(100 6% 14%)',
  popoverForeground: 'hsl(60 15% 93%)',
  primary: 'hsl(40 90% 72%)',
  primaryForeground: 'hsl(100 7% 9%)',
  secondary: 'hsl(39 24% 24%)',
  secondaryForeground: 'hsl(60 15% 93%)',
  muted: 'hsl(100 5% 23%)',
  mutedForeground: 'hsl(60 11% 73%)',
  accent: 'hsl(39 27% 27%)',
  accentForeground: 'hsl(60 15% 93%)',
  destructive: 'hsl(0 72% 64%)',
  destructiveForeground: 'hsl(100 7% 9%)',
  border: 'hsl(100 5% 32%)',
  input: 'hsl(100 5% 41%)',
  ring: 'hsl(40 90% 72%)',
  chart1: 'hsl(40 46% 26%)',
  chart2: 'hsl(40 47% 40%)',
  chart3: 'hsl(40 90% 72%)',
  chart4: 'hsl(60 15% 83%)',
  chart5: 'hsl(100 5% 38%)',
  holdStart: 'hsl(148 58% 55%)',
  holdMove: 'hsl(217 79% 70%)',
  holdFinish: 'hsl(9 80% 68%)',
  holdWood: 'hsl(34 46% 60%)',
  radius: LIGHT_THEME.radius,
} as const;

export type AppTheme = typeof LIGHT_THEME | typeof DARK_THEME;

export function navigationTheme(theme: AppTheme, dark: boolean): Theme {
  return {
    ...DefaultTheme,
    dark,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      border: theme.border,
      card: theme.card,
      notification: theme.destructive,
      primary: theme.primary,
      text: theme.foreground,
    },
  };
}
