// Roça Kart — corrida arcade com máquinas inventadas da Oficina da Roça (cartoon).
// Models are built by the scripts in /blender and loaded as GLB. Screens live in ui.js,
// music/SFX in audio.js, player progress in save.js, track layouts in tracks.js.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { audio } from './audio.js';
import { profile, save, CATALOG, PRIZES, COIN_VALUE, paintColor } from './save.js';
import { TRACKS, trackById } from './tracks.js';
import { ui } from './ui.js';
import { applyBuild, applyImplementBuild } from './customize.js';
import { CUP, CHALLENGES, freshMetrics, awardProgress } from './events.js';
import { GhostRun } from './ghost.js';

// ================================================================== config & game data
const CFG = {
  laps: 3, halfW: 8, margin: 7, maxSpeed: 30, boostSpeed: 42,
  offroadFactor: 0.55, mudFactor: 0.5, N: 2000, gravity: 26,
};
const WALL = CFG.halfW + CFG.margin;
const BOOM_FOLDED = 1.25;

export const CHARACTERS = {
  tatu: {
    name: 'Tatu', machine: 'Trator de oficina', asset: 'tatu', img: 'assets/ui/tatu.png',
    stats: { Velocidade: 3, Arrancada: 4, Curva: 4, Peso: 3 },
    speedMul: 1, accelMul: 1, turnMul: 1, camH: 4.3, camD: 9.5, exhaust: { side: -0.64, back: 0.15, y: 2.56 },
    tows: true, hitch: { back: 2.05, y: 0.64 },
    mount: { roof: [0, 2.93, 0.8], eyes: [0, 1.39, -2.1], eyeScale: 1 },
    line: 'Eu sou o Tatu, trator da oficina! Bora correr, pessoal!',
  },
  pingo: {
    name: 'Pingo', machine: 'Buggy de irrigação', asset: 'pingo', img: 'assets/ui/pingo.png',
    stats: { Velocidade: 5, Arrancada: 2, Curva: 2, Peso: 5 },
    speedMul: 1.06, accelMul: 0.85, turnMul: 0.86, camH: 5.6, camD: 11.5, exhaust: { side: 0, back: 2.3, y: 2.6 },
    tows: false, ability: 'barras',
    mount: { roof: [0.15, 3.32, 0.85], eyes: [0, 1.25, -1.72], eyeScale: 1 },
    line: 'Sou o Pingo! Uma chuvinha para refrescar essa corrida!',
  },
  pipoca: {
    name:'Pipoca',machine:'Mini colheitadeira',asset:'pipoca',img:'assets/ui/pipoca.png',
    personality:'Pequena, elétrica e sempre pronta para saltar!',stats:{Velocidade:3,Arrancada:5,Curva:5,Peso:2},
    speedMul:.96,accelMul:1.15,turnMul:1.13,camH:4,camD:9,exhaust:{side:.9,back:.9,y:2.6},
    tows:false,ability:'arrancada',mount:{roof:[0,2.76,.05],eyes:[0,2.02,-1.02],eyeScale:.8},
    line:'Sou a Pipoca! Pequena na oficina, gigante nas curvas!',
  },
  bento: {
    name:'Bento',machine:'Caminhão graneleiro',asset:'bento',img:'assets/ui/bento.png',
    personality:'Um grandalhão tranquilo, firme nas retas.',stats:{Velocidade:4,Arrancada:2,Curva:3,Peso:5},
    speedMul:1.03,accelMul:.86,turnMul:.93,camH:4.4,camD:10,exhaust:{side:.75,back:1.5,y:1.7},
    tows:false,ability:'arrancada',mount:{roof:[0,2.55,-1],eyes:[0,1.77,-1.96],eyeScale:1},
    line:'Bento na área! Essa carga vai chegar no pódio!',
  },
};
export const IMPLEMENTS = {
  none: { name: 'Sem implemento', machine: 'Trator leve e solto', img: 'assets/ui/tatu.png', ability: 'arrancada',
          accelMul: 1, turnMul: 1, perk: 'Leve: arranca e curva melhor' },
  broto: { name: 'Broto', machine: 'Plantadeira', asset: 'broto', img: 'assets/ui/broto.png', ability: 'plantio',
              accelMul: 0.92, turnMul: 0.95, len: 2.2, perk: 'Mudinhas atrapalham quem vem colado',
              line: 'E eu sou o Broto! Planto um girassol no caminho de quem vem atrás!' },
};
export const ABILITIES = {
  arrancada: { icon: '💨', name: 'Arrancada Turbo' },
  plantio: { icon: '🌻', name: 'Plantio Relâmpago' },
  barras: { icon: '💦', name: 'Chuva de Pingo' },
};
const RIVALS = [
  { name: 'Zé do Milho', paint: '#D62F2F', char: 'tatu', impl: 'broto', acc: 'straw' },
  { name: 'Dona Cida', paint: '#2E9E4F', char: 'tatu', acc: 'flower' },
  { name: 'Bento', paint: '#7895C2', char: 'bento', acc: 'cap' },
  { name: 'Pipoca', paint: '#F2C21C', char: 'pipoca', acc: 'glasses' },
  { name: 'Pingo', paint: '#8E44AD', char: 'pingo', keepPaint: true },
];

// ================================================================== helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
let seed = 1234;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();
const $ = id => document.getElementById(id);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (profile.opts.assist === null) profile.opts.assist = IS_TOUCH;
if (profile.opts.autoGas === null) profile.opts.autoGas = IS_TOUCH;

// ================================================================== renderer / scenes
const renderer = new THREE.WebGLRenderer({ antialias:true,powerPreference:'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
function applyQuality() {
  const hi = !IS_TOUCH && profile.opts.quality !== 'baixa';
  const mobileScale=profile.opts.quality==='baixa'?1:Math.min(devicePixelRatio,1.35);
  const mobileBudget=profile.opts.quality==='baixa'?900000:1500000;
  renderer.setPixelRatio(IS_TOUCH ? Math.min(mobileScale,Math.sqrt(mobileBudget/(innerWidth*innerHeight))) : hi ? Math.min(devicePixelRatio, 2) : 1);
  renderer.shadowMap.enabled = hi;
  renderer.setSize(innerWidth, innerHeight);
}
applyQuality();
const effect = new OutlineEffect(renderer, { defaultThickness: 0.0032, defaultColor: [0.12, 0.07, 0.03] });
const renderScene=(scene,camera)=>(IS_TOUCH || profile.opts.quality==='baixa'?renderer:effect).render(scene,camera);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#D6F0FF', 260, 820);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.5, 2000);
addEventListener('resize', () => {
  camera.aspect = showCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); showCam.updateProjectionMatrix();
  applyQuality();
});
const NO_OUTLINE = { outlineParameters: { visible: false } };

const sky = (() => {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, userData: NO_OUTLINE,
    uniforms: { top: { value: new THREE.Color('#3D9BEA') }, bottom: { value: new THREE.Color('#D6F0FF') } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = clamp(vP.y * 2.2 + 0.05, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat);
  m.renderOrder = -1; scene.add(m); return m;
})();
const hemi = new THREE.HemisphereLight('#FFFFFF', '#6E9F3A', 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight('#FFF1D6', 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 300 });
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
let SUN_OFFSET = new THREE.Vector3(-60, 110, -40);

// garage showroom (separate scene)
const showScene = new THREE.Scene();
showScene.background = new THREE.Color('#C9A06A');
const showCam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.3, 200);
showScene.add(new THREE.HemisphereLight('#FFF4E0', '#6B4A2A', 1.4));
{
  const key = new THREE.DirectionalLight('#FFF1D6', 2.4); key.position.set(6, 12, -8); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  // same light setup as the race scene (1 hemisphere + 1 shadow-casting directional): materials are
  // shared between both scenes and three.js only recompiles them when the light *count* changes
  showScene.add(key, key.target);
}
const showRoot = new THREE.Group(); showScene.add(showRoot);
const showSpin = new THREE.Group(); showScene.add(showSpin);

// toon materials
const gradMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 185, 185, 185, 255, 255, 255, 255, 255]), 3, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toonCache = new Map();
function toonOf(m) {
  if (toonCache.has(m)) return toonCache.get(m);
  const Material=IS_TOUCH?THREE.MeshLambertMaterial:THREE.MeshStandardMaterial;
  const t = new Material({
    name: m.name, color: m.color ? m.color.clone() : new THREE.Color('#fff'), map: m.map || null,
    ...(IS_TOUCH?{}:{roughness:m.roughness??.65,metalness:m.metalness??0}),
    emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0), emissiveIntensity: m.emissiveIntensity ?? 1,
  });
  toonCache.set(m, t); return t;
}
const toonify = root => { root.traverse(o => { if (o.isMesh) o.material = toonOf(o.material); }); return root; };
const toonColor = (hex, extra = {}) => new THREE.MeshToonMaterial({ color: hex, gradientMap: gradMap, ...extra });

// ================================================================== assets
const ASSETS = ['tatu', 'corn', 'wheat', 'sunflower', 'hay', 'haysq', 'barn', 'silo', 'fence', 'tree', 'pine', 'bush',
  'rock', 'cow', 'scarecrow', 'windmill', 'gate', 'cloud', 'itembox', 'pingo', 'broto', 'ramp', 'coin', 'podium',
  'garage', 'soy', 'cerrado_tree', 'acc_straw', 'acc_cap', 'acc_crown', 'acc_flower', 'acc_flag', 'acc_glasses',
  'broto_hoppers_seed', 'broto_hoppers_barrel', 'broto_hoppers_crate',
  'broto_wheels_small', 'broto_wheels_wide', 'broto_wheels_double', 'pipoca','bento',
  'course_milharal','course_girassol','course_cerrado','course_feira',
  'race_barn','race_bridge','race_canyon','race_tunnel','race_stall','race_mill','race_shortcut',
  'race_curve_left','race_curve_right','race_sign_jump','race_sign_route','race_edge_marker',
  'tatu_hood_box','tatu_hood_round','tatu_roof_cage','tatu_bumper_double'];
const A = {};
const assetGeometries=new Set(),assetMaterials=new Set(),assetTextures=new Set();
let courseLayouts={};
async function loadAssets(onProgress) {
  const loader = new GLTFLoader();
  let done = 0;
  await Promise.all(ASSETS.map(n => loader.loadAsync(`assets/${n}${IS_TOUCH&&!n.startsWith('course_')?'_mobile':''}.glb`).then(g => {
    A[n] = toonify(g.scene); onProgress?.(++done / ASSETS.length);
    A[n].traverse(o=>{if(!o.isMesh)return;assetGeometries.add(o.geometry);assetMaterials.add(o.material);for(const value of Object.values(o.material))if(value?.isTexture)assetTextures.add(value);});
  })));
  const response=await fetch('assets/course-layouts.json');
  if(!response.ok) throw Error('Não foi possível carregar os traçados das pistas.');
  courseLayouts=await response.json();
}

// ================================================================== world (rebuilt per track)
let world = new THREE.Group(); scene.add(world);
let TRACK = TRACKS[0], THEME = TRACK.theme;
let S = [], TRACK_LEN = 1, SPACING = 1, grid = new Map(), branchGrid=new Map(), WB = { x0: 0, z0: 0, size: 600 };
let plots = [], colliders = [], animated = [], clouds = [], cows = [];
let itemBoxes = [], pads = [], muds = [], ramps = [], coinsOnTrack = [], podiumSpot = null;
const sIdx = i => ((i % CFG.N) + CFG.N) % CFG.N;
const GRID = 20;
const trackPoint = (i, lat = 0) => {
  const sample=S[sIdx(i)];
  return sample.p.clone().addScaledVector(sample.l,lat).add(new THREE.Vector3(0,Math.tan(sample.bank??0)*lat,0));
};
const headingOf = v => Math.atan2(v.x, v.z);

function computeTrack(def) {
  const curve = new THREE.CatmullRomCurve3(def.ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const layout=courseLayouts[def.id];
  TRACK_LEN = layout?.length ?? curve.getLength();
  const pts = layout ? layout.samples.map(p=>new THREE.Vector3(p[0],p[1],p[2])) : curve.getSpacedPoints(CFG.N);
  S = [];
  for (let i = 0; i < CFG.N; i++) {
    const p = pts[i], q = pts[(i + 1) % CFG.N], t = new THREE.Vector3().subVectors(q, p).normalize();
    t.y=0;t.normalize();
    S.push({ p, t, l: new THREE.Vector3(t.z, 0, -t.x),bank:layout?.samples[i][3]??0 });
  }
  for (let i = 0; i < CFG.N; i++) {
    const a = S[(i - 3 + CFG.N) % CFG.N].p, b = S[(i + 3) % CFG.N].p;
    S[i].t.subVectors(b, a).setY(0).normalize(); S[i].l.set(S[i].t.z, 0, -S[i].t.x);
  }
  SPACING = TRACK_LEN / CFG.N;
  grid = new Map();
  S.forEach((s, i) => {
    const k = `${Math.floor(s.p.x / GRID)},${Math.floor(s.p.z / GRID)}`;
    if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i);
  });
  branchGrid=new Map();
  for(const route of layout?.branches??[])for(let i=0;i<route.samples.length-1;i++){
    const a=route.samples[i],b=route.samples[i+1],pad=route.width+13;
    for(let x=Math.floor((Math.min(a[0],b[0])-pad)/GRID);x<=Math.floor((Math.max(a[0],b[0])+pad)/GRID);x++)
      for(let z=Math.floor((Math.min(a[2],b[2])-pad)/GRID);z<=Math.floor((Math.max(a[2],b[2])+pad)/GRID);z++){
        const key=`${x},${z}`;if(!branchGrid.has(key))branchGrid.set(key,[]);branchGrid.get(key).push({route,i});
      }
  }
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  S.forEach(s => { x0 = Math.min(x0, s.p.x); x1 = Math.max(x1, s.p.x); z0 = Math.min(z0, s.p.z); z1 = Math.max(z1, s.p.z); });
  const size = Math.ceil((Math.max(x1 - x0, z1 - z0) + 380) / 40) * 40;
  WB = { x0: Math.floor(((x0 + x1) / 2 - size / 2) / 40) * 40, z0: Math.floor(((z0 + z1) / 2 - size / 2) / 40) * 40, size };
}
function courseSurface(pos) {
  // A shortcut's equivalent progress index is not its nearest main-road segment.
  const near=trackDist(pos.x,pos.z,false), base=near.i>=0?near.i:0;
  let best=null;
  const segment=(a,b,indexA,indexB,width,route=null,uA=0,uB=1)=>{
    const dx=b[0]-a[0],dz=b[2]-a[2],length2=dx*dx+dz*dz;
    const u=clamp(((pos.x-a[0])*dx+(pos.z-a[2])*dz)/Math.max(.001,length2),0,1);
    const x=a[0]+dx*u,z=a[2]+dz*u,d2=(pos.x-x)**2+(pos.z-z)**2;
    if(best && d2>=best.d2) return;
    const len=Math.sqrt(length2)||1,t=new THREE.Vector3(dx/len,0,dz/len),l=new THREE.Vector3(t.z,0,-t.x);
    const lat=(pos.x-x)*l.x+(pos.z-z)*l.z,bank=(a[3]??0)*(1-u)+(b[3]??0)*u;
    best={d2,p:new THREE.Vector3(x,a[1]+(b[1]-a[1])*u,z),t,l,lat,bank,width,index:sIdx(Math.round(indexA+(indexB-indexA)*u)),route,routeU:uA+(uB-uA)*u};
  };
  for(const raw of [base-1,base]) {
    const i=sIdx(raw),j=sIdx(i+1),a=S[i],b=S[j];
    segment([a.p.x,a.p.y,a.p.z,a.bank],[b.p.x,b.p.y,b.p.z,b.bank],i,i+1,CFG.halfW);
  }
  for(const {route,i} of branchGrid.get(`${Math.floor(pos.x/GRID)},${Math.floor(pos.z/GRID)}`)??[]) {
    segment(route.samples[i],route.samples[i+1],route.start*CFG.N+(route.end-route.start)*CFG.N*i/100,route.start*CFG.N+(route.end-route.start)*CFG.N*(i+1)/100,route.width,route,i/100,(i+1)/100);
  }
  best.height=best.p.y+Math.tan(best.bank)*best.lat;
  const shoulder=best.route?best.width:10.4,outer=best.route?best.width+8:18;
  if(Math.abs(best.lat)>shoulder) best.height=(best.p.y+Math.tan(best.bank)*Math.sign(best.lat)*shoulder)*clamp((outer-Math.abs(best.lat))/(outer-shoulder),0,1);
  return best;
}
function drivingTarget(k,meters,lat=0) {
  if(k.route) {
    const points=k.route.samples,last=points.length-1;
    let n=clamp(k.routeU,0,1)*last,i=Math.min(last-1,Math.floor(n));
    let p=new THREE.Vector3(...points[i].slice(0,3)).lerp(new THREE.Vector3(...points[i+1].slice(0,3)),n-i);
    for(let j=i+1;j<=last;j++) {
      const q=new THREE.Vector3(...points[j].slice(0,3)),distance=p.distanceTo(q);
      if(distance>=meters) return p.lerp(q,meters/Math.max(.001,distance));
      meters-=distance;p=q;
    }
    return trackPoint(Math.round(k.route.end*CFG.N+meters/SPACING),lat);
  }
  return trackPoint(k.idx+Math.round(meters/SPACING),lat);
}
function trackDist(x, z, includeBranches=true) {
  const gx = Math.floor(x / GRID), gz = Math.floor(z / GRID);
  let best = 1e9, bi = -1;
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
    const arr = grid.get(`${gx + a},${gz + b}`); if (!arr) continue;
    for (const i of arr) { const p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
  }
  if(bi<0) S.forEach((s,i)=>{const d=(s.p.x-x)**2+(s.p.z-z)**2;if(d<best){best=d;bi=i;}});
  if(includeBranches) for(const route of courseLayouts[TRACK.id]?.branches??[]) for(let j=0;j<route.samples.length;j+=2) {
    const p=route.samples[j],d=(p[0]-x)**2+(p[2]-z)**2;
    if(d<best) {best=d;bi=sIdx(Math.round((route.start+(route.end-route.start)*j/100)*CFG.N));}
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
// samples on the straightest stretches (for ramps, pads and coin lines): rank every sample by how
// little the road turns in the 45 m before/after it, then pick greedily keeping a minimum gap
function straights(minGap, avoid = [], minScore = 0.9) {
  const look = Math.round(45 / SPACING), cand = [];
  for (let i = 0; i < CFG.N; i += 6) {
    const a = S[sIdx(i - look)].t, b = S[i].t, c = S[sIdx(i + look)].t;
    const score = Math.min(a.dot(b), b.dot(c));
    if (score > minScore && i > 60 && i < CFG.N - 60) cand.push([i, score]);
  }
  cand.sort((x, y) => y[1] - x[1]);
  const picked = [];
  const far = (i, j) => Math.min(Math.abs(i - j), CFG.N - Math.abs(i - j)) > minGap;
  const clear = (i, j) => Math.min(Math.abs(i - j), CFG.N - Math.abs(i - j)) > 90; // keep off other features
  for (const [i] of cand) if (picked.every(j => far(i, j)) && avoid.every(j => clear(i, j))) picked.push(i);
  return picked.sort((a, b) => a - b);
}

function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const speckle = (g, w, h, n, cols, smin = 2, smax = 5) => {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; const s = rr(smin, smax); g.fillRect(rnd() * w, rnd() * h, s, s); }
};
const _m = new THREE.Matrix4();
function instance(root, matrices, { shadow = false } = {}) {
  if (!matrices.length) return;
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh) return;
    const mat = o.material.clone(); mat.userData = NO_OUTLINE;
    const im = new THREE.InstancedMesh(o.geometry, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, _m.multiplyMatrices(m, o.matrixWorld)));
    im.instanceMatrix.needsUpdate = true; im.castShadow = shadow; im.computeBoundingSphere();
    world.add(im);
  });
}
const mtx = (x, z, rotY = 0, s = 1, y = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(s, s, s));
function place(name, x, z, rotY = 0, s = 1, { shadow = true, parent = world } = {}) {
  const o = A[name].clone(true);
  o.position.set(x, 0, z); o.rotation.y = rotY; o.scale.setScalar(s);
  o.traverse(c => { if (c.isMesh) { c.castShadow = shadow; c.receiveShadow = true; } });
  parent.add(o);
  return o;
}

