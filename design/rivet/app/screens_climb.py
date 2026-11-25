"""Climb: MoonBoard problems, circuits, lights and board setup."""
from ui import (M, W, H, NIGHT, SNOW, WALL, GLACIER, t, icon, status, card, button, icon_button, chip, segmented, stepper,
                field, nav, large_title, section, label, hairline, measure, bottom_bar, home_bar, menu, dialog, scrim, sheet, row,
                switch, checkbox, search, dock, set_bars, progress, setting_row, toast)
import boards as B

CW = W - 2 * M
PROBLEMS = [
    ('The Warm Up Problem', 'RussK  ·  23.9k sends', 'Sent  ·  flash', '6A+', 'V3', B.WARMUP, 'sent'),
    ('Da Real 6A+', 'Dennis Kunath  ·  15.7k sends', 'Sent  ·  2 tries', '6B', 'V4', B.LAKSA, 'sent'),
    ('VV Victoria', 'zuro  ·  12.6k sends', 'Project  ·  5 tries', '6B+', 'V4', B.VICTORIA, 'project'),
    ('Black Muffler', 'KoalaClimbing  ·  9.7k sends', 'Project  ·  3 tries', '6C', 'V5', B.MUFFLER, 'project'),
    ('Sawdust Laksa', 'PeterS  ·  6.4k sends', 'Project  ·  2 tries', '6C+', 'V5', B.LAKSA, 'project'),
    ('Flowers for Dayz', 'Corey Zee  ·  7.1k sends', 'Project  ·  3 tries', '7A', 'V6', B.FLOWERS, 'project'),
    ('Worth the Wrist', 'Ben Moon  ·  5.2k sends', '★ 4.6', '7A+', 'V7', B.WRIST, None),
]


def problem_row(q, T, y, p, index=None, h=88, right=None):
    name, setter, st, g, v, holds, kind = p
    x = M
    if index is not None:
        t(q, str(index), x, y + (h - 22) / 2, 'num', T['muted'], w=22); x += 30
    B.wall_thumb(q, T, x, y + (h - 60) / 2, holds, s=60, mono=True)
    tx = x + 58
    t(q, name, tx, y + 14, 'row', T['text'])
    t(q, f'{g}  ·  {setter.split("  ·  ")[0]}' if right else setter, tx, y + 36, 'caption', T['muted'])
    if right:
        pass
    elif kind == 'sent':
        icon(q, 'check-circle-fill', tx, y + 57, 15, T['text']); t(q, st, tx + 20, y + 56, 'caption', T['text'])
    elif kind == 'project':
        q.ellipse(tx + 1, y + 59, 12, 12, None, stroke=T['text'], sw=1.5); t(q, st, tx + 20, y + 56, 'caption', T['text'])
    else:
        icon(q, 'star-fill', tx, y + 57, 14, T['muted']); t(q, st.replace('★ ', ''), tx + 19, y + 56, 'caption', T['muted'])
    if right:
        t(q, right, W - M - 130, y + 34, 'caption', T['text'], w=130, align='right', weight=800)
    else:
        t(q, g, W - M - 70, y + (h - 22) / 2 - 2, 'num', T['text'], w=70, align='right')
    hairline(q, T, tx, y + h - 1, W - M - tx)
    return h


def lights_chip(q, T, x, y, on=True):
    """Lights status: a hairline pill with a dot, so it reads as a state, not as the primary action."""
    lbl = 'Lights on' if on else 'Connect'
    w = measure(q, lbl, 'sub') + 50
    q.rect(x - w, y, w, 44, None, r=22, stroke=T['line2'], name=f'Lights / {lbl}')
    if on:
        q.ellipse(x - w + 18, y + 18, 9, 9, T['text'], name='Lights / dot')
    else:
        icon(q, 'bluetooth', x - w + 14, y + 12, 20, T['text'])
    t(q, lbl, x - w + 36, y + 12, 'sub', T['text'])


def climb_header(q, T, lit=True, view=0):
    status(q, T['text'])
    t(q, 'Climb', M, 96, 'large', T['text'])
    t(q, 'Masters 2019  ·  40°', M, 140, 'sub', T['muted'])
    icon(q, 'caret-down', M + measure(q, 'Masters 2019  ·  40°', 'sub') + 6, 142, 16, T['muted'])
    if lit:
        icon(q, 'lightbulb-filament-fill', W - M - 136, 106, 18, T['text'])
        t(q, 'Lights connected', W - M - 112, 105, 'caption', T['text'], name='Lights / status')
    else:
        button(q, T, W - M - 152, 94, 152, 'Connect lights', 'ghost', 'S', icon_name='bluetooth')
    segmented(q, T, M, 180, CW, ['Problems', 'Circuits'], view)


