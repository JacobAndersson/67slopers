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
  app/            Expo Router routes (file-based). One file per screen.
    _layout.tsx   Root layout: navigation theme, status bar, tabs, portal host
    index.tsx     Train tab
    workouts.tsx  Workouts tab
    history.tsx   History tab
  components/
    ui/           shadcn-style components added via the reusables CLI
    app-tabs.tsx  Native tab bar (web variant in app-tabs.web.tsx)
    screen.tsx    Shared page frame
  lib/
    theme.ts      Theme colors as TS values + React Navigation theme
    utils.ts      `cn()` class merger
  global.css      Tailwind directives + theme CSS variables
assets/           App icon, splash and other static assets
```

Notes:

- Import from `src` with the `@/` alias and from `assets` with `@/assets/`.
- Native platforms use `NativeTabs` for a platform-native tab bar. The web build
  swaps in a headless tab bar via `app-tabs.web.tsx`.
- Light and dark mode follow the system setting.

## UI and theming

Styling is done with [NativeWind](https://www.nativewind.dev) (Tailwind CSS for
React Native) and components come from
[React Native Reusables](https://reactnativereusables.com), the shadcn/ui port for
React Native. Add components with the CLI, which writes them into
`src/components/ui`:

```bash
npx @react-native-reusables/cli@latest add button card input
```

The color theme is "Stella" from [tweakcn](https://tweakcn.com/themes/cmm2mehjy000004ibgt6g0rbu).
It lives in two places that must stay in sync:

- `src/global.css` holds the CSS variables (`:root` for light, `.dark:root` for dark)
  used by Tailwind classes such as `bg-primary` and `text-muted-foreground`.
- `src/lib/theme.ts` mirrors the same values as TypeScript for anything that cannot
  take a class name: the native tab bar, the navigation theme, inline styles.

To swap themes, paste a shadcn/tweakcn theme in its Tailwind v3 (HSL) form into
`global.css` and update `theme.ts` to match.

### Fonts

The app typeface is [Geist Mono](https://vercel.com/font), loaded from
`@expo-google-fonts/geist-mono` in `src/lib/fonts.ts` and held behind the splash
screen until ready. React Native needs one font file per weight, each under its own
family name, so a small plugin in `tailwind.config.js` makes the regular `font-*`
weight utilities (`font-medium`, `font-semibold`, ...) select the matching family.
Use those utilities as usual and never set `fontFamily` directly.

## Tech

- Expo SDK 57, React Native 0.86, React 19
- TypeScript (strict), typed routes
- NativeWind 4 (Tailwind CSS 3) + React Native Reusables
- ESLint + Prettier (with the Tailwind class sorter)
