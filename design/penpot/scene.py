"""Editable Penpot shapes with SVG review exports of the same geometry."""

import base64
import colorsys
import html
import json
import math
import re
import textwrap
import uuid
from pathlib import Path
from api import ROOT

ZERO = '00000000-0000-0000-0000-000000000000'
IDENTITY = dict(a=1,b=0,c=0,d=1,e=0,f=0)
FONT = 'custom-4c7aba37-042a-5a28-93ed-18fb8a9f3e01'
FILE = json.loads((ROOT/'design/.local/workspace.json').read_text())['fileId']


def uid(name):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, '67slopers/design-v1/' + name))


def clock(seconds):
    return f'{seconds // 60}:{seconds % 60:02d}'


def read_palette():
    source = (ROOT / 'src/lib/theme.ts').read_text()
    colors = {}
    for name,h,s,l in re.findall(r"(\w+): 'hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)'", source):
        rgb = colorsys.hls_to_rgb(float(h)/360,float(l)/100,float(s)/100)
        colors[name] = '#' + ''.join(f'{round(v*255):02x}' for v in rgb)
    return colors


C = read_palette()
REF = json.loads((ROOT/'design/.local/app-reference.json').read_text())
MEDIA = json.loads((ROOT/'design/.local/media.json').read_text())


