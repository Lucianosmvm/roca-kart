"""Cartoon character version of the Stara IMPERADOR self-propelled sprayer.

Proportions compressed (chibi) from Assembly/Sprayer/Imperador/Imp2000.blend:
tall green chassis on 4 thin tall wheels, orange cab up front, tank in the middle,
green truss booms folded along the sides. Personality: proud 'emperor' -> crown + mustache.

Forward = +Y, ground z = 0. Exports assets/imperador.glb with nodes:
Body, Beacon, WheelFL/FR/RL/RR (origin at hub), BoomL/BoomR (pivot at the front mount).

Run: blender -b --factory-startup --python blender/imperador_char.py
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from common import *
from common import _finish

reset()

PAINT = mat("Paint", "#F5821F", 0.4)
FRAME = mat("Frame", "#1F8A4C", 0.45)
BLACK = mat("Black", "#232428", 0.75)
DARK = mat("DarkMetal", "#3D3F46", 0.5)
GLASS = mat("GlassDark", "#46505E", 0.12)
GREY = mat("BoomGrey", "#A9B0B9", 0.4)
WHITE = mat("White", "#FFFFFF", 0.4)
LAMP = mat("Headlight", "#FFF4D6", 0.2, emission=2.0)
RED = mat("TailLight", "#FF3B30", 0.3, emission=1.5)
GOLD = mat("Gold", "#FFC83D", 0.25, emission=0.25)
GEM = mat("Gem", "#E0245E", 0.2, emission=0.4)
EYE_W = mat("EyeWhite", "#FFFFFF", 0.2)
IRIS = mat("Iris", "#2F7DD1", 0.2)
PUPIL = mat("Pupil", "#120A05", 0.1)
BROW = mat("Brow", "#2B2B30", 0.6)
MOUTH = mat("Mouth", "#4A1414", 0.6)
TONGUE = mat("Tongue", "#F0727F", 0.5)
MUST = mat("Mustache", "#2B2B30", 0.6)

WX, WFY, WRY, WZ, WR, WW = 1.25, 1.25, -1.95, 0.8, 0.8, 0.36

parts = []
P = parts.append


def rounded(name, size, loc, m, r=0.1, seg=3, rot=(0, 0, 0)):
    return box(name, size, loc, m, r, seg, rot)


def beam(name, p1, p2, t, m):
    """Square beam between two points."""
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    o = box(name, (t, t, d.length), (0, 0, 0), m, 0.0)
    o.data.transform(Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4())  # bake rotation into mesh
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


def text_mesh(body, size, loc, rot, m):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.active_object
    t.data.body = body; t.data.size = size; t.data.extrude = 0.006; t.data.align_x = "CENTER"
    f = r"C:\Windows\Fonts\arialbd.ttf"
    if os.path.exists(f):
        t.data.font = bpy.data.fonts.load(f, check_existing=True)
    bpy.ops.object.convert(target="MESH")
    t = bpy.context.active_object
    t.data.materials.clear(); t.data.materials.append(m)
    return t


# ---------------- green chassis + legs ----------------
for sx in (-1, 1):
    P(rounded("beam", (0.18, 4.6, 0.24), (sx * 0.55, -0.3, 2.08), FRAME, 0.05, 2))
for wy in (WFY, WRY):
    P(rounded("crossBeam", (2.3, 0.22, 0.22), (0, wy, 2.08), FRAME, 0.05, 2))
    for sx in (-1, 1):
        P(rounded("leg", (0.2, 0.32, 1.3), (sx * 1.0, wy, 1.42), FRAME, 0.06, 2))
        P(cyl("stub", 0.09, 0.2, (sx * 1.08, wy, WZ), DARK, 10, rot=(0, math.pi / 2, 0)))
        P(rounded("legFoot", (0.26, 0.4, 0.22), (sx * 1.0, wy, 0.86), FRAME, 0.06, 2))
# rear mudguards
for sx in (-1, 1):
    f = arch("mudguard", (sx * WX, WRY, WZ), 0.86, 0.92, 0.44, BLACK, 0.35, math.pi - 0.35, 10)
    P(f)
    P(beam("guardArm", (sx * 1.0, WRY, 1.9), (sx * 1.15, WRY, 1.65), 0.06, DARK))

# ---------------- cab ----------------
P(rounded("cabBase", (1.62, 1.6, 0.34), (0, 1.3, 2.25), PAINT, 0.12, 3))
P(rounded("cabGlass", (1.54, 1.48, 1.32), (0, 1.3, 2.98), GLASS, 0.18, 3))
for sx in (-1, 1):
    for py in (0.6, 2.0):
        P(rounded("pillar", (0.09, 0.09, 1.3), (sx * 0.74, py, 2.98), BLACK, 0.03, 2))
P(rounded("roofCap", (1.78, 1.82, 0.3), (0, 1.32, 3.72), PAINT, 0.14, 4))
P(rounded("visor", (1.5, 0.22, 0.08), (0, 2.18, 3.55), BLACK, 0.03, 2))
P(rounded("antennaBox", (0.3, 0.2, 0.1), (0, 0.9, 3.9), BLACK, 0.04, 2))
beacon_parts = []
for sx in (-1, 1):
    P(rounded("roofLampBox", (0.26, 0.1, 0.14), (sx * 0.58, 2.2, 3.7), BLACK, 0.04, 2))
    beacon_parts.append(rounded("roofLamp", (0.2, 0.06, 0.09), (sx * 0.58, 2.25, 3.7), LAMP, 0.03, 2))
# mirror "antlers" (green arms + black mirrors) like the real machine
for sx in (-1, 1):
    P(beam("mirrorArm1", (sx * 0.8, 1.9, 3.3), (sx * 1.15, 2.3, 3.45), 0.05, FRAME))
    P(rounded("mirror", (0.1, 0.2, 0.32), (sx * 1.18, 2.32, 3.3), BLACK, 0.04, 2))

# ---------------- nose (face: mouth + headlights + mustache) ----------------
P(rounded("nose", (1.42, 0.62, 0.72), (0, 2.25, 2.12), PAINT, 0.22, 4))
P(rounded("noseGrille", (1.1, 0.1, 0.42), (0, 2.55, 2.05), BLACK, 0.1, 3))
for sx in (-1, 1):
    P(rounded("lampBezel", (0.3, 0.07, 0.18), (sx * 0.5, 2.55, 2.28), BLACK, 0.06, 3))
    P(rounded("lamp", (0.24, 0.06, 0.12), (sx * 0.5, 2.58, 2.28), LAMP, 0.05, 3))


def smile(w, h, loc):
    bm = bmesh.new(); n = 18; d = 0.04
    front, back = [], []
    for i in range(n + 1):
        a = math.pi + math.pi * i / n
        x, z = math.cos(a) * w, math.sin(a) * h + 0.04 * (math.cos(a) ** 4)
        front.append(bm.verts.new((x, d, z))); back.append(bm.verts.new((x, -d, z)))
    bm.faces.new(front[::-1]); bm.faces.new(back)
    for i in range(n):
        bm.faces.new((front[i], front[i + 1], back[i + 1], back[i]))
    bm.faces.new((front[0], back[0], back[-1], front[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("mouth"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("mouth", me); bpy.context.collection.objects.link(o)
    me.materials.append(MOUTH); o.location = loc
    return o


P(smile(0.3, 0.18, (0, 2.6, 2.13)))
P(uvs("tongue", 0.12, (0, 2.62, 2.0), TONGUE, 14, 8, scale=(1.4, 0.35, 0.6)))
# curly emperor mustache (two arcs + curls) on the nose top edge
for sx in (-1, 1):
    m1 = arch("mustache", (0, 0, 0), 0.12, 0.2, 0.06, MUST, 0.0, math.pi * 0.9, 10)
    m1.rotation_euler = (0, 0, math.pi / 2)
    m1.location = (sx * 0.2, 2.62, 2.38)
    m1.scale = (1, 1.0, 0.8)
    m1.rotation_euler = (0, sx * 2.6 if sx > 0 else -2.6, math.pi / 2)
    P(m1)
    P(uvs("curl", 0.05, (sx * 0.4, 2.62, 2.42), MUST, 10, 6))

# ---------------- eyes on the windshield ----------------
EY = 2.0 + 0.06
for sx in (-1, 1):
    ex, ez = sx * 0.34, 3.02
    P(uvs("eyeWhite", 0.32, (ex, EY, ez), EYE_W, 28, 14, scale=(1.0, 0.38, 1.18)))
    P(uvs("iris", 0.2, (ex - sx * 0.04, EY + 0.08, ez - 0.05), IRIS, 24, 12, scale=(1, 0.3, 1.12)))
    P(uvs("pupil", 0.12, (ex - sx * 0.04, EY + 0.12, ez - 0.06), PUPIL, 18, 9, scale=(1, 0.3, 1.12)))
    P(uvs("shine", 0.05, (ex + 0.02, EY + 0.15, ez + 0.05), EYE_W, 10, 6, scale=(1, 0.4, 1)))
    b = arch("brow", (0, 0, 0), 0.33, 0.41, 0.06, BROW, 0.6, math.pi - 0.6, 10)
    b.location = (ex, EY + 0.04, ez + 0.08)
    b.rotation_euler = (0, -sx * 0.22, math.pi / 2)   # proud, slightly raised outer ends
    P(b)

# ---------------- crown on the roof ----------------
P(cyl("crownBand", 0.3, 0.16, (0, 1.32, 3.95), GOLD, 20))
for k in range(5):
    a = k / 5 * math.tau
    P(cone("crownSpike", 0.08, 0.26, (math.cos(a) * 0.26, 1.32 + math.sin(a) * 0.26, 4.15), GOLD, 6))
    P(ico("crownBall", 0.045, (math.cos(a) * 0.26, 1.32 + math.sin(a) * 0.26, 4.3), GOLD, 1))
    P(ico("gem", 0.045, (math.cos(a + 0.63) * 0.3, 1.32 + math.sin(a + 0.63) * 0.3, 3.95), GEM, 1))

# ---------------- tank ----------------
P(rounded("tank", (1.5, 2.3, 1.15), (0, -0.85, 2.82), PAINT, 0.32, 4))
P(rounded("tankLid", (1.12, 1.9, 0.24), (0, -0.85, 3.42), BLACK, 0.1, 3))
P(cyl("fillCap", 0.16, 0.14, (0, 0.05, 3.56), PAINT, 14, bevel=0.03, seg=2))
P(rounded("tankSkirt", (1.6, 2.4, 0.18), (0, -0.85, 2.27), BLACK, 0.06, 2))
for sx in (-1, 1):
    P(box("tankBand", (0.03, 1.9, 0.22), (sx * 0.755, -0.85, 2.98), FRAME, 0.0))
    P(text_mesh("IMPERADOR", 0.15, (sx * 0.775, -0.85, 2.925), (math.pi / 2, 0, sx * math.pi / 2), WHITE))
# rear: tail lights + centre boom section with nozzles
for sx in (-1, 1):
    P(rounded("tail", (0.24, 0.06, 0.12), (sx * 0.5, -2.02, 2.6), RED, 0.04, 2))
P(rounded("rearBoom", (2.6, 0.14, 0.14), (0, -2.75, 1.55), GREY, 0.04, 2))
for sx in (-1, 1):
    P(beam("rearBoomArm", (sx * 0.5, -2.3, 2.05), (sx * 0.5, -2.75, 1.6), 0.12, FRAME))
for k in range(7):
    P(cone("nozzle", 0.05, 0.12, (-1.2 + k * 0.4, -2.75, 1.42), DARK, 6, rot=(math.pi, 0, 0)))
# ladder (left front)
for k in range(4):
    P(rounded("step", (0.32, 0.26, 0.04), (-0.95, 1.85, 0.55 + k * 0.42), DARK, 0.01, 1))
for py in (1.72, 1.98):
    P(beam("ladderRail", (-0.95, py, 0.4), (-0.95, py, 2.1), 0.04, FRAME))


# ---------------- folded booms (separate, pivot at front mount) ----------------
def boom(name, sx):
    objs = []
    x = sx * 1.32
    y0, y1, zb, zt = -2.6, 0.45, 2.25, 2.8
    objs.append(beam("top", (x, y0, zt), (x, y1, zt), 0.09, FRAME))
    objs.append(beam("bot", (x, y0, zb), (x, y1, zb), 0.09, FRAME))
    n = 7
    for i in range(n):
        ya = y0 + (y1 - y0) * i / n
        yb = y0 + (y1 - y0) * (i + 1) / n
        objs.append(beam("diag", (x, ya, zb if i % 2 == 0 else zt), (x, yb, zt if i % 2 == 0 else zb), 0.05, FRAME))
    objs.append(beam("end", (x, y0, zb), (x, y0, zt), 0.07, FRAME))
    objs.append(beam("mount", (x, y1, 2.55), (sx * 0.6, y1, 2.2), 0.12, FRAME))
    o = join(objs, name)
    # pivot at the front mount so the game can swing it open
    bpy.context.scene.cursor.location = (x, y1, 2.55)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return o


booms = [boom("BoomL", -1), boom("BoomR", 1)]


# ---------------- wheels: tall & thin ----------------
def wheel(name, r, w, lugs=18):
    objs = [cyl(name, r * 0.84, w, (0, 0, 0), BLACK, 32, rot=(0, math.pi / 2, 0), bevel=0.08, seg=3)]
    for k in range(lugs):
        for side in (-1, 1):
            a = 2 * math.pi * (k + (0.5 if side > 0 else 0)) / lugs
            rr = r * 0.88
            objs.append(box("lug", (w * 0.5, r * 0.14, r * 0.17), (side * w * 0.25, rr * math.cos(a), rr * math.sin(a)),
                            BLACK, 0.0, rot=(a, 0, side * 0.35)))
    for sx in (-1, 1):
        objs.append(cyl("rim", r * 0.58, 0.05, (sx * w * 0.44, 0, 0), PAINT, 24, rot=(0, math.pi / 2, 0), bevel=0.02, seg=2))
        objs.append(cyl("hub", r * 0.22, 0.12, (sx * w * 0.46, 0, 0), BLACK, 14, rot=(0, math.pi / 2, 0)))
        for k in range(8):
            a = 2 * math.pi * k / 8
            objs.append(cyl("bolt", 0.022, 0.05, (sx * w * 0.5, r * 0.32 * math.cos(a), r * 0.32 * math.sin(a)),
                            DARK, 6, rot=(0, math.pi / 2, 0)))
    return join_smooth(objs, name)


wheels = []
for nm, wy in (("WheelRL", WRY), ("WheelRR", WRY), ("WheelFL", WFY), ("WheelFR", WFY)):
    wo = wheel(nm, WR, WW)
    wo.location = ((-1 if nm.endswith("L") else 1) * WX, wy, WZ)
    wheels.append(wo)

body = join_smooth(parts, "Body")
beacon_o = join_smooth(beacon_parts, "Beacon")
allobjs = [body, beacon_o] + booms + wheels
print("IMPERADOR polys:", polycount(allobjs))
export(allobjs, "imperador.glb")
save_blend("imperador")

prev = os.environ.get("PREVIEW_DIR")
if prev:
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    w = bpy.data.worlds.new("w"); sc.world = w
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.78, 0.95, 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5; sun.rotation_euler = (0.7, 0.2, 2.4); sc.collection.objects.link(sun)
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(mat("Floor", "#9CC9E8", 0.9))
    sc.view_settings.view_transform = "Standard"
    cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam")); cam.data.lens = 55
    sc.collection.objects.link(cam)
    for fn, azim, elev, dist in (("impc_a.png", 0.6, 0.2, 13), ("impc_b.png", math.pi / 2, 0.08, 12), ("impc_c.png", 0.0, 0.1, 12)):
        t = Vector((0, -0.2, 2.0))
        cam.location = t + Vector((math.cos(azim) * math.cos(elev), math.sin(azim) * math.cos(elev), math.sin(elev))) * dist
        cam.rotation_euler = (t - cam.location).to_track_quat("-Z", "Y").to_euler()
        sc.camera = cam
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        sc.render.filepath = os.path.join(prev, fn)
        bpy.ops.render.render(write_still=True)
