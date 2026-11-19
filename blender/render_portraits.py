"""Render UI portraits from the saved source meshes, without regenerating geometry.
Headless asset production; never starts the game or executes game tests.
"""
import os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from common import MODELS
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
profiles={'tatu':((0,.05,1.35),6.8),'pingo':((0,0,1.6),7.4),'broto':((0,-1.85,.56),6.8),'pipoca':((0,.1,1.36),6.7),'bento':((0,0,1.3),7.0)}
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(profiles)
for name in selected:
    target,dist=profiles[name]
    bpy.ops.wm.open_mainfile(filepath=os.path.join(MODELS,name+'.blend'))
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.render.film_transparent=True
    sc.world=bpy.data.worlds.new('PortraitStudio');sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.82,.9,1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.7
    for pos,power,size in [((4,6,8),950,6),((-5,1,5),650,5)]:
        light=bpy.data.objects.new('Softbox',bpy.data.lights.new('Softbox','AREA'));sc.collection.objects.link(light)
        light.location=pos;light.data.energy=power;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(Vector(target)-light.location).to_track_quat('-Z','Y').to_euler()
    cam=bpy.data.objects.new('PortraitCamera',bpy.data.cameras.new('PortraitCamera'));sc.collection.objects.link(cam)
    cam.location=Vector(target)+Vector((.65,.95,.48)).normalized()*dist
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=dist*.68;sc.camera=cam
    sc.render.resolution_x=640;sc.render.resolution_y=640;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG';sc.view_settings.view_transform='Standard'
    sc.render.filepath=os.path.join(ROOT,'assets','ui',name+'.png')
    bpy.ops.render.render(write_still=True)
    print('PORTRAIT SAVED',name,flush=True)
