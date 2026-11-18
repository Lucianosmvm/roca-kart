// Player profile (coins, unlocked items, selections, best times, options) kept in localStorage.
// Storage can be blocked (private mode): everything falls back to an in-memory profile.

export const CATALOG = {
  paints: [
    { id: 'petroleo', name: 'Azul Oficina', color: '#216C79', price: 0 },
    { id: 'vermelho', name: 'Vermelho Trator', color: '#D62F2F', price: 80 },
    { id: 'azul', name: 'Azul Céu', color: '#2F6FD6', price: 80 },
    { id: 'verde', name: 'Verde Lavoura', color: '#2E9E4F', price: 80 },
    { id: 'amarelo', name: 'Amarelo Milho', color: '#F2C21C', price: 80 },
    { id: 'roxo', name: 'Roxo Uva', color: '#8E44AD', price: 120 },
    { id: 'rosa', name: 'Rosa Goiaba', color: '#F06292', price: 120 },
    { id: 'preto', name: 'Preto Noite', color: '#2B2B30', price: 150 },
    { id: 'dourado', name: 'Dourado Safra', color: '#FFC83D', price: 300 },
  ],
  acc: [
    { id: 'none', name: 'Sem acessório', icon: '🚫', price: 0 },
    { id: 'straw', name: 'Chapéu de Palha', icon: '👒', asset: 'acc_straw', slot: 'roof', price: 100 },
    { id: 'cap', name: 'Boné da Fazenda', icon: '🧢', asset: 'acc_cap', slot: 'roof', price: 80 },
    { id: 'flower', name: 'Girassol no Teto', icon: '🌻', asset: 'acc_flower', slot: 'roof', price: 120 },
    { id: 'flag', name: 'Bandeira Xadrez', icon: '🏁', asset: 'acc_flag', slot: 'roof', price: 150 },
    { id: 'glasses', name: 'Óculos Escuros', icon: '🕶️', asset: 'acc_glasses', slot: 'eyes', price: 150 },
    { id: 'crown', name: 'Coroa de Campeão', icon: '👑', asset: 'acc_crown', slot: 'roof', price: 250 },
  ],
  horns: [
    { id: 'classica', name: 'Buzina Clássica', icon: '📯', price: 0 },
    { id: 'vaca', name: 'Muuu!', icon: '🐄', price: 60 },
    { id: 'galo', name: 'Cocoricó', icon: '🐓', price: 60 },
    { id: 'trompete', name: 'Trompete', icon: '🎺', price: 100 },
  ],
};
export const PRIZES = [120, 90, 70, 50, 40, 30]; // coins by finishing place
export const COIN_VALUE = 5;                      // each corn coin collected on track

const KEY = 'rocaKart.save.v1';
const fresh = () => ({
  coins: 300,
  owned: { paints: ['petroleo'], acc: ['none'], horns: ['classica'] },
  sel: { char: 'tatu', impl: 'broto', paint: 'petroleo', acc: 'none', horn: 'classica', track: 'milharal' },
  builds: {}, implementBuilds: {}, creations: [],
  best: {},
  opts: { music: 0.6, sfx: 0.8, assist: null, autoGas: null, quality: 'alta' },
  seenIntro: false,
  races: 0, wins: 0,
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
    // migrate options from the first prototype
    const old = JSON.parse(localStorage.getItem('rocaKartOpts') || 'null');
    const p = fresh();
    if (old) { Object.assign(p.sel, { char: old.char ?? 'maxi', impl: old.impl ?? 'absoluta' }); p.opts.assist = old.assist ?? null; p.opts.autoGas = old.autoGas ?? null; }
    return p;
  } catch { return fresh(); }
}

export const profile = read();
for (const k of ['paints', 'acc', 'horns']) profile.owned[k] ??= [CATALOG[k][0].id];
// Keep currency, purchases and records from the earlier cast.
const oldChars = { maxi: 'tatu', imperador: 'pingo' };
profile.sel.char = oldChars[profile.sel.char] ?? profile.sel.char;
if (profile.sel.impl === 'absoluta') profile.sel.impl = 'broto';
if (profile.sel.paint === 'laranja') profile.sel.paint = 'petroleo';
profile.owned.paints = [...new Set(['petroleo', ...profile.owned.paints.map(p => p === 'laranja' ? 'petroleo' : p)])];
profile.builds ??= {};
profile.implementBuilds ??= {};
if (!Array.isArray(profile.creations)) profile.creations = [];
profile.creations = profile.creations.filter(c => c && typeof c.id === 'string' && typeof c.name === 'string' && c.sel && ['tatu','pingo'].includes(c.sel.char));

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(profile)); return true; } catch { return false; /* keep in memory */ }
}

export function saveCreation(name) {
  const trimmed = String(name ?? '').trim().slice(0, 40);
  if (!trimmed) return null;
  const { char, impl, paint, acc, horn } = profile.sel;
  const creation = {
    id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: trimmed, sel: { char, impl, paint, acc, horn },
    build: JSON.parse(JSON.stringify(profile.builds[char] ?? {})),
    implBuild: JSON.parse(JSON.stringify(profile.implementBuilds.broto ?? {})),
  };
  profile.creations.push(creation);
  return { creation, persisted: save() };
}
export function loadCreation(id) {
  const c = profile.creations.find(item => item.id === id);
  if (!c) return false;
  const { char, impl, paint, acc, horn } = c.sel;
  // A saved design equips only owned catalog items; it never changes coins or unlocks.
  Object.assign(profile.sel, {
    char, impl: impl === 'broto' ? 'broto' : 'none',
    paint: owns('paints', paint) ? paint : CATALOG.paints[0].id,
    acc: owns('acc', acc) ? acc : 'none', horn: owns('horns', horn) ? horn : 'classica',
  });
  profile.builds[char] = JSON.parse(JSON.stringify(c.build ?? {}));
  profile.implementBuilds.broto = JSON.parse(JSON.stringify(c.implBuild ?? {}));
  save(); return true;
}
export function removeCreation(id) {
  profile.creations = profile.creations.filter(c => c.id !== id);
  save();
}
export function resetProfile() {
  const f = fresh();
  for (const k of Object.keys(profile)) delete profile[k];
  Object.assign(profile, f);
  save();
}
export const owns = (cat, id) => profile.owned[cat].includes(id);
export function buy(cat, id) {
  const item = CATALOG[cat].find(i => i.id === id);
  if (!item || owns(cat, id) || profile.coins < item.price) return false;
  profile.coins -= item.price;
  profile.owned[cat].push(id);
  save();
  return true;
}
export const paintColor = id => (CATALOG.paints.find(p => p.id === id) ?? CATALOG.paints[0]).color;
