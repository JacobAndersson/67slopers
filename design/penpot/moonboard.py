"""MoonBoard exploration and the dock navigation, as editable Penpot boards.

Separate from recreate.py and design_system.py: this generator owns only its own
deterministic shapes on the MoonBoard page and never touches the other pages.
Run without --publish for review SVGs in design/exports/moonboard.
"""

import argparse
import hashlib
import json
import math
import re
from api import Penpot, ROOT
from scene import Board, Scene, C, FILE, REF, ZERO, path_commands, uid

PAGE = 'f135c210-f44f-4df4-a087-1e4ae0026f09'
PAGE_NAME = '07 MoonBoard & dock'
OUT = ROOT/'design/exports/moonboard'
INVENTORY = ROOT/'design/explorations/moonboard/inventory.json'
OWNERSHIP = ROOT/'design/.local/moonboard-owned.json'
SCENE = Scene()
W, H = 390, 844

# LED roles follow the MoonBoard convention; they are paired with shape and a legend.
HOLD = {'start': '#2e9d62', 'hold': '#2f6fd8', 'finish': '#d8472f'}
WOOD = '#c8a06a'
OK = '#2e9d62'
GRADES = ['5+', '6A', '6A+', '6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+']
VGRADES = ['V1', 'V2', 'V3', 'V4', 'V4', 'V5', 'V5', 'V6', 'V7', 'V8', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14']
# Benchmarks per grade (6A+ .. 8B) on Masters 2019 at 40 degrees.
HISTOGRAM = [39, 40, 38, 41, 47, 37, 32, 25, 29, 31, 26, 10, 3, 1]


def problem(name, setter, grade, sends, stars, tries, start, mid, end):
    return dict(name=name, setter=setter, grade=grade, sends=sends, stars=stars, tries=tries, start=start, hold=mid, finish=end)


# Sample rows: public Masters 2019 40 degree benchmarks.
P = {p['name']: p for p in [
    problem('THE WARM UP PROBLEM', 'RussK', 2, 23889, 4.3, 1.4, ['A5', 'B5'], ['B8', 'G9', 'F10', 'H12', 'F15', 'H16'], ['D18']),
    problem('DA REAL 6A+', 'Dennis Kunath', 3, 15709, 4.1, 1.4, ['F3', 'I4'], ['I8', 'F10', 'H12', 'E15', 'H16'], ['D18']),
    problem('VV VICTORIA', 'zuro', 4, 12583, 4.3, 1.5, ['A5', 'E4'], ['B8', 'A11', 'E10', 'G12', 'F15'], ['J18']),
    problem('BLACK MUFFLER', 'KoalaClimbing', 5, 9711, 4.2, 1.8, ['F4'], ['G9', 'B11', 'D15'], ['H18']),
    problem('SAWDUST LAKSA', 'PeterS', 6, 6423, 4.3, 1.6, ['K3', 'I5'], ['J9', 'H11', 'H15', 'I12', 'E14', 'E8', 'F17'], ['J18']),
    problem('FLOWERS FOR DAYZ', 'Corey Zee', 7, 7089, 4.3, 2.0, ['B5'], ['H13', 'I14', 'F10', 'K8', 'F8'], ['J18']),
    problem('WORTH THE WRIST', 'Nick Wedge', 7, 1222, 4.2, 2.5, ['B6', 'C4'], ['E9', 'A12', 'F12', 'E15'], ['I18']),
    problem('LICHTBLICK', 'Flo Brand', 8, 3754, 4.4, 2.2, ['I4', 'I6'], ['F10', 'E10', 'A13', 'B14'], ['B18']),
    problem('THE KRAMER', 'Alex Biale', 9, 1873, 4.3, 2.3, ['H2', 'F6'], ['E9', 'B10', 'D15'], ['H18']),
]}
DEMO = P['FLOWERS FOR DAYZ']
DRAFT = dict(start=['C4', 'F5'], hold=['E8', 'H10', 'G13', 'D15'], finish=[])
CORNERS = dict(start=[], hold=['A1', 'K1', 'A18', 'K18'], finish=[])


def load_icons():
    """Read Phosphor vectors straight from the installed package, like reference.ts."""
    wanted = dict(house='House', timer='Timer', board='DotsNine', calendar='CalendarBlank', gear='GearSix',
                  bluetooth='Bluetooth', bluetooth_off='BluetoothSlash', bluetooth_on='BluetoothConnected',
                  bulb='Lightbulb', search='MagnifyingGlass', heart='Heart', star='Star', ok='CheckCircle',
                  warn='WarningCircle', sort='ArrowsDownUp', caret='CaretDown', pencil='PencilSimple', trash='Trash',
                  tap='HandTap', undo='ArrowCounterClockwise', info='Info',                   minus='Minus', seal='SealCheck', signal='CellSignalHigh', signal_low='CellSignalLow',
                  spinner='CircleNotch', arrow='ArrowRight', flip='ArrowsLeftRight', export='Export', power='Power',
                  lock='LockSimple', list_plus='ListPlus', remove='MinusCircle', flag='FlagCheckered', funnel='FunnelSimple', mountains='Mountains')
    for key, name in wanted.items():
        source = (ROOT/f'node_modules/phosphor-react-native/src/defs/{name}.tsx').read_text()
        paths = {}
        for weight in ('regular', 'bold', 'fill'):
            block = re.search(r"'%s',\s*<>(.*?)</>" % weight, source, re.S)
            paths[weight] = ' '.join(re.findall(r'\sd="([^"]+)"', block[1]))
            assert paths[weight], (name, weight)
        REF['icons'][key] = dict(name=name, slots=1, paths=paths)
    # Icons shared with the app recreation only carry regular and bold.
    for icon in REF['icons'].values():
        if 'fill' not in icon['paths']:
            source = (ROOT/f'node_modules/phosphor-react-native/src/defs/{icon["name"]}.tsx').read_text()
            icon['paths']['fill'] = ' '.join(re.findall(r'\sd="([^"]+)"', re.search(r"'fill',\s*<>(.*?)</>", source, re.S)[1]))


load_icons()


def tw(text, size):
    return len(text)*size*.602


def cell_of(hold):
    return 'ABCDEFGHIJK'.index(hold[0]), int(hold[1:])


def blob(col, row):
    """Same deterministic schematic hold used by src/components/moon-board.tsx."""
    seed = (col*73+row*151+col*row*31) % 97
    return .17+((seed*7) % 11)/100, .13+((seed*13) % 9)/100, (seed*29) % 150-75


class MB(Board):
    def __init__(self, key, name, col=0, row=0, h=H, w=W, route='', note='', x=None, y=None, bg='background', page=PAGE, scene=None, prefix='mb-'):
        super().__init__(scene or SCENE, prefix+key, name, page, col*470 if x is None else x, 1400+row*1300 if y is None else y, w, h, bg, route, note)
        self.filters = []

    # --- primitives -------------------------------------------------------
    def _shape(self, *args, **kwargs):
        o = super()._shape(*args, **kwargs)
        for fill in o['fills']:
            for role, color in HOLD.items():
                if fill['fillColor'] == color: fill.update(fillColorRefId=uid('color/moonboard/'+role), fillColorRefFile=FILE)
        return o

    def _link_stroke(self, o):
        for stroke in o.get('strokes', []):
            for key, col in C.items():
                if col == stroke['strokeColor']:
                    stroke.update(strokeColorRefId=uid('color/'+key), strokeColorRefFile=FILE)
                    break
            for role, col in HOLD.items():
                if col == stroke['strokeColor']: stroke.update(strokeColorRefId=uid('color/moonboard/'+role), strokeColorRefFile=FILE)

    def box(self, x, y, w, h, fill='card', stroke=None, r=12, name='Surface', opacity=1, sw=1, shadow=None):
        o = self._shape('rect', name, x, y, w, h, fill, stroke, r)
        if fill and opacity != 1: o['fills'][0]['fillOpacity'] = opacity
        if stroke: o['strokes'][0]['strokeWidth'] = sw
        self._link_stroke(o)
        extra = ''
        if shadow:
            dy, blur, alpha = shadow
            o['shadow'] = [dict(id=uid(o['id']+'/shadow'), style='drop-shadow', offsetX=0, offsetY=dy, blur=blur, spread=0, hidden=False, color=dict(color=C['foreground'], opacity=alpha))]
            fid = 'f'+o['id'][:8]
            self.filters.append(f'<filter id="{fid}" x="-30%" y="-60%" width="160%" height="260%"><feDropShadow dx="0" dy="{dy}" stdDeviation="{blur/2}" flood-color="{C["foreground"]}" flood-opacity="{alpha}"/></filter>')
            extra = f' filter="url(#{fid})"'
        inset = sw/2 if stroke else 0
        self.svg.append(f'<rect x="{x+inset}" y="{y+inset}" width="{w-2*inset}" height="{h-2*inset}" rx="{max(0,r-inset)}" fill="{self.color(fill) if fill else "none"}" fill-opacity="{opacity}" stroke="{self.color(stroke) if stroke else "none"}" stroke-width="{sw}"{extra}/>')
        return o

    def dot(self, cx, cy, r, fill='foreground', stroke=None, sw=2, opacity=1, name='Dot'):
        o = self._shape('circle', name, cx-r, cy-r, 2*r, 2*r, fill, stroke)
        if fill and opacity != 1: o['fills'][0]['fillOpacity'] = opacity
        if stroke: o['strokes'][0].update(strokeWidth=sw, strokeAlignment='center')
        self._link_stroke(o)
        self.svg.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{self.color(fill) if fill else "none"}" fill-opacity="{opacity}" stroke="{self.color(stroke) if stroke else "none"}" stroke-width="{sw}"/>')
        return o

    def vec(self, d, x, y, w, h, fill=None, stroke=None, sw=2, name='Vector', opacity=1):
        """A path whose coordinates are local to (x, y)."""
        o = self._shape('path', name, x, y, w, h, fill)
        content = path_commands(d)
        for seg in content:
            for key in seg.get('params', {}):
                seg['params'][key] += (x+self.x) if key.endswith('x') else (y+self.y)
        o['content'] = content
        if fill and opacity != 1: o['fills'][0]['fillOpacity'] = opacity
        if stroke:
            o['strokes'] = [dict(strokeColor=self.color(stroke), strokeWidth=sw, strokeOpacity=1, strokeStyle='solid', strokeAlignment='center', strokeCapStart='round', strokeCapEnd='round')]
            self._link_stroke(o)
        self.svg.append(f'<path d="{d}" transform="translate({x} {y})" fill="{self.color(fill) if fill else "none"}" fill-opacity="{opacity}" stroke="{self.color(stroke) if stroke else "none"}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>')
        return o

    def text(self, text, x, y, w=342, size=16, weight=400, color='foreground', align='left', lh=None, name=None):
        """`y` is the top of a line box whose centre is the centre of the capitals."""
        return super().text(text, x, y+size*.042, w, size, weight, color, align, lh, name)

    def button(self, label, x, y, w=342, h=56, variant='primary', icon=None, target=None, size=16):
        """Label and icon share one centre line; the pair is centred as a group."""
        fill = {'primary': 'primary', 'outline': 'background', 'secondary': 'secondary', 'ghost': None, 'disabled': 'border'}[variant]
        o = self.rect(x, y, w, h, fill, 'border' if variant == 'outline' else None, 12 if h >= 56 else 10, 'Button / '+label)
        col = 'primaryForeground' if variant == 'primary' else 'foreground'
        lh = size*1.5
        glyph = 20 if size >= 16 else 18
        width = tw(label, size)+(glyph+8 if icon else 0)
        start = x+(w-width)/2
        if icon:
            self.icon(icon, start, y+(h-glyph)/2, glyph, col)
            start += glyph+8
        self.text(label, start, y+(h-lh)/2, tw(label, size)+2, size, 600 if icon else 500, col, lh=lh)
        if target: self.link(o, target)
        return o

    def t(self, text, x, y, w=342, size=14, weight=400, color='foreground', align='left', lh=None):
        return self.text(text, x, y, w, size, weight, color, align, lh)[0]

    def tl(self, text, x, y, w=342, size=14, weight=400, color='foreground', align='left', target=None):
        height, o = self.text(text, x, y, w, size, weight, color, align)
        if target: self.link(o, 'mb-'+target)
        return o

    def ic(self, name, x, y, size=24, color='foreground', weight='regular', target=None):
        self.icon(name, x, y, size, color, weight)
        if target: self.link(self.objects[-1], 'mb-'+target)
        return self.objects[-1]

    def btn(self, label, x, y, w=342, h=56, variant='primary', icon=None, target=None, size=16):
        return self.button(label, x, y, w, h, variant, icon, 'mb-'+target if target else None, size)

    def save_svg(self, directory):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}"><defs>{"".join(self.filters)}</defs><rect width="100%" height="100%" fill="{self.objects[0]["fills"][0]["fillColor"]}"/>'+''.join(self.svg)+'</svg>'
        (directory/(self.key+'.svg')).write_text(svg)

    # --- chrome -----------------------------------------------------------
    def status(self):
        self.t('9:41', 24, 10, 100, 12, 600)
        self.box(self.w-48, 15, 22, 10, None, 'foreground', 2, 'Status / battery')
        self.box(self.w-46, 17, 17, 6, 'foreground', r=1, name='Status / charge')

    def gesture(self):
        self.box((self.w-120)/2, self.h-12, 120, 4, 'foreground', r=2, name='System / gesture bar')

    def nav(self, title='', back=None, close=None, right=None, sub=None):
        """Pushed-screen header. `right` is a list of (icon, target, weight, color)."""
        self.status()
        if back: self.ic('chevron-left', 20, 54, target=back)
        if close: self.ic('x', 20, 54, target=close)
        if title: self.t(title, 70, 54, self.w-140, 18, 600, 'foreground', 'center')
        if sub: self.t(sub, 70, 80, self.w-140, 12, 500, 'mutedForeground', 'center')
        for i, item in enumerate(right or []):
            name, target, weight, color = (list(item)+[None, 'regular', 'foreground'][len(item)-1:])[:4]
            self.ic(name, self.w-44-i*44, 54, 24, color or 'foreground', weight or 'regular', target)
        return 112

    def root(self, title, right=None):
        """Dock-level screen header with a large title."""
        self.status()
        self.t(title, 24, 52, 260, 30, 700)
        for i, (name, target) in enumerate(right or []):
            self.ic(name, self.w-48-i*44, 58, 24, target=target)
        return 112

    def progress(self, step, total=3, y=104):
        seg = (342-(total-1)*6)/total
        for i in range(total):
            self.box(24+i*(seg+6), y, seg, 4, 'foreground' if i < step else 'border', r=2, name=f'Progress / {i+1}')
        self.t(f'STEP {step} OF {total}', 24, y+16, 200, 12, 500, 'mutedForeground')
        return y+48

    def footer_bar(self, height=104):
        y = self.h-height
        self.box(0, y, self.w, height, 'background', r=0, name='Pinned footer')
        self.box(0, y, self.w, 1, 'border', r=0, name='Pinned footer / divider')
        return y

    def sheet(self, y, title=None, action=None):
        self.box(0, 0, self.w, self.h, 'foreground', r=0, name='Sheet / scrim', opacity=.45)
        self.box(0, y, self.w, self.h-y+24, 'background', r=24, name='Sheet / surface')
        self.box((self.w-40)/2, y+10, 40, 4, 'border', r=2, name='Sheet / handle')
        if title: self.t(title, 24, y+34, 270, 20, 600)
        if action: self.t(action, 266, y+38, 100, 14, 500, 'foreground', 'right')
        return y+80

    DOCK = [('home', 'house', 'home'), ('hang', 'timer', 'hang'), ('climb', 'board', 'list'), ('log', 'calendar', 'log'), None, ('settings', 'gear', 'settings')]

    def dock(self, active, x=None, y=None, lights=False, pressed=None, link=True, labelled=False):
        """Floating dock: 48 px targets, a tinted tile behind the active item."""
        item, gap, pad = 48, 4, 6
        widths = [(17 if entry is None else item+(tw(entry[0].title(), 14)+10 if labelled and entry[0] == active else 0)) for entry in self.DOCK]
        width = sum(widths)+gap*(len(widths)-1)+pad*2
        scrim = x is None
        x = (self.w-width)/2 if x is None else x
        y = self.h-28-(item+pad*2) if y is None else y
        if scrim: self.fade(self.h-132, self.h)
        self.box(x, y, width, item+pad*2, 'card', 'border', 22, 'Dock', opacity=.94, shadow=(12, 28, .16))
        cx = x+pad
        for entry, wd in zip(self.DOCK, widths):
            if entry is None:
                self.box(cx+8, y+pad+12, 1, 24, 'border', r=0, name='Dock / separator')
            else:
                key, icon, target = entry
                on = key == active
                if on: self.box(cx, y+pad, wd, item, 'secondary', r=14, name='Dock / active tile')
                elif key == pressed: self.box(cx+2, y+pad+2, wd-4, item-4, 'muted', r=12, name='Dock / pressed tile')
                self.ic(icon, cx+12, y+pad+12, 24, 'foreground' if on else 'mutedForeground', 'fill' if on else 'regular', target if link and not on else None)
                if on and labelled: self.t(key.title(), cx+42, y+pad+14, wd-44, 14, 600)
                if key == 'climb' and lights: self.dot(cx+37, y+pad+11, 4.5, OK, 'card', 2, name='Dock / lights connected')
            cx += wd+gap
        self.gesture()
        return x, y, width

    # --- shared pieces ----------------------------------------------------
    def chip(self, label, x, y, selected=False, icon=None, h=32, dot=None, target=None, size=14, fill=None):
        w = tw(label, size)+24+(22 if icon else 0)+(14 if dot else 0)
        o = self.box(x, y, w, h, fill or ('primary' if selected else 'card'), None if selected or fill else 'border', h/2, 'Chip / '+label)
        col = 'primaryForeground' if selected else 'foreground'
        cx = x+12
        if dot: self.dot(cx+4, y+h/2, 4, dot, name='Chip / status'); cx += 14
        if icon: self.ic(icon, cx, y+(h-16)/2, 16, col); cx += 22
        self.t(label, cx, y+(h-size*1.5)/2, w, size, 500, col, lh=size*1.5)
        if target: self.link(o, 'mb-'+target)
        return w

    def fade(self, y0, y1):
        """Scroll content dissolves into the background before it reaches the dock."""
        o = self._shape('rect', 'Dock / content fade', 0, y0, self.w, y1-y0)
        color = C['background']
        o['fills'] = [dict(fillOpacity=1, fillColorGradient=dict(type='linear', startX=.5, startY=0, endX=.5, endY=1, width=1, stops=[dict(color=color, opacity=0, offset=0), dict(color=color, opacity=1, offset=.62)]))]
        gid = 'g'+o['id'][:8]
        self.filters.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{color}" stop-opacity="0"/><stop offset=".62" stop-color="{color}" stop-opacity="1"/></linearGradient>')
        self.svg.append(f'<rect x="0" y="{y0}" width="{self.w}" height="{y1-y0}" fill="url(#{gid})"/>')

    def toggle(self, x, y, on=True):
        self.box(x, y, 44, 26, 'primary' if on else 'border', r=13, name='Switch / '+('on' if on else 'off'))
        self.dot(x+(31 if on else 13), y+13, 10, 'card', name='Switch / thumb')

    def segmented(self, options, selected, y, x=24, w=342, h=44, dots=None):
        self.box(x, y, w, h, 'muted', r=12, name='Segmented / track', opacity=.7)
        each = (w-8)/len(options)
        for i, label in enumerate(options):
            on = label == selected
            if on: self.box(x+4+i*each, y+4, each, h-8, 'card', 'border', 9, 'Segmented / selected')
            dw = 14 if dots else 0
            start = x+4+i*each+(each-tw(label, 14)-dw)/2
            if dots: self.dot(start+4, y+h/2, 4, dots[i], name='Segmented / role')
            self.t(label, start+dw, y+(h-20)/2, each, 14, 600 if on else 500, 'foreground' if on else 'mutedForeground')
        return y+h

    def row(self, y, title, value=None, toggle=None, chevron=True, x=24, w=342, icon=None, sub=None, dot=None, color='foreground', h=56):
        tx = x+16
        if icon: self.ic(icon, tx, y+(h-22)/2, 22, color); tx += 34
        if dot: self.dot(tx+5, y+h/2, 5, dot, name='Row / status'); tx += 20
        if sub:
            self.t(title, tx, y+h/2-21, w-120, 16, 500, color); self.t(sub, tx, y+h/2+3, w-90, 12, 500, 'mutedForeground')
        else: self.t(title, tx, y+(h-24)/2, w-80, 16, 500, color)
        if toggle is not None: self.toggle(x+w-60, y+(h-26)/2, toggle)
        elif chevron: self.ic('chevron-right', x+w-34, y+(h-18)/2, 18, 'mutedForeground')
        if value: self.t(value, x+w-200-(38 if chevron and toggle is None else 16), y+(h-20)/2, 200, 14, 400, 'mutedForeground', 'right')

    def group(self, y, rows, x=24, w=342, h=56):
        """A card of settings rows separated by hairlines."""
        self.box(x, y, w, len(rows)*h, 'card', 'border', 16, 'Group')
        for i, kwargs in enumerate(rows):
            if i: self.box(x+16, y+i*h, w-32, 1, 'border', r=0, name='Group / divider')
            self.row(y+i*h, x=x, w=w, h=h, **kwargs)
        return y+len(rows)*h

    def wall(self, x, y, w, prob=None, rows=18, lit=False, labels=True, quiet=False, name='MoonBoard'):
        """Schematic board: every grid position has a hold, the problem is ringed."""
        gl, gt, pad = (22, 20, 10) if labels else (8, 8, 8)
        cell = (w-gl-pad)/11
        h = gt+rows*cell+pad
        self.box(x, y, w, h, 'card', 'border', 16 if w > 150 else 10, name)
        if labels:
            for c, letter in enumerate('ABCDEFGHIJK'):
                self.t(letter, x+gl+c*cell, y+5, cell, 10, 500, 'mutedForeground', 'center', lh=12)
            for r in range(rows):
                self.t(str(rows-r), x+2, y+gt+r*cell+(cell-12)/2, gl-4, 10, 500, 'mutedForeground', 'right', lh=12)
        chosen = {}
        for role in ('start', 'hold', 'finish'):
            for hold in (prob or {}).get(role, []):
                chosen[cell_of(hold)] = role

        def shapes(positions):
            parts = []
            for c, r in positions:
                rx, ry, angle = blob(c, r)
                cx, cy = gl+(c+.5)*cell, gt+(rows-r+.5)*cell
                dx, dy = rx*cell*math.cos(math.radians(angle)), rx*cell*math.sin(math.radians(angle))
                parts.append(f'M{cx-dx:.2f} {cy-dy:.2f}A{rx*cell:.2f} {ry*cell:.2f} {angle:.1f} 1 0 {cx+dx:.2f} {cy+dy:.2f}A{rx*cell:.2f} {ry*cell:.2f} {angle:.1f} 1 0 {cx-dx:.2f} {cy-dy:.2f}Z')
            return ''.join(parts)
        every = [(c, r) for r in range(1, rows+1) for c in range(11)]
        self.vec(shapes(every), x, y, w, h, 'muted' if quiet else 'border', name=name+' / holds')
        if chosen: self.vec(shapes(chosen), x, y, w, h, 'foreground', name=name+' / problem holds')
        for (c, r), role in chosen.items():
            cx, cy = x+gl+(c+.5)*cell, y+gt+(rows-r+.5)*cell
            if lit: self.dot(cx, cy, cell*.66, HOLD[role], opacity=.2, name=f'LED glow / {role}')
            ring = self.dot(cx, cy, cell*.43, HOLD[role], HOLD[role], max(1.5, cell*.11), name=f'{role.title()} / {"ABCDEFGHIJK"[c]}{r}')
            ring['fills'][0]['fillOpacity'] = .3 if lit else .12
            self.svg[-1] = self.svg[-1].replace('fill-opacity="1"', f'fill-opacity="{.3 if lit else .12}"')
            if role == 'finish': self.dot(cx, cy, cell*.6, None, HOLD[role], max(1, cell*.06), name='Finish / outer ring')
            if labels and cell >= 18:
                self.t(f'{"ABCDEFGHIJK"[c]}{r}', cx-cell*.45, cy-5, cell*.9, min(11,cell*.38), 700, 'background', 'center', lh=11)
        return h

    def thumb(self, x, y, prob, w=44, rows=18):
        cell = (w-8)/11
        h = rows*cell+8
        self.box(x, y, w, h, 'card', 'border', 8, 'Problem thumbnail')
        for role in ('start', 'hold', 'finish'):
            for hold in prob.get(role, []):
                c, r = cell_of(hold)
                self.dot(x+4+(c+.5)*cell, y+4+(rows-r+.5)*cell, max(1.9, cell*.62), HOLD[role], name=f'Thumbnail / {role}')
        return h

    def legend(self, y, x=None):
        items = [('start', 'Start'), ('hold', 'Hold'), ('finish', 'Finish')]
        total = sum(tw(label, 12)+16 for _, label in items)+2*18
        cx = (self.w-total)/2 if x is None else x
        for role, label in items:
            self.dot(cx+5, y+8, 5, HOLD[role], HOLD[role], 1.5, name='Legend / '+role)
            self.objects[-1]['fills'][0]['fillOpacity'] = .25
            self.svg[-1] = self.svg[-1].replace('fill-opacity="1"', 'fill-opacity="0.25"')
            if role == 'finish': self.dot(cx+5, y+8, 7.5, None, HOLD[role], 1, name='Legend / finish ring')
            self.t(label, cx+16, y, 80, 12, 500, 'mutedForeground', lh=16)
            cx += tw(label, 12)+16+18

    def grade(self, index, x, y, w=70, size=18):
        self.t(GRADES[index], x, y, w, size, 700, 'foreground', 'right')
        self.t(VGRADES[index], x, y+size*1.25+1, w, 12, 500, 'mutedForeground', 'right', lh=16)

    def stars(self, x, y, filled=4, size=28, gap=8):
        for i in range(5):
            self.ic('star', x+i*(size+gap), y, size, 'chart3' if i < filled else 'border', 'fill' if i < filled else 'regular')

    def qr(self, x, y, w):
        code = REF['qr']
        module = w/(code['size']+8)
        self.box(x, y, w, w, 'card', 'border', 16, 'QR / quiet zone')
        for r in range(code['size']):
            c = 0
            while c < code['size']:
                if not code['data'][r*code['size']+c]: c += 1; continue
                start = c
                while c < code['size'] and code['data'][r*code['size']+c]: c += 1
                self.box(x+(start+4)*module, y+(r+4)*module, (c-start)*module, module, 'foreground', r=0, name='QR / modules')


