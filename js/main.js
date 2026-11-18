// Roça Kart — Pista 1: Fazenda Milharal
// Arcade kart racer with farm machinery. Models built in Blender (see /blender), loaded as GLB.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

// ------------------------------------------------------------------ config
const CFG = {
  laps: 3,
  halfW: 8,          // half road width (m)
  margin: 7,         // grass strip between road and fence (m)
  maxSpeed: 30,      // m/s (~108 km/h... cartoon tractors!)
  boostSpeed: 42,
  offroadFactor: 0.55,
  mudFactor: 0.5,
  N: 2000,           // track samples
};
const WALL = CFG.halfW + CFG.margin;
// playable characters (models built in /blender). Stats are 1..5 stars shown on the select screen.
const CHARACTERS = {
  maxi: {
    name: 'Maxi', machine: 'Trator ST MAX 105', asset: 'tractor', img: 'assets/ui/maxi.png',
    stats: { Velocidade: 3, Arrancada: 4, Curva: 4, Peso: 3 },
    speedMul: 1, accelMul: 1, turnMul: 1, camH: 4.3, camD: 9.5, exhaust: { side: -0.64, back: -0.5, y: 3.3 },
  },
  imperador: {
    name: 'Imperador', machine: 'Pulverizador Imperador', asset: 'imperador', img: 'assets/ui/imperador.png',
    stats: { Velocidade: 5, Arrancada: 2, Curva: 2, Peso: 5 },
    speedMul: 1.06, accelMul: 0.85, turnMul: 0.86, camH: 5.6, camD: 11.5, exhaust: { side: 0, back: 2.3, y: 2.6 },
  },
};
// rivals; the last one becomes whichever character the player did not pick
const RACERS = [
  { name: 'Você', paint: '#F27A1C', char: 'maxi' },
  { name: 'Zé do Milho', paint: '#D62F2F', char: 'maxi' },
  { name: 'Dona Cida', paint: '#2E9E4F', char: 'maxi' },
  { name: 'Tonhão', paint: '#2F6FD6', char: 'maxi' },
  { name: 'Bia Colheita', paint: '#F2C21C', char: 'maxi' },
  { name: 'Imperador', paint: '#8E44AD', char: 'imperador', keepPaint: true },
];

// ------------------------------------------------------------------ helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
let seed = 1234;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();
const $ = id => document.getElementById(id);

// ------------------------------------------------------------------ renderer / scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
const effect = new OutlineEffect(renderer, { defaultThickness: 0.0032, defaultColor: [0.12, 0.07, 0.03] });

const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#D6F0FF');
scene.fog = new THREE.Fog(HORIZON, 260, 820);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.5, 2000);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const NO_OUTLINE = { outlineParameters: { visible: false } };

// sky dome
{
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, userData: NO_OUTLINE,
    uniforms: { top: { value: new THREE.Color('#3D9BEA') }, bottom: { value: HORIZON } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = clamp(vP.y * 2.2 + 0.05, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat);
  sky.renderOrder = -1;
  scene.add(sky);
  scene.userData.sky = sky;
}

scene.add(new THREE.HemisphereLight('#FFFFFF', '#6E9F3A', 1.6));
const sun = new THREE.DirectionalLight('#FFF1D6', 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 260 });
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const SUN_OFFSET = new THREE.Vector3(-60, 110, -40);

// toon gradient
const gradMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 185, 185, 185, 255, 255, 255, 255, 255]), 3, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toonCache = new Map();
function toonOf(m) {
  if (toonCache.has(m)) return toonCache.get(m);
  const t = new THREE.MeshToonMaterial({
    name: m.name, color: m.color ? m.color.clone() : new THREE.Color('#fff'), gradientMap: gradMap, map: m.map || null,
    emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0), emissiveIntensity: m.emissiveIntensity ?? 1,
  });
  toonCache.set(m, t);
  return t;
}
function toonify(root) {
  root.traverse(o => { if (o.isMesh) o.material = toonOf(o.material); });
  return root;
}
const toonColor = (hex, extra = {}) => new THREE.MeshToonMaterial({ color: hex, gradientMap: gradMap, ...extra });

// ------------------------------------------------------------------ assets
const ASSETS = ['tractor', 'corn', 'wheat', 'sunflower', 'hay', 'haysq', 'barn', 'silo', 'fence', 'tree', 'pine', 'bush',
  'rock', 'cow', 'scarecrow', 'windmill', 'gate', 'cloud', 'itembox', 'tomato', 'imperador'];
const A = {};
async function loadAssets() {
  const loader = new GLTFLoader();
  await Promise.all(ASSETS.map(n => loader.loadAsync(`assets/${n}.glb`).then(g => { A[n] = toonify(g.scene); })));
}

// instancing: every mesh of a prop becomes one InstancedMesh (no outlines: OutlineEffect ignores instanceMatrix)
const _m = new THREE.Matrix4();
function instance(root, matrices, { shadow = false } = {}) {
  if (!matrices.length) return;
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh) return;
    const mat = o.material.clone(); mat.userData = NO_OUTLINE;
    const im = new THREE.InstancedMesh(o.geometry, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, _m.multiplyMatrices(m, o.matrixWorld)));
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = shadow; im.receiveShadow = false;
    im.computeBoundingSphere();
    scene.add(im);
  });
}
const mtx = (x, z, rotY = 0, s = 1, y = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(s, s, s));
function place(name, x, z, rotY = 0, s = 1, { shadow = true, outline = true } = {}) {
  const o = A[name].clone(true);
  o.position.set(x, 0, z); o.rotation.y = rotY; o.scale.setScalar(s);
  o.traverse(c => { if (c.isMesh) { c.castShadow = shadow; c.receiveShadow = true; } });
  if (!outline) o.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.userData = NO_OUTLINE; } });
  scene.add(o);
  return o;
}

// ------------------------------------------------------------------ track
const CTRL = [
  [0, -60], [0, 40], [10, 90], [45, 115], [90, 105], [110, 70], [100, 30], [120, -5], [165, -15], [195, 10],
  [200, 60], [185, 110], [200, 150], [240, 165], [275, 140], [270, 90], [255, 40], [260, -20], [240, -75],
  [195, -105], [140, -100], [100, -130], [55, -140], [15, -115],
];
const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
const TRACK_LEN = curve.getLength();
const S = []; // samples {p, t (tangent), l (left normal)}
{
  const pts = curve.getSpacedPoints(CFG.N);
  for (let i = 0; i < CFG.N; i++) {
    const p = pts[i], q = pts[(i + 1) % CFG.N];
    const t = new THREE.Vector3().subVectors(q, p).normalize();
    S.push({ p, t, l: new THREE.Vector3(t.z, 0, -t.x) }); // left of travel direction (+X when facing +Z)
  }
  // smooth tangents
  for (let i = 0; i < CFG.N; i++) {
    const a = S[(i - 3 + CFG.N) % CFG.N].p, b = S[(i + 3) % CFG.N].p;
    S[i].t.subVectors(b, a).normalize(); S[i].l.set(S[i].t.z, 0, -S[i].t.x);
  }
}
const SPACING = TRACK_LEN / CFG.N;
const sIdx = i => ((i % CFG.N) + CFG.N) % CFG.N;

// spatial hash of samples for "distance to track" queries
const GRID = 20, grid = new Map();
S.forEach((s, i) => {
  const k = `${Math.floor(s.p.x / GRID)},${Math.floor(s.p.z / GRID)}`;
  if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i);
});
function trackDist(x, z) { // nearest distance (capped at ~GRID) + index
  const gx = Math.floor(x / GRID), gz = Math.floor(z / GRID);
  let best = 1e9, bi = -1;
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
    const arr = grid.get(`${gx + a},${gz + b}`); if (!arr) continue;
    for (const i of arr) { const p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
  }
  return { d: Math.sqrt(best), i: bi };
}
function nearestLocal(pos, guess, win = 40) {
  let best = 1e18, bi = guess;
  for (let k = -win; k <= win; k++) {
    const i = sIdx(guess + k), p = S[i].p, d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
    if (d < best) { best = d; bi = i; }
  }
  return bi;
}
function nearestGlobal(pos) {
  let best = 1e18, bi = 0;
  for (let i = 0; i < CFG.N; i += 4) { const p = S[i].p, d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2; if (d < best) { best = d; bi = i; } }
  return nearestLocal(pos, bi, 6);
}
const trackPoint = (i, lat = 0) => S[sIdx(i)].p.clone().addScaledVector(S[sIdx(i)].l, lat);
const headingOf = v => Math.atan2(v.x, v.z);

// world bounds
const WB = { x0: -190, z0: -320, size: 660 };

