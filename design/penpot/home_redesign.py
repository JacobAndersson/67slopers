"""A proposed Home: a greeting by the clock, then both ways to train at equal weight.

Design only: nothing in the app changes. The boards sit on the MoonBoard & dock page under the
ones that are there. Run without --publish for review SVGs in design/exports/home-redesign.
"""

import argparse
import json
import re
from api import Penpot, ROOT
from moonboard import MB, P, PAGE, W, publish_boards
from scene import Scene

OUT = ROOT/'design/exports/home-redesign'
INVENTORY = ROOT/'design/explorations/home/inventory.json'
OWNERSHIP = ROOT/'design/.local/home-redesign-owned.json'
SCENE = Scene()
TOP = 9200  # below the MoonBoard & dock boards


def greetings():
    """The lines the app ships, read from the source so the board cannot drift from it."""
    source = (ROOT/'src/lib/greetings.ts').read_text()
    parts_source = source.split('const PARTS')[1].split('const DAYS')[0]
    days_source = source.split('const DAYS')[1].split('};')[0]
    parts = []
    for block in parts_source.split('from: ')[1:]:
        parts.append((int(re.match(r'\d+', block).group()), re.findall(r"'([^']+)'", block.split('],')[0])))
    days = [(int(n), re.findall(r"'([^']+)'", body)) for n, body in re.findall(r'(\d): \[(.*?)\]', days_source, re.S)]
    return parts, days


def screen(key, name, col, note=''):
    return MB(key, name, x=col*470, y=TOP+980, page=PAGE, scene=SCENE, prefix='home2-', route='/', note=note)


def top(b, line):
    """Brand and scan, then the greeting."""
    b.status(); b.brand(16, 49); b.ic('scan-qr-code', W-46, 54)
    b.t(line, 24, 110, 342, 30, 800, lh=36)
    return 170


def hang_card(b, y, name='Repeaters 7:3', sub='24 min · yesterday'):
    b.box(24, y, 342, 92, 'card', 'border', 16, 'Hangboard / card')
    b.box(40, y+16, 52, 60, 'secondary', r=12, name='Hangboard / tile'); b.ic('timer', 54, y+34, 24)
    b.t('HANGBOARD', 108, y+16, 160, 12, 500, 'mutedForeground', lh=16)
    b.t(name, 108, y+36, 180, 16, 600)
    b.t(sub, 108, y+60, 190, 12, 500, 'mutedForeground', lh=16)
    b.btn('', 306, y+24, 44, 44, icon='play')
    return y+104


def climb_card(b, y, connected=False):
    b.box(24, y, 342, 92, 'card', 'border', 16, 'MoonBoard / card')
    b.thumb(40, y+10, P['WORTH THE WRIST'], 52)
    b.t('MOONBOARD', 108, y+16, 160, 12, 500, 'mutedForeground', lh=16)
    b.t('Worth the Wrist', 108, y+36, 180, 16, 600)
    b.t('7A · project · 5 tries', 108, y+60, 190, 12, 500, 'mutedForeground', lh=16)
    if connected: b.btn('', 306, y+24, 44, 44, 'secondary', icon='bulb')
    else: b.ic('chevron-right', 326, y+37, 18, 'mutedForeground')
    return y+104


def setup_card(b, y, label, title, sub, icon):
    b.box(24, y, 342, 92, None, 'border', 16, label.title()+' / not set up')
    b.box(40, y+16, 52, 60, 'muted', r=12, name='Tile'); b.ic(icon, 54, y+34, 24, 'mutedForeground')
    b.t(label, 108, y+16, 160, 12, 500, 'mutedForeground', lh=16)
    b.t(title, 108, y+36, 200, 16, 600)
    b.t(sub, 108, y+60, 210, 12, 500, 'mutedForeground', lh=16)
    b.ic('chevron-right', 326, y+37, 18, 'mutedForeground')
    return y+104


def week(b, y, streak='3 weeks', sessions='14', trained=(5, 7), today=9):
    b.t('Your streak', 24, y, 150, 12, 500, 'mutedForeground', lh=16); b.t(streak, 24, y+20, 150, 20, 700)
    b.t('Sessions', 202, y, 150, 12, 500, 'mutedForeground', lh=16); b.t(sessions, 202, y+20, 130, 20, 700)
    y += 76
    for i, ch in enumerate('MTWTFSS'): b.t(ch, 24+i*48.86, y, 48.86, 12, 500, 'mutedForeground', 'center', lh=16)
    for i, d in enumerate(range(5, 12)):
        x = 24+i*48.86
        b.box(x+6, y+24, 36, 36, 'chart1' if d in trained else None, 'foreground' if d == today else None, 12, f'Calendar / {d}')
        b.t(str(d), x, y+31, 48.86, 16, 600 if d == today else 500, 'foreground', 'center')
    return y+84


