"""Production asset pipeline: rounded original farm toys, editable sources and GLB.
Run Blender headless with -- vehicles | parts | scenery | courses | signs, or no stage for all.
This generates assets and portraits only. It never starts the game or runs tests.
Existing assembly names, pivots, dimensions and course surface topology are preserved.
"""
import os, sys, math, runpy
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
import common as c

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE=os.path.dirname(os.path.abspath(__file__))
STAGES=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
raw_box,raw_cyl,raw_uvs,raw_ico,raw_join,raw_export=c.box,c.cyl,c.uvs,c.ico,c.join,c.export

def soft_box(name,size,loc,m,bevel=.04,seg=1,rot=(0,0,0)):
    # Keep intentional thin paint lines / floor planes flat. Round actual volumes.
    bevel=min(bevel,min(size)*.45) if bevel else 0
    return raw_box(name,size,loc,m,bevel,max(4,seg) if bevel else seg,rot)

def soft_cyl(name,r,depth,loc,m,verts=12,rot=(0,0,0),bevel=0,seg=1,r2=None):
    return raw_cyl(name,r,depth,loc,m,max(24,verts),rot,bevel,max(3,seg),r2)

def soft_uvs(name,r,loc,m,seg=10,rings=6,scale=(1,1,1)):
    return raw_uvs(name,r,loc,m,max(12 if r<.25 else 24,seg),max(8 if r<.25 else 14,rings),scale)

def soft_ico(name,r,loc,m,sub=1,scale=(1,1,1),rot=(0,0,0)):
    return raw_ico(name,r,loc,m,max(2,sub),scale,rot)

def smooth(obj):
    for face in obj.data.polygons: face.use_smooth=True
    # Weighted split normals keep panel centers flat while bevels catch soft light.
    bpy.context.view_layer.objects.active=obj
    normal=obj.modifiers.new('WeightedPanelNormals','WEIGHTED_NORMAL')
    normal.keep_sharp=True;normal.weight=40
    bpy.ops.object.modifier_apply(modifier=normal.name)
    return obj

def soft_join(objects,name):return smooth(raw_join(objects,name))

c.box=soft_box;c.cyl=soft_cyl;c.uvs=soft_uvs;c.ico=soft_ico;c.join=soft_join

def tube(name,a,b,r,material):
    a,b=Vector(a),Vector(b)
    obj=soft_cyl(name,r,(b-a).length,(a+b)*.5,material,16,bevel=r*.2,seg=3)
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return obj

def ring(name,r,minor,loc,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=minor,major_segments=40,minor_segments=8,location=loc,rotation=rotation)
    obj=bpy.context.object;obj.name=name;obj.data.materials.append(material)
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def sphere(name,size,loc,m):return soft_uvs(name,1,loc,m,scale=size)

def wheel(name,loc,radius,width,m):
    # A rounded tire cross-section, separate sidewall rings, rim recess and paired tread.
    profile=[(-.5,.66),(-.55,.78),(-.5,.9),(-.36,.965),(.36,.965),(.5,.9),(.55,.78),(.5,.66)]
    vertices=[];faces=[];n=48
    for x,r in profile:
        for k in range(n):
            a=k*math.tau/n;vertices.append((x*width,math.sin(a)*r*radius,math.cos(a)*r*radius))
    for j in range(len(profile)):
        q=(j+1)%len(profile)
        for k in range(n):faces.append((j*n+k,q*n+k,q*n+(k+1)%n,j*n+(k+1)%n))
    mesh=bpy.data.meshes.new('RoundedTire');mesh.from_pydata(vertices,[],faces);mesh.update()
    tire=bpy.data.objects.new('Tire',mesh);bpy.context.collection.objects.link(tire);mesh.materials.append(m['rubber']);parts=[tire]
    for k in range(20):
        a=k*math.tau/20
        for side in (-1,1):
            obj=soft_box('ChevronTread',(width*.57,radius*.15,radius*.075),(side*width*.23,math.sin(a)*radius*.975,math.cos(a)*radius*.975),m['rubber'],radius*.022)
            obj.rotation_euler=(-a,0,side*.32);parts.append(obj)
    for side in (-1,1):
        parts.append(ring('SidewallLine',radius*.78,radius*.018,(side*width*.525,0,0),m['rubber'],(0,math.pi/2,0)))
        parts.append(soft_cyl('RimRecess',radius*.66,.06,(side*width*.51,0,0),m['metal'],32,rot=(0,math.pi/2,0),bevel=.018))
        parts.append(soft_cyl('CreamHub',radius*.53,.085,(side*width*.56,0,0),m['cream'],32,rot=(0,math.pi/2,0),bevel=.025))
        parts.append(ring('RimLip',radius*.53,radius*.027,(side*width*.605,0,0),m['cream'],(0,math.pi/2,0)))
        parts.append(soft_cyl('Hubcap',radius*.22,.12,(side*width*.62,0,0),m['coral'],24,rot=(0,math.pi/2,0),bevel=.026))
        for k in range(6):
            a=k*math.tau/6;parts.append(soft_cyl('LugBolt',radius*.038,.045,(side*width*.625,math.sin(a)*radius*.36,math.cos(a)*radius*.36),m['metal'],8,rot=(0,math.pi/2,0),bevel=.007))
    obj=soft_join(parts,name);obj.location=loc
    return obj

