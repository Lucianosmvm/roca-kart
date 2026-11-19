"""User-requested mesh orientation inspection/repair in headless Blender.
Only checks authored mesh faces; never runs the game, browser or game tests.
Use -- fix to re-export changed sources, or no argument for an inspection report.
"""
import os,sys,re,ast,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bpy
from common import MODELS,export,save_blend
from mesh_orientation import orient_object
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fix='fix' in sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else False
with open(os.path.join(ROOT,'js','main.js'),encoding='utf8') as file:
    names=ast.literal_eval(re.search(r'const ASSETS = (\[[\s\S]*?\]);',file.read()).group(1))
names+= [name+'_mobile' for name in list(names) if not name.startswith('course_')]
report={'scope':'User-authorized mesh orientation review, not game tests','repair':fix,'assets':[]}
for name in names:
    bpy.ops.wm.open_mainfile(filepath=os.path.join(MODELS,name+'.blend'))
    objects=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
    results=[orient_object(obj,fix=fix,course=name.startswith('course_')) for obj in objects]
    changed=sum(r['flipped_faces'] for r in results)
    if fix and changed:export(objects,name+'.glb');save_blend(name)
    remaining=sum(orient_object(obj,fix=False,course=name.startswith('course_'))['flipped_faces'] for obj in objects) if fix and changed else changed
    report['assets'].append({'name':name,'changed_faces':changed,'remaining_faces':remaining,'objects':results})
    print('MESH',name,'faces_to_reverse',changed,flush=True)
with open(os.path.join(ROOT,'docs','mesh-orientation-report.json'),'w',encoding='utf8') as file:json.dump(report,file,ensure_ascii=False,indent=2)
print('MESH ORIENTATION REVIEW SAVED',flush=True)
