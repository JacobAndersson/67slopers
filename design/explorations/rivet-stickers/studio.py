"""Local Cycles product still. Run with a Python environment containing bpy, NumPy and Pillow."""
import argparse
from math import sin, cos, pi, radians
from pathlib import Path
import tempfile
import bpy
import numpy as np
from mathutils import Vector
from PIL import Image, ImageFilter
from render import mask, OUT

parser = argparse.ArgumentParser()
parser.add_argument("--preview", action="store_true")
parser.add_argument("--output", type=Path, default=OUT / "sticker-render.png")
args = parser.parse_args()
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 8 if args.preview else 48
scene.cycles.use_denoising = True
scene.cycles.adaptive_threshold = .035
scene.render.threads_mode = "FIXED"
scene.render.threads = 12
scene.render.resolution_x, scene.render.resolution_y = (1024, 704) if args.preview else (3072, 2112)
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new("Studio ambient")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.57,.64,.74,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .25

def material(name, color, metal=0, rough=.4, grain=0, strength=.14):
    m=bpy.data.materials.new(name);m.use_nodes=True
    tree=m.node_tree; bs=tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*color,1)
    bs.inputs["Metallic"].default_value=metal;bs.inputs["Roughness"].default_value=rough
    if grain:
        tex=tree.nodes.new("ShaderNodeTexNoise");tex.inputs["Scale"].default_value=grain
        tex.inputs["Detail"].default_value=2.5
        bump=tree.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=strength
        bump.inputs["Distance"].default_value=.009
        tree.links.new(tex.outputs["Fac"],bump.inputs["Height"]);tree.links.new(bump.outputs[0],bs.inputs["Normal"])
        ramp=tree.nodes.new("ShaderNodeMapRange")
        ramp.inputs["To Min"].default_value=max(.03,rough-.10);ramp.inputs["To Max"].default_value=rough+.10
        tree.links.new(tex.outputs["Fac"],ramp.inputs["Value"]);tree.links.new(ramp.outputs[0],bs.inputs["Roughness"])
    return m

def assign(o,name,m):
    o.name=name;o.data.materials.append(m);return o

def cub(name,loc,dims,m,bevel):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new("Edge radius","BEVEL");mod.width=bevel;mod.segments=6
    o.modifiers.new("Face normals","WEIGHTED_NORMAL")
    return assign(o,name,m)

def mesh(name,verts,faces,m):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);return assign(o,name,m)

def lathe(name,profile,m,segments=240,flutes=0):
    verts=[];faces=[]
    for z,r in profile:
        for i in range(segments):
            a=2*pi*i/segments;rr=r+(0.006*cos(64*a) if flutes and r>.55 else 0)
            verts.append((bx+rr*sin(a),by-rr*cos(a),z))
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
    o=mesh(name,verts,faces,m)
    for p in o.data.polygons:p.use_smooth=True
    return o

def tube(name,pts,r,m,closed=False):
    curve=bpy.data.curves.new(name,"CURVE");curve.dimensions="3D";curve.resolution_u=12
    curve.bevel_depth=r;curve.bevel_resolution=5
    spl=curve.splines.new("BEZIER");spl.bezier_points.add(len(pts)-1)
    for p,co in zip(spl.bezier_points,pts):
        p.co=co;p.handle_left_type=p.handle_right_type="AUTO"
    spl.use_cyclic_u=closed
    o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);return assign(o,name,m)

al=material("Spun aluminium",(.55,.56,.54),.94,.30,280,.09)
rubber=material("Graphite elastomer",(.023,.022,.019),0,.53,170)
poly=material("Ink moulded polypropylene",(.033,.030,.028),.04,.36,210,.28)
inner=material("Inset moulding",(.047,.044,.041),.03,.41,200,.22)
seal=material("Recessed gasket",(.009,.008,.008),0,.64)
steel=material("Brushed nickel",(.48,.46,.42),.94,.22,280,.065)
floor=material("Chalk studio sweep",(.57,.54,.48),0,.72,380,.09)
cub("Sweep",(0,0,-.09),(1200,1200,.18),floor,.01)
bx,by=-1.56,-.20
lathe("Drawn aluminium body",[(.018,.01),(.018,.67),(.028,.76),(.056,.817),(.12,.849),(.23,.85),(2.80,.85),(2.93,.843),(3.03,.821),(3.12,.777),(3.22,.699),(3.31,.605),(3.38,.543),(3.44,.528),(3.54,.528),(3.54,.01)],al)
lathe("Rolled collar",[(3.44,.521),(3.45,.558),(3.477,.567),(3.495,.545),(3.50,.522)],steel)
lathe("Cap rim and fluting",[(3.50,.025),(3.50,.548),(3.53,.598),(3.57,.61),(3.78,.61),(3.82,.602),(3.85,.56),(3.855,.25),(3.855,.01)],rubber,512,64)
tube("Carry loop",[(bx-.37,by,3.79),(bx-.35,by,4.12),(bx-.20,by,4.28),(bx+.24,by,4.26),(bx+.35,by,4.11),(bx+.35,by,3.81)],.061,rubber)
cx,cy=1.04,.47
def casepart(n,x,y,z,w,d,h,m,r):
    return cub(n,(cx+x,cy+y,z),(w,d,h),m,r)
