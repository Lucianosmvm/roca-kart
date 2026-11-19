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

def ribbon_mesh(name,samples,width,material,closed=True):
    verts=[]; faces=[]; count=len(samples)
    for i,p in enumerate(samples):
        before=samples[(i-1)%count] if closed else samples[max(0,i-1)]
        after=samples[(i+1)%count] if closed else samples[min(count-1,i+1)]
        dx,dz=after[0]-before[0],after[2]-before[2]; length=max(.001,math.hypot(dx,dz))
        lx,lz=dz/length,-dx/length; bank=p[3] if len(p)>3 else 0
        for side in (-1,1):
            offset=width*side
            # Blender coordinates: X, -game-Z, game-Y. glTF export restores the game axes.
            verts.append((p[0]+lx*offset,-p[2]-lz*offset,p[1]+math.tan(bank)*offset+.04))
    for i in range(count if closed else count-1):
        j=(i+1)%count;faces.append((i*2,j*2,j*2+1,i*2+1))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material)
    return o

def embankment(samples,material,closed=True,inner=10.4,outer=18):
    verts=[];faces=[];n=len(samples)
    for side in (-1,1):
        start=len(verts)
        for i,p in enumerate(samples):
            q=samples[(i+1)%n] if closed else samples[min(n-1,i+1)]
            if i==n-1 and not closed:q=samples[i-1]
            dx,dz=q[0]-p[0],q[2]-p[2];length=max(.001,math.hypot(dx,dz));lx,lz=dz/length,-dx/length
            for off,height in ((inner,p[1]+math.tan(p[3])*side*inner),(outer,0)):
                verts.append((p[0]+lx*off*side,-p[2]-lz*off*side,max(0,height)))
        for i in range(n if closed else n-1):
            j=(i+1)%n;face=(start+i*2,start+j*2,start+j*2+1,start+i*2+1)
            faces.append(face if side==1 else tuple(reversed(face)))
    mesh=bpy.data.meshes.new('EarthSlopes');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('EarthSlopes',mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material)
    return o

with open(os.path.join(os.path.dirname(__file__),'course_designs.json'),encoding='utf8') as f: designs=json.load(f)
layouts={}
for name,d in designs.items():
    reset(); control=d['ctrl']
    dense=[catmull(control,i/2400) for i in range(2401)]
    lengths=[0]
    for a,b in zip(dense,dense[1:]):lengths.append(lengths[-1]+(b-a).length)
    samples=[]
    for i in range(2000):
        distance=lengths[-1]*i/2000;j=max(1,bisect.bisect_left(lengths,distance));u=(distance-lengths[j-1])/max(.001,lengths[j]-lengths[j-1]);p=dense[j-1].lerp(dense[j],u)
        t=i/2000;samples.append([round(p.x,4),round(envelope(t,d.get('hills',[])),4),round(p.y,4),round(math.radians(envelope(t,d.get('banks',[]))),5)])
    road=mat('CourseRoad',d['color']);edge=mat('CourseEdge',d['edge']);earth=mat('CourseEmbankment','#91623F')
    objects=[ribbon_mesh('Embankment',[[p[0],max(0,p[1]-.14),p[2],p[3]] for p in samples[::4]],10.4,earth),embankment(samples[::4],earth),ribbon_mesh('Road',samples[::2],8.0,road)]
    # Thin colored edge ribbons, lifted a little to avoid z fighting.
    for side in (-1,1):
        shifted=[]
        for i,p in enumerate(samples[::2]):
            q=samples[((i*2)+2)%2000];dx,dz=q[0]-p[0],q[2]-p[2];l=max(.001,math.hypot(dx,dz));off=side*8.35
            shifted.append([p[0]+dz/l*off,p[1]+.035+math.tan(p[3])*off,p[2]-dx/l*off,0])
        objects.append(ribbon_mesh('Edge',shifted,.34,edge))
    branches=[]
    for branch in d.get('branches',[]):
        a=samples[int(branch['start']*2000)];b=samples[int(branch['end']*2000)];dx,dz=b[0]-a[0],b[2]-a[2];l=max(1,math.hypot(dx,dz));mid=[(a[0]+b[0])/2+dz/l*branch['bend'],(a[2]+b[2])/2-dx/l*branch['bend']]
        route=[]
        for j in range(101):
            u=j/100;route.append([round((1-u)**2*a[0]+2*(1-u)*u*mid[0]+u*u*b[0],4),round(a[1]*(1-u)+b[1]*u+math.sin(math.pi*u)**2*branch['crest']+.04,4),round((1-u)**2*a[2]+2*(1-u)*u*mid[1]+u*u*b[2],4),0])
        objects.append(ribbon_mesh('Shortcut',route,branch['width'],road,False))
        objects.append(embankment(route,earth,False,branch['width'],branch['width']+8))
        branches.append({**branch,'samples':route})
    export(objects,'course_'+name+'.glb');save_blend('course_'+name)
    layouts[name]={'samples':samples,'branches':branches,'features':d['features'],'length':lengths[-1]}
with open(os.path.join(OUT,'course-layouts.json'),'w',encoding='utf8') as f:json.dump(layouts,f,separators=(',',':'))
print('SAVED courses and navigation data')