// ------------------------------------------------------------------ canvas textures
function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const speckle = (g, w, h, n, cols, smin = 2, smax = 5) => {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; const s = rr(smin, smax); g.fillRect(rnd() * w, rnd() * h, s, s); }
};

// ------------------------------------------------------------------ fields (plots)
const PLOT = 40;
const PLOT_TYPES = ['corn', 'wheat', 'plow', 'corn', 'sun', 'pasture', 'wheat', 'corn', 'plow', 'pasture'];
const plots = [];
for (let x = WB.x0; x < WB.x0 + WB.size; x += PLOT) for (let z = WB.z0; z < WB.z0 + WB.size; z += PLOT) {
  const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
  plots.push({ x, z, type: PLOT_TYPES[Math.floor(h * PLOT_TYPES.length)], rowsAlongX: h > 0.5 });
}
const PLOT_COL = { corn: '#6C9A34', wheat: '#E9C45A', plow: '#93603A', sun: '#86B947', pasture: '#93D46B' };

function buildGround() {
  const R = 2048, k = R / WB.size;
  const tex = canvasTex(R, R, (g) => {
    g.fillStyle = '#7CC850'; g.fillRect(0, 0, R, R);
    speckle(g, R, R, 9000, ['#74BF49', '#86D05A'], 3, 8);
    for (const p of plots) {
      const x = (p.x - WB.x0) * k, z = (p.z - WB.z0) * k, s = PLOT * k, ins = 2.2 * k;
      g.fillStyle = PLOT_COL[p.type]; g.fillRect(x + ins, z + ins, s - 2 * ins, s - 2 * ins);
      if (p.type === 'plow' || p.type === 'corn' || p.type === 'sun') {
        g.fillStyle = p.type === 'plow' ? '#7A4C2C' : 'rgba(80,60,30,0.28)';
        const step = (p.type === 'plow' ? 1.6 : 2.6) * k;
        for (let o = ins; o < s - ins; o += step)
          p.rowsAlongX ? g.fillRect(x + ins, z + o, s - 2 * ins, step * 0.45) : g.fillRect(x + o, z + ins, step * 0.45, s - 2 * ins);
      }
    }
    // grass corridor around the track (margin + verge)
    const path = () => { g.beginPath(); S.forEach((s, i) => { const X = (s.p.x - WB.x0) * k, Z = (s.p.z - WB.z0) * k; i ? g.lineTo(X, Z) : g.moveTo(X, Z); }); g.closePath(); };
    g.lineJoin = 'round';
    path(); g.strokeStyle = '#78C24D'; g.lineWidth = (WALL + 6) * 2 * k; g.stroke();
    path(); g.strokeStyle = '#8AD25C'; g.lineWidth = WALL * 2 * k; g.stroke();
    path(); g.strokeStyle = '#A6743F'; g.lineWidth = (CFG.halfW + 1.2) * 2 * k; g.stroke();
  });
  const geo = new THREE.PlaneGeometry(WB.size, WB.size);
  const ground = new THREE.Mesh(geo, toonColor('#ffffff', { map: tex, userData: NO_OUTLINE }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(WB.x0 + WB.size / 2, 0, WB.z0 + WB.size / 2);
  ground.receiveShadow = true;
  scene.add(ground);
  // outer infinite-ish grass
  const outer = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), toonColor('#76BF4A', { userData: NO_OUTLINE }));
  outer.rotation.x = -Math.PI / 2; outer.position.set(WB.x0 + WB.size / 2, -0.05, WB.z0 + WB.size / 2);
  scene.add(outer);
}

function ribbon(lat0, lat1, y, vScale, step = 2) {
  const pos = [], uv = [], idx = [];
  let v = 0, n = 0;
  for (let i = 0; i <= CFG.N; i += step) {
    const s = S[i % CFG.N];
    for (const [lat, u] of [[lat0, 0], [lat1, 1]]) {
      pos.push(s.p.x + s.l.x * lat, y, s.p.z + s.l.z * lat); uv.push(u, v / vScale);
    }
    if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    n++; v += SPACING * step;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // make sure normals point up regardless of winding
  const nrm = g.attributes.normal; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return g;
}

function buildRoad() {
  const roadTex = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#C99A5E'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2600, ['#B98749', '#D8AC70', '#BE8E52', '#E2B985'], 2, 6);
    g.fillStyle = 'rgba(110,70,35,0.28)';
    for (const x of [52, 84, 172, 204]) g.fillRect(x - 9, 0, 18, h);
    g.fillStyle = 'rgba(90,60,30,0.35)';
    for (let y = 0; y < h; y += 16) for (const x of [52, 84, 172, 204]) g.fillRect(x - 8, y, 16, 5);
    for (let y = 0; y < h; y += 5) { // grassy ragged edges
      g.fillStyle = '#7CC850'; g.fillRect(0, y, rr(2, 10), 5); g.fillRect(w - rr(2, 10), y, 12, 5);
    }
    speckle(g, w, h, 60, ['#8E8E8E', '#A9A9A9'], 4, 8); // pebbles
  });
  roadTex.wrapT = THREE.RepeatWrapping;
  const road = new THREE.Mesh(ribbon(-CFG.halfW, CFG.halfW, 0.03, 18), toonColor('#fff', { map: roadTex, userData: NO_OUTLINE }));
  road.receiveShadow = true; scene.add(road);

  const curbTex = canvasTex(32, 64, (g) => { g.fillStyle = '#F7D154'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#B5341F'; g.fillRect(0, 32, 32, 32); });
  curbTex.wrapT = THREE.RepeatWrapping;
  for (const side of [-1, 1]) {
    const a = side * CFG.halfW, b = side * (CFG.halfW + 0.9);
    const m = new THREE.Mesh(ribbon(side < 0 ? b : a, side < 0 ? a : b, 0.07, 4), toonColor('#fff', { map: curbTex, userData: NO_OUTLINE }));
    m.receiveShadow = true; scene.add(m);
  }
  // start/finish line
  const chk = canvasTex(256, 48, (g) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) { g.fillStyle = (x + y) % 2 ? '#222' : '#fff'; g.fillRect(x * 16, y * 16, 16, 16); } });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(CFG.halfW * 2, 3), toonColor('#fff', { map: chk, userData: NO_OUTLINE }));
  line.rotation.set(-Math.PI / 2, headingOf(S[0].t), 0, 'YXZ');
  line.position.copy(S[0].p).setY(0.06); scene.add(line);
}

// ------------------------------------------------------------------ scenery
const colliders = []; // static circles {x,z,r}
const animated = [];  // {update(dt,t)}
const clouds = [];

