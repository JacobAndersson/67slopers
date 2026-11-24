from pathlib import Path
import math
from book import *
from pp import Scaled, shadow
from brand import pitch_parts, wordmark_path
R3 = LOCAL / 'r3d'
N = C['night']

PRINT_SERIES = [('ridge', 'golden-spires'), ('corner', 'granite-corner'), ('aiguilles', 'aiguilles')]

def print_poster(p, photo, line='Climb Harder.'):
    """Editorial print: full photo in a thin Snow border, small lockup low-left. 1200 x 1800."""
    p.rect(0, 0, 1200, 1800, '#FFFFFF')
    p.image(PH / f'{photo}.jpg', 48, 48, 1104, 1704)
    p.rect(48, 1300, 1104, 452, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0.5, 'startY': 0, 'endX': 0.5, 'endY': 1, 'width': 1,
           'stops': [{'color': '#0B0F1C', 'opacity': 0, 'offset': 0}, {'color': '#0B0F1C', 'opacity': 0.55, 'offset': 1}]}})
    lockup(p, 110, 1596, 34, ON_DARK)
    p.text(line, 112, 1660, size=20, font=F, weight=700, color='#F8F6F3CC')

POSTER_PHOTO = {'summit': 'alpenglow-spires', 'layback': 'layback-corner', 'allez': 'mist-snow', 'peak': 'pink-peak'}

def poster(p, kind):
    """1200 x 1800 poster: every poster is a quiet print."""
    print_poster(p, POSTER_PHOTO[kind])

def series_poster(q, verb, ph_):
    """Campaign-series print: the quiet print, with the verb as its line."""
    print_poster(q, ph_, f'{verb} Harder.')

SERIES = [('Hang', 'chalked-fingers'), ('Rest', 'font-rest'), ('Climb', 'layback-corner')]

def campaign(p, w, h, story=False, b_name=False):
    """Launch campaign, quiet: the photo does the talking; small lockup and line low-left."""
    if story: p.image(PH / 'layback-corner.jpg', -0.12 * h * 1.5, 0, h * 1.5, h, name='Campaign photo')
    else: p.image(PH / 'layback-corner.jpg', 0, 0, w, h, name='Render / campaign' if b_name else 'Campaign photo')
    p.rect(0, h * 0.6, w, h * 0.4, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0.5, 'startY': 0, 'endX': 0.5, 'endY': 1, 'width': 1,
           'stops': [{'color': '#0B0F1C', 'opacity': 0, 'offset': 0}, {'color': '#0B0F1C', 'opacity': 0.6, 'offset': 1}]}}, name='Render / scrim' if b_name else 'Scrim')
    u = min(w, h) / 1080
    lockup(p, 90 * u, h - 170 * u, 44 * u, ON_DARK)
    p.text('Climb Harder.', 92 * u, h - 96 * u, size=24 * u, font=F, weight=700, color='#F8F6F3CC')

def tee(b, x, y, s, color, ink, back=False):
    d = 'M330 60 Q500 130 670 60 L900 150 Q960 260 930 360 L790 330 L790 980 Q500 1010 210 980 L210 330 L70 360 Q40 260 100 150 Z'
    o = b.path(d, x, y, s, fill=color, name='Tee'); shadow(o, 0, 14 * s, 40 * s, '#0B0F1C', 0.25)
    b.path('M330 60 Q500 150 670 60 Q500 110 330 60 Z' if back else 'M330 60 Q500 190 670 60 Q500 140 330 60 Z', x, y, s, fill='#0000001F', name='Collar')
    if back:
        b.text('Climb\nHarder.', x + 270 * s, y + 280 * s, size=118 * s, font=F, weight=900, color=ink, lh=0.95, ls=-3 * s)
        pitch(b, x + 270 * s, y + 560 * s, 120 * s, ink)
    else:
        pitch(b, x + 600 * s, y + 250 * s, 90 * s, ink)