def climb_list(q, T, tab='All', empty=False, lit=True):
    climb_header(q, T, lit=lit)
    search(q, T, M, 244, CW - 60, 'Search name or setter')
    q.rect(W - M - 48, 244, 48, 48, T['surface'], r=24, stroke=T['line2'], name='Filters')
    icon(q, 'sliders-horizontal', W - M - 36, 256, 24, T['text'])
    q.ellipse(W - M - 14, 240, 18, 18, T['action'], name='Filters / count')
    t(q, '2', W - M - 14, 241, 'caption', T['on_action'], w=18, align='center', size=11)
    x = M - (150 if tab == 'Mine' else 0)
    for c in ['All', 'Projects', 'Sent', 'Saved', 'Mine']:
        x += chip(q, T, x, 308, c, selected=c == tab) + 8
    c = T['canvas']
    q.rect(W - 48, 306, 48, 48, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0, 'startY': 0.5, 'endX': 1, 'endY': 0.5,
           'width': 1, 'stops': [{'color': c, 'opacity': 0, 'offset': 0}, {'color': c, 'opacity': 1, 'offset': 1}]}}, name='Chips / scroll fade')
    hh = getattr(q, 'h', H)
    if tab == 'Mine':
        t(q, 'Set on this board', M, 368, 'caption', T['muted']); t(q, '2 problems', M, 368, 'caption', T['muted'], w=CW, align='right')
        y = 392
        y += problem_row(q, T, y, ('Tuesday crimps', 'You  ·  feet follow hands', 'Project  ·  4 tries', '6C+', '', B.MUFFLER, 'project'))
        y += problem_row(q, T, y, ('Corner slap', 'You  ·  any holds', 'Sent  ·  flash', '6B', '', B.WARMUP, 'sent'))
        y += 16
        button(q, T, M, y, CW, 'Set a problem', 'ghost', 'M', icon_name='plus')
        button(q, T, M, y + 76, CW, 'Or scan one from a friend', 'quiet', 'M', icon_name='qr-code')
        dock(q, T, 'climb', dot='climb', bottom=hh); return
    t(q, '6A+ to 7A  ·  most climbed', M, 368, 'caption', T['muted'])
    t(q, '151 problems' if not empty else '0 problems', M, 368, 'caption', T['muted'], w=CW, align='right')
    y = 392
    if empty:
        q.rect(M, y + 40, 72, 72, T['raised'], r=24); icon(q, 'magnifying-glass', M + 22, y + 62, 28, T['text'])
        t(q, 'No projects yet', M, y + 132, 'title', T['text'])
        t(q, 'Problems you have tried but not sent\nshow up here.', M, y + 164, 'sub', T['muted'])
        button(q, T, M, y + 224, 180, 'Clear filters', 'ghost', 'M')
    else:
        for p in PROBLEMS:
            if y > hh - 200: break
            y += problem_row(q, T, y, p)
    dock(q, T, 'climb', dot='climb' if lit else None, bottom=hh)


def circuits(q, T):
    climb_header(q, T, view=1)
    y = 256
    for nm, meta, items in [('7A pyramid', '6 problems  ·  6A+ to 7A', PROBLEMS[:6]), ('Warm-up', '4 problems  ·  6A+ to 6B+', PROBLEMS[:4]),
                            ]:
        card(q, T, M, y, CW, 148, name=f'Circuit / {nm}')
        t(q, nm, M + 24, y + 20, 'title', T['text'])
        t(q, meta, M + 24, y + 52, 'sub', T['muted'])
        for i, p in enumerate(items):
            B.wall_thumb(q, T, M + 24 + i * 34, y + 88, p[5], s=40, mono=True)
        icon_button(q, T, M + CW - 24 - 56, y + 20, 'play-fill', 'primary', d=56, isz=24, label='Start circuit')
        y += 160
    button(q, T, M, y, CW, 'New circuit', 'ghost', 'M', icon_name='plus')
    dock(q, T, 'climb', dot='climb')


def intro(q, T):
    status(q, T['text'])
    t(q, 'Climb', M, 96, 'large', T['text'])
    B.moonwall(q, T, M + 80, 150, CW - 160, B.FLOWERS, coords=False, r=20)
    t(q, 'Your MoonBoard,\noffline', M, 488, 'hero', T['text'])
    t(q, '1,960 benchmarks on this phone. Light them up over Bluetooth. No account.', M, 562, 'body', T['muted'], w=CW)
    button(q, T, M, 632, CW, 'Set up your board', 'primary', 'L')
    dock(q, T, 'climb')


def filters(q, T):
    climb_list(q, T)
    scrim(q, T)
    sheet(q, T, 196, 'Filters')
    t(q, 'Reset', W - M - 50, 236, 'bodyB', T['text'])
    t(q, 'Grade', M, 286, 'bodyB', T['text']); t(q, '6A+ to 7A', M, 288, 'sub', T['muted'], w=CW, align='right')
    hist = [3, 6, 9, 12, 14, 13, 11, 9, 8, 6, 4, 3, 2, 1]
    bw = (CW - 13 * 6) / 14
    for i, v in enumerate(hist):
        inr = 2 <= i <= 8
        q.rect(M + i * (bw + 6), 380 - v * 5, bw, v * 5, T['text'] if inr else T['track'], r=bw / 2, name='Grade count')
    q.rect(M, 394, CW, 6, T['track'], r=3)
    x1, x2 = M + 2 * (bw + 6), M + 8 * (bw + 6) + bw
    q.rect(x1, 394, x2 - x1, 6, T['text'], r=3)
    for xx in (x1 - 14, x2 - 14):
        q.ellipse(xx, 383, 28, 28, '#FFFFFF', stroke=T['text'], sw=2, name='Thumb')
    t(q, '5+', M, 422, 'caption', T['muted']); t(q, '8B+', M, 422, 'caption', T['muted'], w=CW, align='right')
    t(q, 'Sort by', M, 466, 'bodyB', T['text'])
    x = M; y = 500
    for c in ['Most climbed', 'Top rated', 'Easiest first', 'Hardest first', 'A to Z']:
        wdt = measure(q, c, 'sub') + 36
        if x + wdt > W - M: x = M; y += 48
        chip(q, T, x, y, c, selected=c == 'Most climbed'); x += wdt + 8
    y += 64
    setting_row(q, T, M, y, CW, 'Hide what I have sent', 'off')
    setting_row(q, T, M, y + 64, CW, 'Only my hold sets', 'on', sub='3 of 6 hold sets', last=True)
    button(q, T, M, 748, CW, 'Show 151 problems', 'primary', 'L')
    home_bar(q, T['text'])


