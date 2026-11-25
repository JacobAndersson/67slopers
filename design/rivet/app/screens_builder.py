"""Workout overview, builder (new / edit), grip picker, classic workouts, hangboard setup.

A workout is steps: Get ready, Hang, Rest, and repeats of them (at most one level deep). The rounds of
a top-level repeat are sets, the rounds of an inner one reps. A rest that sits between sets is shown as
Recover. Each step carries a rail in its own colour: Hang Night, Rest Glacier, Get ready and Recover Stone."""
from ui import (M, W, H, NIGHT, SNOW, GLACIER, GLACIER_S, STONE, t, icon, status, card, button, icon_button, chip, segmented,
                stepper, field, nav, large_title, section, label, timeline, repeaters_segs, hairline, measure, bottom_bar,
                home_bar, menu, dialog, scrim, sheet, row, switch, toast)
import boards as B

CW = W - 2 * M
BOARD = 'beastmaker-1000'
GRIP = B.pair(BOARD, 'edge-medium-l')
SH = 72  # step card height


def rail(T, kind):
    return {'prep': T['bar'], 'recover': GLACIER_S[1], 'hang': T['text'],
            'rest': GLACIER if T['name'] == 'light' else GLACIER_S[3]}[kind]


def step_card(q, T, x, y, w, kind, title, sub, editing=True, open_=False, h=SH, lifted=False, thumb=False):
    from pp import shadow
    if thumb: h = SH + 28
    c = q.rect(x, y, w, h, T['surface'], r=24, stroke=T['text'] if open_ else (T['line2'] if lifted else T['line']),
               sw=1.5 if open_ else 1, name=f'Step / {kind} / {title}')
    if lifted: shadow(c, 0, 14, 30, '#000000' if T['name'] == 'dark' else '#0B0F1C', 0.5 if T['name'] == 'dark' else 0.22)
    q.rect(x + 16, y + 18, 6, h - 36, rail(T, kind), r=3, name=f'Step / rail / {kind}')
    ty = y + (SH / 2 - 21 if thumb else h / 2 - 21)
    t(q, title, x + 36, ty, 'row', T['text'])
    t(q, sub, x + 36, ty + 23, 'caption', T['muted'])
    right = x + w - 12
    if editing:
        icon_button(q, T, right - 48, y + (h - 48) / 2, 'dots-three-vertical', 'plain', isz=22, label='Step options')
        right -= 52
    elif lifted:
        icon(q, 'dots-six-vertical', right - 28, y + (h - 22) / 2, 22, T['muted']); right -= 36
    if thumb:
        B.hangboard(q, BOARD, x + 36, y + 62, 84, color=T['text'], active=GRIP, sw=0.7, base_alpha='38', fill_alpha='08')
    return h


def repeat_head(q, T, x, y, w, times, unit, editing=True, open_=False):
    icon(q, 'repeat', x + 18, y + 18, 22, T['text'])
    t(q, f'{times} {unit}', x + 50, y + 16, 'bodyB', T['text'])
    if editing:
        icon_button(q, T, x + w - 60, y + 4, 'dots-three-vertical', 'plain', isz=22, label='Repeat options')
    if open_:
        stepper(q, T, x + 16, y + 60, w - 32, f'{times}', label=None)
        t(q, 'Rounds of this repeat are its sets.' if unit == 'sets' else 'Rounds inside a set are its reps.', x + 18, y + 136,
          'caption', T['muted'])
        return 168
    return 56


def tray(q, T, x, y, w, h, name):
    """A repeat is a soft rail down its left side, not a box: the steps keep their width."""
    q.rect(x + 4, y + 44, 4, h - 52, T['line2'], r=2, name=name + ' / rail')


