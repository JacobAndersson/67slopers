"""Large text (Dynamic Type / Android font scale at about 160–200%). Rows stack their meta under the title,
two-up buttons become one per row, the timer keeps its digits and grows its words, nothing truncates."""
from ui import (M, W, H, NIGHT, SNOW, GLOW, t, icon, status, card, button, icon_button, label, dock, home_bar, set_bars)
import boards as B

CW = W - 2 * M
K = 1.6


def home_large(q, T):
    status(q, T['text'])
    icon_button(q, T, W - M - 48, 56, 'qr-code', 'ghost', label='Scan a code')
    t(q, 'Good\nmorning.', M, 104, 'large', T['text'], size=48, lh=1.02)
    y = 230
    card(q, T, M, y, CW, 264, name='Card / last workout (large text)')
    t(q, 'LAST WORKOUT', M + 24, y + 24, 'label', T['muted'], size=17, ls=2.4)
    t(q, 'Yesterday', M + 24, y + 50, 'label', T['muted'], size=17, ls=2.4)
    t(q, 'Repeaters 7:3', M + 24, y + 82, 'hero', T['text'], size=36)
    t(q, '6 sets  ·  20:52', M + 24, y + 128, 'sub', T['muted'], size=22)
    button(q, T, M + 24, y + 176, CW - 48, 'Start', 'primary', 'L', icon_name='play')
    y += 284
    t(q, 'Recent', M, y, 'title', T['text'], size=32)
    y += 52
    for ttl, sub in [('Repeaters 7:3', 'Yesterday  ·  6/6 sets'), ('Board session', 'Mon  ·  9 problems, 2 sends')]:
        card(q, T, M, y, CW, 104, r=28)
        t(q, ttl, M + 24, y + 18, 'row', T['text'], size=24)
        t(q, sub, M + 24, y + 56, 'caption', T['muted'], size=20)
        y += 116
    dock(q, T, 'home', bottom=getattr(q, 'h', H))


def timer_large(q, T):
    """The digits are already huge; large text grows the words around them and drops the board to its own row."""
    q.rect(0, 0, W, H, GLOW, name='Hang')
    q.rect(0, H * 0.7, W, H * 0.3, '#E2664A', name='Elapsed fill (state.hang.elapsed)')
    q.rect(0, H * 0.7 - 1.5, W, 3, '#7E3324', name='Elapsed edge')
    status(q, NIGHT)
    icon_button(q, T, M - 12, 44, 'x-bold', 'on_ghost', d=64, isz=30, color=NIGHT, label='End')
    icon_button(q, T, W - M - 52, 44, 'sliders-horizontal-bold', 'on_ghost', d=64, isz=30, color=NIGHT, label='Session settings')
    t(q, 'Hang', M, 112, 'phase', NIGHT, size=64)
    t(q, 'SET', M, 190, 'label', NIGHT, size=18, ls=2.5); t(q, '2/6', M, 214, 'bignum', NIGHT, size=48)
    t(q, 'REP', M + 150, 190, 'label', NIGHT, size=18, ls=2.5); t(q, '4/6', M + 150, 214, 'bignum', NIGHT, size=48)
    t(q, 'Medium edges', M, 290, 'bodyB', NIGHT, size=26)
    t(q, '5', 0, 360, 'timer', NIGHT, w=W, align='center', size=200)
    q.rect(W / 2 - 110, 708, 220, 96, NIGHT, r=48, name='Pause')
    icon(q, 'pause-fill', W / 2 - 66, 740, 32, SNOW)
    t(q, 'Pause', W / 2 - 26, 734, 'title', SNOW, weight=900, size=30)
    home_bar(q, NIGHT)


def row_large(q, T):
    status(q, T['text'])
    t(q, 'Steps', M, 104, 'title', T['text'], size=34)
    y = 168
    for kind, ttl, sub in [('prep', 'Get ready', '10 s'), ('hang', 'Hang', '7 s  ·  Medium edges'), ('rest', 'Rest', '3 s')]:
        h = 112
        q.rect(M, y, CW, h, T['surface'], r=28, stroke=T['line'], name=f'Step / {ttl} (large text)')
        from screens_builder import rail
        q.rect(M + 16, y + 22, 6, h - 44, rail(T, kind), r=3)
        t(q, ttl, M + 38, y + 20, 'row', T['text'], size=26)
        t(q, sub, M + 38, y + 58, 'caption', T['muted'], size=21, w=CW - 110)
        icon_button(q, T, M + CW - 60, y + (h - 48) / 2, 'dots-three-vertical', 'plain', isz=26)
        y += h + 12
    t(q, 'Meta stacks under the title.\nButtons go one per row.', M, y + 12, 'body', T['muted'], size=21, w=CW)
    button(q, T, M, H - 112 - 76, CW, 'Save', 'ghost', 'L')
    button(q, T, M, H - 112, CW, 'Start', 'primary', 'L', icon_name='play')
    home_bar(q, T['text'])
