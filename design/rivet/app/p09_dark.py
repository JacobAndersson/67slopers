"""Page 09: same brand, lights off. Session colours keep their meaning in both modes."""
from pagekit import Page
from ui import DARK, GLOW, GLACIER, NIGHT
import screens_home as H_
import screens_timer as Ti
import screens_builder as Bu
import screens_climb as Cl
import screens_log as Lo


def build(doc, index):
    p = Page(doc, '09 Dark mode', 'dark')
    p.heading('Dark mode', 'Canvas Night 700, surfaces Night, Ink actions turn Snow. Hang stays Glow and Rest stays Glacier, so colour '
              'still tells you where you are; Get ready and Recover go Night. Follows the phone unless Settings says otherwise.')
    D = DARK
    p.screen('home', 'Home', '', lambda b, T: H_.home(b, T), T=D, h=1290)
    p.screen('hang', 'Hang', '', lambda b, T: H_.hang_tab(b, T), T=D, h=1010)
    p.screen('overview', 'Workout overview', '', lambda b, T: Bu.overview(b, T), T=D, h=1470)
    p.screen('builder', 'Builder · step open', '', lambda b, T: Bu.builder(b, T, 'edit', open_step='hang'), T=D, h=1812)
    p.newrow()
    p.screen('prep', 'Get ready', '', lambda b, T: Ti.prep(b, T), T=D, bg='#E4E0DA')
    p.screen('hang-timer', 'Hang', 'Glow in both modes.', lambda b, T: Ti.hang(b, T), T=D, bg=GLOW)
    p.screen('rest', 'Rest', 'Glacier in both modes.', lambda b, T: Ti.rest(b, T), T=D, bg=GLACIER)
    p.screen('recover', 'Recover', 'Glacier 200 in both modes: the calm between sets.', lambda b, T: Ti.recover(b, T), T=D, bg='#DDECF1')
    p.screen('done', 'Session saved', '', lambda b, T: Ti.done(b, T), T=D)
    p.newrow()
    p.screen('climb', 'Problems', '', lambda b, T: Cl.climb_list(b, T), T=D, h=1080)
    p.screen('problem', 'Problem', '', lambda b, T: Cl.problem(b, T), T=D)
    p.screen('lit', 'Lit on the wall', '', lambda b, T: Cl.problem(b, T, lit=True), T=D)
    p.screen('log', 'Log', '', lambda b, T: Lo.log(b, T), T=D, h=1120)
    p.screen('settings', 'Settings', '', lambda b, T: Lo.settings(b, T), T=D, h=1100)
