# Local Penpot

`compose.yaml` follows the official Penpot 2.18 deployment, with a dedicated Compose project
(`slopers67-design`), a loopback-only port (9002), local bind mounts, generated secrets, and
telemetry disabled. PostgreSQL and Valkey are accessible only inside the Compose network.

Keep editable design exports (`.penpot`) in this directory. The live workspace is stored in
`../.local/penpot/`, which Docker manages. `manage.py` runs from any working directory.

## Current app reference

`67slopers.penpot` contains the 75-board app recreation, 16 design-system boards (including paired light/dark color guidance) and the 43-board MoonBoard exploration, with local
images, shared colors, typography, native tokens and reusable component variants. Use this file for portable design review/import;
use the live Penpot file for collaborative editing. Duplicate boards for new explorations.
Custom fonts belong to the Penpot team and are not embedded in the export. On another team,
upload the five fonts in [`../foundations/Geist-Mono.zip`](../foundations/Geist-Mono.zip) and
reassign missing font references to Geist Mono. The archive includes the font license.

The recreation helpers are development tools outside the app bundle:

- `reference.ts` reads current presets, board models, QR encoding, and installed Phosphor vectors.
- `scene.py` builds editable Penpot geometry and matching SVG review images.
- `recreate.py` defines the screens and storyboards.
- `api.py` authenticates to local Penpot with the ignored local account; it creates no MCP key.
- `render.mjs` renders app SVGs and contact sheets with the bundled font files.
- `design_system.py` adds the isolated component library, tokens and documentation pages.
- `render_design_system.mjs` renders the library review boards.
- `moonboard.py` and `render_moonboard.mjs` build and render page 07, the MoonBoard exploration.
- `repair_text.py` rewrote the text layout data of the earlier pages to match Penpot's own
  layout (it only touches text that still carries the old generated values).
- `Penpot().render(page, board, path)` in `api.py` renders a board with Penpot's exporter. Check
  alignment against that, not only against the SVG review images.

Icons use Phosphor Regular, with Bold for timer playback controls. The generator retains stable
layer IDs and hidden anchors from the initial recreation so existing component instances and
prototype links survive the icon migration. Icon paths are editable vectors, read directly from
the installed package; they require no network connection.

See the [design-system guide](../foundations/README.md) for component usage and regeneration safeguards.

```bash
node --import tsx design/penpot/reference.ts
python3 design/penpot/recreate.py
node design/penpot/render.mjs
```

These commands regenerate local review artifacts. `recreate.py --publish` also updates generated
boards and the `.penpot` export; it intentionally replaces edits to generated shapes, so use the
live editor/export workflow after starting manual design work. Hand-created boards are preserved.
The helpers expect the local workspace metadata and uploaded font/media IDs in `../.local/`.
Those IDs are instance-specific and are not a substitute for the portable `.penpot` file.

After manual edits, export through Penpot or run `Penpot().export(...)` from `api.py` to snapshot
the current live file without regenerating any boards.

## Recover from a backup

Restore on another machine into a fresh checkout. Do not overwrite a running database or
delete an existing workspace to test a backup. The Compose project name is fixed, so starting
a second copy on the same machine would target the existing services.

1. Copy the backup's `compose.yaml` into this directory and `penpot.env` to `.env` (mode 600).
2. From this directory, start only the database:
   `docker compose --env-file .env up -d --wait penpot-postgres`.
3. Restore the dump:
   `docker compose --env-file .env exec -T penpot-postgres pg_restore -U penpot -d penpot --no-owner < /path/to/backup/database.dump`.
4. Restore uploaded assets:
   `docker compose --env-file .env run --rm --no-deps -T --entrypoint tar penpot-backend -xzf - -C /opt/data/assets < /path/to/backup/assets.tar.gz`.
5. Run `python3 manage.py up`, open Penpot, and verify a design and its uploaded images.

Restore the secret key with the data: it is part of the instance configuration.
For portable individual designs, use Penpot's normal `.penpot` export/import instead.

## Upgrade

Take a backup first. Update all five Penpot image versions together, review the matching
upstream Compose example and migration notes, then run `python3 manage.py up`.
Do not change the PostgreSQL major version without migrating its data.
