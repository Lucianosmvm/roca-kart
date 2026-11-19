// Procedural audio for Roça Kart: baião/forró-style music (zabumba, triângulo, sanfona),
// engine, SFX and horns. Everything is synthesized with WebAudio, no audio files.

const midi = n => 440 * Math.pow(2, (n - 69) / 12);

// ---------------------------------------------------------------- songs (16th-note grid, 16 steps per bar)
// melody notes: [bar, step, midi, lengthInSteps]
const MELODY_A = [
  [0, 0, 74, 2], [0, 2, 71, 2], [0, 4, 67, 2], [0, 6, 69, 2], [0, 8, 71, 4], [0, 12, 74, 4],
  [1, 0, 76, 2], [1, 2, 72, 2], [1, 4, 67, 2], [1, 6, 76, 2], [1, 8, 74, 2], [1, 10, 72, 2], [1, 12, 71, 4],
  [2, 0, 69, 2], [2, 2, 71, 2], [2, 4, 72, 2], [2, 6, 74, 2], [2, 8, 77, 4], [2, 12, 76, 2], [2, 14, 74, 2],
  [3, 0, 71, 4], [3, 4, 67, 2], [3, 6, 69, 2], [3, 8, 67, 8],
];
const MELODY_B = [
  [0, 0, 79, 3], [0, 3, 77, 1], [0, 4, 76, 2], [0, 6, 74, 2], [0, 8, 76, 2], [0, 10, 77, 2], [0, 12, 79, 4],
  [1, 0, 76, 3], [1, 3, 74, 1], [1, 4, 72, 2], [1, 6, 71, 2], [1, 8, 72, 4], [1, 12, 76, 4],
  [2, 0, 74, 2], [2, 2, 72, 2], [2, 4, 71, 2], [2, 6, 69, 2], [2, 8, 74, 2], [2, 10, 77, 2], [2, 12, 74, 4],
  [3, 0, 71, 2], [3, 2, 74, 2], [3, 4, 79, 4], [3, 8, 67, 6], [3, 14, 69, 2],
];
// chords per bar (root midi + intervals), G mixolydian flavour: G C D G / Em C F D
const CHORDS_A = [[55, [0, 4, 7]], [48, [0, 4, 7]], [50, [0, 4, 7]], [55, [0, 4, 7]]];
const CHORDS_B = [[52, [0, 3, 7]], [48, [0, 4, 7]], [53, [0, 4, 7]], [50, [0, 4, 7]]];

const SONGS = {
  menu: { bpm: 104, parts: ['A', 'B'], drums: 'soft', lead: 0.75 },
  race: { bpm: 140, parts: ['A', 'A', 'B', 'B'], drums: 'full', lead: 1 },
  garage: { bpm: 96, parts: ['B', 'A'], drums: 'soft', lead: 0.6 },
  podium: { bpm: 120, parts: ['A', 'B'], drums: 'full', lead: 1 },
};

