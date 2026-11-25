"""Sharing, scanning, importing, launch, and the states nobody hopes to see."""
from ui import (M, W, H, NIGHT, SNOW, GLOW, t, icon, status, card, button, icon_button, nav, large_title, section, label,
                hairline, measure, bottom_bar, home_bar, dialog, qr, timeline, repeaters_segs, toast)
import boards as B
from brand import pitch, lockup, stacked

CW = W - 2 * M


def share(q, T, kind='workout'):
    status(q, T['text'])
    icon_button(q, T, W - M - 48, 52, 'x', 'ghost', label='Close')
    nm, sub = ('Repeaters 7:3', '20:52') if kind == 'workout' else ('Flowers for Dayz', '7A  ·  Masters 2019 · 40°')
    t(q, nm, M, 140, 'large', T['text'], w=CW, align='center')
    t(q, sub, M, 186, 'sub', T['muted'], w=CW, align='center')
    s = 286
    card(q, T, (W - s - 56) / 2, 236, s + 56, s + 56, r=28, fill='#FFFFFF')
    qr(q, (W - s) / 2, 264, s, seed=nm, color=NIGHT)
    # the app icon in the middle (error correction H keeps it scannable): Glow symbol on Night, a Snow quiet zone
    ic = s * 0.2; qz = ic + 12
    q.rect(W / 2 - qz / 2, 264 + s / 2 - qz / 2, qz, qz, '#FFFFFF', r=qz * 0.24, name='QR / quiet zone')
    app_icon_dark(q, ic, W / 2 - ic / 2, 264 + s / 2 - ic / 2)
    t(q, 'Open Rivet on the other phone and tap\nthe scan button on Home.' if kind == 'workout'
      else 'Open Rivet on the other phone and scan.\nNo internet needed on either.', M, 618, 'sub', T['muted'], w=CW, align='center')
    t(q, 'The screen stays bright while this is open.', M, 670, 'caption', T['muted'], w=CW, align='center')
    home_bar(q, T['text'])


def scan(q, T, state='camera'):
    q.rect(0, 0, W, H, '#0B0F1C', name='Camera')
    if state in ('camera', 'invalid'):
        import random
        rnd = random.Random(3)
        for i in range(60):
            x, y, s = rnd.random() * W, rnd.random() * H, 30 + rnd.random() * 120
            q.ellipse(x - s / 2, y - s / 2, s, s, '#2E3650', opacity=0.35, name='Camera blur')
    status(q, SNOW)
    icon_button(q, T, W - M - 44, 52, 'x', 'on', color=SNOW, label='Close')
    t(q, 'Scan a code', M, 60, 'title', SNOW)
    s = 260; x0 = (W - s) / 2; y0 = 250
    if state in ('camera', 'invalid'):
        L = 44
        for (cx, cy, dx, dy) in [(x0, y0, 1, 1), (x0 + s, y0, -1, 1), (x0, y0 + s, 1, -1), (x0 + s, y0 + s, -1, -1)]:
            q.path(f'M{cx} {cy + dy * L} V{cy + dy * 14} Q{cx} {cy} {cx + dx * 14} {cy} H{cx + dx * L}', stroke=SNOW, sw=5, name='Viewfinder corner')
        cap = 'Point the camera at the QR code on a\nworkout’s or problem’s Share screen.' if state == 'camera' else 'That isn’t a Rivet code. Rivet reads\nonly its own workouts and problems.'
        q.rect(M, 600, CW, 76, '#141A2ECC', r=24, name='Caption')
        if state == 'invalid':
            icon(q, 'warning-circle', M + 20, 626, 24, SNOW)
        t(q, cap, M + (56 if state == 'invalid' else 0), 614, 'sub', SNOW, w=CW - (76 if state == 'invalid' else 0), align='left' if state == 'invalid' else 'center')
    else:
        q.rect(M, 200, CW, 360, '#141A2E', r=32, name='Permission')
        q.rect((W - 80) / 2, 236, 80, 80, '#2E3650', r=26); icon(q, 'camera' if state == 'permission' else 'camera-slash', (W - 36) / 2, 258, 36, SNOW)
        if state == 'permission':
            t(q, 'Allow the camera', M + 24, 340, 'title', SNOW, w=CW - 48, align='center')
            t(q, 'Only the code is read. Nothing is\nrecorded or sent.', M + 24, 376, 'sub', '#8C92A6', w=CW - 48, align='center')
            q.rect(M + 24, 468, CW - 48, 64, SNOW, r=32); t(q, 'Allow camera', M + 24, 488, 'bodyB', NIGHT, w=CW - 48, align='center', size=18)
        else:
            t(q, 'The camera is off', M + 24, 340, 'title', SNOW, w=CW - 48, align='center')
            t(q, 'Turn it on for Rivet in Settings to\nscan workouts and problems.', M + 24, 376, 'sub', '#8C92A6', w=CW - 48, align='center')
            q.rect(M + 24, 468, CW - 48, 64, SNOW, r=32); t(q, 'Open Settings', M + 24, 488, 'bodyB', NIGHT, w=CW - 48, align='center', size=18)
    home_bar(q, SNOW)


