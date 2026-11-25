/**
 * Nunito is the Rivet typeface (design/rivet/kit/fonts, SIL OFL). React Native needs one file per
 * weight, each registered under its own family name; `tailwind.config.js` maps the `font-*`
 * weight utilities and the `type-*` styles onto these names. Keep the two lists in sync.
 */
export const FONTS = {
  Nunito_400: require('@/assets/fonts/Nunito-400.ttf'),
  Nunito_500: require('@/assets/fonts/Nunito-500.ttf'),
  Nunito_600: require('@/assets/fonts/Nunito-600.ttf'),
  Nunito_700: require('@/assets/fonts/Nunito-700.ttf'),
  Nunito_800: require('@/assets/fonts/Nunito-800.ttf'),
  Nunito_900: require('@/assets/fonts/Nunito-900.ttf'),
} as const;

export type FontFamily = keyof typeof FONTS;

/** The family for a weight, for the few places that set a font inline (SVG text). */
export const nunito = (weight: 400 | 500 | 600 | 700 | 800 | 900): FontFamily => `Nunito_${weight}`;
