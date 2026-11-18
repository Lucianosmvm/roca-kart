// Bounded assembly editor. Designs affect appearance; race balance stays with the base chassis.
import * as THREE from 'three';

export const BUILD_DEFAULTS = Object.freeze({
  hood: 'shell', roof: 'canopy', bumper: 'bar',
  frontSize: 1, rearSize: 1, tireWidth: 1, stance: 1,
  hoodWidth: 1, hoodHeight: 1, tankSize: 1, armSize: 1,
  bodyColor: null, accent: '#E87578', trim: '#FFF0CF',
});

export const BUILD_RANGES = {
  frontSize: [.8, 1.25], rearSize: [.85, 1.2], tireWidth: [.7, 1.5], stance: [.95, 1.3],
  hoodWidth: [.85, 1.15], hoodHeight: [.8, 1.2], tankSize: [.8, 1.2], armSize: [.75, 1.25],
};
export const IMPLEMENT_DEFAULTS = Object.freeze({
  hopper: 'seed', wheels: 'small', bodyColor: '#216C79',
  hopperColor: '#E9C46A', accent: '#E87578', trim: '#FFF0CF',
});
export function cleanImplementBuild(raw = {}) {
  const b = { ...IMPLEMENT_DEFAULTS };
  if (['seed', 'barrel', 'crate'].includes(raw.hopper)) b.hopper = raw.hopper;
  if (['small', 'wide', 'double'].includes(raw.wheels)) b.wheels = raw.wheels;
  for (const k of ['bodyColor', 'hopperColor', 'accent', 'trim']) {
    if (/^#[\da-f]{6}$/i.test(raw[k] ?? '')) b[k] = raw[k];
  }
  return b;
}

// Reuse exported Blender assemblies, so every selectable Broto part is also a file on disk.
export function applyImplementBuild(model, raw, assets) {
  const b = cleanImplementBuild(raw), resources = [];
  for (const name of ['Hoppers', 'WheelL', 'WheelR', 'WheelEndL', 'WheelEndR']) {
    model.getObjectByName(name)?.removeFromParent();
  }
  model.add(assets['broto_hoppers_' + b.hopper].clone(true));
  model.add(assets['broto_wheels_' + b.wheels].clone(true));
  const colors = { Teal: b.bodyColor, Straw: b.hopperColor, Coral: b.accent, Cream: b.trim };
  model.traverse(o => {
    if (!o.isMesh || !colors[o.material.name]) return;
    o.material = o.material.clone(); o.material.color.set(colors[o.material.name]);
    resources.push(o.material);
  });
  return { dispose: () => resources.forEach(r => r.dispose()) };
}
export function cleanBuild(raw = {}) {
  const b = { ...BUILD_DEFAULTS };
  for (const [k, [lo, hi]] of Object.entries(BUILD_RANGES)) {
    const v = Number(raw[k] ?? b[k]); b[k] = Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : b[k];
  }
  for (const [k, values] of Object.entries({ hood: ['shell', 'box', 'round'], roof: ['canopy', 'open', 'cage'], bumper: ['bar', 'double', 'none'] })) {
    if (values.includes(raw[k])) b[k] = raw[k];
  }
  for (const k of ['bodyColor', 'accent', 'trim']) if (/^#[\da-f]{6}$/i.test(raw[k] ?? '')) b[k] = raw[k];
  return b;
}

export function applyBuild(model, raw, char, paintMaterial) {
  const b = cleanBuild(raw);
  if (b.bodyColor) paintMaterial.color.set(b.bodyColor);
  const resources = [];
  // Clone only materials that will change; cloned GLB scenes share source materials.
  model.traverse(o => {
    if (!o.isMesh) return;
    const col = o.material.name === 'Coral' ? b.accent : o.material.name === 'Cream' ? b.trim : null;
    if (col) { o.material = o.material.clone(); o.material.color.set(col); resources.push(o.material); }
  });
  const rubber = new THREE.MeshToonMaterial({ color: '#29353D' });
  const trim = new THREE.MeshToonMaterial({ color: b.trim });
  const accent = new THREE.MeshToonMaterial({ color: b.accent });
  resources.push(rubber, trim, accent);
  function box(parent, name, size, pos, material) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    resources.push(o.geometry);
    o.name = name; o.position.set(...pos); o.castShadow = true; parent.add(o); return o;
  }
  function assembly(name, anchor) {
    const old = model.getObjectByName(name);
    if (!old) return null;
    const group = new THREE.Group(); group.name = name + 'Mount'; group.position.set(...anchor);
    old.removeFromParent(); group.add(old); old.position.sub(group.position); model.add(group);
    return { group, old };
  }
  if (char === 'tatu') {
    const hood = assembly('Hood', [0, 1.3, -.95]);
    if (hood) {
      if (b.hood !== 'shell') {
        hood.old.visible = false;
        if (b.hood === 'box') {
          box(hood.group, 'WorkshopHood', [1.42, 1.0, 1.88], [0, 0, 0], paintMaterial);
          for (let i = -1; i <= 1; i++) box(hood.group, 'Vent', [.025, .36, .085], [.721, -.04, i * .3], rubber);
        } else {
          const o = new THREE.Mesh(new THREE.CapsuleGeometry(.68, .64, 6, 16), paintMaterial);
          resources.push(o.geometry);
          o.rotation.x = Math.PI / 2; o.scale.z = .85; o.castShadow = true; hood.group.add(o);
        }
      }
      hood.group.scale.set(b.hoodWidth, b.hoodHeight, 1);
    }
    const roof = model.getObjectByName('Roof');
    if (roof) roof.visible = b.roof === 'canopy';
    if (b.roof === 'cage') {
      for (const x of [-.63, .63]) box(model, 'Rollbar', [.1, 1.55, .1], [x, 1.94, .94], trim);
      box(model, 'RollbarTop', [1.36, .1, .1], [0, 2.71, .94], trim);
    }
    const bumper = model.getObjectByName('Bumper');
    if (bumper) bumper.visible = b.bumper !== 'none';
    if (b.bumper === 'double') box(model, 'UpperBumper', [1.62, .12, .18], [0, .96, -2.05], accent);
  } else {
    const tank = assembly('Tank', [0, 1.0, .85]);
    if (tank) tank.group.scale.set(b.tankSize, b.tankSize, b.tankSize);
    for (const name of ['BoomL', 'BoomR']) {
      const arm = model.getObjectByName(name); if (arm) arm.scale.setScalar(b.armSize);
    }
  }
  for (const end of ['F', 'R']) for (const side of ['L', 'R']) {
    const w = model.getObjectByName('Wheel' + end + side); if (!w) continue;
    const f = end === 'F' ? b.frontSize : b.rearSize;
    w.scale.set(b.tireWidth, f, f); w.position.y *= f; w.position.x *= b.stance;
    // Use actual tread bounds, including bevels, instead of the nominal tire radius.
    model.updateMatrixWorld(true);
    w.position.y -= new THREE.Box3().setFromObject(w).min.y;
  }
  // Lift the body and its mounted parts with larger tires; wheel soles stay on the ground.
  const radius = char === 'tatu' ? [.58, .96] : [.68, .68];
  const lift = Math.max(radius[0] * (b.frontSize - 1), radius[1] * (b.rearSize - 1));
  for (const child of model.children) if (!child.name.startsWith('Wheel')) child.position.y += lift;
  return { lift, build: b, dispose: () => resources.forEach(r => r.dispose()) };
}
