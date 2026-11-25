"""Log, sessions, one session, settings."""
from ui import (M, W, H, NIGHT, SNOW, GLACIER_S, t, icon, status, card, button, icon_button, chip, segmented, nav, large_title,
                section, label, hairline, measure, bottom_bar, home_bar, dialog, row, setting_row, dock, set_bars, stat, field)
from screens_timer import feel
import boards as B

CW = W - 2 * M


import datetime as _dt
TODAY = _dt.date(2026, 11, 19)
SESSIONS = {_dt.date(2026, 11, 18): 21, _dt.date(2026, 11, 16): 34, _dt.date(2026, 11, 12): 8, _dt.date(2026, 11, 10): 8,
            _dt.date(2026, 11, 8): 40}
SESSIONS[_dt.date(2026, 9, 29)] = 22
for _d, _m in [(1, 14), (4, 35), (6, 21), (8, 9), (11, 45), (14, 21), (16, 30), (20, 13), (22, 21), (25, 52), (27, 18), (29, 21), (31, 8)]:
    SESSIONS[_dt.date(2026, 10, _d)] = _m
SESSIONS[_dt.date(2026, 11, 3)] = 21; SESSIONS[_dt.date(2026, 11, 5)] = 16; SESSIONS[_dt.date(2026, 11, 7)] = 38


def heat(q, T, x, y, w, pinned=None, empty=False, weeks=8):
    """Eight weeks from the real dates: Monday-start columns, the last one is this week (up to today).
    Glacier sequential for minutes trained, an outline for a day with none. Labelled in words, no key."""
    cols, gap = weeks, 5
    cell = (w - 22 - gap * (cols - 1)) / cols
    start = TODAY - _dt.timedelta(days=TODAY.weekday()) - _dt.timedelta(weeks=cols - 1)
    for i, d in enumerate('MTWTFSS'):
        if i in (0, 2, 4, 6):
            t(q, d, x, y + 22 + i * (cell + gap) + cell / 2 - 8, 'caption', T['muted'], size=11)
    for c in range(cols):
        mon = start + _dt.timedelta(weeks=c)
        if c == 0 or mon.day <= 7:
            t(q, mon.strftime('%b'), x + 22 + c * (cell + gap), y, 'caption', T['muted'], size=11)
        for r in range(7):
            d = mon + _dt.timedelta(days=r)
            if d > TODAY: continue
            m = 0 if empty else SESSIONS.get(d, 0)
            lv = 0 if not m else (1 if m < 10 else 2 if m < 20 else 3 if m < 30 else 4 if m < 45 else 5)
            cx, cy = x + 22 + c * (cell + gap), y + 22 + r * (cell + gap)
            dim = pinned and d != pinned and lv
            if lv == 0:
                q.rect(cx + 0.5, cy + 0.5, cell - 1, cell - 1, None, r=cell * 0.3, stroke=T['line2'], sw=1, name=f'Day / {d} / none')
            else:
                q.rect(cx, cy, cell, cell, T['heat'][min(6, lv + 1)], r=cell * 0.3, opacity=0.35 if dim else 1, name=f'Day / {d} / {m} min')
            if pinned == d:
                q.rect(cx - 3, cy - 3, cell + 6, cell + 6, None, r=cell * 0.36, stroke=T['text'], sw=2, name='Pinned day')
    hh = 22 + 7 * (cell + gap)
    t(q, start.strftime('%-d %b') + ' – ' + TODAY.strftime('%-d %b') + '\n' +
      ('Darker days: more time training.' if T['name'] == 'light' else 'Brighter days: more time training.'), x, y + hh + 6, 'caption', T['muted'])
    return hh + 46


def log_row(q, T, y, title, sub, when, right, board=False, short=False):
    """The one session row (Home, Log, Sessions): icon tile, title, when and result in words, chevron."""
    meta = f'{when}  ·  {right}' + ('  ·  ended early' if short else '')
    row(q, T, M, y, CW, title, meta, 'board-spray' if board else 'hangboard', chevron=True,
        icon_fill=T['board_soft'] if board else None)
    return 80


