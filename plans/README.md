# Animation plans

Self-contained implementation plans for the motion opportunities found in the
`find-animation-opportunities` sweep. Each plan can be handed to any agent with no other
context. All were written at commit `ae82517` against a working tree with uncommitted changes,
so executors should match on the quoted code, not on line numbers alone.

| #   | Plan                                                                                         | Severity | Files                                                | Status  |
| --- | -------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------- | ------- |
| 001 | [Give every Button a press scale](001-button-press-scale.md)                                 | MEDIUM   | `ui/button.tsx`, new `lib/motion.ts`                 | DONE    |
| 002 | [Let the finish land: pop "Done", stagger the summary](002-workout-complete-beat.md)         | LOW      | `runner.tsx`                                         | DONE    |
| 003 | [Make builder steps glide when they move, appear or go](003-step-list-layout-transitions.md) | MEDIUM   | new `glide.tsx`, `step-list.tsx`, `workout-form.tsx` | DONE    |
| 004 | [Open native menus from their trigger](004-native-dropdown-origin.md)                        | MEDIUM   | `ui/dropdown-menu.tsx`                               | DONE    |
| 005 | [Bridge the unfinished-run card in and out of Home](005-active-run-card-transitions.md)      | LOW      | `active-run-card.tsx`, `app/index.tsx`               | PARTIAL |

## Outcome

All five were executed on 2026-10-09 in the working tree. Reanimated layout transitions left views overlapping at rest on Android, so 003 was
rebuilt on a transform-only glide (`src/components/glide.tsx`) and the gliding part of 005 was
removed; see the Status line in each plan. An unplanned fix came out of the web check: `src/app/_layout.tsx` now registers
`Animated.View` with NativeWind on web, where it was silently dropping its class names (this
also restores the styling of the builder's inline editor on web).

## Recommended order

1. **001** first. It has the widest reach (every button, including the timer's Start / Pause)
   and it creates `src/lib/motion.ts`, the shared `EASE_OUT` the others import.
2. **004**. One file, and the most structural risk (it moves the animation from the overlay
   onto the menu through `asChild`); better to find out early if the primitive objects.
3. **003**. The largest change; needs an Android feel check for layout transitions inside the
   scroll view.
4. **002**. Isolated to the finish screen.
5. **005**. Lowest leverage, and the only one that touches the launch screen.

## Dependencies

- No plan blocks another. 002, 004 and 005 import `EASE_OUT` from `src/lib/motion.ts`; each
  carries a first step that creates the file if 001 has not run yet, with identical content.
- 003 keeps its constants in `src/components/disclosure-motion.tsx` and does not need
  `motion.ts`.
- No two plans edit the same file, so they can be executed in parallel worktrees. If they are,
  expect a trivial add/add conflict on `src/lib/motion.ts` (same content on both sides).

## Not planned here

- The curve `Easing.bezier(0.23, 1, 0.32, 1)` is typed out in `disclosure-motion.tsx`,
  `board-view.tsx` and `timer-phase-label.tsx`. Once `src/lib/motion.ts` exists, pointing
  those three at it is a small follow-up; it is left out so each plan stays single-purpose.
- Candidates rejected in the sweep (countdown digits, pause controls, hold-to-confirm for End
  workout, calendar month slide, Home entrance stagger, stepper values) stay rejected.

## Shared verification

Every plan ends with the repo's four checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

None of the plans is covered by `npm test` (the tests reach `src/lib`, not components), so the
feel check in each plan is the real acceptance step and needs a device or emulator.
