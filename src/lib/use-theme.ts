import { useColorScheme } from 'react-native';

import { useStore } from '@/lib/store/store';
import { DARK_THEME, LIGHT_THEME } from '@/lib/theme';

/** One source of truth for JS colors and NativeWind classes. */
export function useAppTheme() {
  const system = useColorScheme();
  const preference = useStore((s) => s.settings.appearance);
  const dark = (preference === 'system' ? system : preference) === 'dark';
  return { dark, theme: dark ? DARK_THEME : LIGHT_THEME };
}