def import_workout(q, T, have=False):
    status(q, T['text'])
    nav(q, T, 'back', 'Shared workout')
    large_title(q, T, 'Pyramid hangs', 112)
    card(q, T, M, 166, CW, 64, r=20, fill=T['raised'])
    icon(q, 'paper-plane-tilt', M + 18, 186, 22, T['text'])
    t(q, 'You already have this workout.' if have else 'Shared with you. Keep it, or start it\nwithout saving.', M + 52, 178 if not have else 187, 'caption', T['text'], size=14)
    t(q, 'A ladder of hang times on one edge: 5, 10, then 15 s.', M, 252, 'body', T['muted'], w=CW)
    card(q, T, M, 312, CW, 96, name='Facts')
    for i, (k, v) in enumerate([('Total time', '14:30'), ('Hangs', '9'), ('Sets', '3')]):
        t(q, k, M + 24 + i * 110, 332, 'caption', T['muted']); t(q, v, M + 24 + i * 110, 352, 'bignum', T['text'], size=28)
    section(q, T, 'The workout', 436)
    t(q, '3 × (5 s, 10 s, 15 s / rest 1:00)', M, 468, 'sub', T['muted'])
    segs = [('prep', 10)] + sum([[('hang', 5), ('rest', 60), ('hang', 10), ('rest', 60), ('hang', 15), ('recover', 120)] for _ in range(3)], [])[:-1]
    timeline(q, T, M, 504, CW, segs, h=12)
    from screens_builder import step_card, tray, repeat_head
    y = 540
    y += step_card(q, T, M, y, CW, 'prep', 'Get ready', '10 s', editing=False) + 8
    tray(q, T, M, y, CW, 56 + 3 * 80 + 4, 'Repeat / 3 sets')
    repeat_head(q, T, M, y, CW, 3, 'sets', editing=False)
    yy = y + 56
    for nm, sub in [('Hang', '5 s  ·  Medium edges'), ('Rest', '1:00'), ('Hang', '10 s  ·  Medium edges')]:
        step_card(q, T, M + 12, yy, CW - 24, 'hang' if nm == 'Hang' else 'rest', nm, sub, editing=False, thumb=nm == 'Hang'); yy += 80
    by = bottom_bar(q, T)
    bw = (CW - 12) / 2
    if have:
        button(q, T, M, by, bw, 'Start', 'ghost', 'L', icon_name='play'); button(q, T, M + bw + 12, by, bw, 'Open my copy', 'primary', 'L')
    else:
        button(q, T, M, by, bw, 'Start', 'ghost', 'L', icon_name='play'); button(q, T, M + bw + 12, by, bw, 'Save', 'primary', 'L')
    home_bar(q, T['text'])


def import_problem(q, T, other=False):
    status(q, T['text'])
    nav(q, T, 'back', 'Shared problem')
    t(q, 'Corner pinch', M, 112, 'title', T['text'], size=26, weight=900)
    t(q, ('MoonBoard 2016' if other else 'Masters 2019') + '  ·  40°  ·  set by a friend', M, 148, 'caption', T['muted'])
    t(q, '6C+', W - M - 80, 108, 'bignum', T['text'], w=80, align='right')
    B.moonwall(q, T, (W - 286) / 2, 184, 286, [('I', 2, 'start'), ('H', 5, 'hold'), ('K', 8, 'hold'), ('F', 12, 'finish')] if other else B.MUFFLER, rows=18)
    if other:
        q.rect(M, 648, CW, 64, T['raised'], r=12, name='Note')
        icon(q, 'info', M + 16, 669, 22, T['text'])
        t(q, 'This problem is for the MoonBoard 2016.\nSet that board up to save it.', M + 48, 660, 'caption', T['text'], size=14)
        by = bottom_bar(q, T); button(q, T, M, by, CW, 'Set up MoonBoard 2016', 'primary', 'L')
    else:
        by = bottom_bar(q, T); bw = (CW - 12) / 2
        button(q, T, M, by, bw, 'Light it up', 'ghost', 'L', icon_name='lightbulb-filament')
        button(q, T, M + bw + 12, by, bw, 'Save', 'primary', 'L')
    home_bar(q, T['text'])


