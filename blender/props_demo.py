"""Extra cartoon models for the marketing demo: jump ramp, corn coin, podium, garage showroom,
roof accessories (hats, crown, flower, flag, sunglasses) and cerrado/soy vegetation.

Run: blender -b --factory-startup --python blender/props_demo.py
Exports assets/<name>.glb and blender/models/<name>.blend.
Accessories: origin at the mounting point (roof top for hats, between the eyes for glasses), forward = +Y.
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from common import *

random.seed(11)
PREV = os.environ.get("PREVIEW_DIR")


def done(objs, name, target=(0, 0, 0.5), dist=5, elev=0.35, azim=0.8):
    export(objs, f"{name}.glb")
    save_blend(name)
    if PREV:
        preview(os.path.join(PREV, f"d_{name}.png"), target=target, dist=dist, elev=elev, azim=azim, size=(320, 240))
    reset()


def beam(name, p1, p2, t, m):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    o = box(name, (t, t, d.length), (0, 0, 0), m, 0.0)
    o.data.transform(Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4())
    o.location = (p1 + p2) / 2
    bpy.context.view_layer.update()
    return o


def smooth_all(o):
    for p in o.data.polygons:
        p.use_smooth = True
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception:
        pass
    return o


def wedge(name, w, d, h, loc, m):
    """Ramp wedge: rises along +Y from 0 to h."""
    bm = bmesh.new()
    x, y, z = loc
    v = [bm.verts.new(c) for c in (
        (x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z),
        (x - w / 2, y + d / 2, z + h), (x + w / 2, y + d / 2, z + h))]
    bm.faces.new((v[0], v[1], v[2], v[3])[::-1]); bm.faces.new((v[0], v[1], v[5], v[4])[::-1] if False else (v[0], v[4], v[5], v[1]))
    bm.faces.new((v[3], v[2], v[5], v[4])); bm.faces.new((v[0], v[3], v[4])); bm.faces.new((v[1], v[5], v[2]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); me.materials.append(m)
    return o


# ---------------- jump ramp (wooden planks over hay bales), rises along +Y ----------------
def ramp():
    wood = mat("Wood", "#B07A45"); woodDk = mat("WoodDark", "#7A5230"); hay = mat("Hay", "#F2C94C")
    arrow = mat("Arrow", "#FFE066", 0.4, emission=0.6)
    o = [wedge("deck", 5.0, 4.0, 1.2, (0, 0, 0), wood)]
    for k in range(7):  # plank lines
        y = -1.7 + k * 0.55
        o.append(box("plank", (5.05, 0.06, 0.04), (0, y, 0.6 + y * 0.3 + 0.02), woodDk, 0.0, rot=(math.atan2(1.2, 4.0), 0, 0)))
    for x in (-1.6, 0, 1.6):  # chevrons painted on the deck
        o.append(box("chev", (0.6, 0.12, 0.03), (x - 0.2, 0.2, 0.68), arrow, 0.0, rot=(math.atan2(1.2, 4.0), 0, 0.6)))
        o.append(box("chev", (0.6, 0.12, 0.03), (x + 0.2, 0.2, 0.68), arrow, 0.0, rot=(math.atan2(1.2, 4.0), 0, -0.6)))
    for x in (-1.9, 1.9):
        o.append(cyl("bale", 0.55, 1.0, (x, 1.7, 0.55), hay, 12, rot=(0, math.pi / 2, 0), bevel=0.05, seg=1))
    done([join(o, "Ramp")], "ramp", (0, 0, 0.5), 9)


# ---------------- corn coin ----------------
def coin():
    gold = mat("Gold", "#FFC83D", 0.25, emission=0.35); goldDk = mat("GoldDark", "#E09A12", 0.3)
    cob = mat("Cob", "#FFE27A", 0.35, emission=0.2); leaf = mat("Leaf", "#6CC23A")
    o = [cyl("disc", 0.5, 0.12, (0, 0, 0), gold, 24, rot=(math.pi / 2, 0, 0), bevel=0.03, seg=2)]
    o.append(cyl("rim", 0.42, 0.14, (0, 0, 0), goldDk, 24, rot=(math.pi / 2, 0, 0)))
    for s in (-1, 1):
        o.append(uvs("cob", 0.13, (0, s * 0.08, 0.02), cob, 10, 6, scale=(0.75, 0.4, 2.0)))
        o.append(cone("leafL", 0.08, 0.35, (-0.12, s * 0.085, -0.12), leaf, 4, rot=(0, 0.6, 0)))
        o.append(cone("leafR", 0.08, 0.35, (0.12, s * 0.085, -0.12), leaf, 4, rot=(0, -0.6, 0)))
    c = join(o, "Coin"); smooth_all(c)
    done([c], "coin", (0, 0, 0), 2.2)


# ---------------- podium 1-2-3 (wooden stage with hay) ----------------
def podium():
    wood = mat("Wood", "#B07A45"); woodDk = mat("WoodDark", "#7A5230"); white = mat("White", "#FFFFFF")
    gold = mat("Gold", "#FFC83D", 0.3, emission=0.2); silver = mat("Silver", "#D3D8DE", 0.3); bronze = mat("Bronze", "#CD7F32", 0.3)
    red = mat("Carpet", "#C8372D"); hay = mat("Hay", "#F2C94C")
    o = []
    for x, h, m in ((0, 1.6, gold), (-6.2, 1.1, silver), (6.2, 0.7, bronze)):
        o.append(box("step", (6, 6, h), (x, 0, h / 2), wood, 0.12, 2))
        o.append(box("top", (6.2, 6.2, 0.12), (x, 0, h + 0.06), red, 0.04, 1))
        o.append(box("plate", (1.6, 0.06, 0.6), (x, -3.04, h * 0.55), m, 0.04, 1))
    for x, n in ((0, 1), (-6.2, 2), (6.2, 3)):
        bpy.ops.object.text_add(location=(x, -3.09, 0.42 if n > 1 else 0.68), rotation=(math.pi / 2, 0, 0))
        t = bpy.context.active_object; t.data.body = str(n); t.data.size = 0.5; t.data.extrude = 0.02; t.data.align_x = "CENTER"
        f = r"C:\Windows\Fonts\arialbd.ttf"
        if os.path.exists(f):
            t.data.font = bpy.data.fonts.load(f, check_existing=True)
        bpy.ops.object.convert(target="MESH"); t = bpy.context.active_object
        t.data.materials.clear(); t.data.materials.append(woodDk); o.append(t)
    for x in (-10, 10):
        o.append(cyl("bale", 0.8, 1.2, (x, 1, 0.8), hay, 12, rot=(0, math.pi / 2, 0), bevel=0.06, seg=1))
    for x in (-9.5, 9.5):  # bunting poles
        o.append(box("pole", (0.2, 0.2, 6), (x, 2.8, 3), woodDk, 0.02))
    flags = [mat(f"Flag{i}", c) for i, c in enumerate(("#216C79", "#FFF0CF", "#E9C46A", "#75C5D4", "#E87578"))]
    for k in range(14):
        x = -9.5 + k * 19 / 13
        z = 5.6 - 0.9 * math.sin(math.pi * k / 13)
        o.append(cone("flag", 0.35, 0.6, (x, 2.8, z - 0.3), flags[k % 5], 3, rot=(math.pi, 0, 0)))
    o.append(beam("rope", (-9.5, 2.8, 5.6), (9.5, 2.8, 5.6), 0.03, woodDk))
    done([join(o, "Podium")], "podium", (0, 0, 2), 22, azim=-1.2)


# ---------------- garage showroom: barn interior with turntable ----------------
def garage():
    floor = mat("Floor", "#C9A06A", 0.8); plank = mat("PlankLine", "#A87F4E"); wall = mat("Wall", "#B57E51")
    trim = mat("Trim", "#FFF0CF"); beamM = mat("Beam", "#7A5230"); turn = mat("Turntable", "#D9AD76", 0.7)
    turnRing = mat("TurnRing", "#216C79", 0.5); hay = mat("Hay", "#E9C46A"); tool = mat("Tool", "#8E9399", 0.3)
    lamp = mat("Lamp", "#FFF1C1", 0.2, emission=3.0); sign = mat("Sign", "#216C79"); green = mat("LampShade", "#216C79")
    o = [box("floor", (22, 18, 0.2), (0, 0, -0.1), floor, 0.0)]
    for k in range(-10, 11, 2):
        o.append(box("floorLine", (0.05, 18, 0.02), (k, 0, 0.005), plank, 0.0))
    o.append(box("backWall", (22, 0.4, 9), (0, 9, 4.5), wall, 0.0))
    for sx in (-1, 1):
        o.append(box("sideWall", (0.4, 18, 9), (sx * 11, 0, 4.5), wall, 0.0))
        for y in (-6, 0, 6):
            o.append(box("post", (0.5, 0.5, 9), (sx * 10.7, y, 4.5), beamM, 0.04))
    for k in range(-9, 10, 3):
        o.append(box("wallBoard", (0.07, 0.3, 9), (k, 8.75, 4.5), plank, 0.0))
    for y in (-6, 0, 6):
        o.append(box("roofBeam", (22, 0.4, 0.5), (0, y, 8.6), beamM, 0.04))
    # turntable
    o.append(cyl("turntable", 4.2, 0.25, (0, 0, 0.125), turn, 48, bevel=0.05, seg=2))
    o.append(cyl("turnRing", 4.3, 0.12, (0, 0, 0.06), turnRing, 48))
    for x in range(-3, 4):
        length = 2 * math.sqrt(4.1**2 - x*x)
        o.append(box("turntablePlank", (0.035, length, 0.008), (x, 0, 0.254), plank, 0))
    for k in range(16):
        a = k * math.tau / 16
        o.append(uvs("turntableBolt", .055, (4.15*math.cos(a), 4.15*math.sin(a), .26), trim, 8, 4, scale=(1,1,.4)))
    # A simple painted window suggests daylight without textures or external assets.
    sky = mat("WindowSky", "#9FD8E5"); hill = mat("WindowHill", "#91AC65")
    o.append(box("window", (4.2, .09, 3.1), (-6.1, 8.53, 4.6), sky, .04))
    o.append(uvs("hill", 1, (-6.1, 8.44, 3.3), hill, 16, 8, scale=(2.0,.05,.8)))
    for x in (-8.2,-6.1,-4.0):
        o.append(box("windowVertical", (.13,.14,3.3), (x,8.35,4.6), trim, .025))
    for z in (3.05,4.6,6.15):
        o.append(box("windowHorizontal", (4.35,.14,.13), (-6.1,8.35,z), trim, .025))
    # props: hay bales, tool wall, hanging lamps
    for x, y in ((-8, 6.5), (-6.4, 7), (8, 6.8), (7.5, 5.2)):
        o.append(cyl("bale", 0.8, 1.2, (x, y, 0.8), hay, 12, rot=(0, math.pi / 2, random.random()), bevel=0.06, seg=1))
    o.append(box("toolBoard", (5, 0.1, 2.6), (0, 8.7, 4.2), beamM, 0.05))
    for k in range(6):
        x = -2 + k * 0.8
        o.append(box("toolHandle", (0.08, 0.06, 1.6), (x, 8.6, 4.3), beamM, 0.0))
        o.append(box("toolHead", (0.4 if k % 2 else 0.2, 0.05, 0.3), (x, 8.58, 5.1 - (k % 3) * 0.3), tool, 0.02))
    for x in (-5, 0, 5):
        o.append(beam("lampWire", (x, 0, 8.6), (x, 0, 6.8), 0.04, beamM))
        o.append(cone("lampShade", 0.7, 0.5, (x, 0, 6.6), green, 12))
        o.append(uvs("bulb", 0.22, (x, 0, 6.35), lamp, 10, 6))
    o.append(box("sign", (5, 0.15, 1.2), (0, 8.7, 7.0), sign, 0.08, 2))
    bpy.ops.object.text_add(location=(0, 8.6, 6.75), rotation=(math.pi / 2, 0, 0))
    t = bpy.context.active_object; t.data.body = "OFICINA DA ROÇA"; t.data.size = 0.43; t.data.extrude = 0.02; t.data.align_x = "CENTER"
    f = r"C:\Windows\Fonts\arialbd.ttf"
    if os.path.exists(f):
        t.data.font = bpy.data.fonts.load(f, check_existing=True)
    bpy.ops.object.convert(target="MESH"); t = bpy.context.active_object
    t.data.materials.clear(); t.data.materials.append(trim); o.append(t)
    done([join(o, "Garage")], "garage", (0, 0, 3), 22, azim=-1.57, elev=0.25)


# ---------------- accessories ----------------
def acc_straw():
    straw = mat("Straw", "#EBC75E"); band = mat("HatBand", "#B5342B")
    o = [cyl("brim", 0.62, 0.05, (0, 0, 0.03), straw, 24, bevel=0.02, seg=2),
         cyl("crown", 0.34, 0.34, (0, 0, 0.22), straw, 20, r2=0.28, bevel=0.04, seg=2),
         cyl("band", 0.335, 0.08, (0, 0, 0.1), band, 20)]
    h = join(o, "AccStraw"); smooth_all(h); done([h], "acc_straw", (0, 0, 0.2), 2.5)


def acc_cap():
    cap = mat("Cap", "#E87578"); visor = mat("Visor", "#216C79"); white = mat("White", "#FFF0CF")
    o = [uvs("dome", 0.4, (0, 0, 0.02), cap, 20, 10, scale=(1, 1.05, 0.7)),
         cyl("visor", 0.36, 0.04, (0, 0.36, 0.06), visor, 20, rot=(0.1, 0, 0)),
         uvs("button", 0.06, (0, 0, 0.3), visor, 8, 5)]
    bm = bpy.data.objects.get("visor")
    h = join(o, "AccCap")
    # cut the lower half of the dome off visually by squashing below z=0
    for v in h.data.vertices:
        if v.co.z < 0.0:
            v.co.z = 0.0
    smooth_all(h); done([h], "acc_cap", (0, 0, 0.2), 2.5)


def acc_crown():
    gold = mat("Gold", "#FFC83D", 0.25, emission=0.25); gem = mat("Gem", "#2F7DD1", 0.2, emission=0.4)
    o = [cyl("band", 0.32, 0.18, (0, 0, 0.09), gold, 24)]
    for k in range(6):
        a = k / 6 * math.tau
        o.append(cone("spike", 0.09, 0.3, (math.cos(a) * 0.28, math.sin(a) * 0.28, 0.32), gold, 6))
        o.append(ico("ball", 0.05, (math.cos(a) * 0.28, math.sin(a) * 0.28, 0.48), gold, 1))
        o.append(ico("gem", 0.05, (math.cos(a + 0.52) * 0.32, math.sin(a + 0.52) * 0.32, 0.09), gem, 1))
    done([join(o, "AccCrown")], "acc_crown", (0, 0, 0.25), 2.5)


def acc_flower():
    stem = mat("Stalk", "#4E9A2B"); petal = mat("Sunflower", "#FFC300"); c = mat("SunCenter", "#6B3E1D"); leaf = mat("Leaf", "#6CC23A")
    o = [cyl("stem", 0.04, 0.9, (0, 0, 0.45), stem, 6), cyl("pot", 0.2, 0.25, (0, 0, 0.12), mat("Pot", "#C8642D"), 12, r2=0.15)]
    o.append(cyl("center", 0.18, 0.08, (0, 0.03, 1.0), c, 14, rot=(math.pi / 2, 0, 0)))
    for k in range(12):
        a = k / 12 * math.tau
        o.append(box("petal", (0.11, 0.03, 0.2), (math.cos(a) * 0.27, 0.0, 1.0 + math.sin(a) * 0.27), petal, 0, rot=(0, -a + math.pi / 2, 0)))
    for s in (-1, 1):
        o.append(cone("leaf", 0.1, 0.35, (s * 0.15, 0, 0.5), leaf, 4, rot=(0, s * 1.2, 0)))
    done([join(o, "AccFlower")], "acc_flower", (0, 0, 0.6), 3)


def acc_flag():
    pole = mat("Pole", "#D9DDE3", 0.3); orange = mat("FlagCoral", "#E87578"); green = mat("FlagTeal", "#216C79"); white = mat("White", "#FFF0CF")
    o = [cyl("pole", 0.03, 1.6, (0, 0, 0.8), pole, 8), ico("tip", 0.06, (0, 0, 1.62), mat("Gold", "#FFC83D"), 1)]
    for k in range(3):  # wavy checkered flag
        for j in range(2):
            m = orange if (k + j) % 2 == 0 else green
            o.append(box("cell", (0.02, 0.28, 0.22), (0.02 + 0.03 * math.sin(k), -0.16 - k * 0.28, 1.45 - j * 0.22), m, 0.0))
    done([join(o, "AccFlag")], "acc_flag", (0, -0.3, 1), 3, azim=0.2)


def acc_glasses():
    frame = mat("GlassFrame", "#1B1B1F", 0.3); lens = mat("Lens", "#2F3542", 0.05)
    o = []
    for sx in (-1, 1):
        o.append(box("lens", (0.5, 0.06, 0.34), (sx * 0.3, 0.02, 0), lens, 0.08, 3))
        o.append(box("rim", (0.56, 0.05, 0.4), (sx * 0.3, 0.0, 0), frame, 0.09, 3))
        o.append(uvs("glint", 0.05, (sx * 0.3 - 0.12, 0.07, 0.08), mat("White", "#FFFFFF"), 8, 5, scale=(1.4, 0.4, 0.6)))
    o.append(box("bridge", (0.14, 0.05, 0.06), (0, 0.0, 0.08), frame, 0.02))
    done([join(o, "AccGlasses")], "acc_glasses", (0, 0, 0), 2.2, azim=1.57, elev=0.1)


# ---------------- cerrado vegetation ----------------
def soy():
    leaf = mat("Soy", "#5DAA3A"); leaf2 = mat("Soy2", "#7BC24F")
    o = []
    for k in range(5):
        a = k / 5 * math.tau
        o.append(ico("leaf", 0.22, (math.cos(a) * 0.18, math.sin(a) * 0.18, 0.32 + 0.05 * (k % 2)), leaf if k % 2 else leaf2, 1, scale=(1, 1, 0.55)))
    o.append(ico("top", 0.2, (0, 0, 0.45), leaf2, 1, scale=(1, 1, 0.6)))
    done([join(o, "Soy")], "soy", (0, 0, 0.3), 2.5)


def cerrado_tree():
    trunk = mat("TrunkDark", "#6E4A2A"); canopy = mat("CanopyCerrado", "#7FA83C"); canopy2 = mat("CanopyCerrado2", "#5F8F2E")
    o = [beam("trunk1", (0, 0, 0), (0.4, 0.2, 1.6), 0.28, trunk), beam("trunk2", (0.4, 0.2, 1.6), (-0.2, 0.1, 2.6), 0.22, trunk),
         beam("branch", (0.3, 0.15, 1.5), (1.2, 0.4, 2.3), 0.15, trunk)]
    for x, y, z, r, m in ((-0.3, 0.1, 2.9, 1.3, canopy), (1.3, 0.4, 2.5, 0.9, canopy2), (0.5, -0.4, 3.0, 1.0, canopy)):
        o.append(ico("canopy", r, (x, y, z), m, 1, scale=(1.3, 1.3, 0.55)))
    done([join(o, "CerradoTree")], "cerrado_tree", (0, 0, 1.8), 9)


if __name__ == '__main__':
    selected = set(sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else set()
    for fn in (ramp, coin, podium, garage, acc_straw, acc_cap, acc_crown, acc_flower, acc_flag, acc_glasses, soy, cerrado_tree):
        if not selected or fn.__name__ in selected:
            reset()
            fn()
    print("DEMO PROPS SAVED")
