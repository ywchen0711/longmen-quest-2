// Music: one reused <audio> element (iOS-friendly), AAC where the browser can play it, Ogg otherwise.
// Jingles use a second reused element. Sound effects are tiny square/noise blips synthesised with Web Audio.
export class Audio {
  constructor() {
    const a = document.createElement('audio');
    const aac = !!a.canPlayType && a.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '';
    const ogg = !!a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') !== '';
    this.ext = aac || !ogg ? 'm4a' : 'ogg';
    this.music = a; a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline', '');
    this.jingleEl = document.createElement('audio'); this.jingleEl.setAttribute('playsinline', '');
    this.cur = null; this.unlocked = false; this.vol = { music: 0.7, sfx: 0.7 }; this.muted = false;
    try { const s = JSON.parse(localStorage.getItem('lq2_vol') || 'null'); if (s) Object.assign(this.vol, s); } catch (e) {}
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { this.ctx = new AC(); this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination); } } catch (e) { this.ctx = null; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    const unlock = () => this.unlock();
    for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); else this.resume(); });
    window.addEventListener('pageshow', () => this.resume());
    this.applyVol();
  }
  applyVol() {
    for (const k of ['music', 'sfx']) { const v = +this.vol[k]; this.vol[k] = isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7; }
    this.music.volume = this.vol.music; this.jingleEl.volume = this.vol.music; if (this.out) this.out.gain.value = this.vol.sfx * 0.35; try { localStorage.setItem('lq2_vol', JSON.stringify(this.vol)); } catch (e) {} }
  unlock() {
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (this.unlocked) return; this.unlocked = true;
    if (this.ctx) { try { const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); } catch (e) {} }
    // start (or prime) both elements inside the gesture so iOS lets them play later
    const want = this.cur; this.cur = null;
    if (want) this.play(want); else { this.music.src = 'audio/title.' + this.ext; this.music.play().then(() => { if (!this.cur) this.music.pause(); }).catch(() => {}); }
    this.jingleEl.src = 'audio/j_save.' + this.ext; this.jingleEl.muted = true; this.jingleEl.play().then(() => { this.jingleEl.pause(); this.jingleEl.muted = false; }).catch(() => { this.jingleEl.muted = false; });
  }
  play(name) {
    if (this.cur === name) { if (this.unlocked && this.music.paused && !this.inJingle) this.music.play().catch(() => {}); return; }
    this.cur = name; if (!this.unlocked) return;
    this.music.src = 'audio/' + name + '.' + this.ext; this.music.loop = name !== 'ending'; this.music.currentTime = 0;
    if (!this.inJingle) this.music.play().catch(() => {});
  }
  stop() { this.cur = null; this.music.pause(); }
  // a jingle pauses the music, then the music resumes from where it was
  jingle(name) {
    return new Promise((res) => {
      if (!this.unlocked || this.fast) return res();
      this.inJingle = true; this.music.pause();
      const j = this.jingleEl; let done = false;
      const end = () => { if (done) return; done = true; this.inJingle = false; j.onended = null; if (this.cur && !document.hidden) this.music.play().catch(() => {}); res(); };
      j.src = 'audio/' + name + '.' + this.ext; j.onended = end; j.play().catch(end);
      setTimeout(end, 7000);
    });
  }
  pause() { this.music.pause(); if (this.ctx) this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.unlocked) this.ctx.resume().catch(() => {}); if (this.unlocked && this.cur && !this.inJingle) this.music.play().catch(() => {}); }

  // ---------------------------------------------------------------- 8-bit sound effects
  tone(type, f0, f1, dur, vol = 1, delay = 0) {
    if (!this.ctx || !this.unlocked || this.fast) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    if (type === 'pulse') { o.setPeriodicWave(this.pulseWave || (this.pulseWave = this.makePulse(0.25))); } else o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  }
  makePulse(duty) { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * 2; return this.ctx.createPeriodicWave(re, im); }
  noise(dur, vol = 1, delay = 0, hp = 800) {
    if (!this.ctx || !this.unlocked || this.fast) return;
    const t = this.ctx.currentTime + delay, len = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
    let v = 0; for (let i = 0; i < len; i++) { if (i % 6 === 0) v = Math.random() * 2 - 1; d[i] = v; }
    const s = this.ctx.createBufferSource(); s.buffer = b; const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t);
  }
  sfx(name) {
    switch (name) {
      case 'cursor': this.tone('pulse', 1200, 1200, 0.03, 0.5); break;
      case 'ok': this.tone('pulse', 880, 880, 0.04, 0.6); this.tone('pulse', 1320, 1320, 0.05, 0.6, 0.04); break;
      case 'cancel': this.tone('pulse', 660, 440, 0.06, 0.5); break;
      case 'bump': this.tone('triangle', 120, 80, 0.06, 0.8); break;
      case 'talk': this.tone('pulse', 1500, 1500, 0.015, 0.25); break;
      case 'stairs': for (let i = 0; i < 4; i++) this.tone('pulse', 600 - i * 80, 600 - i * 80, 0.05, 0.5, i * 0.06); break;
      case 'door': this.noise(0.12, 0.6, 0, 300); this.tone('triangle', 200, 100, 0.12, 0.6); break;
      case 'chest': this.tone('pulse', 523, 523, 0.06, 0.5); this.tone('pulse', 659, 659, 0.06, 0.5, 0.06); this.tone('pulse', 784, 784, 0.1, 0.5, 0.12); break;
      case 'encounter': for (let i = 0; i < 6; i++) this.tone('pulse', 300 + i * 120, 300 + i * 120, 0.04, 0.6, i * 0.035); break;
      case 'hit': this.noise(0.1, 1, 0, 700); this.tone('square', 180, 50, 0.12, 0.5); this.tone('triangle', 95, 40, 0.15, 0.9); break;
      case 'crit': this.noise(0.25, 1, 0, 500); this.tone('square', 900, 80, 0.22, 0.45); this.tone('pulse', 1760, 1760, 0.16, 0.35, 0.02); this.tone('pulse', 2637, 2637, 0.2, 0.3, 0.07); this.tone('triangle', 90, 35, 0.25, 1); break;
      // battle effects (each paired with a picture in battle.js)
      case 'slash': this.noise(0.08, 0.7, 0, 2600); this.tone('pulse', 1500, 320, 0.08, 0.28); break;
      case 'slash2': this.noise(0.09, 0.8, 0, 2200); this.tone('pulse', 1700, 300, 0.09, 0.3); this.noise(0.09, 0.8, 0.1, 2200); this.tone('pulse', 1900, 320, 0.09, 0.3, 0.1); break;
      case 'whiff': this.noise(0.07, 0.45, 0, 3800); this.tone('triangle', 500, 1100, 0.07, 0.25); break;
      case 'tink': this.tone('pulse', 2000, 2000, 0.04, 0.4); this.tone('pulse', 2700, 2700, 0.06, 0.3, 0.03); break;
      case 'claw': for (let i = 0; i < 3; i++) { this.noise(0.05, 0.8, i * 0.05, 1800); this.tone('square', 520, 180, 0.045, 0.3, i * 0.05); } break;
      case 'bite': this.tone('square', 320, 90, 0.05, 0.5); this.noise(0.06, 1, 0.07, 500); this.tone('triangle', 130, 45, 0.12, 1, 0.07); break;
      case 'blunt': this.noise(0.16, 1, 0, 150); this.tone('triangle', 150, 40, 0.18, 1); this.tone('square', 90, 40, 0.1, 0.3); break;
      case 'sting': for (let i = 0; i < 3; i++) this.tone('pulse', 1800, 2600, 0.03, 0.35, i * 0.07); break;
      case 'arrow': this.noise(0.12, 0.5, 0, 3200); this.tone('pulse', 2200, 700, 0.12, 0.2); this.tone('triangle', 200, 80, 0.06, 0.8, 0.15); break;
      case 'charge': for (let i = 0; i < 6; i++) this.tone('pulse', 300 + i * 130, 360 + i * 130, 0.04, 0.32, i * 0.035); break;
      case 'release': this.noise(0.25, 0.9, 0, 500); this.tone('square', 640, 60, 0.28, 0.4); break;
      case 'beam': for (let i = 0; i < 8; i++) this.tone('pulse', i & 1 ? 1568 : 1175, i & 1 ? 1568 : 1175, 0.04, 0.3, i * 0.04); this.noise(0.4, 0.6, 0, 1500); break;
      case 'boom': this.noise(0.35, 1, 0, 100); this.tone('triangle', 110, 30, 0.35, 1); break;
      case 'magic': for (let i = 0; i < 4; i++) this.tone('pulse', 1500 - i * 220, 1800 - i * 220, 0.04, 0.3, i * 0.03); this.tone('triangle', 400, 900, 0.16, 0.5, 0.1); break;
      case 'thunder': this.noise(0.08, 1, 0, 3000); this.noise(0.45, 1, 0.03, 80); this.tone('square', 80, 30, 0.3, 0.4); break;
      case 'breath': this.noise(0.5, 0.8, 0, 300); this.tone('square', 220, 70, 0.5, 0.25); break;
      case 'bubble': for (let i = 0; i < 4; i++) this.tone('triangle', 350 + i * 90, 800 + i * 90, 0.04, 0.45, i * 0.06); break;
      case 'chime': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.5, i * 0.06)); break;
      case 'shield': for (let i = 0; i < 6; i++) this.tone('pulse', i & 1 ? 1320 : 880, i & 1 ? 1320 : 880, 0.04, 0.3, i * 0.045); this.tone('triangle', 220, 220, 0.3, 0.6); break;
      case 'point': this.tone('pulse', 2400, 2400, 0.025, 0.4); this.noise(0.02, 0.4, 0, 4000); break;
      case 'sealfx': this.tone('pulse', 900, 300, 0.25, 0.32); this.tone('pulse', 600, 200, 0.25, 0.28, 0.06); this.tone('triangle', 120, 60, 0.3, 0.7, 0.2); break;
      case 'zz': this.tone('triangle', 330, 220, 0.15, 0.45); this.tone('triangle', 260, 170, 0.18, 0.4, 0.2); break;
      case 'vanish': for (let i = 0; i < 6; i++) this.tone('pulse', 1300 - i * 160, 1300 - i * 160, 0.03, 0.3, i * 0.035); break;
      case 'hurt': this.noise(0.2, 1, 0, 200); this.tone('triangle', 160, 50, 0.2, 0.9); break;
      case 'dash': this.noise(0.05, 0.45, 0, 1400); this.noise(0.05, 0.4, 0.06, 1400); this.tone('triangle', 260, 520, 0.08, 0.25, 0.02); break;
      case 'block': this.noise(0.07, 0.8, 0, 2200); this.tone('pulse', 2350, 2350, 0.05, 0.4); this.tone('square', 620, 210, 0.09, 0.3, 0.02); break;
      case 'fall': this.noise(0.2, 0.9, 0, 120); this.tone('triangle', 120, 40, 0.22, 0.9); break;
      case 'miss': this.tone('pulse', 400, 900, 0.08, 0.4); break;
      case 'skill': for (let i = 0; i < 5; i++) this.tone('pulse', 700 + i * 200, 900 + i * 200, 0.05, 0.4, i * 0.04); break;
      case 'heal': for (let i = 0; i < 6; i++) this.tone('pulse', 600 + i * 150, 600 + i * 150, 0.05, 0.35, i * 0.05); break;
      case 'fire': this.noise(0.4, 0.8, 0, 400); this.tone('square', 300, 100, 0.4, 0.3); break;
      case 'run': for (let i = 0; i < 4; i++) this.tone('pulse', 800 - i * 150, 800 - i * 150, 0.04, 0.4, i * 0.04); break;
      case 'die': this.tone('square', 300, 40, 0.5, 0.5); this.noise(0.5, 0.6, 0, 200); break;
      case 'poison': this.tone('triangle', 200, 140, 0.08, 0.6); break;
      case 'drop': [988, 1319, 1976].forEach((f, i) => this.tone('pulse', f, f, 0.07, 0.4, i * 0.05)); this.tone('triangle', 2637, 2637, 0.14, 0.3, 0.15); break;   // a little paper tag pops up
      case 'buy': this.tone('pulse', 1046, 1046, 0.05, 0.5); this.tone('pulse', 1568, 1568, 0.08, 0.5, 0.05); break;
    }
  }
}
