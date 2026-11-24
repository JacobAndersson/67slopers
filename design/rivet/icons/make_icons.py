"""Rivet custom icons in Phosphor's construction: 256 grid, 16-unit strokes with round caps and
joins, ring heads like Phosphor's person icons. Each icon is drawn once as strokes + solids, then
outlined with Skia into a single fill path, exactly how Phosphor ships (fill="currentColor").
Icons: hangboard (a person hanging from a board) and board-spray (a spray wall / board, front view).
Writes custom/<name>.svg (regular) and custom/<name>-fill.svg (fill)."""
import skia
from pathlib import Path
HERE = Path(__file__).parent
SW = 16

def parse(d):
    """Absolute M L H V A Q C Z only."""
    import re
    t = re.findall(r'[MLHVAQCZ]|-?\d*\.?\d+', d); p = skia.Path(); i = 0; x = y = 0; cmd = None
    while i < len(t):
        if t[i].isalpha(): cmd = t[i]; i += 1
        if cmd == 'Z': p.close(); continue
        n = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'A': 7, 'Q': 4, 'C': 6}[cmd]; v = list(map(float, t[i:i + n])); i += n
        if cmd == 'M': x, y = v; p.moveTo(x, y); cmd = 'L'
        elif cmd == 'L': x, y = v; p.lineTo(x, y)
        elif cmd == 'H': x = v[0]; p.lineTo(x, y)
        elif cmd == 'V': y = v[0]; p.lineTo(x, y)
        elif cmd == 'Q': p.quadTo(*v); x, y = v[2:]
        elif cmd == 'C': p.cubicTo(*v); x, y = v[4:]
        elif cmd == 'A':
            rx, ry, rot, large, sweep, x, y = v
            p.arcTo(rx, ry, rot, skia.Path.ArcSize.kLarge_ArcSize if large else skia.Path.ArcSize.kSmall_ArcSize,
                    skia.PathDirection.kCW if sweep else skia.PathDirection.kCCW, x, y)
    return p

def stroke(d, w=SW):
    p = parse(d)
    paint = skia.Paint(StrokeWidth=w, Style=skia.Paint.kStroke_Style, StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    out = skia.Path(); paint.getFillPath(p, out); return out

def solid(d):
    return parse(d)

def ring(cx, cy, r_out):
    p = skia.Path(); p.addCircle(cx, cy, r_out); q = skia.Path(); q.addCircle(cx, cy, r_out - SW)
    return skia.Op(p, q, skia.PathOp.kDifference_PathOp)

def disc(cx, cy, r):
    p = skia.Path(); p.addCircle(cx, cy, r); return p

def union(parts):
    acc = parts[0]
    for q in parts[1:]: acc = skia.Op(acc, q, skia.PathOp.kUnion_PathOp)
    return acc

def minus(a, b): return skia.Op(a, b, skia.PathOp.kDifference_PathOp)

def contours(path):
    """Split a path into closed contours (as separate skia.Paths) plus a flattened polygon of each."""
    out = []; it = skia.Path.Iter(path, False); cur = None
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb: break
        if verb == skia.Path.Verb.kMove_Verb:
            cur = skia.Path(); cur.moveTo(pts[0]); out.append(cur)
        elif verb == skia.Path.Verb.kLine_Verb: cur.lineTo(pts[1])
        elif verb == skia.Path.Verb.kQuad_Verb: cur.quadTo(pts[1], pts[2])
        elif verb == skia.Path.Verb.kConic_Verb: cur.conicTo(pts[1], pts[2], it.conicWeight())
        elif verb == skia.Path.Verb.kCubic_Verb: cur.cubicTo(pts[1], pts[2], pts[3])
        elif verb == skia.Path.Verb.kClose_Verb: cur.close()
    polys = []
    for c in out:
        m = skia.PathMeasure(c, True); L = m.getLength(); pts = []
        for k in range(200):
            p, _ = m.getPosTan(L * k / 200); pts.append((p.x(), p.y()))
        polys.append(pts)
    return out, polys

def _area(poly): return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1])) / 2

def _inside(pt, poly):
    x, y = pt; c = False
    for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c

