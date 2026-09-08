import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  GeistMono_800ExtraBold,
} from '@expo-google-fonts/geist-mono';

/**
 * Geist Mono is the app typeface. React Native needs one font file per weight,
 * each registered under its own family name; `tailwind.config.js` maps the
 * `font-*` weight utilities onto these names so `font-semibold` etc. just work.
 * Keep the weights here in sync with `GEIST_MONO` in `tailwind.config.js`.
 */
export const FONTS = {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  GeistMono_800ExtraBold,
} as const;

export type FontFamily = keyof typeof FONTS;