def missing(q, T, what='workout'):
    status(q, T['text'])
    nav(q, T, 'back')
    q.rect(M, 200, 80, 80, T['raised'], r=26)
    icon(q, {'workout': 'hangboard', 'session': 'calendar-blank', 'code': 'qr-code', 'newer': 'arrow-up'}[what], M + 22, 222, 36, T['text'])
    if what == 'code':
        q.path(f'M{M + 20} {222 + 38} L{M + 60} {222 - 2}', stroke=T['raised'], sw=7, name='Slash gap')
        q.path(f'M{M + 20} {222 + 38} L{M + 60} {222 - 2}', stroke=T['text'], sw=3, name='Slash')
    t(q, {'workout': 'This workout is\nno longer here.', 'session': 'This session is\nno longer here.', 'code': 'That isn’t\na Rivet code.',
          'newer': 'This needs a newer\nversion of Rivet.'}[what], M, 312, 'hero', T['text'])
    t(q, {'workout': 'It was deleted. Sessions you did with it keep their own copy.', 'session': 'It was deleted from your history.',
          'code': 'Rivet only reads its own workout and problem codes.', 'newer': 'Update Rivet, then scan the code again.'}[what],
      M, 386, 'body', T['muted'], w=CW)
    by = bottom_bar(q, T)
    button(q, T, M, by, CW, 'Scan again' if what in ('code', 'newer') else 'Back to home', 'ghost', 'L')
    home_bar(q, T['text'])


def delete_dialog(q, T, what='workout'):
    """Destructive confirms: the safe choice is the solid pill, the destructive one a hairline pill with its icon.
    The real screen stays visible under the scrim."""
    import screens_builder as Bu, screens_log as Lo, screens_home as Ho
    if what == 'workout':
        Bu.builder(q, T, 'edit')
        dialog(q, T, 'Delete this workout?', 'Past sessions keep their own copy of\nthe timings, so your history stays.',
               [('Keep it', 'primary'), ('Delete workout', 'ghost')])
    elif what == 'session':
        Lo.session(q, T)
        dialog(q, T, 'Delete this session?', 'It leaves your history and streak.\nThe workout itself stays.',
               [('Keep it', 'primary'), ('Delete session', 'ghost')])
    elif what == 'discard':
        Ho.home(q, T, 'unfinished')
        dialog(q, T, 'Discard this run?', 'Nothing from it is kept in your\nhistory.', [('Keep it', 'primary'), ('Discard', 'ghost')])
    else:
        Bu.builder(q, T, 'new', board_open=True)
        dialog(q, T, 'Change the board?', 'Grips belong to a board, so a new\nboard forgets each hang’s grip.',
               [('Keep this board', 'primary'), ('Change board', 'ghost')])


def launch(q, T, first=False):
    q.rect(0, 0, W, H, NIGHT, name='Launch / Night')
    if first:
        from brand import stacked
        stacked(q, W / 2, (H - 96) / 2, 40, SNOW, sym_color=GLOW)
        t(q, 'Climb Harder.', 0, H - 120, 'bodyB', SNOW, w=W, align='center')
    else:
        pitch(q, (W - 96) / 2, (H - 96) / 2, 96, GLOW, name='Pitch / launch')


def app_icon_dark(q, size, x, y):
    q.rect(x, y, size, size, NIGHT, r=size * 0.24, name='QR / app icon')
    pitch(q, x + size * 0.18, y + size * 0.18, size * 0.64, GLOW, name='QR / app icon / Pitch')


def app_icon(q, size=180, x=0, y=0, kind='light'):
    bg, fg = {'light': (GLOW, NIGHT), 'dark': (NIGHT, GLOW), 'tinted': ('#26282B', '#BABCBF')}[kind]
    q.rect(x, y, size, size, bg, r=size * 0.24, name=f'App icon / {kind}')
    pitch(q, x + size * 0.18, y + size * 0.18, size * 0.64, fg, name='App icon / Pitch')
