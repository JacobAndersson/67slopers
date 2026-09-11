# Hangboard models

Reference data for the planned "hangboard configuration" feature: pick a board, mark the
holds you hang from, and the timer highlights them on each hang. Every board lives in its own
folder with the same set of files, all derived from one hand-maintained `layout.json`.

| Board | Folder | Holds | Status |
| --- | --- | --- | --- |
| Beastmaker 1000 Series | `beastmaker-1000/` | 22 | positions traced from the official photo, depths community-measured |
| Beastmaker 2000 Series | `beastmaker-2000/` | 25 | positions traced from the official photo, depths community-measured |
| Beastmaker Micros | `beastmaker-micros/` | 1 per block × 3 depths | footprint and depths from Beastmaker, rest estimated |
| Tension Grindstone Mk2 | `tension-grindstone-mk2/` | 14 | depths published by Tension, positions traced from the official photo |
| Metolius Simulator 3D | `metolius-simulator-3d/` | 31 | depths and positions from Metolius' numbered depth diagram |
| Metolius Project | `metolius-project/` | 17 | depths and positions from Metolius' numbered depth diagram |
| Metolius Wood Grips II Compact | `metolius-wood-grips-compact/` | 19 | depths and positions from Metolius' numbered depth diagram |
| Metolius Wood Grips II Deluxe | `metolius-wood-grips-deluxe/` | 26 | depths and positions from Metolius' numbered depth diagram |
| FIKA Vetelängd | `fika-vetelangd/` | 17 | everything from FIKA's dimensioned drawing |

The Beastmaker "Beech" 1000/2000 are the same shapes in a different wood, so they share the
layouts above. The Motherboard is a sensor backboard, not a hangboard, and is not modelled.
Boards without a fixed front view (Tension Flash Board and The Block, Metolius Rock Rings and
Light Rail, FIKA Pinnbröd, Beastmaker Micros in use) are better served by a simple edge list
than by a picture; only the Micros have a layout so far.

## Files per board

| File | What it is | Generated? |
| --- | --- | --- |
| `layout.json` | Source of truth: board size, screw holes and every hold with id, type, finger count, depth/angle, mirrored pair and a front-view rectangle in mm | no, edit this |
| `board.svg` | Clean front view. Each hold is a `<path>`/`<rect>` whose `id` is the hold id, with `data-type`, `data-fingers`, `data-depth`, `data-angle`, `data-pair` attributes. This is what the app should render and recolour | yes |
| `layout.svg` / `layout.png` | Same view with depths (mm) and sloper angles written on the holds, for humans | yes |
| `model.glb` | Binary glTF 2.0 of the board (heightmap mesh, mm units) plus one flat marker mesh per hold, node name = hold id, so a viewer can show/tint a hold by name | yes |
| `model.obj` | The same geometry as Wavefront OBJ (`o board`, `o hold_<id>` groups) for CAD/Blender import | yes |
| `reference/` | Official product photos from beastmaker.co.uk, kept for tracing and comparison only | no |

Regenerate everything after editing a `layout.json`:

```bash
node scripts/gen-hangboard-models.mjs            # all boards
node scripts/gen-hangboard-models.mjs beastmaker-2000
convert hangboard-models/beastmaker-2000/layout.svg hangboard-models/beastmaker-2000/layout.png
```

The generator is dependency-free Node. The PNGs are rasterised with ImageMagick (`convert`).

## Coordinate conventions

- `layout.json` and the SVGs: origin at the top-left corner of the board as the climber sees
  it, x to the right, y downwards, millimetres. `x, y, w, h` is the hold's bounding box;
  `shape` is `stadium` (rounded slot), `circle` (mono), `rect` (top sloper strip) or `corner` (a jug that wraps the rounded end of the board: `inner` gives the strip widths along the top and the side, `corner_radius_mm` on the board rounds it).
- 3D files: X to the right, Y up, Z towards the climber; Z = 0 is the wall. The board sits in
  `0 ≤ X ≤ width`, `0 ≤ Y ≤ height`, `0 ≤ Z ≤ depth`.
- Sloper and jug holds are the top surface of the board. In the 2D views they are drawn as a
  strip along the top edge; in 3D they are modelled as inclined planes at the stated angle.
- Holds come in mirrored pairs (`pair`), plus single `center` holds used by both hands. A
  workout that stores `["edge-large-l", "edge-large-r"]` therefore says both hands on the
  large edges. A pair is not always a mirror image: the Grindstone repeats the same
  left-to-right order on both halves and the FIKA alternates its slopers, so trust `pair`,
  not geometry.
- Boards that are not rectangles (the Metolius resin boards, the tapered Wood Grips) carry an
  `outline` polygon in mm; the SVG silhouette and the 3D mesh are clipped to it. Optional
  `lower_tier` and `stepped_top` flags switch on the Beastmaker-specific relief in the app
  artwork.

## Hold ids

