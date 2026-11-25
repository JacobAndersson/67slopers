"""Rivet app UI kit for Penpot: tokens from the brand kit and every component the screens use.

All functions draw on a pp.Board (or pp.Scaled) in screen coordinates (390 x 844 pt). The rules
come from the brand book, chapter 06 Digital:
- Snow canvas, white surface cards (radius 28) with a hairline, Night text, Granite muted text.
- Primary actions are a solid Ink pill (Night on light, Snow on dark), secondary an Ink ghost.
- Glow is the colour of the hang: the Hang screen only. Never a button, an icon, a chart.
- Phosphor Regular in the interface, Fill for the selected dock tab and for play/pause inside solid pills, Bold for the timer's ghost rounds.
- 64 pt targets for anything touched mid-session, 48 pt elsewhere; 24 pt side margins.
"""
import hashlib
import re
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ICON_DIRS = [HERE / 'icons', HERE.parent / 'icons', HERE.parent / 'icons' / 'custom']
PHOSPHOR = Path('/tmp/claude-1001/-home-jacob-workspace-67slopers/d051e0c7-6e65-4784-b8f1-75d17ff56a39/scratchpad/ph/package/assets')
F = 'Nunito'
W, H = 390, 844
M = 24  # side margin

# ---- palette & roles (design/rivet/kit/tokens/rivet.tokens.json) ------------------------
SNOW, PAPER, NIGHT, GLOW, GLACIER, DUSK, GRANITE, STONE = (
    '#F8F6F3', '#F2ECE3', '#141A2E', '#F28C6E', '#C3DCE5', '#8F88CC', '#6B6E73', '#E4E0DA')
GLACIER_S = ['#F0F7F9', '#DDECF1', '#C3DCE5', '#9CC3D1', '#6C9FB2', '#467B8F', '#2B5161']
DUSK_S = ['#F1F0FA', '#DEDBF3', '#BDB7E6', '#8F88CC', '#6E66B2', '#524A8E', '#363062']
NIGHT_S = ['#E7E8EC', '#C5C8D2', '#8C92A6', '#555D78', '#2E3650', '#141A2E', '#0B0F1C']

LIGHT = dict(name='light', canvas=SNOW, surface='#FFFFFF', raised=STONE, text=NIGHT, muted=GRANITE,
             line='#141A2E14', line2='#141A2E29', track=STONE, bar=STONE, action=NIGHT, on_action=SNOW,
             scrim='#0B0F1C66', muted2='#4A4F5C', hang=GLOW, rest=GLACIER, recover=SNOW, board=DUSK_S[4], board_soft=DUSK_S[1],
             hangs=NIGHT, heat=GLACIER_S, dock=NIGHT, dock_fg=SNOW, dock_dim='#8C92A6', disabled_bg=STONE,
             disabled_fg=GRANITE, selected_tile='#FFFFFF1F', segment_tile='#FFFFFF')
DARK = dict(name='dark', canvas='#0B0F1C', surface=NIGHT, raised='#2E3650', text=SNOW, muted='#8C92A6',
            line='#FFFFFF1A', line2='#FFFFFF33', track='#1F2640', bar='#3A4363', action=SNOW, on_action=NIGHT,
            scrim='#00000099', muted2='#A9AEBF', hang=GLOW, rest=GLACIER, recover=NIGHT, board=DUSK_S[2], board_soft='#363062',
            hangs=SNOW, heat=['#1C2440', '#1C3140', '#24485A', '#2B5161', '#467B8F', '#6C9FB2', '#9CC3D1'],
            dock=SNOW, dock_fg=NIGHT, dock_dim='#555D78', disabled_bg='#1F2640', disabled_fg='#8C92A6',
            selected_tile='#141A2E1A', segment_tile='#555D78')

# MoonBoard LED colours. Hardware, not brand: they match the lights on the wall, so climbers can
# read the screen and the wall as one. Always paired with shape (ring weight) and a legend word.
WALL = dict(start='#2E9E6B', hold='#3D6FD6', finish='#D9483B', foot='#E0A030')

