"""Boards as diagrams. The brand photographs and diagrams; it never illustrates. Hangboards are
drawn from hangboard-models/<id>/layout.json (hold boxes in mm), MoonBoards as their hold grid."""
import json
import random
from ui import ROOT, NIGHT, WALL, t

MODELS = ROOT / 'hangboard-models'


def layout(board_id):
    return json.loads((MODELS / board_id / 'layout.json').read_text())


def _ledge(board_id):
    """y of the lower tier's step, read from the board's own base.svg (lower-face gradient), if it has one."""
    import re
    f = ROOT / 'assets' / 'boards' / board_id / 'base.svg'
    if not f.exists(): return None
    m = re.search(r'id="lower-face"[^>]*?y1="([\d.]+)"', f.read_text())
    return float(m[1]) if m else None


def _corner_jug(h, R, W):
    """The Beastmaker's rounded end: the top strip wraps the corner and runs down the side, an L that follows
    the board's own radius. SVG path data in board millimetres, cubic curves only (left jug; mirrored for right)."""
    c = 0.5523
    iw, ih = h['inner']['w'], h['inner']['h']
    # build the left-hand jug (from x = 0) and mirror it for the right one
    x1, hh = (h['w'] if h['side'] == 'right' else h['x'] + h['w']), h['h']
    r = min(R, hh)
    rx, ry = r - iw, r - ih
    pts = [('M', x1, 0), ('L', r, 0), ('C', r - r * c, 0, 0, r - r * c, 0, r), ('L', 0, hh), ('L', iw, hh), ('L', iw, r),
           ('C', iw, r - ry * c, r - rx * c, ih, r, ih), ('L', x1, ih)]
    out = []
    for cmd, *v in pts:
        if h['side'] == 'right':
            v = [W - n if i % 2 == 0 else n for i, n in enumerate(v)]
        out.append(cmd + ' '.join(f'{n:.2f}' for n in v))
    return ' '.join(out) + ' Z'


def _top_chain(outline):
    """The outline's top edge (left to right), for boards whose top is not straight."""
    i = max(range(len(outline)), key=lambda j: (outline[j][0], -outline[j][1]))
    chain = outline[:i + 1]
    return sorted(chain)


def _y_top(chain, px):
    for (ax, ay), (bx, by) in zip(chain, chain[1:]):
        if ax <= px <= bx:
            return ay if bx == ax else ay + (by - ay) * (px - ax) / (bx - ax)
    return chain[0][1] if px < chain[0][0] else chain[-1][1]


