"""Cartoon *character* version of the ST MAX 105 (matches the reference art: eyes on the
windshield, smiling grille, rounded orange hood with green/white stripe and 'ST MAX 105' badge).

Base proportions from Assembly/Tractor/StMax105.blend (wheel centers / radii), forward = +Y,
ground z=0. Exports assets/tractor.glb with separate WheelFL/FR/RL/RR + Beacon nodes.

Run: blender -b --factory-startup --python blender/tractor_char.py
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from common import *
from common import _finish

reset()

PAINT = mat("Paint", "#F5821F", 0.4)
BLACK = mat("Black", "#232428", 0.75)
DARK = mat("DarkMetal", "#3D3F46", 0.5)
CAB = mat("CabGrey", "#B9C0C9", 0.3)
GLASS = mat("Glass", "#D5DCE4", 0.15)
ROOF = mat("Roof", "#E4E7EB", 0.4)
GREEN = mat("Stripe", "#1E8A3E", 0.4)
WHITE = mat("White", "#FFFFFF", 0.4)
LAMP = mat("Headlight", "#FFF4D6", 0.2, emission=2.0)
AMBER = mat("Amber", "#FF9A1F", 0.3, emission=1.2)
EYE_W = mat("EyeWhite", "#FFFFFF", 0.2)
IRIS = mat("Iris", "#7A4419", 0.2)
PUPIL = mat("Pupil", "#120A05", 0.1)
BROW = mat("Brow", "#3A3F47", 0.6)
MOUTH = mat("Mouth", "#4A1414", 0.6)
TONGUE = mat("Tongue", "#F0727F", 0.5)
CHROME = mat("Chrome", "#D9DDE3", 0.2)

RW = dict(x=0.9, y=-1.25, z=0.95, r=0.95, w=0.66)
FW = dict(x=0.95, y=1.35, z=0.74, r=0.74, w=0.5)

parts = []
P = parts.append


def smooth(o, angle=0.75):
    """Shade smooth, keep hard edges above angle (via join's mesh after modifiers)."""
    o["smooth"] = angle
    return o


def rounded(name, size, loc, m, r=0.1, seg=3, rot=(0, 0, 0)):
    return smooth(box(name, size, loc, m, r, seg, rot))


# ---------------- hood (rounded, sloping to the front) ----------------
def hood():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        x, y, z = v.co
        X = x * 1.2                  # width
        Y = 1.32 + y * 2.3            # y from 0.17 .. 2.47
        Z = 1.45 + z * 1.06           # z from 0.92 .. 1.98
        if z > 0 and y > 0:           # front-top drops (sloping nose)
            Z -= 0.2
        v.co = (X, Y, Z)
    me = bpy.data.meshes.new("hood"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("hood", me); bpy.context.collection.objects.link(o)
    me.materials.append(PAINT)
    md = o.modifiers.new("bevel", "BEVEL"); md.width = 0.2; md.segments = 5; md.limit_method = "NONE"
    return smooth(o)


P(hood())
P(rounded("hoodBelly", (0.9, 2.2, 0.35), (0, 1.3, 0.85), DARK, 0.08, 2))
P(rounded("chassis", (0.7, 3.4, 0.4), (0, 0.35, 0.8), DARK, 0.06, 2))

# grille (black perforated mesh, rounded) with headlights + smile
def grille_mat():
    W = 64
    img = bpy.data.images.get("GrilleMesh") or bpy.data.images.new("GrilleMesh", W, W, alpha=False)
    px = []
    for yy in range(W):
        for xx in range(W):
            cx, cy2 = (xx % 8) - 3.5, (yy % 8) - 3.5
            if (yy // 8) % 2:
                cx = ((xx + 4) % 8) - 3.5
            hole = cx * cx + cy2 * cy2 < 6.5
            v = 0.004 if hole else 0.045
            px += [v, v, v * 1.05, 1.0]
    img.pixels[:] = px
    img.filepath_raw = os.path.join(OUT, "grille_mesh.png"); img.file_format = "PNG"; img.save()
    m = bpy.data.materials.new("Grille")
    nt = m.node_tree; b = nt.nodes.get("Principled BSDF")
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.6
    return m


GRILLE = grille_mat()
g = rounded("grille", (1.08, 0.16, 0.84), (0, 2.5, 1.36), GRILLE, 0.14, 3)
bpy.context.view_layer.objects.active = g
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.cube_project(cube_size=0.35); bpy.ops.object.mode_set(mode="OBJECT")
P(g)
for sx in (-1, 1):
    P(rounded("lampBezel", (0.3, 0.07, 0.2), (sx * 0.32, 2.585, 1.6), BLACK, 0.07, 3))
    P(rounded("lamp", (0.25, 0.06, 0.15), (sx * 0.32, 2.61, 1.6), LAMP, 0.06, 3))
    P(smooth(uvs("lampGlint", 0.03, (sx * 0.32 - 0.06, 2.645, 1.63), WHITE, 8, 5, scale=(1.4, 0.4, 0.8))))


def smile():
    """Wide open smile: lower half-ellipse, extruded along Y."""
    bm = bmesh.new()
    n = 18; w, h, d = 0.36, 0.27, 0.05
    front, back = [], []
    for i in range(n + 1):
        a = math.pi + math.pi * i / n          # pi..2pi -> lower half
        x, z = math.cos(a) * w, math.sin(a) * h
        z += 0.05 * (x / w) ** 4                 # corners curl up a bit
        front.append(bm.verts.new((x, d, z))); back.append(bm.verts.new((x, -d, z)))
    bm.faces.new(front[::-1]); bm.faces.new(back)
    for i in range(n):
        bm.faces.new((front[i], front[i + 1], back[i + 1], back[i]))
    bm.faces.new((front[0], back[0], back[-1], front[-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("mouth"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("mouth", me); bpy.context.collection.objects.link(o)
    me.materials.append(MOUTH)
    o.location = (0, 2.6, 1.4)
    return o


P(smile())
P(smooth(uvs("tongue", 0.16, (0, 2.625, 1.2), TONGUE, 16, 8, scale=(1.35, 0.35, 0.62))))
for sx in (-1, 1):  # smile corners (cheek dimples)
    P(smooth(uvs("dimple", 0.035, (sx * 0.37, 2.62, 1.43), MOUTH, 8, 5)))

# front weights + bumper
P(rounded("weights", (1.05, 0.38, 0.42), (0, 2.73, 0.83), BLACK, 0.07, 2))
for gx in (-0.33, -0.11, 0.11, 0.33):
    P(box("weightGroove", (0.025, 0.4, 0.36), (gx, 2.74, 0.83), DARK, 0.0))
P(rounded("weightTop", (0.8, 0.3, 0.12), (0, 2.68, 1.07), DARK, 0.04, 2))

# side stripe: white line + green band + text + logo
for sx in (-1, 1):
    x = sx * 0.605
    P(box("stripeW", (0.03, 1.75, 0.045), (x, 1.32, 1.56), WHITE, 0.0))
    P(box("stripeG", (0.03, 1.75, 0.15), (x, 1.32, 1.68), GREEN, 0.0))
    bpy.ops.object.text_add(location=(sx * 0.625, 1.15, 1.625), rotation=(math.pi / 2, 0, sx * math.pi / 2))
    t = bpy.context.active_object
    t.data.body = "ST MAX 105"
    t.data.size = 0.15
    t.data.extrude = 0.006
    t.data.align_x = "CENTER"
    t.data.font = bpy.data.fonts.load(r"C:\Windows\Fonts\arialbd.ttf") if os.path.exists(r"C:\Windows\Fonts\arialbd.ttf") else t.data.font
    bpy.ops.object.convert(target="MESH")
    t = bpy.context.active_object; t.name = "badge"
    t.data.materials.clear(); t.data.materials.append(WHITE)
    P(t)
    P(cyl("logoRing", 0.08, 0.02, (sx * 0.625, 2.0, 1.68), WHITE, 16, rot=(0, math.pi / 2, 0)))
    P(cyl("logoDot", 0.055, 0.025, (sx * 0.63, 2.0, 1.68), PAINT, 16, rot=(0, math.pi / 2, 0)))

# exhaust (left side, on the rear of the hood, tip bent backwards)
P(smooth(cyl("exhaust", 0.075, 1.55, (-0.5, 0.72, 2.38), BLACK, 14)))
P(smooth(cyl("exhaustGuard", 0.1, 0.55, (-0.5, 0.72, 2.3), BLACK, 14, bevel=0.02, seg=2)))
P(smooth(cyl("exhaustBend", 0.075, 0.3, (-0.5, 0.62, 3.26), BLACK, 14, rot=(0.75, 0, 0))))
P(smooth(cyl("exhaustTip", 0.085, 0.08, (-0.5, 0.5, 3.38), BLACK, 14, rot=(0.75, 0, 0))))
# axles / rear hitch
P(cyl("rearAxle", 0.17, 1.55, (0, RW["y"], RW["z"]), DARK, 12, rot=(0, math.pi / 2, 0)))
P(rounded("frontAxle", (1.8, 0.2, 0.2), (0, FW["y"], FW["z"]), DARK, 0.05, 2))
P(rounded("hitch", (1.0, 0.25, 0.25), (0, -2.0, 0.65), DARK, 0.05, 2))

# ---------------- cab ----------------
CY0, CY1, CZ0, CZ1 = -1.62, 0.32, 1.2, 3.02   # cab extents
cy, cz = (CY0 + CY1) / 2, (CZ0 + CZ1) / 2
P(rounded("cabBody", (1.32, CY1 - CY0, CZ1 - CZ0), (0, cy, cz), CAB, 0.14, 3))
# windshield (front) + side windows (slightly lighter glass panels)
P(rounded("windshield", (1.12, 0.04, 1.12), (0, CY1 + 0.005, 2.4), GLASS, 0.06, 2))
for sx in (-1, 1):
    P(rounded("sideWin", (0.04, 1.55, 1.05), (sx * 0.665, cy, 2.4), GLASS, 0.06, 2))
    P(rounded("doorHandle", (0.04, 0.16, 0.04), (sx * 0.69, 0.05, 2.0), BLACK, 0.015, 1))
    P(rounded("sideLamp", (0.05, 0.12, 0.12), (sx * 0.69, 0.18, 1.62), AMBER, 0.03, 2))
# black pillars on the corners
for sx in (-1, 1):
    for py in (CY0 + 0.04, CY1 - 0.02):
        P(rounded("pillar", (0.1, 0.1, CZ1 - CZ0 - 0.1), (sx * 0.64, py, cz + 0.02), BLACK, 0.035, 2))
P(rounded("dashSill", (1.28, 0.1, 0.12), (0, CY1, 1.82), BLACK, 0.04, 2))
# roof
P(rounded("roof", (1.62, 2.25, 0.3), (0, cy + 0.05, 3.16), ROOF, 0.14, 4))
P(rounded("roofBand", (1.5, 2.12, 0.08), (0, cy + 0.05, 3.0), BLACK, 0.03, 2))
P(rounded("gps", (0.32, 0.22, 0.12), (0, CY1 + 0.02, 3.3), BLACK, 0.04, 2))
beacon_parts = []
for sx in (-1, 1):
    P(smooth(cyl("roofLampBezel", 0.1, 0.08, (sx * 0.56, CY1 + 0.17, 3.16), ROOF, 16, rot=(math.pi / 2, 0, 0))))
    beacon_parts.append(smooth(uvs("roofLamp", 0.085, (sx * 0.56, CY1 + 0.22, 3.16), LAMP, 14, 7, scale=(1, 0.5, 1))))
# mirrors
for sx in (-1, 1):
    P(rounded("mirrorArm", (0.32, 0.04, 0.04), (sx * 0.8, CY1 - 0.05, 2.7), BLACK, 0.01, 1))
    P(rounded("mirror", (0.08, 0.16, 0.3), (sx * 0.98, CY1 - 0.05, 2.6), BLACK, 0.04, 2))
# steps (right side, in front of the rear wheel)
for k, z in enumerate((0.42, 0.78)):
    P(rounded("step", (0.3, 0.32, 0.05), (0.68, 0.0, z), DARK, 0.01, 1))
for py in (-0.16, 0.16):
    P(box("stepRail", (0.04, 0.04, 0.9), (0.82, py, 0.7), DARK, 0.0))

# ---------------- face on the windshield ----------------
EY = CY1 + 0.06
for sx in (-1, 1):
    ex, ez = sx * 0.29, 2.43
    P(smooth(uvs("eyeWhite", 0.3, (ex, EY, ez), EYE_W, 28, 14, scale=(1.0, 0.38, 1.2))))
    P(smooth(uvs("iris", 0.205, (ex - sx * 0.03, EY + 0.07, ez - 0.04), IRIS, 24, 12, scale=(1, 0.3, 1.12))))
    P(smooth(uvs("pupil", 0.12, (ex - sx * 0.03, EY + 0.11, ez - 0.05), PUPIL, 18, 9, scale=(1, 0.3, 1.12))))
    P(smooth(uvs("shine", 0.05, (ex + 0.03, EY + 0.14, ez + 0.05), EYE_W, 10, 6, scale=(1, 0.4, 1))))
    P(smooth(uvs("shine2", 0.018, (ex - 0.05, EY + 0.13, ez - 0.09), EYE_W, 8, 5, scale=(1, 0.4, 1))))
    # eyebrow: curved arch above eye
    bm_brow = arch("brow", (0, 0, 0), 0.31, 0.39, 0.06, BROW, 0.6, math.pi - 0.6, 10)
    bm_brow.rotation_euler = (0, 0, math.pi / 2)  # arch plane YZ -> XZ (faces +Y)
    md = bm_brow.modifiers.new("bevel", "BEVEL"); md.width = 0.02; md.segments = 2
    bm_brow.location = (ex, EY + 0.03, ez + 0.12)
    bm_brow.rotation_euler = (0, sx * 0.18, math.pi / 2)
    smooth(bm_brow)
    P(bm_brow)

# ---------------- fenders ----------------
for sx in (-1, 1):
    f = arch("fenderR", (sx * RW["x"], RW["y"], RW["z"]), 1.03, 1.15, 0.8, BLACK, 0.05, math.pi - 0.1, 18)
    md = f.modifiers.new("bevel", "BEVEL"); md.width = 0.04; md.segments = 2
    P(smooth(f))
    f = arch("fenderF", (sx * FW["x"], FW["y"], FW["z"]), 0.8, 0.88, 0.56, BLACK, 0.3, math.pi - 0.3, 12)
    md = f.modifiers.new("bevel", "BEVEL"); md.width = 0.03; md.segments = 2
    P(smooth(f))
    P(rounded("fenderLamp", (0.14, 0.08, 0.1), (sx * RW["x"], RW["y"] + 1.12, RW["z"] + 0.3), AMBER, 0.03, 2))


# ---------------- wheels ----------------
def wheel(name, r, w, lugs=16):
    objs = []
    tire = cyl(name, r * 0.84, w, (0, 0, 0), BLACK, 32, rot=(0, math.pi / 2, 0), bevel=0.13, seg=4)
    objs.append(smooth(tire))
    for k in range(lugs):  # chunky chevron tread
        for side in (-1, 1):
            a = 2 * math.pi * (k + (0.5 if side > 0 else 0)) / lugs
            rr = r * 0.88
            objs.append(box("lug", (w * 0.5, r * 0.17, r * 0.2), (side * w * 0.25, rr * math.cos(a), rr * math.sin(a)),
                            BLACK, 0.0, rot=(a, 0, side * 0.32)))
    for sx in (-1, 1):
        objs.append(smooth(cyl("rimRing", r * 0.6, 0.06, (sx * w * 0.46, 0, 0), PAINT, 24, rot=(0, math.pi / 2, 0), bevel=0.02, seg=2)))
        objs.append(smooth(cyl("rimDish", r * 0.48, 0.05, (sx * w * 0.43, 0, 0), PAINT, 24, rot=(0, math.pi / 2, 0))))
        objs.append(smooth(cyl("hub", r * 0.26, 0.14, (sx * w * 0.47, 0, 0), BLACK, 16, rot=(0, math.pi / 2, 0), bevel=0.02, seg=2)))
        for k in range(8):
            a = 2 * math.pi * k / 8
            objs.append(cyl("bolt", 0.025, 0.05, (sx * w * 0.5, r * 0.36 * math.cos(a), r * 0.36 * math.sin(a)),
                            DARK, 8, rot=(0, math.pi / 2, 0)))
    return join_smooth(objs, name)


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


wheels = []
for nm, d in (("WheelRL", RW), ("WheelRR", RW), ("WheelFL", FW), ("WheelFR", FW)):
    wo = wheel(nm, d["r"], d["w"])
    wo.location = ((-1 if nm.endswith("L") else 1) * d["x"], d["y"], d["z"])
    wheels.append(wo)

body = join_smooth(parts, "Body")
beacon_o = join_smooth(beacon_parts, "Beacon")
allobjs = [body, beacon_o] + wheels
print("TRACTOR polys:", polycount(allobjs))
export(allobjs, "tractor.glb")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "tractor_character.blend"))

prev = os.environ.get("PREVIEW_DIR")
if prev:
    # nice look-dev render (Eevee) roughly matching the reference angle
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    w = bpy.data.worlds.new("w"); sc.world = w
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.78, 0.95, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5; sun.rotation_euler = (0.7, 0.2, 2.4); sc.collection.objects.link(sun)
    bpy.ops.mesh.primitive_plane_add(size=40)
    bpy.context.active_object.data.materials.append(mat("Floor", "#9CC9E8", 0.9))
    sc.view_settings.view_transform = "Standard"
    cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
    cam.data.lens = 60
    sc.collection.objects.link(cam)
    from mathutils import Vector
    for fn, azim, elev, dist in (("char_a.png", 0.55, 0.22, 10), ("char_b.png", math.pi / 2, 0.08, 10), ("char_c.png", 0.0, 0.1, 9)):
        t = Vector((0, 0.3, 1.6))
        cam.location = t + Vector((math.cos(azim) * math.cos(elev), math.sin(azim) * math.cos(elev), math.sin(elev))) * dist
        cam.rotation_euler = (t - cam.location).to_track_quat("-Z", "Y").to_euler()
        sc.camera = cam
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        sc.render.filepath = os.path.join(prev, fn)
        bpy.ops.render.render(write_still=True)