export const audio = {
  ctx: null, master: null, musicBus: null, sfxBus: null, noise: null,
  vol: { music: 0.6, sfx: 0.8 },
  song: null, songName: null, step: 0, nextTime: 0, timer: null, tempoMul: 1,

  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    try {
      const ctx = this.ctx = new AudioContext();
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
      this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
      this.setVolumes(this.vol.music, this.vol.sfx);
      // white noise buffer
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
      // engine
      const o = ctx.createOscillator(), o2 = ctx.createOscillator();
      o.type = 'sawtooth'; o2.type = 'square';
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      const g = ctx.createGain(); g.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.4;
      o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(this.sfxBus);
      o.start(); o2.start();
      Object.assign(this, { eng: o, eng2: o2, engGain: g, engFilt: f });
      const drift=ctx.createOscillator(),driftGain=ctx.createGain();drift.type='triangle';driftGain.gain.value=0;
      drift.connect(driftGain).connect(this.sfxBus);drift.start();this.driftTone=drift;this.driftGain=driftGain;
      if (this.pendingSong) { this.play(this.pendingSong); this.pendingSong = null; }
    } catch (e) { console.warn('audio off', e); }
  },
  setVolumes(music, sfx) {
    this.vol = { music, sfx };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);this.duckUntil=0;
    this.musicBus.gain.setTargetAtTime(music * 0.55, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.05);
  },

  // ---------------------------------------------------------------- engine
  engine(speed, boost, on, driftCharge=0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, f = 38 + Math.abs(speed) * 3.2 + (boost ? 25 : 0);
    this.eng.frequency.setTargetAtTime(f, t, 0.05); this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    this.engFilt.frequency.setTargetAtTime(350 + Math.abs(speed) * 25, t, 0.1);
    this.engGain.gain.setTargetAtTime(on ? 0.045 : 0, t, 0.2);
    const charge=Math.max(0,Math.min(1,driftCharge/2.1));
    this.driftTone?.frequency.setTargetAtTime(140+charge*260,t,.08);
    this.driftGain?.gain.setTargetAtTime(on && driftCharge > 0 ? .012 + charge*.012 : 0,t,.08);
  },

  // ---------------------------------------------------------------- music
  play(name) {
    if (!this.ctx) { this.pendingSong = name; return; }
    if (this.songName === name) return;
    this.stopMusic();
    this.song = SONGS[name]; this.songName = name; this.step = 0; this.tempoMul = 1;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stopMusic() { clearInterval(this.timer); this.timer = null; this.songName = null; },
  setTempo(mul) { this.tempoMul = mul; },
  schedule() {
    const ctx = this.ctx, s = this.song;
    if (!s) return;
    const stepDur = 60 / (s.bpm * this.tempoMul) / 4;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur; this.step++;
    }
  },
  playStep(step, t, sd) {
    const s = this.song, barTotal = s.parts.length * 4;
    const bar = Math.floor(step / 16) % barTotal, st = step % 16;
    const part = s.parts[Math.floor(bar / 4)], pb = bar % 4;
    const chords = part === 'A' ? CHORDS_A : CHORDS_B, mel = part === 'A' ? MELODY_A : MELODY_B;
    const [root, ivs] = chords[pb];
    // zabumba (baião pattern), bacalhau and triângulo
    if (s.drums === 'full') {
      if (st === 0 || st === 6 || st === 8) this.kick(t, st === 0 ? 1 : 0.7);
      if (st === 4 || st === 12) this.snap(t);
    } else if (st === 0 || st === 8) this.kick(t, 0.5);
    this.triangle(t, st % 4 === 2 ? 'open' : 'closed', s.drums === 'full' ? 1 : 0.6);
    // bass: root / fifth
    if (st === 0) this.bass(t, midi(root - 12), sd * 5);
    if (st === 6) this.bass(t, midi(root - 5), sd * 2);
    if (st === 8) this.bass(t, midi(root - 12), sd * 3);
    if (st === 12) this.bass(t, midi(root), sd * 3);
    // sanfona chord stabs on the off-beats
    if (st === 4 || st === 10 || st === 14) for (const iv of ivs) this.accordion(t, midi(root + 12 + iv), sd * 1.6, 0.045);
    // lead melody
    for (const [b, ns, n, len] of mel) if (b === pb && ns === st) this.accordion(t, midi(n), sd * len * 0.92, 0.11 * s.lead, true);
  },

  // ---------------------------------------------------------------- instruments
  env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },
  kick(t, v = 1) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    this.env(g, t, 0.003, 0.9 * v, 0.22);
    o.connect(g).connect(this.musicBus); o.start(t); o.stop(t + 0.25);
  },
  snap(t) {
    const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
    this.env(g, t, 0.002, 0.35, 0.09);
    n.connect(f).connect(g).connect(this.musicBus); n.start(t, Math.random() * 0.5); n.stop(t + 0.1);
  },
  triangle(t, kind, v = 1) {
    const c = this.ctx, g = c.createGain(), dur = kind === 'open' ? 0.32 : 0.05;
    for (const [f, a] of [[2637, 0.06], [3951, 0.03], [6271, 0.015]]) {
      const o = c.createOscillator(), og = c.createGain(); o.frequency.value = f; og.gain.value = a;
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.02);
    }
    this.env(g, t, 0.001, v, dur);
    g.connect(this.musicBus);
  },
  bass(t, f, dur) {
    const c = this.ctx, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 600;
    this.env(g, t, 0.01, 0.5, dur);
    o.connect(lp).connect(g).connect(this.musicBus); o.start(t); o.stop(t + dur + 0.05);
  },
  accordion(t, f, dur, v, lead = false) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = lead ? 3200 : 1800; lp.Q.value = 1.5;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = lead ? 9 : 4;
    lfo.connect(lg);
    for (const [type, det, mul, a] of [['sawtooth', -7, 1, 0.5], ['sawtooth', 7, 1, 0.5], ['square', 0, 2, 0.18]]) {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.value = f * mul; o.detune.value = det; lg.connect(o.detune);
      og.gain.value = a; o.connect(og).connect(lp); o.start(t); o.stop(t + dur + 0.1);
    }
    lfo.start(t); lfo.stop(t + dur + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.025);
    g.gain.setValueAtTime(v, t + Math.max(0.03, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    lp.connect(g).connect(this.musicBus);
  },

  // ---------------------------------------------------------------- sfx
  duckMusic(duration=.5) {
    if(!this.ctx || !this.musicBus) return;
    const t=this.ctx.currentTime,base=this.vol.music*.55;
    this.duckUntil=Math.max(this.duckUntil??0,t+duration);
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(base*.55,t,.025);
    this.musicBus.gain.setTargetAtTime(base,this.duckUntil,.12);
  },
  tone(f, dur = 0.15, type = 'square', vol = 0.15, at = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  },
  sweep(f0, f1, dur, vol = 0.12, type = 'triangle', at = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseBurst(dur, f0, f1, vol = 0.2, type = 'bandpass', at = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    n.buffer = this.noise; n.loop = true; f.type = type; f.Q.value = 0.9;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.01, vol, dur);
    n.connect(f).connect(g).connect(this.sfxBus); n.start(t); n.stop(t + dur + 0.05);
  },
  sfx(name) {
    if (!this.ctx) return;
    if(['charged','driftGood','driftPerfect','finish','hit','go','fanfare'].includes(name)) this.duckMusic(name==='fanfare'?1.1:.45);
    switch (name) {
      case 'driftGood': this.tone(784,.09,'sine',.12);this.tone(1046,.14,'triangle',.09,.08);break;
      case 'driftPerfect': [1046,1318,1568].forEach((f,i)=>this.tone(f,.12,'triangle',.11,i*.065));break;
      case 'finish': [784,1046,1568].forEach((f,i)=>this.tone(f,.16,'triangle',.13,i*.12));break;
      case 'click': this.tone(660, 0.06, 'triangle', 0.12); this.tone(990, 0.06, 'triangle', 0.08, 0.04); break;
      case 'hover': this.tone(880, 0.03, 'sine', 0.05); break;
      case 'back': this.tone(520, 0.07, 'triangle', 0.12); this.tone(390, 0.08, 'triangle', 0.1, 0.05); break;
      case 'buy': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.12, 'square', 0.08, i * 0.07)); break;
      case 'deny': this.tone(180, 0.18, 'sawtooth', 0.12); this.tone(140, 0.2, 'sawtooth', 0.12, 0.12); break;
      case 'coin': this.tone(1318, 0.06, 'square', 0.08); this.tone(1976, 0.18, 'square', 0.08, 0.06); break;
      case 'itembox': this.sweep(600, 1400, 0.18, 0.1, 'square'); break;
      case 'itemget': this.tone(1320, 0.1, 'square', 0.1); this.tone(1760, 0.14, 'square', 0.1, 0.08); break;
      case 'boost': this.noiseBurst(0.6, 400, 3000, 0.25); this.sweep(200, 900, 0.5, 0.08, 'sawtooth'); break;
      case 'miniturbo': this.noiseBurst(0.35, 800, 2500, 0.18); break;
      case 'hit': this.sweep(500, 90, 0.5, 0.18); this.noiseBurst(0.25, 2000, 300, 0.3, 'lowpass'); break;
      case 'bump': this.noiseBurst(0.12, 400, 120, 0.18, 'lowpass'); this.tone(90, 0.12, 'sawtooth', 0.1); break;
      case 'jump': this.sweep(250, 700, 0.25, 0.14, 'square'); break;
      case 'land': this.noiseBurst(0.18, 600, 100, 0.2, 'lowpass'); this.tone(70, 0.15, 'sine', 0.18); break;
      case 'splash': this.noiseBurst(0.5, 3000, 600, 0.22, 'highpass'); break;
      case 'plant': [523, 659, 784].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.12, i * 0.06)); this.noiseBurst(0.2, 300, 150, 0.2, 'lowpass'); break;
      case 'sneeze': this.sweep(900, 300, 0.12, 0.12, 'sawtooth'); this.noiseBurst(0.3, 3000, 800, 0.3, 'bandpass', 0.15); break;
      case 'thunder': this.noiseBurst(1.2, 1200, 60, 0.5, 'lowpass'); this.tone(55, 0.9, 'sawtooth', 0.2); break;
      case 'count': this.tone(523, 0.18, 'square', 0.14); break;
      case 'go': this.tone(1046, 0.45, 'square', 0.16); break;
      case 'lap': this.tone(660, 0.1, 'square', 0.12); this.tone(880, 0.2, 'square', 0.12, 0.12); break;
      case 'finalLap': [659, 784, 988, 1318].forEach((f, i) => this.tone(f, 0.14, 'square', 0.12, i * 0.1)); break;
      case 'fanfare': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, i === 5 ? 0.6 : 0.16, 'square', 0.12, i * 0.13)); this.cheer(); break;
      case 'ability': this.sweep(300, 1200, 0.3, 0.12, 'square'); this.tone(1568, 0.2, 'triangle', 0.1, 0.25); break;
      case 'charged': this.tone(784, 0.08, 'triangle', 0.12); this.tone(1175, 0.15, 'triangle', 0.12, 0.09); break;
      case 'moo': this.horn('vaca'); break;
      case 'whoosh': this.noiseBurst(0.5, 300, 2400, 0.12); break;
    }
  },
  cheer() {
    for (let i = 0; i < 6; i++) this.noiseBurst(0.6 + Math.random() * 0.4, 900 + Math.random() * 600, 1500 + Math.random() * 800, 0.06, 'bandpass', i * 0.12);
  },
  horn(kind) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    if (kind === 'classica') { this.tone(440, 0.45, 'square', 0.1); this.tone(554, 0.45, 'square', 0.1); }
    else if (kind === 'vaca') {
      const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(115, t + 0.9);
      bp.type = 'bandpass'; bp.frequency.setValueAtTime(450, t); bp.frequency.linearRampToValueAtTime(700, t + 0.3); bp.frequency.linearRampToValueAtTime(380, t + 0.9);
      lfo.frequency.value = 6; lg.gain.value = 4; lfo.connect(lg).connect(o.frequency);
      this.env(g, t, 0.08, 0.35, 1.0);
      o.connect(bp).connect(g).connect(this.sfxBus); o.start(t); lfo.start(t); o.stop(t + 1.05); lfo.stop(t + 1.05);
    } else if (kind === 'galo') {
      [[700, 900, 0.12], [900, 1100, 0.12], [1100, 1300, 0.18], [1300, 900, 0.5]].reduce((at, [a, b, d]) => {
        this.sweep(a, b, d, 0.1, 'sawtooth', at); return at + d * 0.9;
      }, 0);
    } else if (kind === 'trompete') {
      [523, 659, 784, 659, 1046].forEach((f, i) => this.tone(f, i === 4 ? 0.5 : 0.12, 'sawtooth', 0.08, i * 0.12));
    }
  },
};
