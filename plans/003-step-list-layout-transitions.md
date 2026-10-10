# 003 — Make builder steps glide when they move, appear or go

- **Status**: DONE, by a different route. The `LinearTransition` approach in this plan rests on stale
  positions on Android (Reanimated 4.5.1, Fabric) and must not be retried. What shipped is
  `src/components/glide.tsx`: each card is laid out in its final place and a transform plays the
  move back from its old position, so it always ends at zero. Verified on web and the Android
  emulator. Opening or closing an inline editor and toggling Reorder stay instant, and a deleted
  step disappears without a fade.
- **Commit**: ae82517 (written against a working tree with uncommitted changes on top of it; `step-list.tsx`, `workout-form.tsx` and `disclosure-motion.tsx` are all among the modified files, so match on the excerpts below, not on line numbers alone)
- **Severity**: MEDIUM
- **Category**: Missed opportunities (teleporting state, spatial consistency)
- **Estimated scope**: 3 files (`src/components/disclosure-motion.tsx`, `src/components/step-list.tsx`, `src/components/workout-form.tsx`), about 45 lines

## Problem

In the workout builder, the ⋮ menu's Move up, Move down, Duplicate, Delete, Move into / out of
repeat, and the Add step / Add repeat buttons all change the list in a single frame. After
"Move up" two cards have swapped and nothing shows which one moved. Opening a step's inline
editor fades the editor in (150ms) but every card below it jumps down instantly.

```tsx
// src/components/step-list.tsx:172-182 — current (the non-reorder list)
return (
  <View className="gap-3">
    {steps.map((step) =>
      step.kind === 'repeat' ? (
        <RepeatGroup key={step.id} step={step} depth={depth} />
      ) : (
        <StepCard key={step.id} step={step} depth={depth} />
      )
    )}
  </View>
);
```

```tsx
// src/components/step-list.tsx:220-222 and :249-251 — current (StepCard root)
  return (
    <View className="gap-2">
      <View
        ...
      {expanded && editor ? <StepEditor step={step} depth={depth} /> : null}
    </View>
  );
```

```tsx
// src/components/step-list.tsx:356-358 — current (RepeatGroup root)
  return (
    <View className="rounded-lg border-2 border-border">
      <View className="flex-row items-center py-1 pl-3 pr-1">
```

```tsx
// src/components/step-list.tsx:396-410 — current (add buttons inside a repeat)
{
  editor && editor.reorderTarget === undefined ? (
    <View className="flex-row flex-wrap gap-2">
      <AddStepButton onAdd={(kind) => editor.actions.addStep(step.id, kind)} />
      ...
    </View>
  ) : null;
}
```

```tsx
// src/components/workout-form.tsx:347-366 — current (everything below the list)
{
  reordering ? null : (
    <View className="flex-row flex-wrap gap-3">
      <AddStepButton onAdd={(kind) => actions.addStep(null, kind)} />
      ...
    </View>
  );
}

<Separator />;

{
  errors.length ? <Text className="text-destructive">{errors[0]}</Text> : null;
}
<View className="flex-row items-center justify-between">
  <Text variant="muted">Total</Text>
  <Text className="text-xl font-semibold">≈ {formatClock(total)}</Text>
</View>;
```

```tsx
// src/components/disclosure-motion.tsx:13-16 — current
const DURATION_MS = 150;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const REVEAL = FadeIn.duration(DURATION_MS).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
```

## Target

In the **editable builder only** (an `EditorContext` is present), and **not in Reorder mode**:

- A card whose position changes glides to its new place: `LinearTransition`, `200ms`,
  `Easing.bezier(0.23, 1, 0.32, 1)`.
- A card that is added fades in with the existing `REVEAL` (opacity 0→1, 150ms, same curve).
- A card that is removed fades out: opacity 1→0, `120ms`, same curve.
- A repeat group's border box resizes with the same 200ms glide when a step is added to or
  removed from it.
- The add-button rows and everything under the list (separator, error, total, delete) glide
  with the cards instead of jumping.
- Opening the builder does not fade every card in, and switching Reorder mode on or off does
  not run enter or exit fades.
