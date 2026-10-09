# Current app

The 8 October 2026 recreation covers every implemented route. [inventory.json](inventory.json)
lists board names, route/state references, page IDs, board IDs, dimensions, and notes.

The editable boards are in local Penpot. Matching review exports are under
[`../exports/current-app/`](../exports/current-app/); the page contact sheets are
`../exports/review-1.png` through `review-7.png`.

Source references include `src/app/`, `src/components/`, `src/lib/theme.ts`,
`src/lib/store/presets.ts`, and the bundled board and gameplay assets. The helpers use actual
preset durations, descriptions, Phosphor paths, and a valid workout QR code from the app.

Phone references use 390 px boards and representative native status/header chrome. Long boards
show the complete scroll content with the pinned action at the bottom. Desktop Home uses 1440 px
with the app's centered 768 px column. Camera permission prompts supplied by iOS/Android and
software keyboards are outside the app-owned UI. History and session notes are sample data.

The recreation includes empty and unavailable content, editable descriptions, invalid builders,
interrupted recovery, paused controls, media fallback, early completion, draft saving, changed
workout replay, camera denial, invalid QR codes, and destructive-action confirmations.
