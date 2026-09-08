# Hangboard – agent notes

Cross-platform hangboard training app (iOS, Android, web) built with Expo SDK 57 and Expo Router.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
Do not rely on memory of older SDKs; APIs such as native tabs, splash screen and icons have moved.

## Product non-negotiables

Read [docs/principles.md](docs/principles.md) before adding features or dependencies. In short:

- Everything is local. No network requests, no analytics, no accounts, no cloud, no ads.
- Startup must stay instant: nothing on the launch path beyond bundled fonts and synchronous
  local storage reads. Do not add root-level providers or SDKs without a reason tied to the timer.
- The MVP scope is in [docs/mvp.md](docs/mvp.md); the competitor research it is based on is in
  `competitors/`. Do not build beyond the MVP without checking there first.

## App structure (MVP)

- Single Expo Router stack, no tabs: `src/app/index.tsx` (Home: month calendar with week
  streak, three saved workouts, three latest sessions) → `workout/[id]/index.tsx` (overview with Start) →
  `workout/[id]/run.tsx` (full-screen timer, `src/components/runner.tsx`). `workout/run.tsx`
  runs the store's unsaved `draft` (Start from the setup screen, or "Do it again" on a deleted
  workout) and offers to save it at the end. `workouts.tsx` and `sessions.tsx` are the
  "View all" index screens; `session/[id].tsx` shows one session with "Do it again".
  `workout/new.tsx` and `workout/[id]/edit.tsx` share `src/components/workout-form.tsx`.
- Grades (`feel`) are shown on session and overview screens and in the sessions index, never
  on the home screen.
- State lives in `src/lib/store/` (zustand + AsyncStorage, persisted as one JSON blob). Select
  stable slices (`s.workouts`, `s.sessions`) and derive with `useMemo`; never return fresh objects
  from a selector. Sessions store a snapshot of the workout they ran.
- Timer logic is pure and tested: `src/lib/timer/intervals.ts` expands a workout into intervals,
  `engine.ts` is a reducer over a monotonic clock, `useTimer.ts` drives it at 100 ms. The app is
  silent by design: no audio, no haptics. Screens only render; put behaviour in `src/lib` where
  `npm test` can reach it.
- Workouts use `blocks[]`; simple mode is one block. Do not add flat timing fields.

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
- The palette ("Stella" from tweakcn) is defined twice on purpose: CSS variables in `src/global.css`
  and a TS mirror in `src/lib/theme.ts` (`THEME`, `NAV_THEME`). Change both together. Use `THEME`
  only where a class name cannot be used (native tab bar, navigation theme, animations).
- One appearance only: no themes, no dark mode, no color-scheme hooks. Do not add `dark:`
  variants or a `.dark` palette.
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
npm test
```
