# Timer redesign

Status: proposal, 10 October 2026. Design only; the app's timer is unchanged.

Nine boards on the Penpot page **04 Timer & recovery**, in a row under the boards that show the
timer as built. [Open the page](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=ae5bc9e7-a441-5945-ac9e-fff3292c330f).
Review images are in [`../../exports/timer-redesign/`](../../exports/timer-redesign/)
(`review.png` is the contact sheet) and [inventory.json](inventory.json) lists the boards.

## What changes

- **The phase moves into the header.** HANG, REST and GET READY take the place of the workout
  name, between the close and settings buttons.
- **The counter gets small.** Rep and set sit under the phase in 14 px.
- **Next up only on a change.** Nothing during the hang and rest alternation of a set. It shows
  on the last hang before a long rest, before a new set, and for a new grip.
- **No card around it.** Two lines of text on the phase colour.
- **End workout is gone.** The X already ends the workout, with the same confirmation.
- **The grip is spotlit.** Nothing is painted on the holds. A veil of the screen's own colour
  lies over the rest of the board, so the holds to use keep their full colour while the rest
  recedes; a hairline ring gives them an edge.

## Built

The app follows these boards: `src/components/runner.tsx`, `BoardView`'s `spotlight` and
`src/lib/timer/next-up.ts`. The Next line also stays through the short rest that follows the last
hang of a set, and reads "Done" from the last hang of the workout on.

## Open

- Before Start, the workout name is still shown under the countdown. Drop it there too?
- Gen Z mode (the split with gameplay below) is not redrawn yet.

## Regenerate

```bash
python3 design/penpot/timer_redesign.py            # review SVGs only
python3 design/penpot/timer_redesign.py --publish  # also update its own boards in Penpot
```

Publishing overwrites hand edits to these nine boards, so once you start editing them in
Penpot, stop regenerating.
