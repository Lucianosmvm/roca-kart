"""Cartoon low-poly retopology of the Stara ST MAX 105 tractor.

Proportions taken from Assembly/Tractor/StMax105.blend:
  rear wheels  center (+-0.88, -1.25)  radius 0.92  width 0.60
  front wheels center (+-0.95, +1.29)  radius 0.71  width 0.44
  ground at z=0, forward = +Y (Blender) -> exported glTF forward = -Z.
Colors sampled from the original textures (orange paint, grey cab, black fenders, green/white stripe).

Run: blender -b --python blender/tractor.py
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from common import *
from common import _finish

reset()

PAINT = mat("Paint", "#F27A1C", 0.55)
PAINT_DK = mat("PaintDark", "#C25A10", 0.6)
BLACK = mat("Black", "#26262B", 0.8)
DARK = mat("DarkMetal", "#45474F", 0.6)
GREY = mat("CabGrey", "#C9CDD2", 0.5)
ROOF = mat("Roof", "#E9ECEF", 0.45)
GREEN = mat("Stripe", "#1D8F45", 0.5)
WHITE = mat("White", "#FFFFFF", 0.5)
LIGHT = mat("Headlight", "#FFF3B0", 0.3, emission=1.5)
BEACON = mat("Beacon", "#FFB300", 0.3, emission=2.0)
SKIN = mat("Skin", "#F5C29A", 0.8)
STRAW = mat("Straw", "#EBC75E", 0.9)
HATBAND = mat("HatBand", "#B5342B", 0.8)
OVERALL = mat("Overalls", "#3A6FD8", 0.8)
SHIRT = mat("Shirt", "#E23D3D", 0.8)
MUST = mat("Mustache", "#5B3A1E", 0.9)

RW = dict(x=0.88, y=-1.25, z=0.92, r=0.92, w=0.60)
FW = dict(x=0.95, y=1.29, z=0.72, r=0.71, w=0.44)

parts = []
P = parts.append

# ---------------- chassis / engine ----------------
P(box("chassis", (0.72, 3.5, 0.45), (0, 0.45, 0.78), DARK, 0.05))
P(box("hood", (0.98, 2.15, 0.82), (0, 1.32, 1.36), PAINT, 0.2, 3))
P(box("hoodTop", (0.7, 1.9, 0.12), (0, 1.25, 1.78), PAINT, 0.05, 2))
P(box("grille", (0.78, 0.12, 0.62), (0, 2.42, 1.3), BLACK, 0.05))
for gx in (-0.22, 0, 0.22):
    P(box("grilleBar", (0.06, 0.04, 0.5), (gx, 2.49, 1.3), DARK, 0.0))
for sx in (-1, 1):
    P(box("headlight", (0.16, 0.06, 0.12), (sx * 0.27, 2.5, 1.55), LIGHT, 0.02))
    # green + white stripes on hood sides
    P(box("stripeG", (0.04, 1.55, 0.09), (sx * 0.49, 1.35, 1.5), GREEN, 0.0))
    P(box("stripeW", (0.04, 1.55, 0.05), (sx * 0.49, 1.35, 1.41), WHITE, 0.0))
    # side engine panel (darker orange)
    P(box("sidepanel", (0.04, 0.9, 0.3), (sx * 0.47, 1.6, 1.1), PAINT_DK, 0.02))
# front weights block
P(box("weights", (0.9, 0.3, 0.38), (0, 2.62, 0.85), BLACK, 0.05))
P(box("bumper", (1.0, 0.12, 0.12), (0, 2.8, 0.85), DARK, 0.03))
# exhaust stack
P(cyl("exhaust", 0.07, 1.25, (0.3, 2.0, 2.35), BLACK, 8))
P(cyl("exhaustCap", 0.09, 0.08, (0.3, 2.0, 2.98), BLACK, 8))
# axles
P(cyl("rearAxle", 0.16, 1.6, (0, RW["y"], RW["z"]), DARK, 8, rot=(0, math.pi / 2, 0)))
P(box("frontAxle", (1.75, 0.18, 0.18), (0, FW["y"], FW["z"]), DARK, 0.03))
# rear hitch / 3-point
P(box("hitchBar", (1.1, 0.12, 0.12), (0, -2.05, 0.6), DARK, 0.02))
for sx in (-1, 1):
    P(box("hitchArm", (0.08, 0.7, 0.1), (sx * 0.45, -1.8, 0.7), DARK, 0.02))
P(box("drawbar", (0.2, 0.5, 0.08), (0, -2.0, 0.5), BLACK, 0.02))

# ---------------- cab (open-sided cartoon cab so the farmer shows) ----------------
P(box("cabTub", (1.1, 1.9, 0.5), (0, -0.65, 1.38), GREY, 0.08, 2))
P(box("cabFloorStep", (1.2, 0.5, 0.1), (0, 0.15, 1.12), DARK, 0.02))
for sx in (-1, 1):
    for py in (-1.55, 0.22):
        P(box("post", (0.08, 0.08, 1.7), (sx * 0.56, py, 2.42), BLACK, 0.02))
    # step ladder
    P(box("step", (0.25, 0.3, 0.04), (sx * 0.62, 0.15, 0.45), DARK, 0.0))
    P(box("step2", (0.25, 0.3, 0.04), (sx * 0.62, 0.15, 0.8), DARK, 0.0))
    # mirrors
    P(box("mirrorArm", (0.35, 0.04, 0.04), (sx * 0.75, 0.25, 2.75), BLACK, 0.0))
    P(box("mirror", (0.06, 0.12, 0.2), (sx * 0.94, 0.25, 2.75), BLACK, 0.02))
# windscreen frame top + dash
P(box("dash", (1.0, 0.25, 0.3), (0, 0.15, 1.75), DARK, 0.05))
P(box("roof", (1.6, 2.15, 0.22), (0, -0.66, 3.33), ROOF, 0.1, 2))
P(box("roofLip", (1.4, 1.95, 0.08), (0, -0.66, 3.19), GREY, 0.03))
P(cyl("beaconBase", 0.1, 0.06, (0, -0.4, 3.47), BLACK, 8))
beacon = cyl("Beacon", 0.09, 0.16, (0, -0.4, 3.57), BEACON, 8, bevel=0.03)

# rear fenders (black arches) + front fenders
for sx in (-1, 1):
    P(arch("fenderR", (sx * RW["x"], RW["y"], RW["z"]), 1.0, 1.08, 0.72, BLACK, 0.1, math.pi - 0.15, 12))
    P(arch("fenderF", (sx * FW["x"], FW["y"], FW["z"]), 0.78, 0.84, 0.5, BLACK, 0.35, math.pi - 0.35, 8))
    P(box("fenderLight", (0.12, 0.06, 0.08), (sx * RW["x"], RW["y"] - 0.7, RW["z"] + 0.75), mat("TailLight", "#FF3B30", 0.3, 1.5), 0.02))

# ---------------- farmer driver ----------------
P(box("seat", (0.55, 0.5, 0.15), (0, -0.85, 1.68), BLACK, 0.05))
P(box("seatBack", (0.55, 0.12, 0.55), (0, -1.15, 1.95), BLACK, 0.05))
P(cyl("steerCol", 0.04, 0.6, (0, -0.1, 1.95), DARK, 6, rot=(-0.6, 0, 0)))
bpy.ops.mesh.primitive_torus_add(major_radius=0.2, minor_radius=0.035, major_segments=12, minor_segments=4,
                                 location=(0, -0.28, 2.2), rotation=(-0.6, 0, 0))
P(_finish(bpy.context.active_object, "steer", BLACK))
P(box("torso", (0.5, 0.36, 0.55), (0, -0.85, 2.05), OVERALL, 0.1, 2))
P(box("shirt", (0.52, 0.3, 0.2), (0, -0.86, 2.3), SHIRT, 0.08, 1))
for sx in (-1, 1):
    P(box("arm", (0.13, 0.5, 0.13), (sx * 0.24, -0.55, 2.2), SHIRT, 0.04, rot=(-0.4, 0, 0)))
    P(ico("hand", 0.08, (sx * 0.2, -0.32, 2.18), SKIN, 1))
    P(box("leg", (0.16, 0.45, 0.16), (sx * 0.13, -0.55, 1.82), OVERALL, 0.04))
P(ico("head", 0.24, (0, -0.85, 2.62), SKIN, 2, scale=(1, 1, 1.05)))
P(ico("nose", 0.07, (0, -0.62, 2.6), SKIN, 1, scale=(1, 1.1, 0.9)))
P(box("mustache", (0.22, 0.05, 0.06), (0, -0.63, 2.52), MUST, 0.02))
for sx in (-1, 1):
    P(ico("eye", 0.035, (sx * 0.09, -0.63, 2.7), BLACK, 1))
P(cyl("hatBrim", 0.42, 0.04, (0, -0.85, 2.8), STRAW, 14))
P(cyl("hatCrown", 0.22, 0.24, (0, -0.85, 2.92), STRAW, 12, r2=0.18))
P(cyl("hatBand", 0.215, 0.06, (0, -0.85, 2.85), HATBAND, 12))


# ---------------- wheels (separate objects, origin at hub, axis = X) ----------------
def wheel(name, r, w, rim_col=PAINT, lugs=14):
    objs = []
    tire = cyl(name, r * 0.86, w, (0, 0, 0), BLACK, 16, rot=(0, math.pi / 2, 0), bevel=0.05, seg=1)
    objs.append(tire)
    # chunky chevron tread lugs
    for k in range(lugs):
        for side in (-1, 1):
            a = 2 * math.pi * (k + (0.5 if side > 0 else 0)) / lugs
            rr = r * 0.9
            lug = box("lug", (w * 0.48, r * 0.16, r * 0.22), (side * w * 0.24, rr * math.cos(a), rr * math.sin(a)),
                      BLACK, 0.0, rot=(a, 0, side * 0.25))
            objs.append(lug)
    for sx in (-1, 1):
        objs.append(cyl("rim", r * 0.56, 0.05, (sx * w * 0.47, 0, 0), rim_col, 12, rot=(0, math.pi / 2, 0)))
        objs.append(cyl("hub", r * 0.24, 0.06, (sx * w * 0.5, 0, 0), DARK, 8, rot=(0, math.pi / 2, 0)))
        for k in range(5):
            a = 2 * math.pi * k / 5
            objs.append(cyl("nut", 0.025, 0.05, (sx * w * 0.52, r * 0.16 * math.cos(a), r * 0.16 * math.sin(a)),
                            mat("Chrome", "#D9DDE3", 0.2), 6, rot=(0, math.pi / 2, 0)))
    return join(objs, name)


wheels = []
for nm, d in (("WheelRL", RW), ("WheelRR", RW), ("WheelFL", FW), ("WheelFR", FW)):
    wo = wheel(nm, d["r"], d["w"])
    sx = -1 if nm.endswith("L") else 1  # left = -X in Blender (forward +Y)
    wo.location = (sx * d["x"], d["y"], d["z"])
    wheels.append(wo)

body = join(parts, "Body")
beacon_o = join([beacon], "Beacon")
allobjs = [body, beacon_o] + wheels
print("TRACTOR polys:", polycount(allobjs))
export(allobjs, "tractor.glb")
save_blend("tractor_v1_lowpoly")

prev = os.environ.get("PREVIEW_DIR")
if prev:
    preview(os.path.join(prev, "tractor_a.png"), target=(0, 0.2, 1.4), dist=8.5, elev=0.3, azim=0.7)
    preview(os.path.join(prev, "tractor_b.png"), target=(0, 0.2, 1.4), dist=8.5, elev=0.15, azim=math.pi)
