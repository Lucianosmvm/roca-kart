"""Cartoon character version of the Stara ABSOLUTA planter (towed implement, no engine).

Chibi proportions from Assembly/Seeder/Absolutas/Abs27.blend: row of orange/yellow seed
hoppers with green lids on a green frame, long drawbar, small tandem wheels, row units.
The face is on the REAR of the hoppers (sticking its tongue out at whoever is behind) so it
reads from the chase camera.

Origin = hitch ring (0,0,0); implement extends towards -Y. Ground at z = -HITCH_Z.
Exports assets/absoluta.glb with nodes Body + Wheel* (origin at hub).

Run: blender -b --factory-startup --python blender/absoluta_char.py
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from common import *

reset()

HZ = 0.62  # hitch height above ground; everything below is built relative to ground z=-HZ
G = -HZ

FRAME = mat("Frame", "#1F8A4C", 0.45)
HOPPER = mat("Hopper", "#F7A21B", 0.4)
LID = mat("Lid", "#17703D", 0.4)
BLACK = mat("Black", "#232428", 0.75)
DARK = mat("DarkMetal", "#3D3F46", 0.5)
WHITE = mat("White", "#FFFFFF", 0.4)
PAINT = mat("Paint", "#F5821F", 0.4)
EYE_W = mat("EyeWhite", "#FFFFFF", 0.2)
IRIS = mat("Iris", "#3BA55C", 0.2)
PUPIL = mat("Pupil", "#120A05", 0.1)
BROW = mat("Brow", "#2B2B30", 0.6)
MOUTH = mat("Mouth", "#4A1414", 0.6)
TONGUE = mat("Tongue", "#F0727F", 0.5)
SEED = mat("Seed", "#F2D16B", 0.6)
SPROUT = mat("Sprout", "#6CC23A", 0.5)

FY = -2.25          # frame centre line (y)
FZ = G + 1.0        # frame height
parts = []
P = parts.append


def beam(name, p1, p2, t, m):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    o = box(name, (t, t, d.length), (0, 0, 0), m, 0.0)
    o.data.transform(Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4())
    o.location = (p1 + p2) / 2
    bpy.context.view_layer.update()
    return o


def join_smooth(objs, name):
    o = join(objs, name)
    for p in o.data.polygons:
        p.use_smooth = True
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception as e:
        print("smooth-by-angle unavailable:", e)
    return o


# ---------------- drawbar (A-frame) + hitch ring ----------------
P(cyl("hitchRing", 0.12, 0.06, (0, 0.02, 0), BLACK, 14))
P(box("hitchTongue", (0.16, 0.5, 0.12), (0, -0.22, 0), DARK, 0.03, 2))
for sx in (-1, 1):
    P(beam("drawbar", (0, -0.4, 0), (sx * 0.9, FY + 0.35, FZ - 0.05), 0.16, FRAME))
P(beam("drawbarCentre", (0, -0.4, 0), (0, FY + 0.35, FZ - 0.05), 0.14, FRAME))
P(box("jack", (0.08, 0.08, 0.3), (0.18, -0.55, G + 0.62), DARK, 0.0))  # raised while towing

# ---------------- main frame ----------------
P(box("toolbar", (3.7, 0.22, 0.22), (0, FY + 0.35, FZ), FRAME, 0.05, 2))
P(box("rearBar", (3.7, 0.18, 0.18), (0, FY - 0.55, FZ + 0.05), FRAME, 0.05, 2))
for x in (-1.6, -0.55, 0.55, 1.6):
    P(beam("hopperLeg", (x, FY + 0.35, FZ), (x, FY - 0.1, FZ + 0.35), 0.1, FRAME))
    P(beam("hopperLeg2", (x, FY - 0.55, FZ), (x, FY - 0.3, FZ + 0.35), 0.1, FRAME))

# ---------------- seed hoppers (orange/yellow, green lids) ----------------
HX = (-1.38, -0.46, 0.46, 1.38)
for i, x in enumerate(HX):
    P(box("hopper", (0.84, 0.95, 0.72), (x, FY - 0.2, FZ + 0.72), HOPPER, 0.14, 3))
    P(box("hopperFunnel", (0.5, 0.55, 0.3), (x, FY - 0.2, FZ + 0.26), HOPPER, 0.08, 2))
    P(box("lid", (0.9, 1.0, 0.14), (x, FY - 0.2, FZ + 1.12), LID, 0.06, 2))
    P(box("lidHandle", (0.3, 0.06, 0.06), (x, FY + 0.31, FZ + 1.1), DARK, 0.02, 1))
    P(box("label", (0.6, 0.02, 0.18), (x, FY + 0.27, FZ + 0.8), LID, 0.02, 1))
# walkway rail on top (like the real machine)
for x in (-1.75, 1.75):
    P(beam("railPost", (x, FY - 0.7, FZ + 0.1), (x, FY - 0.7, FZ + 1.4), 0.05, FRAME))
P(beam("rail", (-1.75, FY - 0.7, FZ + 1.4), (1.75, FY - 0.7, FZ + 1.4), 0.05, FRAME))

# text badge on the front of the hoppers (facing the tractor)
bpy.ops.object.text_add(location=(0, FY + 0.29, FZ + 0.55), rotation=(math.pi / 2, 0, math.pi))
t = bpy.context.active_object
t.data.body = "ABSOLUTA"; t.data.size = 0.2; t.data.extrude = 0.006; t.data.align_x = "CENTER"
f = r"C:\Windows\Fonts\arialbd.ttf"
if os.path.exists(f):
    t.data.font = bpy.data.fonts.load(f, check_existing=True)
bpy.ops.object.convert(target="MESH")
t = bpy.context.active_object; t.data.materials.clear(); t.data.materials.append(WHITE)
P(t)

# ---------------- row units (discs) ----------------
for x in (-1.6, -0.95, -0.32, 0.32, 0.95, 1.6):
    P(beam("unitArm", (x, FY + 0.35, FZ - 0.05), (x, FY - 0.15, G + 0.35), 0.07, FRAME))
    P(cyl("disc", 0.22, 0.04, (x, FY - 0.2, G + 0.24), DARK, 14, rot=(0, math.pi / 2, 0)))
    P(cyl("press", 0.12, 0.08, (x, FY - 0.5, G + 0.13), BLACK, 10, rot=(0, math.pi / 2, 0)))
    P(beam("pressArm", (x, FY - 0.2, G + 0.3), (x, FY - 0.5, G + 0.15), 0.04, DARK))

# ---------------- face on the REAR of the hopper row ----------------
RY = FY - 0.68  # rear face plane of the hoppers
for sx in (-1, 1):
    ex, ez = sx * 0.46, FZ + 0.82
    P(uvs("eyeWhite", 0.27, (ex, RY, ez), EYE_W, 24, 12, scale=(1.0, 0.36, 1.15)))
    P(uvs("iris", 0.17, (ex + sx * 0.03, RY - 0.07, ez - 0.03), IRIS, 20, 10, scale=(1, 0.3, 1.1)))
    P(uvs("pupil", 0.1, (ex + sx * 0.03, RY - 0.11, ez - 0.04), PUPIL, 16, 8, scale=(1, 0.3, 1.1)))
    P(uvs("shine", 0.045, (ex - 0.03, RY - 0.14, ez + 0.05), EYE_W, 10, 6, scale=(1, 0.4, 1)))
    b = arch("brow", (0, 0, 0), 0.28, 0.35, 0.06, BROW, 0.6, math.pi - 0.6, 10)
    b.location = (ex, RY - 0.03, ez + 0.08)
    b.rotation_euler = (0, sx * 0.3, math.pi / 2)  # mischievous tilt
    P(b)
# cheeky grin + tongue sticking out (on the rear bar, under the eyes)
bm = bmesh.new(); n = 16; w, h, d = 0.42, 0.2, 0.04
front, back = [], []
for i in range(n + 1):
    a = math.pi + math.pi * i / n
    x, z = math.cos(a) * w, math.sin(a) * h + 0.05 * (math.cos(a) ** 4)
    front.append(bm.verts.new((x, -d, z))); back.append(bm.verts.new((x, d, z)))
bm.faces.new(front); bm.faces.new(back[::-1])
for i in range(n):
    bm.faces.new((front[i + 1], front[i], back[i], back[i + 1]))
bm.faces.new((front[-1], back[-1], back[0], front[0]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("mouth"); bm.to_mesh(me); bm.free()
mo = bpy.data.objects.new("mouth", me); bpy.context.collection.objects.link(mo)
me.materials.append(MOUTH); mo.location = (0.05, RY - 0.02, FZ + 0.45)
P(mo)
P(uvs("tongueOut", 0.14, (0.15, RY - 0.12, FZ + 0.28), TONGUE, 14, 8, scale=(1.0, 0.7, 1.5)))

# seeds sprinkling from a little chute (decoration)
for k in range(5):
    P(ico("seed", 0.035, (-1.6 + k * 0.8, FY - 0.25, G + 0.08), SEED, 1))
    P(cone("sprout", 0.05, 0.14, (-1.3 + k * 0.65, FY - 0.95, G + 0.07), SPROUT, 5))


# ---------------- wheels ----------------
def wheel(name, r, w):
    objs = [cyl(name, r * 0.84, w, (0, 0, 0), BLACK, 24, rot=(0, math.pi / 2, 0), bevel=0.06, seg=3)]
    for k in range(12):
        a = 2 * math.pi * k / 12
        objs.append(box("lug", (w * 0.9, r * 0.14, r * 0.14), (0, r * 0.86 * math.cos(a), r * 0.86 * math.sin(a)), BLACK, 0.0, rot=(a, 0, 0)))
    for sx in (-1, 1):
        objs.append(cyl("rim", r * 0.55, 0.04, (sx * w * 0.46, 0, 0), HOPPER, 18, rot=(0, math.pi / 2, 0)))
        objs.append(cyl("hub", r * 0.22, 0.08, (sx * w * 0.48, 0, 0), DARK, 10, rot=(0, math.pi / 2, 0)))
    return join_smooth(objs, name)


wheels = []
for nm, x, r, w, y in (("WheelL", -0.75, 0.42, 0.3, FY + 0.05), ("WheelR", 0.75, 0.42, 0.3, FY + 0.05),
                       ("WheelEndL", -1.95, 0.3, 0.2, FY - 0.15), ("WheelEndR", 1.95, 0.3, 0.2, FY - 0.15)):
    wo = wheel(nm, r, w)
    wo.location = (x, y, G + r)
    wheels.append(wo)
    # fork from the frame to the hub
    fx = x - math.copysign(w / 2 + 0.07, x)  # fork on the inner side of the wheel
    P(beam("fork", (fx, FY + 0.35, FZ), (fx, y, G + r), 0.08, FRAME))
    P(cyl("axle", 0.05, w / 2 + 0.1, ((x + fx) / 2, y, G + r), DARK, 8, rot=(0, math.pi / 2, 0)))

body = join_smooth(parts, "Body")
allobjs = [body] + wheels
print("ABSOLUTA polys:", polycount(allobjs))
export(allobjs, "absoluta.glb")
save_blend("absoluta")

prev = os.environ.get("PREVIEW_DIR")
if prev:
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    wd = bpy.data.worlds.new("w"); sc.world = wd
    wd.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.78, 0.95, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5; sun.rotation_euler = (0.7, 0.2, 2.4); sc.collection.objects.link(sun)
    sc.cursor.location = (0, 0, 0)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, G))
    bpy.context.active_object.data.materials.append(mat("Floor", "#9CC9E8", 0.9))
    sc.view_settings.view_transform = "Standard"
    cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam")); cam.data.lens = 55
    sc.collection.objects.link(cam)
    for fn, azim, elev, dist in (("abs_a.png", -2.2, 0.25, 9), ("abs_b.png", -math.pi / 2, 0.12, 8), ("abs_c.png", 0.8, 0.3, 9)):
        tg = Vector((0, FY, G + 1.0))
        cam.location = tg + Vector((math.cos(azim) * math.cos(elev), math.sin(azim) * math.cos(elev), math.sin(elev))) * dist
        cam.rotation_euler = (tg - cam.location).to_track_quat("-Z", "Y").to_euler()
        sc.camera = cam
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        sc.render.filepath = os.path.join(prev, fn)
        bpy.ops.render.render(write_still=True)
