"""Page 00: the cover and how the brand book becomes an app."""
from pagekit import Page, REGISTRY
from ui import F, NIGHT, SNOW, GLOW, GLACIER, GRANITE, STONE, DUSK, LIGHT
from brand import lockup, pitch
import screens_home as Ho
import screens_timer as Ti
from pp import Scaled


def build(doc, index):
    p = Page(doc, '00 Cover', 'cover')

    def cover(b):
        lockup(b, 120, 120, 60, SNOW, sym_color=GLOW)
        b.text('App design', 120, 300, size=120, font=F, weight=900, color=SNOW, ls=-3, lh=1.0)
        b.text('Every screen of Rivet, redrawn from the brand book: Home, Hang, the session, Climb, Log and '
               'Settings, in light and dark. Edition 01 · November 2026.', 120, 450, w=860, size=24, font=F, weight=600,
               color='#8C92A6', lh=1.45)
        b.text('Climb Harder.', 120, 960, size=28, font=F, weight=800, color=SNOW)
        k = 0.78
        for i, (fn, bg) in enumerate([(lambda q, T: Ho.home(q, T), LIGHT['canvas']), (Ti.hang, GLOW), (Ti.rest, GLACIER)]):
            x, y = 1060 + i * 260, 150 + (2 - i) * 60
            with b.frame(x, y, 390 * k, 844 * k, bg, r=44 * k, name='Screen'):
                fn(Scaled(b, x, y, k), LIGHT)
    p.board('cover', 'Rivet — App design', 1920, 1080, cover, bg=NIGHT)

    def rules(b):
        b.text('From the book to the app', 80, 72, size=56, font=F, weight=900, color=NIGHT, ls=-1)
        b.text('Ten rules every screen in this file follows. Page numbers point to the brand book.', 80, 150, size=21, font=F, weight=600, color=GRANITE)
        R = [('Glow is the hang', 'Glow fills the Hang screen and the app icon. Never a button, an icon, a chart or a badge. (p.27)'),
             ('Colour tells you where you are', 'Get ready Stone, Hang Glow, Rest Glacier, Recover Glacier 200, Done Night, in both modes. The interval rises in a deeper step of the same colour. (p.28)'),
             ('Every state has a word', 'Hang, Rest, Recover, Paused. Paused goes Snow under a band of its phase, so a stopped clock never looks like a running one. (p.46)'),
             ('Ink pills', 'Primary: solid Night (Snow in dark). Secondary: the same pill as a hairline. In a confirm, the safe choice is solid and Delete is the hairline pill. (p.45)'),
             ('Big, soft, obvious', '64 pt for anything touched mid-session, 48 pt elsewhere. While a timer runs there is one control, Pause; Back and Skip come with it. (p.46)'),
             ('One rounded family', 'Nunito: 34/900 titles, 22/800 sections, 17/600 body, 13/700 captions, 12/800 caps labels; the phase word at 44 as on the book’s own Hang screen. (p.32, p.48)'),
             ('Everything steps up', 'Progress, history and time are plain rounded bars, time left to right. The Pitch is never a chart. (p.40)'),
             ('Charts are Night, Glacier, Dusk', 'Hangs in Night, board sessions in Dusk, load in the Glacier scale. Labels on the data. (p.25)'),
             ('Quiet copy', 'Short, warm, direct, plain words over formulas. How it felt is Off day · Solid · Strong, never preselected. (p.10–11)'),
             ('Lift, then settle', 'What arrives rises 8 pt on a 380/32 spring. Reduced motion: a 120 ms crossfade. (p.42)')]
        for i, (a, c) in enumerate(R):
            x = 80 + (i % 2) * 880; y = 240 + (i // 2) * 150
            b.text(f'{i + 1:02d}', x, y, size=18, font=F, weight=900, color=GRANITE)
            b.text(a, x + 56, y - 4, size=28, font=F, weight=900, color=NIGHT)
            b.text(c, x + 56, y + 38, w=760, size=18, font=F, weight=600, color=GRANITE, lh=1.4)
        b.text('Pages', 80, 1010, size=14, font=F, weight=800, color=GRANITE, ls=2, upper=True)
        b.text('01 Foundations · 02 Components · 03 Home & Hang · 04 Workouts & builder · 05 Timer · 06 Climb · 07 Log & settings · '
               '08 Share, scan & edges · 09 Dark mode · 10 Flows', 80, 1036, size=18, font=F, weight=700, color=NIGHT)
    p.board('rules', 'Rules', 1920, 1100, rules, bg=SNOW)
