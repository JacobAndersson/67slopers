# 67slopers – agent notes

67slopers is a cross-platform hangboard training app (iOS, Android, web) built with Expo SDK 57 and Expo Router.

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

- Single Expo Router stack, no tabs: `src/app/index.tsx` (Home: an unfinished-run card when a
  run was interrupted, streak stats, the current week, a Next up card for the last-used workout
  whose Start opens the timer already counting down (`run?autostart=1`), the other saved
  workouts with a + to build one, three latest sessions, and a scan button in the header;
  `calendar.tsx` is the month view) → `workout/[id]/index.tsx` (overview with Start) →
  `workout/[id]/run.tsx` (full-screen timer, `src/components/runner.tsx`). `workout/run.tsx`
  runs the store's unsaved `draft` (Start from the setup screen, or "Do it again" on a deleted
  workout) and offers to save it at the end. `workouts.tsx` and `sessions.tsx` are the
  "View all" index screens; `session/[id].tsx` shows one session with "Do it again".
  `workout/new.tsx` and `workout/[id]/edit.tsx` share `src/components/workout-form.tsx`; the
  overview renders the same step list read-only. `presets.tsx` is the built-in library
  (`src/lib/store/presets.ts`: classic protocols by level with a description); opening one lands
  in `workout/new?preset=<id>`. Only the three ids in `SEEDED_PRESET_IDS` are copied into "Your
  workouts" on first launch, with their `description`, which the builder can edit and the
  overview shows (persist v6 restores it on workouts seeded before).
- Grades (`feel`) are shown on session and overview screens and in the sessions index, never
  on the home screen.
- Sessions are trustworthy: the runner writes the session the moment the timer stops (Finish
  only adds the grade or the save-as-workout step). The engine logs the time really spent in
  every interval (`performedMs`), sessions keep each hang's planned and actual seconds
  (`hangs`), and a set only counts when all its hangs ran their full length. A run is
  checkpointed (`src/lib/timer/checkpoint.ts`, stored by `src/lib/store/active-run.ts` under its
  own key) at every interval change and when the app backgrounds; Home offers to continue it,
  save it as ended or discard it. "Do it again" runs the session's snapshot when the workout has
  changed since. Cues are foreground-only by design; the native checks live in
  `docs/device-checklist.md`.
- Sharing: the overview's Share opens `workout/[id]/share.tsx`, a full-screen QR code of the
  workout's code, with no digits or text to copy; Home's scan button opens `scan.tsx` (expo-camera,
  permission asked only there, hidden on web where it cannot scan), which ignores QR codes that are
  not workouts; `import.tsx?code=` previews a workout before saving or running it, and
  `slopers67://import?code=` links land there.
- State lives in `src/lib/store/` (zustand + AsyncStorage, persisted as one JSON blob). Select
  stable slices (`s.workouts`, `s.sessions`) and derive with `useMemo`; never return fresh objects
  from a selector. Sessions store a snapshot of the workout they ran.
- Timer logic is pure and tested: `src/lib/timer/intervals.ts` expands a workout into intervals,
  `engine.ts` is a reducer over a monotonic clock, `useTimer.ts` drives it at 100 ms. Cues are a
  beep and a heavy tap at every interval boundary (`cues.ts` computes the boundary on the engine
  clock, `useCues.ts` schedules it, `cue-player.ts` wraps expo-audio and is only created by a
  mounted timer). On Android the buzz goes through the local module `modules/cue-vibration`
  (Kotlin, `USAGE_ALARM`): untagged vibrations, expo-haptics and React Native's `Vibration`
  alike, are filed under the touch-feedback setting and dropped when it is off. iOS uses
  expo-haptics; Expo Go falls back to the plain vibration. Sound and vibration are global
  settings in the store, toggled in the workout settings menu. Gen Z mode adds bundled muted
  gameplay below the timer; `src/lib/brainrot` owns run-scoped rotation and playback guards,
  `scripts/brainrot.mjs` prepares the assets. No media is fetched remotely by the app. Screens only render; put behaviour in `src/lib` where
  `npm test` can reach it.
- A workout is `steps[]`: timed steps (`prep`, `hang`, `rest`, each with seconds and an optional
  label) and `repeat` groups (`times`, nested `steps`; a trailing rest is skipped on the final
  round). Repeats nest at most one
  level deep: the rounds of a top-level repeat are the sets, the rounds of a repeat inside it are
  the reps. The stored model has no ids; the editor adds them through `withIds`/`stripIds` in
  `src/lib/workout-steps.ts`, which also holds every tree edit (`updateStep`, `moveStep`,
  `reorderWithin`, `validate`, `LIMITS`). `src/lib/workout-codec.ts` turns a workout into a
  short decimal code for QR numeric mode: exact arithmetic coding (`src/lib/codec/`) against a
  frozen model of hangboard workouts and shared vocabularies, a Damm check digit, and a
  canonical re-encode on decode. Everything in `codec/models.ts` is frozen, and `WORDS`,
  `PHRASES`, `BOARD_IDS`, `PRESETS` and each board's holds are append-only (codes refer to them
  by index; `vocab.test.ts` checks the snapshot). Add holds at the end of a layout. Persist version 3 migrates the
  old `prepSeconds` + `blocks[]` shape in `src/lib/store/migrate.ts` (now version 6).
- Hangboards: `hangboard-models/` is the source of truth (one `layout.json` per board, hold boxes
  in mm, mirrored pairs; 3D files live in git LFS). `npm run boards` (`scripts/gen-board-images.mjs`)
  rasterises each board: `assets/boards/<id>/base.svg` is the source (hand-edit it; `--draw`
  regenerates it from the layout), `base.png` is rendered from it and a test fails when the two
  drift, plus one highlight overlay per hold; the generator also
  writes the manifests in `src/lib/boards/generated/` (pure data) and `generated/images.ts`
  (the `require`s, imported only by `src/components/board-view.tsx`). A workout may carry
  `board` and each hang `holds`; selection is symmetric, one _grip_ per hang (a mirrored pair or a
  centre hold, see `grips()` in `src/lib/boards/index.ts`). `BoardView` composes base + overlays
  with percentage positions and never draws at runtime; the timer keeps every overlay it will
  need mounted and fades opacity. Keep `src/lib/boards` off the Home path.
- The builder (`src/components/workout-form.tsx` with `step-list.tsx`) is Garmin-style: step
  cards, repeat groups, inline editing, a ⋮ menu per step and a Reorder mode that drags rows with
  `react-native-sortables` (one sortable list at a time, never nested). The root layout wraps the
  app in `GestureHandlerRootView` for it.

## Native project

`android/` is generated by `expo prebuild` and ignored by git. Never edit it; change `app.json`
and regenerate (`npx expo prebuild --platform android --clean`). `npm run build:android` produces
the release APK locally; there is no EAS or cloud build.

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
- App icon, splash image and favicon are generated, never hand-edited: `npm run icons` renders
  every PNG and the iOS `.icon` layer from the vector design in `scripts/gen-icons.mjs` (a chalked
  sloper in the palette colours). Change the design there and re-run it.
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