NAMES = {'THE WARM UP PROBLEM': 'The Warm Up Problem', 'DA REAL 6A+': 'Da Real 6A+', 'VV VICTORIA': 'VV Victoria', 'BLACK MUFFLER': 'Black Muffler', 'SAWDUST LAKSA': 'Sawdust Laksa', 'FLOWERS FOR DAYZ': 'Flowers for Dayz', 'WORTH THE WRIST': 'Worth the Wrist', 'LICHTBLICK': 'Lichtblick', 'THE KRAMER': 'The Kramer'}


def sends(n):
    return f'{n/1000:.1f}k' if n >= 1000 else str(n)


def short(text, limit):
    return text if len(text) <= limit else text[:limit-1].rstrip()+'…'


# ---------------------------------------------------------------- app shell

def hero(b, y):
    b.box(24, y, 342, 232, 'secondary', r=16, name='Next up / hero')
    b.t('Next up', 48, y+22, 200, 14, 500); b.t('24:10', 274, y+22, 68, 14, 500, 'foreground', 'right')
    b.t('Repeaters 7:3', 48, y+50, 294, 30, 800)
    b.t('6 × (6 × 7s / 3s · rest 3:00)', 48, y+94, 294, 14, 400, 'mutedForeground')
    b.t('Last done Yesterday · 6/6 sets', 48, y+118, 294, 14, 400, 'mutedForeground')
    b.btn('Start workout', 48, y+156, 294, 56, icon='play', size=18)


