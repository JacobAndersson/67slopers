# Dock icon studies

Six original vector candidates for Hang and Climb, on a separate **08 Dock icon studies**
page in the existing Penpot file. Choose one H and one M independently.

[Open the comparison in Penpot](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=25f716a3-1cbc-549b-aeff-f56d4044f471&board-id=88420974-00ed-5393-8d1e-a8c01200eab5).

| Candidate        | Idea                                                            |
| ---------------- | --------------------------------------------------------------- |
| H1 — Dead hang   | A person hanging from a broad training edge. Recommended.       |
| H2 — Tucked hang | A suspended figure with bent knees.                             |
| H3 — Fingerboard | Paired pockets and a dipped centre.                             |
| M1 — Hold wall   | Front elevation with shaped holds and kickboard. Recommended.   |
| M2 — Overhang    | Side elevation with an overhanging face and vertical kickboard. |
| M3 — Lit problem | A sparse route with ringed holds on the wall.                   |

The selected pair is **H1 + M1**, implemented in `src/components/training-icons.tsx`.
H1 has a narrower grip, shorter arms, and a longer torso after proportion review. The symbols are simplified representations
of the activities and equipment, not official MoonBoard brand marks or literal hold layouts.

## Construction and review

- A 24-unit square, with a 1.5-unit Regular stroke matching Phosphor's 16/256 geometry.
- Round stroke ends, geometric silhouettes, and monochrome Regular/Fill states.
- Selected variants add solid mass and true transparent openings rather than painted white holes.
- Actual 24 px previews use the existing dock's 48 px tiles, 4 px gaps, 6 px padding,
  settings separator, palette, and Phosphor House, CalendarBlank, and GearSix vectors.
- The optical sheet compares each option at 20, 24, and 32 px and beside existing icons.
- Twelve separate editable 24 × 24 masters sit below the comparison boards on the page.

[Comparison](../../exports/dock-icons/dock-icons-overview-penpot.png) and
[optical checks](../../exports/dock-icons/dock-icons-scale-penpot.png) are rendered by the
live Penpot exporter. Matching SVGs, local PNG previews, twelve transparent icon SVGs,
and path data in `icons.json` live in [the export folder](../../exports/dock-icons/).
The complete editable file is [67slopers.penpot](../../penpot/67slopers.penpot).

## Reproduce

```bash
python3 design/penpot/dock_icons.py
node design/penpot/render_dock_icons.mjs
python3 design/penpot/dock_icons.py --publish
```

Publishing updates only this generator's owned shapes on the dedicated page, preserves other
pages and manually added shapes, and refreshes the portable Penpot export. It saves a local
pre-publish snapshot under `design/.local/`. The app dock uses revised H1 and the approved M1. Other candidates remain available for comparison.
