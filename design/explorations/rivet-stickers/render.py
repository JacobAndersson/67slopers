"""Render two product decals from the Rivet vector masters with an orthographic ray marcher."""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / "design/exports/rivet-identity"
OUT = ROOT / "design/exports/rivet-showcase"
SIZE = 760

def unit(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-9)

def mask(name, border):
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "mask.png"
        subprocess.run(["convert", "-background", "none", "-density", "340",
                        str(ASSETS / (name + ".svg")), str(path)], check=True)
        alpha = Image.open(path).convert("RGBA").getchannel("A")
    alpha.thumbnail((650, 400))
    margin = border + 3
    padded = Image.new("L", (alpha.width + 2*margin, alpha.height + 2*margin))
    padded.paste(alpha, (margin, margin))
    # A disk-shaped offset around the artwork gives the vinyl a continuous cut line.
    from PIL import ImageDraw
    disk = Image.new("L", (2*border+1, 2*border+1))
    ImageDraw.Draw(disk).ellipse(disk.getbbox() or (0, 0, 2*border, 2*border), fill=255)
    src = np.asarray(padded)
    from numpy.fft import rfft2, irfft2
    dims = (src.shape[0]+2*border, src.shape[1]+2*border)
    conv = irfft2(rfft2(src/255, s=dims)*rfft2(np.asarray(disk)/255, s=dims), s=dims)
    cut = (conv[border:border+src.shape[0], border:border+src.shape[1]] > .15)
    return src/255, np.asarray(Image.fromarray((255*cut).astype("uint8")).filter(ImageFilter.GaussianBlur(.65)))/255

def box(x,y,z,a,b,c,r):
    q=[np.abs(x)-a+r,np.abs(y)-b+r,np.abs(z)-c+r]
    return np.sqrt(sum(np.maximum(k,0)**2 for k in q))+np.minimum(np.maximum.reduce(q),0)-r

def cyl(rad,y,r,half,bevel):
    a=rad-r+bevel; b=np.abs(y)-half+bevel
    return np.minimum(np.maximum(a,b),0)+np.hypot(np.maximum(a,0),np.maximum(b,0))-bevel

def geometry(p,bottle):
    x,y,z=p.T
    if bottle:
        rad=np.hypot(x,z)
        # Revolved shoulder, straight wall, neck and knurled cap.
        rr=.91-.32*np.clip((y-2.75)/.38,0,1)
        wall=cyl(rad,y-1.72,rr,1.69,.12)
        angle=np.arctan2(x,z)
        cap=cyl(rad,y-3.49,.64+.013*np.cos(64*angle),.26,.055)
        lip=cyl(rad,y-3.19,.625,.055,.025)
        return [wall,cap,lip]
    shell=box(x,y-1.33,z,1.74,1.30,.52,.17)
    rim=box(x,y-1.33,z+.13,1.765,1.32,.075,.06)
    handle=np.maximum(box(x,y-2.72,z, .65,.32,.14,.13),
                      -box(x,y-2.72,z,.46,.16,.30,.09))
    latch=box(np.abs(x)-1.1,y-2.48,z-.48,.17,.24,.095,.055)
    rib=box(np.abs(x)-1.48,y-1.30,z-.50,.038,.79,.048,.03)
    return [shell,rim,handle,latch,rib]

def render(bottle):
    art,cut=mask("rivet-wordmark" if bottle else "pitch",17 if bottle else 23)
    direction=unit(np.array([-.26,-.17,-1.] if bottle else [-.35,-.27,-1.]))
    right=unit(np.cross(direction,[0,1,0])); up=np.cross(right,direction)
    focus=np.array([0,1.88,0] if bottle else [0,1.54,0])
    span=4.45 if bottle else 4.85
    result=np.empty((SIZE,SIZE,3),dtype="uint8")
    light=unit(np.array([-.65,.90,.78]))
    for row in range(0,SIZE,40):
        yy,xx=np.mgrid[row:min(row+40,SIZE),0:SIZE]
        start=(focus-8*direction + ((xx.ravel()+.5)/SIZE-.5)[:,None]*span*right
               + (.5-(yy.ravel()+.5)/SIZE)[:,None]*span*up)
        t=np.zeros(len(start)); floor=-start[:,1]/direction[1]
        for _ in range(90):
            p=start+t[:,None]*direction
            ds=np.minimum.reduce(geometry(p,bottle))
            t=np.minimum(t+np.maximum(ds*.8,0),floor)
            if np.all((ds<.001)|(t>=floor)):break
        p=start+t[:,None]*direction;x,y,z=p.T
        parts=geometry(p,bottle);ids=np.argmin(parts,axis=0)
        hit=np.minimum.reduce(parts)<.004
        norm=unit(np.stack([np.minimum.reduce(geometry(p+axis*.001,bottle))-np.minimum.reduce(geometry(p-axis*.001,bottle)) for axis in np.eye(3)],axis=1))
        norm[~hit]=[0,1,0]
        if bottle:
            palette=np.array([[176,180,177],[46,42,40],[100,102,97]])
            theta=np.arctan2(x,z)
            u=(theta-.18)*.91/1.17+.5; v=(1.60-y)/(1.17*art.shape[0]/art.shape[1])+.5
            face=(ids==0)&(z>0)
        else:
            palette=np.array([[59,61,56],[43,45,42],[52,53,49],[119,114,100],[55,56,52]])
            u=(x+.58)/.80+.5;v=(1.61-y)/(.80*art.shape[0]/art.shape[1])+.5
            face=(ids==0)&(z>.50)
        rgb=palette[ids].astype(float)
        noise=np.random.default_rng(row).normal(0,1.3,len(t))
        rgb+=noise[:,None]
        inside=hit&face&(u>=0)&(u<1)&(v>=0)&(v<1)
        a=np.clip((u*art.shape[1]).astype(int),0,art.shape[1]-1); b=np.clip((v*art.shape[0]).astype(int),0,art.shape[0]-1)
        vinyl=cut[b,a]*inside; pigment=art[b,a]*inside
        edge=np.array([249,246,236] if bottle else [206,128,108])
        rgb=rgb*(1-vinyl[:,None])+edge*vinyl[:,None]
        rgb=rgb*(1-pigment[:,None])+np.array([48,37,34])*pigment[:,None]
        diff=np.maximum(norm@light,0)
        spec=np.maximum(norm@unit(light-direction),0)**(16 if bottle else 28)
        rgb=rgb*(.60+.43*diff[:,None])+spec[:,None]*(1-vinyl[:,None]*.88)*(58 if bottle else 17)
        shadow=np.ones(len(p));dist=np.full(len(p),.035)
        for _ in range(30):
            q=p+norm*.012+dist[:,None]*light
            ds=np.minimum.reduce(geometry(q,bottle));shadow=np.minimum(shadow,5*np.maximum(ds,0)/dist)
            dist+=np.clip(ds,.025,.6)
        ground=np.array([222,219,208] if bottle else [190,201,177])*(.98+.013*noise[:,None])
        rgb=np.where(hit[:,None],rgb,ground)*(.71+.29*shadow[:,None])
        result[row:row+yy.shape[0]]=np.clip(rgb,0,255).reshape(*yy.shape,3)
    return Image.fromarray(result)

if __name__=="__main__":
    sheet=Image.new("RGB",(SIZE*2+10,SIZE),"#faf9f6")
    sheet.paste(render(True));sheet.paste(render(False),(SIZE+10,0))
    sheet.save(OUT/"sticker-render.png")
