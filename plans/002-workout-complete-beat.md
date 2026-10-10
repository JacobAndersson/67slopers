# 002 — Let the finish land: pop "Done", stagger the summary

- **Status**: DONE — summary layout verified on Android for an ended workout. The "Done" pop and the stagger timing were not watched on a device.
- **Commit**: ae82517 (written against a working tree with uncommitted changes on top of it; `src/components/runner.tsx` is one of the modified files, so match on the excerpts below, not on line numbers alone)
- **Severity**: LOW
- **Category**: Missed opportunities (delight budget) / Cohesion (stagger)
- **Estimated scope**: 1 file (`src/components/runner.tsx`), about 50 lines; may create `src/lib/motion.ts` (4 lines)

## Problem

Finishing a hangboard workout is the one high-emotion moment in the app and it happens once
per session. Today it is rendered flat: the word "Done" fades in over 300ms, sits for the
900ms beat, then is removed in a single frame while the whole summary form fades in as one
block.

```tsx
// src/components/runner.tsx:11-18 — current
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
```

```tsx
// src/components/runner.tsx:409-419 — current (summary, opening)
          {finished ? (
            showSummary ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="w-full max-w-3xl gap-6 self-center py-6">
                <View className="gap-2">
                  <Text className="text-3xl tracking-tight font-bold">
                    {timer.status === 'done' ? 'Workout complete' : 'Workout ended'}
                  </Text>
                  <Text variant="muted">Your session is saved.</Text>
                </View>
```

```tsx
// src/components/runner.tsx:464-476 — current (the beat before the summary)
            ) : (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="flex-1 items-center justify-center gap-2">
                <Text className="text-5xl tracking-tight font-bold">
                  {timer.status === 'done' ? 'Done' : 'Ended'}
                </Text>
                <Text className="text-2xl">
                  {setsLine(timer.completedSets, timer.totalSets)} ·{' '}
                  {formatClock(timer.elapsedSeconds)}
                </Text>
              </Animated.View>
            )
```

The summary's direct children, in order, are: the heading block, `<SessionFacts>` (a fragment
of two elements), the "How did you feel?" block, the note block, the "Save this workout?"
block (only when `isDraft`), and the Finish button (`runner.tsx:414-462`).

## Target

1. **"Done" pops, "Ended" does not.** When `timer.status === 'done'`, the word scales from
   `0.9` to `1` on a spring with `duration: 350` and `dampingRatio: 0.8` (Reanimated's
   `duration` is perceptual; the spring visibly settles in roughly 525ms, inside the 900ms
   beat). The container's existing 300ms fade supplies the opacity. When the status is
   `'ended'` (the user stopped early) there is no scale: stopping early is not a celebration.
2. **The beat exits instead of vanishing.** The Done/Ended container gets
   `exiting={FadeOut.duration(150)}`.
3. **The summary arrives in order.** Each direct child block enters with opacity 0→1 and
   `translateY` 8→0 over `300ms` on `Easing.bezier(0.23, 1, 0.32, 1)`, staggered `50ms`, the
   first one starting `150ms` after the summary mounts so it does not double-expose with the
   exiting "Done". Blocks are touchable from the first frame; the stagger never blocks input.
   This applies to both `'done'` and `'ended'`.
4. **Reduced motion**: Reanimated's layout animations default to `ReduceMotion.System`, so
   with the OS setting on, everything above appears instantly. That is the existing behaviour
   of this screen and is kept.
5. `SUMMARY_DELAY_MS` stays `900`. No haptics or sounds are added.

```tsx
// target — module scope in src/components/runner.tsx, below SUMMARY_DELAY_MS
/** The finish word settles in with a little weight; only a completed workout earns it. */
const donePop = () => {
  'worklet';
  return {
    initialValues: { transform: [{ scale: 0.9 }] },
    animations: {
      transform: [{ scale: withSpring(1, { duration: 350, dampingRatio: 0.8 }) }],
    },
  };
};

/** Summary blocks follow each other in, after the finish word has faded out. */
const summaryEnter = (index: number) =>
  FadeInDown.duration(300)
    .delay(150 + index * 50)
    .easing(EASE_OUT)
    .withInitialValues({ transform: [{ translateY: 8 }] });
```

```tsx
// target — the beat
<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(150)}
  className="flex-1 items-center justify-center gap-2">
  <Animated.View entering={timer.status === 'done' ? donePop : undefined}>
    <Text className="text-5xl tracking-tight font-bold">
      {timer.status === 'done' ? 'Done' : 'Ended'}
    </Text>
  </Animated.View>
  <Text className="text-2xl">
    {setsLine(timer.completedSets, timer.totalSets)} · {formatClock(timer.elapsedSeconds)}
  </Text>
</Animated.View>
```

