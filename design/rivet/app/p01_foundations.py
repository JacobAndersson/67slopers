"""Page 01: foundations. Colour roles, session states, data colours, type, grid, radii, icons, motion."""
from pagekit import Page
from ui import (F, NIGHT, SNOW, GLOW, GLACIER, DUSK, GRANITE, STONE, PAPER, LIGHT, DARK, WALL, GLACIER_S, DUSK_S, NIGHT_S, TYPE,
                icon, t, W, H)
from brand import pitch
from pp import Scaled

BG = SNOW


def title(b, s, sub=None):
    b.text(s, 64, 56, size=44, font=F, weight=900, color=NIGHT, ls=-0.8)
    if sub: b.text(sub, 64, 116, w=b.w - 128, size=18, font=F, weight=600, color=GRANITE, lh=1.45)


def swatch(b, x, y, c, name, val, w=200, h=120, fg=None, stroke=False):
    b.rect(x, y, w, h, c, r=20, stroke='#141A2E1F' if stroke else None)
    b.text(name, x, y + h + 12, size=16, font=F, weight=800, color=NIGHT)
    b.text(val, x, y + h + 34, size=13, font=F, weight=700, color=GRANITE)


def build(doc, index):
    p = Page(doc, '01 Foundations', 'found')
    p.heading('Foundations', 'Tokens from design/rivet/kit/tokens, named for the job, so dark mode only swaps values.')

    def roles(b):
        title(b, 'Colour roles', 'Light and dark share role names. The product lives on Snow; surfaces are white cards with a Night hairline at 8%.')
        keys = [('canvas', 'Canvas'), ('surface', 'Surface'), ('raised', 'Raised'), ('text', 'Text'), ('muted', 'Text muted'), ('line', 'Line'),
                ('track', 'Track'), ('action', 'Action'), ('on_action', 'On action')]
        for row_, (T, nm) in enumerate([(LIGHT, 'Light'), (DARK, 'Dark')]):
            y = 190 + row_ * 260
            b.text(nm.upper(), 64, y, size=13, font=F, weight=800, color=GRANITE, ls=1.8)
            b.rect(56, y + 28, 9 * 150 + 8, 196, T['canvas'], r=24, stroke='#141A2E14')
            for i, (k, lab) in enumerate(keys):
                x = 80 + i * 150
                b.rect(x, y + 52, 120, 80, T[k], r=16, stroke=T['line2'])
                b.text(lab, x, y + 144, size=14, font=F, weight=800, color=T['text'])
                b.text(T[k].upper(), x, y + 166, size=12, font=F, weight=700, color=T['muted'])
    p.board('roles', 'Colour roles', 1470, 720, roles, bg=BG)

    def states(b):
        title(b, 'Session states', 'The real timer screens at 40 %. Grounds keep their colour in both modes; the interval rises in a deeper step '
              'of the same colour with a darker edge; Paused goes Snow with a band of its phase.')
        import screens_timer as Ti
        k = 0.4
        S = [('Get ready', Ti.prep, '#E4E0DA', 'Stone · rises deep Stone'), ('Hang', Ti.hang, GLOW, 'Glow · rises Glow 500'),
             ('Rest', Ti.rest, GLACIER, 'Glacier · rises Glacier 400'), ('Recover', Ti.recover, '#DDECF1', 'Glacier 200 · rises Glacier 300'),
             ('Paused', Ti.paused, SNOW, 'Snow + phase band'), ('Done', Ti.finish, NIGHT, 'Night · the bars rise')]
        for i, (nm, fn, bg, cap) in enumerate(S):
            x = 64 + i * 224
            with b.frame(x, 180, 390 * k, 844 * k, bg, r=20, name=f'State / {nm}'):
                fn(Scaled(b, x, 180, k), LIGHT)
            b.rect(x - 0.5, 179.5, 390 * k + 1, 844 * k + 1, None, r=20, stroke='#141A2E1F')
            b.text(nm, x, 180 + 844 * k + 14, size=18, font=F, weight=900, color=NIGHT)
            b.text(cap, x, 180 + 844 * k + 40, w=200, size=13, font=F, weight=700, color=GRANITE)
        b.text('Glow is the colour of the hang. It fills the Hang screen and the app icon, and colours the symbol on Night. Nowhere else.',
               64, 640, w=1300, size=17, font=F, weight=700, color=NIGHT)
    p.board('states', 'Session states', 1480, 700, states, bg='#FFFFFF')
    p.newrow()

    def data(b):
        title(b, 'Data & exceptions', 'Charts: Night for your hangs, Dusk for board sessions, the Glacier scale for load. Never Glow.')
        swatch(b, 64, 190, NIGHT, 'Hangs', 'Night · bars, rails, timelines')
        swatch(b, 304, 190, DUSK_S[4], 'Board sessions', 'Dusk 500 · tiles in Dusk 200', fg=SNOW)
        swatch(b, 544, 190, GLACIER, 'Rest', 'Glacier · rest rails and timeline')
        swatch(b, 784, 190, GLACIER_S[1], 'Recover', 'Glacier 200 · between sets')
        for i, c in enumerate(GLACIER_S[2:]):
            b.rect(64 + i * 88, 420, 80, 80, c, r=16)
        b.text('Heat calendar: Glacier 300 → 700; a day with no training is an outlined cell.', 64, 512, w=900, size=15, font=F, weight=800, color=NIGHT)
        b.text('WALL LEDS · THE ONE EXCEPTION', 64, 580, size=13, font=F, weight=800, color=GRANITE, ls=1.8)
        for i, (k, nm) in enumerate([('start', 'Start'), ('hold', 'Hold'), ('finish', 'Finish')]):
            x = 64 + i * 200; c = WALL[k]
            b.ellipse(x, 616, 64, 64, c + '24', stroke=c, sw=4)
            if k != 'hold': b.ellipse(x + 23, 639, 18, 18, c)
            if k == 'finish': b.ellipse(x - 7, 609, 78, 78, None, stroke=c, sw=2)
            b.text(nm, x + 80, 624, size=18, font=F, weight=900, color=NIGHT)
            b.text(c, x + 80, 650, size=13, font=F, weight=700, color=GRANITE)
        b.text('These match the lights on a MoonBoard, so the screen and the wall read as one. Used only on the wall drawing\n'
               'and its legend, always as rings with a word; finish gets a second ring for colour-blind climbers. Hold-set swatches in\n'
               'board setup show the real hold colours too: the second, contained exception.',
               64, 712, w=900, size=15, font=F, weight=600, color=GRANITE, lh=1.45)
    p.board('data', 'Data colours', 1040, 820, data, bg='#FFFFFF')

    def type_(b):
        title(b, 'Type in the app', 'Nunito, in points. Session screens use 17 pt and up; 12 and 13 pt only for history and settings.')
        rows = [('timer', 'Timer', '7', '200 · 900 · −3% · tnum'), ('phase', 'Phase', 'Hang', '44 · 900 · −1'),
                ('large', 'Large title', 'Repeaters 7:3', '34 · 900 · −1%'), ('hero', 'Card title', 'Flowers for Dayz', '28 · 900 · −1%'),
                ('title', 'Title', 'This week', '22 · 800'), ('bodyB', 'Body strong', 'Sound cues', '17 · 800'),
                ('body', 'Body', 'Six hangs of ten seconds.', '17 · 600'), ('row', 'Row title', 'Max hangs', '16 · 800'),
                ('sub', 'Secondary', '6 sets · 24 min', '15 · 700'), ('caption', 'Caption', 'Fri · 5 of 5 sets', '13 · 700'),
                ('label', 'Label', 'Last hang', '12 · 800 · +14% · caps')]
        y = 180
        for k, nm, ex, spec in rows:
            sz, wt, tr, lh = TYPE[k]
            show = min(sz, 96)
            b.text(nm, 64, y + max(0, show * 0.55 - 20), size=16, font=F, weight=800, color=NIGHT)
            b.text(spec, 64, y + max(0, show * 0.55 - 20) + 22, size=13, font=F, weight=700, color=GRANITE)
            b.text(ex.upper() if k == 'label' else ex, 360, y, size=show, font=F, weight=wt, color=NIGHT, ls=tr * show / sz, lh=1.1,
                   name=f'Type / {nm}')
            y += max(show * 1.15, 44) + 24
        b.text('Timer shown at 96 of 200 pt. Phase 44, card title 28, row 16 and secondary 15 are the sizes the brand book’s own\n'
               'app screens use (p.48); everything else is the p.32 scale.', 64, y + 4, w=920, size=13, font=F, weight=700, color=GRANITE, lh=1.4)
    p.board('type', 'Type', 1040, 1080, type_, bg='#FFFFFF')
    p.newrow()

    def layout(b):
        title(b, 'Layout, radii, elevation', '4 pt base. 24 pt side margins. Cards 28, rows 20, inputs 12, pills half their height.')
        b.rect(64, 180, 195, 422, SNOW, r=24, stroke='#141A2E1F')
        for i in range(4):
            b.rect(64 + 12 + i * (171 / 4) + 2, 190, 171 / 4 - 4, 402, '#C3DCE555')
        b.rect(64, 180, 12, 422, '#F28C6E33'); b.rect(64 + 183, 180, 12, 422, '#F28C6E33')
        b.text('Phone · 4 columns,\n24 pt margins (shown ½)', 64, 618, size=14, font=F, weight=700, color=GRANITE, lh=1.4)
        R = [('Pill', 32, 'buttons, chips, dock', 160, 64), ('28', 28, 'cards', 120, 120), ('20', 20, 'rows, step cards', 120, 120),
             ('12', 12, 'inputs', 120, 120), ('24%', 29, 'app icon', 120, 120)]
        x = 320
        for nm, r, use, w_, h_ in R:
            b.rect(x, 180 + (120 - h_) / 2, w_, h_, GLACIER, r=r)
            b.text(nm, x, 316, size=16, font=F, weight=900, color=NIGHT); b.text(use, x, 338, size=13, font=F, weight=700, color=GRANITE)
            x += w_ + 36
        b.text('ELEVATION', 320, 420, size=13, font=F, weight=800, color=GRANITE, ls=1.8)
        from pp import shadow
        items = [('Flat', None), ('Hairline', 'line'), ('Lifted', (0, 10, 30, 0.22)), ('Overlay', (0, 16, 48, 0.25))]
        for i, (nm, e) in enumerate(items):
            x = 320 + i * 190
            o = b.rect(x, 456, 160, 110, '#FFFFFF', r=24, stroke='#141A2E14' if e == 'line' else None)
            if isinstance(e, tuple): shadow(o, *e[:3], '#0B0F1C', e[3])
            b.text(nm, x, 582, size=16, font=F, weight=900, color=NIGHT)
        b.text('Cards sit flat with a hairline. Only the dock, a lifted step, menus, sheets and dialogs cast a shadow.', 320, 616, w=760,
               size=14, font=F, weight=700, color=GRANITE)
    p.board('layout', 'Layout', 1180, 700, layout, bg='#FFFFFF')

    def icons_(b):
        title(b, 'Icons', 'Phosphor Regular in the interface, Fill for the selected dock tab and for play and pause inside solid pills, Bold for the timer’s ghost rounds. Hangboard and board icons are drawn on Phosphor’s grid. Night, or Snow on dark. Never Glow.')
        names = ['house', 'hangboard', 'board-spray', 'calendar-blank', 'gear-six', 'plus', 'caret-left', 'x', 'qr-code', 'magnifying-glass',
                 'sliders-horizontal', 'play-fill', 'pause-fill', 'skip-forward-bold', 'skip-back-bold', 'arrow-counter-clockwise-bold', 'repeat',
                 'dots-three-vertical', 'copy', 'trash', 'lightbulb-filament', 'bluetooth', 'heart', 'list-plus', 'check-circle-fill', 'books',
                 'barbell', 'arrow-right', 'lock-simple', 'speaker-high', 'vibrate', 'timer', 'star-fill', 'seal-check-fill', 'camera', 'warning-circle']
        for i, n in enumerate(names):
            x = 64 + (i % 12) * 84; y = 200 + (i // 12) * 110
            b.rect(x, y, 64, 64, SNOW, r=18)
            icon(b, n, x + 16, y + 16, 32, NIGHT)
            short = {'calendar-blank': 'calendar', 'magnifying-glass': 'search', 'dots-three-vertical': 'more', 'arrow-counter-clockwise-bold': 'restart · B',
                     'lightbulb-filament': 'lights', 'sliders-horizontal': 'settings', 'check-circle-fill': 'check · F', 'seal-check-fill': 'benchmark · F',
                     'skip-forward-bold': 'skip · B', 'skip-back-bold': 'back · B', 'warning-circle': 'warning', 'board-spray': 'board'}.get(n, n.replace('-fill', ' · F').replace('-bold', ' · B'))
            b.text(short, x - 8, y + 72, w=80, size=10, font=F, weight=700, color=GRANITE, align='center')
        b.text('Fill outside the dock only where it means "chosen": a rating star, a check on a sent problem, the benchmark seal.', 64, 520, w=980, size=14, font=F, weight=700, color=GRANITE)
        b.text('DOCK', 64, 560, size=13, font=F, weight=800, color=GRANITE, ls=1.8)
        b.rect(64, 590, 300, 64, NIGHT, r=32)
        for i, n in enumerate(['house-fill', 'hangboard', 'board-spray', 'calendar-blank', 'gear-six']):
            if i == 0: b.rect(72, 598, 53, 48, '#FFFFFF1F', r=24)
            icon(b, n, 85 + i * 56.8, 609, 26, SNOW if i == 0 else '#8C92A6')
    p.board('icons', 'Icons', 1100, 700, icons_, bg='#FFFFFF')

    def motion(b):
        title(b, 'Motion & feel', 'Things move like a body on a hold: a confident lift, a soft catch. Springs, not linear tweens.')
        rows = [('Arrive', 'Cards, sheets, toasts rise 8 pt and settle. Spring 380 / 32.'),
                ('State change', 'The ground crossfades in 250 ms; the elapsed fill rises linearly with time; the word lifts in. Digits never move.'),
                ('Controls', 'Switch, segmented tile, chip: 160 ms on the spring. Press: scale 0.97.'),
                ('Drag', 'A held step lifts with a shadow; the others slide to open a gap.'),
                ('Loading', 'The three Pitch bars lift in turn, a 1.2 s loop: launch and the Bluetooth search, nowhere else.'),
                ('Reduced motion', 'Every lift becomes a 120 ms crossfade. Nothing slides.')]
        for i, (a, c) in enumerate(rows):
            y = 180 + i * 72
            b.text(a, 64, y, size=20, font=F, weight=900, color=NIGHT)
            b.text(c, 300, y + 2, w=700, size=17, font=F, weight=600, color=GRANITE)
        for i, lift in enumerate([(0, 0, 0), (8, 0, 0), (8, 8, 0), (8, 8, 8)]):
            pitch(b, 64 + i * 140, 640, 80, NIGHT, lifts=lift)
        b.text('Sound & haptics: Get ready 660 Hz light tap · Hang 880 Hz heavy tap · Rest two light taps · Done three rising notes.',
               64, 760, w=980, size=15, font=F, weight=700, color=NIGHT)
    p.board('motion', 'Motion', 1100, 820, motion, bg='#FFFFFF')
    p.newrow()
    import screens_a11y as A
    from ui import GLOW as _G
    p.screen('a11y-home', 'Large text · Home', 'About 160%: cards grow, the Start pill goes full width.', lambda b, T: A.home_large(b, T), h=980)
    p.screen('a11y-timer', 'Large text · Hang', 'Words grow around the digits; the digits never truncate.', lambda b, T: A.timer_large(b, T), bg=_G)
    p.screen('a11y-steps', 'Large text · Steps', 'Meta stacks; two-up buttons become one per row.', lambda b, T: A.row_large(b, T))
