# 67slopers design system

[Open the design system in Penpot](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=83493a27-42b5-5511-8850-15e221286642&board-id=31197271-4bb8-5705-b5f3-2faebcb8410d).

The library mirrors the implemented app, reviewed on **9 October 2026**. It started with 15 reference
boards, and now includes a paired light/dark color board. It has **29 component families** (155 main components, including variants), **19 variant sets**,
**87 native Penpot tokens**, and **15 shared typography styles**. The original 76 app boards,
24 shared colors, 10 reference type styles and three older buttons are preserved.

## Pages

| Page                                       | Contents                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **00.1 Design system · Foundations**       | Start here, semantic palette, phase colors, type scale, spacing, corners, layout, feedback and accessibility                          |
| **00.2 Design system · UI components**     | Buttons, inputs, textarea, stepper, toggles, badges, icon actions, menu items, settings, confirmation and section headers             |
| **00.3 Design system · Training patterns** | Workouts, history, facts, calendar, feel, steps, repeats, board/grip choices, timer, recovery and a screen made from linked instances |

**01 Foundations** remains the earlier app-reference sheet. Use the new **00.x** pages and the
**67slopers / UI** and **67slopers / Training** asset groups for new design work.

## Reuse in Penpot

1. Open **Assets**, expand **67slopers**, and drag a component onto an exploration board.
2. Select the copy and choose its named properties in the right inspector. The Button set has
   all 72 combinations of six variants, three sizes and four states.
3. Override labels and sample data on the copy. Text uses shared styles under
   **67slopers / System**; fills and strokes reference the shared semantic colors.
4. Use **Go to main component** for an agreed library-wide change. Keep a copy linked when it
   should inherit future changes; detach only when deliberately exploring a different pattern.
5. Export reviewed changes into `design/penpot/` and capture matching review images.

