"""Additive, source-backed Penpot component library. Never regenerates app pages.

Without --publish writes review SVGs and a portable token specification. Publishing
only updates IDs in this generator's separate manifest; pass --replace-generated
explicitly to overwrite its already-published library after manual editing.
"""
import argparse
import copy
import html
import json
import re
from contextlib import contextmanager
from pathlib import Path
from api import Penpot, ROOT
from scene import Board, Scene, C, FONT, FILE, ZERO, REF, uid

PAGES = {key: (uid('system/page/'+key), name) for key,name in [
    ('foundations','00.1 Design system · Foundations'),
    ('controls','00.2 Design system · UI components'),
    ('patterns','00.3 Design system · Training patterns')]}
SCENE = Scene()
COMPONENTS = []
MASTERS = {}
STYLES = {}
TOKENS = {}
OUT = ROOT/'design/exports/design-system'
MANIFEST = ROOT/'design/foundations/library.json'
OWNERSHIP = ROOT/'design/.local/design-system-owned.json'


def token(name, typ, value, description):
    TOKENS[name] = dict(id=uid('system/token/'+name),name=name,type=typ,value=value,description=description)


for key,value in C.items(): token('color.'+key,'color',value,'Implemented semantic color: '+key)
for n in (0,2,4,6,8,12,16,20,24,32,40,48): token('space.'+str(n),'spacing',str(n)+'px','NativeWind spacing, inline rem = 16 px')
for name,n in [('sm',8),('md',10),('lg',12),('xl',16),('full',9999)]: token('radius.'+name,'border-radius',str(n)+'px','rounded-'+name)
for name,n in [('buttonSm',40),('button',44),('buttonLg',56),('timerAction',80),('screenInset',24),('contentMax',768)]: token('size.'+name,'sizing',str(n)+'px','Implemented '+name)
for name,n in [('disabled',0.5),('pressed',0.7),('solidAction',0.9)]: token('opacity.'+name,'opacity',str(n),'Current opacity for '+name)
for phase,col in [('prep','accent'),('hang','chart1'),('repRest','secondary'),('setRest','muted'),('idle','background')]: token('phase.'+phase,'color','{color.'+col+'}','Timer phase; also communicate with a text label')
token('motion.disclosure','number','150','Milliseconds; source: disclosure-motion.tsx. Respect reduced motion.')
token('type.family','font-family','Geist Mono','Bundled font; five weights installed in local Penpot team')
TYPE_SPECS=[('Caption',12,500,16),('Muted',14,400,20),('Control',14,500,20),('Small',14,500,14),('Body',16,400,24),('Emphasis',16,500,24),('Row',16,600,24),('Header',18,600,28),('Section',20,600,28),('Metric',24,600,32),('Statistic',24,700,32),('Heading',30,600,36),('Screen',30,700,36),('Hero',36,800,40),('Timer',200,700,200)]
for name,size,weight,line in TYPE_SPECS:
    sid=uid('system/type/'+name)
    STYLES[(size,weight,line)] = dict(id=sid,name=name,path='67slopers/System',fontId=FONT,fontFamily='Geist Mono',fontVariantId=f'normal-{weight}',fontSize=str(size),fontWeight=str(weight),fontStyle='normal',lineHeight=str(line/size),letterSpacing='0',textTransform='none')
    token('type.'+name.lower()+'.size','font-size',str(size)+'px',name+' text size')
    token('type.'+name.lower()+'.weight','font-weight',str(weight),name+' font weight')