def board_card(b, y, connected=True):
    b.box(24, y, 342, 132, 'card', 'border', 16, 'On the board / card')
    b.thumb(40, y+16, P['WORTH THE WRIST'], 52)
    b.t('ON THE BOARD', 108, y+16, 160, 12, 500, 'mutedForeground')
    b.t('Worth the Wrist', 108, y+36, 190, 16, 600)
    b.t('7A · project · 5 tries', 108, y+62, 240, 14, 400, 'mutedForeground')
    b.t('7A', 296, y+14, 54, 18, 700, 'foreground', 'right')
    if connected: b.btn('Light it up', 108, y+88, 150, 32, 'secondary', icon='bulb', target='lit', size=14)
    else: b.btn('Open problem', 108, y+88, 150, 32, 'outline', target='detail', size=14)
    b.ic('chevron-right', 332, y+95, 18, 'mutedForeground', target='list')


def home():
    b = MB('home', 'A1 Shell / Home with dock', 0, 0, route='/', note='Dock replaces the single stack. Next up keeps one-tap Start; the board card resumes the last problem.')
    b.status(); b.brand(16, 49); b.ic('scan-qr-code', W-46, 54)
    hero(b, 104); board_card(b, 352)
    b.t('Your streak', 24, 508, 150, 14, 400, 'mutedForeground'); b.t('3 weeks', 24, 532, 150, 24, 700)
    b.t('Sessions', 202, 508, 150, 14, 400, 'mutedForeground'); b.t('14', 202, 532, 130, 24, 700)
    b.t('This week', 24, 596, 290, 16, 500); b.ic('chevron-right', 346, 598, 18, target='log')
    for i, ch in enumerate('MTWTFSS'): b.t(ch, 24+i*48.86, 640, 48.86, 14, 500, 'mutedForeground', 'center')
    for i, d in enumerate(range(5, 12)):
        x = 24+i*48.86
        b.box(x+6, 668, 36, 36, 'chart1' if d in (5, 7) else None, 'foreground' if d == 9 else None, 12, f'Calendar / {d}')
        b.t(str(d), x, 675, 48.86, 16, 600 if d == 9 else 500, 'foreground', 'center')
        if d == 7: b.dot(x+24.4, 699, 2, 'foreground', name='Calendar / session')
    b.dock('home', lights=True)


def hang():
    b = MB('hang', 'A2 Shell / Hang tab', 1, 0, route='/hang', note='Workout library moves off Home into its own tab.')
    y = b.root('Hang', [('plus', None), ('library', None)])
    b.box(24, y, 342, 96, 'secondary', r=16, name='Next up / compact')
    b.t('Next up', 44, y+16, 200, 12, 500); b.t('Repeaters 7:3', 44, y+36, 230, 18, 700)
    b.t('24:10 · last done Yesterday', 44, y+64, 250, 12, 500, 'mutedForeground')
    b.box(298, y+24, 48, 48, 'primary', r=24, name='Next up / start'); b.ic('play', 311, y+37, 22, 'primaryForeground', 'fill')
    y += 124
    b.t('Your workouts', 24, y, 250, 20, 600); y += 40
    for name, summary, time in [('Max hangs', '5 × (10s · rest 3:00)', '16:00'), ('Density hangs', '4 × (30s · rest 2:00)', '10:10'), ('Repeaters 7:3', '6 × (6 × 7s / 3s · rest 3:00)', '24:10'), ('Minimum edge', '6 × (12s · rest 3:00)', '19:12')]:
        b.box(24, y, 342, 84, 'card', 'border', 12, 'Workout / '+name)
        b.t(name, 40, y+16, 230, 16, 600); b.t(summary, 40, y+44, 270, 14, 400, 'mutedForeground'); b.t(time, 286, y+18, 64, 14, 500, 'foreground', 'right')
        y += 96
    b.t('Classic workouts', 24, y+12, 250, 20, 600)
    b.dock('hang')


HEAT = [0, .24, .46, .70, .94]  # the reference's five steps: one hue, strength only


def heat_level(week, day):
    """Sample training load per day, 16 weeks ending Friday 9 October 2026."""
    known = {(15, 0): 2, (15, 2): 4, (15, 4): 3, (14, 3): 2, (14, 4): 3}
    if week >= 14: return known.get((week, day), 0)
    seed = hashlib.md5(f'heat/{week}/{day}'.encode()).digest()
    trains = seed[0] < (120 if day in (0, 2, 4) else 70 if day == 5 else 28)
    return 1+seed[1] % 4 if trains and week > 1 else 1 if trains and day == 2 else 0


def heat_calendar(b, y, selected=None):
    """Weeks as columns, Monday on top: 16 px cells on a 20 px pitch."""
    x0 = 50
    for col, month in [(2, 'Jul'), (6, 'Aug'), (11, 'Sep'), (15, 'Oct')]:
        b.t(month, x0+col*20-2, y, 30, 10, 500, 'foreground' if selected and col == 15 else 'mutedForeground', lh=12)
    for row, letter in [(0, 'M'), (2, 'W'), (4, 'F')]:
        b.t(letter, 24, y+20+row*20+2, 16, 10, 500, 'mutedForeground', lh=12)
    for week in range(16):
        for day in range(7):
            if week == 15 and day > 4: continue  # the future is not drawn
            level = heat_level(week, day)
            dim = .3 if selected and (week, day) != selected else 1
            b.box(x0+week*20, y+20+day*20, 16, 16, 'chart1' if level else 'foreground', r=4, name=f'Heat / week {week+1} day {day+1}', opacity=(HEAT[level] if level else .06)*(dim if level else 1))
    if selected:
        week, day = selected
        b.box(x0+week*20-3, y+20+day*20-3, 22, 22, None, 'foreground', 7, 'Heat / selected', sw=1.5)
    y += 20+7*20+8
    b.t('22 Jun – 9 Oct', 24, y, 150, 10, 500, 'mutedForeground', lh=12)
    b.t('less', 232, y, 30, 10, 500, 'mutedForeground', 'right', lh=12)
    for i, alpha in enumerate(HEAT):
        b.box(268+i*14, y, 12, 12, 'chart1' if i else 'foreground', r=3, name=f'Legend / step {i}', opacity=alpha or .06)
    b.t('more', 342, y, 30, 10, 500, 'mutedForeground', lh=12)
    return y+12


def log_session_rows(b, y, rows):
    for icon, tint, title, sub, when, result, target in rows:
        b.box(24, y, 40, 40, tint, r=12, name='Session / type'); b.ic(icon, 33, y+9, 22)
        b.tl(title, 78, y-2, 190, 16, 600, target=target); b.t(sub, 78, y+24, 200, 12, 500, 'mutedForeground', lh=16)
        b.t(when, 266, y, 100, 12, 500, 'foreground', 'right', lh=16); b.t(result, 266, y+20, 100, 14, 400, 'mutedForeground', 'right')
        b.box(24, y+56, 342, 1, 'border', r=0, name='Session divider'); y += 72
    return y


def log(key='log', name='A3 Shell / Log tab', col=2, selected=None):
    note = 'Heat calendar after beui.dev: 16 weeks, one hue, darker means more training time. Cells arrive in a diagonal wave; reduced motion fades them in.'
    if selected: note = 'Tap a day to pin it: the others dim and its sessions show below. The squares are small, so a finger can also slide across the grid and the pin follows it. Tap the pinned day, or Clear, to let go.'
    b = MB(key, name, col, 0, route='/log', note=note)
    y = b.root('Log')
    b.t('Last 16 weeks', 216, 66, 150, 12, 500, 'mutedForeground', 'right', lh=16)
    for i, (label, value) in enumerate([('Streak', '3 weeks'), ('Sessions', '41'), ('Time', '38 h')]):
        b.t(label, 24+i*118, y, 110, 12, 500, 'mutedForeground', lh=16); b.t(value, 24+i*118, y+20, 110, 20, 700)
    y = heat_calendar(b, y+76, selected)+36
    if selected:
        b.t('Wed 7 Oct', 24, y, 200, 20, 600); b.tl('Clear', 300, y+3, 66, 14, 500, 'foreground', 'right', 'log'); y += 44
        y = log_session_rows(b, y, [('timer', 'secondary', 'Repeaters 7:3', '6 × (6 × 7s / 3s…)', '07:40', '6/6 sets', None),
                                    ('board', 'muted', 'MoonBoard session', '6 problems · hardest 7A', '18:05', '4 sends', 'session')])
        b.t('1 h 12 trained', 24, y-4, 342, 12, 500, 'mutedForeground', lh=16)
    else:
        b.t('Recent', 24, y, 200, 20, 600); b.t('View all', 266, y+3, 100, 14, 500, 'foreground', 'right'); y += 44
        log_session_rows(b, y, [('board', 'muted', 'MoonBoard session', '6 problems · hardest 7A', 'Today', '4 sends', 'session'),
                                ('timer', 'secondary', 'Repeaters 7:3', '6 × (6 × 7s / 3s…)', 'Wed', '6/6 sets', None),
                                ('board', 'muted', 'MoonBoard session', '9 problems · hardest 6C+', '2 Oct', '7 sends', None)])
        b.link(b.objects[0], 'mb-log-day')
    b.dock('log')


def settings():
    b = MB('settings', 'A4 Shell / Settings', 3, 0, route='/settings', note='Sound, vibration and Gen Z mode stay in the timer menu too.')
    y = b.root('Settings')
    b.t('BOARDS', 24, y, 200, 12, 500, 'mutedForeground'); y += 24
    y = b.group(y, [dict(title='Hangboard', value='Beastmaker 1000'), dict(title='MoonBoard', value='Masters 2019 · 40°'), dict(title='Board lights', value='Connected', dot=OK)])
    b.link(b.objects[-12], 'mb-boards')
    y += 28; b.t('TIMER', 24, y, 200, 12, 500, 'mutedForeground'); y += 24
    y = b.group(y, [dict(title='Sound', toggle=True), dict(title='Vibration', toggle=True), dict(title='Gen Z mode', toggle=False)])
    y += 28; b.t('CLIMBING', 24, y, 200, 12, 500, 'mutedForeground'); y += 24
    b.box(24, y, 342, 64, 'card', 'border', 16, 'Group'); b.t('Grades', 40, y+20, 100, 16, 500)
    b.segmented(['Font', 'V-scale'], 'Font', y+12, 190, 160, 40)
    y += 92
    b.t('Everything stays on this phone.\nNo account, no ads, no internet.', 24, y, 342, 12, 500, 'mutedForeground', 'center')
    b.dock('settings', lights=True)


