from book import *
from brand import SCALES, BRAND_STEP
import book

def lum(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)
def rgb(h): return ' '.join(str(int(h[i:i + 2], 16)) for i in (1, 3, 5))
def cmyk(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)); k = 1 - max(r, g, b)
    if k == 1: return '0 0 0 100'
    return ' '.join(str(round((1 - c - k) / (1 - k) * 100)) for c in (r, g, b)) + f' {round(k * 100)}'

INFO = {'night': ('Night', 'Text, primary actions, dark grounds. Our black.'), 'snow': ('Snow', 'The canvas. Most surfaces are Snow.'),
        'glow': ('Glow', 'Alpenglow. The colour of the hang, and nowhere else.'), 'glacier': ('Glacier', 'Rest and calm. Glow’s cool partner.'),
        'dusk': ('Dusk', 'Data, charts and illustration.'), 'paper': ('Paper', 'Warm canvas for print and editorial.'),
        'granite': ('Granite', 'Secondary text and quiet detail.'), 'stone': ('Stone', 'Hairlines and surfaces on Paper.')}

def build(bk):
    bk.opener('03', 'colour', 'Colour', 'Alpenglow: the last light on a summit,\nand the colour of a hang.', 'pink-volcano')
    # 15 Palette -------------------------------------------------------------
    b = bk.spread(15, 'palette', 'Palette', '03 Colour  ·  Alpenglow palette')
    bk.h2(b, 'Alpenglow', M, 150, size=64)
    bk.body(b, 'Named for the last light on a summit: the moment the rock turns pink and everyone stops talking. Three core colours do almost all the work.', M, 240, w=760)
    core = [('night', 0, 560), ('snow', 560, 560), ('glow', 1120, 560)]
    for k, x, w in core:
        b.rect(M + x, 380, w - 20, 470, C[k], r=28, stroke='#141A2E14', name='Swatch / ' + k)
        fg = ON_DARK if k == 'night' else C['night']
        b.text(INFO[k][0], M + x + 36, 410, size=44, font=F, weight=900, color=fg, ls=-0.8)
        bk.body(b, INFO[k][1], M + x + 36, 470, w=440, size=18, color=fg)
        for j, (lab, val) in enumerate([('HEX', C[k]), ('RGB', rgb(C[k])), ('CMYK', cmyk(C[k]))]):
            b.text(lab, M + x + 36, 720 + j * 32, size=13, font=F, weight=800, color=fg, ls=1.5)
            b.text(val, M + x + 120, 718 + j * 32, size=17, font=F, weight=700, color=fg)
    for i, k in enumerate(['glacier', 'dusk', 'paper', 'granite', 'stone']):
        x = M + i * 338
        b.rect(x, 880, 318, 110, C[k], r=20, stroke='#141A2E14', name='Swatch / ' + k)
        fg = ON_DARK if k in ('granite', 'dusk') else C['night']
        b.text(INFO[k][0], x + 24, 900, size=24, font=F, weight=900, color=fg)
        b.text(C[k], x + 24, 942, size=15, font=F, weight=700, color=fg)

    # 16 Scales --------------------------------------------------------------
    b = bk.spread(16, 'scales', 'Scales', '03 Colour  ·  Scales')
    bk.h2(b, 'Scales for interfaces', M, 150, size=64)
    bk.body(b, 'Each colour extends into seven steps for UI states, charts and illustration. The dot marks the named brand colour in each scale. Use the scales in product; use the named colours in brand.', M, 240, w=900)
    for r, (k, sc) in enumerate(SCALES.items()):
        y = 380 + r * 136
        b.text(k.capitalize(), M, y + 36, size=24, font=F, weight=900, color=C['night'])
        if k == 'glow': b.text('Hang screen only', M, y + 70, size=14, font=F, weight=700, color=MUTED)
        for i, hx in enumerate(sc):
            x = 360 + i * 206
            b.rect(x, y, 196, 112, hx, r=16, stroke='#141A2E0F', name=f'{k} {i+1}00')
            fg = C['night'] if contrast(C['night'], hx) >= contrast(ON_DARK, hx) else ON_DARK
            b.text(f'{i+1}00', x + 16, y + 14, size=14, font=F, weight=800, color=fg)
            if i == BRAND_STEP[k]: b.ellipse(x + 168, y + 16, 12, 12, fg, name='Brand step')
            b.text(hx, x + 16, y + 80, size=13, font=F, weight=600, color=fg)

    import ch_systems; ch_systems.dataviz(bk)
    # 17 Pairings ------------------------------------------------------------
    b = bk.spread(17, 'pairings', 'Pairings', '03 Colour  ·  Pairings & contrast')
    bk.h2(b, 'Proportion and contrast', M, 150, size=64)
    bk.body(b, 'Glow is the colour of the hang. It fills the Hang screen and the app icon, and colours the symbol on Night. Nowhere else. Text pairings below pass WCAG AA unless marked Never.', M, 240, w=1100)
    props = [('snow', 60), ('night', 27), ('glacier', 6), ('dusk', 4), ('glow', 3)]
    x = M
    for k, p in props:
        w = (W - 2 * M) * p / 100
        b.rect(x, 380, w - 6, 150, C[k], r=16, stroke='#141A2E14', name='Proportion / ' + k)
        b.text(f'{p}%', x + 16, 396, size=18, font=F, weight=800, color=ON_DARK if k == 'night' else C['night'])
        x += w
    pairs = [('night', 'snow'), ('snow', 'night'), ('night', 'glow'), ('night', 'glacier'), ('night', 'paper'), ('glow', 'night'), ('night', 'dusk'), ('glow', 'snow')]
    for i, (fg, bg) in enumerate(pairs):
        x, y = M + (i % 4) * 422, 580 + (i // 4) * 250
        b.rect(x, y, 402, 220, C[bg], r=24, stroke='#141A2E14', name='Pair')
        (pitch(b, x + 28, y + 30, 72, C[fg]) if fg == 'glow' else b.text('Aa', x + 28, y + 30, size=72, font=F, weight=900, color=C[fg], lh=1))
        cr = contrast(C[fg], C[bg]); tc = (ON_DARK if bg == 'night' else C['night']) if fg == 'glow' else C[fg]
        b.text(f'{cr:.1f}:1', x + 220, y + 40, w=150, size=30, font=F, weight=900, color=tc, align='right')
        b.text('SYMBOL ONLY' if fg == 'glow' and bg == 'night' else 'AAA' if cr >= 7 else 'AA' if cr >= 4.5 else 'NEVER', x + 160, y + 84, w=210, size=14, font=F, weight=800, color=tc, align='right', ls=1.2)
        b.text(f'{INFO[fg][0]} on {INFO[bg][0]}', x + 28, y + 170, size=16, font=F, weight=700, color=tc)

    # Where Glow lives ------------------------------------------------------------
    b = bk.spread(0, 'glow-rule', 'Where Glow lives', '03 Colour  ·  Where Glow lives', bg=C['night'], dark=True)
    bk.display(b, 'Where Glow\nlives.', M, 200, size=104)
    bk.body(b, 'Glow is the colour of the hang. It fills the Hang screen and the app icon, and colours the symbol on Night. Nowhere else.', M, 460, w=600, size=24, color=ON_DARK)
    tiles = [('The Hang screen', 'hang'), ('The app icon', 'icon'), ('The symbol on Night', 'sym'), ('The Hang, on a watch', 'poster')]
    for i, (t, k) in enumerate(tiles):
        x = 860 + (i % 2) * 480; y = 160 + (i // 2) * 440
        if k == 'hang':
            b.rect(x, y, 440, 380, C['glow'], r=28); b.text('Hang', x + 32, y + 28, size=34, font=F, weight=900, color=C['night']); b.text('7', x, y + 90, w=440, size=200, font=F, weight=900, color=C['night'], align='center', lh=1)
        elif k == 'icon':
            b.rect(x, y, 440, 380, '#0B0F1C', r=28); b.rect(x + 130, y + 80, 180, 180, C['glow'], r=44); pitch(b, x + 160, y + 110, 120, C['night'])
        elif k == 'sym':
            b.rect(x, y, 440, 380, '#0B0F1C', r=28); lockup(b, x + 110, y + 160, 52, ON_DARK, C['glow'])
        else:
            b.rect(x, y, 440, 380, '#0B0F1C', r=28); b.rect(x + 150, y + 60, 140, 260, C['glow'], r=24); b.text('7', x + 150, y + 140, w=140, size=110, font=F, weight=900, color=C['night'], align='center', lh=1)
        b.text(t, x, y + 392, size=17, font=F, weight=800, color=ON_DARK)
    b.text('Nowhere else.', M, 900, size=48, font=F, weight=900, color=ON_DARK, ls=-1)

    # 18 Colour in action ------------------------------------------------------
    b = bk.spread(18, 'colour-action', 'Colour in action', '03 Colour  ·  Colour carries the session', bg=C['night'], dark=True)
    bk.display(b, 'Colour tells\nyou where\nyou are.', M, 220, size=96)
    bk.body(b, 'In a session, the whole screen becomes the colour of the moment. You can read it from across the room, mid-hang, without your glasses.', M, 600, w=560)
    states = [('Get ready', C['stone'], '3', 'Hang next', 'Stone'), ('Hang', C['glow'], '7', 'Rep 4 of 6', 'Glow'),
              ('Rest', C['glacier'], '3', 'Hang next', 'Glacier'), ('Recover', SCALES['glacier'][1], '2:41', 'Set 3 next', 'Glacier 200'),
              ('Done', C['night'], '5/5', 'Saved', 'Night')]
    for i, (t, bgc, n, sub, cname) in enumerate(states):
        x = 760 + i * 210
        fg = ON_DARK if bgc == C['night'] else C['night']
        b.rect(x, 200, 192, 500, bgc, r=32, stroke='#FFFFFF33' if bgc == C['night'] else None, name='Phone / ' + t)
        b.text(t, x + 20, 236, size=26, font=F, weight=900, color=fg)
        b.text(sub, x + 20, 274, size=16, font=F, weight=800, color=fg)
        b.text(n, x, 380, w=192, size=96 if len(n) < 3 else 64, font=F, weight=900, color=fg, ls=-2, lh=1, align='center')
        b.rect(x + 20, 650, 152, 6, fg + '33', r=3); b.rect(x + 20, 650, 152 * [0.7, 0.6, 0.85, 0.3, 1][i], 6, fg, r=3)
        b.text(t, x, 730, w=192, size=17, font=F, weight=800, color=ON_DARK, align='center')
        b.text(cname, x, 758, w=192, size=14, font=F, weight=600, color=ON_DARK_MUTED, align='center')

    bk.opener('04', 'type', 'Typography', 'One rounded family, from a watch face\nto the side of a building.', 'cloud-sea')
    # 19 Typeface --------------------------------------------------------------
    b = bk.spread(19, 'typeface', 'Typeface', '04 Typography  ·  Typeface')
    b.text('Aa', M - 10, 130, size=520, font=F, weight=900, color=C['night'], lh=1, ls=-14)
    bk.label(b, 'Our typeface', 1040, 220, color=C['glow'])
    bk.display(b, 'Nunito', 1040, 260, size=120)
    bk.body(b, 'A rounded sans with soft terminals and open shapes. Friendly at 13 px, monumental at 400 px. Free and open (SIL OFL), so every partner, printer and gym can use it.', 1040, 420, w=700)
    for i, w in enumerate([300, 400, 500, 600, 700, 800, 900]):
        nm = ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'][i]
        y = 640 + i * 62; bk.rule(b, 1040, y, 760)
        b.text('Climb Harder', 1040, y + 12, size=34, font=F, weight=w, color=C['night'])
        b.text(f'{nm} {w}', 1500, y + 22, w=300, size=15, font=F, weight=700, color=MUTED, align='right')
    b.text('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 · : / % + − × ( ) ’ “ ” &', M, 820, w=860, size=30, font=F, weight=600, color=C['night'], lh=1.45)

    # 20 Type scale --------------------------------------------------------------
    b = bk.spread(20, 'type-scale', 'Type scale', '04 Typography  ·  Scale & hierarchy')
    bk.h2(b, 'One family, clear steps', M, 150, size=64)
    bk.label(b, 'Print & web', M, 240, color=C['glow'])
    scale = [('Display', 900, 120, 'Climb Harder', '−2.5%  ·  1.0'), ('Headline', 800, 64, 'Two years in. Stuck.', '−1.5%  ·  1.1'),
             ('Title', 800, 36, 'Max hangs, 20 mm edge', '−1%  ·  1.2'), ('Body', 500, 21, 'Six hangs of ten seconds. Recover three minutes between each.', '0  ·  1.5'),
             ('Label', 800, 14, 'SET 2 OF 5  ·  NEXT UP', '+14%  ·  caps'), ('Timer', 900, 96, '2:41', '−3%  ·  tabular')]
    y = 290
    for nm, w, s, sample, spec in scale:
        bk.rule(b, M, y, W - 2 * M)
        b.text(nm, M, y + 22, size=17, font=F, weight=800, color=C['night'])
        b.text(f'{s} px  ·  {w}\n{spec}', M, y + 48, w=260, size=14, font=F, weight=600, color=MUTED, lh=1.5)
        if nm == 'Timer':
            b.text(sample, 420, y + 8, size=s, font=F, weight=w, color=C['night'], ls=-s * 0.03, lh=1)
        else:
            b.text(sample, 420, y + 18, w=1380 if nm != 'Timer' else None, size=s, font=F, weight=w, color=C['night'], ls=-s * {900: 0.025, 800: 0.012, 500: 0}[w] if nm != 'Label' else 2, lh=1.05 if s > 30 else 1.5, upper=nm == 'Label')
        y += (max(s * 1.12, 70) + 36) if nm != 'Label' else 100

    # In-app type ----------------------------------------------------------------
    b = bk.spread(0, 'type-app', 'Type in the app', '04 Typography  ·  In the app')
    bk.h2(b, 'Sizes for a phone under a board', M, 150, size=64)
    bk.body(b, 'App sizes are in points and follow Dynamic Type and Android font scaling. Numbers use tabular figures (tnum) so a countdown never jitters. Session screens use 17 pt and up; 12 and 13 pt are for history and settings only.', M, 240, w=1000)
    app = [('Timer', 900, 200, 'tnum, −3%', '7'), ('Large title', 900, 34, '−1%', 'Max hangs'), ('Title', 800, 22, '0', 'This week'),
           ('Body', 600, 17, '0', 'Six hangs of ten seconds.'), ('Caption', 700, 13, '0', 'Fri · 5 of 5 sets'), ('Label', 800, 12, '+14%, caps', 'TODAY')]
    for i, (nm, w, sz, sp, ex) in enumerate(app):
        y = 380 + i * 110
        if i == 0:
            b.text(ex, 1400, 300, size=sz * 2.4, font=F, weight=900, color=C['night'], lh=1, ls=-12)
            bk.label(b, 'Timer at 200 pt, shown at 2.4×', 1400, 860)
        bk.rule(b, M, y, 1160)
        b.text(nm, M, y + 22, size=19, font=F, weight=800, color=C['night'])
        b.text(f'{sz} pt  ·  {w}  ·  {sp}', M + 240, y + 24, size=16, font=F, weight=600, color=MUTED)
        if i: b.text(ex, M + 620, y + 18 + max(0, (30 - sz) / 2), size=min(sz * 1.2, 40), font=F, weight=w, color=C['night'], upper=nm == 'Label', ls=1.6 if nm == 'Label' else 0)

    ch_systems.grids(bk)
    # 21 Type in use ---------------------------------------------------------------
    b = bk.spread(21, 'type-use', 'Type in use', '04 Typography  ·  In use')
    b.rect(M, 160, 820, 900, C['paper'], r=28, name='Editorial')
    bk.label(b, 'Field Notes  ·  Vol. 1', M + 56, 210, color=C['glow'])
    b.text('How forty climbers\ngot unstuck', M + 56, 250, w=720, size=60, font=F, weight=900, color=C['night'], lh=1.02, ls=-1.4)
    bk.body(b, 'We asked climbers at every level the same question: what finally worked? Almost nobody said “trying harder”. They said structure, strength work, a bit more rest, and finding the fun again.', M + 56, 440, w=700, size=22)
    b.text('“I stopped trying to\nflash everything and\nstarted training\nlike it mattered.”', M + 56, 680, w=700, size=40, font=F, weight=800, color=C['night'], lh=1.15, ls=-0.6)
    bk.label(b, 'Sara, 6B to 7A in one season  ·  illustrative', M + 56, 900)
    b.rect(1000, 160, 800, 900, C['night'], r=28, name='Product')
    bk.label(b, 'Today', 1056, 210, color=ON_DARK_MUTED)
    b.text('Repeaters', 1056, 250, size=60, font=F, weight=900, color=ON_DARK, ls=-1.4)
    b.text('20 mm edge  ·  20 min', 1056, 330, size=22, font=F, weight=600, color=ON_DARK_MUTED)
    for i, (k, v) in enumerate([('Sets', '5'), ('Hang', '7 s'), ('Rest', '3 s')]):
        x = 1056 + i * 240
        b.text(v, x, 430, size=64, font=F, weight=900, color=ON_DARK, ls=-1.5)
        bk.label(b, k, x, 516, color=ON_DARK_MUTED)
    for i in range(5):
        y = 600 + i * 56
        b.text(f'Set {i+1}', 1056, y, size=20, font=F, weight=700, color=ON_DARK if i < 2 else ON_DARK_MUTED)
        for j in range(6):
            b.rect(1200 + j * 92, y + 6, 80, 16, ON_DARK if i < 2 else (ON_DARK if (i == 2 and j < 3) else '#FFFFFF1F'), r=8, name='Rep')
    b.rect(1056, 900, 688, 88, ON_DARK, r=44, name='Button')
    b.text('Start session', 1056, 926, w=688, size=24, font=F, weight=800, color=C['night'], align='center')
