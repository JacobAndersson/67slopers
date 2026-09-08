# Hangboard

A cross-platform hangboard training app for iOS, Android and web, built with
[Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/).

## Requirements

- Node.js 20 or newer (this repo was set up with Node 24)
- npm
- For native development: Xcode (iOS, macOS only) and/or Android Studio, or the
  [Expo Go](https://expo.dev/go) app on a physical device

## Getting started

```bash
npm install
npm start
```

Then press `i` for the iOS simulator, `a` for an Android emulator, or `w` for the web.
You can also scan the QR code with Expo Go.

Platform shortcuts:

```bash
npm run ios
npm run android
npm run web
```

## Scripts

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm start`            | Start the Metro dev server            |
| `npm run lint`         | ESLint (Expo config + Prettier rules) |
| `npm run format`       | Format the whole repo with Prettier   |
| `npm run format:check` | Check formatting without writing      |
| `npm run typecheck`    | TypeScript type check, no emit        |

## Project structure

```
src/
  app/                      Expo Router routes (single stack, no tabs)
    _layout.tsx             Fonts + store hydration gate, navigation theme, stack
    index.tsx               Home: your workouts, latest workouts, this week
    workouts.tsx            All saved workouts
    sessions.tsx            All completed sessions, grouped by day
    session/[id].tsx        One session: grade, sets, duration, Do it again
    workout/new.tsx         Create a workout
    workout/[id]/index.tsx  Overview with Start
    workout/[id]/edit.tsx   Edit or delete a workout
    workout/[id]/run.tsx    Full-screen timer
  components/
    ui/                     shadcn-style components added via the reusables CLI
    week-strip.tsx, workout-card.tsx, latest-session-card.tsx, session-row.tsx,
    section-header.tsx, feel.tsx,
    stepper.tsx, workout-form.tsx
    screen.tsx              Shared page frame with an optional pinned footer
  lib/
    store/                  zustand store, types, presets, selectors
    timer/                  Interval expansion, engine, hook, cues (tested)
    dates.ts, workout-summary.ts, theme.ts, fonts.ts, utils.ts
  global.css                Tailwind directives + theme CSS variables
assets/                     Icons, splash, Geist Mono, cue sounds
scripts/gen-tones.mjs       Regenerates the cue sounds
```

Notes:

- Import from `src` with the `@/` alias and from `assets` with `@/assets/`.
- Native platforms use `NativeTabs` for a platform-native tab bar. The web build
  swaps in a headless tab bar via `app-tabs.web.tsx`.
- One fixed light appearance: no themes, no dark mode.

## UI and theming

Styling is done with [NativeWind](https://www.nativewind.dev) (Tailwind CSS for
React Native) and components come from
[React Native Reusables](https://reactnativereusables.com), the shadcn/ui port for
React Native. Add components with the CLI, which writes them into
`src/components/ui`:

```bash
npx @react-native-reusables/cli@latest add button card input
```

The palette is "Stella" from [tweakcn](https://tweakcn.com/themes/cmm2mehjy000004ibgt6g0rbu).
It lives in two places that must stay in sync:

- `src/global.css` holds the CSS variables on `:root`, used by Tailwind classes such as
  `bg-primary` and `text-muted-foreground`.
- `src/lib/theme.ts` mirrors the same values as TypeScript for anything that cannot
  take a class name: the native tab bar, the navigation theme, inline styles.

To swap palettes, paste a shadcn/tweakcn theme's light values in Tailwind v3 (HSL) form
into `global.css` and update `theme.ts` to match.

### Fonts

The app typeface is [Geist Mono](https://vercel.com/font), loaded from
`@expo-google-fonts/geist-mono` in `src/lib/fonts.ts` and held behind the splash
screen until ready. React Native needs one font file per weight, each under its own
family name, so a small plugin in `tailwind.config.js` makes the regular `font-*`
weight utilities (`font-medium`, `font-semibold`, ...) select the matching family.
Use those utilities as usual and never set `fontFamily` directly.

## Docs

- [Product principles](docs/principles.md): local-only, no accounts, instant startup, no ads.
- [MVP scope](docs/mvp.md): what ships first, based on the BoulderFIT analysis.
- [Competitor research](competitors/README.md): one file per app.

## Tech

- Expo SDK 57, React Native 0.86, React 19
- TypeScript (strict), typed routes
- NativeWind 4 (Tailwind CSS 3) + React Native Reusables
- ESLint + Prettier (with the Tailwind class sorter)