function buildScenery() {
  // fences along both sides of the track
  const fenceM = [];
  const seg = 3.2, step = Math.max(1, Math.round(seg / SPACING));
  for (let i = 0; i < CFG.N; i += step) {
    for (const side of [-1, 1]) {
      const s = S[i], lat = side * (WALL + 0.6);
      const x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
      if (trackDist(x, z).d < WALL + 0.2) continue; // inner side of tight curves
      fenceM.push(mtx(x, z, headingOf(s.t) + Math.PI / 2));
    }
  }
  instance(A.fence, fenceM, { shadow: true });

  // crops in plots
  const M = { corn: [], wheat: [], sunflower: [], bush: [], rock: [], tree: [], pine: [], haysq: [] };
  const clear = WALL + 4;
  for (const p of plots) {
    const sp = { corn: [2.6, 1.8], wheat: [2.8, 2.8], sun: [2.6, 2.4], plow: [9, 9], pasture: [11, 11] }[p.type];
    for (let a = 3; a < PLOT - 3; a += sp[0]) for (let b = 3; b < PLOT - 3; b += sp[1]) {
      const [ox, oz] = p.rowsAlongX ? [b, a] : [a, b];
      const x = p.x + ox + rr(-0.3, 0.3), z = p.z + oz + rr(-0.3, 0.3);
      if (trackDist(x, z).d < clear) continue;
      if (p.type === 'corn') M.corn.push(mtx(x, z, rr(0, 6.28), rr(0.85, 1.2)));
      else if (p.type === 'wheat') M.wheat.push(mtx(x, z, rr(0, 6.28), rr(0.9, 1.3)));
      else if (p.type === 'sun') M.sunflower.push(mtx(x, z, rr(-0.4, 0.4) + Math.PI, rr(0.9, 1.15)));
      else if (p.type === 'plow' && rnd() < 0.35) M.rock.push(mtx(x + rr(-3, 3), z + rr(-3, 3), rr(0, 6), rr(0.4, 0.8)));
      else if (p.type === 'pasture' && rnd() < 0.4) M.bush.push(mtx(x + rr(-3, 3), z + rr(-3, 3), rr(0, 6), rr(0.7, 1.3)));
    }
    if (p.type === 'pasture') { // cows + a tree
      const cx = p.x + PLOT / 2, cz = p.z + PLOT / 2;
      if (trackDist(cx, cz).d > clear + 8) {
        for (let c = 0; c < 2; c++) spawnCow(p);
        if (rnd() < 0.6) M.tree.push(mtx(cx + rr(-10, 10), cz + rr(-10, 10), rr(0, 6), rr(0.9, 1.3)));
      }
    }
    if ((p.type === 'corn' || p.type === 'wheat') && rnd() < 0.25) {
      const x = p.x + rr(10, 30), z = p.z + rr(10, 30);
      if (trackDist(x, z).d > clear + 2) place('scarecrow', x, z, rr(0, 6.28), 1.1, { shadow: false });
    }
  }
  instance(A.corn, M.corn); instance(A.wheat, M.wheat); instance(A.sunflower, M.sunflower);
  instance(A.rock, M.rock); instance(A.bush, M.bush);

  // trees ring outside the farm + forest edge
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, r = rr(350, 520);
    const x = WB.x0 + WB.size / 2 + Math.cos(a) * r, z = WB.z0 + WB.size / 2 + Math.sin(a) * r;
    (rnd() < 0.5 ? M.pine : M.tree).push(mtx(x, z, rr(0, 6.28), rr(1.4, 2.6)));
  }
  // trees scattered on the grass verge outside the fence
  for (let i = 0; i < CFG.N; i += 37) {
    const side = rnd() < 0.5 ? -1 : 1, lat = side * (WALL + rr(5, 9));
    const s = S[i], x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    if (trackDist(x, z).d > WALL + 3.5) (rnd() < 0.5 ? M.pine : M.tree).push(mtx(x, z, rr(0, 6.28), rr(0.8, 1.2)));
  }
  instance(A.tree, M.tree, { shadow: true }); instance(A.pine, M.pine, { shadow: true });

  // distant hills
  const hillMat = toonColor('#5DAE3E', { userData: NO_OUTLINE });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + rr(-0.1, 0.1), r = rr(620, 760);
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), hillMat);
    h.scale.set(rr(120, 220), rr(40, 90), rr(120, 200));
    h.position.set(WB.x0 + WB.size / 2 + Math.cos(a) * r, -10, WB.z0 + WB.size / 2 + Math.sin(a) * r);
    scene.add(h);
  }

  // landmarks (validated against the track so nothing sits on the road)
  const landmark = (name, x, z, rot, s, rad) => {
    const d = trackDist(x, z).d;
    if (d < WALL + rad) { console.warn('landmark too close to track', name, x, z, d); return null; }
    colliders.push({ x, z, r: rad });
    return place(name, x, z, rot, s);
  };
  landmark('barn', 150, 52, 0.3, 1, 8);
  landmark('silo', 168, 28, 0, 1, 2.5);
  landmark('silo', 175, 40, 0, 0.8, 2);
  const wm = landmark('windmill', 60, 60, 0.6, 1, 2);
  if (wm) { const bl = wm.getObjectByName('Blades'); animated.push({ update: (dt) => { bl.rotation.z += dt * 2.2; } }); }
  landmark('windmill', 230, 100, -0.9, 1, 2);
  for (const [x, z] of [[132, 70], [128, 64], [134, 60], [170, 70]]) landmark('hay', x, z, rr(0, 3), 1, 1);
  landmark('barn', 205, -50, -0.4, 0.8, 7);

  // trackside hay bale stacks on the grass margin (collidable)
  for (const i of [150, 520, 820, 1130, 1450, 1720, 1900]) {
    const side = i % 2 ? 1 : -1, s = S[i], lat = side * (CFG.halfW + 4.5);
    const x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    place('hay', x, z, headingOf(s.t), 1); colliders.push({ x, z, r: 1.1 });
  }
  // square bales stacked near the gate
  for (const [lat, y] of [[-12, 0], [-12, 0.5], [12, 0], [12.4, 0.5]]) {
    const s = S[30], x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    const o = place('haysq', x, z, headingOf(s.t), 1.2); o.position.y = y;
  }

  // start gate with banner
  {
    const s = S[0];
    const gate = place('gate', s.p.x, s.p.z, headingOf(s.t), 1.15);
    const bannerTex = canvasTex(1024, 128, (g, w, h) => {
      g.fillStyle = '#FFF6DC'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1D8F45'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
      g.font = '84px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = '#2b1a0e'; g.strokeText('ROÇA KART · LARGADA', w / 2, h / 2 + 4);
      g.fillStyle = '#F27A1C'; g.fillText('ROÇA KART · LARGADA', w / 2, h / 2 + 4);
    });
    const banner = gate.getObjectByName('Banner');
    if (banner) {
      banner.visible = false;
      for (const side of [1, -1]) {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.6), toonColor('#fff', { map: bannerTex, userData: NO_OUTLINE }));
        pl.position.set(0, 4.9, 0.09 * side); pl.rotation.y = side > 0 ? 0 : Math.PI;
        gate.add(pl);
      }
    }
    for (const side of [-1, 1]) colliders.push({ x: s.p.x + s.l.x * side * 9.2, z: s.p.z + s.l.z * side * 9.2, r: 0.7 });
  }

  // clouds
  for (let i = 0; i < 22; i++) {
    const c = A.cloud.clone(true);
    c.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.userData = NO_OUTLINE; } });
    c.position.set(rr(-250, 500), rr(55, 95), rr(-350, 350)); c.scale.setScalar(rr(1.5, 3.2)); c.rotation.y = rr(0, 6);
    scene.add(c); clouds.push(c);
  }
}

const cows = [];
function spawnCow(p) {
  const o = place('cow', p.x + rr(8, 32), p.z + rr(8, 32), rr(0, 6.28), 1.1);
  cows.push({ o, p, target: null, wait: rr(0, 5), phase: rr(0, 6) });
}
function updateCows(dt, t) {
  for (const c of cows) {
    if (c.wait > 0) { c.wait -= dt; c.o.position.y = 0; continue; }
    if (!c.target) c.target = new THREE.Vector3(c.p.x + rr(6, 34), 0, c.p.z + rr(6, 34));
    const d = c.target.clone().sub(c.o.position); d.y = 0;
    if (d.length() < 0.5) { c.target = null; c.wait = rr(3, 9); continue; }
    c.o.rotation.y = lerpAngle(c.o.rotation.y, Math.atan2(d.x, d.z) + Math.PI, damp(2, dt));
    c.o.position.addScaledVector(d.normalize(), dt * 0.9);
    c.o.position.y = Math.abs(Math.sin(t * 6 + c.phase)) * 0.06;
  }
}

// ------------------------------------------------------------------ pickups: item boxes, boost pads, mud
const itemBoxes = [], pads = [], muds = [];
function buildPickups() {
  const qTex = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#FFE066'); gr.addColorStop(1, '#FF9F1C');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.font = '100px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#2b1a0e'; g.strokeText('?', w / 2, h / 2 + 6); g.fillStyle = '#fff'; g.fillText('?', w / 2, h / 2 + 6);
  });
  const coreMat = toonColor('#fff', { map: qTex, transparent: true, opacity: 0.92, emissive: '#553300', emissiveIntensity: 0.4 });
  const rows = [0.18, 0.43, 0.66, 0.87];
  for (const r of rows) {
    const i = Math.floor(r * CFG.N);
    for (const lat of [-5.5, -1.8, 1.8, 5.5]) {
      const p = trackPoint(i, lat);
      const g = new THREE.Group();
      const frame = A.itembox.getObjectByName('ItemFrame').clone(true);
      const core = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), coreMat);
      core.position.y = 0.75; g.add(frame, core);
      frame.traverse(o => { if (o.isMesh) o.castShadow = true; });
      g.position.copy(p); g.scale.setScalar(0.85);
      scene.add(g);
      itemBoxes.push({ g, p, active: true, timer: 0, phase: rr(0, 6) });
    }
  }
  // boost pads: chevrons painted on the road
  const padTex = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#2E86DE'; g.fillRect(0, 0, w, h);
    g.lineWidth = 18; g.strokeStyle = '#FFE066'; g.lineJoin = 'round';
    for (let k = 0; k < 3; k++) { const y = 200 - k * 70; g.beginPath(); g.moveTo(16, y); g.lineTo(w / 2, y - 50); g.lineTo(w - 16, y); g.stroke(); }
    g.strokeStyle = '#2b1a0e'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  });
  const padMat = toonColor('#fff', { map: padTex, emissive: '#1a3b66', emissiveIntensity: 0.6, userData: NO_OUTLINE });
  for (const [r, lat] of [[0.08, 0], [0.31, 3.5], [0.55, -3.5], [0.76, 0], [0.95, -3]]) {
    const i = Math.floor(r * CFG.N), p = trackPoint(i, lat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), padMat);
    m.rotation.set(-Math.PI / 2, headingOf(S[i].t), 0, 'YXZ'); m.position.copy(p).setY(0.08);
    // plane's +Y (texture up) after rotation.x=-PI/2 points to -Z; flip so chevrons point forward
    m.rotation.y += Math.PI;
    scene.add(m); pads.push({ p, r: 2.2, h: headingOf(S[i].t) });
  }
  // mud puddles
  const mudMat = toonColor('#6B4423', { userData: NO_OUTLINE });
  const mudMat2 = toonColor('#82572F', { userData: NO_OUTLINE });
  for (const [r, lat] of [[0.25, -3.5], [0.5, 4], [0.72, -4], [0.82, 3.5]]) {
    const i = Math.floor(r * CFG.N), p = trackPoint(i, lat);
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), mudMat);
    m.rotation.x = -Math.PI / 2; m.scale.set(3.4, 4.6, 1); m.position.copy(p).setY(0.07);
    m.rotation.z = -headingOf(S[i].t);
    const m2 = m.clone(); m2.material = mudMat2; m2.scale.set(2, 2.8, 1); m2.position.y = 0.075; m2.position.x += 0.4;
    scene.add(m, m2); muds.push({ p, rx: 3.2, rz: 4.3, h: headingOf(S[i].t) });
  }
}