# ---- type scale (brand book p.32, app sizes) ---------------------------------------------
TYPE = {
    'timer': (200, 900, -6, 1.0),
    'phase': (44, 900, -1, 1.05),
    'large': (34, 900, -0.34, 1.08),
    'hero': (28, 900, -0.28, 1.1),
    'title': (22, 800, 0, 1.2),
    'body': (17, 600, 0, 1.35),
    'bodyB': (17, 800, 0, 1.3),
    'row': (16, 800, 0, 1.3),
    'sub': (15, 700, 0, 1.35),
    'caption': (13, 700, 0, 1.3),
    'label': (12, 800, 1.68, 1.2),
    'num': (22, 900, -0.2, 1.1),
    'bignum': (34, 900, -0.5, 1.05),
}


def t(q, s, x, y, style='body', color=NIGHT, w=None, align='left', name=None, size=None, weight=None, lh=None, ls=None):
    sz, wt, tr, l = TYPE[style]
    return q.text(s, x, y, w=w, size=size or sz, font=F, weight=weight or wt, color=color, lh=lh or l,
                  ls=tr if ls is None else ls, align=align, upper=style == 'label', name=name)


def measure(q, s, style='body', size=None, weight=None):
    sz, wt, tr, _ = TYPE[style]
    doc = q.doc
    s2 = s.upper() if style == 'label' else s
    return doc.measure(s2, F, weight or wt, size or sz, tr)


# ---- icons ---------------------------------------------------------------------------------
def _icon_file(name):
    for d in ICON_DIRS:
        f = d / f'{name}.svg'
        if f.exists(): return f
    weight = 'regular'
    for w in ('bold', 'fill', 'light', 'thin', 'duotone'):
        if name.endswith('-' + w): weight = w
    src = PHOSPHOR / weight / f'{name}.svg'
    if not src.exists(): raise FileNotFoundError(name)
    dst = HERE / 'icons' / src.name
    shutil.copy(src, dst)
    return dst


def icon(q, name, x, y, size=24, color=NIGHT):
    d = ' '.join(re.findall(r' d="([^"]+)"', _icon_file(name).read_text()))
    return q.path(d, x, y, size / 256, fill=color, name='Icon / ' + name)


# ---- device chrome -------------------------------------------------------------------------
def status(q, fg=NIGHT):
    t(q, '9:41', 32, 15, 'bodyB', fg, name='Status / time')
    q.rect(334, 19, 25, 12, None, r=4, stroke=fg, sw=1.3, name='Status / battery')
    q.rect(336.5, 21.5, 17, 7, fg, r=2)
    q.rect(305, 21, 18, 9, None, r=0, name='Status / signal')
    for i in range(4):
        q.rect(305 + i * 4.5, 27 - i * 2.2, 3, 3 + i * 2.2, fg, r=1)
    q.rect(140, 11, 110, 32, '#000000', r=16, name='Dynamic Island')


def home_bar(q, fg=NIGHT):
    hh = getattr(q, 'h', H)
    q.rect(128, hh - 13, 134, 5, fg, r=2.5, name='Home indicator')


def screen(q, T, fg=None):
    status(q, fg or T['text'])


# ---- surfaces ------------------------------------------------------------------------------
def card(q, T, x, y, w, h, r=28, fill=None, name='Card', stroke=None):
    return q.rect(x, y, w, h, fill or T['surface'], r=r, stroke=stroke or T['line'], sw=1.5 if stroke else 1, name=name)


def hairline(q, T, x, y, w):
    return q.rect(x, y, w, 1, T['line'], name='Hairline')


# ---- buttons -------------------------------------------------------------------------------
SIZES = {'L': (64, 18), 'M': (52, 17), 'S': (48, 16)}


# Brand review: play and pause read at a glance inside a solid pill only in Phosphor Fill. Every solid
# Night pill (Start, Resume, Pause, Keep going, Do it again, Continue) carries the Fill glyph; the ghost
# rounds beside them keep Bold, the rest of the interface Regular.
SOLID = ('primary', 'on')


def solid_glyph(name):
    base = name.removesuffix('-bold')
    return base + '-fill' if base in ('play', 'pause') else name