def build():
    parts, days = greetings()
    count = sum(len(lines) for _, lines in parts)+sum(len(lines) for _, lines in days)
    notes = MB('notes', 'H0 Home redesign / what changes', x=0, y=TOP, w=2350, h=880, page=PAGE, scene=SCENE, prefix='home2-', note='Proposal. A1 at the top of this page shows Home as built.')
    notes.t('67SLOPERS / HOME REDESIGN', 48, 36, 1700, 12, 500, 'mutedForeground')
    notes.t('Home says hello, then steps aside', 48, 80, 1700, 36, 800)
    notes.t('The app is no longer only a hangboard timer, so Home stops leading with one. It opens with a line that follows the clock, then offers both ways to train as equals, whichever you did last on top.', 48, 136, 1200, 16, 400, 'mutedForeground', lh=24)
    changes = [
        ('A greeting by the clock', f'{count} lines in seven parts of the day, plus a few for some weekdays. A couple of words, never a sentence. One line holds for that part of that day, so it never changes between two glances.'),
        ('Two equal cards', 'Hangboard and MoonBoard are the same size and shape: what you did last, one tap from doing it again. The big Next up hero is gone.'),
        ('The last one used comes first', 'Train on the board in the evening and it is on top the next time; hang in the morning and the workout is.'),
        ('Nothing to set up, nothing to nag', 'A card for something not set up yet is an outline with one line of text, and can be left alone.'),
    ]
    for i, (title, text) in enumerate(changes):
        x = 48+i*570
        notes.t(title, x, 226, 520, 16, 600)
        notes.t(text, x, 254, 520, 12, 500, 'mutedForeground', lh=18)
    notes.t(f'All {count} greetings', 48, 372, 600, 20, 600)
    names = {0: 'Small hours · 0–5', 5: 'Early · 5–9', 9: 'Morning · 9–12', 12: 'Midday · 12–14', 14: 'Afternoon · 14–17', 17: 'Evening · 17–21', 21: 'Night · 21–24'}
    for i, (start, lines) in enumerate(parts):
        x = 48+i*286
        notes.t(names[start].upper(), x, 420, 270, 12, 600, 'mutedForeground', lh=16)
        for j, line in enumerate(lines): notes.t(line, x, 448+j*28, 262, 12, 500, lh=16)
    x = 48+7*286
    notes.t('SOME DAYS · 5–21', x, 420, 270, 12, 600, 'mutedForeground', lh=16)
    weekday = {0: 'Sun', 1: 'Mon', 3: 'Wed', 5: 'Fri', 6: 'Sat'}
    row = 0
    for day, lines in sorted(days, key=lambda item: (item[0]+6) % 7):
        for line in lines:
            notes.t(weekday[day], x, 448+row*28, 34, 12, 500, 'mutedForeground', lh=16)
            notes.t(line, x+40, 448+row*28, 230, 12, 500, lh=16); row += 1

    b = screen('morning', 'H1 Home / morning, hung last', 0, 'Saturday morning. The workout was the last thing done, so it is on top.')
    y = top(b, 'Good morning')
    y = hang_card(b, y); y = climb_card(b, y)
    week(b, y+20); b.dock('home', link=False)

    b = screen('evening', 'H2 Home / evening, climbed last, lights on', 1, 'The board was last, and its lights are connected: the bulb lights the problem and opens it.')
    y = top(b, 'Friday fingers')
    y = climb_card(b, y, connected=True); y = hang_card(b, y, sub='24 min · Wednesday')
    week(b, y+20); b.dock('home', lights=True, link=False)

    b = screen('night', 'H3 Home / small hours', 2, 'The same screen at 1 am. Only the line changes.')
    y = top(b, 'One last go')
    y = climb_card(b, y); y = hang_card(b, y, sub='24 min · yesterday')
    week(b, y+20, trained=(5, 7, 10), today=11); b.dock('home', link=False)

    b = screen('first', 'H4 Home / first launch', 3, 'Nothing done yet. The seeded workout is ready; the board is an invitation, not a demand.')
    y = top(b, 'Sending day')
    y = hang_card(b, y, sub='24 min · not done yet')
    y = setup_card(b, y, 'MOONBOARD', 'Got a MoonBoard?', 'Set it up to light problems', 'board')
    week(b, y+20, streak='0 weeks', sessions='0', trained=(), today=10); b.dock('home', link=False)

    b = screen('unfinished', 'H5 Home / unfinished workout', 4, 'An interrupted run still comes before everything else, under the greeting.')
    y = top(b, 'Shake it out')
    b.box(24, y, 342, 132, 'accent', r=16, name='Unfinished run / card')
    b.t('UNFINISHED', 40, y+16, 200, 12, 500, 'mutedForeground', lh=16)
    b.t('Repeaters 7:3', 40, y+36, 300, 16, 600)
    b.t('Stopped in set 3 of 6 · 40 min ago', 40, y+60, 310, 12, 500, 'mutedForeground', lh=16)
    b.btn('Continue', 40, y+88, 150, 32, icon='play', size=14); b.btn('Save as ended', 198, y+88, 152, 32, 'outline', size=14)
    y += 144
    y = hang_card(b, y); y = climb_card(b, y)
    week(b, y+20); b.dock('home', link=False)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--publish', action='store_true'); args = parser.parse_args()
    build(); SCENE.resolve()
    OUT.mkdir(parents=True, exist_ok=True); INVENTORY.parent.mkdir(parents=True, exist_ok=True)
    for b in SCENE.boards: b.save_svg(OUT)
    INVENTORY.write_text(json.dumps([dict(key=b.key, name=b.name, pageId=b.page, boardId=b.id, route=b.route, width=b.w, height=b.h, note=b.note, shapes=len(b.objects)) for b in SCENE.boards], indent=2)+'\n')
    print(f'Generated {len(SCENE.boards)} boards and {sum(len(b.objects) for b in SCENE.boards)} editable shapes.', flush=True)
    if args.publish: publish_boards(Penpot(), SCENE.boards, PAGE, OWNERSHIP)


if __name__ == '__main__': main()
