# MoonBoard exploration

Status: designed and implemented on 9 October 2026 (see the Climb tab and `src/lib/moonboard/`).
The boards below are the design reference; where the app differs, the list at the end says so.

The draft lives on the Penpot page **07 MoonBoard & dock**: 42 boards, all editable.
[Open it in Penpot](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=f135c210-f44f-4df4-a087-1e4ae0026f09).
Review images are in [`../../exports/moonboard/`](../../exports/moonboard/) (`review-A.png` to
`review-F.png` are the contact sheets), and [inventory.json](inventory.json) maps every board to
its proposed route and Penpot ID.

## The idea

Pick a problem, see it lit on the wall, log the send. Everything is on the phone, the lights
talk over Bluetooth, and there is no account.

## Boards

| Row | Flow      | Boards                                                                                                                                                         |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0  | Overview  | Flow map with decisions and open questions; the dock's states, anatomy, motion and behaviour                                                                   |
| A   | App shell | Home, Hang, Log (default and with a day pinned) and Settings with the dock                                                                                     |
| B   | Set up    | Climb tab before a board, choose the board, angle, hold sets, lights or not                                                                                    |
| C   | Connect   | Why Bluetooth, searching, boards found, corner test, fixing wrong lights, connected, Bluetooth off, permission blocked, no board found, the board lights sheet |
| D   | Climb     | Problem list, filters, nothing matches, problem, lit on the wall, lights dropped, log a send, sent                                                             |
| E   | Create    | Set a problem, name and grade, my problems, share as QR, a board session in the log, MoonBoard settings                                                        |
| F   | Circuits  | Your circuits, one circuit, add a problem, edit and reorder, climbing a circuit, done                                                                          |

Main actions are linked, so the flows can be clicked through in Penpot's View mode.

## Decisions in this draft

