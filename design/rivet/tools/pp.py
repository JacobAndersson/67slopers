"""Rivet's Penpot builder: editable shapes (rects, ellipses, text, paths, images) written straight
into the local Penpot file through its RPC API, with deterministic ids so re-running replaces a board."""
import json, math, re, sys, uuid
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'design/penpot'))
from api import Penpot  # noqa: E402
sys.path.insert(0, str(HERE))
from svgpath import path_commands  # noqa: E402

ZERO = '00000000-0000-0000-0000-000000000000'
I = dict(a=1, b=0, c=0, d=1, e=0, f=0)
LOCAL = ROOT / 'design/.local/rivet'
FONTS = json.loads((LOCAL / 'fonts.json').read_text())
FAMILY_NAME = {}  # Penpot family label per key (same as key unless renamed)


def uid(*parts):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'rivet/' + '/'.join(map(str, parts))))


def hexa(c):
    """'#rrggbb' or '#rrggbbaa' -> (hex, opacity)."""
    if len(c) == 9: return c[:7], int(c[7:], 16) / 255
    return c, 1


class Board:
    def __init__(self, doc, page, key, name, x, y, w, h, bg='#ffffff', clip=True):
        self.doc, self.page, self.key, self.x, self.y, self.w, self.h = doc, page, key, x, y, w, h
        self.id = uid('board', key); self.n = 0; self.objects = []; self.stack = [self.id]
        f = self._base('frame', name, 0, 0, w, h, fill=bg, id=self.id, parent=ZERO)
        f['shapes'] = []; f['showContent'] = not clip; f['hideFillOnExport'] = False
        f['exports'] = [{'type': 'png', 'scale': 2, 'suffix': ''}]
        doc.boards.append(self)

    # ---- primitives -------------------------------------------------
    def _base(self, typ, name, x, y, w, h, fill=None, stroke=None, sw=1, r=0, id=None, parent=None, opacity=1, salign='inner'):
        self.n += 1; ox, oy = x + self.x, y + self.y
        par = parent or self.stack[-1]
        o = {'id': id or uid(self.key, self.n, name), 'name': name, 'type': typ, 'x': ox, 'y': oy, 'width': w, 'height': h,
             'selrect': dict(x=ox, y=oy, width=w, height=h, x1=ox, y1=oy, x2=ox + w, y2=oy + h),
             'points': [dict(x=ox, y=oy), dict(x=ox + w, y=oy), dict(x=ox + w, y=oy + h), dict(x=ox, y=oy + h)],
             'transform': I, 'transformInverse': I, 'parentId': par, 'frameId': par,
             'rotation': 0, 'flipX': False, 'flipY': False, 'fills': [], 'strokes': [], 'opacity': opacity,
             'constraintsH': 'left', 'constraintsV': 'top', 'proportionLock': False}
        if fill: o['fills'] = self._fills(fill)
        if stroke:
            c, a = hexa(stroke)
            o['strokes'] = [dict(strokeColor=c, strokeOpacity=a, strokeWidth=sw, strokeStyle='solid', strokeAlignment=salign)]
        if r:
            rs = r if isinstance(r, (list, tuple)) else (r, r, r, r)
            o.update(dict(r1=rs[0], r2=rs[1], r3=rs[2], r4=rs[3]))
        self.objects.append(o)
        return o

    def _fills(self, fill):
        if isinstance(fill, dict): return [fill]
        if isinstance(fill, list): return fill
        c, a = hexa(fill); return [dict(fillColor=c, fillOpacity=a)]

    def rect(self, x, y, w, h, fill=None, r=0, stroke=None, sw=1, name='Rectangle', opacity=1, salign='inner'):
        return self._base('rect', name, x, y, w, h, fill, stroke, sw, r, opacity=opacity, salign=salign)

    def ellipse(self, x, y, w, h, fill=None, stroke=None, sw=1, name='Ellipse', opacity=1):
        return self._base('circle', name, x, y, w, h, fill, stroke, sw, opacity=opacity)

    def frame(self, x, y, w, h, fill=None, r=0, name='Frame', clip=True, stroke=None, sw=1):
        """A nested board (clips content). Use as a context manager."""
        o = self._base('frame', name, x, y, w, h, fill, stroke, sw, r)
        o['shapes'] = []; o['showContent'] = not clip
        return _Ctx(self, o)

    def path(self, d, x=0, y=0, scale=1, fill=None, stroke=None, sw=1, name='Path', cap='round', opacity=1, xf=None, shadow=None):
        """Draw SVG path data `d`, scaled then offset to (x, y) in board coordinates."""
        segs = path_commands(d)
        if xf:  # transform in the path's own units before scaling: xf(x, y) -> (x, y)
            for sg in segs:
                p = sg.get('params', {})
                for a, bb in (('x', 'y'), ('c1x', 'c1y'), ('c2x', 'c2y')):
                    if a in p: p[a], p[bb] = xf(p[a], p[bb])
        xs, ys = [], []
        for s in segs:
            for k, v in list(s.get('params', {}).items()):
                if k.endswith('x'): s['params'][k] = v * scale + x + self.x; xs.append(s['params'][k])
                else: s['params'][k] = v * scale + y + self.y; ys.append(s['params'][k])
        bx, by = min(xs), min(ys); bw, bh = max(max(xs) - bx, .01), max(max(ys) - by, .01)
        o = self._base('path', name, bx - self.x, by - self.y, bw, bh, fill, None, opacity=opacity)
        o['content'] = segs
        if shadow: o['shadow'] = [dict(id=uid(self.key, self.n, 'sh'), style='drop-shadow', offsetX=shadow[0], offsetY=shadow[1], blur=shadow[2], spread=0, hidden=False, color=dict(color=shadow[3], opacity=shadow[4]))]
        if stroke:
            c, a = hexa(stroke)
            o['strokes'] = [dict(strokeColor=c, strokeOpacity=a, strokeWidth=sw, strokeStyle='solid', strokeAlignment='center',
                                 strokeCapStart=cap, strokeCapEnd=cap)]
        return o

    def image(self, path, x, y, w, h, r=0, name=None, fit='cover', opacity=1):
        m = self.doc.media(path)
        o = self._base('rect', name or 'Image / ' + Path(path).stem, x, y, w, h, r=r, opacity=opacity)
        o['fills'] = [{'fillOpacity': 1, 'fillImage': {'id': m['id'], 'width': m['width'], 'height': m['height'],
                                                        'mtype': m['mtype'], 'name': m['name'], 'keepAspectRatio': fit == 'cover'}}]
        return o

    def text(self, s, x, y, w=None, size=16, font='NationalPark', weight=400, color='#111111', lh=1.3, ls=0,
             align='left', name=None, upper=False, grow=None, valign='top', h=None):
        """Text box. w=None -> auto-width single block. Lines split on '\n'; wrapping by Penpot (fixed width)."""
        c, a = hexa(color)
        fill = [dict(fillColor=c, fillOpacity=a)]
        attrs = dict(fontId='custom-' + FONTS[font], fontFamily=FAMILY_NAME.get(font, font), fontVariantId=f'normal-{weight}',
                     fontWeight=str(weight), fontStyle='normal', fontSize=str(size), lineHeight=str(lh),
                     letterSpacing=str(ls), textTransform='uppercase' if upper else 'none', textDecoration='none',
                     textAlign=align, fills=fill, direction='ltr')
        lines = s.split('\n')
        est_w = w or max(self.doc.measure(l.upper() if upper else l, font, weight, size, ls) for l in lines) + 4
        nlines = sum(self.doc.wraps(l, font, weight, size, ls, est_w) for l in lines)
        height = h or nlines * size * lh
        o = self._base('text', name or s.split('\n')[0][:60], x, y, est_w, height)
        o['growType'] = grow or ('auto-width' if w is None else 'auto-height')
        o['content'] = {'type': 'root', 'verticalAlign': valign, 'children': [{'type': 'paragraph-set', 'children': [
            {'type': 'paragraph', **attrs, 'children': [{'text': l or ' ', **attrs}]} for l in lines]}]}
        return o

    def group_start(self, name):
        pass