def button(q, T, x, y, w, label, kind='primary', size='L', icon_name=None, name=None):
    """Ink pill. kind: primary (solid), ghost (hairline), disabled, quiet (text only),
    on (solid Night on a state colour), on_ghost (Night hairline on a state colour)."""
    h, fs = SIZES[size]
    fill, fg, stroke = {
        'primary': (T['action'], T['on_action'], None),
        'ghost': (None, T['text'], T['text']),
        'disabled': (T['disabled_bg'], T['disabled_fg'], None),
        'quiet': (None, T['text'], None),
        'on': (NIGHT, SNOW, None),
        'on_ghost': (None, NIGHT, NIGHT),
    }[kind]
    q.rect(x, y, w, h, fill, r=h / 2, stroke=stroke, sw=1.5, name=name or f'Button / {kind} / {label}')
    tw = measure(q, label, 'bodyB', size=fs)
    if icon_name:
        isz = 20 if size != 'S' else 18
        gap = 8
        total = isz + gap + tw
        ix = x + (w - total) / 2
        icon(q, solid_glyph(icon_name) if kind in SOLID else icon_name, ix, y + (h - isz) / 2, isz, fg)
        t(q, label, ix + isz + gap, y + (h - fs * 1.3) / 2, 'bodyB', fg, size=fs)
    else:
        t(q, label, x, y + (h - fs * 1.3) / 2, 'bodyB', fg, w=w, align='center', size=fs)
    return h


def icon_button(q, T, x, y, name, kind='ghost', d=48, isz=22, color=None, label=None):
    """Round button. kind: ghost (surface + hairline), primary (Ink), plain (no chrome), on (Night on state)."""
    fill, fg, stroke = {
        'ghost': (T['surface'], T['text'], T['line2']),
        'primary': (T['action'], T['on_action'], None),
        'plain': (None, T['text'], None),
        'on': (NIGHT, SNOW, None),
        'on_ghost': (None, NIGHT, NIGHT + '40'),
    }[kind]
    q.ellipse(x, y, d, d, fill, stroke=stroke, sw=1, name=f'IconButton / {name}' + (f' / {label}' if label else ''))
    icon(q, solid_glyph(name) if kind in SOLID else name, x + (d - isz) / 2, y + (d - isz) / 2, isz, color or fg)


def chip(q, T, x, y, label, selected=False, h=48, icon_name=None, count=None):
    tw = measure(q, label, 'sub', size=15)
    pad = 18
    iw = 22 if icon_name else 0
    cw = 0
    if count is not None: cw = 26
    w = tw + 2 * pad + iw + cw
    fill, fg, stroke = (T['action'], T['on_action'], None) if selected else (None, T['text'], T['line2'])
    q.rect(x, y, w, h, fill, r=h / 2, stroke=stroke, sw=1, name=f'Chip / {"on" if selected else "off"} / {label}')
    cx = x + pad
    if icon_name:
        icon(q, icon_name, cx - 2, y + (h - 18) / 2, 18, fg); cx += iw
    t(q, label, cx, y + (h - 15 * 1.35) / 2, 'sub', fg, size=15)
    if count is not None:
        q.ellipse(cx + tw + 6, y + (h - 20) / 2, 20, 20, T['on_action'] if selected else T['action'])
        t(q, str(count), cx + tw + 6, y + (h - 20) / 2 + 2, 'caption', T['action'] if selected else T['on_action'], w=20, align='center', size=12)
    return w


def segmented(q, T, x, y, w, options, sel=0, h=48):
    q.rect(x, y, w, h, T['raised'], r=h / 2, name='Segmented / track')
    sw = (w - 8) / len(options)
    if sel is None:
        for i, o in enumerate(options):
            t(q, o, x + 4 + i * sw, y + (h - 16 * 1.3) / 2, 'row', T['muted2'], w=sw, align='center', size=16 if h < 60 else 18)
        return
    tile = q.rect(x + 4 + sel * sw, y + 4, sw, h - 8, T['segment_tile'], r=(h - 8) / 2,
                  name='Segmented / tile')
    from pp import shadow
    shadow(tile, 0, 2, 6, '#0B0F1C', 0.10)
    for i, o in enumerate(options):
        t(q, o, x + 4 + i * sw, y + (h - 16 * 1.3) / 2, 'row', T['text'] if i == sel else T['muted2'], w=sw, align='center',
          size=16 if h < 60 else 18)


def switch(q, T, x, y, on=True):
    q.rect(x, y, 56, 34, T['action'] if on else T['track'], r=17, name=f'Switch / {"on" if on else "off"}')
    k = q.ellipse(x + (25 if on else 3), y + 3, 28, 28, T['on_action'] if on else '#FFFFFF', name='Switch / knob')
    from pp import shadow
    if not on: shadow(k, 0, 1, 3, '#0B0F1C', 0.18)