def legend(q, T, y, cx=W / 2):
    items = [('start', 'Start'), ('hold', 'Hold'), ('finish', 'Finish')]
    total = 3 * 80
    lx = cx - total / 2 + 6
    for k, lbl in items:
        c = WALL[k]
        q.ellipse(lx, y + 3, 15, 15, c + '24', stroke=c, sw=2, name=f'Legend / {k}')
        if k != 'hold': q.ellipse(lx + 5, y + 8, 5, 5, c)
        t(q, lbl, lx + 22, y, 'caption', T['text']); lx += 80


def tries(q, T, y, n='4'):
    q.rect(M, y, CW, 80, T['surface'], r=40, stroke=T['line2'], name='Tries')
    t(q, 'Tries', M + 24, y + 28, 'bodyB', T['text'])
    for bx, ic in ((W - M - 216, 'minus'), (W - M - 72, 'plus')):
        q.ellipse(bx, y + 8, 64, 64, None, stroke=T['text'], sw=1.5, name=f'Tries / {ic}')
        icon(q, ic + '-bold', bx + 20, y + 28, 24, T['text'])
    t(q, n, W - M - 148, y + 24, 'num', T['text'], w=72, align='center', size=28)


def problem_head(q, T, lit=False, saved=False, reconnect=False, own=False):
    status(q, T['text'])
    nav(q, T, 'back', None, right=(['lightbulb-filament-fill'] if lit else []) + ['list-plus', 'dots-three-vertical' if own else ('heart-fill' if saved else 'heart')])
    if reconnect:
        t(q, 'Reconnecting…', 80, 63, 'row', T['text'], name='Header status')
    else:
        t(q, '6 of 151' if not own else 'Set by you', 80, 63, 'row', T['text'])
    nm = 'Tuesday crimps' if own else 'Flowers for Dayz'
    t(q, nm, M, 112, 'title', T['text'], size=26, weight=900)
    if own:
        t(q, 'Set by you  ·  feet follow hands', M, 148, 'caption', T['muted'])
    else:
        icon(q, 'seal-check-fill', M, 150, 16, T['text'])
        t(q, 'Benchmark  ·  set by Corey Zee', M + 22, 148, 'caption', T['muted'])
    if reconnect:
        icon(q, 'bluetooth-slash', M - 1, 170, 16, T['text']); st = 'Reconnecting lights  ·  try 4'
    elif lit:
        icon(q, 'lightbulb-filament-fill', M - 1, 170, 16, T['text']); st = 'Lit on the wall  ·  try 4'
    else:
        q.ellipse(M + 1, 173, 13, 13, None, stroke=T['text'], sw=1.5); st = 'Project  ·  3 tries'
    t(q, st, M + 22, 170, 'caption', T['text'])
    t(q, '6C+' if own else '7A', W - M - 80, 110, 'bignum', T['text'], w=80, align='right')


def problem(q, T, lit=False, reconnect=False, own=False):
    if reconnect: lit = True
    problem_head(q, T, lit, reconnect=reconnect, own=own)
    WW = 252
    wh = B.moonwall(q, T, (W - WW) / 2, 200, WW, B.MUFFLER if own else B.FLOWERS, lit=lit and not reconnect)
    y = 200 + wh + 12
    legend(q, T, y + 8)
    if not lit:
        icon_button(q, T, M, y, 'caret-left', 'ghost', label='Previous problem')
        icon_button(q, T, W - M - 48, y, 'caret-right', 'ghost', label='Next problem')
    if lit:
        by = bottom_bar(q, T, 204)
        tries(q, T, by)
        button(q, T, M, by + 92, CW, 'Sent it', 'primary', 'L', icon_name='check')
    else:
        by = bottom_bar(q, T, 116)
        bw = (CW - 12) / 2
        button(q, T, M, by, bw, 'Log a go', 'ghost', 'L')
        button(q, T, M + bw + 12, by, bw, 'Light it up', 'primary', 'L', icon_name='lightbulb-filament')
    home_bar(q, T['text'])


def own_menu(q, T):
    problem(q, T, own=True)
    dialog(q, T, 'Tuesday crimps', 'A problem you set on this board.', [('Share as a code', 'ghost'), ('Edit holds and name', 'ghost'),
                                                                        ('Delete problem', 'ghost')])


def problem_full(q, T):
    """Scrolled: the wall slides up under the header; stats and your log follow."""
    status(q, T['text'])
    nav(q, T, 'back', None, right=['list-plus', 'heart-fill'])
    t(q, 'Flowers for Dayz', 80, 63, 'row', T['text'])
    with q.frame(0, 112, W, 150, None, name='Wall (scrolled, clipped)'):
        B.moonwall(q, T, (W - 286) / 2, 112 - 300, 286, B.FLOWERS)
    y = 286
    w3 = (CW - 16) / 3
    for i, (v, k) in enumerate([('7.1k', 'sends'), ('4.2', 'stars'), ('3.1', 'avg tries')]):
        card(q, T, M + i * (w3 + 8), y, w3, 84, r=28)
        t(q, v, M + i * (w3 + 8), y + 16, 'num', T['text'], w=w3, align='center')
        t(q, k, M + i * (w3 + 8), y + 48, 'caption', T['muted'], w=w3, align='center')
    y += 116
    section(q, T, 'Your log', y); y += 44
    for sent, txt, when in [(False, 'No send  ·  3 tries', 'Mon')]:
        if sent: icon(q, 'check-circle-fill', M, y + 16, 20, T['text'])
        else: q.ellipse(M + 2, y + 18, 16, 16, None, stroke=T['text'], sw=1.5)
        t(q, txt, M + 32, y + 16, 'sub', T['text'], w=CW - 150)
        t(q, when, W - M - 116, y + 16, 'sub', T['muted'], w=64, align='right')
        icon_button(q, T, W - M - 44, y + 4, 'dots-three-vertical', 'plain', isz=20, label='Entry options')
        hairline(q, T, M + 32, y + 55, CW - 32); y += 56
    by = bottom_bar(q, T, 116)
    bw = (CW - 12) / 2
    button(q, T, M, by, bw, 'Log a go', 'ghost', 'L')
    button(q, T, M + bw + 12, by, bw, 'Light it up', 'primary', 'L', icon_name='lightbulb-filament')
    home_bar(q, T['text'])


