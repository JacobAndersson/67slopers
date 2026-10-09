"""Recreate the implemented app as editable Penpot boards and review SVGs.

Run reference.ts first. Only this generator's deterministic shapes are updated;
hand-created boards are preserved. Run without --publish for local review exports.
"""

import argparse
import json
from pathlib import Path
from api import Penpot, ROOT
from scene import Board, Scene, C, FONT, REF, ZERO, uid, clock

PAGES = {
    'foundations': ('3da52804-324a-803a-8008-ba7ae8423fdd', '01 Foundations'),
    'app': ('d52e67c0-39bb-416a-b4b4-a0ce9a9b0398', '02 Current app'),
    'builder': (uid('page/builder'), '03 Builder & boards'),
    'timer': (uid('page/timer'), '04 Timer & recovery'),
    'share': (uid('page/share'), '05 Sharing & edge states'),
    'flows': ('01a9e3e6-c5b9-4411-ad50-dc125a035c71', '06 Storyboards'),
    'moonboard': ('f135c210-f44f-4df4-a087-1e4ae0026f09', '07 MoonBoard exploration'),
}
SCENE = Scene()
PRESETS = {p['id']:p for p in REF['presets']}
REPEATERS = PRESETS['repeaters-7-3']
DEMO_BOARD = 'beastmaker-1000'


def board(key,name,page,col=0,row=0,h=844,route='',note='',w=390,bg='background'):
    return Board(SCENE,key,name,PAGES[page][0],col*470,row*1640,w,h,bg,route,note)


def label(b,txt,y,x=24,w=342,size=14,color='mutedForeground',weight=400):
    return b.text(txt,x,y,w,size,weight,color)[0]


def section(b,txt,y,action=None,target=None):
    b.text(txt,24,y,250,20,600)
    if action:
        _,o=b.text(action,282,y+4,84,14,500,'foreground','right')
        if target:b.link(o,target)