def checkbox(q, T, x, y, on=True):
    q.rect(x, y, 26, 26, T['action'] if on else None, r=8, stroke=None if on else T['line2'], sw=1.5, name='Checkbox')
    if on: icon(q, 'check-bold', x + 4, y + 4, 18, T['on_action'])


def stepper(q, T, x, y, w, value, label=None, h=64, d=None):
    """− value +. Both buttons the same weight (neither direction is 'better'); hold repeats, tap the value to type."""
    d = d or h - 12
    if label:
        t(q, label, x, y - 26, 'caption', T['muted'])
    q.rect(x, y, w, h, T['surface'], r=h / 2, stroke=T['line2'], name='Stepper')
    for bx, ic in ((x + (h - d) / 2, 'minus'), (x + w - h + (h - d) / 2, 'plus')):
        q.ellipse(bx, y + (h - d) / 2, d, d, None, stroke=T['text'], sw=1.5, name=f'Stepper / {ic}')
        icon(q, ic + '-bold', bx + (d - 22) / 2, y + (h - 22) / 2, 22, T['text'])
    t(q, value, x, y + (h - 26 * 1.1) / 2, 'num', T['text'], w=w, align='center', size=26)


def field(q, T, x, y, w, label, value='', placeholder='', h=52, focused=False, error=None, trailing=None):
    t(q, label, x, y, 'caption', T['muted'])
    y2 = y + 24
    q.rect(x, y2, w, h, T['surface'], r=12, stroke=T['text'] if (focused or error) else (T['line2']), sw=2 if error else (1.5 if focused else 1),
           name=f'Field / {label}' + (' / invalid' if error else ''))
    if error: icon(q, 'warning-circle-fill', x + w - 38, y2 + (h - 22) / 2, 22, T['text'])
    if value:
        t(q, value, x + 16, y2 + (h - 17 * 1.35) / 2, 'body', T['text'])
        if focused:
            vw = measure(q, value, 'body')
            q.rect(x + 17 + vw, y2 + 15, 2, h - 30, T['text'], name='Caret')
    else:
        t(q, placeholder, x + 16, y2 + (h - 17 * 1.35) / 2, 'body', T['muted'])
    if trailing and not error: icon(q, trailing, x + w - 40, y2 + (h - 22) / 2, 22, T['muted'])
    if error: t(q, error, x, y2 + h + 8, 'caption', T['text'])
    return 24 + h


def search(q, T, x, y, w, placeholder='Search', h=48):
    q.rect(x, y, w, h, T['surface'], r=h / 2, stroke=T['line2'], name='Search')
    icon(q, 'magnifying-glass', x + 16, y + (h - 20) / 2, 20, T['muted'])
    t(q, placeholder, x + 46, y + (h - 17 * 1.35) / 2, 'body', T['muted'])


# ---- navigation ----------------------------------------------------------------------------
def nav(q, T, left='back', title=None, right=(), y=52, fg=None):
    """Top bar for pushed screens. 44 pt round buttons in the corners; titles are set large below."""
    fg = fg or T['text']
    if left:
        icon_button(q, T, M - 4, y, {'back': 'caret-left', 'close': 'x', 'down': 'caret-down'}.get(left, left), 'ghost', label=left)
    if title:
        t(q, title, 80, y + 11, 'row', fg, w=W - 160, align='center')
    for i, r in enumerate(reversed(right)):
        if isinstance(r, str) and r.startswith('text:'):
            label = r[5:]; tw = measure(q, label, 'row')
            t(q, label, W - M - tw, y + 11, 'row', fg)
        else:
            icon_button(q, T, W - M - 40 - i * 52, y, r, 'ghost')


def large_title(q, T, s, y=112, sub=None, x=M):
    t(q, s, x, y, 'large', T['text'], w=W - 2 * M if '\n' not in s else None)
    if sub:
        n = s.count('\n') + 1
        t(q, sub, x, y + n * 37 + 6, 'sub', T['muted'], w=W - 2 * M)


def section(q, T, title, y, action=None, x=M, w=W - 2 * M):
    t(q, title, x, y, 'title', T['text'])
    if action:
        aw = measure(q, action, 'sub')
        t(q, action, x + w - aw, y + 4, 'sub', T['muted'], name='Section action / ' + action)


def label(q, T, s, x, y, color=None):
    return t(q, s, x, y, 'label', color or T['muted'])


