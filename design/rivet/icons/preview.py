"""Preview sheet: custom icons next to Phosphor references at several sizes, plus a dock mock."""
import subprocess, io, sys
from pathlib import Path
from PIL import Image, ImageDraw
H = Path(__file__).parent
def ras(p, size, color):
    s = p.read_text().replace('currentColor', color)
    return Image.open(io.BytesIO(subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size)], input=s.encode(), capture_output=True, check=True).stdout)).convert('RGBA')
rows = [('regular', ''), ('fill', '-fill')]
names = [('custom', 'hangboard'), ('custom', 'spray-wall'), ('ref', 'person-simple'), ('ref', 'barbell'), ('ref', 'mountains'), ('ref', 'timer')]
W = 1600; im = Image.new('RGB', (W, 1000), '#F8F6F3'); d = ImageDraw.Draw(im)
for r, (wn, suf) in enumerate(rows):
    y0 = 30 + r * 330
    d.text((30, y0), wn, fill='#141A2E')
    for i, (folder, n) in enumerate(names):
        x = 30 + i * 255
        p = H / folder / f'{n}{suf}.svg'
        big = ras(p, 160, '#141A2E'); im.paste(big, (x, y0 + 20), big)
        for j, s in enumerate([48, 24, 16]):
            sm = ras(p, s, '#141A2E'); im.paste(sm, (x + j * 64, y0 + 200 + (48 - s)), sm)
        d.text((x, y0 + 270), n, fill='#6B6E73')
# dock mock
y = 720; d.rounded_rectangle((W / 2 - 330, y, W / 2 + 330, y + 120), 60, fill='#141A2E')
dock = [('ref', 'house'), ('custom', 'hangboard'), ('custom', 'spray-wall'), ('ref', 'calendar-blank'), ('ref', 'chart-bar')]
for i, (folder, n) in enumerate(dock):
    x = W / 2 - 300 + i * 124
    if i == 1: d.rounded_rectangle((x - 8, y + 16, x + 96, y + 104), 44, fill='#2E3650')
    sm = ras(H / folder / f'{n}{"-fill" if i == 1 else ""}.svg', 56, '#F8F6F3' if i == 1 else '#8C92A6'); im.paste(sm, (int(x + 16), y + 32), sm)
im.save(sys.argv[1])