def build(bk):
    bk.opener('07', 'print', 'Print', 'Posters worth hanging\neven with the logo taken off.', 'mist-snow')
    # 33 Posters --------------------------------------------------------------
    b = bk.spread(33, 'posters', 'Posters', '07 Print  ·  Posters', bg=C['stone'])
    for i, kind in enumerate(['summit', 'layback', 'allez', 'peak']):
        x = M + i * 430
        with b.frame(x, 170, 400, 600, C['snow'], name='Poster / ' + kind) as fr:
            poster(Scaled(b, x, 170, 400 / 1200), kind)
        shadow(fr, 0, 20, 50, '#0B0F1C', 0.25)
    notes = [('Beautiful first', 'Worth hanging with the logo taken off. Lockup centred at the foot, the line small beneath.'), ('Borders welcome', 'A Snow border turns a photo into a print: 30 mm on a 50 × 70 cm poster.'),
             ('Same quiet voice', 'Every poster follows one recipe, so a wall of them reads as one series.'), ('Lockup low, small', 'Lockup in Snow at the lower left; the line beneath it at a fifth of the size.')]
    for i, (t, s) in enumerate(notes):
        x = M + i * 430
        b.text(t, x, 830, size=24, font=F, weight=900, color=N)
        bk.body(b, s, x, 868, w=380, size=17)

    # Print series (flat) ------------------------------------------------------------
    b = bk.spread(34, 'posters-wall', 'Print series', '07 Print  ·  Print series', bg=C['snow'])
    bk.h2(b, 'Quiet prints', M, 150, size=56)
    bk.body(b, 'Big, cool light on big rock. A thin Snow border, the lockup small in the corner, nothing else. Shown flat, as they ship.', M, 230, w=1000)
    for j, (k, ph_) in enumerate(PRINT_SERIES):
        x = M + j * 570
        b.rect(x, 340, 540, 740, '#E7E4DE', name='Panel')
        with b.frame(x + 70, 380, 400, 600, '#FFFFFF', name='Print / ' + k) as fr:
            print_poster(Scaled(b, x + 70, 380, 400 / 1200), ph_)
        shadow(fr, 0, 6, 18, '#0B0F1C', 0.18)

    # Flagship campaign ---------------------------------------------------------------
    b = bk.spread(0, 'campaign', 'Launch campaign', None, bg=C['night'], dark=True, folio=False)
    campaign(Scaled(b, 0, 0, 1), W, H, b_name=True)
    bk.label(b, 'Launch campaign  ·  billboard 6 × 3 m, social, app store', 1240, 1124, color=ON_DARK_MUTED)

    # Campaign in use -------------------------------------------------------------------
    b = bk.spread(0, 'campaign-use', 'Campaign in use', '07 Print  ·  Campaign in use', bg=C['night'], dark=True)
    bk.h2(b, 'One idea, every size', M, 150, size=56)
    bk.body(b, 'The photograph carries the campaign. The lockup and line sit small at the lower left in every format; only the crop moves.', M, 230, w=900, color=ON_DARK_MUTED)
    # billboard
    bx, by, bw, bh = M, 400, 1000, 500
    b.rect(bx - 14, by - 14, bw + 28, bh + 28, '#2E3650', r=6, name='Billboard frame')
    with b.frame(bx, by, bw, bh, C['night'], name='Billboard'):
        campaign(Scaled(b, bx, by, bw / 1920), 1920, 960)
    for lx in (bx + 200, bx + bw - 230): b.rect(lx, by + bh + 14, 30, 160, '#2E3650', name='Leg')
    bk.label(b, 'Billboard  ·  6 × 3 m', bx + bw - 200, by + bh + 40, color=ON_DARK)
    # story
    sx, sy = 1220, 330
    with b.frame(sx, sy, 300, 534, C['night'], r=24, name='Story'):
        campaign(Scaled(b, sx, sy, 300 / 1080), 1080, 1920, story=True)
    bk.label(b, 'Story  ·  9:16', sx, sy + 554, color=ON_DARK)
    # store feature
    fx, fy = 1560, 330
    with b.frame(fx, fy, 240, 534, C['night'], r=24, name='Store'):
        campaign(Scaled(b, fx, fy, 240 / 1080), 1080, 2400, story=True)
    bk.label(b, 'Store feature', fx, fy + 554, color=ON_DARK)

    # Campaign series ------------------------------------------------------------------
    b = bk.spread(0, 'campaign-series', 'Campaign series', '07 Print  ·  Campaign series')
    bk.h2(b, 'Harder, three ways', M, 150, size=56)
    bk.body(b, 'One line, one verb, one season. Each poster swaps the verb and keeps everything else. The verb lives in the small line under the lockup. “Rest Harder.” carries what we believe most: recovery is training.', M, 230, w=1000)
    for i_, (verb, ph_) in enumerate(SERIES):
        x = M + i_ * 570
        b.rect(x, 300, 540, 740, '#E7E4DE', name='Panel')
        with b.frame(x + 70, 340, 400, 600, '#FFFFFF', name='Print / ' + verb) as fr:
            series_poster(Scaled(b, x + 70, 340, 400 / 1200), verb, ph_)
        shadow(fr, 0, 6, 18, '#0B0F1C', 0.18)
        bk.label(b, ['Season opener', 'Mid-season', 'Before the trip'][i_], x + 70, 966)

    # Brand film -------------------------------------------------------------------------
    b = bk.spread(0, 'film', 'Brand film', '07 Print  ·  Brand film', bg=C['night'], dark=True)
    bk.h2(b, 'Eight seconds', M, 150, size=56)
    bk.body(b, 'The launch film opens every channel: pre-roll, the website hero, the store preview. Bars rise, the name settles, then the climb holds the screen, and the lockup and line arrive small, like on the prints. Master: motion/film.html.', M, 230, w=1100, color=ON_DARK_MUTED)
    shots = [(17, '0.7 s', 'Bars rise on Night'), (43, '1.8 s', 'The name settles'), (79, '3.3 s', 'Cut to the climb'),
             (98, '4.1 s', 'The climb holds'), (120, '5.0 s', 'Lockup arrives, low left'), (182, '7.6 s', '“Climb Harder.”')]
    for j, (f, t, cap_) in enumerate(shots):
        x, y = M + (j % 3) * 570, 360 + (j // 3) * 380
        b.image(LOCAL / 'film' / f'story-{f:03d}.png', x, y, 540, 304, r=16)
        b.rect(x, y, 540, 304, None, r=16, stroke='#FFFFFF33', sw=1.5, name='Frame')
        b.text(t, x, y + 318, size=15, font=F, weight=800, color=ON_DARK)
        b.text(cap_, x + 80, y + 318, size=15, font=F, weight=600, color=ON_DARK_MUTED)

    # 35 Stationery ------------------------------------------------------------------
    b = bk.spread(35, 'stationery', 'Stationery', '07 Print  ·  Business cards', bg=C['paper'])
    b.image(LOCAL / 'mock' / 'card.jpg', 0, 0, 1400, H, name='Photo / cards')
    b.rect(1400, 0, W - 1400, H, C['paper'], name='Panel')
    bk.label(b, 'Business cards', 1440, 220, color=C['glow'])
    bk.h2(b, 'Night front,\nSnow back', 1440, 260, size=56)
    bk.body(b, '85 × 55 mm, 600 gsm uncoated, Snow edges. The front carries the symbol in Glow on Night; the back carries the person.', 1440, 420, w=400)
    b.rect(1440, 600, 340, 220, N, r=10, name='Card front'); pitch(b, 1440 + 128, 600 + 68, 84, C['glow'])
    b.rect(1440, 840, 340, 220, C['snow'], r=10, stroke='#141A2E1A', name='Card back')
    lockup(b, 1466, 864, 14, N)
    b.text('Ana Lindqvist', 1466, 960, size=19, font=F, weight=900, color=N); b.text('Head of Training', 1466, 984, size=12, font=F, weight=600, color=MUTED)
    b.text('ana@rivet.training', 1466, 1024, size=11, font=F, weight=700, color=N)

    # 36 Book --------------------------------------------------------------------------
    b = bk.spread(36, 'book', 'Training book', '07 Print  ·  Field notes book', bg=C['glacier'])
    b.image(LOCAL / 'mock' / 'book.jpg', 720, 0, W - 720, H, name='Photo / book')
    bk.label(b, 'Field Notes', M, 220, color=N)
    bk.h2(b, 'Unstuck', M, 260, size=72)
    bk.body(b, 'Our first book collects interviews with forty climbers at every level about how they broke a plateau. Not one person’s schedule: the patterns across many.\n\nCovers: a single grand photograph under a Night band. Title in Nunito Black, the symbol in Glow, nothing else.', M, 380, w=480, color=N)

def build_goods(bk):
    bk.opener('08', 'goods', 'Gear & Goods', 'Made carefully, marked quietly,\nbuilt to last for years.', None, bg=C['paper'])
    # The range (hero) --------------------------------------------------------------
    b = bk.spread(0, 'range', 'The Rivet range', None, bg='#EBE4DA', folio=False)
    bk.label(b, 'The Rivet range', M, 96, color=C['night'])
    b.text('Print, tee, cap, book.\nNothing you don’t need.', M, 136, w=900, size=52, font=F, weight=900, color=C['night'], lh=1.05, ls=-1.2)
    for j, (f, x, y, w, h) in enumerate([('BOARD', M, 320, 900, 740), ('tee-front.jpg', M + 930, 320, 360, 360), ('cap.jpg', M + 1320, 320, 360, 360),
                                          ('book.jpg', M + 930, 700, 360, 360), ('tee-back.jpg', M + 1320, 700, 360, 360)]):
        if f == 'BOARD':
            b.rect(x, y, w, h, '#E7E4DE', r=18)
            with b.frame(x + 250, y + 50, 400, 600, '#FFFFFF', name='Print') as fr: print_poster(Scaled(b, x + 250, y + 50, 400 / 1200), 'golden-spires')
            continue
        b.image(LOCAL / 'mock' / f, x, y, w, h, r=18, name='Photo mockup')

    # 37 Hangboard ------------------------------------------------------------------------
    b = bk.spread(37, 'hangboard', 'Hangboard', '08 Gear & Goods  ·  Hangboard', bg='#E8E2D9')
    k = 1.9; ox = (W - 580 * k) / 2; oy = 250
    sh = b.rect(ox + 10, oy + 14, 580 * k - 20, 218 * k, '#00000000', r=18, name='Shadow base'); shadow(sh, 0, 24, 60, '#3A2A1C', 0.35)
    b.rect(ox + 10, oy + 14, 580 * k - 20, 218 * k, '#8E7357', r=18, name='Back')
    parts = [('slab', 52), ('slot', 28), ('slab', 32), ('slot', 22), ('slab', 32), ('slot', 20), ('slab', 36)]
    y = oy
    for kind, hh in parts:
        h_ = hh * k
        if kind == 'slab': b.rect(ox, y, 580 * k, h_, '#E6CFAE', r=18 if y == oy else 12, name='Rail'); b.rect(ox, y + h_ - 3, 580 * k, 3, '#C9AE88', name='Rail shade')
        else: b.rect(ox + 10, y, 580 * k - 20, h_, '#6F5640', name='Edge')
        y += h_
    for dx in (-110, 110): b.rect(ox + (290 + dx - 7) * k, oy + 52 * k, 14 * k, 28 * k, '#E6CFAE', r=6, name='Divider')
    for dx in (-200, -60, 60, 200): b.rect(ox + (290 + dx - 7) * k, oy + 164 * k, 14 * k, 20 * k, '#E6CFAE', r=6, name='Divider')
    lockup(b, ox + 290 * k - 56, y - 36 * k + 22, 18, '#7A5C3E')
    bk.label(b, 'The Rivet Board', M, 820, color=C['glow'])
    bk.h2(b, 'A jug and three edges', M, 856, size=48)
    bk.body(b, 'Solid beech. Below the jug, three edges, each a step shallower: 30, 20 and 15 mm. The lockup is laser-burned into the bottom rail, small enough to feel like a maker’s mark.', 1000, 830, w=800, color=N, size=19)

    # Technical drawing -------------------------------------------------------------
    b = bk.spread(0, 'board-drawing', 'Hangboard drawing', '08 Gear & Goods  ·  Rivet Board, drawing')
    bk.h2(b, 'Rivet Board  ·  RB-01', M, 150, size=56)
    bk.body(b, 'Solid European beech, oiled. 580 × 218 × 50 mm, 2.9 kg. Edges sanded to a 6 mm radius. Logo laser-engraved 0.4 mm deep, 120 mm wide.', M, 230, w=760, size=19)
    k = 1.3; ox, oy = M, 440         # front elevation, mm -> px (uniform scale)
    parts = [('slab', 52), ('slot', 28, 30), ('slab', 32), ('slot', 22, 20), ('slab', 32), ('slot', 20, 15), ('slab', 36)]
    y = oy; L = '#141A2E'
    for p in parts:
        h = p[1] * k
        if p[0] == 'slab': b.rect(ox, y, 580 * k, h, '#FFFFFF', r=6 if y == oy else 3, stroke=L, sw=1.5, name='Slab')
        else:
            b.rect(ox, y, 580 * k, h, '#E4E0DA', stroke=L, sw=1, name='Slot')
        y += h
    W0 = 580 * k
    # pocket dividers, as on the board
    yy0 = oy + (52) * k
    for dx in (-110, 110): b.rect(ox + (290 + dx - 7) * k, yy0, 14 * k, 28 * k, '#FFFFFF', stroke=L, sw=1, name='Divider')
    yy2 = oy + (52 + 28 + 32 + 22 + 32) * k
    for dx in (-200, -60, 60, 200): b.rect(ox + (290 + dx - 7) * k, yy2, 14 * k, 20 * k, '#FFFFFF', stroke=L, sw=1, name='Divider')
    def dim(x1, y1, x2, y2, t, vertical=False):
        b.rect(x1, y1, (x2 - x1) or 1.2, (y2 - y1) or 1.2, C['granite'], name='Dimension')
        if vertical: b.text(t, x1 + 12, (y1 + y2) / 2 - 10, size=15, font=F, weight=800, color=C['night'])
        else: b.text(t, (x1 + x2) / 2 - 30, y1 - 26, w=60, size=15, font=F, weight=800, color=C['night'], align='center')
    dim(ox, oy - 24, ox + W0, oy - 24, '580')
    dim(ox + W0 + 24, oy, ox + W0 + 24, y, '218', vertical=True)
    lockup(b, ox + W0 / 2 - 60, y - 28, 14, C['night'])
    bk.label(b, 'Front elevation', ox, y + 30)
    # section profile
    sx, sy = 1320, 380; k2 = 2.6
    yy = sy
    for p in parts:
        h = p[1] * k2
        d = 50 if p[0] == 'slab' else 50 - p[2]
        b.rect(sx + (50 - d) * k2, yy, d * k2, h, '#FFFFFF' if p[0] == 'slab' else '#E4E0DA', r=5 if p[0] == 'slab' else 0, stroke=L, sw=1.5, name='Section')
        if p[0] == 'slot': b.text(f"{p[2]} mm", sx + 50 * k2 + 20, yy + h / 2 - 10, size=16, font=F, weight=800, color=C['night'])
        yy += h
    b.rect(sx + 50 * k2, sy - 10, 2, yy - sy + 20, L, name='Wall line')
    bk.label(b, 'Section  ·  edge depths', sx, yy + 30)
    bk.body(b, 'Each edge is a step shallower than the one above: the Pitch symbol, made into a board.', sx, yy + 66, w=460, size=17)

    # 38 Crimp block -----------------------------------------------------------------------
    b = bk.spread(38, 'crimp', 'Crimp block', '08 Gear & Goods  ·  Crimp block & packaging', bg=C['paper'])
    # crimp block, front elevation and box, drawn
    L = C['night']; k = 6
    bx, by = M + 40, 300
    b.rect(bx, by, 100 * k, 60 * k, '#E9D8BF', r=24, stroke=L, sw=2, name='Block')
    for yy, hh in [(12, 6), (27, 5), (41, 4)]:
        b.rect(bx, by + yy * k, 100 * k, hh * k, '#B89C78', stroke=L, sw=1.2, name='Edge')
    b.ellipse(bx + 50 * k - 30, by - 50, 60, 60, None, stroke='#9C9EA2', sw=8, name='Eye')
    for j, (t, yy) in enumerate([('20 mm', 12), ('15 mm', 27), ('10 mm', 41)]):
        b.text(t, bx + 100 * k + 24, by + yy * k - 2, size=18, font=F, weight=800, color=L)
    bk.label(b, 'Front elevation  ·  100 × 60 × 45 mm, beech', bx, by + 60 * k + 30)
    ox, oy = bx, by + 60 * k + 110
    b.rect(ox, oy, 520, 230, L, r=8, name='Box'); b.rect(ox, oy + 150, 520, 80, C['paper'], name='Band')
    lockup(b, ox + 40, oy + 50, 46, ON_DARK)
    b.text('RIVET BLOCK  ·  20 / 15 / 10 MM', ox + 40, oy + 178, size=18, font=F, weight=800, color=L, ls=1.5)
    bk.label(b, 'Crimp block', 1240, 820, color=C['glow'])
    bk.h2(b, 'Small object,\ncareful details', 1240, 856, size=56)
    bk.body(b, 'Engrave the symbol only, on the end grain; wood says the rest. The box is Night with a Paper band, the cord Glacier.', 1240, 1000, w=560, color=N)

    # 39 Apparel -----------------------------------------------------------------------
    b = bk.spread(39, 'apparel', 'Apparel', '08 Gear & Goods  ·  Apparel', bg=C['glacier'])
    MK = LOCAL / 'mock'
    bk.label(b, 'Caps & tees', M, 160, color=N)
    bk.h2(b, 'Symbol on the front', M, 196, size=56)
    shots = [('tee-front.jpg', 'Tee  ·  symbol on the left chest, 70 mm, screen print'), ('tee-back.jpg', 'Tee  ·  the back is where the brand talks'), ('cap.jpg', 'Cap  ·  symbol embroidered at 45 mm, Night thread')]
    for j, (f, cap_) in enumerate(shots):
        x = M + j * 570
        b.image(MK / f, x, 300, 540, 700, r=20, name='Photo mockup')
        b.text(cap_, x, 1016, w=540, size=16, font=F, weight=700, color=N)
    bk.body(b, 'Never the full lockup on the front: people should want to wear it even if they don’t know the app. Mockups are real product photographs with the artwork printed in; swap for production samples.', M + 860, 160, w=840, color=N, size=18)

    # 40 Chalk bags & stickers ------------------------------------------------------------
    b = bk.spread(40, 'chalk-stickers', 'Chalk bags & stickers', '08 Gear & Goods  ·  Chalk bags & stickers', bg=C['night'], dark=True)
    for j, (body, mark) in enumerate([(N, ON_DARK), (C['paper'], N)]):
        x = M + 80 + j * 480
        b.rect(x, 300, 360, 440, body, r=[40, 40, 70, 70], stroke='#FFFFFF33', name='Bag')
        b.rect(x - 14, 260, 388, 60, '#E9E2D8', r=30, name='Rim')
        pitch(b, x + 110, 420, 140, mark)
        b.rect(x + 340, 330, 14, 120, C['glacier'], r=7, name='Cord')
    bk.label(b, 'Chalk bags  ·  drawn, 1:3', M, 790, color=ON_DARK)
    bk.label(b, 'Stickers', 1200, 160, color=C['glow'])
    rot = lambda a, cx=50, cy=50: (lambda x, y: (cx + (x - cx) * math.cos(a) - (y - cy) * math.sin(a), cy + (x - cx) * math.sin(a) + (y - cy) * math.cos(a)))
    from marks import circle
    # 1 Glow disc
    o = b.path(circle(50, 50, 50), 1200, 220, 2.6, fill='#FFFFFF', name='Sticker / border'); shadow(o, 0, 10, 24, '#000000', 0.4)
    b.path(circle(50, 50, 45), 1200, 220, 2.6, fill=N); pitch(b, 1200 + 65, 220 + 65, 130, C['glow'], xf=rot(-0.2))
    # 2 square sticker: Snow with the symbol
    o = b.rect(1500, 230, 220, 220, '#FFFFFF', r=48); shadow(o, 0, 10, 24, '#000000', 0.4)
    b.rect(1508, 238, 204, 204, C['snow'], r=42); pitch(b, 1540, 270, 140, N)
    # 3 pill lockup
    o = b.rect(1200, 540, 330, 110, '#FFFFFF', r=55); shadow(o, 0, 10, 24, '#000000', 0.4)
    b.rect(1208, 548, 314, 94, N, r=47); lockup(b, 1268, 578, 34, ON_DARK, C['glow'])
    # 4 no ads
    o = b.rect(1560, 520, 220, 150, '#FFFFFF', r=28); shadow(o, 0, 10, 24, '#000000', 0.4)
    b.rect(1568, 528, 204, 134, C['glacier'], r=22)
    b.text('No ads.\nEver.', 1568, 548, w=204, size=36, font=F, weight=900, color=N, align='center', lh=1.0)
    bk.body(b, 'Chalk bags carry the symbol big, like a badge. Stickers are die-cut with a 3 mm Snow border, the only place the logo gets a keyline.', M, 860, w=1000, size=22)
    b.text('Sticker sheet  ·  80 × 120 mm  ·  matte vinyl', 1200, 720, size=15, font=F, weight=800, color=ON_DARK_MUTED, ls=1)
    for i, t in enumerate(['Climb Harder.', 'Rest is training.', 'Structure over grind.']):
        o = b.rect(1200, 770 + i * 90, 560, 70, '#FFFFFF', r=35); shadow(o, 0, 8, 20, '#000000', 0.35)
        b.rect(1206, 776 + i * 90, 548, 58, [C['snow'], C['glacier'], C['paper']][i], r=29)
        b.text(t, 1206, 788 + i * 90, w=548, size=26, font=F, weight=900, color=N, align='center')

    # 41 Signage ---------------------------------------------------------------------------------
    b = bk.spread(41, 'signage', 'Signage', '08 Gear & Goods  ·  Signage', bg='#CFC9C1')
    b.rect(0, 0, W, H, '#CFC9C1', name='Render / wall')
    b.rect(M + 80, 200, 720, 480, C['night'], r=8, name='Sign'); lockup(b, M + 230, 360, 72, ON_DARK)
    b.text('TRAINING ROOM', M + 80, 520, w=720, size=30, font=F, weight=800, color=ON_DARK, ls=4, align='center')
    for dx, dy in [(30, 30), (690, 30), (30, 450), (690, 450)]: b.ellipse(M + 80 + dx - 9, 200 + dy - 9, 18, 18, '#D0D3D7')
    b.text('Climb Harder.', M + 80, 760, size=150, font=F, weight=900, color=N, ls=-4)
    bk.label(b, 'Training room signage', 1200, 220, color=N)
    bk.body(b, 'Powder-coated Night aluminium, 900 × 600 mm, on steel standoffs; lockup in Snow. Wall lettering hand-painted in Nunito Black. Drawn to scale.', 1200, 260, w=600, color=N, size=21)

def build_closing(bk):
    # 42 Closing ---------------------------------------------------------------------------------
    b = bk.spread(42, 'closing', 'Closing', None, bg=C['night'], dark=True, folio=False)
    b.image(PH / 'reflection.jpg', 0, 0, W, H); bk.scrim(b, 0, 0, W, H, to=0.8, start=0)
    b.rect(0, H - 220, W, 220, C['night'], name='Foot band')
    w2 = lockup(b, M, H - 150, 50, ON_DARK)
    b.rect(M + w2 + 40, H - 165, 2.5, 100, '#F8F6F366', name='Divider')
    b.text('Climb Harder.', M + w2 + 80, H - 160, size=70, font=F, weight=900, color=ON_DARK, ls=-1.8, lh=1.0)
    bk.label(b, 'Rivet Brand Guidelines  ·  Edition 01  ·  November 2026', W - M - 600, H - 112, w=600, align='right')

def build_credits(bk):
    import json
    b = bk.spread(0, 'credits', 'Assets & credits', 'Assets & credits')
    bk.h2(b, 'Assets & credits', M, 150, size=64)
    assets = [('Identity', 'Pitch symbol, wordmark, horizontal and stacked lockups in Night, Snow and Glow. SVG, PDF, PNG.'),
              ('Typeface', 'Nunito 300 to 900, SIL Open Font License. Bundled in the app and the kit.'),
              ('Colour', 'Alpenglow tokens for light and dark: CSS, Tailwind, Penpot and Swift/Kotlin values.'),
              ('Motion', 'rivet-loading.svg (1.2 s loop) and rivet-startup.svg (1.05 s, once). Reduced-motion fallbacks included.'),
              ('Templates', 'Poster 50 × 70, business card 85 × 55, social 1080 × 1080, App Store 1290 × 2796.'),
              ('Source', 'This book is generated from design/rivet/tools; 3D renders from design/rivet/render3d.')]
    for i, (t, d_) in enumerate(assets):
        y = 290 + i * 120; bk.rule(b, M, y, 820)
        b.text(t, M, y + 24, size=22, font=F, weight=900, color=N)
        bk.body(b, d_, M + 220, y + 26, w=600, size=18)
    import re as _re
    used = set()
    for f in Path(__file__).parent.glob('*.py'): used |= set(_re.findall(r"'([a-z0-9-]+)(?:\.jpg)?'", f.read_text()))
    used |= set(_re.findall(r"photos/([a-z0-9-]+)\.jpg", (Path(__file__).parents[1] / 'render3d/scenes.js').read_text()))
    cr = {k: v for k, v in json.loads((PH / 'credits.json').read_text()).items() if k in used}
    bk.label(b, 'Placeholder photography  ·  Wikimedia Commons & Flickr', 1000, 290, color=C['glow'])
    items = list(cr.items())
    for i, (k, v) in enumerate(items):
        col, row = i % 2, i // 2
        x, y = 1000 + col * 410, 330 + row * 50
        b.text(k.replace('-', ' ').capitalize(), x, y, size=16, font=F, weight=800, color=N)
        b.text(f"{(v.get('author') or '')[:30]}  ·  {v['licence']}", x, y + 21, w=390, size=14, font=F, weight=600, color=MUTED)
    cr = items
    bk.body(b, 'All to be replaced by the commissioned shoot (see the photography brief).', 1000, 330 + ((len(cr) + 1) // 2) * 50 + 10, w=800, size=16, color=MUTED)

def build_all(bk):
    build(bk); build_goods(bk); build_credits(bk); build_closing(bk)
