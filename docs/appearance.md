# Appearance

The app follows the device's light or dark setting by default. Settings → Appearance can
force either appearance locally. The preference lives in the existing persisted settings.

When building a view, use semantic NativeWind classes (`bg-background`, `bg-card`,
`text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`,
`text-primary-foreground`) so it works in both modes without per-screen conditionals.
Use paired foreground tokens on colored surfaces. If an API needs an inline color (SVG,
animated background, spinner), call `useAppTheme()` and use its `theme` values. Do not
import `LIGHT_THEME` into screens or add one-off `dark:` classes. Keep matching CSS
variables in `src/global.css` and inline HSL values in `src/lib/theme.ts` in sync.
The QR renderer deliberately uses matching background/foreground contrast.

`app.json` uses `userInterfaceStyle: automatic` (Expo SDK 57). Changes to native
configuration require a rebuilt app; do not edit generated `android/` files. Native
splash colors follow the device, not a saved manual override before JavaScript loads.
