// Front-view party battles in 8-bit style, on a pop-up spread: up to four of the party against a group of foes.
// Each round every member picks a command, then everyone acts in order of agility (with a little luck).
// Everything a foe does goes through the same rules as the party (rules.js).
// The stage (240x135, stored at 3x) is cut-out paper scenery; the foes are die-cut cards standing on the page in a
// row, and the party stands in the foreground as cards seen from behind (people) or as their field sprites
// (monsters). Every exchange shows who strikes and who is struck: the attacker winds up and lunges, the blow lands
// on the target's card (boxed by blinking corner marks), which flashes, recoils on its hinge and sheds paper scraps,
// and the number pops up on a paper tag over the card that was hit - cream for a foe, red for one of the party.
// Effects come from pools filled once per battle, so the 60 fps loop allocates nothing.
import { ENEMIES, SKILLS, ITEMS, ART_OF, SPECIES, CHARS } from './data.js?v=3';
import { ENEMY_ART } from './enemy_art.js?v=3';
import { CAST, PEOPLE, PEOPLE_IMAGE } from './people_art.js?v=3';
import * as R from './rules.js?v=3';
import { t, STR, getLang } from './ui.js?v=3';
import { hex, NES } from './tiles.js?v=3';
import { dieCut, grainCanvas } from './paper.js?v=3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const imgs = {};
function img(src) { if (!imgs[src]) { imgs[src] = new Image(); imgs[src].src = src; } return imgs[src]; }
export const ENEMY_IMG = 'assets/enemies.png?v=3';
export function preloadBattleArt() { img(ENEMY_IMG); img(PEOPLE_IMAGE); for (const c of Object.values(CAST)) { img(c.portrait); img(c.sheet); } }

const SCENES = {   // backdrop strip colours (NES indexes): sky, far, near
  grass: [0x21, 0x1A, 0x0A], forest: [0x0A, 0x0B, 0x1A], hill: [0x21, 0x19, 0x09], sand: [0x31, 0x27, 0x17], swamp: [0x0C, 0x0B, 0x04],
  snow: [0x31, 0x30, 0x10], cave: [0x0D, 0x00, 0x2D], tower: [0x07, 0x16, 0x28], tomb: [0x08, 0x18, 0x07], lair: [0x03, 0x04, 0x13],
  sea: [0x02, 0x12, 0x11], fort: [0x2D, 0x07, 0x17], town: [0x21, 0x1A, 0x0A], ice: [0x11, 0x21, 0x31], bamboo: [0x2A, 0x1A, 0x0B],
  volcano: [0x06, 0x16, 0x07], mansion: [0x03, 0x13, 0x04], temple: [0x27, 0x17, 0x07], bell: [0x04, 0x14, 0x03], arena: [0x21, 0x27, 0x17],
};
const PI = Math.PI, TAU = PI * 2;
const COLS = NES.map((_, i) => hex(i));
const R3 = (v) => Math.round(v * 3) / 3;
const easeOut = (q) => 1 - (1 - q) * (1 - q);
const SW = 240, SH = 135;
const ARC_PAL = { cut: [0x30, 0x31, 0x21, 0x11], crit: [0x30, 0x38, 0x28, 0x27], whiff: [0x10, 0x00, 0x2D, 0x2D] };
const QI = [0x21, 0x31, 0x30], QI2 = [0x11, 0x21, 0x31, 0x30], FIRE = [0x16, 0x27, 0x38], FIRE2 = [0x06, 0x16, 0x28], MIST = [0x14, 0x24, 0x29], INK = [0x0F, 0x00, 0x10, 0x2D];
const SPARK = [0x30, 0x38, 0x31, 0x28], CRITSPARK = [0x30, 0x28, 0x27, 0x16, 0x38], BOOM = [0x30, 0x38, 0x28, 0x27, 0x16, 0x06];
const GREEN = [0x2A, 0x39, 0x30, 0x1A], BLUE = [0x21, 0x31, 0x30, 0x11], GOLD = [0x28, 0x38, 0x30, 0x27], PURPLE = [0x24, 0x34, 0x14, 0x30], PINK = [0x25, 0x35, 0x16, 0x30];
const GREYS = [0x10, 0x00, 0x2D], DUST = [0x17, 0x27, 0x10, 0x00], BALL = [0x30, 0x27, 0x16];
const SCRAPS = [0x30, 0x37, 0x3D, 0x30], HURT = [0x16, 0x30, 0x06, 0x27];
const WSL = [0x2D, 0x16, 0x30], WHIFF = [0x2D, 0x00, 0x3D];
const BLADE_TRAIL = [0x30, 0x31, 0x21, 0x11];
const ABC = 'ABCD';

// ---------------------------------------------------------------- crisp text sprites (Cubic 11 at its native 12px)
const TXT = new Map(); let mctx = null;
function txt(s, c) {
  const key = s + '/' + c; let cv = TXT.get(key); if (cv) return cv;
  if (!mctx) { mctx = document.createElement('canvas').getContext('2d'); mctx.font = '12px Cubic11, monospace'; }
  const W = Math.ceil(mctx.measureText(s).width) + 4, H = 16;
  cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.font = '12px Cubic11, monospace'; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(s, 2, 2);
  try {
    const id = g.getImageData(0, 0, W, H), d = id.data, on = new Uint8Array(W * H), n = NES[c], r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255;
    for (let i = 0; i < W * H; i++) on[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, o = i * 4;
      if (on[i]) { d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; continue; }
      let edge = 0;
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && on[Y * W + X]) { edge = 1; break; } }
      d[o] = d[o + 1] = d[o + 2] = 0; d[o + 3] = edge ? 255 : 0;
    }
    g.putImageData(id, 0, 0);
  } catch (e) {}
  TXT.set(key, cv); return cv;
}
const INKS = new Map();
function ink(s, col) {
  const key = s + '/' + col; let cv = INKS.get(key); if (cv) return cv;
  if (!mctx) { mctx = document.createElement('canvas').getContext('2d'); mctx.font = '12px Cubic11, monospace'; }
  const W = Math.ceil(mctx.measureText(s).width) + 2, H = 14;
  cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.font = '12px Cubic11, monospace'; g.textBaseline = 'top'; g.fillStyle = col; g.fillText(s, 1, 1);
  try { const id = g.getImageData(0, 0, W, H), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0; g.putImageData(id, 0, 0); } catch (e) {}
  INKS.set(key, cv); return cv;
}
const INKOF = { 0x30: '#2b2118', 0x28: '#b5361f', 0x27: '#c8401c', 0x2A: '#2f7a2a', 0x10: '#6e604c', 0x00: '#6e604c', 0x21: '#1f5aa8', 0x24: '#6a3a9a', 0x25: '#a03a70' };
const mixc = (a, b, f) => { const A = NES[a], r = (A >> 16 & 255) * (1 - f) + (b >> 16 & 255) * f, g = (A >> 8 & 255) * (1 - f) + (b >> 8 & 255) * f, bl = (A & 255) * (1 - f) + (b & 255) * f; return `rgb(${r | 0},${g | 0},${bl | 0})`; };
let GRAIN = null;
const FLOOR = 56;   // where the page's floor card begins (the foes stand on it)
function scenery(scene) {
  const c = document.createElement('canvas'); c.width = SW * 3; c.height = SH * 3; const g = c.getContext('2d'); g.setTransform(3, 0, 0, 3, 0, 0);
  const PAP = 0xf3e8cf;
  g.fillStyle = mixc(scene[0], PAP, 0.42); g.fillRect(0, 0, SW, FLOOR + 10);
  const ridge = (y0, a1, f1, a2, f2, ph, col, shadow) => {
    const path = () => { g.beginPath(); g.moveTo(0, FLOOR + 12); for (let x = 0; x <= SW; x += 2) g.lineTo(x, y0 + Math.round(Math.sin(x * f1 + ph) * a1 + Math.sin(x * f2 + ph * 2) * a2)); g.lineTo(SW, FLOOR + 12); g.closePath(); };
    g.save(); g.translate(1.5, 1.5); g.fillStyle = shadow; path(); g.fill(); g.restore();
    g.fillStyle = '#fffaf0'; g.save(); g.translate(0, -1); path(); g.fill(); g.restore();
    g.fillStyle = col; path(); g.fill();
  };
  ridge(30, 6, 0.05, 2, 0.17, 0.3, mixc(scene[1], PAP, 0.3), 'rgba(40,25,10,0.25)');
  ridge(42, 3, 0.09, 2, 0.21, 1.7, mixc(scene[2], PAP, 0.22), 'rgba(40,25,10,0.3)');
  g.fillStyle = 'rgba(40,25,10,0.35)'; g.fillRect(0, FLOOR - 1, SW, 2);
  g.fillStyle = mixc(scene[2], 0x2a2018, 0.62); g.fillRect(0, FLOOR, SW, SH - FLOOR);
  g.fillStyle = '#fffaf0'; g.fillRect(0, FLOOR - 1, SW, 1);
  try {
    if (!GRAIN) GRAIN = grainCanvas(128, 31);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55;
    for (let y = 0; y < SH * 3; y += 128) for (let x = 0; x < SW * 3; x += 128) g.drawImage(GRAIN, x, y);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  } catch (e) {}
  return c;
}

// the picture of a party member's card: people from behind (奕叡 as dressed by the paper doll), monsters by their
// field sprite. Returns two walk frames as canvases.
function memberFrames(G, m) {
  const out = [];
  const cut = (src, f, w = 16, h = 24, bh = 24) => { const a = document.createElement('canvas'); a.width = w; a.height = bh; a.getContext('2d').drawImage(src, f.x, f.y, f.w, f.h, Math.floor((w - f.w) / 2), bh - f.h, f.w, f.h); return a; };
  if (m.kind === 'mon') {
    const a = ENEMY_ART[ART_OF(m.who)] || ENEMY_ART.e_greywolf, f = a.f, src = img(ENEMY_IMG);
    if (f && src.complete && src.naturalWidth) { for (let i = 0; i < 2; i++) out.push(cut(src, { x: f[0] + i * f[2], y: f[1], w: f[2], h: f[3] }, 16, f[3], f[3])); }
    return out;
  }
  if (m.who === 'yirui' && G.dollSheet) { for (let i = 0; i < 2; i++) out.push(cut(G.dollSheet, { x: i * 16, y: 48, w: 16, h: 24 })); return out; }
  if (m.who === 'yishuo' && PEOPLE.yishuo_back) { const s = img(PEOPLE_IMAGE); if (s.complete && s.naturalWidth) for (const f of PEOPLE.yishuo_back) out.push(cut(s, f)); return out; }
  const back = PEOPLE[m.who + '_back'];
  if (back) { const s = img(PEOPLE_IMAGE); if (s.complete && s.naturalWidth) for (const f of back) out.push(cut(s, f)); return out; }
  const C = CAST[m.who]; if (!C) return out;
  const s = img(C.sheet); if (!s.complete || !s.naturalWidth) return out;
  const row = C.rows.walk_up ?? C.rows.walk ?? 0;
  for (let i = 0; i < 2; i++) out.push(cut(s, { x: i * C.fw, y: row * C.fh, w: C.fw, h: C.fh }));
  return out;
}