function applyTheme(t) {
  sky.material.uniforms.top.value.set(t.skyTop); sky.material.uniforms.bottom.value.set(t.horizon);
  scene.fog.color.set(t.horizon); scene.fog.near = t.fogNear; scene.fog.far = t.fogFar;
  sun.color.set(t.sun); sun.intensity = t.sunInt; SUN_OFFSET = new THREE.Vector3(...t.sunOffset);
  hemi.color.set(t.hemiSky); hemi.groundColor.set(t.hemiGround); hemi.intensity = t.hemiInt;
}

function disposeTrack() {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  world.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  for(const geometry of geometries)if(!assetGeometries.has(geometry))geometry.dispose();
  for(const material of materials)if(!assetMaterials.has(material)){
    for(const value of Object.values(material))if(value?.isTexture&&!assetTextures.has(value))textures.add(value);
    material.dispose();
  }
  textures.forEach(texture=>texture.dispose());
}
function loadTrack(id) {
  TRACK = trackById(id); THEME = TRACK.theme; seed = TRACK.seed;
  disposeTrack();scene.remove(world); world = new THREE.Group(); scene.add(world);
  plots = []; colliders = []; animated = []; clouds = []; cows = [];
  itemBoxes = []; pads = []; muds = []; ramps = []; coinsOnTrack = [];
  computeTrack(TRACK);
  const types = Object.entries(TRACK.plots).flatMap(([k, w]) => Array(w).fill(k));
  for (let x = WB.x0; x < WB.x0 + WB.size; x += 40) for (let z = WB.z0; z < WB.z0 + WB.size; z += 40) {
    const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233 + TRACK.seed) * 43758.5453) % 1;
    plots.push({ x, z, type: types[Math.floor(h * types.length)], rowsAlongX: h * 7 % 1 > 0.5 });
  }
  applyTheme(THEME);
  buildGround(); buildRoad(); buildScenery(); buildCourseFeatures(); buildPickups(); buildRaceSigns();
}

function buildGround() {
  const R = IS_TOUCH?1024:2048, k = R / WB.size, PL = 40, PC = THEME.plotCols;
  const tex = canvasTex(R, R, g => {
    g.fillStyle = THEME.grass; g.fillRect(0, 0, R, R);
    speckle(g, R, R, 9000, THEME.grassSpeck, 3, 8);
    for (const p of plots) {
      const x = (p.x - WB.x0) * k, z = (p.z - WB.z0) * k, s = PL * k, ins = 2.2 * k;
      g.fillStyle = PC[p.type]; g.fillRect(x + ins, z + ins, s - 2 * ins, s - 2 * ins);
      if (p.type !== 'pasture' && p.type !== 'wheat') {
        g.fillStyle = p.type === 'plow' ? 'rgba(60,30,10,0.35)' : 'rgba(80,60,30,0.28)';
        const step = (p.type === 'plow' ? 1.6 : p.type === 'soy' ? 1.8 : 2.6) * k;
        for (let o = ins; o < s - ins; o += step)
          p.rowsAlongX ? g.fillRect(x + ins, z + o, s - 2 * ins, step * 0.45) : g.fillRect(x + o, z + ins, step * 0.45, s - 2 * ins);
      }
    }
    const path = () => { g.beginPath(); S.forEach((s, i) => { const X = (s.p.x - WB.x0) * k, Z = (s.p.z - WB.z0) * k; i ? g.lineTo(X, Z) : g.moveTo(X, Z); }); g.closePath(); };
    g.lineJoin = 'round';
    path(); g.strokeStyle = THEME.verge; g.lineWidth = (WALL + 6) * 2 * k; g.stroke();
    path(); g.strokeStyle = THEME.margin; g.lineWidth = WALL * 2 * k; g.stroke();
    path(); g.strokeStyle = THEME.roadEdge; g.lineWidth = (CFG.halfW + 1.2) * 2 * k; g.stroke();
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WB.size, WB.size), toonColor('#ffffff', { map: tex, userData: NO_OUTLINE, polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(WB.x0 + WB.size / 2, 0, WB.z0 + WB.size / 2);
  ground.receiveShadow = true; world.add(ground);
  const outer = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), toonColor(THEME.outer, { userData: NO_OUTLINE }));
  outer.rotation.x = -Math.PI / 2; outer.position.set(WB.x0 + WB.size / 2, -0.05, WB.z0 + WB.size / 2);
  world.add(outer);
}

function ribbon(lat0, lat1, y, vScale, step = 2) {
  const pos = [], uv = [], idx = [];
  let v = 0, n = 0;
  for (let i = 0; i <= CFG.N; i += step) {
    const s = S[i % CFG.N];
    for (const [lat, u] of [[lat0, 0], [lat1, 1]]) { pos.push(s.p.x + s.l.x * lat, y, s.p.z + s.l.z * lat); uv.push(u, v / vScale); }
    if (n) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    n++; v += SPACING * step;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const nrm = g.attributes.normal; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return g;
}

function buildRoad() {
  if(A['course_'+TRACK.id]) {
    const mesh=A['course_'+TRACK.id].clone(true);
    mesh.traverse(o=>{
      if(!o.isMesh) return;
      o.receiveShadow=true;
      // Surface strips already define their borders; expanded outlines can overlap them.
      o.material.userData={...o.material.userData,...NO_OUTLINE};
      if(o.material.name==='CourseEmbankment') {
        // Prefer the driving surface at shortcut joins where earth slopes meet the road.
        o.material.polygonOffset=true;o.material.polygonOffsetFactor=1;o.material.polygonOffsetUnits=1;
      }
    });
    world.add(mesh);
    const line=new THREE.Mesh(new THREE.PlaneGeometry(16,2),toonColor('#FFF0CF'));
    line.rotation.x=-Math.PI/2;line.rotation.z=-headingOf(S[0].t);line.position.copy(S[0].p).add(new THREE.Vector3(0,.07,0));world.add(line);
    return;
  }
  const roadTex = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = THEME.road; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2600, THEME.roadSpeck, 2, 6);
    g.fillStyle = 'rgba(70,40,20,0.25)';
    for (const x of [52, 84, 172, 204]) g.fillRect(x - 9, 0, 18, h);
    g.fillStyle = 'rgba(60,35,15,0.3)';
    for (let y = 0; y < h; y += 16) for (const x of [52, 84, 172, 204]) g.fillRect(x - 8, y, 16, 5);
    for (let y = 0; y < h; y += 5) { g.fillStyle = THEME.grass; g.fillRect(0, y, rr(2, 10), 5); g.fillRect(w - rr(2, 10), y, 12, 5); }
    speckle(g, w, h, 60, ['#8E8E8E', '#A9A9A9'], 4, 8);
  });
  roadTex.wrapT = THREE.RepeatWrapping;
  const road = new THREE.Mesh(ribbon(-CFG.halfW, CFG.halfW, 0.03, 18), toonColor('#fff', { map: roadTex, userData: NO_OUTLINE }));
  road.receiveShadow = true; world.add(road);
  const curbTex = canvasTex(32, 64, g => { g.fillStyle = THEME.curbA; g.fillRect(0, 0, 32, 32); g.fillStyle = THEME.curbB; g.fillRect(0, 32, 32, 32); });
  curbTex.wrapT = THREE.RepeatWrapping;
  for (const side of [-1, 1]) {
    const a = side * CFG.halfW, b = side * (CFG.halfW + 0.9);
    const m = new THREE.Mesh(ribbon(side < 0 ? b : a, side < 0 ? a : b, 0.07, 4), toonColor('#fff', { map: curbTex, userData: NO_OUTLINE }));
    m.receiveShadow = true; world.add(m);
  }
  const chk = canvasTex(256, 48, g => { for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) { g.fillStyle = (x + y) % 2 ? '#222' : '#fff'; g.fillRect(x * 16, y * 16, 16, 16); } });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(CFG.halfW * 2, 3), toonColor('#fff', { map: chk, userData: NO_OUTLINE }));
  line.rotation.set(-Math.PI / 2, headingOf(S[0].t), 0, 'YXZ'); line.position.copy(S[0].p).setY(0.06); world.add(line);
}

function buildScenery() {
  const density = IS_TOUCH ? 3 : profile.opts.quality === 'baixa' ? 1.6 : 1;
  // fences
  const fenceM = [], step = Math.max(1, Math.round(3.2 / SPACING));
  for (let i = 0; i < CFG.N; i += step) for (const side of [-1, 1]) {
    if((courseLayouts[TRACK.id]?.branches??[]).some(r=>i/CFG.N>r.start-.035 && i/CFG.N<r.end+.035)) continue;
    const s = S[i], lat = side * (WALL + 0.6), x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    if (trackDist(x, z).d < WALL + 0.2) continue;
    fenceM.push(mtx(x, z, headingOf(s.t) + Math.PI / 2,1,s.p.y));
  }
  instance(A.fence, fenceM, { shadow: true });
  // fields
  const M = { corn: [], wheat: [], sunflower: [], bush: [], rock: [], tree: [], pine: [], soy: [], cerrado_tree: [] };
  const clear = WALL + 4;
  for (const p of plots) {
    const sp = { corn: [2.6, 1.8], wheat: [2.8, 2.8], sun: [2.6, 2.4], soy: [2.2, 1.6], plow: [9, 9], pasture: [11, 11] }[p.type];
    for (let a = 3; a < 37; a += sp[0] * density) for (let b = 3; b < 37; b += sp[1] * density) {
      const [ox, oz] = p.rowsAlongX ? [b, a] : [a, b];
      const x = p.x + ox + rr(-0.3, 0.3), z = p.z + oz + rr(-0.3, 0.3);
      if (trackDist(x, z).d < clear) continue;
      if (p.type === 'corn') M.corn.push(mtx(x, z, rr(0, 6.28), rr(0.85, 1.2)));
      else if (p.type === 'wheat') M.wheat.push(mtx(x, z, rr(0, 6.28), rr(0.9, 1.3)));
      else if (p.type === 'sun') M.sunflower.push(mtx(x, z, rr(-0.4, 0.4) + Math.PI, rr(0.9, 1.15)));
      else if (p.type === 'soy') M.soy.push(mtx(x, z, rr(0, 6.28), rr(0.8, 1.15)));
      else if (p.type === 'plow' && rnd() < 0.35) M.rock.push(mtx(x + rr(-3, 3), z + rr(-3, 3), rr(0, 6), rr(0.4, 0.8)));
      else if (p.type === 'pasture' && rnd() < 0.4) M.bush.push(mtx(x + rr(-3, 3), z + rr(-3, 3), rr(0, 6), rr(0.7, 1.3)));
    }
    const treeKind = THEME.trees[0] === 'cerrado_tree' ? 'cerrado_tree' : 'tree';
    if (p.type === 'pasture') {
      const cx = p.x + 20, cz = p.z + 20;
      if (trackDist(cx, cz).d > clear + 8) {
        for (let c = 0; c < 2; c++) spawnCow(p);
        if (rnd() < 0.6) M[treeKind].push(mtx(cx + rr(-10, 10), cz + rr(-10, 10), rr(0, 6), rr(0.9, 1.3)));
      }
    }
    if ((p.type === 'corn' || p.type === 'wheat' || p.type === 'soy') && rnd() < 0.25) {
      const x = p.x + rr(10, 30), z = p.z + rr(10, 30);
      if (trackDist(x, z).d > clear + 2) place('scarecrow', x, z, rr(0, 6.28), 1.1, { shadow: false });
    }
  }
  for (const k of ['corn', 'wheat', 'sunflower', 'rock', 'bush', 'soy']) instance(A[k], M[k]);
  const cx = WB.x0 + WB.size / 2, cz = WB.z0 + WB.size / 2;
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, r = rr(WB.size * 0.55, WB.size * 0.8);
    M[THEME.trees[rnd() < 0.5 ? 0 : 1]].push(mtx(cx + Math.cos(a) * r, cz + Math.sin(a) * r, rr(0, 6.28), rr(1.4, 2.6)));
  }
  for (let i = 0; i < CFG.N; i += 37) {
    const side = rnd() < 0.5 ? -1 : 1, lat = side * (WALL + rr(5, 9));
    const s = S[i], x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    if (trackDist(x, z).d > WALL + 3.5) M[THEME.trees[rnd() < 0.5 ? 0 : 1]].push(mtx(x, z, rr(0, 6.28), rr(0.8, 1.2)));
  }
  for (const k of ['tree', 'pine', 'cerrado_tree']) instance(A[k], M[k], { shadow: true });
  const hillMat = toonColor(THEME.hill, { userData: NO_OUTLINE });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + rr(-0.1, 0.1), r = rr(WB.size * 0.95, WB.size * 1.15);
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), hillMat);
    h.scale.set(rr(120, 220), rr(40, 90), rr(120, 200)); h.position.set(cx + Math.cos(a) * r, -10, cz + Math.sin(a) * r);
    world.add(h);
  }
  // landmarks auto-placed in free spots next to the track
  const placed = [];
  for (const [name, count, rad] of TRACK.landmarks) {
    for (let n = 0, tries = 0; n < count && tries < 300; tries++) {
      const s = S[Math.floor(rnd() * CFG.N)], side = rnd() < 0.5 ? -1 : 1, lat = side * (WALL + rad + rr(6, 26));
      const x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
      if (trackDist(x, z).d < WALL + rad + 3) continue;
      if (placed.some(o => Math.hypot(o.x - x, o.z - z) < o.r + rad + 5)) continue;
      if (!A[name]) break;
      placed.push({ x, z, r: rad }); colliders.push({ x, z, r: rad }); n++;
      const o = place(name, x, z, rr(0, 6.28), 1);
      if (name === 'windmill') { const bl = o.getObjectByName('Blades'); animated.push({ update: dt => { bl.rotation.z += dt * 2.2; } }); }
    }
  }
  // trackside hay bales (collidable)
  for (const f of [0.08, 0.26, 0.41, 0.57, 0.72, 0.86, 0.95]) {
    const i = Math.floor(f * CFG.N), side = (i % 2) ? 1 : -1, s = S[i], lat = side * (CFG.halfW + 4.5);
    const x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    const y=courseSurface(new THREE.Vector3(x,0,z)).height;
    place('hay', x, z, headingOf(s.t), 1).position.y=y; colliders.push({ x, y, z, r: 1.1 });
  }
  for (const [lat, y] of [[-12, 0], [-12, 0.5], [12, 0], [12.4, 0.5]]) {
    const s = S[30], o = place('haysq', s.p.x + s.l.x * lat, s.p.z + s.l.z * lat, headingOf(s.t), 1.2); o.position.y = y;
  }
  // start gate with banner
  {
    const s = S[0], gate = place('gate', s.p.x, s.p.z, headingOf(s.t), 1.15);
    gate.position.y=s.p.y;
    const bannerTex = canvasTex(1024, 128, (g, w, h) => {
      g.fillStyle = '#FFF6DC'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#E87578'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
      g.font = '78px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = '#2b1a0e'; g.strokeText(THEME.banner, w / 2, h / 2 + 4);
      g.fillStyle = '#216C79'; g.fillText(THEME.banner, w / 2, h / 2 + 4);
    });
    const banner = gate.getObjectByName('Banner');
    if (banner) {
      banner.visible = false;
      for (const side of [1, -1]) {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.6), toonColor('#fff', { map: bannerTex, userData: NO_OUTLINE }));
        pl.position.set(0, 4.9, 0.09 * side); pl.rotation.y = side > 0 ? 0 : Math.PI; gate.add(pl);
      }
    }
    for (const side of [-1, 1]) colliders.push({ x: s.p.x + s.l.x * side * 9.2, y:s.p.y, z: s.p.z + s.l.z * side * 9.2, r: 0.7 });
  }
  // podium spot: free field next to the start
  podiumSpot = null;
  for (let i = 0; i < 400 && !podiumSpot; i += 10) for (const side of [-1, 1]) {
    const s = S[sIdx(-i)], lat = side * (WALL + 24), x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat;
    if (trackDist(x, z).d > WALL + 13 && !placed.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 14)) {
      podiumSpot = { x, z, rot: Math.atan2(-s.l.x * side, -s.l.z * side) }; break;
    }
  }
  if (podiumSpot) { const p = place('podium', podiumSpot.x, podiumSpot.z, podiumSpot.rot, 1); podiumSpot.o = p; }
  // clouds
  for (let i = 0; i < 22; i++) {
    const c = A.cloud.clone(true);
    c.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.userData = NO_OUTLINE; o.material.color.set(THEME.cloudTint); } });
    c.position.set(cx + rr(-WB.size / 2, WB.size / 2), rr(55, 95), cz + rr(-WB.size / 2, WB.size / 2));
    c.scale.setScalar(rr(1.5, 3.2)); c.rotation.y = rr(0, 6);
    world.add(c); clouds.push(c);
  }
}

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

