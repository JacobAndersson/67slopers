"""The session: the whole screen becomes the colour of the moment (brand book p.28).

Get ready and Recover are Snow (Night in dark mode), Hang is Glow, Rest is Glacier, Done is Snow.
Every state has a word as well as a colour. Read from two metres:
- the interval fills the screen from the bottom as it runs (a Night tint over the state colour),
- set and rep are two big counters, not a caption,
- the grip is drawn on the board and named under it,
- Next always sits in the same slot above the controls, and only when the pattern breaks,
- Paused washes the colour out and dims the digits, so a stopped clock never looks like a running one.
One big control while running; Back and Skip only when paused. Controls are 64 and 88 pt."""
from ui import (field, bottom_bar, M, W, H, NIGHT, SNOW, GLOW, GLACIER, GRANITE, LIGHT, DARK, t, icon, status, button, icon_button,
                label, progress, set_bars, hairline, sheet, scrim, switch, dialog, chip, home_bar, card, measure, toast, segmented)
import boards as B

BOARD = 'beastmaker-1000'
GRIP = B.pair(BOARD, 'edge-medium-l')
GRIP2 = B.pair(BOARD, 'edge-large-l')


# Session grounds keep their colour in both modes (brand book p.49): Get ready Stone, Hang Glow, Rest Glacier,
# Recover Glacier 200, Done Night. The interval rises from the bottom in a deeper step of the same colour, with a
# 3 pt edge two steps darker so the level reads from across the room (tokens state.<name>.elapsed / .edge).
STONE_ = '#E4E0DA'
RECOVER = '#DDECF1'
ELAPSED = {GLOW: '#E2664A', GLACIER: '#9CC3D1', RECOVER: GLACIER, STONE_: '#CFC9BF'}
EDGE = {GLOW: '#7E3324', GLACIER: '#467B8F', RECOVER: '#467B8F', STONE_: '#6B6E73'}
# Paused: the ground goes Snow and a band of the phase colour stays at the top, so a stopped clock never
# looks like a running one, from any distance, in either mode.


def run(q, T, bg, word, count, frac, line='', nxt=None, fg=NIGHT, paused=False, board=True, grip='Medium edges', holds=None,
        big_size=None, ready=False, sets=(2, 6), name='Repeaters 7:3'):
    """One instrument: word and one big set/rep line top-left, the grip as a thin band, a 240 pt count owning the middle,
    the whole session as set pills, one control. The interval fills the screen from the bottom as it runs."""
    hh = getattr(q, 'h', H)
    if paused:
        q.rect(0, 0, W, hh, SNOW, name='Paused ground')
        q.rect(0, 0, W, 214, bg, name='Paused / phase band (the state it stopped in; header, word and line all inside)')
    elif frac > 0 and not ready:
        q.rect(0, hh * (1 - frac), W, hh * frac, ELAPSED.get(bg, fg + '14'), name='Elapsed fill (state.elapsed)')
        q.rect(0, hh * (1 - frac) - 1.5, W, 3, EDGE.get(bg, fg), name='Elapsed edge')
    status(q, fg)
    icon_button(q, T, M - 12, 44, 'x-bold', 'on_ghost', d=64, isz=26, color=fg, label='End session')
    icon_button(q, T, W - M - 52, 44, 'sliders-horizontal-bold', 'on_ghost', d=64, isz=26, color=fg, label='Session settings')
    if ready:
        t(q, name, 80, 62, 'bodyB', fg, w=W - 160, align='center', name='Workout name')
    t(q, word, M, 118, 'phase', fg, name='Phase word')
    if line:
        t(q, line, M, 172, 'num', fg, size=26, name='Set and rep')
    if board:
        B.hangboard(q, BOARD, M + 40, 228, W - 2 * M - 80, color=fg, active=holds or GRIP, base_alpha='40', fill_alpha='0A', sw=1.2,
                    plate=SNOW if paused else bg)
        t(q, grip, M, 296, 'bodyB', fg, w=W - 2 * M, align='center', name='Grip')
    dim = fg
    t(q, count, 0, 336, 'timer', dim, w=W, align='center', size=big_size or (240 if len(count) <= 2 else (150 if len(count) <= 4 else 120)),
      name='Count')
    if sets:
        set_bars(q, T, M + 60, 616, W - 2 * M - 120, sets[0], sets[1], h=8, fg=fg, track=fg + '40', gap=6)
    if paused:
        t(q, 'Tap Resume to carry on', M, 648, 'bodyB', fg, w=W - 2 * M, align='center', size=19)
    elif nxt:
        t(q, nxt, M, 648, 'bodyB', fg, w=W - 2 * M, align='center', name='Next', size=19)
    cy = 716
    disc, glyph = (fg, bg) if fg != NIGHT else (NIGHT, SNOW)
    if paused:
        icon_button(q, T, M, cy + 12, 'arrow-counter-clockwise-bold', 'on_ghost', d=64, isz=26, color=fg, label='Back to the start of this interval')
        q.rect(W / 2 - 88, cy, 176, 88, disc, r=44, name='Resume')
        icon(q, 'play-fill', W / 2 - 58, cy + 30, 28, glyph)
        t(q, 'Resume', W / 2 - 22, cy + 28, 'title', glyph, weight=900, size=24)
        icon_button(q, T, W - M - 64, cy + 12, 'skip-forward-bold', 'on_ghost', d=64, isz=26, color=fg, label='Skip')
    elif ready:
        q.rect(M, cy, W - 2 * M, 88, disc, r=44, name='Start')
        icon(q, 'play-fill', W / 2 - 48, cy + 30, 28, glyph)
        t(q, 'Start', W / 2 - 12, cy + 28, 'title', glyph, weight=900, size=24)
    else:
        q.rect(W / 2 - 88, cy, 176, 88, disc, r=44, name='Pause')
        icon(q, 'pause-fill', W / 2 - 52, cy + 30, 28, glyph)
        t(q, 'Pause', W / 2 - 16, cy + 28, 'title', glyph, weight=900, size=24)
    home_bar(q, fg)


