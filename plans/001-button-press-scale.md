# 001 — Give every Button a press scale

- **Status**: DONE — verified on web and the Android emulator (button measured at 0.97 while held). Deviation: web renders the plain `Pressable` and only native uses the animated one; registering the animated one with NativeWind (step 6) stripped all button styling on Android and was not used.
- **Commit**: ae82517 (written against a working tree with uncommitted changes on top of it; `src/components/ui/button.tsx` itself is unmodified)
- **Severity**: MEDIUM
- **Category**: Physicality & origin (press feedback)
- **Estimated scope**: 1 file changed (`src/components/ui/button.tsx`), 1 file created (`src/lib/motion.ts`), about 45 lines

## Problem

`Button` answers a press with a background colour change only. On the primary variant that
change is `bg-primary` to `bg-primary/90`, a 10% alpha step that is close to invisible. The same
component is the timer's Start / Pause / Resume control (`src/components/runner.tsx:571`), which
is pressed with chalked hands, often at arm's length. Nothing physical confirms the press.

```tsx
// src/components/ui/button.tsx:1-4 — current
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';
```

```tsx
// src/components/ui/button.tsx:6-12 — current
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
```

```tsx
// src/components/ui/button.tsx:91-105 — current
type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}
```

The web class string also contains `transition-all`, which animates every property. It is
replaced here because the new scale must transition on web and `all` is the wrong way to get it.

## Target

- **Native (iOS, Android)**: the button scales to `0.97` when the finger goes down and back to
  `1` when it lifts. Press-in takes `100ms`, release takes `160ms`, both on
  `Easing.bezier(0.23, 1, 0.32, 1)`. Only `transform` animates. The existing `active:bg-*`
  colour feedback stays.
- **Reduced motion (native)**: no scale at all; the colour feedback is the only response.
- **Disabled**: never scaled. If a button becomes disabled while held (the stepper's − / + at
  its limit), the scale returns to `1` immediately.
- **Web**: `active:scale-[0.97]` with a `transform` transition at Tailwind's default 150ms, and
  `motion-reduce:active:scale-100`. `transition-all` becomes an explicit property list.
- Callers' own `onPressIn` / `onPressOut` keep working (`src/components/stepper.tsx:127-128` and
  `:206-207` use them for hold-to-repeat).

```tsx
// target — src/lib/motion.ts (new file)
import { Easing } from 'react-native-reanimated';

/** Strong ease-out for anything entering, leaving or answering a touch. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
```

```tsx
// target — src/components/ui/button.tsx, imports
import { TextClassContext } from '@/components/ui/text';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { useEffect } from 'react';
import { Platform, Pressable, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SCALE = 0.97;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 160;
```

```tsx
// target — src/components/ui/button.tsx, the component
function Button({ className, variant, size, style, onPressIn, onPressOut, ...props }: ButtonProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const disabled = !!props.disabled;

  // A button disabled mid-press (the stepper reaching its limit) may never get onPressOut.
  useEffect(() => {
    if (disabled) scale.set(1);
  }, [disabled, scale]);

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!reduced && Platform.OS !== 'web') {
      scale.set(withTiming(PRESS_SCALE, { duration: PRESS_IN_MS, easing: EASE_OUT }));
    }
    onPressIn?.(event);
  };
  const handlePressOut = (event: GestureResponderEvent) => {
    if (Platform.OS !== 'web') {
      scale.set(withTiming(1, { duration: PRESS_OUT_MS, easing: EASE_OUT }));
    }
    onPressOut?.(event);
  };

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <AnimatedPressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
        style={[style as never, pressStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    </TextClassContext.Provider>
  );
}
```

```tsx
// target — src/components/ui/button.tsx:10, the web class string.
// Only two things change: `transition-all` is replaced, and three classes are appended.
web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow,transform] focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97] motion-reduce:active:scale-100",
```

## Repo conventions to follow

- Motion uses `react-native-reanimated` 4 shared values with `.get()` / `.set()`, never
  `.value`. Exemplar: `src/components/board-view.tsx:144-158`.
