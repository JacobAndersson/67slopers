from book import *
from pp import Scaled
from screens import phone, home, hang, rest, done, icon, status, home_dark, rest_dark, done_dark, pill, DARK, LIGHT
import book

def web_landing(p, paper=False):
    """1440-wide landing page, first 2 screens, drawn on p (Scaled)."""
    bg = C['paper'] if paper else C['snow']; N = C['night']
    p.rect(0, 0, 1440, 2700, bg, name='Page')
    lockup(p, 64, 34, 26, N)
    nx = 520
    for t in ['Training', 'Method', 'Gear', 'Field notes']:   # even 48 px gaps, measured
        p.text(t, nx, 38, size=17, font=F, weight=700, color=N); nx += p.doc.measure(t, F, 700, 17) + 48
    p.rect(1216, 24, 160, 50, N, r=25); p.text('Get the app', 1216, 38, w=160, size=16, font=F, weight=800, color=ON_DARK, align='center')
    bk_label = lambda s, x, y, c=book.GLOW_TEXT: p.text(s, x, y, size=14, font=F, weight=800, color=c, ls=2, upper=True)
    bk_label('Hangboard training, made simple', 64, 180)
    p.text('Climb\nHarder.', 58, 214, size=160, font=F, weight=900, color=N, lh=0.92, ls=-5)
    p.text('Structured finger strength training for climbers who’ve stopped getting stronger. Pick a plan, put your phone under the board, and hang. No ads, no accounts, no noise.',
           64, 520, w=520, size=20, font=F, weight=500, color='#2A2F40', lh=1.5)
    p.rect(64, 650, 200, 60, N, r=30); p.text('Get the app', 64, 668, w=200, size=18, font=F, weight=800, color=ON_DARK, align='center')
    p.rect(284, 650, 200, 60, None, r=30, stroke=N, sw=1.5); p.text('See a session', 284, 668, w=200, size=18, font=F, weight=800, color=N, align='center')
    p.image(PH / 'layback-corner.jpg', 700, 140, 676, 700, r=40)
    phone(Scaled(p.b, p.X(1150), p.Y(430), p.k * 0.62), 0, 0, C['glow'], hang)
    # section 2: three cards
    p.text('Built for the hang.\nNothing else.', 64, 1010, size=64, font=F, weight=900, color=N, lh=1.02, ls=-1.8)
    cards = [('glow', 'One tap to start', 'Your next workout is waiting on the home screen. Chalk up and press Start.'),
             ('glacier', 'Readable at two metres', 'The screen turns the colour of the moment. Hang or rest, you see it from the board.'),
             ('dusk', 'A plan that adapts', 'Tell us your goal, gear and time. Rivet builds the session and steps it up.')]
    for i, (k, t, s) in enumerate(cards):
        x = 64 + i * 448
        p.rect(x, 1200, 424, 460, '#FFFFFF' if paper else C['snow'], r=32, stroke='#141A2E14')
        p.rect(x + 32, 1232, 360, 220, C['night'] if i == 0 else C[k], r=22)
        icon(p, ['play-bold', 'timer-bold', 'list-checks-bold'][i], x + 32 + 140, 1302, 80, ON_DARK if i == 0 else N)
        p.text(t, x + 32, 1480, size=28, font=F, weight=900, color=N, ls=-0.6)
        p.text(s, x + 32, 1526, w=360, size=17, font=F, weight=500, color='#2A2F40', lh=1.5)
    # section 3: dark band
    p.rect(0, 1760, 1440, 640, N)
    p.image(PH / 'red-ridge.jpg', 720, 1760, 720, 640)
    p.text('TRAIN FOR THE MOUNTAINS', 64, 1860, size=14, font=F, weight=800, color=ON_DARK_MUTED, ls=2)
    p.text('The board is\nwhere it starts.', 64, 1896, size=72, font=F, weight=900, color=ON_DARK, lh=1.0, ls=-2)
    p.text('Every hang in a garage is a step toward a bigger wall. Rivet keeps the plan, you keep the dream.', 64, 2090, w=520, size=20, font=F, weight=500, color=ON_DARK_MUTED, lh=1.5)
    p.rect(64, 2210, 200, 60, ON_DARK, r=30); p.text('Start training', 64, 2228, w=200, size=18, font=F, weight=800, color=N, align='center')
    # footer
    wordmark(p, 64, 2480, 120, N)
    for i, t in enumerate(['App', 'Method', 'Gear', 'Field notes', 'Contact']):
        p.text(t, 900 + (i % 3) * 170, 2480 + (i // 3) * 40, size=17, font=F, weight=700, color=N)
    p.text('Built by climbers. No ads, ever.', 900, 2600, size=15, font=F, weight=600, color=MUTED)

def build(bk):
    N = C['night']
    bk.opener('06', 'digital', 'Digital', 'Big, soft, obvious. Built for a phone\npropped under a board.', 'garage-board')
    # 27 UI components ----------------------------------------------------------
    b = bk.spread(27, 'ui', 'Interface', '06 Digital  ·  Interface components')
    bk.h2(b, 'Interface', M, 150, size=64)
    bk.body(b, 'Big, soft, obvious. Every control must work with chalky fingers and a glance. Primary actions are a solid Ink pill: Night on light, Snow on dark. Secondary actions are an Ink ghost: the same pill as a hairline, no fill. Glow never becomes a button.', M, 240, w=1000)
    cols = [(M, 'Buttons'), (M + 600, 'Selection'), (M + 1180, 'Content')]
    for x, t in cols: bk.label(b, t, x, 380, color=C['glow'])
    y = 420
    for lab, fill, fg, stroke in [('Start session', N, ON_DARK, None), ('Change workout', None, N, N), ('Disabled', C['stone'], '#9C9EA2', None)]:
        b.rect(M, y, 300, 64, fill, r=32, stroke=stroke, name='Button / ' + lab)
        b.text(lab, M, y + 19, w=300, size=19, font=F, weight=800, color=fg, align='center'); y += 84
    b.rect(M, y, 64, 64, N, r=32); icon(b, 'play-bold', M + 18, y + 18, 28, ON_DARK)
    b.rect(M + 84, y, 64, 64, None, r=32, stroke='#141A2E33'); icon(b, 'plus-bold', M + 102, y + 18, 28, N)
    bk.body(b, 'Pill  ·  64 px tall  ·  Nunito 800', M + 330, 440, w=200, size=15, color=MUTED)
    # selection column
    x = M + 600
    b.rect(x, 420, 480, 64, C['stone'], r=32, name='Segmented')
    b.rect(x + 6, 426, 156, 52, '#FFFFFF', r=26, name='Segment / active')
    for i, t in enumerate(['Hang', 'Rest', 'Recover']):
        b.text(t, x + 6 + i * 156, 443, w=156, size=17, font=F, weight=800, color=N if i == 0 else MUTED, align='center')
    for i, (t, on) in enumerate([('20 mm', True), ('15 mm', False), ('Half crimp', True), ('Open hand', False)]):
        cx = x + [0, 128, 256, 404][i]
        w = [116, 116, 136, 136][i]
        b.rect(cx, 510, w, 46, N if on else None, r=23, stroke=None if on else '#141A2E33')
        b.text(t, cx, 522, w=w, size=15, font=F, weight=800, color=ON_DARK if on else N, align='center')
    for i, (t, on) in enumerate([('Sound cues', True), ('Vibration', True), ('Countdown voice', False)]):
        yy = 590 + i * 70; bk.rule(b, x, yy, 480)
        b.text(t, x, yy + 22, size=19, font=F, weight=700, color=N)
        b.rect(x + 404, yy + 16, 76, 40, N if on else C['stone'], r=20)
        b.ellipse(x + (444 if on else 408), yy + 20, 32, 32, '#FFFFFF')
    b.text('Hang time', x, 820, size=15, font=F, weight=800, color=MUTED)
    b.rect(x, 850, 480, 72, '#FFFFFF', r=20, stroke='#141A2E26')
    b.ellipse(x + 12, 862, 48, 48, None, stroke=N, sw=1.5); b.text('−', x + 12, 864, w=48, size=28, font=F, weight=800, color=N, align='center')
    b.text('10 s', x, 868, w=480, size=28, font=F, weight=900, color=N, align='center')
    b.ellipse(x + 420, 862, 48, 48, N); b.text('+', x + 420, 864, w=48, size=28, font=F, weight=800, color=ON_DARK, align='center')
    # content column
    x = M + 1180
    b.rect(x, 420, 500, 230, '#FFFFFF', r=28, stroke='#141A2E14', name='Card / workout')
    b.text('TODAY', x + 28, 446, size=12, font=F, weight=800, color=MUTED, ls=1.6)
    b.text('Max hangs', x + 28, 466, size=32, font=F, weight=900, color=N, ls=-0.6)
    b.text('20 mm  ·  5 sets  ·  25 min', x + 28, 508, size=16, font=F, weight=700, color=MUTED)
    pill(b, x + 28, 570, 150, 52, 'Start', N, ON_DARK); pill(b, x + 192, 570, 150, 52, 'Change', None, N, stroke='#141A2E33')
    b.rect(x, 680, 500, 84, '#FFFFFF', r=20, stroke='#141A2E14')
    b.rect(x + 16, 696, 52, 52, C['stone'], r=16); icon(b, 'hangboard', x + 28, 708, 28, N)
    b.text('Repeaters', x + 84, 698, size=19, font=F, weight=800, color=N); b.text('Wed  ·  3 of 4 sets', x + 84, 724, size=15, font=F, weight=600, color=MUTED)
    b.rect(x, 790, 500, 84, '#FFFFFF', r=20, stroke='#141A2E14')
    b.text('Streak', x + 24, 812, size=15, font=F, weight=800, color=MUTED); b.text('4 weeks', x + 24, 832, size=24, font=F, weight=900, color=N)
    for i in range(8): b.ellipse(x + 250 + i * 28, 822, 18, 18, N if i < 4 else C['stone'])
    b.rect(x + 100, 910, 300, 64, N, r=32, name='Dock')
    for i, n in enumerate(['house', 'hangboard', 'board-spray', 'calendar-blank']):
        if i == 0: b.rect(x + 108, 916, 66, 52, '#FFFFFF1F', r=26)
        icon(b, n + ('-fill' if i == 0 else ''), x + 126 + i * 72, 927, 30, ON_DARK if i == 0 else ON_DARK_MUTED)

    import ch_systems; ch_systems.accessibility(bk)
    # 28 App icon & splash -------------------------------------------------------
    b = bk.spread(28, 'app-icon', 'App icon & splash', '06 Digital  ·  App icon & launch', bg=C['night'], dark=True)
    b.rect(M, 220, 400, 400, C['glow'], r=96, name='App icon / light'); pitch(b, M + 70, 290, 260, N)
    b.rect(M + 440, 220, 190, 190, N, r=46, stroke='#FFFFFF26', name='App icon / dark'); pitch(b, M + 440 + 35, 255, 120, C['glow'])
    b.rect(M + 440, 430, 190, 190, '#2A2F40', r=46, name='App icon / tinted'); pitch(b, M + 440 + 35, 465, 120, '#C8C5C0')
    for i, s in enumerate([120, 76, 58, 40, 29]):
        x = M + sum([120, 76, 58, 40, 29][:i]) + i * 24
        b.rect(x, 700, s, s, C['glow'], r=s * 0.24); pitch(b, x + s * 0.17, 700 + s * 0.17, s * 0.66, N)
    bk.label(b, 'Light, dark and tinted  ·  120 to 29 px', M, 860)
    bk.body(b, 'The icon is the Hang screen in miniature: the symbol on Glow, nothing else. No wordmark, no gradient, no gloss. Launch screens are Night, so the app opens calm.', M, 900, w=640)
    phone(b, 860, 180, N, lambda q: (pitch(q, 125, 340, 140, C['glow']),))
    def splash2(q):
        q.rect(0, 0, 390, 844, N)
        pitch(q, 125, 300, 140, C['glow']); wordmark(q, 124, 470, 40, ON_DARK)
        q.text('Climb Harder.', 0, 770, w=390, size=16, font=F, weight=800, color=ON_DARK_MUTED, align='center')
    phone(b, 1340, 180, N, splash2)
    b.text('Launch  ·  instant', 860, 1060, w=390, size=15, font=F, weight=700, color=ON_DARK_MUTED, align='center')
    b.text('First run  ·  with name', 1340, 1060, w=390, size=15, font=F, weight=700, color=ON_DARK_MUTED, align='center')

    # 29 App screens ----------------------------------------------------------------
    b = bk.spread(29, 'app-screens', 'App', '06 Digital  ·  App', bg=C['stone'])
    for i, (bg, fn, t) in enumerate([(C['snow'], home, 'Home'), (C['glow'], hang, 'Hang'), (C['glacier'], rest, 'Rest'), (C['snow'], done, 'Ended early')]):
        x = M + 10 + i * 430
        phone(b, x, 170, bg, fn)
        b.text(t, x, 1040, w=390, size=17, font=F, weight=800, color=N, align='center')

    # Dark mode ------------------------------------------------------------------------
    b = bk.spread(0, 'dark', 'Dark mode', '06 Digital  ·  Dark mode', bg=C['night'], dark=True)
    bk.label(b, 'Dark mode', M, 200, color=C['glow'])
    bk.h2(b, 'Same brand,\nlights off', M, 236, size=64)
    toks = [('Background', DARK['bg'], LIGHT['bg']), ('Surface', DARK['surface'], LIGHT['surface']), ('Raised', DARK['raised'], LIGHT['raised']),
            ('Text', DARK['text'], LIGHT['text']), ('Muted', DARK['muted'], LIGHT['muted']), ('Hang', C['glow'], C['glow']), ('Rest', C['glacier'], C['glacier'])]
    b.text('Token', M, 420, size=13, font=F, weight=800, color=ON_DARK_MUTED, ls=1.6, upper=True)
    b.text('Dark', M + 250, 420, size=13, font=F, weight=800, color=ON_DARK_MUTED, ls=1.6, upper=True)
    b.text('Light', M + 450, 420, size=13, font=F, weight=800, color=ON_DARK_MUTED, ls=1.6, upper=True)
    for i, (t, dk, lt) in enumerate(toks):
        y = 456 + i * 74; bk.rule(b, M, y, 600)
        b.text(t, M, y + 24, size=19, font=F, weight=800, color=ON_DARK)
        for j, hx in enumerate((dk, lt)):
            b.rect(M + 250 + j * 200, y + 16, 40, 40, hx, r=12, stroke='#FFFFFF33')
            b.text(hx.upper(), M + 300 + j * 200, y + 26, size=14, font=F, weight=700, color=ON_DARK_MUTED)
    bk.body(b, 'Session states keep their colours in both modes, so colour still tells you where you are: Hang is Glow, Rest is Glacier. Everything around a session goes dark.', M, 990, w=620, size=18)
    for i, (bgc, fn, t) in enumerate([(DARK['bg'], home_dark, 'Home'), (C['glow'], hang, 'Hang'), (DARK['bg'], done_dark, 'Session saved')]):
        k = 0.88; x = 790 + i * 370
        phone(Scaled(b, x, 150, k), 0, 0, bgc, fn)
        b.text(t, x, 920, w=390 * k, size=17, font=F, weight=800, color=ON_DARK, align='center')

    ch_systems.tokens(bk)
    # App Store --------------------------------------------------------------------------
    b = bk.spread(0, 'store', 'App Store', '06 Digital  ·  App Store', bg=C['stone'])
    shots = [('Start in\none tap.', C['snow'], home, C['snow']), ('Read it from\nthe board.', C['night'], hang, C['glow']), ('Rest is part\nof the plan.', C['glacier'], rest, C['glacier']),
             ('Honest\nprogress.', C['snow'], done, C['snow']), ('No ads.\nEver.', C['night'], home_dark, DARK['bg'])]
    for i, (t, bgc, fn, scr) in enumerate(shots):
        x = M + i * 340
        with b.frame(x, 150, 316, 684, bgc, r=28, name='Screenshot') as fr:
            fg = ON_DARK if bgc == C['night'] else C['night']
            b.text(t, x + 24, 186, w=280, size=24, font=F, weight=800, color=fg, lh=1.15, ls=-0.3)
            phone(Scaled(b, x + 38, 300, 0.62), 0, 0, scr, fn)
    bk.body(b, 'Five screenshots, one idea each. A calm title in Nunito ExtraBold 24 pt, top-left, two lines at most. Glow appears once: the hang itself. Store copy follows the voice: no superlatives, no “#1”, no emoji.', M, 880, w=1300, size=19, color=C['night'])
    b.text('Rivet: Hangboard Training', M, 1000, size=26, font=F, weight=900, color=C['night'])
    b.text('Structured hangboard training, made simple.', M, 1036, size=19, font=F, weight=600, color=MUTED)

    # 30 Website hero -----------------------------------------------------------------
    b = bk.spread(30, 'web', 'Website', '06 Digital  ·  Website', bg=C['stone'])
    k = (W - 2 * M) / 1440
    b.rect(M, 150, W - 2 * M, 900, C['snow'], r=24, name='Browser')
    b.rect(M, 150, W - 2 * M, 48, '#EEEBE6', r=[24, 24, 0, 0])
    for i, c in enumerate(['#E2664A', '#E4B660', '#9DAA8C']): b.ellipse(M + 24 + i * 22, 168, 12, 12, c)
    b.rect(M + 700, 160, 280, 28, '#FFFFFF', r=14); b.text('rivet.training', M + 700, 165, w=280, size=14, font=F, weight=700, color=MUTED, align='center')
    with b.frame(M, 198, W - 2 * M, 852, C['snow'], r=[0, 0, 24, 24], name='Viewport'):
        web_landing(Scaled(b, M, 198, k))

    # 31 Website full page + paper ------------------------------------------------------
    b = bk.spread(31, 'web-paper', 'Website, warm paper', '06 Digital  ·  Website on Paper')
    bk.h2(b, 'Snow or Paper', M, 150, size=64)
    bk.body(b, 'The product lives on Snow. Editorial and print may warm up to Paper. The system is identical; only the ground changes.', M, 240, w=520)
    for i, paper in enumerate([False, True]):
        x = 720 + i * 560
        with b.frame(x, 140, 520, 960, '#FFFFFF', r=20, name='Page', stroke='#141A2E1A'):
            web_landing(Scaled(b, x, 140, 520 / 1440), paper)
        bk.label(b, 'Paper  ·  editorial' if paper else 'Snow  ·  product', x, 1112)
    phone(b, M + 60, 400, '#FFFFFF', lambda q: web_mobile(q), shadow=False) if False else None
    from pp import Scaled as S2
    q = S2(b, M + 80, 360, 0.82)
    phone(q, 0, 0, '#FFFFFF', web_mobile)

    # 32 Social -------------------------------------------------------------------------
    b = bk.spread(32, 'social', 'Social', '06 Digital  ·  Social', bg=C['night'], dark=True)
    bk.label(b, 'Social', M, 160, color=C['glow'])
    bk.h2(b, 'Social posts', M, 196, size=56)
    posts = [(M, 330, 'post-photo'), (M + 560, 330, 'post-quote'), (M + 1120, 330, 'post-plan')]
    for x, y, kind in posts:
        with b.frame(x, y, 520, 520, C['glow'], r=20, name='Post / ' + kind):
            if kind == 'post-photo':
                b.image(PH / 'font-rest.jpg', x, y, 520, 520); bk.scrim(b, x, y, 520, 520, to=0.75)
                shade(b, x, y, 520, 520, [(0, 0.7), (120 / 520, 0), (1, 0)])
                lockup(b, x + 36, y + 448, 18, ON_DARK)
                b.text('Rest Harder.', x + 37, y + 478, size=13, font=F, weight=700, color='#F8F6F3CC')
            elif kind == 'post-quote':
                b.image(PH / 'golden-spires.jpg', x, y, 520, 520); bk.scrim(b, x, y, 520, 520, to=0.6)
                lockup(b, x + 36, y + 448, 18, ON_DARK)
                b.text('Climb Harder.', x + 37, y + 478, size=13, font=F, weight=700, color='#F8F6F3CC')
            else:
                b.rect(x, y, 520, 520, C['glacier'])
                b.text('This week’s session', x + 36, y + 36, size=15, font=F, weight=800, color=N, ls=1.5, upper=True)
                b.text('Repeaters', x + 36, y + 80, size=40, font=F, weight=800, color=N, lh=1.0, ls=-0.8)
                for j, (k_, v_) in enumerate([('Hang', '7 s'), ('Rest', '3 s'), ('Reps', '6'), ('Sets', '4')]):
                    yy = y + 200 + j * 58; b.rect(x + 36, yy, 448, 1.5, '#141A2E33')
                    b.text(k_, x + 36, yy + 14, size=20, font=F, weight=700, color=N); b.text(v_, x + 300, yy + 12, w=184, size=22, font=F, weight=800, color=N, align='right')
    b.text('Quiet, like the prints: the photograph carries the post, the lockup and line sit small at the lower left. Useful posts, like a week’s session, are set as plain information, never shouted.', M, 900, w=900, size=19, font=F, weight=500, color=ON_DARK_MUTED, lh=1.5)
    b.rect(1460, 870, 120, 120, N, r=60, stroke='#FFFFFF33', name='Avatar'); pitch(b, 1488, 898, 64, C['glow'])
    b.text('@rivet.training', 1600, 905, size=19, font=F, weight=800, color=ON_DARK); b.text('Climb Harder.', 1600, 935, size=16, font=F, weight=600, color=ON_DARK_MUTED)

def web_mobile(q):
    N = C['night']
    status(q, N)
    lockup(q, 24, 62, 18, N); q.rect(318, 56, 48, 34, None, r=17, stroke='#141A2E33')
    for i in range(2): q.rect(332, 67 + i * 9, 20, 2.5, N, r=1)
    q.text('HANGBOARD TRAINING', 24, 130, size=12, font=F, weight=800, color=book.GLOW_TEXT, ls=1.6)
    q.text('Climb\nHarder.', 20, 152, size=78, font=F, weight=900, color=N, lh=0.92, ls=-2.4)
    q.text('Structured finger training for climbers who’ve stopped getting stronger.', 24, 320, w=330, size=17, font=F, weight=500, color='#2A2F40', lh=1.5)
    q.rect(24, 404, 342, 58, N, r=29); q.text('Get the app', 24, 421, w=342, size=17, font=F, weight=800, color=ON_DARK, align='center')
    q.image(PH / 'layback-corner.jpg', 24, 490, 342, 330, r=28)