class _Ctx:
    def __init__(self, b, o): self.b, self.o = b, o
    def __enter__(self): self.b.stack.append(self.o['id']); return self.o
    def __exit__(self, *a): self.b.stack.pop()


class Doc:
    def __init__(self):
        self.p = Penpot(); self.boards = []; self.pages = {}
        self._media = json.loads((LOCAL / 'media.json').read_text()) if (LOCAL / 'media.json').exists() else {}
        self._fonts = {}

    # ---- text metrics (for box sizes; Penpot itself lays the text out) ----
    def _ttf(self, font, weight):
        key = (font, weight)
        if key not in self._fonts:
            from fontTools.ttLib import TTFont
            path = HERE.parent / 'fonts' / f'{font}-{weight}.ttf'
            if not path.exists(): path = sorted((HERE.parent / 'fonts').glob(f'{font}-*.ttf'))[0]
            t = TTFont(path); self._fonts[key] = (t.getBestCmap(), t['hmtx'], t['head'].unitsPerEm)
        return self._fonts[key]

    def measure(self, s, font, weight, size, ls=0):
        cmap, hmtx, upm = self._ttf(font, weight)
        return sum(hmtx[cmap.get(ord(ch), cmap.get(32))][0] for ch in s) * size / upm + ls * max(len(s) - 1, 0)

    def wraps(self, s, font, weight, size, ls, w):
        n, line = 1, ''
        for word in s.split(' '):
            t = (line + ' ' + word).strip()
            if line and self.measure(t, font, weight, size, ls) > w: n += 1; line = word
            else: line = t
        return n

    # ---- pages & media ----
    def page(self, name):
        f = self.p.file(); pid = uid('page', name)
        if pid not in f['data']['pagesIndex']:
            self.p.update([dict(type='add-page', id=pid, name=name)])
        self.pages[name] = pid
        return pid

    def media(self, path):
        path = Path(path); key = str(path)
        if key not in self._media:
            mt = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}[path.suffix.lower()]
            r = self.p.multipart('upload-file-media-object', {'file-id': self.p.workspace['fileId'], 'is-local': 'true',
                                                              'name': path.stem}, [('content', path, mt)])
            self._media[key] = dict(id=r['id'], width=r['width'], height=r['height'], mtype=r['mtype'], name=path.stem)
            (LOCAL / 'media.json').write_text(json.dumps(self._media, indent=1))
        return self._media[key]

    def publish(self, boards=None):
        boards = boards or self.boards
        f = self.p.file(); changes = []
        for b in boards:
            existing = f['data']['pagesIndex'][b.page]['objects']
            if b.id in existing:
                changes.append(dict(type='del-obj', id=b.id, pageId=b.page))
        if changes: self.p.update(changes)
        changes = []
        for b in boards:
            # children lists
            kids = {}
            for o in b.objects[1:]: kids.setdefault(o['parentId'], []).append(o['id'])
            for o in b.objects:
                if o['type'] == 'frame': o['shapes'] = kids.get(o['id'], [])
            for o in b.objects:
                changes.append(dict(type='add-obj', id=o['id'], pageId=b.page, frameId=o['frameId'], parentId=o['parentId'], obj=o))
        for i in range(0, len(changes), 400):
            self.p.update(changes[i:i + 400])
        print(f'published {len(boards)} boards, {len(changes)} shapes', flush=True)

    def render(self, b, out, scale=1, kind='png'):
        self.p.render(b.page, b.id, Path(out), scale, kind)


