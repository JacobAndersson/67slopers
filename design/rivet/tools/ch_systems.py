"""System spreads added after review: signatures, data viz, grids, photo do/don't, accessibility, tokens."""
from book import *
from brand import SCALES
from screens import phone, hang, home, LIGHT, DARK, icon

N = C['night']

def signatures(bk):
    b = bk.spread(0, 'signatures', 'Signatures', '02 Identity  ·  Signatures')
    bk.h2(b, 'Three things only Rivet does', M, 150, size=64)
    bk.body(b, 'A logo is not a brand. These three carry Rivet when the logo is nowhere in sight.', M, 240, w=900)
    cols = [(M, 'The step', 'Layouts climb, like the bars. Chapter openers set the caption low-left, the title in the middle and the number high-right, each on a short rule. Any layout with three parts may climb the same way.'),
            (M + 570, 'The lift', 'Everything that arrives rises 8 px and settles on a spring. Loading lifts the three bars in turn; nothing slides in from the side.'),
            (M + 1140, 'The colour of the hang', 'Glow appears only while someone hangs. A phone glowing under a board, seen across the gym, is Rivet with no logo at all. That is why Glow is kept for the hang.')]
    for x, t, s in cols:
        b.rect(x, 360, 540, 400, '#FFFFFF', r=28, stroke='#141A2E14', name='Signature / ' + t)
        bk.rule(b, x, 800, 540)
        b.text(t, x, 824, size=34, font=F, weight=900, color=N, ls=-0.6)
        bk.body(b, s, x, 880, w=520, size=18)
    # the step: a chapter opener in miniature
    ox, oy = M + 40, 400
    b.rect(ox, oy, 460, 288, N, r=14, name='Opener')
    b.rect(ox + 28, oy + 222, 22, 3, ON_DARK, r=1.5, name='Step rule'); b.text('A caption, low', ox + 28, oy + 234, size=12, font=F, weight=600, color=ON_DARK)
    b.text('Identity', ox + 160, oy + 112, size=40, font=F, weight=900, color=ON_DARK, ls=-1)
    b.text('02', ox + 340, oy + 36, w=92, size=40, font=F, weight=900, color=ON_DARK, ls=-1.2, align='right', lh=1)
    b.rect(ox + 410, oy + 26, 22, 3, ON_DARK, r=1.5, name='Step rule')
    # the lift: before/after bars
    pitch(b, M + 570 + 90, 470, 160, N)
    pitch(b, M + 570 + 290, 450, 160, N, lifts=(0, 8, 0))
    b.text('rest', M + 570 + 130, 660, size=14, font=F, weight=800, color=MUTED); b.text('lift', M + 570 + 340, 660, size=14, font=F, weight=800, color=MUTED)
    # the colour of the hang: a phone in Glow, under a dark board
    gx = M + 1140
    b.rect(gx + 40, 400, 460, 320, '#0B0F1C', r=18, name='Gym at night')
    b.rect(gx + 110, 430, 320, 40, '#2A2F40', r=8, name='Board')
    b.rect(gx + 220, 520, 100, 170, C['glow'], r=16, name='Phone / Hang')
    b.text('7', gx + 220, 560, w=100, size=72, font=F, weight=900, color=N, align='center', lh=1)

