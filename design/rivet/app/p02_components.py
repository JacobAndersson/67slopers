"""Page 02: components. Every part the screens are built from, in its states, light and dark."""
from pagekit import Page
from ui import (F, NIGHT, switch, checkbox, SNOW, GLOW, GLACIER, GRANITE, LIGHT, DARK, button, icon_button, chip, segmented, switch, checkbox, stepper,
                field, search, row, setting_row, card, dock, timeline, repeaters_segs, set_bars, progress, week_bars, sheet, menu, toast,
                label, t, icon, qr, hairline)
import boards as B
import screens_builder as Bu
import screens_climb as Cl
import screens_log as Lo
import screens_home as Ho
from pp import Scaled


def head(b, s, sub=None, x=56, y=48, T=LIGHT):
    b.text(s, x, y, size=36, font=F, weight=900, color=T['text'], ls=-0.6)
    if sub: b.text(sub, x, y + 52, w=b.w - 2 * x, size=16, font=F, weight=600, color=T['muted'], lh=1.45)


def cap(b, s, x, y, T=LIGHT):
    b.text(s.upper(), x, y, size=12, font=F, weight=800, color=T['muted'], ls=1.68)


def build(doc, index):
    p = Page(doc, '02 Components', 'comp')
    p.heading('Components', 'Big, soft, obvious. Every control works with chalky fingers and a glance.')
    build_library(doc, p)
    p.newrow()

    for T in (LIGHT, DARK):
        sfx = '' if T is LIGHT else ' · dark'

        def buttons(b, T=T):
            head(b, 'Buttons' + sfx, 'Ink pill. L 64 for primary actions and anything in a session, M 52 in cards, S 48 inline: nothing under 48.', T=T)
            y = 150
            for k in ('primary', 'ghost', 'disabled', 'quiet'):
                cap(b, k, 56, y + 22, T)
                button(b, T, 200, y, 240, 'Start session', k, 'L')
                button(b, T, 470, y + 8, 180, 'Change', k, 'M')
                button(b, T, 680, y + 12, 140, 'Add step', k, 'S', icon_name='plus')
                y += 92
            cap(b, 'icon', 56, y + 22, T)
            icon_button(b, T, 200, y, 'play', 'primary', d=64, isz=26)
            icon_button(b, T, 284, y + 10, 'plus', 'primary', d=48)
            icon_button(b, T, 352, y + 10, 'caret-left', 'ghost', d=44)
            icon_button(b, T, 416, y + 10, 'qr-code', 'ghost', d=44)
            button(b, T, 480, y, 240, 'Start', 'primary', 'L', icon_name='play')
            y += 100
            cap(b, 'timer', 56, y + 30, T)
            b.rect(200, y, 620, 96, SNOW, r=28, stroke='#141A2E1F')
            icon_button(b, T, 230, y + 16, 'arrow-counter-clockwise-bold', 'on_ghost', d=64, isz=26, color=NIGHT)
            b.rect(304, y + 4, 176, 88, NIGHT, r=44); icon(b, 'play-fill', 330, y + 34, 28, SNOW); t(b, 'Resume', 366, y + 32, 'title', SNOW, weight=900, size=24)
            icon_button(b, T, 494, y + 16, 'skip-forward-bold', 'on_ghost', d=64, isz=26, color=NIGHT)
            b.text('Timer: Bold icons, labelled pills, 64 and 88 pt.', 576, y + 30, w=230, size=14, font=F, weight=700, color=NIGHT)
        p.board('buttons' + sfx, 'Buttons' + sfx, 880, 780, buttons, bg=T['canvas'])

        def selection(b, T=T):
            head(b, 'Selection' + sfx, 'Controls that switch state show it moving: a sliding tile, a gliding knob, a filling chip.', T=T)
            y = 150
            segmented(b, T, 56, y, 420, ['Get ready', 'Hang', 'Rest'], 1)
            segmented(b, T, 500, y, 300, ['Problems', 'Circuits'], 0)
            y += 76
            x = 56
            for c, s in [('All', True), ('Projects', False), ('Sent', False), ('Saved', False)]:
                x += chip(b, T, x, y, c, s) + 8
            x += 16
            chip(b, T, x, y, 'Lit', True, icon_name='lightbulb-filament-fill')
            y += 72
            setting_row(b, T, 56, y, 360, 'Sound cues', 'on'); setting_row(b, T, 56, y + 64, 360, 'Vibration', 'off', last=True)
            checkbox(b, T, 460, y + 20, True); checkbox(b, T, 500, y + 20, False)
            b.text('Checkbox', 540, y + 22, size=14, font=F, weight=700, color=T['muted'])
            stepper(b, T, 460, y + 100, 340, '7 s', label='Length')
            y += 196
            from screens_timer import feel
            feel(Scaled(b, 32, 0, 1), T, y)
        p.board('selection' + sfx, 'Selection' + sfx, 880, 640, selection, bg=T['canvas'])

        def inputs(b, T=T):
            head(b, 'Inputs' + sfx, 'Radius 12, a hairline at rest, a Night line when focused. Errors are words, not red.', T=T)
            field(b, T, 56, 150, 360, 'Name', '', 'Optional. Needed to save.')
            field(b, T, 440, 150, 360, 'Name', 'Repeaters 7:3', focused=True)
            field(b, T, 56, 260, 360, 'Name', 'Tuesday crimps', error='Use 40 characters or fewer.')
            search(b, T, 440, 284, 360, 'Search name or setter')
        p.board('inputs' + sfx, 'Inputs' + sfx, 880, 400, inputs, bg=T['canvas'])
        p.newrow()

        def content(b, T=T):
            head(b, 'Cards & rows' + sfx, ('White' if T is LIGHT else 'Night') + ' cards and rows, radius 28, a hairline. Titles 16/800 over 13/700 captions.', T=T)
            q = Scaled(b, 32, 160, 1)
            Ho.hang_card(q, T, 0)
            Ho.climb_card(q, T, 204)
            row(b, T, 476, 160, 342, 'Repeaters 7:3', 'Yesterday  ·  6 of 6 sets', 'hangboard', chevron=True)
            row(b, T, 476, 240, 342, 'Board session', 'Mon  ·  9 problems', 'board-spray', chevron=True, icon_fill=T['board_soft'])
            row(b, T, 476, 320, 342, 'Classic workouts', '10 protocols', 'books', chevron=True)
            card(b, T, 476, 412, 342, 132)
            t(b, 'Max hangs', 500, 432, 'title', T['text']); t(b, '5 sets  ·  16 min', 500, 464, 'sub', T['muted'])
            timeline(b, T, 500, 508, 294, [('prep', 10)] + sum([[('hang', 10), ('recover', 180)] for _ in range(5)], [])[:-1])
            q2 = Scaled(b, 32, 580, 1)
            q2.h = 900
            Cl.problem_row(q2, T, 0, Cl.PROBLEMS[0]); Cl.problem_row(q2, T, 84, Cl.PROBLEMS[3])
            q3 = Scaled(b, 476 - 24, 570, 1)
            Lo.log_row(q3, T, 0, 'Repeaters 7:3', '6 sets  ·  7 s on, 3 s off', 'Today', '6/6 sets')
            Lo.log_row(q3, T, 80, 'Board session', '9 problems · hardest 6C', 'Mon', '4 sends', board=True)
        p.board('content' + sfx, 'Cards & rows' + sfx, 880, 800, content, bg=T['canvas'])

        def steps(b, T=T):
            head(b, 'Workout steps' + sfx, 'A rail in the step’s colour reads the rhythm before the words. Repeats are soft trays.', T=T)
            Bu.step_card(b, T, 56, 150, 360, 'prep', 'Get ready', '10 s')
            Bu.step_card(b, T, 56, 230, 360, 'hang', 'Hang', '7 s  ·  Medium edges')
            Bu.step_card(b, T, 56, 310, 360, 'rest', 'Rest', '3 s')
            Bu.step_card(b, T, 56, 390, 360, 'hang', 'Hang', '7 s  ·  Medium edges', thumb=True)
            Bu.step_card(b, T, 56, 500, 360, 'recover', 'Recover', '3:00  ·  rest between sets')
            Bu.step_card(b, T, 56, 590, 360, 'rest', 'Rest', '3 s', editing=False, lifted=True)
            Bu.tray(b, T, 460, 150, 360, 220, 'Repeat / 6 reps')
            Bu.repeat_head(b, T, 460, 150, 360, 6, 'reps')
            Bu.step_card(b, T, 476, 210, 328, 'hang', 'Hang', '7 s', editing=False)
            Bu.step_card(b, T, 476, 290, 328, 'rest', 'Rest', '3 s', editing=False)
            Bu.tray(b, T, 460, 410, 360, 210, 'Repeat open')
            Bu.repeat_head(b, T, 460, 410, 360, 6, 'sets', open_=True)
        p.board('steps' + sfx, 'Workout steps' + sfx, 880, 720, steps, bg=T['canvas'])

        def data(b, T=T):
            head(b, 'Bars & data' + sfx, 'One graphic device: the plain rounded bar. Time runs left to right.', T=T)
            cap(b, 'workout timeline', 56, 150, T)
            timeline(b, T, 56, 178, 360, repeaters_segs(3, 4))
            timeline(b, T, 56, 206, 360, [('prep', 10)] + sum([[('hang', 30), ('rest', 120)] for _ in range(4)], [])[:-1])
            cap(b, 'sets', 460, 150, T); set_bars(b, T, 460, 178, 360, 4, 6)
            cap(b, 'interval', 460, 210, T); progress(b, T, 460, 236, 360, 0.42)
            cap(b, 'this week', 56, 270, T)
            week_bars(b, T, 56, 300, 360, [22, 0, 18, 0, 30, 0, 0], h=96, today=4, kinds=['hang', None, 'board', None, 'hang', None, None])
            cap(b, 'heat calendar', 460, 270, T)
            q = Scaled(b, 460, 300, 1); Lo.heat(q, T, 0, 0, 360)
            cap(b, 'streak', 56, 470, T)
            for i in range(6): b.ellipse(56 + i * 20, 498, 12, 12, T['text'] if i >= 2 else T['track'])
        p.board('data' + sfx, 'Bars & data' + sfx, 880, 680, data, bg=T['canvas'])
        p.newrow()

        def nav_(b, T=T):
            head(b, 'Navigation & overlays' + sfx, ('A floating Night dock' if T is LIGHT else 'A floating Snow dock') + ' for the five places; pushed screens get round 48 pt corner buttons: ‹ for pushed, × for modal.', T=T)
            q = Scaled(b, 40, 172, 1)
            dock(q, T, 'home', bottom=92, fade=False)
            q = Scaled(b, 440, 172, 1)
            dock(q, T, 'climb', dot='climb', bottom=92, fade=False)
            icon_button(b, T, 56, 262, 'caret-left', 'ghost'); b.text('Edit workout', 140, 275, size=16, font=F, weight=800, color=T['text'])
            icon_button(b, T, 360, 262, 'x', 'ghost')
            q = Scaled(b, 440 - 0, 252, 1)
            toast(q, T, 'Session saved', y=10)
            menu(b, T, 56, 340, [('copy', 'Duplicate'), ('qr-code', 'Share'), None, ('trash', 'Delete workout')])
            with b.frame(440, 340, 390, 300, T['scrim'], r=28, name='Sheet sample'):
                q = Scaled(b, 440, 340 - 60, 1)
                sheet(q, T, 120, 'During the session')
                setting_row(q, T, 24, 210, 342, 'Sound cues', 'on')
        p.board('nav' + sfx, 'Navigation' + sfx, 880, 700, nav_, bg=T['canvas'])

        def boards_(b, T=T):
            head(b, 'Boards as diagrams' + sfx, 'We photograph and we diagram. Hangboards come from their layout.json; holds in use are solid.', T=T)
            for i, bid in enumerate(['beastmaker-1000', 'beastmaker-2000', 'tension-grindstone-mk2']):
                B.hangboard(b, bid, 56, 160 + i * 120, 360, color=T['text'], active=B.pair('beastmaker-1000', 'edge-medium-l') if i == 0 else ())
            b.rect(56, 520, 360, 96, GLOW, r=20)
            B.hangboard(b, 'beastmaker-1000', 80, 534, 312, color=NIGHT, active=B.pair('beastmaker-1000', 'edge-medium-l'), base_alpha='40', fill_alpha='0A')
            b.text('On Glow in the timer', 56, 626, size=13, font=F, weight=700, color=T['muted'])
            B.moonwall(b, T, 460, 150, 260, B.FLOWERS)
            B.wall_thumb(b, T, 740, 160, B.FLOWERS, s=76, mono=True)
            B.wall_thumb(b, T, 740, 250, B.MUFFLER, s=52, mono=True)
        p.board('boards' + sfx, 'Boards' + sfx, 880, 680, boards_, bg=T['canvas'])
        p.newrow()


