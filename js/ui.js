// DOM screens for Roça Kart: splash, menu, track select, garage/shop (over the 3D showroom),
// options, credits, pause, cutscene dialogue and results. The game engine talks to it via `api`.
import { audio } from './audio.js';
import { profile, save, CATALOG, buy, owns, resetProfile } from './save.js';
import { TRACKS } from './tracks.js';

const $ = id => document.getElementById(id);
const SCREENS = ['splash', 'menu', 'tracks', 'garage', 'shop', 'options', 'credits', 'pause', 'results', 'cutscene'];
const HUD = ['item', 'itemName', 'abil', 'minimap', 'lap', 'time', 'coins', 'pos', 'speed', 'msg', 'sub', 'help', 'pauseBtn', 'touch'];
const fmt = t => { const m = Math.floor(t / 60), s = t % 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
let api = null;
let optionsReturn = 'menu';
let pickedTrack = profile.sel.track;

function click(el, fn, sound = 'click') {
  el.addEventListener('click', e => { e.stopPropagation(); audio.sfx(sound); fn(e); });
  el.addEventListener('pointerenter', () => audio.sfx('hover'));
}
const logo = () => `<h1 class="logo">${[...'Roça Kart'].map((c, i) => `<span style="animation-delay:${i * 0.08}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</h1>`;

export const ui = {
  init(a) {
    api = a;
    buildSplash(); buildMenu(); buildOptions(); buildCredits(); buildPause();
    this.showHUD(false);
  },
  show(name) {
    for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
    $('wallet').classList.toggle('hidden', !['menu', 'tracks', 'garage', 'shop'].includes(name));
    updateWallet();
    if (name === 'menu') buildMenu();
    if (name === 'tracks') buildTracks();
  },
  showHUD(on) { for (const id of HUD) $(id).classList.toggle('hidden', !on); if (!on) $('speedlines').style.opacity = 0; },
  fade(cb) {
    const f = $('fade'); f.classList.add('on');
    setTimeout(() => { try { cb(); } finally { setTimeout(() => f.classList.remove('on'), 60); } }, 360);
  },
  loading(p) { const b = $('splashBar'); if (b) b.style.width = `${Math.round(p * 100)}%`; },
  loadingError(msg) { $('splashTap').textContent = msg; $('splashTap').classList.remove('hidden'); },
  ready(onStart) {
    this.loading(1);
    const tap = $('splashTap');
    tap.textContent = IS_TOUCH() ? 'Toque para começar' : 'Clique ou aperte ENTER';
    tap.classList.remove('hidden');
    let started = false;
    const go = () => { if (started) return; started = true; removeEventListener('keydown', key); onStart(); };
    const key = e => { if (e.code === 'Enter' || e.code === 'Space') go(); };
    $('splash').addEventListener('pointerdown', go, { once: true });
    addEventListener('keydown', key);
  },
  cutsceneLine(who, text, title) {
    const img = { Maxi: 'assets/ui/maxi.png', Absoluta: 'assets/ui/absoluta.png', Imperador: 'assets/ui/imperador.png' }[who];
    $('cutscene').innerHTML = `
      <div class="letterbox top"></div><div class="letterbox bot"></div>
      <button class="btn small cream skip" id="skipBtn">Pular ▶▶</button>
      ${title ? `<div class="bigTitle">${logo()}<div class="tag">uma corrida com máquinas agrícolas</div></div>` : ''}
      <div class="dialog">${img ? `<img src="${img}" alt="${who}">` : '<div class="avatar">🎙️</div>'}
        <div class="panel bubble"><div class="who">${who}</div><div class="text">${text}</div></div></div>`;
    click($('skipBtn'), () => api.skipIntro());
  },
  showResults(d) {
    const medal = ['🥇', '🥈', '🥉'];
    $('results').innerHTML = `<div class="panel">
      <h2 class="title" style="color:var(--orange);margin:0">${d.myPos === 1 ? 'Campeão da Roça!' : d.myPos <= 3 ? 'No pódio!' : 'Bora de novo!'}</h2>
      <div style="font-weight:900;margin-bottom:6px">${d.track.name}${d.record ? ' · 🏅 Novo recorde!' : ''}</div>
      <table class="res">${d.order.map((k, i) => `<tr class="${k.me ? 'me' : ''}"><td><b>${medal[i] ?? (i + 1) + 'º'}</b></td>
        <td><span class="dot" style="background:${k.paint}"></span> ${k.name}</td><td>${k.time}</td></tr>`).join('')}</table>
      <div class="reward">Prêmio do ${d.myPos}º lugar: <span class="gold">+${d.prize} 🌽</span></div>
      <div class="reward">Moedas de milho (${d.coinsGot}): <span class="gold">+${d.coinBonus} 🌽</span></div>
      <div class="reward">Total na carteira: <span class="gold">${d.total} 🌽</span></div>
      <div class="backRow">
        <button class="btn small" id="rAgain">Correr de novo</button>
        <button class="btn small orange" id="rNext">Próxima pista ▶</button>
        <button class="btn small cream" id="rGarage">Garagem</button>
        <button class="btn small cream" id="rMenu">Menu</button>
      </div></div>`;
    $('results').classList.remove('hidden');
    click($('rAgain'), () => api.restart());
    click($('rNext'), () => api.nextTrack());
    click($('rGarage'), () => { api.openGarage('menu'); this.show('garage'); buildGarage('menu'); });
    click($('rMenu'), () => api.toMenu(), 'back');
  },
};
const IS_TOUCH = () => document.body.classList.contains('is-touch') || matchMedia('(pointer: coarse)').matches;
function updateWallet() { $('wallet').textContent = `🌽 ${profile.coins}`; }

// ---------------------------------------------------------------- splash
function buildSplash() {
  $('splash').innerHTML = `${logo()}
    <div class="tag">Pista de terra, máquinas da roça e muita diversão!</div>
    <div class="splashMachines"><img src="assets/ui/maxi.png" alt="Maxi"><img src="assets/ui/absoluta.png" alt="Absoluta"><img src="assets/ui/imperador.png" alt="Imperador"></div>
    <div class="bar"><i id="splashBar"></i></div>
    <div class="tap hidden" id="splashTap"></div>
    <div class="credit">Demo jogável · protótipo para apresentação · personagens inspirados nas máquinas Stara</div>`;
}

// ---------------------------------------------------------------- menu
function buildMenu() {
  $('menu').innerHTML = `${logo()}
    <div class="tag">Escolha sua máquina e acelere na roça!</div>
    <div class="menuBtns">
      <button class="btn big orange" id="mPlay">▶ JOGAR</button>
      <button class="btn" id="mGarage">🔧 Garagem</button>
      <button class="btn blue" id="mShop">🛒 Loja</button>
      <button class="btn cream" id="mOptions">⚙️ Opções</button>
      <button class="btn cream" id="mCredits">⭐ Créditos</button>
      <button class="btn cream" id="mIntro" style="grid-column: span 2">🎬 Ver abertura</button>
    </div>
    <div class="stats">Corridas: ${profile.races} · Vitórias: ${profile.wins}</div>`;
  click($('mPlay'), () => ui.show('tracks'));
  click($('mGarage'), () => { api.openGarage('menu'); ui.show('garage'); buildGarage('menu'); });
  click($('mShop'), () => { api.openGarage('shop'); ui.show('shop'); buildGarage('shop'); });
  click($('mOptions'), () => { optionsReturn = 'menu'; buildOptions(); ui.show('options'); });
  click($('mCredits'), () => ui.show('credits'));
  click($('mIntro'), () => api.playIntro());
}

// ---------------------------------------------------------------- track select
function drawTrack(canvas, t) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  const xs = t.ctrl.map(p => p[0]), zs = t.ctrl.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const sc = Math.min((W - 40) / (x1 - x0), (H - 40) / (z1 - z0));
  const P = ([x, z]) => [W / 2 - (x - (x0 + x1) / 2) * sc, H / 2 - (z - (z0 + z1) / 2) * sc];
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, t.theme.skyTop); grd.addColorStop(1, t.theme.grass);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.beginPath();
  const pts = t.ctrl.map(P);
  // smooth path through control points (quadratic midpoints)
  for (let i = 0; i <= pts.length; i++) {
    const a = pts[i % pts.length], b = pts[(i + 1) % pts.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    i === 0 ? g.moveTo(m[0], m[1]) : g.quadraticCurveTo(a[0], a[1], m[0], m[1]);
  }
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = '#2b1a0e'; g.lineWidth = 12; g.stroke();
  g.strokeStyle = t.theme.road; g.lineWidth = 7; g.stroke();
  const [sx, sy] = P(t.ctrl[0]); g.fillStyle = '#fff'; g.fillRect(sx - 6, sy - 3, 12, 6);
}
function buildTracks() {
  $('tracks').innerHTML = `<h2 class="title">Escolha a pista</h2>
    <div class="cards">${TRACKS.map(t => `
      <div class="card ${pickedTrack === t.id ? 'sel' : ''}" data-id="${t.id}">
        <canvas width="260" height="170"></canvas>
        <b>${t.name}</b><small>${t.subtitle}</small>
        <div class="diff">${'🌽'.repeat(t.difficulty)}${'·'.repeat(3 - t.difficulty)}</div>
        <div class="best">${profile.best[t.id] ? '🏅 Recorde ' + fmt(profile.best[t.id]) : 'Sem recorde ainda'}</div>
      </div>`).join('')}</div>
    <div class="backRow"><button class="btn small cream" id="tBack">◀ Voltar</button>
      <button class="btn orange" id="tNext">Escolher máquina ▶</button></div>`;
  $('tracks').querySelectorAll('.card').forEach(c => {
    drawTrack(c.querySelector('canvas'), TRACKS.find(t => t.id === c.dataset.id));
    click(c, () => { pickedTrack = c.dataset.id; buildTracks(); });
    c.addEventListener('dblclick', () => goGarageForRace());
  });
  click($('tBack'), () => ui.show('menu'), 'back');
  click($('tNext'), () => goGarageForRace());
}
function goGarageForRace() { profile.sel.track = pickedTrack; save(); api.openGarage('race'); ui.show('garage'); buildGarage('race'); }