def log_send(q, T):
    problem(q, T, lit=True)
    scrim(q, T)
    sheet(q, T, 206, 'Log this go')
    y = 282
    segmented(q, T, M, y, CW, ['Sent', 'Not yet'], 0, h=56); y += 80
    label(q, T, 'TRIES', M, y); y += 22
    stepper(q, T, M, y, CW, '4'); y += 88
    label(q, T, 'THE GRADE FELT', M, y); y += 22
    segmented(q, T, M, y, CW, ['Soft', 'Fair', 'Stiff'], None); y += 72
    label(q, T, 'YOUR RATING  ·  OPTIONAL', M, y); y += 22
    for i in range(5):
        icon(q, 'star', M + i * 58 + 2, y + 2, 44, T['muted2'])
    y += 60
    q.rect(M, y, CW, 52, T['surface'], r=12, stroke=T['line2'], name='Note')
    t(q, 'Add a note', M + 16, y + 15, 'body', T['muted'])
    button(q, T, M, 748, CW, 'Save', 'primary', 'L')
    home_bar(q, T['text'])


def circuit_sheet(q, T):
    problem(q, T)
    scrim(q, T)
    sheet(q, T, 400, 'Add to circuit')
    y = 484
    for nm, n, on in [('7A pyramid', '6 problems', True), ('Tuesday projects', '3 problems', True), ('Warm-up', '4 problems', False)]:
        t(q, nm, M, y + 10, 'bodyB', T['text']); t(q, n, M, y + 34, 'caption', T['muted'])
        checkbox(q, T, W - M - 26, y + 18, on); hairline(q, T, M, y + 63, CW); y += 64
    icon(q, 'plus', M, y + 20, 22, T['text']); t(q, 'New circuit', M + 34, y + 19, 'bodyB', T['text'])
    button(q, T, M, 748, CW, 'Done', 'primary', 'L')
    home_bar(q, T['text'])


def new_problem(q, T):
    status(q, T['text'])
    nav(q, T, 'close', 'New problem')
    icon(q, 'lightbulb-filament-fill', W / 2 - 92, 114, 18, T['text'])
    t(q, 'Mirroring on the wall', W / 2 - 68, 113, 'caption', T['text'])
    P = [('D', 4, 'start'), ('F', 4, 'start'), ('E', 8, 'hold'), ('H', 10, 'hold'), ('C', 12, 'hold'), ('G', 14, 'hold')]
    wh = B.moonwall(q, T, (W - 280) / 2, 146, 280, P)
    t(q, '2 start  ·  4 holds  ·  add a finish hold', 0, 146 + wh + 8, 'sub', T['text'], w=W, align='center')
    t(q, 'Tap a hold again to remove it. Up to 30 holds.', 0, 156 + wh + 30, 'caption', T['muted'], w=W, align='center')
    # loupe: holds are ~24 pt apart, so a press shows the hold under the finger, enlarged, and snaps to it
    from pp import shadow
    cx, cy = 55 + 22 + 6 * 22.55 + 11.3, 146 + 18 + 4 * 22.55 + 11.3
    cx += 0; cy += 30
    lp = q.ellipse(cx - 52, cy - 150, 104, 104, T['surface'], stroke=T['text'], sw=2, name='Loupe')
    shadow(lp, 0, 10, 24, '#0B0F1C', 0.25)
    from ui import WALL
    q.ellipse(cx - 22, cy - 120, 44, 44, WALL['hold'] + '24', stroke=WALL['hold'], sw=3, name='Loupe / hold G14')
    t(q, 'G14', cx - 30, cy - 76, 'caption', T['text'], w=60, align='center', size=12)
    q.path(f'M{cx} {cy - 46} L{cx} {cy - 14}', stroke=T['text'], sw=2, name='Loupe / stem')
    by = bottom_bar(q, T, 176)
    q.rect(M, by, CW, 48, T['raised'], r=24, name='Role picker')
    sw = (CW - 8) / 3
    q.rect(M + 4 + 2 * sw, by + 4, sw, 40, T['surface'], r=20)
    for i, (k, l) in enumerate([('start', 'Start'), ('hold', 'Hold'), ('finish', 'Finish')]):
        cx = M + 4 + i * sw
        q.ellipse(cx + sw / 2 - 30, by + 18, 12, 12, WALL[k] + '24', stroke=WALL[k], sw=2)
        t(q, l, cx + sw / 2 - 12, by + 14, 'row', T['text'] if i == 2 else T['muted'])
    icon_button(q, T, M, by + 60, 'arrow-counter-clockwise', 'ghost', d=64, label='Undo')
    icon_button(q, T, M + 68, by + 60, 'trash', 'ghost', d=64, label='Clear all')
    button(q, T, M + 134, by + 60, CW - 134, 'Add a finish hold', 'disabled', 'L')
    home_bar(q, T['text'])