TABS = [('home', 'house'), ('hang', 'hangboard'), ('climb', 'board-spray'), ('log', 'calendar-blank'), ('settings', 'gear-six')]


def dock(q, T, active='home', dot=None, bottom=H, fade=True):
    """Floating Ink dock: five places, the active one on a raised tile with the Fill icon."""
    w, h = 300, 64
    x, y = (W - w) / 2, bottom - 92
    from pp import shadow
    c = T['canvas']
    if fade: q.rect(0, bottom - 140, W, 140, {'fillOpacity': 1, 'fillColorGradient': {
        'type': 'linear', 'startX': 0.5, 'startY': 0, 'endX': 0.5, 'endY': 1, 'width': 1,
        'stops': [{'color': c, 'opacity': 0, 'offset': 0}, {'color': c, 'opacity': 0.94, 'offset': 0.55}, {'color': c, 'opacity': 1, 'offset': 1}]}},
        name='Dock / fade')
    d = q.rect(x, y, w, h, T['dock'], r=h / 2, name='Dock')
    shadow(d, 0, 10, 30, '#0B0F1C', 0.22)
    slot = (w - 16) / 5
    for i, (key, ic) in enumerate(TABS):
        sx = x + 8 + i * slot
        if key == active:
            q.rect(sx + 2, y + 8, slot - 4, h - 16, T['selected_tile'], r=(h - 16) / 2,
                   name='Dock / active tile')
        name = ic + ('-fill' if key == active else '')
        icon(q, name, sx + (slot - 26) / 2, y + (h - 26) / 2, 26, T['dock_fg'] if key == active else T['dock_dim'])
        if dot == key:
            q.ellipse(sx + slot / 2 + 9, y + 15, 7, 7, T['dock_fg'], name='Dock / badge')


def bottom_bar(q, T, h=112):
    """Sticky action area: canvas with a hairline above, for one primary action."""
    hh = getattr(q, 'h', H)
    q.rect(0, hh - h, W, h, T['canvas'], name='Bottom bar')
    hairline(q, T, 0, hh - h, W)
    return hh - h + 16


# ---- data displays ---------------------------------------------------------------------------
def progress(q, T, x, y, w, frac, h=10, fg=None, track=None):
    q.rect(x, y, w, h, track or T['track'], r=h / 2, name='Progress / track')
    if frac > 0: q.rect(x, y, max(h, w * frac), h, fg or T['text'], r=h / 2, name='Progress / value')


def set_bars(q, T, x, y, w, done, total, h=10, fg=None, track=None, gap=8):
    bw = (w - gap * (total - 1)) / total
    for i in range(total):
        q.rect(x + i * (bw + gap), y, bw, h, (fg or T['text']) if i < done else (track or T['bar']), r=h / 2, name='Set')


def timeline(q, T, x, y, w, segs, h=10, gap=3):
    """Workout shape as plain rounded bars, time left to right (brand book p.40): a set of hangs (with its short
    rests) is one Night pill, a rest of 30 s or more is Glacier, Recover and Get ready are the track. Every
    piece is at least a pill (2.5 x its height) and the whole strip is scaled to fit `w` exactly."""
    merged = []
    for kind, sec in segs:
        k = 'hang' if (kind == 'rest' and sec < 30) else kind
        if merged and merged[-1][0] == k == 'hang':
            merged[-1] = ('hang', merged[-1][1] + sec)
        else:
            merged.append((k, sec))
    total = sum(s_ for _, s_ in merged)
    usable = w - gap * (len(merged) - 1)
    raw = [max(h * 2.5, usable * s_ / total) for _, s_ in merged]
    k = usable / sum(raw)
    cx = x
    for (kind, _), rw in zip(merged, raw):
        sw = rw * k
        col = {'hang': T['text'], 'rest': GLACIER if T['name'] == 'light' else GLACIER_S[3],
               'recover': GLACIER_S[1], 'prep': T['bar']}[kind]
        q.rect(cx, y, sw, h, col, r=h / 2, name=f'Timeline / {kind}')
        cx += sw + gap


def repeaters_segs(sets=3, reps=4, hang=7, rest=3, recover=60, prep=10):
    segs = [('prep', prep)]
    for s in range(sets):
        for r in range(reps):
            segs.append(('hang', hang))
            if r < reps - 1: segs.append(('rest', rest))
        if s < sets - 1: segs.append(('recover', recover))
    return segs