// ---------------------------------------------------------------- garage + shop (shared)
let gTab = 'machine', preview = null;
const TAB_NAMES = { machine: 'Máquina', impl: 'Implemento', paint: 'Pintura', acc: 'Acessório', horn: 'Buzina' };
const CAT = { paint: 'paints', acc: 'acc', horn: 'horns' };
function itemsFor(tab) {
  const { CHARACTERS, IMPLEMENTS, ABILITIES } = api;
  if (tab === 'machine') return Object.entries(CHARACTERS).map(([id, c]) => ({ id, name: c.name, sub: c.machine, img: c.img, owned: true }));
  if (tab === 'impl') return Object.entries(IMPLEMENTS).map(([id, m]) => ({ id, name: m.name, sub: ABILITIES[m.ability].icon + ' ' + ABILITIES[m.ability].name, img: m.img, owned: true }));
  return CATALOG[CAT[tab]].map(i => ({ id: i.id, name: i.name, sw: i.color, ic: i.icon, price: i.price, owned: owns(CAT[tab], i.id) }));
}
const selKey = tab => ({ machine: 'char', impl: 'impl', paint: 'paint', acc: 'acc', horn: 'horn' }[tab]);
function buildGarage(mode) {
  const shop = mode === 'shop', root = $(shop ? 'shop' : 'garage');
  const tabs = shop ? ['paint', 'acc', 'horn'] : ['machine', 'impl', 'paint', 'acc', 'horn'];
  if (!tabs.includes(gTab)) gTab = tabs[0];
  const { CHARACTERS, IMPLEMENTS, ABILITIES } = api;
  const sel = { ...profile.sel, ...(preview ?? {}) };
  const ch = CHARACTERS[sel.char], tows = ch.tows;
  const im = tows ? IMPLEMENTS[sel.impl] : null;
  const ab = ABILITIES[tows ? im.ability : ch.ability];
  const pv = preview && Object.entries(preview)[0];
  let buyBox = '';
  if (pv) {
    const [k, id] = pv, tab = Object.keys(TAB_NAMES).find(t => selKey(t) === k), item = CATALOG[CAT[tab]]?.find(i => i.id === id);
    if (item && !owns(CAT[tab], id)) buyBox = `<div><b>${item.name}</b> · <span style="color:#b06a00;font-family:'Lilita One'">🌽 ${item.price}</span><br>
      <button class="btn small orange" id="gBuy" ${profile.coins < item.price ? 'disabled style="opacity:.5"' : ''}>Comprar</button>
      ${profile.coins < item.price ? '<small> Faltam ' + (item.price - profile.coins) + ' 🌽 — corra para ganhar!</small>' : ''}</div>`;
  }
  root.innerHTML = `
    <div class="gTop"><button class="btn small cream" id="gBack">◀</button><h2>${shop ? 'Loja' : 'Garagem'}</h2></div>
    <div class="panel gPanel">
      <div class="tabs">${tabs.map(t => `<button class="tab ${gTab === t ? 'on' : ''}" data-t="${t}" ${t === 'impl' && !tows ? 'disabled' : ''}>${TAB_NAMES[t]}</button>`).join('')}</div>
      <div class="items">${itemsFor(gTab).map(i => `
        <div class="it ${sel[selKey(gTab)] === i.id ? 'sel' : ''} ${i.owned ? '' : 'locked'}" data-id="${i.id}">
          ${i.img ? `<img src="${i.img}" alt="">` : i.sw ? `<div class="sw" style="background:${i.sw}"></div>` : `<div class="ic">${i.ic}</div>`}
          <div>${i.name}</div>${i.sub ? `<small>${i.sub}</small>` : ''}
          ${i.owned ? (sel[selKey(gTab)] === i.id ? '<small>✔ equipado</small>' : '<small>tenho</small>') : `<div class="price">🌽 ${i.price}</div>`}
        </div>`).join('')}</div>
      <div class="gInfo">
        <div><b style="font-family:'Lilita One';font-size:22px">${ch.name}${im && sel.impl !== 'none' ? ' + ' + im.name : ''}</b><br>
          <span class="abilTag">${ab.icon} ${ab.name}</span> ${im ? `<small>${im.perk}</small>` : ''}</div>
        <div class="statsBox">${Object.entries(ch.stats).map(([k, v]) => `<span>${k}</span><em>${stars(v)}</em>`).join('')}</div>
        ${buyBox}
        <div>${mode === 'race' ? '<button class="btn orange" id="gGo">CORRER! ▶</button>' : ''}</div>
      </div>
    </div>`;
  click($('gBack'), () => { preview = null; api.leaveGarage(mode === 'race' ? 'tracks' : 'menu'); }, 'back');
  root.querySelectorAll('.tab').forEach(b => click(b, () => { if (b.disabled) return; gTab = b.dataset.t; preview = null; api.refreshShowroom(); buildGarage(mode); }));
  root.querySelectorAll('.it').forEach(el => click(el, () => {
    const id = el.dataset.id, k = selKey(gTab);
    if (gTab === 'horn') audio.horn(id);
    const cat = CAT[gTab];
    if (!cat || owns(cat, id)) { profile.sel[k] = id; save(); preview = null; }
    else preview = { [k]: id };
    api.refreshShowroom(preview ?? undefined);
    buildGarage(mode);
  }));
  const b = $('gBuy');
  if (b) click(b, () => {
    const [k, id] = Object.entries(preview)[0], tab = Object.keys(TAB_NAMES).find(t => selKey(t) === k);
    if (buy(CAT[tab], id)) { audio.sfx('buy'); profile.sel[k] = id; save(); preview = null; api.refreshShowroom(); updateWallet(); buildGarage(mode); }
    else audio.sfx('deny');
  }, 'click');
  const go = $('gGo');
  if (go) click(go, () => { preview = null; api.startRace(profile.sel.track); });
}

