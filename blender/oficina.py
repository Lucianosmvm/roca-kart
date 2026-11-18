"""Original Oficina da Roça cast. No imported geometry or manufacturer references.
Run: blender -b --factory-startup --python blender/oficina.py
Coordinates: +Y forward, Z up. Wheel origins are axle centers for runtime animation.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def materials(color):
    return dict(paint=mat('Paint', color, .5), cream=mat('Cream', '#FFF0CF'),
                coral=mat('Coral', '#E87578'), teal=mat('Teal', '#216C79'),
                straw=mat('Straw', '#E9C46A'), rubber=mat('Rubber', '#29353D'),
                metal=mat('Metal', '#56656B'), white=mat('Headlight', '#FFF9E9', .4, .12),
                pupil=mat('Pupil', '#162B34'), blue=mat('Water', '#75C5D4'))

def rounded(n, size, loc, material, bevel=.1):
    return box(n, size, loc, material, bevel, 3)

def sphere(n, size, loc, material):
    o = uvs(n, 1, loc, material, 20, 12, scale=size)
    for p in o.data.polygons: p.use_smooth = True
    return o

def rod(n, a, b, r, material):
    a, b = Vector(a), Vector(b)
    o = cyl(n, r, (b-a).length, (a+b)/2, material, 12)
    o.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return o

def face(parts, y, z, spread, m):
    for s in (-1, 1):
        x = s*spread
        parts.append(sphere('EyeRim', (.29,.12,.3), (x,y,z), m['cream']))
        parts.append(sphere('EyeWhite', (.23,.1,.24), (x,y+.09,z), m['white']))
        parts.append(sphere('Pupil', (.115,.065,.15), (x-s*.025,y+.17,z), m['pupil']))
        parts.append(sphere('EyeShine', (.035,.025,.045), (x-.03,y+.23,z+.06), m['white']))
    parts.append(sphere('Smile', (.23,.045,.12), (0,y+.04,z-.39), m['pupil']))
    parts.append(sphere('Tongue', (.12,.035,.045), (0,y+.08,z-.445), m['coral']))

def wheel(n, loc, radius, width, m):
    # Build at origin before joining, so animation cannot swing wheels around the body.
    parts = [cyl('Tire', radius*.91, width, (0,0,0), m['rubber'], 24,
                 rot=(0,math.pi/2,0), bevel=.08, seg=3)]
    for k in range(14):
        a=2*math.pi*k/14
        parts.append(rounded('Tread', (width*1.06,.19,radius*.19),
                             (0,math.sin(a)*radius*.92,math.cos(a)*radius*.92),m['rubber'],.035))
        parts[-1].rotation_euler.x=-a
    for s in (-1,1):
        parts.append(cyl('CreamHub',radius*.56,.055,(s*width*.51,0,0),m['cream'],20,rot=(0,math.pi/2,0),bevel=.025,seg=2))
        parts.append(cyl('Hubcap',radius*.23,.12,(s*width*.55,0,0),m['coral'],12,rot=(0,math.pi/2,0),bevel=.03,seg=2))
        for k in range(5):
            a=k*math.tau/5
            parts.append(cyl('LugBolt',.035,.05,(s*width*.56,math.sin(a)*radius*.38,math.cos(a)*radius*.38),m['metal'],8,rot=(0,math.pi/2,0)))
    o=join(parts,n)
    # Common.join keeps the first object's center (the tire at origin).
    o.location=loc
    return o

def seat(parts, y, z, m):
    parts.append(rounded('Seat',(.78,.65,.2),(0,y,z),m['coral'],.095))
    parts.append(rounded('SeatBack',(.8,.19,.72),(0,y-.31,z+.36),m['coral'],.09))
    for s in (-1,1):
        parts.append(rounded('SeatStitch',(.025,.025,.42),(s*.22,y-.20,z+.36),m['cream'],.01))
    parts.append(rod('SteeringColumn',(0,y+.5,z-.18),(0,y+.6,z+.5),.055,m['metal']))
    bpy.ops.mesh.primitive_torus_add(major_radius=.25,minor_radius=.045,major_segments=20,minor_segments=8,location=(0,y+.6,z+.5),rotation=(.55,0,0))
    o=bpy.context.object; o.data.materials.append(m['rubber']); parts.append(o)

def finish(parts, extra, name, target, dist):
    # Export editable assemblies independently, retaining their transforms.
    categories = {'Hood': ['ShellHood','ShellRib'], 'Roof': ['SunCanopy','CanopyPost'],
                  'Bumper': ['CoralBumper','BumperBolt'], 'Tank': ['WaterDrop','TankStrap'],
                  'Hoppers': ['SeedHopper','SeedTip','HopperBand','BandBolt']}
    assemblies=[]
    for label,prefixes in categories.items():
        selected=[o for o in parts if any(o.name.startswith(s) for s in prefixes)]
        if selected:
            assemblies.append(join(selected,label))
            parts=[o for o in parts if o not in selected]
    body=join(parts,'Body')
    objects=[body]+assemblies+extra
    for o in objects:
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    export(objects,name+'.glb')
    save_blend(name)
    if os.environ.get('SKIP_PORTRAITS') == '1':
        return
    # Portraits come from the actual mesh, not the concept illustration.
    sc=bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.samples=24
    sc.render.film_transparent=True
    sc.world=bpy.data.worlds.new('Studio')
    sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.82,.9,1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.7
    for pos,power,size in [((4,6,8),950,6),((-5,1,5),650,5)]:
        light=bpy.data.objects.new('Softbox',bpy.data.lights.new('Softbox','AREA'))
        sc.collection.objects.link(light); light.location=pos; light.data.energy=power; light.data.shape='DISK'; light.data.size=size
        light.rotation_euler=(Vector(target)-light.location).to_track_quat('-Z','Y').to_euler()
    cam=bpy.data.objects.new('PortraitCamera',bpy.data.cameras.new('PortraitCamera'));sc.collection.objects.link(cam)
    cam.location=Vector(target)+Vector((.65,.95,.48)).normalized()*dist
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=dist*.68;sc.camera=cam
    sc.render.resolution_x=640;sc.render.resolution_y=640;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG';sc.view_settings.view_transform='Standard'
    sc.render.filepath=os.path.join(ROOT,'assets','ui',name+'.png')
    bpy.ops.render.render(write_still=True)

def tatu():
    reset();m=materials('#216C79');p=[]
    p.append(rounded('Frame',(.95,3.2,.32),(0,0,.72),m['metal']))
    p.append(sphere('ShellHood',(.8,1.15,.67),(0,.95,1.3),m['paint']))
    # Three broad shell ridges read clearly in a racing camera.
    for x in (-.38,0,.38):
        p.append(sphere('ShellRib',(.055,.98,.63),(x,.94,1.39),m['teal']))
    p.append(rounded('CoralBumper',(1.65,.28,.28),(0,2.0,.65),m['coral']))
    face(p,1.94,1.39,.44,m)
    seat(p,-.73,1.24,m)
    for s in (-1,1):
        p.append(rod('CanopyPost',(s*.58,-1.12,1.1),(s*.58,-1.05,2.72),.065,m['teal']))
        p.append(rounded('RearFender',(.78,1.48,.18),(s*1.0,-1.03,1.98),m['paint']))
        p.append(rounded('Footstep',(.42,.65,.12),(s*.7,-.04,.85),m['cream']))
        for y in (-1.48,-.65):
            p.append(sphere('FenderBolt',(.06,.06,.045),(s*.99,y,2.09),m['cream']))
        p.append(sphere('BumperBolt',(.07,.035,.07),(s*.62,2.15,.65),m['cream']))
    p.append(rounded('SunCanopy',(1.65,1.52,.25),(0,-.8,2.79),m['cream'],.12))
    p.append(rod('Exhaust',(-.64,.4,1.32),(-.64,.4,2.43),.085,m['metal']))
    p.append(rod('BentExhaust',(-.64,.4,2.43),(-.64,.15,2.56),.085,m['metal']))
    p.append(rounded('TowHitch',(.36,.5,.16),(0,-1.85,.64),m['coral']))
    wheels=[]
    for suffix,x,y,r,w in [('RL',-1,-1.05,.96,.6),('RR',1,-1.05,.96,.6),('FL',-.85,1.23,.58,.43),('FR',.85,1.23,.58,.43)]:
        wheels.append(wheel('Wheel'+suffix,(x,y,r),r,w,m))
    finish(p,wheels,'tatu',(0,.05,1.35),6.8)

def pingo():
    reset();m=materials('#E87578');p=[]
    p.append(rounded('BuggyFrame',(1.6,3.1,.4),(0,0,.8),m['paint']))
    p.append(rounded('Nose',(1.5,.85,.65),(0,1.15,1.13),m['paint'],.22))
    p.append(rounded('Bumper',(1.7,.2,.2),(0,1.65,.72),m['cream']))
    face(p,1.54,1.25,.43,m)
    seat(p,.36,1.2,m)
    # Lathed asymmetric water drop: a genuine different silhouette.
    verts=[];faces=[];rings=[(.85,.0),(1.0,.6),(1.4,.83),(1.9,.78),(2.4,.54),(2.85,.25),(3.3,.025)]
    n=24
    for z,r in rings:
        for k in range(n):
            a=k*math.tau/n;verts.append((r*math.cos(a)+(z-1.8)*.10,-.85+r*math.sin(a),z))
    for j in range(len(rings)-1):
        for k in range(n):
            a=j*n+k;b=j*n+(k+1)%n;faces.append((a,b,b+n,a+n))
    faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+k for k in range(n))])
    mesh=bpy.data.meshes.new('WaterDrop');mesh.from_pydata(verts,[],faces);mesh.update()
    tank=bpy.data.objects.new('WaterDrop',mesh);bpy.context.collection.objects.link(tank);mesh.materials.append(m['blue'])
    for f in mesh.polygons:f.use_smooth=True
    p.append(tank)
    for s in (-1,1):
        p.append(rounded('TankStrap',(.12,1.24,.12),(s*.49,-.85,2.13),m['cream'],.05))
        p.append(rod('Rollbar',(s*.65,-.13,1.05),(s*.65,-.13,2.25),.07,m['cream']))
    p.append(rod('RollbarTop',(-.65,-.13,2.25),(.65,-.13,2.25),.07,m['cream']))
    arms=[]
    for s,label in [(-1,'L'),(1,'R')]:
        a=[rod('NozzleArm',(s*.7,-.65,1.5),(s*1.28,-.55,2.0),.09,m['cream']),
           rod('NozzleElbow',(s*1.28,-.55,2.0),(s*1.65,-.27,2.0),.08,m['cream']),
           sphere('NozzleJoint',(.14,.14,.14),(s*1.28,-.55,2.0),m['coral']),
           cyl('SprayNozzle',.15,.22,(s*1.65,-.12,2.0),m['straw'],12,rot=(math.pi/2,0,0))]
        arm=join(a,'Boom'+label)
        # Runtime animates these nodes around their attachment points.
        cursor=bpy.context.scene.cursor;cursor.location=(s*.7,-.65,1.5)
        bpy.context.view_layer.objects.active=arm;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');arms.append(arm)
    wheels=[wheel('Wheel'+suffix,(x,y,.68),.68,.5,m) for suffix,x,y in [('RL',-.98,-1.0),('RR',.98,-1.0),('FL',-.98,1.0),('FR',.98,1.0)]]
    finish(p,wheels+arms,'pingo',(0,0,1.6),7.4)

def broto():
    reset();m=materials('#216C79');p=[]
    p.append(rounded('PlanterFrame',(2.6,1.35,.3),(0,0,.72),m['teal']))
    p.append(rounded('FacePanel',(2.25,.18,.6),(0,.7,1.18),m['cream']))
    face(p,.82,1.38,.61,m)
    p.append(rod('Drawbar',(0,.45,.64),(0,2.2,.64),.13,m['teal']))
    p.append(rounded('HitchTip',(.36,.35,.18),(0,2.15,.64),m['coral']))
    for x in (-.79,0,.79):
        p.append(sphere('SeedHopper',(.4,.49,.73),(x,-.12,1.63),m['straw']))
        p.append(cone('SeedTip',.34,.65,(x,-.12,2.24),m['straw'],20))
        p.append(rounded('HopperBand',(.79,.95,.13),(x,-.12,1.62),m['cream'],.06))
        p.append(rounded('SeedGate',(.27,.3,.25),(x,.35,.88),m['coral']))
        p.append(cyl('PlantingDisc',.29,.08,(x,-.55,.3),m['cream'],18,rot=(0,math.pi/2,0)))
        p.append(sphere('BandBolt',(.06,.035,.06),(x,.38,1.62),m['coral']))
    wheels=[wheel('Wheel'+label,(x,0,.64),.64,.44,m) for label,x in [('L',-1.48),('R',1.48)]]
    # Trailer origin is the drawbar coupling, matching the game's hitch contract.
    for o in p+wheels:
        o.location.y-=2.2; o.location.z-=.64
    finish(p,wheels,'broto',(0,-1.85,.56),6.8)

if __name__ == '__main__':
    for build in (tatu,pingo,broto): build()
