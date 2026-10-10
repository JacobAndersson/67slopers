"""A proposed redesign of the workout timer, as editable Penpot boards.

Design only: nothing in the app changes. The boards sit on the timer page under the ones that
document the app as built, so the two can be compared. Run without --publish for review SVGs
in design/exports/timer-redesign.
"""

import argparse
import base64
import json
from api import Penpot, ROOT
from moonboard import MB, H, W, publish_boards
from scene import MEDIA, REF, Scene, uid

PAGE = uid('page/timer')  # 04 Timer & recovery
OUT = ROOT/'design/exports/timer-redesign'
INVENTORY = ROOT/'design/explorations/timer/inventory.json'
OWNERSHIP = ROOT/'design/.local/timer-redesign-owned.json'
SCENE = Scene()
TOP = 5200  # below the as-built timer boards
BOARD = 'beastmaker-1000'
PHASE = {'ready': 'background', 'prep': 'accent', 'hang': 'chart1', 'rep-rest': 'secondary', 'set-rest': 'muted'}


def screen(key, name, col, phase, note=''):
    return MB(key, name, x=col*470, y=TOP+900, bg=PHASE[phase], page=PAGE, scene=SCENE, prefix='timer2-', route='/workout/[id]/run', note=note)


def grip(b, x, y, w, holds, surface='accent', spotlight=True):
    """The hangboard with the grip to use.

    Spotlight: nothing is painted on the holds. A veil of the screen's own colour lies over the
    rest of the board, with openings where the grip is, so those holds keep their full colour
    while everything else recedes; a hairline ring gives the openings an edge.
    """
    board = next(item for item in REF['boards'] if item['id'] == BOARD)
    h = w*board['height']/board['width']
    media = MEDIA[BOARD]
    art = b._shape('rect', 'Board / '+board['name'], x, y, w, h)
    art['fills'] = [{'fillOpacity': 1, 'fillImage': {'id': media['id'], 'width': media['width'], 'height': media['height'], 'mtype': 'image/png', 'name': board['name'], 'keepAspectRatio': True}}]
    data = base64.b64encode((ROOT/f'assets/boards/{BOARD}/base.png').read_bytes()).decode()
    b.svg.append(f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/png;base64,{data}"/>')
    boxes = [hold['box'] for hold in board['holds'] if hold['id'] in holds]
    if not spotlight:
        for box in boxes: b.box(x+box['x']*w, y+box['y']*h, box['w']*w, box['h']*h, None, 'ring', 4, 'Grip / as built')
        return h
    grow, r, margin = 4, 7, 6
    # Clockwise outer edge, counter-clockwise openings: the non-zero rule leaves them clear.
    d = f'M{-margin} {-margin}H{w+margin}V{h+margin}H{-margin}Z'
    for box in boxes:
        x0, y0 = box['x']*w-grow, box['y']*h-grow
        x1, y1 = x0+box['w']*w+2*grow, y0+box['h']*h+2*grow
        d += (f'M{x0+r:.2f} {y0:.2f}A{r} {r} 0 0 0 {x0:.2f} {y0+r:.2f}V{y1-r:.2f}A{r} {r} 0 0 0 {x0+r:.2f} {y1:.2f}'
              f'H{x1-r:.2f}A{r} {r} 0 0 0 {x1:.2f} {y1-r:.2f}V{y0+r:.2f}A{r} {r} 0 0 0 {x1-r:.2f} {y0:.2f}Z')
    b.vec(d, x, y, w, h, surface, name='Grip / veil over the rest of the board', opacity=.62)
    for box in boxes:
        b.box(x+box['x']*w-grow, y+box['y']*h-grow, box['w']*w+2*grow, box['h']*h+2*grow, None, 'foreground', r, 'Grip / ring', sw=1)
        b.objects[-1]['strokes'][0]['strokeOpacity'] = .28
        b.svg[-1] = b.svg[-1].replace('<rect', '<rect stroke-opacity=".28"', 1)
    return h


def header(b, phase, counter=None):
    """Close, the phase where the workout name used to be, settings; the counter small beneath."""
    b.status()
    b.ic('x', 20, 54)
    b.ic('settings-2', W-44, 54)
    b.t(phase, 70, 51, W-140, 24, 700, 'foreground', 'center', lh=30)
    if counter: b.t(counter, 24, 90, W-48, 14, 500, 'mutedForeground', 'center')


def digits(b, value, y=290):
    size = 128 if ':' in value else 200
    b.t(value, 24, y+(200-size)/2, W-48, size, 700, 'foreground', 'center', lh=size*1.1)


def next_up(b, y, label, value):
    """Only when what comes next is not the usual alternation. No card: two lines of text."""
    b.t(label, 24, y, W-48, 12, 600, 'mutedForeground', 'center', lh=16)
    b.t(value, 24, y+22, W-48, 20, 600, 'foreground', 'center')


def controls(b, paused=False, start=False):
    y = H-48-80
    if paused:
        b.button('', 24, y+12, 56, 56, 'outline', icon='skip-back')
        b.button('Resume', 92, y, 206, 80, icon='play', size=18)
        b.button('', 310, y+12, 56, 56, 'outline', icon='skip-forward')
    else:
        b.button('Start' if start else 'Pause', 24, y, W-48, 80, icon='play' if start else 'pause', size=18)
    b.gesture()


def fill(b, share):
    """The hang's rising colour, drawn behind everything else."""
    b.box(0, H*(1-share), W, H*share, 'secondary', r=0, name='Hang progress / rising rest colour')
    rect = b.objects.pop(); b.objects.insert(1, rect)
    svg = b.svg.pop(); b.svg.insert(0, svg)


def build():
    notes = MB('notes', 'T0 Timer redesign / what changes', x=0, y=TOP, w=1880, h=812, page=PAGE, scene=SCENE, prefix='timer2-', note='Proposal. The boards above this row show the timer as built.')
    notes.t('67SLOPERS / TIMER REDESIGN', 48, 36, 1700, 12, 500, 'mutedForeground')
    notes.t('A quieter timer', 48, 80, 1700, 36, 800)
    notes.t('The digits and the colour say almost everything. This pass takes away what repeats and what duplicates, and makes the one thing that must be noticed, a change of grip, impossible to miss.', 48, 136, 1200, 16, 400, 'mutedForeground', lh=24)
    changes = [
        ('The phase moves into the header', 'HANG, REST and GET READY take the place of the workout name, between the close and settings buttons. You chose the workout a moment ago; you do not need its name while hanging.'),
        ('The counter gets small', 'Rep and set sit under the phase in 14 px. Glanceable, no longer competing with the digits.'),
        ('Next up only on a change', 'During the hang and rest alternation of a set it says nothing. It appears when the pattern breaks: the last hang before a long rest, a new set, a new grip.'),
        ('No card around it', 'Next up is two lines of text on the phase colour, not a white box.'),
        ('End workout is gone', 'The X in the corner already ends the workout, with the same confirmation.'),
        ('The grip is spotlit', 'Nothing is painted on the holds. The rest of the board fades into the screen colour and the holds to use keep their full colour, with a faint hairline around them.'),
    ]
    for i, (title, text) in enumerate(changes):
        x = 48+(i % 3)*600; y = 226+(i//3)*150
        notes.t(title, x, y, 540, 16, 600)
        notes.t(text, x, y+28, 540, 12, 500, 'mutedForeground', lh=18)
    notes.t('The grip cue, before and after', 48, 548, 600, 20, 600)
    notes.box(48, 592, 560, 172, 'accent', r=16, name='Before / surface')
    grip(notes, 72, 612, 512, ['edge-medium-l', 'edge-medium-r'], spotlight=False)
    notes.box(648, 592, 560, 172, 'accent', r=16, name='After / surface')
    grip(notes, 672, 612, 512, ['edge-medium-l', 'edge-medium-r'])
    notes.t('When Next up shows', 1260, 548, 500, 20, 600)
    rules = [('Hang or short rest, mid-set', 'nothing'), ('Last hang of a set', 'Next · Rest 3:00'), ('Rest before a set, same grip', 'Next · Set 2 of 6'), ('Rest before a new grip', 'the board and the grip name'), ('Get ready', 'the first grip, if the workout has one')]
    for i, (when, what) in enumerate(rules):
        notes.t(when, 1260, 592+i*30, 300, 14, 500)
        notes.t(what, 1560, 592+i*30, 280, 14, 400, 'mutedForeground')

    b = screen('ready', 'T1 Timer / ready', 0, 'ready', 'Before Start the workout name still has a place: nothing else is happening yet.')
    header(b, 'READY')
    digits(b, '10')
    next_up(b, 540, 'REPEATERS 7:3', 'Press Start when ready')
    controls(b, start=True)

    b = screen('prep', 'T2 Timer / get ready, first grip', 1, 'prep', 'The grip to start on is the change worth showing here.')
    header(b, 'GET READY', 'Set 1 of 6')
    digits(b, '7')
    h = grip(b, 40, 132, 310, ['edge-medium-l', 'edge-medium-r'])
    next_up(b, 132+h+18, 'FIRST GRIP', 'Medium edge')
    controls(b)

    b = screen('hang', 'T3 Timer / hang, mid-set', 2, 'hang', 'Nothing but the phase, the counter and the time. The next thing is the same short rest as always.')
    header(b, 'HANG', 'Rep 2 of 6 · Set 1 of 6')
    fill(b, .5)
    digits(b, '4')
    controls(b)

    b = screen('rep-rest', 'T4 Timer / rest between reps', 3, 'rep-rest', 'Same quiet layout on the rest colour.')
    header(b, 'REST', 'Rep 2 of 6 · Set 1 of 6')
    digits(b, '3')
    controls(b)

    b = screen('hang-last', 'T5 Timer / last hang of a set', 4, 'hang', 'The pattern breaks after this hang, so Next up appears: a long rest is coming.')
    header(b, 'HANG', 'Rep 6 of 6 · Set 1 of 6')
    fill(b, .7)
    digits(b, '2')
    next_up(b, 540, 'NEXT', 'Rest 3:00')
    controls(b)

    b = screen('set-rest', 'T6 Timer / rest before a new set', 5, 'set-rest', 'Same grip next: one line says which set is coming.')
    header(b, 'REST', 'Set 1 of 6 done')
    digits(b, '2:48')
    next_up(b, 540, 'NEXT', 'Set 2 of 6')
    controls(b)

    b = screen('set-rest-grip', 'T7 Timer / rest before a new grip', 6, 'set-rest', 'A grip change gets the board: the rest of it fades into the screen and the holds to use keep their colour.')
    header(b, 'REST', 'Set 3 of 6 done')
    digits(b, '0:42')
    h = grip(b, 40, 132, 310, ['edge-small-l', 'edge-small-r'], 'muted')
    next_up(b, 132+h+18, 'NEXT GRIP', 'Small edge')
    controls(b)

    b = screen('paused', 'T8 Timer / paused', 7, 'hang', 'Back and skip only while paused, as now. Ending is the X.')
    header(b, 'PAUSED', 'Rep 2 of 6 · Set 1 of 6')
    fill(b, .5)
    digits(b, '4')
    controls(b, paused=True)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--publish', action='store_true'); args = parser.parse_args()
    build(); SCENE.resolve()
    OUT.mkdir(parents=True, exist_ok=True); INVENTORY.parent.mkdir(parents=True, exist_ok=True)
    for b in SCENE.boards: b.save_svg(OUT)
    INVENTORY.write_text(json.dumps([dict(key=b.key, name=b.name, pageId=b.page, boardId=b.id, route=b.route, width=b.w, height=b.h, note=b.note, shapes=len(b.objects)) for b in SCENE.boards], indent=2)+'\n')
    print(f'Generated {len(SCENE.boards)} boards and {sum(len(b.objects) for b in SCENE.boards)} editable shapes.', flush=True)
    if args.publish: publish_boards(Penpot(), SCENE.boards, PAGE, OWNERSHIP)


if __name__ == '__main__': main()
