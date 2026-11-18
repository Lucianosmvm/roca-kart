"""Generate and SAVE reusable Broto parts, without opening a window or running tests.
Each assembly has the same hitch-relative coordinates as broto.glb.
Outputs: assets/broto_*.glb and blender/models/broto_*.blend.
Run: blender -b --factory-startup --python blender/broto_parts.py
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oficina import *

def save_part(objects, name):
    for o in objects:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active=o
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    export(objects, name+'.glb')
    save_blend(name)

def hoppers(style):
    reset(); m=materials('#216C79'); p=[]
    for x in (-.79, 0, .79):
        if style == 'seed':
            p.append(sphere('SeedHopper', (.37,.46,.63), (x,-2.32,1.01), m['straw']))
            p.append(cone('SeedTip', .31,.52, (x,-2.32,1.58), m['straw'],20))
            p.append(rounded('HopperBand', (.74,.91,.12), (x,-2.32,1.0), m['cream'],.05))
        elif style == 'barrel':
            p.append(cyl('Barrel', .35,.98, (x,-2.32,1.0), m['straw'],20,bevel=.055,seg=3))
            for z in (.64,1.35):
                p.append(cyl('BarrelRing',.37,.085,(x,-2.32,z),m['cream'],20,bevel=.025,seg=2))
            p.append(cyl('BarrelLid',.36,.08,(x,-2.32,1.52),m['coral'],20,bevel=.02,seg=2))
        else:
            p.append(rounded('Crate',(.71,.82,.83),(x,-2.32,.98),m['straw'],.045))
            for z in (.7,.96,1.22):
                p.append(rounded('CrateSlat',(.74,.055,.06),(x,-1.89,z),m['cream'],.015))
            for dx in (-.27,.27):
                p.append(rounded('CrateCorner',(.075,.87,.89),(x+dx,-2.32,.98),m['coral'],.025))
            p.append(rounded('CrateLid',(.77,.88,.09),(x,-2.32,1.43),m['cream'],.035))
    save_part([join(p,'Hoppers')], 'broto_hoppers_'+style)

def wheels(style):
    reset(); m=materials('#216C79')
    radius,width = {'small':(.54,.36),'wide':(.64,.7),'double':(.58,.3)}[style]
    p=[]
    for side,sign in [('L',-1),('R',1)]:
        p.append(wheel('Wheel'+side,(sign*1.48,-2.2,radius-.64),radius,width,m))
        if style == 'double':
            p.append(wheel('WheelEnd'+side,(sign*1.85,-2.2,radius-.64),radius,width,m))
    save_part(p,'broto_wheels_'+style)

# Re-export only Broto, now with a removable Hoppers assembly; keep its portrait.
os.environ['SKIP_PORTRAITS']='1'
broto()
for style in ('seed','barrel','crate'): hoppers(style)
for style in ('small','wide','double'): wheels(style)