// ------------------------------------------------------------------ particles (dust, sparks, mud)
const particles = (() => {
  const MAX = 900;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3), size = new Float32Array(MAX), alpha = new Float32Array(MAX);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, userData: NO_OUTLINE,
    uniforms: { scale: { value: innerHeight / 2 } },
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA;
      uniform float scale;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); vA = alpha * smoothstep(3.0, 7.0, -mv.z); gl_PointSize = min(size * scale / -mv.z, 56.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; gl_FragColor = vec4(vC, vA);
      #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  const P = Array.from({ length: MAX }, () => ({ life: 0 }));
  let head = 0;
  const c = new THREE.Color();
  return {
    emit(x, y, z, vx, vy, vz, color, s, life, grow = 1.5, grav = 0) {
      const p = P[head]; head = (head + 1) % MAX;
      Object.assign(p, { x, y, z, vx, vy, vz, s, life, max: life, grow, grav }); c.set(color); p.r = c.r; p.g = c.g; p.b = c.b;
    },
    update(dt) {
      for (let i = 0; i < MAX; i++) {
        const p = P[i];
        if (p.life <= 0) { alpha[i] = 0; size[i] = 0; continue; }
        p.life -= dt; p.vy -= p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.05) { p.y = 0.05; p.vy = 0; }
        const k = p.life / p.max;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.r; col[i * 3 + 1] = p.g; col[i * 3 + 2] = p.b;
        size[i] = p.s * (1 + (1 - k) * p.grow); alpha[i] = Math.min(1, k * 1.6) * 0.85;
      }
      geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = geo.attributes.size.needsUpdate = geo.attributes.alpha.needsUpdate = true;
      mat.uniforms.scale.value = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    },
  };
})();

// ------------------------------------------------------------------ audio
const audio = {
  ctx: null, eng: null, engGain: null, filt: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
      o.type = 'sawtooth'; o2.type = 'square';
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      const g = this.ctx.createGain(); g.gain.value = 0.0;
      const g2 = this.ctx.createGain(); g2.gain.value = 0.4;
      o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(this.ctx.destination);
      o.start(); o2.start();
      Object.assign(this, { eng: o, eng2: o2, engGain: g, filt: f });
    } catch (e) { console.warn('audio off', e); }
  },
  engine(speed, boost) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, f = 38 + Math.abs(speed) * 3.2 + (boost ? 25 : 0);
    this.eng.frequency.setTargetAtTime(f, t, 0.05); this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    this.filt.frequency.setTargetAtTime(350 + Math.abs(speed) * 25, t, 0.1);
    this.engGain.gain.setTargetAtTime(state.mode === 'race' || state.mode === 'countdown' ? 0.07 : 0.0, t, 0.2);
  },
  beep(freq = 440, dur = 0.15, type = 'square', vol = 0.15) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
  },
  sweep(f0, f1, dur, vol = 0.12) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur);
  },
};

// ------------------------------------------------------------------ karts
const ITEMS = { turbo: { icon: '🔥', name: 'Turbo' }, bale: { icon: '🌾', name: 'Fardo' }, tomato: { icon: '🍅', name: 'Tomate' } };
const karts = [];
function makeKartModel(def) {
  const ch = CHARACTERS[def.char];
  const model = A[ch.asset].clone(true);
  const paint = toonColor(def.paint);
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    if (o.material.name.startsWith('Paint') && !def.keepPaint) o.material = paint;
    else if (o.material.name.startsWith('Headlight')) o.material = o.material.clone();
  });
  model.rotation.y = Math.PI; // model faces -Z, karts drive along +Z
  const tilt = new THREE.Group(); tilt.add(model);
  const root = new THREE.Group(); root.add(tilt);
  scene.add(root);
  const W = n => { const w = model.getObjectByName(n); w.rotation.order = 'YXZ'; return w; };
  const radius = w => new THREE.Box3().setFromObject(w).getSize(new THREE.Vector3()).y / 2;
  const wheels = { FL: W('WheelFL'), FR: W('WheelFR'), RL: W('WheelRL'), RR: W('WheelRR') };
  const beacon = model.getObjectByName('Beacon');
  let beaconMat = null; beacon?.traverse(o => { if (o.isMesh) beaconMat = o.material; });
  return { root, tilt, model, wheels, wheelR: { F: radius(wheels.FL), R: radius(wheels.RL) }, beaconMat, ch };
}

function createKart(def, i, isPlayer) {
  const v = makeKartModel(def);
  const row = Math.floor(i / 2), col = i % 2;
  const si = sIdx(-14 - row * 16);
  const p = trackPoint(si, col ? -3.6 : 3.6);
  const h = headingOf(S[si].t);
  const k = {
    def, isPlayer, v, pos: p, heading: h, moveDir: h, speed: 0, steer: 0, idx: si, lat: 0,
    lap: 0, maxIdx: 0, finished: false, finishTime: 0, place: i + 1,
    drifting: false, driftDir: 0, driftCharge: 0, driftVis: 0, hop: 0, boost: 0, spin: 0, spinAng: 0,
    item: null, rolling: 0, wheelRot: 0, wrongWay: 0, offroad: false, inMud: false, bumpCd: 0,
    ai: { skill: 0.9 + i * 0.012 + rr(-0.01, 0.015), lane: rr(-4, 4), laneT: rr(0, 9), itemDelay: rr(1, 4), driftT: 0 },
    startBoostArmed: false,
  };
  karts.push(k);
  return k;
}