def save_problem(q, T):
    status(q, T['text'])
    nav(q, T, 'back', 'Save problem')
    B.wall_thumb(q, T, M, 116, B.FLOWERS, s=96, mono=True)
    t(q, '7 holds', M + 88, 122, 'title', T['text'])
    t(q, '1 start  ·  5 holds  ·  1 finish', M + 88, 154, 'sub', T['muted'])
    t(q, 'Masters 2019  ·  40°', M + 88, 178, 'caption', T['muted'])
    y = 236
    y += field(q, T, M, y, CW, 'Name', 'Tuesday crimps', focused=True) + 24
    t(q, 'Grade', M, y, 'caption', T['muted'])
    x = M
    for g in ['Open', '6B+', '6C', '6C+', '7A', '7A+']:
        x += chip(q, T, x, y + 24, g, selected=g == '6C+') + 8
    y += 88
    t(q, 'Feet', M, y, 'caption', T['muted']); segmented(q, T, M, y + 24, CW, ['Any', 'With hands', 'None'], 0)
    y += 100
    q.rect(M, y, CW, 96, T['surface'], r=12, stroke=T['line2'], name='Notes')
    t(q, 'Notes for whoever climbs it next', M + 16, y + 14, 'body', T['muted'])
    by = bottom_bar(q, T)
    bw = (CW - 12) / 2
    button(q, T, M, by, bw, 'Back', 'ghost', 'L')
    button(q, T, M + bw + 12, by, bw, 'Save problem', 'primary', 'L')
    home_bar(q, T['text'])


def setup(q, T, step='layout'):
    status(q, T['text'])
    nav(q, T, 'back' if step != 'layout' else 'close', 'Set up board')
    n = {'layout': 1, 'angle': 2, 'holds': 3}[step]
    set_bars(q, T, M, 116, CW, n, 3, h=8)
    label(q, T, f'STEP {n} OF 3', M, 136)
    if step == 'layout':
        t(q, 'Which MoonBoard is\non your wall?', M, 164, 'hero', T['text'])
        y = 248
        for nm, meta, cnt, sel in [('MoonBoard 2016', '11 × 18  ·  40°', '412 benchmarks', False), ('Masters 2017', '11 × 18  ·  25° or 40°', '598 benchmarks', False),
                                   ('Masters 2019', '11 × 18  ·  25° or 40°', '831 benchmarks', True), ('Mini MoonBoard 2020', '11 × 12  ·  40°', '119 benchmarks', False)]:
            q.rect(M, y, CW, 92, T['surface'], r=24, stroke=T['text'] if sel else T['line'], sw=2 if sel else 1, name=f'Layout / {nm}')
            for i in range(4):
                for j in range(5):
                    q.ellipse(M + 20 + i * 9, y + 22 + j * 10, 4, 4, T['muted'])
            t(q, nm, M + 72, y + 16, 'row', T['text']); t(q, meta, M + 72, y + 40, 'caption', T['muted']); t(q, cnt, M + 72, y + 60, 'caption', T['text'])
            icon(q, 'check-circle-fill' if sel else 'circle', W - M - 40, y + 34, 24, T['text'] if sel else T['line2'])
            y += 104
        btn = 'Continue'
    elif step == 'angle':
        t(q, 'How steep is it?', M, 164, 'hero', T['text'])
        t(q, 'Masters 2019 is built at two angles. Problems and grades differ on each.', M, 206, 'sub', T['muted'], w=CW)
        cw2 = (CW - 12) / 2
        for i, (ang, cnt) in enumerate([('25°', '402 benchmarks'), ('40°', '831 benchmarks')]):
            x = M + i * (cw2 + 12); sel = i == 1
            q.rect(x, 270, cw2, 230, T['surface'], r=24, stroke=T['text'] if sel else T['line'], sw=2 if sel else 1, name=f'Angle / {ang}')
            import math
            a = math.radians(25 if i == 0 else 40)
            x0, y0 = x + 40, 440
            q.path(f'M{x0} {y0} L{x0 + 110 * math.sin(a)} {y0 - 110 * math.cos(a)}', stroke=T['text'], sw=6, name='Wall side')
            q.path(f'M{x0 - 10} {y0} H{x0 + cw2 - 70}', stroke=T['muted'], sw=2, name='Floor')
            q.path(f'M{x0} {y0} V{y0 - 120}', stroke=T['line2'], sw=1.5, name='Vertical')
            t(q, ang, x + 20, 290, 'bignum', T['text'])
            t(q, cnt, x + 20, 460, 'caption', T['muted'])
        t(q, 'Not sure? Measure from vertical: 40° leans much further over you.', M, 524, 'caption', T['muted'], w=CW)
        btn = 'Continue'
    else:
        t(q, 'Which hold sets\nare on it?', M, 164, 'hero', T['text'])
        t(q, 'You only see problems you can climb.', M, 240, 'sub', T['muted'])
        card(q, T, M, 280, CW, 6 * 64, r=24)
        y = 280
        for i, (nm, sw_, cnt, on) in enumerate([('Hold set A', '#FFFFFF', '812', True), ('Hold set B', '#141A2E', '790', True),
                                                ('Original School Holds', '#E9C64A', '760', True), ('Hold set C', '#D9483B', '402', False),
                                                ('Wooden holds A', '#C9A27A', '211', False), ('Wooden holds B', '#B48B5E', '96', False)]):
            q.ellipse(M + 18, y + 18, 28, 28, sw_, stroke=T['text'] + '59', name=f'Set swatch / {nm}')
            t(q, nm, M + 60, y + 12, 'row', T['text']); t(q, f'{cnt} benchmarks use it', M + 60, y + 34, 'caption', T['muted'])
            checkbox(q, T, W - M - 44, y + 19, on)
            if i < 5: hairline(q, T, M + 60, y + 63, CW - 60)
            y += 64
        btn = 'Finish setup'
    by = bottom_bar(q, T, 140 if step == 'holds' else 112)
    if step == 'holds':
        t(q, '742 of 831 benchmarks fit your holds', M, by - 2, 'caption', T['muted'], w=CW, align='center'); by += 24
    if n > 1:
        bw = (CW - 12) / 2
        button(q, T, M, by, bw, 'Back', 'ghost', 'L')
        button(q, T, M + bw + 12, by, bw, btn, 'primary', 'L')
    else:
        button(q, T, M, by, CW, btn, 'primary', 'L')
    home_bar(q, T['text'])