def repeaters_list(q, T, y, editing=True, open_step=None, lifted=False, open_repeat=False):
    """Get ready · 6 sets of (6 reps of hang 7 s / rest 3 s) · recover 3:00. Returns y after the list."""
    x = M; w = CW
    y += step_card(q, T, x, y, w, 'prep', 'Get ready', '10 s', editing) + 8
    ed = open_step == 'hang'
    inner_h = 56 + SH + 8 + SH + 12 + (48 if editing else 0) + (344 if ed else 0)
    outer_head = 168 if open_repeat else 56
    outer_h = outer_head + inner_h + 8 + SH + 12
    top = y
    tray(q, T, x, y, w, outer_h, 'Repeat / 6 sets')
    repeat_head(q, T, x, y, w, 6, 'sets', editing, open_=open_repeat)
    y += outer_head
    tray(q, T, x + 12, y, w - 24, inner_h, 'Repeat / 6 reps')
    repeat_head(q, T, x + 12, y, w - 24, 6, 'reps', editing)
    yy = y + 56
    yy += step_card(q, T, x + 24, yy, w - 48, 'hang', 'Hang', '7 s  ·  Medium edges', editing, open_=ed) + 8
    if ed:
        yy = inline_editor(q, T, x + 24, yy, w - 48) + 8
    if lifted:
        q.rect(x + 24, yy, w - 48, SH, None, r=24, stroke=T['line2'], sw=1.2, name='Drop slot (dashed)')
        q._gap_y = yy
        yy += SH + 12
    else:
        yy += step_card(q, T, x + 24, yy, w - 48, 'rest', 'Rest', '3 s', editing) + 12
    if editing:
        button(q, T, x + 24, yy - 4, w - 48, 'Add step', 'quiet', 'S', icon_name='plus')
    y = y + inner_h + 8
    y += step_card(q, T, x + 12, y, w - 24, 'recover', 'Recover', '3:00  ·  rest between sets', editing) + 12
    y = top + outer_h + 16
    if editing:
        bw = (w - 12) / 2
        button(q, T, x, y, bw, 'Add step', 'ghost', 'S', icon_name='plus')
        button(q, T, x + bw + 12, y, bw, 'Add repeat', 'ghost', 'S', icon_name='repeat')
        y += 48 + 16
    return y


def inline_editor(q, T, x, y, w):
    q.rect(x, y, w, 336, T['surface'], r=24, stroke=T['line'], name='Step editor')
    segmented(q, T, x + 16, y + 16, w - 32, ['Get ready', 'Hang', 'Rest'], 1, h=48)
    stepper(q, T, x + 16, y + 106, w - 32, '7 s', label='Length')
    q.rect(x + 16, y + 186, w - 32, 56, T['canvas'], r=12, stroke=T['line'], name='Grip box')
    B.hangboard(q, BOARD, x + 28, y + 202, 80, color=T['text'], active=GRIP, sw=0.7)
    t(q, 'Medium edges', x + 120, y + 203, 'row', T['text'])
    icon(q, 'caret-right', x + w - 44, y + 204, 20, T['muted'])
    q.rect(x + 16, y + 258, w - 32, 56, T['surface'], r=12, stroke=T['line2'], name='Label field')
    t(q, 'Label, e.g. 20 mm half crimp', x + 32, y + 274, 'body', T['muted'])
    return y + 336


def board_card(q, T, y, open_=False):
    hb = 168 if not open_ else 276
    card(q, T, M, y, CW, hb, name='Hangboard card')
    label(q, T, 'HANGBOARD', M + 24, y + 24)
    t(q, 'Beastmaker 1000', M + 24, y + 44, 'title', T['text'])
    button(q, T, M + CW - 24 - 100, y + 22, 100, 'Done' if open_ else 'Change', 'ghost', 'S')
    if open_:
        with q.frame(M + 1, y + 88, CW - 2, 110, None, name='Board carousel (clipped)'):
            bx = M + 24
            for bid, nm in [(None, 'No board'), ('beastmaker-1000', 'Beastmaker 1000'), ('beastmaker-2000', 'Beastmaker 2000'), ('tension-grindstone-mk2', 'Grindstone')]:
                sel = bid == BOARD
                q.rect(bx, y + 92, 116, 72, T['canvas'], r=16, stroke=T['text'] if sel else T['line'], sw=2 if sel else 1, name=f'Board option / {nm}')
                if bid: B.hangboard(q, bid, bx + 12, y + 108, 92, color=T['text'], sw=0.6)
                else: t(q, '—', bx, y + 112, 'title', T['muted'], w=116, align='center')
                t(q, nm, bx, y + 172, 'caption', T['text'] if sel else T['muted'], w=116, align='center', size=12)
                bx += 128
        row(q, T, M + 12, y + 206, CW - 24, 'See all boards', None, None, chevron=True, h=56, card_=False)
    else:
        B.hangboard(q, BOARD, M + 24, y + 84, CW - 48, color=T['text'], active=GRIP)
    return hb