class Scaled:
    """Draw on a board through an offset + uniform scale (for mock-ups placed smaller or larger)."""
    def __init__(self, b, ox, oy, k):
        self.b, self.ox, self.oy, self.k = b, ox, oy, k
        self.dark = getattr(b, 'dark', False); self.doc = b.doc; self.key = b.key

    def X(self, x): return self.ox + x * self.k
    def Y(self, y): return self.oy + y * self.k

    def rect(self, x, y, w, h, fill=None, r=0, stroke=None, sw=1, **kw):
        rr_ = [v * self.k for v in r] if isinstance(r, (list, tuple)) else r * self.k
        return self.b.rect(self.X(x), self.Y(y), w * self.k, h * self.k, fill, rr_, stroke, sw * self.k, **kw)

    def ellipse(self, x, y, w, h, fill=None, stroke=None, sw=1, **kw):
        return self.b.ellipse(self.X(x), self.Y(y), w * self.k, h * self.k, fill, stroke, sw * self.k, **kw)

    def text(self, s, x, y, w=None, size=16, ls=0, h=None, **kw):
        return self.b.text(s, self.X(x), self.Y(y), None if w is None else w * self.k, size=size * self.k, ls=ls * self.k,
                           h=None if h is None else h * self.k, **kw)

    def path(self, d, x=0, y=0, scale=1, sw=1, **kw):
        return self.b.path(d, self.X(x), self.Y(y), scale * self.k, sw=sw * self.k, **kw)

    def image(self, path, x, y, w, h, r=0, **kw):
        return self.b.image(path, self.X(x), self.Y(y), w * self.k, h * self.k, r=r * self.k, **kw)

    def frame(self, x, y, w, h, fill=None, r=0, **kw):
        return self.b.frame(self.X(x), self.Y(y), w * self.k, h * self.k, fill, r * self.k, **kw)


def shadow(o, x=0, y=8, blur=24, color='#0B0F1C', opacity=0.25):
    o['shadow'] = [dict(id=str(uuid.uuid4()), style='drop-shadow', offsetX=x, offsetY=y, blur=blur, spread=0, hidden=False, color=dict(color=color, opacity=opacity))]
    return o