- All of it respects `ReduceMotion.System` (instant with the OS setting on), like `REVEAL`.
- The read-only lists (`src/app/workout/[id]/index.tsx:99`, `src/app/import.tsx:107`) get no
  animation props at all.

Deliberately unchanged: the inline editor still disappears immediately on close. That is a
documented decision (`disclosure-motion.tsx:18`, "closing removes them immediately"). The
cards below will now glide up into the freed space over 200ms.

```tsx
// target — src/components/disclosure-motion.tsx, replaces the REVEAL line and adds two exports
/** A short reveal for controls and step cards the user just added or opened. */
export const REVEAL = FadeIn.duration(DURATION_MS)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
/** A deleted step leaves faster than it arrived. */
export const STEP_EXIT = FadeOut.duration(120).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
/** Steps glide to their new place when one is moved, added, removed or opened. */
export const STEP_LAYOUT = LinearTransition.duration(200)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
```

```tsx
// target — src/components/step-list.tsx, the non-reorder list
return (
  <LayoutAnimationConfig skipEntering skipExiting>
    <View className="gap-3">
      {steps.map((step) =>
        step.kind === 'repeat' ? (
          <RepeatGroup key={step.id} step={step} depth={depth} />
        ) : (
          <StepCard key={step.id} step={step} depth={depth} />
        )
      )}
    </View>
  </LayoutAnimationConfig>
);
```

```tsx
// target — StepCard root
<Animated.View
  className="gap-2"
  layout={editor ? STEP_LAYOUT : undefined}
  entering={editor ? REVEAL : undefined}
  exiting={editor ? STEP_EXIT : undefined}>
  ...unchanged children...
</Animated.View>
```

```tsx
// target — RepeatGroup root
<Animated.View
  className="rounded-lg border-2 border-border"
  layout={editor ? STEP_LAYOUT : undefined}
  entering={editor ? REVEAL : undefined}
  exiting={editor ? STEP_EXIT : undefined}>
  ...unchanged children...
</Animated.View>
```

```tsx
// target — add buttons inside a repeat (this branch only renders when `editor` is set)
<Animated.View layout={STEP_LAYOUT} className="flex-row flex-wrap gap-2">
  ...unchanged children...
</Animated.View>
```

```tsx
// target — src/components/workout-form.tsx, everything below the list in one gliding column.
// `gap-4` matches Screen's own content gap (src/components/screen.tsx:45) so spacing is unchanged.
<Animated.View layout={STEP_LAYOUT} className="gap-4">
  {reordering ? null : <View className="flex-row flex-wrap gap-3">...unchanged...</View>}

  <Separator />

  {errors.length ? <Text className="text-destructive">{errors[0]}</Text> : null}
  <View className="flex-row items-center justify-between">...unchanged...</View>

  {onDelete ? <AlertDialog>...unchanged...</AlertDialog> : null}
</Animated.View>
```

`LayoutAnimationConfig skipEntering skipExiting` is what keeps the first render and the
Reorder toggle quiet: it skips child enter animations when the wrapper mounts and child exit
animations when it unmounts. The wrapper mounts when the builder opens and when Reorder mode
ends, and unmounts when Reorder mode starts (the component returns `Sortable.Grid` instead).

## Repo conventions to follow

- Builder motion constants live in `src/components/disclosure-motion.tsx` and are built from
  that file's `DURATION_MS` / `EASE_OUT`, always ending in `.reduceMotion(ReduceMotion.System)`.
  Exemplar: the existing `REVEAL` at `disclosure-motion.tsx:16`.
- `Animated.View` takes NativeWind `className` directly. Exemplar: `disclosure-motion.tsx:21`.
- `step-list.tsx` already imports from `@/components/disclosure-motion` (line 11); extend that
  import instead of adding a second one.
