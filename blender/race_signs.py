"""Original course signage. Headless asset generation only; no game or tests.
Save reusable editable sources and GLB exports with the same asset names.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from oficina import *

def glyph(points, material):
    mesh=bpy.data.meshes.new('SymbolMesh')
    mesh.from_pydata([(x,-.18,z) for x,z in points],[],[list(range(len(points)))])
    mesh.update()
    obj=bpy.data.objects.new('RaisedSymbol',mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    solid=obj.modifiers.new('SymbolDepth','SOLIDIFY');solid.thickness=.035
    return obj

def label(text,material):
    bpy.ops.object.text_add(location=(0,-.19,2.18),rotation=(math.pi/2,0,0))
    obj=bpy.context.object;obj.data.body=text;obj.data.align_x='CENTER';obj.data.size=.31;obj.data.extrude=.008
    obj.data.materials.append(material)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object

def build(name):
    reset();m=materials('#216C79');p=[]
    if name=='race_edge_marker':
        p.append(rounded('MarkerBase',(.2,.2,1.45),(0,0,.725),m['teal'],.04))
        p.append(rounded('CreamBand',(.23,.23,.36),(0,0,1.15),m['cream'],.04))
        p.append(rounded('CoralCap',(.26,.26,.22),(0,0,1.48),m['coral'],.05))
    else:
        p.append(rod('SignPost',(0,0,0),(0,0,2.4),.09,m['teal']))
        p.append(rounded('SignFrame',(2.35,.26,1.55),(0,0,2.85),m['teal'],.18))
        p.append(rounded('SignFace',(2.18,.06,1.38),(0,-.14,2.85),m['straw'] if 'curve' in name else m['cream'],.14))
        if 'curve' in name:
            side=-1 if name.endswith('left') else 1
            arrow=[(-.8,2.85),(-.1,3.35),(-.1,3.06),(.75,3.06),(.75,2.64),(-.1,2.64),(-.1,2.35)]
            p.append(glyph([(x*(-side),z) for x,z in arrow],m['teal']))
        elif name=='race_sign_jump':
            p.append(glyph([(-.8,2.65),(.45,3.23),(.45,2.65)],m['teal']))
            p.append(rod('JumpTrail',(.5,-.19,3.28),(.88,-.19,3.48),.045,m['coral']))
            p.append(label('SALTO',m['teal']))
        else:
            p.append(glyph([(-.75,2.8),(.15,3.13),(.05,3.38),(.85,3.23),(.37,2.6),(.28,2.85),(-.65,2.5)],m['teal']))
            p.append(label('ATALHO',m['teal']))
    obj=join(p,name);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    export([obj],name+'.glb');save_blend(name)

for name in ('race_curve_left','race_curve_right','race_sign_jump','race_sign_route','race_edge_marker'):
    build(name)
