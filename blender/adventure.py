"""Original cartoon racers and drive-through landmarks. Saves every asset in .blend and .glb.
Headless asset production only: no game, browser or tests are launched.
"""
import os,sys,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from oficina import *

def pipoca():
    reset();m=materials('#E9C46A');p=[]
    p.append(rounded('HarvesterBelly',(1.65,2.25,1.05),(0,-.1,1.1),m['paint'],.3))
    p.append(sphere('RoundCab',(.72,.75,.64),(0,.1,2.03),m['cream']))
    p.append(rounded('CabCanopy',(1.65,1.6,.17),(0,-.05,2.65),m['coral']))
    p.append(rounded('Collector',(2.1,.55,.46),(0,1.45,.65),m['teal'],.15))
    for x in (-.8,-.4,0,.4,.8):
        p.append(cone('CollectorTooth',.12,.45,(x,1.74,.62),m['straw'],8,rot=(math.pi/2,0,0)))
    p.append(cyl('HarvestBin',.63,.65,(0,-.65,1.91),m['paint'],20,bevel=.1,seg=3))
    p.append(rod('GrainSpout',(.65,-.4,1.95),(1.0,-.9,2.65),.12,m['teal']))
    face(p,.84,2.02,.35,m)
    wheels=[wheel('Wheel'+s,(x,y,r),r,w,m) for s,x,y,r,w in [('FL',-.92,.85,.67,.47),('FR',.92,.85,.67,.47),('RL',-.8,-.92,.54,.4),('RR',.8,-.92,.54,.4)]]
    finish(p,wheels,'pipoca',(0,.1,1.36),6.7)

def bento():
    reset();m=materials('#7895C2');p=[]
    p.append(rounded('TruckFrame',(1.35,3.5,.32),(0,0,.73),m['teal']))
    p.append(rounded('PlumpCab',(1.7,1.45,1.45),(0,1.0,1.6),m['paint'],.32))
    p.append(rounded('CreamRoof',(1.85,1.6,.2),(0,1,2.42),m['cream']))
    p.append(rounded('CoralBumper',(1.88,.25,.27),(0,1.87,.67),m['coral']))
    p.append(rounded('LoadBed',(1.85,1.8,.2),(0,-.9,1.0),m['cream']))
    for x in (-.91,.91):
        p.append(rounded('BedSide',(.12,1.9,.95),(x,-.9,1.5),m['paint'],.05))
        for y in (-1.6,-.9,-.2):p.append(rounded('SideSlat',(.16,.1,.96),(x,y,1.51),m['cream'],.02))
    p.append(rounded('Tailgate',(1.85,.12,.95),(0,-1.82,1.5),m['paint'],.06))
    for x in (-.5,0,.5):p.append(sphere('CornLoad',(.34,.72,.3),(x,-.9,1.88),m['straw']))
    face(p,1.78,1.77,.44,m)
    wheels=[wheel('Wheel'+s,(x,y,.65),.65,.48,m) for s,x,y in [('FL',-.98,1.0),('FR',.98,1.0),('RL',-.98,-1.15),('RR',.98,-1.15)]]
    finish(p,wheels,'bento',(0,0,1.3),7.0)

def save_prop(objects,name):
    o=join(objects,name)
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    export([o],name+'.glb');save_blend(name)