The **Tokens** tab currently contains **67slopers / App**, a light-only design-tool token
set. The existing shared Assets colors, components, and app reference boards are light
references, not dark-ready variants. [The paired appearance board](#light-and-dark-appearance)
on 00.1 documents the new dark roles. Component corner radii are bound to tokens. Colors
use shared Assets styles; typography uses shared text styles.
Button, badge and toggle masters have flex layouts. Complex patterns use editable nested
frames and constraints; they are reference compositions, not fully responsive application code.
Variant swapping can retain an instance's overridden dimensions; adjust its size when changing
between compact and full-width compositions.

## Component contracts and code sources

| Family                                   | Properties / purpose                                                                                   | Implemented source                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Button                                   | default, secondary, outline, ghost, destructive, link × sm/default/lg × enabled/pressed/disabled/focus | `src/components/ui/button.tsx`                                         |
| Input, Textarea                          | Empty, filled, focus, disabled, invalid as applicable                                                  | `src/components/ui/input.tsx`, `textarea.tsx`                          |
| Toggle, Badge                            | Selection state and semantic variant                                                                   | `src/components/ui/toggle.tsx`, `badge.tsx`                            |
| Icon button                              | Eight common navigation/editing actions, 44 px targets                                                 | `src/components/ui/button.tsx`, `icon.tsx`                             |
| Stepper                                  | Display, number entry, clock entry                                                                     | `src/components/stepper.tsx`                                           |
| Menu item, Workout settings              | Plain, checked, unchecked, destructive; 48 px settings rows                                            | `src/components/ui/dropdown-menu.tsx`, `workout-settings.tsx`          |
| Confirmation dialog, Section header      | Consequence and choice; section title with secondary action                                            | `src/components/ui/alert-dialog.tsx`, `section-header.tsx`             |
| Workout card, Workout hero               | Row/compact; next workout with immediate Start                                                         | `src/components/workout-card.tsx`, `workout-hero.tsx`                  |
| Session row, Metric grid                 | Home/complete/ended; planned vs performed facts                                                        | `src/components/session-row.tsx`, `metric-grid.tsx`                    |
| Calendar day, Week calendar              | Ordinary, trained, today, selected, outside month                                                      | `src/components/calendar.tsx`                                          |
| Feel choice, Feel badge                  | Weak/normal/strong, selected/unselected                                                                | `src/components/feel.tsx`                                              |
| Timed step, Repeat group                 | Prep/hang/rest × read/edit/reorder; sets and reps                                                      | `src/components/step-list.tsx`                                         |
| Board choice, Grip choice, Board cue     | No board, available, selected; paired grip guidance                                                    | `src/components/board-picker.tsx`, `hold-picker.tsx`, `board-view.tsx` |
| Timer phase, Timer action, Next interval | Prep/hang/rep rest/set rest; running/paused                                                            | `src/components/runner.tsx`                                            |
| Unfinished run, Completion heading       | Continue/save/discard; saved-session feedback                                                          | `src/components/active-run-card.tsx`, `runner.tsx`                     |

The library documents existing behavior. Keyboard focus and invalid field styling refer to
web states; static samples do not simulate native focus, timing, dragging, text scaling or
camera permission. Full screen and flow references stay on pages 02–06.

## Light and dark appearance

[Open the paired color board in Penpot](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=83493a27-42b5-5511-8850-15e221286642&board-id=10868f95-4475-5802-b630-a7150e842fe8). Its editable surfaces show the light and dark semantic pairs with the implemented hex values. [Review image](../exports/design-system/appearance-light-dark.png).

- Follow the device by default; **Auto / Light / Dark** is a local Settings choice. Do not change hierarchy, typography, spacing, or information order between modes.
- Build from roles (`background` + `foreground`, `card` + `cardForeground`, `primary` + `primaryForeground`, `secondary`, `accent`, `muted`, `destructive` and their paired foregrounds), not literal hex inversions. Use `border`, `input`, and `ring` for their own jobs. Reserve chart colors for data and phase colors; preserve the MoonBoard LED start/move/finish meanings.
- The timer's prep, hang and recovery surfaces stay distinct, but phase words and large digits must still explain the state without color. Test across-room contrast in both modes. Keep QR ink/background contrast high enough to scan.
- Review cards, dock, forms, focus, disabled and destructive controls, heat calendar, timer, board overlays and QR in both appearances. The existing component masters and screen boards remain **light references**; the paired board documents dark roles, not finished dark variants of every screen.
- `src/global.css` and `src/lib/theme.ts` are the source of truth. For implementation, see [`docs/appearance.md`](../../docs/appearance.md). When dark component variants are designed, create explicit Penpot light/dark token themes and review both before replacing the existing light Assets colors.

## Foundations

- **Palette:** Pulse / amber in [`src/global.css`](../../src/global.css) and
  [`src/lib/theme.ts`](../../src/lib/theme.ts). Keep both code palettes in sync. The older
  Stella label in the agent notes is outdated.
- **Type:** Geist Mono 400, 500, 600, 700, 800; [`fonts.ts`](../../src/lib/fonts.ts) and
  [`tailwind.config.js`](../../tailwind.config.js). The fonts are installed in the local team.
- **Spacing:** NativeWind's 16 px rem; common gaps 4/8/12/16/20/24/32/40/48. Page sides 24 px,
  content max 768 px. Radius sm/md/lg/xl is 8/10/12/16 px.
- **Timer colors:** prep = accent, hang = chart-1, rep rest = secondary, set rest = muted.
  Pair color with words and countdown digits.
- **Interaction:** standard action 44 px, large action 56 px, timer action 80 px. Disabled opacity
  50%; keyboard focus ring 3 px at 50%. Disclosure reveal 150 ms with system reduced motion.
- **Icons:** editable Phosphor vectors match the app: Regular for UI and Bold for timer controls.
  Weak / Normal / Strong use Battery Low / Thumbs Up / Barbell. Aria and MoonBoard ideas remain
  explorations. Board art comes from the actual bundled assets. The exported icons retain the
  [package license](Phosphor-LICENSE.txt).
- **Product rules:** local data, no account, device-following light/dark appearance with a
  local override, clear recovery, truthful session values, and no feel grades on Home.
  See [`docs/principles.md`](../../docs/principles.md).

## Versioned artifacts

- [`library.json`](library.json): original library pages, board IDs, dimensions and component/variant records; the paired appearance board was added directly in Penpot.
- [`tokens.json`](tokens.json): current **light-only** Penpot JSON token export, including phase aliases.
- [`../exports/design-system/`](../exports/design-system/): 15 original SVG/PNG boards, the
  paired appearance PNG, three overview sheets and live Penpot review captures.
- [`../penpot/67slopers.penpot`](../penpot/67slopers.penpot): the complete editable file, including
  the original app recreation and the new library.
- [`Geist-Mono.zip`](Geist-Mono.zip): five font files and their license. Penpot exports do not
  embed team fonts; install these and reassign missing fonts when importing into another team.

Generation is separate from the app recreation and never updates the original seven pages:

```bash
python3 design/penpot/design_system.py
node design/penpot/render_design_system.mjs
```

`--publish` adds the library to the local file. It refuses to overwrite an existing library
unless `--replace-generated` is explicitly supplied. That option deliberately overwrites
library-owned shapes and tokens, so export manual edits first. The normal collaborative
workflow is to edit in Penpot and export the live file, without rerunning either generator.