import oficina as of
of.wheel=wheel
original_finish=of.finish

def vehicle_details(parts,extras,name,target,dist):
    m=of.materials('#216C79');glass=c.mat('CabGlass','#669FA7',.22);added=[]
    def box(n,size,loc,material=None,bevel=.04):
        obj=soft_box(n,size,loc,material or m['metal'],bevel);added.append(obj);return obj
    def rod(n,a,b,r,material=None):
        obj=tube(n,a,b,r,material or m['metal']);added.append(obj);return obj
    def ball(n,size,loc,material=None):
        obj=sphere(n,size,loc,material or m['cream']);added.append(obj);return obj
    def remove(prefixes):
        for obj in list(parts):
            if any(obj.name.startswith(s) for s in prefixes):parts.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
    def lights(y,z,spread):
        for side in (-1,1):
            ball('HeadlampHousing',(.17,.07,.17),(side*spread,y,z),m['metal'])
            ball('HeadlampLens',(.13,.04,.13),(side*spread,y+.06,z),m['white'])
    def mirrors(y,z,spread):
        for side in (-1,1):
            rod('MirrorStem',(side*.7,y,z),(side*spread,y+.1,z+.12),.035)
            box('MirrorHousing',(.16,.16,.32),(side*spread,y+.12,z+.2),m['teal'],.07)
            box('MirrorGlass',(.115,.025,.23),(side*spread,y+.212,z+.2),glass,.035)
    def vents(prefix,x,y,z,length=.7):
        for side in (-1,1):
            for k in range(6):box(prefix,(.025,.045,.23),(side*x,y-length*.5+k*length/5,z),m['pupil'],.012)
    def steps(x,y):
        for side in (-1,1):
            for z in (.55,.76):
                box('StepTread',(.32,.37,.055),(side*x,y,z),m['metal'],.018)
                for j in (-.09,0,.09):box('StepGrip',(.22,.02,.012),(side*x,y+j,z+.031),m['rubber'],.005)
    if name=='tatu':
        remove(('ShellHood','ShellRib'))
        box('ShellHood',(1.6,1.95,1.03),(0,.9,1.3),m['paint'],.28)
        box('ShellRibSpine',(.1,1.55,.035),(0,.91,1.83),m['cream'],.015)
        box('ShellHoodGrille',(1.1,.04,.32),(0,1.891,.99),m['pupil'],.08)
        for z in (.9,.99,1.08):box('ShellHoodGrilleSlat',(.98,.027,.025),(0,1.92,z),m['metal'],.009)
        vents('ShellHoodSideVent',.804,.9,1.37)
        box('SunCanopyFrontGlass',(1.13,.06,.8),(0,-.18,2.17),glass,.11)
        for side in (-1,1):
            rod('CanopyPostFront',(side*.6,-.2,1.65),(side*.6,-.2,2.65),.045,m['teal'])
            box('SunCanopySideGlass',(.035,.81,.69),(side*.59,-.64,2.2),glass,.014)
            box('DoorHandle',(.09,.27,.04),(side*.64,-.65,1.77),m['cream'],.018)
            rod('ExhaustShieldSeam',(side*.1-.64,.4,1.6),(side*.1-.64,.4,2.15),.025)
        lights(1.91,.99,.67);mirrors(-.17,2.1,.9);steps(.75,-.1)
        for z in (1.58,1.73,1.88,2.03):box('ExhaustShield',(.23,.22,.045),(-.64,.4,z),m['metal'],.02)
    elif name=='pingo':
        vents('SideVent',.81,.45,1.08,.55);lights(1.59,.97,.57);mirrors(.27,1.72,.97);steps(.8,.2)
        for side in (-1,1):
            rod('TankStrapHose',(side*.64,-1.25,1.0),(side*.68,-.3,1.48),.045,m['teal'])
            box('TankStrapLevelGauge',(.08,.12,.55),(side*.75,-.8,1.7),m['cream'],.025)
            for z in (1.51,1.65,1.79,1.93):box('TankStrapGaugeMark',(.095,.135,.025),(side*.75,-.8,z),m['teal'],.008)
        added.append(soft_cyl('TankStrapFillCap',.16,.12,(.17,-.85,3.22),m['metal'],24,bevel=.025))
        box('FrontSkidPlate',(1.1,.15,.18),(0,1.72,.6),m['metal'],.06)
    elif name=='pipoca':
        remove(('RoundCab',))
        box('CabShell',(1.38,1.18,1.11),(0,.1,2.01),m['paint'],.24)
        box('Windshield',(1.12,.055,.67),(0,.718,2.19),glass,.1)
        for side in (-1,1):
            box('SideGlass',(.045,.8,.65),(side*.707,.12,2.16),glass,.02)
            rod('GuardRail',(side*.82,-1.2,1.4),(side*.82,-1.2,2.13),.045,m['cream'])
            rod('GuardRailTop',(side*.82,-1.2,2.13),(side*.82,-.4,2.13),.045,m['cream'])
        added.append(soft_cyl('CollectorReel',.19,1.8,(0,1.65,.7),m['metal'],32,rot=(0,math.pi/2,0),bevel=.025))
        for x in (-.7,-.42,-.14,.14,.42,.7):box('CollectorFinger',(.06,.4,.06),(x,1.76,.66),m['cream'],.018)
        lights(1.61,.96,.74);mirrors(.3,2.1,.9);steps(.78,.25)
        vents('RearCoolingVent',.83,-.67,1.18,.6)
        added.append(ring('GrainSpoutCollar',.13,.035,(.97,-.84,2.56),m['metal']))
    elif name=='bento':
        box('TruckHood',(1.55,.65,.55),(0,1.88,1.08),m['paint'],.2)
        box('FrontGrille',(1.03,.045,.32),(0,2.218,1.06),m['pupil'],.07)
        for z in (.96,1.05,1.14):box('GrilleSlat',(.91,.035,.035),(0,2.246,z),m['metal'],.012)
        remove(('CoralBumper',))
        box('TruckBumper',(1.88,.25,.27),(0,2.24,.67),m['coral'],.115)
        box('Windshield',(1.32,.05,.68),(0,1.745,1.97),glass,.12)
        for side in (-1,1):
            box('SideWindow',(.045,.83,.6),(side*.86,1.04,1.99),glass,.02)
            box('DoorHandle',(.06,.23,.045),(side*.89,.73,1.54),m['cream'],.018)
            added.append(soft_cyl('FuelTank',.22,.83,(side*.73,-.09,.62),m['metal'],24,rot=(math.pi/2,0,0),bevel=.04))
            rod('ExhaustStack',(side*.87,.18,.75),(side*.87,.18,2.67),.065)
            for z in (.98,1.12,1.26):box('BedPanelSeam',(.145,1.65,.018),(side*.92,-.9,z),m['teal'],.008)
            box('TailLight',(.2,.07,.12),(side*.65,-1.9,1.04),m['coral'],.035)
        lights(2.23,1.01,.65);mirrors(1.05,1.98,1.1);steps(.88,.5)
        for x in (-.64,.64):box('TailgateHinge',(.18,.09,.12),(x,-1.9,1.24),m['metal'],.025)
    elif name=='broto':
        for x in (-.79,0,.79):
            rod('SeedTube',(x,.35,.87),(x,-.5,.38),.065,m['rubber'])
            box('MeterHousing',(.3,.28,.2),(x,.3,.83),m['metal'],.06)
            added.append(ring('DiscRim',.25,.025,(x,-.55,.3),m['metal'],(0,math.pi/2,0)))
        for x in (-1,1):
            rod('HydraulicRam',(x*.63,.7,.77),(x*.23,1.75,.66),.055)
            for y in (.3,.6):box('ChassisBolt',(.08,.08,.04),(x*1.02,y,.91),m['cream'],.015)
        for obj in added:obj.location.y-=2.2;obj.location.z-=.64
    parts.extend(added)
    original_finish(parts,extras,name,target,dist)