```tsx
// target — the summary. The container loses its own fade; each block gets summaryEnter(i).
              <View className="w-full max-w-3xl gap-6 self-center py-6">
                <Animated.View entering={summaryEnter(0)} className="gap-2">
                  {/* heading + "Your session is saved." — unchanged contents */}
                </Animated.View>
                <Animated.View entering={summaryEnter(1)} className="gap-6">
                  <SessionFacts {/* unchanged props */} />
                </Animated.View>
                <Animated.View entering={summaryEnter(2)} className="gap-3">
                  {/* "How did you feel?" + FeelPicker — unchanged contents */}
                </Animated.View>
                <Animated.View entering={summaryEnter(3)} className="gap-2">
                  {/* Label + Textarea — unchanged contents */}
                </Animated.View>
                {isDraft ? (
                  <Animated.View entering={summaryEnter(4)} className="gap-2">
                    {/* "Save this workout?" — unchanged contents */}
                  </Animated.View>
                ) : null}
                <Animated.View entering={summaryEnter(isDraft ? 5 : 4)}>
                  <Button size="lg" onPress={finish}>
                    {/* unchanged contents */}
                  </Button>
                </Animated.View>
              </View>
```

Note on block 1: `SessionFacts` returns a fragment (`src/components/session-facts.tsx:31-49`),
so today its two elements are separate children of the `gap-6` column. The wrapper carries
`className="gap-6"` to keep that spacing identical.

## Repo conventions to follow

- Entering and exiting use Reanimated layout-animation builders on `Animated.View`, with
  NativeWind `className` on the same element. Exemplar in this file: `runner.tsx:608-613`
  (`entering={FadeIn.duration(SPLIT_MS)}` / `exiting={FadeOut.duration(SPLIT_MS)}`).
- Timing constants live at module scope above the component with a one-line comment
  (`runner.tsx:79-87`).
- The house curve is `Easing.bezier(0.23, 1, 0.32, 1)`, exported as `EASE_OUT` from
  `src/lib/motion.ts`.
- Text is always `Text` from `@/components/ui/text`; style with theme-token classes only.

## Steps

1. If `src/lib/motion.ts` does not exist, create it with exactly:

   ```ts
   import { Easing } from 'react-native-reanimated';

   /** Strong ease-out for anything entering, leaving or answering a touch. */
   export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
   ```

2. In `src/components/runner.tsx`, add `FadeInDown` and `withSpring` to the existing
   `react-native-reanimated` import, and add `import { EASE_OUT } from '@/lib/motion';` with
   the other `@/lib` imports. Keep `Easing` imported; `Easing.linear` is still used for the fill.
3. Add `donePop` and `summaryEnter` from Target at module scope, directly below the
   `SUMMARY_DELAY_MS` constant.
4. Replace the beat block (the `Animated.View` containing `'Done' : 'Ended'`) with the Target
   beat. The only changes are the added `exiting` prop and the `Animated.View` wrapped around
   the first `Text`.
5. In the summary block, change the outer `Animated.View` to a plain `View` and delete its
   `entering` prop; keep its `className` unchanged.
6. Convert each direct child of that `View` as shown in Target. The four existing wrapper
   `View`s (`gap-2`, `gap-3`, `gap-2`, and the `isDraft` `gap-2`) become `Animated.View` with
   the same `className` plus `entering={summaryEnter(n)}`. `SessionFacts` and the Finish
   `Button` each get a new `Animated.View` wrapper. Do not change anything inside the blocks.
7. Run the mechanical checks.

## Boundaries

- Do NOT change `SUMMARY_DELAY_MS`, the `showSummary` effect, when the session is written, or
  any timer, checkpoint or cue logic.
- Do NOT add haptics, sound, confetti, colour changes or any new element.
- Do NOT touch the running-timer branch of the JSX (everything after `) : (` / `<>` at
  `runner.tsx:477-604`), the Gen Z split view, or the confirm dialog.
- Do NOT edit `src/components/session-facts.tsx`, `feel.tsx` or any other file except
  `runner.tsx` and, if missing, `src/lib/motion.ts`.
- Do NOT add dependencies.
- If the JSX does not match the excerpts (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` all
  pass.
- **Feel check** (device or emulator; build a throwaway workout with one 3-second hang so the
  finish is quick to reach):
  - Let it run to the end. "Done" settles in with a small, single overshoot at most. It must
    not wobble or bounce twice. If it reads as bouncy, raise `dampingRatio` to `0.9`; if it is
    not perceptible at all, lower the start scale to `0.85`. Report whichever you changed.
  - After the beat, "Done" fades out and the summary blocks rise in one after another, top to
    bottom. There is no frame where "Done" and the summary heading are both clearly readable.
    If there is, report it; do not add blur or extra delay on your own.
  - Tap a feel button and the Finish button while the stagger is still running. Both respond.
  - Start a workout, pause, End workout, confirm. The word is "Ended" and it only fades; no
    scale. The summary still staggers.
  - Run an unsaved workout (New workout → Start). The "Save this workout?" block appears in
    order, before Finish.
  - With the OS reduce-motion setting on, the word and the summary appear without movement.
  - Check Gen Z mode on: finishing still glides the panel to full height and the summary is
    laid out correctly afterwards.
- **Done when**: checks pass; a completed workout shows the pop, the exit fade and the
  staggered summary; an ended workout shows no pop; spacing of the summary is pixel-identical
  to before once everything has settled.
