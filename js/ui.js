// DOM screens for Roça Kart: splash, menu, track select, garage/shop (over the 3D showroom),
// options, credits, pause, cutscene dialogue and results. The game engine talks to it via `api`.
import { audio } from './audio.js';
import { profile, save, storageState, CATALOG, buy, owns, resetProfile, paintColor, saveCreation, loadCreation, removeCreation, renameCreation, duplicateCreation, exportCreation, importCreation } from './save.js';
import { BUILD_DEFAULTS, BUILD_RANGES, cleanBuild, IMPLEMENT_DEFAULTS, cleanImplementBuild } from './customize.js';
import { TRACKS } from './tracks.js';

const $ = id => document.getElementById(id);
const SCREENS = ['splash', 'menu', 'tracks', 'garage', 'shop', 'options', 'credits', 'pause', 'results', 'cutscene','guide'];
const HUD = ['item', 'itemName', 'itemEffects', 'abil', 'minimap', 'lap', 'time', 'coins', 'pos', 'standings', 'speed', 'msg', 'sub', 'help', 'pauseBtn', 'touch','raceEvent','driftStatus'];
const fmt = t => { const m = Math.floor(t / 60), s = t % 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
let api = null;
let optionsReturn = 'menu';
let pickedTrack = profile.sel.track;
let pickedMode='quick',pickedChallenge='drift';
let closeGuide=null;
const storageFeedback=()=>storageState.ok?'':'<p class="storageWarning" role="status">Não foi possível salvar neste dispositivo. O progresso está nesta sessão; exporte suas criações antes de fechar.</p>';

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
    $('wallet').classList.toggle('hidden', !['menu', 'tracks'].includes(name));
    updateWallet();
    if (name === 'menu') buildMenu();
    if (name === 'tracks') buildTracks();
  },
  showHUD(on) { for (const id of HUD) $(id).classList.toggle('hidden', !on); if (!on) $('speedlines').style.opacity = 0; },
  showDrivingGuide(onStart=null) {
    const previous=SCREENS.find(id=>!$(id).classList.contains('hidden'))??'menu';
    const focus=document.activeElement;
    const leave=()=>{closeGuide=null;this.show(previous);if(focus?.isConnected) focus.focus();};
    closeGuide=leave;
    $('guide').innerHTML=`<section class="panel drivingGuide" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
      <span class="guideEyebrow">Oficina de pilotagem</span><h2 id="guideTitle">Curva com mini-turbo</h2>
      <p>Ganhe velocidade, escolha um lado e faça o gesto:</p>
      <ol class="gestureSteps"><li><span class="gestureKey">◀</span><b>1. Toque</b><small>Aperte a direção.</small></li><li><span class="gestureKey released">◀</span><b>2. Solte</b><small>Solte rapidamente.</small></li><li><span class="gestureKey held">◀</span><b>3. Segure</b><small>Aperte de novo no mesmo lado, em até 0,3 s, e mantenha.</small></li><li><span class="gestureKey turbo">↗</span><b>4. Mini-turbo!</b><small>Espere BOM ou PERFEITO e solte.</small></li></ol>
      <p class="guideHint">Também funciona para a direita. No teclado, use A/D ou as setas; no celular, os botões ◀ e ▶. Faça o gesto já em movimento.</p>
      <div class="guideLegend"><span>➜ Placa amarela: curva</span><span>↗ SALTO: rampa adiante</span><span>↗ ATALHO: caminho alternativo</span></div>
      <p class="guideHint">${IS_TOUCH()?'O veículo acelera sozinho. Toque em ITEM e HAB para usar o que estiver disponível. As rampas fazem saltos normais, sem acrobacias.':'W/↑ acelera · S/↓ freia · E usa item · Q usa habilidade · R volta à pista · ESC pausa. As rampas fazem saltos normais.'}</p>
      <div class="backRow"><button class="btn cream" id="guideBack">◀ Voltar</button><button class="btn orange" id="guideDone">${onStart?'Entendi, vamos correr!':'Entendi!'}</button></div>
    </section>`;
    this.show('guide');
    click($('guideBack'),leave,'back');
    click($('guideDone'),()=>{leave();if(onStart)onStart();});
    $('guide').onkeydown=e=>{
      if(e.key!=='Tab') return;
      const first=$('guideBack'),last=$('guideDone');
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    };
    $('guideDone').focus();
  },
  closeDrivingGuide(){closeGuide?.();},
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
    const img = { Tatu: 'assets/ui/tatu.png', Broto: 'assets/ui/broto.png', Pingo: 'assets/ui/pingo.png',Pipoca:'assets/ui/pipoca.png',Bento:'assets/ui/bento.png' }[who];
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
      <h2 class="title" style="color:var(--orange);margin:0">${d.mode==='time'?(d.record?'Novo recorde!':'Tempo concluído!'):d.mode==='challenge'?'Desafio finalizado!':d.myPos === 1 ? 'Campeão da Roça!' : d.myPos <= 3 ? 'No pódio!' : 'Bora de novo!'}</h2>
      <div style="font-weight:900;margin-bottom:6px">${d.track.name}${d.record ? ' · 🏅 Novo recorde!' : ''}</div>
      <div class="eventResultTitle">${escapeHTML(d.eventTitle??'Corrida rápida')}${d.cup?` · etapa ${d.cup.stage}/${d.cup.total}`:''}</div>
      <table class="res">${d.order.map((k, i) => `<tr class="${k.me ? 'me' : ''}"><td><b>${medal[i] ?? (i + 1) + 'º'}</b></td>
        <td><span class="dot" style="background:${k.paint}"></span> ${k.name}</td><td>${k.time}</td></tr>`).join('')}</table>
      <div class="reward">Prêmio do ${d.myPos}º lugar: <span class="gold">+${d.prize} 🌽</span></div>
      <div class="reward">Moedas de milho (${d.coinsGot}): <span class="gold">+${d.coinBonus} 🌽</span></div>
      <div class="reward">Total na carteira: <span class="gold">${d.total} 🌽</span></div>
      ${storageFeedback()}
      ${d.cup?`<div class="cupStandings"><b>Pontuação da copa</b>${d.cup.standings.map((row,i)=>`<div class="${row.me?'isPlayer':''}">${i+1}º ${escapeHTML(row.name)} <strong>${row.points} pontos</strong></div>`).join('')}</div>`:''}
      ${d.earned?.length?`<div class="earnedRewards">${d.earned.map(label=>`<div>🎁 ${escapeHTML(label)}</div>`).join('')}</div>`:''}
      ${d.challenge?`<p class="challengeResult">${(d.challenge.metric==='drift'?d.metrics.drift+d.metrics.perfect:d.metrics[d.challenge.metric])>=d.challenge.target?'✓ Objetivo alcançado!':'Continue praticando!'} · ${d.challenge.metric==='drift'?d.metrics.drift+d.metrics.perfect:d.metrics[d.challenge.metric]}/${d.challenge.target}</p>`:''}
      ${d.metrics?`<p class="runStats">Drifts: ${d.metrics.drift+d.metrics.perfect} · Perfeitos: ${d.metrics.perfect} · Saltos: ${d.metrics.jumps} · Atalhos: ${d.metrics.shortcuts}</p>`:''}
      <div class="backRow">
        <button class="btn small" id="rAgain">Correr de novo</button>
        <button class="btn small orange" id="rNext">${d.cup?(d.cup.stage<d.cup.total?'Próxima etapa ▶':'Concluir copa 🏆'):'Próxima pista ▶'}</button>
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
function updateWallet() {
  $('wallet').textContent = `🌽 ${profile.coins}`;
  document.querySelectorAll('.gWallet').forEach(el => { el.textContent = `🌽 ${profile.coins}`; });
}

