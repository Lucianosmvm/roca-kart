"""Orientation repair for authored assets; positions, names and pivots stay intact.
Closed connected shells have an exterior. Open meshes are only forced upward when
explicitly identified as course surfaces. Other open surfaces are reported, not guessed.
"""
import bmesh,bpy

def signed_volume(faces):
    ref=faces[0].verts[0].co.copy();volume=0.0
    for face in faces:
        a=face.verts[0].co-ref
        for i in range(1,len(face.verts)-1):
            volume+=a.dot((face.verts[i].co-ref).cross(face.verts[i+1].co-ref))/6
    return volume

def orient_object(obj,fix=False,course=False):
    mesh=obj.data;bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update()
    before={f:f.normal.copy() for f in bm.faces};remaining=set(bm.faces)
    closed=0;inward=0;open_shells=0
    while remaining:
        seed=remaining.pop();stack=[seed];faces=[seed]
        while stack:
            face=stack.pop()
            for edge in face.edges:
                for neighbor in edge.link_faces:
                    if neighbor in remaining:remaining.remove(neighbor);stack.append(neighbor);faces.append(neighbor)
        edges={edge for face in faces for edge in face.edges}
        if all(len(edge.link_faces)==2 for edge in edges):
            closed+=1
            if signed_volume(faces)<-1e-12:inward+=1
            bmesh.ops.recalc_face_normals(bm,faces=faces);bm.normal_update()
            if signed_volume(faces)<-1e-12:bmesh.ops.reverse_faces(bm,faces=faces)
        else:
            open_shells+=1
            if course:
                downward=[face for face in faces if face.normal.z < -1e-6]
                if downward:bmesh.ops.reverse_faces(bm,faces=downward)
    bm.normal_update()
    changed=sum(before[face].dot(face.normal)<-.5 for face in bm.faces)
    if fix and changed:
        bm.to_mesh(mesh);mesh.update()
        # Old custom normals must not continue pointing in the old direction.
        if mesh.has_custom_normals:mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        normal=obj.modifiers.new('RepairedWeightedNormals','WEIGHTED_NORMAL');normal.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=normal.name)
    bm.free()
    return {'object':obj.name,'closed_shells':closed,'inward_shells':inward,'open_shells':open_shells,'flipped_faces':changed}