// ---------------------------------------------------------------- options / credits / pause
function buildOptions() {
  const o = profile.opts;
  $('options').innerHTML = `<h2 class="title">Opções</h2><div class="panel" style="width:min(520px,94vw)">
    <div class="optRow">🎵 Música <input type="range" min="0" max="1" step="0.05" id="oMusic" value="${o.music}"></div>
    <div class="optRow">🔊 Efeitos <input type="range" min="0" max="1" step="0.05" id="oSfx" value="${o.sfx}"></div>
    <div class="optRow">🚜 Acelerar sozinho <input type="checkbox" id="oGas" ${o.autoGas ? 'checked' : ''}></div>
    <div class="optRow">🧭 Direção assistida (crianças) <input type="checkbox" id="oAssist" ${o.assist ? 'checked' : ''}></div>
    <div class="optRow">🖥️ Qualidade gráfica <select id="oQual"><option value="alta">Alta</option><option value="baixa">Baixa (celular simples)</option></select></div>
    <div class="keys keysOnly"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> dirigir · <kbd>ESPAÇO</kbd> drift (e manobra no ar) · <kbd>E</kbd> item ·
      <kbd>Q</kbd> habilidade · <kbd>H</kbd> buzina · <kbd>C</kbd> câmera · <kbd>R</kbd> volta pra pista · <kbd>ESC</kbd> pausa</div>
    <div class="backRow"><button class="btn small cream" id="oBack">◀ Voltar</button><button class="btn small" id="oReset" style="background:#C8372D">Apagar progresso</button></div>
  </div>`;
  $('oQual').value = o.quality;
  const apply = () => { save(); api.applyOptions(); };
  $('oMusic').oninput = e => { o.music = +e.target.value; apply(); };
  $('oSfx').oninput = e => { o.sfx = +e.target.value; apply(); audio.sfx('coin'); };
  $('oGas').onchange = e => { o.autoGas = e.target.checked; apply(); };
  $('oAssist').onchange = e => { o.assist = e.target.checked; apply(); };
  $('oQual').onchange = e => { o.quality = e.target.value; apply(); };
  click($('oBack'), () => ui.show(optionsReturn), 'back');
  let armed = false;
  click($('oReset'), () => {
    if (!armed) { armed = true; $('oReset').textContent = 'Tem certeza? Toque de novo'; return; }
    resetProfile(); buildOptions(); updateWallet(); audio.sfx('deny');
  });
}
function buildCredits() {
  $('credits').innerHTML = `<h2 class="title">Créditos</h2><div class="panel credits" style="width:min(560px,94vw)">
    <p style="font-family:'Lilita One';font-size:28px;color:var(--orange)">Roça Kart · demo jogável</p>
    <p>Personagens inspirados nas máquinas Stara: trator ST MAX 105, plantadeira Absoluta e pulverizador Imperador.</p>
    <p>Modelos 3D cartoon feitos no Blender a partir dos modelos de engenharia.</p>
    <p>Jogo em Three.js · música e efeitos sonoros sintetizados ao vivo (baião com zabumba, triângulo e sanfona).</p>
    <p>Protótipo para apresentação ao Marketing — conteúdo e nomes sujeitos a aprovação.</p>
    <div class="backRow"><button class="btn small cream" id="cBack">◀ Voltar</button></div></div>`;
  click($('cBack'), () => ui.show('menu'), 'back');
}
function buildPause() {
  $('pause').innerHTML = `<h2 class="title">Pausa</h2><div class="menuBtns" style="grid-template-columns:minmax(220px,300px)">
    <button class="btn orange" id="pResume">▶ Continuar</button>
    <button class="btn" id="pRestart">↻ Reiniciar corrida</button>
    <button class="btn cream" id="pOptions">⚙️ Opções</button>
    <button class="btn cream" id="pQuit">🏠 Sair para o menu</button></div>`;
  click($('pResume'), () => api.togglePause(false));
  click($('pRestart'), () => { api.togglePause(false); api.restart(); });
  click($('pOptions'), () => { optionsReturn = 'pause'; buildOptions(); ui.show('options'); });
  click($('pQuit'), () => { api.togglePause(false); api.toMenu(); }, 'back');
}