def dock_spec():
    b = MB('dock-spec', 'A0 Dock / anatomy, states and motion', w=1200, h=1350, x=1960, y=0, note='Reference: beui.dev motion dock.')
    b.t('67SLOPERS / NAVIGATION', 40, 32, 1120, 12, 500, 'mutedForeground')
    b.t('The dock', 40, 76, 1120, 36, 800)
    b.t('One floating bar replaces the single stack. Four places and settings, icons only, with a tile that glides to the active one. It stays out of the way: no dock on the timer, in setup, or on any pushed screen.', 40, 132, 900, 16, 400, 'mutedForeground', lh=24)
    b.t('States', 40, 236, 400, 20, 600)

    def sample(i, caption, **kwargs):
        x = 40+(i % 3)*380
        y = 284+(i//3)*148
        wide = 380 if kwargs.get('labelled') else 340
        b.box(x, y, wide, 100, 'background', 'border', 16, 'Dock sample / '+caption)
        b.dock(kwargs.pop('active'), x+(wide-(342 if kwargs.get('labelled') else 289))/2, y+20, link=False, **kwargs)
        b.objects.pop(); b.svg.pop()  # samples carry no gesture bar
        b.t(caption, x, y+110, 340, 12, 500, 'mutedForeground')
    sample(0, 'Home', active='home')
    sample(1, 'Hang · timer workouts', active='hang')
    sample(2, 'Climb · MoonBoard', active='climb')
    sample(3, 'Log · calendar and sessions', active='log')
    sample(4, 'Settings', active='settings')
    sample(5, 'Lights connected dot · Log pressed', active='home', lights=True, pressed='log')
    sample(6, 'Alternative: the active item shows its name', active='climb', labelled=True)
    b.box(460, 580, 680, 100, 'accent', r=16, name='Alternative / note')
    b.t('Worth testing on a device', 484, 600, 620, 14, 600)
    b.t('Icons alone are quiet and compact, but Hang and Climb are new ideas. A name on the active item teaches the icons without adding a label row.', 484, 624, 632, 12, 500, 'mutedForeground', lh=18)

    top = 748
    b.t('Anatomy', 40, top, 400, 20, 600)
    b.box(40, top+44, 540, 250, 'card', 'border', 16, 'Anatomy / canvas')
    dx, dy, dw = b.dock('climb', 40+(540-289)/2, top+128, lights=True, link=False)
    b.objects.pop(); b.svg.pop()
    b.t('Container 60 px · radius 22 · card 94% · 1 px border', 60, top+64, 500, 12, 500, 'mutedForeground')
    b.t('Active tile 48 px · radius 14 · secondary', 60, top+88, 500, 12, 500, 'mutedForeground')
    b.vec('M0 0V48', dx+20, top+80, 1, 48, None, 'input', 1, 'Anatomy / leader')
    b.vec('M0 0V30', dx+136, top+104, 1, 30, None, 'input', 1, 'Anatomy / leader')
    b.t('Icon 24 px · Phosphor Regular, Fill when active', 60, top+214, 500, 12, 500, 'mutedForeground')
    b.t('Gap 4 px · padding 6 px · separator 1 × 24 px before Settings', 60, top+238, 500, 12, 500, 'mutedForeground')
    b.t('Shadow 0 12 28 at 16% foreground · 28 px above the bottom edge', 60, top+262, 500, 12, 500, 'mutedForeground')

    b.t('Motion', 620, top, 400, 20, 600)
    b.box(620, top+44, 540, 250, 'card', 'border', 16, 'Motion / card')
    rows = [('Tile glide', 'Shared-layout spring: stiffness 360, damping 32, mass 0.6. The tile travels, icons stay put.'),
            ('Press', 'Scale 0.94 on press-in, spring back on release. One light haptic on change.'),
            ('Icon swap', 'Regular to Fill cross-fades in 120 ms as the tile arrives.'),
            ('Reduced motion', 'Tile and icons switch instantly. No scale.')]
    yy = top+64
    for title, text in rows:
        b.t(title, 640, yy, 150, 14, 600)
        yy += b.t(text, 800, yy, 340, 12, 500, 'mutedForeground', lh=18)+14

    b.t('Behaviour', 40, top+334, 400, 20, 600)
    rules = [('Where it shows', 'Home, Hang, Climb, Log and Settings only. Pushed screens, sheets, the timer and the keyboard hide it.'),
             ('Scroll', 'Content scrolls underneath and fades into the background over the last 132 px; lists end with 104 px of padding.'),
             ('Re-tap', 'Tapping the active item scrolls its screen to the top.'),
             ('Lights', 'A green dot on Climb means the board lights are connected. It is the only badge the dock carries.'),
             ('Access', 'Every item has a spoken label and a 48 px target. Long-press shows the name.'),
             ('Web', 'Same dock, centred at the bottom of the 768 px column.')]
    for i, (title, text) in enumerate(rules):
        x = 40+(i % 3)*380
        y = top+378+(i//3)*100
        b.t(title, x, y, 340, 14, 600)
        b.t(text, x, y+24, 340, 12, 500, 'mutedForeground', lh=18)


# ------------------------------------------------------------------- setup

def empty():
    b = MB('empty', 'B1 Setup / Climb tab before a board', 0, 1, route='/climb', note='First visit. Nothing is asked for until the climber chooses to set up.')
    b.root('Climb')
    b.wall(110, 112, 170, DEMO, labels=False, quiet=True)
    b.t('Your MoonBoard, offline', 24, 420, 342, 24, 700, 'foreground', 'center')
    b.t('1,960 benchmarks on this phone. Light them up over Bluetooth. No account.', 40, 462, 310, 14, 400, 'mutedForeground', 'center')
    b.btn('Set up your board', 24, 532, target='layout')
    b.btn('Browse benchmarks first', 24, 600, 342, 44, 'ghost', target='list', size=14)
    b.dock('climb')


def setup_layout():
    b = MB('layout', 'B2 Setup / choose the board', 1, 1, route='/climb/setup', note='Benchmark counts are real for the late-2023 list.')
    b.nav('Set up board', close='empty'); y = b.progress(1)
    y += b.t('Which MoonBoard is on your wall?', 24, y, 342, 24, 700)+20
    for name, sub, count, rows, on in [('MoonBoard 2016', '11 × 18 · 40°', '549', 18, False), ('Masters 2017', '11 × 18 · 25° or 40°', '539', 18, False), ('Masters 2019', '11 × 18 · 25° or 40°', '506', 18, True), ('Mini MoonBoard 2020', '11 × 12 · 40°', '366', 12, False)]:
        b.box(24, y, 342, 96, 'card', 'foreground' if on else 'border', 16, 'Board / '+name, sw=2 if on else 1)
        b.box(40, y+16, 44, 64, 'background', 'border', 8, 'Board / mini')
        cell = 36/11
        d = ''.join(f'M{4+(c+.5)*cell-1:.1f} {60-(r+.5)*cell:.1f}a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z' for r in range(rows) for c in range(11))
        b.vec(d, 40, y+16, 44, 64, 'input', name='Board / grid')
        b.t(name, 100, y+16, 220, 16, 600); b.t(sub, 100, y+42, 220, 14, 400, 'mutedForeground'); b.t(count+' benchmarks', 100, y+64, 220, 12, 500, 'mutedForeground')
        if on: b.ic('ok', 326, y+36, 24, 'foreground', 'fill')
        y += 108
    fy = b.footer_bar(); b.btn('Continue', 24, fy+12, target='angle'); b.gesture()


def wall_profile(b, x, y, angle, on):
    b.box(x, y, 165, 232, 'card', 'foreground' if on else 'border', 16, f'Angle / {angle}', sw=2 if on else 1)
    base_x, base_y, length = x+48, y+150, 104
    top_x = base_x+length*math.sin(math.radians(angle)); top_y = base_y-length*math.cos(math.radians(angle))
    b.vec(f'M0 0H125', x+20, base_y+18, 125, 1, None, 'border', 2, 'Angle / floor')
    b.vec(f'M0 18V0', base_x, base_y, 1, 18, None, 'foreground', 3, 'Angle / kicker')
    b.vec(f'M0 {length*math.cos(math.radians(angle)):.1f}L{top_x-base_x:.1f} 0', base_x, top_y, top_x-base_x, base_y-top_y, None, 'foreground', 3, 'Angle / wall')
    b.vec(f'M0 {length*math.cos(math.radians(angle)):.1f}V0', base_x, top_y, 1, base_y-top_y, None, 'border', 1.5, 'Angle / vertical')
    b.t(f'{angle}°', x+16, y+180, 80, 24, 700); b.t(('107' if angle == 25 else '399')+' benchmarks', x+16, y+208, 140, 12, 500, 'mutedForeground', lh=16)
    if on: b.ic('ok', x+129, y+14, 24, 'foreground', 'fill')


def setup_angle():
    b = MB('angle', 'B3 Setup / angle', 2, 1, route='/climb/setup', note='Only asked when the layout exists at two angles.')
    b.nav('Set up board', back='layout'); y = b.progress(2)
    y += b.t('How steep is it?', 24, y, 342, 24, 700)+8
    y += b.t('Masters 2019 is built at two angles. Problems and grades are different on each.', 24, y, 342, 14, 400, 'mutedForeground')+24
    wall_profile(b, 24, y, 25, False); wall_profile(b, 201, y, 40, True)
    b.t('Not sure? Measure from vertical: 40° leans much further over you.', 24, y+256, 342, 12, 500, 'mutedForeground', lh=18)
    fy = b.footer_bar(); b.btn('Continue', 24, fy+12, target='holds'); b.gesture()


SETS = [('Hold set A', 'card', 189, True), ('Hold set B', 'foreground', 277, True), ('Original School Holds', 'chart1', 250, True), ('Wooden holds A', WOOD, 154, False), ('Wooden holds B', WOOD, 270, True), ('Wooden holds C', WOOD, 283, True)]


def hold_rows(b, y):
    b.box(24, y, 342, len(SETS)*60, 'card', 'border', 16, 'Hold sets')
    for i, (name, color, count, on) in enumerate(SETS):
        yy = y+i*60
        if i: b.box(40, yy, 310, 1, 'border', r=0, name='Hold sets / divider')
        b.dot(56, yy+30, 13, color, 'input', 1, name='Hold set / swatch')
        if color == WOOD: b.t(name[-1], 46, yy+21, 20, 12, 600, 'foreground', 'center', lh=18)
        b.t(name, 84, yy+10, 210, 16, 500); b.t(f'{count} benchmarks use it', 84, yy+34, 210, 12, 500, 'mutedForeground', lh=16)
        b.box(326, yy+18, 24, 24, 'primary' if on else 'card', None if on else 'input', 7, 'Checkbox / '+('on' if on else 'off'))
        if on: b.ic('check', 330, yy+22, 16, 'primaryForeground', 'bold')
    return y+len(SETS)*60


def setup_holds():
    b = MB('holds', 'B4 Setup / hold sets', 3, 1, route='/climb/setup', note='Problems that need a missing set are hidden, never greyed out.')
    b.nav('Set up board', back='angle'); y = b.progress(3)
    y += b.t('Which hold sets are on it?', 24, y, 342, 24, 700)+8
    y += b.t('You only see problems you can climb.', 24, y, 342, 14, 400, 'mutedForeground')+20
    y = hold_rows(b, y)
    fy = b.footer_bar(132)
    b.t('245 of 399 benchmarks fit your holds', 24, fy+14, 342, 14, 500, 'foreground', 'center')
    b.btn('Finish setup', 24, fy+44, target='lights'); b.gesture()


def setup_lights():
    b = MB('lights', 'B5 Setup / lights or not', 4, 1, route='/climb/setup', note='Lights are optional. The whole problem library works without them.')
    b.nav(close='list')
    b.wall(110, 96, 170, DEMO, labels=False, lit=True)
    b.t('Got lights on it?', 24, 408, 342, 24, 700, 'foreground', 'center')
    b.t('With the MoonBoard LED kit, the app shows every problem on the wall itself.', 40, 450, 310, 14, 400, 'mutedForeground', 'center')
    b.btn('Connect lights', 24, 536, icon='bluetooth', target='why')
    b.btn('Not now', 24, 604, 342, 44, 'ghost', target='list', size=14)
    b.t('You can connect later from the Climb tab.', 24, 664, 342, 12, 500, 'mutedForeground', 'center')
    b.gesture()


# ----------------------------------------------------------------- connect

def icon_tile(b, icon, y, tint='secondary', color='foreground'):
    b.box(151, y, 88, 88, tint, r=28, name='Illustration / tile'); b.ic(icon, 173, y+22, 44, color)


def connect_why():
    b = MB('why', 'C1 Connect / before the permission', 0, 2, route='/climb/connect', note='The system Bluetooth prompt follows Continue. It is never shown at launch.')
    b.nav('Connect lights', back='lights')
    icon_tile(b, 'bluetooth', 136)
    b.t('Bluetooth, only for lights', 24, 256, 342, 24, 700, 'foreground', 'center')
    b.t('67slopers talks to your board and nothing else. No internet, no location history, nothing leaves this phone.', 32, 330, 326, 14, 400, 'mutedForeground', 'center')
    y = 428
    b.box(24, y, 342, 168, 'card', 'border', 16, 'Checklist')
    for i, text in enumerate(['The LED kit is plugged in', 'You are standing near the board', 'No other phone is connected']):
        b.ic('ok', 40, y+18+i*50, 22, 'foreground'); b.t(text, 74, y+19+i*50, 280, 14, 500)
        if i: b.box(40, y+6+i*50, 310, 1, 'border', r=0, name='Checklist / divider')
    fy = b.footer_bar(); b.btn('Continue', 24, fy+12, target='scan'); b.gesture()


def radar(b, cy, found=False):
    for r, alpha in [(104, .35), (76, .6), (48, 1)]:
        b.dot(195, cy, r, None, 'border', 1.5, name='Radar / ring'); b.objects[-1]['strokes'][0]['strokeOpacity'] = alpha
        b.svg[-1] = b.svg[-1].replace('stroke-width', f'stroke-opacity="{alpha}" stroke-width')
    b.dot(195, cy, 30, 'secondary', name='Radar / centre'); b.ic('bluetooth_on' if found else 'bluetooth', 181, cy-14, 28)
    if found:
        b.dot(262, cy-46, 7, OK, 'background', 3, name='Radar / board'); b.dot(133, cy+58, 5, 'input', 'background', 3, name='Radar / other device')


def connect_scan():
    b = MB('scan', 'C2 Connect / searching', 1, 2, route='/climb/connect', note='Rings pulse outwards every 1.6 s; reduced motion shows a static state with the text.')
    b.nav('Connect lights', back='why')
    radar(b, 250)
    b.t('Looking for your board…', 24, 392, 342, 20, 600, 'foreground', 'center')
    b.t('This usually takes a few seconds.', 24, 424, 342, 14, 400, 'mutedForeground', 'center')
    for i in range(2):
        b.box(24, 484+i*84, 342, 72, 'card', 'border', 16, 'Device / placeholder', opacity=.6)
        b.box(40, 506+i*84, 28, 28, 'muted', r=14, name='Device / skeleton'); b.box(84, 508+i*84, 150-i*40, 10, 'muted', r=5, name='Device / skeleton'); b.box(84, 526+i*84, 90, 8, 'muted', r=4, name='Device / skeleton')
    b.btn('Climb without lights', 24, 760, 342, 44, 'ghost', target='list', size=14); b.gesture()
    b.link(b.objects[0], 'mb-found')


def connect_found():
    b = MB('found', 'C3 Connect / boards found', 2, 2, route='/climb/connect', note='Strongest signal first. A single board connects on its own after 1 s unless the list is touched.')
    b.nav('Connect lights', back='why')
    radar(b, 250, True)
    b.t('Found 2 boards', 24, 392, 342, 20, 600, 'foreground', 'center')
    b.t('Tap the one on your wall.', 24, 424, 342, 14, 400, 'mutedForeground', 'center')
    for i, (name, sub, icon, state) in enumerate([('MoonBoard A', 'Strong signal · closest', 'signal', 'Connecting…'), ('MoonBoard 7F2C', 'Weak signal', 'signal_low', None)]):
        y = 484+i*84
        o = b.box(24, y, 342, 72, 'card', 'foreground' if state else 'border', 16, 'Device / '+name, sw=2 if state else 1)
        b.box(40, y+16, 40, 40, 'secondary' if state else 'muted', r=12, name='Device / tile'); b.ic(icon, 49, y+25, 22)
        b.t(name, 94, y+13, 180, 16, 600); b.t(sub, 94, y+39, 200, 12, 500, 'mutedForeground', lh=16)
        if state: b.ic('spinner', 326, y+24, 24, 'foreground', 'bold')
        else: b.ic('chevron-right', 330, y+27, 18, 'mutedForeground')
        if state: b.link(o, 'mb-test')
    b.tl('Not listed? See what to check', 24, 664, 342, 14, 500, 'foreground', 'center', 'none')
    b.btn('Climb without lights', 24, 760, 342, 44, 'ghost', target='list', size=14); b.gesture()


def connect_test():
    b = MB('test', 'C4 Connect / check the lights', 3, 2, route='/climb/connect', note='One glance proves orientation and wiring before the first problem.')
    b.nav('Check the lights', back='found')
    b.wall(100, 100, 190, CORNERS, labels=False, lit=True)
    b.t('Four corners lit?', 24, 436, 342, 24, 700, 'foreground', 'center')
    b.t('Your wall should match this picture: A1, K1, A18 and K18 in blue.', 40, 478, 310, 14, 400, 'mutedForeground', 'center')
    fy = b.footer_bar(172)
    b.btn('Yes, it matches', 24, fy+12, target='done')
    b.btn('No, something is off', 24, fy+80, 342, 56, 'outline', target='fix'); b.gesture()


def connect_fix():
    b = MB('fix', 'C5 Connect / lights look wrong', 4, 2, route='/climb/connect', note='Each answer applies a fix and re-runs the corner test.')
    b.nav('Fix the lights', back='test')
    y = 112
    y += b.t('What do you see on the wall?', 24, y, 342, 24, 700)+20
    options = [('flip', 'Left and right swapped', 'We mirror the lights for you.', True), ('sort', 'Top and bottom swapped', 'We reverse the strip direction.', False), ('board', 'Wrong holds light up', 'Check the layout is Masters 2019.', False), ('power', 'Nothing lights up', 'Check the power, then test again.', False)]
    for icon, title, text, on in options:
        b.box(24, y, 342, 84, 'card', 'foreground' if on else 'border', 16, 'Option / '+title, sw=2 if on else 1)
        b.box(40, y+22, 40, 40, 'secondary' if on else 'muted', r=12, name='Option / tile'); b.ic(icon, 49, y+31, 22)
        b.t(title, 94, y+18, 240, 16, 600); b.t(text, 94, y+46, 250, 12, 500, 'mutedForeground', lh=16)
        y += 96
    fy = b.footer_bar(); b.btn('Fix and test again', 24, fy+12, target='test'); b.gesture()


LIGHT_OPTIONS = [dict(title='Light above holds too', sub='LED kit V2 and newer', toggle=True),
                 dict(title='Light as I browse', sub='Off: the wall waits for Light up', toggle=False),
                 dict(title='Connect automatically', sub='When Climb opens near the board', toggle=True)]


def connect_done():
    b = MB('done', 'C6 Connect / connected', 5, 2, route='/climb/connect', note='The box has no brightness control. The only light option is the above-hold flag (V2 kits and newer).')
    b.nav(close='list')
    icon_tile(b, 'ok', 136, 'secondary')
    b.t('Lights connected', 24, 256, 342, 24, 700, 'foreground', 'center')
    b.t('MoonBoard A reconnects on its own whenever you open Climb near the board.', 40, 298, 310, 14, 400, 'mutedForeground', 'center')
    b.group(400, LIGHT_OPTIONS[:2], h=68)
    fy = b.footer_bar(); b.btn('Start climbing', 24, fy+12, target='list'); b.gesture()


def connect_problem(key, name, col, icon, title, text, primary, note, tips=None):
    b = MB(key, name, col, 2, route='/climb/connect', note=note)
    b.nav('Connect lights', back='lights')
    icon_tile(b, icon, 136, 'muted')
    b.t(title, 24, 256, 342, 24, 700, 'foreground', 'center')
    h = b.t(text, 40, 298, 310, 14, 400, 'mutedForeground', 'center')
    if tips:
        y = 320+h
        b.box(24, y, 342, len(tips)*52+12, 'card', 'border', 16, 'Tips')
        for i, tip in enumerate(tips):
            b.box(40, y+18+i*52, 26, 26, 'secondary', r=13, name='Tip / number'); b.t(str(i+1), 40, y+21+i*52, 26, 14, 600, 'foreground', 'center')
            b.t(tip, 80, y+11+i*52, 270, 14, 400, lh=20)
    fy = b.footer_bar(160)
    b.btn(primary, 24, fy+12, target='scan'); b.btn('Climb without lights', 24, fy+80, 342, 44, 'ghost', target='list', size=14); b.gesture()


def connection_sheet():
    b = MB('lights-sheet', 'C10 Connect / lights sheet', 9, 2, route='/climb', note='Opened from the lights chip on the Climb tab.')
    problem_list(b, dock=False)
    y = b.sheet(318, 'Board lights')
    b.box(24, y, 342, 72, 'card', 'border', 16, 'Device')
    b.box(40, y+16, 40, 40, 'secondary', r=12, name='Device / tile'); b.ic('bluetooth_on', 49, y+25, 22)
    b.t('MoonBoard A', 94, y+13, 180, 16, 600); b.dot(99, y+49, 4, OK, name='Device / status'); b.t('Connected · strong signal', 110, y+41, 220, 12, 500, 'mutedForeground', lh=16)
    y += 96
    y = b.group(y, LIGHT_OPTIONS, h=64)+20
    b.btn('Test lights', 24, y, 165, 48, 'outline', target='test', size=14); b.btn('Disconnect', 201, y, 165, 48, 'outline', size=14); y += 64
    b.t('Forget this board', 24, y, 342, 14, 500, 'destructive', 'center')
    b.gesture()


# ---------------------------------------------------------------- problems

LIST = [('THE WARM UP PROBLEM', 'Sent · flash', True), ('DA REAL 6A+', 'Sent · 2 tries', True), ('VV VICTORIA', None, False), ('BLACK MUFFLER', 'Project · 3 tries', False), ('SAWDUST LAKSA', None, False), ('FLOWERS FOR DAYZ', None, False), ('WORTH THE WRIST', 'Project · 5 tries', False)]


def problem_row(b, y, prob, state=None, sent=False, target='detail'):
    b.thumb(24, y, prob)
    title = b.tl(short(NAMES[prob['name']], 21), 82, y+4, 214, 16, 600, target=target)
    b.t(f'{prob["setter"]} · {sends(prob["sends"])} sends', 82, y+30, 220, 12, 500, 'mutedForeground', lh=16)
    if state:
        if sent: b.ic('ok', 82, y+50, 14, OK, 'fill')
        else: b.dot(89, y+57, 4, None, 'chart3', 2, name='Row / project')
        b.t(state, 102, y+49, 200, 12, 500, 'foreground' if sent else 'chart3', lh=16)
    else:
        b.ic('star', 82, y+50, 14, 'chart3', 'fill'); b.t(f'{prob["stars"]}', 100, y+49, 60, 12, 500, 'mutedForeground', lh=16)
    b.grade(prob['grade'], 296, y+6)
    b.box(82, y+78, 284, 1, 'border', r=0, name='Row / divider')
    return y+88


def climb_header(b, lights='on', view='Problems'):
    b.status()
    b.tl('Masters 2019 · 40°', 24, 54, 230, 18, 600, target='boards'); b.ic('caret', 24+tw('Masters 2019 · 40°', 18)+6, 57.5, 16)
    if lights == 'on': b.chip('Lit', 304, 50, dot=OK, target='lights-sheet')
    elif lights == 'off': b.chip('Connect', 256, 50, icon='bluetooth', target='why')
    b.segmented(['Problems', 'Circuits'], view, 96, h=40)
    b.link(b.objects[-1], 'mb-circuits' if view == 'Problems' else 'mb-list')
    return 152


def list_header(b, lights='on', filters=2, query=None, tab='All'):
    y = climb_header(b, lights)
    b.box(24, y, 286, 48, 'card', 'border', 12, 'Search field'); b.ic('search', 38, y+14, 20, 'mutedForeground')
    b.t(query or 'Search name or setter', 66, y+12, 230, 16, 400, 'foreground' if query else 'mutedForeground')
    o = b.box(318, y, 48, 48, 'card', 'border', 12, 'Filter button'); b.ic('settings-2', 331, y+13, 22); b.link(o, 'mb-filters')
    if filters: b.dot(358, y+6, 9, 'primary', 'background', 2, name='Filter / count'); b.t(str(filters), 349, y-2, 18, 11, 700, 'primaryForeground', 'center', lh=16)
    x = 24
    for label in ['All', 'Projects', 'Sent', 'Mine']:
        x += b.chip(label, x, y+60, label == tab, target='mine' if label == 'Mine' else None)+8
    return y+106


def problem_list(b, dock=True):
    y = list_header(b)
    b.t('6A+ to 7A · most climbed', 24, y, 240, 12, 500, 'mutedForeground', lh=16); b.t('151 problems', 246, y, 120, 12, 500, 'mutedForeground', 'right', lh=16)
    y += 30
    for name, state, sent in LIST[:6]:  # a seventh row would sit under the gesture bar
        y = problem_row(b, y, P[name], state, sent)
    if dock: b.dock('climb', lights=True)


def climb_list():
    b = MB('list', 'D1 Climb / problem list', 0, 3, route='/climb', note='The Climb tab. Board switcher top left, lights chip top right, the wall thumbnail on every row.')
    problem_list(b)


def filters_sheet():
    b = MB('filters', 'D2 Climb / filters', 1, 3, route='/climb', note='The histogram is the real grade spread; the button always states the result count.')
    problem_list(b, dock=False)
    y = b.sheet(204, 'Filters', 'Reset')
    b.t('Grade', 24, y, 100, 16, 500); b.t('6A+ to 7A', 216, y, 150, 16, 600, 'foreground', 'right'); y += 40
    bw = 342/len(HISTOGRAM)
    for i, n in enumerate(HISTOGRAM):
        hh = max(3, n/max(HISTOGRAM)*64)
        b.box(24+i*bw+2, y+64-hh, bw-4, hh, 'chart1' if i <= 5 else 'border', r=4, name=f'Histogram / {GRADES[i+2]}')
    y += 76
    b.box(24, y+6, 342, 4, 'border', r=2, name='Range / track'); b.box(24+bw*.5, y+6, bw*5, 4, 'foreground', r=2, name='Range / value')
    b.dot(24+bw*.5, y+8, 12, 'card', 'foreground', 2, name='Range / low'); b.dot(24+bw*5.5, y+8, 12, 'card', 'foreground', 2, name='Range / high')
    for i in (0, 5, 13): b.t(GRADES[i+2], 24+i*bw-12, y+28, bw+24, 12, 500, 'foreground' if i <= 5 else 'mutedForeground', 'center', lh=16)
    y += 68
    b.t('Sort by', 24, y, 200, 16, 500); y += 36
    x = 24
    for label in ['Most climbed', 'Top rated', 'Newest']: x += b.chip(label, x, y, label == 'Most climbed', size=13)+8
    y += 44; x = 24
    for label in ['Easiest first', 'Hardest first']: x += b.chip(label, x, y, False, size=13)+8
    y += 48
    b.row(y, 'Hide what I have sent', toggle=False, x=8, w=374, h=48); y += 48
    b.row(y, 'Only my hold sets', toggle=True, x=8, w=374, h=48, sub='5 of 6 sets'); y += 48
    fy = b.footer_bar(); b.btn('Show 151 problems', 24, fy+12, target='list'); b.gesture()


def no_results():
    b = MB('no-results', 'D3 Climb / nothing matches', 2, 3, route='/climb', note='An empty result explains why and offers the shortest way out.')
    y = list_header(b, filters=3)
    b.t('8A+ to 8B · only my hold sets', 24, y, 300, 12, 500, 'mutedForeground', lh=16)
    icon_tile(b, 'search', 324, 'muted')
    b.t('Nothing here with your holds', 24, 436, 342, 20, 600, 'foreground', 'center')
    b.t('The 3 problems from 8A+ up all need Wooden holds A.', 40, 474, 310, 14, 400, 'mutedForeground', 'center')
    b.btn('Clear filters', 99, 544, 192, 44, 'outline', target='list', size=14)
    b.tl('Add a hold set', 24, 606, 342, 14, 500, 'foreground', 'center', 'boards')
    b.dock('climb', lights=True)


def detail_body(b, prob=DEMO, lit=False, y=104, pager='12 of 151'):
    b.t(NAMES[prob['name']], 24, y, 250, 20, 700); b.grade(prob['grade'], 296, y-4, size=24)
    b.ic('seal', 24, y+32, 16, 'chart3', 'fill'); b.t(f'Benchmark · set by {prob["setter"]}', 46, y+32, 250, 12, 500, 'mutedForeground', lh=16)
    wall_y = y+66
    h = b.wall(28, wall_y, 334, prob, lit=lit)
    b.legend(wall_y+h+12)
    return wall_y+h+52


def detail_nav(b, lit=False, back='list', saved=False):
    b.nav(back=back, right=[('list_plus', 'add-circuit'), ('heart', None, 'fill' if saved else 'regular', 'destructive' if saved else 'foreground')])
    b.t('Lit on the wall' if lit else '12 of 151', 70, 54, W-140, 18, 600, 'foreground', 'center')


def stats_row(b, y, prob=DEMO):
    for i, (value, label) in enumerate([(sends(prob['sends']), 'sends'), (str(prob['stars']), 'stars'), (str(prob['tries']), 'avg tries')]):
        x = 24+i*117
        b.box(x, y, 108, 56, 'card', 'border', 12, 'Stat / '+label); b.t(value, x, y+7, 108, 16, 600, 'foreground', 'center'); b.t(label, x, y+31, 108, 12, 500, 'mutedForeground', 'center', lh=16)


def detail():
    b = MB('detail', 'D4 Climb / problem', 3, 3, route='/climb/[id]', note='Swipe left or right for the next problem in the list. Without lights, Light up opens the connect flow.')
    detail_nav(b)
    y = detail_body(b)
    # Statistics live below the first viewport; the pinned actions remain visible.
    fy = b.footer_bar()
    b.btn('Log send', 24, fy+12, 124, 56, 'outline', target='log-send'); b.btn('Light up', 160, fy+12, 206, 56, icon='bulb', target='lit', size=18); b.gesture()



def detail_scrolled():
    b = MB('detail-scrolled', 'D4b Climb / problem after scrolling', 8, 3,
           route='/climb/problem/[id]', note='Same problem after a vertical scroll: stats and local log move into view under the pinned actions.')
    detail_nav(b)
    b.legend(108)
    stats_row(b, 156)
    b.t('Your log', 24, 286, 250, 20, 600)
    b.ic('ok', 24, 336, 20, OK, 'fill')
    b.t('Sent on try 3 · felt fair', 56, 336, 226, 14, 500)
    b.t('Today', 288, 336, 78, 12, 500, 'mutedForeground', 'right')
    b.box(24, 382, 342, 1, 'border', r=0, name='Log / divider')
    fy = b.footer_bar()
    b.btn('Log send', 24, fy+12, 124, 56, 'outline', target='log-send')
    b.btn('Light up', 160, fy+12, 206, 56, icon='bulb', target='lit', size=18)
    b.gesture()

def lit_footer(b, tries=3):
    fy = b.footer_bar(176)
    b.box(24, fy+12, 342, 56, 'card', 'border', 12, 'Tries')
    b.t('Tries', 40, fy+28, 100, 16, 500)
    b.box(226, fy+20, 40, 40, 'muted', r=12, name='Tries / minus'); b.ic('minus', 236, fy+30, 20)
    b.t(str(tries), 266, fy+24, 44, 24, 700, 'foreground', 'center')
    b.box(310, fy+20, 40, 40, 'muted', r=12, name='Tries / plus'); b.ic('plus', 320, fy+30, 20)
    b.btn('Lights off', 24, fy+80, 124, 56, 'outline', target='detail'); b.btn('Sent it', 160, fy+80, 206, 56, icon='check', target='log-send', size=18); b.gesture()


def lit():
    b = MB('lit', 'D5 Climb / lit on the wall', 4, 3, route='/climb/[id]', note='Screen stays awake while lit. Swiping relights the wall only when Light as I browse is on, so browsing never changes what someone is climbing.')
    detail_nav(b, True)
    detail_body(b, lit=True)
    lit_footer(b)


def lost():
    b = MB('lost', 'D6 Climb / lights dropped', 5, 3, route='/climb/[id]', note='Losing the lights never blocks logging. The app retries quietly for 30 s.')
    detail_nav(b)
    b.box(24, 96, 342, 52, 'accent', 'border', 14, 'Banner / lights lost')
    b.ic('bluetooth_off', 38, 110, 22); b.t('Lights dropped. Reconnecting', 68, 112, 286, 14, 500)
    detail_body(b, y=168)
    lit_footer(b)


def log_send():
    b = MB('log-send', 'D7 Climb / log a send', 6, 3, route='/climb/[id]', note='Three taps at most. Tries are prefilled from the counter; everything else is optional.')
    detail_nav(b, True); detail_body(b, lit=True); lit_footer(b)
    y = b.sheet(318, 'Sent! How did it go?')
    b.t('Tries', 24, y, 200, 14, 500, 'mutedForeground'); y += 28
    y = b.segmented(['Flash', '2', '3', '4+'], '3', y)+24
    b.t('The grade felt', 24, y, 200, 14, 500, 'mutedForeground'); y += 28
    y = b.segmented(['Soft', 'Fair', 'Stiff'], 'Fair', y)+24
    b.t('Your rating', 24, y, 200, 14, 500, 'mutedForeground'); y += 28
    b.stars(24, y, 4, 32, 10); y += 56
    b.box(24, y, 342, 48, 'background', 'input', 10, 'Input / note'); b.t('Add a note', 36, y+12, 300, 16, 400, 'mutedForeground')
    fy = b.footer_bar(); b.btn('Save send', 24, fy+12, target='sent'); b.gesture()


def sent():
    b = MB('sent', 'D8 Climb / sent', 7, 3, h=960, route='/climb/[id]', note='Your own history on the problem, then straight on to the next one.')
    detail_nav(b, True, saved=True)
    y = detail_body(b, lit=True)
    b.box(24, y, 342, 48, 'secondary', r=14, name='Sent banner'); b.ic('ok', 38, y+13, 22, 'foreground', 'fill'); b.t('Sent today · 3 tries', 68, y+12, 220, 16, 600); b.stars(282, y+16, 4, 14, 2)
    y += 72
    b.t('Your log', 24, y, 250, 20, 600); y += 40
    for when, text, ok in [('Today', 'Sent on try 3 · felt fair', True), ('2 Oct', '4 tries · no send', False), ('28 Sep', '2 tries · no send', False)]:
        if ok: b.ic('ok', 24, y, 20, OK, 'fill')
        else: b.dot(34, y+10, 6, None, 'input', 2, name='Log / attempt')
        b.t(text, 56, y, 220, 14, 500); b.t(when, 286, y, 80, 12, 500, 'mutedForeground', 'right', lh=20)
        b.box(56, y+34, 310, 1, 'border', r=0, name='Log / divider'); y += 48
    fy = b.footer_bar()
    b.btn('Lights off', 24, fy+12, 124, 56, 'outline', target='list'); b.btn('Next problem', 160, fy+12, 206, 56, icon='arrow', target='lit', size=16); b.gesture()


# ------------------------------------------------------- create and review

def create():
    b = MB('create', 'E1 Create / set a problem', 0, 4, route='/climb/new', note='Pick a role, tap holds. With lights on, the wall mirrors every tap. Capped at 30 holds: the box cuts off longer messages.')
    b.nav('New problem', close='mine')
    b.t('Next', W-84, 56, 60, 16, 600, 'border', 'right')
    b.chip('Mirroring on the wall', 104, 84, dot=OK, size=12, h=26)
    h = b.wall(64, 118, 262, DRAFT, lit=True)
    y = 118+h+12
    b.t('2 start · 4 holds · add a finish hold', 24, y, 342, 12, 500, 'chart3', 'center', lh=16)
    fy = b.footer_bar(152)
    b.segmented(['Start', 'Hold', 'Finish'], 'Finish', fy+16, 24, 342, 52, [HOLD['start'], HOLD['hold'], HOLD['finish']])
    b.box(24, fy+84, 52, 44, 'card', 'border', 12, 'Undo'); b.ic('undo', 39, fy+95, 22)
    b.box(84, fy+84, 52, 44, 'card', 'border', 12, 'Clear'); b.ic('trash', 99, fy+95, 22)
    b.t('Tap a lit hold again to remove it.', 150, fy+88, 216, 12, 500, 'mutedForeground', lh=18)
    b.gesture()


def save_problem():
    b = MB('save', 'E2 Create / name and grade', 1, 4, route='/climb/new', note='Only a name is required. Grade can stay open as a project.')
    b.nav('Save problem', back='create')
    full = dict(DRAFT, finish=['F18'])
    b.thumb(24, 112, full, 76)
    b.t('7 holds', 120, 118, 200, 16, 600); b.t('2 start · 4 holds · 1 finish', 120, 144, 240, 14, 400, 'mutedForeground')
    b.t('Masters 2019 · 40°', 120, 168, 240, 14, 400, 'mutedForeground')
    y = b.input('Name', 'Slopers anonymous', 248)+24
    b.t('Grade', 24, y, 200, 14, 500); y += 28
    x = 24
    for g in ['Open', '6A+', '6B', '6B+', '6C', '6C+', '7A']: x += b.chip(g, x, y, g == '6C', h=40)+8
    y += 64
    b.t('Feet', 24, y, 200, 14, 500); y += 28
    y = b.segmented(['Any holds', 'Follow hands', 'Footless'], 'Follow hands', y)+24
    b.box(24, y, 342, 72, 'background', 'input', 10, 'Input / note'); b.t('Notes for whoever climbs it next', 36, y+12, 310, 14, 400, 'mutedForeground')
    fy = b.footer_bar(); b.btn('Save problem', 24, fy+12, target='mine'); b.gesture()


def mine():
    b = MB('mine', 'E3 Create / my problems', 2, 4, route='/climb', note='Own problems live beside the benchmarks and share as a QR code, like workouts.')
    y = list_header(b, tab='Mine', filters=0)
    b.t('Set on this board', 24, y, 240, 12, 500, 'mutedForeground', lh=16); b.t('2 problems', 246, y, 120, 12, 500, 'mutedForeground', 'right', lh=16); y += 30
    for name, grade, text in [('Slopers anonymous', 5, 'Set today · not sent yet'), ('Tuesday warm-up', 2, 'Set 2 Oct · sent 6 times')]:
        prob = dict(DRAFT, finish=['F18']) if grade == 5 else P['THE WARM UP PROBLEM']
        b.thumb(24, y, prob); b.tl(name, 82, y+4, 214, 16, 600, target='share'); b.t(text, 82, y+30, 220, 12, 500, 'mutedForeground', lh=16)
        b.ic('qr-code', 82, y+50, 14, 'mutedForeground'); b.t('Share', 102, y+49, 100, 12, 500, 'mutedForeground', lh=16)
        b.grade(grade, 296, y+6); b.box(82, y+78, 284, 1, 'border', r=0, name='Row / divider'); y += 88
    o = b.box(24, y+8, 342, 72, None, 'input', 16, 'Add problem'); b.objects[-1]['strokes'][0]['strokeStyle'] = 'dashed'
    b.svg[-1] = b.svg[-1].replace('stroke-width', 'stroke-dasharray="6 6" stroke-width')
    b.ic('plus', 138, y+33, 22); b.t('Set a problem', 168, y+32, 160, 16, 600); b.link(o, 'mb-create')
    b.tl('Or scan one from a friend', 24, y+100, 342, 14, 500, 'foreground', 'center')
    b.dock('climb', lights=True)


def share():
    b = MB('share', 'E4 Create / share as QR', 3, 4, route='/climb/[id]/share', note='Same offline QR pattern as workouts: no text to copy, no link, no server.')
    b.nav('Share problem', close='mine')
    b.t('Slopers anonymous', 24, 128, 342, 24, 700, 'foreground', 'center')
    b.t('6C · Masters 2019 · 40°', 24, 164, 342, 14, 400, 'mutedForeground', 'center')
    b.qr(44, 216, 302)
    b.t('Scan with 67slopers on another phone. It works without internet on both.', 40, 548, 310, 14, 400, 'mutedForeground', 'center')
    b.gesture()


def session():
    b = MB('session', 'E5 Log / board session', 4, 4, h=1136, route='/session/[id]', note='A board session opens at the first lit or logged problem and closes after 30 quiet minutes.')
    b.nav('Session', back='log', right=[('ellipsis-vertical', None)])
    y = 112
    y += b.t('MoonBoard session', 24, y, 342, 30, 700)+8
    y += b.t('Today · 18:05 to 18:53 · Masters 2019', 24, y, 342, 14, 400, 'mutedForeground')+24
    b.box(24, y, 342, 164, 'card', 'border', 12, 'Metrics')
    for i, (k, v) in enumerate([('Time', '48 min'), ('Sends', '4 of 6'), ('Hardest send', '7A'), ('Tries', '17')]):
        x = 40+(i % 2)*171; yy = y+16+(i//2)*82; b.t(k, x, yy, 154, 14, 500, 'mutedForeground'); b.t(v, x, yy+25, 150, 24, 600)
    y += 192
    b.t('Problems', 24, y, 250, 20, 600); y += 40
    for name, state, ok in [('THE WARM UP PROBLEM', 'Sent · flash', True), ('DA REAL 6A+', 'Sent · flash', True), ('VV VICTORIA', 'Sent · 2 tries', True), ('FLOWERS FOR DAYZ', 'Sent · 3 tries', True), ('WORTH THE WRIST', 'Not sent · 5 tries', False), ('LICHTBLICK', 'Not sent · 5 tries', False)]:
        y = problem_row(b, y, P[name], state, ok)
    fy = b.footer_bar(); b.btn('Climb these again', 24, fy+12, icon='repeat', target='list'); b.gesture()


def boards():
    b = MB('boards', 'E6 Settings / your MoonBoard', 5, 4, route='/settings/moonboard', note='Changing the setup never deletes the log; sends stay tied to the layout they were climbed on.')
    b.nav('MoonBoard', back='settings')
    y = 112
    b.box(24, y, 342, 112, 'secondary', r=16, name='Board summary')
    b.thumb(40, y+16, DEMO, 52)
    b.t('Masters 2019', 108, y+18, 230, 20, 700); b.t('40° · 5 hold sets', 108, y+50, 230, 14, 400, 'mutedForeground'); b.t('245 benchmarks · 2 of your own', 108, y+72, 240, 12, 500, 'mutedForeground')
    y += 140
    y = b.group(y, [dict(title='Layout', value='Masters 2019'), dict(title='Angle', value='40°'), dict(title='Hold sets', value='5 of 6'), dict(title='Lights', value='MoonBoard A', dot=OK)])
    y += 24
    b.btn('Add another board', 24, y, 342, 48, 'outline', icon='plus', target='layout', size=14); y += 72
    b.t('Remove this board', 24, y, 342, 14, 500, 'destructive', 'center'); y += 28
    b.t('Your sends stay in the log.', 24, y, 342, 12, 500, 'mutedForeground', 'center')
    b.gesture()


# ---------------------------------------------------------------- circuits

PYRAMID = ['THE WARM UP PROBLEM', 'VV VICTORIA', 'SAWDUST LAKSA', 'FLOWERS FOR DAYZ', 'BLACK MUFFLER', 'DA REAL 6A+']
CIRCUITS = [('7A pyramid', PYRAMID, '6A+ to 7A', 'Last done 2 Oct · 5 of 6 sent'),
            ('Tuesday warm-up', PYRAMID[:2]+['DA REAL 6A+', 'BLACK MUFFLER'], '6A+ to 6C', 'Done 9 times'),
            ('Projects to finish', ['WORTH THE WRIST', 'LICHTBLICK', 'THE KRAMER'], '7A to 7B', 'Not done yet')]


def circuits():
    b = MB('circuits', 'F1 Circuits / your circuits', 0, 5, route='/climb', note='A circuit is a playlist: problems climbed in a fixed order. Start is one tap.')
    y = climb_header(b, view='Circuits')
    for name, problems, meta, last in CIRCUITS:
        o = b.box(24, y, 342, 148, 'card', 'border', 16, 'Circuit / '+name); b.link(o, 'mb-circuit')
        b.t(name, 40, y+16, 240, 18, 600); b.t(f'{len(problems)} problems · {meta}', 40, y+44, 300, 12, 500, 'mutedForeground', lh=16)
        for i, key in enumerate(problems): b.thumb(40+i*38, y+70, P[key], 30)
        b.t(last, 40, y+122, 240, 12, 500, 'mutedForeground', lh=16)
        b.box(302, y+58, 48, 48, 'primary', r=24, name='Circuit / start'); b.ic('play', 315, y+71, 22, 'primaryForeground', 'fill', target='run')
        y += 160
    o = b.box(24, y, 342, 64, None, 'input', 16, 'New circuit'); b.objects[-1]['strokes'][0]['strokeStyle'] = 'dashed'
    b.svg[-1] = b.svg[-1].replace('stroke-width', 'stroke-dasharray="6 6" stroke-width')
    b.ic('plus', 139, y+21, 22); b.t('New circuit', 169, y+20, 160, 16, 600); b.link(o, 'mb-circuit-edit')
    b.dock('climb', lights=True)


def circuit_row(b, y, i, key, right=None, state=None, handle=False, remove=False, lifted=False):
    prob = P[key]
    if lifted: b.box(12, y-6, 366, 68, 'card', 'border', 14, 'Row / lifted', shadow=(8, 20, .16))
    x = 24
    if remove: b.ic('remove', x, y+17, 22, 'destructive'); x += 34
    else: b.t(str(i+1), x, y+18, 20, 14, 600, 'mutedForeground'); x += 28
    b.thumb(x, y+6, prob, 30)
    b.tl(short(NAMES[key], 19), x+44, y+8, 200, 16, 600, target=None if remove else 'detail')
    b.t(state or f'{prob["setter"]} · {sends(prob["sends"])} sends', x+44, y+34, 210, 12, 500, 'mutedForeground', lh=16)
    if handle: b.ic('grip-vertical', 342, y+16, 24, 'mutedForeground')
    else: b.t(right or GRADES[prob['grade']], 266, y+16, 100, 16 if right is None else 14, 700 if right is None else 500, 'foreground', 'right', lh=24)
    if not lifted: b.box(24, y+60, 342, 1, 'border', r=0, name='Row / divider')
    return y+68


def circuit():
    b = MB('circuit', 'F2 Circuits / one circuit', 1, 5, h=900, route='/climb/circuit/[id]', note='Order matters, so rows are numbered.')
    b.nav('Circuit', back='circuits', right=[('pencil', 'circuit-edit')])
    y = 112
    y += b.t('7A pyramid', 24, y, 342, 30, 700)+8
    y += b.t('6 problems · 6A+ to 7A', 24, y, 342, 14, 400, 'mutedForeground')+4
    y += b.t('Last done 2 Oct · 5 of 6 sent', 24, y, 342, 14, 400, 'mutedForeground')+28
    b.t('In order', 24, y, 250, 20, 600); y += 40
    for i, key in enumerate(PYRAMID): y = circuit_row(b, y, i, key)
    fy = b.footer_bar(); b.btn('Start circuit', 24, fy+12, icon='play', target='run', size=18); b.gesture()


def add_to_circuit():
    b = MB('add-circuit', 'F3 Circuits / add a problem', 2, 5, route='/climb/[id]', note='From the list icon on any problem. A problem can sit in several circuits.')
    detail_nav(b); y = detail_body(b); stats_row(b, y)
    y = b.sheet(396, 'Add to circuit')
    for name, problems, meta, last in CIRCUITS:
        on = name == '7A pyramid'
        b.t(name, 24, y+4, 250, 16, 500); b.t(f'{len(problems)} problems', 24, y+30, 250, 12, 500, 'mutedForeground', lh=16)
        b.box(342, y+14, 24, 24, 'primary' if on else 'card', None if on else 'input', 7, 'Checkbox / '+('on' if on else 'off'))
        if on: b.ic('check', 346, y+18, 16, 'primaryForeground', 'bold')
        b.box(24, y+58, 342, 1, 'border', r=0, name='Sheet / divider'); y += 68
    b.ic('plus', 24, y+5, 22); b.tl('New circuit', 56, y+4, 200, 16, 600, target='circuit-edit')
    fy = b.footer_bar(); b.btn('Done', 24, fy+12, target='detail'); b.gesture()


def circuit_edit():
    b = MB('circuit-edit', 'F4 Circuits / edit and reorder', 3, 5, h=960, route='/climb/circuit/[id]/edit', note='Same drag-to-reorder as the workout builder. Removing a problem only takes it out of this circuit.')
    b.nav('Edit circuit', close='circuit')
    b.tl('Save', W-84, 54, 60, 16, 600, 'foreground', 'right', 'circuit')
    y = b.input('Name', '7A pyramid', 112)+28
    b.t('Problems', 24, y, 250, 20, 600); b.t('Drag to reorder', 216, y+4, 150, 12, 500, 'mutedForeground', 'right', lh=20); y += 40
    for i, key in enumerate(PYRAMID): y = circuit_row(b, y, i, key, handle=True, remove=True, lifted=i == 2)
    y += 12
    b.btn('Add problems', 24, y, 342, 48, 'outline', icon='plus', target='list', size=14); y += 76
    b.t('Delete circuit', 24, y, 342, 14, 500, 'destructive', 'center')
    b.gesture()


def circuit_progress(b, done, current, total=6, y=104):
    seg = (342-(total-1)*6)/total
    for i in range(total):
        b.box(24+i*(seg+6), y, seg, 4, 'foreground' if i < done else 'chart1' if i == current else 'border', r=2, name=f'Circuit progress / {i+1}')


def circuit_run():
    b = MB('run', 'F5 Circuits / climbing a circuit', 4, 5, route='/climb/circuit/[id]/run', note='Sent it or Skip moves straight to the next problem and lights it: starting a circuit is the consent to change the wall. No timer, no rests.')
    b.nav('7A pyramid', close='circuit', sub='Problem 3 of 6')
    circuit_progress(b, 2, 2)
    prob = P['SAWDUST LAKSA']
    h = b.wall(64, 120, 262, prob, lit=True)
    y = 120+h+10
    b.t(NAMES[prob['name']], 24, y, 250, 20, 700); b.grade(prob['grade'], 296, y-4, size=24)
    b.t('Next: Flowers for Dayz · 7A', 24, y+30, 260, 12, 500, 'mutedForeground', lh=16)
    fy = b.footer_bar(176)
    b.box(24, fy+12, 342, 56, 'card', 'border', 12, 'Tries')
    b.t('Tries', 40, fy+28, 100, 16, 500)
    b.box(226, fy+20, 40, 40, 'muted', r=12, name='Tries / minus'); b.ic('minus', 236, fy+30, 20)
    b.t('1', 266, fy+25, 44, 24, 700, 'foreground', 'center')
    b.box(310, fy+20, 40, 40, 'muted', r=12, name='Tries / plus'); b.ic('plus', 320, fy+30, 20)
    b.btn('Skip', 24, fy+80, 124, 56, 'outline', target='circuit-done'); b.btn('Sent it', 160, fy+80, 206, 56, icon='check', target='circuit-done', size=18); b.gesture()


def circuit_done():
    b = MB('circuit-done', 'F6 Circuits / done', 5, 5, h=1010, route='/climb/circuit/[id]/run', note='Saved as a board session the moment the last problem ends, like a workout.')
    b.nav(close='circuits')
    icon_tile(b, 'ok', 104, 'secondary')
    b.t('Circuit done', 24, 216, 342, 24, 700, 'foreground', 'center')
    b.t('7A pyramid · saved to your log', 24, 252, 342, 14, 400, 'mutedForeground', 'center')
    y = 300
    for i, (value, label) in enumerate([('5 of 6', 'sent'), ('41 min', 'total'), ('9', 'tries'), ('7A', 'hardest')]):
        x = 24+i*87
        b.box(x, y, 81, 56, 'card', 'border', 12, 'Stat / '+label); b.t(value, x, y+6, 81, 16, 600, 'foreground', 'center'); b.t(label, x, y+31, 81, 12, 500, 'mutedForeground', 'center', lh=16)
    y += 88
    for i, (key, result) in enumerate(zip(PYRAMID, ['Flash', 'Flash', '2 tries', '3 tries', 'Not sent', 'Flash'])):
        y = circuit_row(b, y, i, key, right=result, state=GRADES[P[key]['grade']]+' · '+P[key]['setter'])
    fy = b.footer_bar()
    b.btn('Again', 24, fy+12, 124, 56, 'outline', target='run'); b.btn('Done', 160, fy+12, 206, 56, target='circuits'); b.gesture()


# -------------------------------------------------------------- flow map

def flow_map():
    b = MB('map', 'A0 MoonBoard / flow map and decisions', w=1880, h=1540, x=0, y=0, note='Start here.')
    b.t('67SLOPERS / MOONBOARD EXPLORATION', 48, 36, 1700, 12, 500, 'mutedForeground')
    b.t('Climb: MoonBoard support', 48, 80, 1700, 36, 800)
    b.t('Pick a problem, see it lit on the wall, log the send. Everything on the phone, lights over Bluetooth, no account.', 48, 136, 1300, 16, 400, 'mutedForeground', lh=24)
    lanes = [('Shell', 'secondary', ['Home', 'Hang', 'Climb', 'Log', 'Settings']),
             ('Set up', 'muted', ['Climb, no board', 'Choose board', 'Angle', 'Hold sets', 'Lights?']),
             ('Connect', 'muted', ['Why Bluetooth', 'Searching', 'Boards found', 'Corner test', 'Connected']),
             ('Climb', 'chart1', ['Problem list', 'Filters', 'Problem', 'Lit on wall', 'Log send', 'Sent']),
             ('Create', 'muted', ['Set a problem', 'Name and grade', 'My problems', 'Share as QR']),
             ('Circuits', 'muted', ['Your circuits', 'One circuit', 'Add a problem', 'Edit and reorder', 'Climbing it', 'Done'])]
    y = 220
    for lane, tint, nodes in lanes:
        b.t(lane.upper(), 48, y+22, 140, 12, 600, 'mutedForeground')
        for i, node in enumerate(nodes):
            x = 200+i*250
            b.box(x, y, 210, 60, tint, None if tint != 'card' else 'border', 14, 'Flow / '+node)
            b.t(node, x+8, y+18, 194, 16, 600, 'foreground', 'center')
            if i < len(nodes)-1 and lane != 'Shell':
                b.vec('M0 6H26M20 0L26 6L20 12', x+217, y+24, 26, 12, None, 'input', 2, 'Flow / arrow')
        y += 84
    b.t('Recovery paths: Bluetooth off, permission blocked, no board found, lights look wrong, lights dropped mid-problem. Each one ends in "Climb without lights".', 200, y+4, 1300, 14, 400, 'mutedForeground')
    y += 64
    cols = [('Decisions in this draft', [
        ('Five places, one dock', 'Home, Hang, Climb, Log, Settings. Workouts leave Home for Hang; the calendar becomes a heat calendar in Log.'),
        ('Problems are bundled', 'The benchmark list ships inside the app: about 1.5 MB for 1,960 problems. No download, no sign-in.'),
        ('Lights are optional', 'Every screen works without the LED kit. Bluetooth is asked for only on Connect lights.'),
        ('One corner test', 'Four corners prove wiring and orientation before the first problem, with a fix for each failure.'),
        ('The wall is the hero', 'Thumbnails in every row, a full board on the problem, big actions reachable with chalky hands.'),
        ('Circuits are playlists', 'Problems climbed in a fixed order. Sent it or Skip lights the next one. No timer and no rests.')]),
        ('How it follows the principles', [
        ('Everything is local', 'Problems, sends, own problems and the paired board live on the device. Bluetooth is not a network.'),
        ('No account', 'No Moon login, so no sync with the official logbook. Sends are a local log.'),
        ('Instant startup', 'Home reads only the last problem name. Board data and Bluetooth load when Climb opens.'),
        ('One appearance', 'Same palette and Geist Mono. Three new colours, only for start, hold and finish.')]),
        ('Open questions', [
        ('Problem data', 'Which list may we ship, and under what terms? The draft uses the public late-2023 benchmark list.'),
        ('Hold artwork', 'Boards here are schematic. Real hold shapes per set need drawing or licensing.'),
        ('Newer control boxes', 'The protocol is proven on the V1 box. V4 and V5 boxes are assumed to speak it; test on one.'),
        ('Lights off', 'No clear command is documented. An empty problem should blank the wall; confirm on a board.'),
        ('2024 layout', 'Not in the benchmark data yet. Add when a problem list exists.'),
        ('Web', 'Web Bluetooth is Chrome-only. Web may stay a browse-and-log experience.')]),
        ('What the lights can do', [
        ('One short message', 'A problem is one line of text over Bluetooth serial: each hold as an LED number tagged start, hold or finish.'),
        ('The whole wall, every time', 'Each message redraws the wall. No brightness, no fades, no blinking, only fixed colours.'),
        ('The box never answers', 'The app knows the link is up, not what is lit. That is why the corner test asks the climber.'),
        ('Wiring is ours to map', 'LEDs run up one column and down the next from A1. Mirrored or reversed strips are fixed in the app.'),
        ('Lights above holds', 'One flag asks V2 and newer kits to also light above each hold. It is the only light setting.'),
        ('One phone on older boxes', 'A V1 box takes a single connection. A board another phone holds may not show up.'),
        ('About 45 holds at most', 'Longer messages are cut off without warning, so own problems stop at 30 holds.'),
        ('Hand and foot colours', 'Newer kits also take left, right, match and foot tags. Not used in this draft.')])]
    for i, (title, items) in enumerate(cols):
        x = 48+i*452
        b.box(x, y, 428, 700, 'card', 'border', 16, 'Notes / '+title)
        b.t(title, x+24, y+22, 380, 20, 600)
        yy = y+68
        for head, text in items:
            b.t(head, x+24, yy, 380, 14, 600); yy += 24
            yy += b.t(text, x+24, yy, 380, 12, 500, 'mutedForeground', lh=18)+16


def build():
    flow_map(); dock_spec()
    home(); hang(); log(); settings(); log('log-day', 'A5 Shell / Log, a day pinned', 4, (15, 2))
    empty(); setup_layout(); setup_angle(); setup_holds(); setup_lights()
    connect_why(); connect_scan(); connect_found(); connect_test(); connect_fix(); connect_done()
    connect_problem('off', 'C7 Connect / Bluetooth is off', 6, 'bluetooth_off', 'Bluetooth is off', 'Turn it on in Control Centre, then come back. The search starts by itself.', 'Search again', 'Detected before scanning; the screen leaves on its own once Bluetooth is on.')
    connect_problem('blocked', 'C8 Connect / permission blocked', 7, 'lock', 'Bluetooth is blocked', 'Allow Bluetooth for 67slopers in Settings to use the lights. Everything else works without it.', 'Open Settings', 'Shown after a denied system prompt. Never nags again on its own.')
    connect_problem('none', 'C9 Connect / no board found', 8, 'search', 'No board found', 'Searched for 15 seconds without a reply.', 'Search again', 'Timeout state with the three checks that fix most cases.', ['The LED kit has power: its control box light is on.', 'No other phone has the board open in another app.', 'You are within a few metres of the board.'])
    connection_sheet()
    climb_list(); filters_sheet(); no_results(); detail(); lit(); lost(); log_send(); sent(); detail_scrolled()
    create(); save_problem(); mine(); share(); session(); boards()
    circuits(); circuit(); add_to_circuit(); circuit_edit(); circuit_run(); circuit_done()


def publish_boards(p, boards, page, ownership, first=(), also_owned=()):
    """Publish one generator's boards to one page; only its own deterministic shapes are touched."""
    data = p.file()['data']
    previous = set(json.loads(ownership.read_text())) if ownership.exists() else set()
    previous |= set(also_owned)
    existing = data['pagesIndex'][page]['objects']
    generated = {o['id'] for b in boards for o in b.objects}
    changes = list(first)
    for old in previous-generated:
        if old in existing: changes.append(dict(type='del-obj', id=old, pageId=page))
    for b in boards:
        for o in b.objects:
            if o['id'] in existing:
                # An id can be reused by a different shape when a board gains or loses a layer, so
                # optional attributes are reset rather than inherited from the previous owner.
                reset = dict(hidden=False, opacity=1, shadow=[], interactions=[], locked=False, r1=0, r2=0, r3=0, r4=0)
                changes.append(dict(type='mod-obj', id=o['id'], pageId=page, operations=[dict(type='assign', value=reset | {k: v for k, v in o.items() if k not in ('id', 'type', 'shapes')})]))
            else: changes.append(dict(type='add-obj', id=o['id'], pageId=page, frameId=o['frameId'], parentId=o['parentId'], obj=o))
    for i in range(0, len(changes), 400):
        p.update(changes[i:i+400]); print(f'Published {min(i+400, len(changes))}/{len(changes)} changes', flush=True)
    ownership.write_text(json.dumps(sorted(generated)))
    live = p.file()['data']['pagesIndex'][page]['objects']; order = []
    for b in boards:
        mine = [o['id'] for o in b.objects[1:]]
        order.append(dict(type='mod-obj', id=b.id, pageId=page, operations=[dict(type='assign', value={'shapes': mine+[i for i in live[b.id].get('shapes', []) if i not in generated]})]))
    roots = [b.id for b in boards]
    order.append(dict(type='mod-obj', id=ZERO, pageId=page, operations=[dict(type='assign', value={'shapes': [i for i in live[ZERO].get('shapes', []) if i not in generated]+roots})]))
    p.update(order)
    final = p.file()
    for other, old in data['pagesIndex'].items():
        if other != page: assert final['data']['pagesIndex'][other] == old, 'Another page changed: '+old['name']
    print('Other pages unchanged. Export bytes', p.export(ROOT/'design/penpot/67slopers.penpot'), flush=True)


def publish():
    p = Penpot(); data = p.file()['data']
    backup = ROOT/'design/.local/before-moonboard.penpot'
    if not backup.exists(): p.export(backup)
    # The reserved placeholder from recreate.py made way for this exploration.
    legacy = ROOT/'design/.local/published-shapes.json'
    shapes = json.loads(legacy.read_text())
    first = [dict(type='mod-page', id=PAGE, name=PAGE_NAME)]
    for name, color in HOLD.items():
        cid = uid('color/moonboard/'+name)
        first.append(dict(type='mod-color' if cid in data.get('colors', {}) else 'add-color', color=dict(id=cid, name=name, path='67slopers/MoonBoard', color=color, opacity=1)))
    publish_boards(p, SCENE.boards, PAGE, OWNERSHIP, first, shapes.get(PAGE, []))
    shapes[PAGE] = []
    legacy.write_text(json.dumps(shapes))


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--publish', action='store_true'); args = parser.parse_args()
    build(); SCENE.resolve()
    OUT.mkdir(parents=True, exist_ok=True)
    for b in SCENE.boards: b.save_svg(OUT)
    INVENTORY.write_text(json.dumps([dict(key=b.key, name=b.name, pageId=b.page, boardId=b.id, route=b.route, width=b.w, height=b.h, note=b.note, shapes=len(b.objects)) for b in SCENE.boards], indent=2)+'\n')
    print(f'Generated {len(SCENE.boards)} boards and {sum(len(b.objects) for b in SCENE.boards)} editable shapes.', flush=True)
    if args.publish: publish()


if __name__ == '__main__': main()