function buildCourseFeatures() {
  for(const [fraction,asset,lat,scale] of courseLayouts[TRACK.id]?.features??[]) {
    const index=Math.floor(fraction*CFG.N),p=trackPoint(index,lat),o=place(asset,p.x,p.z,headingOf(S[index].t)+Math.PI,scale);
    o.position.y=lat===0?p.y:courseSurface(p).height;
  }
  for(const route of courseLayouts[TRACK.id]?.branches??[]) {
    const p=route.samples[8],q=route.samples[12],heading=Math.atan2(q[0]-p[0],q[2]-p[2]);
    const sign=place('race_shortcut',p[0],p[2],heading+Math.PI,.8);sign.position.y=p[1];
    const sample=route.samples[45],next=route.samples[48],h=Math.atan2(next[0]-sample[0],next[2]-sample[2]);
    const ramp=place('ramp',sample[0],sample[2],h+Math.PI,1);ramp.position.y=sample[1];
    ramps.push({p:new THREE.Vector3(sample[0],sample[1],sample[2]),h,hw:2.5,hd:2,H:1.2});
  }
}
function buildRaceSigns() {
  const routes=courseLayouts[TRACK.id]?.branches??[];
  const gap=(a,b)=>Math.min(Math.abs(a-b),CFG.N-Math.abs(a-b))*SPACING;
  const junction=i=>routes.some(r=>gap(i,r.start*CFG.N)<16 || gap(i,r.end*CFG.N)<16);
  const board=(asset,p,h,scale=1)=>{const o=place(asset,p.x,p.z,h+Math.PI,scale);o.position.y=courseSurface(p).height;};
  // Repeated low markers explain the road edge without closing shortcut junctions.
  const matrices=[];
  for(let i=0;i<CFG.N;i+=Math.max(1,Math.round(20/SPACING))) {
    if(junction(i)) continue;
    for(const side of [-1,1]) {
      const p=trackPoint(i,side*(CFG.halfW+.7));p.y=courseSurface(p).height;
      matrices.push(new THREE.Matrix4().compose(p,new THREE.Quaternion(),new THREE.Vector3(.8,.8,.8)));
    }
  }
  instance(A.race_edge_marker,matrices);
  const candidates=[],look=Math.max(1,Math.round(25/SPACING)),chosen=[];
  for(let i=0;i<CFG.N;i+=16) {
    const angle=wrapAngle(headingOf(S[sIdx(i+look)].t)-headingOf(S[sIdx(i-look)].t));
    if(Math.abs(angle)>.3 && !junction(i)) candidates.push({i,angle});
  }
  candidates.sort((a,b)=>Math.abs(b.angle)-Math.abs(a.angle));
  for(const {i,angle} of candidates) {
    if(chosen.length>=12) break;
    if(chosen.some(j=>gap(i,j)<75)) continue;
    chosen.push(i);
    for(const offset of [-28,5]) {
      const j=sIdx(i+Math.round(offset/SPACING));
      if(junction(j)) continue;
      board(angle>0?'race_curve_left':'race_curve_right',trackPoint(j,-Math.sign(angle)*(CFG.halfW+1.7)),headingOf(S[j].t));
    }
  }
  for(const r of ramps) {
    const p=r.p.clone().add(new THREE.Vector3(-Math.sin(r.h)*20,0,-Math.cos(r.h)*20));
    const width=courseSurface(r.p).width;
    p.add(new THREE.Vector3(Math.cos(r.h)*(width+1.5),0,-Math.sin(r.h)*(width+1.5)));
    board('race_sign_jump',p,r.h,.9);
  }
  for(const route of routes) {
    const p=route.samples[5],q=route.samples[9],h=Math.atan2(q[0]-p[0],q[2]-p[2]);
    const point=new THREE.Vector3(p[0]-Math.cos(h)*(route.width+1),p[1],p[2]+Math.sin(h)*(route.width+1));
    board('race_sign_route',point,h,.9);
  }
}
function buildPickups() {
  const qTex = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#FFE066'); gr.addColorStop(1, '#FF9F1C');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.font = '100px "Lilita One", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#2b1a0e'; g.strokeText('?', w / 2, h / 2 + 6); g.fillStyle = '#fff'; g.fillText('?', w / 2, h / 2 + 6);
  });
  const coreMat = toonColor('#fff', { map: qTex, transparent: true, opacity: 0.92, emissive: '#553300', emissiveIntensity: 0.4 });
  const boxRows = [0.15, 0.4, 0.63, 0.86].map(r => Math.floor(r * CFG.N));
  for (const i of boxRows) for (const lat of [-5.5, -1.8, 1.8, 5.5]) {
    const p = trackPoint(i, lat), g = new THREE.Group();
    const frame = A.itembox.getObjectByName('ItemFrame').clone(true);
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), coreMat);
    core.position.y = 0.75; g.add(frame, core);
    frame.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.position.copy(p); g.scale.setScalar(0.85); world.add(g);
    itemBoxes.push({ g, p, active: true, timer: 0, phase: rr(0, 6) });
  }
  // ramps first (they need the longest straights), then pads and coin lines
  const rampIdx = straights(300, boxRows, 0.92).slice(0, TRACK.id === 'girassol' ? 3 : 2);
  for (const i of rampIdx) {
    const h = headingOf(S[i].t), p = trackPoint(i, 0);
    const o = place('ramp', p.x, p.z, h + Math.PI, 1); o.scale.set(1.4, 1, 1);
    o.position.y=p.y;
    ramps.push({ p, h, hw: 3.5, hd: 2, H: 1.2 });
  }
  const padTex = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#2E86DE'; g.fillRect(0, 0, w, h);
    g.lineWidth = 18; g.strokeStyle = '#FFE066'; g.lineJoin = 'round';
    for (let k = 0; k < 3; k++) { const y = 200 - k * 70; g.beginPath(); g.moveTo(16, y); g.lineTo(w / 2, y - 50); g.lineTo(w - 16, y); g.stroke(); }
    g.strokeStyle = '#2b1a0e'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  });
  const padMat = toonColor('#fff', { map: padTex, emissive: '#1a3b66', emissiveIntensity: 0.6, userData: NO_OUTLINE });
  const padIdx = straights(220, [...boxRows, ...rampIdx], 0.82).slice(0, 4);
  padIdx.forEach((i, n) => {
    const lat = [0, 3.5, -3.5, 0][n % 4], p = trackPoint(i, lat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), padMat);
    m.rotation.set(-Math.PI / 2, headingOf(S[i].t) + Math.PI, 0, 'YXZ'); m.position.copy(p).add(new THREE.Vector3(0,.08,0));
    world.add(m); pads.push({ p, r: 2.2 });
  });
  const mudMat = toonColor('#6B4423', { userData: NO_OUTLINE }), mudMat2 = toonColor('#82572F', { userData: NO_OUTLINE });
  for (const [r, lat] of [[0.25, -3.5], [0.5, 4], [0.72, -4], [0.82, 3.5]]) {
    const i = Math.floor(r * CFG.N), p = trackPoint(i, lat);
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), mudMat);
    m.rotation.x = -Math.PI / 2; m.scale.set(3.4, 4.6, 1); m.position.copy(p).add(new THREE.Vector3(0,.07,0)); m.rotation.z = -headingOf(S[i].t);
    const m2 = m.clone(); m2.material = mudMat2; m2.scale.set(2, 2.8, 1); m2.position.y = p.y+.075; m2.position.x += 0.4;
    world.add(m, m2); muds.push({ p, rx: 3.2, rz: 4.3, h: headingOf(S[i].t) });
  }
  // corn coin lines
  const coinIdx = straights(150, [...boxRows, ...rampIdx, ...padIdx], 0.7).slice(0, 7);
  for (const i of coinIdx) {
    const lat = rr(-5, 5);
    for (let n = 0; n < 5; n++) {
      const p = trackPoint(i + Math.round(n * 3.2 / SPACING), lat);
      const o = A.coin.clone(true); o.position.copy(p).add(new THREE.Vector3(0,1.1,0)); o.scale.setScalar(1.3);
      world.add(o); coinsOnTrack.push({ o, p, active: true, timer: 0 });
    }
  }
}

// ================================================================== particles
const particles = (() => {
  const MAX = IS_TOUCH?350:1400;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3), size = new Float32Array(MAX), alpha = new Float32Array(MAX);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, userData: NO_OUTLINE,
    uniforms: { scale: { value: innerHeight / 2 } },
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); vA = alpha * smoothstep(3.0, 7.0, -mv.z); gl_PointSize = min(size * scale / -mv.z, 56.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; gl_FragColor = vec4(vC, vA);
      #include <colorspace_fragment>
      }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  const P = Array.from({ length: MAX }, () => ({ life: 0 }));
  let head = 0,emitted=0;
  const c = new THREE.Color();
  return {
    emit(x, y, z, vx, vy, vz, color, s, life, grow = 1.5, grav = 0) {
      if(IS_TOUCH && ++emitted%3!==0)return;
      // Particle heights follow the nearest racer on raised roads.
      if(y<8 && state.mode!=='podium') {
        let nearest=null,best=400;
        for(const racer of karts) {const d=(racer.pos.x-x)**2+(racer.pos.z-z)**2;if(d<best){best=d;nearest=racer;}}
        if(nearest) y+=nearest.groundY??0;
      }
      const p = P[head]; head = (head + 1) % MAX;
      Object.assign(p, { x, y, z, vx, vy, vz, s, life, max: life, grow, grav }); c.set(color); p.r = c.r; p.g = c.g; p.b = c.b;
    },
    clear() { for (const p of P) p.life = 0; },
    update(dt) {
      for (let i = 0; i < MAX; i++) {
        const p = P[i];
        if (p.life <= 0) { alpha[i] = 0; size[i] = 0; continue; }
        p.life -= dt; p.vy -= p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.05) { p.y = 0.05; p.vy = 0; p.vx *= 0.9; p.vz *= 0.9; }
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
const CONFETTI = ['#216C79', '#1F8A4C', '#FFC83D', '#2F6FD6', '#E23D3D', '#FFFFFF'];
function confetti(at, n = 40) {
  for (let i = 0; i < n; i++) particles.emit(at.x + rr(-4, 4), at.y + rr(4, 8), at.z + rr(-4, 4), rr(-4, 4), rr(2, 9), rr(-4, 4), CONFETTI[i % CONFETTI.length], 0.35, 2.5, 0.1, 6);
}

// ================================================================== karts
const ITEMS = {
  turbo: { icon: '⛽', name: 'Biodiesel', description:'Uma arrancada curta de velocidade.' },
  trovoada: { icon: '⚡', name: 'Trovoada', description:'Atinge um adversário à frente. Rara, para quem está atrás.' },
  calcario: { icon: '🌫️', name: 'Calcário' },
  jato: { icon: '💦', name: 'Jato d’água', description:'Jato frontal que empurra e desacelera quem estiver perto.' },
  girassol: { icon: '🌻', name: 'Girassóis' },
  sulco: { icon: '🚜', name: 'Sulco Turbo' },
  guia: { icon: '🛰️', name: 'Piloto Guia', description:'Ajuda a seguir o caminho por alguns segundos.' },
  escudo:{icon:'🛡️',name:'Escudo de bolha',description:'Protege de um ataque por até 6 segundos. Não evita colisões.'},
  disco:{icon:'🌽',name:'Disco de milho',description:'Lança um disco em linha reta. Acerte um adversário à frente.'},
  ima:{icon:'🧲',name:'Ímã de milho',description:'Coleta milho próximo por 6 segundos, sem sair da sua linha.'},
};
const ITEM_ODDS = [
  {turbo:30,escudo:30,ima:20,jato:15,disco:5},
  {turbo:25,escudo:20,disco:25,jato:15,ima:10,guia:5},
  {turbo:25,guia:20,disco:20,ima:15,escudo:10,jato:5,trovoada:5},
];
const BOX_ITEMS=[...new Set(ITEM_ODDS.flatMap(odds=>Object.keys(odds)))].map(id=>({id,...ITEMS[id]}));
function rollItem(place) {
  const odds = ITEM_ODDS[place === 1 ? 0 : place <= 3 ? 1 : 2];
  let r = Math.random() * Object.values(odds).reduce((a, b) => a + b, 0);
  for (const [k, w] of Object.entries(odds)) { if ((r -= w) < 0) return k; }
  return 'turbo';
}

const karts = [];
const radiusOf = w => new THREE.Box3().setFromObject(w).getSize(new THREE.Vector3()).y / 2;
function addAccessory(model, ch, accId) {
  const acc = CATALOG.acc.find(a => a.id === accId);
  if (!acc?.asset || !A[acc.asset]) return null;
  const o = A[acc.asset].clone(true);
  const m = ch.mount[acc.slot === 'eyes' ? 'eyes' : 'roof'];
  o.position.set(...m); if (acc.slot === 'eyes') o.scale.setScalar(ch.mount.eyeScale);
  o.traverse(c => { if (c.isMesh) c.castShadow = true; });
  model.add(o);
  return o;
}
// builds the visual for one racer (machine + towed implement + paint + accessory)
function makeKartModel(def, parent = scene) {
  const ch = CHARACTERS[def.char];
  const model = A[ch.asset].clone(true);
  const paint = IS_TOUCH?new THREE.MeshLambertMaterial({color:def.paint}):new THREE.MeshStandardMaterial({color:def.paint,roughness:.43,metalness:.06});
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    if (o.material.name.startsWith('Paint') && !def.keepPaint) o.material = paint;
    else if (o.material.name.startsWith('Headlight')) o.material = o.material.clone();
  });
  const custom = applyBuild(model, def.build, def.char, paint,A);
  model.rotation.y = Math.PI;
  const tilt = new THREE.Group(); tilt.add(model);
  const root = new THREE.Group(); root.add(tilt); parent.add(root);
  const W = n => { const w = model.getObjectByName(n); w.rotation.order = 'YXZ'; return w; };
  const wheels = { FL: W('WheelFL'), FR: W('WheelFR'), RL: W('WheelRL'), RR: W('WheelRR') };
  let beaconMat = null; model.getObjectByName('Beacon')?.traverse(o => { if (o.isMesh) beaconMat = o.material; });
  const booms = { L: model.getObjectByName('BoomL'), R: model.getObjectByName('BoomR') };
  // The exported neutral pose is open; start folded in races and the garage.
  if(booms.L && booms.R) {booms.L.rotation.y=-BOOM_FOLDED;booms.R.rotation.y=BOOM_FOLDED;}
  const accessory = addAccessory(model, ch, def.acc);
  if (accessory) accessory.position.y += custom.lift;
  let trailer = null, customTrailer = null;
  const im = ch.tows ? IMPLEMENTS[def.impl] : null;
  if (im?.asset) {
    const tModel = A[im.asset].clone(true);
    if (im.asset === 'broto') customTrailer = applyImplementBuild(tModel, def.implBuild, A);
    tModel.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    tModel.rotation.y = Math.PI;
    const tRoot = new THREE.Group(); tRoot.add(tModel); parent.add(tRoot);
    const tw = ['WheelL', 'WheelR', 'WheelEndL', 'WheelEndR'].map(n => tModel.getObjectByName(n)).filter(Boolean).map(o => ({ o, r: radiusOf(o) }));
    trailer = { root: tRoot, wheels: tw, len: im.len };
  }
  const visualCh = { ...ch, hitch: ch.hitch ? { ...ch.hitch, y: ch.hitch.y + custom.lift } : undefined };
  return { root, tilt, model, eyes:model.getObjectByName('Eyes'), wheels, wheelR: { F: radiusOf(wheels.FL), R: radiusOf(wheels.RL) }, beaconMat, ch: visualCh, booms, trailer,
    dispose: () => { custom.dispose(); customTrailer?.dispose(); paint.dispose(); } };
}

