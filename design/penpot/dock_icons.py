"""Custom Phosphor-compatible dock icon studies. Only owns the dedicated study page."""

import argparse
import json
from api import Penpot, ROOT
from scene import Board, Scene, C, uid
from moonboard import publish_boards

PAGE = uid('page/dock-icon-studies')
PAGE_NAME = '08 Dock icon studies'
OUT = ROOT / 'design/exports/dock-icons'
INVENTORY = ROOT / 'design/explorations/dock-icons/inventory.json'
OWNERSHIP = ROOT / 'design/.local/dock-icons-owned.json'
SCENE = Scene()


def circle(x, y, r, reverse=False):
    sweep = 0 if reverse else 1
    return f'M{x-r} {y}a{r} {r} 0 1 {sweep} {2*r} 0a{r} {r} 0 1 {sweep} {-2*r} 0Z'


def stroke(d):
    return dict(d=d, stroke=True)


def solid(d):
    return dict(d=d, stroke=False)


RAIL = 'M4 2.75H20Q21 2.75 21 3.75V5.75H3V3.75Q3 2.75 4 2.75Z'
HEAD = circle(12, 10.5, 1.75)
ARMS = 'M6 5.75V8.5Q6 10 7.2 11L10 13.25H14L16.8 11Q18 10 18 8.5V5.75'
# Revised H1: narrower grip, raised shoulders, and a longer torso/legs.
DEAD_RAIL = 'M4 2H20Q21 2 21 3V4.5H3V3Q3 2 4 2Z'
DEAD_HEAD = circle(12, 8, 1.4)
DEAD_ARMS = 'M7 4.5L8 8Q8.25 8.75 8.75 9.25L10.25 11.25H13.75L15.25 9.25Q15.75 8.75 16 8L17 4.5'
TORSO = 'M10.25 11.25V16.25L8.75 21.25M13.75 11.25V16.25L15.25 21.25'
BODY_FILL = 'M10.25 11.25H13.75V16.25L15.25 21.25H12.75L12 18L11.25 21.25H8.75L10.25 16.25Z'
BOARD = 'M4 7H8L9 8H15L16 7H20Q21 7 21 8V15Q21 17 19 17H5Q3 17 3 15V8Q3 7 4 7Z'
POCKETS = 'M6 10.25H8.5M15.5 10.25H18M6 13.75H9M15 13.75H18'
# Counter-clockwise openings in a clockwise silhouette, genuinely transparent.
POCKET_HOLES = 'M5.5 9.5V11H9V9.5Z M15 9.5V11H18.5V9.5Z M5.5 13V14.5H9.5V13Z M14.5 13V14.5H18.5V13Z'
WALL = 'M6 3H18Q19 3 19 4V21H5V4Q5 3 6 3Z'
# Irregular rounded holds, keeping the symbol distinct from an app grid.
HOLDS = [
    'M8 6.75l1-.5', 'M14.75 6.25l1 .5',
    'M8.5 10.5l.5 1', 'M14.5 11.25l1-.75',
    'M8 15.5l1-.5', 'M15 14.75l1 .5',
]
# The same positions, reversed circular openings for the selected wall.
WALL_HOLES = ''.join(circle(x, y, 1.05, True) for x,y in [(8.5,6.5),(15.25,6.5),(8.75,11),(15,10.9),(8.5,15.25),(15.5,15)])

