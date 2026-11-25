# 67slopers design workspace

All app design work belongs here: foundations, screen references, storyboards, explorations,
editable Penpot exports, and review images. Product constraints remain in
[principles](../docs/principles.md); implementation lives in `src/`.

## Rivet brand book

The current brand book is in [`rivet/`](rivet/README.md): the
[PDF](rivet/Rivet-brand-book.pdf), the build scripts that recreate the editable Penpot file, and the
[asset kit](rivet/kit/README.md) (logo masters, tokens, icons, fonts, motion). It was rebuilt from a
clean slate and supersedes the earlier brand exports listed under `exports/rivet-*`.

## Rivet app design

The complete redesign of the app in the Rivet brand is [`rivet/app/`](rivet/app/README.md): Penpot project
**Rivet** → **Rivet — App design** (11 pages, about 140 screens and system boards, light and dark, with a
native library of colours, type styles, tokens and components). The editable export is
[`penpot/rivet-app.penpot`](penpot/rivet-app.penpot); review PNGs and contact sheets are in
[`exports/rivet-app/`](exports/rivet-app/). It replaces the 67slopers designs below as the target look.

## Open Penpot

```bash
python3 design/penpot/manage.py up
```

Open [local Penpot](http://localhost:9002). Docker and Docker Compose are required.
The first start downloads the official Penpot 2.18 images and creates local secrets.
Penpot only listens on this machine, and instance telemetry is disabled.

Penpot needs a local design-tool login. This is separate from the account-free training app.
Email verification is disabled for this local instance; no mail service is configured.
This checkout's login is saved in `design/.local/credentials.json` (owner-readable only).

## Workspace structure

| Folder          | Contents                                                                     |
| --------------- | ---------------------------------------------------------------------------- |
| `foundations/`  | Colours, typography, spacing, components, and design decisions               |
| `screens/`      | References and notes for existing app screens and states                     |
| `flows/`        | Storyboards, navigation maps, and interaction notes                          |
| `explorations/` | Proposed features, starting with MoonBoard support                           |
| `penpot/`       | Local service setup and exported editable `.penpot` files                    |
| `exports/`      | SVG, PNG, and PDF snapshots for review                                       |
| `.local/`       | Live Penpot database, uploaded assets, and local credentials; ignored by Git |
| `backups/`      | Full local backups; ignored by Git                                           |

The local **67slopers** project contains **67slopers — App design**, populated with 75 editable
boards recreated from the app on 8 October 2026, plus the MoonBoard exploration:

1. **01 Foundations** — palette, Geist Mono, shared controls, vector icons, and button components.
2. **02 Current app** — Home, workouts, all ten classic protocols, calendar, sessions, and desktop Home.
3. **03 Builder & boards** — new/edit workflows, inline editors, validation, reordering, board setup, and grips.
4. **04 Timer & recovery** — preparation, hangs, rests, pause, settings, Gen Z playback, completion, and interruption.
5. **05 Sharing & edge states** — QR sharing, camera permission, import, unavailable content, and deletion.
6. **06 Storyboards** — six journeys and notes explaining the reference.
7. **07 MoonBoard & dock** — the MoonBoard draft and the dock navigation: 43 boards, separate
   from the current app. See [the exploration notes](explorations/moonboard/README.md).

The **design system** is on three additional pages at the top of the file: **00.1 Foundations**,
**00.2 UI components**, and **00.3 Training patterns**. It adds 15 reference boards, 29 component
families (155 main components including variants), 87 native tokens, and 15 typography styles.
The complete file has **91 reference boards and 43 exploration boards across 11 pages** (including dock icon studies).

The design system now includes a [paired light/dark color guidance board](foundations/README.md#light-and-dark-appearance). Existing app and component boards remain light references.

[Open the design system](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=83493a27-42b5-5511-8850-15e221286642&board-id=31197271-4bb8-5705-b5f3-2faebcb8410d).
Use **Assets → 67slopers → UI / Training** to reuse components, or **Tokens** to inspect the
system values. [Library guide and code mappings](foundations/README.md).

[Open the current app designs](http://localhost:9002/#/workspace?team-id=aa011e17-f3d4-81b8-8008-ba796c27889b&file-id=3da52804-324a-803a-8008-ba7ae8423fdc&page-id=d52e67c0-39bb-416a-b4b4-a0ce9a9b0398&board-id=3e75ffb9-bbd0-51fe-b2c0-883d0c93962e).
Select a board in Layers and press **Shift+2** to zoom to it, or **Shift+1** to fit the page.

The portable editable file is [`penpot/67slopers.penpot`](penpot/67slopers.penpot).
[Review sheets](exports/) and [individual SVG/PNG boards](exports/current-app/) accompany it.
[The inventory](screens/inventory.json) maps every board to its app route, dimensions, and Penpot ID.

Text, controls, calendar cells, icons, and QR modules are editable. Hangboard artwork and the
gameplay still use bundled app assets. History uses sample data; camera previews are schematic.
Long boards expose scroll content. Main action hotspots work in View mode; cross-page links open
the destination in another preview tab. This is a design reference, not a running app.

Penpot saves live work in its database, not directly into a `.penpot` file. This setup keeps
the database and uploaded assets under `design/.local/penpot/`. Export editable files into
`design/penpot/` after a design review, with matching review images in `design/exports/`.
Those exports can be committed; local database files and secrets cannot.

## Everyday commands

```bash
python3 design/penpot/manage.py status
python3 design/penpot/manage.py logs
python3 design/penpot/manage.py backup
python3 design/penpot/manage.py down
```

Stopping the services preserves designs. Do not delete `.local/` or `penpot/.env`.
The backup command briefly stops the editor and writers, saves a PostgreSQL dump and asset
archive together with the configuration and secret key, then restarts the stopped services.
Backups contain private local data: keep them out of Git and copy them to another disk if needed.
See [recovery instructions](penpot/README.md).

## Work together through MCP

The MCP service is installed. Enabling agent access and creating its persistent key are a
separate setup step; no key is included in the repository.

In Penpot, open **Your account → Integrations → MCP Server**, enable it, and create an MCP key.
Add the provided local server URL to the agent's MCP configuration. Then open a design file
and select **File → MCP Server → Connect**. Keep that Penpot tab open and active while the
agent edits. MCP URLs containing keys belong in local configuration, never in this repository.

Upstream references: [Docker setup](https://help.penpot.app/technical-guide/getting-started/docker/)
and [MCP documentation](https://github.com/penpot/penpot/blob/develop/docs/mcp/index.md).

## Custom dock icon studies

**08 Dock icon studies** adds six Hang and MoonBoard candidates, each with Regular and Fill
variants, actual-size dock previews, optical checks, and editable vector masters.
[Open the comparison and export guide](explorations/dock-icons/README.md).