Beastmaker 1000: `jug-l/r`, `sloper-35-l/r`, `sloper-20`, `edge-small-l/r` (~15 mm),
`pocket-4f-deep-l/r` (~30 mm), `edge-large-l/r` (~45 mm), `pocket-2f-deep-l/r` (~50 mm),
`pocket-3f-deep-l/r` (~45 mm), `slot-flat` (~53 mm), `edge-medium-l/r` (~20 mm),
`pocket-2f-shallow-l/r` (~25 mm), `pocket-3f-shallow-l/r` (~20 mm).

Beastmaker 2000: `sloper-45-l/r`, `sloper-35-l/r`, `sloper-20`, `edge-top-deep-l` (~40 mm),
`edge-top-shallow-r` (~20 mm), `edge-big-l/r` (~33 mm), `mono-deep-l/r` (~55 mm),
`pocket-2f-big-l/r` (~32–35 mm with a ~50 mm back hole), `pocket-3f-medium-l/r` (~30 mm),
`pocket-4f-deep` (~52 mm), `edge-little-l/r` (~15 mm), `mono-1pad-l/r` (~27 mm),
`pocket-2f-little-l` (~20 mm), `pocket-2f-sloping-r` (~22 mm), `pocket-3f-small-l/r` (~22 mm),
`edge-22` (22 mm, the only depth Beastmaker publishes).

Tension Grindstone Mk2: `jug` (the full-width top bar), `edge-50` (centre one-arm edge),
`edge-30-l/r`, `edge-25-l/r`, `edge-20-l/r`, `edge-15-l/r`, `edge-10-l/r`, `edge-8-l/r`.

Metolius boards use `<type>-<fingers>-<depth>-l/r` ids taken straight from the Metolius
depth diagrams, e.g. `pocket-3f-30-l`, `edge-25-r`, `pocket-4f-19` (centre), plus `jug-l/r`
(outer jugs), `sloper-flat-l/r`, `sloper-round` or `sloper-round-l/r`, and on the Simulator
`jug-center` and the centre pocket column `pocket-3f-50`, `pocket-3f-37`, `pocket-2f-28`,
`pocket-2f-32`.

FIKA Vetelängd: `sloper-25-l/r`, `sloper-35-l/r`, `edge-25-l/r`, `edge-20-l/r`, `edge-15-l/r`,
`edge-12-l/r`, `edge-10-l/r`, `hole-30-l/r` (the round corner holes), `trough` (centre).

## Accuracy

Beastmaker publishes the outer dimensions, weight and hold *types* only. Depths come from
climbers who measured their boards (r/climbharder thread `cek236`, summarised in
`community/beastmaker-1000-2000-hold-depths-atamanroman.png`, and the OutdoorGearLab 2000
review). Hold positions were traced from the official front photos and scaled to the
580 × 150 mm footprint; expect ±3 mm. Tension engraves and publishes its edge depths;
Metolius publishes numbered depth diagrams for every board (kept in each `reference/`
folder); FIKA publishes a fully dimensioned drawing. Those boards' depths are manufacturer
numbers, and only their hold positions are traced (±3–4 mm). The 3D meshes are heightmaps: pockets are recessed by
their measured depth with a small fillet, slopers are inclined planes, and the 1000's rounded
ends and the incut jug lips are approximated. They are good enough for highlighting and
orientation, not for CNC.

If you own a board, measuring hold centres with a ruler and correcting `layout.json` is the
quickest way to improve everything downstream.

## Community 3D models

`community/` holds third-party replicas that were published under licences allowing
redistribution, with attribution in `community/ATTRIBUTION.md`. They are useful for checking
proportions and for anyone who wants a printable copy, but their licences (CC BY-SA, CC BY)
are separate from this repository's licence, so ship them only with the required attribution.

## Sources

- Beastmaker 1000 Series: <https://www.beastmaker.co.uk/products/beastmaker-1000-series>
- Beastmaker 2000 Series: <https://www.beastmaker.co.uk/products/beastmaker-2000-series>
- Beastmaker Micros: <https://www.beastmaker.co.uk/pages/micros>
- Hold depths (1000 and 2000):
  <https://www.atamanroman.dev/beastmaker-1000-2000-holds-and-edge-sizes/> and
  <https://www.reddit.com/r/climbharder/comments/cek236/beastmaker_1000_and_2000_edgehold_sizes/>
- Beastmaker 1000 hold naming (Rock+Run training plan):
  <https://rockrun.com/blogs/the-flash-rock-run-blog/beastmaker-1000-fingerboard-training-plan-training-and-skills>
- Beastmaker 2000 hold sizes in inches (OutdoorGearLab):
  <https://www.outdoorgearlab.com/reviews/climbing/hangboard/beastmaker-2000>
- Tension Grindstone Mk2: <https://tensionclimbing.com/products/grindstone>
- Metolius Simulator 3D, Project and Wood Grips II (each page links its depth diagram):
  <https://www.metoliusclimbing.com/collections/training-boards>
- FIKA Vetelängd: <https://fikaclimbing.shop/products/vetelangd-hangboard>
