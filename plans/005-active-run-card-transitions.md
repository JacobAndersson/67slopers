# 005 — Bridge the unfinished-run card in and out of Home

- **Status**: PARTIAL — the card fades in. The gliding wrapper on Home was removed: on Android it left the hero overlapping the card at rest. The exit fade was removed with it, so dismissing the card is instant as before.
- **Commit**: ae82517 (written against a working tree with uncommitted changes on top of it; `src/app/index.tsx` is one of the modified files, so match on the excerpts below, not on line numbers alone)
- **Severity**: LOW
- **Category**: Missed opportunities (teleporting state)
- **Estimated scope**: 2 files (`src/components/active-run-card.tsx`, `src/app/index.tsx`), about 20 lines; may create `src/lib/motion.ts` (4 lines)

## Problem

When a workout was interrupted, Home shows an "Unfinished workout" card above everything
else. It is read from storage after the first frame (on purpose, so startup is not delayed),
so it pops in and shoves the whole screen down. Tapping "Save as ended" or confirming
"Discard" removes it in one frame and the whole screen jumps up, with nothing linking the tap
to the result.

```tsx
// src/components/active-run-card.tsx:55 and :67-69 — current
  if (!run) return null;
  ...
  return (
    <Card className="border-border bg-accent">
      <CardHeader>
```

```tsx
// src/components/active-run-card.tsx:120-122 — current (end of the component)
      </CardContent>
    </Card>
  );
```

```tsx
// src/app/index.tsx:67-70 — current
      <Screen>
        <ActiveRunCard />
        {next ? (
          <WorkoutHero workout={next} last={last} />
```

```tsx
// src/app/index.tsx:140-144 — current (end of the screen)
        ) : (
          <Text variant="muted">No sessions yet. Press Start to do your first.</Text>
        )}
      </Screen>
    </>
```

## Target

- The card fades in over `200ms` and fades out over `150ms`, both on
  `Easing.bezier(0.23, 1, 0.32, 1)`, both respecting `ReduceMotion.System`.
- Everything on Home below the card moves as one block: it glides down when the card appears
  and up when it goes, `LinearTransition`, `200ms`, same curve, `ReduceMotion.System`.
- When there is no unfinished run (the normal case) nothing on Home animates at any point,
  including launch. The only cost on the launch path is one extra wrapper view.
- Opacity and position only. The card's content, buttons and dialog are unchanged.

```tsx
// target — src/components/active-run-card.tsx, module scope
const CARD_ENTER = FadeIn.duration(200).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const CARD_EXIT = FadeOut.duration(150).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
```

```tsx
// target — src/components/active-run-card.tsx, the return
return (
  <Animated.View entering={CARD_ENTER} exiting={CARD_EXIT}>
    <Card className="border-border bg-accent">...unchanged...</Card>
  </Animated.View>
);
```

```tsx
// target — src/app/index.tsx, module scope
/** Home's content slides to make room for, or close up after, the unfinished-run card. */
const MAKE_ROOM = LinearTransition.duration(200).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
```

```tsx
// target — src/app/index.tsx. `gap-4` matches Screen's own content gap
// (src/components/screen.tsx:45), so spacing is unchanged.
      <Screen>
        <ActiveRunCard />
        <Animated.View layout={MAKE_ROOM} className="gap-4">
          {next ? (
            <WorkoutHero workout={next} last={last} />
          ) : (
            ...unchanged...
          )}
          ...every other existing child of Screen, unchanged and in the same order...
        </Animated.View>
      </Screen>
```

## Repo conventions to follow

- Entering / exiting builders on `Animated.View`, always ending in
  `.reduceMotion(ReduceMotion.System)`. Exemplar: `src/components/ui/alert-dialog.tsx:39-40`.
- The house curve is `Easing.bezier(0.23, 1, 0.32, 1)`, exported as `EASE_OUT` from
  `src/lib/motion.ts`.
- `Animated.View` takes NativeWind `className` directly. Exemplar:
  `src/components/disclosure-motion.tsx:21`.
- Home is the launch path. `AGENTS.md`: "Startup must stay instant: nothing on the launch path
  beyond bundled fonts and synchronous local storage reads." and "Keep `src/lib/boards` off the
  Home path." Add nothing to Home beyond what this plan lists.

## Steps

1. If `src/lib/motion.ts` does not exist, create it with exactly:

   ```ts
   import { Easing } from 'react-native-reanimated';

   /** Strong ease-out for anything entering, leaving or answering a touch. */
   export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
   ```

2. `src/components/active-run-card.tsx`: add
   `import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';` and
   `import { EASE_OUT } from '@/lib/motion';`. Add `CARD_ENTER` and `CARD_EXIT` at module
   scope above the component's doc comment.
3. In the same file, wrap the returned `<Card ...>...</Card>` in the Target `Animated.View`.
   Leave `if (!run) return null;` and everything inside the card untouched.
4. `src/app/index.tsx`: add
   `import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';` and
   `import { EASE_OUT } from '@/lib/motion';`. Add `MAKE_ROOM` at module scope, below the
   `PREVIEW` constant.
5. In the same file, wrap every child of `<Screen>` that comes after `<ActiveRunCard />`,
   through the final `)}` before `</Screen>`, in
   `<Animated.View layout={MAKE_ROOM} className="gap-4">`. Re-indent only; change nothing
   inside.
6. Run the mechanical checks.

## Boundaries

- Do NOT change when or how the active run is loaded (`useFocusEffect`, `loadActiveRun`,
  `clearActiveRun`), or the Continue / Save as ended / Discard handlers.
- Do NOT add entering, exiting or layout props to any other element on Home (hero, stats,
  calendar, workout rail, session rows). No stagger. Home must not animate on a normal launch.
- Do NOT touch `src/components/screen.tsx` or the `Stack.Screen` header options.
- Do NOT import anything from `src/lib/boards` into Home.
- Do NOT add dependencies.
- If the JSX does not match the excerpts (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` all
  pass.
- **Feel check** (device or emulator). To get an unfinished run: start any workout, let it
  count for a few seconds, then force-quit the app from the task switcher and reopen it.
  - Normal launch with no unfinished run: Home appears exactly as before, nothing moves. Check
    the `JS start → first screen` log from `src/lib/perf.ts` before and after; it should not
    change beyond noise.
  - Launch with an unfinished run: the card fades in while the rest of Home slides down in
    one piece. The content must not jump down first and then animate.
  - Tap "Save as ended": the card fades out, the rest slides up, and the new entry is in
    "Recent sessions". Watch the 150ms where the fading card and the rising hero overlap. A
    soft cross-over is fine. If the hero is clearly readable through the card, apply the
    fallback: delete the `exiting={CARD_EXIT}` prop (and the unused `CARD_EXIT` / `FadeOut`),
    keep everything else, and report that you did.
  - Repeat with Discard → confirm in the dialog: same behaviour once the dialog closes.
  - Tap Continue: the timer opens as before; returning Home afterwards shows no leftover card.
  - Scroll Home, open a workout and come back, finish a session and return: the wrapper never
    animates in any of these, because its position did not change.
  - OS reduce-motion on: the card appears and disappears instantly, content does not glide.
  - Web: Home renders with identical spacing; the card still appears and dismisses.
- **Done when**: checks pass; the card and the content below it animate only when the card
  appears or leaves; Home's layout and launch behaviour are otherwise unchanged.