// ---------------------------------------------------------------- splash
function buildSplash() {
  $('splash').innerHTML = `${logo()}
    <div class="tag">Pista de terra, máquinas da roça e muita diversão!</div>
    <div class="splashMachines"><img src="assets/ui/tatu.png" alt="Tatu"><img src="assets/ui/broto.png" alt="Broto"><img src="assets/ui/pingo.png" alt="Pingo"></div>
    <div class="bar"><i id="splashBar"></i></div>
    <div class="tap hidden" id="splashTap"></div>
    <div class="credit">Oficina da Roça · máquinas inventadas para correr</div>`;
}

// ---------------------------------------------------------------- menu
function buildMenu() {
  $('menu').innerHTML = `${logo()}
    <div class="tag">Escolha sua máquina e acelere na roça!</div>${storageFeedback()}
    <div class="menuBtns">
      <button class="btn big orange" id="mPlay">▶ JOGAR</button>
      <button class="btn" id="mGarage">🔧 Garagem</button>
      <button class="btn blue" id="mShop">🛒 Loja</button>
      <button class="btn cream" id="mOptions">⚙️ Opções</button>
      <button class="btn cream" id="mCredits">⭐ Créditos</button>
      <button class="btn cream" id="mIntro" style="grid-column: span 2">🎬 Ver abertura</button>
    </div>
    <div class="stats">Corridas: ${profile.races} · Vitórias: ${profile.wins} · Troféus: ${Object.keys(profile.trophies).length}</div>`;
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
  const tracks=pickedMode==='cup'?TRACKS.filter(t=>api.CUP.tracks.includes(t.id)):TRACKS;
  if(pickedMode==='cup') pickedTrack=api.CUP.tracks[0];
  const records=pickedMode==='time'?profile.timeBest:pickedMode==='challenge'?Object.fromEntries(TRACKS.map(t=>[t.id,profile.challengeBest[t.id+':'+pickedChallenge]])):profile.best;
  $('tracks').innerHTML = `<h2 class="title">Escolha sua aventura</h2>
    <div class="raceModes" role="group" aria-label="Modo de corrida">${[['quick','Corrida rápida'],['cup','🏆 Copa'],['time','⏱ Contra o tempo'],['challenge','⭐ Desafios']].map(([id,label])=>`<button class="btn small ${pickedMode===id?'orange':'cream'}" data-race-mode="${id}">${label}</button>`).join('')}</div>
    <div class="eventDescription panel">${pickedMode==='cup'?`${api.CUP.name}: Milharal → Girassóis → Cerrado. Some pontos nas três corridas e conquiste um troféu! A copa em andamento dura esta sessão; o troféu fica salvo.` : pickedMode==='time'?'Corra sozinho, sem itens nem habilidade, contra o fantasma do seu melhor tempo.':pickedMode==='challenge'?'Escolha uma missão e complete uma volta para ganhar a recompensa.':'Quatro pistas, quatro máquinas e caminhos alternativos para descobrir.'}</div>
    ${pickedMode==='challenge'?`<div class="challengeChoices">${api.CHALLENGES.map(c=>`<button class="challengeChoice ${pickedChallenge===c.id?'on':''}" data-challenge="${c.id}"><b>${c.name}</b><span>${c.description}</span><small>🎁 ${c.reward}${profile.achievements.includes('challenge:'+c.id)?' · ✓ concluído':''}</small></button>`).join('')}</div>`:''}
    <div class="cards">${tracks.map(t => `
      <button type="button" class="card ${pickedTrack === t.id ? 'sel' : ''}" data-id="${t.id}" aria-pressed="${pickedTrack===t.id}" aria-label="${t.name}${pickedTrack===t.id?' selecionada':''}">
        <canvas width="260" height="170"></canvas>
        <b>${t.name}</b><small>${t.subtitle}</small>
        <div class="diff">${'🌽'.repeat(t.difficulty)}${'·'.repeat(3 - t.difficulty)}</div>
        <div class="best">${records[t.id] ? '🏅 Recorde ' + fmt(records[t.id]) : 'Sem recorde ainda'}</div>
      </button>`).join('')}</div>
    <div class="backRow"><button class="btn small cream" id="tBack">◀ Voltar</button>
      <button class="btn orange" id="tNext">Escolher máquina ▶</button></div>`;
  $('tracks').querySelectorAll('.card').forEach(c => {
    drawTrack(c.querySelector('canvas'), TRACKS.find(t => t.id === c.dataset.id));
    click(c, () => { if(pickedMode!=='cup') pickedTrack = c.dataset.id; buildTracks();$('tracks').querySelector(`[data-id="${pickedTrack}"]`)?.focus(); });
    c.addEventListener('dblclick', () => goGarageForRace());
  });
  click($('tBack'), () => ui.show('menu'), 'back');
  click($('tNext'), () => goGarageForRace());
  $('tracks').querySelectorAll('[data-race-mode]').forEach(b=>click(b,()=>{pickedMode=b.dataset.raceMode;buildTracks();}));
  $('tracks').querySelectorAll('[data-challenge]').forEach(b=>click(b,()=>{pickedChallenge=b.dataset.challenge;buildTracks();}));
}
function goGarageForRace() { profile.sel.track = api.prepareRace(pickedMode,pickedTrack,pickedChallenge); save(); api.openGarage('race'); ui.show('garage'); buildGarage('race'); }

