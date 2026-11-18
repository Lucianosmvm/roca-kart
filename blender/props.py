"""Cartoon low-poly farm props for the race track.

Run: blender -b --factory-startup --python blender/props.py
Each prop is exported to assets/<name>.glb with its origin at ground level.
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from common import *
from common import _finish

random.seed(7)
PREV = os.environ.get("PREVIEW_DIR")


def C():  # shared palette (recreated after each reset)
    return dict(
        stalk=mat("Stalk", "#4E9A2B"), leaf=mat("Leaf", "#6CC23A"), cob=mat("Cob", "#FFD23F"),
        husk=mat("Husk", "#A6D96A"), tassel=mat("Tassel", "#D9B26A"),
        hay=mat("Hay", "#F2C94C"), hayDk=mat("HayDark", "#D9A830"), string=mat("String", "#B5651D"),
        red=mat("BarnRed", "#C8372D"), redDk=mat("BarnRedDark", "#9E2A22"), white=mat("Trim", "#FAF7EE"),
        roof=mat("RoofGrey", "#5A5F6B"), wood=mat("Wood", "#9C6B3F"), woodDk=mat("WoodDark", "#7A5230"),
        metal=mat("SiloMetal", "#D3D8DE"), metalDk=mat("SiloRing", "#A9B0B9"),
        trunk=mat("Trunk", "#8B5A2B"), canopy=mat("Canopy", "#58B947"), canopy2=mat("Canopy2", "#3E9B3A"),
        pine=mat("Pine", "#2F7D45"), rock=mat("Rock", "#9AA0A6"), bush=mat("Bush", "#4FAF3C"),
        cowW=mat("CowWhite", "#FFFFFF"), cowB=mat("CowBlack", "#2B2B2B"), pink=mat("Pink", "#F4A6B8"),
        horn=mat("Horn", "#F3E9D2"), wheat=mat("Wheat", "#E8C25A"), wheatDk=mat("WheatDark", "#C99A33"),
        shirt=mat("ScareShirt", "#4A90D9"), skinS=mat("Sack", "#D8B98A"), straw=mat("Straw", "#EBC75E"),
        banner=mat("Banner", "#FFFFFF"), sun=mat("Sunflower", "#FFC300"), sunC=mat("SunCenter", "#6B3E1D"),
        blade=mat("Blade", "#E9ECEF"), tail=mat("TailRed", "#D64541"),
    )


def done(objs, name, target=(0, 0, 1), dist=6, elev=0.35, azim=0.8):
    export(objs, f"{name}.glb")
    if PREV:
        preview(os.path.join(PREV, f"p_{name}.png"), target=target, dist=dist, elev=elev, azim=azim, size=(320, 240))
    reset()


# ---------- corn plant ----------
def corn():
    c = C(); o = []
    o.append(cyl("stalk", 0.05, 2.0, (0, 0, 1.0), c["stalk"], 6, r2=0.03))
    for i in range(5):
        a = i * 2.4
        z = 0.5 + i * 0.32
        o.append(cone("leaf", 0.09, 0.9, (math.cos(a) * 0.32, math.sin(a) * 0.32, z + 0.15), c["leaf"], 4,
                      rot=(math.sin(a) * 1.1, -math.cos(a) * 1.1, 0)))
    o.append(uvs("cob", 0.09, (0.1, 0, 1.25), c["cob"], 6, 5, scale=(1, 1, 2.4)))
    o.append(cone("husk", 0.11, 0.35, (0.12, 0, 1.08), c["husk"], 5, rot=(0, 0.25, 0)))
    o.append(cone("tassel", 0.08, 0.35, (0, 0, 2.15), c["tassel"], 5))
    done([join(o, "Corn")], "corn", (0, 0, 1), 4.5)


# ---------- wheat tuft ----------
def wheat():
    c = C(); o = []
    for i in range(7):
        a = i / 7 * math.tau; r = 0.18 if i else 0
        x, y = math.cos(a) * r, math.sin(a) * r
        h = 0.9 + random.random() * 0.25
        o.append(cyl("st", 0.015, h, (x, y, h / 2), c["wheatDk"], 4))
        o.append(uvs("head", 0.05, (x, y, h + 0.1), c["wheat"], 5, 4, scale=(1, 1, 3)))
    done([join(o, "Wheat")], "wheat", (0, 0, 0.6), 3)


# ---------- sunflower ----------
def sunflower():
    c = C(); o = []
    o.append(cyl("stem", 0.04, 1.8, (0, 0, 0.9), c["stalk"], 6))
    for s in (-1, 1):
        o.append(cone("leaf", 0.12, 0.5, (s * 0.2, 0, 0.9), c["leaf"], 4, rot=(0, s * 1.3, 0)))
    o.append(cyl("center", 0.2, 0.08, (0, -0.05, 1.9), c["sunC"], 10, rot=(math.pi / 2, 0, 0)))
    for k in range(10):
        a = k / 10 * math.tau
        o.append(box("petal", (0.12, 0.03, 0.22), (math.cos(a) * 0.3, -0.03, 1.9 + math.sin(a) * 0.3), c["sun"], 0,
                     rot=(0, -a + math.pi / 2, 0)))
    done([join(o, "Sunflower")], "sunflower", (0, 0, 1.4), 4, azim=-1.4)


# ---------- round hay bale ----------
def hay():
    c = C(); o = []
    o.append(cyl("bale", 0.75, 1.2, (0, 0, 0.75), c["hay"], 14, rot=(0, math.pi / 2, 0), bevel=0.08, seg=2))
    for sx in (-1, 1):
        for i, r in enumerate((0.55, 0.32, 0.12)):
            o.append(cyl("ring", r, 0.04, (sx * (0.6 + i * 0.012), 0, 0.75), c["hayDk"] if i % 2 == 0 else c["hay"], 12,
                         rot=(0, math.pi / 2, 0)))
    for x in (-0.3, 0.3):
        o.append(cyl("band", 0.77, 0.05, (x, 0, 0.75), c["string"], 14, rot=(0, math.pi / 2, 0)))
    done([join(o, "Hay")], "hay", (0, 0, 0.7), 4.5)


def haysq():
    c = C(); o = []
    o.append(box("bale", (1.3, 0.6, 0.5), (0, 0, 0.25), c["hay"], 0.05, 2))
    for x in (-0.35, 0.35):
        o.append(box("band", (0.05, 0.62, 0.52), (x, 0, 0.25), c["string"], 0))
    done([join(o, "HaySq")], "haysq", (0, 0, 0.3), 3.5)


# ---------- barn ----------
def barn():
    c = C(); o = []
    W, D, H = 8, 10, 5
    o.append(box("walls", (W, D, H), (0, 0, H / 2), c["red"], 0.05))
    roof_h = 3.2
    o.append(prism("gableFill", W, D - 0.02, roof_h, (0, 0, H), c["red"]))
    # roof slabs
    ang = math.atan2(roof_h, W / 2)
    L = math.hypot(W / 2, roof_h) + 0.6
    for s in (-1, 1):
        o.append(box("roof", (L, D + 1.0, 0.25), (s * W / 4 * 1.02, 0, H + roof_h / 2 + 0.12), c["roof"], 0.04,
                     rot=(0, s * ang, 0)))
    # front & back trim + doors (front = -Y)
    for sy in (-1, 1):
        y = sy * (D / 2 + 0.06)
        o.append(box("door", (3.2, 0.1, 3.6), (0, y, 1.8), c["redDk"], 0))
        for e in (-1, 1):
            o.append(box("doorTrimV", (0.22, 0.14, 3.8), (e * 1.7, y, 1.9), c["white"], 0))
            o.append(box("doorX", (0.2, 0.14, 4.6), (0, y, 1.8), c["white"], 0, rot=(0, e * 0.72, 0)))
        o.append(box("doorTrimH", (3.6, 0.14, 0.22), (0, y, 3.7), c["white"], 0))
        o.append(box("loft", (1.6, 0.12, 1.4), (0, y, 5.6), c["redDk"], 0))
        o.append(box("loftTrim", (1.8, 0.14, 0.18), (0, y, 6.35), c["white"], 0))
        o.append(box("loftTrim", (1.8, 0.14, 0.18), (0, y, 4.85), c["white"], 0))
        for e in (-1, 1):
            o.append(box("cornerTrim", (0.25, 0.14, H), (e * (W / 2 - 0.1), y, H / 2), c["white"], 0))
    for sx in (-1, 1):
        for wy in (-2.5, 2.5):
            o.append(box("win", (0.1, 1.2, 1.2), (sx * (W / 2 + 0.05), wy, 3), c["white"], 0))
            o.append(box("winIn", (0.12, 0.9, 0.9), (sx * (W / 2 + 0.06), wy, 3), mat("WinDark", "#3B2F2F"), 0))
    done([join(o, "Barn")], "barn", (0, 0, 3.5), 24, azim=-1.0)


# ---------- silo ----------
def silo():
    c = C(); o = []
    o.append(cyl("tube", 2, 10, (0, 0, 5), c["metal"], 16))
    for z in (1.5, 3.5, 5.5, 7.5, 9.5):
        o.append(cyl("ring", 2.05, 0.18, (0, 0, z), c["metalDk"], 16))
    o.append(uvs("dome", 2.1, (0, 0, 10), c["red"], 16, 8, scale=(1, 1, 0.6)))
    o.append(cone("cap", 0.4, 0.6, (0, 0, 11.5), c["metalDk"], 8))
    for k in range(12):  # ladder
        o.append(box("rung", (0.6, 0.06, 0.06), (0, -2.15, 0.6 + k * 0.8), c["metalDk"], 0))
    for e in (-1, 1):
        o.append(box("rail", (0.06, 0.06, 9.6), (e * 0.3, -2.15, 5), c["metalDk"], 0))
    done([join(o, "Silo")], "silo", (0, 0, 5), 24)


# ---------- fence ----------
def fence():
    c = C(); o = []
    for x in (-1.5, 1.5):
        o.append(box("post", (0.18, 0.18, 1.3), (x, 0, 0.65), c["woodDk"], 0.03))
        o.append(cone("tip", 0.13, 0.18, (x, 0, 1.39), c["woodDk"], 4, rot=(0, 0, math.pi / 4)))
    for z in (0.45, 0.95):
        o.append(box("rail", (3.2, 0.08, 0.18), (0, 0.08, z), c["wood"], 0.02))
    done([join(o, "Fence")], "fence", (0, 0, 0.7), 5)


# ---------- trees ----------
def tree():
    c = C(); o = []
    o.append(cyl("trunk", 0.3, 2.6, (0, 0, 1.3), c["trunk"], 7, r2=0.22))
    o.append(ico("c1", 1.6, (0, 0, 3.4), c["canopy"], 1))
    o.append(ico("c2", 1.1, (0.9, 0.3, 2.9), c["canopy2"], 1))
    o.append(ico("c3", 1.05, (-0.8, -0.4, 3.0), c["canopy"], 1))
    o.append(ico("c4", 0.9, (0.1, 0.2, 4.6), c["canopy2"], 1))
    done([join(o, "Tree")], "tree", (0, 0, 2.6), 12)


def pine():
    c = C(); o = []
    o.append(cyl("trunk", 0.22, 1.4, (0, 0, 0.7), c["trunk"], 6))
    for i, (r, z) in enumerate(((1.5, 1.9), (1.15, 3.0), (0.8, 4.0))):
        o.append(cone("tier", r, 1.8, (0, 0, z), c["pine"], 7, rot=(0, 0, i * 0.4)))
    done([join(o, "Pine")], "pine", (0, 0, 2.5), 11)


def bush():
    c = C(); o = []
    for x, y, r in ((0, 0, 0.6), (0.5, 0.2, 0.45), (-0.45, 0.1, 0.48), (0.1, -0.4, 0.42)):
        o.append(ico("b", r, (x, y, r * 0.8), c["bush"], 1))
    done([join(o, "Bush")], "bush", (0, 0, 0.5), 4)


def rock():
    c = C()
    r = ico("rock", 0.8, (0, 0, 0.35), c["rock"], 1, scale=(1.3, 1, 0.7))
    for v in r.data.vertices:
        v.co += Vector((random.uniform(-.12, .12), random.uniform(-.12, .12), random.uniform(-.08, .08)))
    done([join([r], "Rock")], "rock", (0, 0, 0.4), 4.5)


# ---------- cow ----------
def cow():
    c = C(); o = []
    o.append(box("body", (0.9, 1.7, 0.85), (0, 0, 1.15), c["cowW"], 0.18, 2))
    for (x, y, z, s) in ((0.46, 0.3, 1.2, 0.28), (-0.46, -0.35, 1.25, 0.3), (0.2, -0.5, 1.58, 0.25), (-0.46, 0.45, 1.0, 0.2)):
        o.append(ico("spot", s, (x, y, z), c["cowB"], 1, scale=(0.35 if abs(x) > 0.3 else 1, 1, 0.35 if abs(x) < 0.3 else 1)))
    for x in (-0.3, 0.3):
        for y in (-0.6, 0.6):
            o.append(box("leg", (0.2, 0.2, 0.75), (x, y, 0.38), c["cowW"], 0.04))
            o.append(box("hoof", (0.22, 0.22, 0.12), (x, y, 0.06), c["cowB"], 0.02))
    o.append(box("head", (0.6, 0.6, 0.6), (0, 1.05, 1.55), c["cowW"], 0.12, 2))
    o.append(box("muzzle", (0.55, 0.3, 0.32), (0, 1.38, 1.42), c["pink"], 0.08, 2))
    for x in (-0.12, 0.12):
        o.append(ico("nostril", 0.04, (x, 1.53, 1.45), c["cowB"], 1))
        o.append(ico("eye", 0.06, (x * 1.5, 1.35, 1.7), c["cowB"], 1))
    for s in (-1, 1):
        o.append(cone("horn", 0.06, 0.25, (s * 0.25, 1.0, 1.95), c["horn"], 5, rot=(0, s * 0.5, 0)))
        o.append(box("ear", (0.25, 0.08, 0.14), (s * 0.4, 1.0, 1.7), c["pink"], 0.03))
    o.append(box("udder", (0.3, 0.3, 0.15), (0, -0.4, 0.68), c["pink"], 0.06))
    o.append(cyl("tail", 0.03, 0.7, (0, -0.9, 1.1), c["cowW"], 5, rot=(0.3, 0, 0)))
    o.append(ico("tuft", 0.08, (0, -1.0, 0.75), c["cowB"], 1))
    done([join(o, "Cow")], "cow", (0, 0, 1.0), 5, azim=0.3)


# ---------- scarecrow ----------
def scarecrow():
    c = C(); o = []
    o.append(box("pole", (0.12, 0.12, 2.6), (0, 0, 1.3), c["woodDk"], 0))
    o.append(box("bar", (1.8, 0.1, 0.1), (0, 0, 1.9), c["woodDk"], 0))
    o.append(box("shirt", (0.7, 0.35, 0.8), (0, 0, 1.75), c["shirt"], 0.06))
    o.append(box("sleeves", (1.6, 0.25, 0.22), (0, 0, 1.9), c["shirt"], 0.04))
    for s in (-1, 1):
        o.append(cone("strawHand", 0.12, 0.25, (s * 0.92, 0, 1.9), c["straw"], 6, rot=(0, s * math.pi / 2, 0)))
    o.append(ico("head", 0.3, (0, 0, 2.5), c["skinS"], 1))
    o.append(cyl("brim", 0.5, 0.04, (0, 0, 2.74), c["straw"], 10))
    o.append(cyl("crown", 0.28, 0.35, (0, 0, 2.92), c["straw"], 8, r2=0.2))
    for x in (-0.1, 0.1):
        o.append(box("eyeX", (0.1, 0.03, 0.03), (x, -0.29, 2.55), c["cowB"], 0, rot=(0, 0.78, 0)))
        o.append(box("eyeX", (0.1, 0.03, 0.03), (x, -0.29, 2.55), c["cowB"], 0, rot=(0, -0.78, 0)))
    o.append(box("mouth", (0.25, 0.03, 0.03), (0, -0.29, 2.38), c["cowB"], 0))
    done([join(o, "Scarecrow")], "scarecrow", (0, 0, 1.6), 6, azim=-1.2)


# ---------- windmill (water pump) — blades separate for spinning ----------
def windmill():
    c = C(); o = []
    top = 8.0
    for x in (-1, 1):
        for y in (-1, 1):
            o.append(box("leg", (0.15, 0.15, top + 0.4), (x * 0.6, y * 0.6, top / 2), c["metalDk"], 0,
                         rot=(-y * 0.13, x * 0.13, 0)))
    for z in (2, 4, 6):
        s = 1.0 - z / top * 0.75
        o.append(box("brace", (2 * s * 1.25, 0.08, 0.08), (0, -s * 1.25 * 0.95 + 0.05, z), c["metalDk"], 0))
        o.append(box("brace", (2 * s * 1.25, 0.08, 0.08), (0, s * 1.25 * 0.95 - 0.05, z), c["metalDk"], 0))
    o.append(box("head", (0.5, 0.9, 0.5), (0, 0, top + 0.2), c["red"], 0.06))
    o.append(box("tailArm", (0.08, 2.2, 0.08), (0, 1.5, top + 0.2), c["metalDk"], 0))
    o.append(box("tailVane", (0.05, 1.2, 1.0), (0, 2.6, top + 0.35), c["tail"], 0.03))
    tower = join(o, "Tower")
    b = [cyl("hub", 0.25, 0.3, (0, 0, 0), c["red"], 8, rot=(math.pi / 2, 0, 0))]
    for k in range(12):
        a = k / 12 * math.tau
        b.append(box("blade", (0.32, 0.04, 1.6), (math.sin(a) * 1.0, 0, math.cos(a) * 1.0), c["blade"], 0,
                     rot=(0.3, a, 0)))
    rim = arch("rim", (0, 0, 0), 1.72, 1.82, 0.06, c["metalDk"], 0, math.tau, 24)
    rim.rotation_euler = (0, 0, math.pi / 2)
    b.append(rim)
    blades = join(b, "Blades")
    # keep only a thin ring: delete the cap faces of the rim by making it hollow-looking is overkill; fine as disk edge
    blades.location = (0, -0.6, top + 0.2)
    done([tower, blades], "windmill", (0, 0, 5), 20)


# ---------- start/finish gate (banner material swapped in game) ----------
def gate():
    c = C(); o = []
    span = 16
    for x in (-span / 2, span / 2):
        o.append(box("post", (0.5, 0.5, 6), (x, 0, 3), c["wood"], 0.05))
        o.append(box("base", (0.9, 0.9, 0.4), (x, 0, 0.2), c["woodDk"], 0.05))
        o.append(cyl("hayTop", 0.45, 0.8, (x, 0, 6.3), c["hay"], 10, rot=(0, math.pi / 2, 0)))
    o.append(box("beam", (span + 0.8, 0.4, 0.4), (0, 0, 5.9), c["woodDk"], 0.04))
    frame = join(o, "GateFrame")
    banner = box("Banner", (span - 2, 0.15, 1.6), (0, 0, 4.9), c["banner"], 0)
    banner = join([banner], "Banner")
    done([frame, banner], "gate", (0, 0, 3), 22, azim=-1.2)


def cloud():
    m = mat("Cloud", "#FFFFFF", 0.9)
    o = []
    for x, y, z, r in ((0, 0, 0, 3), (3, 0.5, -0.5, 2.3), (-3, -0.3, -0.6, 2.2), (1.2, -0.8, 1.6, 2), (-1.4, 0.6, 1.3, 1.8)):
        o.append(ico("puff", r, (x, y, z + 3), m, 1))
    done([join(o, "Cloud")], "cloud", (0, 0, 3), 16)


def itembox():
    """Item crate: wooden frame; the '?' faces are textured in game (material 'ItemFace')."""
    c = C(); o = []
    o.append(box("core", (1.5, 1.5, 1.5), (0, 0, 0.75), mat("ItemFace", "#FFFFFF", 0.4), 0.0))
    for a in range(3):
        for s1 in (-1, 1):
            for s2 in (-1, 1):
                size = [0.18, 0.18, 0.18]; size[a] = 1.7
                loc = [0, 0, 0]
                b1, b2 = [i for i in range(3) if i != a]
                loc[b1] = s1 * 0.78; loc[b2] = s2 * 0.78
                loc[2] += 0.75
                o.append(box("edge", tuple(size), tuple(loc), c["wood"], 0.03))
    frame = join(o[1:], "ItemFrame")
    core = join([o[0]], "ItemCore")
    done([frame, core], "itembox", (0, 0, 0.8), 5)


def tomato():
    c = C(); o = []
    o.append(uvs("t", 0.45, (0, 0, 0.45), mat("Tomato", "#E8322B", 0.35), 10, 7, scale=(1, 1, 0.85)))
    for k in range(5):
        a = k / 5 * math.tau
        o.append(box("sepal", (0.08, 0.3, 0.04), (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.84), c["leaf"], 0,
                     rot=(0, 0, a + math.pi / 2)))
    o.append(cyl("stem", 0.04, 0.15, (0, 0, 0.9), c["stalk"], 5))
    done([join(o, "Tomato")], "tomato", (0, 0, 0.45), 2.5)


for fn in (cloud, itembox, tomato, corn, wheat, sunflower, hay, haysq, barn, silo, fence, tree, pine, bush, rock, cow, scarecrow, windmill, gate):
    reset()
    fn()
print("ALL PROPS DONE")
