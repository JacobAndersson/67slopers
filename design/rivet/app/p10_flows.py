"""Page 10: the journeys, as storyboards of the real screens at half size."""
from doc import Board
from pp import Scaled
from ui import F, NIGHT, GRANITE, LIGHT, GLOW, GLACIER, W, H, SNOW
import pagekit
import screens_home as Ho
import screens_timer as Ti
import screens_builder as Bu
import screens_climb as Cl
import screens_log as Lo
import screens_share as Sh

K = 0.5
FLOWS = [
    ('Start in one tap', 'Home already knows what you did last. Play starts the countdown; the timer saves the session the moment it stops.',
     [('Home', lambda q, T: Ho.home(q, T), None, 'Tap play'), ('Get ready', Ti.prep, '#E4E0DA', 'Tone and a tap at each change'), ('Hang', Ti.hang, GLOW, 'Deeper Glow rises as it runs'),
      ('Rest', Ti.rest, GLACIER, 'Six reps a set'), ('Recover', Ti.recover, None, 'Between sets'), ('Done', Ti.finish, NIGHT, 'The bars rise'), ('Session saved', Ti.done, None, 'Grade it, Finish')]),
    ('First run', 'Three classics are already in the library. The first hang is one tap from opening the app.',
     [('Launch', lambda q, T: Sh.launch(q, T, True), NIGHT, 'Night, Glow symbol'), ('Home · first', lambda q, T: Ho.home(q, T, 'first'), None, 'Start'),
      ('Get ready', Ti.prep, '#E4E0DA', 'Start counts down at once'), ('Hang', Ti.hang_first, GLOW, 'One tap in')]),
    ('Build a workout', 'Steps and repeats, edited in place. Drag anything anywhere; the total updates as you go.',
     [('Hang', Ho.hang_tab, None, 'Tap +'), ('New workout', lambda q, T: Bu.builder(q, T, 'new'), None, 'Tap a step'),
      ('Step open', lambda q, T: Bu.builder(Scaled(q.b, q.ox, q.oy - 560 * K, K), T, 'edit', open_step='hang'), None, 'Set length, grip'), ('Choose grip', Bu.hold_picker, None, 'Use this grip'),
      ('Overview', Bu.overview, None, 'Saved')]),
    ('On the board', 'Set up once, connect the lights, then browse problems with the wall following along.',
     [('Climb', Cl.intro, None, 'Set up'), ('Layout', lambda q, T: Cl.setup(q, T, 'layout'), None, '3 steps'), ('Got lights?', Cl.lights_prompt, None, 'Connect'),
      ('Searching', lambda q, T: Cl.connect(q, T, 'searching'), None, 'Seconds'), ('Problems', Cl.climb_list, None, 'Pick one'),
      ('Lit', lambda q, T: Cl.problem(q, T, lit=True), None, 'Count tries'), ('Log a send', Cl.log_send, None, 'Saved')]),
    ('Share a workout', 'A QR code on one phone, the camera on another. No account, no internet.',
     [('Overview', Bu.overview, None, 'Share'), ('Share', Sh.share, None, 'Show the code'), ('Scan', Sh.scan, NIGHT, 'Other phone'),
      ('Shared workout', Sh.import_workout, None, 'Save or Start')]),
]


def build(doc, index):
    p = pagekit.Page(doc, '10 Flows', 'flows')
    p.heading('Flows', 'The journeys that matter most, drawn with the real screens at half size.')
    for i, (title, note, steps) in enumerate(FLOWS):
        sw, sh = W * K, H * K
        bw = 80 + len(steps) * sw + (len(steps) - 1) * 64
        b = Board(doc, p.pid, f'app/flows/{i}', f'Flow / {title}', 0, p.y, bw, sh + 220, bg='#FFFFFF')
        b.text(title, 40, 32, size=32, font=F, weight=900, color=NIGHT)
        b.text(note, 40, 78, w=900, size=16, font=F, weight=600, color=GRANITE, lh=1.4)
        for j, (nm, fn, bg, act) in enumerate(steps):
            x = 40 + j * (sw + 64); y = 130
            b.rect(x - 1, y - 1, sw + 2, sh + 2, None, r=20, stroke='#141A2E22')
            with b.frame(x, y, sw, sh, bg or LIGHT['canvas'], r=20, name=f'Step / {nm}'):
                fn(Scaled(b, x, y, K), LIGHT)
            b.text(nm, x, y + sh + 14, size=15, font=F, weight=800, color=NIGHT)
            b.text(act, x, y + sh + 36, size=13, font=F, weight=700, color=GRANITE)
            if j < len(steps) - 1:
                ax = x + sw + 14; ay = y + sh / 2
                b.path(f'M{ax} {ay} H{ax + 36} M{ax + 28} {ay - 8} L{ax + 36} {ay} L{ax + 28} {ay + 8}', stroke=NIGHT, sw=2.5, name='Arrow')
        p.boards.append(b)
        pagekit.REGISTRY.append((p.name, f'flows-{i}', b))
        p.y += sh + 220 + 80
