"""Page 07: Log, sessions, settings."""
from pagekit import Page
import screens_log as S


def build(doc, index):
    p = Page(doc, '07 Log & settings', 'log')
    p.heading('Log & settings', 'Sixteen weeks at a glance in Glacier, the sequential chart scale. Timer and board sessions sit in one list; '
              'a board session carries a Dusk tile. Glow never appears in a chart.')
    p.screen('log', 'Log', 'Stats, heat calendar, recent sessions.', lambda b, T: S.log(b, T), h=1120)
    p.screen('log-day', 'Log · a day pinned', 'Slide across the calendar to pin a day.', lambda b, T: S.log(b, T, pinned=True), h=960)
    p.screen('log-rest', 'Log · a rest day', 'Rest is part of the plan.', lambda b, T: S.log(b, T, restday=True))
    p.screen('log-empty', 'Log · empty', '', lambda b, T: S.log(b, T, empty=True))
    p.screen('sessions', 'Sessions', 'View all: timer and board sessions by day.', lambda b, T: S.sessions(b, T))
    p.screen('session', 'Session', 'Ended early: every hang as planned and as done.', lambda b, T: S.session(b, T), h=1010)
    p.screen('session-changed', 'Session · workout changed', 'Do it again runs the snapshot.', lambda b, T: S.session(b, T, changed=True), h=1180)
    p.newrow()
    p.screen('settings', 'Settings', 'Boards, appearance, the session, climbing.', lambda b, T: S.settings(b, T), h=1100)