ICONS = {
    'H1': dict(name='Dead hang', description='A climber suspended from a broad edge. The clearest action cue.',
               regular=[stroke(DEAD_RAIL), stroke(DEAD_HEAD), stroke(DEAD_ARMS), stroke(TORSO)],
               fill=[solid(DEAD_RAIL), solid(DEAD_HEAD), stroke(DEAD_ARMS), solid(BODY_FILL)]),
    'H2': dict(name='Tucked hang', description='Bent knees make the suspended pose more compact and athletic.',
               regular=[stroke(RAIL), stroke(HEAD), stroke(ARMS), stroke('M10 13.25V16.25L14 18.5L12.25 21M14 13.25V15.5L18 17.75L16.25 20.25')],
               fill=[solid(RAIL), solid(HEAD), stroke(ARMS), solid('M10 12.75H14V15.5L18 17.75Q18.6 18.1 18.15 18.75L16.75 20.75Q16.25 21.4 15.65 20.9Q15.1 20.5 15.6 19.85L16.6 18.35L13.5 16.7L11.75 16.7L14.4 18.2Q14.95 18.55 14.55 19.2L12.9 21.5Q12.45 22.1 11.85 21.65Q11.25 21.2 11.7 20.6L13 18.75L10.4 17.3Q10 17.1 10 16.25Z')]),
    'H3': dict(name='Fingerboard', description='Paired pockets and a dipped centre. Equipment first, without a figure.',
               regular=[stroke(BOARD), stroke(POCKETS)], fill=[solid(BOARD + POCKET_HOLES)]),
    'M1': dict(name='Hold wall', description='A tall panel, shaped holds and a low kickboard. The most literal wall.',
               regular=[stroke(WALL), stroke('M5 18.25H19'), *map(stroke,HOLDS)],
               fill=[solid(WALL + WALL_HOLES + 'M6.5 18V19.5H17.5V18Z')]),
    'M2': dict(name='Overhang', description='An overhanging face and vertical kickboard, seen from the side.',
               regular=[stroke('M5 3H10L19 18V21H14V18L5 3Z'), stroke('M14 18H19'), stroke('M10.8 7H12.4M13.5 11.5H15.1')],
               fill=[solid('M5 3H10L19 18V21H14V18L5 3Z M8.9 6.75L9.8 8.25H12.3L11.4 6.75Z M11.6 11.25L12.5 12.75H15L14.1 11.25Z M15.5 18V19.5H17.5V18Z')]),
    'M3': dict(name='Lit problem', description='A sparse sequence of lit holds on the wall. The route is the focus.',
               regular=[stroke(WALL), stroke('M5 18.25H19'), stroke(circle(14.5,6.5,1.5)), solid(circle(9.5,11,1)), stroke(circle(13.5,15,1.5))],
               fill=[solid(WALL + circle(14.5,6.5,2,True) + circle(9.5,11,1.25,True) + circle(13.5,15,2,True) + 'M6.5 18V19.5H17.5V18Z'), solid(circle(14.5,6.5,.6)), solid(circle(13.5,15,.6))]),
}


def custom(b, key, x, y, size=24, weight='regular', color='foreground'):
    for index, part in enumerate(ICONS[key][weight]):
        o = b.path(part['d'], x, y, size, color if part['stroke'] else None,
                   None if part['stroke'] else color, f'{key} / {ICONS[key]["name"]} / {weight} / {index+1}')
        if part['stroke']:
            o['strokes'][0]['strokeWidth'] = 1.5 * size / 24
            b.svg[-1] = b.svg[-1].replace('stroke-width="2"', 'stroke-width="1.5"')


def dock(b, x, y, hang, moon, active):
    b.rect(x,y,289,60,'card','border',22,'Dock / 1:1')
    offsets = [6,58,110,162,235]
    b.rect(x+offsets[active],y+6,48,48,'secondary',r=14,name='Selected tile')
    for i,key in enumerate(['house',hang,moon,'calendar','gear']):
        weight = 'fill' if i == active else 'regular'
        color = 'foreground' if i == active else 'mutedForeground'
        if key in ICONS: custom(b,key,x+offsets[i]+12,y+18,24,weight,color)
        else: b.icon(key,x+offsets[i]+12,y+18,24,color,weight)
    b.rect(x+222,y+18,1,24,'border',r=0,name='Settings divider')


def board(key,name,x,y,w,h):
    return Board(SCENE,'dock-icons-'+key,name,PAGE,x,y,w,h)


