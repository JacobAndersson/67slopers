import re
import book
from pathlib import Path
from book import *

ICONS = Path(__file__).resolve().parents[1] / 'icons'
def icon(b, name, x, y, size, color):
    d = ' '.join(re.findall(r' d="([^"]+)"', (ICONS / f'{name}.svg').read_text()))
    b.path(d, x, y, size / 256, fill=color, name='Icon / ' + name)

def build(bk):
    bk.opener('05', 'imagery', 'Imagery', 'Grand places, honest effort\nand a shape that always steps up.', 'dark-ridge')
    # 22 Photography principles ----------------------------------------------
    b = bk.spread(22, 'photo', 'Photography', '05 Imagery  ·  Photography', bg=C['night'], dark=True, num_light=True)
    b.image(PH / 'red-crack.jpg', 1100, 0, 820, H, name='Render / photo')
    bk.label(b, 'Photography', M, 220, color=C['glow'])
    bk.display(b, 'Just you\nand the rock.', M, 260, size=104)
    pr = [('Far or close', 'Either the place dwarfs the person, or we are close enough to feel the edge. Nothing in between.'),
          ('Exposure', 'Shoot from above or far away. Feel the air under the climber.'),
          ('First and last light', 'Warm, low sun; alpenglow; long shadows. Never flat noon.'),
          ('Real effort', 'No posing, no studio, no brand-new gear. Chalk, tape, worn rock.')]
    for i, (t, s) in enumerate(pr):
        x, y = M + (i % 2) * 460, 600 + (i // 2) * 220
        bk.rule(b, x, y, 420)
        b.text(f'0{i+1}  {t}', x, y + 26, size=24, font=F, weight=900, color=ON_DARK)
        bk.body(b, s, x, y + 70, w=400, size=18)

    # 23 Photography grid ------------------------------------------------------
    b = bk.spread(23, 'photo-grid', 'Photography in use', '05 Imagery  ·  Photography in use')
    bk.h2(b, 'Grand places, real effort', M, 150, size=64)
    grid = [('golden-spires', M, 280, 900, 520), ('font-friends', 1040, 280, 370, 250), ('chalk-hands', 1430, 280, 370, 250),
            ('garage-board', 1040, 550, 370, 250), ('chalked-fingers', 1430, 550, 370, 250),
            ('crack-granite', M, 820, 440, 200), ('above-blue', 580, 820, 440, 200)]
    for n, x, y, w, h in grid: b.image(PH / f'{n}.jpg', x, y, w, h, r=20)
    bk.label(b, 'Colour grade', 1040, 830, color=C['glow'])
    bk.body(b, 'Warm highlights, deep cool shadows, a little lifted black. Let reds and pinks in the rock sing. Never add filters or fake light leaks.', 1040, 866, w=760, size=18)
    bk.label(b, 'Placeholders  ·  Wikimedia Commons and Flickr, credited at the back', 1040, 990)

    import ch_systems; ch_systems.photo_rules(bk)
    # Photography brief --------------------------------------------------------
    b = bk.spread(0, 'photo-brief', 'Photography brief', '05 Imagery  ·  Commissioning brief')
    bk.h2(b, 'The first shoot', M, 150, size=64)
    bk.body(b, 'Every photograph in this book is a placeholder. This is the brief for the first commissioned shoot: two days, one alpine location, one board.', M, 240, w=900)
    shots = [('01', 'The corner', 'Climber in a layback, shot from directly above. 24 mm, the ground far below. Evening light.'),
             ('02', 'The summit', 'A granite peak at alpenglow, no people. Vertical, room at the foot for the lockup.'),
             ('03', 'The board', 'A home board in a garage at night. One warm lamp, chalk in the air, hands only.'),
             ('04', 'The rest', 'Two friends sitting under a project, backs to camera. The quiet between attempts.'),
             ('05', 'The hands', 'Taped fingers on a 20 mm edge, macro. Wood grain and skin texture sharp.'),
             ('06', 'The approach', 'A tiny figure walking towards a big wall at first light. Scale above all.')]
    for i, (n, t, d_) in enumerate(shots):
        x, y = M + (i % 3) * 570, 340 + (i // 3) * 340
        b.image(PH / f"{['layback-corner','alpenglow-spires','garage-board','font-rest','chalked-fingers','golden-spires'][int(n)-1]}.jpg", x, y - 20, 530, 150, r=14)
        b.text(n, x, y + 146, size=18, font=F, weight=800, color=book.GLOW_TEXT)
        b.text(t, x + 50, y + 142, size=28, font=F, weight=900, color=C['night'])
        bk.body(b, d_, x, y + 192, w=500, size=18)
    bk.body(b, 'Deliver: RAW and graded JPEG, 6000 px long edge, model releases for every face. Grade warm highlights, cool shadows. No drones over crags where they are banned. Reference frames above are placeholders.', M, 1000, w=1500, size=17, color=MUTED)

    # 24 Graphic language -----------------------------------------------------
    b = bk.spread(24, 'graphics', 'Graphic language', '05 Imagery  ·  Graphic language')
    bk.h2(b, 'Everything steps up', M, 150, size=64)
    bk.body(b, 'Our one graphic device is the plain rounded bar: full round ends, generous weight. It carries progress, history and time. The Pitch symbol itself stays the logo.', M, 240, w=860)
    # tile 1: progress
    tiles = [(M, 'Progress'), (M + 570, 'Your season'), (M + 1140, 'Session timeline')]
    for x, t in tiles:
        b.rect(x, 380, 540, 420, '#FFFFFF', r=28, stroke='#141A2E14', name='Tile / ' + t); bk.label(b, t, x + 32, 412)
    for i in range(5):
        b.rect(M + 40, 480 + i * 56, 460, 22, C['stone'], r=11); b.rect(M + 40, 480 + i * 56, 460 * [1, 1, 0.66, 0.2, 0][i] or 0.01, 22, C['night'] if i < 3 else C['granite'], r=11)
    vals = [1.6, 0.9, 2.1, 1.2, 2.6, 1.5, 2.3]
    from brand import SCALES
    SCALES_G = [SCALES['glacier'][4]] * 6 + [N_ := C['night']]
    for i, v in enumerate(vals):
        x = M + 600 + i * 66; h = 50 + v * 75
        b.rect(x, 760 - h, 44, h, SCALES_G[i], r=22, name='Week')
        b.text(f'W{i+1}', x, 770, w=44, size=13, font=F, weight=800, color=MUTED, align='center')
    segs = [('h', 60, 'Hang'), ('r', 40, 'Rest'), ('h', 60, ''), ('r', 40, ''), ('h', 60, ''), ('R', 140, 'Recover')]
    xx = M + 1140 + 36
    for k, w, t in segs:
        w *= 1.09
        b.rect(xx, 560, w, 40, {'h': C['night'], 'r': C['glacier'], 'R': C['snow']}[k], r=20, stroke='#141A2E33' if k == 'R' else None, name='Segment')
        if t: b.text(t, xx, 616, size=14, font=F, weight=800, color=MUTED)
        xx += w + 6
    bk.body(b, 'Bars are plain and rounded; time runs left to right. The Pitch symbol is never a pattern, a chart or an ornament. We don’t use illustration: we photograph, and we diagram.', M, 1040, w=1300, size=17, color=MUTED)
    bk.label(b, 'Corners', M, 850, color=C['glow'])
    for i, (r, t) in enumerate([(999, 'Pill  ·  half the height'), (28, '28 px  ·  cards, tiles'), (34, '24% of width  ·  app icon'), (12, '12 px  ·  inputs')]):
        x = M + i * 430
        b.rect(x, 890 + (20 if i == 0 else 0), 140, 80 if i == 0 else 120, C['night'] if i == 0 else C['glacier'], r=40 if i == 0 else (34 if i == 2 else r), name='Corner')
        b.text(t, x + 160, 930, w=250, size=17, font=F, weight=700, color=C['night'], lh=1.3)

    # 25 Iconography ------------------------------------------------------------
    b = bk.spread(25, 'icons', 'Iconography', '05 Imagery  ·  Iconography')
    bk.h2(b, 'Icons', M, 150, size=64)
    bk.body(b, 'Phosphor Regular for the interface, Fill for the selected tab, Bold only for timer controls. Where Phosphor has no icon for climbing, we draw our own on its grid. Night, or Snow on dark. Never Glow.', M, 240, w=620)
    names = ['hangboard', 'board-spray', 'timer', 'barbell', 'calendar-blank', 'list-checks', 'trend-up', 'target', 'medal', 'clock', 'bell', 'plus',
             'qr-code', 'share-network', 'speaker-high', 'vibrate', 'gear-six', 'house', 'moon-stars', 'arrow-counter-clockwise']
    for i, n in enumerate(names):
        x, y = 860 + (i % 5) * 190, 200 + (i // 5) * 190
        b.rect(x, y, 170, 170, '#FFFFFF', r=24, stroke='#141A2E14', name='Icon cell')
        icon(b, n, x + 53, y + 40, 64, C['night'])
        if n in ('hangboard', 'board-spray'): b.rect(x + 8, y + 8, 46, 22, C['night'], r=11); b.text('Rivet', x + 8, y + 11, w=46, size=11, font=F, weight=800, color=ON_DARK, align='center')
        b.text({'board-spray': 'board', 'arrow-counter-clockwise': 'restart', 'hand-grabbing': 'grip', 'calendar-blank': 'calendar', 'list-checks': 'plan', 'share-network': 'share', 'speaker-high': 'sound', 'moon-stars': 'rest day', 'trend-up': 'progress', 'medal': 'award', 'bell': 'reminder', 'gear-six': 'settings'}.get(n, n), x, y + 128, w=170, size=13, font=F, weight=700, color=MUTED, align='center')
    b.rect(M, 640, 620, 220, C['night'], r=28, name='Controls')
    for i, n in enumerate(['arrow-counter-clockwise', 'pause', 'skip-forward']):
        cx = M + 90 + i * 190
        if i == 1: b.ellipse(cx - 20, 690, 120, 120, ON_DARK)
        icon(b, n + '-bold', cx + 8, 718, 64, C['night'] if i == 1 else ON_DARK)
    bk.label(b, 'Timer controls  ·  64 pt targets', M, 890)

    # 26 Motion -------------------------------------------------------------------
    b = bk.spread(26, 'motion', 'Motion', '05 Imagery  ·  Motion', bg=C['night'], dark=True)
    bk.label(b, 'Motion', M, 220, color=C['glow'])
    bk.display(b, 'Lift,\nthen settle.', M, 260, size=104)
    bk.body(b, 'Things move like a body on a hold: a confident lift, a soft catch. Springs, not linear tweens. Nothing bounces for fun, and everything respects reduced motion. Masters: motion/rivet-loading.svg and motion/rivet-startup.svg.', M, 520, w=600)
    specs = [('Spring', 'stiffness 380 · damping 32'), ('Quick', '160 ms  ·  taps, toggles'), ('Settle', '320 ms  ·  sheets, screens'), ('Reduced motion', 'crossfade 120 ms, no lift')]
    for i, (k, v) in enumerate(specs):
        y = 760 + i * 64; bk.rule(b, M, y, 600)
        b.text(k, M, y + 20, size=19, font=F, weight=800, color=ON_DARK)
        b.text(v, M + 260, y + 20, w=340, size=17, font=F, weight=600, color=ON_DARK_MUTED, align='right')
    bk.label(b, 'Loading  ·  bars lift in turn, 1.2 s loop', 860, 220)
    frames = [(0, 0, 0), (10, 0, 0), (-2, 10, 0), (0, -2, 10), (0, 0, -2), (0, 0, 0)]
    for i, lf in enumerate(frames):
        x = 860 + i * 160
        b.rect(x, 260, 144, 160, '#FFFFFF0D', r=20)
        pitch(b, x + 22, 290, 100, '#FFFFFF40', stroke=1.5, name='Rest position')
        pitch(b, x + 22, 290, 100, ON_DARK, lifts=lf)
        b.text(f'{i * 240} ms', x, 432, w=144, size=13, font=F, weight=700, color=ON_DARK_MUTED, align='center')
    bk.label(b, 'Startup  ·  bars rise from the baseline, the name follows', 860, 520)
    for i in range(5):
        x = 860 + i * 192
        b.rect(x, 560, 176, 300, '#0B0F1C', r=24, stroke='#FFFFFF26')
        t = i / 4
        if i == 0: pass
        elif i < 3:
            parts = brand.pitch_parts(h=58 * min(1, t * 2), y0=7 + 58 * (1 - min(1, t * 2)) + 28)
            pitch(b, x + 48, 640, 80, C['glow'], parts=parts)
        else:
            pitch(b, x + 48, 640 - (i - 2) * 16, 80, C['glow'])
            if i == 4: wordmark(b, x + 46, 760, 26, ON_DARK)
        b.text(['0', '200', '400', '620', '1050'][i] + ' ms', x, 872, w=176, size=13, font=F, weight=700, color=ON_DARK_MUTED, align='center')

def build_sound(bk):
    b = bk.spread(0, 'sound', 'Sound & haptics', '05 Imagery  ·  Sound & haptics', bg=C['night'], dark=True)
    bk.label(b, 'Sound & haptics', M, 200, color=C['glow'])
    bk.display(b, 'You hear\nRivet more\nthan you see it.', M, 240, size=88, lh=1.0)
    bk.body(b, 'Mid-hang, your eyes are on the edge. The beep and the buzz are the brand. Four cues, all soft sine tones, never alarms. Every cue has a haptic twin so the app works on mute.', M, 600, w=620)
    cues = [('Get ready', 'Screen counts 3 · 2 · 1', [(660, 60), (660, 60), (660, 60)], 'Light tap each second'),
            ('Hang', 'Screen says “Hang.”', [(880, 180)], 'One heavy tap'),
            ('Rest', 'Screen says “Rest.”', [(660, 160)], 'Two light taps'),
            ('Session done', 'Three rising notes', [(523, 140), (659, 140), (784, 260)], 'Rising triple tap')]
    for i, (t, s_, notes, hap) in enumerate(cues):
        y = 200 + i * 220; x = 960
        bk.rule(b, x, y, 840)
        b.text(t, x, y + 30, size=30, font=F, weight=900, color=ON_DARK)
        b.text(s_, x, y + 74, size=17, font=F, weight=700, color=ON_DARK_MUTED)
        b.text(hap, x, y + 104, size=17, font=F, weight=700, color=ON_DARK_MUTED)
        for j, (hz, ms) in enumerate(notes):
            h = (hz - 400) * 0.22; bx = x + 420 + j * 120
            b.rect(bx, y + 150 - h * 0.3, ms * 0.45, 20 + h * 0.3, ON_DARK if t == 'Hang' else C['glacier'], r=4, name='Note')
            b.text(f'{hz} Hz · {ms} ms', bx, y + 178, size=12, font=F, weight=700, color=ON_DARK_MUTED)
    bk.body(b, 'The finishing cue is three notes, each a step higher than the last: the idea of the symbol, heard rather than seen.', M, 940, w=640, size=20, color=ON_DARK)