ROWS = [('Repeaters 7:3', '', 'Yesterday', '6/6 sets', False, False),
        ('Board session', '', 'Mon', '9 problems, 2 sends', True, False),
        ('Max hangs', '', '12 Nov', '2/5 sets', False, True),
        ('Density hangs', '', '10 Nov', '4/4 sets', False, False),
        ('Board session', '', 'Sun, 8 Nov', '6 problems, 2 sends', True, False)]


def log(q, T, pinned=False, empty=False, restday=False):
    status(q, T['text'])
    t(q, 'Log', M, 96, 'large', T['text'])
    y = 160
    w3 = CW / 3
    for i, (k, v) in enumerate([('Streak', '4 weeks'), ('Sessions', '38'), ('Time', '21 h 40')]):
        stat(q, T, M + i * w3, y, v if not empty else '–', k)
    y += 80
    card(q, T, M, y, CW, 352, r=28)
    hh = heat(q, T, M + 20, y + 20, CW - 40, pinned=_dt.date(2026, 11, 18) if pinned else (_dt.date(2026, 11, 14) if restday else None), empty=empty)
    y += 352 + 32
    if empty:
        t(q, 'Nothing logged yet.\nYour sessions show up here.', M, y, 'body', T['muted'])
    elif restday:
        section(q, T, 'Sat, 14 Nov', y, 'Clear'); y += 44
        t(q, 'A rest day. Rest is part of the plan.', M, y, 'body', T['muted'])
    elif pinned:
        section(q, T, 'Wed, 18 Nov', y, 'Clear'); y += 44
        y += log_row(q, T, y, 'Repeaters 7:3', '', '07:12', '6/6 sets')
        t(q, '21 min trained', M, y + 8, 'caption', T['muted'])
    else:
        section(q, T, 'Recent', y, 'View all'); y += 44
        for r_ in ROWS[:4]:
            y += log_row(q, T, y, r_[0], r_[1], r_[2], r_[3], r_[4], r_[5])
    dock(q, T, 'log', bottom=getattr(q, 'h', H))


def sessions(q, T):
    status(q, T['text'])
    nav(q, T, 'back')
    large_title(q, T, 'Sessions', 112)
    y = 172
    for day, items in [('Yesterday', [ROWS[0]]), ('Monday', [ROWS[1]]), ('Thu, 12 Nov', [ROWS[2]]), ('Tue, 10 Nov', [ROWS[3]]), ('Sun, 8 Nov', [ROWS[4]])]:
        label(q, T, day.upper(), M, y); y += 20
        for r_ in items:
            y += log_row(q, T, y, r_[0], r_[1], {'Yesterday': '07:12', 'Monday': '18:02', 'Thu, 12 Nov': '09:05', 'Tue, 10 Nov': '19:30', 'Sun, 8 Nov': '17:55'}[day], r_[3], r_[4], r_[5])
        y += 16
    home_bar(q, T['text'])