def lights_prompt(q, T):
    status(q, T['text'])
    B.moonwall(q, T, M + 60, 90, CW - 120, B.FLOWERS, coords=False, r=20)
    t(q, 'Got lights on it?', M, 470, 'hero', T['text'])
    t(q, 'With the MoonBoard LED kit, every problem shows on the wall itself. You can connect later from Climb.', M, 514, 'body', T['muted'], w=CW)
    button(q, T, M, 652, CW, 'Connect lights', 'primary', 'L', icon_name='bluetooth')
    button(q, T, M, 728, CW, 'Not now', 'quiet', 'M')
    home_bar(q, T['text'])


def tile(q, T, ic, y=150):
    q.rect((W - 96) / 2, y, 96, 96, T['raised'], r=30, name='Icon tile')
    icon(q, ic, (W - 44) / 2, y + 26, 44, T['text'])


def lead(q, T, title, body, y=278):
    n = title.count('\n') + 1
    t(q, title, M, y, 'hero', T['text'], w=CW, align='center')
    t(q, body, M + 8, y + n * 31 + 14, 'body', T['muted'], w=CW - 16, align='center')


def connect(q, T, phase='why'):
    status(q, T['text'])
    nav(q, T, 'close', {'why': 'Connect lights', 'searching': 'Connect lights', 'off': 'Connect lights', 'test': 'Check the lights',
                        'fix': 'Fix the lights', 'done': None, 'found': 'Connect lights', 'none': 'Connect lights', 'denied': 'Connect lights'}[phase])
    by = None
    if phase == 'why':
        tile(q, T, 'bluetooth')
        lead(q, T, 'Bluetooth, only\nfor the lights', 'Rivet talks to your board and nothing else. No internet, no location, nothing leaves this phone.')
        card(q, T, M, 470, CW, 3 * 60 + 8, r=24)
        for i, s in enumerate(['The LED kit is plugged in', 'You are standing near the board', 'No other phone is connected']):
            q.ellipse(M + 20, 488 + i * 60, 28, 28, T['raised']); t(q, str(i + 1), M + 20, 493 + i * 60, 'caption', T['text'], w=28, align='center')
            t(q, s, M + 60, 490 + i * 60, 'bodyB', T['text'])
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Continue', 'primary', 'L')
    elif phase == 'searching':
        from brand import pitch
        q.rect((W - 96) / 2, 150, 96, 96, T['raised'], r=30, name='Icon tile')
        pitch(q, (W - 60) / 2, 168, 60, T['text'], lifts=(0, 6, 0), name='Loading (bars lift in turn, 1.2 s)')
        lead(q, T, 'Looking for your board', 'This usually takes a few seconds.')
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Climb without lights', 'quiet', 'L')
    elif phase == 'found':
        lead(q, T, 'Found 2 boards', 'Tap the one on your wall.', y=120)
        y = 220
        for i, (nm, sig) in enumerate([('MoonBoard A3F2', 'Strong signal  ·  closest'), ('MoonBoard 91C0', 'Weak signal')]):
            sel = i == 0
            q.rect(M, y, CW, 80, T['surface'], r=24, stroke=T['text'] if sel else T['line'], sw=2 if sel else 1)
            q.rect(M + 16, y + 18, 44, 44, T['raised'], r=12); icon(q, 'cell-signal-high' if i == 0 else 'cell-signal-low', M + 26, y + 28, 24, T['text'])
            t(q, nm, M + 76, y + 18, 'row', T['text']); t(q, 'Connecting…' if sel else sig, M + 76, y + 42, 'caption', T['muted'])
            if sel:
                q.ellipse(W - M - 44, y + 28, 24, 24, None, stroke=T['line2'], sw=3, name='Spinner / track')
                q.path(f'M{W - M - 32} {y + 28} A12 12 0 0 1 {W - M - 20} {y + 40}', stroke=T['text'], sw=3, name='Spinner / arc')
            y += 92
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Climb without lights', 'quiet', 'L')
    elif phase == 'off':
        tile(q, T, 'bluetooth-slash')
        lead(q, T, 'Bluetooth is off', 'Turn it on, then search again.')
        by = bottom_bar(q, T, 176)
        button(q, T, M, by, CW, 'Search again', 'primary', 'L'); button(q, T, M, by + 72, CW, 'Climb without lights', 'quiet', 'M')
    elif phase == 'denied':
        tile(q, T, 'lock-simple')
        lead(q, T, 'Bluetooth is blocked', 'Allow Bluetooth for Rivet in Settings to use the lights. Everything else works without it.')
        by = bottom_bar(q, T, 176)
        button(q, T, M, by, CW, 'Open Settings', 'primary', 'L'); button(q, T, M, by + 72, CW, 'Climb without lights', 'quiet', 'M')
    elif phase == 'none':
        tile(q, T, 'magnifying-glass')
        lead(q, T, 'No board found', 'Searched for 15 seconds without a reply.')
        card(q, T, M, 384, CW, 196, r=28)
        yy = 406
        for i, s in enumerate(['The LED kit has power: its control box light is on.', 'No other phone has the board open.', 'You are within a few metres of the board.']):
            q.ellipse(M + 20, yy, 28, 28, T['raised']); t(q, str(i + 1), M + 20, yy + 5, 'caption', T['text'], w=28, align='center')
            t(q, s, M + 62, yy + 3, 'sub', T['text'], w=CW - 84)
            yy += (44 if measure(q, s, 'sub') > CW - 84 else 24) + 16
        by = bottom_bar(q, T, 176)
        button(q, T, M, by, CW, 'Search again', 'primary', 'L'); button(q, T, M, by + 72, CW, 'Climb without lights', 'quiet', 'M')
    elif phase == 'test':
        B.moonwall(q, T, M + 70, 116, CW - 140, [('A', 1, 'hold'), ('K', 1, 'hold'), ('A', 18, 'hold'), ('K', 18, 'hold')], coords=False, r=20)
        lead(q, T, 'Four corners lit?', 'Your wall should match: A1, K1, A18 and K18 in blue.', y=480)
        by = bottom_bar(q, T, 176)
        button(q, T, M, by, CW, 'Yes, it matches', 'primary', 'L'); button(q, T, M, by + 72, CW, 'No, something is off', 'ghost', 'L')
    elif phase == 'fix':
        t(q, 'What do you see\non the wall?', M, 112, 'hero', T['text'])
        y = 200
        for i, (ic, a, b_) in enumerate([('arrows-left-right', 'Left and right swapped', 'We mirror the lights for you.'),
                                         ('arrows-down-up', 'Top and bottom swapped', 'We reverse the strip direction.'),
                                         ('dots-nine', 'Wrong holds light up', 'Check which board is set up.'),
                                         ('power', 'Nothing lights up', 'Check the power, then test again.')]):
            on = i == 0
            q.rect(M, y, CW, 84, T['surface'], r=24, stroke=T['text'] if on else T['line'], sw=2 if on else 1)
            q.rect(M + 16, y + 20, 44, 44, T['raised'], r=14); icon(q, ic, M + 27, y + 31, 22, T['text'])
            t(q, a, M + 76, y + 20, 'row', T['text']); t(q, b_, M + 76, y + 44, 'caption', T['muted'])
            if on: icon(q, 'check-circle-fill', W - M - 40, y + 30, 24, T['text'])
            y += 96
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Test again', 'primary', 'L')
    elif phase == 'done':
        tile(q, T, 'check-circle', y=110)
        lead(q, T, 'Lights connected', 'MoonBoard A3F2 reconnects by itself when you open Climb near the board.', y=236)
        card(q, T, M, 380, CW, 3 * 76, r=24)
        for i, (a, b_, on) in enumerate([('Light above holds too', 'LED kit V2 and newer', False), ('Light as I browse', 'Swiping problems changes the wall', True),
                                         ('Connect automatically', 'When Climb opens near the board', True)]):
            setting_row(q, T, M + 20, 380 + i * 76 + 6, CW - 40, a, 'on' if on else 'off', sub=b_, h=64, last=i == 2)
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Start climbing', 'primary', 'L')
    home_bar(q, T['text'])