def week_bars(q, T, x, y, w, vals, h=110, labels='MTWTFSS', today=None, kinds=None):
    """This week, labelled on the data: minutes above each bar, Night for hangs, Dusk for the board."""
    n = len(vals); slot = w / n; bw = min(34, slot - 12)
    mx = max(vals) or 1
    for i, v in enumerate(vals):
        bx = x + i * slot + (slot - bw) / 2
        bh = 10 if not v else 18 + (h - 40) * v / mx
        kind = (kinds or ['hang'] * n)[i]
        col = (T['board'] if kind == 'board' else T['text']) if v else T['bar']
        q.rect(bx, y + h - bh, bw, bh, col, r=bw / 2 if bh >= bw else bh / 2, name=f'Day / {labels[i]}')
        if v:
            t(q, f'{v} min', bx - 14, y + h - bh - 22, 'caption', T['text'], w=bw + 28, align='center', name='Minutes')
        t(q, labels[i], bx, y + h + 8, 'caption', T['text'] if i == today else T['muted'], w=bw, align='center',
          weight=900 if i == today else None)
        if i == today:
            q.rect(bx + bw / 2 - 2, y + h + 28, 4, 4, T['text'], r=2, name='Today')


def stat(q, T, x, y, value, caption, w=None, big=False):
    t(q, caption, x, y, 'caption', T['muted'])
    t(q, value, x, y + 20, 'bignum' if big else 'num', T['text'], w=w)


def row(q, T, x, y, w, title, sub=None, ic=None, right=None, right_sub=None, chevron=False, h=72, card_=True, r=28,
        icon_fill=None, icon_color=None, thumb=None):
    """List row on a surface card. ic: icon in a raised tile. right: grade/value at the end."""
    if card_: card(q, T, x, y, w, h, r=r, name=f'Row / {title}')
    tx = x + 16
    if ic:
        q.rect(x + 14, y + (h - 44) / 2, 44, 44, icon_fill or T['raised'], r=12, name='Row / icon tile')
        icon(q, ic, x + 14 + 11, y + (h - 22) / 2, 22, icon_color or T['text'])
        tx = x + 72
    if thumb:
        thumb(x + 14, y + (h - 48) / 2)
        tx = x + 72
    if sub:
        t(q, title, tx, y + h / 2 - 22, 'row', T['text'])
        t(q, sub, tx, y + h / 2 + 1, 'caption', T['muted'])
    else:
        t(q, title, tx, y + (h - 16 * 1.3) / 2, 'row', T['text'])
    rx = x + w - 16
    if chevron:
        icon(q, 'caret-right', rx - 20, y + (h - 20) / 2, 20, T['muted']); rx -= 28
    if right:
        if right_sub:
            t(q, right, rx - 90, y + h / 2 - 24, 'num', T['text'], w=90, align='right')
            t(q, right_sub, rx - 90, y + h / 2 + 2, 'caption', T['muted'], w=90, align='right')
        else:
            t(q, right, rx - 120, y + (h - 17 * 1.35) / 2, 'sub', T['muted'], w=120, align='right')


def setting_row(q, T, x, y, w, title, ctrl=None, value=None, sub=None, h=64, ic=None, last=False):
    tx = x
    if ic:
        icon(q, ic, x, y + (h - 24) / 2, 24, T['text']); tx = x + 40
    if sub:
        t(q, title, tx, y + h / 2 - 21, 'bodyB', T['text'])
        t(q, sub, tx, y + h / 2 + 2, 'caption', T['muted'], w=w - (tx - x) - 80)
    else:
        t(q, title, tx, y + (h - 17 * 1.3) / 2, 'bodyB', T['text'])
    if ctrl == 'on' or ctrl == 'off':
        switch(q, T, x + w - 56, y + (h - 34) / 2, ctrl == 'on')
    elif ctrl == 'chevron':
        if value:
            vw = measure(q, value, 'sub')
            t(q, value, x + w - 28 - vw, y + (h - 15 * 1.35) / 2, 'sub', T['muted'])
        icon(q, 'caret-right', x + w - 20, y + (h - 20) / 2, 20, T['muted'])
    elif ctrl == 'check':
        icon(q, 'check-bold', x + w - 24, y + (h - 22) / 2, 22, T['text'])
    if not last: hairline(q, T, tx, y + h - 1, w - (tx - x))


