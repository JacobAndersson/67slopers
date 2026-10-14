"""Add a self-contained light/dark reference board to the local Penpot foundations page."""

import colorsys
import json
import re
from pathlib import Path

from api import Penpot, ROOT
from scene import Board, Scene, uid, ZERO
import scene

PAGE = '83493a27-42b5-5511-8850-15e221286642'
SOURCE = (ROOT / 'src/lib/theme.ts').read_text()


def palette(name):
    block = SOURCE.split(f'export const {name} = {{', 1)[1].split('} as const;', 1)[0]
    result = {}
    for key, h, s, l in re.findall(r"(\w+): 'hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)'", block):
        rgb = colorsys.hls_to_rgb(float(h) / 360, float(l) / 100, float(s) / 100)
        result[key] = '#' + ''.join(f'{round(channel * 255):02x}' for channel in rgb)
    return result


light = palette('LIGHT_THEME')
dark = palette('DARK_THEME')
assert light.keys() == dark.keys()
scene.C = {f'light-{key}': value for key, value in light.items()} | {
    f'dark-{key}': value for key, value in dark.items()
}

canvas = Scene()
board = Board(canvas, 'appearance-light-dark', 'Light & dark / semantic color', PAGE,
              2640, 0, 1200, 1520, bg='light-background')
original_text = board.text
def themed_text(*args, **kwargs):
    kwargs.setdefault('color', 'light-foreground')
    return original_text(*args, **kwargs)
board.text = themed_text
board.text('02 / APPEARANCE', 48, 44, size=14, weight=700, color='light-mutedForeground')
board.text('Two modes. One visual language.', 48, 84, w=1100, size=38, weight=700)
board.text('The phone sets the default. Settings → Appearance can choose Auto, Light, or Dark.',
           48, 148, w=1100, size=16, color='light-mutedForeground')

pairs = [('background', 'foreground'), ('card', 'cardForeground'),
         ('primary', 'primaryForeground'), ('secondary', 'secondaryForeground'),
         ('accent', 'accentForeground'), ('muted', 'mutedForeground'),
         ('destructive', 'destructiveForeground')]

for column, (mode, colors) in enumerate((('light', light), ('dark', dark))):
    x = 48 + column * 558
    board.rect(x, 222, 538, 1000, f'{mode}-background', f'{mode}-border', 22,
               name=f'{mode.title()} reference surface')
    board.text(mode.upper(), x + 24, 250, size=20, weight=700, color=f'{mode}-foreground')
    board.text('Source: '+('LIGHT_THEME' if mode == 'light' else 'DARK_THEME'),
               x + 24, 286, size=12, color=f'{mode}-mutedForeground')
    for index, (surface, ink) in enumerate(pairs):
        y = 330 + index * 115
        board.rect(x + 24, y, 490, 100, f'{mode}-{surface}', f'{mode}-border', 12,
                   name=f'{mode} / {surface}')
        board.text(surface, x + 40, y + 17, w=435, size=17, weight=600, color=f'{mode}-{ink}')
        board.text(f'{ink}  ·  {colors[surface]} / {colors[ink]}', x + 40, y + 54,
                   w=445, size=12, color=f'{mode}-{ink}')

board.text('Design with roles, not inverted hex values.', 48, 1262, w=1100, size=24, weight=700)
board.text('Keep typography, spacing, and information order identical in both appearances.',
           48, 1305, w=1100, size=15)
board.text('Timer: prep = accent, hang = chart1, recovery = secondary / muted. Keep phase words and digits.',
           48, 1335, w=1100, size=14)
board.text('Check dock, cards, forms, focus and disabled states, calendar, QR, and board holds in both.',
           48, 1363, w=1100, size=14)
board.text('MoonBoard LEDs keep start / move / finish roles. App source: src/global.css + src/lib/theme.ts.',
           48, 1391, w=1100, size=14)
board.text('Existing components and app screen references are light; this board specifies the dark roles.',
           48, 1430, w=1100, size=12, color='light-mutedForeground')


def publish():
    p = Penpot()
    file = p.file()
    objects = file['data']['pagesIndex'][PAGE]['objects']
    if board.id in objects:
        raise SystemExit('Appearance board already exists. Review it in Penpot before editing.')
    changes = [dict(type='add-obj', id=obj['id'], obj={k: v for k, v in obj.items() if k != 'shapes'} |
                    ({'shapes': []} if obj['type'] == 'frame' else {}), pageId=PAGE,
                    frameId=obj['frameId'], parentId=obj['parentId']) for obj in board.objects]
    p.update(changes)
    p.update([dict(type='mod-obj', id=board.id, pageId=PAGE,
                   operations=[dict(type='assign', value={'shapes': [o['id'] for o in board.objects[1:]]})])])
    live = p.file()['data']['pagesIndex'][PAGE]['objects']
    assert len(live[board.id]['shapes']) == len(board.objects) - 1
    p.render(PAGE, board.id, ROOT / 'design/exports/design-system/appearance-light-dark.png', scale=1)
    print('Appearance board:', board.id, 'shapes:', len(board.objects))
    print('Export bytes:', p.export(ROOT / 'design/penpot/67slopers.penpot'))


if __name__ == '__main__':
    publish()