def landmark(name):
    reset();m=materials('#216C79');wood=mat('Wood','#A9794E');dark=mat('DarkWood','#765038');p=[]
    if name=='race_barn':
        for x in (-12,12):
            p.append(rounded('BarnWall',(.45,30,10),(x,0,5),m['coral']))
            for y in (-14,0,14):p.append(rounded('BarnPost',(.65,.65,11),(x,y,5.5),m['cream']))
        for y in (-14,14):
            p.append(rod('RoofBeam',(-12,y,10),(0,y,15),.32,dark));p.append(rod('RoofBeam',(0,y,15),(12,y,10),.32,dark))
        for x in (-6,6):p.append(rounded('Roof',(13.3,31,.3),(x,0,12.5),wood,.1))
        p[-2].rotation_euler.y=-.39;p[-1].rotation_euler.y=.39
    elif name=='race_bridge':
        p.append(rounded('BridgeDeck',(22,34,.2),(0,0,-.2),wood))
        for y in range(-16,17,2):p.append(rounded('DeckSlat',(22,.08,.04),(0,y,-.07),dark,.01))
        for x in (-10.3,10.3):
            for z in (1,2):p.append(rounded('Rail',(.18,34,.2),(x,0,z),m['cream']))
            for y in range(-16,17,4):p.append(rounded('Post',(.35,.35,2.5),(x,y,1.1),wood))
            for y in (-12,12):p.append(rounded('BridgeLeg',(.7,.7,16),(x,y,-8.2),dark))
    elif name in ('race_canyon','race_tunnel'):
        rock=mat('Terracotta','#B76545');light=mat('RockLight','#DB9870')
        for side in (-1,1):
            for y in (-13,-5,4,13):
                p.append(ico('Rock',1,(side*12.5,y,4.0),rock,2,scale=(3.5,6,6)))
                p.append(ico('RockCap',1,(side*13,y+1,9.5),light,1,scale=(3.2,5,2.2)))
        if name=='race_tunnel':p.append(rounded('RockArch',(29,28,3.5),(0,0,11.5),rock,.9))
    elif name=='race_stall':
        p.append(rounded('Counter',(5.4,3,1.6),(0,0,.8),wood))
        for x in (-2.6,2.6):p.append(rod('Post',(x,1.2,0),(x,1.2,4.5),.12,m['cream']))
        for i in range(6):p.append(rounded('CanopyStripe',(.9,4,.14),(-2.25+i*.9,0,4.2),m['coral'] if i%2 else m['cream']))
        p.append(rod('PennantCord',(-2.6,-2.03,3.97),(2.6,-2.03,3.97),.025,dark))
        for i in range(7):p.append(cone('Pennant',.22,.5,(-2.3+i*.76,-2.03,3.72),m['straw'] if i%2 else m['coral'],3,rot=(math.pi,0,0)))
        for x in (-1.7,0,1.7):
            p.append(rounded('FruitCrate',(1.3,1.9,.35),(x,0,1.8),dark,.04))
            for y in (-.5,.1,.6):p.append(sphere('Fruit',(.24,.24,.25),(x,y,2.1),m['straw']))
    elif name=='race_mill':
        p.append(cyl('MillBody',4,14,(0,0,7),m['cream'],12,r2=2.4))
        p.append(cone('Roof',4.3,4,(0,0,16),m['coral'],12))
        for angle in (0,math.pi/2,math.pi,math.pi*1.5):
            o=rounded('Sail',(1.4,.3,8),(math.sin(angle)*4,-3.2,10+math.cos(angle)*4),wood);o.rotation_euler.y=angle;p.append(o)
    else:
        for x in (-6,6):p.append(rod('SignPost',(x,0,0),(x,0,6.3),.12,wood))
        p.append(rounded('ShortcutSign',(12.5,.3,1.2),(0,0,6),m['teal']))
        bpy.ops.object.text_add(location=(0,-.2,5.7),rotation=(math.pi/2,0,0))
        text=bpy.context.object;text.data.body='ATALHO';text.data.align_x='CENTER';text.data.size=.8;text.data.extrude=.01
        bpy.ops.object.convert(target='MESH');text=bpy.context.object;text.data.materials.append(m['cream']);p.append(text)
    save_prop(p,name)

selected=set(sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else set()
for build in (tatu,pingo,pipoca,bento):
    if not selected or build.__name__ in selected:build()
for name in ('race_barn','race_bridge','race_canyon','race_tunnel','race_stall','race_mill','race_shortcut'):
    if not selected or name in selected:landmark(name)
