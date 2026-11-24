"""Rivet identity: palette, type, the Pitch symbol, the outlined wordmark and lockups."""
from pathlib import Path
from marks import rr

FONTS_DIR = Path(__file__).resolve().parents[1] / 'fonts'
F = 'Nunito'

# ---- Alpenglow palette --------------------------------------------------
C = dict(
    snow='#F8F6F3',     # white canvas
    paper='#F2ECE3',    # warm paper canvas
    night='#141A2E',    # ink: text, primary buttons, dark grounds
    glow='#F28C6E',     # alpenglow: the hang, the brand's moment of heat
    glacier='#C3DCE5',  # rest, calm, cool counterpart
    dusk='#8F88CC',     # secondary accent: data, illustration
    granite='#6B6E73',  # muted text, hairlines on dark
    stone='#E4E0DA',    # borders on paper, surfaces
)
BRAND_STEP = {'glow': 3, 'glacier': 2, 'dusk': 3, 'night': 5, 'granite': 4}
SCALES = {
    'glow':    ['#FEF0EB', '#FCD9CD', '#F9B9A4', '#F28C6E', '#E2664A', '#B94A33', '#7E3324'],
    'glacier': ['#F0F7F9', '#DDECF1', '#C3DCE5', '#9CC3D1', '#6C9FB2', '#467B8F', '#2B5161'],
    'dusk':    ['#F1F0FA', '#DEDBF3', '#BDB7E6', '#8F88CC', '#6E66B2', '#524A8E', '#363062'],
    'night':   ['#E7E8EC', '#C5C8D2', '#8C92A6', '#555D78', '#2E3650', '#141A2E', '#0B0F1C'],
    'granite': ['#F0F0EF', '#D9DADB', '#BABCBF', '#9C9EA2', '#6B6E73', '#45484D', '#26282B'],
}

# ---- Pitch: three equal soft bars, each one step higher --------------------
# 100-unit box. Bars 22 wide, 8 apart, 58 tall, rising 14 per step.
def pitch_parts(step=14, h=58, w=22, gap=8, y0=None):
    total_h = h + 2 * step; y0 = (100 - total_h) / 2 if y0 is None else y0
    x0 = (100 - (3 * w + 2 * gap)) / 2
    return [rr(x0 + i * (w + gap), y0 + (2 - i) * step, w, h, w / 2) for i in range(3)]

PITCH = pitch_parts()

def pitch(b, x, y, size, color, name='Pitch', lifts=(0, 0, 0), colors=None, stroke=None, xf=None, shadow=None, parts=None):
    """Draw the symbol in a size x size box. lifts: extra upward offset per bar in symbol units (motion)."""
    s = size / 100
    for i, d in enumerate(parts or PITCH):
        b.path(d, x, y - lifts[i] * s, s, fill=None if stroke else (colors[i] if colors else color),
               stroke=color if stroke else None, sw=stroke or 1, name=f'{name} / bar {i+1}', xf=xf, shadow=shadow)

# ---- Wordmark: Nunito Black, outlined, tracked -2% ------------------------
_WM = {}
KERN = {('R', 'i'): -0.012, ('v', 'e'): 0.004}   # hand-set pairs, in em

def _contours(glyphset, name):
    from fontTools.pens.recordingPen import RecordingPen
    rp = RecordingPen(); glyphset[name].draw(rp)
    out, cur = [], []
    for op, args in rp.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'): out.append(cur); cur = []
    return out

def wordmark_path(weight=900, track=-0.025, custom=True):
    """Outlined 'Rivet'. custom=True draws Rivet's own details: a pill-shaped i dot (a Pitch bar in
    miniature) and hand-kerned R-i / v-e pairs."""
    key = (weight, custom)
    if key in _WM: return _WM[key]
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.pens.boundsPen import BoundsPen
    f = TTFont(FONTS_DIR / f'Nunito-{weight}.ttf'); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    x = 0; d = ''; word = 'Rivet'
    for i, ch in enumerate(word):
        g = cmap[ord(ch)]; pen = SVGPathPen(gs); tp = TransformPen(pen, (1, 0, 0, -1, x, 0))
        if ch == 'i' and custom:
            cs = _contours(gs, g)
            def bbox(c):
                bp = BoundsPen(gs)
                for op, args in c: getattr(bp, op)(*args)
                return bp.bounds
            cs.sort(key=lambda c: bbox(c)[1])
            stem, dot = cs[0], cs[-1]
            for op, args in stem: getattr(tp, op)(*args)
            sx0, _, sx1, _ = bbox(stem); _, dy0, _, dy1 = bbox(dot)
            sw = sx1 - sx0; ph = sw * 1.9; py0 = dy0 - sw * 0.02
            dd = rr(x + sx0, -(py0 + ph), sw, ph, sw / 2)
            d += pen.getCommands() + ' ' + dd + ' '
        else:
            gs[g].draw(tp); d += pen.getCommands() + ' '
        nxt = word[i + 1] if i + 1 < len(word) else None
        x += gs[g].width + track * upm + (KERN.get((ch, nxt), 0) * upm if custom else 0)
    width = x - track * upm
    _WM[key] = (d, width, f['OS/2'].sCapHeight, upm)
    return _WM[key]

def wordmark(b, x, y, cap_h, color, weight=900, name='Wordmark', custom=True):
    """Top-left at (x, y) = top of capital R; returns drawn width."""
    d, width, cap, upm = wordmark_path(weight, custom=custom)
    s = cap_h / cap
    b.path(d, x, y + cap * s, s, fill=color, name=name)
    return width * s

def lockup(b, x, y, cap_h, color, sym_color=None, weight=900, ratio=1.3):
    """Horizontal lockup. Bars span ratio x cap height, sit on the baseline; space = one bar width.
    (x, y) is the top-left of the capital R's height band; returns total width."""
    S = cap_h * ratio / 0.86                 # symbol box; bars fill 86% of it vertically, 82% horizontally
    base = y + cap_h
    pitch(b, x - 0.09 * S, base - 0.93 * S, S, sym_color or color, name='Lockup / Pitch')
    bar_right = x + 0.82 * S
    w = wordmark(b, bar_right + 0.30 * S, y, cap_h, color, weight, name='Lockup / Wordmark')
    return bar_right + 0.30 * S + w - x

def stacked(b, cx, y, cap_h, color, sym_color=None, weight=900):
    """Symbol centred above the wordmark. Returns height."""
    d, width, cap, upm = wordmark_path(weight); ww = width * cap_h / cap
    S = cap_h * 2.4
    pitch(b, cx - S / 2, y, S, sym_color or color, name='Stacked / Pitch')
    wordmark(b, cx - ww / 2, y + S * 0.93 + cap_h * 0.55, cap_h, color, weight, name='Stacked / Wordmark')
    return S * 0.93 + cap_h * 1.55