def build_library(doc, p):
    """The Library board: every reusable part as a Penpot main component (Assets → Components)."""
    from library import component
    from ui import M
    T = LIGHT

    def lib(b):
        head(b, 'Library', 'Main components. Drag them from Assets; names follow Category / Variant.')
        y0 = 140
        items = []
        for kind in ('primary', 'ghost', 'quiet', 'disabled'):
            for size, w in (('L', 300), ('M', 160), ('S', 132)):
                items.append(('Button', f'{kind.title()} {size}', w, {'L': 64, 'M': 48, 'S': 40}[size],
                              lambda q, x, y, kind=kind, size=size, w=w: button(q, T, x, y, w, 'Start session' if size == 'L' else 'Change', kind, size)))
        for nm, ic, kind, d in [('Play', 'play', 'primary', 64), ('Add', 'plus', 'primary', 48), ('Back', 'caret-left', 'ghost', 44),
                                ('Close', 'x', 'ghost', 44), ('More', 'dots-three-vertical', 'plain', 44)]:
            items.append(('Icon button', nm, d, d, lambda q, x, y, ic=ic, kind=kind, d=d: icon_button(q, T, x, y, ic, kind, d=d, isz=26 if d == 64 else 22)))
        for on in (True, False):
            items.append(('Chip', 'On' if on else 'Off', 100, 40, lambda q, x, y, on=on: chip(q, T, x, y, 'Projects', on)))
            items.append(('Switch', 'On' if on else 'Off', 56, 34, lambda q, x, y, on=on: switch(q, T, x, y, on)))
            items.append(('Checkbox', 'On' if on else 'Off', 26, 26, lambda q, x, y, on=on: checkbox(q, T, x, y, on)))
        items.append(('Segmented', '3 options', 342, 48, lambda q, x, y: segmented(q, T, x, y, 342, ['Get ready', 'Hang', 'Rest'], 1)))
        items.append(('Segmented', 'Nothing chosen yet', 342, 64, lambda q, x, y: segmented(q, T, x, y, 342, ['Off day', 'Solid', 'Strong'], None, h=64)))
        items.append(('Stepper', 'Default', 342, 56, lambda q, x, y: stepper(q, T, x, y, 342, '7 s')))
        items.append(('Field', 'Rest', 342, 76, lambda q, x, y: field(q, T, x, y, 342, 'Name', '', 'Optional. Needed to save.')))
        items.append(('Field', 'Focused', 342, 76, lambda q, x, y: field(q, T, x, y, 342, 'Name', 'Repeaters 7:3', focused=True)))
        items.append(('Search', 'Default', 342, 48, lambda q, x, y: search(q, T, x, y, 342, 'Search name or setter')))
        items.append(('Row', 'Session', 342, 72, lambda q, x, y: row(q, T, x, y, 342, 'Repeaters 7:3', 'Yesterday  ·  6/6 sets', 'hangboard', chevron=True)))
        items.append(('Row', 'Board session', 342, 72, lambda q, x, y: row(q, T, x, y, 342, 'Board session', 'Mon  ·  9 problems', 'board-spray', chevron=True, icon_fill=T['board_soft'])))
        items.append(('Setting row', 'Switch', 342, 64, lambda q, x, y: setting_row(q, T, x, y, 342, 'Sound', 'on', last=True)))
        items.append(('Setting row', 'Value', 342, 64, lambda q, x, y: setting_row(q, T, x, y, 342, 'Hangboard', 'chevron', 'Beastmaker 1000', last=True)))
        for kind, ttl, sub in [('prep', 'Get ready', '10 s'), ('hang', 'Hang', '7 s  ·  Medium edges'), ('rest', 'Rest', '3 s')]:
            items.append(('Step', ttl, 342, 68, lambda q, x, y, kind=kind, ttl=ttl, sub=sub: Bu.step_card(q, T, x, y, 342, kind, ttl, sub)))
        items.append(('Dock', 'Home', 300, 64, lambda q, x, y: dock(Scaled(q, x - 45, y, 1), T, 'home', bottom=92, fade=False)))
        items.append(('Toast', 'Saved', 200, 48, lambda q, x, y: toast(Scaled(q, x - (390 - 200) / 2 + 8, y, 1), T, 'Session saved', y=0)))
        items.append(('Timeline', 'Repeaters', 342, 10, lambda q, x, y: timeline(q, T, x, y, 342, repeaters_segs(3, 4))))
        items.append(('Set bars', '4 of 6', 342, 10, lambda q, x, y: set_bars(q, T, x, y, 342, 4, 6)))
        items.append(('Row', 'Problem', 342, 88, lambda q, x, y: Cl.problem_row(Scaled(q, x - 24, 0, 1), T, y, Cl.PROBLEMS[3])))
        items.append(('Week chart', 'This week', 342, 150, lambda q, x, y: week_bars(q, T, x, y + 24, 342, [34, 0, 21, 0, 0, 0, 0], h=96, today=3,
                                                                                    kinds=['board', None, 'hang', None, None, None, None])))
        items.append(('Timer', 'Pause control', 176, 88, lambda q, x, y: (q.rect(x, y, 176, 88, NIGHT, r=44), icon(q, 'pause-fill', x + 36, y + 30, 28, SNOW),
                                                                          t(q, 'Pause', x + 72, y + 28, 'title', SNOW, weight=900, size=24))))
        items.append(('Hangboard', 'Beastmaker 1000', 342, 89, lambda q, x, y: B.hangboard(q, 'beastmaker-1000', x, y, 342, color=NIGHT,
                                                                                        active=B.pair('beastmaker-1000', 'edge-medium-l'))))
        x, y, rowh = 56, y0, 0
        for cat, nm, w, h, draw in items:
            if x + max(w, 150) > 1180: x = 56; y += rowh + 64; rowh = 0
            b.text(f'{cat} / {nm}', x, y, size=12, font=F, weight=800, color=GRANITE)
            with component(b, nm, f'Rivet/{cat}', x, y + 22, w, h):
                draw(b, x, y + 22)
            x += max(w, 150) + 40; rowh = max(rowh, h + 22)
    p.board('library', 'Library', 1240, 2080, lib, bg='#FFFFFF')