// ---------------------------------------------------------------- garage + shop (shared)
let gTab = 'machine', preview = null, buildTarget = 'machine', buildSection = 'parts', creationNotice = '',garageNotice='';
let sheetCollapsed = false, garageSaved = true;
const TAB_NAMES = { machine: 'Máquina', build: '🛠 Montar', creations: 'Minhas criações', impl: 'Implemento', paint: 'Pintura', decal:'Adesivos', acc: 'Acessório', horn: 'Buzina' };
const CAT = { paint: 'paints', decal:'decals', acc: 'acc', horn: 'horns' };
function itemsFor(tab) {
  const { CHARACTERS, IMPLEMENTS, ABILITIES } = api;
  if (tab === 'machine') return Object.entries(CHARACTERS).map(([id, c]) => ({ id, name: c.name, sub: c.machine+' · '+(c.personality??(id==='tatu'?'Equilibrado e parceiro de todas as corridas.':'Rápido nas retas, brincalhão com a água.')), img: c.img, owned: true }));
  if (tab === 'impl') return Object.entries(IMPLEMENTS).map(([id, m]) => ({ id, name: m.name, sub: ABILITIES[m.ability].icon + ' ' + ABILITIES[m.ability].name, img: m.img, owned: true }));
  return CATALOG[CAT[tab]].map(i => ({ id: i.id, name: i.name, sw: i.color, ic: i.icon, price: i.price, unlock:i.unlock, sub:i.unlock?({drift:'5 mini-turbos numa corrida',jumps:'3 saltos com aterrissagem',corn:'20 moedas numa corrida',cup:'Pódio na Copa da Colheita'})[i.unlock]:null, owned: owns(CAT[tab], i.id) }));
}
const selKey = tab => ({ machine: 'char', impl: 'impl', paint: 'paint', acc: 'acc', horn: 'horn' }[tab]);
function buildGarage(mode) {
  const shop = mode === 'shop', root = $(shop ? 'shop' : 'garage');
  garageSaved=storageState.ok;
  $(shop ? 'garage' : 'shop').replaceChildren();
  root.classList.toggle('sheetCollapsed', sheetCollapsed);
  const tabs = shop ? ['paint','decal', 'acc', 'horn'] : ['machine', 'build', 'creations', 'impl', 'paint','decal', 'acc', 'horn'];
  if (!tabs.includes(gTab)) gTab = tabs[0];
  if(!shop && gTab==='impl') gTab='machine';
  const page=gTab==='machine'?'machine':gTab==='creations'?'creations':'customize';
  root.dataset.page=page;
  const { CHARACTERS, IMPLEMENTS, ABILITIES } = api;
  const sel = { ...profile.sel, ...(preview ?? {}) };
  sel.decal=cleanBuild(profile.builds[sel.char]).decal;
  const ch = CHARACTERS[sel.char], tows = ch.tows;
  const canBuildBroto = tows && sel.impl === 'broto';
  if (!canBuildBroto) buildTarget = 'machine';
  if (buildTarget === 'broto' && buildSection === 'proportions') buildSection = 'parts';
  if(gTab==='build' && buildTarget==='machine' && sel.char!=='tatu' && buildSection==='parts') buildSection='proportions';
  const im = tows ? IMPLEMENTS[sel.impl] : null;
  const ab = ABILITIES[tows ? im.ability : ch.ability];
  const pv = preview && Object.entries(preview)[0];
  let buyBox = '';
  if (pv) {
    const [k, id] = pv, tab = Object.keys(TAB_NAMES).find(t => selKey(t) === k), item = CATALOG[CAT[tab]]?.find(i => i.id === id);
    if(item?.unlock && !owns(CAT[tab],id)) buyBox=`<div>⭐ ${item.name}: conquiste a recompensa nas copas ou desafios.</div>`;
    else if (item && !owns(CAT[tab], id)) buyBox = `<div><b>${item.name}</b> · <span style="color:#b06a00;font-family:'Lilita One'">🌽 ${item.price}</span><br>
      <button class="btn small orange" id="gBuy" ${profile.coins < item.price ? 'disabled style="opacity:.5"' : ''}>Comprar</button>
      ${profile.coins < item.price ? '<small> Faltam ' + (item.price - profile.coins) + ' 🌽 — corra para ganhar!</small>' : ''}</div>`;
  }
  const catalogTabs = tabs.filter(t => !['build','creations'].includes(t));
  const sections=[['build:parts','Peças'],['build:proportions','Rodas e tamanho'],['build:colors','Cores'],['decal','Adesivos'],['acc','Acessórios'],['horn','Buzina']];
  const catalog = shop ? `<div class="tabs">${catalogTabs.map(t => `<button class="tab ${gTab === t ? 'on' : ''}" data-t="${t}">${TAB_NAMES[t]}</button>`).join('')}</div>` : `<nav class="garageSections" aria-label="Personalização">${sections.filter(([id])=>!(buildTarget==='broto' && id==='build:proportions') && !(sel.char!=='tatu' && id==='build:parts')).map(([id,label])=>`<button class="tab ${(gTab==='build'?id==='build:'+buildSection:id===gTab || (id==='build:colors' && gTab==='paint'))?'on':''}" data-custom-section="${id}" aria-pressed="${gTab==='build'?id==='build:'+buildSection:id===gTab || (id==='build:colors' && gTab==='paint')}">${label}</button>`).join('')}</nav>`;
  root.innerHTML = `
    <header class="gHeader">
      <button class="btn small cream" id="gBack" aria-label="Voltar">‹ <span>Voltar</span></button>
      <div class="gBrand"><span class="gGameName">🌽 Roça Kart</span><h2>${shop ? 'Loja da Roça' : 'Oficina da Roça'}</h2></div>
      <nav class="gMainNav" aria-label="Seções da oficina">
        <button class="tab ${!shop && page==='machine'?'on':''}" data-page="machine" aria-pressed="${!shop && page==='machine'}">Máquina</button>
        <button class="tab ${!shop && page==='customize' ? 'on' : ''}" data-page="build" aria-pressed="${!shop && page==='customize'}">Personalizar</button>
        <button class="tab ${gTab === 'creations' ? 'on' : ''}" data-page="creations" aria-pressed="${gTab==='creations'}">Minhas criações</button>
      </nav><div class="gWallet" aria-label="Moedas de milho">🌽 ${profile.coins}</div>
    </header>
    <div class="gPreview" aria-label="Prévia 3D da sua máquina"><div class="garagePreviewName"><b>${ch.name}${im && sel.impl!=='none'?' + '+im.name:''}</b><span>${preview?'Prévia de item não equipado':'Sua montagem atual'}</span></div><span class="gRotateHint">⟳ Arraste para girar</span></div>
    <aside class="panel gPanel" aria-label="Editor da oficina">
      <button class="gSheetToggle" id="gSheetToggle" aria-expanded="${!sheetCollapsed}" aria-controls="gEditorBody"><span class="gSheetHandle"></span><span class="gSheetCaption">${sheetCollapsed ? 'Abrir edição' : 'Recolher edição'}</span><span aria-hidden="true">${sheetCollapsed ? '⌃' : '⌄'}</span></button>
      <div class="gEditorBody" id="gEditorBody">
      <h3 class="gEditingTitle">${gTab === 'creations' ? 'Minhas criações' : shop ? 'Escolha seu estilo' : page==='machine'?'Escolha sua máquina':'Personalize '+(buildTarget === 'broto' && gTab === 'build' ? 'o Broto' : ch.name)}</h3>
      ${gTab==='machine'?'<p class="garageIntro">Escolha uma máquina. Depois, abra Personalizar para dar seu estilo.</p>':''}
      ${gTab === 'creations' || gTab==='machine' ? '' : catalog}
      ${gTab === 'build' ? `${canBuildBroto?`<div class="buildTargets" role="group" aria-label="Escolher o que montar">
        <button class="tab ${buildTarget === 'machine' ? 'on' : ''}" data-target="machine" aria-pressed="${buildTarget === 'machine'}"><img src="${ch.img}" alt="">${ch.name}</button>
        <button class="tab ${buildTarget === 'broto' ? 'on' : ''}" data-target="broto" aria-pressed="${buildTarget === 'broto'}" ${canBuildBroto ? '' : 'disabled'}><img src="assets/ui/broto.png" alt="">Broto</button>
      </div>`:''}
      ${buildTarget === 'broto' ? buildImplementEditor() : buildEditor(sel.char)}` : gTab === 'creations' ? buildCreations() : `<div class="items">${itemsFor(gTab).map(i => `
        <button type="button" class="it ${(gTab==='decal'?sel.decal:sel[selKey(gTab)]) === i.id ? 'sel' : ''} ${i.owned ? '' : 'locked'}" data-id="${i.id}" aria-pressed="${(gTab==='decal'?sel.decal:sel[selKey(gTab)])===i.id}" aria-label="${i.name}${i.owned?'':i.unlock?' — recompensa de conquista':' — prévia, custa '+i.price+' moedas'}">
          ${i.img ? `<img src="${i.img}" alt="">` : i.sw ? `<div class="sw" style="background:${i.sw}"></div>` : `<div class="ic">${i.ic}</div>`}
          <div>${i.name}</div>${i.sub ? `<small>${i.sub}</small>` : ''}
          ${i.owned ? ((gTab==='decal'?sel.decal:sel[selKey(gTab)]) === i.id ? '<small>✔ Em uso</small>' : '<small>Selecionar</small>') : `<div class="price">${i.unlock?'⭐ Conquista':'🌽 '+i.price}</div>`}
        </button>`).join('')}</div>`}
      ${gTab==='machine'?`${tows?`<fieldset class="garageImplement"><legend>Levar o Broto?</legend><div>${itemsFor('impl').map(i=>`<button class="tab ${sel.impl===i.id?'on':''}" data-implement="${i.id}" aria-pressed="${sel.impl===i.id}">${i.id==='none'?'Só o Tatu':'Tatu + Broto'}</button>`).join('')}</div><small>${im.perk}</small></fieldset>`:''}<button class="btn garagePersonalize" id="gPersonalize">Personalizar ${ch.name} →</button>`:''}
      <details class="gAttributes" ${gTab==='machine'?'open':''}><summary>Atributos e habilidade <span aria-hidden="true">›</span></summary><div class="gInfo">
        <div><b style="font-family:'Lilita One';font-size:22px">${ch.name}${im && sel.impl !== 'none' ? ' + ' + im.name : ''}</b><br>
          <span class="abilTag">${ab.icon} ${ab.name}</span> ${im ? `<small>${im.perk}</small>` : ''}</div>
        <div class="statsBox">${Object.entries(ch.stats).map(([k, v]) => `<span>${k}</span><em>${stars(v)}</em>`).join('')}</div>
      </div></details>
      ${buyBox ? `<div class="gBuyBox">${buyBox}<button class="btn small cream" id="gCancelPreview">Descartar prévia</button></div>` : ''}
      <p class="garageNotice" role="status">${escapeHTML(gTab==='creations'?'':garageNotice)}</p>
      </div>
    </aside>
    <footer class="gFooter"><span class="gSaveStatus ${garageSaved?'':'saveFailed'}" role="status">${!garageSaved?'⚠ Não salvo no dispositivo · exporte suas criações':preview?'Prévia · item não equipado':'✓ Salvo automaticamente'}</span>
      <button class="btn cream" id="gSaveCreation" ${preview ? 'disabled' : ''}>▣ <span>Salvar criação</span></button>
      <button class="btn" id="gGo">CORRER ▶</button>
    </footer>`;
  click($('gBack'), () => { preview = null; api.leaveGarage(mode === 'race' ? 'tracks' : 'menu'); }, 'back');
  root.querySelectorAll('.tabs [data-t]').forEach(b => click(b, () => { if (b.disabled) return; gTab = b.dataset.t; preview = null; garageNotice='';api.refreshShowroom(); buildGarage(mode);root.querySelector(`[data-t="${gTab}"]`)?.focus(); }));
  root.querySelectorAll('[data-page]').forEach(button => click(button, () => {
    gTab = button.dataset.page; preview = null; garageNotice='';sheetCollapsed = false;
    if (shop) { api.openGarage('menu'); ui.show('garage'); }
    else api.refreshShowroom();
    buildGarage(shop ? 'menu' : mode);
    (shop?$('garage'):root).querySelector(`[data-page="${button.dataset.page}"]`)?.focus();
  }));
  root.querySelectorAll('[data-custom-section]').forEach(button=>click(button,()=>{
    const [tab,section]=button.dataset.customSection.split(':');gTab=tab;if(section)buildSection=section;if(tab!=='build')buildTarget='machine';
    preview=null;garageNotice='';api.refreshShowroom();buildGarage(mode);
    root.querySelector(`[data-custom-section="${button.dataset.customSection}"]`)?.focus();
  }));
  root.querySelectorAll('[data-implement]').forEach(button=>click(button,()=>{profile.sel.impl=button.dataset.implement;saveGarage();api.refreshShowroom();buildGarage(mode);root.querySelector(`[data-implement="${profile.sel.impl}"]`)?.focus();}));
  if($('gPersonalize')) click($('gPersonalize'),()=>{gTab='build';buildTarget='machine';buildSection=sel.char==='tatu'?'parts':'proportions';buildGarage(mode);root.querySelector('.garageSections .on')?.focus();});
  click($('gSheetToggle'), () => {
    sheetCollapsed = !sheetCollapsed;
    root.classList.toggle('sheetCollapsed', sheetCollapsed);
    $('gSheetToggle').setAttribute('aria-expanded', String(!sheetCollapsed));
    $('gSheetToggle').querySelector('.gSheetCaption').textContent = sheetCollapsed ? 'Abrir edição' : 'Recolher edição';
    $('gSheetToggle').lastElementChild.textContent = sheetCollapsed ? '⌃' : '⌄';
  });
  click($('gSaveCreation'), () => {
    gTab = 'creations'; sheetCollapsed = false;
    if (shop) { api.openGarage('menu'); ui.show('garage'); }
    buildGarage(shop ? 'menu' : mode); $('creationName').focus();
  });
  root.querySelectorAll('.it').forEach(el => click(el, () => {
    const id = el.dataset.id, k = selKey(gTab);
    garageNotice='';
    if(gTab==='decal') {
      if(!owns('decals',id)){garageNotice=itemsFor('decal').find(i=>i.id===id)?.sub??'Conquiste este adesivo nas copas e nos desafios!';audio.sfx('deny');buildGarage(mode);root.querySelector(`[data-id="${id}"]`)?.focus();return;}
      profile.builds[sel.char]={...cleanBuild(profile.builds[sel.char]),decal:id};saveGarage();api.refreshShowroom();buildGarage(mode);root.querySelector(`[data-id="${id}"]`)?.focus();return;
    }
    if (gTab === 'horn') audio.horn(id);
    const cat = CAT[gTab];
    if (!cat || owns(cat, id)) {
      profile.sel[k] = id;
      if (gTab === 'paint' && profile.builds[sel.char]) profile.builds[sel.char].bodyColor = null;
      saveGarage(); preview = null;
    }
    else preview = { [k]: id };
    api.refreshShowroom(preview ?? undefined);
    buildGarage(mode);
    root.querySelector(`[data-id="${id}"]`)?.focus();
  }));
  const cancelPreview=$('gCancelPreview');
  if(cancelPreview) click(cancelPreview,()=>{preview=null;garageNotice='Prévia descartada. Sua montagem equipada foi mantida.';api.refreshShowroom();buildGarage(mode);},'back');
  const b = $('gBuy');
  if (b) click(b, () => {
    const [k, id] = Object.entries(preview)[0], tab = Object.keys(TAB_NAMES).find(t => selKey(t) === k);
    if (buy(CAT[tab], id)) {
      audio.sfx('buy'); profile.sel[k] = id;
      if (k === 'paint' && profile.builds[sel.char]) profile.builds[sel.char].bodyColor = null;
      saveGarage(); preview = null; api.refreshShowroom(); updateWallet(); buildGarage(mode);
    }
    else {audio.sfx('deny');garageNotice='Compra não concluída. Confira o saldo e as condições de desbloqueio.';buildGarage(mode);}
  }, 'click');
  const go = $('gGo');
  if (go) click(go, () => { if(preview) {garageNotice='Essa prévia não foi comprada. Escolha um item equipado ou compre antes de correr.';buildGarage(mode);return;} api.startRace(profile.sel.track); });
  if (gTab === 'build') {
    root.querySelectorAll('[data-target]').forEach(button => click(button, () => {
      if (button.disabled) return;
      buildTarget = button.dataset.target; buildGarage(mode);
      root.querySelector(`[data-target="${buildTarget}"]`)?.focus();
    }));
    if (buildTarget === 'broto') bindImplementEditor(root, mode);
    else bindEditor(root, sel.char, mode);
  }
  if (gTab === 'creations') bindCreations(root, mode);
}

