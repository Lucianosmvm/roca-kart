"""Generate light game assets from editable detailed sources; never runs game/tests.
Each source stays intact. Save *_mobile.blend and assets/*_mobile.glb, preserving
object names, pivots and materials. Driving surfaces retain their original topology.
"""
import os,sys,re,ast,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bpy
from common import export,save_blend,MODELS
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT,'js','main.js'),encoding='utf8') as file:
    names=ast.literal_eval(re.search(r'const ASSETS = (\[[\s\S]*?\]);',file.read()).group(1))
plants={'corn','wheat','soy','sunflower','bush'}
vehicles={'tatu','pingo','pipoca','bento'}
for name in names:
    if name.startswith('course_'):continue
    bpy.ops.wm.open_mainfile(filepath=os.path.join(MODELS,name+'.blend'))
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    triangles={obj:sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in objects}
    target=16000 if name in vehicles else 9000 if name=='broto' else 400 if name in plants else 1200 if name in {'tree','pine','cerrado_tree'} else 7000 if name=='garage' else 4500 if name.startswith(('race_','broto_wheels')) else 2500
    # Reserve the face silhouette and tiny meshes before distributing the budget.
    reducible=[obj for obj in objects if len(obj.data.polygons)>40 and obj.name!='Eyes']
    reserved=sum(count for obj,count in triangles.items() if obj not in reducible)
    ratio=min(1,(target-reserved)/max(1,sum(triangles[obj] for obj in reducible)))
    for obj in objects:
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        if ratio<1 and obj in reducible:
            mod=obj.modifiers.new('MobileGeometry','DECIMATE');mod.ratio=max(.08,ratio)
            mod.use_collapse_triangulate=True
            bpy.ops.object.modifier_apply(modifier=mod.name)
        # Exact source transforms/pivots remain in place for assembly and animation.
    export(objects,name+'_mobile.glb');save_blend(name+'_mobile')
print('MOBILE ASSETS SAVED',flush=True)
