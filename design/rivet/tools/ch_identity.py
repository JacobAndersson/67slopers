import math
from book import *
from brand import pitch_parts, wordmark_path

def build(bk):
    bk.opener('02', 'identity', 'Identity', 'A symbol you can wear, engrave\nand recognise at sixteen pixels.', 'crack-from-above')
    # 08 Symbol -------------------------------------------------------------
    b = bk.spread(8, 'symbol', 'The symbol', '02 Identity  ·  Symbol')
    pitch(b, 980, 170, 820, C['night'])
    bk.label(b, 'The symbol', M, 220, color=C['glow'])
    bk.display(b, 'Pitch', M, 260, size=180)
    bk.body(b, 'Three equal bars, each one step higher than the last. A set, a week, a season: every session lifts you a little.\n\nThe bars are the same length on purpose. You don’t become a different climber. You become the same climber, higher up.', M, 520, w=600, color=TXT, size=22)

    # 09 Construction -------------------------------------------------------
    b = bk.spread(9, 'construction', 'Construction', '02 Identity  ·  Symbol construction')
    X, Y, S = 860, 150, 900
    u = S / 100
    for i in range(0, 101, 4):
        b.rect(X + i * u, Y, 1, S, '#141A2E14', name='Grid'); b.rect(X, Y + i * u, S, 1, '#141A2E14', name='Grid')
    pitch(b, X, Y, S, C['night'])
    # guides
    for yy in (7, 21, 35, 65, 79, 93):
        b.rect(X - 30, Y + yy * u, S + 60, 1.5, C['granite'], name='Guide')
    for xx in (9, 31, 39, 61, 69, 91):
        b.rect(X + xx * u, Y - 30, 1.5, S + 60, '#6B6E7366', name='Guide')
    b.ellipse(X + 69 * u, Y + 7 * u, 22 * u, 22 * u, None, stroke=C['granite'], sw=2, name='Radius')
    bk.display(b, 'Built on one unit', M, 200, w=620, size=72, lh=1.02)
    bk.body(b, 'Everything is measured in bar widths. The bar is 1 unit wide and fully rounded. Bars sit 0.36 apart and each rises 0.64 above the last.', M, 400, w=600)
    specs = [('Bar', '1 × 29/11  (2.64)'), ('Corner radius', '½, a full round'), ('Space between bars', '4/11  (0.36)'), ('Step between bars', '7/11  (0.64)'), ('Overall', '41/11 × 43/11  (3.73 × 3.91)')]
    for i, (k, v) in enumerate(specs):
        y = 620 + i * 72; bk.rule(b, M, y, 600)
        b.text(k, M, y + 22, size=19, font=F, weight=600, color=MUTED)
        b.text(v, M + 300, y + 20, w=300, size=21, font=F, weight=800, color=C['night'], align='right')

    # 10 Wordmark -----------------------------------------------------------
    b = bk.spread(10, 'wordmark', 'Wordmark', '02 Identity  ·  Wordmark')
    wordmark(b, M + 20, 220, 260, C['night'])
    bk.label(b, 'The wordmark', M, 660, color=C['glow'])
    bk.body(b, 'Drawn from Nunito Black and made our own. Title case only. The wordmark is artwork: always place the master file, never type it out, so it never looks like a headline.', M, 700, w=640)
    # detail callouts
    bk.label(b, 'What makes it ours', 1060, 660, color=C['glow'])
    det = [('A Pitch bar for a dot', 'The round tittle of the i becomes a small upright bar, the symbol in miniature.'),
           ('Hand-set pairs', 'R and i pulled 12 units closer; v and e opened 4. Tracking −2.5% overall.'),
           ('Outlined master', 'Supplied as artwork: symbol, wordmark, horizontal and stacked lockups in Night and Snow, plus the symbol in Glow.')]
    for i, (t, s_) in enumerate(det):
        y = 700 + i * 110; bk.rule(b, 1060, y, 740)
        b.text(t, 1060, y + 20, size=21, font=F, weight=900, color=C['night'])
        bk.body(b, s_, 1060, y + 52, w=740, size=17)
    # before / after of the i
    b.rect(1340, 170, 460, 420, '#FFFFFF', r=28, stroke='#141A2E14', name='Detail')
    bk.label(b, 'Typed in Nunito Black', 1380, 200)
    wordmark(b, 1380, 236, 70, '#9C9EA2', custom=False)
    bk.label(b, 'Drawn for Rivet', 1380, 390, color=C['glow'])
    wordmark(b, 1380, 426, 70, C['night'])
    # 11 Lockups -------------------------------------------------------------
    b = bk.spread(11, 'lockups', 'Lockups', '02 Identity  ·  Lockups')
    bk.h2(b, 'Lockups', M, 150, size=64)
    cells = [(M, 280, 820, 380, 'Primary  ·  Horizontal'), (980, 280, 820, 380, 'Stacked'), (M, 690, 400, 320, 'Symbol'), (560, 690, 400, 320, 'App & avatar'), (980, 690, 820, 320, 'Signature  ·  with line')]
    for (x, y, w, h, t) in cells:
        b.rect(x, y, w, h, '#FFFFFF', r=28, stroke='#141A2E14', name='Cell / ' + t)
        bk.label(b, t, x + 32, y + 28)
    lockup(b, M + 150, 445, 90, C['night'])
    stacked(b, 980 + 410, 360, 70, C['night'])
    pitch(b, M + 120, 790, 180, C['night'])
    b.rect(560 + 110, 790, 180, 180, C['glow'], r=44, name='App tile'); pitch(b, 560 + 140, 820, 120, C['night'])
    w = lockup(b, 980 + 80, 845, 56, C['night'])
    b.rect(980 + 80 + w + 40, 830, 2, 86, '#141A2E33', name='Divider')
    b.text('Climb\nHarder.', 980 + 80 + w + 74, 830, size=34, font=F, weight=800, color=C['night'], lh=1.05, ls=-0.4)
    bk.body(b, 'Fixed ratios: bars span 1.3 × the cap height and sit on the baseline. The gap between symbol and word is one bar plus one space. Never rebuild a lockup by eye.', M, 1036, w=1600, size=17, color=MUTED)

    import ch_systems; ch_systems.signatures(bk)
    # 12 Clear space & size ---------------------------------------------------
    b = bk.spread(12, 'clearspace', 'Clear space & size', '02 Identity  ·  Clear space & size')
    bk.h2(b, 'Give it room', M, 150, size=64)
    bk.body(b, 'Keep clear space of at least x around the logo. x is the height of one Pitch bar, around the logo, measured from the outermost edges. Nothing enters that space: no type, no edges, no busy image detail.', M, 250, w=640)
    cap = 110; x0, y0 = 300, 560
    S = cap * 1.3 / 0.86; pad = 0.58 * S
    from brand import wordmark_path
    w = lockup(b, x0, y0, cap, C['night'])
    top = y0 + cap - 0.93 * S + 0.07 * S
    b.rect(x0 - pad, top - pad, w + 2 * pad, (y0 + cap - top) + 2 * pad, '#6B6E730D', stroke=C['granite'], sw=1.5, name='Clear space')
    b.rect(x0, top, w, y0 + cap - top, None, stroke='#6B6E7399', sw=1, name='Logo bounds')
    for (cx, cy) in [(x0 - pad, top - pad), (x0 + w, top - pad), (x0 - pad, y0 + cap), (x0 + w, y0 + cap)]:
        b.rect(cx, cy, pad, pad, None, stroke=C['granite'], sw=1, name='Unit')
        b.text('x', cx, cy + pad / 2 - 14, w=pad, size=20, font=F, weight=800, color=C['granite'], align='center')
    bk.label(b, 'Minimum size', 1240, 300, color=C['glow'])
    sizes = [('Lockup', 'Screen 80 px wide  ·  Print 22 mm', 28), ('Symbol', 'Screen 16 px  ·  Print 5 mm', 0), ('Embroidery & engraving', 'Symbol 8 mm, no wordmark under 30 mm', 0)]
    for i, (t, s, c) in enumerate(sizes):
        y = 350 + i * 200; bk.rule(b, 1240, y, 560)
        b.text(t, 1240, y + 26, size=26, font=F, weight=800, color=C['night'])
        bk.body(b, s, 1240, y + 66, w=420, size=18, color=MUTED)
        if i == 0: lockup(b, 1240 + 450, y + 80, 18, C['night'])
        elif i == 1: pitch(b, 1240 + 520, y + 66, 32, C['night'])
        else: pitch(b, 1240 + 520, y + 66, 22, C['night'])

    # 13 Colour versions ------------------------------------------------------
    b = bk.spread(13, 'logo-colour', 'Logo on colour', '02 Identity  ·  Logo colour')
    bk.h2(b, 'Two colours, many grounds', M, 150, size=64)
    bk.body(b, 'The logo is Night or Snow. Glow is the colour of the hang: the symbol alone may be Glow, on Night only. Never tint the logo to match a ground.', M, 250, w=900)
    tiles = [(C['snow'], C['night'], None, 'Night on Snow'), (C['night'], C['snow'], None, 'Snow on Night'), (C['paper'], C['night'], None, 'Night on Paper'),
             (C['glacier'], C['night'], None, 'Night on Glacier'), (None, C['snow'], 'dark-ridge', 'Snow on photo'), (C['night'], C['snow'], C['glow'], 'Glow symbol on Night')]
    for i, (bg, fg, sym, t) in enumerate(tiles):
        x, y = M + (i % 3) * 570, 360 + (i // 3) * 350
        if bg: b.rect(x, y, 540, 320, bg, r=28, stroke='#141A2E14', name='Tile / ' + t)
        else: b.image(PH / f'{sym}.jpg', x, y, 540, 320, r=28); bk.scrim(b, x, y, 540, 320, to=0.4, r=28, start=0)
        lockup(b, x + 150, y + (185 if not bg else 140), 50, fg, sym if bg and sym else None)
        bk.label(b, t, x + 28, y + 280, color='#F8F6F3B3' if fg == C['snow'] else '#141A2E99')

    # 14 Misuse ---------------------------------------------------------------
    b = bk.spread(14, 'misuse', 'Misuse', '02 Identity  ·  Misuse')
    bk.h2(b, 'Please don’t', M, 150, size=64)
    rot = lambda a: (lambda x, y: (50 + (x - 50) * math.cos(a) - (y - 50) * math.sin(a), 50 + (x - 50) * math.sin(a) + (y - 50) * math.cos(a)))
    donts = [('Line the bars up. It becomes a signal meter.', dict(parts=pitch_parts(step=0, h=72))),
             ('Stretch or squash it.', dict(xf=lambda x, y: (x * 1.45 - 22, y * 0.7 + 15))),
             ('Rotate it.', dict(xf=rot(-0.35))),
             ('Colour the bars differently.', dict(colors=[C['glacier'], C['dusk'], C['glow']])),
             ('Outline it.', dict(stroke=4)),
             ('Add shadows or effects.', dict(shadow=(6, 10, 14, '#000000', 0.45))),
             ('Rebuild the wordmark in another font.', 'type'),
             ('Place it on a busy image.', 'busy')]
    for i, (t, kw) in enumerate(donts):
        x, y = M + (i % 4) * 430, 280 + (i // 4) * 430
        b.rect(x, y, 400, 300, '#FFFFFF', r=24, stroke='#141A2E14', name='Dont')
        if kw == 'type':
            pitch(b, x + 70, y + 108, 84, C['night']); b.text('Rivet', x + 160, y + 112, size=60, font='Quicksand', weight=500, color=C['night'])
        elif kw == 'busy':
            b.image(PH / 'hanging-belay.jpg', x, y, 400, 300, r=24); lockup(b, x + 90, y + 125, 44, C['snow'])
        else:
            pitch(b, x + 130, y + 80, 140, C['night'], **kw)
        b.ellipse(x + 352, y + 20, 30, 30, C['night'], name='No')
        b.path('M0 0 L10 10 M10 0 L0 10', x + 362, y + 30, 1, stroke='#FFFFFF', sw=2.5, name='Cross')
        bk.body(b, t, x, y + 316, w=400, size=18, weight=600, color=C['night'])
