"""Home and the Hang library."""
from ui import (M, W, H, NIGHT, SNOW, DUSK_S, t, icon, status, card, button, icon_button, chip, dock, section, label,
                large_title, timeline, repeaters_segs, week_bars, row, hairline, measure, set_bars, nav, bottom_bar, home_bar,
                toast, dialog)
import boards as B

CW = W - 2 * M


def hang_card(q, T, y, h=188, title='Repeaters 7:3', when='LAST WORKOUT · YESTERDAY', meta='6 sets  ·  20:52  ·  Medium edges',
              top=True):
    card(q, T, M, y, CW, h, name='Card / last workout')
    label(q, T, when, M + 24, y + 24)
    t(q, title, M + 24, y + 44, 'hero', T['text'])
    t(q, meta, M + 24, y + 80, 'sub', T['muted'])
    button(q, T, M + 24, y + h - 24 - 52, 132, 'Start', 'primary' if top else 'ghost', 'M', icon_name='play',
           name='Button / Start (opens the timer counting down)')
    button(q, T, M + 168, y + h - 24 - 52, 112, 'Details', 'ghost', 'M')


def climb_card(q, T, y, h=188, top=False, lit=True):
    card(q, T, M, y, CW, h, name='Card / on the board')
    label(q, T, 'ON THE BOARD · MASTERS 2019 · 40°', M + 24, y + 24)
    t(q, 'Flowers for Dayz', M + 24, y + 44, 'hero', T['text'])
    t(q, '7A  ·  project  ·  3 tries  ·  Mon', M + 24, y + 80, 'sub', T['muted'])
    button(q, T, M + 24, y + h - 24 - 52, 156, 'Light it up' if lit else 'Open', 'primary' if top else 'ghost', 'M',
           icon_name='lightbulb-filament' if lit else None)  # the verb is always "Light it up" 
    B.wall_thumb(q, T, M + CW - 24 - 52, y + h - 24 - 72, B.FLOWERS, s=72, mono=True)


def header(q, T, greet):
    status(q, T['text'])
    icon_button(q, T, W - M - 48, 104, 'qr-code', 'ghost', label='Scan a code')
    t(q, greet, M, 104, 'large', T['text'], size=40, lh=1.02, ls=-0.8)


def week(q, T, y):
    section(q, T, 'This week', y)
    t(q, '2 sessions  ·  4-week streak', M, y + 4, 'sub', T['muted'], w=CW, align='right')
    y += 64
    week_bars(q, T, M, y, CW, [34, 0, 21, 0, 0, 0, 0], h=104, today=3, kinds=['board', None, 'hang', None, None, None, None])
    return y + 160


def recent(q, T, y):
    section(q, T, 'Recent', y, 'View all')
    y += 44
    for ttl, sub, ic in [('Repeaters 7:3', 'Yesterday  ·  6/6 sets', 'hangboard'),
                         ('Board session', 'Mon  ·  9 problems, 2 sends', 'board-spray'),
                         ('Max hangs', '12 Nov  ·  2/5 sets  ·  ended early', 'hangboard')]:
        row(q, T, M, y, CW, ttl, sub, ic, chevron=True, icon_fill=T['board_soft'] if ic == 'board-spray' else None)
        y += 80
    return y