function createKart(def, gridPos, isPlayer) {
  const v = makeKartModel(def);
  const row = Math.floor(gridPos / 2), col = gridPos % 2;
  const si = sIdx(-14 - row * 16);
  const p = trackPoint(si, col ? -3.6 : 3.6).setY(0), h = headingOf(S[si].t);
  const im = v.ch.tows ? IMPLEMENTS[def.impl ?? 'none'] : { accelMul: 1, turnMul: 1 };
  const k = {
    def, isPlayer, v, pos: p, heading: h, moveDir: h, speed: 0, steer: 0, idx: si, prevIdx:si, lat: 0,
    lap: 0, progress:si-CFG.N, maxIdx: 0, checkpoint:0, groundY:S[si].p.y, route:null, routeU:0, finished: false, finishTime: 0, place: gridPos + 1,
    drifting: false, driftDir: 0, driftCharge: 0, driftVis: 0, hop: 0, boost: 0, spin: 0, spinAng: 0,
    item: null, rolling: 0, wheelRot: 0, wrongWay: 0, offroad: false, inMud: false, bumpCd: 0,
    slow: 0, guide: 0, spraying: 0, sprayMode: 'front', plow: 0, plowT: 0, clean: 0, boomAng: BOOM_FOLDED, sprout: 0,
    y: 0, vy: 0, airT: 0, coins: 0, lastLap: 0,
    shield:0,magnet:0,itemGuard:0,powerFxT:0,sprayBlocked:new Set(),
    charge: 0, ability: v.ch.tows ? (im.ability ?? 'arrancada') : v.ch.ability,
    mods: { speed: v.ch.speedMul, accel: v.ch.accelMul * im.accelMul, turn: v.ch.turnMul * im.turnMul },
    ai: { skill: 0.9 + gridPos * 0.012 + rr(-0.01, 0.015), lane: rr(-4, 4), laneT: rr(0, 9), itemDelay: rr(1, 4), driftT: 0 },
  };
  karts.push(k);
  return k;
}

// ================================================================== items, hazards, abilities
const hazards = [], effects = [];
const furrowGeo = new THREE.PlaneGeometry(2.6, 2.6);
let furrowMat = null;
const fwdOf = k => new THREE.Vector3(Math.sin(k.heading), 0, Math.cos(k.heading));
const progOf = k => k.progress;
const inRace = () => state.mode === 'race' || state.mode === 'countdown';
const playerSfx = (k, name) => { if (k.isPlayer && inRace()) audio.sfx(name); };

function useItem(k) {
  if (!k || k.finished || state.mode!=='race' || state.paused || racePlan.mode==='time' || !k.item || k.rolling > 0) return;
  const it = k.item; k.item = null;
  doEffect(k, it);
  if(k.isPlayer) flash(`${ITEMS[it].icon} ${ITEMS[it].name}`,850);
}
function addCharge(k, amt) {
  if (state.mode !== 'race' || k.finished) return;
  const was = k.charge;
  k.charge = Math.min(1, k.charge + amt);
  if (k.isPlayer && was < 1 && k.charge >= 1 && inRace()) audio.sfx('charged');
}
function useAbility(k) {
  if (!k || k.finished || state.paused || k.charge < 1 || k.spin > 0 || state.mode !== 'race' || racePlan.mode==='time') return;
  k.charge = 0;
  const a = ABILITIES[k.ability];
  if (k.isPlayer && inRace()) { flash(`${a.icon} ${a.name}!`, 1100); audio.sfx('ability'); }
  doEffect(k, k.ability);
}
function plantRow(k, origin, dir, offsets, r, scale) {
  const left = new THREE.Vector3(-dir.z, 0, dir.x);
  for (const off of offsets) {
    const pos = origin.clone().addScaledVector(left, off);
    pos.y=courseSurface(pos).height;
    const o = A.sunflower.clone(true); o.position.copy(pos); o.rotation.y = Math.atan2(dir.x, dir.z); o.scale.setScalar(0.05);
    o.traverse(c => { if (c.isMesh) c.castShadow = true; });
    scene.add(o);
    hazards.push({ type: 'flower', o, pos, r, life: 18, owner: k, arm: 1.0, grow: 0, scale });
    for (let n = 0; n < 4; n++) particles.emit(pos.x, 0.3, pos.z, rr(-1, 1), rr(1, 3), rr(-1, 1), '#8B5A2B', 0.4, 0.5, 0.3, 8);
  }
}
function doEffect(k, it) {
  const fwd = fwdOf(k);
  if (it === 'turbo' || it === 'arrancada') { k.boost = Math.max(k.boost, it === 'turbo' ? 1.6 : 2.2); playerSfx(k, 'boost'); }
  else if(it==='escudo'){k.shield=6;playerSfx(k,'shield');}
  else if(it==='ima'){k.magnet=6;playerSfx(k,'magnet');}
  else if(it==='disco'){
    const pos=k.pos.clone().addScaledVector(fwd,3.3),ground=courseSurface(pos).height;
    pos.y=ground+1.1;
    const o=A.coin.clone(true);o.scale.setScalar(1.25);o.position.copy(pos);scene.add(o);
    hazards.push({type:'disc',o,pos,dir:fwd,speed:Math.max(0,k.speed)+32,groundY:ground,life:1.8,arm:0,owner:k});
    playerSfx(k,'launch');
  }
  else if (it === 'plantio') {
    const t = k.v.trailer && k.trAxle ? { origin: k.trAxle.clone(), dir: k.trDir.clone() } : { origin: k.pos.clone().addScaledVector(fwd, -6), dir: fwd.clone() };
    t.origin.addScaledVector(t.dir, -1.6);
    plantRow(k, t.origin, t.dir, [0], 0.9, 2.3);
    playerSfx(k, 'plant');
  } else if (it === 'barras') { k.spraying = 1.8; k.sprayMode = 'side';k.sprayBlocked=new Set(); k.clean = 4; playerSfx(k, 'splash'); }
  else if (it === 'calcario') {
    const pos = k.pos.clone().addScaledVector(fwd, -6);
    pos.y=courseSurface(pos).height;
    hazards.push({ type: 'cloud', pos, r: 5.5, life: 7, owner: k, arm: 1, hit: new Set() });
    for (let n = 0; n < 40; n++) particles.emit(pos.x + rr(-4, 4), rr(0.5, 2.5), pos.z + rr(-4, 4), rr(-1, 1), rr(0.3, 1.2), rr(-1, 1), '#F4F1E6', 1.6, 1.4, 1.2);
  } else if (it === 'jato') { k.spraying = 1.4; k.sprayMode = 'front';k.sprayBlocked=new Set(); k.clean = 4; playerSfx(k, 'splash'); }
  else if (it === 'girassol') plantRow(k, k.pos.clone().addScaledVector(fwd, -7), fwd, [-3.2, 0, 3.2], 1.5, 2.6);
  else if (it === 'sulco') { k.boost = Math.max(k.boost, 1.4); k.plow = 2.4; k.plowT = 0; playerSfx(k, 'boost'); }
  else if (it === 'guia') {
    k.guide = 4; k.spin = 0; k.slow = 0;
    if (k.isPlayer && inRace()) { audio.sfx('ability'); flash('🛰️ Piloto Guia!', 1200); }
  } else if (it === 'trovoada') {
    const target = karts.filter(o => o !== k && !o.finished && o.place<k.place).sort((a, b) => a.place - b.place)[0];
    if (target) { lightning(target.pos); hitKart(target, 'trovoada'); }
    if (inRace()) { audio.sfx('thunder'); state.shake = Math.max(state.shake, 0.4); }
  }
}
function lightning(at) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#FFF59D', userData: NO_OUTLINE });
  let prev = new THREE.Vector3(at.x + rr(-3, 3), 45, at.z + rr(-3, 3));
  for (let i = 1; i <= 9; i++) {
    const y = 45 - i * 5, next = i === 9 ? new THREE.Vector3(at.x, 1.5, at.z) : new THREE.Vector3(at.x + rr(-2.5, 2.5), y, at.z + rr(-2.5, 2.5));
    const d = next.clone().sub(prev), seg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, d.length(), 5), mat);
    seg.position.copy(prev).addScaledVector(d, 0.5); seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.add(seg); prev = next;
  }
  scene.add(g); effects.push({ o: g, life: 0.35 });
  for (let n = 0; n < 20; n++) particles.emit(at.x, 1, at.z, rr(-6, 6), rr(2, 8), rr(-6, 6), '#FFF59D', 0.5, 0.5, 0.2, 6);
}
function blockAttack(k) {
  if(k.itemGuard>0)return true;
  if(k.shield<=0)return false;
  k.shield=0;k.itemGuard=.7;
  playerSfx(k,'shieldBreak');
  if(k.isPlayer)flash('Escudo protegeu!',800);
  for(let i=0;i<10;i++)particles.emit(k.pos.x,1.5+k.y,k.pos.z,rr(-4,4),rr(1,4),rr(-4,4),'#75C5D4',.3,.4,.1);
  return true;
}
const HIT_FX = { flower: { col: '#FFC300', msg: 'Girassol! 🌻' }, trovoada: { col: '#FFF59D', msg: 'Trovoada! ⚡' },disco:{col:'#E9C46A',msg:'Disco de milho! 🌽'} };
function hitKart(k, reason) {
  if (k.spin > 0 || k.finished || k.guide > 0) return;
  if(blockAttack(k))return;
  k.spin = 1.1; k.speed *= 0.3; k.drifting = false; k.boost = 0;
  const fx = HIT_FX[reason] ?? HIT_FX.flower;
  for (let n = 0; n < 18; n++) particles.emit(k.pos.x, 1.5, k.pos.z, rr(-5, 5), rr(2, 6), rr(-5, 5), fx.col, 0.6, 0.8, 0.5, 9);
  if (k.isPlayer && inRace()) { audio.sfx('hit'); flash(fx.msg, 900); state.shake = Math.max(state.shake, 0.6); k.coins = Math.max(0, k.coins - 2); }
}
function sneeze(k) {
  if (k.guide > 0 || k.finished) return;
  if(blockAttack(k))return;
  k.slow = 1.8;
  if (k.isPlayer && inRace()) { flash('Atchim! 🤧', 900); audio.sfx('sneeze'); }
}
function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.life -= dt; h.arm -= dt;
    if(h.type==='disc'){
      const from=h.pos.clone();h.pos.addScaledVector(h.dir,h.speed*dt);
      const surface=courseSurface(h.pos);h.groundY=surface.height;h.pos.y=surface.height+1.1;
      h.o.position.copy(h.pos);h.o.rotation.y+=dt*12;
      if(Math.abs(surface.lat)>surface.width+2)h.life=0;
      const dx=h.pos.x-from.x,dz=h.pos.z-from.z,length2=dx*dx+dz*dz;
      let victim=null,first=Infinity;
      for(const k of karts){
        if(h.life<=0)break;
        if(k===h.owner || k.finished || k.spin>0)continue;
        const u=clamp(((k.pos.x-from.x)*dx+(k.pos.z-from.z)*dz)/Math.max(.001,length2),0,1);
        const x=from.x+dx*u,z=from.z+dz*u,y=lerp(from.y,h.pos.y,u);
        if((k.pos.x-x)**2+(k.pos.z-z)**2<2.1**2 && Math.abs(k.groundY+k.y+1-y)<1.8 && u<first){victim=k;first=u;}
      }
      if(victim){hitKart(victim,'disco');h.life=0;}
    } else if (h.type === 'cloud') {
      if (Math.random() < 0.7) particles.emit(h.pos.x + rr(-4.5, 4.5), rr(0.4, 2.2), h.pos.z + rr(-4.5, 4.5), rr(-0.5, 0.5), rr(0.2, 0.8), rr(-0.5, 0.5), '#F4F1E6', 1.5, 1.2, 1.0);
      for (const k of karts) {
        if ((k === h.owner && h.arm > 0) || h.hit.has(k) || Math.abs(k.groundY+k.y-h.pos.y)>3) continue;
        if ((k.pos.x - h.pos.x) ** 2 + (k.pos.z - h.pos.z) ** 2 < h.r * h.r) { h.hit.add(k); sneeze(k); }
      }
    } else if (h.type === 'flower') {
      h.grow = Math.min(1, h.grow + dt * 2.2);
      const e = h.grow < 1 ? 1 + Math.sin(h.grow * Math.PI) * 0.25 : 1;
      h.o.scale.setScalar((h.scale ?? 2.6) * h.grow * e);
      h.o.rotation.z = Math.sin(state.t * 3 + h.pos.x) * 0.05;
      for (const k of karts) {
        if (h.life <= 0) break;
        if ((h.arm > 0 && k === h.owner) || Math.abs(k.groundY+k.y-h.pos.y)>1.6) continue;
        if ((k.pos.x - h.pos.x) ** 2 + (k.pos.z - h.pos.z) ** 2 < (h.r + 1.2) ** 2) {
          if (k.guide > 0) { h.life = 0; break; }
          hitKart(k, 'flower'); h.life = 0;
        }
      }
    } else if (h.type === 'furrow') {
      h.o.material.opacity = Math.min(1, h.life / 1.5) * 0.95;
      for (const k of karts) {
        if ((k === h.owner && h.arm > 0) || Math.abs(k.groundY+k.y-h.pos.y)>1.2) continue;
        if ((k.pos.x - h.pos.x) ** 2 + (k.pos.z - h.pos.z) ** 2 < h.r * h.r) k.boost = Math.max(k.boost, 0.45);
      }
    }
    if (h.life <= 0) {
      if (h.type === 'flower') for (let n = 0; n < 12; n++) particles.emit(h.pos.x, 1.5, h.pos.z, rr(-4, 4), rr(1, 5), rr(-4, 4), n % 2 ? '#FFC300' : '#6CC23A', 0.5, 0.6, 0.5, 9);
      if (h.o) scene.remove(h.o);
      hazards.splice(i, 1);
    }
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.life -= dt;
    e.o.visible = Math.floor(e.life * 30) % 2 === 0;
    if (e.life <= 0) { scene.remove(e.o); effects.splice(i, 1); }
  }
}
function updateItemEffects(k, dt, fwd, side) {
  k.shield=Math.max(0,k.shield-dt);k.magnet=Math.max(0,k.magnet-dt);k.itemGuard=Math.max(0,k.itemGuard-dt);
  k.powerFxT-=dt;
  if(k.shield>0 && k.powerFxT<=0){
    k.powerFxT=.16;
    for(let i=0;i<6;i++){
      const a=state.t*2+i*Math.PI/3;
      particles.emit(k.pos.x+Math.cos(a)*2,1.35+k.y+Math.sin(a*2)*.55,k.pos.z+Math.sin(a)*2,0,.25,0,'#75C5D4',.24,.3,.1);
    }
  }
  if (k.slow > 0) { k.slow -= dt; if (Math.random() < 0.3) particles.emit(k.pos.x + rr(-1, 1), 2.5, k.pos.z + rr(-1, 1), rr(-1, 1), 1, rr(-1, 1), '#F4F1E6', 0.6, 0.6, 1); }
  if (k.clean > 0) k.clean -= dt;
  if (k.guide > 0) { k.guide -= dt; for (const sd of [-1, 1]) particles.emit(k.pos.x + side.x * sd * 1.3, 0.3, k.pos.z + side.z * sd * 1.3, 0, 0.5, 0, '#3CF07A', 0.4, 0.4, 0.3); }
  if (k.plow > 0) {
    k.plow -= dt; k.plowT -= Math.abs(k.speed) * dt;
    if (k.plowT <= 0) {
      k.plowT = 2.3;
      furrowMat ??= toonColor('#fff', {
        transparent: true, depthWrite: false, userData: NO_OUTLINE, emissive: '#5a2a00', emissiveIntensity: 0.5,
        map: canvasTex(64, 64, (g, w, h) => {
          g.fillStyle = '#6B3F1F'; g.fillRect(0, 0, w, h); g.fillStyle = '#4A2A12'; for (let x = 4; x < w; x += 12) g.fillRect(x, 0, 5, h);
          g.strokeStyle = '#FF9F1C'; g.lineWidth = 6; g.beginPath(); g.moveTo(10, 46); g.lineTo(32, 22); g.lineTo(54, 46); g.stroke();
        }),
      });
      const pos = k.pos.clone().addScaledVector(fwd, -2.6), m = new THREE.Mesh(furrowGeo, furrowMat.clone());
      pos.y=courseSurface(pos).height;
      m.rotation.set(-Math.PI / 2, k.heading + Math.PI, 0, 'YXZ'); m.position.copy(pos).add(new THREE.Vector3(0,.09,0)); scene.add(m);
      hazards.push({ type: 'furrow', o: m, pos, r: 1.6, life: 9, owner: k, arm: 1.2 });
    }
  }
  if (k.spraying > 0) {
    k.spraying -= dt;
    const nose = k.pos.clone().addScaledVector(fwd, 2.6);
    for (let n = 0; n < (k.sprayMode === 'side' ? 0 : 4); n++) {
      const sp = rr(18, 26), dir = fwd.clone().addScaledVector(side, rr(-0.18, 0.18));
      particles.emit(nose.x, 1.6, nose.z, dir.x * sp + fwd.x * k.speed * 0.5, rr(2, 4), dir.z * sp + fwd.z * k.speed * 0.5, n % 2 ? '#4FC3F7' : '#B3E5FC', 0.35, 0.6, 0.6, 9);
    }
    if (k.v.booms.L) for (const sd of [-1, 1]) for (let n = 0; n < 2; n++) {
      const b = k.pos.clone().addScaledVector(side, sd * rr(1.5, 5.5)).addScaledVector(fwd, rr(-1.5, 1));
      particles.emit(b.x, 2.2, b.z, side.x * sd * 3, -2, side.z * sd * 3, n ? '#81D4FA' : '#E1F5FE', 0.35, 0.5, 0.5, 6);
    }
    for (const o of karts) {
      if (o === k || o.finished || o.guide > 0 || Math.abs(o.groundY+o.y-k.groundY-k.y)>2.5) continue;
      const rel = o.pos.clone().sub(k.pos), along = rel.dot(fwd), lat = rel.dot(side);
      const inJet = k.sprayMode === 'side' ? Math.abs(along) < 5 && Math.abs(lat) > 1.5 && Math.abs(lat) < 9 : along > 0 && along < 24 && Math.abs(lat) < 3 + along * 0.2;
      if (inJet) {
        k.sprayBlocked??=new Set();
        if(k.sprayBlocked.has(o))continue;
        if(blockAttack(o)){k.sprayBlocked.add(o);continue;}
        o.pos.addScaledVector(side, Math.sign(lat || 1) * 7 * dt); o.speed *= 1 - 1.2 * dt;
        if (o.isPlayer && !o.wetMsg) { flash('Molhado! 💦', 800); o.wetMsg = true; }
      } else if (o.isPlayer) o.wetMsg = false;
    }
  }
  if (k.v.booms.L && k.v.booms.R) {
    const sprayingSides=k.spraying>0 && k.sprayMode==='side';
    k.boomAng = lerp(k.boomAng, sprayingSides ? 0 : BOOM_FOLDED, damp(6, dt));
    k.v.booms.L.rotation.y = -k.boomAng; k.v.booms.R.rotation.y = k.boomAng;
  }
}