// ======================================================================================================== battle
// foeIds: the formation (enemy ids, in order on the page). opts: scene, music, final, noRun, recruit (false: none)
export async function battle(G, foeIds, opts = {}) {
  const ui = G.ui, au = G.audio, inv = G.inv, fast = G.fast, L = getLang();
  const wait = (ms) => (fast ? Promise.resolve() : sleep(ms));
  G.stats.seen = G.stats.seen || {};
  // ---------------------------------------------------------------- the fighters
  const count = {}; for (const id of foeIds) count[id] = (count[id] || 0) + 1;
  const seenN = {};
  const foes = foeIds.map((id, i) => {
    const E = ENEMIES[id]; G.stats.seen[id] = 1;
    const k = (seenN[id] = (seenN[id] || 0) + 1);
    const nm = [E.zh + (count[id] > 1 ? ABC[k - 1] : ''), E.en + (count[id] > 1 ? ' ' + ABC[k - 1] : '')];
    return { side: 'foe', id, E, i, nm, name: t(nm), hp: E.hp, maxHp: E.hp, mp: E.mp ?? 0, items: E.items || 0, atk: E.atk, def: E.def, agi: E.agi, res: E.res || 0,
      sleep: 0, sealed: false, guard: 1, fled: false, heart: 0, eating: 0, gone: false, g: null };
  });
  const party = G.party.slice(0, 4);
  const allies = party.map((m, i) => ({ side: 'ally', m, i, name: R.nameOf(m, L), sleep: 0, sealed: false, guard: 1, defend: false, cover: null, roar: false, faint: false, cheer: 1, g: null }));
  const isBoss = foes.some((f) => f.E.boss), finalFight = !!opts.final;
  const uAlive = (u) => (u.side === 'foe' ? u.hp > 0 && !u.fled : u.m.hp > 0);
  const liveFoes = () => foes.filter(uAlive), liveAllies = () => allies.filter(uAlive);
  const hpOf = (u) => (u.side === 'foe' ? u.hp : u.m.hp);
  const maxHpOf = (u) => (u.side === 'foe' ? u.maxHp : R.stat(u.m).maxHp);
  const atkOf = (u) => (u.side === 'foe' ? u.atk : Math.round(R.atkOf(u.m) * u.cheer));
  const defOf = (u) => (u.side === 'foe' ? u.def : R.defOf(u.m)) * u.guard * (u.defend ? 2 : 1);
  const agiOf = (u) => (u.side === 'foe' ? u.agi : R.stat(u.m).agi);
  const resOf = (u, k) => (u.side === 'foe' ? u.res : R.resist(u.m, k));

  // ---------------------------------------------------------------- the screen
  const root = document.getElementById('battle'); root.innerHTML = ''; root.classList.remove('hidden');
  const el = (tag, cls, p = root) => { const e = document.createElement(tag); e.className = cls; p.appendChild(e); return e; };
  const stage = el('div', 'win bstage'); const cv = el('canvas', 'bcanvas', stage); cv.width = SW * 3; cv.height = SH * 3; const cx = cv.getContext('2d'); cx.setTransform(3, 0, 0, 3, 0, 0); cx.imageSmoothingEnabled = false;
  const strip = el('div', 'bparty');
  for (const a of allies) { a.box = el('div', 'win bmem', strip); a.box.innerHTML = '<div class="bmn"></div><div class="bmh"></div><div class="bmm"></div>'; }
  const log = el('div', 'win blog'); const lines = [];
  const drawStat = () => {
    for (const a of allies) {
      const m = a.m, s = R.stat(m), box = a.box, dead = m.hp <= 0;
      const tag = dead ? '' : (m.poison ? '<span class="psn">' + t(['毒', 'PSN']) + '</span>' : '') + (a.sleep ? '<span class="pin">' + t(['定', 'PIN']) + '</span>' : '') + (a.sealed ? '<span class="sea">' + t(['封', 'SEAL']) + '</span>' : '');
      box.children[0].innerHTML = `${a.name}<span class="blv">${t('lv')}${m.lv}</span>${tag}`;
      box.children[1].textContent = `${t('hp')}${m.hp}/${s.maxHp}`; box.children[2].textContent = `${t('mp')}${m.mp}/${s.maxMp}`;
      box.classList.toggle('dead', dead); box.classList.toggle('low', !dead && m.hp <= s.maxHp / 4); box.classList.toggle('guarded', a.guard > 1 || a.defend);
    }
  };
  const actBox = (a) => { for (const b of allies) b.box.classList.toggle('act', b === a); };
  const say = async (zh, en, ms = 420) => { if (ui.driver && ui.driver.onLog) ui.driver.onLog(zh); lines.push(t([zh, en])); while (lines.length > 4) lines.shift(); log.innerHTML = lines.map((l) => `<div>${l}</div>`).join(''); await wait(ms); };
  const waitA = () => new Promise((res) => { if (ui.driver || fast) return res(); const off = G.input.push((k) => { if (k === 'A' || k === 'B') { off(); res(); } }); });

  // ---------------------------------------------------------------- layout on the stage
  const FOOT = 94;   // the foes' feet
  // each foe: its picture (gallery bust or portrait) scaled by whole device pixels so the row fits
  for (const f of foes) {
    const E = f.E;
    if (E.por && CAST[E.por]) { f.src = img(CAST[E.por].portrait); f.art = { x: 0, y: 0, w: 48, h: 56 }; }
    else { f.src = img(ENEMY_IMG); f.art = ENEMY_ART[ART_OF(f.id)] || ENEMY_ART.e_greywolf; }
  }
  let kk = 5;   // device pixels per art pixel (k/3 stage pixels)
  const want = (k) => foes.reduce((s, f) => s + (f.art.w * k * (f.E.big && f.E.big > 1 ? f.E.big : 1) / 3) + 7, -7);
  const tallest = (k) => Math.max(...foes.map((f) => f.art.h * k * (f.E.big && f.E.big > 1 ? f.E.big : 1) / 3));
  while (kk > 2 && (want(kk) > 228 || tallest(kk) > 88 || (foes.length > 1 && kk > 4))) kk--;
  {
    let x = (SW - want(kk)) / 2;
    for (const f of foes) {
      const sc = (kk / 3) * (f.E.big && f.E.big > 1 ? f.E.big : 1), w = f.art.w * sc, h = f.art.h * sc;
      f.g = { sc, w, h, cx: x + w / 2, foot: FOOT, top: FOOT - h, cy: FOOT - h / 2 }; x += w + 7;
      f.fx = { alpha: 1, shake: 0, white: 0, blink: 0, kx: 0, ky: 0, lunge: 0, lx: 0, ly: 0, diss: 0, dissRate: 0, flee: 0, dodge: 0, ddir: 1, tb: 0, tbv: 0, roll: 0, rv: 0, rise: -1, risen: 0 };
      f.card = null; f.sil = null; f.shad = null; f.tried = false; f.thr = new Float32Array(Math.ceil((f.art.w + 6) / 2));
    }
  }
  const HS = 5 / 3, HBP = 2;
  const gap = allies.length > 3 ? 46 : 52;
  allies.forEach((a, i) => {
    const x = SW / 2 + (i - (allies.length - 1) / 2) * gap;
    a.g = { hx: x, foot: 132, sc: HS };
    a.p = { act: '', t: 0, tint: '', tintT: 0, dx: 0, dy: 0, fr: 0 };
    a.cards = null; a.tried = false;
  });
  function makeFoeCard(f) {
    f.tried = true;
    try {
      const a = document.createElement('canvas'); a.width = f.art.w; a.height = f.art.h; a.getContext('2d').drawImage(f.src, f.art.x, f.art.y, f.art.w, f.art.h, 0, 0, f.art.w, f.art.h);
      f.card = dieCut(a, 1, 3, 2.2, '#fffaf0', '#a89a80');
      const mk = (col) => { const c = document.createElement('canvas'); c.width = f.card.width; c.height = f.card.height; const g = c.getContext('2d'); g.drawImage(f.card, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; };
      f.sil = mk('#fcfcfc'); f.shad = mk('rgba(30,18,6,0.42)');
    } catch (e) { f.card = null; }
  }
  function makeAllyCard(a) {
    const fr = memberFrames(G, a.m); if (!fr.length) return;
    a.tried = true;
    try {
      a.cards = fr.map((c) => dieCut(c, 1, HBP, 2, '#fffaf0', '#a89a80'));
      const c0 = a.cards[0], W = c0.width, H = c0.height;
      a.cw = W; a.ch = H;
      const mk = (col) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(c0, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); return c; };
      a.tints = { red: mk(COLS[0x16]), white: mk('#fcfcfc'), green: mk(COLS[0x2A]), gold: mk(COLS[0x28]), blue: mk(COLS[0x21]), purple: mk(COLS[0x24]), grey: mk('rgba(40,30,20,0.55)'), shad: mk('rgba(30,18,6,0.42)') };
      a.g.w = W * HS; a.g.h = H * HS; a.g.top = a.g.foot - a.g.h + HBP * HS; a.g.cy = a.g.foot - a.g.h / 2;
    } catch (e) { a.cards = null; }
  }
  // geometry of any fighter's card (for effects): centre, top, foot, half width
  const geo = (u) => {
    if (u.side === 'foe') return { x: u.g.cx, y: u.g.cy, top: u.g.top, foot: u.g.foot, w: u.g.w, h: u.g.h };
    const g = u.g, h = g.h || 40, w = g.w || 30;
    return { x: g.hx, y: g.foot - h / 2 + 2, top: g.foot - h + HBP * HS, foot: g.foot, w, h };
  };

  // ---------------------------------------------------------------- effect pools (filled once)
  const NP = 360, P = []; for (let i = 0; i < NP; i++) P.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, dr: 0, life: 0, c: 0, s: 1, k: 0 });
  let pi = 0;
  function part(x, y, vx, vy, life, c, s = 1, g = 0, dr = 0, kind = 0) {
    for (let n = 0; n < NP; n++) { pi = (pi + 1) % NP; const p = P[pi]; if (!p.on) { p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.c = c; p.s = s; p.g = g; p.dr = dr; p.k = kind; return p; } }
    return null;
  }
  const burst = (cols, n = 24, x = 120, y = 70, sp = 60, up = 0, s = 2, life = 0.4, g = 0, kind = 0) => {
    if (fast) return;
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.3 + Math.random()); part(x, y, Math.cos(a) * v, Math.sin(a) * v - up, life * (0.6 + Math.random() * 0.8), cols[i % cols.length], s, g, 2.5, kind); }
  };
  const NF = 40, F = []; for (let i = 0; i < NF; i++) F.push({ on: false, type: '', t: 0, dur: 1, x: 0, y: 0, x1: 0, y1: 0, r: 0, r1: 0, a0: 0, a1: 0, s: 1, v: 0, p: null, acc: 0, pts: new Float32Array(24) });
  function add(type, dur, o, delay = 0) {
    if (fast) return null;
    let e = null; for (const f of F) if (!f.on) { e = f; break; } if (!e) e = F[0];
    e.on = true; e.type = type; e.t = -delay; e.dur = dur; e.acc = 0;
    e.x = o.x ?? 120; e.y = o.y ?? 60; e.x1 = o.x1 ?? 120; e.y1 = o.y1 ?? 130; e.r = o.r ?? 4; e.r1 = o.r1 ?? 4; e.a0 = o.a0 ?? 0; e.a1 = o.a1 ?? 0; e.s = o.s ?? 1; e.v = o.v ?? 0; e.p = o.p || QI;
    if (type === 'bolt') { let x = e.x1 + (Math.random() - 0.5) * 30; for (let i = 0; i < 12; i++) { const f = i / 11; e.pts[i * 2] = i === 11 ? e.x1 : x; e.pts[i * 2 + 1] = f * e.y1; x += (Math.random() - 0.5) * 22; x += (e.x1 - x) * 0.25; } }
    return e;
  }
  const NT = 10, TX = []; for (let i = 0; i < NT; i++) TX.push({ on: false, a: null, b: null, x: 0, y: 0, t: 0, sc: 1, crit: false, red: false });
  function pop(s, c, x, y, sc = 4 / 3, c2 = -1, red = false) {
    if (fast) return;
    let o = TX[0]; for (const q of TX) { if (!q.on) { o = q; break; } if (q.t > o.t) o = q; }
    o.on = true; o.red = red; o.a = ink(String(s), red ? '#fff4dc' : INKOF[c] || '#2b2118'); o.b = c2 >= 0 ? ink(String(s), INKOF[c2] || '#b5361f') : o.a; o.x = x; o.y = y; o.t = 0; o.sc = sc * 0.85; o.crit = c === 0x28;
  }
  const tagOver = (u, s, c = 0x30, sc = 4 / 3, c2 = -1) => { const q = geo(u); pop(s, c, q.x, (u.side === 'foe' ? q.top + 14 : q.top + 2), sc, c2, false); };
  const hurtTag = (u, d, big) => { const q = geo(u); if (u.side === 'foe') pop(d, big ? 0x28 : 0x30, q.x, q.top + 14, big ? 5 / 3 : 4 / 3, big ? 0x27 : -1); else pop(d, 0x30, q.x, q.top + 2, big ? 5 / 3 : 4 / 3, -1, true); };

  // ---------------------------------------------------------------- pixel helpers
  const fill = (c) => { cx.fillStyle = COLS[c]; };
  const px = (x, y, s = 1) => cx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
  function line(x0, y0, x1, y1, s = 1) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) { const f = i / n; px(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, s); } }
  function disc(x, y, r) { x = Math.round(x); y = Math.round(y); r = Math.max(0, Math.round(r)); for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); cx.fillRect(x - w, y + dy, 2 * w + 1, 1); } }
  function circ(x, y, r) { const n = Math.max(8, Math.ceil(r * 6.3)); for (let i = 0; i < n; i++) { const a = i / n * TAU; cx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); } }
  function star(x, y, r, c1, c2) {
    x = Math.round(x); y = Math.round(y); r = Math.round(r);
    fill(c2); const d = Math.round(r * 0.55); for (let i = 1; i <= d; i++) { cx.fillRect(x - i, y - i, 1, 1); cx.fillRect(x + i, y - i, 1, 1); cx.fillRect(x - i, y + i, 1, 1); cx.fillRect(x + i, y + i, 1, 1); }
    fill(c1); cx.fillRect(x - r, y, 2 * r + 1, 1); cx.fillRect(x, y - r, 1, 2 * r + 1); cx.fillRect(x - 1, y - 1, 3, 3);
  }
  const blinkOn = (t2, hz = 15) => (Math.floor(t2 * hz) & 1) === 0;
  const riseOf = (q) => { if (q <= 0) return 0.02; if (q >= 1) return 1; const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2); };

  // ---------------------------------------------------------------- the frame
  let alive = true, raf = 0, last = performance.now(), T = 0, stop = 0, scr = 0, scrC = 0x30;
  const hl = { u: null, t: 0 };
  const mark = (u, d = 0.8) => { if (!fast) { hl.u = u; hl.t = d; } };
  function drawFoe(f) {
    const fx = f.fx, g = f.g, sc = g.sc;
    if (!f.tried && f.src.complete && f.src.naturalWidth) makeFoeCard(f);
    if (!f.card || fx.alpha <= 0) return;
    let dy = 0, lx = 0, lr = 0;
    if (fx.lunge > 0) { const u = fx.lunge; if (u > 0.30) { dy = -2; lx = -fx.lx * 0.15; lr = 0.05 * Math.sign(fx.lx); } else if (u > 0.08) { dy = fx.ly; lx = fx.lx; lr = -0.08 * Math.sign(fx.lx || 1); } else { dy = 1; lx = fx.lx * 0.2; } }
    const dg = fx.dodge > 0 ? fx.ddir * 16 * (fx.dodge > 0.34 ? (0.42 - fx.dodge) / 0.08 : fx.dodge > 0.14 ? 1 : fx.dodge / 0.14) : 0;
    const cw = f.card.width * sc, ch = f.card.height * sc, bp = 3 * sc;
    const x0 = R3(g.cx - cw / 2 + fx.kx + lx + Math.round(dg) + (fx.shake > 0 ? Math.random() * 4 - 2 : 0)), y0 = R3(g.foot - ch + bp + dy + fx.ky);
    const white = fx.white > 0 || (fx.blink > 0 && blinkOn(fx.blink, 15));
    const S = white ? f.sil : f.card;
    if (fx.rise < 0) fx.rise = T + f.i * 0.07;
    const rs = fast ? 1 : riseOf((T - fx.rise - 0.32) / 0.42), baseX = x0 + cw / 2, baseY = y0 + ch - bp;
    cx.globalAlpha = fx.alpha;
    if (fx.diss <= 0 && f.shad) { cx.save(); cx.translate(baseX, baseY); cx.transform(1, 0, -0.5 * rs, 0.32 * rs, 0, 0); cx.drawImage(f.shad, x0 - baseX, y0 - baseY, cw, ch); cx.restore(); }
    const tb = Math.max(-0.25, Math.min(0.6, fx.tb)), roll = lr + fx.roll;
    cx.save(); cx.translate(baseX, baseY); if (roll) cx.rotate(roll); cx.scale(1, rs * (1 - 0.45 * tb)); cx.translate(-baseX, -baseY);
    if (fx.diss <= 0) cx.drawImage(S, 0, 0, S.width, S.height, x0, y0, cw, ch);
    else {
      const CW = S.width, CH = S.height, N = f.thr.length;
      for (let i = 0; i < N; i++) {
        const p = Math.min(1, Math.max(0, fx.diss * 1.7 - f.thr[i] * 0.7)); if (p >= 1) continue;
        const top = Math.floor(CH * p), w2 = Math.min(2, CW - i * 2); if (w2 <= 0) continue; const X = x0 + i * 2 * sc, Y = y0 + top * sc;
        cx.drawImage(S, i * 2, top, w2, CH - top, X, Y, w2 * sc, (CH - top) * sc);
        if (p > 0) { cx.fillStyle = COLS[(i + Math.floor(T * 20)) % 3 ? 0x27 : 0x38]; cx.fillRect(X, Y, w2 * sc, sc); if (Math.random() < 0.04) part(X + sc, Y, (Math.random() - 0.5) * 20, -20 - Math.random() * 30, 0.35, SPARK[i & 3], 1, 0, 1); }
      }
    }
    cx.restore(); cx.globalAlpha = 1;
  }
  // a party member's poses (seconds on p.t): atk / crit / miss (dash to the foe and strike), cast (hands up), hurt /
  // hurt2 (knocked back), dodge, block, hop, ko (falls flat), kick (a ball leaves his foot)
  function pose(a) {
    const p = a.p, tt = p.t, A = p.act, out = a.pose || (a.pose = {});
    let x = 0, y = 0, sc = 1, sy = 1, rot = 0, bl = false, ba = 0, bd = 1, fr = 0, gh = 0;
    if (A === 'atk' || A === 'crit' || A === 'miss') {
      const c = A === 'crit', W1 = c ? 0.16 : 0.10, D1 = W1 + (c ? 0.08 : 0.10), S1 = D1 + (c ? 0.16 : 0.12), H1 = S1 + (A === 'miss' ? 0.16 : 0.10), B1 = H1 + 0.2;
      if (tt < W1) { const q = tt / W1; rot = -0.2 * q; y = q; sy = 1 - 0.06 * q; if (c) { bl = true; ba = -2.5; } }
      else if (tt < D1) { const q = (tt - W1) / (D1 - W1), e = q * q; x = p.dx * e; y = p.dy * e - Math.sin(PI * q) * 3; sc = 1 - 0.14 * e; rot = -0.2 + 0.35 * q; fr = (q * 4 | 0) & 1; gh = q; if (c) { bl = true; ba = -2.5; } }
      else if (tt < H1) {
        const q = Math.min(1, (tt - D1) / (S1 - D1));
        x = p.dx; y = p.dy; sc = 0.86; bl = true;
        if (c) { if (q < 0.5) ba = -2.5 + 3.4 * easeOut(q * 2); else { ba = 0.9 - 2.6 * easeOut((q - 0.5) * 2); bd = -1; } rot = 0.15 + 0.12 * Math.sin(TAU * q); }
        else { ba = -2.0 + 2.9 * easeOut(Math.min(1, q * 1.5)); rot = 0.15 + 0.12 * Math.sin(PI * Math.min(1, q * 1.5)); }
        if (A === 'miss') { x += 7 * easeOut(q); rot += 0.2 * q; }
      } else if (tt < B1) { const q = (tt - H1) / (B1 - H1), e = easeOut(q), ex = p.dx + (A === 'miss' ? 7 : 0); x = ex * (1 - e); y = p.dy * (1 - e) - Math.sin(PI * q) * 5; sc = 0.86 + 0.14 * e; rot = 0.2 * (1 - e); fr = (q * 4 | 0) & 1; }
      else p.act = '';
    } else if (A === 'kick' || A === 'jab') {
      if (tt < 0.1) { const q = tt / 0.1; rot = -0.18 * q; y = q; }
      else if (tt < 0.24) { const q = (tt - 0.1) / 0.14; x = p.dx * 0.25 * q; y = p.dy * 0.25 * q - 4 * Math.sin(PI * q); rot = 0.25 * q; fr = 1; }
      else if (tt < 0.5) { const q = (tt - 0.24) / 0.26, e = easeOut(q); x = p.dx * 0.25 * (1 - e); y = p.dy * 0.25 * (1 - e); rot = 0.25 * (1 - e); }
      else p.act = '';
    } else if (A === 'cast') {
      if (tt < 0.12) { const q = tt / 0.12; y = -4 * q; rot = -0.1 * q; }
      else if (tt < 0.5) { y = -4 + ((tt * 10 | 0) & 1) * 0.6; rot = -0.1; }
      else if (tt < 0.66) { const q = (tt - 0.5) / 0.16; y = -4 * (1 - q); rot = -0.1 * (1 - q); }
      else p.act = '';
    } else if (A === 'hurt' || A === 'hurt2') {
      const big = A === 'hurt2', D = big ? 0.5 : 0.38;
      if (tt < D) { const f = 1 - tt / D, w = f * f; x = (big ? -9 : -6) * w * (a.i < allies.length / 2 ? 1 : -1); y = 3 * w; rot = (big ? -0.42 : -0.24) * w * Math.cos(tt * 26); if (tt < 0.25) x += ((T * 60 | 0) & 1) ? 1 : -1; }
      else p.act = '';
    } else if (A === 'dodge') {
      if (tt < 0.46) { const s = tt < 0.08 ? tt / 0.08 : tt < 0.3 ? 1 : 1 - (tt - 0.3) / 0.16; x = -11 * s; y = -3 * Math.sin(PI * Math.min(1, tt / 0.16)); rot = -0.16 * s; fr = (tt * 12 | 0) & 1; }
      else p.act = '';
    } else if (A === 'block') {
      if (tt < 0.4) { const f = 1 - tt / 0.4; x = -3 * f; rot = 0.08 * f; bl = tt < 0.34; ba = -0.35; } else p.act = '';
    } else if (A === 'hop') {
      if (tt < 0.32) y = -5 * Math.sin(PI * tt / 0.32); else p.act = '';
    } else if (A === 'ko') {
      const q = Math.min(1, tt / 0.4); sy = 1 - 0.86 * q * q; if (tt > 0.4 && tt < 0.56) sy += Math.sin(PI * (tt - 0.4) / 0.16) * 0.1; rot = -0.12 * q; x = -2 * q;
    } else if (A === 'down') { sy = 0.14; rot = -0.12; x = -2; }
    out.x = a.g.hx + x; out.y = a.g.foot + y; out.sc = sc; out.sy = sy; out.rot = rot; out.bl = bl; out.ba = ba; out.bd = bd; out.fr = fr; out.gh = gh;
    return out;
  }
  // 奕叡's weapon as he wears it (the paper doll), drawn in his card's frame
  const yr = allies.find((a) => a.m.who === 'yirui');
  const WL = (yr && yr.m.w && ITEMS[yr.m.w] && ITEMS[yr.m.w].look) || { f: 'dao' };
  const BLD = { dao: { L: 20, w: 3 }, sword: { L: 21, w: 2 }, bigdao: { L: 25, w: 4 }, spear: { L: 30, w: 2, pole: 1 }, staff: { L: 28, w: 2, pole: 1 }, fan: { L: 9, fan: 1 } }[WL.f] || { L: 20, w: 3 };
  const BM = WL.f === 'dao' || WL.f === 'bigdao' ? 0x10 : (WL.a ?? 0x10), BH = WL.b ?? 0x30, BC = WL.c ?? 0x27;
  function blade(a, Pp) {
    const HW = a.g.w, HH = a.g.h, hx = -HW / 2 + (HBP + 13) * HS, hy = -HH + HBP * HS + (HBP + 12) * HS, an = Pp.ba, Lb = BLD.L, ca = Math.cos(an), sa = Math.sin(an);
    if (Math.abs(an - (a.lastBa || 0)) > 0.02) for (let j = 4; j >= 1; j--) { const b = an - Pp.bd * j * 0.17; fill(BLADE_TRAIL[j - 1]); line(hx + Math.cos(b) * (Lb - 7 + j), hy + Math.sin(b) * (Lb - 7 + j), hx + Math.cos(b) * Lb, hy + Math.sin(b) * Lb, j < 3 ? 2 : 1); }
    a.lastBa = an;
    if (BLD.fan) { for (let k = -3; k <= 3; k++) { const b = an + k * 0.16, cb = Math.cos(b), sb = Math.sin(b); fill(0x0F); line(hx, hy, hx + cb * (Lb + 1), hy + sb * (Lb + 1), 2); fill(k & 1 ? BH : BM); line(hx + cb * 3, hy + sb * 3, hx + cb * Lb, hy + sb * Lb, 1); } }
    else if (BLD.pole) {
      fill(0x0F); line(hx - ca * 7, hy - sa * 7, hx + ca * Lb, hy + sa * Lb, 3); fill(BC); line(hx - ca * 6, hy - sa * 6, hx + ca * (Lb - 1), hy + sa * (Lb - 1), 1);
      if (WL.f === 'spear') { fill(0x0F); line(hx + ca * (Lb - 6), hy + sa * (Lb - 6), hx + ca * (Lb + 2), hy + sa * (Lb + 2), 3); fill(BM); line(hx + ca * (Lb - 5), hy + sa * (Lb - 5), hx + ca * (Lb + 1), hy + sa * (Lb + 1), 1); fill(0x16); px(hx + ca * (Lb - 7), hy + sa * (Lb - 7), 3); }
      else { fill(BM); px(hx + ca * (Lb - 1), hy + sa * (Lb - 1), 2); px(hx - ca * 6, hy - sa * 6, 2); }
    } else {
      fill(0x0F); line(hx, hy, hx + ca * Lb, hy + sa * Lb, BLD.w); fill(BM); line(hx + ca, hy + sa, hx + ca * (Lb - 1), hy + sa * (Lb - 1), BLD.w - 1);
      fill(BH); line(hx + ca * 3, hy + sa * 3, hx + ca * (Lb - 1), hy + sa * (Lb - 1), 1);
      fill(0x28); px(hx + ca * 2, hy + sa * 2, WL.f === 'sword' ? 4 : 3); fill(WL.f === 'sword' ? BC : (WL.c ?? 0x27)); circ(hx - ca * 3, hy - sa * 3, WL.f === 'sword' ? 1 : 1.5);
    }
    if (a.p.act === 'crit' && a.p.t < 0.24 && blinkOn(T, 20)) star(hx + ca * Lb, hy + sa * Lb, 4, 0x30, 0x38);
  }
  function drawAlly(a) {
    if (!a.tried) makeAllyCard(a);
    if (!a.cards) return;
    const Pp = pose(a), HW = a.g.w, HH = a.g.h, top = -HH + HBP * HS;
    if (a.rise == null) a.rise = T + 0.14 + a.i * 0.06;
    const rs = fast ? 1 : riseOf((T - a.rise - 0.32) / 0.42), ys = rs * Pp.sy, sc = Pp.sc;
    cx.save(); cx.translate(Pp.x, Pp.y); cx.transform(sc, 0, -0.5 * ys * sc, 0.3 * ys * sc, 0, 0); cx.drawImage(a.tints.shad, -HW / 2, top, HW, HH); cx.restore();
    if (Pp.gh > 0) for (let j = 1; j <= 2; j++) {
      const f = 1 - j * 0.28; cx.globalAlpha = 0.3 / j;
      cx.save(); cx.translate(a.g.hx + (Pp.x - a.g.hx) * f, a.g.foot + (Pp.y - a.g.foot) * f); cx.scale(sc, sc * ys); cx.drawImage(a.tints.blue, -HW / 2, top, HW, HH); cx.restore();
    }
    cx.globalAlpha = 1;
    cx.save(); cx.translate(R3(Pp.x), R3(Pp.y)); if (Pp.rot) cx.rotate(Pp.rot); cx.scale(sc, sc * ys);
    const flash = stop > 0 && (a.p.act === 'hurt' || a.p.act === 'hurt2');
    cx.drawImage(flash ? a.tints.white : a.cards[Pp.fr % a.cards.length], -HW / 2, top, HW, HH);
    if (a.p.act === 'ko' || a.p.act === 'down') { cx.globalAlpha = a.p.act === 'down' ? 1 : Math.min(1, a.p.t * 3); cx.drawImage(a.tints.grey, -HW / 2, top, HW, HH); }
    else if (a.p.tintT > 0 && !flash && blinkOn(a.p.tintT, 12)) { cx.globalAlpha = a.p.tint === 'red' ? 0.72 : 0.42; cx.drawImage(a.tints[a.p.tint] || a.tints.white, -HW / 2, top, HW, HH); }
    cx.globalAlpha = 1;
    if (Pp.bl && a.m.who === 'yirui') blade(a, Pp); else a.lastBa = Pp.ba;
    cx.restore();
  }
  function statusMarks() {
    for (const f of foes) {
      if (!uAlive(f) || f.fx.alpha <= 0 || f.fx.diss > 0) continue; const q = f.g;
      if (f.sleep) for (let i = 0; i < 3; i++) { const ph = (T * 0.9 + i / 3) % 1, s = txt(i === 1 ? 'Z' : 'z', 0x30); cx.drawImage(s, R3(q.cx + q.w * 0.28 + ph * 8 + i * 2), R3(q.top + 8 - ph * 14), s.width, s.height); }
      if (f.sealed) { const x = Math.round(Math.max(3, q.cx - q.w / 2 - 3)), y = Math.round(q.top + 4 + (Math.floor(T * 2) & 1)); fill(0x16); cx.fillRect(x - 1, y - 1, 15, 19); fill(0x38); cx.fillRect(x, y, 13, 17); cx.drawImage(txt('封', 0x16), x - 1, y + 1); }
      if (f.guard > 1) { const n = Math.floor(T / 0.7), ph = T % 0.7; if (ph < 0.18) { const an = (n * 2.39996 + f.i) % TAU; star(q.cx + Math.cos(an) * q.w * 0.42, q.cy + Math.sin(an) * q.h * 0.42, ph < 0.09 ? 3 : 2, 0x30, 0x28); } }
      if (f.heart > 0 && blinkOn(T, 3)) { const x = Math.round(q.cx + q.w / 2 - 6), y = Math.round(q.top + 2); fill(0x16); cx.fillRect(x, y + 1, 2, 2); cx.fillRect(x + 3, y + 1, 2, 2); cx.fillRect(x, y + 2, 5, 2); cx.fillRect(x + 1, y + 4, 3, 1); cx.fillRect(x + 2, y + 5, 1, 1); }
    }
    for (const a of allies) {
      if (!a.cards || !uAlive(a)) continue; const q = geo(a);
      if (a.sleep) for (let i = 0; i < 3; i++) { const ph = (T * 0.9 + i / 3) % 1, s = txt(i === 1 ? 'Z' : 'z', 0x30); cx.drawImage(s, R3(q.x + 4 + ph * 8 + i * 2), R3(q.top - 2 - ph * 14), s.width, s.height); }
      if (a.sealed) { const x = Math.round(q.x + q.w / 2 - 4), y = Math.round(q.top + 6 + (Math.floor(T * 2) & 1)); fill(0x16); cx.fillRect(x - 1, y - 1, 15, 19); fill(0x38); cx.fillRect(x, y, 13, 17); cx.drawImage(txt('封', 0x16), x - 1, y + 1); }
      if (a.guard > 1 || a.defend || a.cover) { const n = Math.floor(T / 0.6), ph = T % 0.6; if (ph < 0.18) { const an = (n * 2.39996 + a.i) % TAU; star(q.x + Math.cos(an) * q.w * 0.45, q.y + Math.sin(an) * q.h * 0.42, ph < 0.09 ? 3 : 2, 0x30, 0x28); } }
    }
  }
  function corners() {
    const u = hl.u; if (!u || hl.t <= 0 || !blinkOn(hl.t, 8)) return;
    let x0, y0, x1, y1, c;
    if (u.side === 'foe') { if (u.fx.alpha <= 0 || u.fx.diss > 0) return; const q = u.g; x0 = q.cx - q.w / 2 - 3; x1 = q.cx + q.w / 2 + 3; y0 = q.top - 3; y1 = q.foot + 3; c = 0x38; }
    else { const q = geo(u); x0 = q.x - q.w / 2 - 1; x1 = q.x + q.w / 2 + 1; y0 = q.foot - q.h + 1; y1 = SH - 1; c = 0x16; }
    x0 = Math.round(Math.max(1, x0)); y0 = Math.round(Math.max(1, y0)); x1 = Math.round(Math.min(SW - 1, x1)); y1 = Math.round(Math.min(SH - 1, y1));
    const Lc = 6, th = 2;
    for (let pass = 0; pass < 2; pass++) {
      fill(pass ? c : 0x0F); const o = pass ? 0 : 1, l = Lc + 2 * o, w = th + 2 * o;
      cx.fillRect(x0 - o, y0 - o, l, w); cx.fillRect(x0 - o, y0 - o, w, l);
      cx.fillRect(x1 - Lc - o, y0 - o, l, w); cx.fillRect(x1 - th - o, y0 - o, w, l);
      cx.fillRect(x0 - o, y1 - th - o, l, w); cx.fillRect(x0 - o, y1 - Lc - o, w, l);
      cx.fillRect(x1 - Lc - o, y1 - th - o, l, w); cx.fillRect(x1 - th - o, y1 - Lc - o, w, l);
    }
  }
  function drawFx(e, dt) {
    e.t += dt; if (e.t < 0) return; const u = e.t / e.dur; if (u >= 1) { e.on = false; return; }
    const p = e.p;
    switch (e.type) {
      case 'arc': {
        const hp = easeOut(Math.min(1, u / 0.5)), tp = easeOut(Math.min(1, Math.max(0, (u - 0.2) / 0.8)));
        const aH = e.a0 + (e.a1 - e.a0) * hp, aT = e.a0 + (e.a1 - e.a0) * tp, span = aH - aT; if (Math.abs(span) < 0.02) break;
        const n = Math.ceil(Math.abs(span) * e.r * 1.3);
        fill(p[3]); for (let j = 0; j <= n; j++) { const an = aT + span * j / n * 0.8, rr = e.r - e.s - 3; cx.fillRect(Math.round(e.x + Math.cos(an) * rr), Math.round(e.y + Math.sin(an) * rr), 1, 1); }
        for (let band = 2; band >= 0; band--) {
          fill(p[band]);
          for (let j = 0; j <= n; j++) {
            const f = j / n, w = Math.max(1, Math.round(e.s * Math.sin(PI * Math.min(1, 0.08 + f * 0.86)))), an = aT + span * f, ca = Math.cos(an), sa = Math.sin(an);
            const d0 = band === 0 ? 0 : band === 1 ? 1 : Math.ceil(w * 0.6), d1 = band === 0 ? 1 : band === 1 ? Math.ceil(w * 0.6) : w;
            for (let d = d0; d < d1; d++) cx.fillRect(Math.round(e.x + ca * (e.r - d)), Math.round(e.y + sa * (e.r - d)), 1, 1);
          }
        }
        break;
      }
      case 'star': { if (u > 0.6 && !blinkOn(e.t)) break; star(e.x, e.y, 2 + (e.r - 2) * Math.min(1, u * 3), p[0], p[1]); break; }
      case 'orb': {
        let x = e.x, y = e.y, rad;
        if (u < e.v) { rad = 1 + (e.r - 1) * (u / e.v); if (Math.random() < 0.7) { const an = Math.random() * TAU, d = 12 + Math.random() * 6; part(x + Math.cos(an) * d, y + Math.sin(an) * d, -Math.cos(an) * d * 5, -Math.sin(an) * d * 5, 0.16, p[1 + (Math.random() * 2 | 0)], 1); } }
        else {
          const q = (u - e.v) / (1 - e.v), qe = q * q; x = e.x + (e.x1 - e.x) * qe; y = e.y + (e.y1 - e.y) * qe; rad = e.r + (e.r1 - e.r) * q;
          fill(p[0]); for (let j = 1; j <= 3; j++) { const qq = Math.max(0, q - j * 0.09), qq2 = qq * qq; disc(e.x + (e.x1 - e.x) * qq2, e.y + (e.y1 - e.y) * qq2, rad * (1 - j * 0.25)); }
        }
        for (let j = 0; j < 3; j++) { const an = T * 14 + j * 2.09, d = rad + 4; fill(p[2]); cx.fillRect(Math.round(x + Math.cos(an) * d), Math.round(y + Math.sin(an) * d), 2, 2); }
        const rr = rad + (blinkOn(T, 15) ? 1 : 0);
        fill(p[0]); disc(x, y, rr + 1); fill(p[1]); disc(x, y, rr); fill(p[2]); disc(x, y, Math.max(0.5, rr - 2));
        break;
      }
      case 'ball': {   // a kicked ball: arcs from the foot to the target, spinning
        const q = Math.min(1, u / 0.85), x = e.x + (e.x1 - e.x) * q, y = e.y + (e.y1 - e.y) * q - Math.sin(PI * q) * 18, r = e.r + (e.r1 - e.r) * q;
        for (let j = 1; j <= 3; j++) { const qq = Math.max(0, q - j * 0.07); fill(j === 1 ? p[1] : 0x10); disc(e.x + (e.x1 - e.x) * qq, e.y + (e.y1 - e.y) * qq - Math.sin(PI * qq) * 18, r * (1 - j * 0.22)); }
        fill(0x0F); disc(x, y, r + 1); fill(p[0]); disc(x, y, r); fill(p[2]); const an = T * 18; cx.fillRect(Math.round(x + Math.cos(an) * r * 0.5), Math.round(y + Math.sin(an) * r * 0.5), 2, 2); cx.fillRect(Math.round(x - Math.cos(an) * r * 0.5), Math.round(y - Math.sin(an) * r * 0.5), 1, 1);
        break;
      }
      case 'beam': {
        const bot = e.y1, head = u < 0.22 ? bot * (u / 0.22) : bot;
        const w = u < 0.22 ? 1 : u < 0.72 ? 4 + Math.round(2 * Math.sin(T * 40)) + Math.round(4 * Math.min(1, (u - 0.22) * 8)) : Math.max(1, Math.round(10 * (1 - (u - 0.72) / 0.28)));
        const x = Math.round(e.x);
        fill(p[0]); cx.fillRect(x - w - 2, 0, 2 * w + 5, head); fill(p[1]); cx.fillRect(x - w, 0, 2 * w + 1, head); fill(p[2]); cx.fillRect(x - w + 2, 0, Math.max(1, 2 * w - 3), head); fill(p[3] ?? p[2]); cx.fillRect(x - Math.max(0, w - 4), 0, Math.max(1, 2 * w - 7), head);
        fill(0x30); for (let j = 0; j < 5; j++) { const yy = Math.round((T * 260 + j * 23) % Math.max(1, head)); cx.fillRect(x - w - 4, yy, 2 * w + 9, 1); }
        if (u > 0.2 && u < 0.8) for (let j = 0; j < 2; j++) part(x + (Math.random() - 0.5) * 2 * w, bot - 2, (Math.random() - 0.5) * 140, -40 - Math.random() * 90, 0.35, p[1 + (j & 1) * 2] ?? p[1], 1, 300);
        break;
      }
      case 'pt': {
        if (u < 0.22) { star(e.x, e.y, 3 + 6 * (u / 0.22), 0x30, 0x28); if (u < 0.08) { fill(0x30); disc(e.x, e.y, 3); } break; }
        fill(0x27); disc(e.x, e.y, 3); fill(blinkOn(T, 12) ? 0x38 : 0x28); disc(e.x, e.y, 2); fill(0x30); cx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
        if (blinkOn(T, 6)) { fill(0x38); circ(e.x, e.y, 5 + (Math.floor(T * 12) % 2)); }
        break;
      }
      case 'sealbox': {
        const r = e.r, x = Math.round(e.x), y = Math.round(e.y), Lb = 8 * r, n = Math.floor(Lb * Math.min(1, u / 0.45));
        if (u > 0.8 && !blinkOn(T)) break;
        for (let pass = 0; pass < 2; pass++) {
          fill(pass ? 0x38 : 0x16); const s = pass ? 1 : 3;
          for (let i = 0; i < n; i += 1) { const sd = Math.floor(i / (2 * r)), o = i % (2 * r) - r; const X = sd === 0 ? x + o : sd === 1 ? x + r : sd === 2 ? x - o : x - r, Y = sd === 0 ? y - r : sd === 1 ? y + o : sd === 2 ? y + r : y - o; px(X, Y, s); }
          if (u > 0.45) { const f = Math.min(1, (u - 0.45) / 0.25), d = r * f; line(x - r, y - r, x - r + 2 * d, y - r + 2 * d, s); line(x + r, y - r, x + r - 2 * d, y - r + 2 * d, s); }
        }
        break;
      }
      case 'claw': {
        if (u > 0.75 && !blinkOn(T)) break;
        const s = e.s, w0 = s < 1 ? 4 : 5, w1 = s < 1 ? 2 : 3;
        for (let i = 0; i < 3; i++) {
          const f = Math.min(1, Math.max(0, (u - i * 0.1) / 0.18)); if (f <= 0) continue;
          const xa = e.x + (i * 14 + 22) * s, ya = e.y + i * 2 * s, xb = e.x + (i * 14 - 10) * s, yb = e.y + 62 * s, xe = xa + (xb - xa) * f, ye = ya + (yb - ya) * f;
          fill(0x06); line(xa, ya, xe, ye, w0); fill(0x16); line(xa + (xb - xa) * 0.08, ya + (yb - ya) * 0.08, xe, ye, w1); fill(0x30); line(xa + (xb - xa) * 0.2, ya + (yb - ya) * 0.2, xa + (xe - xa) * 0.85, ya + (ye - ya) * 0.85, 1);
        }
        break;
      }
      case 'bite': {
        const mid = Math.round(e.y), q = u < 0.42 ? (u / 0.42) * (u / 0.42) : u < 0.62 ? 1 : 1 - (u - 0.62) / 0.38 * 0.35;
        if (u > 0.7 && !blinkOn(T)) break;
        const x0 = Math.round(e.x - e.r), W = Math.round(e.r * 2), top = Math.round(mid - 26 + 23 * q), bot = Math.round(mid + 26 - 23 * q);
        fill(0x06); cx.fillRect(x0, top - 7, W, 7); cx.fillRect(x0, bot, W, 7); fill(0x16); cx.fillRect(x0, top - 2, W, 2); cx.fillRect(x0, bot, W, 2);
        for (let xx = x0 + 1; xx < x0 + W - 5; xx += 7) for (let r = 0; r < 5; r++) { fill(r < 1 ? 0x10 : 0x30); cx.fillRect(xx + (r >> 1), top + r, 6 - r, 1); cx.fillRect(xx + 3 + (r >> 1), bot - 1 - r, 6 - r, 1); }
        break;
      }
      case 'wslash': {
        const tl = Math.min(1, Math.max(0, (u - 0.3) / 0.6));
        const xa = e.x + (e.x1 - e.x) * tl, ya = e.y + (e.y1 - e.y) * tl, xb = e.x + (e.x1 - e.x) * Math.min(1, u / 0.35), yb = e.y + (e.y1 - e.y) * Math.min(1, u / 0.35);
        const n = Math.max(1, Math.ceil(Math.hypot(xb - xa, yb - ya))), nx = -(e.y1 - e.y), ny = e.x1 - e.x, nl = Math.hypot(nx, ny) || 1;
        for (let pass = 0; pass < 3; pass++) {
          fill(p[pass]);
          for (let i = 0; i <= n; i++) {
            const f = i / n, g = tl + (Math.min(1, u / 0.35) - tl) * f, bow = Math.sin(PI * g) * 7, w = Math.max(1, Math.round((pass === 0 ? 7 : pass === 1 ? 4 : 1) * Math.sin(PI * Math.min(1, 0.1 + g * 0.85))));
            px(e.x + (e.x1 - e.x) * g + nx / nl * bow, e.y + (e.y1 - e.y) * g + ny / nl * bow, w);
          }
        }
        break;
      }
      case 'impact': {
        if (u > 0.55 && !blinkOn(T)) break;
        const rr = e.r * Math.min(1, 0.35 + u * 4);
        for (let pass = 0; pass < 2; pass++) { fill(pass ? 0x30 : p[0]); const s = pass ? 1 : 3; for (let i = 0; i < 8; i++) { const an = i * PI / 4 + 0.2, Lb = (i & 1 ? 0.55 : 1) * rr * (pass ? 0.6 : 1); line(e.x, e.y, e.x + Math.cos(an) * Lb, e.y + Math.sin(an) * Lb, s); } }
        fill(0x30); disc(e.x, e.y, Math.max(1, rr * 0.25));
        break;
      }
      case 'arrow': {
        const q = Math.min(1, u / 0.8), qe = q * q, x = e.x + (e.x1 - e.x) * qe, y = e.y + (e.y1 - e.y) * qe, Lb = 6 + 30 * qe, dx = e.x1 - e.x, dy = e.y1 - e.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, s = q > 0.5 ? 3 : 2, hw = 2 + 4 * qe;
        const tx = x - ux * Lb, ty = y - uy * Lb;
        fill(p[0]); line(tx, ty, x, y, s); fill(0x27); line(tx + ux * 2, ty + uy * 2, x - ux * Lb * 0.4, y - uy * Lb * 0.4, 1);
        fill(0x16); for (let k2 = 0; k2 < 3; k2++) { const bx = tx + ux * k2 * 2, by = ty + uy * k2 * 2; line(bx, by, bx - ux * hw - uy * hw, by - uy * hw + ux * hw, 1); line(bx, by, bx - ux * hw + uy * hw, by - uy * hw - ux * hw, 1); }
        fill(0x30); px(x, y, 2);
        break;
      }
      case 'sting': {
        const ex = u < 0.4 ? u / 0.4 : u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4, x = e.x + (e.x1 - e.x) * ex, y = e.y + (e.y1 - e.y) * ex;
        fill(0x07); line(e.x, e.y, x, y, 4); fill(p[0]); line(e.x, e.y, x, y, 2); fill(0x30); line(e.x + (x - e.x) * 0.6, e.y + (y - e.y) * 0.6, x, y, 1);
        if (ex > 0.95) star(x, y, 7, 0x30, p[1]);
        break;
      }
      case 'bolt': {
        if (!blinkOn(T, 12) && u > 0.35) break;
        const n = Math.min(11, Math.floor(u / 0.15 * 11) + 1);
        for (let pass = 0; pass < 3; pass++) { fill(pass === 2 ? 0x30 : pass ? p[0] : 0x27); for (let i = 0; i < n; i++) line(e.pts[i * 2], e.pts[i * 2 + 1], e.pts[i * 2 + 2], e.pts[i * 2 + 3], pass === 2 ? 1 : pass ? 3 : 5); }
        break;
      }
      case 'breath': {
        e.acc += dt * 420; while (e.acc > 1) { e.acc--; const an = e.a0 + (Math.random() - 0.5) * 0.9, v = 150 + Math.random() * 110; part(e.x + (Math.random() - 0.5) * 4, e.y, Math.cos(an) * v, Math.sin(an) * v, 0.4 + Math.random() * 0.25, p[Math.random() * 3 | 0], 3 + (Math.random() < 0.4 ? 1 : 0), -80, 0.6); }
        fill(0x30); disc(e.x, e.y + 2, 3 + (blinkOn(T, 15) ? 1 : 0)); fill(0x38); disc(e.x, e.y + 2, 2);
        break;
      }
      case 'bubbles': { e.acc += dt * e.v; while (e.acc > 1) { e.acc--; part(e.x + (Math.random() - 0.5) * e.r * 2, e.y - Math.random() * 45, (Math.random() - 0.5) * 16, -20 - Math.random() * 40, 0.5 + Math.random() * 0.5, p[Math.random() * 3 | 0], 3, -10, 0, 1); } break; }
      case 'rise': {
        e.acc += dt * e.v; while (e.acc > 1) { e.acc--; part(e.x + (Math.random() - 0.5) * e.r * 2, e.y - Math.random() * e.r * 0.7, (Math.random() - 0.5) * 6, -35 - Math.random() * 45, 0.45 + Math.random() * 0.4, p[Math.random() * p.length | 0], Math.random() < 0.55 ? 5 : Math.random() < 0.5 ? 3 : 2, 0, 0, 2); }
        if (e.s > 1) { fill(p[0]); for (let j = 0; j < 7; j++) { const x = Math.round(e.x - e.r + ((j * 37 + 11) % (2 * e.r))), yy = Math.round(e.y - ((T * 110 + j * 29) % (e.r * 1.2))); cx.fillRect(x, yy, 1, 6); fill(p[2]); cx.fillRect(x, yy, 1, 2); fill(p[0]); } }
        break;
      }
      case 'rings': { for (let i = 0; i < 3; i++) { const q = (u - i * 0.18) / 0.55; if (q <= 0 || q >= 1) continue; fill(p[i % p.length]); circ(e.x, e.y, e.r + (e.r1 - e.r) * q); } break; }
      case 'heart': {   // a little heart floats up (a fed foe warms to you; one asks to join)
        const y = e.y - u * 18, x = e.x + Math.sin(u * 9) * 3; if (u > 0.7 && !blinkOn(T)) break;
        fill(0x0F); cx.fillRect(Math.round(x) - 3, Math.round(y) - 1, 9, 5); cx.fillRect(Math.round(x) - 2, Math.round(y) + 4, 7, 1); cx.fillRect(Math.round(x), Math.round(y) + 5, 3, 1);
        fill(0x16); cx.fillRect(Math.round(x) - 2, Math.round(y), 3, 3); cx.fillRect(Math.round(x) + 2, Math.round(y), 3, 3); cx.fillRect(Math.round(x) - 1, Math.round(y) + 3, 5, 1); cx.fillRect(Math.round(x), Math.round(y) + 4, 3, 1); cx.fillRect(Math.round(x) + 1, Math.round(y) + 5, 1, 1);
        fill(0x30); cx.fillRect(Math.round(x) - 1, Math.round(y), 1, 1);
        break;
      }
    }
  }
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    const adt = stop > 0 ? 0 : dt; stop = Math.max(0, stop - dt);
    cx.drawImage(bg, 0, 0, SW, SH);
    for (const f of foes) drawFoe(f);
    for (const a of allies) drawAlly(a);
    statusMarks(); corners();
    for (let i = 0; i < NF; i++) if (F[i].on) drawFx(F[i], dt);
    for (let i = 0; i < NP; i++) {
      const p = P[i]; if (!p.on) continue;
      p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
      const d = Math.max(0, 1 - p.dr * dt); p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life < 0.12 && !blinkOn(p.life, 15)) continue;
      const x = Math.round(p.x), y = Math.round(p.y); cx.fillStyle = COLS[p.c];
      if (p.k === 1) { cx.fillRect(x - 1, y - 2, 3, 1); cx.fillRect(x - 1, y + 2, 3, 1); cx.fillRect(x - 2, y - 1, 1, 3); cx.fillRect(x + 2, y - 1, 1, 3); cx.fillStyle = COLS[0x30]; cx.fillRect(x - 1, y - 1, 1, 1); }
      else if (p.k === 3) { const f = ((T * 14 | 0) + i) & 1; cx.fillRect(x, y, f ? 2 : 1, f ? 1 : 2); p.x += Math.sin(T * 9 + i) * 12 * dt; }
      else if (p.k === 2 && p.s > 2) { const a = p.s >> 1; cx.fillRect(x - a, y, p.s, 1); cx.fillRect(x, y - a, 1, p.s); if (p.s > 3) { cx.fillStyle = COLS[0x30]; cx.fillRect(x, y, 1, 1); } }
      else cx.fillRect(x, y, p.s, p.s);
    }
    for (let i = 0; i < NT; i++) {
      const o = TX[i]; if (!o.on) continue; o.t += dt; const tt = o.t; if (tt > 0.95) { o.on = false; continue; }
      const dy = tt < 0.07 ? -7 * tt / 0.07 : tt < 0.15 ? -7 + 6 * (tt - 0.07) / 0.08 : tt < 0.55 ? -1 : -1 - (tt - 0.55) * 22;
      if (tt > 0.7 && !blinkOn(tt, 15)) continue;
      const s = (o.a !== o.b && blinkOn(tt, 15)) ? o.b : o.a, w = s.width * o.sc, hh = s.height * o.sc, tw = w + 7, th = hh + 2;
      const X = Math.max(1, Math.min(SW - 1 - tw, o.x - tw / 2)), Y = Math.max(1, o.y + dy - th / 2);
      cx.save(); cx.translate(X + 2, Y + th / 2); cx.rotate(Math.sin(tt * 9) * 0.12 * (1 - Math.min(1, tt * 1.5)) - 0.05); cx.translate(-X - 2, -Y - th / 2);
      cx.fillStyle = 'rgba(30,18,6,0.35)'; cx.fillRect(X + 1, Y + 1, tw, th);
      cx.fillStyle = o.red ? '#4a140a' : '#5a4630'; cx.fillRect(X - 0.5, Y - 0.5, tw + 1, th + 1); cx.fillStyle = o.red ? '#c4321a' : o.crit ? '#ffe9b0' : '#fffaf0'; cx.fillRect(X, Y, tw, th);
      cx.fillStyle = o.red ? '#fff4dc' : '#5a4630'; cx.fillRect(X + 1.5, Y + th / 2 - 0.75, 1.5, 1.5);
      cx.drawImage(s, R3(X + 5), R3(Y + 1), w, hh);
      cx.restore();
    }
    if (scr > 0) { cx.fillStyle = COLS[scrC]; cx.fillRect(0, 0, SW, SH); scr -= dt; }
    for (const f of foes) {
      const fx = f.fx;
      fx.shake = Math.max(0, fx.shake - dt); fx.blink = Math.max(0, fx.blink - dt); fx.lunge = Math.max(0, fx.lunge - dt); fx.dodge = Math.max(0, fx.dodge - dt);
      if (fx.white > 0) fx.white -= dt;
      else { const back = 45 * dt; fx.kx = Math.abs(fx.kx) <= back ? 0 : fx.kx - Math.sign(fx.kx) * back; fx.ky = Math.abs(fx.ky) <= back ? 0 : fx.ky - Math.sign(fx.ky) * back; }
      if (fx.flee) fx.kx += fx.flee * dt;
      if (fx.dissRate > 0) fx.diss = Math.min(1, fx.diss + fx.dissRate * dt);
      fx.tbv += (-150 * fx.tb - 13 * fx.tbv) * adt; fx.tb += fx.tbv * adt;
      fx.rv += (-170 * fx.roll - 12 * fx.rv) * adt; fx.roll += fx.rv * adt;
    }
    for (const a of allies) { a.p.t += adt; a.p.tintT = Math.max(0, a.p.tintT - dt); }
    hl.t -= dt;
    if (alive) raf = requestAnimationFrame(draw);
  }
  const bg = scenery(SCENES[opts.scene] || SCENES.grass);
  if (!fast) raf = requestAnimationFrame(draw);

  // ---------------------------------------------------------------- shared effect helpers
  const shakeScreen = (lv = 1) => { if (fast) return; root.classList.remove('hit', 'hit2'); void root.offsetWidth; root.classList.add(lv > 1 ? 'hit2' : 'hit'); };
  const flashBox = (a, cls) => { if (fast || !a.box) return; a.box.classList.remove('hurt', 'glow', 'mpglow', 'shine', 'psnfl', 'pinfl'); void a.box.offsetWidth; a.box.classList.add(cls); };
  const rnd = (n) => (Math.random() - 0.5) * n;
  const act = (a, A) => { a.p.act = A; a.p.t = 0; };
  const tint = (a, c, d) => { a.p.tint = c; a.p.tintT = d; };
  // where a dash at foe f ends, as an offset from ally a's home
  const dashTo = (a, f) => { const q = f.g; a.p.dx = Math.max(-150, Math.min(150, q.cx - (q.cx > a.g.hx ? 10 : -10) - a.g.hx)); a.p.dy = Math.min(0, q.foot + 10 - a.g.foot); };

  drawStat();
  au.play(opts.music || (isBoss ? (finalFight ? 'beasts' : 'boss') : 'battle'));
  if (!fast) { root.classList.add('enter'); await sleep(300); root.classList.remove('enter'); }
  {
    const lead = foes.find((f) => f.id === opts.lead) || foes[0], n = foes.length;
    if (isBoss) await say(lead.name + '擋在面前！', lead.name + ' stands in your way!');
    else if (n === 1) await say(lead.name + '出現了！', 'A ' + lead.name + ' appears!');
    else if (foes.every((f) => f.id === lead.id)) await say(t(lead.E) + '一共' + n + '隻出現了！', n + ' ' + t(lead.E) + 's appear!');
    else await say('一群敵人出現了！', 'A band of foes appears!');
  }

  // ---------------------------------------------------------------- blows
  async function impactFoe(f, d, how, src) {
    if (fast) return;
    const crit = how === 'crit', big = crit || how === 'big', qi = how === 'qi' || how === 'big';
    const q = f.g, x = q.cx + rnd(q.w * 0.3), y = q.cy + rnd(q.h * 0.3);
    au.sfx(crit ? 'crit' : qi ? 'boom' : 'hit');
    f.fx.white = big ? 0.11 : 0.065; stop = f.fx.white;
    add('star', big ? 0.32 : 0.24, { x, y, r: big ? 14 : 10, p: crit ? CRITSPARK : SPARK });
    burst(crit ? CRITSPARK : qi ? QI2 : SPARK, big ? 40 : 22, x, y, big ? 140 : 100, 0, 2, big ? 0.45 : 0.32, 120);
    burst(SCRAPS, big ? 16 : 9, x, y, big ? 95 : 70, 45, 1, 0.9, 70, 3);
    if (big) { scr = 0.05; scrC = 0x30; shakeScreen(2); }
    await sleep(big ? 100 : 60);
    const side = src && src.g ? Math.sign(q.cx - (src.g.hx ?? q.cx)) || 1 : 1;
    f.fx.kx = (crit ? 9 : 6) * side; f.fx.ky = -4; f.fx.shake = big ? 0.25 : 0.14;
    f.fx.tbv += big ? 12 : 7; f.fx.rv += (crit ? 3 : 2.2) * side;
    hurtTag(f, d, crit);
  }
  async function hurtFoe(f, d, how = 'hit', src = null) {
    if (d <= 0) { au.sfx(fast ? 'miss' : 'tink'); if (!fast) { add('star', 0.18, { x: f.g.cx + rnd(10), y: f.g.cy + rnd(10), r: 5, p: GREYS }); tagOver(f, '0'); } return say(f.name + '沒有受到傷害！', 'No damage to ' + f.name + '!'); }
    await impactFoe(f, d, how, src);
    f.hp = Math.max(0, f.hp - d);
    if (f.sleep && Math.random() < 0.4) f.sleep = 0;
    if (how === 'crit') await say('會心一擊！', 'A critical blow!', 250);
    await say(f.name + '受到' + d + '點傷害！', f.name + ' takes ' + d + ' damage!');
    if (f.hp <= 0) await foeDown(f);
  }
  let lastBeaten = null; const beaten = [];
  async function foeDown(f) {
    lastBeaten = f; beaten.push(f);
    if (!fast) {
      if (f.E.boss) {
        for (let i = 0; i < 6; i++) { const x = f.g.cx + rnd(f.g.w * 0.8), y = f.g.cy + rnd(f.g.h * 0.8); au.sfx('boom'); add('impact', 0.28, { x, y, r: 9 + Math.random() * 6, p: [0x27] }); burst(BOOM, 20, x, y, 80, 10, 2, 0.45, 80); f.fx.blink = 0.12; f.fx.shake = 0.2; if (i % 2 === 0) shakeScreen(2); await sleep(150); }
        au.sfx('die'); for (let i = 0; i < f.thr.length; i++) f.thr[i] = Math.random(); f.fx.dissRate = 1 / 1.0; await sleep(1000);
      } else { au.sfx('vanish'); f.fx.blink = 0.18; await sleep(180); au.sfx('die'); for (let i = 0; i < f.thr.length; i++) f.thr[i] = Math.random(); f.fx.dissRate = 1 / 0.42; await sleep(300); }
    } else au.sfx('die');
    await say('打倒了' + f.name + '！', f.name + ' is defeated!', 200);
  }
  async function impactAlly(a, d, crit, src) {
    const big = crit || d >= R.stat(a.m).maxHp / 4;
    au.sfx('hurt'); shakeScreen(big ? 2 : 1); flashBox(a, 'hurt');
    if (!fast) {
      const q = geo(a);
      if (a.guard > 1 || a.defend) { au.sfx('block'); act(a, 'block'); tint(a, 'gold', 0.24); add('star', 0.24, { x: q.x + 6, y: q.y - 8, r: 8, p: GOLD }); burst(GOLD, 10, q.x + 6, q.y - 8, 70); }
      else { act(a, big ? 'hurt2' : 'hurt'); tint(a, 'red', big ? 0.45 : 0.34); }
      stop = 0.06;
      burst(HURT, big ? 22 : 14, q.x, q.y, big ? 110 : 80, 0, 2, 0.32, 120); burst(SCRAPS, big ? 12 : 7, q.x, q.y - 4, 70, 40, 1, 0.9, 70, 3);
      if (crit) { scr = 0.07; scrC = 0x16; }
    }
    hurtTag(a, d, big);
  }
  async function hurtAlly(a, d, crit = false, src = null) {
    mark(a, 0.6);
    if (d <= 0) { au.sfx(fast ? 'miss' : 'block'); if (!fast) { act(a, 'block'); const q = geo(a); add('star', 0.2, { x: q.x + 6, y: q.y - 8, r: 6, p: GREYS }); tagOver(a, '0'); } return say(a.name + '沒有受傷！', a.name + ' is unhurt!'); }
    await impactAlly(a, d, crit, src);
    a.m.hp = Math.max(0, a.m.hp - d); drawStat();
    await say(a.name + '受到' + d + '點傷害！', a.name + ' takes ' + d + ' damage!');
    if (a.m.hp <= 0) await allyDown(a);
  }
  async function allyDown(a) {
    a.sleep = 0; a.sealed = false; a.cover = null; a.roar = false; a.faint = false;
    if (!fast) { act(a, 'ko'); au.sfx('fall'); await sleep(250); }
    a.p.act = 'down'; a.p.t = 0; drawStat();
    await say(a.name + '倒下了！', a.name + ' falls!', 300);
  }
  // the look of a foe's blow landing on ally a
  async function foeBlowFx(f, a, kind) {
    if (fast) return;
    const q = geo(a), mc = f.E.mc || QI, mx = f.g.cx - (f.g.cx - q.x) * 0.15, my = f.g.cy + 6;
    switch (kind) {
      case 'claw': au.sfx('claw'); add('claw', 0.34, { x: q.x - 21, y: q.top - 4, s: 0.62 }); await sleep(170); break;
      case 'bite': au.sfx('bite'); add('bite', 0.36, { x: q.x, y: q.y - 4, r: 20 }); await sleep(160); scr = 0.03; scrC = 0x06; break;
      case 'ram': au.sfx('blunt'); add('impact', 0.3, { x: q.x + 4, y: q.y - 2, r: 18, p: GOLD }); burst(DUST, 14, q.x, q.foot - 2, 70, 20, 2, 0.4, 120); await sleep(120); break;
      case 'blunt': au.sfx('blunt'); add('impact', 0.3, { x: q.x + rnd(6), y: q.y - 6 + rnd(6), r: 18, p: GOLD }); burst(GOLD, 12, q.x, q.y - 6, 90, 0, 2, 0.3); await sleep(120); break;
      case 'sting': au.sfx('sting'); for (let i = 0; i < 3; i++) add('sting', 0.14, { x: mx, y: my, x1: q.x - 6 + i * 6 + rnd(4), y1: q.y - 8 + rnd(10), p: [0x28, 0x38] }, i * 0.07); await sleep(220); break;
      case 'arrow': au.sfx('arrow'); add('arrow', 0.24, { x: mx, y: f.g.cy - 4, x1: q.x + 3, y1: q.y - 6, p: [0x17] }); await sleep(200); add('star', 0.22, { x: q.x + 3, y: q.y - 6, r: 9, p: SPARK }); burst(SPARK, 12, q.x + 3, q.y - 6, 90, 0, 2, 0.3); break;
      case 'magic': au.sfx('magic'); add('orb', 0.34, { x: mx, y: my, x1: q.x, y1: q.y - 4, r: 4, r1: 8, v: 0.4, p: mc }); await sleep(320); add('rings', 0.3, { x: q.x, y: q.y - 4, r: 3, r1: 22, p: mc }); burst(mc, 22, q.x, q.y - 4, 100, 0, 2, 0.4); break;
      case 'spore': au.sfx('bubble'); add('bubbles', 0.45, { x: q.x, y: q.foot, r: 18, v: 150, p: mc }); await sleep(260); break;
      default: au.sfx('slash'); { const l2r = Math.random() < 0.5; add('wslash', 0.3, { x: l2r ? q.x - 20 : q.x + 20, y: q.top - 6 + rnd(6), x1: l2r ? q.x + 18 : q.x - 18, y1: q.foot - 4, p: WSL }); } await sleep(130);
    }
  }
  // the look of a party member's blow on foe f (before the impact)
  async function allyBlowFx(a, f, how) {
    if (fast) return;
    const q = f.g, m = a.m, who = m.who;
    mark(f, 0.9);
    if (m.kind === 'mon') {   // a monster friend uses its own claws, jaws or magic
      const E = ENEMIES[who], k = E.atkFx; act(a, 'kick'); dashTo(a, f); await sleep(110);
      if (k === 'magic' || k === 'spore') { au.sfx(k === 'spore' ? 'bubble' : 'magic'); add('orb', 0.3, { x: a.g.hx, y: a.g.foot - 22, x1: q.cx, y1: q.cy, r: 3, r1: 6, v: 0.3, p: E.mc || QI }); await sleep(260); return; }
      if (k === 'bite') { au.sfx('bite'); add('bite', 0.32, { x: q.cx, y: q.cy, r: Math.min(24, q.w * 0.45) }); await sleep(150); return; }
      if (k === 'sting' || k === 'arrow') { au.sfx(k); add('sting', 0.16, { x: a.g.hx, y: a.g.foot - 24, x1: q.cx + rnd(8), y1: q.cy + rnd(8), p: [0x28, 0x38] }); await sleep(160); return; }
      if (k === 'blunt' || k === 'ram') { au.sfx('blunt'); add('impact', 0.26, { x: q.cx + rnd(6), y: q.cy + rnd(6), r: 16, p: GOLD }); await sleep(110); return; }
      if (k === 'claw') { au.sfx('claw'); add('claw', 0.3, { x: q.cx - 20, y: q.top + 4, s: Math.min(0.9, q.h / 80) }); await sleep(150); return; }
      au.sfx('slash'); add('wslash', 0.26, { x: q.cx + 18, y: q.top + 6, x1: q.cx - 16, y1: q.foot - 6, p: WSL }); await sleep(120); return;
    }
    if (who === 'yishuo') { act(a, 'kick'); dashTo(a, f); await sleep(120); au.sfx('dash'); add('ball', 0.3, { x: a.g.hx + 4, y: a.g.foot - 6, x1: q.cx, y1: q.cy, r: 4, r1: 3, p: BALL }); await sleep(260); return; }
    if (who === 'wenduizhang') { act(a, 'cast'); await sleep(120); au.sfx('magic'); add('orb', 0.3, { x: a.g.hx, y: a.g.foot - 30, x1: q.cx, y1: q.cy, r: 3, r1: 5, v: 0.3, p: INK }); await sleep(260); return; }
    // people with blades and clubs dash in and strike (奕叡 swings the saber he wears)
    dashTo(a, f);
    if (how === 'crit') { act(a, 'crit'); await sleep(160); au.sfx('dash'); await sleep(80); au.sfx('slash2'); add('arc', 0.3, { x: q.cx - 26, y: q.cy - 26, r: 40, a0: -0.55, a1: 2.05, s: 8, p: ARC_PAL.crit }); add('arc', 0.3, { x: q.cx + 26, y: q.cy - 26, r: 40, a0: PI + 0.55, a1: PI - 2.05, s: 8, p: ARC_PAL.crit }, 0.08); await sleep(130); return; }
    act(a, how === 'miss' ? 'miss' : 'atk'); await sleep(100); au.sfx('dash'); await sleep(95);
    if (how === 'miss') { au.sfx('whiff'); f.fx.dodge = 0.42; f.fx.ddir = 1; add('arc', 0.28, { x: q.cx - 36, y: q.cy - 26, r: 40, a0: -0.55, a1: 2.05, s: 4, p: ARC_PAL.whiff }); await sleep(150); return; }
    if (who === 'wudadan') { au.sfx('blunt'); add('impact', 0.3, { x: q.cx, y: q.cy, r: 20, p: GOLD }); await sleep(90); return; }
    if (who === 'suxiaowan') { au.sfx('whiff'); add('wslash', 0.28, { x: q.cx + 16, y: q.top + 4, x1: q.cx - 14, y1: q.foot - 8, p: [0x25, 0x35, 0x30] }); await sleep(110); return; }
    au.sfx('slash'); const v = Math.random() * 3 | 0;
    const ARCS = [[q.cx - 26, q.cy - 26, 40, -0.55, 2.05], [q.cx + 26, q.cy - 26, 40, PI + 0.55, PI - 2.05], [q.cx, q.cy + 38, 42, PI + 0.4, TAU - 0.4]][v];
    add('arc', 0.3, { x: ARCS[0], y: ARCS[1], r: ARCS[2], a0: ARCS[3], a1: ARCS[4], s: 7, p: ARC_PAL.cut }); await sleep(95);
  }

  // ---------------------------------------------------------------- choosing targets
  // a foe's target among the party: someone roaring draws the blow; a coverer takes it for the covered
  const randomOf = (list) => list[Math.floor(Math.random() * list.length)];
  function foeTarget(f, smart = false) {
    let list = liveAllies().filter((a) => !a.faint); if (!list.length) list = liveAllies(); if (!list.length) return null;
    const roar = list.find((a) => a.roar && !a.sleep); if (roar && Math.random() < 0.8) return roar;
    let t2 = smart && Math.random() < 0.5 ? list.slice().sort((x, y) => x.m.hp - y.m.hp)[0] : randomOf(list);
    return t2;
  }
  const coverFor = (a) => { const c = allies.find((b) => b.cover === a && uAlive(b) && !b.sleep && b !== a); return c || a; };
  const retargetFoe = (t2) => (t2 && uAlive(t2) ? t2 : randomOf(liveFoes()));

  // ---------------------------------------------------------------- party actions
  async function allyAttack(a, f, mul = 1, opt = {}) {
    f = retargetFoe(f); if (!f) return;
    const m = a.m, atk = atkOf(a) * mul;
    if (!opt.noCrit && Math.random() < R.critOf(m)) { await allyBlowFx(a, f, 'crit'); return hurtFoe(f, R.critDamage(atk), 'crit', a); }
    if (Math.random() < R.dodgeChance(f.agi * (f.sleep ? 0 : 1), R.stat(m).agi) || (opt.acc && Math.random() > opt.acc)) { await allyBlowFx(a, f, 'miss'); if (!fast) tagOver(f, t(['落空', 'MISS'])); return say(f.name + '閃開了！', f.name + ' dodges!'); }
    await allyBlowFx(a, f, 'hit');
    const def = f.def * f.guard * (1 - (opt.pierce || 0));
    return hurtFoe(f, R.physDamage(atk, def), mul > 1.6 ? 'big' : 'hit', a);
  }
  async function useArt(u, k, target) {
    const S = SKILLS[k], foeSide = u.side === 'foe';
    const nm = (foeSide && u.E.skName && u.E.skName[k]) ? u.E.skName[k] : [S.zh, S.en];
    if (foeSide) u.mp = Math.max(0, u.mp - (S.mp || 0)); else { u.m.mp -= S.mp; drawStat(); }
    const enemies = foeSide ? liveAllies : liveFoes, friends = foeSide ? liveFoes : liveAllies;
    if (!foeSide && !fast && /heal|revive|cure|guard|cheer|roar|sleepall|seal/.test(S.kind)) act(u, 'cast');
    if (foeSide && !fast && /hurt|sleep|seal|hit/.test(S.kind)) { u.fx.lunge = 0.36; const tq = target && target.side === 'ally' ? geo(target) : { x: SW / 2, foot: 132 }; u.fx.lx = (tq.x - u.g.cx) * 0.18; u.fx.ly = 4; }
    await say(u.name + '使出了「' + nm[0] + '」！', u.name + ' uses ' + nm[1] + '!', 320);
    switch (S.kind) {
      case 'heal': case 'healall': {
        const list = S.kind === 'heal' ? [target && uAlive(target) ? target : u] : friends();
        for (const x of list) await healUnit(x, R.skillRoll(k), k === 'heal3' || k === 'healall2' ? 'big' : 'hp');
        return;
      }
      case 'revive': {
        let x = target; if (!x || uAlive(x)) x = (foeSide ? foes.find((q) => !uAlive(q) && !q.fled && !q.E.boss) : allies.find((q) => !uAlive(q)));
        if (!x) return say('但是沒有效果。', 'But nothing happens.');
        if (foeSide) { x.hp = Math.round(x.maxHp * S.frac); x.fx.dissRate = 0; x.fx.diss = 0; x.fx.alpha = 1; beaten.splice(beaten.indexOf(x), 1); au.sfx('chime'); return say(x.name + '又站了起來！', x.name + ' gets up again!'); }
        x.m.hp = Math.max(1, Math.round(R.stat(x.m).maxHp * S.frac)); x.p.act = ''; au.sfx('chime'); drawStat();
        if (!fast) { const q = geo(x); add('rise', 0.8, { x: q.x, y: q.foot, r: 16, v: 110, s: 2, p: GOLD }); act(x, 'hop'); tint(x, 'gold', 0.6); }
        return say(x.name + '醒過來了！', x.name + ' comes round!');
      }
      case 'cure': { const x = target && uAlive(target) ? target : u; if (x.side === 'ally') { x.m.poison = false; drawStat(); if (!fast) { const q = geo(x); add('rise', 0.5, { x: q.x, y: q.foot, r: 14, v: 70, p: PURPLE }); tint(x, 'purple', 0.4); } } au.sfx('heal'); return say(x.name + '的毒解了。', x.name + ' is cured.'); }
      case 'hurt': case 'hurtall': {
        const list = S.kind === 'hurt' ? [target && uAlive(target) ? target : randomOf(enemies())].filter(Boolean) : enemies();
        if (S.kind === 'hurtall' && !fast) await artFxAll(u, k, list); else if (list[0]) await artFx(u, k, list[0]);
        for (const x of list) {
          if (!uAlive(x)) continue;
          const v = R.skillRoll(k);
          if (x.side === 'foe') await hurtFoe(x, v, S.lo >= 50 ? 'big' : 'qi', u);
          else { const c = coverFor(x); await hurtAlly(c, v, false, u); if (S.poison && c.m.hp > 0 && !c.m.poison && Math.random() < S.poison * (1 - R.resist(c.m, 'rpsn'))) { c.m.poison = true; drawStat(); poisonFx(c); await say(c.name + '中毒了！', c.name + ' is poisoned!'); } }
          if (!liveFoes().length || !liveAllies().length) break;
        }
        return;
      }
      case 'hit': case 'hitall': {
        const list = S.kind === 'hit' ? [target] : enemies();
        for (const x of list) {
          for (let i = 0; i < (S.n || 1); i++) {
            const tx = x && uAlive(x) ? x : (S.kind === 'hit' ? randomOf(enemies()) : null); if (!tx) break;
            if (foeSide) await foeAttack(u, tx, S.mul, { pierce: S.pierce, acc: S.acc, art: true });
            else await allyAttack(u, tx, S.mul, { pierce: S.pierce, acc: S.acc, noCrit: S.kind === 'hitall' });
            if (!liveFoes().length || !liveAllies().length) return;
          }
        }
        return;
      }
      case 'sleep': case 'sleepall': {
        const list = S.kind === 'sleep' ? [target && uAlive(target) ? target : randomOf(enemies())].filter(Boolean) : enemies();
        for (const x of list) {
          if (!fast) { const q = geo(x); for (let i = 0; i < 3; i++) add('pt', 0.5 - i * 0.06, { x: q.x + rnd(q.w * 0.5), y: q.y + rnd(q.h * 0.4) }, i * 0.07); au.sfx('point'); await sleep(140); }
          const ch = S.kind === 'sleep' ? 0.8 : 0.55;
          const resisted = x.side === 'foe' ? Math.random() > ch * (1 - x.res * 0.9) : Math.random() > ch * 0.85 * (1 - R.resist(x.m, 'rpin'));
          if (resisted) { au.sfx('miss'); await say(x.name + '沒有受到影響。', x.name + ' is unaffected.', 300); continue; }
          x.sleep = 1; au.sfx('zz'); if (x.side === 'ally') { flashBox(x, 'pinfl'); drawStat(); } else x.fx.blink = 0.12;
          await say(x.name + '動彈不得了！', x.name + ' is frozen!', 300);
        }
        return;
      }
      case 'seal': {
        const x = target && uAlive(target) ? target : randomOf(enemies()); if (!x) return;
        if (!fast) { au.sfx('sealfx'); const q = geo(x); add('sealbox', 0.5, { x: q.x, y: q.y, r: Math.round(Math.min(q.w, q.h) * 0.42) }); await sleep(420); }
        const resisted = x.side === 'foe' ? Math.random() > 1 - x.res * 0.9 : Math.random() > 0.6 * (1 - R.resist(x.m, 'rseal'));
        if (resisted) { au.sfx('miss'); return say('但是沒有效果。', 'But it has no effect.'); }
        x.sealed = true; au.sfx('skill'); if (x.side === 'ally') drawStat();
        return say(x.name + '的經脈被封住了！', x.name + '\'s meridians are sealed!');
      }
      case 'guard': case 'guardall': {
        const list = S.kind === 'guard' ? [u] : friends();
        au.sfx(fast ? 'heal' : 'shield');
        for (const x of list) {
          x.guard = Math.max(x.guard, S.kind === 'guard' ? 1.5 : 1.3);
          if (!fast) { const q = geo(x); add('rings', 0.6, { x: q.x, y: q.y, r: 5, r1: Math.max(q.w, q.h) * 0.6, p: GOLD }); if (x.side === 'ally') { tint(x, 'gold', 0.6); flashBox(x, 'shine'); } else x.fx.blink = 0.2; }
        }
        drawStat();
        return say(S.kind === 'guard' ? u.name + '的防禦提高了！' : '全隊的防禦提高了！', S.kind === 'guard' ? u.name + '\'s defence rises!' : 'Everyone\'s defence rises!');
      }
      case 'cover': { const x = target && uAlive(target) && target !== u ? target : null; if (!x) return say('但是沒有人需要掩護。', 'But no one needs covering.'); u.cover = x; au.sfx('shield'); return say(u.name + '擋在' + x.name + '前面！', u.name + ' stands in front of ' + x.name + '!'); }
      case 'roar': { u.roar = true; au.sfx('boom'); shakeScreen(1); if (u.side === 'foe') { u.fx.shake = 0.3; return say(u.name + '怒吼一聲！', u.name + ' roars!'); } return say('敵人的目光都被' + u.name + '吸引過去了！', 'Every foe turns on ' + u.name + '!'); }
      case 'faint': { u.faint = true; const v = Math.round(R.stat(u.m).maxHp * 0.12); u.m.hp = Math.min(R.stat(u.m).maxHp, u.m.hp + v); drawStat(); if (!fast) { act(u, 'ko'); setTimeout(() => { if (u.p.act === 'ko') u.p.act = ''; }, 900); } au.sfx('fall'); return say(u.name + '「啊——」地一聲倒在地上，一動也不動……（回復了' + v + '點體力）', u.name + ' cries "Aaah!" and drops dead... or so it seems. (+' + v + ' HP)'); }
      case 'cheer': { for (const x of friends()) x.cheer = Math.max(x.cheer, 1.25); au.sfx('skill'); if (!fast) for (const x of friends()) { const q = geo(x); add('rise', 0.5, { x: q.x, y: q.foot, r: 12, v: 60, p: GOLD }); } return say('全隊士氣大振，攻擊力提高了！', 'The party\'s spirits soar: attack up!'); }
      case 'steal': {
        const x = target && uAlive(target) ? target : randomOf(enemies()); if (!x) return;
        if (!fast) { act(u, 'kick'); dashTo(u, x); await sleep(240); }
        const got = (x.E.drop || []).find(([, p]) => Math.random() < Math.min(0.6, p * 3));
        if (got && !x.stolen && R.canAdd(inv, got[0])) { x.stolen = true; R.addItem(inv, got[0]); au.sfx('drop'); return say(u.name + '從' + x.name + '身上撿到了' + ITEMS[got[0]].zh + '！', u.name + ' picks a ' + ITEMS[got[0]].en + ' off ' + x.name + '!'); }
        au.sfx('miss'); return say('什麼也沒撿到。', 'Nothing to pick up.');
      }
    }
  }
  async function artFx(u, k, x) {
    if (fast) return;
    const S = SKILLS[k], q = geo(x), from = u.side === 'foe' ? { x: u.g.cx, y: u.g.cy } : { x: u.g.hx, y: u.g.foot - 30 };
    const pal = u.side === 'foe' ? (u.E.mc || QI) : S.fx === 'fire' ? FIRE : S.fx === 'ink' ? INK : S.fx === 'mist' ? MIST : QI;
    if (S.fx === 'beam') { au.sfx('charge'); add('rise', 0.3, { x: from.x, y: from.y + 30, r: 16, v: 90, p: QI2 }); await sleep(160); au.sfx('beam'); add('beam', 0.46, { x: q.x, y1: q.y + q.h * 0.3, p: QI2 }); await sleep(300); return; }
    if (S.fx === 'ball') return;
    au.sfx('charge'); add('orb', 0.38, { x: from.x, y: from.y, x1: q.x, y1: q.y, r: 4, r1: 7, v: 0.42, p: pal }); await sleep(360);
    au.sfx(S.fx === 'fire' ? 'fire' : 'release'); add('rings', 0.3, { x: q.x, y: q.y, r: 3, r1: 22, p: pal }); burst(pal, 26, q.x, q.y, 110, 0, 2, 0.4);
  }
  async function artFxAll(u, k, list) {
    const S = SKILLS[k], pal = u.side === 'foe' ? (u.E.mc || QI) : S.fx === 'fire' ? FIRE2 : S.fx === 'ink' ? INK : S.fx === 'mist' ? MIST : QI2;
    if (S.fx === 'bolt') { au.sfx('charge'); await sleep(150); au.sfx('thunder'); for (const x of list) { const q = geo(x); add('bolt', 0.4, { x1: q.x + rnd(6), y1: q.y + 6, p: [0x28] }); } scr = 0.05; scrC = 0x30; await sleep(300); return; }
    if (S.fx === 'mist') { au.sfx('bubble'); for (const x of list) { const q = geo(x); add('bubbles', 0.55, { x: q.x, y: q.foot, r: 16, v: 120, p: pal }); } await sleep(400); return; }
    if (S.fx === 'ball') return;
    au.sfx('charge'); for (const x of list) { const q = geo(x); add('rise', 0.4, { x: q.x, y: q.foot, r: 14, v: 70, p: pal }); } await sleep(260);
    au.sfx(S.fx === 'fire' ? 'fire' : 'release'); for (const x of list) { const q = geo(x); add('rings', 0.3, { x: q.x, y: q.y, r: 3, r1: 20, p: pal }); burst(pal, 18, q.x, q.y, 100, 0, 2, 0.4); } scr = 0.04; scrC = pal[1]; await sleep(160);
  }
  async function healUnit(x, v, kind = 'hp') {
    if (!uAlive(x)) return;
    if (x.side === 'foe') { const b = x.hp; x.hp = Math.min(x.maxHp, x.hp + v); au.sfx('chime'); if (!fast) { add('rise', 0.6, { x: x.g.cx, y: x.g.foot, r: x.g.w * 0.45, v: 110, p: GREEN }); x.fx.blink = 0.15; tagOver(x, '+' + (x.hp - b), 0x2A); } return say(x.name + '回復了' + (x.hp - b) + '點體力。', x.name + ' recovers ' + (x.hp - b) + ' HP.'); }
    const mx = R.stat(x.m).maxHp, b = x.m.hp; x.m.hp = Math.min(mx, x.m.hp + v); drawStat();
    if (!fast) { const q = geo(x); au.sfx('chime'); add('rise', kind === 'big' ? 0.8 : 0.6, { x: q.x, y: q.foot, r: 16, v: kind === 'big' ? 110 : 80, s: 2, p: GREEN }); act(x, 'hop'); tint(x, 'green', 0.5); flashBox(x, 'glow'); tagOver(x, '+' + (x.m.hp - b), 0x2A); }
    else au.sfx('heal');
    return say(x.name + '回復了' + (x.m.hp - b) + '點體力。', x.name + ' recovers ' + (x.m.hp - b) + ' HP.');
  }
  function poisonFx(a) { if (fast) { au.sfx('poison'); return; } au.sfx('bubble'); const q = geo(a); add('bubbles', 0.4, { x: q.x, y: q.foot, r: 16, v: 90, p: PURPLE }); tint(a, 'purple', 0.4); flashBox(a, 'psnfl'); }
  async function useItem(a, id, target) {
    const it = ITEMS[id]; R.removeItem(inv, id);
    await say(a.name + '使用了' + it.zh + '。', a.name + ' uses the ' + it.en + '.', 300);
    if (it.bun && target && target.side === 'foe') {   // thrown to a creature: it eats, and warms to you
      const f = retargetFoe(target); if (!f) return;
      if (!fast) { add('ball', 0.3, { x: a.g.hx, y: a.g.foot - 20, x1: f.g.cx, y1: f.g.cy, r: 3, r1: 3, p: [0x37, 0x27, 0x30] }); await sleep(300); add('heart', 0.9, { x: f.g.cx, y: f.g.top + 8 }); }
      if (!SPECIES[f.id] || f.E.boss) { au.sfx('miss'); return say(f.name + '看都不看一眼。', f.name + ' ignores it.'); }
      f.heart += it.bun; f.eating = Math.random() < 0.5 ? 1 : 0; au.sfx('chime');
      return say(f.name + '吃得津津有味，看你們的眼神溫和了些。', f.name + ' gobbles it up and looks at you more kindly.');
    }
    const x = target || a;
    if (it.revive) { if (uAlive(x)) return say('但是沒有效果。', 'But nothing happens.'); x.m.hp = Math.max(1, Math.round(R.stat(x.m).maxHp * it.revive)); x.p.act = ''; drawStat(); au.sfx('chime'); if (!fast) { act(x, 'hop'); tint(x, 'gold', 0.5); } return say(x.name + '醒過來了！', x.name + ' comes round!'); }
    if (!uAlive(x)) return say('但是沒有效果。', 'But nothing happens.');
    if (it.heal) return healUnit(x, R.rand(it.heal[0], it.heal[1]), it.heal[0] > 100 ? 'big' : 'hp');
    if (it.mp) { const mx = R.stat(x.m).maxMp, b = x.m.mp; x.m.mp = Math.min(mx, x.m.mp + it.mp); drawStat(); au.sfx('heal'); if (!fast) { const q = geo(x); add('rise', 0.6, { x: q.x, y: q.foot, r: 16, v: 80, s: 2, p: BLUE }); tint(x, 'blue', 0.5); flashBox(x, 'mpglow'); } return say(x.name + '的內力回復了' + (x.m.mp - b) + '點。', x.name + ' recovers ' + (x.m.mp - b) + ' MP.'); }
    if (it.cure) { x.m.poison = false; drawStat(); au.sfx('heal'); if (!fast) { const q = geo(x); add('rise', 0.5, { x: q.x, y: q.foot, r: 14, v: 70, p: PURPLE }); } return say(x.name + '的毒解了。', x.name + ' is cured.'); }
  }
  // ---------------------------------------------------------------- foe actions
  async function foeAttack(f, a, mul = 1, opt = {}) {
    if (!a || !uAlive(a)) a = foeTarget(f); if (!a) return;
    const tgt = coverFor(a);
    mark(tgt, 1.0);
    if (!fast) { f.fx.lunge = 0.36; const q = geo(tgt); f.fx.lx = Math.max(-40, Math.min(40, (q.x - f.g.cx) * 0.2)); f.fx.ly = 5; }
    if (!opt.art) await say(f.name + '攻擊！', f.name + ' attacks!', 220);
    if (tgt !== a) await say(tgt.name + '替' + a.name + '擋下了！', tgt.name + ' takes it for ' + a.name + '!', 220);
    const dodge = R.dodgeChance(agiOf(tgt) * (tgt.sleep ? 0 : 1), f.agi) + R.evaOf(tgt.m);
    if (Math.random() < dodge || (opt.acc && Math.random() > opt.acc)) {
      au.sfx(fast ? 'miss' : 'whiff');
      if (!fast) { act(tgt, 'dodge'); const q = geo(tgt); add('wslash', 0.26, { x: q.x + 18, y: q.top - 4, x1: q.x + 2, y1: q.foot - 2, p: WHIFF }); tagOver(tgt, t(['落空', 'MISS'])); }
      return say(tgt.name + '閃開了！', tgt.name + ' dodges!');
    }
    const crit = !opt.art && Math.random() < R.CRIT;
    await foeBlowFx(f, tgt, f.E.atkFx);
    if (crit) { if (!fast) { scr = 0.06; scrC = 0x30; } au.sfx('crit'); await say('致命的一擊！', 'A deadly blow!', 200); }
    const d = crit ? R.critDamage(f.atk * mul) : R.physDamage(f.atk * mul, defOf(tgt) * (1 - (opt.pierce || 0)));
    await hurtAlly(tgt, d, crit, f);
    if (f.E.poison && tgt.m.hp > 0 && !tgt.m.poison && Math.random() < f.E.poison * (1 - R.resist(tgt.m, 'rpsn'))) { tgt.m.poison = true; poisonFx(tgt); drawStat(); await say(tgt.name + '中毒了！', tgt.name + ' is poisoned!'); }
  }
  async function foeSalve(f) {
    f.items--; const v = R.rand(32, 40) + Math.round(f.maxHp * 0.08); au.sfx('heal');
    await say(f.name + '吃下了金創藥。', f.name + ' eats a wound salve.', 250);
    return healUnit(f, v);
  }
  // the foe's choice: the same options a careful player has
  async function foeTurn(f) {
    if (!uAlive(f)) return;
    if (f.sleep) { if (Math.random() < 0.34) { f.sleep = 0; return say(f.name + '的穴道解開了。', f.name + ' breaks free.'); } return say(f.name + '動彈不得。', f.name + ' cannot move.'); }
    if (f.eating) { f.eating = 0; return say(f.name + '還在嚼著吃的……', f.name + ' is still munching...'); }
    const E = f.E;
    // run from a far stronger party (and the toads simply run)
    const pAtk = Math.max(...liveAllies().map(atkOf));
    if ((!E.boss && E.role !== 'man' && pAtk >= E.atk * 2.4 && Math.random() < 0.15) || (E.flee && Math.random() < E.flee)) {
      f.fled = true; au.sfx('run'); if (!fast) { f.fx.flee = 420; burst(DUST, 10, f.g.cx, f.g.foot - 2, 40, 10, 2, 0.35); await sleep(200); } f.fx.alpha = 0; f.fx.flee = 0;
      return say(f.name + '逃走了。', f.name + ' runs away.');
    }
    const usable = (E.sk || []).filter(([k]) => !f.sealed && (SKILLS[k].mp || 0) <= f.mp);
    const has = (k) => usable.find((x) => x[0] === k);
    const low = f.hp < f.maxHp * 0.35, mates = liveFoes();
    const hurtMate = mates.find((q) => q.hp < q.maxHp * 0.4);
    if (E.boss) {
      // a boss reads the fight: heal itself or its escorts, guard, pin the strongest, seal the casters, hit all
      const healAll = has('healall2') || has('healall');
      if (healAll && mates.filter((q) => q.hp < q.maxHp * 0.5).length >= 2 && Math.random() < 0.6) return useArt(f, healAll[0], null);
      const heal = has('heal3') || has('heal2') || has('heal');
      if (low && heal && Math.random() < 0.65) return useArt(f, heal[0], f);
      if (hurtMate && hurtMate !== f && heal && Math.random() < 0.35) return useArt(f, heal[0], hurtMate);
      if (low && f.items > 0 && Math.random() < 0.6) return foeSalve(f);
      if (has('guard') && f.guard === 1 && Math.random() < 0.4) return useArt(f, 'guard', f);
      if (has('roar') && !f.roar && mates.length > 1 && Math.random() < 0.3) return useArt(f, 'roar', f);
      const casters = liveAllies().filter((a) => !a.sealed && R.known(a.m).some((k) => /heal|hurt/.test(SKILLS[k].kind)));
      if ((has('seal') || has('sealall')) && casters.length && Math.random() < 0.35) return useArt(f, has('seal') ? 'seal' : 'sealall', casters.sort((x, y) => R.stat(y.m).maxMp - R.stat(x.m).maxMp)[0]);
      const slp = has('sleepall') || has('mistall');
      if (slp && liveAllies().filter((a) => !a.sleep).length >= 3 && Math.random() < slp[1]) return useArt(f, slp[0], null);
      if (has('sleep') && Math.random() < has('sleep')[1]) { const tg = liveAllies().filter((a) => !a.sleep).sort((x, y) => atkOf(y) - atkOf(x))[0]; if (tg) return useArt(f, 'sleep', tg); }
      for (const [k, p] of usable) { const K = SKILLS[k].kind; if ((K === 'hurt' || K === 'hurtall' || K === 'hit' || K === 'hitall') && Math.random() < p) return useArt(f, k, foeTarget(f, true)); }
      return foeAttack(f, foeTarget(f, true));
    }
    if (low && f.items > 0 && Math.random() < 0.5) return foeSalve(f);
    for (const [k, p] of usable) {
      const S = SKILLS[k];
      if (S.kind === 'heal' && !hurtMate) continue; if (S.kind === 'healall' && !hurtMate) continue; if (S.kind === 'guard' && f.guard > 1) continue; if (S.kind === 'roar' && (f.roar || mates.length < 2)) continue;
      if (Math.random() < p) return useArt(f, k, S.kind === 'heal' ? hurtMate : foeTarget(f));
    }
    return foeAttack(f, foeTarget(f));
  }

  // ---------------------------------------------------------------- the party's commands
  const artsOf = (a) => R.known(a.m).filter((k) => SKILLS[k].battle);
  const MON = (a) => a.m.kind === 'mon';
  async function pickTarget(kind, a, title) {
    // kind: one (foe) | ally | fallen | foe+ally (food)
    let list = [];
    if (kind === 'one') list = liveFoes().map((f) => ({ u: f, label: f.name, sub: '' }));
    else if (kind === 'ally') list = liveAllies().map((x) => ({ u: x, label: x.name, sub: `${x.m.hp}/${R.stat(x.m).maxHp}` }));
    else if (kind === 'fallen') list = allies.filter((x) => !uAlive(x)).map((x) => ({ u: x, label: x.name, sub: t(['倒下', 'down']) }));
    else if (kind === 'food') list = liveFoes().map((f) => ({ u: f, label: f.name, sub: t(['丟給牠', 'throw']) })).concat(liveAllies().map((x) => ({ u: x, label: x.name, sub: t(['吃', 'eat']) })));
    if (!list.length) return null;
    if (list.length === 1 && kind === 'one') return list[0].u;
    const i = await ui.choose(list.map((x) => ({ label: x.label, sub: x.sub })), { cls: 'bsub btgt', title, ctx: 'btarget', onMove: (j) => mark(list[j].u, 0.6) });
    return i >= 0 ? list[i].u : null;
  }
  async function command(a, first) {
    actBox(a);
    if (ui.driver && ui.driver.battle) return ui.driver.battle({ a, allies, foes, first, inv, uAlive, artsOf, isBoss });
    for (;;) {
      const opts = [STR.attack, MON(a) ? ['絕技', 'Skills'] : STR.skill, STR.item, ['防禦', 'Defend']];
      if (first && !opts.includes(STR.run)) opts.push(STR.run);
      const c = await ui.choose(opts.map((o, i) => ({ label: o, disabled: i === 2 && MON(a) })), { cls: 'bcmd', cols: 2, cancel: !first, ctx: 'battle', title: a.name });
      if (c < 0) return 'back';
      if (c === 0) { const tg = await pickTarget('one', a, STR.attack); if (tg) return { k: 'attack', t: tg }; continue; }
      if (c === 1) {
        const ks = artsOf(a);
        if (!ks.length) { await say(a.name + '還沒有學會' + (MON(a) ? '絕技' : '武功') + '。', a.name + ' knows no arts yet.', 300); continue; }
        if (a.sealed) { await say(a.name + '的經脈被封住了！', a.name + '\'s meridians are sealed!', 300); continue; }
        const i = await ui.choose(ks.map((k) => ({ label: SKILLS[k], sub: SKILLS[k].mp + '', disabled: a.m.mp < SKILLS[k].mp })), { cls: 'bsub', title: MON(a) ? ['絕技', 'Skills'] : STR.skill, ctx: 'bskill', keys: ks });
        if (i < 0) continue;
        const k = ks[i], tk = SKILLS[k].target;
        let tg = null;
        if (tk === 'one') tg = await pickTarget('one', a, SKILLS[k]);
        else if (tk === 'ally') tg = await pickTarget('ally', a, SKILLS[k]);
        else if (tk === 'fallen') { tg = await pickTarget('fallen', a, SKILLS[k]); if (!tg) { await say('沒有倒下的同伴。', 'No one is down.', 300); continue; } }
        if ((tk === 'one' || tk === 'ally') && !tg) continue;
        if (SKILLS[k].kind === 'cover' && tg === a) { await say('不能掩護自己。', 'You cannot cover yourself.', 300); continue; }
        return { k: 'art', v: k, t: tg };
      }
      if (c === 2) {
        const its = inv.bag.filter((b) => ITEMS[b.id].battle);
        if (!its.length) { await say('沒有可以用的道具。', 'Nothing to use.', 300); continue; }
        const i = await ui.choose(its.map((b) => ({ label: ITEMS[b.id], sub: '×' + b.n })), { cls: 'bsub', title: STR.item, ctx: 'bitem', keys: its.map((b) => b.id) });
        if (i < 0) continue;
        const id = its[i].id, it = ITEMS[id];
        const tg = await pickTarget(it.bun ? 'food' : it.revive ? 'fallen' : 'ally', a, it);
        if (!tg) { if (it.revive) await say('沒有倒下的同伴。', 'No one is down.', 300); continue; }
        return { k: 'item', v: id, t: tg };
      }
      if (c === 3) return { k: 'defend' };
      if (c === 4) return { k: 'run' };
    }
  }
  async function allyTurn(a, cmd) {
    if (!uAlive(a)) return;
    actBox(a);
    if (a.sleep) { if (Math.random() < 0.5) { a.sleep = 0; drawStat(); await say(a.name + '衝開了穴道！', a.name + ' breaks free!'); } else return say(a.name + '動彈不得……', a.name + ' cannot move...'); }
    if (cmd.k === 'attack') return allyAttack(a, cmd.t);
    if (cmd.k === 'defend') return;
    if (cmd.k === 'art') {
      const S = SKILLS[cmd.v];
      if (a.sealed) return say(a.name + '的經脈被封住了，使不出' + S.zh + '！', a.name + ' is sealed and cannot use ' + S.en + '!');
      if (a.m.mp < S.mp) return say(a.name + '的內力不夠了！', a.name + ' lacks the MP!');
      let tg = cmd.t;
      if (S.target === 'one') tg = retargetFoe(tg);
      if (S.target === 'ally' && (!tg || !uAlive(tg))) tg = liveAllies().sort((x, y) => x.m.hp / R.stat(x.m).maxHp - y.m.hp / R.stat(y.m).maxHp)[0];
      return useArt(a, cmd.v, tg);
    }
    if (cmd.k === 'item') { if (!R.count(inv, cmd.v)) return say('道具已經用完了。', 'None left.'); return useItem(a, cmd.v, cmd.t); }
  }

  // ---------------------------------------------------------------- the round loop
  let result = null;
  // ambush: quick foes may strike first (never in a boss fight)
  if (!isBoss && Math.random() < Math.max(0, (Math.max(...foes.map((f) => f.agi)) - Math.max(...allies.map((a) => agiOf(a)))) / 140)) {
    await say('敵人搶先出手！', 'The foes strike first!');
    for (const f of foes) { await foeTurn(f); if (!liveAllies().length) break; }
  }
  if (!liveAllies().length) result = 'lose';
  while (!result) {
    // every member's command (B goes back to the previous member)
    const cmds = new Map(); const ready = allies.filter((a) => uAlive(a) && !a.sleep);
    let run = false;
    for (let i = 0; i < ready.length;) {
      const a = ready[i], c = await command(a, i === 0);
      if (c === 'back') { if (i > 0) { i--; cmds.delete(ready[i]); } continue; }
      if (c.k === 'run') { run = true; break; }
      cmds.set(a, c); i++;
    }
    actBox(null);
    for (const [a, c] of cmds) if (c.k === 'defend') a.defend = true;
    if (run) {
      await say(t(allies[0].m.kind === 'mon' ? ['大家', 'Everyone'] : ['大家', 'Everyone']) + t(['轉身就跑……', ' turns to run...']), 'Everyone turns to run...', 300);
      const myAgi = Math.max(...liveAllies().map(agiOf)), foeAgi = Math.max(...liveFoes().map((f) => f.sleep ? 0 : f.agi));
      if (isBoss || opts.noRun) { await say('但是被擋住了！', 'But the way is blocked!'); }
      else if (Math.random() < R.runChance(myAgi, foeAgi)) { au.sfx('run'); result = 'run'; break; }
      else await say('但是沒能逃掉！', 'But could not escape!');
      for (const f of liveFoes()) { await foeTurn(f); if (!liveAllies().length) break; }
    } else {
      // everyone acts by agility, with luck (defending happens at once)
      const queue = [];
      for (const [a, c] of cmds) queue.push({ u: a, c, s: c.k === 'defend' ? 1e9 : agiOf(a) * (0.6 + Math.random() * 0.5) });
      for (const a of allies) if (uAlive(a) && a.sleep && !cmds.has(a)) queue.push({ u: a, c: { k: 'wait' }, s: agiOf(a) * 0.5 });
      for (const f of liveFoes()) queue.push({ u: f, c: null, s: f.agi * (0.6 + Math.random() * 0.5) });
      queue.sort((x, y) => y.s - x.s);
      for (const q of queue) {
        if (!liveFoes().length || !liveAllies().length) break;
        if (q.c && q.c.k === 'defend') continue;
        if (q.u.side === 'ally') await allyTurn(q.u, q.c); else await foeTurn(q.u);
      }
    }
    // the end of a round: poison bites, one-round stances end
    for (const a of allies) {
      if (uAlive(a) && a.m.poison && liveFoes().length) { const d = Math.max(1, Math.floor(R.stat(a.m).maxHp / 16)); a.m.hp = Math.max(1, a.m.hp - d); poisonFx(a); hurtTag(a, d, false); drawStat(); await say(a.name + '毒性發作，失去' + d + '點體力。', a.name + ': poison -' + d + ' HP.', 260); }
      a.defend = false; a.cover = null; a.roar = false; a.faint = false;
    }
    for (const f of foes) f.roar = false;
    drawStat();
    if (!liveFoes().length) result = beaten.length ? 'win' : 'fled';
    else if (!liveAllies().length) result = 'lose';
  }

  // ---------------------------------------------------------------- the end
  let recruited = null;
  if (result === 'win') {
    if (!fast) for (const a of liveAllies()) act(a, 'hop');
    au.stop(); if (!finalFight) await au.jingle('j_win');
    const xp = beaten.reduce((s, f) => s + f.E.xp, 0), gold = beaten.reduce((s, f) => s + f.E.gold, 0);
    inv.gold += gold;
    if (xp || gold) await say('獲得 ' + xp + ' 點經驗，' + gold + ' 兩銀子。', 'Gained ' + xp + ' XP and ' + gold + ' gold.');
    // what they leave behind: a paper tag pops up where each stood, and the line names it
    for (const f of beaten) for (const id of R.rollDrops(f.E)) {
      const it = ITEMS[id], got = (G.stats.got = G.stats.got || {}); (got[f.id] = got[f.id] || {})[id] = 1;
      au.sfx('drop'); pop(t(it), 0x28, f.g.cx, f.g.cy - 8, 1);
      if (R.canAdd(inv, id)) { R.addItem(inv, id); await say(f.name + '掉落了' + it.zh + '！', f.name + ' dropped ' + it.en + '!', 520); }
      else { await say(f.name + '掉落了' + it.zh + '，可是行囊滿了。', f.name + ' dropped ' + it.en + ', but your pack is full.', 420); await G.makeRoom(id); }
    }
    for (const a of liveAllies()) {
      const ups = R.gainXp(a.m, xp);
      for (const u of ups) {
        await au.jingle('j_level');
        await say(a.name + '升到了第' + u.lv + '級！', a.name + ' reached level ' + u.lv + '!', 300);
        const g = u.gains; await say(`${t(['體力', 'HP'])}+${g.hp} ${t(['內力', 'MP'])}+${g.mp} ${t(['力量', 'Str'])}+${g.str} ${t(['身法', 'Agi'])}+${g.agi} ${t(['根骨', 'Def'])}+${g.def}`, '', 300);
        for (const k of u.arts) await say(a.name + '領悟了' + (MON(a) ? '絕技' : '武功') + '「' + SKILLS[k].zh + '」！', a.name + ' learned ' + SKILLS[k].en + '!', 400);
      }
    }
    drawStat();
    // 魔物加入: the last foe beaten may get up and ask to come along
    const f = lastBeaten;
    if (f && opts.recruit !== false && SPECIES[f.id] && !f.E.boss && G.canRecruit(f.id)) {
      const S = SPECIES[f.id];
      const chm = Math.min(0.9, G.party.reduce((s, m) => s + R.gear(m, 'chm'), 0) + (G.has('amulet') ? 0.3 : 0));
      const chance = Math.min(0.95, S.rate * (1 + f.heart * 0.8) * (1 + chm) * (G.recruitBoost || 1));
      if (Math.random() < chance) {
        if (!fast) {
          f.fx.diss = 0; f.fx.dissRate = 0; f.fx.alpha = 1; f.fx.blink = 0.3; f.fx.rise = T - 0.32; au.sfx('chime');
          for (let i = 0; i < 3; i++) add('heart', 1.0, { x: f.g.cx + rnd(f.g.w * 0.6), y: f.g.top + 10 }, i * 0.25);
        }
        await say(f.name + '慢慢地爬了起來……', f.name + ' slowly gets up...', 600);
        await say('牠用期待的眼神望著你們。好像想加入隊伍！', 'It looks at you hopefully. It seems to want to join you!', 300);
        recruited = f.id;
      }
    }
    await waitA();
  } else if (result === 'lose') {
    au.stop(); await say('大家都倒下了……', 'Everyone has fallen...', 400); await au.jingle('j_over'); await waitA();
  } else if (result === 'run') { await say('順利逃脫了！', 'Got away safely!', 300); }
  else if (result === 'fled') { await say('敵人都逃走了。', 'The foes have all run off.', 300); }
  if (recruited) { root.classList.add('recruit'); await G.recruit(recruited); root.classList.remove('recruit'); }
  alive = false; cancelAnimationFrame(raf);
  if (!fast) { root.classList.add('leave'); await sleep(250); root.classList.remove('leave'); }
  root.classList.add('hidden'); root.innerHTML = '';
  G.stats.battles++;
  if (result === 'win') { G.stats.wins++; const k = (G.stats.kills = G.stats.kills || {}); for (const f of beaten) k[f.id] = (k[f.id] || 0) + 1; }
  // one-battle stances never outlive the battle
  return result;
}
