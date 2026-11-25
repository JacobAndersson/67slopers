"""Page 05: the session. Colour tells you where you are."""
from pagekit import Page
from ui import GLOW, GLACIER, NIGHT
import screens_timer as S


def build(doc, index):
    p = Page(doc, '05 Timer', 'timer')
    p.heading('The session', 'The whole screen becomes the colour of the moment: Hang is Glow, Rest is Glacier, Get ready and Recover '
              'are Snow, Done is Night. The interval fills the screen from the bottom as it runs. Set and rep are big counters; '
              'the grip is drawn and named; the digits never move. One big control while running; Back and Skip only when paused, '
              'and Paused goes Snow with a band of its phase colour, so a stopped clock never looks like a running one.')
    p.screen('ready', 'Ready', 'Opened from the overview: waits for Start.', lambda b, T: S.ready(b, T))
    p.screen('prep', 'Get ready', 'A light tap each of the last three seconds.', lambda b, T: S.prep(b, T), bg='#E4E0DA')
    p.screen('hang', 'Hang', 'The only place Glow fills a screen.', lambda b, T: S.hang(b, T), bg=GLOW)
    p.screen('rest', 'Rest', 'Between reps.', lambda b, T: S.rest(b, T), bg=GLACIER)
    p.screen('hang-next', 'Hang · last rep', 'Next shows only when the pattern breaks.', lambda b, T: S.hang_next(b, T), bg=GLOW)
    p.screen('recover', 'Recover', 'Between sets.', lambda b, T: S.recover(b, T), bg='#DDECF1')
    p.newrow()
    p.screen('newgrip', 'Rest · new grip', 'The board shows the next grip before the hang.', lambda b, T: S.rest_newgrip(b, T), bg=GLACIER)
    p.screen('paused', 'Paused', 'Snow, a band of the phase colour, and said in words.', lambda b, T: S.paused(b, T), bg='#F8F6F3')
    p.screen('noboard', 'Hang · no board', 'Same layout; the band stays empty.', lambda b, T: S.hang_noboard(b, T), bg=GLOW)
    p.screen('settings', 'Session settings', 'The timer waits behind it.', lambda b, T: S.settings_sheet(b, T), bg=GLACIER)
    p.screen('end', 'End the session?', 'X mid-run. Keep going is first.', lambda b, T: S.end_sheet(b, T), bg='#F8F6F3')
    p.newrow()
    p.screen('finish', 'Done', 'Night, the Glow symbol rising with the three closing notes.', lambda b, T: S.finish(b, T), bg=NIGHT)
    p.screen('done', 'Session saved', 'Saved the moment the timer stopped.', lambda b, T: S.done(b, T))
    p.screen('ended', 'Ended early', 'Encouraging, never guilt.', lambda b, T: S.done(b, T, ended=True))
    p.screen('draft', 'Quick workout · no name', 'Finish without keeping it.', lambda b, T: S.done(b, T, draft=''), h=960)
    p.screen('draft-named', 'Quick workout · named', 'A name keeps it in Hang.', lambda b, T: S.done(b, T, draft='Pyramid hangs'), h=960)