// ================================================================== input
const keys = {};
const driftGesture = { lastSide: 0, lastAt: -Infinity, side: 0, active: false };
const steerSide = code => ['KeyA','ArrowLeft'].includes(code) ? 1 : ['KeyD','ArrowRight'].includes(code) ? -1 : 0;
const sideHeld = side => side===1 ? keys.KeyA || keys.ArrowLeft : keys.KeyD || keys.ArrowRight;
function steerPressed(code) {
  const side = steerSide(code);
  if (!side || state.mode !== 'race' || state.paused) return;
  // A/D and the arrow for the same side count as one held direction.
  if(sideHeld(side)) return;
  if(sideHeld(-side)) {Object.assign(driftGesture,{active:false,lastSide:0,lastAt:-Infinity});return;}
  const now = performance.now();
  if (driftGesture.lastSide === side && now - driftGesture.lastAt <= 300) {
    driftGesture.side = side; driftGesture.active = true; driftGesture.lastAt = -Infinity;
  } else {
    driftGesture.active = false; driftGesture.lastAt = now;
  }
  driftGesture.lastSide = side;
}
function steerReleased(code) {
  const side=steerSide(code);
  if (side && side === driftGesture.side && !sideHeld(side)) driftGesture.active = false;
}
function clearDrivingInput() {
  Object.keys(keys).forEach(k => { keys[k] = false; });
  Object.assign(driftGesture, { active: false, side: 0, lastSide: 0, lastAt: -Infinity });
  document.querySelectorAll('.tbtn.on').forEach(b => b.classList.remove('on'));
  if(player) {player.drifting=false;player.driftCharge=0;player.hop=0;}
}
function suspendDriving() {
  if(inRace()) togglePause(true);
  else clearDrivingInput();
}
addEventListener('blur', suspendDriving);
document.addEventListener('visibilitychange',()=>{if(document.hidden) suspendDriving();});
addEventListener('keydown', e => {
  if(!$('guide').classList.contains('hidden')) {if(e.code==='Escape'){e.preventDefault();ui.closeDrivingGuide();}return;}
  // In the editor, arrows and Space belong to form fields, radio cards and buttons.
  if (state.mode === 'garage' || (!['Escape','KeyP'].includes(e.code) && e.target.closest?.('button,input,select,textarea') && (!inRace() || state.paused))) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  steerPressed(e.code);
  keys[e.code] = true;
  if (state.mode === 'race' && !state.paused) {
    if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') useItem(player);
    if (e.code === 'KeyR') respawn(player);
    if (e.code === 'KeyQ') useAbility(player);
    if (e.code === 'KeyH') audio.horn(profile.sel.horn);
  }
  if (e.code === 'KeyC') state.camMode = (state.camMode + 1) % 2;
  if ((e.code === 'Escape' || e.code === 'KeyP') && (state.mode === 'race' || state.mode === 'countdown')) togglePause();
  if (state.mode === 'cutscene' && (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space')) endCutscene();
});
addEventListener('keyup', e => { keys[e.code] = false; steerReleased(e.code); });
function setupTouch() {
  if (IS_TOUCH) document.body.classList.add('is-touch');
  $('touch').querySelectorAll('[data-k]').forEach(btn => {
    const code = btn.dataset.k;
    const down = e => {
      e.preventDefault(); btn.setPointerCapture?.(e.pointerId); btn.classList.add('on');
      steerPressed(code);
      keys[code] = true;
      if (state.mode !== 'race' || state.paused) return;
      if (code === 'KeyE') useItem(player);
      if (code === 'KeyQ') useAbility(player);
    };
    const up = e => { e.preventDefault(); btn.classList.remove('on'); keys[code] = false; steerReleased(code); };
    btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up);
    const cancel=e=>{if(keys[code]) {up(e);clearDrivingInput();}};
    btn.addEventListener('pointercancel', cancel); btn.addEventListener('lostpointercapture', cancel);
  });
  $('abil').addEventListener('pointerdown', e => { e.preventDefault(); useAbility(player); });
  $('abil').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();useAbility(player);}});
  $('pauseBtn').addEventListener('click', () => togglePause());
}
function guideSteer(k) {
  const target = drivingTarget(k,10+Math.max(0,k.speed)*.45);
  return clamp(wrapAngle(Math.atan2(target.x - k.pos.x, target.z - k.pos.z) - k.heading) * 2.6, -1, 1);
}
function assistSteer(k) {
  const width=k.route?.width??CFG.halfW;
  const lat = clamp(k.lat, -Math.max(0,width-2.5), Math.max(0,width-2.5));
  const target = drivingTarget(k,8+Math.max(0,k.speed)*.5,lat);
  return clamp(wrapAngle(Math.atan2(target.x - k.pos.x, target.z - k.pos.z) - k.heading) * 2.2, -1, 1);
}
const playerInput = () => {
  const brake = keys.KeyS || keys.ArrowDown ? 1 : 0;
  let steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  if (profile.opts.assist && player.speed > 2 && player.spin <= 0 && player.y < 0.2) {
    const a = assistSteer(player);
    steer = steer !== 0 ? clamp(steer + (player.offroad ? a * 0.6 : 0), -1, 1) : a * 0.85;
  }
  return {
    throttle: keys.KeyW || keys.ArrowUp || ((profile.opts.autoGas || IS_TOUCH) && state.mode === 'race' && !brake) ? 1 : 0,
    brake, steer, drift: driftGesture.active && Math.sign(steer) === driftGesture.side,
  };
};
function respawn(k) {
  if(k.finished) return;
  // Return to the same race progress, including when leaving a shortcut.
  const i=sIdx(k.idx);
  k.pos.copy(trackPoint(i, 0)).setY(0); k.groundY=S[i].p.y;k.route=null;k.routeU=0;k.idx=k.prevIdx=i;
  k.heading=k.moveDir=headingOf(S[i].t);k.speed=0;k.steer=0;k.lastSpeed=0;k.spin=0;k.spinAng=0;
  k.drifting=false;k.driftCharge=0;k.driftVis=0;k.hop=0;k.boost=0;k.guide=0;
  k.trAxle=null;k.y=0;k.vy=0;k.airT=0;k.rampSfx=false;k.wrongWay=0;
  if(k.isPlayer) {clearDrivingInput();state.cameraSnap=true;}
}

// ================================================================== AI
function aiInput(k, dt) {
  const ai = k.ai;
  ai.laneT += dt * 0.25;
  const width=k.route?.width??CFG.halfW;
  const lane = ai.lane + Math.sin(ai.laneT) * 2.5;
  const target = drivingTarget(k,9+k.speed*.55,clamp(lane,-Math.max(0,width-2.5),Math.max(0,width-2.5)));
  if(!k.route && k.ai.skill>.93) for(const route of courseLayouts[TRACK.id]?.branches??[]) {
    if(k.idx>route.start*CFG.N-28 && k.idx<route.start*CFG.N+12) {const p=route.samples[10];target.set(p[0],p[1],p[2]);}
  }
  for (const h of hazards) {
    if ((h.type === 'flower' || h.type === 'cloud') && Math.abs(h.pos.y-k.groundY)<3 && Math.hypot(h.pos.x-k.pos.x,h.pos.z-k.pos.z)<28) {
      const toH = h.pos.clone().sub(k.pos);
      if (toH.dot(fwdOf(k)) > 0) target.addScaledVector(S[k.idx].l, (toH.dot(S[k.idx].l) > 0 ? -1 : 1) * Math.min(3.5,width-1.5));
    }
  }
  const sameRoute=p=>courseSurface(p).route===k.route;
  for (const r of ramps) { const to = r.p.clone().sub(k.pos).setY(0); if (to.length() < 45 && to.dot(fwdOf(k)) > 8 && sameRoute(r.p)) { target.lerp(r.p, 0.7); break; } }
  for (const c of coinsOnTrack) if (c.active && Math.hypot(c.p.x-k.pos.x,c.p.z-k.pos.z)<22 && c.p.clone().sub(k.pos).dot(fwdOf(k)) > 6 && sameRoute(c.p)) { target.lerp(c.p, 0.35); break; }
  const diff = wrapAngle(Math.atan2(target.x - k.pos.x, target.z - k.pos.z) - k.heading);
  const cornerSharp = 1 - S[sIdx(k.idx + Math.round(35 / SPACING))].t.dot(S[k.idx].t);
  const gap = progOf(player) - progOf(k);
  const skill = state.mode === 'race' ? ai.skill + clamp(gap / CFG.N * 0.5, -0.08, 0.12) : ai.skill;
  const input = { throttle: 1, brake: 0, steer: clamp(diff * 2.4, -1, 1), drift: false, skill };
  if (cornerSharp > 0.35 && k.speed > 24) input.throttle = 0.4;
  if (Math.abs(diff) > 0.9 && k.speed > 12) { input.brake = 1; input.throttle = 0; }
  const nearEdge = Math.abs(k.lat) > width - 1.5;
  if (cornerSharp > 0.12 && Math.abs(diff) > 0.12 && k.speed > 18 && !nearEdge) ai.driftT = 0.9;
  if (nearEdge || (k.drifting && input.steer * k.driftDir < -0.3)) ai.driftT = 0;
  ai.driftT -= dt; input.drift = ai.driftT > 0;
  ai.stuckT = (ai.stuckT ?? 0) + dt;
  if (ai.stuckT > 3) {
    const prog = progOf(k);
    if (state.mode !== 'countdown' && ai.lastProg !== undefined && prog - ai.lastProg < 20 && !k.finished) respawn(k);
    ai.lastProg = prog; ai.stuckT = 0;
  }
  if (k.charge >= 1 && state.mode === 'race') {
    ai.abilT = (ai.abilT ?? 0) + dt;
    let go = ai.abilT > 6;
    if (k.ability === 'plantio') go ||= karts.some(o => o !== k && o.pos.distanceTo(k.pos) < 30 && progOf(o) < progOf(k));
    else if (k.ability === 'barras') go ||= karts.some(o => o !== k && Math.abs(progOf(o) - progOf(k)) * SPACING < 5 && o.pos.distanceTo(k.pos) < 9);
    else go ||= cornerSharp < 0.05;
    if (go) { useAbility(k); ai.abilT = 0; }
  }
  if (k.item && k.rolling <= 0) {
    ai.itemDelay -= dt;
    if (ai.itemDelay <= 0) {
      const ahead=karts.some(o=>{
        if(o===k || o.finished || Math.abs(o.groundY-k.groundY)>2.5)return false;
        const rel=o.pos.clone().sub(k.pos),distance=rel.length(),along=rel.dot(fwdOf(k));
        return along>3 && distance<(k.item==='jato'?22:55) && along/distance>.95;
      });
      const use = k.item === 'turbo' ? cornerSharp < 0.05 : ['disco','jato'].includes(k.item)?ahead:k.item==='escudo'?k.shield<=0:k.item==='ima'?k.magnet<=0:true;
      if (use || ai.itemDelay < -8) { useItem(k); ai.itemDelay = rr(1, 4); }
    }
  }
  return input;
}

