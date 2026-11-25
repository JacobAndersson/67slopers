# Rivet — App design

The complete redesign of the app in the Rivet brand, as an editable Penpot file built by code.
Local Penpot (`python3 design/penpot/manage.py up`, http://localhost:9002) → project **Rivet** →
**Rivet — App design**. The file id is kept in `design/.local/rivet/app-file.json`.

Everything is generated: edit the scripts, not the shapes, then rebuild.

```bash
V=design/.local/venv/bin/python
$V design/rivet/app/build.py --render          # every page, then PNGs in design/exports/rivet-app/
$V design/rivet/app/build.py p05 p06 --render  # only some pages
python3 design/rivet/app/sheets.py             # contact sheets in design/exports/rivet-app/sheets/
```

## Pages

| Page                   | What is on it                                                                                                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00 Cover               | Cover and the ten rules that carry the brand book into the app                                                                                                                                                                                                                                |
| 01 Foundations         | Colour roles (light, dark), session states, data colours and the wall-LED exception, type, layout and radii, icons, motion                                                                                                                                                                    |
| 02 Components          | The **Library** (40 main components in Assets), then buttons, selection, inputs, cards and rows, steps, bars, navigation and overlays, boards: each in light and dark                                                                                                                         |
| 03 Home & Hang         | Home (morning, board first, unfinished run, first run), Hang library and empty state                                                                                                                                                                                                          |
| 04 Workouts & builder  | Overview, builder (new, step open, dragging, board picker, validation, step menu, add step), grip picker, classic workouts, hangboard setup                                                                                                                                                   |
| 05 Timer               | Ready, Get ready, Hang, Rest, last rep with Next, Recover, Paused, no board, settings sheet, end dialog, Done, summary, ended early, unsaved workout                                                                                                                                          |
| 06 Climb               | Intro, problems, empty, filters, circuits, problem (plain, scrolled, lit), log a send, add to circuit, new and save problem, circuit (overview, edit, run, done), setup (layout, angle, holds), lights prompt, MoonBoard settings, board session, every lights-connection state, board lights |
| 07 Log & settings      | Log (recent, day pinned, empty), sessions, one session (and when the workout changed), settings                                                                                                                                                                                               |
| 08 Share, scan & edges | Share workout and problem, scan (camera, permission, blocked, not ours), shared workout and problem, missing and bad-code states, destructive dialogs, launch screens                                                                                                                         |
| 09 Dark mode           | The key screens with the lights off                                                                                                                                                                                                                                                           |
| 10 Flows               | Storyboards of the main journeys, drawn with the real screens at half size                                                                                                                                                                                                                    |

The file also carries the library as native Penpot assets: the Alpenglow colours, scales, light and
dark roles; the app type scale as typographies; design tokens in **Rivet/Core**, **Rivet/Light** and
**Rivet/Dark** sets with Light and Dark themes; and main components under **Rivet/**.

## Code

- `ui.py`: tokens (from `design/rivet/kit/tokens/rivet.tokens.json`) and every component.
- `boards.py`: hangboards drawn as diagrams from `hangboard-models/*/layout.json`; the MoonBoard grid.
- `screens_*.py`: the screens, one function per screen and state, drawn at 390 × 844 pt.
- `p00_cover.py` … `p10_flows.py`: the pages; `pagekit.py` lays them out; `library.py` publishes assets.
- `doc.py` points the brand book's Penpot writer (`design/rivet/tools/pp.py`) at this file.
- Icons are Phosphor (copied into `icons/` as they are used) plus the brand's custom hangboard and
  board icons from `design/rivet/icons/`.

## Decisions

- Glow is the colour of the hang: it fills the Hang screen and nothing else (icon and launch symbol aside).
- The session colours carry the state and keep it in both modes; every state also has a word. Get ready is
  Stone, Hang Glow, Rest Glacier, Recover Glacier 200, Done Night. The interval rises from the bottom in a
  deeper step of the same colour (Glow 500 through Glow), with a darker 3 pt edge so the level reads from afar.
- Paused goes Snow under a band of the phase it stopped in and says "Tap Resume to carry on"; the digits stay
  at full contrast.
- While a timer runs there is one control, a labelled Pause pill; Back and Skip come with Resume.
- Confirmations are bottom sheets (thumb third). The safe choice is the solid pill; Delete is the hairline
  pill with its icon. Destructive actions are never red.
- How a session felt is shown as Off day · Solid · Strong (stored as weak / normal / strong; `FEEL_LABELS`
  in `src/lib/store/types.ts` changes with it) and is never preselected.
- A rest that closes a set is called Recover by the timer; the builder keeps three step kinds.
- Hangboards are diagrams, not renders: "we photograph, and we diagram".
- MoonBoard hold colours are the wall's LED colours (green, blue, red), the one exception to the
  palette, only on the wall drawing and its legend, as rings (start and finish carry a dot, finish a second ring).
  Hold-set swatches in board setup show the real hold colours: the second, contained exception.
- Recover is Glacier 200 everywhere, in both modes: the timer ground, the step rail and the workout timeline. Rest rails
  are Glacier 300 in light and Glacier 400 in dark, so the two stay apart.
- Sample data is one dataset (today is Thursday 19 November 2026); the classic workouts are generated
  from the same step trees as `src/lib/store/presets.ts` (`data.py`).
