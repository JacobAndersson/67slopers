"""Page 05 Templates: the production templates the book promises, as editable Penpot boards.

Business card (85 x 55 mm, front and back), social post (1080 x 1080), story (1080 x 1920) and
the first App Store screenshot (1290 x 2796). Each is exported to design/.local/rivet/templates/ as
PNG, and the card also as PDF; kit.py copies them into kit/templates.
"""
from book import *
from pp import Board, Scaled
from ch_print import campaign
from screens import phone, home, hang

bk = Book('05 Templates')
out = LOCAL / 'templates'; out.mkdir(exist_ok=True)
N = C['night']
bs = []

# Business card, 10 px per mm --------------------------------------------------------------
b = Board(bk.d, bk.pg, 'template/card-front', 'Business card · front · 85 × 55 mm', 0, 0, 850, 550, N)
pitch(b, 425 - 90, 275 - 90, 180, C['glow'], name='Symbol')   # Glow on Night: the one place it may sit
bs.append(b)
b = Board(bk.d, bk.pg, 'template/card-back', 'Business card · back · 85 × 55 mm', 950, 0, 850, 550, C['snow'])
lockup(b, 60, 64, 30, N)
b.text('Name Surname', 60, 330, size=34, font=F, weight=900, color=N, ls=-0.6, name='Name')
b.text('Role', 60, 378, size=22, font=F, weight=600, color=MUTED, name='Role')
b.text('name@rivet.training', 60, 460, size=20, font=F, weight=700, color=N, name='Email')
bs.append(b)

# Social post: photo, lockup and line small at the lower left -------------------------------
b = Board(bk.d, bk.pg, 'template/social-post', 'Social post · 1080 × 1080', 0, 700, 1080, 1080, N)
b.image(PH / 'font-rest.jpg', 0, 0, 1080, 1080, name='Photo (replace)')
shade(b, 0, 0, 1080, 1080, [(0, 0), (0.55, 0), (1, 0.7)])
lockup(b, 76, 930, 38, ON_DARK)
b.text('Climb Harder.', 78, 994, size=26, font=F, weight=700, color='#F8F6F3CC', name='Line')
bs.append(b)

# Story ---------------------------------------------------------------------------------------
b = Board(bk.d, bk.pg, 'template/social-story', 'Story · 1080 × 1920', 1180, 700, 1080, 1920, N)
campaign(Scaled(b, 0, 0, 1), 1080, 1920, story=True)
bs.append(b)

# App Store screenshot 1 ------------------------------------------------------------------------
b = Board(bk.d, bk.pg, 'template/appstore-1', 'App Store · 1290 × 2796 · screenshot 1', 2360, 700, 1290, 2796, C['snow'])
b.text('Start in\none tap.', 100, 180, w=1090, size=110, font=F, weight=800, color=N, lh=1.05, ls=-2.4, name='Title')
phone(Scaled(b, (1290 - 390 * 2.6) / 2, 520, 2.6), 0, 0, C['snow'], home)
bs.append(b)
b = Board(bk.d, bk.pg, 'template/appstore-2', 'App Store · 1290 × 2796 · screenshot 2', 3750, 700, 1290, 2796, N)
b.text('Read it from\nthe board.', 100, 180, w=1090, size=110, font=F, weight=800, color=ON_DARK, lh=1.05, ls=-2.4, name='Title')
phone(Scaled(b, (1290 - 390 * 2.6) / 2, 520, 2.6), 0, 0, C['glow'], hang)
bs.append(b)

bk.d.publish(bs)
for b in bs:
    name = b.key.split('/')[1]
    bk.d.render(b, out / f'{name}.png', 1)
    if name.startswith('card'): bk.d.render(b, out / f'{name}.pdf', 1, 'pdf')
    print('template', name, flush=True)