def session(q, T, changed=False):
    status(q, T['text'])
    nav(q, T, 'back', right=['dots-three-vertical'])
    t(q, 'Thu, 12 Nov  ·  09:05', M, 112, 'sub', T['muted'])
    t(q, 'Max hangs', M, 136, 'large', T['text'])
    t(q, 'Ended early. Saved with the sets you finished.', M, 180, 'sub', T['muted'])
    y = 222
    card(q, T, M, y, CW, 168, name='Facts')
    for i, (k, v) in enumerate([('Time', '7:46'), ('Sets', '2 of 5'), ('Time hanging', '0:26'), ('Full hangs', '2 of 5')]):
        cx = M + 24 + (i % 2) * (CW / 2); cy = y + 22 + (i // 2) * 72
        t(q, k, cx, cy, 'caption', T['muted']); t(q, v, cx, cy + 20, 'bignum', T['text'], size=28)
    q.rect(M + CW / 2, y + 20, 1, 128, T['line']); q.rect(M + 20, y + 84, CW - 40, 1, T['line'])
    y += 168 + 32
    section(q, T, 'Hangs, as done', y); y += 40
    for i, (planned, done) in enumerate([(10, 10), (10, 10), (10, 6), (10, 0), (10, 0)]):
        t(q, f'Set {i + 1}', M, y + 2, 'caption', T['muted'])
        q.rect(M + 64, y + 4, CW - 64 - 64, 12, T['track'], r=6, name='Planned')
        if done: q.rect(M + 64, y + 4, (CW - 128) * done / planned, 12, T['text'], r=6, name='Done')
        t(q, f'{done} / {planned} s' if done else 'not run', W - M - 60, y + 1, 'caption', T['text'] if done else T['muted'], w=60, align='right')
        y += 30
    y += 24
    feel(q, T, y, sel=1)
    y += 120
    t(q, 'Note', M, y, 'bodyB', T['text'])
    q.rect(M, y + 30, CW, 80, T['surface'], r=12, stroke=T['line2'])
    t(q, 'Skin was thin, stopped early.', M + 16, y + 44, 'body', T['text'])
    by = bottom_bar(q, T, 200 if changed else 112)
    if changed:
        t(q, 'This workout has changed since.', M, by - 2, 'caption', T['muted'], w=CW, align='center')
        button(q, T, M, by + 24, CW, 'Do it again', 'primary', 'L', icon_name='play')
        button(q, T, M, by + 96, CW, 'Run the current version', 'ghost', 'L')
    else:
        button(q, T, M, by, CW, 'Do it again', 'primary', 'L', icon_name='play')
    home_bar(q, T['text'])


def settings(q, T):
    status(q, T['text'])
    t(q, 'Settings', M, 96, 'large', T['text'])
    y = 160
    label(q, T, 'BOARDS', M, y); y += 24
    card(q, T, M, y, CW, 3 * 64, r=24)
    setting_row(q, T, M + 20, y, CW - 40, 'Hangboard', 'chevron', 'Beastmaker 1000', ic='hangboard')
    setting_row(q, T, M + 20, y + 64, CW - 40, 'MoonBoard', 'chevron', 'Masters 2019', ic='board-spray')
    setting_row(q, T, M + 20, y + 128, CW - 40, 'Board lights', 'chevron', 'Connected', ic='lightbulb-filament', last=True)
    y += 192 + 28
    label(q, T, 'APPEARANCE', M, y); y += 24
    card(q, T, M, y, CW, 80, r=24)
    t(q, 'Theme', M + 20, y + 29, 'bodyB', T['text'])
    segmented(q, T, M + 112, y + 16, CW - 132, ['Auto', 'Light', 'Dark'], 0)
    y += 80 + 28
    label(q, T, 'DURING THE SESSION', M, y); y += 24
    card(q, T, M, y, CW, 2 * 64, r=24)
    setting_row(q, T, M + 20, y, CW - 40, 'Sound cues', 'on', ic='speaker-high')
    setting_row(q, T, M + 20, y + 64, CW - 40, 'Vibration', 'on', ic='vibrate', last=True)
    y += 128 + 28
    label(q, T, 'CLIMBING', M, y); y += 24
    card(q, T, M, y, CW, 80, r=24)
    t(q, 'Grades', M + 20, y + 29, 'bodyB', T['text'])
    segmented(q, T, M + 112, y + 16, CW - 132, ['Font', 'V-scale'], 0)
    y += 80 + 40
    t(q, 'Everything stays on this phone.\nNo account, no ads, no internet.', M, y, 'caption', T['muted'], w=CW, align='center')
    from brand import pitch
    pitch(q, W / 2 - 10, y + 52, 20, T['text'] if T['name'] == 'light' else T['muted'], name='Signature / Pitch')
    t(q, 'Climb Harder.', M, y + 80, 'caption', T['muted'], w=CW, align='center')
    t(q, 'Version 1.0', M, y + 100, 'caption', T['muted'], w=CW, align='center', size=12, weight=600)
    dock(q, T, 'settings', bottom=getattr(q, 'h', H))
