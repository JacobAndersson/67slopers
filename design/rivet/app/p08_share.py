"""Page 08: sharing, scanning, importing, edge states, launch."""
from pagekit import Page
from ui import NIGHT
import screens_share as S


def build(doc, index):
    p = Page(doc, '08 Share, scan & edges', 'share')
    p.heading('Share, scan & edges', 'A workout or problem travels as a QR code, nothing to copy. The camera is asked for only on the scan '
              'screen. Errors say what happened and what to do, in two lines.')
    p.screen('share-workout', 'Share workout', 'Full-screen code.', lambda b, T: S.share(b, T))
    p.screen('share-problem', 'Share problem', '', lambda b, T: S.share(b, T, 'problem'))
    p.screen('scan', 'Scan', 'Viewfinder on the live camera.', lambda b, T: S.scan(b, T), bg=NIGHT)
    p.screen('scan-permission', 'Scan · permission', 'Asked only here.', lambda b, T: S.scan(b, T, 'permission'), bg=NIGHT)
    p.screen('scan-blocked', 'Scan · blocked', '', lambda b, T: S.scan(b, T, 'blocked'), bg=NIGHT)
    p.screen('scan-invalid', 'Scan · not ours', 'Any other QR code is ignored, with a word.', lambda b, T: S.scan(b, T, 'invalid'), bg=NIGHT)
    p.newrow()
    p.screen('import', 'Shared workout', 'Preview before saving or running.', lambda b, T: S.import_workout(b, T))
    p.screen('import-have', 'Shared · already saved', '', lambda b, T: S.import_workout(b, T, have=True))
    p.screen('import-problem', 'Shared problem', 'Light it up before you keep it.', lambda b, T: S.import_problem(b, T))
    p.screen('import-other-board', 'Shared · another board', 'For a board you haven’t set up.', lambda b, T: S.import_problem(b, T, other=True))
    p.screen('newer', 'Needs a newer Rivet', 'A code from a newer version.', lambda b, T: S.missing(b, T, 'newer'))
    p.screen('missing-workout', 'Workout gone', '', lambda b, T: S.missing(b, T, 'workout'))
    p.screen('missing-session', 'Session gone', '', lambda b, T: S.missing(b, T, 'session'))
    p.screen('bad-code', 'Not a Rivet code', '', lambda b, T: S.missing(b, T, 'code'))
    p.newrow()
    p.screen('delete-workout', 'Delete workout', 'Destructive actions are words, not red.', lambda b, T: S.delete_dialog(b, T, 'workout'))
    p.screen('delete-session', 'Delete session', '', lambda b, T: S.delete_dialog(b, T, 'session'))
    p.screen('discard-run', 'Discard run', '', lambda b, T: S.delete_dialog(b, T, 'discard'))
    p.screen('clear-holds', 'Change board', '', lambda b, T: S.delete_dialog(b, T, 'holds'))
    p.screen('launch', 'Launch', 'Night, the symbol in Glow. Instant.', lambda b, T: S.launch(b, T), bg=NIGHT)
    p.screen('launch-first', 'First launch', 'The lockup once, then never again.', lambda b, T: S.launch(b, T, True), bg=NIGHT)
    p.newrow()

    def icons_(b):
        from ui import F, NIGHT as N, GRANITE as G
        b.text('App icon', 56, 48, size=36, font=F, weight=900, color=N)
        b.text('The Hang screen in miniature: the symbol on Glow, nothing else. Dark: Glow symbol on Night. Tinted: system grey.', 56, 100,
               w=1100, size=16, font=F, weight=600, color=G)
        x = 56
        for kind in ('light', 'dark', 'tinted'):
            S.app_icon(b, 180, x, 160, kind)
            xx = x
            for sz in (120, 60, 29):
                S.app_icon(b, sz, xx, 370, kind); xx += sz + 20
            b.text(kind.title(), x, 520, size=16, font=F, weight=800, color=N)
            x += 400
    p.board('app-icon', 'App icon', 1240, 580, icons_, bg='#FFFFFF')
