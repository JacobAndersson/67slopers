"""App screens drawn at native 390 x 844 on any surface (Board or Scaled). Light and dark themes.
Glow appears only as the Hang state. Every button is an Ink pill."""
import re
from pathlib import Path
from brand import C, F, pitch, wordmark, lockup
ICONS = Path(__file__).resolve().parents[1] / 'icons'
ND, NDM = '#F8F6F3', '#A4A8B5'
LIGHT = dict(bg=C['snow'], surface='#FFFFFF', raised=C['stone'], text=C['night'], muted='#6B6E73', line='#141A2E14', track='#E4E0DA', inverse=ND, ink=C['night'])
DARK = dict(bg='#0B0F1C', surface=C['night'], raised='#2E3650', text=ND, muted='#8C92A6', line='#FFFFFF1A', track='#1F2640', inverse=C['night'], ink=ND)

def icon(p, name, x, y, size, color):
    f = ICONS / f'{name}.svg'
    if not f.exists() and (ICONS / f'{name}-bold.svg').exists(): f = ICONS / f'{name}-bold.svg'
    d = ' '.join(re.findall(r' d="([^"]+)"', f.read_text()))
    p.path(d, x, y, size / 256, fill=color, name='Icon / ' + name)

def status(p, color):
    p.text('9:41', 32, 16, size=16, font=F, weight=800, color=color)
    p.rect(330, 20, 26, 12, None, r=4, stroke=color, sw=1.4); p.rect(332.5, 22.5, 18, 7, color, r=2)
    p.rect(150, 10, 90, 28, '#0B0F1C' if color != ND else '#000000', r=14, name='Island')

def phone(p, x, y, bg, draw):
    """Phone body + clipped screen. draw(q) draws into a Scaled at the screen origin."""
    from pp import Scaled
    p.rect(x - 10, y - 10, 410, 864, '#0B0F1C', r=64, name='Phone / body')
    with p.frame(x, y, 390, 844, bg, r=54, name='Phone / screen'):
        q = Scaled(p.b if hasattr(p, 'b') else p, p.X(x) if hasattr(p, 'X') else x, p.Y(y) if hasattr(p, 'Y') else y, getattr(p, 'k', 1))
        draw(q)

def pill(q, x, y, w, h, label, fill, fg, stroke=None, size=17):
    q.rect(x, y, w, h, fill, r=h / 2, stroke=stroke, name='Button / ' + label)
    q.text(label, x, y + (h - size * 1.3) / 2, w=w, size=size, font=F, weight=800, color=fg, align='center')

def home(q, T=LIGHT):
    N = T['text']
    status(q, N)
    q.text('Good\nmorning, Ana', 24, 74, size=38, font=F, weight=900, color=N, lh=1.02, ls=-1)
    q.rect(24, 178, 342, 210, T['surface'], r=28, stroke=T['line'], name='Today card')
    q.text('TODAY', 48, 202, size=12, font=F, weight=800, color=T['muted'], ls=1.6)
    q.text('Max hangs', 48, 222, size=30, font=F, weight=900, color=N, ls=-0.6)
    q.text('20 mm edge  ·  5 sets  ·  25 min', 48, 262, size=15, font=F, weight=700, color=T['muted'])
    pill(q, 48, 314, 140, 50, 'Start', T['ink'], T['inverse'])
    pill(q, 200, 314, 140, 50, 'Change', None, N, stroke=N)
    q.text('This week', 24, 420, size=20, font=F, weight=900, color=N)
    q.text('3 sessions', 260, 423, w=106, size=15, font=F, weight=700, color=T['muted'], align='right')
    vals = [2, 0, 3, 0, 4, 0, 0]
    for i, v in enumerate(vals):
        h = 26 + v * 24; x = 24 + i * 50
        q.rect(x + 6, 560 - h, 34, h, N if v else T['track'], r=4)
        q.text('MTWTFSS'[i], x + 6, 568, w=34, size=12, font=F, weight=800, color=T['muted'], align='center')
    q.text('Recent', 24, 596, size=20, font=F, weight=900, color=N)
    for i, (t, s, ic) in enumerate([('Max hangs', 'Fri  ·  5 of 5 sets', 'hangboard'), ('Board session', 'Wed  ·  12 problems', 'board-spray')]):
        y = 630 + i * 68
        q.rect(24, y, 342, 60, T['surface'], r=18, stroke=T['line'])
        q.rect(36, y + 12, 36, 36, T['raised'], r=12); icon(q, ic, 44, y + 20, 20, N)
        q.text(t, 88, y + 10, size=16, font=F, weight=800, color=N); q.text(s, 88, y + 32, size=13, font=F, weight=600, color=T['muted'])
    q.rect(70, 772, 250, 56, T['ink'], r=28, name='Dock')
    for i, n in enumerate(['house-fill', 'hangboard', 'board-spray', 'calendar-blank']):
        if i == 0: q.rect(80, 778, 56, 44, '#8C92A633', r=22)
        icon(q, n, 94 + i * 60, 788, 26, T['inverse'] if i == 0 else '#8C92A6')

