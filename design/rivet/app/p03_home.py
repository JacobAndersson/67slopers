"""Page 03: the five places in the dock and what hangs off Hang."""
from pagekit import Page
from ui import LIGHT
import screens_home as S


def build(doc, index):
    p = Page(doc, '03 Home & Hang', 'home')
    p.heading('Home & Hang', 'Home opens on the way you trained last: the workout with a play button that starts the '
              'countdown at once, and the problem on the board. Then the streak, the week and the latest sessions.')
    p.screen('home', 'Home', 'Morning. Hang used last, so it sits on top. Full scroll length.', lambda b, T: S.home(b, T), h=1290)
    p.screen('home-climb', 'Home · board first', 'A board session was last, so the problem card leads. Lights connected.',
             lambda b, T: S.home(b, T, 'climb-first'), h=1290)
    p.screen('home-unfinished', 'Home · unfinished run', 'A run was interrupted: continue, save it as ended, or discard.',
             lambda b, T: S.home(b, T, 'unfinished'), h=1362)
    p.screen('home-first', 'Home · first run', 'Nothing logged yet: one clear place to start.', lambda b, T: S.home(b, T, 'first'))
    p.newrow()
    p.screen('hang', 'Hang', 'Your workouts, each with its shape as a timeline. + builds a new one.', lambda b, T: S.hang_tab(b, T), h=1010)
    p.screen('hang-empty', 'Hang · empty', 'No workouts saved.', lambda b, T: S.hang_tab(b, T, empty=True))