def hangboard(q, board_id, x, y, w, color=NIGHT, active=(), base_alpha='38', fill_alpha='10', sw=1.4, labels=False, T=None, plate=None):
    """Board as a diagram, true to its layout.json: the real silhouette, the Beastmaker's wrap-around corner jugs,
    pill-shaped pockets, edges as separate strips, and the lower tier's step. Holds in `active` are solid `color`,
    the rest hairlines. Returns drawn height."""
    L = layout(board_id)
    bw, bh = L['size_mm']['width'], L['size_mm']['height']
    k = w / bw
    R = min(L.get('corner_radius_mm', 8), bh / 2)
    line = color + base_alpha
    outline = L.get('outline')
    if outline:
        d = 'M' + ' L'.join(f'{px} {py}' for px, py in outline) + ' Z'
        if plate: q.path(d, x, y, k, fill=plate, name='Board plate (opaque)')
        q.path(d, x, y, k, fill=color + fill_alpha, name=f'Hangboard / {board_id}')
        q.path(d, x, y, k, stroke=line, sw=sw, name=f'Hangboard / {board_id} / outline', cap='round')
    else:
        if plate: q.rect(x, y, w, bh * k, plate, r=R * k, name='Board plate (opaque)')
        q.rect(x, y, w, bh * k, color + fill_alpha, r=R * k, stroke=line, sw=sw, name=f'Hangboard / {board_id}')
    ledge = _ledge(board_id) if L.get('lower_tier') else None
    if ledge:
        inset = R * 0.35 if R > 20 else 0
        q.rect(x + (inset + 4) * k, y + ledge * k - sw / 2, (bw - 2 * inset - 8) * k, sw, line, name='Lower tier step')
    for h in L['holds']:
        on = h['id'] in active
        fill = color if on else None
        stroke = None if on else line
        nm = f'Hold / {h["id"]}' + (' / active' if on else '')
        hx, hy, hw, hh = h['x'], h['y'], h['w'], h['h']
        shape = h.get('shape', 'rect')
        if shape == 'corner':
            q.path(_corner_jug(h, R, bw), x, y, k, fill=fill, stroke=stroke, sw=sw * 0.8, name=nm)
        elif shape == 'circle':
            q.ellipse(x + hx * k, y + hy * k, hw * k, hh * k, fill, stroke=stroke, sw=sw * 0.8, name=nm)
        elif shape == 'stadium':
            q.rect(x + hx * k, y + hy * k, hw * k, hh * k, fill, r=min(hw, hh) * k / 2, stroke=stroke, sw=sw * 0.8, name=nm)
        elif outline and hy < 60:
            # a rail on a shaped top: its top follows the board's own outline, so it never leaves the board
            chain = _top_chain(outline)
            g = 2.5
            xs = [hx + g + (hw - 2 * g) * i / 8 for i in range(9)]
            top = [max(hy, _y_top(chain, px)) + g for px in xs]
            bottom = hy + hh - g
            if min(top) >= bottom - 2:
                continue
            pts = [(px, min(py, bottom - 2)) for px, py in zip(xs, top)] + [(xs[-1], bottom), (xs[0], bottom)]
            d = 'M' + ' L'.join(f'{px:.2f} {py:.2f}' for px, py in pts) + ' Z'
            q.path(d, x, y, k, fill=fill or (color + '08'), stroke=stroke, sw=sw * 0.8, name=nm)
        else:
            # flat edges and top strips: separate strips with a small gap and soft corners
            g = 1.5
            top = hy <= 0.5
            rr = min(hh / 2, 5) * k
            q.rect(x + (hx + g) * k, y + (hy + (g if not top else 2)) * k, (hw - 2 * g) * k, (hh - g - (g if not top else 2)) * k, fill,
                   r=rr, stroke=stroke, sw=sw * 0.8, name=nm)
    return bh * k


def pair(board_id, hold_id):
    L = layout(board_id)
    for h in L['holds']:
        if h['id'] == hold_id:
            return [hold_id] + ([h['pair']] if h.get('pair') else [])
    return [hold_id]


# ---- MoonBoard -----------------------------------------------------------------------------
COLS = 'ABCDEFGHIJK'


def _occupied(rows, seed=7):
    rnd = random.Random(seed)
    return {(c, r) for c in range(11) for r in range(rows) if rnd.random() < 0.82}


def moonwall(q, T, x, y, w, problem=(), rows=18, coords=True, dots=True, r=24, name='MoonBoard', bg=None, lit=False):
    """problem: list of (col_letter, row_number, kind) with kind in start/hold/finish/foot."""
    pad = 22 if coords else 10
    cell = (w - pad - 10) / 11
    h = pad + rows * cell + 10
    q.rect(x, y, w, h, bg or T['surface'], r=r, stroke=T['line'], name=name)
    ox, oy = x + pad, y + pad - 4
    if coords:
        for c in range(11):
            t(q, COLS[c], ox + c * cell, y + 6, 'caption', T['muted'], w=cell, align='center', size=10)
        for rr in range(rows):
            t(q, str(rows - rr), x + 2, oy + rr * cell + cell / 2 - 7, 'caption', T['muted'], w=pad - 4, align='center', size=10)
    occ = _occupied(rows)
    pmap = {(COLS.index(c), rows - n): k for c, n, k in problem}
    for c in range(11):
        for rr in range(rows):
            cx, cy = ox + c * cell + cell / 2, oy + rr * cell + cell / 2
            if (c, rr) in pmap:
                k = pmap[(c, rr)]
                d = cell * 0.86
                col = WALL[k]
                if lit:
                    hd = d * 1.5
                    q.ellipse(cx - hd / 2, cy - hd / 2, hd, hd, col + '5C', name=f'Wall / {k} / lit halo')
                q.ellipse(cx - d / 2, cy - d / 2, d, d, col + '24', stroke=col, sw=2.4 if k != 'hold' else 2, name=f'Wall / {k}')
                if k != 'hold':  # start and finish carry a centre dot; hold is a plain ring (shape, not colour alone)
                    q.ellipse(cx - d * 0.18, cy - d * 0.18, d * 0.36, d * 0.36, col, name=f'Wall / {k} / dot')
                if k == 'finish':
                    q.ellipse(cx - d / 2 - 3, cy - d / 2 - 3, d + 6, d + 6, None, stroke=col, sw=1.2, name='Wall / finish / outer ring')
            elif dots and (c, rr) in occ:
                d = cell * 0.30
                q.ellipse(cx - d / 2, cy - d / 2, d, d, T['raised'] if T['name'] == 'light' else '#2E3650', name='Wall / hold')
    return h


