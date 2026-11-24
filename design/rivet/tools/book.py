"""Brand book framework: spreads on one Penpot page, shared typographic helpers."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from pp import Doc, Board, LOCAL
from brand import C, F, pitch, wordmark, lockup, stacked
import brand

W, H, M = 1920, 1200, 120
PH = LOCAL / 'photos'
RENDERS = LOCAL / 'renders'
TXT = '#2A2F40'        # body text on light
MUTED = '#6B6E73'
ON_DARK = '#F8F6F3'
ON_DARK_MUTED = '#C9CCD6'

CHAPTERS = {}  # spread order -> (key, title)


GLOW_TEXT = '#141A2E'   # eyebrows and small accents are Night: Glow never sets text
PAGES = {}               # chapter number -> first page, filled by a dry first pass


class Book:
    def __init__(self, page='02 Rivet Brand Book'):
        self.d = Doc(); self.pg = self.d.page(page); self.spreads = []; self.n = 0; self.starts = {}

    def spread(self, idx, key, name, chapter, bg=None, dark=False, folio=True, num_light=False):
        idx = self.n; self.n += 1       # pages are numbered in build order
        x, y = (idx % 6) * (W + 120), (idx // 6) * (H + 160)
        b = Board(self.d, self.pg, 'book/' + key, f'{idx:02d} · {name}', x, y, W, H, bg or C['snow'])
        b.dark = dark; b.idx = idx
        coloured = (bg or C['snow']).upper() not in (C['snow'].upper(), C['paper'].upper(), C['night'].upper(), '#FFFFFF')
        fg = ON_DARK if dark else C['night']; mu = ON_DARK_MUTED if dark else ('#141A2EB3' if coloured else MUTED)
        if folio:
            if chapter: b.text(chapter, M, 72, size=14, font=F, weight=800, color=mu, ls=2, upper=True, name='Chapter')
            pitch(b, M, H - 72 - 18, 22, fg, name='Folio / Pitch')
            b.text('Rivet Brand Guidelines', M + 34, H - 89, size=14, font=F, weight=700, color=mu, name='Folio / Title')
            b.text(f'{idx:02d}', W - M - 40, H - 89, w=40, size=14, font=F, weight=800, color=ON_DARK if num_light else mu, align='right', name='Folio / Page')
        self.spreads.append(b)
        return b

    # --- type helpers ---
    def display(self, b, s, x, y, w=None, size=112, color=None, weight=900, lh=1.0, align='left'):
        return b.text(s, x, y, w, size=size, font=F, weight=weight, color=color or (ON_DARK if b.dark else C['night']), lh=lh, ls=-size * 0.025, align=align, name='Display')

    def h2(self, b, s, x, y, w=None, size=48, color=None, weight=800):
        return b.text(s, x, y, w, size=size, font=F, weight=weight, color=color or (ON_DARK if b.dark else C['night']), lh=1.12, ls=-size * 0.015, name='Heading')

    def body(self, b, s, x, y, w=560, size=21, color=None, weight=500, lh=1.5):
        size = max(size, 18)
        return b.text(s, x, y, w, size=size, font=F, weight=weight, color=color or (ON_DARK_MUTED if b.dark else TXT), lh=lh, name='Body')

    def label(self, b, s, x, y, color=None, size=14, w=None, align='left'):
        if color == C['glow']:
            color = ON_DARK if b.dark else C['night']
        return b.text(s, x, y, w, size=size, font=F, weight=800, color=color or (ON_DARK_MUTED if b.dark else MUTED), ls=size * 0.14, upper=True, align=align, name='Label')

    def opener(self, num, key, title, line, photo, bg=None):
        self.starts[num] = self.n
        dark = bg in (None, C['night'])
        b = self.spread(0, 'open-' + key, f'Chapter {num} · {title}', None, bg=bg or C['night'], dark=dark, folio=False)
        if photo is None:
            fg = ON_DARK if dark else C['night']
            self.body(b, line, M, H - 250, w=640, size=28, color=fg, weight=600, lh=1.35)
            b.rect(M, H - 290, 80, 6, fg, r=3, name='Step rule')
            self.display(b, title, 700, 470, size=150, color=fg)
            b.text(num, 1500, 170, w=300, size=150, font=F, weight=900, color=fg, ls=-5, align='right', lh=1)
            b.rect(1720, 150, 80, 6, fg, r=3, name='Step rule')
            return b
        src = photo if str(photo).endswith('.png') else PH / f'{photo}.jpg'
        b.image(src, 0, 0, W, H, name='Render / opener photo')
        if str(src).endswith('.jpg'): b.rect(0, 0, W, H, '#0B0F1C40', name='Shade')
        if str(src).endswith('.jpg'): b.rect(0, 0, W, 560, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0.5, 'startY': 0, 'endX': 0.5, 'endY': 1, 'width': 1, 'stops': [{'color': '#0B0F1C', 'opacity': 0.7, 'offset': 0}, {'color': '#0B0F1C', 'opacity': 0, 'offset': 1}]}}, name='Top shade')
        self.scrim(b, 0, 0, W, H, to=0.75, start=0.4)
        # the step: caption low-left, title mid, number high-right, rising like the bars
        self.body(b, line, M, H - 250, w=640, size=28, color=ON_DARK, weight=600, lh=1.35)
        b.rect(M, H - 290, 80, 6, ON_DARK, r=3, name='Step rule')
        self.display(b, title, 700, 470, size=150)
        b.text(num, 1500, 170, w=300, size=150, font=F, weight=900, color='#F8F6F3', ls=-5, align='right', lh=1)
        b.rect(1720, 150, 80, 6, ON_DARK, r=3, name='Step rule')
        return b

    def rule(self, b, x, y, w, color=None):
        return b.rect(x, y, w, 1.5, color or ('#FFFFFF26' if b.dark else '#141A2E1F'), name='Rule')

    def scrim(self, b, x, y, w, h, frm=0.35, to=0.75, r=0, start=0.45):
        return b.rect(x, y, w, h, {'fillOpacity': 1, 'fillColorGradient': {'type': 'linear', 'startX': 0.5, 'startY': start, 'endX': 0.5, 'endY': 1, 'width': 1,
                      'stops': [{'color': '#0B0F1C', 'opacity': 0, 'offset': 0}, {'color': '#0B0F1C', 'opacity': to, 'offset': 1}]}}, r=r, name='Scrim')

    def publish(self, render_dir=None, keys=None, scale=0.5):
        boards = [b for b in self.spreads if keys is None or b.key.split('/', 1)[1] in keys]
        for b in boards:  # full-bleed renders sit beneath everything else on the spread
            under = [o for o in b.objects[1:] if o['name'].startswith('Render /') and o['parentId'] == b.id]
            b.objects = [b.objects[0]] + under + [o for o in b.objects[1:] if o not in under]
        self.d.publish(boards)
        if render_dir:
            Path(render_dir).mkdir(parents=True, exist_ok=True)
            import json
            if keys is None: (Path(render_dir) / 'manifest.json').write_text(json.dumps([f'{b.idx:02d}-{b.key.split("/")[1]}.png' for b in self.spreads]))
            for b in boards: self.d.render(b, Path(render_dir) / f'{b.idx:02d}-{b.key.split("/")[1]}.png', scale)
