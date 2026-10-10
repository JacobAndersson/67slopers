# Home redesign

A proposal, drawn on the Penpot page **07 MoonBoard & dock** under the existing boards
(`design/penpot/home_redesign.py`, review images in `design/exports/home-redesign/`). The app's
Home screen follows these boards (`src/app/(tabs)/index.tsx`, `home-card.tsx`, `hang-card.tsx`,
`board-card.tsx`).

- **A greeting by the clock.** A couple of words, never a sentence, and no date beside it. The lines live in `src/lib/greetings.ts`: seven parts of the day, plus a few for some weekdays. One line holds for that part
  of that day. The notes board lists every line, read from the source.
- **Two equal cards.** Hangboard and MoonBoard are the same size: what was done last, one tap
  from doing it again. The Next up hero is gone.
- **The last one used comes first.**
- **Not set up is an outline**, one line of text, easy to ignore.

Boards: H0 notes and all greetings, H1 morning, H2 evening with lights connected, H3 small
hours, H4 first launch, H5 unfinished workout.
