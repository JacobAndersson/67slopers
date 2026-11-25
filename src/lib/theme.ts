import { DefaultTheme, type Theme } from 'expo-router';

import type { AppTheme } from './theme-tokens';

export * from './theme-tokens';

export function navigationTheme(theme: AppTheme, dark: boolean): Theme {
  return {
    ...DefaultTheme,
    dark,
    colors: {
      ...DefaultTheme.colors,
      background: theme.canvas,
      border: theme.line,
      card: theme.surface,
      notification: theme.text,
      primary: theme.action,
      text: theme.text,
    },
  };
}