// projectiles & dropped bales
const hazards = []; // {type, o, pos, vel, life, owner}
function useItem(k) {
  if (!k.item || k.rolling > 0) return;
  const it = k.item; k.item = null;
  const fwd = new THREE.Vector3(Math.sin(k.heading), 0, Math.cos(k.heading));
  if (it === 'turbo') { k.boost = Math.max(k.boost, 1.6); if (k.isPlayer) audio.sweep(200, 900, 0.5); }
  else if (it === 'bale') {
    const o = A.hay.clone(true); o.scale.setScalar(0.8);
    o.traverse(c => { if (c.isMesh) c.castShadow = true; });
    const pos = k.pos.clone().addScaledVector(fwd, -4.5); o.position.copy(pos); o.rotation.y = k.heading + Math.PI / 2;
    scene.add(o); hazards.push({ type: 'bale', o, pos, vel: new THREE.Vector3(), life: 30, owner: k, arm: 0.4 });
    if (k.isPlayer) audio.beep(180, 0.15, 'triangle');
  } else if (it === 'tomato') {
    const o = A.tomato.clone(true); o.scale.setScalar(1.1);
    const pos = k.pos.clone().addScaledVector(fwd, 3.5); pos.y = 1.2; o.position.copy(pos);
    scene.add(o); hazards.push({ type: 'tomato', o, pos, vel: fwd.multiplyScalar(Math.max(50, k.speed + 25)), life: 3, owner: k, arm: 0.15, idx: k.idx });
    if (k.isPlayer) audio.sweep(700, 300, 0.2);
  }
}
function hitKart(k, reason) {
  if (k.spin > 0 || k.finished) return;
  k.spin = 1.1; k.speed *= 0.3; k.drifting = false; k.boost = 0;
  for (let n = 0; n < 18; n++)
    particles.emit(k.pos.x, 1.5, k.pos.z, rr(-5, 5), rr(2, 6), rr(-5, 5), reason === 'tomato' ? '#E8322B' : '#F2C94C', 0.6, 0.8, 0.5, 9);
  if (k.isPlayer) { audio.sweep(500, 90, 0.5, 0.18); flash(reason === 'tomato' ? 'Tomatada! 🍅' : 'Fardo! 🌾', 900); }
}
function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.life -= dt; h.arm -= dt;
    if (h.type === 'tomato') {
      // home loosely toward the track direction so it follows curves
      h.idx = nearestLocal(h.pos, h.idx, 20);
      const ahead = trackPoint(h.idx + Math.round(12 / SPACING), 0);
      const desired = ahead.sub(h.pos).setY(0).normalize().multiplyScalar(h.vel.length());
      h.vel.lerp(desired, damp(1.5, dt));
      h.pos.addScaledVector(h.vel, dt); h.o.position.copy(h.pos); h.o.rotation.x += dt * 12;
      const lat = h.pos.clone().sub(S[h.idx].p).dot(S[h.idx].l);
      if (Math.abs(lat) > WALL) h.life = 0;
      if (Math.random() < 0.5) particles.emit(h.pos.x, h.pos.y, h.pos.z, 0, 0, 0, '#FF8A80', 0.35, 0.3, 0.2);
    }
    for (const k of karts) {
      if (h.life <= 0) break;
      if (h.arm > 0 && k === h.owner) continue;
      if ((k.pos.x - h.pos.x) ** 2 + (k.pos.z - h.pos.z) ** 2 < (h.type === 'bale' ? 2.6 : 2.4) ** 2) { hitKart(k, h.type); h.life = 0; }
    }
    if (h.life <= 0) {
      for (let n = 0; n < 10; n++) particles.emit(h.pos.x, 0.8, h.pos.z, rr(-4, 4), rr(1, 5), rr(-4, 4), h.type === 'bale' ? '#F2C94C' : '#E8322B', 0.5, 0.6, 0.5, 9);
      scene.remove(h.o); hazards.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------------ input
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (state.mode === 'race' && (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) useItem(player);
  if (state.mode === 'race' && e.code === 'KeyR' && !e.repeat) respawn(player);
  if (e.code === 'KeyC' && !e.repeat) state.camMode = (state.camMode + 1) % 2;
  if (e.code === 'Enter' && !$('menu').classList.contains('hidden') && !$('startBtn').classList.contains('hidden')) startRace();
});
addEventListener('keyup', e => { keys[e.code] = false; });
// options (kid-friendly assists), remembered per browser
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const OPTS = (() => {
  let o = {};
  try { o = JSON.parse(localStorage.getItem('rocaKartOpts') || '{}'); } catch { /* storage blocked */ }
  return { autoGas: o.autoGas ?? IS_TOUCH, assist: o.assist ?? IS_TOUCH, char: o.char ?? 'maxi' };
})();
const saveOpts = () => { try { localStorage.setItem('rocaKartOpts', JSON.stringify(OPTS)); } catch { /* ignore */ } };

// on-screen touch buttons: each [data-k] button holds a key code while pressed
function setupTouch() {
  const root = $('touch');
  if (IS_TOUCH) document.body.classList.add('is-touch');
  root.querySelectorAll('[data-k]').forEach(btn => {
    const code = btn.dataset.k;
    const down = e => {
      e.preventDefault(); btn.setPointerCapture?.(e.pointerId); btn.classList.add('on'); keys[code] = true;
      if (code === 'KeyE' && state.mode === 'race') useItem(player);
    };
    const up = e => { e.preventDefault(); btn.classList.remove('on'); keys[code] = false; };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  });
  for (const [id, key] of [['optGas', 'autoGas'], ['optAssist', 'assist']]) {
    const cb = $(id); cb.checked = OPTS[key];
    cb.addEventListener('change', () => { OPTS[key] = cb.checked; saveOpts(); });
  }
}

// character select cards on the menu
function setupCharSelect() {
  const wrap = $('chars');
  const render = () => {
    wrap.innerHTML = Object.entries(CHARACTERS).map(([id, c]) => `
      <button class="char ${OPTS.char === id ? 'sel' : ''}" data-id="${id}">
        <img src="${c.img}" alt="${c.name}">
        <b>${c.name}</b><small>${c.machine}</small>
        <span class="stats">${Object.entries(c.stats).map(([k, v]) => `<i>${k}</i><em>${'★'.repeat(v)}${'☆'.repeat(5 - v)}</em>`).join('')}</span>
      </button>`).join('');
    wrap.querySelectorAll('.char').forEach(b => b.onclick = () => {
      OPTS.char = b.dataset.id; saveOpts(); render(); resetRace(); audio.beep(660, 0.08);
    });
  };
  render();
}

// lane-keeping helper: steer toward a point ahead on the track at the current lateral offset
function assistSteer(k) {
  const look = Math.round((8 + Math.max(0, k.speed) * 0.5) / SPACING);
  const lat = clamp(k.lat, -CFG.halfW + 2.5, CFG.halfW - 2.5);
  const target = trackPoint(k.idx + look, lat);
  const diff = wrapAngle(Math.atan2(target.x - k.pos.x, target.z - k.pos.z) - k.heading);
  return clamp(diff * 2.2, -1, 1);
}

const playerInput = () => {
  const brake = keys.KeyS || keys.ArrowDown ? 1 : 0;
  let steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  if (OPTS.assist && player && player.speed > 2 && player.spin <= 0) {
    const a = assistSteer(player);
    steer = steer !== 0 ? clamp(steer + (player.offroad ? a * 0.6 : 0), -1, 1) : a * 0.85;
  }
  return {
    throttle: keys.KeyW || keys.ArrowUp || ((OPTS.autoGas || IS_TOUCH) && state.mode === 'race' && !brake) ? 1 : 0,
    brake, steer, drift: !!keys.Space,
  };
};

function respawn(k) {
  const i = nearestLocal(k.pos, k.idx);
  k.pos.copy(trackPoint(i, 0)); k.heading = k.moveDir = headingOf(S[i].t); k.speed = 0; k.spin = 0; k.drifting = false;
}

// ------------------------------------------------------------------ AI
function aiInput(k, dt) {
  const ai = k.ai;
  ai.laneT += dt * 0.25;
  const lane = ai.lane + Math.sin(ai.laneT) * 2.5;
  const look = Math.round((9 + k.speed * 0.55) / SPACING);
  const target = trackPoint(k.idx + look, clamp(lane, -5.5, 5.5));
  // dodge visible hazards ahead
  for (const h of hazards) {
    const d = h.pos.distanceTo(k.pos);
    if (h.type === 'bale' && d < 25) {
      const toH = h.pos.clone().sub(k.pos), fwd = new THREE.Vector3(Math.sin(k.heading), 0, Math.cos(k.heading));
      if (toH.dot(fwd) > 0) { const side = toH.dot(S[k.idx].l) > 0 ? -1 : 1; target.addScaledVector(S[k.idx].l, side * 3.5); }
    }
  }
  const desired = Math.atan2(target.x - k.pos.x, target.z - k.pos.z);
  const diff = wrapAngle(desired - k.heading);
  // look further ahead to judge the corner
  const far = S[sIdx(k.idx + Math.round(35 / SPACING))].t, cornerSharp = 1 - far.dot(S[k.idx].t);
  // rubber band relative to player
  const gap = (player.lap * CFG.N + player.idx) - (k.lap * CFG.N + k.idx);
  let skill = ai.skill + clamp(gap / CFG.N * 0.5, -0.08, 0.12);
  if (state.mode !== 'race') skill = ai.skill;
  const input = { throttle: 1, brake: 0, steer: clamp(diff * 2.4, -1, 1), drift: false, skill };
  if (cornerSharp > 0.35 && k.speed > 24) input.throttle = 0.4;
  if (Math.abs(diff) > 0.9 && k.speed > 12) { input.brake = 1; input.throttle = 0; }
  // AI drift in medium corners for mini-turbos
  const nearEdge = Math.abs(k.lat) > CFG.halfW - 1.5;
  if (cornerSharp > 0.12 && Math.abs(diff) > 0.12 && k.speed > 18 && !nearEdge) ai.driftT = 0.9;
  if (nearEdge || (k.drifting && input.steer * k.driftDir < -0.3)) ai.driftT = 0;
  ai.driftT -= dt; input.drift = ai.driftT > 0;
  // anti-stuck: respawn on the racing line if no progress for 3 s
  ai.stuckT = (ai.stuckT ?? 0) + dt;
  if (ai.stuckT > 3) {
    const prog = k.lap * CFG.N + k.idx;
    if (state.mode === 'race' && ai.lastProg !== undefined && prog - ai.lastProg < 20 && !k.finished) respawn(k);
    ai.lastProg = prog; ai.stuckT = 0;
  }
  // items
  if (k.item && k.rolling <= 0) {
    ai.itemDelay -= dt;
    if (ai.itemDelay <= 0) {
      let use = false;
      if (k.item === 'turbo') use = cornerSharp < 0.05;
      else if (k.item === 'bale') use = karts.some(o => o !== k && o.pos.distanceTo(k.pos) < 18 && (o.lap * CFG.N + o.idx) < (k.lap * CFG.N + k.idx));
      else if (k.item === 'tomato') use = karts.some(o => {
        if (o === k) return false; const d = (o.lap * CFG.N + o.idx) - (k.lap * CFG.N + k.idx);
        return d > 0 && d * SPACING < 45;
      });
      if (use || ai.itemDelay < -8) { useItem(k); ai.itemDelay = rr(1, 4); }
    }
  }
  return input;
}