def metrics(b,y,session=False,early=False):
    b.rect(24,y,342,164,'card','border')
    data=[('Elapsed time','8:32' if early else '24:10'),('Completed sets','2/6' if early else '6/6'),('Time hanging','1:27' if early else '4:12'),('Full hangs','12/36' if early else '36/36')] if session else [('Total time','24:10'),('Time hanging','4:12'),('Sets','6'),('Hangs','36')]
    for i,(k,v) in enumerate(data):
        x=40+(i%2)*171;yy=y+16+(i//2)*82;b.text(k,x,yy,154,14,500,'mutedForeground');b.text(v,x,yy+25,150,24,600)


def stats(b,y,empty=False):
    b.text('Your streak',24,y,150,14,400,'mutedForeground');b.text('0 weeks' if empty else '3 weeks',24,y+24,150,24,700)
    b.text('Sessions',202,y,150,14,400,'mutedForeground');b.text('0' if empty else '12',202,y+24,130,24,700)


def calendar(b,y,month=False,empty=False,previous=False):
    if month:
        b.text('September 2026' if previous else 'October 2026',24,y,250,20,600);b.icon('chevron-left',298,y,22);b.icon('chevron-right',344,y,22);y+=48
    else:
        _,o=b.text('This week',24,y,290,16,500);b.link(o,'calendar');b.icon('chevron-right',346,y+2,18);y+=48
    for i,ch in enumerate('MTWTFSS'):b.text(ch,24+i*48.86,y,48.86,14,500,'mutedForeground','center')
    y+=28
    days=([31]+list(range(1,31))+list(range(1,5)) if previous else list(range(28,31))+list(range(1,32))+[1]) if month else list(range(5,12))
    for i,d in enumerate(days):
        x=24+(i%7)*48.86;yy=y+(i//7)*48
        selected=month and d==8 and i<20;done=not empty and d in (1,5,7) and i<20
        b.rect(x+6,yy,36,36,'primary' if selected else 'chart1' if done else None,'foreground' if d==8 and i<20 else None,12,'Calendar / '+str(d))
        _,o=b.text(str(d),x,yy+7,48,16,600 if d==8 else 500,'primaryForeground' if selected else 'foreground','center')
        b.link(o,'calendar' if not month else 'session')
        if done:b.ellipse(x+22,yy+29,4,4)
    return y+((len(days)+6)//7)*48


def workout_card(b,y,p=REPEATERS,compact=False,x=24):
    w=256 if compact else 342;h=144 if compact else 118
    o=b.rect(x,y,w,h,'card','border');b.link(o,'overview')
    b.text(p['name'],x+16,y+14,w-32 if compact else w-75,16,600)
    label(b,p['summary'],y+43,x+16,w-32 if compact else w-50)
    label(b,clock(p['duration']),y+h-32,x+16,w-32)
    if compact:
        b.rect(x+16,y+76,60,22,'secondary',r=11,name='Preset badge');b.text('Preset',x+22,y+79,50,12,500)
    return y+h


def session_row(b,y,title='Repeaters 7:3',when='Today',feel=False,early=False):
    _,o=b.text(title,24,y+10,225,16,600);b.link(o,'session-ended' if early else 'session')
    label(b,'6 × (6 × 7s / 3s…)',y+37,24,230)
    b.text(when,265,y+10,101,12,500,'foreground','right')
    b.text('2/6 sets' if early else '6/6 sets',264,y+34,102,14,400,'destructive' if early else 'mutedForeground','right')
    if feel:b.icon('snail' if early else 'thumbs-up',237,y+20,22)
    b.rect(24,y+72,342,1,'border',r=0,name='Session divider')


def feels(b,y,selected='normal'):
    for i,(value,txt,icon) in enumerate([('weak','Weak','snail'),('normal','Normal','thumbs-up'),('strong','Strong','biceps-flexed')]):
        x=24+i*118;active=value==selected
        b.rect(x,y,106,106,'primary' if active else 'card','primary' if active else 'border')
        b.icon(icon,x+35,y+16,36,'primaryForeground' if active else 'foreground')
        b.text(txt,x+4,y+67,98,16,600,'primaryForeground' if active else 'foreground','center')


def step(b,y,kind='prep',time='10s',x=24,w=342,edit=False,grip=False,title=None):
    title=title or {'prep':'Get ready','hang':'Hang','rest':'Rest'}[kind]
    b.rect(x,y,w,72,'card','border',12,'Step / '+title)
    b.rect(x,y,6,72,{'prep':'accent','hang':'chart1','rest':'muted'}[kind],r=3,name='Step / phase rail')
    b.text(title,x+18,y+10,w-64,16,500);label(b,time,y+38,x+18,w-66)
    if edit:b.icon('chevron-down',x+w-73,y+26,18);b.icon('ellipsis-vertical',x+w-38,y+24,24)
    if grip:b.art(DEMO_BOARD,x+12,y+82,96,True);return y+120
    return y+72


def step_tree(b,y,edit=False,grip=False):
    y=step(b,y,edit=edit)+12
    height=456 if edit else (394 if grip else 364)
    b.rect(24,y,342,height,None,'border',12,'Repeat / sets')
    b.icon('repeat',38,y+15,20);b.text('6 times',66,y+12,180,18,600)
    if edit:b.icon('ellipsis-vertical',328,y+13,22)
    inner=y+50;ih=260 if edit else 246 if grip else 216
    b.rect(38,inner,314,ih,None,'border',12,'Repeat / reps')
    b.icon('repeat',50,inner+12,20);b.text('6 times',78,inner+10,160,18,600)
    if edit:b.icon('ellipsis-vertical',314,inner+11,22)
    yy=step(b,inner+48,'hang','7s',52,286,edit,grip)
    yy=step(b,yy+10,'rest','3s',52,286,edit)
    if edit:b.button('Add step',52,yy+8,286,36,'secondary',icon='plus',size=14)
    yy=step(b,inner+ih+12,'rest','3:00',38,314,edit)
    if edit:b.button('Add step',38,yy+10,150,36,'secondary',size=14);b.button('Add repeat',198,yy+10,154,36,'outline',size=14)
    return y+height


def hero(b,y,empty=False):
    b.rect(24,y,342,286,'secondary',r=16,name='Next up / hero')
    b.text('Next up',48,y+24,200,16,500);b.text('24:10',274,y+27,68,14,500,'foreground','right')
    _,o=b.text('Repeaters\n7:3',48,y+55,294,36,800,lh=40);b.link(o,'overview')
    label(b,REPEATERS['summary'],y+149,48,294)
    label(b,'Not done yet' if empty else 'Last done Yesterday · 6/6 sets',y+185,48,294)
    b.button('Start workout',48,y+216,294,56,icon='play',target='timer-prep',size=18)


def home(key='home',col=0,row=0,empty=False,recovery=False):
    h=1370 if recovery else 1120
    b=board(key,'Home / '+('unfinished workout' if recovery else 'first launch' if empty else 'returning climber'),'app',col,row,h,'/', 'Sample history; no feel grades on Home.')
    y=b.header('',home=True)
    if recovery:
        b.rect(24,y,342,256,'accent','border',16,'Recovery / unfinished workout')
        label(b,'Unfinished workout',y+22,48,294);b.text('Repeaters 7:3',48,y+48,294,24,600);label(b,'Set 3/6 · stopped 2 hours ago',y+86,48,294)
        b.button('Continue',48,y+126,294,target='timer-paused');b.button('Save as ended',48,y+190,165,44,'outline',target='session-ended',size=14);b.button('Discard',222,y+190,118,44,'ghost',target='discard-run',size=14)
        y+=272
    hero(b,y,empty);y+=302
    if empty:b.button('Choose your hangboard',24,y,342,44,'outline',target='board-setup',size=14);y+=60
    stats(b,y,empty);y+=85;y=calendar(b,y,empty=empty)+28
    section(b,'Your workouts',y);b.icon('plus',340,y,24);b.link(b.objects[-1],'new-workout');y+=50
    workout_card(b,y,PRESETS['max-hangs'],True);workout_card(b,y,PRESETS['density-hangs'],True,x=292);y+=172
    section(b,'Recent sessions',y,None if empty else 'View all','sessions');y+=40
    if empty:label(b,'No sessions yet. Press Start to do your first.',y)
    else:
        for i,day in enumerate(['Yesterday','3 days ago','Last week']):session_row(b,y+i*82,when=day)
        resize(b,y+270)
    return b


def overview(key='overview',col=3,row=0,grip=False):
    b=board(key,'Workout / '+('with board & grips' if grip else 'overview'),'app',col,row,1360 if grip else 1230,'/workout/[id]')
    y=b.header('Workout',right='Edit');b.link(b.objects[-1],'edit-workout')
    y+=b.text('Repeaters 7:3',24,y,342,30,700)[0]+16
    y+=label(b,REPEATERS['description'],y,size=16)+24;metrics(b,y);y+=180
    if grip:
        b.rect(24,y,342,146,'card','border');b.text('Beastmaker 1000',40,y+16,310,16,500);b.art(DEMO_BOARD,40,y+56,310,True);y+=162
    section(b,'The workout',y);y+=32;y+=label(b,REPEATERS['summary'],y)+16;y=step_tree(b,y,grip=grip)+20
    b.button('Duplicate',24,y,162,44,'outline',icon='copy',target='edit-workout',size=14);b.button('Share',198,y,168,44,'outline',icon='qr-code',target='share',size=14)
    label(b,'Last done Yesterday · 6/6 sets',y+64);b.rect(24,y+94,146,32,'secondary',r=16);b.icon('thumbs-up',34,y+100,18);b.text('Felt normal',58,y+101,108,14,600)
    b.footer('Start workout','timer-idle');return b


def app_screens():
    home();home('home-first',1,empty=True);home('home-recovery',2,recovery=True)
    overview();overview('overview-board',4,grip=True)
    b=board('workouts','Your workouts / saved library','app',5,0,844,'/workouts');b.header('Your workouts')
    for i,p in enumerate([REPEATERS,PRESETS['max-hangs'],PRESETS['density-hangs']]):workout_card(b,112+i*130,p)
    b.footer('New workout','new-workout')
    b=board('home-empty','Home / all workouts removed','app',0,1,844,'/');b.header('',home=True)
    b.rect(24,112,342,285,'card','border',16);b.text('Build your first\nworkout',48,136,294,24,600);label(b,'Start from a classic protocol, or put your own together step by step.',208,48,294)
    b.button('Classic workouts',48,278,294,target='presets',icon='library',size=18);b.button('New workout',48,342,294,40,'outline',target='new-workout',size=14)
    stats(b,425,True);calendar(b,514,empty=True);section(b,'Recent sessions',670);label(b,'No sessions yet. Press Start to do your first.',712)
    b=board('workouts-empty','Your workouts / empty','app',1,1,844,'/workouts');b.header('Your workouts');label(b,'No saved workouts yet.',112);b.footer('New workout','new-workout')
    b=board('sessions','Sessions / history by day','app',2,1,844,'/sessions');b.header('Sessions')
    for y,day,ended in [(112,'Today',False),(266,'Yesterday',True),(420,'October 5',False),(574,'September 29',False)]:label(b,day,y);session_row(b,y+30,when='18:42',feel=True,early=ended)
    b=board('calendar','Calendar / selected day','app',3,1,844,'/calendar');b.header('Calendar');stats(b,112);end=calendar(b,206,month=True);b.rect(24,end+16,342,1,'border',r=0);section(b,'October 8',end+40);label(b,'No sessions on this day.',end+84)
    b=board('calendar-history','Calendar / earlier month','app',4,1,844,'/calendar');b.header('Calendar');stats(b,112);end=calendar(b,206,month=True,previous=True);b.button('Back to this month',24,end+12,236,44,'outline',target='calendar',size=14);section(b,'September 8',end+80);session_row(b,end+120,when='18:42',feel=True)
    for key,col,ended,changed in [('session',0,False,False),('session-ended',1,True,False),('session-changed',2,False,True)]:
        b=board(key,'Session / '+('workout changed' if changed else 'ended early' if ended else 'completed'),'app',col,2,1180 if changed else 1080,'/session/[id]')
        b.header('Session');label(b,'Yesterday · 18:42',112);b.text('Repeaters 7:3',24,148,342,30,700);label(b,'Workout ended early' if ended else 'Workout completed',200)
        metrics(b,242,True,ended);label(b,'12/36 hangs · 1 cut short' if ended else '36/36 hangs',424)
        b.rect(24,466,342,1,'border',r=0);b.text('Workout as performed',24,488,342,16,500);label(b,REPEATERS['summary'],522)
        section(b,'How did you feel?',590);feels(b,632,'weak' if ended else 'normal')
        b.input('Session note','20 mm edge. Bodyweight.\nLast set felt solid.',768,h=82);b.button('Save note',24,890,130,40,'outline',size=14);b.text('Delete session',184,900,180,14,500,'destructive');b.link(b.objects[-1],'delete-session')
        if changed:
            label(b,'This workout has changed since this session.',950);b.button('Do it again',24,1010,target='timer-idle');b.button('Run the current version',24,1078,342,44,'outline',target='timer-idle',size=14)
        else:b.footer('Do it again','timer-idle')
    b=board('sessions-empty','Sessions / empty','app',3,2,844,'/sessions');b.header('Sessions');label(b,'No sessions yet.',112)
    # The complete library is a long board, like the scrollable app route.
    b=board('presets','Classic workouts / complete library','app',6,0,3780,'/presets','All ten implemented protocols and exact copy.')
    b.header('Classic workouts');y=112;y+=label(b,'Classic protocols with their usual numbers. Open one to start it as is, tweak it, or save it to your workouts.',y)+28
    for level in ['beginner','intermediate','advanced']:
        section(b,level.title(),y);y+=48
        for p in REF['presets']:
            if p['level']!=level:continue
            import textwrap
            titlelines=len(textwrap.wrap(p['name'],width=22));desclines=len(textwrap.wrap(p['description'],width=35));sumlines=len(textwrap.wrap(p['summary'],width=35))
            hh=50+titlelines*23+sumlines*20+desclines*24
            o=b.rect(24,y,342,hh,'card','border');b.link(o,'preset-builder')
            th=b.text(p['name'],44,y+20,248,18,600)[0];b.text(clock(p['duration']),292,y+23,54,12,500,'mutedForeground','right')
            sh=label(b,p['summary'],y+th+32,44,302)
            b.text(p['description'],44,y+th+sh+44,302,14,400,'mutedForeground',lh=24);y+=hh+12
        y+=22
    # Adapt board to the actual content rather than clip the last protocol.
    resize(b,y+24)
    b=board('home-desktop','Home / web desktop 1440','app',0,3,1190,'/','Web hides the scan button and centers a 768 px column.',w=1440)
    b.brand(16,14);x=360;y=80;b.rect(x,y,720,242,'secondary',r=16);b.text('Next up',x+24,y+24,500,16,500);b.text('24:10',x+620,y+26,76,14,500,'foreground','right')
    b.text('Repeaters 7:3',x+24,y+60,672,36,800);label(b,REPEATERS['summary'],y+116,x+24,672);label(b,'Last done Yesterday · 6/6 sets',y+148,x+24,672)
    b.button('Start workout',x+24,y+178,672,56,icon='play',target='timer-prep',size=18)
    label(b,'Your streak',352,x,200);b.text('3 weeks',x,380,200,24,700);label(b,'Sessions',352,x+210,200);b.text('12',x+210,380,200,24,700)
    b.text('This week',x,444,672,16,500);b.icon('chevron-right',x+696,446,20)
    for i,(ch,d) in enumerate(zip('MTWTFSS',range(5,12))):
        xx=x+i*102.86;b.text(ch,xx,498,102,14,500,'mutedForeground','center');b.rect(xx+33,536,36,36,'chart1' if d in (5,7) else None,'foreground' if d==8 else None,12);b.text(str(d),xx,544,102,16,500,'foreground','center')
    b.text('Your workouts',x,624,672,20,600);b.icon('plus',x+696,626,24)
    for i,p in enumerate([PRESETS['max-hangs'],PRESETS['density-hangs']]):workout_card(b,670,p,True,x=x+i*272)
    b.text('Recent sessions',x,854,550,20,600);b.text('View all',x+620,858,100,14,500,'foreground','right')
    for i,day in enumerate(['Yesterday','3 days ago','Last week']):
        yy=904+i*82;b.text('Repeaters 7:3',x,yy,540,16,600);label(b,REPEATERS['summary'],yy+28,x,540);b.text(day,x+600,yy+2,120,14,400,'foreground','right');b.text('6/6 sets',x+600,yy+30,120,14,400,'mutedForeground','right');b.rect(x,yy+65,720,1,'border',r=0)


def resize(b,height):
    b.h=height;o=b.objects[0];o['height']=height;o['selrect'].update(height=height,y2=b.y+height);o['points'][2]['y']=b.y+height;o['points'][3]['y']=b.y+height


def board_panel(b,y,selected=True,expanded=False):
    height=264 if expanded else 150 if selected else 126
    b.rect(24,y,342,height,'card','border');label(b,'Hangboard',y+16,40,220)
    b.text('Beastmaker 1000' if selected else 'No board selected',40,y+40,230,16,600)
    b.button('Done' if expanded else 'Change',276,y+20,74,40,'outline',target='builder-boards',size=12)
    if selected:b.art(DEMO_BOARD,40,y+78,310,True)
    else:label(b,'Choose a board to highlight grips on your hangs.',y+76,40,310)
    if expanded:
        for i,(txt,id) in enumerate([('No board',None),('Beastmaker 1000',DEMO_BOARD)]):
            x=40+i*155;b.rect(x,y+160,147,80,'accent' if id else 'card','foreground' if id else 'border',12)
            if id:b.art(id,x+10,y+171,127)
            else:b.text('—',x+10,y+168,127,16,400,'mutedForeground','center')
            b.text(txt,x+6,y+216,135,12,500,'foreground','center')
    return y+height


def builder_screens():
    for key,col,editing,selected,expanded in [('new-workout',0,False,False,False),('edit-workout',1,True,True,False),('preset-builder',2,False,False,False),('builder-boards',3,False,True,True)]:
        h=1480 if editing or expanded else 1350
        b=board(key,'Builder / '+{'new-workout':'new workout','edit-workout':'edit saved workout','preset-builder':'from classic protocol','builder-boards':'change board'}[key],'builder',col,0,h,'/workout/[id]/edit' if editing else '/workout/new?preset=repeaters-7-3' if key=='preset-builder' else '/workout/new')
        b.header('Edit workout' if editing else 'New workout');y=b.input('Name','Repeaters 7:3' if editing or key=='preset-builder' else 'Optional. Needed to save.',112,not(editing or key=='preset-builder'))+20
        b.text('Description' if editing or key=='preset-builder' else 'Add description',24,y,305,16,400);b.icon('chevron-down',342,y+2,20);y+=36
        if editing or key=='preset-builder':y+=label(b,REPEATERS['description'],y)+20
        if not editing:b.button('Start from a classic workout',24,y,342,44,'outline',icon='library',target='presets',size=14);y+=64
        b.rect(24,y,342,1,'border',r=0);y=board_panel(b,y+20,selected,expanded)+22
        section(b,'Steps',y,action='Reorder',target='reorder');y+=34
        y+=label(b,'24:10 total',y)+16
        y+=label(b,'Tap a step to edit its length, type, grip or label.',y)+20
        y=step_tree(b,y,True)+16
        b.button('Add step',24,y,165,44,'secondary',icon='plus',target='add-step',size=14);b.button('Add repeat',201,y,165,44,'secondary',icon='repeat',target='repeat-count',size=14)
        b.rect(24,y+68,342,1,'border',r=0);label(b,'Total',y+90);b.text('≈ 24:10',200,y+84,166,20,600,'foreground','right')
        if editing:b.text('Delete workout',24,y+130,230,14,500,'destructive');b.link(b.objects[-1],'delete-workout')
        b.footer('Save changes' if editing else 'Start','overview' if editing else 'timer-idle',None if editing else 'Save')
    b=board('step-expanded','Builder / inline Hang editor','builder',0,1,1060,'/workout/[id]/edit','Scrolled detail of one expanded step.')
    b.header('Edit workout');section(b,'Steps',112);y=step(b,156,'hang','7s · Medium edge',edit=True,grip=True)
    b.rect(24,y+12,342,350,'card','border');yy=y+26
    for i,name in enumerate(['Prep','Hang','Rest']):b.button(name,38+i*104,yy,104,44,'secondary' if name=='Hang' else 'outline',size=14)
    b.text('Hang length',40,yy+66,280,14,500);b.button('−',40,yy+100,52,48,'outline',size=24);b.text('7s',102,yy+110,172,24,600,'foreground','center');b.button('+',298,yy+100,52,48,'outline',size=24)
    b.rect(40,yy+166,310,104,'background','border',10);b.art(DEMO_BOARD,52,yy+178,286,True);b.text('Medium edge',52,yy+244,260,14,500);b.icon('chevron-right',320,yy+242,18);b.link(b.objects[-1],'hold-picker')
    b.input('', '20 mm half crimp',yy+290,h=44,x=40,w=310)
    step(b,y+382,'rest','3s',edit=True);b.footer('Save changes','overview-board')
    b=board('reorder','Builder / reorder steps','builder',1,1,844,'/workout/[id]/edit')
    b.header('Edit workout');section(b,'Steps',112,'Done','edit-workout');label(b,'Drag the handle to move a step.',156)
    for i,(title,time,phase) in enumerate([('Get ready','10s','accent'),('Repeat','6 × (6 × 7s / 3s…)', 'chart3'),('Rest','3:00','muted')]):
        y=200+i*90;b.rect(24,y,342,76,'card','border');b.rect(24,y,6,76,phase,r=3);b.text(title,42,y+12,255,16,500);label(b,time,y+42,42,255);b.icon('grip-vertical',324,y+25,24)
    b.footer('Save changes','overview')
    b=board('repeat-count','Builder / repeat count','builder',2,1,844,'/workout/[id]/edit');b.header('Edit workout');section(b,'Steps',112)
    b.rect(24,158,342,480,None,'border');b.icon('repeat',40,175);b.text('6 times',74,173,220,18,600);b.icon('ellipsis-vertical',328,175,22)
    label(b,'Rounds',230,40,280);b.button('−',40,264,52,48,'outline',size=24);b.text('6',105,273,171,24,600,'foreground','center');b.button('+',298,264,52,48,'outline',size=24)
    step(b,334,'hang','7s',40,310,True);step(b,418,'rest','3s',40,310,True);b.button('Add step',40,508,310,44,'secondary',target='add-step');b.footer('Save changes','overview')
    for key,col,kind in [('step-menu',3,'step'),('add-step',4,'add')]:
        b=board(key,'Builder / '+('step options' if kind=='step' else 'choose step type'),'builder',col,1,844,'/workout/[id]/edit');b.header('Edit workout');section(b,'Steps',112);step_tree(b,160,True)
        items=['Duplicate','Move up','Move down','Move out of repeat','Delete step'] if kind=='step' else ['Get ready','Hang','Rest']
        yy=216 if kind=='step' else 512;xx=126 if kind=='step' else 24;ww=240 if kind=='step' else 208
        b.rect(xx,yy,ww,len(items)*48+8,'card','border',10,'Dropdown menu')
        for i,txt in enumerate(items):b.text(txt,xx+14,yy+16+i*48,ww-28,14,400,'destructive' if txt.startswith('Delete') else 'foreground')
        b.footer('Save changes','overview')
    for key,col,selected in [('board-setup',0,True),('board-none',1,False)]:
        b=board(key,'Hangboard setup / '+('selected' if selected else 'no board'),'builder',col,2,844,'/board-setup')
        b.header('Your hangboard');b.text('Choose your board.',24,112,342,30,600);b.rect(24,158,342,1,'border',r=0);label(b,'New workouts start with this board selected. Your saved workouts keep their own board.',182)
        for i,(txt,id) in enumerate([('No board',None),('Beastmaker 1000',DEMO_BOARD)]):
            x=24+i*174;active=bool(id)==selected;b.rect(x,282,166,96,'accent' if active else 'card','foreground' if active else 'border')
            if id:b.art(id,x+12,294,142)
            else:b.text('—',x+12,306,142,20,400,'mutedForeground','center')
            b.text(txt,x+6,352,154,12,500,'foreground','center')
        if selected:
            b.rect(24,402,342,224,'card','border');b.art(DEMO_BOARD,40,422,310);b.text('Beastmaker 1000',40,530,310,16,600);label(b,'Pick the edge or grip on each Hang step in the builder.',566,40,310)
        b.button('Skip board setup',24,646,342,44,'ghost',target='home',size=14);b.footer('Use this board' if selected else 'Continue without a board','home')
    for key,col,selected in [('hold-picker',2,True),('hold-none',3,False)]:
        b=board(key,'Grip picker / '+('medium edge' if selected else 'no grip selected'),'builder',col,2,1180,'HoldPicker modal')
        b.header('Choose grip');b.text('Beastmaker 1000',24,112,342,24,600);b.art(DEMO_BOARD,24,168,342,selected)
        label(b,'Medium edge' if selected else 'Tap a hold on the board or pick one below',282,24,342)
        bb=REF['boards'][0];y=344
        for row in sorted(set(g['row'] for g in bb['grips'])):
            label(b,'Top' if row==1 else f'Row {row}',y);y+=32;x=24
            for grip in [g for g in bb['grips'] if g['row']==row]:
                w=min(342,len(grip['name'])*8.5+28)
                if x+w>366:x=24;y+=60
                b.button(grip['name'],x,y,w,48,'primary' if selected and grip['name']=='Medium edges · 20 mm' else 'outline',size=14);x+=w+8
            y+=76
        b.button('No grip selected',24,y,205,44,'outline',target='hold-none',size=14)
        resize(b,max(1180,y+200));b.footer('Use this grip' if selected else 'Use no grip','step-expanded')
    # All supported board assets, independent of the currently selected board.
    b=board('board-catalogue','Hangboard assets / all eight models','builder',4,2,1400,'BoardPicker','Actual bundled artwork; choose a model in the app’s horizontal picker.',w=790)
    b.text('Hangboard library',32,32,726,30,700);label(b,'All eight supported models · bundled artwork',84,32,726)
    for i,bb in enumerate(REF['boards']):
        xx=32+(i%2)*380;yy=146+(i//2)*290;b.rect(xx,yy,346,262,'card','border');b.art(bb['id'],xx+18,yy+30,310);b.text(bb['name'],xx+18,yy+176,310,16,600)
    b=board('description-expanded','Builder / expanded description','builder',0,3,1000,'/workout/[id]/edit');b.header('Edit workout');b.input('Name','Repeaters 7:3',112);b.text('Description',24,218,310,16,400);b.icon('chevron-down',342,220,20)
    b.input('Description',REPEATERS['description'],264,h=156);board_panel(b,474);section(b,'Steps',660);label(b,'24:10 total',698);label(b,'Tap a step to edit its length, type, grip or label.',736);b.footer('Save changes','overview')
    b=board('builder-empty','Builder / no hangs validation','builder',1,3,920,'/workout/new');b.header('New workout');b.input('Name','Optional. Needed to save.',112,True);b.text('Add description',24,220,300,16,400);board_panel(b,278,False);section(b,'Steps',436,'Reorder');label(b,'0:00 total',478);label(b,'Tap a step to edit its length, type, grip or label.',516);label(b,'No steps yet.',588)
    b.button('Add step',24,638,165,44,'secondary',target='add-step',size=14);b.button('Add repeat',201,638,165,44,'secondary',target='repeat-count',size=14);b.text('Add at least one hang.',24,714,342,16,400,'destructive');label(b,'Total',758);b.text('≈ 0:00',226,752,140,20,600,'foreground','right');b.button('Save',24,838,165,56,'disabled');b.button('Start',201,838,165,56,'disabled')


def timer(key,name,col,row=0,phase='prep',paused=False,idle=False,genz=False,board_cue=False):
    bg='background' if idle else {'prep':'accent','hang':'chart1','pause':'secondary','rest':'muted'}[phase]
    b=board(key,name,'timer',col,row,844,'/workout/[id]/run' if not key.startswith('draft') else '/workout/run',bg=bg)
    b.text('9:41',24,10,100,12,600);b.icon('x',24,54);b.link(b.objects[-1],'end-dialog');b.text('Repeaters 7:3',70,56,250,16,500,'foreground','center');b.icon('settings-2',342,54);b.link(b.objects[-1],'timer-settings')
    if phase=='hang' and not idle:b.rect(0,422 if not genz else 260,390,422 if not genz else 260,'secondary',r=0,name='Hang progress / rising rest color')
    # Place the fill behind the already-created header.
    if phase=='hang' and not idle:
        o=b.objects.pop();b.objects.insert(1,o);s=b.svg.pop();b.svg.insert(0,s)
    b.text('PAUSED' if paused else 'GET READY' if phase=='prep' else 'HANG' if phase=='hang' else 'REST',24,126 if not genz else 112,342,24,600,'foreground','center')
    if not genz:b.text('Rep 2/6    Set 1/6' if phase in ('hang','pause') else 'Set 1/6',24,170,342,24,600,'foreground','center')
    if board_cue:b.art(DEMO_BOARD,24,226,342,True);b.text('Next: Medium edge',24,329,342,14,400,'mutedForeground','center')
    digits='10' if idle else '7' if phase=='prep' else '4' if phase=='hang' else '3' if phase=='pause' else '2:48'
    size=96 if genz else 128 if phase=='rest' else 200
    yy=190 if genz else 373 if board_cue else 296
    b.text(digits,24,yy,342,size,700,'foreground','center',lh=size*1.1)
    if not genz:
        if idle:b.text('Press Start when you’re ready.',24,608,342,14,400,'mutedForeground','center')
        else:
            b.rect(24,580,342,76,'background','border');label(b,'Next up',594,40,310);b.text('Rest 3s' if phase=='hang' else 'Hang 7s',40,619,310,16,500)
    control_y=370 if genz else 684
    if paused:
        b.button('',24,control_y+12,56,56,'outline',icon='skip-back',target='timer-prep');b.button('Resume',92,control_y,206,80,icon='play',target='timer-hang',size=18);b.button('',310,control_y+12,56,56,'outline',icon='skip-forward',target='timer-rest')
    else:b.button('Start' if idle else 'Pause',24,control_y,342,64 if genz else 80,icon='play' if idle else 'pause',target='timer-prep' if idle else 'timer-paused',size=18)
    if not genz and not idle:b.button('End workout',100,776,190,40,'ghost',target='end-dialog',size=14)
    if genz:
        b.rect(0,470,390,374,'muted',r=0,name='Bundled gameplay viewport')
        b.text('Video unavailable',24,640,342,14,400,'mutedForeground','center')
        b.note='Implemented media failure state. Normal playback uses the local video asset, represented on the adjacent board.'
    return b


def summary(key,col,row=1,ended=False,draft=False):
    b=board(key,'Finish / '+('save a draft workout' if draft else 'ended early' if ended else 'completed'),'timer',col,row,1090 if draft else 950,'/workout/run' if draft else '/workout/[id]/run')
    b.icon('x',24,54);b.text('Repeaters 7:3',70,56,250,16,500,'foreground','center');b.text('Workout ended' if ended else 'Workout\ncomplete',24,122,342,30,700);label(b,'Your session is saved.',210)
    metrics(b,256,True,ended);label(b,'12/36 hangs · 1 cut short' if ended else '36/36 hangs',440)
    section(b,'How did you feel?',510);feels(b,554,None)
    b.input('Session note (optional)','Holds, load, or something to remember.',688,True,84)
    if draft:
        section(b,'Save this workout?',830);b.input('','Give it a name to keep it',870,True);label(b,'Leave it empty to finish without saving.',936);b.button('Finish',24,1006,target='home')
    else:b.button('Finish',24,842,target='home')
    return b


def timer_screens():
    timer('timer-idle','Timer / ready to start',0,idle=True)
    timer('timer-prep','Timer / preparation with grip cue',1,board_cue=True)
    timer('timer-hang','Timer / hang & rising fill',2,phase='hang')
    timer('timer-pause','Timer / pause between reps',3,phase='pause')
    timer('timer-rest','Timer / rest between sets',4,phase='rest')
    timer('timer-paused','Timer / paused with back & skip',5,phase='hang',paused=True)
    summary('summary',0);summary('summary-ended',1,ended=True);summary('summary-draft',2,draft=True)
    b=timer('timer-settings','Timer / workout settings',3,1,phase='hang',paused=True)
    b.rect(142,92,224,160,'card','border',10,'Settings menu')
    for i,(name,checked) in enumerate([('Sound',True),('Vibration',True),('Gen Z mode',False)]):
        if checked:b.icon('check',156,108+i*48,18)
        b.text(name,186,106+i*48,164,14,400)
    timer('genz-fallback','Timer / Gen Z media unavailable',4,1,phase='hang',genz=True)
    b=timer('genz-playback','Timer / Gen Z local playback',5,1,phase='hang',genz=True)
    b.note='Video region represented by a still from the app’s bundled gameplay; playback itself remains in the app.'
    # A still is optionally provided by the local media preparation command.
    if (ROOT/'design/.local/gameplay.png').exists():
        import base64
        media=json.loads((ROOT/'design/.local/gameplay-media.json').read_text());o=b.rect(0,470,390,374,None,r=0,name='Bundled gameplay / representative still')
        o['fills']=[{'fillImage':{'id':media['id'],'width':media['width'],'height':media['height'],'mtype':'image/png','name':'Bundled gameplay still','keepAspectRatio':False},'fillOpacity':1}]
        data=base64.b64encode((ROOT/'design/.local/gameplay.png').read_bytes()).decode();b.svg.append(f'<image x="0" y="470" width="390" height="374" preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,{data}"/>')
    for key,col,ended in [('timer-done',0,False),('timer-ended',1,True)]:
        b=board(key,'Timer / '+('Ended' if ended else 'Done')+' beat','timer',col,2,844,'/workout/[id]/run','900 ms transition before the summary appears.')
        b.icon('x',24,54);b.text('Repeaters 7:3',70,56,250,16,500,'foreground','center');b.text('Ended' if ended else 'Done',24,352,342,48,700,'foreground','center');b.text('2/6 sets · 8:32' if ended else '6/6 sets · 24:10',24,422,342,24,400,'foreground','center');b.link(b.objects[0],'summary-ended' if ended else 'summary')


def dialog(key,title,desc,cancel,action,page,col,row,target):
    b=board(key,'Dialog / '+title,page,col,row,844,'Modal state')
    if key=='end-dialog':
        b.rect(0,0,390,844,'chart1',r=0);b.icon('x',24,54);b.text('Repeaters 7:3',70,56,250,16,500,'foreground','center');b.icon('settings-2',342,54)
        b.text('PAUSED',24,126,342,24,600,'foreground','center');b.text('Rep 2/6    Set 1/6',24,170,342,24,600,'foreground','center');b.text('4',24,296,342,200,700,'foreground','center');b.button('Resume',24,684,342,80,icon='play')
    elif key=='discard-run':
        b.header('',home=True);b.rect(24,112,342,256,'accent','border');label(b,'Unfinished workout',134,48,294);b.text('Repeaters 7:3',48,160,294,24,600);hero(b,400)
    elif page=='builder':
        b.header('Edit workout');b.input('Name','Repeaters 7:3',112);board_panel(b,230);section(b,'Steps',422);step_tree(b,466,True)
    else:
        b.header('Session');label(b,'Yesterday · 18:42',112);b.text('Repeaters 7:3',24,148,342,30,700);label(b,'Workout completed',200);metrics(b,242,True)
    overlay=b.rect(0,0,390,844,'foreground',r=0,name='Modal scrim');overlay['opacity']=.5;b.svg[-1]=b.svg[-1].replace('/>',' opacity="0.5"/>')
    b.rect(24,272,342,290,'card','border',12,'Alert dialog');b.text(title,48,298,294,18,600);label(b,desc,354,48,294)
    b.button(cancel,48,444,294,44,'outline',target='edit-workout' if page=='builder' else 'timer-paused' if page=='timer' else 'session',size=14)
    b.button(action,48,498,294,44,target=target,size=14);return b


def sharing_screens():
    b=board('share','Share / valid workout QR','share',0,0,844,'/workout/[id]/share','The QR encodes the actual Repeaters 7:3 preset and is scannable.')
    b.brand(16,49);b.icon('x',342,54);b.link(b.objects[-1],'overview');b.text('Repeaters 7:3',24,192,342,24,700,'foreground','center');b.text(REPEATERS['summary'],24,240,342,14,400,'mutedForeground','center')
    qr=REF['qr'];module=342/(qr['size']+8);b.rect(24,314,342,342,'card',r=0,name='QR / quiet zone')
    # Merge contiguous dark modules per row, retaining editable vector rectangles.
    for row in range(qr['size']):
        col=0
        while col<qr['size']:
            if not qr['data'][row*qr['size']+col]:col+=1;continue
            start=col
            while col<qr['size'] and qr['data'][row*qr['size']+col]:col+=1
            b.rect(24+(start+4)*module,314+(row+4)*module,(col-start)*module,module,'foreground',r=0,name='QR / modules')
    b.text('Scan it with the camera button on the 67slopers home screen.',24,694,342,14,400,'mutedForeground','center')
    for key,col,state in [('scan-permission',1,'permission'),('scan-camera',2,'camera'),('scan-blocked',3,'blocked'),('scan-invalid',4,'invalid'),('scan-web',5,'web')]:
        b=board(key,'Scan / '+state,'share',col,0,844,'/scan','Camera preview is a schematic placeholder; camera access is only requested here.')
        b.text('Scan a workout',24,54,290,20,600);b.icon('x',342,54);b.link(b.objects[-1],'home')
        if state=='web':b.text('Scan workouts with 67slopers on your phone.',24,398,342,14,400,'mutedForeground','center');continue
        b.rect(24,244,342,342,'muted',r=16,name='Camera permission / preview')
        if state in ('permission','blocked'):
            msg='Camera access is off for 67slopers. Turn it on in the settings to scan workouts.' if state=='blocked' else "Allow the camera to scan a workout’s QR code. Only the code is read."
            b.text(msg,48,324,294,16,400,'foreground','center');b.button('Open settings' if state=='blocked' else 'Allow camera',72,456,246,44,target='scan-camera',size=14)
        else:
            b.rect(24,244,342,342,'foreground',r=16,name='Camera / schematic preview');b.rect(84,304,222,222,None,'card',12,name='Example code position');b.text('Camera preview',48,404,294,16,400,'card','center');b.link(b.objects[-1],'import')
        b.text('That QR code is not a 67slopers workout.' if state=='invalid' else 'Point the camera at the QR code on a workout’s Share screen.',24,610,342,14,400,'mutedForeground','center')
    for key,col,saved in [('import',0,False),('import-saved',1,True)]:
        b=board(key,'Shared workout / '+('already saved' if saved else 'preview'),'share',col,1,1230,'/import?code=…');b.header('Shared workout');y=112;y+=b.text('Repeaters 7:3',24,y,342,30,700)[0]+22
        b.rect(24,y,342,100,'secondary');label(b,'You already have this workout.' if saved else 'Shared with you. Save it to your workouts, or start it without saving.',y+16,40,310,size=16);y+=120
        y+=label(b,REPEATERS['description'],y,size=16)+22;metrics(b,y);y+=190;section(b,'The workout',y);step_tree(b,y+44)
        b.footer('Open saved copy' if saved else 'Save','overview',secondary='Start')
    b=board('import-error','Shared workout / invalid code','share',2,1,844,'/import?code=invalid');b.header('Shared workout');b.text('This QR code is not a 67slopers workout.',24,112,342,18,400);b.button('Scan again',24,202,180,44,'outline',target='scan-permission',size=14)
    for key,col,kind in [('missing-workout',3,'workout'),('missing-session',4,'session'),('share-error',5,'share')]:
        b=board(key,'Unavailable / '+kind,'share',col,1,844,'/workout/[id]' if kind=='workout' else '/session/[id]' if kind=='session' else '/workout/[id]/share')
        b.header('Workout' if kind=='workout' else 'Session' if kind=='session' else 'Share')
        label(b,'Fix this workout in the editor before sharing it.' if kind=='share' else f'This {kind} no longer exists.',112)
        if kind!='share':b.button('Back to home',24,192,190,44,'outline',target='home',size=14)
    dialog('delete-session','Delete this session?','It disappears from your history and streak. The workout itself is kept.','Cancel','Delete','share',0,2,'sessions')
    dialog('delete-workout','Delete this workout?','Past sessions keep their own copy of the timings, so history is not affected.','Cancel','Delete','builder',4,0,'workouts')
    dialog('change-board','Clear hold choices?','Holds belong to a board, so changing it forgets which holds each hang uses.','Keep board','Change board','builder',5,0,'builder-boards')
    dialog('end-dialog','End this workout?','It will be saved with the sets you completed so far.','Keep going','End','timer',2,2,'summary-ended')
    dialog('discard-run','Discard this workout?','Nothing from it is kept in your history.','Keep it','Discard','timer',3,2,'home')
    b=board('draft-empty','Run / no draft','share',1,2,844,'/workout/run');b.text('Nothing to run.',24,374,342,14,400,'mutedForeground','center');b.button('Back to home',98,420,194,44,'outline',target='home',size=14)
    b=board('opening-workout','Run / hydration in progress','share',2,2,844,'/workout/[id]/run','Brief local-storage hydration state on a direct link.');b.text('Opening workout…',24,398,342,14,400,'mutedForeground','center')


def foundations():
    b=board('foundations','67slopers / visual foundations','foundations',0,0,1250,w=1120)
    b.brand(40,40);b.text('Current app design',40,116,1040,48,700);label(b,'Editable reference · 8 October 2026 · Expo SDK 57',190,40,1040,size=18)
    b.text('One appearance. Local by design.',40,272,1040,30,600);label(b,'A quiet off-white canvas, charcoal actions, amber training cues, and Geist Mono throughout.',328,40,1040,size=18)
    for i,key in enumerate(['background','foreground','card','secondary','accent','muted','border','input','ring','chart1','destructive','mutedForeground']):
        x=40+(i%4)*270;y=428+(i//4)*158;b.rect(x,y,230,84,key,'border',12,'Color / '+key);b.text(key,x,y+98,230,14,500);b.text(C[key].upper(),x,y+122,230,12,400,'mutedForeground')
    b.text('Geist Mono',40,960,500,36,700);label(b,'400 Regular · 500 Medium · 600 Semibold\n700 Bold · 800 ExtraBold',1018,40,500,size=16)
    label(b,'Spacing: 4 · 8 · 12 · 16 · 24 · 32\nRadius: 8 / 10 / 12 / 16 px\nScreen inset: 24 px\nContent max width: 768 px',962,610,470,size=16)
    b.text('Use the implemented palette in src/lib/theme.ts and src/global.css.',40,1170,1040,14,400,'mutedForeground')
    b=board('type-scale','Typography / app scale','foundations',0,1,900,w=1120)
    b.text('Typography',40,40,1040,36,700)
    for y,size,weight,txt,desc in [(122,36,800,'Repeaters 7:3','Hero · text-4xl / extrabold'),(232,30,700,'Workout complete','Screen title · text-3xl / bold'),(334,24,600,'6/6','Metric · text-2xl / semibold'),(434,20,600,'Recent sessions','Section · text-xl / semibold'),(518,18,600,'67slopers','Header · text-lg / semibold'),(604,16,400,'Press Start when you’re ready.','Body · text-base / normal'),(682,14,400,'Last done Yesterday · 6/6 sets','Secondary · text-sm / normal'),(762,12,500,'Preset','Compact label · text-xs / medium')]:
        b.text(txt,40,y,670,size,weight);b.text(desc,720,y+8,360,14,400,'mutedForeground')
    b=board('components','Components / editable masters','foundations',3,0,1440,w=1120)
    b.text('Shared components',40,40,1040,36,700)
    for i,(variant,txt) in enumerate([('primary','Start workout'),('outline','New workout'),('secondary','Add repeat'),('ghost','End workout')]):b.button(txt,40+(i%2)*380,128+(i//2)*88,342,56,variant,icon='play' if i==0 else None)
    b.input('Name','Repeaters 7:3',346,x=40,w=342);b.input('Session note','Holds, load, or something to remember.',346,True,90,x=420,w=342)
    b.text('Workout facts',40,510,400,20,600);metrics(b,554)
    b.text('Feel picker',420,510,400,20,600)
    # Use a grouped, independently editable feel control master on its own board below.
    for i,name in enumerate(['snail','thumbs-up','biceps-flexed']):b.icon(name,440+i*116,574,36)
    b.text('Weak      Normal    Strong',420,650,650,16,600)
    b.text('Step cards & repeats',40,790,1040,20,600);step_tree(b,846)
    b.text('Phase palette',460,790,600,20,600)
    for i,(txt,c) in enumerate([('Get ready','accent'),('Hang','chart1'),('Rest / reps','secondary'),('Rest / sets','muted'),('Idle & finish','background')]):
        b.rect(460,846+i*96,560,78,c,'border');b.text(txt,480,868+i*96,520,20,600)
    b=board('icon-library','Icons / Phosphor vectors','foundations',3,1,860,w=1120)
    b.text('Icons & board guidance',40,40,1040,36,700);label(b,'Phosphor Regular for UI. Bold for timer actions. Bundled, editable vectors.',104,40,1040,size=16)
    for i,name in enumerate(REF['icons']):
        x=40+(i%6)*178;y=190+(i//6)*122;b.icon(name,x+8,y,32);b.text(REF['icons'][name]['name'],x,y+48,165,12,400)
    b.art(DEMO_BOARD,40,710,480,True);b.text('One grip per hang: mirrored pair or center hold.',580,726,480,18,500)
    # Real Penpot component masters, available from Assets for future design work.
    for i,(key,txt,variant) in enumerate([('button-primary','Start workout','primary'),('button-outline','New workout','outline'),('button-secondary','Add repeat','secondary')]):
        b=board(key,'Button / '+variant,'foundations',i,2,56,w=342,bg='background');b.button(txt,0,0,342,56,variant)
        comp=uid('component/'+key);b.objects[0].update(componentId=comp,componentFile=None,componentRoot=True,mainInstance=True)
        SCENE.extra.append(dict(type='add-component',id=comp,name=variant.title(),path='Buttons',mainInstanceId=b.id,mainInstancePage=b.page))


def storyboards():
    b=board('storyboards','67slopers / navigation & state map','flows',0,0,2110,w=1840)
    b.text('The full app, connected',48,40,1744,48,700);label(b,'Screen keys match the boards on pages 02–05. Sample data is illustrative; behavior comes from the current source.',114,48,1744,size=18)
    flows=[
        ('01 / Train now',[('Home','Start workout','home'),('Get ready','Starts immediately','timer-prep'),('Hang / rest','Foreground cues','timer-hang'),('Saved session','Grade & note','summary'),('Home','Latest session shown','home')]),
        ('02 / Build a workout',[('New workout','Steps or classic protocol','new-workout'),('Choose board','Optional default','board-setup'),('Edit steps','Prep, hang, rest, repeats','step-expanded'),('Choose grip','One symmetric grip','hold-picker'),('Save or start','Draft can run unsaved','preset-builder')]),
        ('03 / Recover an interruption',[('Unfinished card','Checkpoint on Home','home-recovery'),('Continue','Opens paused','timer-paused'),('Resume','Same interval','timer-hang'),('Save as ended','Actual work retained','session-ended'),('Discard','Confirmation required','discard-run')]),
        ('04 / Review & repeat',[('Calendar / history','Select a session','sessions'),('Session','Actual time & hangs','session'),('Grade / note','Can be edited later','session'),('Do it again','Uses session snapshot','session-changed'),('Run','Current version optional','timer-idle')]),
        ('05 / Share offline',[('Workout','Share action','overview'),('QR code','Workout encoded locally','share'),('Scan','Native camera permission','scan-permission'),('Preview','No automatic save','import'),('Save or start','Existing copy detected','import-saved')]),
        ('06 / End & save a draft',[('Timer','Close or End workout','timer-hang'),('Confirmation','Sets completed so far','end-dialog'),('Ended','Session saved at stop','summary-ended'),('Optional name','Keep the draft workout','summary-draft'),('Finish','Return home','home')]),
    ]
    for row,(name,nodes) in enumerate(flows):
        y=230+row*292;b.text(name,48,y,1744,24,600)
        for i,(title,desc,target) in enumerate(nodes):
            x=48+i*350;o=b.rect(x,y+62,304,160,'secondary' if i==0 else 'card','border');b.link(o,target);b.text(title,x+20,y+84,264,20,600);b.text(desc,x+20,y+132,264,14,400,'mutedForeground');b.text(target,x+20,y+180,264,11,400,'mutedForeground')
            if i<4:b.icon('chevron-right',x+316,y+124,22)
    b.text('Timer motion: phase flip 180 ms · background & board reveal 250 ms · Gen Z split 300 ms · hang fill 100 ms · summary delay 900 ms',48,2020,1744,14,400,'mutedForeground')
    b=board('scope','Reading this file / scope & conventions','flows',0,2,800,w=1120)
    b.text('A design reference we can edit together',40,40,1040,36,700)
    paragraphs=[
        'The boards reproduce the implemented app, with native phone chrome and a 390 px content width. Long boards show the complete scrollable content. Web uses the same centered column (max 768 px), hides the Home scanner, and shows a phone-only scanning message.',
        'Every title, label, button, card, calendar cell, QR module, and icon is editable. Hangboard pictures and the gameplay still reuse bundled app assets. The font weights are installed in this local Penpot team.',
        'History, dates, grades, and session notes are representative design fixtures. Camera preview is schematic. The video still represents the local playback surface. OS permission prompts and keyboard UI are supplied by the platform.',
        'Main action hotspots connect representative states. Cross-page links open the destination in another Penpot preview tab. This design prototype does not run a live countdown, save workouts, or scan QR codes. Use the app for behavior testing.',
        'Duplicate a board before exploring a change. Keep reviewed editable exports in design/penpot and review images in design/exports. MoonBoard remains a separate exploration; this recreation does not expand the app scope.',
    ]
    y=134
    for paragraph in paragraphs:y+=b.text(paragraph,40,y,1040,18,400,lh=28)[0]+24
    b=board('moonboard-placeholder','MoonBoard / reserved exploration','moonboard',0,0,520,w=1120)
    b.text('MoonBoard exploration',40,40,1040,40,700);b.text('Start here after reviewing the current app.',40,118,1040,24,500)
    label(b,'This page is intentionally separate from the implemented app.\nNo MoonBoard support has been designed or added in this recreation.',200,40,1040,size=18)
    for i,title in enumerate(['User story','Board & problem flow','Design alternatives']):b.rect(40+i*350,328,324,120,'card','border');b.text(title,60+i*350,372,284,18,600)


def add_library(p):
    f=p.file();changes=[]
    for name,color in C.items():
        id=uid('color/'+name);changes.append(dict(type='mod-color' if id in f['data'].get('colors',{}) else 'add-color',color=dict(id=id,name=name,path='67slopers',color=color,opacity=1)))
    for size,weight,name in [(12,500,'Caption'),(14,400,'Secondary'),(16,400,'Body'),(16,600,'Row title'),(18,600,'Header'),(20,600,'Section'),(24,600,'Metric'),(30,700,'Screen title'),(36,800,'Hero'),(200,700,'Timer digits')]:
        id=uid('type/'+name);changes.append(dict(type='mod-typography' if id in f['data'].get('typographies',{}) else 'add-typography',typography=dict(id=id,name=name,path='67slopers',fontId=FONT,fontFamily='Geist Mono',fontVariantId=f'normal-{weight}',fontSize=str(size),fontWeight=str(weight),fontStyle='normal',lineHeight='1.25',letterSpacing='0',textTransform='none')))
    p.update(changes)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--publish',action='store_true');args=parser.parse_args()
    foundations();app_screens();builder_screens();timer_screens();sharing_screens();storyboards();SCENE.resolve()
    exportdir=ROOT/'design/exports/current-app';exportdir.mkdir(parents=True,exist_ok=True)
    for b in SCENE.boards:b.save_svg(exportdir)
    manifest=[dict(key=b.key,name=b.name,pageId=b.page,boardId=b.id,route=b.route,width=b.w,height=b.h,note=b.note,shapes=len(b.objects)) for b in SCENE.boards]
    (ROOT/'design/screens/inventory.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'Generated {len(SCENE.boards)} boards and {sum(len(b.objects) for b in SCENE.boards)} editable shapes.',flush=True)
    if args.publish:
        p=Penpot();f=p.file();changes=[]
        for i,(id,name) in enumerate(PAGES.values()):
            changes.append(dict(type='mod-page' if id in f['data']['pagesIndex'] else 'add-page',id=id,name=name))
        p.update(changes);p.update([dict(type='mov-page',id=id,index=i) for i,(id,name) in enumerate(PAGES.values())])
        # Remove only our initial two-shape font probe.
        probe='18149d3c-067a-5bc2-8778-b48b95911ae0'
        if probe in f['data']['pagesIndex'][PAGES['foundations'][0]]['objects']:
            p.update([dict(type='del-obj',id=probe,pageId=PAGES['foundations'][0])])
        for b in SCENE.boards:
            if b.objects[0].get('componentRoot'):b.objects[0]['componentFile']=p.workspace['fileId']
        SCENE.publish(p);add_library(p)
        f=p.file();newcomponents=[c for c in SCENE.extra if c['id'] not in f['data'].get('components',{})]
        if newcomponents:p.update(newcomponents)
        print('Saved editable Penpot export:',p.export(ROOT/'design/penpot/67slopers.penpot'),'bytes',flush=True)


if __name__=='__main__':main()