SR = 'Set 2 of 6  ·  Rep 4 of 6'
STONE_ = '#E4E0DA'


def ready(q, T):
    run(q, T, T['recover'], 'Ready', '20:52', 0, '6 sets  ·  36 hangs', 'Starts with Get ready 10 s', fg=T['text'], ready=True,
        grip='First grip  ·  Medium edges', sets=(0, 6))


def prep(q, T):
    run(q, T, STONE_, 'Get ready', '3', 0.7, 'Set 1 of 6  ·  Rep 1 of 6', 'Next  ·  Hang 7 s', fg=NIGHT, grip='First grip  ·  Medium edges', sets=(0, 6))


def hang(q, T):
    run(q, T, GLOW, 'Hang', '5', 2 / 7, SR, None, fg=NIGHT, sets=(1, 6))


def hang_first(q, T):
    run(q, T, GLOW, 'Hang', '6', 1 / 7, 'Set 1 of 6  ·  Rep 1 of 6', None, fg=NIGHT, sets=(0, 6))


def rest(q, T):
    run(q, T, GLACIER, 'Rest', '2', 1 / 3, SR, None, fg=NIGHT, sets=(1, 6))


def rest_newgrip(q, T):
    run(q, T, GLACIER, 'Rest', '8', 0.6, 'Set 3 of 6  ·  Rep 3 of 6', 'Next  ·  Hang 7 s', fg=NIGHT,
        grip='New grip  ·  Large edges', holds=GRIP2, sets=(2, 6), name='Two-grip repeaters')


def hang_next(q, T):
    run(q, T, GLOW, 'Hang', '4', 3 / 7, 'Set 2 of 6  ·  Rep 6 of 6', 'Next  ·  Recover 3:00', fg=NIGHT, sets=(1, 6))


def recover(q, T):
    run(q, T, RECOVER, 'Recover', '2:41', 19 / 180, '2 of 6 sets done', 'Next  ·  Set 3 of 6', fg=NIGHT, sets=(2, 6))


def paused(q, T):
    run(q, T, GLACIER, 'Paused', '2', 1 / 3, 'Rest  ·  Set 2 of 6', None, fg=NIGHT, paused=True, sets=(1, 6))


def hang_noboard(q, T):
    run(q, T, GLOW, 'Hang', '8', 0.2, 'Set 1 of 5', None, fg=NIGHT, board=False, sets=(0, 5))