// ================================================================== kart physics
const tmpV = new THREE.Vector3();
function updateKart(k, input, dt, frozen) {
  if ((k.finished || k.autopilot || state.mode === 'cutscene' || state.mode === 'attract') && k.isPlayer) input = aiInput(k, dt);
  if (frozen) input = { ...input, throttle: 0, brake: 0, steer: 0, drift: false };
  if (k.guide > 0 && !frozen) input = { throttle: 1, brake: 0, steer: guideSteer(k), drift: false };
  if (k.spin > 0) { k.spin -= dt; k.spinAng += dt * 14; input = { throttle: 0, brake: 0, steer: 0, drift: false }; }
  else k.spinAng = lerp(k.spinAng, Math.round(k.spinAng / (Math.PI * 2)) * Math.PI * 2, damp(10, dt));
  const air = k.y > 0 || k.vy !== 0;

  const s=courseSurface(k.pos);
  k.idx=s.index;k.lat=s.lat;k.route=s.route;k.routeU=s.routeU;
  if(air) k.y+=k.groundY-s.height;
  k.groundY=s.height;
  k.offroad = !air && Math.abs(k.lat) > s.width + 0.9;
  k.inMud = !air && muds.some(m => {
    const dx = k.pos.x - m.p.x, dz = k.pos.z - m.p.z, c = Math.cos(m.h), sn = Math.sin(m.h);
    return ((dx * c - dz * sn) / m.rx) ** 2 + ((dx * sn + dz * c) / m.rz) ** 2 < 1;
  });
  if (!air) for (const p of pads) if ((k.pos.x - p.p.x) ** 2 + (k.pos.z - p.p.z) ** 2 < p.r * p.r * 2.2) {
    if (k.boost < 0.9) playerSfx(k, 'miniturbo');
    k.boost = Math.max(k.boost, 1.1);
  }

  let max = CFG.maxSpeed * (input.skill ?? 1) * k.mods.speed * (1 + k.coins * 0.01);
  if (k.offroad) max *= CFG.offroadFactor;
  if (k.clean > 0) k.inMud = false;
  if (k.inMud) { max *= CFG.mudFactor; if (Math.random() < 0.3 && Math.abs(k.speed) > 5) particles.emit(k.pos.x, 0.4, k.pos.z, rr(-3, 3), rr(2, 4), rr(-3, 3), '#5A3A1C', 0.4, 0.6, 0.5, 10); }
  if (k.slow > 0) max *= 0.55;
  if (k.sprout > 0) { max *= 0.88; k.sprout -= dt; }
  if (k.guide > 0) { max = CFG.boostSpeed * 0.88; k.offroad = false; }
  if (k.boost > 0) { max = CFG.boostSpeed * (k.inMud ? 0.8 : 1); k.boost -= dt; }

  const accel = k.boost > 0 ? 45 : 15 * k.mods.accel;
  if (input.throttle > 0 && k.speed >= -0.5 && k.speed < max) k.speed += accel * input.throttle * dt * (1 - 0.55 * clamp(k.speed / max, 0, 1));
  if (input.brake > 0) { if (k.speed > 0.5) k.speed -= 34 * dt; else k.speed = Math.max(k.speed - 12 * dt, -9); }
  else if (input.throttle > 0 && k.speed < 0) k.speed += 30 * dt;
  if (!input.throttle && !input.brake) k.speed -= Math.sign(k.speed) * Math.min(Math.abs(k.speed), 7 * dt);
  if (k.speed > max && !air) k.speed = Math.max(max, k.speed - (k.offroad || k.inMud ? 40 : 18) * dt);

  // Drift stays on the ground; ramps only launch and land the vehicle.
  const absV = Math.abs(k.speed);
  if (!air && input.drift && !k.drifting && Math.abs(input.steer) > 0.25 && k.speed > 13 && k.spin <= 0) {
    k.drifting = true; k.driftDir = Math.sign(input.steer); k.driftCharge = 0; k.hop = 0.22;
  }
  k.prevDrift = input.drift;
  if (k.drifting && (!input.drift || air || k.speed < 9 || k.spin > 0 || frozen)) {
    k.drifting = false;
    if (!input.drift && !air && k.speed>=9 && k.spin <= 0 && !frozen) {
      if (k.driftCharge > 2.1) { k.boost = Math.max(k.boost, 1.25); addCharge(k, 0.2); playerSfx(k, 'boost'); if (k.isPlayer) { runMetrics.perfect++; flash('DRIFT PERFEITO!', 650); } }
      else if (k.driftCharge > 1.0) { k.boost = Math.max(k.boost, 0.65); addCharge(k, 0.12); playerSfx(k, 'miniturbo'); if (k.isPlayer) { runMetrics.drift++; flash('BOM DRIFT!', 600); } }
    }
    k.driftCharge = 0;
  }
  k.steer = lerp(k.steer, input.steer, damp(12, dt));
  const sf = clamp(absV / 6, 0, 1) * (1 - 0.32 * Math.min(1, absV / 40)) * (air ? 0.5 : 1);
  let turn = k.steer * 1.9 * k.mods.turn * sf * (k.speed < 0 ? -1 : 1);
  if (k.drifting) {
    turn = (k.driftDir * 1.05 + k.steer * 0.75) * sf;
    const before=k.driftCharge;k.driftCharge += dt * (k.steer * k.driftDir > 0.2 ? 1.5 : 0.8);
    if(k.isPlayer && !k.finished) {
      if(before<=2.1 && k.driftCharge>2.1) playerSfx(k,'driftPerfect');
      else if(before<=1 && k.driftCharge>1) playerSfx(k,'driftGood');
    }
  }
  k.heading = wrapAngle(k.heading + turn * dt);
  const grip = air ? 1.5 : k.drifting ? 2.6 : (k.offroad ? 7 : 10);
  k.moveDir = lerpAngle(k.moveDir, k.heading, damp(grip, dt));
  k.pos.x += Math.sin(k.moveDir) * k.speed * dt;
  k.pos.z += Math.cos(k.moveDir) * k.speed * dt;

  // Resolve horizontal contacts before sampling the ground used for landing.
  {
    const contact=courseSurface(k.pos),lat=contact.lat,wall=contact.route?contact.width+1:WALL-1.2;
    if(Math.abs(lat)>wall) {
      k.pos.addScaledVector(contact.l,-Math.sign(lat)*(Math.abs(lat)-wall));
      if(k.bumpCd<=0 && absV>8) {k.speed*=.55;k.bumpCd=.4;playerSfx(k,'bump');if(k.isPlayer) state.shake=Math.max(state.shake,.3);}
      const th=headingOf(contact.t);
      if(Math.cos(k.heading-th)>0) k.heading=lerpAngle(k.heading,th,damp(5,dt));
    }
  }
  if(!air) for(const c of colliders) {
    const dx=k.pos.x-c.x,dz=k.pos.z-c.z,r=c.r+1.3,d2=dx*dx+dz*dz;
    if(d2<r*r && Math.abs(k.groundY-(c.y??0))<3) {
      const d=Math.sqrt(d2),nx=d>1e-5?dx/d:Math.cos(k.heading),nz=d>1e-5?dz/d:-Math.sin(k.heading);
      k.pos.x=c.x+nx*r;k.pos.z=c.z+nz*r;
      if(k.bumpCd<=0 && absV>6) {k.speed*=.5;k.bumpCd=.4;playerSfx(k,'bump');if(k.isPlayer) state.shake=Math.max(state.shake,.3);}
    }
  }
  k.bumpCd-=dt;
  const surface=courseSurface(k.pos);
  if(air) k.y+=k.groundY-surface.height;
  k.groundY=surface.height;k.idx=surface.index;k.lat=surface.lat;k.route=surface.route;k.routeU=surface.routeU;

  // ramps: ride up the deck, then fly
  let onRamp = false;
  for (const r of ramps) {
    const dx = k.pos.x - r.p.x, dz = k.pos.z - r.p.z;
    const along = dx * Math.sin(r.h) + dz * Math.cos(r.h), lat = dx * Math.cos(r.h) - dz * Math.sin(r.h);
    if (Math.abs(lat) < r.hw && along > -r.hd && along < r.hd && k.speed > 4 && Math.cos(k.heading - r.h) > 0.3) {
      const hgt = r.p.y-k.groundY+(along + r.hd) / (2 * r.hd) * r.H;
      if (hgt>=-.35 && k.y <= hgt + 0.35 && (!air || k.rampSfx)) { k.y = Math.max(0,hgt); k.vy = k.speed * (r.H / (2 * r.hd)) + 4.5; onRamp = true; if (!k.rampSfx) { playerSfx(k, 'jump'); k.rampSfx = true; } }
    }
  }
  if (!onRamp) {
    k.rampSfx = false;
    if (air || k.y > 0 || k.vy !== 0) {
      k.y += k.vy * dt; k.vy -= CFG.gravity * dt; k.airT += dt;
      if (k.y <= 0) {
        if (k.airT > 0.3) {
          playerSfx(k, 'land');
          for (let n = 0; n < 14; n++) particles.emit(k.pos.x + rr(-1.5, 1.5), 0.3, k.pos.z + rr(-1.5, 1.5), rr(-4, 4), rr(1, 3), rr(-4, 4), THEME.road, 0.7, 0.7, 1.2);
          if (k.isPlayer) state.shake = Math.max(state.shake, 0.25);
          if (k.isPlayer && !k.finished && state.mode==='race') runMetrics.jumps++;
        }
        k.y = 0; k.vy = 0; k.airT = 0;
      }
    }
  }

  // pickups
  for (const b of itemBoxes) if (!k.finished && racePlan.mode!=='time' && b.active && Math.abs(k.groundY+k.y-b.p.y)<2.5 && (k.pos.x - b.p.x) ** 2 + (k.pos.z - b.p.z) ** 2 < 2.4 ** 2) {
    b.active = false; b.timer = 2.5; b.g.visible = false;
    for (let n = 0; n < 14; n++) particles.emit(b.p.x, 1, b.p.z, rr(-5, 5), rr(2, 7), rr(-5, 5), ['#FFE066', '#FF9F1C', '#fff'][n % 3], 0.5, 0.7, 0.2, 10);
    if (!k.item && k.rolling <= 0) { k.rolling = k.isPlayer ? 1.1 : 0.6; k.pendingItem = rollItem(k.place); addCharge(k, 0.15); playerSfx(k, 'itembox'); }
  }
  if (k.rolling > 0) { k.rolling -= dt; if (k.rolling <= 0) { k.item = k.pendingItem; playerSfx(k, 'itemget'); } }
  for (const c of coinsOnTrack) if (!k.finished && c.active && Math.abs(k.groundY+k.y-c.p.y)<2.5 && (k.pos.x - c.p.x) ** 2 + (k.pos.z - c.p.z) ** 2 < (k.magnet>0?64:3.2)) {
    c.active = false; c.timer = 8; c.o.visible = false;
    k.coins = Math.min(10, k.coins + 1);
    for (let n = 0; n < 8; n++) particles.emit(c.p.x, 1.2, c.p.z, rr(-3, 3), rr(2, 5), rr(-3, 3), n % 2 ? '#FFC83D' : '#FFF59D', 0.3, 0.5, 0.2, 6);
    playerSfx(k, 'coin');
    if (k.isPlayer) {k.coinsGot = (k.coinsGot ?? 0) + 1;runMetrics.corn++;}
  }

  { const f = fwdOf(k); updateItemEffects(k, dt, f, new THREE.Vector3(f.z, 0, -f.x)); }
  addCharge(k, dt * (absV > 8 ? 0.05 : 0.01));

  // laps
  const prev = k.prevIdx ?? k.idx;
  let step=k.idx-prev;
  if(step>CFG.N/2) step-=CFG.N;
  if(step<-CFG.N/2) step+=CFG.N;
  if(Math.abs(step)<CFG.N*.15) k.progress+=step;
  if(k.isPlayer && k.route && !k.routeAwarded) {runMetrics.shortcuts++;k.routeAwarded=true;}
  if(!k.route) k.routeAwarded=false;
  const gate=(k.checkpoint+1)*CFG.N/5;
  if(k.checkpoint<4 && prev<gate && k.idx>=gate && k.idx-prev<CFG.N*.15) k.checkpoint++;
  if (prev > CFG.N * 0.85 && k.idx < CFG.N * 0.15) {
    if (k.progress>=k.lap*CFG.N && (k.lap === 0 || k.checkpoint===4)) { k.lap++; k.maxIdx = 0;k.checkpoint=0; onLap(k); }
  }
  if (k.idx < CFG.N * 0.85) k.maxIdx = Math.max(k.maxIdx, k.idx);
  k.prevIdx = k.idx;
  const fwdDot = Math.cos(k.moveDir-headingOf(surface.t))*Math.sign(k.speed);
  k.wrongWay = fwdDot < -0.3 && absV > 4 ? k.wrongWay + dt : 0;

  // visuals
  const v = k.v;
  v.root.position.set(k.pos.x, k.groundY+k.y, k.pos.z); v.root.rotation.y = k.heading;
  k.hop = Math.max(0, k.hop - dt);
  k.driftVis = lerp(k.driftVis, k.drifting ? k.driftDir * 0.38 : 0, damp(8, dt));
  v.tilt.rotation.y = k.driftVis + k.spinAng;
  updateTrailer(k);
  v.tilt.position.y = Math.sin(clamp(k.hop / 0.22, 0, 1) * Math.PI) * 0.45 + Math.sin(state.t*(4+absV*.22))*.018 + (k.offroad ? Math.sin(state.t * 40 + k.def.paint.length) * 0.03 : 0);
  v.tilt.rotation.z = -k.steer * clamp(absV / 30, 0, 1) * 0.06 - k.driftVis * 0.1;
  v.tilt.rotation.z+=surface.bank;
  if(v.eyes) {
    const other=karts.find(o=>o!==k && o.pos.distanceTo(k.pos)<9);
    const glance=other?clamp(other.pos.clone().sub(k.pos).dot(new THREE.Vector3(Math.cos(k.heading),0,-Math.sin(k.heading)))*.025,-.17,.17):0;
    v.eyes.rotation.y=lerp(v.eyes.rotation.y,glance,damp(5,dt));
  }
  v.tilt.rotation.x = air ? clamp(-k.vy * 0.02, -0.25, 0.25) : clamp(-(k.speed - (k.lastSpeed ?? k.speed)) / dt * 0.004, -0.06, 0.06);
  if(!air) v.tilt.rotation.x-=Math.atan2(drivingTarget(k,3,k.lat).y-k.groundY,3);
  k.lastSpeed = k.speed;
  k.wheelRot -= k.speed * dt;
  v.wheels.RL.rotation.x = v.wheels.RR.rotation.x = k.wheelRot / v.wheelR.R;
  v.wheels.FL.rotation.x = v.wheels.FR.rotation.x = k.wheelRot / v.wheelR.F;
  v.wheels.FL.rotation.y = v.wheels.FR.rotation.y = k.steer * 0.45;
  if (v.beaconMat) v.beaconMat.emissiveIntensity = k.boost > 0 ? 3.5 : 1.2;

  const back = new THREE.Vector3(-Math.sin(k.heading), 0, -Math.cos(k.heading));
  const side = new THREE.Vector3(Math.cos(k.heading), 0, -Math.sin(k.heading));
  if (!air && absV > 6 && Math.random() < (k.offroad ? 0.7 : 0.3)) for (const sd of [-1, 1]) {
    const x = k.pos.x + back.x * 1.8 + side.x * sd * 0.9, z = k.pos.z + back.z * 1.8 + side.z * sd * 0.9;
    particles.emit(x, 0.3, z, back.x * 2 + rr(-1, 1), rr(0.5, 2), back.z * 2 + rr(-1, 1), k.inMud ? '#5A3A1C' : k.offroad ? '#A7D77E' : THEME.roadSpeck[1], k.inMud ? 0.45 : 0.5, 0.6, 1.4, k.inMud ? 8 : 0);
  }
  if (k.drifting) {
    const col = k.driftCharge > 2.1 ? '#FF8C1A' : k.driftCharge > 1.0 ? '#4FC3F7' : '#FFFFFF';
    for (const sd of [-1, 1]) {
      const x = k.pos.x + back.x * 1.4 + side.x * sd, z = k.pos.z + back.z * 1.4 + side.z * sd;
      particles.emit(x, 0.25, z, rr(-2, 2), rr(1, 3), rr(-2, 2), col, 0.35, 0.25, 0.1, 8);
    }
  }
  const exh = v.ch.exhaust;
  const ex = k.pos.clone().addScaledVector(back, exh.back).addScaledVector(side, exh.side);
  if (k.boost > 0) particles.emit(ex.x, exh.y + k.y, ex.z, rr(-0.5, 0.5), rr(3, 5), rr(-0.5, 0.5), Math.random() < 0.5 ? '#FF6B1A' : '#FFD23F', 0.55, 0.35, 1.2);
  else if (Math.random() < 0.07) particles.emit(ex.x, exh.y + k.y, ex.z, rr(-0.3, 0.3), 1.6, rr(-0.3, 0.3), '#6E6E6E', 0.2, 0.7, 1.4);
}

function updateTrailer(k) {
  const tr = k.v.trailer; if (!tr) return;
  const f = fwdOf(k), H = k.pos.clone().addScaledVector(f, -k.v.ch.hitch.back);
  if (!k.trAxle) { k.trAxle = H.clone().addScaledVector(f, -tr.len); k.trRot = 0; }
  const d = k.trAxle.clone().sub(H); d.y = 0;
  if (d.lengthSq() < 1e-4) d.copy(f).negate();
  d.normalize();
  let ang = Math.atan2(-d.x, -d.z);
  const rel = wrapAngle(ang - k.heading), lim = 1.5;
  if (Math.abs(rel) > lim) { ang = k.heading + Math.sign(rel) * lim; d.set(-Math.sin(ang), 0, -Math.cos(ang)); }
  const prev = k.trAxle.clone();
  k.trAxle.copy(H).addScaledVector(d, tr.len);
  k.trDir = d.clone().negate(); k.trH = H;
  k.trRot -= k.trAxle.distanceTo(prev) * Math.sign(k.speed || 1);
  tr.root.position.set(H.x, courseSurface(H).height+k.v.ch.hitch.y + k.y * 0.85 + k.v.tilt.position.y * 0.5, H.z);
  tr.root.rotation.y = ang;
  tr.root.rotation.x = k.y > 0.15 ? clamp(-k.vy * 0.015, -0.2, 0.2) : 0;
  for (const w of tr.wheels) w.o.rotation.x = k.trRot / w.r;
  if (Math.abs(k.speed) > 6 && k.y < 0.15 && Math.random() < 0.35) {
    const rear = k.trAxle.clone().addScaledVector(d, 0.6).addScaledVector(new THREE.Vector3(d.z, 0, -d.x), rr(-1.8, 1.8));
    particles.emit(rear.x, 0.15, rear.z, 0, 0.6, 0, Math.random() < 0.5 ? '#6CC23A' : '#F2D16B', 0.22, 0.9, 0.2);
  }
}
function trailerInteractions() {
  for (const a of karts) {
    if (!a.v.trailer || !a.trAxle) continue;
    const C = a.trAxle.clone().add(a.trH).multiplyScalar(0.5), R = a.trAxle.clone().addScaledVector(a.trDir, -2.0);
    for (const b of karts) {
      if (b === a) continue;
      if(Math.abs(a.groundY+a.y-b.groundY-b.y)>1.5) continue;
      const dx = b.pos.x - C.x, dz = b.pos.z - C.z, d2 = dx * dx + dz * dz, rad = 2.5;
      if (d2 < rad * rad && d2 > 1e-6) { const d = Math.sqrt(d2); b.pos.x += dx / d * (rad - d); b.pos.z += dz / d * (rad - d); b.speed *= 0.98; }
      if ((b.pos.x - R.x) ** 2 + (b.pos.z - R.z) ** 2 < 16 && b.speed > 5 && b.guide <= 0) b.sprout = 0.25;
    }
  }
}
function collideKarts() {
  for (let i = 0; i < karts.length; i++) for (let j = i + 1; j < karts.length; j++) {
    const a = karts[i], b = karts[j];
    if (Math.abs(a.groundY+a.y-b.groundY-b.y) > 1.5) continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d2 = dx * dx + dz * dz, R = 2.7;
    if (d2 < R * R) {
      const d = Math.sqrt(d2), push = (R - d) / 2, nx = d>1e-5?dx/d:Math.cos(a.heading), nz = d>1e-5?dz/d:-Math.sin(a.heading);
      a.pos.x -= nx * push; a.pos.z -= nz * push; b.pos.x += nx * push; b.pos.z += nz * push;
      const avg = (a.speed + b.speed) / 2; a.speed = lerp(a.speed, avg, 0.3); b.speed = lerp(b.speed, avg, 0.3);
      if ((a.isPlayer || b.isPlayer) && a.bumpCd <= 0 && b.bumpCd<=0 && inRace()) { audio.sfx('bump'); a.bumpCd = b.bumpCd = 0.3; state.shake = Math.max(state.shake, 0.15); }
    }
  }
}

// ================================================================== race state & HUD
const state = { mode: 'boot', t: 0, raceTime: 0, countdown: 0, camMode: 0, finishOrder: [], lastBeep: 4, shake: 0, paused: false,
  cut: null, attract: { target: 0, t: 0 }, podiumT: 0, finishT: 0 };
let racePlan={mode:'quick',challenge:'drift',stage:0,results:[]};
const raceLaps=()=>racePlan.mode==='challenge'?1:CFG.laps;
let runMetrics=freshMetrics(),ghostRun=null,finishedGhost=null;
function prepareRace(mode,track,challenge='drift') {
  racePlan={mode:['quick','cup','time','challenge'].includes(mode)?mode:'quick',challenge,stage:0,results:[]};
  profile.sel.track=mode==='cup'?CUP.tracks[0]:track;save();return profile.sel.track;
}
let player = null;
let camHeading = 0;
const raceLook=new THREE.Vector3();
const fmt = t => { const m = Math.floor(t / 60), s = t % 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
let flashTimer = null;
function flash(text, ms = 1200, sub = '') {
  if (!inRace()) return;
  $('msg').textContent = text; $('sub').textContent = sub;
  $('msg').classList.remove('pop'); void $('msg').offsetWidth; $('msg').classList.add('pop');
  clearTimeout(flashTimer); if (ms) flashTimer = setTimeout(() => { $('msg').textContent = ''; $('sub').textContent = ''; }, ms);
}
function onLap(k) {
  if (k.finished || state.mode !== 'race') return;
  if (k.lap > raceLaps()) {
    k.finished = true; k.finishTime = state.raceTime; state.finishOrder.push(k);
    if (k.isPlayer) {
      k.finishedMetrics={...runMetrics};
      if(racePlan.mode==='time') finishedGhost=ghostRun?.finish(k.finishTime,k);
      const p = state.finishOrder.length;
      flash(racePlan.mode==='time'?'TEMPO CONCLUÍDO!':p === 1 ? '1º LUGAR! 🏆' : `${p}º lugar!`, 0, 'Fim de corrida');
      audio.sfx('finish'); confetti(new THREE.Vector3(k.pos.x, 0, k.pos.z), 80);
      state.finishT = 3.2;
    }
    return;
  }
  if (k.isPlayer && k.lap > 1) {
    if (k.lap === raceLaps()) { flash('VOLTA FINAL!', 1600); audio.sfx('finalLap'); audio.setTempo(1.12); }
    else { flash(`Volta ${k.lap}`, 1000); audio.sfx('lap'); }
  }
}
function rankKarts() {
  const sorted = [...karts].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return progOf(b) - progOf(a);
  });
  sorted.forEach((k, i) => { if (k.place && i + 1 < k.place) addCharge(k, 0.08 * (k.place - i - 1)); k.place = i + 1; });
  return sorted;
}