def build():
    b = board('overview','Pick your pair / six custom dock icons',0,0,1320,1190)
    b.text('67SLOPERS / ICON STUDIES',40,30,950,12,500,'mutedForeground')
    b.text('Two ways to train. Six ways to say it.',40,64,1240,36,600)
    b.text('Pick one H and one M. Every option shares Phosphor’s weight, rounded ends and selected-state language.',40,120,1130,16,400,'mutedForeground')
    b.rect(40,184,1240,60,'secondary',r=12)
    b.text('SELECTED PAIR',58,204,140,12,600)
    b.text('H1 Dead hang + M1 Hold wall',206,202,450,16,600)
    b.text('Rebalanced H1 + approved M1.',715,204,535,14,400)
    for col,(h,m,title) in enumerate([('H1','M1','01 / Action + wall'),('H2','M2','02 / Athletic + angle'),('H3','M3','03 / Equipment + route')]):
        x=40+col*420
        b.rect(x,272,400,860,'card','border',16,title)
        b.text(title,x+24,296,352,18,600)
        for key,yy in [(h,348),(m,624)]:
            b.text(key+'  '+ICONS[key]['name'],x+24,yy,352,18,600)
            custom(b,key,x+38,yy+46,88)
            custom(b,key,x+202,yy+46,88,'fill')
            b.text('REGULAR',x+24,yy+144,130,11,500,'mutedForeground','center')
            b.text('FILL',x+188,yy+144,130,11,500,'mutedForeground','center')
            b.text(ICONS[key]['description'],x+24,yy+176,352,13,400,'mutedForeground',lh=19)
        b.text('IN THE DOCK / ACTUAL SIZE',x+24,902,350,11,500,'mutedForeground')
        dock(b,x+55,936,h,m,1)
        dock(b,x+55,1014,h,m,2)
        b.text('Top: Hang / Bottom: Climb selected',x+24,1100,352,10,400,'mutedForeground')
    b.text('Custom symbols / Phosphor-compatible studies / Choose independently; the columns are suggested pairings.',40,1154,1240,11,400,'mutedForeground')

    b=board('scale','Optical checks / sizing and family fit',0,1290,1320,648)
    b.text('THE FAMILY TEST',40,32,1240,12,500,'mutedForeground')
    b.text('Built for the 24 px dock',40,62,1240,30,600)
    b.text('24-unit grid · 1.5-unit Regular stroke (= 16 / 256) · round caps · transparent Fill counters',40,112,1240,14,400,'mutedForeground')
    b.text('CANDIDATE',40,172,230,11,600,'mutedForeground')
    for x,label in [(290,'20 PX'),(390,'24 PX'),(490,'32 PX'),(606,'SELECTED'),(820,'PHOSPHOR / 24 PX')]:
        b.text(label,x,172,300,11,600,'mutedForeground')
    for row,key in enumerate(ICONS):
        y=206+row*62
        b.rect(40,y+53,1240,1,'border',r=0)
        b.text(key+' / '+ICONS[key]['name'],40,y+12,240,14,500)
        for x,size in [(290,20),(390,24),(490,32)]:custom(b,key,x,y+(48-size)/2,size)
        b.rect(620,y,48,48,'secondary',r=14)
        custom(b,key,632,y+12,24,'fill')
        b.icon('house',830,y+12,24)
        custom(b,key,882,y+12,24)
        b.icon('calendar',934,y+12,24)
        b.icon('gear',986,y+12,24)
        custom(b,key,1060,y+12,24,'fill')
        b.icon('house',1112,y+12,24,weight='fill')
    b.text('Use Fill for selection, not a heavier stroke. Masters below are editable at 24 × 24; SVGs retain transparency.',40,602,1240,12,400,'mutedForeground')
    for idx,key in enumerate(ICONS):
        for j,weight in enumerate(['regular','fill']):
            b=board(key.lower()+'-'+weight,f'{key} / {ICONS[key]["name"]} / {weight} / 24',idx*210,2070+j*110,24,24)
            custom(b,key,0,0,24,weight)
            # The master artboard exports with a transparent background.
            b.objects[0]['fills']=[]


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--publish',action='store_true')
    args=parser.parse_args()
    build()
    OUT.mkdir(parents=True,exist_ok=True)
    INVENTORY.parent.mkdir(parents=True,exist_ok=True)
    for b in SCENE.boards:
        if b.objects[0]['fills']: b.save_svg(OUT)
        else:
            (OUT/(b.key+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'+''.join(b.svg)+'</svg>')
    INVENTORY.write_text(json.dumps([dict(key=b.key,name=b.name,pageId=PAGE,boardId=b.id,width=b.w,height=b.h,shapes=len(b.objects)) for b in SCENE.boards],indent=2)+'\n')
    (OUT/'icons.json').write_text(json.dumps(dict(viewBox='0 0 24 24',strokeWidth=1.5,icons=ICONS),indent=2)+'\n')
    print(f'Generated {len(SCENE.boards)} boards / {sum(len(b.objects) for b in SCENE.boards)} shapes',flush=True)
    if args.publish:
        p=Penpot()
        before=p.file()['data']['pagesIndex']
        p.export(ROOT/'design/.local/before-dock-icons.penpot')
        if PAGE not in before: p.update([dict(type='add-page',id=PAGE,name=PAGE_NAME)])
        publish_boards(p,SCENE.boards,PAGE,OWNERSHIP)
        after=p.file()['data']['pagesIndex']
        assert all(after[id] == page for id,page in before.items() if id != PAGE)
        print('Verified new page and preservation of existing pages.',flush=True)


if __name__ == '__main__': main()