# ---- overlays --------------------------------------------------------------------------------
def scrim(q, T):
    q.rect(0, 0, W, getattr(q, 'h', H), T['scrim'], name='Scrim')


def sheet(q, T, y, title=None, h=None):
    from pp import shadow
    s = q.rect(0, y, W, (h or H - y) + 40, T['surface'] if T['name'] == 'light' else NIGHT, r=[28, 28, 0, 0], name='Sheet',
               stroke=None if T['name'] == 'light' else T['line2'])
    shadow(s, 0, -8, 40, '#0B0F1C', 0.18)
    q.rect(W / 2 - 22, y + 10, 44, 5, T['line2'], r=2.5, name='Sheet / grabber')
    if title: t(q, title, M, y + 36, 'title', T['text'])


def dialog(q, T, title, body, actions, y=None, scrim_=True):
    """Every confirmation is a bottom sheet: buttons in the thumb third, the safe choice first and solid."""
    if scrim_: scrim(q, T)
    lines = body.count('\n') + 1
    top = H - (36 + 30 + 12 + lines * 24 + 28 + len(actions) * 76 + 24)
    sheet(q, T, top, title)
    t(q, body, M, top + 76, 'body', T['muted'], w=W - 2 * M)
    ay = top + 76 + lines * 24 + 28
    for lbl, kind in actions:
        button(q, T, M, ay, W - 2 * M, lbl, kind, 'L',
               icon_name='trash' if kind == 'ghost' and any(w in lbl for w in ('Delete', 'Discard')) else None); ay += 76
    home_bar(q, T['text'])


def toast(q, T, s, y=680, ic='check'):
    from pp import shadow
    w = measure(q, s, 'sub') + 72
    c = q.rect((W - w) / 2, y, w, 48, T['action'], r=24, name='Toast')
    shadow(c, 0, 8, 24, '#0B0F1C', 0.2)
    icon(q, ic, (W - w) / 2 + 18, y + 14, 20, T['on_action'])
    t(q, s, (W - w) / 2 + 46, y + (48 - 15 * 1.35) / 2, 'sub', T['on_action'])


def menu(q, T, x, y, items, w=230):
    """Popover menu: rows of icon + word; a destructive item is set apart by a hairline, not by colour."""
    from pp import shadow
    h = 8 + sum(52 if it else 9 for it in items) + 8
    c = q.rect(x, y, w, h, T['surface'] if T['name'] == 'light' else T['raised'], r=28, stroke=T['line'], name='Menu')
    shadow(c, 0, 12, 36, '#0B0F1C', 0.18)
    cy = y + 8
    for it in items:
        if it is None:
            hairline(q, T, x + 16, cy + 4, w - 32); cy += 9; continue
        ic, lbl = it
        icon(q, ic, x + 18, cy + 15, 22, T['text'])
        t(q, lbl, x + 52, cy + (52 - 17 * 1.3) / 2, 'bodyB', T['text'])
        cy += 52


# ---- QR ---------------------------------------------------------------------------------------
def qr(q, x, y, size, seed='rivet', color=NIGHT, n=29):
    """A QR-like code for mockups: square modules, three finder patterns, timing rows. The real one is drawn by the
    app at error correction M with a four-module quiet zone; the brand never touches the modules."""
    m = size / n
    hsh = hashlib.sha256(seed.encode()).digest()
    bits = ''.join(f'{b:08b}' for b in hsh * 40)
    k = 0

    def finder(cx, cy):
        q.rect(x + cx * m, y + cy * m, 7 * m, m, color); q.rect(x + cx * m, y + (cy + 6) * m, 7 * m, m, color)
        q.rect(x + cx * m, y + cy * m, m, 7 * m, color); q.rect(x + (cx + 6) * m, y + cy * m, m, 7 * m, color)
        q.rect(x + (cx + 2) * m, y + (cy + 2) * m, 3 * m, 3 * m, color)
    for i in range(n):
        for j in range(n):
            if (i < 8 and j < 8) or (i < 8 and j > n - 9) or (i > n - 9 and j < 8): continue
            if i == 6 or j == 6:
                on = (i + j) % 2 == 0
            else:
                on = bits[k % len(bits)] == '1' and (bits[(k * 7) % len(bits)] == '1' or (i * j) % 3 == 0)
            if on:
                q.rect(x + j * m, y + i * m, m + 0.2, m + 0.2, color, name='QR module')
            k += 1
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7)