of.finish=vehicle_details

def detail_prop(objects,filename):
    """Original construction details on the existing, already correctly scaled assets."""
    name=os.path.splitext(filename)[0];extra=[]
    metal=c.mat('DetailMetal','#71868C',.38);cream=c.mat('DetailCream','#FFF0CF',.48);wood=c.mat('DetailWood','#A9794E',.7)
    def box(n,size,loc,material=wood,bevel=.025):extra.append(soft_box(n,size,loc,material,bevel))
    if name.startswith('broto_hoppers_'):
        for x in (-.79,0,.79):
            box('Outlet',(.23,.27,.2),(x,-2.32,.48),metal,.04)
            for side in (-1,1):box('LidLatch',(.07,.1,.13),(x+side*.27,-1.89,1.36),metal,.015)
            if name.endswith('seed'):
                extra.append(soft_cyl('HopperCap',.15,.07,(x,-2.32,1.85),cream,24,bevel=.02))
            elif name.endswith('barrel'):
                extra.append(soft_cyl('Bung',.055,.045,(x+.12,-2.32,1.58),metal,16,bevel=.01))
            else:
                for z in (.73,.98,1.21):box('PlankGap',(.65,.012,.016),(x,-1.874,z),wood,.004)
    if name=='silo':
        for k in range(20):
            a=k*math.tau/20
            for z in (2,5,8):extra.append(soft_cyl('PanelRivet',.045,.035,(math.cos(a)*2.015,math.sin(a)*2.015,z),metal,8))
    if name in ('barn','race_barn'):
        # Roof-top vent, fixed outside the clear passage beneath the landmark.
        large=name=='race_barn';z=14.3 if large else 8.2
        box('RoofVent',(1.6,1.7,.65),(0,0,z),cream,.12)
        for y in (-.45,0,.45):box('VentSlat',(1.4,.1,.06),(0,y,z+.35),metal,.02)
    if name=='fence':
        for x in (-1.5,1.5):
            for z in (.45,.95):extra.append(soft_cyl('RailBolt',.045,.04,(x,-.065,z),metal,8,rot=(math.pi/2,0,0),bevel=.008))
    if name=='acc_straw':
        for k in range(24):
            a=k*math.tau/24;extra.append(tube('WovenBrim',(.35*math.cos(a),.35*math.sin(a),.065),(.57*math.cos(a),.57*math.sin(a),.065),.008,cream))
    if name=='acc_cap':
        for side in (-1,1):
            for y in (-.13,.05,.2):box('CapStitch',(.014,.045,.012),(side*.19,y,.245),cream,.004)
    if name=='garage':
        for x in (-7.8,7.8):
            box('ToolCabinet',(1.8,.65,2.0),(x,7.2,1.0),c.mat('CabinetPaint','#216C79',.45),.12)
            for z in (.4,.8,1.2,1.6):box('DrawerHandle',(.7,.09,.06),(x,6.82,z),cream,.02)
    if name=='race_bridge':
        for side in (-1,1):
            for y in range(-14,15,4):box('RailBolt',(.09,.13,.13),(side*10.9,y,1.25),metal,.025)
    if name=='race_stall':
        for x in (-1.7,0,1.7):box('PriceCard',(.6,.035,.3),(x,-1.53,1.45),cream,.025)
    if name=='race_mill':
        for z in (3,6,9):box('MillWindow',(.65,.12,.85),(0,-4.03,z),c.mat('WindowGlass','#669FA7',.22),.12)
    if name=='race_shortcut' or name.startswith('race_curve') or name.startswith('race_sign'):
        # Fasteners, not extra floor geometry or collision volumes.
        large=name=='race_shortcut'
        for side in (-1,1):
            extra.append(sphere('SignFastener',(.045,.025,.045),(side*(5.4 if large else .95),-.2,6 if large else 2.85),metal))
    if extra:objects=objects+[soft_join(extra,'CraftDetails')]
    return objects

