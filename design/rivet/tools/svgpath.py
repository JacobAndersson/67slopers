"""SVG path data -> Penpot absolute path commands (cubic curves, arcs resolved). From design/penpot/scene.py."""
import math, re

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