- The house curve is `Easing.bezier(0.23, 1, 0.32, 1)`. It is currently typed out three times
  (`src/components/disclosure-motion.tsx:14`, `src/components/board-view.tsx:25`,
  `src/components/timer-phase-label.tsx:23`). This plan adds the shared `src/lib/motion.ts`;
  do not migrate those three files here.
- An animated `Pressable` that takes NativeWind classes already exists and works:
  `src/components/ui/native-only-animated-view.tsx:4` (`Animated.createAnimatedComponent(Pressable)`),
  used with classes through `src/components/ui/alert-dialog.tsx:28-44`.
- Reduced motion is read with `useReducedMotion()` from Reanimated. Exemplar:
  `src/components/disclosure-motion.tsx:29`.
- No hard-coded colours, no `fontFamily`, no `dark:` variants added (existing `dark:` classes
  from the Reusables template stay as they are).

## Steps

1. If `src/lib/motion.ts` does not exist, create it with exactly the content shown in Target.
   If it already exists and exports `EASE_OUT` with the same bezier, leave it alone.
2. In `src/components/ui/button.tsx`, replace the four import lines with the import block from
   Target and add the `AnimatedPressable` constant and the three `PRESS_*` constants below the
   imports.
3. In the same file, replace the web class string on line 10 with the Target string. Check the
   diff: `transition-all` is gone, the explicit `transition-[...]` list is in its place, and
   `active:scale-[0.97] motion-reduce:active:scale-100` is appended. Nothing else in that
   string changes.
4. Replace the `Button` function (lines 95-105) with the Target component. Leave `ButtonProps`,
   `buttonVariants`, `buttonTextVariants` and the exports untouched.
5. Run the mechanical checks below.
6. If, on a device, the `active:bg-*` colour change no longer appears on press, register the
   animated component with NativeWind directly under the `AnimatedPressable` constant, the same
   way `src/components/screen.tsx:17-20` registers `Animated.ScrollView`:

   ```tsx
   import { cssInterop } from 'nativewind';
   cssInterop(AnimatedPressable, { className: 'style' });
   ```

   Add this only if needed. If the colour feedback is still missing afterwards, STOP and report.

## Boundaries

- Do NOT touch any caller of `Button`. No screen or component other than
  `src/components/ui/button.tsx` and the new `src/lib/motion.ts` changes.
- Do NOT add press scale to other `Pressable`s (`workout-card.tsx`, `feel.tsx`,
  `session-row.tsx`, `step-list.tsx`). They are out of scope.
- Do NOT change variants, sizes, colours or the `opacity-50` disabled style.
- Do NOT replace the bezier in `disclosure-motion.tsx`, `board-view.tsx` or
  `timer-phase-label.tsx` with the new import.
- Do NOT add dependencies. Do NOT edit anything under `android/`.
- If the code does not match the excerpts above, STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm run format:check` and `npm test`
  all pass with no new errors or warnings.
- **Feel check** (real device or the `hangboard` Android emulator, plus web):
  - Home: press and hold "Start workout". It shrinks slightly and stays shrunk while held; it
    returns when released. The label does not blur or shift.
  - Open a workout's timer and tap Start, then Pause, then Resume quickly several times. The
    scale never jumps or restarts from full size mid-press; it retargets from where it is.
  - The full-width `h-20` timer button is the largest target. If its shrink reads as too big,
    report it; the fallback is `PRESS_SCALE = 0.98`. Do not pick a value outside 0.95–0.98.
  - Builder: open a step, hold + on the stepper until it reaches its maximum. When the button
    goes disabled it is at full size, not stuck at 0.97.
  - Tap a ⋮ menu trigger and an "Add step" trigger. The menu still opens (the trigger is a
    `Button` under `asChild`).
  - Every variant still shows its colour change on press (default, outline, secondary, ghost).
  - Turn on the OS reduce-motion setting: buttons no longer scale, colour feedback remains.
  - Web: click and hold a button; it scales to 0.97. With `prefers-reduced-motion` emulated in
    DevTools (Rendering panel) it does not scale.
  - Launch cost: the app logs `JS start → first screen` through `src/lib/perf.ts`. Compare it
    before and after on the same device; it should not move by more than noise.
- **Done when**: all four commands pass, every `Button` in the app scales on press on native
  and web, colour feedback is intact, and reduced motion removes the scale.
