from book import *
import book

DOMAIN = 'rivet.training'
CONTENTS = [('01', 'Brand', 'Idea, manifesto, name, audience, principles, voice, messaging'), ('02', 'Identity', 'Symbol, wordmark, lockups, usage'),
            ('03', 'Colour', 'Alpenglow palette, scales, pairings, states'), ('04', 'Typography', 'Nunito, scales for print and app'),
            ('05', 'Imagery', 'Photography, brief, graphics, icons, motion, sound'), ('06', 'Digital', 'Interface, app, dark mode, web, store, social'),
            ('07', 'Print', 'Posters, stationery, book'), ('08', 'Gear & Goods', 'Hangboard, crimp block, apparel, signage')]

def build(bk):
    # Cover -------------------------------------------------------------------
    b = bk.spread(0, 'cover', 'Cover', None, bg=C['night'], dark=True, folio=False)
    b.image(PH / 'alpenglow-spires.jpg', 0, 0, W, H, name='Cover photo')
    bk.scrim(b, 0, 0, W, H, to=0.85, start=0.35)
    lockup(b, M, M - 8, 64, ON_DARK)
    bk.display(b, 'Climb\nHarder.', M, 690, size=200, lh=0.92)
    bk.label(b, 'Brand Guidelines  ·  Edition 01  ·  November 2026', W - M - 560, H - 104, w=560, align='right', color='#F8F6F3B3')

    # Contents ----------------------------------------------------------------
    b = bk.spread(0, 'contents', 'Contents', 'Contents')
    bk.display(b, 'Inside', M, 150, size=112)
    bk.body(b, 'Everything that makes Rivet look, sound and feel like Rivet, from the reason it exists to the engraving on a crimp block.', M, 290, w=520)
    for i, (n, t, sub) in enumerate(CONTENTS):
        col, row = i // 4, i % 4
        x, y = 840 + col * 500, 160 + row * 210
        bk.rule(b, x, y, 440)
        b.text(n, x, y + 24, size=18, font=F, weight=800, color=book.GLOW_TEXT)
        bk.h2(b, t, x, y + 54, size=40)
        bk.body(b, sub, x, y + 110, w=380, size=17, color=MUTED)
        b.text(f'{book.PAGES.get(n, 0):02d}', x + 380, y + 24, w=60, size=18, font=F, weight=700, color=MUTED, align='right')

    # At a glance --------------------------------------------------------------------
    from screens import phone, hang
    from pp import Scaled
    N = C['night']
    b = bk.spread(0, 'glance', 'Rivet at a glance', 'At a glance')
    bk.h2(b, 'Rivet on one page', M, 150, size=56)
    b.rect(M, 260, 520, 360, C['night'], r=28); lockup(b, M + 100, 410, 56, ON_DARK, C['glow'])
    bk.label(b, 'Symbol and wordmark', M, 636)
    for j, k in enumerate(['night', 'snow', 'glow', 'glacier', 'dusk', 'paper']):
        b.rect(M + 560 + (j % 3) * 120, 260 + (j // 3) * 180, 108, 160, C[k], r=18, stroke='#141A2E14')
    bk.label(b, 'Alpenglow', M + 560, 636)
    b.text('Aa', M + 940, 230, size=300, font=F, weight=900, color=N, ls=-10, lh=1)
    bk.label(b, 'Nunito', M + 940, 636)
    phone(Scaled(b, 1500, 200, 0.62), 0, 0, C['glow'], hang)
    b.image(PH / 'layback-corner.jpg', M, 700, 900, 360, r=28)
    b.rect(M + 940, 700, 400, 70, N, r=35); b.text('Start session', M + 940, 721, w=400, size=22, font=F, weight=800, color=ON_DARK, align='center')
    b.rect(M + 940, 790, 400, 70, None, r=35, stroke=N, sw=1.5); b.text('Change workout', M + 940, 811, w=400, size=22, font=F, weight=800, color=N, align='center')
    b.text('Climb Harder.', M + 940, 900, size=72, font=F, weight=900, color=N, ls=-2)
    bk.label(b, 'Photography  ·  Buttons  ·  The line', M + 940, 1000)

    bk.opener('01', 'brand', 'Brand', 'Why Rivet exists, who it is for\nand how it sounds.', 'aiguilles')

    # Idea ---------------------------------------------------------------------
    b = bk.spread(0, 'idea', 'Brand idea', '01 Brand  ·  Idea', num_light=True)
    b.image(PH / 'chimney-orange.jpg', 960, 0, 960, H, name='Render / chimney')
    bk.label(b, 'The idea', M, 220, color=C['glow'])
    bk.display(b, 'Structure\nfrees you\nto climb.', M, 260, size=104, lh=0.98)
    bk.body(b, 'Most climbers don’t plateau because they don’t try hard enough. They plateau because effort without structure goes in circles.\n\nRivet gives training a shape: what to do, how long, what’s next. That structure clears your head, so the only thing left is the hang in front of you.', M, 640, w=640)

    # Manifesto ------------------------------------------------------------------
    b = bk.spread(0, 'manifesto', 'Manifesto', '01 Brand  ·  Manifesto', bg=C['night'], dark=True)
    bk.label(b, 'What we believe', M, 200, color=C['glow'])
    text = ('Somewhere there is a wall you haven’t climbed yet.\n'
            'It might be a granite corner a thousand metres high, or the last move of the problem you fall off every Tuesday. '
            'Either way, you won’t get there by trying harder. You’ll get there by training better: a plan, a little more rest, '
            'and the patience to show up again next week.\n'
            'We build the tools for that. Quiet tools, made with care, that ask nothing of you except your attention. '
            'Everything else, the mountains, the friends, the fun, is yours.')
    paras = text.split('\n')
    b.text(paras[0], M, 250, w=1500, size=72, font=F, weight=900, color=ON_DARK, lh=1.04, ls=-1.8)
    bk.body(b, paras[1], M, 520, w=760, size=28, color=ON_DARK, lh=1.5)
    bk.body(b, paras[2], 960, 520, w=760, size=28, color=ON_DARK, lh=1.5)
    b.text('Climb Harder.', M, 960, size=48, font=F, weight=900, color=ON_DARK, ls=-1)

    # Riveted (editorial) -------------------------------------------------------------
    b = bk.spread(0, 'riveted', 'Riveted', None, bg=C['night'], dark=True, folio='num')
    b.image(PH / 'chalked-fingers.jpg', 0, 0, W, H, name='Render / fingers')
    b.rect(0, 0, W, H, '#0B0F1C8C', name='Render / shade')
    b.text('7', 1180, 120, w=640, size=760, font=F, weight=900, color=ON_DARK, ls=-30, lh=1, align='right')
    bk.display(b, 'Riveted.', M, 880, size=180)
    bk.body(b, 'Seven seconds. Twenty millimetres. Nothing else.', M, 1080, w=900, size=26, color=ON_DARK, weight=700)

    # Name -------------------------------------------------------------------------
    b = bk.spread(0, 'name', 'The name', '01 Brand  ·  Name', bg=C['night'], dark=True)
    b.text('Rivet  /ˈrɪv.ɪt/  verb', M, 220, size=20, font=F, weight=700, color=ON_DARK_MUTED)
    bk.display(b, 'To hold\nsomeone’s\nattention\ncompletely.', M, 262, size=112, lh=0.98)
    bk.body(b, 'We’re named for that feeling at the end of a hard hang: the world shrinks to your fingertips and a number counting down. Riveted. Nothing else gets in.', 1100, 300, w=640, size=24)
    bk.body(b, 'The name is unexpected for a climbing brand on purpose. It doesn’t describe the sport. It describes how training should feel.', 1100, 560, w=640, size=24)

    # Audience -----------------------------------------------------------------------
    b = bk.spread(0, 'audience', 'Who we are for', '01 Brand  ·  Audience')
    bk.label(b, 'Who we are for', M, 220, color=C['glow'])
    bk.display(b, 'Two years in.\nStuck for six\nmonths.', M, 260, size=96, lh=1.0)
    bk.body(b, 'Our climber loves the sport and climbs twice a week. The beginner gains have stopped. They know they should train, but every timer app they’ve tried is cluttered, full of ads and designed by nobody.', M, 620, w=640)
    rows = [('They want', 'A clear plan. A session they can start in under a minute with chalk on their hands. To feel stronger.'),
            ('They’re tired of', 'Ads between sets. Ugly, noisy apps. Being told to grind harder when what they need is structure.'),
            ('They come back for', 'Calm, honest progress. A tool that feels as well made as their best pair of shoes.')]
    for i, (t, s) in enumerate(rows):
        y = 230 + i * 260
        bk.rule(b, 1000, y, 800)
        b.text(t, 1000, y + 36, size=34, font=F, weight=900, color=C['night'], ls=-0.6)
        bk.body(b, s, 1000, y + 96, w=720, size=23)

    # Principles -----------------------------------------------------------------------
    b = bk.spread(0, 'principles', 'Principles', '01 Brand  ·  Principles')
    bk.display(b, 'Four things we\nnever trade away', M, 150, size=80, lh=1.02)
    pr = [('Riveted', 'Everything serves the moment of effort. Nothing on screen you’d have to read with chalky hands.'),
          ('Structure over grind', 'Progress comes from a plan you can follow and the rest you take, not from suffering more.'),
          ('Think big', 'We train in garages and gyms, but we train for mountains. The brand never forgets where this goes.'),
          ('Made with care', 'Quiet, warm and built to last, like good gear. No ads, no noise, no clutter. Ever.')]
    for i, (t, s) in enumerate(pr):
        x = M + i * 420
        bk.rule(b, x, 470, 380, C['night'])
        b.text(f'0{i+1}', x, 500, size=96, font=F, weight=900, color=C['night'], ls=-3, lh=1)
        b.text(t, x, 700, w=340, size=38, font=F, weight=900, color=C['night'], lh=1.05, ls=-0.8)
        bk.body(b, s, x, 830, w=340, size=19)

    # Voice -----------------------------------------------------------------------------
    b = bk.spread(0, 'voice', 'Voice', '01 Brand  ·  Voice')
    bk.label(b, 'How we sound', M, 220, color=C['glow'])
    bk.display(b, 'A training\npartner who\nbelieves in you.', M, 260, size=96, lh=1.0)
    bk.body(b, 'Short sentences. Plain words. Warm, never hyped. We talk like the friend who spots you on the board: we notice the effort, we’re honest about the result and we already know you’ll be back.', M, 640, w=660)
    traits = [('Short', 'not curt', 'Three words beat ten. Every line must survive a glance from two metres away.'),
              ('Warm', 'not cheesy', 'We encourage like a friend, not a fitness influencer. No exclamation marks in the app.'),
              ('Direct', 'not bossy', 'We say what to do next. We never guilt anyone for resting.'),
              ('Ambitious', 'not elitist', 'Climb harder means your hardest, not anyone else’s.')]
    for i, (a, n, s) in enumerate(traits):
        y = 200 + i * 205
        bk.rule(b, 1000, y, 800)
        b.text(a, 1000, y + 30, size=40, font=F, weight=900, color=C['night'], ls=-0.8)
        b.text(n, 1000, y + 88, size=18, font=F, weight=700, color=book.GLOW_TEXT)
        bk.body(b, s, 1300, y + 36, w=500, size=20)

    # Voice in practice ---------------------------------------------------------------------
    b = bk.spread(0, 'voice-practice', 'Voice in practice', '01 Brand  ·  Voice in practice')
    bk.h2(b, 'Say this, not that', M, 150, size=64)
    rows = [('Starting', 'Hang.', 'GET READY TO CRUSH IT!!! 💪'),
            ('Resting', 'Recover. Next set in 2:41.', 'Recovery period initiated. Please wait.'),
            ('Stopping early', 'Session saved · 3 of 5 sets.\nYou’ll get them next time.', 'Workout incomplete. You failed to finish 2 sets.'),
            ('A good week', 'Four weeks in a row.', 'You’re on fire!! Don’t break your streak!'),
            ('Selling', 'Built by climbers. No ads, ever.', 'Unlock PRO to remove ads and get gains faster.')]
    b.text('We say', 560, 270, size=16, font=F, weight=800, color=C['night'], ls=2, upper=True)
    b.text('We don’t', 1220, 270, size=16, font=F, weight=800, color=MUTED, ls=2, upper=True)
    for i, (ctx, yes, no) in enumerate(rows):
        y = 310 + i * 140
        bk.rule(b, M, y, W - 2 * M)
        bk.label(b, ctx, M, y + 34)
        b.ellipse(520, y + 38, 14, 14, C['night'])
        b.text(yes, 560, y + 26, w=600, size=30, font=F, weight=800, color=C['night'], lh=1.2, ls=-0.4)
        b.text(no, 1220, y + 30, w=560, size=22, font=F, weight=500, color='#9C9EA2', lh=1.3)
        b.rect(1220, y + 44, min(560, bk.d.measure(no.split(chr(10))[0], F, 500, 22) + 4), 2, '#9C9EA2', name='Strike')
    bk.body(b, '“Allez!” is for your friends under the board. Rivet itself stays calm everywhere, on the wall and in the app, so the climber can be loud.', M, 1036, w=1300, size=18, color=MUTED)

    # Messaging & naming -----------------------------------------------------------------------
    b = bk.spread(0, 'messaging', 'Messaging & naming', '01 Brand  ·  Messaging & naming')
    bk.h2(b, 'What we say about ourselves', M, 150, size=64)
    blocks = [('Positioning', 'For climbers who’ve stopped getting stronger, Rivet is the training brand that turns effort into structure, so every session moves you forward.'),
              ('One line', 'Structured hangboard training, made simple.'),
              ('Boilerplate', f'Rivet makes training tools for climbers: an app that builds and runs hangboard sessions, and the boards, blocks and books to go with it. No ads, no accounts, no noise. Made in Sweden. {DOMAIN}')]
    for i, (t, s) in enumerate(blocks):
        y = 290 + i * 190
        bk.rule(b, M, y, 820)
        bk.label(b, t, M, y + 28, color=C['glow'])
        bk.body(b, s, M, y + 62, w=820, size=22 if i != 1 else 30, weight=500 if i != 1 else 800, color=C['night'])
    bk.label(b, 'The line', 1080, 300, color=C['glow'])
    b.text('Climb Harder.', 1080, 336, size=64, font=F, weight=900, color=C['night'], ls=-1.6)
    bk.body(b, 'Title case, full stop when it stands alone. It signs off posters, packaging and campaigns. It never appears inside a training session, and we never shout it in capitals.', 1080, 430, w=700, size=19)
    bk.label(b, 'Naming', 1080, 640, color=C['glow'])
    names = [('Products', 'Rivet Board  ·  Rivet Block  ·  Rivet Bag'), ('Publishing', 'Field Notes, numbered: Field Notes Vol. 1'), ('Workouts', 'Plain names: Max hangs, Repeaters, Density hangs'), ('Never', 'Rivet Pro, Rivet+, RivetX, numbers as hype')]
    for i, (k, v) in enumerate(names):
        y = 680 + i * 74; bk.rule(b, 1080, y, 700)
        b.text(k, 1080, y + 22, size=18, font=F, weight=800, color=C['night'])
        b.text(v, 1290, y + 22, w=490, size=18, font=F, weight=600, color=TXT)
