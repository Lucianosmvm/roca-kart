// Usage: node tests/oficina.cjs <directory containing the Three.js 0.160 test libraries>
// Library filenames: roca-three-0160.mjs, roca-GLTFLoader.mjs, roca-BufferGeometryUtils.mjs.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
process.chdir(path.resolve(__dirname, '..'));
(async () => {
  const libs = process.argv[2] ?? require('os').tmpdir();
  const threeURL = pathToFileURL(path.join(libs, 'roca-three-0160.mjs')).href;
  const T = await import(threeURL);
  const { GLTFLoader } = await import(pathToFileURL(path.join(libs, 'roca-GLTFLoader.mjs')).href);
  const source = fs.readFileSync('js/customize.js', 'utf8').replace("from 'three'", 'from ' + JSON.stringify(threeURL));
  const { applyBuild, cleanBuild, applyImplementBuild, cleanImplementBuild } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const scenes = {};
  for (const name of ['tatu', 'pingo', 'broto', 'broto_hoppers_seed', 'broto_hoppers_barrel', 'broto_hoppers_crate', 'broto_wheels_small', 'broto_wheels_wide', 'broto_wheels_double']) {
    const b = fs.readFileSync('assets/' + name + '.glb');
    scenes[name] = (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '')).scene;
    assert(!new T.Box3().setFromObject(scenes[name]).isEmpty());
    if (['tatu', 'pingo'].includes(name)) for (const w of ['FL', 'FR', 'RL', 'RR']) {
      const wheel = scenes[name].getObjectByName('Wheel' + w);
      assert(wheel, name + w);
      assert(wheel.rotation.toArray().slice(0, 3).every(a => Math.abs(a) < 1e-6), 'neutral wheel rotation');
    }
    console.log(name + ': GLB loaded');
  }
  let count = 0;
  for (const name of ['tatu', 'pingo']) for (const hood of ['shell', 'box', 'round'])
    for (const roof of ['canopy', 'open', 'cage']) for (const size of [.8, 1, 1.25]) {
      const s = scenes[name].clone(true);
      const before = new T.Box3().setFromObject(scenes[name]).getSize(new T.Vector3()).toArray();
      const paint = new T.MeshToonMaterial({ color: '#216C79' });
      const custom = applyBuild(s, { hood, roof, bumper: 'double', frontSize: size, rearSize: size,
        tireWidth: 1.5, stance: 1.3, tankSize: 1.2, armSize: 1.25, accent: '#123456', bodyColor: '#445566' }, name, paint);
      for (const w of ['FL', 'FR', 'RL', 'RR']) {
        const wheel = s.getObjectByName('Wheel' + w);
        assert(Math.abs(new T.Box3().setFromObject(wheel).min.y) < .06, 'wheel touches ground');
        wheel.rotation.x = .8; wheel.rotation.y = w[0] === 'F' ? .3 : 0;
      }
      assert(new T.Box3().setFromObject(s).getSize(new T.Vector3()).toArray().every(n => Number.isFinite(n) && n > 0));
      assert.equal(paint.color.getHexString(), '445566');
      assert.deepEqual(new T.Box3().setFromObject(scenes[name]).getSize(new T.Vector3()).toArray(), before, 'source mesh unchanged');
      custom.dispose(); paint.dispose(); count++;
    }
  console.log(count + ' assembly combinations: geometry, wheel contact, paint, source isolation OK');
  // Exercise the real runtime assembly seam, including accessory mounts and the trailer.
  const runtime = fs.readFileSync('js/main.js', 'utf8');
  const characters = Function('return ' + runtime.match(/export const CHARACTERS = ([\s\S]*?);\r?\nexport const IMPLEMENTS/)[1])();
  const implementsData = Function('return ' + runtime.match(/export const IMPLEMENTS = ([\s\S]*?);\r?\nexport const ABILITIES/)[1])();
  const seam = runtime.slice(runtime.indexOf('const radiusOf ='), runtime.indexOf('function createKart('));
  const make = Function('THREE', 'CHARACTERS', 'IMPLEMENTS', 'A', 'applyBuild', 'applyImplementBuild', 'toonColor', 'scene', 'CATALOG',
    seam + '; return makeKartModel;')(T, characters, implementsData, scenes, applyBuild, applyImplementBuild,
      hex => new T.MeshToonMaterial({ color: hex }), new T.Scene(), { acc: [] });
  for (const char of ['tatu', 'pingo']) for (const impl of ['none', 'broto']) {
    const v = make({ char, impl, paint: '#216C79', acc: 'none', build: { hood: 'box', rearSize: 1.2 } });
    assert(v.wheelR.F > 0 && v.wheelR.R > 0);
    assert.equal(!!v.trailer, char === 'tatu' && impl === 'broto');
    if (v.trailer) assert.equal(v.trailer.wheels.length, 2);
    if (char === 'pingo') assert(v.booms.L && v.booms.R);
    v.wheels.FL.rotation.x = .7; v.wheels.FL.rotation.y = .3;
    v.dispose();
  }
  console.log('Runtime racer assembly: both machines, wheels, booms and tow attachment OK');
  for (const hopper of ['seed', 'barrel', 'crate']) for (const wheels of ['small', 'wide', 'double']) {
    const v = make({ char: 'tatu', impl: 'broto', paint: '#216C79', acc: 'none', implBuild: { hopper, wheels, bodyColor: '#123456' } });
    assert.equal(v.trailer.wheels.length, wheels === 'double' ? 4 : 2);
    assert.equal(v.trailer.root.getObjectsByProperty('name', 'Hoppers').length, 1);
    v.dispose();
  }
  assert.equal(cleanImplementBuild({ hopper: 'invalid', wheels: 'invalid' }).hopper, 'seed');
  assert.equal(cleanImplementBuild({ bodyColor: 'invalid' }).bodyColor, '#216C79');
  assert.equal(cleanBuild({ frontSize: 999 }).frontSize, 1.25);
  assert.equal(cleanBuild({ roof: 'bad' }).roof, 'canopy');
  assert.equal(cleanBuild({ tankSize: 'NaN' }).tankSize, 1);
  let saved = JSON.stringify({ coins: 777, owned: { paints: ['laranja', 'roxo'], acc: ['none', 'cap'], horns: ['classica'] },
    sel: { char: 'imperador', impl: 'absoluta', paint: 'laranja' }, best: { milharal: 99 }, builds: { tatu: { hood: 'box', frontSize: 1.2 } } });
  global.localStorage = { getItem: k => k === 'rocaKart.save.v1' ? saved : null, setItem: (k, v) => saved = v };
  const saveSource = fs.readFileSync('js/save.js', 'utf8');
  const mod = await import('data:text/javascript;base64,' + Buffer.from(saveSource).toString('base64'));
  assert.equal(mod.profile.sel.char, 'pingo'); assert.equal(mod.profile.sel.impl, 'broto');
  assert.equal(mod.profile.sel.paint, 'petroleo'); assert.equal(mod.profile.coins, 777);
  assert(mod.profile.owned.paints.includes('roxo')); assert.equal(mod.profile.best.milharal, 99);
  mod.save(); assert.equal(JSON.parse(saved).builds.tatu.hood, 'box');
  console.log('Save migration and design persistence OK');
  Object.assign(mod.profile.sel, { char: 'tatu', impl: 'broto', acc: 'cap', horn: 'classica' });
  mod.profile.builds.tatu = { hood: 'round' };
  mod.profile.implementBuilds.broto = { hopper: 'crate', wheels: 'double', bodyColor: '#123456' };
  const result = mod.saveCreation('Minha montagem');
  assert(result.persisted);
  mod.profile.builds.tatu.hood = 'box';
  mod.profile.implementBuilds.broto.wheels = 'small';
  assert(mod.loadCreation(result.creation.id));
  assert.equal(mod.profile.builds.tatu.hood, 'round');
  assert.equal(mod.profile.implementBuilds.broto.wheels, 'double');
  assert.equal(mod.profile.coins, 777);
  mod.removeCreation(result.creation.id);
  assert.equal(mod.profile.creations.length, 0);
  assert.equal(mod.profile.implementBuilds.broto.wheels, 'double');
  const main = fs.readFileSync('js/main.js', 'utf8');
  const assets = main.match(/const ASSETS = (\[[\s\S]*?\]);/)[1];
  for (const asset of Function('return ' + assets)()) assert(fs.existsSync('assets/' + asset + '.glb'), asset);
  assert(!assets.match(/tractor|imperador|absoluta/));
  console.log('All runtime assets present; old machine meshes not loaded');
})().catch(e => { console.error(e); process.exitCode = 1; });
