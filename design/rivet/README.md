# Rivet brand book

A clean-slate brand for Rivet (formerly 67slopers), built in the local Penpot instance
(`python3 design/penpot/manage.py up`, then http://localhost:9002 → project **Rivet** →
**Rivet — Brand Book**). Login: `design/.local/credentials.json`.

- `Rivet-brand-book.pdf`: the book, 74 spreads, exported from Penpot.
- `Rivet-brand-book.penpot`: the editable Penpot file (local only, not committed: it passes 100 MB; export it with `Doc().p.export(...)` from `tools/pp.py`). Pages: **02 Rivet Brand Book**, **01 Explorations**
  (marks, rounded type, palettes, photography), **03 Posters** (print-size artboards), **04 Icons**.
- `kit/`: logo masters, colour tokens, custom icons, Nunito and motion. See `kit/README.md`.

Decisions: name Rivet ("riveted": total focus), the **Pitch** symbol (three equal bars, each a step
higher), **Nunito** (wordmark drawn from Nunito Black with a bar for the i-dot), the **Alpenglow**
palette (Night, Snow, Glow, Glacier, Dusk, Paper, Granite, Stone), "Climb Harder.", quiet prints
(photograph, thin border, small lockup), Ink pill buttons. Glow is the colour of the hang: the Hang
screen, the app icon and the symbol on Night, nowhere else. The hangboard product is still open.

## Rebuilding

Everything is generated; edit the scripts, not the shapes.

```bash
V=design/.local/venv/bin/python   # venv: fonttools, pillow, numpy, skia-python, pypdf
cd design/rivet/tools
$V fonts_upload.py                # team fonts (fonts/)
$V explore.py                     # page 01
$V posters.py                     # page 03 + design/.local/rivet/posters/*.png
$V mockup.py                      # photo mockups in design/.local/rivet/mock/
$V build_all.py --render          # page 02 (two passes for contents page numbers) + PNG previews
$V icons_page.py                  # page 04
$V kit.py                         # kit/
$V pdf.py                         # Rivet-brand-book.pdf
```

- `pp.py` writes editable Penpot shapes over the RPC API; `brand.py` holds the palette, Pitch geometry
  and the wordmark outline; `ch_*.py` are the chapters; `screens.py` the app screens.
- `mockup.py` composites the artwork into real photos of blank products (tees, cap, book, card,
  frames, board). Products without a usable blank photo (crimp block, chalk bags, sign) are drawn.
- `../icons/make_icons.py` draws the custom hangboard and spray-board icons on Phosphor's 256 grid
  and writes non-zero-winding paths to `../icons/custom/`.
- `../motion/`: `build.py` writes the loading and startup SVGs, `film.html` is the 8-second brand
  film, `record.mjs` captures its frames, `index.html` previews the animations.
- Photos are placeholders from Wikimedia Commons and Flickr (`photos.py`: `sheet`/`get` for Commons,
  `fsheet`/`fget` for Flickr; CC BY, BY-SA, CC0 and public domain only), credited on the credits
  spread and in `design/.local/rivet/photos/credits.json`. They are not committed.
