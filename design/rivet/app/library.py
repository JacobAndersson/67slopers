"""Penpot library assets for the app file: colours, typographies, design tokens (Light and Dark
themes) and main components. Shapes are drawn by p02_components (the Library board); this module
publishes the records that make them assets."""
import json
from contextlib import contextmanager
from pathlib import Path

from doc import APP, uid
from ui import (SNOW, PAPER, NIGHT, GLOW, GLACIER, DUSK, GRANITE, STONE, GLACIER_S, DUSK_S, NIGHT_S, LIGHT, DARK, WALL, TYPE, F)
import pp

COMPONENTS = []
FONT_ID = 'custom-' + pp.FONTS['Nunito']
GRANITE_S = ['#F0F0EF', '#D9DADB', '#BABCBF', '#9C9EA2', '#6B6E73', '#45484D', '#26282B']


@contextmanager
def component(b, name, path, x, y, w, h, fill=None, r=0):
    """A main component: a frame on board b whose contents are drawn inside the `with`."""
    with b.frame(x, y, w, h, fill, r, name=name, clip=False) as o:
        cid = uid('app-component', path, name)
        o.update(componentId=cid, componentFile=APP['fileId'], componentRoot=True, mainInstance=True)
        COMPONENTS.append(dict(id=cid, name=name, path=path, mainInstanceId=o['id'], mainInstancePage=b.page))
        yield o


def colors():
    out = []
    def add(name, path, c):
        col, op = (c[:7], int(c[7:], 16) / 255) if len(c) == 9 else (c, 1)
        out.append(dict(id=uid('app-color', path, name), name=name, path=path, color=col, opacity=op))
    for n, c in [('Night', NIGHT), ('Snow', SNOW), ('Glow', GLOW), ('Glacier', GLACIER), ('Dusk', DUSK), ('Paper', PAPER),
                 ('Granite', GRANITE), ('Stone', STONE)]:
        add(n, 'Rivet/Alpenglow', c)
    for scale, vals in [('Glacier', GLACIER_S), ('Dusk', DUSK_S), ('Night', NIGHT_S), ('Granite', GRANITE_S)]:
        for i, c in enumerate(vals):
            add(f'{scale} {(i + 1) * 100}', f'Rivet/Scales/{scale}', c)
    roles = ['canvas', 'surface', 'raised', 'text', 'muted', 'line', 'line2', 'track', 'action', 'on_action', 'board', 'board_soft']
    for T, nm in [(LIGHT, 'Light'), (DARK, 'Dark')]:
        for k in roles:
            add(k.replace('_', '-'), f'Rivet/Roles/{nm}', T[k])
    for k in ('hang', 'rest'):
        add(k, 'Rivet/Session', LIGHT[k])
    add('recover (light)', 'Rivet/Session', SNOW); add('recover (dark)', 'Rivet/Session', NIGHT)
    for k, c in WALL.items():
        add(k, 'Rivet/Wall LEDs (hardware only)', c)
    return out


def typographies():
    names = {'timer': 'Timer', 'phase': 'Phase', 'large': 'Large title', 'hero': 'Card title', 'title': 'Title', 'bodyB': 'Body strong',
             'body': 'Body', 'row': 'Row title', 'sub': 'Secondary', 'caption': 'Caption', 'label': 'Label', 'num': 'Number',
             'bignum': 'Big number'}
    out = []
    for k, (size, weight, ls, lh) in TYPE.items():
        out.append(dict(id=uid('app-type', k), name=names[k], path='Rivet/App', fontId=FONT_ID, fontFamily='Nunito',
                        fontVariantId=f'normal-{weight}', fontSize=str(size), fontWeight=str(weight), fontStyle='normal',
                        lineHeight=str(lh), letterSpacing=str(ls), textTransform='uppercase' if k == 'label' else 'none'))
    return out


def tokens():
    sets = {}
    for T, nm in [(LIGHT, 'Light'), (DARK, 'Dark')]:
        toks = []
        for k in ['canvas', 'surface', 'raised', 'text', 'muted', 'line', 'track', 'action', 'on_action', 'board']:
            toks.append(('color.' + k.replace('_', '-'), 'color', T[k]))
        # the kit's names (role.*.state-*), the same in both modes
        toks += [('color.state-get-ready', 'color', '#E4E0DA'), ('color.state-hang', 'color', GLOW), ('color.state-rest', 'color', GLACIER),
                 ('color.state-recover', 'color', '#DDECF1'), ('color.state-done', 'color', NIGHT)]
        sets[nm] = toks
    core = [('radius.pill', 'borderRadius', '9999'), ('radius.card', 'borderRadius', '28'), ('radius.row', 'borderRadius', '20'),
            ('radius.input', 'borderRadius', '12'), ('space.margin', 'spacing', '24'), ('space.unit', 'spacing', '4'),
            ('size.target.session', 'sizing', '64'), ('size.target', 'sizing', '48'), ('font.family', 'fontFamilies', 'Nunito')]
    for k, (size, weight, ls, lh) in TYPE.items():
        core += [(f'type.{k}.size', 'fontSizes', str(size)), (f'type.{k}.weight', 'fontWeights', str(weight))]
    sets['Core'] = core
    return sets


def publish(doc):
    p = doc.p
    data = p.file()['data']
    ch = []
    for c in colors():
        ch.append(dict(type='mod-color' if c['id'] in data.get('colors', {}) else 'add-color', color=c))
    for t in typographies():
        ch.append(dict(type='mod-typography' if t['id'] in data.get('typographies', {}) else 'add-typography', typography=t))
    names = []
    for nm, toks in tokens().items():
        sid = uid('app-token-set', nm); setname = f'Rivet/{nm}'; names.append(setname)
        ch.append(dict(type='set-token-set', id=sid, attrs=dict(id=sid, name=setname, description=f'Rivet {nm} tokens', tokens={})))
        for name, typ, val in toks:
            tid = uid('app-token', nm, name)
            ch.append(dict(type='set-token', setId=sid, tokenId=tid, attrs=dict(id=tid, name=name, type=typ, value=val, description='')))
    for th, sets_ in [('Light', ['Rivet/Core', 'Rivet/Light']), ('Dark', ['Rivet/Core', 'Rivet/Dark'])]:
        thid = uid('app-token-theme', th)
        ch.append(dict(type='set-token-theme', id=thid, attrs=dict(id=thid, name=th, group='Rivet', sets=sets_)))
    ch.append(dict(type='set-active-token-themes', themePaths=['Rivet/Light']))
    p.update(ch)
    comps = data.get('components', {})
    ch = []
    for c in COMPONENTS:
        if c['id'] in comps:
            ch.append(dict(type='mod-component', id=c['id'], name=c['name'], path=c['path'], mainInstanceId=c['mainInstanceId'],
                           mainInstancePage=c['mainInstancePage']))
        else:
            ch.append(dict(type='add-component', **c))
    if ch:
        p.update(ch)
    f = p.file()['data']
    ok = sum(1 for c in COMPONENTS if c['id'] in f.get('components', {}) and not f['components'][c['id']].get('deleted'))
    print(f'library: {len(colors())} colours, {len(typographies())} typographies, {sum(len(v) for v in tokens().values())} tokens, '
          f'{ok}/{len(COMPONENTS)} components live', flush=True)