def wall_thumb(q, T, x, y, problem, s=64, rows=18, mono=True):
    """Mini MoonBoard, the one problem thumbnail everywhere: a Stone tile (raised in dark) with a faint 11 x rows
    grid, the problem's holds as Night dots, start and finish as small rings in the wall LED colours."""
    tw = s * 0.69
    q.rect(x, y, tw, s, T['raised'], r=min(10, s * 0.16), name='Mini MoonBoard')
    pad = s * 0.08
    gx, gy = x + pad, y + pad
    cw = (tw - 2 * pad) / 11; ch = (s - 2 * pad) / rows
    hint = T['text'] + '14'
    for c in range(1, 11):
        q.rect(gx + c * cw - 0.25, gy, 0.5, s - 2 * pad, hint, name='Grid hint')
    for r in range(1, rows):
        q.rect(gx, gy + r * ch - 0.25, tw - 2 * pad, 0.5, hint, name='Grid hint')
    d = max(3.2, min(cw, ch) * 1.05)
    for c, n, k in problem:
        cx = gx + COLS.index(c) * cw + cw / 2; cy = gy + (rows - n) * ch + ch / 2
        if k == 'hold':
            q.ellipse(cx - d / 2, cy - d / 2, d, d, T['text'], name='Thumb / hold')
        else:
            rd = d + 1.6
            q.ellipse(cx - rd / 2, cy - rd / 2, rd, rd, None, stroke=WALL[k], sw=max(1.2, s / 40), name=f'Thumb / {k} ring')


# A few problems to draw with (hold positions illustrative).
FLOWERS = [('A', 5, 'start'), ('E', 8, 'hold'), ('E', 10, 'hold'), ('H', 13, 'hold'), ('I', 14, 'hold'), ('K', 8, 'hold'), ('J', 18, 'finish')]
WARMUP = [('C', 4, 'start'), ('D', 7, 'hold'), ('B', 10, 'hold'), ('E', 12, 'hold'), ('C', 15, 'hold'), ('F', 18, 'finish')]
VICTORIA = [('G', 3, 'start'), ('F', 3, 'start'), ('H', 7, 'hold'), ('E', 9, 'hold'), ('G', 12, 'hold'), ('D', 15, 'hold'), ('B', 18, 'finish')]
MUFFLER = [('I', 5, 'start'), ('H', 9, 'hold'), ('K', 11, 'hold'), ('F', 13, 'hold'), ('H', 16, 'hold'), ('E', 18, 'finish')]
LAKSA = [('B', 2, 'start'), ('D', 6, 'hold'), ('A', 9, 'hold'), ('C', 13, 'hold'), ('A', 16, 'hold'), ('D', 18, 'finish')]
WRIST = [('F', 4, 'start'), ('G', 8, 'hold'), ('D', 11, 'hold'), ('H', 13, 'hold'), ('F', 16, 'hold'), ('G', 18, 'finish')]