def overview(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    button(q, T, W - M - 84, 52, 84, 'Edit', 'ghost', 'S')
    large_title(q, T, 'Repeaters 7:3', 112)
    t(q, 'The classic strength-endurance set: 7 s on, 3 s off for six reps, six sets with three minutes between. '
         'Same edge and grip every set.', M, 160, 'body', T['muted'], w=CW)
    y = 270
    card(q, T, M, y, CW, 168, name='Facts')
    for i, (k, v) in enumerate([('Total time', '20:52'), ('Time hanging', '4:12'), ('Sets', '6'), ('Hangs', '36')]):
        cx = M + 24 + (i % 2) * (CW / 2); cy = y + 22 + (i // 2) * 72
        t(q, k, cx, cy, 'caption', T['muted']); t(q, v, cx, cy + 20, 'bignum', T['text'], size=28)
    q.rect(M + CW / 2, y + 20, 1, 128, T['line'])
    q.rect(M + 20, y + 84, CW - 40, 1, T['line'])
    y += 168 + 16
    card(q, T, M, y, CW, 152, name='Board')
    label(q, T, 'BEASTMAKER 1000  ·  MEDIUM EDGES', M + 24, y + 24)
    B.hangboard(q, BOARD, M + 24, y + 56, CW - 48, color=T['text'], active=GRIP)
    y += 152 + 32
    section(q, T, 'The workout', y)
    t(q, '6 sets  ·  7 s on, 3 s off  ·  recover 3:00', M, y + 32, 'sub', T['muted'])
    import data
    timeline(q, T, M, y + 64, CW, data.expand(data.REPEATERS), h=10)
    y = repeaters_list(q, T, y + 96, editing=False)
    bw = (CW - 12) / 2
    button(q, T, M, y, bw, 'Duplicate', 'ghost', 'M', icon_name='copy')
    button(q, T, M + bw + 12, y, bw, 'Share', 'ghost', 'M', icon_name='qr-code')
    y += 76
    t(q, 'Last done yesterday  ·  6/6 sets', M, y, 'sub', T['muted'])
    q.rect(M, y + 30, 124, 36, T['raised'], r=18, name='Feel badge')
    t(q, 'Felt strong', M, y + 38, 'caption', T['text'], size=14, w=124, align='center')
    by = bottom_bar(q, T)
    button(q, T, M, by, CW, 'Start workout', 'primary', 'L', icon_name='play')
    home_bar(q, T['text'])


def builder(q, T, mode='new', open_step=None, lifted=False, error=None, board_open=False, open_repeat=False, name_error=False):
    status(q, T['text'])
    nav(q, T, 'close' if mode == 'new' else 'back', 'New workout' if mode == 'new' else 'Edit workout')
    y = 120
    named = mode != 'new' or open_step
    y += field(q, T, M, y, CW, 'Name', 'Repeaters 7:3' if named else '', 'Name', focused=name_error,
               error='Add a name to save. Start works without one.' if name_error else None) + (40 if name_error else 16)

    if mode == 'edit':
        t(q, 'Description', M, y, 'caption', T['muted'])
        q.rect(M, y + 24, CW, 128, T['surface'], r=12, stroke=T['line2'], name='Description (grows to fit)')
        t(q, 'The classic strength-endurance set: 7 s on, 3 s off for six reps, six sets with three minutes between. '
             'Same edge and grip every set.', M + 16, y + 36, 'body', T['text'], w=CW - 32)
        y += 168
    else:
        icon(q, 'plus', M, y + 14, 20, T['text']); t(q, 'Add description', M + 30, y + 13, 'bodyB', T['text'])
        y += 56
    if mode == 'new':
        button(q, T, M, y, CW, 'Start from a classic workout', 'ghost', 'M', icon_name='books'); y += 68
    hairline(q, T, M, y + 8, CW); y += 32
    y += board_card(q, T, y, board_open) + 32
    section(q, T, 'Steps', y)
    t(q, '20:52 total' if not error else '0:13 total', M, y + 4, 'sub', T['muted'], w=CW, align='right')
    t(q, 'Tap a step to edit it. Hold and drag to move it.', M, y + 34, 'caption', T['muted'])
    y += 66
    if error:
        q.rect(M, y, CW, 56, T['raised'], r=12, name='Validation (not a button)')
        icon(q, 'warning-circle-fill', M + 16, y + 17, 22, T['text'])
        t(q, error, M + 48, y + 17, 'bodyB', T['text'])
        y += 72
        y += step_card(q, T, M, y, CW, 'prep', 'Get ready', '10 s') + 8
        y += step_card(q, T, M, y, CW, 'rest', 'Rest', '3 s') + 16
        bw = (CW - 12) / 2
        button(q, T, M, y, bw, 'Add step', 'ghost', 'S', icon_name='plus')
        button(q, T, M + bw + 12, y, bw, 'Add repeat', 'ghost', 'S', icon_name='repeat')
        y += 64
    else:
        y = repeaters_list(q, T, y, editing=True, open_step=open_step, lifted=lifted, open_repeat=open_repeat)
    if lifted:
        step_card(q, T, M + 24, q._gap_y, CW - 48, 'rest', 'Rest', '3 s', editing=False, lifted=True)
    if mode == 'edit':
        button(q, T, M, y, CW, 'Delete workout', 'quiet', 'M', icon_name='trash')
    by = bottom_bar(q, T)
    bw = (CW - 12) / 2
    if mode == 'new':
        button(q, T, M, by, bw, 'Save', 'ghost' if not error else 'disabled', 'L')
        button(q, T, M + bw + 12, by, bw, 'Start', 'primary' if not error else 'disabled', 'L', icon_name='play')
    else:
        button(q, T, M, by, CW, 'Save changes', 'primary', 'L')
    home_bar(q, T['text'])


def builder_menu(q, T):
    """⋮ on a step inside a repeat: every move the drag can do, for screen readers and switch control too."""
    builder(q, T, 'edit')
    scrim(q, T)
    sheet(q, T, 292, None)
    step_card(q, T, M, 320, CW, 'hang', 'Hang', '7 s  ·  Medium edges', editing=False)
    y = 412
    for ic, lbl, dis in [('copy', 'Duplicate', False), ('arrow-up', 'Move up', True), ('arrow-down', 'Move down', False),
                         ('arrow-square-in', 'Move into repeat above', True), ('arrow-elbow-left-up', 'Move out of repeat', False)]:  # into: disabled, nothing above
        icon(q, ic, M, y + 15, 24, T['muted'] if dis else T['text'])
        t(q, lbl, M + 40, y + 15, 'bodyB', T['muted'] if dis else T['text'])
        hairline(q, T, M + 40, y + 51, CW - 40); y += 52
    y += 12
    icon(q, 'trash', M, y + 15, 24, T['text']); t(q, 'Delete step', M + 40, y + 15, 'bodyB', T['text'])
    button(q, T, M, 756, CW, 'Cancel', 'ghost', 'L')
    home_bar(q, T['text'])


def discard_sheet(q, T):
    builder(q, T, 'edit', open_step='hang')
    scrim(q, T)
    sheet(q, T, 520, 'Discard your changes?')
    t(q, 'The workout stays as it was before you\nstarted editing.', M, 600, 'body', T['muted'])
    button(q, T, M, 672, CW, 'Keep editing', 'primary', 'L')
    button(q, T, M, 748, CW, 'Discard changes', 'ghost', 'L', icon_name='trash')
    home_bar(q, T['text'])


def add_menu(q, T):
    builder(q, T, 'new')
    scrim(q, T)
    sheet(q, T, 456, 'Add a step')
    y = 532
    for kind, ttl, sub in [('prep', 'Get ready', 'A countdown before the first hang'), ('hang', 'Hang', 'Time on the board'),
                           ('rest', 'Rest', 'Between hangs, or between sets')]:
        q.rect(M, y, CW, 72, T['canvas'], r=24, stroke=T['line'], name=f'Add / {ttl}')
        q.rect(M + 16, y + 18, 6, 36, rail(T, kind), r=3)
        t(q, ttl, M + 36, y + 14, 'bodyB', T['text']); t(q, sub, M + 36, y + 38, 'caption', T['muted'])
        icon(q, 'plus', M + CW - 40, y + 25, 22, T['text'])
        y += 84
    home_bar(q, T['text'])


def hold_picker(q, T):
    status(q, T['text'])
    nav(q, T, 'close', 'Choose grip')
    large_title(q, T, 'Beastmaker 1000', 112)
    card(q, T, M, 172, CW, 124, name='Board')
    B.hangboard(q, BOARD, M + 16, 190, CW - 32, color=T['text'], active=GRIP, sw=1.6)
    t(q, 'Medium edges  ·  both hands', M, 312, 'bodyB', T['text'])
    y = 356
    L = B.layout(BOARD)
    rows = {}
    for h in L['holds']:
        if h['side'] == 'right': continue
        rows.setdefault(h['row'], []).append(h)
    for r in [4, 3, 2, 1]:
        hs = rows[r]
        label(q, T, {1: 'TOP', 2: 'UPPER ROW', 3: 'MIDDLE ROW', 4: 'BOTTOM ROW'}[r], M, y)
        x = M; y += 24
        for h in hs:
            nm = h.get('label', h['id']).replace(' (very deep 4-finger)', '')
            nm = nm + 's' if h['side'] == 'left' and not nm.endswith('s') else nm
            wdt = measure(q, nm, 'sub') + 36
            if x + wdt > W - M: x = M; y += 52
            chip(q, T, x, y, nm, selected=h['id'] == 'edge-medium-l')
            x += wdt + 8
        y += 68
    by = bottom_bar(q, T, 112)
    button(q, T, M, by, CW, 'Use this grip', 'primary', 'L')
    home_bar(q, T['text'])


def presets(q, T):
    import data
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'Classic workouts', 112)
    t(q, 'Classic protocols with their usual numbers. Start one as it is, tweak it, or keep it.', M, 160, 'body', T['muted'], w=CW)
    q.rect(M, 222, CW, 72, T['raised'], r=12, name='Note / not for beginners')
    icon(q, 'info', M + 16, 236, 22, T['text'])
    t(q, 'Hangboards load fingers hard. Climb for a\nyear or two before you train on one.', M + 48, 234, 'caption', T['text'], size=14)
    y = 322
    for lvl, items in data.PRESETS:
        label(q, T, lvl.upper(), M, y); y += 28
        for nm, steps, desc in items:
            card(q, T, M, y, CW, 152, name=f'Preset / {nm}')
            t(q, nm, M + 24, y + 20, 'title', T['text'])
            t(q, data.clock(data.seconds(steps)), M + CW - 24 - 80, y + 24, 'sub', T['muted'], w=80, align='right')
            t(q, data.OVERRIDE.get(nm) or data.summary(steps), M + 24, y + 52, 'sub', T['muted'])
            t(q, desc, M + 24, y + 78, 'caption', T['text'], w=CW - 48, size=14, weight=600)
            timeline(q, T, M + 24, y + 126, CW - 48, data.expand(steps), h=8)
            y += 164
        y += 20
    home_bar(q, T['text'])


def board_setup(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'Your hangboard', 112)
    t(q, 'New workouts start with this board. Saved workouts keep their own.', M, 160, 'body', T['muted'], w=CW)
    y = 236
    ids = [('beastmaker-1000', 'Beastmaker 1000'), ('beastmaker-2000', 'Beastmaker 2000'), ('fika-vetelangd', 'FIKA Vetelängd'),
           ('metolius-project', 'Metolius Project'), ('metolius-simulator-3d', 'Simulator 3D'), ('tension-grindstone-mk2', 'Grindstone Mk2'),
           ('metolius-wood-grips-compact', 'Grips Compact'), ('metolius-wood-grips-deluxe', 'Grips Deluxe')]
    cw = (CW - 12) / 2
    for i, (bid, nm) in enumerate(ids):
        x = M + (i % 2) * (cw + 12); yy = y + (i // 2) * 128
        sel = bid == BOARD
        q.rect(x, yy, cw, 120, T['surface'], r=24, stroke=T['text'] if sel else T['line'], sw=2 if sel else 1, name=f'Board / {nm}')
        try:
            B.hangboard(q, bid, x + 16, yy + 18, cw - 32, color=T['text'], sw=0.8)
        except Exception:
            pass
        t(q, nm, x + 16, yy + 84, 'caption', T['text'], size=14, weight=800)
    y += 4 * 128 + 4
    button(q, T, M, y, CW, 'Skip board setup', 'quiet', 'M')
    by = bottom_bar(q, T)
    button(q, T, M, by, CW, 'Use this board', 'primary', 'L')
    home_bar(q, T['text'])