def orient(path):
    """Non-zero winding: outer contours clockwise, holes counter-clockwise, by nesting depth."""
    cs, polys = contours(path); out = skia.Path()
    for i, (c, poly) in enumerate(zip(cs, polys)):
        depth = sum(_inside(poly[0], q) for j, q in enumerate(polys) if j != i)
        want_cw = depth % 2 == 0
        if (_area(poly) > 0) == want_cw: out.addPath(c)
        else: out.reverseAddPath(c)
    return out

def path_to_svg(path):
    out = []; it = skia.Path.Iter(path, False)
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb: break
        f = lambda q: f"{q.x():.2f},{q.y():.2f}"
        if verb == skia.Path.Verb.kMove_Verb: out.append('M' + f(pts[0]))
        elif verb == skia.Path.Verb.kLine_Verb: out.append('L' + f(pts[1]))
        elif verb == skia.Path.Verb.kQuad_Verb: out.append('Q' + f(pts[1]) + ' ' + f(pts[2]))
        elif verb == skia.Path.Verb.kConic_Verb:
            w = it.conicWeight(); conv = skia.Path.ConvertConicToQuads(pts[0], pts[1], pts[2], w, 2)
            for k in range(1, len(conv), 2): out.append('Q' + f(conv[k]) + ' ' + f(conv[k + 1]))
        elif verb == skia.Path.Verb.kCubic_Verb: out.append('C' + f(pts[1]) + ' ' + f(pts[2]) + ' ' + f(pts[3]))
        elif verb == skia.Path.Verb.kClose_Verb: out.append('Z')
    return ''.join(out)

def svg(path):
    # PathOps returns even-odd paths; convert to non-zero winding (Phosphor's rule) so holes survive everywhere
    # Phosphor ships non-zero paths: re-orient contours so holes wind the other way, then no fill-rule is needed.
    path = orient(path)
    rule = ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path{rule} d="{skia.SkParsePath.ToSVGString(path) if hasattr(skia, "SkParsePath") else path_to_svg(path)}"/></svg>\n'

# ---------------------------------------------------------------- hangboard
def hangboard(fill):
    board = 'M48,24 H208 A8,8 0 0 1 216,32 V48 A8,8 0 0 1 208,56 H48 A8,8 0 0 1 40,48 V32 A8,8 0 0 1 48,24 Z'
    parts = [solid(board) if fill else stroke(board)]
    # straight arms up to the board, a soft shoulder line, Phosphor-person proportions below
    parts.append(stroke('M68,56 L102,140 Q128,152 154,140 L188,56'))
    parts += [stroke('M128,146 V184'), stroke('M128,184 L104,232'), stroke('M128,184 L152,232')]
    parts.append(disc(128, 96, 26) if fill else ring(128, 96, 28))
    return union(parts)

# ---------------------------------------------------------------- board, front view (no figure)
RECT = 'M48,24 H208 A16,16 0 0 1 224,40 V216 A16,16 0 0 1 208,232 H48 A16,16 0 0 1 32,216 V40 A16,16 0 0 1 48,24 Z'
LEAN = 'M40,24 H216 A12,12 0 0 1 228,38 L208,220 A14,14 0 0 1 194,232 H62 A14,14 0 0 1 48,220 L28,38 A12,12 0 0 1 40,24 Z'

def pill(x0, y0, x1, y1):  # a jug / edge as a short rounded bar
    return stroke(f'M{x0},{y0} L{x1},{y1}', 20)

def holds_spray():
    return [pill(76, 72, 112, 68), disc(170, 84, 16), disc(104, 138, 14), pill(150, 150, 180, 160), disc(90, 196, 12), disc(164, 200, 10)]

def holds_grid():
    return [disc(x, y, 10) for y in (64, 108, 152, 196) for x in (76, 128, 180)]

def board_front(fill, panel=RECT, holds=holds_spray):
    hs = union(holds())
    if not fill: return union([stroke(panel), hs])
    return minus(solid(panel), hs)

ICONS = {'hangboard': hangboard, 'board-spray': lambda f: board_front(f)}

if __name__ == '__main__':
    out = HERE / 'custom'; out.mkdir(exist_ok=True)
    for name, fn in ICONS.items():
        (out / f'{name}.svg').write_text(svg(fn(False)))
        (out / f'{name}-fill.svg').write_text(svg(fn(True)))
        print('wrote', name)