const mini = (() => {
  const c = $('minimap'), g = c.getContext('2d');
  let P = null, path = null, branches=[];
  return {
    reset() {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      S.forEach(s => { x0 = Math.min(x0, s.p.x); x1 = Math.max(x1, s.p.x); z0 = Math.min(z0, s.p.z); z1 = Math.max(z1, s.p.z); });
      const sc = 140 / Math.max(x1 - x0, z1 - z0), ox = 85 - (x0 + x1) / 2 * sc, oz = 85 - (z0 + z1) / 2 * sc;
      P = (x, z) => [170 - (ox + x * sc), 170 - (oz + z * sc)];
      path = new Path2D(); S.forEach((s, i) => { const [a, b] = P(s.p.x, s.p.z); i ? path.lineTo(a, b) : path.moveTo(a, b); }); path.closePath();
      branches=(courseLayouts[TRACK.id]?.branches??[]).map(route=>{const p=new Path2D();route.samples.forEach((point,i)=>{const [x,z]=P(point[0],point[2]);i?p.lineTo(x,z):p.moveTo(x,z);});return p;});
    },
    draw() {
      if (!P) return;
      g.clearRect(0, 0, 170, 170); g.lineJoin = 'round';
      g.strokeStyle = '#203B43dd'; g.lineWidth = 12; g.stroke(path); g.strokeStyle = '#FFF0CF'; g.lineWidth = 8; g.stroke(path);
      g.strokeStyle='#E9C46A';g.lineWidth=4;g.setLineDash([4,4]);branches.forEach(p=>g.stroke(p));g.setLineDash([]);
      const [sx, sz] = P(S[0].p.x, S[0].p.z); g.fillStyle = '#fff'; g.fillRect(sx - 4, sz - 2, 8, 4);
      for (const k of [...karts].reverse()) {
        const [a, b] = P(k.pos.x, k.pos.z);
        g.beginPath(); g.arc(a, b, k.isPlayer ? 6 : 4.5, 0, 7); g.fillStyle = k.def.paint; g.fill();
        g.lineWidth = 2; g.strokeStyle = k.isPlayer ? '#fff' : '#2b1a0e'; g.stroke();
      }
    },
  };
})();
let standingsSignature = '';
function updateStandings() {
  const leaders = [...karts].sort((a, b) => a.place - b.place).slice(0, 4);
  const signature = leaders.map(k => `${k.place}:${k.def.name}:${k.def.char}:${k.def.paint}:${k.isPlayer}`).join('|');
  if (signature === standingsSignature) return;
  standingsSignature = signature;
  const entries = leaders.map(k => {
    const entry = document.createElement('li');
    entry.className = 'standing' + (k.isPlayer ? ' is-player' : '');
    entry.value = k.place;
    entry.setAttribute('aria-label', `${k.place}º lugar: ${k.def.name}`);
    const portrait = document.createElement('span'); portrait.className = 'standingPortrait';
    portrait.style.setProperty('--racer-color', k.def.paint);
    const image = document.createElement('img'); image.src = CHARACTERS[k.def.char].img; image.alt = '';
    const rank = document.createElement('span'); rank.className = 'standingRank'; rank.textContent = k.place;
    portrait.append(image, rank);
    const name = document.createElement('span'); name.className = 'standingName'; name.textContent = k.def.name;
    entry.append(portrait, name); return entry;
  });
  $('standings').replaceChildren(...entries);
}
function updateHUD() {
  const p = player;
  $('pos').innerHTML = `${p.place}<small>º</small><span class="posTotal">de ${karts.length}</span>`;
  $('pos').setAttribute('aria-label',`${p.place}º lugar de ${karts.length}`);
  $('lapValue').innerHTML = `${clamp(p.lap, 1, raceLaps())}<small>/${raceLaps()}</small>`;
  $('timeValue').textContent = fmt(p.finished ? p.finishTime : state.raceTime);
  const speed = Math.round(Math.abs(p.speed) * 3.6);
  $('speedValue').textContent = speed;
  $('speed').setAttribute('aria-label', `Velocidade: ${speed} quilômetros por hora`);
  $('speedNeedle').setAttribute('transform', `rotate(${clamp(Math.abs(p.speed) / CFG.boostSpeed, 0, 1) * 180} 100 115)`);
  const turbo = Math.round(clamp(p.boost / 3, 0, 1) * 100);
  $('boostFill').style.width = `${turbo}%`;
  $('boostFill').parentElement.setAttribute('aria-valuenow', turbo);
  $('speed').classList.toggle('boosting', p.boost > 0);
  $('coinValue').textContent = `×${p.coins}`;
  $('coins').setAttribute('aria-label', `${p.coins} moedas de milho coletadas`);
  updateStandings();
  const icons = ['⛽', '🛰️', '⚡'];
  $('item').textContent = p.rolling > 0 ? icons[Math.floor(performance.now() / 80) % icons.length] : p.item ? ITEMS[p.item].icon : '';
  $('item').setAttribute('aria-label', p.rolling > 0 ? 'Sorteando item' : p.item ? ITEMS[p.item].name : 'Sem item');
  $('item').title=p.item?ITEMS[p.item].description??ITEMS[p.item].name:'Colete uma caixa para ganhar um item.';
  $('itemName').textContent = p.item && p.rolling <= 0 ? `${IS_TOUCH?'ITEM':'E'} · ${ITEMS[p.item].name}` : p.rolling>0?'O que vem aí?':p.guide > 0 ? '🛰️ Piloto Guia' : 'Pegue uma caixa';
  $('item').classList.toggle('ready',!!p.item && p.rolling<=0);
  $('item').classList.toggle('rolling',p.rolling>0);
  $('tItem').classList.toggle('unavailable',!p.item || p.rolling>0);
  const itemEffects=[p.shield>0?`🛡️ Escudo · ${Math.ceil(p.shield)}s`:'',p.magnet>0?`🧲 Ímã · ${Math.ceil(p.magnet)}s`:''].filter(Boolean).join('  ');
  if($('itemEffects').textContent!==itemEffects)$('itemEffects').textContent=itemEffects;
  const ab = ABILITIES[p.ability];
  $('abilIcon').textContent = ab.icon;
  $('abilFill').style.width = `${Math.round(p.charge * 100)}%`;
  $('abilMeter').setAttribute('aria-valuenow',String(Math.round(p.charge*100)));
  $('abilLabel').textContent=p.charge>=1?'PRONTA!':`${Math.round(p.charge*100)}%`;
  $('abil').setAttribute('aria-label',`${ab.name}: ${p.charge>=1?'pronta para usar':Math.round(p.charge*100)+'% carregada'}`);
  $('abil').setAttribute('aria-disabled',String(p.charge<1));
  $('tAbil').classList.toggle('unavailable',p.charge<1);
  $('tAbil').textContent=p.charge>=1?'PRONTA':'HAB';
  $('abil').classList.toggle('full', p.charge >= 1);
  $('tAbil').classList.toggle('full', p.charge >= 1);
  if (p.wrongWay > 1.2 && !p.finished) { $('sub').textContent = '⚠ CONTRAMÃO! ⚠'; p.wwShown = true; }
  else if (p.wwShown) { $('sub').textContent = ''; p.wwShown = false; }
  const sl = p.boost > 0 ? 0.85 : clamp((p.speed - 30) / 10, 0, 0.4);
  $('speedlines').style.opacity = sl.toFixed(2);
  $('driftStatus').classList.toggle('active',p.drifting);
  $('driftStatus').setAttribute('aria-hidden',String(!p.drifting));
  $('driftMeter').style.width=`${clamp(p.driftCharge/2.1,0,1)*100}%`;
  $('driftStatus').dataset.tier=p.driftCharge>2.1?'perfect':p.driftCharge>1?'good':'charging';
  $('driftTrack').setAttribute('aria-valuenow',String(Math.round(clamp(p.driftCharge/2.1,0,1)*100)));
  $('driftLabel').textContent=p.driftCharge>2.1?'PERFEITO! Solte!':p.driftCharge>1?'BOM! Pode soltar':'Segure a curva…';
  const challenge=CHALLENGES.find(c=>c.id===racePlan.challenge);
  $('raceEvent').textContent=racePlan.mode==='cup'?`${CUP.name} · ${racePlan.stage+1}/${CUP.tracks.length}`:racePlan.mode==='time'?`Contra o tempo${profile.timeBest[TRACK.id]?' · melhor '+fmt(profile.timeBest[TRACK.id]):' · grave seu primeiro fantasma'}`:racePlan.mode==='challenge'&&challenge?`${challenge.name}: ${challenge.metric==='drift'?runMetrics.drift+runMetrics.perfect:runMetrics[challenge.metric]}/${challenge.target}`:TRACK.name;
  mini.draw();
}

// ================================================================== race lifecycle
function clearRace() {
  ghostRun?.dispose();ghostRun=null;finishedGhost=null;
  for (const k of karts) { k.v.dispose(); scene.remove(k.v.root); if (k.v.trailer) scene.remove(k.v.trailer.root); }
  karts.length = 0; state.finishOrder = []; state.raceTime = 0; state.finishT = 0;
  for (const h of hazards) if (h.o) scene.remove(h.o); hazards.length = 0;
  for (const e of effects) scene.remove(e.o); effects.length = 0;
  for (const b of itemBoxes) { b.active = true; b.timer=0; b.g.visible = true; }
  for (const c of coinsOnTrack) { c.active = true; c.timer=0; c.o.visible = true; }
  particles.clear();
}
function playerDef() {
  const sel = profile.sel;
  return { name: 'Você', char: sel.char, impl: CHARACTERS[sel.char].tows ? sel.impl : 'none', paint: paintColor(sel.paint), acc: sel.acc, build: profile.builds[sel.char], implBuild: profile.implementBuilds[sel.impl] };
}
function setupGrid(solo=false) {
  clearRace();
  const mine = playerDef();
  const rivals = RIVALS.map(r => ({ ...r }));
  if(!solo) rivals.forEach((d, i) => createKart(d, i, false));
  player = createKart(mine, solo?0:5, true);
  karts.sort((a, b) => (b.isPlayer ? 1 : 0) - (a.isPlayer ? 1 : 0));
  camHeading = player.heading;
  state.cameraSnap=true;
  raceLook.set(player.pos.x,player.groundY+1.8,player.pos.z);
  rankKarts(); mini.reset();
}
function startRace(trackId = profile.sel.track) {
  if(!profile.seenDrivingGuide) {
    clearDrivingInput();
    ui.showDrivingGuide(()=>{profile.seenDrivingGuide=true;save();startRace(trackId);});
    return;
  }
  ui.fade(() => {
    if(racePlan.mode==='cup') trackId=CUP.tracks[racePlan.stage];
    if (trackId !== TRACK.id || !S.length) loadTrack(trackId);
    profile.sel.track = trackId; save();
    setupGrid(racePlan.mode==='time');runMetrics=freshMetrics();clearDrivingInput();
    if(racePlan.mode==='time') {
      ghostRun=new GhostRun(profile.ghosts[TRACK.id],playerDef(),definition=>makeKartModel(definition));
      itemBoxes.forEach(b=>{b.g.visible=false;b.active=false;b.timer=Infinity;});
    }
    state.mode = 'countdown'; state.countdown = 4.2; state.lastBeep = 5; state.paused = false;
    player.startEarly = false; player.startBoostArmed = false;
    audio.setTempo(1); audio.play('race');
    ui.showHUD(true); ui.show(null);
    for(const id of ['item','itemName','abil','tItem','tAbil']) $(id).classList.toggle('hidden',racePlan.mode==='time');
  });
}
function finishRace() {
  state.mode = 'podium'; state.podiumT = 0;
  const rest = karts.filter(k => !k.finished).sort((a, b) => progOf(b) - progOf(a));
  const order = [...state.finishOrder, ...rest];
  const myPos = order.indexOf(player) + 1;
  const prize = racePlan.mode==='time'?0:PRIZES[myPos - 1] ?? 20, coinBonus = (player.coinsGot ?? 0) * COIN_VALUE;
  profile.coins += prize + coinBonus; profile.races++; if (myPos === 1 && racePlan.mode!=='time') profile.wins++;
  let record = false;
  const records=racePlan.mode==='time'?profile.timeBest:racePlan.mode==='challenge'?profile.challengeBest:profile.best;
  const recordKey=racePlan.mode==='challenge'?TRACK.id+':'+racePlan.challenge:TRACK.id;
  if (player.finished && (!records[recordKey] || player.finishTime < records[recordKey])) {
    records[recordKey] = player.finishTime; record = true;
    if(racePlan.mode==='time' && finishedGhost) profile.ghosts[TRACK.id]=finishedGhost;
  }
  let cup=null,cupPlace=null;
  if(racePlan.mode==='cup') {
    racePlan.results[racePlan.stage]=order.map((k,i)=>({name:k.def.name,points:CUP.points[i]??0,me:k.isPlayer}));
    const totals=new Map();
    racePlan.results.forEach(stage=>stage.forEach(row=>totals.set(row.name,{...row,points:(totals.get(row.name)?.points??0)+row.points})));
    const standings=[...totals.values()].sort((a,b)=>b.points-a.points || order.findIndex(k=>k.def.name===a.name)-order.findIndex(k=>k.def.name===b.name));
    cup={name:CUP.name,stage:racePlan.stage+1,total:CUP.tracks.length,standings};
    if(cup.stage===cup.total) cupPlace=standings.findIndex(r=>r.me)+1;
  }
  const completedMetrics=player.finishedMetrics??runMetrics;
  const earned=awardProgress(completedMetrics,{finished:player.finished,cupPlace,challenge:racePlan.mode==='challenge'?racePlan.challenge:null});
  save();
  // podium: top three on the steps, everybody else hidden
  for (const k of karts) { k.v.root.visible = false; if (k.v.trailer) k.v.trailer.root.visible = false; }
  if (podiumSpot) {
    const steps = [[0, 1.72], [-6.2, 1.22], [6.2, 0.82]];
    order.slice(0, 3).forEach((k, i) => {
      const [lx, h] = steps[i], c = Math.cos(podiumSpot.rot), s = Math.sin(podiumSpot.rot);
      k.v.root.visible = true; k.v.root.position.set(podiumSpot.x + lx * c, h, podiumSpot.z - lx * s);
      k.v.root.rotation.y = podiumSpot.rot; k.v.tilt.rotation.set(0, 0, 0); k.v.tilt.position.y = 0;
    });
  }
  audio.play('podium'); audio.sfx('fanfare');
  ui.showHUD(false);
  ui.showResults({
    order: order.map(k => ({ name: k.def.name, paint: k.def.paint, time: k.finished ? fmt(k.finishTime) : '—', me: k.isPlayer })),
    myPos, prize, coinBonus, coinsGot: player.coinsGot ?? 0, total: profile.coins, record, track: TRACK,
    mode:racePlan.mode,cup,earned,metrics:completedMetrics,
    challenge:racePlan.mode==='challenge'?CHALLENGES.find(c=>c.id===racePlan.challenge):null,
    eventTitle:racePlan.mode==='time'?'Contra o tempo':racePlan.mode==='challenge'?(CHALLENGES.find(c=>c.id===racePlan.challenge)?.name??'Desafio'):cup?CUP.name:'Corrida rápida',
  });
}
function nextEventRace() {
  if(racePlan.mode==='cup') {
    if(racePlan.stage<CUP.tracks.length-1){racePlan.stage++;startRace(CUP.tracks[racePlan.stage]);}
    else {racePlan={mode:'quick',challenge:'drift',stage:0,results:[]};toMenu();}
  } else {const i=TRACKS.findIndex(t=>t.id===TRACK.id);startRace(TRACKS[(i+1)%TRACKS.length].id);}
}

// ================================================================== cutscene (in-engine intro)
const SHOTS = [
  { dur: 4.5, text: 'Bem-vindos à roça! Hoje tem corrida de máquinas!', who: 'Narrador', cam: 'aerial' },
  { dur: 4.5, text: CHARACTERS.tatu.line, who: 'Tatu', cam: 'side', target: 'tatu' },
  { dur: 4.5, text: IMPLEMENTS.broto.line, who: 'Broto', cam: 'implement', target: 'broto' },
  { dur: 4.5, text: CHARACTERS.pingo.line, who: 'Pingo', cam: 'front', target: 'pingo', action: 'barras' },
  { dur:3.2,text:CHARACTERS.pipoca.line,who:'Pipoca',cam:'front',target:'pipoca' },
  { dur:3.2,text:CHARACTERS.bento.line,who:'Bento',cam:'side',target:'bento' },
  { dur: 4, text: 'Que comece a corrida mais divertida do campo!', who: 'Narrador', cam: 'pack', title: true },
];
function playIntro() {
  ui.fade(() => {
    if (TRACK.id !== 'milharal' || !S.length) loadTrack('milharal');
    setupGrid();
    // spread the pack out so each character gets a clean close-up
    karts.forEach((k, i) => {
      const idx = sIdx(40 + i * 75), lat = (i % 2 ? -2.5 : 2.5);
      k.idx = k.prevIdx = idx; k.pos.copy(trackPoint(idx, lat)).setY(0);k.groundY=S[idx].p.y; k.heading = k.moveDir = headingOf(S[idx].t);
      k.speed = 16; k.ai.skill = 0.9; k.ai.lane = lat; k.trAxle = null;
    });
    state.mode = 'cutscene'; state.cut = { shot: 0, t: 0 };
    audio.play('menu'); ui.showHUD(false); ui.show('cutscene');
    startShot(0);
  });
}
function cutTarget(kind) {
  if (CHARACTERS[kind]) return karts.find(k => k.v.ch.asset === CHARACTERS[kind].asset) ?? karts[0];
  if (kind === 'broto') return karts.find(k => k.v.trailer && !k.isPlayer) ?? karts[0];
  return karts[0];
}
function startShot(i) {
  const s = SHOTS[i];
  state.cut = { shot: i, t: 0, k: cutTarget(s.target) };
  ui.cutsceneLine(s.who, s.text, s.title);
  if (s.action === 'barras') setTimeout(() => { if (state.mode === 'cutscene') { const k = state.cut.k; k.spraying = 1.8; k.sprayMode = 'side'; } }, 1200);
  if (s.who !== 'Narrador') audio.sfx('click');
}
function cutsceneCamera(dt) {
  const c = state.cut, s = SHOTS[c.shot], k = c.k ?? karts[0], f = fwdOf(k), side = new THREE.Vector3(f.z, 0, -f.x);
  const u = c.t / s.dur;
  let pos, look;
  if (s.cam === 'aerial') {
    const g = S[0].p; pos = new THREE.Vector3(g.x + 140 - u * 100, 70 - u * 45, g.z - 120 + u * 90); look = g.clone().setY(2);
  } else if (s.cam === 'side') {
    pos = k.pos.clone().addScaledVector(side, 10).addScaledVector(f, 6 - u * 5).setY(k.groundY+3.4); look = k.pos.clone().addScaledVector(f, 1.5).setY(k.groundY+2.2);
  } else if (s.cam === 'implement') {
    const base = k.trAxle ?? k.pos, td = k.trDir ?? f;
    pos = base.clone().addScaledVector(td, 2.4).addScaledVector(side, 5.2 - u * 1.5).setY(k.groundY+2.7); look = base.clone().addScaledVector(td, 0.25).setY(k.groundY+2.1);
  } else if (s.cam === 'front') {
    pos = k.pos.clone().addScaledVector(f, 17 - u * 3).addScaledVector(side, 4).setY(k.groundY+3.6); look = k.pos.clone().setY(k.groundY+2.8);
  } else {
    const lead = rankKarts()[0]; pos = lead.pos.clone().addScaledVector(fwdOf(lead), 24).addScaledVector(side, 8).setY(lead.groundY+9 + u * 6); look = lead.pos.clone().setY(lead.groundY+1);
  }
  camera.position.copy(pos); // follow exactly: a lagging lerp falls metres behind fast karts
  camera.lookAt(look); camera.fov = 55; camera.updateProjectionMatrix();
  c.t += dt;
  if (c.t >= s.dur) { if (c.shot + 1 < SHOTS.length) startShot(c.shot + 1); else endCutscene(); }
}
function endCutscene() {
  if (state.mode !== 'cutscene') return;
  profile.seenIntro = true; save();
  toMenu();
}

