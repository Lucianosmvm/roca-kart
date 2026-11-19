"""Authoritative elevated courses and shortcuts. Generates reusable .blend/.glb meshes
and the navigation samples consumed by the game. This is asset generation, not a test.
Run headless: blender -b --factory-startup --python blender/courses.py
"""
import sys, os, json, math, bisect
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from common import *

def catmull(points,t):
    n=len(points); f=t*n; i=int(f)%n; u=f-int(f)
    p0,p1,p2,p3=[Vector((*points[(i+k)%n],)) for k in (-1,0,1,2)]
    # Centripetal Catmull-Rom, stable across tight corners and uneven control spacing.
    d0=max((p1-p0).length**.5,.001); d1=max((p2-p1).length**.5,.001); d2=max((p3-p2).length**.5,.001)
    m1=((p1-p0)/d0-(p2-p0)/(d0+d1)+(p2-p1)/d1)*d1
    m2=((p2-p1)/d1-(p3-p1)/(d1+d2)+(p3-p2)/d2)*d1
    return (2*u**3-3*u*u+1)*p1+(u**3-2*u*u+u)*m1+(-2*u**3+3*u*u)*p2+(u**3-u*u)*m2

def envelope(t,sections):
    return sum(value*math.sin(math.pi*(t-a)/(b-a))**2 for a,b,value in sections if a<t<b)

SURFACE_LIFT=.04

def lateral(samples,i,closed):
    count=len(samples)
    before=samples[(i-1)%count] if closed else samples[max(0,i-1)]
    after=samples[(i+1)%count] if closed else samples[min(count-1,i+1)]
    dx,dz=after[0]-before[0],after[2]-before[2]
    length=max(.001,math.hypot(dx,dz))
    return dz/length,-dx/length

def ribbon_mesh(name,samples,lat0,lat1,material,closed=True,heights=None):
    """Adjacent strips share their boundary; no full-width layer under the road."""
    verts=[]; faces=[]; count=len(samples)
    for i,p in enumerate(samples):
        lx,lz=lateral(samples,i,closed);bank=p[3]
        for column,offset in enumerate((lat0,lat1)):
            height=heights(p,offset,column) if heights else p[1]+math.tan(bank)*offset+SURFACE_LIFT
            # Blender coordinates: X, -game-Z, game-Y. glTF export restores the game axes.
            verts.append((p[0]+lx*offset,-p[2]-lz*offset,height))
    for i in range(count if closed else count-1):
        j=(i+1)%count;faces.append((i*2,j*2,j*2+1,i*2+1))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material)
    return o

def embankment(samples,material,closed=True,inner=10.4,outer=18,name='EarthSlopes'):
    objects=[]
    for side in (-1,1):
        a,b=sorted((side*inner,side*outer))
        def height(p,offset,column):
            u=(abs(offset)-inner)/(outer-inner)
            return (p[1]+math.tan(p[3])*side*inner)*(1-u)+SURFACE_LIFT
        objects.append(ribbon_mesh(name,samples,a,b,material,closed,height))
    return objects

with open(os.path.join(os.path.dirname(__file__),'course_designs.json'),encoding='utf8') as f: designs=json.load(f)
requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
layout_path=os.path.join(OUT,'course-layouts.json')
layouts={}
if requested:
    with open(layout_path,encoding='utf8') as f: layouts=json.load(f)
for name,d in designs.items():
    if requested and name not in requested: continue
    reset(); control=d['ctrl']
    dense=[catmull(control,i/2400) for i in range(2401)]
    lengths=[0]
    for a,b in zip(dense,dense[1:]):lengths.append(lengths[-1]+(b-a).length)
    samples=[]
    for i in range(2000):
        distance=lengths[-1]*i/2000;j=max(1,bisect.bisect_left(lengths,distance));u=(distance-lengths[j-1])/max(.001,lengths[j]-lengths[j-1]);p=dense[j-1].lerp(dense[j],u)
        t=i/2000;bank=round(math.radians(envelope(t,d.get('banks',[]))),5)
        # Banking on flat sections must not push the low shoulder below the terrain.
        height=max(envelope(t,d.get('hills',[])),abs(math.tan(bank))*10.4)
        samples.append([round(p.x,4),round(height,4),round(p.y,4),bank])
    road=mat('CourseRoad',d['color']);edge=mat('CourseEdge',d['edge']);earth=mat('CourseEmbankment','#91623F')
    # Shared samples/tangents keep road, edge, shoulder and slopes joined exactly.
    objects=[ribbon_mesh('Road',samples,-8,8,road),
             ribbon_mesh('EdgeLeft',samples,-8.7,-8,edge),
             ribbon_mesh('EdgeRight',samples,8,8.7,edge),
             ribbon_mesh('ShoulderLeft',samples,-10.4,-8.7,earth),
             ribbon_mesh('ShoulderRight',samples,8.7,10.4,earth)]
    objects.extend(embankment(samples,earth))
    branches=[]
    for branch in d.get('branches',[]):
        a=samples[int(branch['start']*2000)];b=samples[int(branch['end']*2000)];dx,dz=b[0]-a[0],b[2]-a[2];l=max(1,math.hypot(dx,dz));mid=[(a[0]+b[0])/2+dz/l*branch['bend'],(a[2]+b[2])/2-dx/l*branch['bend']]
        route=[]
        for j in range(101):
            u=j/100;route.append([round((1-u)**2*a[0]+2*(1-u)*u*mid[0]+u*u*b[0],4),round(a[1]*(1-u)+b[1]*u+math.sin(math.pi*u)**2*branch['crest']+.04,4),round((1-u)**2*a[2]+2*(1-u)*u*mid[1]+u*u*b[2],4),0])
        objects.append(ribbon_mesh('Shortcut',route,-branch['width'],branch['width'],road,False))
        objects.extend(embankment(route,earth,False,branch['width'],branch['width']+8,'ShortcutSlopes'))
        branches.append({**branch,'samples':route})
    export(objects,'course_'+name+'.glb');save_blend('course_'+name)
    layouts[name]={'samples':samples,'branches':branches,'features':d['features'],'length':lengths[-1]}
with open(layout_path,'w',encoding='utf8') as f:json.dump(layouts,f,separators=(',',':'))
print('SAVED courses and navigation data')