- **Five places, one dock.** Home, Hang, Climb, Log and Settings. The workout library leaves Home
  for Hang; the calendar and sessions merge into Log. The dock follows the
  [beui motion dock](https://beui.dev/components/motion/dock): a floating bar, icons only, a
  tile that glides to the active item on a spring (stiffness 360, damping 32, mass 0.6). It only
  shows on those five screens. The dock board also holds an alternative that names the active
  item, because Hang and Climb are new ideas and icons alone may not explain them.
- **The calendar is a heat calendar.** Log shows the last 16 weeks as columns of small squares,
  after the [beui heat calendar](https://beui.dev/charts/heat-calendar): one amber hue in five
  strengths, darker for more training time, with hang and board sessions counted together. Tapping
  a day pins it, dims the rest and lists that day's sessions underneath. Unlike the reference it
  keeps M, W and F labels, because weekdays matter in a training log.
- **Problems are bundled.** The benchmark list ships inside the app. The late-2023 list is 1,960
  problems in about 1.5 MB of JSON, so there is no download and no sign-in.
- **Lights are optional.** Every screen works without the LED kit. Bluetooth is requested only
  after the climber taps Connect lights, on a screen that says what it is used for.
- **One corner test.** Lighting the four corners proves wiring and orientation before the first
  problem. Each way it can look wrong has its own fix and re-runs the test.
- **The wall is the hero.** Every list row carries a thumbnail of the line, the problem screen is
  mostly board, and the actions used with chalky hands are 56 px tall.
- **Sends are a local log.** Tries, how the grade felt, a rating and a note. A board session
  opens at the first lit or logged problem and closes after 30 quiet minutes, then sits in the
  Log beside hangboard sessions.
- **Circuits are playlists.** Climb switches between Problems and Circuits. A circuit is a named
  list of problems climbed in order, nothing more: no timer and no rests. Sent it or Skip moves
  to the next problem and lights it; starting a circuit is the consent to change the wall. Any
  problem is added from the list icon on its screen and can sit in several circuits. A finished
  circuit is saved as a board session.
- **Own problems share as QR.** Same offline pattern as workouts.

## How it follows the principles

- **Everything is local.** Problems, sends, own problems and the paired board live on the device.
  Bluetooth to the board is not a network request.
- **No account.** There is no Moon login, so sends do not sync with the official logbook.
- **Instant startup.** Home reads only the last problem's name and grade. Board data and Bluetooth
  load when Climb opens.
- **One appearance.** Same palette and Geist Mono. Three colours are new and used only for
  start, hold and finish (`67slopers/MoonBoard` in the Penpot assets). They follow the LED
  convention and are always paired with a legend; the finish hold also has a second ring.

## Open questions

- **Problem data.** Which list may the app ship, and under what terms? The sample rows are real
  Masters 2019 40° benchmarks from the public guidebook at <https://moonboard.simonchase.com/>.
- **Hold artwork.** The boards are schematic: every grid position gets a generic hold. Real hold
  shapes per set need drawing or licensing.
- **Newer control boxes.** The protocol below is proven on the V1 box only. V4 and V5 boxes are
  assumed to speak it; test on one.
- **Lights off.** No clear command is documented. An empty problem should blank the wall.
- **2024 layout.** Not in the benchmark data, so it is not in the board picker.
- **Web.** Web Bluetooth only works in Chromium browsers. Web may stay browse and log.
- **Dock labels.** Icons only, or name the active item? Worth testing on a device.
- **Feet rules.** "Any holds / Follow hands / Footless" on own problems is a guess.

## What the lights can do

Taken from three reverse-engineered implementations, none verified by us on a board:
[willslawrence/moonboard](https://github.com/willslawrence/moonboard) (a phone driving a real V1
box, the same role our app would have, and the main source),
[e-sr/moonboard](https://github.com/e-sr/moonboard) (a Raspberry Pi standing in for the box) and
[FabianRig/ArduinoMoonBoardLED](https://github.com/FabianRig/ArduinoMoonBoardLED) (an Arduino
doing the same, kept compatible with the current official app).

| Protocol fact                                                                                          | What it means for the UI                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A problem is one ASCII line over Nordic UART, `l#S5,P9,E18#`: LED numbers tagged start, hold or finish | Start, hold and finish are the only roles; green, blue and red are fixed by the box                                                                                         |
| Every write redraws the whole wall; there is no brightness, fade or blink                              | No brightness control. Relighting on swipe is cheap, so it is a setting (**Light as I browse**, off by default so browsing never changes what someone is climbing)          |
| The box never replies                                                                                  | The app knows the link is up, not what is lit. The corner test asks the climber, and "Lit" means "sent"                                                                     |
| LEDs are numbered up one column and down the next from A1 (18 per column, 12 on the Mini)              | Mirrored or reversed strips are corrected in the app, which is what the "lights look wrong" fixes do. The Mini flag comes from the chosen board, with no control of its own |
| A `~D*` prefix asks V2 and newer kits to also light above each hold                                    | **Light above holds too**, the one real light setting, replaces the brightness slider                                                                                       |
| A V1 box takes one Bluetooth connection; newer boxes take several                                      | "No other phone is connected" stays on the checklist and in the no-board-found tips                                                                                         |
| Long messages are cut off silently, somewhere around 45 holds                                          | Own problems are capped at 30 holds                                                                                                                                         |
| Newer kits also accept left, right, match and foot tags                                                | Not used. A possible later "show beta" feature                                                                                                                              |

## Regenerate

```bash
python3 design/penpot/moonboard.py
node design/penpot/render_moonboard.mjs
```

`--publish` updates this generator's own shapes on page 07 and re-exports the `.penpot` file. It
overwrites manual edits to generated shapes, so once the boards are being edited by hand, export
from Penpot instead of re-running it. Hand-made shapes and the other pages are never touched.

## Where the app differs from the boards

- The problem list keeps the star rating on untouched rows and has no stat tile for how the
  grade feels; own log entries record that instead.
- "Climb these again" on a board session saves the session's problems as a circuit and starts
  it, so the evening can be repeated in order.
- Lights are remembered once, not per board: switching boards keeps the same LED kit.
- Sheets, the swipe between problems, the lights coming on from start to finish, the search
  pulse, the send beat and the circuit progress bar are built from the motion proposals.