// ------------------------------------------------------------------ kart physics
const tmpV = new THREE.Vector3();
function updateKart(k, input, dt, frozen) {
  if ((k.finished || k.autopilot) && k.isPlayer) input = aiInput(k, dt); // autopilot after finishing (or debug)
  if (frozen) input = { ...input, throttle: 0, brake: 0, steer: 0, drift: false };
  if (k.spin > 0) { k.spin -= dt; k.spinAng += dt * 14; input = { throttle: 0, brake: 0, steer: 0, drift: false }; }
  else k.spinAng = lerp(k.spinAng, Math.round(k.spinAng / (Math.PI * 2)) * Math.PI * 2, damp(10, dt));

  // surface
  k.idx = nearestLocal(k.pos, k.idx);
  const s = S[k.idx];
  k.lat = tmpV.subVectors(k.pos, s.p).dot(s.l);
  k.offroad = Math.abs(k.lat) > CFG.halfW + 0.9;
  k.inMud = muds.some(m => {
    const dx = k.pos.x - m.p.x, dz = k.pos.z - m.p.z, c = Math.cos(m.h), sn = Math.sin(m.h);
    const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
    return (lx / m.rx) ** 2 + (lz / m.rz) ** 2 < 1;
  });
  for (const p of pads) if ((k.pos.x - p.p.x) ** 2 + (k.pos.z - p.p.z) ** 2 < p.r * p.r * 2.2) {
    if (k.boost < 0.9 && k.isPlayer) audio.sweep(300, 1200, 0.35);
    k.boost = Math.max(k.boost, 1.1);
  }

  const ch = k.v.ch;
  let max = CFG.maxSpeed * (input.skill ?? 1) * ch.speedMul;
  if (k.offroad) max *= CFG.offroadFactor;
  if (k.inMud) max *= CFG.mudFactor;
  if (k.boost > 0) { max = CFG.boostSpeed * (k.inMud ? 0.8 : 1); k.boost -= dt; }

  // longitudinal
  const accel = k.boost > 0 ? 45 : 15 * ch.accelMul;
  if (input.throttle > 0 && k.speed >= -0.5) {
    if (k.speed < max) k.speed += accel * input.throttle * dt * (1 - 0.55 * clamp(k.speed / max, 0, 1));
  }
  if (input.brake > 0) {
    if (k.speed > 0.5) k.speed -= 34 * dt;
    else k.speed = Math.max(k.speed - 12 * dt, -9);
  } else if (input.throttle > 0 && k.speed < 0) k.speed += 30 * dt;
  if (!input.throttle && !input.brake) k.speed -= Math.sign(k.speed) * Math.min(Math.abs(k.speed), 7 * dt);
  if (k.speed > max) k.speed = Math.max(max, k.speed - (k.offroad || k.inMud ? 40 : 18) * dt);

  // drifting
  const absV = Math.abs(k.speed);
  if (input.drift && !k.drifting && Math.abs(input.steer) > 0.25 && k.speed > 13 && k.spin <= 0) {
    k.drifting = true; k.driftDir = Math.sign(input.steer); k.driftCharge = 0; k.hop = 0.22;
  }
  if (k.drifting && (!input.drift || k.speed < 9 || k.spin > 0)) {
    k.drifting = false;
    if (k.spin <= 0) {
      if (k.driftCharge > 2.1) { k.boost = Math.max(k.boost, 1.25); if (k.isPlayer) audio.sweep(300, 1300, 0.45); }
      else if (k.driftCharge > 1.0) { k.boost = Math.max(k.boost, 0.65); if (k.isPlayer) audio.sweep(300, 900, 0.3); }
    }
    k.driftCharge = 0;
  }
  k.steer = lerp(k.steer, input.steer, damp(12, dt));
  const sf = clamp(absV / 6, 0, 1) * (1 - 0.32 * Math.min(1, absV / 40));
  let turn = k.steer * 1.9 * ch.turnMul * sf * (k.speed < 0 ? -1 : 1);
  if (k.drifting) {
    turn = (k.driftDir * 1.05 + k.steer * 0.75) * sf;
    k.driftCharge += dt * (k.steer * k.driftDir > 0.2 ? 1.5 : 0.8);
  }
  k.heading = wrapAngle(k.heading + turn * dt);
  const grip = k.drifting ? 2.6 : (k.offroad ? 7 : 10);
  k.moveDir = lerpAngle(k.moveDir, k.heading, damp(grip, dt));
  k.pos.x += Math.sin(k.moveDir) * k.speed * dt;
  k.pos.z += Math.cos(k.moveDir) * k.speed * dt;

  // fence wall
  {
    const i = nearestLocal(k.pos, k.idx, 10), s2 = S[i];
    const lat = tmpV.subVectors(k.pos, s2.p).dot(s2.l);
    if (Math.abs(lat) > WALL - 1.2) {
      const over = Math.abs(lat) - (WALL - 1.2);
      k.pos.addScaledVector(s2.l, -Math.sign(lat) * over);
      if (k.bumpCd <= 0 && absV > 8) { k.speed *= 0.55; k.bumpCd = 0.4; if (k.isPlayer) audio.beep(90, 0.12, 'sawtooth', 0.2); }
      const th = headingOf(s2.t) * (Math.cos(k.heading - headingOf(s2.t)) > 0 ? 1 : 1);
      if (Math.cos(k.heading - th) > 0) k.heading = lerpAngle(k.heading, th, 0.15);
    }
  }
  // static colliders
  for (const c of colliders) {
    const dx = k.pos.x - c.x, dz = k.pos.z - c.z, rr2 = c.r + 1.3, d2 = dx * dx + dz * dz;
    if (d2 < rr2 * rr2) {
      const d = Math.sqrt(d2) || 0.01; k.pos.x = c.x + dx / d * rr2; k.pos.z = c.z + dz / d * rr2;
      if (k.bumpCd <= 0 && absV > 6) { k.speed *= 0.5; k.bumpCd = 0.4; if (k.isPlayer) audio.beep(110, 0.12, 'sawtooth', 0.2); }
    }
  }
  k.bumpCd -= dt;

  // item boxes
  for (const b of itemBoxes) if (b.active && (k.pos.x - b.p.x) ** 2 + (k.pos.z - b.p.z) ** 2 < 2.4 ** 2) {
    b.active = false; b.timer = 2.5; b.g.visible = false;
    for (let n = 0; n < 14; n++) particles.emit(b.p.x, 1, b.p.z, rr(-5, 5), rr(2, 7), rr(-5, 5), ['#FFE066', '#FF9F1C', '#fff'][n % 3], 0.5, 0.7, 0.2, 10);
    if (!k.item && k.rolling <= 0) {
      k.rolling = k.isPlayer ? 1.1 : 0.6;
      const r = Math.random(), behind = k.place > 3;
      k.pendingItem = behind ? (r < 0.5 ? 'turbo' : r < 0.8 ? 'tomato' : 'bale') : (r < 0.25 ? 'turbo' : r < 0.6 ? 'tomato' : 'bale');
      if (k.isPlayer) audio.beep(880, 0.08);
    }
  }
  if (k.rolling > 0) { k.rolling -= dt; if (k.rolling <= 0) { k.item = k.pendingItem; if (k.isPlayer) audio.beep(1320, 0.12); } }

  // laps
  const prev = k.prevIdx ?? k.idx;
  k.idx = nearestLocal(k.pos, k.idx);
  if (prev > CFG.N * 0.85 && k.idx < CFG.N * 0.15) {
    if (k.lap === 0 || k.maxIdx > CFG.N * 0.5) { k.lap++; k.maxIdx = 0; onLap(k); }
  } else if (prev < CFG.N * 0.15 && k.idx > CFG.N * 0.85 && k.lap > 0) {
    k.lap--; k.maxIdx = CFG.N; // drove backwards over the line
  }
  if (k.idx < CFG.N * 0.85) k.maxIdx = Math.max(k.maxIdx, k.idx);
  k.prevIdx = k.idx;

  // wrong way
  const fwdDot = Math.sin(k.heading) * S[k.idx].t.x + Math.cos(k.heading) * S[k.idx].t.z;
  k.wrongWay = fwdDot < -0.3 && absV > 4 ? k.wrongWay + dt : 0;

  // ---------- visuals
  const v = k.v;
  v.root.position.copy(k.pos); v.root.rotation.y = k.heading;
  k.hop = Math.max(0, k.hop - dt);
  k.driftVis = lerp(k.driftVis, k.drifting ? k.driftDir * 0.38 : 0, damp(8, dt));
  v.tilt.rotation.y = k.driftVis + k.spinAng;
  v.tilt.position.y = Math.sin(clamp(k.hop / 0.22, 0, 1) * Math.PI) * 0.45 + (k.offroad ? Math.sin(performance.now() * 0.04 + k.def.paint.length) * 0.03 : 0);
  v.tilt.rotation.z = -k.steer * clamp(absV / 30, 0, 1) * 0.06 - k.driftVis * 0.1;
  v.tilt.rotation.x = clamp(-(k.speed - (k.lastSpeed ?? k.speed)) / dt * 0.004, -0.06, 0.06);
  k.lastSpeed = k.speed;
  k.wheelRot -= k.speed * dt;
  v.wheels.RL.rotation.x = v.wheels.RR.rotation.x = k.wheelRot / v.wheelR.R;
  v.wheels.FL.rotation.x = v.wheels.FR.rotation.x = k.wheelRot / v.wheelR.F;
  v.wheels.FL.rotation.y = v.wheels.FR.rotation.y = k.steer * 0.45;
  if (v.beaconMat) v.beaconMat.emissiveIntensity = k.boost > 0 ? 3.5 : 1.2;

  // particles
  const back = new THREE.Vector3(-Math.sin(k.heading), 0, -Math.cos(k.heading));
  const side = new THREE.Vector3(Math.cos(k.heading), 0, -Math.sin(k.heading));
  if (absV > 6 && Math.random() < (k.offroad ? 0.7 : 0.3)) {
    for (const sd of [-1, 1]) {
      const x = k.pos.x + back.x * 1.8 + side.x * sd * 0.9, z = k.pos.z + back.z * 1.8 + side.z * sd * 0.9;
      const col = k.inMud ? '#5A3A1C' : k.offroad ? '#A7D77E' : '#D9B380';
      particles.emit(x, 0.3, z, back.x * 2 + rr(-1, 1), rr(0.5, 2), back.z * 2 + rr(-1, 1), col, k.inMud ? 0.45 : 0.5, 0.6, 1.4, k.inMud ? 8 : 0);
    }
  }
  if (k.drifting) {
    const col = k.driftCharge > 2.1 ? '#FF8C1A' : k.driftCharge > 1.0 ? '#4FC3F7' : '#FFFFFF';
    for (const sd of [-1, 1]) {
      const x = k.pos.x + back.x * 1.4 + side.x * sd * 1.0, z = k.pos.z + back.z * 1.4 + side.z * sd * 1.0;
      particles.emit(x, 0.25, z, rr(-2, 2), rr(1, 3), rr(-2, 2), col, 0.35, 0.25, 0.1, 8);
    }
  }
  const exh = v.ch.exhaust;
  if (k.boost > 0) {
    const ex = k.pos.clone().addScaledVector(back, exh.back).addScaledVector(side, exh.side);
    particles.emit(ex.x, exh.y, ex.z, rr(-0.5, 0.5), rr(3, 5), rr(-0.5, 0.5), Math.random() < 0.5 ? '#FF6B1A' : '#FFD23F', 0.55, 0.35, 1.2);
  } else if (Math.random() < 0.07) {
    const ex = k.pos.clone().addScaledVector(back, exh.back).addScaledVector(side, exh.side);
    particles.emit(ex.x, exh.y, ex.z, rr(-0.3, 0.3), 1.6, rr(-0.3, 0.3), '#6E6E6E', 0.2, 0.7, 1.4);
  }
}

