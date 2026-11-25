"""Contact sheets of the rendered boards, one per page, for review (design/exports/rivet-app/sheets/)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / 'exports' / 'rivet-app'
FONT = Path(__file__).resolve().parents[1] / 'fonts' / 'Nunito-800.ttf'


def sheet(prefix, scale=0.5, maxw=3600):
    files = sorted(OUT.glob(f'{prefix}-*.png'))
    if not files: return
    ims = [(f.stem, Image.open(f).convert('RGB')) for f in files]
    ims = [(n, im.resize((int(im.width * scale), int(im.height * scale)))) for n, im in ims]
    font = ImageFont.truetype(str(FONT), 18)
    rows, row, x = [], [], 0
    for n, im in ims:
        if x + im.width > maxw and row: rows.append(row); row, x = [], 0
        row.append((n, im)); x += im.width + 30
    rows.append(row)
    W = max(sum(im.width + 30 for _, im in r) for r in rows) + 30
    H = sum(max(im.height for _, im in r) + 70 for r in rows) + 30
    S = Image.new('RGB', (W, H), (226, 224, 218)); d = ImageDraw.Draw(S)
    y = 30
    for r in rows:
        x = 30
        for n, im in r:
            d.text((x, y), n, fill=(20, 26, 46), font=font); S.paste(im, (x, y + 34)); x += im.width + 30
        y += max(im.height for _, im in r) + 70
    (OUT / 'sheets').mkdir(exist_ok=True)
    S.save(OUT / 'sheets' / f'{prefix}.png', optimize=True)
    print(prefix, S.size)


if __name__ == '__main__':
    for p in sys.argv[1:] or ['cover', 'found', 'comp', 'home', 'builder', 'timer', 'climb', 'log', 'share', 'dark', 'flows']:
        sheet(p, 0.35 if p in ('cover', 'flows', 'found', 'comp') else 0.5)