def home(q, T, variant='morning'):
    bh = getattr(q, 'h', H)
    greet = {'morning': 'Good\nmorning.', 'evening': 'Good\nevening.', 'night': 'Late\nsession.', 'first': 'Good\nmorning.'}.get(variant, 'Good\nmorning.')
    header(q, T, greet)
    y = 214
    if variant == 'first':
        hang_card(q, T, y, title='Repeaters 7:3', when='READY TO GO', meta='6 sets  ·  20:52  ·  a classic to start with')
        y += 188 + 12
        t(q, 'Two more classics wait in Hang: Max hangs\nand Density hangs.', M, y + 4, 'sub', T['muted'])
        y += 64
        card(q, T, M, y, CW, 136, name='Card / board')
        label(q, T, 'GOT A MOONBOARD?', M + 24, y + 24)
        t(q, 'Climb problems and\ncircuits on your wall', M + 24, y + 48, 'title', T['text'])
        icon_button(q, T, M + CW - 24 - 48, y + 44, 'arrow-right', 'ghost')
        dock(q, T, 'home', bottom=bh)
        return
    if variant == 'unfinished':
        card(q, T, M, y, CW, 256, name='Card / unfinished run', stroke=T['text'])
        label(q, T, 'UNFINISHED · STOPPED 18 MIN AGO', M + 24, y + 24)
        t(q, 'Repeaters 7:3', M + 24, y + 44, 'title', T['text'])
        t(q, 'Set 3 of 6, rep 2. Two sets are in.', M + 24, y + 76, 'sub', T['muted'])
        set_bars(q, T, M + 24, y + 110, CW - 48, 2, 6, h=8)
        button(q, T, M + 24, y + 134, CW - 48, 'Continue', 'primary', 'M', icon_name='play')
        hw = (CW - 48 - 12) / 2
        button(q, T, M + 24, y + 196, hw, 'Save as ended', 'ghost', 'S')
        button(q, T, M + 24 + hw + 12, y + 196, hw, 'Discard', 'ghost', 'S', icon_name='trash')
        y += 256 + 16
    if variant == 'climb-first':
        climb_card(q, T, y, top=True); y += 188 + 12
        hang_card(q, T, y, top=False); y += 188 + 36
    elif variant == 'unfinished':  # the unfinished run is the workout card; no second card for the same workout
        climb_card(q, T, y, top=False); y += 188 + 36
    else:
        hang_card(q, T, y, top=True); y += 188 + 12
        climb_card(q, T, y, top=False); y += 188 + 36
    y = week(q, T, y)
    y = recent(q, T, y + 8)
    dock(q, T, 'home', bottom=bh)


import data
MAXH = data.expand(data.find('Max hangs'))
DENS = data.expand(data.find('Density hangs'))
LADDER = [('prep', 10), ('hang', 10), ('rest', 30), ('hang', 15), ('rest', 30), ('hang', 20), ('rest', 30), ('hang', 25)]
WORKOUTS = [('Repeaters 7:3', '6 sets  ·  20:52', data.expand(data.REPEATERS), 'Yesterday'),
            ('Max hangs', '5 sets  ·  13:00', MAXH, '12 Nov'),
            ('Density hangs', '4 sets  ·  8:10', DENS, '10 Nov'),
            ('Warm-up ladder', '1 set  ·  2:50', LADDER, 'not done yet')]


def hang_tab(q, T, empty=False):
    status(q, T['text'])
    large_title(q, T, 'Hang', 104)
    icon_button(q, T, W - M - 48, 100, 'plus', 'primary', label='New workout')
    icon_button(q, T, W - M - 108, 100, 'books', 'ghost', label='Classic workouts')
    y = 176
    if empty:
        card(q, T, M, y, CW, 312, name='Empty / no workouts')
        icon(q, 'hangboard', M + 24, y + 28, 40, T['text'])
        t(q, 'No workouts yet', M + 24, y + 88, 'title', T['text'])
        t(q, 'Start from a classic protocol, or build\nyour own step by step.', M + 24, y + 122, 'sub', T['muted'])
        button(q, T, M + 24, y + 182, CW - 48, 'Browse classics', 'primary', 'M')
        button(q, T, M + 24, y + 244, CW - 48, 'Build a workout', 'ghost', 'M')
        dock(q, T, 'hang'); return
    label(q, T, 'YOUR WORKOUTS', M, y)
    y += 28
    for i, (name, meta, segs, last) in enumerate(WORKOUTS):
        card(q, T, M, y, CW, 136, name=f'Workout / {name}')
        t(q, name, M + 24, y + 22, 'title', T['text'])
        t(q, f'{meta}  ·  {last}', M + 24, y + 54, 'sub', T['muted'])
        icon_button(q, T, M + CW - 24 - 48, y + 20, 'play', 'primary' if i == 0 else 'ghost', label=f'Start {name}')
        timeline(q, T, M + 24, y + 100, CW - 48, segs, h=10)
        y += 148
    y += 8
    row(q, T, M, y, CW, 'Classic workouts', '10 protocols, beginner to advanced', 'books', chevron=True, h=76)
    dock(q, T, 'hang', bottom=getattr(q, 'h', H))