class Canvas(Board):
    def __init__(self,key,title,page,col,row,h=1100):
        self.parent=None
        super().__init__(SCENE,'ds-'+key,title,PAGES[page][0],col*1320,row*1800,1200,h)
        self.text('67SLOPERS / DESIGN SYSTEM',40,32,1120,12,500,'mutedForeground',lh=16)
        self.text(title,40,76,1120,36,800,lh=40)
    def _shape(self,*args,**kwargs):
        if self.parent and not kwargs.get('parent'): kwargs['parent']=self.parent
        o=super()._shape(*args,**kwargs)
        for stroke in o.get('strokes',[]):
            for key,col in C.items():
                if col==stroke['strokeColor']:
                    stroke.update(strokeColorRefId=uid('color/'+key),strokeColorRefFile=FILE);break
        return o
    def text(self,*args,**kwargs):
        height,o=super().text(*args,**kwargs)
        a=o['content']['children'][0]['children'][0]
        key=(int(a['fontSize']),int(a['fontWeight']),round(float(a['lineHeight'])*int(a['fontSize'])))
        if self.parent:o['constraintsH']='leftright'
        style=STYLES.get(key)
        if style:
            for paragraph in o['content']['children'][0]['children']:
                for node in [paragraph]+paragraph['children']:
                    node.update(typographyRefId=style['id'],typographyRefFile=FILE)
        return height,o
    def intro(self,text):self.text(text,40,140,1080,16,400,'mutedForeground',lh=24)
    def caption(self,text,x,y,w=340):self.text(text,x,y,w,12,500,'mutedForeground',lh=16)
    def section(self,text,y):self.text(text,40,y,1120,20,600,lh=28)
    @contextmanager
    def frame(self,name,x,y,w,h,fill=None,stroke=None,r=0,**attrs):
        old=self.parent
        root=self._shape('frame',name,x,y,w,h,fill,stroke,r)
        root.update(shapes=[],showContent=True,**attrs)
        if fill or stroke:
            self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{self.color(fill) if fill else "none"}" stroke="{self.color(stroke) if stroke else "none"}"/>')
        self.parent=root['id']
        yield root
        self.parent=old
    @contextmanager
    def variant(self,name,x,y,w,h):
        with self.frame(name,x,y,w,h,isVariantContainer=True) as root:yield root
    @contextmanager
    def component(self,family,key,x,y,w,h,props=None,variant=None,fill=None,stroke=None,r=0,flex=False):
        start=len(self.objects);svgstart=len(self.svg)
        cid=uid('system/component/'+key)
        with self.frame(family,x,y,w,h,fill,stroke,r,componentId=cid,componentFile=FILE,componentRoot=True,mainInstance=True) as root:
            if r in (8,10,12,16):root['appliedTokens']={f'r{i}':'radius.'+{8:'sm',10:'md',12:'lg',16:'xl'}[r] for i in range(1,5)}
            if variant: root.update(variantId=variant['id'],variantName=', '.join((props or {}).values()))
            if flex:root.update(layout='flex',layoutFlexDir='row',layoutGap={'rowGap':8,'columnGap':8},layoutPaddingType='multiple',layoutPadding={'p1':0,'p2':12,'p3':0,'p4':12},layoutJustifyContent='center',layoutAlignItems='center',layoutWrapType='nowrap')
            yield root
        group=copy.deepcopy(self.objects[start:]);ids={o['id'] for o in group}
        for o in group:
            if o['type']=='frame':o['shapes']=[c['id'] for c in group if c['parentId']==o['id']]
        MASTERS[key]=(group,''.join(self.svg[svgstart:]),self,x,y)
        path='67slopers/UI' if self.page==PAGES['controls'][0] else '67slopers/Training'
        record=dict(id=cid,name=family,path=path,mainInstanceId=root['id'],mainInstancePage=self.page)
        if variant:record.update(variantId=variant['id'],variantProperties=[dict(name=k,value=v) for k,v in props.items()])
        COMPONENTS.append(record)
    def instance(self,key,x,y,name=None,label=None,width=None):
        source,svg,owner,sx,sy=MASTERS[key]
        source=copy.deepcopy(source)
        root=source[0]
        if width is not None:
            delta=width-root['width']
            root['width']=width;root['selrect']['width']=width;root['selrect']['x2']+=delta
            root['points'][1]['x']+=delta;root['points'][2]['x']+=delta;root['touched']=['geometry-group']
            svg=svg.replace(f'width="{width-delta}"',f'width="{width}"',1)
            for o in source[1:]:
                o['x']+=delta/2
                for k in ('x','x1','x2'):o['selrect'][k]+=delta/2
                for point in o['points']:point['x']+=delta/2
                for run in o.get('positionData',[]):run['x']+=delta/2
            svg=re.sub(r'(<text x=")([^"]+)',lambda m:m[1]+str(float(m[2])+delta/2),svg)
        if label is not None:
            t=next(o for o in source if o['type']=='text');old=t['content']['children'][0]['children'][0]['children'][0]['text']
            replace_text(t,label)
            if key.startswith('button/'):
                neww=len(label)*14*.602;delta=neww-t['width'];t['width']=neww;t['x']-=delta/2
                t['selrect'].update(x=t['x'],x1=t['x'],x2=t['x']+neww,width=neww)
                t['points']=[dict(x=t['x'],y=t['y']),dict(x=t['x']+neww,y=t['y']),dict(x=t['x']+neww,y=t['y']+t['height']),dict(x=t['x'],y=t['y']+t['height'])]
                t['positionData'][0]['x']-=delta/2
                svg=re.sub(r'(<text x=")([^"]+)',lambda m:m[1]+str(float(m[2])-delta/2),svg)
            svg=svg.replace(html.escape(old),html.escape(label))
        self.count+=1
        ids={o['id']:uid(f'{self.key}/instance/{self.count}/{o["id"]}') for o in source}
        dx=self.x+x-owner.x-sx;dy=self.y+y-owner.y-sy
        for original in source:
            o=copy.deepcopy(original);o['id']=ids[original['id']];o['shapeRef']=original['id'];o.pop('mainInstance',None)
            o['parentId']=ids.get(o['parentId'],self.parent or self.id);o['frameId']=ids.get(o['frameId'],self.parent or self.id)
            o['x']+=dx;o['y']+=dy
            for k in ('x','x1','x2'):o['selrect'][k]+=dx
            for k in ('y','y1','y2'):o['selrect'][k]+=dy
            for p in o['points']:p['x']+=dx;p['y']+=dy
            for p in o.get('positionData',[]):p['x']+=dx;p['y']+=dy
            if o['type']=='path':
                for seg in o['content']:
                    for k in seg.get('params',{}):seg['params'][k]+=dx if k.endswith('x') else dy
            if 'shapes' in o:o['shapes']=[ids[c] for c in o['shapes']]
            if original==source[0] and name:o['name']=name
            self.objects.append(o)
        self.svg.append(f'<g transform="translate({x-sx} {y-sy})">{svg}</g>')
        return self.objects[-len(source)]


def button(b,key,x,y,w=164,size='default',style='default',state='enabled',variant=None,label='Button'):
    h={'sm':40,'default':44,'lg':56}[size];r=12 if size=='lg' else 10
    bg={'default':'primary','secondary':'secondary','destructive':'destructive','outline':'background','ghost':None,'link':None}[style]
    fg='primaryForeground' if style in ('default','destructive') else 'foreground'
    if state=='pressed' and style in ('outline','ghost'):bg='accent'
    with b.component('Button',key,x,y,w,h,dict(Variant=style,Size=size,State=state),variant,bg,'border' if style=='outline' else None,r,True) as root:
        if state=='disabled':
            root['opacity']=0.5
            b.svg.insert(len(b.svg)-(1 if bg else 0),'<g opacity="0.5">')
        if state=='pressed' and style in ('default','destructive','secondary'):
            root['fills'][0]['fillOpacity']=0.8 if style=='secondary' else 0.9
            b.svg[-1]=b.svg[-1].replace('/>',f' fill-opacity="{root["fills"][0]["fillOpacity"]}"/>')
        tw=len(label)*14*.602
        _,t=b.text(label,x+(w-tw)/2,y+(h-20)/2,tw,14,500,fg,lh=20,name='Label')
        t.update(growType='auto-width',layoutItemHSizing='auto',layoutItemVSizing='auto')
        if state=='disabled':b.svg.append('</g>')