function saveGarage() {
  garageSaved = save();
  document.querySelectorAll('.gSaveStatus').forEach(el => { el.classList.toggle('saveFailed',!garageSaved);el.textContent = garageSaved ? '✓ Salvo automaticamente' : '⚠ Não salvo no dispositivo · exporte suas criações'; });
}

// Small vector drawings show each part's silhouette before it is fitted to the machine.
function partDrawing(key, value) {
  const drawings = {
    'hopper:seed': `<path fill="#E9C46A" d="M36 65C13 40 42 17 65 8c4 12 35 29 29 46-4 14-40 23-58 11Z"/>
      <path d="M64 14 49 63m17-47 11 46" stroke="#C39A42" stroke-width="3" fill="none"/><path d="m29 47 64-5v10l-62 6Z" fill="#FFF0CF"/>`,
    'hopper:barrel': `<path fill="#E9C46A" d="M34 22h60v39c0 16-60 16-60 0Z"/><ellipse cx="64" cy="22" rx="30" ry="12" fill="#E87578"/>
      <path d="M34 33q30 14 60 0m-60 22q30 14 60 0" fill="none" stroke="#FFF0CF" stroke-width="6"/>`,
    'hopper:crate': `<path d="m23 24 58-10 25 15-57 13Z" fill="#FFF0CF"/><path d="m23 24 26 18v28L23 52Z" fill="#D5AA54"/>
      <path d="m49 42 57-13v28L49 70Z" fill="#E9C46A"/><path d="m55 48 45-10m-45 21 45-10" stroke="#FFF0CF" stroke-width="5"/>
      <path d="M29 28v25m25-11v24m46-34v24" stroke="#E87578" stroke-width="6"/>`,
    'wheels:small': `<ellipse cx="65" cy="48" rx="20" ry="22" fill="#29353D"/><ellipse cx="62" cy="48" rx="13" ry="16" fill="#FFF0CF"/>
      <ellipse cx="61" cy="48" rx="6" ry="8" fill="#E87578"/><path d="m42 34 6-5m-9 19 7-1m-3 18 6-5m24-30 7 5m-3 14 8 1" stroke="#56656B" stroke-width="4"/>`,
    'wheels:wide': `<path d="M48 18h31c34 0 34 52 0 52H48Z" fill="#29353D"/><ellipse cx="48" cy="44" rx="25" ry="26" fill="#3D4B54"/>
      <ellipse cx="47" cy="44" rx="17" ry="19" fill="#FFF0CF"/><ellipse cx="47" cy="44" rx="8" ry="10" fill="#E87578"/>
      <path d="m73 22 13 5m-9 8 17 5m-16 8 17 5m-21 9 12 4" stroke="#56656B" stroke-width="5"/>`,
    'wheels:double': `<ellipse cx="82" cy="39" rx="23" ry="25" fill="#29353D"/><ellipse cx="80" cy="39" rx="13" ry="16" fill="#FFF0CF"/>
      <ellipse cx="48" cy="48" rx="25" ry="26" fill="#3D4B54"/><ellipse cx="46" cy="48" rx="16" ry="19" fill="#FFF0CF"/>
      <ellipse cx="46" cy="48" rx="7" ry="9" fill="#E87578"/><path d="m26 32 8-5m-12 20 9-1m-4 19 8-5" stroke="#56656B" stroke-width="4"/>`,
    'hood:shell': `<path fill="#216C79" d="M18 58C16 26 39 14 69 18c25 3 41 17 43 40L95 68H35Z"/>
      <path d="M38 57c-2-19 6-29 18-36m3 41c0-20 5-32 13-40m10 40c0-14 1-23 2-33" fill="none" stroke="#75C5D4" stroke-width="5"/>`,
    'hood:box': `<path fill="#75C5D4" d="m19 28 63-9 28 16-64 10Z"/><path fill="#216C79" d="m19 28 27 17v24L19 53Z"/>
      <path fill="#2C8290" d="m46 45 64-10v24L46 69Z"/><path d="m61 49 34-5m-34 12 34-5m-34 12 34-5" stroke="#203B43" stroke-width="3"/>`,
    'hood:round': `<path fill="#216C79" d="M38 20h51c31 0 34 42 7 45H40C7 65 6 23 38 20Z"/>
      <ellipse cx="36" cy="43" rx="20" ry="22" fill="#75C5D4"/><path d="M53 24h34" stroke="#FFF0CF" stroke-width="4" stroke-linecap="round"/>`,
    'roof:canopy': `<path d="M34 65V31m60 34V31" stroke="#216C79" stroke-width="7"/>
      <path fill="#E9C46A" d="m16 22 69-9 28 13v9L29 44 16 34Z"/><path fill="#FFF0CF" d="m16 22 69-9 28 13-84 9Z"/>`,
    'roof:open': `<path d="M30 29v34m68-34v34M30 24h68" stroke="#92A7A9" stroke-width="3" stroke-dasharray="5 5" fill="none"/>
      <rect x="43" y="39" width="31" height="22" rx="6" fill="#E87578"/><path d="M40 65h43" stroke="#216C79" stroke-width="6"/>
      <path d="m59 14 5-7 5 7m-5-6v18" stroke="#216C79" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    'roof:cage': `<path d="M29 65V29q0-9 9-9h49q9 0 9 9v36" stroke="#216C79" stroke-width="9" fill="none"/>
      <path d="M29 65V29q0-9 9-9h49" stroke="#FFF0CF" stroke-width="4" fill="none"/>
      <rect x="45" y="42" width="32" height="21" rx="5" fill="#E87578"/>`,
    'bumper:bar': `<path d="M36 55v12m57-18v13" stroke="#56656B" stroke-width="7"/>
      <path d="m15 37 88-9 11 9v17l-88 9-11-9Z" fill="#E87578"/><path d="m20 38 84-8 8 7-86 9Z" fill="#F3ADAB"/>
      <g fill="#FFF0CF"><circle cx="33" cy="52" r="4"/><circle cx="99" cy="45" r="4"/></g>`,
    'bumper:double': `<path d="M31 33v36m65-43v36" stroke="#56656B" stroke-width="6"/>
      <path d="m16 23 88-9 9 9v9l-88 9-9-9Zm0 29 88-9 9 9v9l-88 9-9-9Z" fill="#E87578"/>
      <path d="m21 25 81-8m-81 37 81-8" stroke="#F3ADAB" stroke-width="3"/>
      <g fill="#FFF0CF"><circle cx="32" cy="33" r="3"/><circle cx="99" cy="26" r="3"/><circle cx="32" cy="62" r="3"/><circle cx="99" cy="55" r="3"/></g>`,
    'bumper:none': `<rect x="17" y="29" width="94" height="28" rx="8" stroke="#92A7A9" stroke-width="3" stroke-dasharray="6 5" fill="none"/>
      <circle cx="64" cy="43" r="20" fill="#FFF0CF" stroke="#E87578" stroke-width="4"/><path d="m50 57 28-28" stroke="#E87578" stroke-width="4"/>`,
  };
  return `<svg class="partDrawing" viewBox="0 0 128 80" aria-hidden="true" focusable="false"><ellipse cx="64" cy="71" rx="46" ry="4" fill="#203B43" opacity=".09"/>${drawings[key + ':' + value] ?? ''}</svg>`;
}

const WHEEL_PRESETS=[
  {id:'compact',name:'Compacto',drawing:'small',values:{frontSize:.85,rearSize:.9,tireWidth:.8,stance:.98}},
  {id:'trail',name:'Trilha',drawing:'wide',values:{frontSize:1,rearSize:1.05,tireWidth:1.2,stance:1.12}},
  {id:'big',name:'Robusto',drawing:'wide',values:{frontSize:1.2,rearSize:1.18,tireWidth:1.45,stance:1.25}},
];
const COLOR_STYLES=[
  {id:'oficina',name:'Oficina',colors:['#216C79','#E9C46A','#E87578','#FFF0CF']},
  {id:'barro',name:'Terra e sol',colors:['#B85A33','#E9C46A','#216C79','#FFF0CF']},
  {id:'noite',name:'Noite na roça',colors:['#364968','#76CADB','#E9C46A','#FFF0CF']},
];
function colorStyles(implement=false) {
  const b=implement?cleanImplementBuild(profile.implementBuilds.broto):cleanBuild(profile.builds[profile.sel.char]);
  return `<fieldset class="quickStyles"><legend>Combinações de cores</legend><div class="quickStyleGrid">${COLOR_STYLES.map(style=>{
    const [body,hopper,accent,trim]=style.colors;
    const selected=(b.bodyColor??paintColor(profile.sel.paint))===body && b.accent===accent && b.trim===trim && (!implement || b.hopperColor===hopper);
    return `<button type="button" class="quickStyle ${selected?'selected':''}" data-color-style="${style.id}" aria-pressed="${selected}"><span class="paletteChips">${(implement?style.colors:[body,accent,trim]).map(color=>`<i style="background:${color}"></i>`).join('')}</span><b>${style.name}</b></button>`;
  }).join('')}</div><small>Use uma combinação ou escolha cada cor abaixo.</small></fieldset>`;
}
function bindColorStyles(root,mode,implement=false) {
  root.querySelectorAll('[data-color-style]').forEach(button=>click(button,()=>{
    const style=COLOR_STYLES.find(s=>s.id===button.dataset.colorStyle);if(!style)return;
    const [bodyColor,hopperColor,accent,trim]=style.colors;
    if(implement) profile.implementBuilds.broto=cleanImplementBuild({...profile.implementBuilds.broto,bodyColor,hopperColor,accent,trim});
    else profile.builds[profile.sel.char]=cleanBuild({...profile.builds[profile.sel.char],bodyColor,accent,trim});
    saveGarage();api.refreshShowroom();buildGarage(mode);root.querySelector(`[data-color-style="${style.id}"]`)?.focus();
  }));
}
function refreshQuickStyles(root,b,implement=false) {
  root.querySelectorAll('[data-wheel-style]').forEach(button=>{
    const p=WHEEL_PRESETS.find(p=>p.id===button.dataset.wheelStyle),selected=Object.entries(p.values).every(([k,v])=>Math.abs(b[k]-v)<.001);
    button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
  });
  root.querySelectorAll('[data-color-style]').forEach(button=>{
    const [body,hopper,accent,trim]=COLOR_STYLES.find(s=>s.id===button.dataset.colorStyle).colors;
    const selected=(b.bodyColor??paintColor(profile.sel.paint))===body && b.accent===accent && b.trim===trim && (!implement || b.hopperColor===hopper);
    button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
  });
}
function buildEditor(char) {
  const b = cleanBuild(profile.builds[char]);
  const choices = char === 'tatu' ? [
    ['hood', 'Capô', [['shell','Casco do Tatu'],['box','Caixote de oficina'],['round','Cápsula']]],
    ['roof', 'Cabine', [['canopy','Toldo de palha'],['open','Sem teto'],['cage','Santo-antônio']]],
    ['bumper', 'Para-choque', [['bar','Barra simples'],['double','Barra dupla'],['none','Sem barra']]],
  ] : [];
  const sliders = [
    ['frontSize','Rodas dianteiras'], ['rearSize','Rodas traseiras'], ['tireWidth','Largura dos pneus'], ['stance','Distância entre rodas'],
    ...(char === 'tatu' ? [['hoodWidth','Largura do capô'],['hoodHeight','Altura do capô']] : char==='pingo'?[['tankSize','Tamanho do tanque'],['armSize','Braços de irrigação']]:[]),
  ];
  return `<div class="buildIntro">${buildSection === 'parts' ? 'Escolha pelo desenho e monte do seu jeito.' : buildSection === 'proportions' ? 'Ajuste os tamanhos da sua máquina.' : 'Escolha as cores da sua montagem.'}</div>
    ${buildSection === 'parts' ? choices.length ? `<div class="partGroups">${choices.map(([key,label,options]) => `<fieldset class="partGroup"><legend>${label}</legend><div class="partOptions">${options.map(([v,text]) => `
      <label class="partOption"><input type="radio" name="build-${key}" data-build="${key}" value="${v}" ${b[key] === v ? 'checked' : ''}>
      <span class="partCard">${partDrawing(key,v)}<span class="partLabel">${text}</span><span class="partSelected">✓ Selecionado</span></span></label>`).join('')}</div></fieldset>`).join('')}</div>` : `<div class="gEditorTip">${char==='pingo'?'💧 Ajuste o tanque e os braços em Rodas e tamanho.':'🚜 Ajuste as rodas em Rodas e tamanho.'} Use Cores, Adesivos e Acessórios para completar seu visual. Esta máquina mantém sua carroceria original.</div>` : ''}
    ${buildSection === 'proportions' ? `<fieldset class="quickStyles"><legend>Conjuntos de rodas</legend><div class="quickStyleGrid">${WHEEL_PRESETS.map(p=>`<button class="quickStyle ${Object.entries(p.values).every(([k,v])=>Math.abs(b[k]-v)<.001)?'selected':''}" data-wheel-style="${p.id}" aria-pressed="${Object.entries(p.values).every(([k,v])=>Math.abs(b[k]-v)<.001)}">${partDrawing('wheels',p.drawing)}<b>${p.name}</b></button>`).join('')}</div><small>Os conjuntos ajustam as proporções. Refine cada medida abaixo.</small></fieldset><div class="buildGrid">
    ${sliders.map(([key,label]) => `<label>${label} <output data-value="${key}">${Math.round(b[key]*100)}%</output><input aria-label="${label}" data-build="${key}" type="range" min="${BUILD_RANGES[key][0]}" max="${BUILD_RANGES[key][1]}" step=".01" value="${b[key]}"></label>`).join('')}
    </div>` : ''}
    ${buildSection === 'colors' ? `${colorStyles()}<div class="buildGrid">
    ${[['bodyColor','Carroceria',b.bodyColor ?? paintColor(profile.sel.paint)],['accent','Detalhes',b.accent],['trim','Acabamento',b.trim]].map(([key,label,value]) => `<label class="buildColor">${label}<input aria-label="${label}" data-build="${key}" type="color" value="${value}"></label>`).join('')}
    </div><button class="btn small cream" id="gPaints">Ver pinturas da loja →</button>` : ''}<div class="buildActions"><small>Estas mudanças são visuais; os atributos da máquina continuam iguais.</small><button class="btn small cream" id="buildReset">Restaurar montagem</button></div>`;
}
function bindEditor(root, char, mode) {
  bindColorStyles(root,mode);
  root.querySelectorAll('[data-wheel-style]').forEach(button=>click(button,()=>{
    const preset=WHEEL_PRESETS.find(p=>p.id===button.dataset.wheelStyle);if(!preset)return;
    profile.builds[char]=cleanBuild({...profile.builds[char],...preset.values});saveGarage();api.refreshShowroom();buildGarage(mode);root.querySelector(`[data-wheel-style="${preset.id}"]`)?.focus();
  }));
  if($('gPaints'))click($('gPaints'),()=>{gTab='paint';buildGarage(mode);});
  root.querySelectorAll('[data-build]').forEach(input => input.addEventListener('input', () => {
    const b = cleanBuild(profile.builds[char]);
    b[input.dataset.build] = input.type === 'range' ? Number(input.value) : input.value;
    profile.builds[char] = cleanBuild(b);
    const out = root.querySelector(`[data-value="${input.dataset.build}"]`);
    if (out) out.value = Math.round(Number(input.value)*100) + '%';
    refreshQuickStyles(root,profile.builds[char]);saveGarage(); api.refreshShowroom();
  }));
  click($('buildReset'), () => { profile.builds[char] = { ...BUILD_DEFAULTS }; saveGarage(); api.refreshShowroom(); buildGarage(mode); });
}

function buildImplementEditor() {
  const b = cleanImplementBuild(profile.implementBuilds.broto);
  const choices = [
    ['hopper', 'Reservatórios', [['seed','Sementes'],['barrel','Barris'],['crate','Caixotes']]],
    ['wheels', 'Rodas', [['small','Pequenas'],['wide','Largas'],['double','Duplas']]],
  ];
  return `<div class="buildIntro">${buildSection === 'parts' ? 'Escolha os reservatórios e as rodas do Broto.' : 'As cores do Broto são independentes do trator.'}</div>
    ${buildSection === 'parts' ? `<div class="partGroups brotoParts">${choices.map(([key,label,options]) => `<fieldset class="partGroup"><legend>${label}</legend><div class="partOptions">${options.map(([v,text]) => `
      <label class="partOption"><input type="radio" name="broto-${key}" data-impl-build="${key}" value="${v}" ${b[key] === v ? 'checked' : ''}>
      <span class="partCard">${partDrawing(key,v)}<span class="partLabel">${text}</span><span class="partSelected">✓ Selecionado</span></span></label>`).join('')}</div></fieldset>`).join('')}</div>` : ''}
    ${buildSection === 'colors' ? `${colorStyles(true)}<div class="buildGrid">${[['bodyColor','Chassi'],['hopperColor','Reservatórios'],['accent','Detalhes'],['trim','Acabamento']].map(([key,label]) => `
      <label class="buildColor">${label}<input aria-label="Cor do ${label}" data-impl-build="${key}" type="color" value="${b[key]}"></label>`).join('')}</div>` : ''}
    <div class="buildActions"><small>Peças visuais: a habilidade de plantio continua a mesma.</small><button class="btn small cream" id="implBuildReset">Restaurar Broto</button></div>`;
}
function bindImplementEditor(root, mode) {
  bindColorStyles(root,mode,true);
  root.querySelectorAll('[data-impl-build]').forEach(input => input.addEventListener('input', () => {
    const b = cleanImplementBuild(profile.implementBuilds.broto);
    b[input.dataset.implBuild] = input.value;
    profile.implementBuilds.broto = cleanImplementBuild(b);
    refreshQuickStyles(root,profile.implementBuilds.broto,true);saveGarage(); api.refreshShowroom();
  }));
  click($('implBuildReset'), () => {
    profile.implementBuilds.broto = { ...IMPLEMENT_DEFAULTS };
    saveGarage(); api.refreshShowroom(); buildGarage(mode);
  });
}

const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function buildCreations() {
  return `<form id="creationForm" class="creationForm">
      <label for="creationName">Salvar a montagem atual<input id="creationName" name="name" type="text" maxlength="40" required placeholder="Ex.: Tatu da Colheita" autocomplete="off"></label>
      <button class="btn small" type="submit">＋ Salvar criação</button>
    </form><label class="btn small cream creationImport" for="creationFile">↥ Importar criação</label><input id="creationFile" class="hidden" type="file" accept=".json,application/json">
    <p class="creationNotice" role="status">${escapeHTML(creationNotice || 'Guarde a montagem, duplique variações e compartilhe arquivos com amigos.')}</p>${storageFeedback()}
    <div class="creationList">${profile.creations.length ? profile.creations.map(c => {
      const ch = api.CHARACTERS[c.sel.char];
      const hasBroto = ch.tows && c.sel.impl === 'broto';
      const b = cleanImplementBuild(c.implBuild);
      return `<article class="creationCard"><img class="${c.thumbnail?'creationThumbnail':''}" src="${c.thumbnail??ch.img}" alt="Montagem de ${ch.name}"><div class="creationDetails">
        <label class="creationNameLabel">Nome<input data-rename-creation="${escapeHTML(c.id)}" maxlength="40" value="${escapeHTML(c.name)}" aria-label="Renomear criação"></label><small>${ch.name}${hasBroto ? ' + Broto' : ''}</small>
        ${hasBroto ? `<div class="creationParts">${partDrawing('hopper',b.hopper)}${partDrawing('wheels',b.wheels)}</div>` : ''}
        <div class="creationButtons"><button class="btn small" data-load-creation="${escapeHTML(c.id)}">Usar</button>
        <button class="btn small cream" data-duplicate-creation="${escapeHTML(c.id)}">Duplicar</button>
        <button class="btn small cream" data-export-creation="${escapeHTML(c.id)}">Exportar</button>
        <button class="btn small cream" data-remove-creation="${escapeHTML(c.id)}" aria-label="Excluir ${escapeHTML(c.name)}">Excluir</button></div>
      </div></article>`;
    }).join('') : '<p class="creationEmpty">Sua primeira criação começa na aba Montar. Depois, dê um nome e salve aqui!</p>'}</div>`;
}
function bindCreations(root, mode) {
  $('creationForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form=e.currentTarget,name=$('creationName').value;
    if(!name.trim()) {root.querySelector('.creationNotice').textContent='Digite um nome para sua criação.';return;}
    form.querySelector('button').disabled=true;
    const thumbnail=await api.captureCreationPreview();
    if(!form.isConnected) return;
    const result = saveCreation(name,thumbnail);
    if (!result) {
      form.querySelector('button').disabled=false;
      root.querySelector('.creationNotice').textContent = 'Digite um nome para sua criação.';
      $('creationName').focus(); return;
    }
    creationNotice = result.persisted ? `“${result.creation.name}” salva! Use quando quiser.` : 'Criação guardada nesta sessão. O navegador não permitiu salvar no armazenamento.';
    garageSaved = result.persisted;
    audio.sfx('click'); buildGarage(mode);
  });
  root.querySelectorAll('[data-load-creation]').forEach(button => click(button, () => {
    if (!loadCreation(button.dataset.loadCreation)) {root.querySelector('.creationNotice').textContent='Criação não encontrada. Escolha outra montagem.';audio.sfx('deny');return;}
    preview = null; buildTarget = 'machine';
    creationNotice = storageState.ok?'Criação aplicada! Você pode correr ou continuar montando.':'Montagem aplicada nesta sessão. Exporte a criação antes de fechar.';
    api.refreshShowroom(); buildGarage(mode);
  }));
  root.querySelectorAll('[data-remove-creation]').forEach(button => click(button, () => {
    removeCreation(button.dataset.removeCreation);
    creationNotice = storageState.ok?'Criação excluída da coleção. A montagem equipada foi mantida.':'Excluída nesta sessão, mas não foi possível gravar a alteração no dispositivo.';
    buildGarage(mode);
  }));
  root.querySelectorAll('[data-rename-creation]').forEach(input=>input.addEventListener('change',()=>{
    if(renameCreation(input.dataset.renameCreation,input.value)) {creationNotice=storageState.ok?'Nome atualizado.':'Nome atualizado somente nesta sessão. Exporte a criação antes de fechar.';root.querySelector('.creationNotice').textContent=creationNotice;}
    else {input.value=profile.creations.find(c=>c.id===input.dataset.renameCreation)?.name??'';root.querySelector('.creationNotice').textContent='O nome não pode ficar vazio. O nome anterior foi mantido.';}
  }));
  root.querySelectorAll('[data-duplicate-creation]').forEach(button=>click(button,()=>{duplicateCreation(button.dataset.duplicateCreation);creationNotice=storageState.ok?'Cópia criada! Edite o nome para organizar suas variações.':'Cópia criada somente nesta sessão. Exporte antes de fechar.';buildGarage(mode);}));
  root.querySelectorAll('[data-export-creation]').forEach(button=>click(button,()=>{
    try {
    const text=exportCreation(button.dataset.exportCreation);if(!text)return;
    const c=profile.creations.find(c=>c.id===button.dataset.exportCreation);
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=(c.name.replace(/[^a-z\d_-]/gi,'_')||'criacao')+'.roca.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    root.querySelector('.creationNotice').textContent='Arquivo preparado para download. Guarde-o para importar a montagem depois.';
    } catch {root.querySelector('.creationNotice').textContent='Não foi possível preparar o arquivo. Tente exportar novamente.';audio.sfx('deny');}
  }));
  $('creationFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try {if(file.size>250000)throw Error('Arquivo muito grande.');const result=importCreation(await file.text());creationNotice=result.persisted?'Criação importada! Clique em Usar para equipar.':'Importada nesta sessão; o navegador não permitiu salvar.';}
    catch(error){creationNotice='Não foi possível importar: '+error.message;}
    if(root.isConnected)buildGarage(mode);
  });
}

// ---------------------------------------------------------------- options / credits / pause
function buildOptions() {
  const o = profile.opts;
  $('options').innerHTML = `<h2 class="title">Opções</h2><div class="panel" style="width:min(520px,94vw)">
    <label class="optRow">🎵 Música <input type="range" min="0" max="1" step="0.05" id="oMusic" value="${o.music}"></label>
    <label class="optRow">🔊 Efeitos <input type="range" min="0" max="1" step="0.05" id="oSfx" value="${o.sfx}"></label>
    <label class="optRow">🚜 Acelerar sozinho <input type="checkbox" id="oGas" ${o.autoGas ? 'checked' : ''}></label>
    <label class="optRow">🧭 Direção assistida <input type="checkbox" id="oAssist" ${o.assist ? 'checked' : ''}></label>
    <label class="optRow">🖥️ Qualidade gráfica <select id="oQual"><option value="alta">${IS_TOUCH()?'Leve (celular)':'Alta'}</option><option value="baixa">${IS_TOUCH()?'Econômica':'Baixa'}</option></select></label>
    <div class="keys keysOnly"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> dirigir · 2 toques rápidos no mesmo lado e mantenha o segundo para drift · <kbd>E</kbd> item ·
      <kbd>Q</kbd> habilidade · <kbd>H</kbd> buzina · <kbd>C</kbd> câmera · <kbd>R</kbd> volta pra pista · <kbd>ESC</kbd> pausa</div>
    <p class="gestureHelp">📱 Drift: toque duas vezes rapidamente em ◀ ou ▶ e mantenha o segundo toque. Solte para liberar o turbo. As rampas fazem saltos normais, sem acrobacias. No celular, modelos leves e efeitos reduzidos são usados automaticamente.</p>
    <details class="itemHelp"><summary>Itens das caixas — como usar</summary><p>Use E no teclado ou ITEM no celular. Guarde para o momento certo. As chances variam conforme sua posição.</p><dl>${api.BOX_ITEMS.map(item=>`<dt>${item.icon} ${item.name}</dt><dd>${item.description}</dd>`).join('')}</dl></details>
    <div id="oSaveStatus" role="status">${storageFeedback()}</div>
    <div class="backRow"><button class="btn small cream" id="oBack">◀ Voltar</button><button class="btn small cream" id="oGuide">Como pilotar</button><button class="btn small" id="oReset" style="background:#C8372D">Apagar progresso</button></div>
  </div>`;
  $('oQual').value = o.quality;
  const apply = () => { save(); api.applyOptions();$('oSaveStatus').innerHTML=storageState.ok?'✓ Preferências salvas.':storageFeedback(); };
  $('oMusic').oninput = e => { o.music = +e.target.value; apply(); };
  $('oSfx').oninput = e => { o.sfx = +e.target.value; apply(); };
  $('oSfx').onchange=()=>audio.sfx('driftGood');
  $('oGas').onchange = e => { o.autoGas = e.target.checked; apply(); };
  $('oAssist').onchange = e => { o.assist = e.target.checked; apply(); };
  $('oQual').onchange = e => { o.quality = e.target.value; apply(); };
  click($('oBack'), () => ui.show(optionsReturn), 'back');
  click($('oGuide'),()=>ui.showDrivingGuide());
  let armed = false;
  click($('oReset'), () => {
    if (!armed) { armed = true; $('oReset').textContent = 'Tem certeza? Toque de novo'; return; }
    resetProfile(); buildOptions(); updateWallet(); audio.sfx('deny');
  });
}
function buildCredits() {
  $('credits').innerHTML = `<h2 class="title">Créditos</h2><div class="panel credits" style="width:min(560px,94vw)">
    <p style="font-family:'Lilita One';font-size:28px;color:var(--orange)">Roça Kart · Oficina da Roça</p>
    <p>Tatu, Pingo, Pipoca, Bento e Broto: máquinas inventadas na Oficina da Roça.</p>
    <p>Modelos 3D originais construídos com formas geométricas no Blender.</p>
    <p>Jogo em Three.js · música e efeitos sonoros sintetizados ao vivo (baião com zabumba, triângulo e sanfona).</p>
    <p>Monte sua máquina, escolha suas cores e dispute o campeonato da roça!</p>
    <div class="backRow"><button class="btn small cream" id="cBack">◀ Voltar</button></div></div>`;
  click($('cBack'), () => ui.show('menu'), 'back');
}
function buildPause() {
  $('pause').innerHTML = `<h2 class="title">Pausa</h2><div class="menuBtns" style="grid-template-columns:minmax(220px,300px)">
    <button class="btn orange" id="pResume">▶ Continuar</button>
    <button class="btn" id="pRestart">↻ Reiniciar corrida</button>
    <button class="btn cream" id="pOptions">⚙️ Opções</button>
    <button class="btn cream" id="pGuide">Como pilotar</button>
    <button class="btn cream" id="pQuit">🏠 Sair para o menu</button><p class="pauseHint">Sair encerra a corrida e a copa em andamento. Troféus já conquistados permanecem salvos.</p></div>`;
  click($('pResume'), () => api.togglePause(false));
  click($('pRestart'), () => { api.togglePause(false); api.restart(); });
  click($('pOptions'), () => { optionsReturn = 'pause'; buildOptions(); ui.show('options'); });
  click($('pGuide'),()=>ui.showDrivingGuide());
  click($('pQuit'), () => { api.togglePause(false); api.toMenu(); }, 'back');
}