- Reorder mode belongs to `react-native-sortables` ("one sortable list at a time, never
  nested"); it supplies its own drag motion and must not be wrapped or altered.
- Screens only render; no behaviour changes belong in this plan.

## Steps

1. `src/components/disclosure-motion.tsx`: add `FadeOut` and `LinearTransition` to the
   `react-native-reanimated` import. Replace the `const REVEAL = ...` line with the three
   exported constants from Target. `EditorReveal` and `DisclosureChevron` stay as they are.
2. `src/components/step-list.tsx`: add
   `import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';` and extend the
   disclosure-motion import to
   `import { DisclosureChevron, EditorReveal, REVEAL, STEP_EXIT, STEP_LAYOUT } from '@/components/disclosure-motion';`.
3. In `StepList`, wrap the final `return`'s `<View className="gap-3">` in
   `<LayoutAnimationConfig skipEntering skipExiting>` as in Target. Do not touch the
   `steps.length === 0` branch or the `reordering` branch above it.
4. In `StepCard`, change the root `<View className="gap-2">` and its closing tag to the Target
   `Animated.View`. `editor` is already in scope there (`const editor = useContext(EditorContext)`).
5. In `RepeatGroup`, change the root `<View className="rounded-lg border-2 border-border">`
   and its closing tag to the Target `Animated.View`. `editor` is already in scope.
6. In `RepeatGroup`, change the add-buttons `<View className="flex-row flex-wrap gap-2">` and
   its closing tag to `Animated.View` with `layout={STEP_LAYOUT}`.
7. `src/components/workout-form.tsx`: add `import Animated from 'react-native-reanimated';`
   and add `STEP_LAYOUT` to the existing disclosure-motion import (line 9). Wrap the JSX that
   starts at `{reordering ? null : (` (line 347) and runs through the end of the
   `{onDelete ? ( ... ) : null}` block (line 392) in
   `<Animated.View layout={STEP_LAYOUT} className="gap-4">`. The `</Screen>` closing tag stays
   outside the wrapper. Do not move the `HoldPicker` or the "Clear hold choices?" dialog,
   which sit above this range.
8. Run the mechanical checks.

## Boundaries

- Do NOT change `ReorderRow`, the `Sortable.Grid` branch, `StepMenu`, `StepEditor`,
  `HoldThumb`, `EditorReveal`, `DisclosureChevron`, or any action in `src/lib/workout-steps.ts`.
- Do NOT add an exit animation to `EditorReveal`; closing immediately is a settled decision.
- Do NOT animate the read-only lists. Every animation prop on `StepCard` and `RepeatGroup`
  must be gated on `editor` exactly as shown.
- Do NOT change class names, spacing, or the order of elements.
- Do NOT add dependencies, and do NOT nest or add sortable lists.
- If the JSX does not match the excerpts (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` all
  pass.
- **Feel check** (device or the `hangboard` Android emulator; this one must be checked on
  Android, where layout transitions inside a scroll view are most likely to stutter). Open
  Edit on a workout that has a repeat with at least three steps:
  - Opening the screen: no cards fade in; the list is simply there.
  - ⋮ → Move up on the third step: the two cards cross over about 200ms and it is obvious
    which one moved. Tap Move up twice quickly: the card retargets, it does not snap.
  - ⋮ → Duplicate: the copy fades in and the cards below glide down.
  - ⋮ → Delete step: the card fades out and the cards below glide up. Watch for the deleted
    card's ghost overlapping its neighbour; a brief overlap is expected, a visible smear is not.
  - Add step inside the repeat: the repeat's border grows smoothly; the border must not snap
    to its new height ahead of the cards inside it.
  - Tap a step to open its editor: the cards below, the add buttons, the separator and the
    Total row all move together. Nothing below the list jumps while the cards glide.
  - Tap it again to close: the editor is gone at once and the rest glides up. If this reads
    as laggy compared with before, report it; do not shorten the duration on your own.
  - Tap Reorder, then Done: no fades in either direction; dragging rows works as before and
    the page still auto-scrolls while dragging near the edges.
  - Hold + on a stepper and type in the label field while a step is open: no stutter.
  - Open the workout's overview (not Edit) and an imported workout preview: lists are static.
  - OS reduce-motion on: every change above is instant.
- **Done when**: checks pass; moved, added and removed steps animate as described in the
  editable builder only; Reorder mode and the read-only lists behave exactly as before.