function collideKarts() {
  for (let i = 0; i < karts.length; i++) for (let j = i + 1; j < karts.length; j++) {
    const a = karts[i], b = karts[j];
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d2 = dx * dx + dz * dz, R = 2.7;
    if (d2 < R * R && d2 > 1e-6) {
      const d = Math.sqrt(d2), push = (R - d) / 2, nx = dx / d, nz = dz / d;
      a.pos.x -= nx * push; a.pos.z -= nz * push; b.pos.x += nx * push; b.pos.z += nz * push;
      const avg = (a.speed + b.speed) / 2; a.speed = lerp(a.speed, avg, 0.3); b.speed = lerp(b.speed, avg, 0.3);
      if ((a.isPlayer || b.isPlayer) && (a.bumpCd <= 0)) { audio.beep(140, 0.08, 'square', 0.12); a.bumpCd = 0.3; }
    }
  }
}

// ------------------------------------------------------------------ race state & HUD
const state = { mode: 'menu', t: 0, raceTime: 0, countdown: 0, camMode: 0, finishOrder: [], lastBeep: 4 };
let player;
let camHeading = 0;
const fmt = t => { const m = Math.floor(t / 60), s = t % 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
let flashTimer = null;
function flash(text, ms = 1200, sub = '') {
  $('msg').textContent = text; $('sub').textContent = sub;
  $('msg').style.transform = 'scale(1.25)'; setTimeout(() => $('msg').style.transform = 'scale(1)', 120);
  clearTimeout(flashTimer); if (ms) flashTimer = setTimeout(() => { $('msg').textContent = ''; $('sub').textContent = ''; }, ms);
}
function onLap(k) {
  if (k.finished) return;
  if (k.lap > CFG.laps) {
    k.finished = true; k.finishTime = state.raceTime; state.finishOrder.push(k);
    if (k.isPlayer) {
      const p = state.finishOrder.length;
      flash(p === 1 ? '1º LUGAR! 🏆' : `${p}º lugar!`, 0, 'Fim de corrida');
      audio.beep(523, 0.15, 'square'); setTimeout(() => audio.beep(659, 0.15), 160); setTimeout(() => audio.beep(784, 0.3), 320);
      setTimeout(showResults, 3500);
    }
    return;
  }
  if (k.isPlayer && k.lap > 1) {
    if (k.lap === CFG.laps) { flash('VOLTA FINAL!', 1600); audio.beep(660, 0.1); setTimeout(() => audio.beep(880, 0.2), 120); }
    else flash(`Volta ${k.lap}`, 1000);
  }
}
function showResults() {
  state.mode = 'results';
  $('msg').textContent = ''; $('sub').textContent = '';
  const rest = karts.filter(k => !k.finished).sort((a, b) => b.lap * CFG.N + b.idx - (a.lap * CFG.N + a.idx));
  const order = [...state.finishOrder, ...rest];
  $('resTable').innerHTML = order.map((k, i) =>
    `<tr class="${k.isPlayer ? 'me' : ''}"><td><b>${i + 1}º</b></td><td><span class="dot" style="background:${k.def.paint}"></span> ${k.def.name}</td><td>${k.finished ? fmt(k.finishTime) : '—'}</td></tr>`).join('');
  const myPos = order.indexOf(player) + 1;
  $('resTitle').textContent = myPos === 1 ? 'Campeão da Roça!' : myPos <= 3 ? 'No pódio!' : 'Bora de novo!';
  $('results').classList.remove('hidden');
}

const mini = (() => {
  const c = $('minimap'), g = c.getContext('2d');
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  S.forEach(s => { x0 = Math.min(x0, s.p.x); x1 = Math.max(x1, s.p.x); z0 = Math.min(z0, s.p.z); z1 = Math.max(z1, s.p.z); });
  const sc = 140 / Math.max(x1 - x0, z1 - z0), ox = 85 - (x0 + x1) / 2 * sc, oz = 85 - (z0 + z1) / 2 * sc;
  // view from behind the start (north-up = +Z down): flip X so left/right matches the 3D view facing +Z
  const P = (x, z) => [170 - (ox + x * sc), 170 - (oz + z * sc)];
  return () => {
    g.clearRect(0, 0, 170, 170);
    g.lineJoin = 'round'; g.beginPath(); S.forEach((s, i) => { const [a, b] = P(s.p.x, s.p.z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath();
    g.strokeStyle = '#2b1a0e'; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#D9AE72'; g.lineWidth = 5; g.stroke();
    const [sx, sz] = P(S[0].p.x, S[0].p.z); g.fillStyle = '#fff'; g.fillRect(sx - 4, sz - 2, 8, 4);
    for (const k of [...karts].reverse()) {
      const [a, b] = P(k.pos.x, k.pos.z);
      g.beginPath(); g.arc(a, b, k.isPlayer ? 6 : 4.5, 0, 7); g.fillStyle = k.def.paint; g.fill();
      g.lineWidth = 2; g.strokeStyle = k.isPlayer ? '#fff' : '#2b1a0e'; g.stroke();
    }
  };
})();

function updateHUD() {
  const p = player;
  $('pos').innerHTML = `${p.place}<small>º/${karts.length}</small>`;
  $('lap').textContent = `Volta ${clamp(p.lap, 1, CFG.laps)}/${CFG.laps}`;
  $('time').textContent = fmt(p.finished ? p.finishTime : state.raceTime);
  $('speed').innerHTML = `${Math.round(Math.abs(p.speed) * 3.6)}<small> km/h</small>`;
  const rollingIcons = Object.values(ITEMS).map(i => i.icon);
  $('item').textContent = p.rolling > 0 ? rollingIcons[Math.floor(performance.now() / 80) % 3] : p.item ? ITEMS[p.item].icon : '';
  $('itemName').textContent = p.item && p.rolling <= 0 ? `${ITEMS[p.item].name} [E]` : '';
  if (p.wrongWay > 1.2 && !p.finished) { $('sub').textContent = '⚠ CONTRAMÃO! ⚠'; p.wwShown = true; }
  else if (p.wwShown) { $('sub').textContent = ''; p.wwShown = false; }
  mini();
}

function rankKarts() {
  const sorted = [...karts].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return (b.lap * CFG.N + b.idx) - (a.lap * CFG.N + a.idx);
  });
  sorted.forEach((k, i) => k.place = i + 1);
}

// ------------------------------------------------------------------ main loop
function startRace() {
  audio.init(); audio.ctx?.resume();
  $('menu').classList.add('hidden');
  state.mode = 'countdown'; state.countdown = 4.2; state.lastBeep = 5;
}
function resetRace() {
  for (const k of karts) scene.remove(k.v.root);
  karts.length = 0; state.finishOrder = []; state.raceTime = 0;
  for (const h of hazards) scene.remove(h.o); hazards.length = 0;
  for (const b of itemBoxes) { b.active = true; b.g.visible = true; }
  const mine = CHARACTERS[OPTS.char] ? OPTS.char : 'maxi';
  const defs = RACERS.map(d => ({ ...d }));
  defs[0].char = mine; defs[0].keepPaint = true;
  if (mine === 'imperador') Object.assign(defs[5], { name: 'Maxi', char: 'maxi', paint: '#F27A1C', keepPaint: true });
  defs.forEach((d, i) => createKart(d, i === 0 ? 5 : i - 1, i === 0)); // player starts last on the grid
  player = karts.find(k => k.isPlayer);
  // put player first in array for convenience
  karts.sort((a, b) => (b.isPlayer ? 1 : 0) - (a.isPlayer ? 1 : 0));
  camHeading = player.heading;
  rankKarts();
}

const clock = new THREE.Clock();
function frame() {
  update(Math.min(clock.getDelta(), 1 / 30));
  effect.render(scene, camera);
  requestAnimationFrame(frame);
}
function update(dt) {
  state.t += dt;
  const racing = state.mode === 'race' || state.mode === 'results';

  if (state.mode === 'countdown') {
    state.countdown -= dt;
    const n = Math.ceil(state.countdown - 1.2);
    if (n !== state.lastBeep && n >= 0 && n <= 3) {
      state.lastBeep = n;
      if (n > 0) { flash(String(n), 0); audio.beep(440, 0.18); }
    }
    // rocket start: throttle held in the window right before GO
    const thr = keys.KeyW || keys.ArrowUp;
    if (state.countdown < 1.2 + 1.0 && state.countdown > 1.2) player.startBoostArmed = !!thr && !player.startEarly;
    if (state.countdown > 1.2 + 1.0 && thr) player.startEarly = true;
    if (state.countdown <= 1.2) {
      state.mode = 'race'; flash('JÁ!', 900); audio.beep(880, 0.4);
      if (player.startBoostArmed) { player.boost = 1.3; player.speed = 14; flash('JÁ! TURBO!', 900); }
      for (const k of karts) if (!k.isPlayer && Math.random() < 0.5) { k.boost = 0.8; k.speed = 10; }
    }
  }

  if (racing) state.raceTime += dt;
  for (const k of karts) {
    const input = k.isPlayer ? playerInput() : aiInput(k, dt);
    updateKart(k, input, dt, !racing);
  }
  collideKarts();
  updateHazards(dt);
  rankKarts();
  if (state.mode === 'race' && karts.filter(k => !k.finished).length === 0) showResults();

  // item boxes spin/respawn
  for (const b of itemBoxes) {
    if (!b.active) { b.timer -= dt; if (b.timer <= 0) { b.active = true; b.g.visible = true; } }
    b.g.rotation.y += dt * 1.4; b.g.rotation.x = Math.sin(state.t * 1.3 + b.phase) * 0.25;
    b.g.position.y = 0.6 + Math.sin(state.t * 2 + b.phase) * 0.25;
  }
  animated.forEach(a => a.update(dt, state.t));
  updateCows(dt, state.t);
  clouds.forEach(c => { c.position.x += dt * 2; if (c.position.x > 560) c.position.x = -300; });
  particles.update(dt);
  audio.engine(player.speed, player.boost > 0);

  // camera
  const P = player;
  if (state.mode === 'menu') {
    const a = state.t * 0.12, c = S[0].p;
    camera.position.set(c.x + Math.sin(a) * 38, 16, c.z + Math.cos(a) * 38);
    camera.lookAt(c.x, 2, c.z);
  } else {
    camHeading = lerpAngle(camHeading, P.heading - P.driftVis * 0.4, damp(P.spin > 0 ? 1 : 5, dt));
    const portrait = camera.aspect < 1 ? 1.45 : 1; // phones held upright need a wider view
    const ch = P.v.ch;
    const dist = (state.camMode ? ch.camD + 4.5 : ch.camD) * portrait, height = (state.camMode ? ch.camH + 2.7 : ch.camH) * (portrait > 1 ? 1.3 : 1);
    const desired = new THREE.Vector3(P.pos.x - Math.sin(camHeading) * dist, height, P.pos.z - Math.cos(camHeading) * dist);
    if (state.mode === 'countdown') {
      const k = clamp((state.countdown - 1.2) / 3, 0, 1); // fly-in from the front
      const a = camHeading + Math.PI * k * 0.9;
      desired.set(P.pos.x - Math.sin(a) * (dist + k * 10), height + k * 5, P.pos.z - Math.cos(a) * (dist + k * 10));
      camera.position.lerp(desired, damp(4, dt));
    } else camera.position.lerp(desired, damp(9, dt));
    camera.lookAt(P.pos.x + Math.sin(camHeading) * 4, 1.8, P.pos.z + Math.cos(camHeading) * 4);
    const fov = (camera.aspect < 1 ? 74 : 62) + clamp(P.speed / CFG.maxSpeed, 0, 1.5) * 8 + (P.boost > 0 ? 8 : 0);
    camera.fov = lerp(camera.fov, fov, damp(4, dt)); camera.updateProjectionMatrix();
  }
  scene.userData.sky.position.copy(camera.position);
  const focus = state.mode === 'menu' ? S[0].p : P.pos;
  sun.position.copy(focus).add(SUN_OFFSET); sun.target.position.copy(focus);

  if (state.mode !== 'menu') updateHUD();
}

// ------------------------------------------------------------------ boot
(async () => {
  try {
    await loadAssets();
  } catch (e) {
    $('loading').textContent = 'Erro carregando modelos (abra via servidor: Jogar.bat). ' + e.message;
    throw e;
  }
  await document.fonts.ready.catch(() => {});
  buildGround(); buildRoad(); buildScenery(); buildPickups();
  resetRace();
  console.log(`Track length ${TRACK_LEN.toFixed(0)} m, ${scene.children.length} scene children`);
  $('loading').classList.add('hidden');
  $('startBtn').classList.remove('hidden');
  $('startBtn').onclick = startRace;
  $('againBtn').onclick = () => { $('results').classList.add('hidden'); resetRace(); startRace(); };
  setupTouch();
  setupCharSelect();
  const HUD_IDS = ['pos', 'lap', 'time', 'speed', 'item', 'itemName', 'minimap', 'help', 'touch'];
  for (const id of HUD_IDS) $(id).classList.add('hidden');
  const showHud = () => { for (const id of HUD_IDS) $(id).classList.remove('hidden'); };
  $('startBtn').addEventListener('click', showHud);
  addEventListener('keydown', e => { if (e.code === 'Enter') showHud(); });
  window.__game = { sim: (sec) => { for (let i = 0; i < sec * 60; i++) update(1 / 60); effect.render(scene, camera); }, state, karts, get player() { return player; }, S, CFG, keys }; // debug hook
  frame();
})();
