# Hangboard – agent notes

Cross-platform hangboard training app (iOS, Android, web) built with Expo SDK 57 and Expo Router.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
Do not rely on memory of older SDKs; APIs such as native tabs, splash screen and icons have moved.

## Conventions

- Source lives in `src/`. Routes are in `src/app/` (Expo Router, file-based, typed routes on).
- Use the `@/` path alias for `src` and `@/assets/` for `assets`.
- Shared UI goes in `src/components/`, helpers in `src/lib/`, hooks in `src/hooks/`.
- Style with NativeWind `className`s using the theme tokens (`bg-background`, `text-foreground`,
  `text-muted-foreground`, `bg-primary`, `border-border`, `rounded-lg`, ...). No hard-coded colors.
- UI primitives come from React Native Reusables (shadcn/ui for React Native). Add them with
  `npx @react-native-reusables/cli@latest add <name>`; they land in `src/components/ui/`. Prefer
  adding a reusables component over hand-rolling one. Always render text with `Text` from
  `@/components/ui/text`, never the bare React Native `Text`.
- The theme ("Stella" from tweakcn) is defined twice on purpose: CSS variables in `src/global.css`
  and a TS mirror in `src/lib/theme.ts` (`THEME`, `NAV_THEME`). Change both together. Use `THEME`
  only where a class name cannot be used (native tab bar, navigation theme, animations).
- Color scheme comes from `useColorScheme()` in `nativewind`, not from `react-native`.
- The typeface is Geist Mono, loaded per weight in `src/lib/fonts.ts` and applied through the
  `font-*` weight utilities, which a plugin in `tailwind.config.js` maps to the per-weight family
  names. Never set `fontFamily`/`fontWeight` by hand; use `font-medium`, `font-semibold`, etc.
  Weights available: 400, 500, 600, 700, 800. Add a weight in both files if you need another.
- Platform-specific files use the `.web.tsx` / `.ios.tsx` / `.android.tsx` suffix convention.
- Native tabs (`expo-router/unstable-native-tabs`) on iOS/Android; web uses the headless tabs in
  `src/components/app-tabs.web.tsx`. Keep both in sync when adding a tab.

## Checks

Run before finishing a change:

```bash
npm run typecheck
npm run lint
npm run format:check
```