def dataviz(bk):
    b = bk.spread(0, 'dataviz', 'Data visualisation', '03 Colour  ·  Data visualisation')
    bk.h2(b, 'Charts that read at a glance', M, 150, size=64)
    bk.body(b, 'Training data is personal and small: a week, a season, a grade. Charts use Night for the climber, Glacier and Dusk for comparison, and never Glow. One idea per chart, labels on the data, no legends.', M, 240, w=1000)
    # categorical
    bk.label(b, 'Categorical palette  ·  max four series', M, 400)
    cats = [('Hangs', N), ('Board', SCALES['dusk'][3]), ('Climbing', SCALES['glacier'][4]), ('Rest', C['stone'])]
    for i, (t, c) in enumerate(cats):
        b.rect(M + i * 150, 440, 130, 60, c, r=12); b.text(t, M + i * 150, 512, size=15, font=F, weight=800, color=N)
    bk.label(b, 'Sequential  ·  Glacier 100 to 700', M, 600)
    for i, c in enumerate(SCALES['glacier']):
        b.rect(M + i * 84, 640, 76, 60, c, r=10)
    # example chart: season load, stacked, square-ended bars
    x0, y0 = 1000, 420
    b.rect(x0, y0 - 20, 800, 560, '#FFFFFF', r=28, stroke='#141A2E14')
    b.text('Training per week, minutes', x0 + 32, y0 + 4, size=22, font=F, weight=900, color=N)
    weeks = [(12, 8, 20), (14, 6, 22), (16, 10, 18), (10, 4, 26), (18, 12, 20), (20, 10, 24), (22, 14, 18), (14, 6, 28)]
    for i, (hg, bd, cl) in enumerate(weeks):
        x = x0 + 60 + i * 80; yb = y0 + 450
        tot = (hg + bd + cl) * 4.2
        with b.frame(x, yb - tot, 56, tot, None, r=28, name='Bar'):   # one pill per week, segments inside
            for v, c in ((cl, SCALES['glacier'][4]), (bd, SCALES['dusk'][3]), (hg, N)):
                h = v * 4.2; yb -= h; b.rect(x, yb, 56, h, c); b.rect(x, yb, 56, 3, '#FFFFFF', name='Gap')
        b.text(f'W{i+1}', x, y0 + 462, w=56, size=13, font=F, weight=800, color=MUTED, align='center')
    b.text('54', x0 + 60 + 6 * 80, y0 + 450 - 54 * 4.2 - 26, w=56, size=15, font=F, weight=900, color=N, align='center')
    # labels on the data, beside the last week: no legend
    hg, bd, cl = weeks[-1]; xl = x0 + 60 + 7 * 80 + 66; yb = y0 + 450
    for v, t in ((cl, 'Climbing'), (bd, 'Board'), (hg, 'Hangs')):
        h = v * 4.2; b.text(t, xl, yb - h / 2 - 10, size=13, font=F, weight=800, color=N); yb -= h

def grids(bk):
    b = bk.spread(0, 'grids', 'Layout grids', '04 Typography  ·  Layout grids')
    bk.h2(b, 'Grids', M, 150, size=64)
    bk.body(b, 'Print uses 12 columns with margins of one twelfth of the short edge. Screens use a 4 pt base: 24 pt margins on phones, 12 columns on the web with 64 px margins. The step grid sits on top: three baselines, one unit apart.', M, 240, w=1000)
    # poster grid
    px, py, pw, ph = M, 400, 400, 600
    b.rect(px, py, pw, ph, '#FFFFFF', stroke='#141A2E26', name='Poster')
    m = pw / 12
    for i in range(12): b.rect(px + m + i * (pw - 2 * m) / 12 + 2, py + m, (pw - 2 * m) / 12 - 4, ph - 2 * m, '#C3DCE566')
    for i, yy in enumerate([ph - m - 60, ph - m - 120, ph - m - 180]): b.rect(px + m, py + yy, pw - 2 * m, 1.5, '#141A2E80')
    bk.label(b, 'Poster  ·  50 × 70 cm', px, py + ph + 20)
    # phone grid
    qx, qy = M + 480, 400
    b.rect(qx, qy, 290, 600, '#FFFFFF', r=40, stroke='#141A2E26')
    for i in range(4): b.rect(qx + 18 + i * 66, qy + 20, 56, 560, '#C3DCE566', r=4)
    for yy in range(0, 600, 24): b.rect(qx + 6, qy + yy, 278, 0.8, '#141A2E14')
    bk.label(b, 'Phone  ·  4 columns, 4 pt base', qx, qy + 620)
    # web grid
    wx, wy = M + 850, 400
    b.rect(wx, wy, 830, 520, '#FFFFFF', r=16, stroke='#141A2E26')
    for i in range(12): b.rect(wx + 37 + i * 63.8, wy + 20, 56, 480, '#C3DCE566', r=4)
    b.text('Climb\nHarder.', wx + 40, wy + 60, size=72, font=F, weight=900, color=N, lh=0.92, ls=-2)
    b.rect(wx + 420, wy + 40, 380, 300, '#141A2E1F', r=20)
    bk.label(b, 'Web  ·  12 columns, 1440 wide', wx, wy + 540)

def photo_rules(bk):
    b = bk.spread(0, 'photo-dos', 'Photography do and don’t', '05 Imagery  ·  Photography do and don’t')
    bk.h2(b, 'Choosing a photograph', M, 150, size=64)
    dos = [('aiguilles', 'Do: a big place, a small person, or nobody at all.'), ('chalked-fingers', 'Do: real effort, close enough to feel the edge.'), ('font-rest', 'Do: the quiet between attempts.')]
    donts = [('gym-wall', 'Don’t: busy gyms with nowhere for the eye to rest.'), ('spires-sky', 'Don’t: flat noon light and empty blue skies.'), ('el-cap', 'Don’t: the tourist snapshot. Eye level, midday, from the car park.')]
    for row, items in enumerate((dos, donts)):
        for i, (ph_, t) in enumerate(items):
            x, y = M + i * 570, 280 + row * 420
            b.image(PH / f'{ph_}.jpg', x, y, 540, 300, r=20)
            if row: b.rect(x, y, 540, 300, '#F8F6F399', r=20)
            b.ellipse(x + 20, y + 20, 34, 34, N)
            if row: b.path('M0 0 L12 12 M12 0 L0 12', x + 31, y + 31, 1, stroke=ON_DARK, sw=2.5)
            else: b.path('M0 6 L5 11 L13 1', x + 30, y + 31, 1, stroke=ON_DARK, sw=2.5)
            bk.body(b, t, x, y + 314, w=540, size=17, color=N, weight=700)

