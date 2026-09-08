import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

/**
 * "Stella" theme from tweakcn, mirrored from the CSS variables in `src/global.css`.
 * Use these values for anything that cannot take a Tailwind class (native tab bar,
 * navigation theme, inline styles, animations). Keep both files in sync.
 */
export const THEME = {
  light: {
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
  },
  dark: {
    background: 'hsl(35 40% 5%)',
    foreground: 'hsl(35 100% 95%)',
    card: 'hsl(35 40% 8%)',
    cardForeground: 'hsl(35 100% 95%)',
    popover: 'hsl(35 40% 6%)',
    popoverForeground: 'hsl(35 100% 95%)',
    primary: 'hsl(35 100% 71%)',
    primaryForeground: 'hsl(35 100% 5%)',
    secondary: 'hsl(35 40% 15%)',
    secondaryForeground: 'hsl(35 100% 85%)',
    muted: 'hsl(35 30% 15%)',
    mutedForeground: 'hsl(35 20% 65%)',
    accent: 'hsl(35 60% 20%)',
    accentForeground: 'hsl(35 100% 85%)',
    destructive: 'hsl(0 62% 30%)',
    destructiveForeground: 'hsl(0 0% 98%)',
    border: 'hsl(35 30% 20%)',
    input: 'hsl(35 30% 20%)',
    ring: 'hsl(35 100% 71%)',
    radius: '0.85rem',
    chart1: 'hsl(35 100% 71%)',
    chart2: 'hsl(35 80% 60%)',
    chart3: 'hsl(35 60% 50%)',
    chart4: 'hsl(35 40% 40%)',
    chart5: 'hsl(35 100% 85%)',
  },
} as const;

export type ColorScheme = keyof typeof THEME;

export const NAV_THEME: Record<ColorScheme, Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
