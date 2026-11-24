"""Page 04 Icons: custom Rivet icons (Phosphor construction), regular + fill, at size, beside Phosphor, in the dock."""
import re
from pathlib import Path
from book import *
IC = Path(__file__).resolve().parents[1] / 'icons'
def d_of(p): return ' '.join(re.findall(r' d="([^"]+)"', p.read_text()))
def ic(b, path, x, y, size, color, name):
    b.path(d_of(path), x, y, size / 256, fill=color, name=name)

bk = Book('04 Icons'); N = C['night']
b = Board(bk.d, bk.pg, 'icons/custom', 'Custom icons · hangboard & spray wall', 0, 0, 1920, 1400, C['snow'])
b.text('Custom icons', M, 80, size=56, font=F, weight=900, color=N, ls=-1.2)
b.text('Built on Phosphor’s grid: 256 units, 16-unit strokes, round caps and joins, ring heads like Phosphor’s person icons. Regular for the interface, Fill for the selected dock tab.', M, 160, w=1200, size=20, font=F, weight=500, color=TXT, lh=1.5)
items = [('hangboard', 'Hangboard'), ('board-spray', 'Board · spray wall')]
for i, (n, label) in enumerate(items):
    y = 260 + i * 420
    b.text(label, M, y, size=24, font=F, weight=900, color=N)
    for j, suf in enumerate(['', '-fill']):
        x = M + j * 340
        b.rect(x, y + 50, 300, 300, '#FFFFFF', r=24, stroke='#141A2E14')
        for g in range(0, 257, 16):
            b.rect(x + 22 + g, y + 72, 0.6, 256, '#141A2E10'); b.rect(x + 22, y + 72 + g, 256, 0.6, '#141A2E10')
        ic(b, IC / 'custom' / f'{n}{suf}.svg', x + 22, y + 72, 256, N, f'{n}{suf}')
        b.text('Regular' if not suf else 'Fill', x, y + 362, size=15, font=F, weight=800, color=MUTED)
    for j, s in enumerate([48, 32, 24, 20, 16]):
        for k, suf in enumerate(['', '-fill']):
            ic(b, IC / 'custom' / f'{n}{suf}.svg', M + 720 + j * 90, y + 90 + k * 110 + (48 - s) / 2, s, N, f'{n}{suf} {s}')
        b.text(f'{s}', M + 720 + j * 90, y + 300, size=13, font=F, weight=700, color=MUTED)
    refs = ['person-simple', 'barbell', 'mountains', 'timer']
    for j, r in enumerate(refs):
        ic(b, IC / 'ref' / f'{r}.svg', M + 1220 + j * 110, y + 90, 48, '#6B6E73', r)
        ic(b, IC / 'ref' / f'{r}-fill.svg', M + 1220 + j * 110, y + 200, 48, '#6B6E73', r + ' fill')
    b.text('Phosphor, for comparison', M + 1220, y + 300, size=13, font=F, weight=700, color=MUTED)
# docks
for t, (bg, fg, mute, tile) in enumerate([(N, ON_DARK, '#8C92A6', '#2E3650'), ('#FFFFFF', N, '#9C9EA2', C['stone'])]):
    x = M + t * 860; y = 1130
    b.rect(x, y, 640, 120, bg, r=60, stroke='#141A2E14', name='Dock')
    dock = [('ref', 'house'), ('custom', 'hangboard'), ('custom', 'board-spray'), ('ref', 'calendar-blank'), ('ref', 'chart-bar')]
    for i, (folder, n) in enumerate(dock):
        cx = x + 40 + i * 120
        if i == 1: b.rect(cx - 8, y + 16, 104, 88, tile, r=44)
        ic(b, IC / folder / f'{n}{"-fill" if i == 1 else ""}.svg', cx + 20, y + 32, 56, fg if i == 1 else mute, n)
b.text('In the dock: Hang replaces the timer, the spray board takes the climb tab. Selected tab uses Fill.', M, 1290, size=17, font=F, weight=600, color=MUTED)
bk.d.publish([b]); bk.d.render(b, Path('/tmp/claude-1001/-home-jacob-workspace-67slopers/7eab9058-053e-4988-a627-db0e3e7edaaa/scratchpad/iconpage.png'), 0.5)