def foundations():
    b=Canvas('start','Built for chalked hands.','foundations',0,0,1080)
    b.intro('A working library for the app we have. Reuse these parts as we explore what comes next.')
    b.rect(40,230,1120,280,'secondary',r=16)
    b.text('Legible at a distance.\nA few taps to train.',72,264,1020,36,800,lh=44)
    b.text('Geist Mono · Pulse / amber · One appearance',72,400,1000,18,600,lh=28)
    for i,(title,body) in enumerate([
        ('01 / Foundations','Semantic tokens, typography, spacing, layout, motion and accessibility.'),
        ('02 / UI components','Drag components from Assets. Select a copy to change its named variant properties.'),
        ('03 / Training patterns','Compose screens from workout, session, calendar, builder and timer patterns.')]):
        x=40+i*380;b.text(title,x,566,344,20,600,lh=28);b.text(body,x,618,344,16,400,lh=24)
    b.section('Working together',790)
    b.text('1  Drag an asset into an exploration board.\n2  Override content and choose a variant on the copy.\n3  Edit the main component only for an agreed system change.\n4  Export reviewed work to design/penpot and design/exports.',40,838,1120,16,400,lh=28)
    b.caption('Source of truth: src/global.css + src/lib/theme.ts + src/components. Reviewed 9 October 2026.',40,1018,1120)

    b=Canvas('colors','Color has a job.','foundations',1,0,1200)
    b.intro('Shared Assets colors and native Penpot tokens mirror the implemented palette. Keep semantic names.')
    keys=['background','foreground','card','primary','primaryForeground','secondary','accent','muted','mutedForeground','border','input','ring','chart1','chart2','chart3','chart4','chart5','destructive']
    for i,key in enumerate(keys):
        x=40+(i%6)*190;y=238+(i//6)*162;b.rect(x,y,164,82,key,'border',12)
        b.text(key,x,y+94,178,12,500,lh=16);b.caption(C[key].upper(),x,y+116,178)
    b.section('The timer phase language',768)
    for i,(name,key) in enumerate([('Get ready','accent'),('Hang','chart1'),('Rep rest','secondary'),('Set rest','muted'),('Ready / done','background')]):
        x=40+i*228;b.rect(x,820,208,116,key,'border',12);b.text(name,x+12,862,184,16,600,align='center',lh=24)
    b.text('Pair every phase color with a label and countdown. Charcoal carries primary actions. Red marks destructive actions and ended-session facts.',40,990,1080,16,400,lh=24)
    b.caption('Aliases such as cardForeground, secondaryForeground and popoverForeground remain available in Assets and Tokens.',40,1118,1110)

    b=Canvas('typography','One family. Clear hierarchy.','foundations',0,1,1540)
    b.intro('Geist Mono / 400, 500, 600, 700, 800. These samples link to shared typography styles.')
    y=224
    for name,size,weight,line in TYPE_SPECS[:-1]:
        b.text('Repeaters 7:3' if size>=30 else 'Train at your own pace',40,y,680,size,weight,lh=line)
        b.text(f'{name} / {size}:{line} / {weight}',770,y+4,390,14,400,'mutedForeground',lh=20)
        b.rect(40,y+max(50,line+12),1120,1,'border',r=0);y+=78
    b.text('07',40,1330,400,120,700,lh=120)
    b.text('Timer / 200:200 / 700\nAdaptive to available space.\nThe runner uses tabular mono digits.',500,1340,630,18,600,lh=28)

    b=Canvas('layout','Rhythm, reach & feedback.','foundations',1,1,1380)
    b.intro('NativeWind values from the app. Mobile samples use 390 px; page content caps at 768 px.')
    for i,n in enumerate((4,8,12,16,20,24,32,40,48)):
        x=40+i*124;b.rect(x,266,88,n,'chart1',r=0);b.text(str(n),x,338,88,16,500,lh=24)
    b.section('Corners & borders',414)
    for i,(name,n) in enumerate([('sm',8),('md',10),('lg',12),('xl',16)]):
        x=40+i*190;b.rect(x,464,160,94,'card','border',n);b.text(f'{name} / {n}',x,580,160,14,500,lh=20)
    b.text('1 px borders\nQuiet surfaces\nSubtle primitive shadows',840,476,310,16,400,lh=28)
    b.section('Layout contract',672)
    for i,(title,body) in enumerate([
        ('Screen','24 px sides / 16 px top\n16 px stack gaps\n768 px max content'),
        ('Actions','44 px standard target\n56 px primary footer\n80 px timer action'),
        ('Content','Allow multiline labels.\nGrow cards with content.\nKeep system safe areas.')]):
        x=40+i*380;b.text(title,x,724,342,18,600,lh=28);b.text(body,x,768,342,16,400,lh=28)
    b.section('Interaction & accessibility',902)
    b.text('Visible labels + icons + color. Never rely on amber alone.\nWeb keyboard focus: 3 px ring at 50% opacity.\nDisabled: 50% opacity; remove the action from interaction.\nDisclosure reveal: 150 ms, ease-out (0.23, 1, 0.32, 1).\nRespect system reduced motion. Native font scaling stays enabled.\nThe 40 px small primitive is for secondary actions; preserve adequate hit areas.',40,956,1110,16,400,lh=32)
    b.caption('No new app behavior is introduced by this library. Static references need real device checks for text scaling and touch.',40,1292,1120)


def controls():
    b=Canvas('buttons','Button / variant × size × state','controls',0,0,1500)
    b.intro('72 reusable variants. Charcoal is the default action. Smaller actions use the same 14 px label.')
    styles=['default','secondary','outline','ghost','destructive','link']
    for i,s in enumerate(styles):b.caption(s,40+i*188,210,180)
    with b.variant('Button',40,260,1112,1100) as v:
        for row,(size,state) in enumerate((sz,st) for sz in ('sm','default','lg') for st in ('enabled','pressed','disabled','focus')):
            y=260+row*90
            for col,style in enumerate(styles):
                x=40+col*188
                if state=='focus':
                    ring=b.rect(x-3,y-3,170,{'sm':46,'default':50,'lg':62}[size],None,'ring',13);ring['strokes'][0].update(strokeWidth=3,strokeOpacity=.5)
                    # Focus decoration is a component child, moved below after creation.
                    b.objects.pop();focus_svg=b.svg.pop()
                button(b,f'button/{style}/{size}/{state}',x,y,size=size,style=style,state=state,variant=v,label='Continue')
                if state=='focus':
                    group=MASTERS[f'button/{style}/{size}/{state}'][0];ring['parentId']=group[0]['id'];ring['frameId']=group[0]['id'];ring['layoutItemAbsolute']=True;b.objects.append(ring);group.append(copy.deepcopy(ring));group[0]['shapes'].append(ring['id']);b.svg.append(focus_svg)
                b.caption(f'{size} / {state}',x,y+62,182)
    b.caption('Pressed = pointer hover or active feedback. Focus is web-only. Ghost and link retain transparent backgrounds.',40,1410,1100)

    b=Canvas('fields','Fields & numeric entry','controls',1,0,1280)
    b.intro('Input is 40 px on mobile; the builder can override height. Focus and invalid styling are web states.')
    with b.variant('Input',40,248,1120,290) as v:
        for i,(state,value) in enumerate([('empty','Workout name'),('filled','Repeaters 7:3'),('focus','Repeaters 7:3'),('disabled','Repeaters 7:3'),('invalid','')]):
            x=40+(i%3)*380;y=248+(i//3)*142
            b.caption(state,x,y-28)
            with b.component('Input','input/'+state,x,y,342,40,dict(State=state),v,'background','ring' if state=='focus' else 'destructive' if state=='invalid' else 'input',10) as root:
                if state=='disabled':root['opacity']=.5
                b.text(value,x+12,y+8,318,16,400,'mutedForeground' if state=='empty' else 'foreground',lh=24,name='Value')
                if state=='focus':root['strokes'][0].update(strokeWidth=3,strokeOpacity=.5)
    b.section('Notes & descriptions',570)
    with b.variant('Textarea',40,636,1120,116) as v:
        for i,(state,value) in enumerate([('empty','Holds, load, or something to remember.'),('filled','20 mm edge. Bodyweight. Felt controlled.')]):
            x=40+i*570
            with b.component('Textarea','textarea/'+state,x,636,532,96,dict(State=state),v,None,'input',10):
                b.text(value,x+12,648,508,16,400,'mutedForeground' if state=='empty' else 'foreground',lh=24,name='Value')
    b.section('Stepper',814)
    with b.variant('Stepper',40,876,1120,110) as v:
        for i,state in enumerate(('display','number entry','clock entry')):
            x=40+i*380
            with b.component('Stepper','stepper/'+state,x,876,342,100,dict(Mode=state),v):
                b.text('Duration',x,876,342,16,500,lh=24)
                if state!='clock entry':
                    for off,sign in [(0,'−'),(128,'+')]:
                        b.rect(x+off,916,44,44,'background','border',10);b.text(sign,x+off,926,44,20,600,align='center',lh=24)
                    b.rect(x+52,916,68,44,'background','border',10);b.text('7s' if state=='display' else '7',x+52,924,68,20,600,align='center',lh=28)
                else:
                    for off,val in [(0,'03'),(84,'00')]:b.rect(x+off,916,60,44,'background','border',10);b.text(val,x+off,924,60,20,600,align='center',lh=28)
                    b.text(':',x+64,924,16,20,600,lh=28)
            b.caption(state,x,1008)
    b.text('Tap a value for direct entry. Hold −/+ to repeat after 300 ms, every 80 ms. Values clamp to valid limits; minutes and seconds are separate clock fields.',40,1100,1100,16,400,lh=28)

    b=Canvas('selection','Selection & compact labels','controls',0,1,1230)
    b.intro('Use a toggle for an explicit choice. Badges describe content; they do not imply a tappable control.')
    b.section('Toggle',220)
    with b.variant('Toggle',40,292,1120,170) as v:
        for i,(style,state) in enumerate((s,t) for s in ('default','outline') for t in ('off','on')):
            x=40+i*280
            with b.component('Toggle',f'toggle/{style}/{state}',x,292,240,40,dict(Variant=style,Selected=state),v,'accent' if state=='on' else None,'input' if style=='outline' else None,10,True):
                b.text('Hang',x+103,302,34,14,500,lh=20,name='Label')
            b.caption(style+' / '+state,x,356,250)
    b.section('Badge',464)
    with b.variant('Badge',40,528,1120,100) as v:
        for i,style in enumerate(('default','secondary','outline','destructive')):
            x=40+i*280;bg={'default':'primary','secondary':'secondary','outline':None,'destructive':'destructive'}[style]
            with b.component('Badge','badge/'+style,x,528,102,22,dict(Variant=style),v,bg,'border' if style=='outline' else None,11,True):
                b.text('Preset',x+29,531,44,12,500,'primaryForeground' if style in ('default','destructive') else 'foreground',lh=16,name='Label')
            b.caption(style,x,580,250)
    b.section('Icon actions',682)
    with b.variant('Icon button',40,748,1120,170) as v:
        for i,icon in enumerate(('plus','x','chevron-left','ellipsis-vertical','settings-2','scan-qr-code','skip-back','skip-forward')):
            x=40+i*140
            with b.component('Icon button','icon-action/'+icon,x,748,44,44,dict(Icon=REF['icons'][icon]['name']),v,None,None,10):b.icon(icon,x+10,758,24)
            b.caption(REF['icons'][icon]['name'],x,816,124)
    b.section('Icon grammar',940)
    b.text('Phosphor Regular: 16 px inline, 20 px actions, 24 px navigation, 36 px feel choices. Bold: 28 px timer controls. Label every icon-only action. Brand sloper and board artwork remain separate assets.',40,998,1100,16,400,lh=28)
    b.caption('Phosphor icons are bundled locally. Use Battery Low for Weak, Thumbs Up for Normal and Barbell for Strong. MoonBoard symbols remain an exploration.',40,1142,1120)

    b=Canvas('overlays','Menus, decisions & structure','controls',1,1,1340)
    b.intro('Use menus for immediate actions and settings. Confirm destructive changes with an explicit consequence.')
    with b.variant('Menu item',40,250,280,320) as v:
        for i,state in enumerate(('plain','checked','unchecked','destructive')):
            y=250+i*68
            with b.component('Menu item','menu/'+state,40,y,224,48,dict(State=state),v,'popover',None,6):
                if state=='checked':b.icon('check',52,y+16,16)
                b.text('Delete workout' if state=='destructive' else 'Sound',76,y+14,178,14,400,'destructive' if state=='destructive' else 'foreground',lh=20)
            b.caption(state,290,y+15,210)
    with b.component('Workout settings','settings',576,250,224,162,fill='popover',stroke='border',r=10):
        b.instance('menu/checked',576,254);b.instance('menu/checked',576,302,label='Vibration')
        b.rect(584,352,208,1,'border',r=0);b.instance('menu/unchecked',576,358,label='Gen Z mode')
    b.text('Settings / checkbox rows\n224 px wide / 48 px targets\nSound · Vibration · Gen Z mode',850,254,310,14,400,'mutedForeground',lh=24)
    b.section('Confirmation dialog',662)
    with b.component('Confirmation dialog','dialog',40,728,390,276,fill='background',stroke='border',r=12):
        b.text('Discard this workout?',64,752,342,18,600,align='center',lh=28)
        b.text('Nothing from it is kept in your history.',64,800,342,14,400,'mutedForeground',align='center',lh=20)
        b.instance('button/default/default/enabled',64,866,label='Discard',width=342)
        b.instance('button/outline/default/enabled',64,922,label='Keep it',width=342)
    b.text('Mobile: full-width stacked actions.\nUse a clear title, consequence, cancel and action.\nConfirmation follows a deliberate destructive tap.\nOverlay uses 50% black; dialog keeps the app canvas.',500,748,660,16,400,lh=32)
    b.section('Section header',1090)
    with b.component('Section header','section-header',40,1150,342,40):
        b.text('Your workouts',40,1156,220,20,600,lh=28);b.text('View all',302,1160,80,14,500,lh=20)
    b.caption('Title + optional secondary action. Keep section headings aligned to the screen inset.',460,1152,680)


def replace_text(o,value):
    p=o['content']['children'][0]['children'][0];p['children'][0]['text']=value
    if o.get('positionData'):o['positionData'][0]['text']=value;o['positionData'][0]['width']=len(value)*float(p['fontSize'])*.602
    o['touched']=['text-group']


def patterns():
    b=Canvas('workouts','Workouts & trustworthy history','patterns',0,0,1440)
    b.intro('Reusable app patterns at mobile content width. Sample numbers illustrate the current Repeaters 7:3 preset.')
    with b.variant('Workout card',40,256,740,340) as v:
        for i,compact in enumerate((False,True)):
            x=40+i*420;w=256 if compact else 342;h=144 if compact else 116
            with b.component('Workout card','workout/'+('compact' if compact else 'row'),x,256,w,h,dict(Layout='compact' if compact else 'row'),v,'card','border',12):
                b.text('Repeaters 7:3',x+16,270,w-32,16,600,lh=24)
                b.text('6 × (6 × 7s / 3s)',x+16,302,w-32,14,400,'mutedForeground',lh=20)
                b.text('24:10',x+16,356 if compact else 338,w-32,14,500,'mutedForeground',lh=20)
            b.caption('Compact rail / 256 × 144' if compact else 'Full-width row / content grows',x,432)
    with b.component('Workout hero','hero',824,256,342,310,fill='secondary',r=16):
        b.text('Next up',848,280,180,16,500,lh=24);b.text('24:10',1070,282,72,14,500,lh=20)
        b.text('Repeaters\n7:3',848,320,294,36,800,lh=40)
        b.text('6 × (6 × 7s / 3s)',848,416,294,14,400,'mutedForeground',lh=20)
        b.text('Not done yet',848,446,294,14,400,'mutedForeground',lh=20)
        b.instance('button/default/lg/enabled',848,486,label='Start workout',width=294)
    b.section('Session row',634)
    with b.variant('Session row',40,704,1120,130) as v:
        for i,(state,feel) in enumerate([('home',False),('complete',True),('ended',True)]):
            x=40+i*380
            with b.component('Session row','session/'+state,x,704,342,86,dict(Context=state),v):
                b.text('Repeaters 7:3',x,714,220,16,600,lh=24)
                b.text('6 × 6 hangs',x,744,220,14,400,'mutedForeground',lh=20)
                if feel:b.icon('snail' if state=='ended' else 'thumbs-up',x+228,724,24)
                b.text('Today',x+258,716,84,14,500,align='right',lh=20)
                b.text('2/6 sets' if state=='ended' else '6/6 sets',x+248,744,94,14,400,'destructive' if state=='ended' else 'mutedForeground',align='right',lh=20)
                b.rect(x,789,342,1,'border',r=0)
            b.caption(state+' / '+('no grade' if not feel else 'optional grade'),x,816)
    b.section('Facts / planned and performed',916)
    with b.variant('Metric grid',40,980,1120,200) as v:
        for i,session in enumerate((False,True)):
            x=40+i*570
            with b.component('Metric grid','facts/'+('session' if session else 'workout'),x,980,532,164,dict(Context='session' if session else 'workout'),v,'card','border',12):
                facts=[('Elapsed time','8:32'),('Completed sets','2/6'),('Time hanging','1:27'),('Full hangs','12/36')] if session else [('Total time','24:10'),('Time hanging','4:12'),('Sets','6'),('Hangs','36')]
                for j,(title,value) in enumerate(facts):
                    xx=x+16+(j%2)*266;yy=996+(j//2)*82
                    b.text(title,xx,yy,230,14,500,'mutedForeground',lh=14);b.text(value,xx,yy+24,230,24,600,lh=32)
    b.text('Home never shows feel grades. A session records actual elapsed time, performed hangs and completed sets. The timer saves it as soon as it stops; Finish adds the grade or note.',40,1230,1100,16,400,lh=28)

    b=Canvas('calendar-feel','Training rhythm & how it felt','patterns',1,0,1390)
    b.intro('Calendar marks activity. Feel is optional session context; it is never a performance score.')
    states=['ordinary','trained','today','today trained','selected','selected trained','outside month']
    with b.variant('Calendar day',40,258,1120,170) as v:
        for i,state in enumerate(states):
            x=40+i*160
            with b.component('Calendar day','day/'+state,x,258,48,48,dict(State=state),v):
                selected='selected' in state;trained='trained' in state;today='today' in state
                b.rect(x+6,264,36,36,'primary' if selected else 'chart1' if trained else None,'foreground' if today else None,12)
                b.text('9',x+6,270,36,16,600 if today else 500,'primaryForeground' if selected else 'mutedForeground' if state=='outside month' else 'foreground','center',lh=24)
                if trained:b.ellipse(x+22,293,4,4,'primaryForeground' if selected else 'foreground')
            b.caption(state,x,336,136)
    with b.component('Week calendar','week',40,448,342,114):
        b.text('This week',40,448,290,16,500,lh=24);b.icon('chevron-right',362,450,18)
        for i,ch in enumerate('MTWTFSS'):
            xx=40+i*48.86;b.text(ch,xx,490,48,14,500,'mutedForeground','center',lh=14)
            b.instance('day/'+('trained' if i in (0,2) else 'today' if i==4 else 'ordinary'),xx,516,label=str(5+i))
    b.text('Seven equal columns.\n48 px touch area / 36 px date.\nAmber = training, border = today.\nCharcoal = selected. A dot retains\nthe training cue on selection.',500,452,620,16,400,lh=28)
    b.section('Feel choice',658)
    with b.variant('Feel choice',40,730,1120,290) as v:
        for row,state in enumerate(('off','on')):
            for col,(feel,icon) in enumerate([('Weak','snail'),('Normal','thumbs-up'),('Strong','biceps-flexed')]):
                x=40+col*186;y=730+row*144
                with b.component('Feel choice',f'feel/{feel}/{state}',x,y,106,100,dict(Feel=feel,Selected=state),v,'primary' if state=='on' else 'card','primary' if state=='on' else 'border',12):
                    fg='primaryForeground' if state=='on' else 'foreground'
                    b.icon(icon,x+35,y+16,36,fg);b.text(feel,x+4,y+60,98,16,600,fg,'center',lh=24)
        b.text('Optional single choice.\nTap the selected option to clear.\nKeep the word with the icon.',650,768,450,16,400,lh=28)
    b.section('Feel badge',1080)
    with b.variant('Feel badge',40,1140,1120,110) as v:
        for i,(feel,icon) in enumerate([('weak','snail'),('normal','thumbs-up'),('strong','biceps-flexed')]):
            x=40+i*380
            with b.component('Feel badge','feel-badge/'+feel,x,1140,174,32,dict(Feel=feel),v,'secondary',r=16):
                b.icon(icon,x+10,1148,16);b.text('Felt '+feel,x+32,1146,132,14,600,lh=20)
    b.caption('Use on the session detail, workout overview and sessions index. Keep the Home history rows quiet.',40,1292,1100)

    b=Canvas('steps','The workout is a step tree.','patterns',0,1,1510)
    b.intro('Prep, hang and rest rows. A top-level repeat contains sets; one nested repeat contains reps.')
    with b.variant('Timed step',40,248,1120,580) as v:
        for row,mode in enumerate(('read','edit','reorder')):
            for col,(kind,title,time) in enumerate([('prep','Get ready','10s'),('hang','Hang','7s'),('rest','Rest','3:00')]):
                x=40+col*380;y=248+row*164
                with b.component('Timed step',f'step/{kind}/{mode}',x,y,342,72,dict(Kind=kind,Mode=mode),v,'card','border',12):
                    b.rect(x,y,6,72,dict(prep='accent',hang='chart1',rest='muted')[kind],r=3)
                    b.text(title,x+18,y+10,242,16,500,lh=24);b.text(time,x+18,y+38,240,14,400,'mutedForeground',lh=20)
                    if mode=='edit':b.icon('chevron-down',x+266,y+28,16);b.icon('ellipsis-vertical',x+306,y+24,24)
                    if mode=='reorder':b.icon('grip-vertical',x+306,y+24,24)
                b.caption(kind+' / '+mode,x,y+94)
    b.section('Repeat group',822)
    with b.component('Repeat group','repeat',40,888,370,294,stroke='border',r=12) as root:
        root['strokes'][0]['strokeWidth']=2
        b.icon('repeat',54,904,20);b.text('6 times',82,898,228,18,600,lh=28);b.icon('ellipsis-vertical',374,902,24)
        b.instance('step/hang/edit',54,946);b.instance('step/rest/edit',54,1030)
        b.instance('button/secondary/sm/enabled',54,1124,label='Add step',width=342)
    b.text('Repeat boundary / 2 px\nInner stack / 12 px gaps\nRows stay inside their parent group.\nReorder one list at a time.\nUse Move into / Move out for hierarchy.\nGrip selection belongs on Hang only.',476,900,680,16,400,lh=32)
    b.text('Editing is inline. Expanding a row reveals the kind selector, duration stepper, optional grip cue and label. One row opens at a time.',40,1262,1100,16,400,lh=28)
    b.caption('Source: step-list.tsx, stepper.tsx, workout-steps.ts. No additional nesting or new workout model is implied.',40,1420,1100)

    b=Canvas('grips','Board & grip guidance','patterns',1,1,1440)
    b.intro('Use the real bundled artwork. Pick one grip per hang: a mirrored pair or one center hold.')
    with b.variant('Board choice',40,250,1120,240) as v:
        for i,(state,boardid) in enumerate([('none',None),('available','beastmaker-1000'),('selected','beastmaker-1000')]):
            x=40+i*380
            with b.component('Board choice','board/'+state,x,250,250,104,dict(State=state),v,'accent' if state=='selected' else 'card','foreground' if state=='selected' else 'border',12):
                if boardid:b.art(boardid,x+61,260,128)
                else:b.rect(x+61,258,128,48,None,'border',4);b.text('—',x+61,270,128,14,400,'mutedForeground','center',lh=20)
                b.text('Beastmaker 1000' if boardid else 'No board',x+8,324,234,14,600 if state=='selected' else 500,align='center',lh=14)
            b.caption(state,x,392)
    b.section('Grip chips',522)
    with b.variant('Grip choice',40,586,1120,120) as v:
        for i,state in enumerate(('available','selected')):
            x=40+i*380
            with b.component('Grip choice','grip/'+state,x,586,342,48,dict(State=state),v,'primary' if state=='selected' else 'background','border' if state=='available' else None,10):
                b.text('Medium edge · 20 mm',x+12,598,318,16,500,'primaryForeground' if state=='selected' else 'foreground','center',lh=24)
            b.caption(state,x,664)
    b.section('Timer cue / paired grip',774)
    with b.component('Board cue','board-cue',40,844,532,254,fill='background',stroke='border',r=12):
        b.art('beastmaker-1000',64,862,484,True);b.text('Medium edge · 20 mm',64,1046,484,16,500,align='center',lh=24)
    b.text('The timer keeps the needed overlays mounted.\nShow a grip cue in opening prep or before a grip change.\nKeep the board image readable beside the countdown.\nSelection uses an outline as well as color.',630,866,530,16,400,lh=32)
    b.text('Eight board assets live in the file. Geometry comes from hangboard-models; images come from assets/boards. Do not redraw holds from memory.',40,1200,1100,16,400,lh=28)
    b.caption('Board art is raster; the surrounding controls, labels and selection outlines remain editable.',40,1350,1100)

    b=Canvas('timer','The timer stays unmistakable.','patterns',0,2,1500)
    b.intro('Phase, set/rep and countdown form the hierarchy. These are component samples; full-screen references remain on page 04.')
    with b.variant('Timer phase',40,250,1120,660) as v:
        for i,(state,color,title,digits) in enumerate([('prep','accent','GET READY','10'),('hang','chart1','HANG','07'),('rep rest','secondary','REST','03'),('set rest','muted','REST','3:00')]):
            x=40+(i%2)*570;y=250+(i//2)*310
            with b.component('Timer phase','phase/'+state,x,y,532,264,dict(Phase=state),v,color,r=16):
                b.text(title,x+24,y+20,484,24,600,'foreground','center',lh=32)
                b.text('Set 1/6 · Rep 1/6',x+24,y+66,484,24,600,'foreground','center',lh=32)
                b.text(digits,x+24,y+108,484,120,700,'foreground','center',lh=132)
    b.section('Primary timer action',964)
    with b.variant('Timer action',40,1024,1120,140) as v:
        for i,(state,icon,label) in enumerate([('running','pause','Pause'),('paused','play','Resume')]):
            x=40+i*570
            with b.component('Timer action','timer-action/'+state,x,1024,532,80,dict(State=state),v,'primary',r=12):
                b.icon(icon,x+188,1050,28,'primaryForeground',weight='bold');b.text(label,x+230,1048,170,20,600,'primaryForeground',lh=28)
    with b.component('Next interval','next-interval',40,1212,532,76,fill='background',stroke='border',r=12):
        b.text('Next up',56,1224,500,14,400,'mutedForeground',lh=20);b.text('Hang · 7s',56,1252,500,16,500,lh=24)
    b.text('Pause exposes previous / skip controls.\nEnd workout remains a deliberate secondary action.\nGameplay is optional, bundled and always muted.',630,1210,530,16,400,lh=28)
    b.caption('Interval boundary feedback: one beep and one heavy tap. Each setting is optional and remembered on device.',40,1404,1100)

    b=Canvas('recovery','Recovery & completion','patterns',1,2,1420)
    b.intro('A saved session is a fact. Recovery offers distinct choices for interrupted work.')
    with b.component('Unfinished run','recovery',40,256,390,292,fill='accent',stroke='border',r=16):
        b.text('Unfinished workout',64,280,342,14,400,'mutedForeground',lh=20)
        b.text('Repeaters 7:3',64,320,342,20,600,lh=28)
        b.text('Set 2/6 · stopped 5m ago',64,366,342,14,400,'mutedForeground',lh=20)
        b.instance('button/default/lg/enabled',64,414,width=342)
        b.text('Save as ended',64,496,174,14,500,lh=20);b.text('Discard',260,496,126,14,500,'destructive',lh=20)
    b.text('Continue → resume paused at the checkpoint.\nSave as ended → keep performed work.\nDiscard → confirm, then remove checkpoint.\nNo silent loss and no fabricated completed sets.',500,280,660,16,400,lh=32)
    with b.component('Completion heading','completion',40,666,532,168):
        b.text('Workout complete',40,666,532,30,700,lh=36)
        b.text('Saved to your history.',40,720,532,16,400,'mutedForeground',lh=24)
        b.text('How did you feel?',40,790,532,20,600,lh=28)
    b.instance('feel/Weak/off',40,856);b.instance('feel/Normal/on',158,856);b.instance('feel/Strong/off',276,856)
    b.text('Finish enriches the saved session.\nGrade and note are optional.\nAn unsaved draft can become a workout.\nA changed workout reruns the session snapshot.',630,676,530,16,400,lh=32)
    b.section('Design review checklist',1060)
    b.text('Can a climber read it from across the room?\nCan they start the last workout in one tap?\nAre actual and planned values clearly distinguished?\nDo recovery and destructive actions explain what is kept?\nDoes the design work entirely offline, with no account?',40,1116,1100,16,400,lh=32)


def assembly():
    b=Canvas('reuse','Start from components.','patterns',2,0,1410)
    b.intro('These are linked instances. Select a component copy: the right panel exposes its variant properties.')
    b.rect(40,230,390,1120,'background','border',16)
    b.text('Your training',64,270,342,24,700,lh=32)
    b.instance('week',64,332)
    b.instance('hero',64,492)
    b.instance('section-header',64,850)
    b.instance('workout/row',64,912)
    b.instance('session/home',64,1080)
    b.text('Reuse / modify / review',510,250,650,24,600,lh=32)
    b.text('1  Open Assets → 67slopers.\n\n2  Drag a UI or Training component into a new board.\n\n3  Switch the named properties on the instance.\n\n4  Override the text and keep the shared styles.\n\n5  Go to the main component for an agreed library change.',510,322,630,18,400,lh=30)
    b.text('Scope of this library',510,870,630,24,600,lh=32)
    b.text('Reference components mirror the existing app. The MoonBoard page remains an exploration. This design work does not add a new screen, protocol or dependency to the app.',510,930,630,16,400,lh=28)
    b.text('Export reviewed work',510,1150,630,20,600,lh=28)
    b.text('design/penpot/67slopers.penpot\ndesign/exports/design-system/\ndesign/foundations/library.json',510,1204,630,14,400,'mutedForeground',lh=28)


def complete_shapes():
    for b in SCENE.boards:
        containers={o['id'] for o in b.objects if o.get('isVariantContainer')}
        # Penpot picks the LAST child as the Assets representative. Documentation
        # must be outside the variant container, which holds only main instances.
        for o in b.objects:
            if o['parentId'] in containers and not o.get('mainInstance'):
                o['parentId']=b.id;o['frameId']=b.id
        byid={o['id']:o for o in b.objects}
        for o in b.objects:
            if o['type']=='frame':o['shapes']=[c['id'] for c in b.objects if c['parentId']==o['id']]
            if o.get('isVariantContainer'):
                candidates=[c for c in COMPONENTS if c.get('variantId')==o['id']]
                def preference(c):
                    props={p['name']:p['value'] for p in c.get('variantProperties',[])}
                    return sum(props.get(k,v)!=v for k,v in [('Variant','default'),('Size','default'),('State','enabled')])
                primary=min(candidates,key=preference)['mainInstanceId']
                o['shapes']=[id for id in o['shapes'] if id!=primary]+[primary]
        ids=[o['id'] for o in b.objects]
        assert len(ids)==len(set(ids)),b.key
        for o in b.objects[1:]:
            assert o['parentId'] in ids
    assert len(COMPONENTS)==len({c['id'] for c in COMPONENTS})


def save_local():
    OUT.mkdir(parents=True,exist_ok=True)
    for b in SCENE.boards:b.save_svg(OUT)
    inventory=dict(pages=[dict(id=id,name=name) for id,name in PAGES.values()],boards=[dict(key=b.key,name=b.name,id=b.id,pageId=b.page,width=b.w,height=b.h,shapes=len(b.objects)) for b in SCENE.boards],components=COMPONENTS,tokens=len(TOKENS),typographies=len(STYLES),families=len({c['name'] for c in COMPONENTS}),variantSets=len({c['variantId'] for c in COMPONENTS if 'variantId' in c}))
    MANIFEST.write_text(json.dumps(inventory,indent=2)+'\n')
    # Penpot's documented JSON token names, including its DTCG extensions.
    public={'border-radius':'borderRadius','font-size':'fontSizes','font-weight':'fontWeights','font-family':'fontFamilies'}
    dtcg={}
    for name,t in TOKENS.items():
        cursor=dtcg
        parts=name.split('.')
        for part in parts[:-1]:cursor=cursor.setdefault(part,{})
        cursor[parts[-1]]={'$type':public.get(t['type'],t['type']),'$value':t['value'],'$description':t['description']}
    (ROOT/'design/foundations/tokens.json').write_text(json.dumps({'67slopers':dtcg},indent=2)+'\n')
    print(f'Prepared {len(SCENE.boards)} boards, {len(COMPONENTS)} components, {len(TOKENS)} tokens, {len(STYLES)} typography styles.',flush=True)


def publish(replace=False):
    p=Penpot();f=p.file();data=f['data']
    pageids={v[0] for v in PAGES.values()}
    if any(id in data['pagesIndex'] for id in pageids) and not replace:
        raise SystemExit('Library already exists. Export live edits first; use --replace-generated only to deliberately regenerate library-owned shapes.')
    if not (ROOT/'design/.local/before-design-system.json').exists():
        (ROOT/'design/.local/before-design-system.json').write_text(json.dumps(f))
        p.export(ROOT/'design/.local/before-design-system.penpot')
    changes=[]
    for id,name in PAGES.values():
        if id not in data['pagesIndex']:changes.append(dict(type='add-page',id=id,name=name))
    for typ in STYLES.values():changes.append(dict(type='mod-typography' if typ['id'] in data.get('typographies',{}) else 'add-typography',typography=typ))
    # Native token changes initialize a proper TokensLib; no untyped map replacement.
    setid=uid('system/token-set');themeid=uid('system/token-theme')
    changes.extend([
        dict(type='set-token-set',id=setid,attrs=dict(id=setid,name='67slopers',description='Implemented local app tokens',tokens={})),
        *[dict(type='set-token',setId=setid,tokenId=t['id'],attrs=t|{'type':{'border-radius':'borderRadius','font-size':'fontSizes','font-family':'fontFamilies','font-weight':'fontWeights'}.get(t['type'],t['type'])}) for t in TOKENS.values()],
        dict(type='set-token-theme',id=themeid,attrs=dict(id=themeid,name='App',group='67slopers',sets=['67slopers'])),
        dict(type='set-active-token-themes',themePaths=['67slopers/App'])])
    p.update(changes)
    # Only this generator's three pages and IDs are ever eligible for replacement.
    changes=[];previous=json.loads(OWNERSHIP.read_text()) if OWNERSHIP.exists() else {}
    for b in SCENE.boards:
        existing=data.get('pagesIndex',{}).get(b.page,{}).get('objects',{})
        for o in b.objects:
            if o['id'] in existing:
                if existing[o['id']]['parentId']!=o['parentId']:
                    changes.append(dict(type='mov-objects',pageId=b.page,parentId=o['parentId'],shapes=[o['id']],ignoreTouched=True))
                if o['id'] not in previous.get(b.page,[]):raise RuntimeError('Refusing to replace an unowned shape '+o['id'])
                attrs={k:v for k,v in o.items() if k not in ('id','type','shapes')}
                changes.append(dict(type='mod-obj',id=o['id'],pageId=b.page,operations=[dict(type='assign',value=attrs)]))
            else:changes.append(dict(type='add-obj',id=o['id'],obj={k:v for k,v in o.items() if k!='shapes'}|({'shapes':[]} if o['type']=='frame' else {}),pageId=b.page,frameId=o['frameId'],parentId=o['parentId']))
    # Add the component records atomically with their shapes to maintain valid copies.
    for c in COMPONENTS:
        if c['id'] not in data.get('components',{}):changes.append(dict(type='add-component',**c))
        else:changes.append(dict(type='mod-component',**{k:v for k,v in c.items() if k not in ('mainInstanceId','mainInstancePage')}))
    p.update(changes)
    order=[]
    live=p.file()
    for b in SCENE.boards:
        objects=live['data']['pagesIndex'][b.page]['objects']
        for o in b.objects:
            if o['type']=='frame':
                extra=[id for id in objects[o['id']].get('shapes',[]) if id not in o['shapes'] and id not in previous.get(b.page,[])]
                order.append(dict(type='mod-obj',id=o['id'],pageId=b.page,operations=[dict(type='assign',value={'shapes':o['shapes']+extra})]))
    for index,(page,name) in enumerate(PAGES.values()):order.append(dict(type='mov-page',id=page,index=index))
    p.update(order)
    ownership={page:[o['id'] for b in SCENE.boards if b.page==page for o in b.objects] for page in pageids}
    OWNERSHIP.write_text(json.dumps(ownership))
    final=p.file()
    for page,oldpage in data['pagesIndex'].items():
        if page not in pageids:assert final['data']['pagesIndex'][page]==oldpage,'Existing app page changed: '+oldpage['name']
    assert all(c['id'] in final['data']['components'] for c in COMPONENTS)
    print('Verified original app pages unchanged; all component records persisted.',flush=True)
    (ROOT/'design/foundations/tokens.json').write_text(json.dumps(final['data']['tokensLib'],indent=2)+'\n')
    print('Export bytes',p.export(ROOT/'design/penpot/67slopers.penpot'),flush=True)
    (ROOT/'design/.local/design-system-live.json').write_text(json.dumps(final))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--publish',action='store_true');parser.add_argument('--replace-generated',action='store_true');args=parser.parse_args()
    foundations();controls();patterns();assembly();complete_shapes();save_local()
    if args.publish:publish(args.replace_generated)