def lights_settings(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'Board lights', 112)
    card(q, T, M, 172, CW, 96, r=24)
    q.rect(M + 20, 196, 48, 48, T['raised'], r=16); icon(q, 'bluetooth-connected', M + 32, 208, 24, T['text'])
    t(q, 'MoonBoard A3F2', M + 84, 194, 'row', T['text'])
    q.ellipse(M + 84, 224, 8, 8, T['text']); t(q, 'Connected', M + 98, 218, 'caption', T['text'])
    card(q, T, M, 288, CW, 3 * 76, r=24)
    for i, (a, b_, on) in enumerate([('Light above holds too', 'LED kit V2 and newer', False), ('Light as I browse', 'Swiping problems changes the wall', True),
                                     ('Connect automatically', 'When Climb opens near the board', True)]):
        setting_row(q, T, M + 20, 288 + i * 76 + 6, CW - 40, a, 'on' if on else 'off', sub=b_, h=64, last=i == 2)
    bw = (CW - 12) / 2
    button(q, T, M, 544, bw, 'Test lights', 'ghost', 'M'); button(q, T, M + bw + 12, 544, bw, 'Disconnect', 'ghost', 'M')
    button(q, T, M, 608, CW, 'Forget this board', 'quiet', 'M', icon_name='trash')
    home_bar(q, T['text'])


def board_settings(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'MoonBoard', 112)
    card(q, T, M, 172, CW, 120, r=24, fill=T['raised'])
    B.wall_thumb(q, T, M + 20, 192, B.FLOWERS, s=80, mono=True)
    t(q, 'Masters 2019', M + 96, 192, 'title', T['text']); t(q, '40°  ·  3 of 6 hold sets', M + 96, 224, 'sub', T['muted'])
    t(q, '742 benchmarks  ·  4 of your own', M + 96, 250, 'caption', T['text'])
    card(q, T, M, 312, CW, 128, r=24)
    setting_row(q, T, M + 20, 312, CW - 40, 'Board, angle and holds', 'chevron', '3 of 6')
    setting_row(q, T, M + 20, 376, CW - 40, 'Lights', 'chevron', 'Connected', last=True)
    label(q, T, 'YOUR OTHER BOARDS', M, 468)
    card(q, T, M, 492, CW, 64, r=24)
    setting_row(q, T, M + 20, 492, CW - 40, 'Mini MoonBoard 2020', 'chevron', 'Switch', sub='40°  ·  12 rows', last=True)
    button(q, T, M, 580, CW, 'Add another board', 'ghost', 'M', icon_name='plus')
    button(q, T, M, 640, CW, 'Remove this board', 'quiet', 'M', icon_name='trash')
    t(q, 'Your sends and your own problems stay in the app.', M, 694, 'caption', T['muted'], w=CW, align='center')
    home_bar(q, T['text'])


def circuit(q, T):
    status(q, T['text'])
    nav(q, T, 'back', right=['pencil-simple'])
    large_title(q, T, '7A pyramid', 112, sub='6 problems  ·  6A+ to 7A  ·  last done 2 Nov')
    section(q, T, 'In order', 212)
    y = 252
    for i, p in enumerate(PROBLEMS[:6]):
        y += problem_row(q, T, y, p, index=i + 1)
    by = bottom_bar(q, T); button(q, T, M, by, CW, 'Start circuit', 'primary', 'L', icon_name='play')
    home_bar(q, T['text'])


