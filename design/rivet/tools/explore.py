"""Page 01 Explorations: mark directions, rounded type, palettes, photography mood."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pp import Doc, Board, LOCAL
from marks import MARKS, draw

PH = LOCAL / 'photos'
d = Doc(); pg = d.page('01 Explorations')
PAPER, INK, MUTE = '#F6F4EF', '#141517', '#6D6B66'
W = 1920

def header(b, num, title, sub):
    b.text(num, 96, 80, size=15, font='NationalPark', weight=600, color=MUTE, ls=1.5, upper=True)
    b.text(title, 96, 112, size=56, font='NationalPark', weight=700, color=INK, lh=1.05, ls=-1)
    b.text(sub, 96, 188, w=900, size=20, font='NationalPark', weight=400, color=MUTE, lh=1.45)

# ---------- A. Marks ----------
keys = list(MARKS)
b = Board(d, pg, 'x-marks', 'A · Mark directions', 0, 0, W, 1500, PAPER)
header(b, 'Exploration A', 'Six ways to draw Rivet', 'Riveted means total focus. Each mark is shown big, on a colour tile like an app icon, tiny like a cap embroidery, and beside the name.')
cw, ch = 560, 540
for i, k in enumerate(keys):
    col, row = i % 3, i // 3
    x, y = 96 + col * (cw + 48), 300 + row * (ch + 48)
    b.rect(x, y, cw, ch, '#FFFFFF', r=28, name=f'Card / {MARKS[k]["name"]}')
    draw(b, k, x + 48, y + 48, 220, INK)
    tiles = [('#1F3B2D', '#F6F4EF'), ('#C8714E', '#141517'), ('#141517', '#F6F4EF')]
    for j, (bg, fg) in enumerate(tiles):
        tx = x + 320 + (j % 2) * 108; ty = y + 48 + (j // 2) * 108
        b.rect(tx, ty, 92, 92, bg, r=22, name='App tile')
        draw(b, k, tx + 20, ty + 20, 52, fg)
    draw(b, k, x + 428 + 20, y + 156 + 34, 24, INK)
    b.text(f'0{i+1}', x + 48, y + 312, size=14, font='NationalPark', weight=600, color=MUTE, ls=1)
    b.text(MARKS[k]['name'], x + 48, y + 334, size=34, font='NationalPark', weight=700, color=INK)
    b.text(MARKS[k]['note'], x + 48, y + 382, w=cw - 96, size=17, font='NationalPark', weight=400, color=MUTE, lh=1.4)
    draw(b, k, x + 48, y + 462, 40, INK)
    b.text('Rivet', x + 100, y + 458, size=40, font='NationalPark', weight=700, color=INK, lh=1.15, ls=-0.5)

# ---------- B. Type ----------
faces = [('NationalPark', 'National Park', 800), ('Nunito', 'Nunito', 800), ('VarelaRound', 'Varela Round', 400),
         ('MPLUSRounded1c', 'M PLUS Rounded 1c', 800), ('ZenMaruGothic', 'Zen Maru Gothic', 700), ('Quicksand', 'Quicksand', 700),
         ('Rubik', 'Rubik', 700), ('UbuntuSans', 'Ubuntu Sans', 700), ('KosugiMaru', 'Kosugi Maru', 400)]
b = Board(d, pg, 'x-type', 'B · Rounded type', 0, 1600, W, 1860, PAPER)
header(b, 'Exploration B', 'Rounded type, nine ways', 'Same words in every face: the name, the line, a timer and a sentence. Look at the R, the t and the digits.')
cw, ch = 560, 470
for i, (key, label, heavy) in enumerate(faces):
    col, row = i % 3, i // 3
    x, y = 96 + col * (cw + 48), 300 + row * (ch + 40)
    b.rect(x, y, cw, ch, '#FFFFFF', r=28, name=f'Card / {label}')
    b.text(f'{i+1:02d}  {label}', x + 40, y + 36, size=15, font=key, weight=heavy if heavy < 700 else 500 if key != 'KosugiMaru' else 400, color=MUTE)
    b.text('Rivet', x + 36, y + 70, size=112, font=key, weight=heavy, color=INK, lh=1.05, ls=-2)
    b.text('Climb Harder', x + 40, y + 200, size=34, font=key, weight=heavy, color=INK, ls=-0.3)
    b.text('0:07', x + 360, y + 196, size=56, font=key, weight=heavy, color='#C8714E', lh=1)
    weights = sorted(int(p.stem.rsplit('-', 1)[1]) for p in (Path(__file__).parents[1] / 'fonts').glob(key + '-*.ttf'))
    b.text('Three sets of six hangs. Rest three minutes between sets. You will get them next time.',
           x + 40, y + 270, w=cw - 80, size=18, font=key, weight=weights[0], color='#3B3A37', lh=1.5)
    b.text('Hang  ·  Rest  ·  Set 2 of 5', x + 40, y + 380, size=16, font=key, weight=500 if 500 in weights else weights[0], color=MUTE, ls=0.5)

# ---------- C. Palettes ----------
palettes = [
    ('Lichen', 'Green leads. Natural, calm, outdoors.', [('Paper', '#F5F3EE'), ('Ink', '#15171A'), ('Lichen', '#A3C08F'), ('Pine', '#1F3B2D'), ('Clay', '#C8714E'), ('Stone', '#D9D6CF')], '#A3C08F', '#F5F3EE', '#1F3B2D'),
    ('Clay', 'Warm earth leads. Desert sandstone, sun.', [('Sand', '#F3EDE4'), ('Ink', '#1A1614'), ('Clay', '#D47A55'), ('Ochre', '#E4B660'), ('Sage', '#9DAA8C'), ('Umber', '#4A2E22')], '#D47A55', '#F3EDE4', '#4A2E22'),
    ('Signal', 'Monochrome, plus one colour that means go.', [('White', '#FFFFFF'), ('Ink', '#0E0F11'), ('Graphite', '#3A3D42'), ('Fog', '#E9EAEC'), ('Signal', '#C8F03C'), ('Steel', '#9EA3AA')], '#C8F03C', '#E9EAEC', '#0E0F11'),
    ('Alpenglow', 'Wildcard: the last light on a summit.', [('Snow', '#F7F5F4'), ('Night', '#141A2E'), ('Glow', '#F28C6E'), ('Dusk', '#8F88CC'), ('Glacier', '#C3DCE5'), ('Granite', '#6B6E73')], '#F28C6E', '#C3DCE5', '#141A2E'),
]
b = Board(d, pg, 'x-colour', 'C · Palettes', 0, 3560, W, 1720, PAPER)
header(b, 'Exploration C', 'Four colour worlds', 'Each palette at work: swatches, the timer filling with the hang colour, the rest screen, a primary button and a poster band.')
for i, (name, note, sw, hang, rest, deep) in enumerate(palettes):
    x, y = 96 + (i % 2) * 888, 300 + (i // 2) * 700
    b.rect(x, y, 840, 652, '#FFFFFF', r=28, name='Card / ' + name)
    b.text(name, x + 40, y + 36, size=34, font='NationalPark', weight=700, color=INK)
    b.text(note, x + 40, y + 84, w=380, size=17, font='NationalPark', color=MUTE, lh=1.4)
    for j, (sn, hx) in enumerate(sw):
        sx, sy = x + 40 + (j % 3) * 124, y + 150 + (j // 3) * 150
        b.rect(sx, sy, 112, 96, hx, r=16, stroke='#00000014', name='Swatch / ' + sn)
        b.text(sn, sx, sy + 104, size=15, font='NationalPark', weight=600, color=INK)
        b.text(hx, sx, sy + 124, size=13, font='NationalPark', color=MUTE)
    # phones
    for k, (fill, word, t) in enumerate([(hang, 'Hang', '0:07'), (rest, 'Rest', '2:41')]):
        px, py = x + 440 + k * 196, y + 36
        b.rect(px, py, 180, 380, fill, r=30, stroke='#00000014', name='Timer / ' + word)
        b.text(word, px + 20, py + 28, size=18, font='NationalPark', weight=700, color=INK)
        b.text('Set 2 of 5', px + 20, py + 52, size=12, font='NationalPark', weight=500, color=INK, opacity=1) if False else b.text('Set 2 of 5', px + 20, py + 52, size=12, font='NationalPark', weight=500, color='#15171A99')
        b.text(t, px + 14, py + 150, size=64, font='NationalPark', weight=800, color=INK, ls=-2, lh=1)
        b.rect(px + 20, py + 340, 140, 6, '#15171A26', r=3)
        b.rect(px + 20, py + 340, 140 * (0.6 if k == 0 else 0.15), 6, INK, r=3)
    # button + poster band
    b.rect(x + 40, y + 470, 220, 56, INK, r=28, name='Button / primary')
    b.text('Start session', x + 40, y + 487, w=220, size=17, font='NationalPark', weight=600, color='#FFFFFF', align='center')
    b.rect(x + 276, y + 470, 140, 56, None, r=28, stroke='#15171A33', name='Button / secondary')
    b.text('Change', x + 276, y + 487, w=140, size=17, font='NationalPark', weight=600, color=INK, align='center')
    b.rect(x + 40, y + 550, 760, 70, deep, r=14, name='Poster band')
    draw(b, 'pitch', x + 64, y + 567, 36, hang)
    b.text('Rivet', x + 112, y + 566, size=28, font='NationalPark', weight=700, color=sw[0][1])
    b.text('Climb Harder', x + 600, y + 572, w=176, size=18, font='NationalPark', weight=500, color=sw[0][1], align='right')

# ---------- D. Photography mood ----------
b = Board(d, pg, 'x-photo', 'D · Photography', 0, 5380, W, 1500, '#101113')
b.text('Exploration D', 96, 80, size=15, font='NationalPark', weight=600, color='#9A9893', ls=1.5, upper=True)
b.text('Just you and the rock', 96, 112, size=56, font='NationalPark', weight=700, color='#F6F4EF', ls=-1)
b.text('Exposure and scale, a grand place, a person small in it. Placeholders from Wikimedia Commons, credited in the book.', 96, 188, w=1000, size=20, font='NationalPark', color='#9A9893', lh=1.45)
grid = [('layback-corner', 96, 300, 1100, 640), ('alpenglow-spires', 1220, 300, 604, 310), ('crack-from-above', 1220, 630, 604, 310),
        ('pink-peak', 96, 964, 430, 440), ('exposure-sea', 550, 964, 300, 440), ('cloud-sea', 874, 964, 470, 440), ('golden-spires', 1368, 964, 456, 440)]
for name, x, y, w, h in grid:
    b.image(PH / f'{name}.jpg', x, y, w, h, r=18)
b.rect(96, 300, 1100, 640, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0.5, 'startY': 0.5, 'endX': 0.5, 'endY': 1, 'width': 1,
       'stops': [{'color': '#000000', 'opacity': 0, 'offset': 0}, {'color': '#000000', 'opacity': 0.55, 'offset': 1}]}}, r=18, name='Scrim')
draw(b, 'pitch', 140, 852, 44, '#F6F4EF')
b.text('Rivet', 196, 850, size=40, font='NationalPark', weight=700, color='#F6F4EF', lh=1.15)
b.text('Climb Harder', 900, 862, w=260, size=22, font='NationalPark', weight=500, color='#F6F4EFCC', align='right')

d.publish()
out = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if out:
    for bb in d.boards: d.render(bb, out / f'{bb.key}.png', 0.5)