def session(q, bg, word, big, sub, frac, nxt, fg=None):
    N = fg or C['night']
    status(q, N)
    icon(q, 'x-bold', 24, 64, 28, N)
    q.text(word, 24, 120, size=44, font=F, weight=900, color=N, ls=-1)
    q.text(sub, 24, 172, size=17, font=F, weight=800, color=N)
    q.text(big, 0, 300, w=390, size=210 if len(big) <= 2 else 150, font=F, weight=900, color=N, ls=-6, align='center', lh=1)
    q.rect(24, 610, 342, 10, N + '26', r=5); q.rect(24, 610, 342 * frac, 10, N, r=5)
    q.text(nxt, 24, 640, size=17, font=F, weight=800, color=N)
    for i, n in enumerate(['arrow-counter-clockwise-bold', 'pause-bold', 'skip-forward-bold']):
        cx = 70 + i * 125
        if i == 1: q.ellipse(cx - 36, 712, 92, 92, N)
        icon(q, n, cx - 6, 742, 32, ND if (i == 1 and N == C['night']) else (C['night'] if i == 1 else N))

def hang(q): session(q, C['glow'], 'Hang', '7', 'Set 2 of 5  ·  Rep 4 of 6', 0.42, 'Next  ·  Rest 3 s')
def rest(q): session(q, C['glacier'], 'Rest', '3', 'Set 2 of 5  ·  Rep 4 of 6', 0.46, 'Next  ·  Hang 7 s')
def rest_dark(q): session(q, '#0B0F1C', 'Rest', '3', 'Set 2 of 5  ·  Rep 4 of 6', 0.46, 'Next  ·  Hang 7 s', fg=C['glacier'])

def done(q, T=LIGHT):
    N = T['text']
    status(q, N)
    for i in range(5):
        q.rect(24 + i * 69, 150, 61, 10, N if i < 3 else T['track'], r=5, name='Set')
    q.text('3/5', 24, 90, size=40, font=F, weight=900, color=N, ls=-1)
    q.text('Session saved', 24, 236, size=40, font=F, weight=900, color=N, ls=-1)
    q.text('3 of 5 sets.\nYou’ll get them next time.', 24, 290, w=340, size=22, font=F, weight=700, color=T['muted'] if T is DARK else '#2A2F40', lh=1.3)
    for i, (k, v) in enumerate([('Time', '18 min'), ('Hang time', '3:30'), ('Best rep', '10 s')]):
        y = 410 + i * 66
        q.rect(24, y + 58, 342, 1, T['line'])
        q.text(k, 24, y + 18, size=17, font=F, weight=700, color=T['muted']); q.text(v, 220, y + 14, w=146, size=22, font=F, weight=900, color=N, align='right')
    q.text('How did it feel?', 24, 630, size=17, font=F, weight=800, color=N)
    for i, t in enumerate(['Easy', 'Solid', 'Hard', 'Max']):
        sel = i == 2
        pill(q, 24 + i * 87, 664, 79, 42, t, N if sel else None, T['inverse'] if sel else N, stroke=None if sel else N, size=15)
    pill(q, 24, 752, 342, 60, 'Done', T['ink'], T['inverse'], size=18)

def home_dark(q): home(q, DARK)
def done_dark(q): done(q, DARK)