casepart("Rear shell",0,.26,1.48,3.20,.67,2.95,poly,.18)
casepart("Weather seal",0,-.027,1.49,3.18,.16,2.91,seal,.068)
casepart("Lid flange",0,-.15,1.49,3.22,.23,2.96,poly,.102)
casepart("Front moulding",0,-.345,1.47,3.11,.37,2.81,poly,.16)
casepart("Stepped face panel",0,-.509,1.46,2.87,.115,2.48,inner,.051)
for x in [-1.31,1.31]:
    casepart("Reinforcing rib",x,-.555,1.43,.065,.065,1.95,poly,.028)
for x in [-.96,.96]:
    casepart("Latch recess",x,-.54,2.66,.43,.12,.52,seal,.05)
    casepart("Flip latch",x,-.603,2.67,.33,.085,.38,poly,.037)
    for dz in [-.105,-.045,.015]:
        casepart("Thumb grip",x,-.654,2.67+dz,.21,.022,.022,rubber,.009)
    casepart("Hinge barrel",x,-.635,2.87,.39,.09,.073,steel,.034)
    for dx in [-.14,.14]:casepart("Hinge knuckle",x+dx,-.64,2.87,.076,.105,.092,poly,.035)
tube("Folding carry handle",[(cx-.54,cy+.03,2.90),(cx-.52,cy+.03,3.20),(cx-.38,cy+.03,3.28),(cx+.38,cy+.03,3.28),(cx+.52,cy+.03,3.20),(cx+.54,cy+.03,2.90)],.075,rubber)
for x in [-.54,.54]:casepart("Handle socket",x,.028,2.96,.23,.24,.15,poly,.05)

# Captive metal pins and their countersunk dark slots flank the latch hardware.
for x in [-1.29,1.29]:
    for z in [.38,2.40]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=12,radius=1,
            location=(cx+x,cy-.561,z))
        pin=assign(bpy.context.object,"Captive fastener",steel)
        pin.scale=(.043,.016,.043)
        slot=casepart("Recessed drive",x,-.577,z,.047,.003,.008,seal,.001)
        slot.rotation_euler.y=radians(28)

def decal(name,master,border,color,width,makepoint):
    art,cut=mask(master,border)
    rgba=np.empty((*cut.shape,4),dtype=np.uint8)
    rgba[:,:,:3]=np.round((1-art[:,:,None])*np.array(color)+art[:,:,None]*np.array([48,37,34])).astype('uint8')
    rgba[:,:,3]=np.rint(cut*255).astype('uint8')
    path=Path(tempdir)/(name+".png");Image.fromarray(rgba).save(path)
    m=material(name+" satin vinyl",(1,1,1),0,.38)
    bs=m.node_tree.nodes.get("Principled BSDF");tex=m.node_tree.nodes.new("ShaderNodeTexImage");tex.image=bpy.data.images.load(str(path))
    tree=m.node_tree;tree.links.new(tex.outputs["Color"],bs.inputs["Base Color"]);tree.links.new(tex.outputs["Alpha"],bs.inputs["Alpha"])
    height=width*cut.shape[0]/cut.shape[1];verts=[];faces=[];uv=[]
    for i in range(97):
        for j in [0,1]:
            verts.append(makepoint((i/96-.5)*width,(j-.5)*height));uv.append((i/96,j))
        if i:faces.append((2*i-2,2*i,2*i+1,2*i-1))
    o=mesh(name,verts,faces,m);layer=o.data.uv_layers.new()
    for p in o.data.polygons:
        p.use_smooth=True
        for n in p.loop_indices:layer.data[n].uv=uv[o.data.loops[n].vertex_index]

def light(name,loc,watts,size,size_y,target,color):
    data=bpy.data.lights.new(name,"AREA");data.energy=watts;data.shape="RECTANGLE";data.size=size;data.size_y=size_y;data.color=color
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
light("Tall reflection card",(-4.3,-4.8,5.7),530,2.1,6,(0,0,1.7),(1,.93,.82))
light("Cool strip",(3.9,.5,5.2),600,1.15,4.7,(0,0,1.6),(.79,.87,1))
light("Overhead softbox",(0,3,7),670,4,3,(0,0,1),(1,.97,.90))
light("Front bounce",(1,-5,3),90,4,3,(0,0,1),(1,1,1))
bpy.ops.object.camera_add(location=(4.0,-12.6,5.05));camera=bpy.context.object
target=Vector((.02,0,2.02));camera.rotation_euler=(target-camera.location).to_track_quat("-Z","Y").to_euler();camera.data.lens=60;scene.camera=camera
with tempfile.TemporaryDirectory() as tempdir:
    decal("Rivet contour","rivet-wordmark",17,(250,248,241),1.29,
          lambda x,z:(bx+.852*sin(.23+x/.852),by-.852*cos(.23+x/.852),1.83+z))
    decal("Pitch contour","pitch",23,(206,128,108),.83,
          lambda x,z:(cx-.43+x,cy-.568,1.53+z))
    scene.render.filepath=str(args.output);bpy.ops.render.render(write_still=True)
    if not args.preview:
        with Image.open(args.output) as image:
            image.resize((2400,1650),Image.Resampling.LANCZOS).save(args.output)