def accessibility(bk):
    b = bk.spread(0, 'accessibility', 'Accessibility', '06 Digital  ·  Accessibility')
    bk.h2(b, 'Usable mid-hang, by everyone', M, 150, size=64)
    b.text('64', 1400, 90, w=400, size=240, font=F, weight=900, color=N, ls=-8, align='right', lh=1)
    b.text('pt targets for anything touched mid-session', 1300, 340, w=500, size=18, font=F, weight=700, color=MUTED, align='right')
    rules = [('Targets', '64 pt for anything touched during a session, 48 pt elsewhere. Controls sit in the bottom third, reachable with a thumb.'),
             ('Not colour alone', 'Every state has a word as well as a colour: Hang, Rest, Recover. Colour-blind climbers read the word.'),
             ('Feel and sound', 'Every visual cue has a haptic and a sound twin, so the app works with your eyes on the edge.'),
             ('Type that grows', 'Dynamic Type and Android font scaling up to 200%. The timer never truncates; it steps down a size.'),
             ('Reduced motion', 'Lifts become 120 ms crossfades. The loading bars fade instead of moving.'),
             ('Screen readers', 'The timer announces phase changes, not every second: “Hang, set 2 of 5.” Icons always have labels.')]
    for i, (t, s) in enumerate(rules):
        x, y = M + (i % 3) * 570, 440 + (i // 3) * 300
        bk.rule(b, x, y, 540)
        b.text(f'0{i+1}', x, y + 24, size=18, font=F, weight=800, color=MUTED)
        b.text(t, x, y + 60, size=30, font=F, weight=900, color=N, ls=-0.5)
        bk.body(b, s, x, y + 112, w=520, size=20)

def tokens(bk):
    b = bk.spread(0, 'tokens', 'Design tokens', '06 Digital  ·  Design tokens')
    bk.h2(b, 'Tokens, as the code names them', M, 150, size=64)
    bk.body(b, 'One source of truth, exported to CSS variables, Tailwind, Swift and Kotlin. Names describe the job, not the colour, so dark mode only swaps values.', M, 240, w=900)
    b.rect(1180, 120, 620, 220, C['night'], r=24, name='Code')
    b.text(':root {\n  --state-hang: #F28C6E;\n  --action: var(--night);\n  --radius-pill: 999px;\n}', 1220, 150, size=20, font=F, weight=700, color=ON_DARK, lh=1.5)
    rows = [('color.canvas', 'Snow', '#0B0F1C', '--canvas'), ('color.surface', '#FFFFFF', 'Night', '--surface'), ('color.text', 'Night', 'Snow', '--text'),
            ('color.text.muted', 'Granite', 'Night 300', '--text-muted'), ('color.action', 'Night', 'Snow', '--action'), ('color.state.hang', 'Glow', 'Glow', '--state-hang'),
            ('color.state.rest', 'Glacier', 'Glacier', '--state-rest'), ('radius.pill', 'height ÷ 2', '', '--radius-pill'), ('radius.card', '28', '', '--radius-card'),
            ('motion.lift', '8 px, spring 380/32', '', '--lift'), ('type.timer', 'Nunito 900, tnum', '', '--type-timer')]
    for j, h in enumerate(['Token', 'Light', 'Dark', 'CSS']):
        b.text(h, [M, M + 520, M + 900, M + 1280][j], 360, size=13, font=F, weight=800, color=MUTED, ls=1.6, upper=True)
    for i, (t, l, d, css) in enumerate(rows):
        y = 396 + i * 54; bk.rule(b, M, y, W - 2 * M)
        b.text(t, M, y + 14, size=20, font=F, weight=800, color=N)
        b.text(l, M + 520, y + 14, size=20, font=F, weight=600, color=TXT)
        b.text(d, M + 900, y + 14, size=20, font=F, weight=600, color=TXT)
        b.text(css, M + 1280, y + 14, size=20, font=F, weight=700, color=N)