// ================================================================== menus: attract mode & garage showroom
function toMenu() {
  ui.fade(() => {
    racePlan={mode:'quick',challenge:'drift',stage:0,results:[]};clearDrivingInput();
    if (!S.length) loadTrack(profile.sel.track);
    setupGrid();
    for (const k of karts) k.speed = 12;
    state.mode = 'attract'; state.attract = { target: 0, t: 0 }; state.paused = false;
    audio.play('menu'); ui.showHUD(false); ui.show('menu');
  });
}
function attractCamera(dt) {
  const a = state.attract; a.t += dt;
  if (a.t > 6) { a.t = 0; a.target = (a.target + 1) % karts.length; a.style = (a.style ?? 0) + 1; }
  const k = karts[a.target], f = fwdOf(k), side = new THREE.Vector3(f.z, 0, -f.x), st = (a.style ?? 0) % 3;
  const pos = st === 0 ? k.pos.clone().addScaledVector(f, -12).setY(k.groundY+5)
    : st === 1 ? k.pos.clone().addScaledVector(side, 9).addScaledVector(f, 4).setY(k.groundY+3)
      : k.pos.clone().addScaledVector(f, 16).addScaledVector(side, -6).setY(k.groundY+7);
  // smooth only the offset relative to the kart, so the camera never trails behind
  a.off = a.t < dt * 1.5 || !a.off ? pos.clone().sub(k.pos) : a.off.lerp(pos.clone().sub(k.pos), damp(3, dt));
  camera.position.copy(k.pos).add(a.off);
  camera.lookAt(k.pos.x, k.groundY+1.8, k.pos.z); camera.fov = 58; camera.updateProjectionMatrix();
}
let showModel = null, showDrag = null, previewRequests=[];
let showRadius = 3.2, showFocusY = 1.6;
function openGarage(mode) {
  clearDrivingInput();state.paused=false;
  state.mode = 'garage'; state.garageMode = mode;
  audio.play('garage'); ui.showHUD(false);
  showRoot.clear();
  const g = A.garage.clone(true); g.rotation.y = Math.PI; g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  showRoot.add(g);
  showSpin.rotation.y = Math.PI + 0.7; // start facing the camera
  refreshShowroom();
}
function refreshShowroom(previewSel) {
  showModel?.dispose();
  showSpin.clear();
  const sel = { ...profile.sel, ...previewSel };
  const ch = CHARACTERS[sel.char];
  const build = previewSel?.paint ? { ...profile.builds[sel.char], bodyColor: null } : profile.builds[sel.char];
  const def = { char: sel.char, impl: ch.tows ? sel.impl : 'none', paint: paintColor(sel.paint), acc: sel.acc, build, implBuild: profile.implementBuilds[sel.impl] };
  showModel = makeKartModel(def, showSpin);
  showModel.age=0;
  showModel.root.position.set(0, 0.25, ch.tows && def.impl !== 'none' ? 1.8 : 0);
  if (showModel.trailer) {
    const H = showModel.root.position.clone().add(new THREE.Vector3(0, 0, -ch.hitch.back));
    showModel.trailer.root.position.set(H.x, 0.25 + showModel.ch.hitch.y, H.z);
  }
  // Center the complete assembly on the turntable so rotation cannot swing a trailer out of frame.
  const box = new THREE.Box3().setFromObject(showSpin), center = box.getCenter(new THREE.Vector3());
  const offset = showSpin.worldToLocal(new THREE.Vector3(center.x, 0, center.z));
  showModel.root.position.x -= offset.x; showModel.root.position.z -= offset.z;
  if (showModel.trailer) {
    showModel.trailer.root.position.x -= offset.x; showModel.trailer.root.position.z -= offset.z;
  }
  const size = box.getSize(new THREE.Vector3());
  showRadius = Math.max(2.6, size.length() / 2);
  showFocusY = center.y;
  showModel.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
}
function garageViewport() {
  const root = document.querySelector('#garage:not(.hidden) .gPreview, #shop:not(.hidden) .gPreview');
  const rect = root?.getBoundingClientRect();
  return rect && rect.width > 0 && rect.height > 0 ? rect : { left: 0, bottom: innerHeight, width: innerWidth, height: innerHeight };
}
function garageCamera(dt) {
  if (!showDrag?.active) showSpin.rotation.y += dt * 0.15;
  if(showModel) {showModel.age+=dt;showModel.tilt.rotation.z=Math.sin(showModel.age*5)*.055*Math.exp(-showModel.age*1.5);showModel.tilt.position.y=Math.sin(showModel.age*2)*.025;}
  const rect = garageViewport();
  showCam.aspect = rect.width / rect.height;
  const halfAngle = Math.atan(Math.tan(THREE.MathUtils.degToRad(showCam.fov / 2)) * Math.min(1, showCam.aspect));
  const distance = showRadius / Math.sin(halfAngle) * 1.06;
  showCam.position.set(-0.4, 0.29, -0.87).normalize().multiplyScalar(distance);
  showCam.position.y += showFocusY;
  showCam.lookAt(0, showFocusY, 0); showCam.updateProjectionMatrix();
}
function renderGarage() {
  const rect = garageViewport();
  // Draw into the visible preview, leaving the sidebar and fixed action bars outside the camera.
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.clear();
  renderer.setViewport(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
  renderer.setScissor(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
  renderer.setScissorTest(true);
  renderScene(showScene, showCam);
  if(previewRequests.length) {
    let thumbnail=null;
    try {
      const crop=document.createElement('canvas');crop.width=320;crop.height=200;
      const ratio=renderer.getPixelRatio(),fit=Math.min(320/rect.width,200/rect.height),w=rect.width*fit,h=rect.height*fit,context=crop.getContext('2d');
      context.fillStyle='#D9AD76';context.fillRect(0,0,320,200);
      context.drawImage(renderer.domElement,rect.left*ratio,(rect.top??0)*ratio,rect.width*ratio,rect.height*ratio,(320-w)/2,(200-h)/2,w,h);
      thumbnail=crop.toDataURL('image/webp',.72);
    } catch { /* The creation can still be saved without a preview if the canvas is unavailable. */ }
    previewRequests.splice(0).forEach(resolve=>resolve(thumbnail));
  }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight);
}
addEventListener('pointerdown', e => {
  if (state.mode !== 'garage' || e.target !== renderer.domElement || e.button !== 0) return;
  showDrag = { active: true, x: e.clientX, pointerId: e.pointerId };
  renderer.domElement.setPointerCapture(e.pointerId);
});
addEventListener('pointermove', e => { if (showDrag?.active && showDrag.pointerId === e.pointerId) { showSpin.rotation.y += (e.clientX - showDrag.x) * 0.01; showDrag.x = e.clientX; } });
const endGarageDrag = e => {
  if (!showDrag || showDrag.pointerId !== e.pointerId) return;
  showDrag.active = false;
  if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
};
addEventListener('pointerup', endGarageDrag);
addEventListener('pointercancel', endGarageDrag);

function togglePause(force) {
  if (!(state.mode === 'race' || state.mode === 'countdown')) return;
  state.paused = force ?? !state.paused;
  clearDrivingInput();
  ui.show(state.paused ? 'pause' : null);
  if (state.paused) audio.engine(0, false, false);
}

// ================================================================== main loop
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  if (!state.paused && !window.__game?.paused) update(dt);
  if (state.mode === 'garage') renderGarage();
  else if (S.length) {renderScene(scene, camera);previewRequests.splice(0).forEach(resolve=>resolve(null));}
  requestAnimationFrame(frame);
}
function update(dt) {
  state.t += dt;
  if (state.mode === 'garage') { garageCamera(dt); return; }
  if (!S.length || !player) return;
  const live = ['race', 'cutscene', 'attract', 'podium'].includes(state.mode);
  if (state.mode === 'countdown') {
    state.countdown -= dt;
    const n = Math.ceil(state.countdown - 1.2);
    if (n !== state.lastBeep && n >= 0 && n <= 3) { state.lastBeep = n; if (n > 0) { flash(String(n), 0); audio.sfx('count'); } }
    const thr = keys.KeyW || keys.ArrowUp;
    if (state.countdown < 2.2 && state.countdown > 1.2) player.startBoostArmed = !!thr && !player.startEarly;
    if (state.countdown > 2.2 && thr) player.startEarly = true;
    if (state.countdown <= 1.2) {
      state.mode = 'race'; flash('JÁ!', 900); audio.sfx('go');
      if (player.startBoostArmed) { player.boost = 1.3; player.speed = 14; flash('JÁ! TURBO!', 900); audio.sfx('boost'); }
      for (const k of karts) if (!k.isPlayer && Math.random() < 0.5) { k.boost = 0.8; k.speed = 10; }
    }
  }
  if (state.mode === 'race') state.raceTime += dt;
  if (state.mode !== 'podium') {
    for (const k of karts) updateKart(k, k.isPlayer ? playerInput() : aiInput(k, dt), dt, !live);
    collideKarts(); trailerInteractions(); updateHazards(dt); rankKarts();
  }
  if(state.mode==='race') ghostRun?.update(state.raceTime,player);
  if (state.mode === 'race') {
    if (state.finishT > 0) { state.finishT -= dt; if (state.finishT <= 0) finishRace(); }
    else if (karts.every(k => k.finished)) finishRace();
  }
  for (const b of itemBoxes) {
    if (!b.active) { b.timer -= dt; if (b.timer <= 0) { b.active = true; b.g.visible = true; } }
    b.g.rotation.y += dt * 1.4; b.g.rotation.x = Math.sin(state.t * 1.3 + b.phase) * 0.25;
    b.g.position.y = b.p.y+0.6 + Math.sin(state.t * 2 + b.phase) * 0.25;
  }
  for (const c of coinsOnTrack) {
    if (!c.active) { c.timer -= dt; if (c.timer <= 0) { c.active = true; c.o.visible = true; } }
    c.o.rotation.y += dt * 3; c.o.position.y = c.p.y+1.1 + Math.sin(state.t * 3 + c.p.x) * 0.15;
  }
  animated.forEach(a => a.update(dt, state.t));
  updateCows(dt, state.t);
  clouds.forEach(c => { c.position.x += dt * 2; if (c.position.x > WB.x0 + WB.size) c.position.x = WB.x0; });
  particles.update(dt);
  audio.engine(player.speed, player.boost > 0, state.mode === 'race' || state.mode === 'countdown',player.drifting?player.driftCharge:0);

  // cameras
  const P = player;
  if (state.mode === 'cutscene') cutsceneCamera(dt);
  else if (state.mode === 'attract') attractCamera(dt);
  else if (state.mode === 'podium') {
    state.podiumT += dt;
    karts.forEach((k,i)=>{if(k.v.root.visible){k.v.tilt.rotation.z=Math.sin(state.podiumT*3+i)*.06;k.v.tilt.position.y=Math.abs(Math.sin(state.podiumT*2+i))*.1;}});
    if (podiumSpot) {
      const a = podiumSpot.rot + Math.sin(state.podiumT * 0.3) * 0.5, r = 22;
    camera.position.set(podiumSpot.x + Math.sin(a) * r, 7, podiumSpot.z + Math.cos(a) * r);
      camera.lookAt(podiumSpot.x, 2.5, podiumSpot.z);
      if (Math.random() < 0.15) confetti(new THREE.Vector3(podiumSpot.x, 2, podiumSpot.z), 6);
    }
  } else {
    camHeading = lerpAngle(camHeading, P.heading - P.driftVis * 0.4, damp(P.spin > 0 ? 1 : 5, dt));
    const portrait = camera.aspect < 1 ? 1.08 : 1, ch = P.v.ch, tow = P.v.trailer ? 1 : 0;
    const dist = ((state.camMode ? ch.camD + 4.5 : ch.camD) + tow * 2.5) * portrait * (IS_TOUCH ? .88 : .94);
    const height = P.groundY+((state.camMode ? ch.camH + 2.7 : ch.camH) + tow * 0.9) * (portrait > 1 ? 1.06 : 1) * (IS_TOUCH ? .92 : 1) + P.y * 0.6;
    const desired = new THREE.Vector3(P.pos.x - Math.sin(camHeading) * dist, height, P.pos.z - Math.cos(camHeading) * dist);
    if (state.mode === 'countdown') {
      const k = clamp((state.countdown - 1.2) / 3, 0, 1), a = camHeading + Math.PI * k * 0.9;
      desired.set(P.pos.x - Math.sin(a) * (dist + k * 10), height + k * 5, P.pos.z - Math.cos(a) * (dist + k * 10));
    }
    desired.y=Math.max(desired.y,courseSurface(desired).height+1.5);
    const look=new THREE.Vector3(P.pos.x+Math.sin(camHeading)*4,P.groundY+1.8+P.y*.7,P.pos.z+Math.cos(camHeading)*4);
    if(state.cameraSnap) {camera.position.copy(desired);raceLook.copy(look);state.cameraSnap=false;}
    else {camera.position.lerp(desired,damp(state.mode==='countdown'?4:9,dt));raceLook.lerp(look,damp(10,dt));}
    camera.position.y=Math.max(camera.position.y,courseSurface(camera.position).height+1.2);
    camera.lookAt(raceLook);
    const fov = (camera.aspect < 1 ? 66 : 60) + clamp(P.speed / CFG.maxSpeed, 0, 1.5) * 5 + (P.boost > 0 ? 4 : 0);
    camera.fov = lerp(camera.fov, fov, damp(4, dt)); camera.updateProjectionMatrix();
    if (state.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * state.shake; camera.position.y += (Math.random() - 0.5) * state.shake;
      state.shake *= Math.exp(-dt * 6);
    }
    updateHUD();
  }
  sky.position.copy(camera.position);
  const focus = state.mode === 'podium' && podiumSpot ? new THREE.Vector3(podiumSpot.x, 0, podiumSpot.z) : state.mode === 'cutscene' || state.mode === 'attract' ? camera.position.clone().setY(0) : P.pos;
  sun.position.copy(focus).add(SUN_OFFSET); sun.target.position.copy(focus);
}

// ================================================================== API for the UI
const api = {
  CHARACTERS, IMPLEMENTS, ABILITIES, TRACKS, CUP, CHALLENGES, BOX_ITEMS, prepareRace,
  captureCreationPreview:()=>new Promise(resolve=>previewRequests.push(resolve)),
  startRace, toMenu, playIntro, openGarage, refreshShowroom, togglePause,
  restart: () => startRace(TRACK.id),
  nextTrack: nextEventRace,
  applyOptions: () => { audio.setVolumes(profile.opts.music, profile.opts.sfx); applyQuality(); },
  skipIntro: endCutscene,
  leaveGarage: screen => ui.fade(() => {
    if (!karts.length) setupGrid();
    state.mode = 'attract'; audio.play('menu'); ui.show(screen);
  }),
  currentTrack: () => TRACK,
};

// ================================================================== boot
(async () => {
  ui.init(api);
  ui.show('splash');
  audio.setVolumes(profile.opts.music, profile.opts.sfx);
  try {
    await loadAssets(p => ui.loading(p));
  } catch (e) {
    ui.loadingError('Erro carregando modelos (abra via servidor: Jogar.bat). ' + e.message);
    throw e;
  }
  await document.fonts.ready.catch(() => {});
  loadTrack(profile.sel.track);
  setupGrid();
  state.mode = 'attract';
  setupTouch();
  ui.ready(() => {
    audio.init();
    if (profile.seenIntro) toMenu(); else playIntro();
  });
  window.__game = {
    camera, hazards, state, karts, CFG, keys, profile, api, sun, hemi, scene, get ramps() { return ramps; }, get coins() { return coinsOnTrack; }, get pads() { return pads; }, loadTrack, get player() { return player; }, get S() { return S; },
    sim: sec => { for (let i = 0; i < sec * 60; i++) update(1 / 60); if (state.mode === 'garage') renderGarage(); else renderScene(scene, camera); },
  };
  frame();
})();