def path_commands(d):
    """Resolve SVG paths to absolute cubic commands (including elliptical arcs)."""
    tokens = re.findall(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?', d)
    result=[]; i=0; cmd=''; x=y=sx=sy=0.; last_ctrl=None; prev=''
    def emit(command, **params):
        result.append(dict(command=command, params=params))
    while i < len(tokens):
        if tokens[i].isalpha(): cmd=tokens[i];i+=1
        op=cmd.upper(); rel=cmd.islower()
        if op=='Z':
            result.append({'command':'close-path'});x,y=sx,sy;cmd='';prev='Z';continue
        n={'M':2,'L':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'T':2,'A':7}[op]
        v=list(map(float,tokens[i:i+n]));i+=n
        px,py=x,y
        def p(a,b): return (a+px,b+py) if rel else (a,b)
        if op in ('M','L'):
            x,y=p(*v);emit('move-to' if op=='M' else 'line-to',x=x,y=y)
            if op=='M':sx,sy=x,y;cmd='l' if rel else 'L'
        elif op in ('H','V'):
            if op=='H':x=v[0]+px if rel else v[0]
            else:y=v[0]+py if rel else v[0]
            emit('line-to',x=x,y=y)
        elif op in ('C','S'):
            if op=='C':a,b=p(v[0],v[1]);c,e=p(v[2],v[3]);x,y=p(v[4],v[5])
            else:
                a,b=(2*px-last_ctrl[0],2*py-last_ctrl[1]) if prev in ('C','S') else (px,py)
                c,e=p(v[0],v[1]);x,y=p(v[2],v[3])
            emit('curve-to',c1x=a,c1y=b,c2x=c,c2y=e,x=x,y=y);last_ctrl=(c,e)
        elif op in ('Q','T'):
            if op=='Q':qx,qy=p(v[0],v[1]);x,y=p(v[2],v[3])
            else:
                qx,qy=(2*px-last_ctrl[0],2*py-last_ctrl[1]) if prev in ('Q','T') else (px,py)
                x,y=p(v[0],v[1])
            emit('curve-to',c1x=px+2*(qx-px)/3,c1y=py+2*(qy-py)/3,c2x=x+2*(qx-x)/3,c2y=y+2*(qy-y)/3,x=x,y=y)
            last_ctrl=(qx,qy)
        elif op=='A':
            rx,ry,angle,large,sweep,ex,ey=v;x,y=p(ex,ey);rx,ry=abs(rx),abs(ry)
            if not rx or not ry or (px==x and py==y):emit('line-to',x=x,y=y)
            else:
                phi=math.radians(angle);co,si=math.cos(phi),math.sin(phi)
                xp=co*(px-x)/2+si*(py-y)/2;yp=-si*(px-x)/2+co*(py-y)/2
                scale=max(1,math.sqrt(xp*xp/(rx*rx)+yp*yp/(ry*ry)));rx*=scale;ry*=scale
                a=rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp;b=rx*rx*yp*yp+ry*ry*xp*xp
                k=(-1 if bool(large)==bool(sweep) else 1)*math.sqrt(max(0,a/b))
                cxp=k*rx*yp/ry;cyp=-k*ry*xp/rx
                cx=co*cxp-si*cyp+(px+x)/2;cy=si*cxp+co*cyp+(py+y)/2
                start=math.atan2((yp-cyp)/ry,(xp-cxp)/rx);end=math.atan2((-yp-cyp)/ry,(-xp-cxp)/rx)
                delta=(end-start)%(2*math.pi)
                if not sweep and delta>0:delta-=2*math.pi
                count=math.ceil(abs(delta)/(math.pi/2));step=delta/max(1,count)
                def at(t):return (cx+rx*co*math.cos(t)-ry*si*math.sin(t),cy+rx*si*math.cos(t)+ry*co*math.sin(t))
                def tangent(t):return (-rx*co*math.sin(t)-ry*si*math.cos(t),-rx*si*math.sin(t)+ry*co*math.cos(t))
                for j in range(count):
                    t=start+j*step;u=t+step;factor=4/3*math.tan(step/4);p0=at(t);p1=at(u);d0=tangent(t);d1=tangent(u)
                    emit('curve-to',c1x=p0[0]+factor*d0[0],c1y=p0[1]+factor*d0[1],c2x=p1[0]-factor*d1[0],c2y=p1[1]-factor*d1[1],x=p1[0],y=p1[1])
        prev=op
    return result


class Board:
    def __init__(self,scene,key,name,page,x,y,w=390,h=844,bg='background',route='',note=''):
        self.scene=scene;self.key=key;self.name=name;self.page=page;self.x=x;self.y=y;self.w=w;self.h=h;self.count=0
        self.id=uid('board/'+key);self.svg=[];self.objects=[];self.route=route;self.note=note
        self._shape('frame',name,0,0,w,h,bg,id=self.id,parent=ZERO)
        self.objects[0]['shapes']=[];self.objects[0]['showContent']=False
        self.objects[0]['exports']=[{'type':'png','scale':2,'suffix':''}]
        scene.boards.append(self)

    def color(self,color):return C.get(color,color)

    def _shape(self,typ,name,x,y,w,h,fill=None,stroke=None,r=0,id=None,parent=None):
        self.count+=1;ox=x+self.x;oy=y+self.y
        o={'id':id or uid(f'{self.key}/{self.count}/{name}'),'name':name,'type':typ,'x':ox,'y':oy,'width':w,'height':h,
           'selrect':dict(x=ox,y=oy,width=w,height=h,x1=ox,y1=oy,x2=ox+w,y2=oy+h),
           'points':[dict(x=ox,y=oy),dict(x=ox+w,y=oy),dict(x=ox+w,y=oy+h),dict(x=ox,y=oy+h)],
           'transform':IDENTITY,'transformInverse':IDENTITY,'parentId':parent or self.id,'frameId':parent or self.id,
           'rotation':0,'flipX':False,'flipY':False,'fills':[], 'strokes':[],
           'constraintsH':'left','constraintsV':'top'}
        if fill:
            o['fills']=[dict(fillColor=self.color(fill),fillOpacity=1)]
            if fill in C:o['fills'][0].update(fillColorRefId=uid('color/'+fill),fillColorRefFile=FILE)
        if stroke:o['strokes']=[dict(strokeColor=self.color(stroke),strokeOpacity=1,strokeWidth=1,strokeStyle='solid',strokeAlignment='inner')]
        if r:o.update(dict(r1=r,r2=r,r3=r,r4=r))
        self.objects.append(o);return o

    def rect(self,x,y,w,h,fill='card',stroke=None,r=12,name='Surface'):
        o=self._shape('rect',name,x,y,w,h,fill,stroke,r)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{self.color(fill) if fill else "none"}" stroke="{self.color(stroke) if stroke else "none"}"/>')
        return o

    def ellipse(self,x,y,w,h,fill='foreground',stroke=None,name='Dot'):
        o=self._shape('circle',name,x,y,w,h,fill,stroke)
        self.svg.append(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="{self.color(fill) if fill else "none"}" stroke="{self.color(stroke) if stroke else "none"}"/>');return o

    def text(self,text,x,y,w=342,size=16,weight=400,color='foreground',align='left',lh=None,name=None):
        lh=lh or (20 if size==14 else 24 if size==16 else math.ceil(size*1.25))
        # Explicit line breaks make the reference stable across web/native text engines.
        lines=[]
        for paragraph in text.split('\n'):
            lines.extend(textwrap.wrap(paragraph,width=max(1,int(w/(size*.602))),break_long_words=True,replace_whitespace=False) or [''])
        height=len(lines)*lh
        o=self._shape('text',name or text[:65],x,y,w,height)
        fill=[dict(fillColor=self.color(color),fillOpacity=1)]
        if color in C:fill[0].update(fillColorRefId=uid('color/'+color),fillColorRefFile=FILE)
        attrs=dict(fontId=FONT,fontFamily='Geist Mono',fontVariantId=f'normal-{weight}',fontWeight=str(weight),fontStyle='normal',fontSize=str(size),lineHeight=str(lh/size),textAlign=align,letterSpacing='0',textTransform='none',textDecoration='none',fills=fill)
        o['growType']='fixed'
        o['content']={'type':'root','children':[{'type':'paragraph-set','children':[{'type':'paragraph',**attrs,'children':[{'text':line,**attrs}]} for line in lines]}]}
        # Penpot's render/export path also consumes measured text runs.
        o['positionData']=[]
        for i,line in enumerate(lines):
            tw=len(line)*size*.602;tx=x+(w-tw)/2 if align=='center' else x+w-tw if align=='right' else x
            baseline=y+i*lh+(lh-size)/2+size*.96
            o['positionData'].append(dict(x=tx+self.x,y=baseline+self.y,width=tw,height=lh,fontFamily='"Geist Mono"',fontSize=f'{size}px',fontWeight=str(weight),fontStyle='normal',text=line,fills=fill,textDecoration='none',textTransform='none',direction='ltr',letterSpacing='0'))
            self.svg.append(f'<text x="{tx}" y="{baseline}" font-family="Geist Mono" font-size="{size}" font-weight="{weight}" fill="{self.color(color)}">{html.escape(line)}</text>')
        return height,o

    def path(self,d,x,y,size=24,color='foreground',fill=None,name='Icon path',viewbox=24):
        scale=size/viewbox
        o=self._shape('path',name,x,y,size,size,fill)
        content=path_commands(d)
        for seg in content:
            for key,v in seg.get('params',{}).items():seg['params'][key]=v*scale+(x+self.x if key.endswith('x') else y+self.y)
        o['content']=content
        if color:o['strokes']=[dict(strokeColor=self.color(color),strokeWidth=2*scale,strokeOpacity=1,strokeStyle='solid',strokeAlignment='center',strokeCapStart='round',strokeCapEnd='round')]
        self.svg.append(f'<path d="{d}" transform="translate({x} {y}) scale({scale})" fill="{self.color(fill) if fill else "none"}" stroke="{self.color(color) if color else "none"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');return o

    def icon(self,name,x,y,size=24,color='foreground',weight=None):
        weight=weight or ('bold' if (self.route.endswith('/run') or self.key=='end-dialog') and name in ('play','pause','skip-back','skip-forward') else 'regular')
        icon=REF['icons'][name]
        for slot in range(icon['slots']):
            o=self.path(icon['paths'][weight] if slot==0 else 'M0 0',x,y,size,None,color if slot==0 else None,name,viewbox=256)
            # Keep stable shape IDs and layer counts: existing instances refer to them.
            o['name']=f'Phosphor / {icon["name"]} / {weight}' if slot==0 else 'Icon anchor / '+name
            if slot:
                o['hidden']=True
                self.svg.pop()

    def link(self,o,target):
        self.scene.links.append((o,target))

    def button(self,label,x,y,w=342,h=56,variant='primary',icon=None,target=None,size=16):
        fill={'primary':'primary','outline':'background','secondary':'secondary','ghost':None,'disabled':'border'}[variant]
        o=self.rect(x,y,w,h,fill,'border' if variant=='outline' else None,12 if h>=56 else 10,'Button / '+label)
        col='primaryForeground' if variant=='primary' else 'foreground'
        if icon:
            tw=len(label)*size*.602;start=x+(w-tw-28)/2;self.icon(icon,start,y+(h-20)/2,20,col);self.text(label,start+28,y+(h-size*1.5)/2,w-(start-x)-32,size,600,col)
        else:self.text(label,x+8,y+(h-size*1.5)/2,w-16,size,500,col,'center',lh=size*1.5)
        if target:self.link(o,target)
        return o

    def input(self,label,value,y,placeholder=False,h=48,x=24,w=342):
        if label:self.text(label,x,y,w,14,500);y+=28
        self.rect(x,y,w,h,'background','input',10,'Input / '+(label or value))
        self.text(value,x+12,y+12,w-24,14 if h>48 else 16,400,'mutedForeground' if placeholder else 'foreground')
        return y+h

    def header(self,title,back=True,right=None,home=False):
        self.text('9:41',24,10,100,12,600);self.rect(self.w-48,15,22,10,None,'foreground',2,'Status / battery');self.rect(self.w-46,17,17,6,'foreground',r=1,name='Status / charge')
        if home:
            self.brand(16,49);self.icon('scan-qr-code',self.w-46,54,24);self.link(self.objects[-1],'scan-permission')
        else:
            if back:self.icon('chevron-left',20,54);self.link(self.objects[-1],'home')
            self.text(title,58,54,self.w-116,18,600,'foreground','center')
            if right:self.text(right,self.w-62,56,50,14,500,'foreground','center')
        return 112

    def brand(self,x,y):
        self.rect(x,y,36,36,'chart1',r=10,name='Brand / amber tile')
        # The exact mark from SlabBrand, normalized from its 100-unit viewBox.
        self.path('M15 74 34 22c3-8 11-12 20-10l29 7-18 56c-2 8-10 12-18 10L15 74Z M32 62 L55 69 L67 38 L44 32 Z',x+4,y+4,6.72,None,'foreground','Brand / sloper')
        self.path('m32 62 23 7-3 9-24-6Z',x+4,y+4,6.72,None,'foreground','Brand / lower edge')
        self.text('67slopers',x+46,y+6,170,18,600)

    def footer(self,label,target=None,secondary=None):
        # A long reference board represents all scroll content; don't cover its
        # final rows with the pinned-action reference at the bottom.
        bottom=max(o['y']+o['height']-self.y for o in self.objects[1:])
        self.h=max(self.h,math.ceil(bottom+128))
        frame=self.objects[0];frame['height']=self.h
        frame['selrect'].update(height=self.h,y2=self.y+self.h)
        frame['points'][2]['y']=self.y+self.h;frame['points'][3]['y']=self.y+self.h
        y=self.h-104;self.rect(0,y,self.w,104,'background',r=0,name='Pinned footer');self.rect(0,y,self.w,1,'border',r=0)
        if secondary:
            self.button(secondary,24,y+12,(self.w-60)/2,variant='outline',target=target)
            self.button(label,36+(self.w-60)/2,y+12,(self.w-60)/2,target=target)
        else:self.button(label,24,y+12,self.w-48,target=target)
        self.rect((self.w-120)/2,self.h-12,120,4,'foreground',r=2,name='System / gesture bar')

    def art(self,boardid,x,y,w=342,highlight=False):
        board=next(b for b in REF['boards'] if b['id']==boardid);h=w*board['height']/board['width'];m=MEDIA[boardid]
        o=self._shape('rect','Board / '+board['name'],x,y,w,h)
        o['fills']=[{'fillOpacity':1,'fillImage':{'id':m['id'],'width':m['width'],'height':m['height'],'mtype':'image/png','name':board['name'],'keepAspectRatio':True}}]
        data=base64.b64encode((ROOT/f'assets/boards/{boardid}/base.png').read_bytes()).decode()
        self.svg.append(f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/png;base64,{data}"/>')
        if highlight:
            for hold in board['holds']:
                if hold['id'] in ('edge-medium-l','edge-medium-r'):
                    box=hold['box'];self.rect(x+box['x']*w,y+box['y']*h,box['w']*w,box['h']*h,None,'ring',4,'Selected grip / '+hold['id'])
        return h

    def save_svg(self,directory):
        bg=self.objects[0]['fills'][0]['fillColor']
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}"><rect width="100%" height="100%" fill="{bg}"/>'+''.join(self.svg)+'</svg>'
        (directory/(self.key+'.svg')).write_text(svg)


class Scene:
    def __init__(self):self.boards=[];self.links=[];self.extra=[];self.hotspots={}
    def resolve(self):
        boards={b.key:b for b in self.boards}
        owners={o['id']:b for b in self.boards for o in b.objects}
        workspace=json.loads((ROOT/'design/.local/workspace.json').read_text())
        for obj,target in self.links:
            assert target in boards,target
            dest=boards[target]
            if owners[obj['id']].page==dest.page:
                obj['interactions']=[dict(eventType='click',actionType='navigate',destination=dest.id,preserveScroll=False)]
            else:
                index=[b.id for b in self.boards if b.page==dest.page][::-1].index(dest.id)
                url=f'http://localhost:9002/#/view?file-id={workspace["fileId"]}&page-id={dest.page}&section=interactions&frame-id={dest.id}&index={index}'
                obj['interactions']=[dict(eventType='click',actionType='open-url',url=url)]
            # Viewer hit testing targets the uppermost shape. Put the button's
            # hit area above its independent text and icon layers.
            if obj['type']!='frame':
                owner=owners[obj['id']]
                if obj['id'] not in self.hotspots:
                    hot=owner.rect(obj['x']-owner.x,obj['y']-owner.y,obj['width'],obj['height'],'card',r=0,name='Prototype hotspot / '+target)
                    hot['opacity']=0.001;hot['locked']=True
                    owner.svg[-1]=owner.svg[-1].replace('/>',' opacity="0.001"/>')
                    self.hotspots[obj['id']]=hot
                self.hotspots[obj['id']]['interactions']=obj['interactions']
    def publish(self,p):
        self.resolve();f=p.file();changes=[]
        ownership=ROOT/'design/.local/published-shapes.json'
        previous=json.loads(ownership.read_text()) if ownership.exists() else {}
        current={}
        for b in self.boards:current.setdefault(b.page,[]).extend(o['id'] for o in b.objects)
        for page,oldids in previous.items():
            existing=f['data']['pagesIndex'][page]['objects']
            for id in set(oldids)-set(current.get(page,[])):
                if id in existing:changes.append(dict(type='del-obj',id=id,pageId=page))
        for b in self.boards:
            existing=f['data']['pagesIndex'][b.page]['objects']
            for o in b.objects:
                if o['id'] in existing:
                    # Only generated objects with deterministic IDs are touched.
                    attrs={k:v for k,v in o.items() if k not in ('id','type','shapes')}
                    changes.append(dict(type='mod-obj',id=o['id'],pageId=b.page,operations=[dict(type='assign',value=attrs)]))
                else:changes.append(dict(type='add-obj',id=o['id'],pageId=b.page,frameId=o['frameId'],parentId=o['parentId'],obj=o))
        for i in range(0,len(changes),250):
            p.update(changes[i:i+250]);print(f'Published {min(i+250,len(changes))}/{len(changes)} shapes',flush=True)
        # Restore drawing order after inserting changed layers, keeping any
        # hand-created children after the generated content.
        f=p.file();ordering=[]
        for b in self.boards:
            existing=f['data']['pagesIndex'][b.page]['objects'][b.id].get('shapes',[])
            generated=[o['id'] for o in b.objects[1:]]
            handmade=[id for id in existing if id not in previous.get(b.page,[]) and id not in generated]
            ordering.append(dict(type='mod-obj',id=b.id,pageId=b.page,operations=[dict(type='assign',value={'shapes':generated+handmade})]))
        for page in current:
            existing=f['data']['pagesIndex'][page]['objects'][ZERO].get('shapes',[])
            generated=[b.id for b in self.boards if b.page==page]
            handmade=[id for id in existing if id not in previous.get(page,[]) and id not in generated]
            ordering.append(dict(type='mod-obj',id=ZERO,pageId=page,operations=[dict(type='assign',value={'shapes':generated+handmade})]))
        p.update(ordering)
        ownership.write_text(json.dumps(current))