def circuit_edit(q, T):
    status(q, T['text'])
    nav(q, T, 'back', 'Edit circuit')
    field(q, T, M, 116, CW, 'Name', '7A pyramid')
    section(q, T, 'Problems', 222); t(q, 'Drag to reorder', M, 226, 'caption', T['muted'], w=CW, align='right')
    y = 262
    for p in PROBLEMS[:5]:
        icon(q, 'minus-circle', M, y + 24, 24, T['text'])
        B.wall_thumb(q, T, M + 36, y + 6, p[5], s=56)
        t(q, p[0], M + 80, y + 14, 'row', T['text']); t(q, f'{p[3]}  ·  {p[1].split("  ·  ")[0]}', M + 80, y + 36, 'caption', T['muted'])
        icon(q, 'dots-six-vertical', W - M - 24, y + 24, 24, T['muted'])
        hairline(q, T, M + 80, y + 67, CW - 80); y += 68
    button(q, T, M, y + 16, CW, 'Add problems', 'ghost', 'M', icon_name='plus')
    button(q, T, M, y + 76, CW, 'Delete circuit', 'quiet', 'M', icon_name='trash')
    by = bottom_bar(q, T); button(q, T, M, by, CW, 'Done', 'primary', 'L')
    home_bar(q, T['text'])


def circuit_run(q, T, done=False):
    status(q, T['text'])
    icon_button(q, T, M - 4, 52, 'x', 'ghost', label='End circuit')
    t(q, '7A pyramid', 80, 63, 'row', T['text'], w=W - 160, align='center')
    if done:
        tile(q, T, 'check-circle', y=110)
        lead(q, T, 'Circuit done', '7A pyramid  ·  saved to your log', y=232)
        w4 = (CW - 24) / 4
        for i, (v, k) in enumerate([('4 of 6', 'sent'), ('38 min', 'total'), ('14', 'tries'), ('6C', 'hardest')]):
            card(q, T, M + i * (w4 + 8), 330, w4, 76, r=18)
            t(q, v, M + i * (w4 + 8), 344, 'row', T['text'], w=w4, align='center'); t(q, k, M + i * (w4 + 8), 370, 'caption', T['muted'], w=w4, align='center')
        y = 430
        for i, (p, r_) in enumerate(zip(PROBLEMS[:6], ['Flash', '2 tries', '3 tries', '4 tries', 'Not sent', 'Skipped'])):
            y += problem_row(q, T, y, p, index=i + 1, right=r_, h=68) if False else 0
            t(q, str(i + 1), M, y + 20, 'row', T['muted']); t(q, p[0], M + 30, y + 20, 'row', T['text'])
            t(q, r_, W - M - 120, y + 20, 'sub', T['text'] if 'Not' not in r_ and 'Skip' not in r_ else T['muted'], w=120, align='right')
            hairline(q, T, M + 30, y + 55, CW - 30); y += 56
        by = bottom_bar(q, T); bw = (CW - 12) / 2
        button(q, T, M, by, bw, 'Again', 'ghost', 'L'); button(q, T, M + bw + 12, by, bw, 'Done', 'primary', 'L')
        home_bar(q, T['text']); return
    t(q, 'Problem 3 of 6', 80, 86, 'caption', T['muted'], w=W - 160, align='center')
    set_bars(q, T, M, 116, CW, 2, 6, h=6, gap=4)
    q.rect(M + 2 * ((CW - 20) / 6 + 4), 116, (CW - 20) / 6, 6, T['muted'], r=3, name='Current problem')
    wh = B.moonwall(q, T, (W - 252) / 2, 136, 252, B.VICTORIA, lit=True)
    y = 136 + wh + 12
    t(q, 'VV Victoria', M, y, 'title', T['text']); t(q, 'Next: Black Muffler  ·  6C', M, y + 30, 'caption', T['muted'])
    t(q, '6B+', W - M - 80, y - 4, 'num', T['text'], w=80, align='right')
    by = bottom_bar(q, T, 204)
    tries(q, T, by, '1')
    bw = (CW - 12) / 2
    button(q, T, M, by + 92, bw, 'Not sent, next', 'ghost', 'L'); button(q, T, M + bw + 12, by + 92, bw, 'Sent it', 'primary', 'L', icon_name='check')
    home_bar(q, T['text'])


def board_session(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'Board session', 112, sub='Mon 16 Nov  ·  18:02 to 18:36\nMasters 2019  ·  40°')
    card(q, T, M, 210, CW, 168, name='Facts')
    for i, (k, v) in enumerate([('Time', '34 min'), ('Sends', '2 of 9'), ('Hardest send', '6B'), ('Tries', '23')]):
        cx = M + 24 + (i % 2) * (CW / 2); cy = 232 + (i // 2) * 72
        t(q, k, cx, cy, 'caption', T['muted']); t(q, v, cx, cy + 20, 'bignum', T['text'], size=28)
    q.rect(M + CW / 2, 230, 1, 128, T['line']); q.rect(M + 20, 294, CW - 40, 1, T['line'])
    section(q, T, 'Problems', 410)
    y = 450
    for p, r_ in zip(PROBLEMS[:5], ['Flash', 'Sent on try 2', '5 tries · no send', '3 tries · no send', '2 tries · no send']):
        y += problem_row(q, T, y, p, right=r_)
    by = bottom_bar(q, T); button(q, T, M, by, CW, 'Climb these again', 'primary', 'L', icon_name='repeat')
    home_bar(q, T['text'])