def export_quality(objects,filename):
    objects=detail_prop(list(objects),filename)
    for material in bpy.data.materials:
        if not material.use_nodes:continue
        bsdf=material.node_tree.nodes.get('Principled BSDF')
        if not bsdf:continue
        lower=material.name.lower()
        if any(s in lower for s in ('metal','rim','bolt','silver')):
            bsdf.inputs['Metallic'].default_value=.42;bsdf.inputs['Roughness'].default_value=.36
        elif any(s in lower for s in ('glass','lens','water')):bsdf.inputs['Roughness'].default_value=.23
        elif any(s in lower for s in ('paint','coral','cream')):bsdf.inputs['Roughness'].default_value=.43
    for obj in objects:
        # Source-generated mesh: shade only, never subdivide or bevel course strips.
        if obj.type=='MESH' and not filename.startswith('course_'):smooth(obj)
    raw_export(objects,filename)

c.export=export_quality;of.export=export_quality

def variants():
    for style in ('box','round'):
        c.reset();m=of.materials('#216C79')
        p=[soft_box('HoodPanel',(1.42,1.88,1.0),(0,.95,1.3),m['paint'],.18)] if style=='box' else [sphere('HoodCapsule',(.74,1.05,.56),(0,.95,1.3),m['paint'])]
        for side in (-1,1):
            for y in (.55,.8,1.05,1.3):p.append(soft_box('SideVent',(.028,.045,.23),(side*.715,y,1.3),m['rubber'],.014))
        p.append(soft_box('TopPanel',(.065,1.3,.025),(0,.95,1.86 if style=='round' else 1.81),m['cream'],.012))
        obj=soft_join(p,'Hood');name='tatu_hood_'+style
        export_quality([obj],name+'.glb');c.save_blend(name)
    c.reset();m=of.materials('#216C79');p=[]
    for side in (-1,1):
        p.append(tube('CagePost',(side*.63,-.94,1.2),(side*.63,-.94,2.73),.07,m['cream']))
        p.append(sphere('CageCorner',(.085,.085,.085),(side*.63,-.94,2.73),m['cream']))
    p.append(tube('CageTop',(-.63,-.94,2.73),(.63,-.94,2.73),.07,m['cream']))
    obj=soft_join(p,'RoofCage');export_quality([obj],'tatu_roof_cage.glb');c.save_blend('tatu_roof_cage')
    c.reset();m=of.materials('#216C79');p=[]
    for z in (.65,.96):
        p.append(soft_box('CoralBumper',(1.65,.28,.18),(0,2.0,z),m['coral'],.08))
        for side in (-1,1):p.append(sphere('BumperBolt',(.055,.025,.055),(side*.62,2.15,z),m['cream']))
    for side in (-1,1):p.append(tube('BumperBrace',(side*.55,2,.65),(side*.55,2,.96),.045,m['metal']))
    obj=soft_join(p,'Bumper');export_quality([obj],'tatu_bumper_double.glb');c.save_blend('tatu_bumper_double')

def run(script,selected=()):
    previous=sys.argv;sys.argv=[script,'--',*selected]
    try:runpy.run_path(os.path.join(BASE,script),run_name='__main__')
    finally:sys.argv=previous

stages=STAGES or ['vehicles','parts','scenery','courses','signs']
for stage in stages:
    print('QUALITY GENERATION',stage,flush=True)
    if stage=='vehicles':
        os.environ.pop('SKIP_PORTRAITS',None)
        for build in (of.tatu,of.pingo,of.broto):build()
        run('adventure.py',('pipoca','bento'))
    elif stage=='parts':run('broto_parts.py');variants()
    elif stage=='scenery':
        run('props.py');run('props_extras.py');run('adventure.py',('race_barn','race_bridge','race_canyon','race_tunnel','race_stall','race_mill','race_shortcut'))
    elif stage=='courses':run('courses.py')
    elif stage=='signs':run('race_signs.py')
    else:raise ValueError('Unknown generation stage: '+stage)
print('QUALITY ASSETS SAVED',flush=True)