def finish(q, T, ended=False):
    """Done is Night (brand book p.28): the screen goes quiet for a breath before the summary."""
    q.rect(0, 0, W, H, NIGHT, name='Done / Night')
    status(q, SNOW)
    from brand import pitch
    pitch(q, W / 2 - 40, 236, 80, GLOW, name='Pitch / rises with the three closing notes')
    t(q, 'Ended' if ended else 'Done', 0, 340, 'timer', SNOW, w=W, align='center', size=96, ls=-3)
    t(q, '2 of 6 sets  ·  12:04' if ended else '6 of 6 sets  ·  20:52', 0, 450, 'title', SNOW, w=W, align='center')
    set_bars(q, T, M + 60, 500, W - 2 * M - 120, 2 if ended else 6, 6, h=8, fg=SNOW, track='#FFFFFF29', gap=6)
    home_bar(q, SNOW)


def settings_sheet(q, T):
    run(q, T, GLACIER, 'Rest', '2', 1 / 3, SR, None, fg=NIGHT, sets=(1, 6))
    scrim(q, T)
    sheet(q, T, 532, 'During the session')
    y = 600
    for ttl, on in [('Sound cues', True), ('Vibration', True)]:
        t(q, ttl, M, y + 21, 'bodyB', T['text'])
        switch(q, T, W - M - 56, y + 15, on)
        hairline(q, T, M, y + 63, W - 2 * M)
        y += 64
    button(q, T, M, 748, W - 2 * M, 'Done', 'primary', 'L')
    home_bar(q, T['text'])


def end_sheet(q, T):
    run(q, T, GLOW, 'Paused', '4', 3 / 7, 'Hang  ·  Set 3 of 6', None, fg=NIGHT, paused=True, sets=(2, 6))
    scrim(q, T)
    sheet(q, T, 476, 'End the session?')
    t(q, 'Two full sets are in. Rivet keeps them the\nmoment you end.', M, 562, 'body', T['muted'], w=W - 2 * M)
    button(q, T, M, 640, W - 2 * M, 'Keep going', 'primary', 'L', icon_name='play')
    button(q, T, M, 716, W - 2 * M, 'End and save', 'ghost', 'L')
    home_bar(q, T['text'])


def done(q, T, ended=False, draft=None):
    N = T['text']
    status(q, N)
    total, ok = (6, 2) if ended else ((3, 3) if draft is not None else (6, 6))
    set_bars(q, T, M, 92, W - 2 * M, ok, total, h=10)
    t(q, 'Session saved', M, 124, 'large', N)
    t(q, '2 of 6 sets. You’ll get them next time.' if ended else ('All three sets, every hang to the end.' if draft is not None else 'All six sets, every hang to the end.'), M, 168, 'body', T['muted'],
      size=20, w=W - 2 * M)
    y = 222
    feel(q, T, y, sel=None)
    y += 124
    rows = [('Time', '14:30'), ('Time hanging', '1:30'), ('Full hangs', '9 of 9')] if draft is not None else \
        [('Time', '12:04' if ended else '20:52'), ('Time hanging', '1:34' if ended else '4:12'), ('Full hangs', '13 of 36' if ended else '36 of 36')]
    for k, v in rows:
        t(q, k, M, y + 16, 'body', T['muted'])
        t(q, v, W - M - 160, y + 12, 'num', N, w=160, align='right')
        hairline(q, T, M, y + 55, W - 2 * M)
        y += 56
    y += 24
    t(q, 'Note', M, y, 'bodyB', N)
    q.rect(M, y + 30, W - 2 * M, 52, T['surface'], r=12, stroke=T['line2'], name='Note field')
    t(q, 'Holds, load, or something to remember', M + 16, y + 44, 'body', T['muted'])
    y += 106
    if draft is not None:
        t(q, 'Keep this workout?', M, y, 'bodyB', N)
        field(q, T, M, y + 6, W - 2 * M, '', draft, 'Give it a name to keep it', focused=bool(draft))
        t(q, 'Leave it empty to finish without saving.', M, y + 94, 'sub', T['muted'])
    by = bottom_bar(q, T)
    button(q, T, M, by, W - 2 * M, 'Save and finish' if draft else 'Finish', 'primary', 'L')
    home_bar(q, N)


def feel(q, T, y, sel=2):
    """How it felt, in words on one 64 pt segmented pill (brand book p.45 selection). Stored as the app's
    weak / normal / strong; shown as Off day / Solid / Strong. Optional; tap the chosen one again to clear."""
    t(q, 'How did it feel?', M, y, 'bodyB', T['text'])
    segmented(q, T, M, y + 34, W - 2 * M, ['Off day', 'Solid', 'Strong'], None if sel is None else sel - 1, h=64)
