// The game: where the party is, walking on tile maps (the leader in front, the others following in a line), the
// ship, people and their scripts, chests, doors, encounters, recruiting monsters, the camp, menus, inns, shops,
// saving and the story's turning points. The view only draws what this holds.
import { MAPS, PLACES, TILES, L, TOWNS } from './maps.js?v=4';
import { WORLD, WORLD_W, WORLD_H, PLACE_AT, ZONE, SHIP_START } from './world_map.js?v=4';
import { ITEMS, SKILLS, SHOPS, ENEMIES, ZONES, ENCOUNTER, RARE, RARE_CHANCE, MONEY_FOES, ART_OF, SLOTS, SLOT_NAME, isGear, GEAR_FX, BAG_MAX, CHARS, SPECIES, PET_NAMES, MROLE_NAME, JIA_STOCK, XP_FOR } from './data.js?v=4';
import { dress, dressView, dressPortrait, sheetCanvas, portraitCanvas, paint } from './doll.js?v=4';
import { NES, spr } from './tiles.js?v=4';
import { registerSheet } from './view.js?v=4';
import { dieCut } from './paper.js?v=4';
import { PEOPLE, CAST } from './people_art.js?v=4';
import { ENEMY_ART, ENEMY_INFO } from './enemy_art.js?v=4';
import * as R from './rules.js?v=4';
import { battle, ENEMY_IMG } from './battle.js?v=4';
import { t, STR, getLang, setLang, nameOf } from './ui.js?v=4';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const SAVE_KEYS = ['lq2_slot1', 'lq2_slot2', 'lq2_slot3'];
const AUTO = 'lq2_auto';
const SAVE_V = 1;
const MAX_ACTIVE = 4, MAX_CAMP = 40, SAME_KIND = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// how a person or creature looks on the map: frames into a sheet ([x, y, w, h, flip, sheetKey, legs])
export function lookOf(s) {
  if (CAST[s]) {
    const C = CAST[s], k = 'cast_' + s, row = (r) => [[0, r * 24, 16, 24, 0, k], [0, r * 24, 16, 24, 0, k, { x: 16, y: r * 24, rows: 5 }]];
    const look = { sheet: k, frames: { down: row(C.rows.walk ?? 1), side: row(C.rows.walk_side ?? 2), up: row(C.rows.walk_up ?? C.rows.walk ?? 1) } };
    if (C.rows.walk_up != null) look.frames.up = [[0, C.rows.walk_up * 24, 16, 24, 0, k], [16, C.rows.walk_up * 24, 16, 24, 0, k]];
    const back = PEOPLE[s + '_back']; if (back) look.frames.up = back.map((f) => [f.x, f.y, f.w, f.h, 0, 'npcs']);
    return look;
  }
  if (PEOPLE[s] && !Array.isArray(PEOPLE[s])) { const f = PEOPLE[s]; const a = [[f.x, f.y, f.w, f.h, 0], [f.x, f.y, f.w, f.h, 0, null, { x: f.x, y: f.y, rows: 4, mirror: true }]]; return { sheet: 'npcs', frames: { down: a, side: a, up: a } }; }
  const A = (ENEMIES[s] && ENEMY_ART[ART_OF(s)]) || ENEMY_ART[s];
  if (A && A.f) { const [x, y, w, h] = A.f; const a = [[x, y, w, h, 0], [x + w, y, w, h, 0]]; return { sheet: 'enemies', cw: w, ch: h, scale: s.startsWith('bx_') || s.startsWith('b_') || s.startsWith('g_') ? 1.5 : 1, frames: { down: a, side: a, up: a } }; }
  if (A) { const a = [[A.x, A.y, A.w, A.h, 0], [A.x, A.y, A.w, A.h, 0]]; return { sheet: 'enemies', cw: Math.ceil(A.w / 8) * 8, ch: A.h, frames: { down: a, side: a, up: a } }; }
  return lookOf('man');
}
const memberLook = (m) => (m.kind === 'mon' ? lookOf(m.who) : m.who === 'yirui' ? heroLook() : lookOf(m.who));
// 奕叡 as the paper doll dresses him: his frames in the 'doll' sheet (walk frames x down/side/up)
const heroLook = () => { const r = (y) => [[0, y, 16, 24, 0, 'doll'], [16, y, 16, 24, 0, 'doll']]; return { sheet: 'doll', frames: { down: r(0), side: r(24), up: r(48) } }; };
// the ship: a junk on its own little sheet
let shipSheet = null;
const shipLook = () => { if (!shipSheet) { shipSheet = spr('junk'); registerSheet('junk', shipSheet); } const w = shipSheet.width, h = shipSheet.height, a = [[0, 0, w, h, 0], [0, 0, w, h, 0]]; return { sheet: 'junk', cw: w, ch: h, scale: 1.6, frames: { down: a, side: a, up: a } }; };

// what each person brings when they join: their own weapon and clothes
const STARTER = { yirui: { w: 'w0', a: 'a0' }, yishuo: { w: 'b1', a: 'a0' }, wudadan: { w: 'k1', a: 'a6', bt: 'bt1' }, wenduizhang: { w: 'p2', a: 'a1', hd: 'hd2' },
  suxiaowan: { w: 'f2', a: 'a1', pd: 'pd2' }, chutiankuo: { w: 'w12', a: 'a4', hd: 'hd4', c: 'c4', bt: 'bt4' } };

export class Game {
  constructor({ view, ui, input, audio }) {
    this.view = view; this.ui = ui; this.input = input; this.audio = audio;
    this.busy = 0; this.fast = false; this.mode = 'title'; this.npcs = []; this.anim = 0;
    this.stats = { battles: 0, wins: 0, steps: 0, deaths: 0, time: 0 };
    this.party = []; this.camp = []; this.inv = { gold: 0, bag: [] }; this.flags = {};
  }
  // ---------------------------------------------------------------- state
  newGame() {
    R.setUid(1);
    const yr = R.newMember('yirui', 1, STARTER.yirui), ys = R.newMember('yishuo', 1, STARTER.yishuo);
    R.fullHeal(yr); R.fullHeal(ys);
    this.party = [yr, ys]; this.camp = [];
    this.inv = { gold: 80, bag: [{ id: 'herb', n: 3 }, { id: 'bun', n: 3 }] };
    this.flags = {}; this.open = {}; this.ward = 0; this.ship = null; this.onShip = false;
    this.map = 'longmen'; this.x = 15; this.y = 7; this.dir = 'down'; this.lastSave = { map: 'longmen', x: 15, y: 4 };
    this.stats = { battles: 0, wins: 0, steps: 0, deaths: 0, time: 0, got: {}, seen: {}, kills: {}, recruited: {} }; this.encCool = 6; this.dollSig = null;
    this.trail = [];
  }
  get hero() { return this.party.find((m) => m.who === 'yirui') || this.party[0]; }
  memberOf(who) { return this.party.find((m) => m.who === who) || this.camp.find((m) => m.who === who); }
  // ---------------------------------------------------------------- the paper doll (奕叡 only)
  looksOf(over) { const h = this.hero, Lk = {}; for (const s of SLOTS) { const id = over && s in over ? over[s] : h[s]; Lk[s] = id && ITEMS[id] && ITEMS[id].look ? ITEMS[id].look : null; } return Lk; }
  dressUp() {
    const h = this.hero; if (!h || typeof document === 'undefined') return;
    const sig = SLOTS.map((s) => h[s] || '').join(','); if (sig === this.dollSig) return;
    this.dollSig = sig; this.dollImgs = null;
    const looks = this.looksOf();
    this.dollSheet = sheetCanvas(dress(looks), NES, this.dollSheet); registerSheet('doll', this.dollSheet);
    try { this.ui.por.yirui = portraitCanvas(dressPortrait(looks), NES).toDataURL(); } catch (e) {}
    if (this.heroA && this.party[0] && this.party[0].who === 'yirui') this.heroA.relook(heroLook());
    for (const [i, a] of (this.followA || []).entries()) if (a && this.party[i + 1] && this.party[i + 1].who === 'yirui') a.relook(heroLook());
  }
  wear(m, id) { R.equip(this.inv, m, id); if (m.who === 'yirui') this.dressUp(); }
  dollPics(over) {
    if (!over && this.dollImgs) return this.dollImgs;
    const looks = this.looksOf(over), out = {};
    for (const v of ['down', 'side', 'up']) { const c = document.createElement('canvas'); c.width = 16; c.height = 24; paint(c.getContext('2d'), dressView(v, 0, looks), 16, 24, NES); out[v] = dieCut(c, 1, 2, 2, '#fffaf0', '#a89a80').toDataURL(); }
    if (!over) this.dollImgs = out; return out;
  }
  async makeRoom(id) {
    const inv = this.inv, it = ITEMS[id];
    const tossable = inv.bag.filter((b) => ITEMS[b.id].kind !== 'key');
    const opts = [{ label: ['不要了', 'Leave it'], sub: t(it) }].concat(tossable.map((b) => ({ label: ITEMS[b.id], sub: '×' + b.n })));
    const i = await this.ui.choose(opts, { title: L('行囊滿了：丟掉什麼？', 'Pack full: drop what?'), ctx: 'room', cls: 'shoplist' });
    if (i <= 0) { await this.ui.say(null, L(it.zh + '只好留下了。', 'You leave the ' + it.en + ' behind.')); return false; }
    const b = tossable[i - 1]; inv.bag.splice(inv.bag.indexOf(b), 1); R.addItem(inv, id);
    await this.ui.say(null, L('丟掉了' + ITEMS[b.id].zh + '，收下了' + it.zh + '。', 'You drop the ' + ITEMS[b.id].en + ' and take the ' + it.en + '.'));
    return true;
  }
  serialize() { return JSON.stringify({ v: SAVE_V, party: this.party, camp: this.camp, inv: this.inv, flags: this.flags, open: this.open, map: this.map, x: this.x, y: this.y, dir: this.dir, lastSave: this.lastSave, stats: this.stats, ward: this.ward, ship: this.ship, onShip: this.onShip, when: Date.now() }); }
  load(json) {
    const d = JSON.parse(json); this.dollSig = null;
    Object.assign(this, { party: d.party, camp: d.camp || [], inv: d.inv, flags: d.flags || {}, open: d.open || {}, map: d.map, x: d.x, y: d.y, dir: d.dir || 'down', lastSave: d.lastSave, stats: d.stats || this.stats, ward: d.ward || 0, ship: d.ship || null, onShip: !!d.onShip });
    for (const k of ['seen', 'kills', 'got', 'recruited']) this.stats[k] = this.stats[k] || {};
    for (const m of [...this.party, ...this.camp]) { for (const s of SLOTS) if (!(s in m)) m[s] = null; m.learned = m.learned || []; }
    this.inv.bag = (this.inv.bag || []).filter((b) => ITEMS[b.id]);
    R.setUid(Math.max(0, ...this.party.map((m) => m.uid), ...this.camp.map((m) => m.uid)) + 1);
    this.encCool = 4; this.trail = [];
  }
  autosave() { if (this.mode !== 'field' && this.mode !== 'menu') return; try { localStorage.setItem(AUTO, this.serialize()); } catch (e) {} }
  saveSlot(i) { try { localStorage.setItem(SAVE_KEYS[i], this.serialize()); localStorage.setItem(AUTO, this.serialize()); return true; } catch (e) { return false; } }
  static slotInfo(i) { try { const s = localStorage.getItem(i === 'auto' ? AUTO : SAVE_KEYS[i]); if (!s) return null; const d = JSON.parse(s); const h = (d.party || []).find((m) => m.who === 'yirui') || d.party[0]; return { lv: h.lv, map: d.map, when: d.when, raw: s, chap: d.flags && chapterOf(d.flags) }; } catch (e) { return null; } }
  isOpen(k) { return !!this.open[this.map + ':' + k]; }
  setOpenKey(k) { this.open[this.map + ':' + k] = 1; }
  has(id) { return R.count(this.inv, id) > 0; }
  get M() { return this.map === 'world' ? null : MAPS[this.map]; }
  get gold() { return this.inv.gold; }

  // ---------------------------------------------------------------- tiles and walking
  tile(x, y) {
    if (this.map === 'world') { if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return '~'; return WORLD[y][x]; }
    const M = this.M; if (y < 0 || y >= M.h || x < 0 || x >= M.w) return null; const c = M.rows[y][x]; return /[A-Z]/.test(c) ? (M.floor || '.') : c;
  }
  worldOpen() { return { X: !!this.flags.bridge, H: !!this.flags.chain, K: !!this.flags.icewall }; }
  shipAt(x, y) { return this.ship && this.ship.x === x && this.ship.y === y; }
  passable(x, y) {
    const c = this.tile(x, y);
    if (this.map === 'world') {
      if (this.onShip) {   // at sea: water (and the lowered chain); stepping on land goes ashore
        if (c === '~') return true;
        if (c === 'H') return !!this.flags.chain;
        return !'MNVK'.includes(c) && c !== 'X';
      }
      if (c === '~' || c === 'H') return this.shipAt(x, y);
      if (c === 'M' || c === 'N' || c === 'V') return false;
      if (c === 'X') return !!this.flags.bridge;
      if (c === 'K') return !!this.flags.icewall;
      return true;
    }
    if (c === null) return !!this.exitsToWorld();
    if (c === ' ') return false;
    if (c === 'd' || c === 'g') return this.isOpen(x + ',' + y);
    const T = TILES[c]; if (T && T.solid) return false;
    if (this.npcAt(x, y)) return false;
    return true;
  }
  exitsToWorld() { const M = this.M; return M && M.place && PLACES[M.place].map === this.map; }
  npcAt(x, y) { return this.npcs.find((n) => n.x === x && n.y === y && !n.hidden); }

  // ---------------------------------------------------------------- entering places
  async enterMap(id, x, y, dir) {
    this.map = id; const M = MAPS[id]; this.onShip = false;
    if (x == null) { [x, y] = M.start || this.findDigit(M, '1'); dir = 'up'; }
    this.x = x; this.y = y; this.dir = dir || this.dir; this.moving = null;
    this.trail = [];
    this.spawnPeople();
    if (this.view) { this.view.buildMap(M, { isOpen: (k) => this.isOpen(k), lantern: this.has('lantern') }); this.setupActors(); }
    this.audio.play(M.music || 'dungeon');
    this.ui.banner2(M.name);
    this.autosave();
    if (M.onEnter) await this.run(() => M.onEnter(this.scripts()));
  }
  async enterWorld(x, y) {
    this.map = 'world'; this.x = x; this.y = y; this.dir = 'down'; this.moving = null; this.npcs = []; this.trail = [];
    if (!this.ship && this.flags.ship) this.ship = { x: SHIP_START[0], y: SHIP_START[1] };
    if (this.view) { const pl = {}; for (const [k, [px, py]] of Object.entries(PLACE_AT)) pl[k] = [px, py, PLACES[k].look]; this.view.buildWorld(WORLD, pl, this.worldOpen()); this.setupActors(); }
    this.audio.play(this.onShip ? 'sea' : 'field');
    this.autosave();
  }
  findDigit(M, d) { for (let y = 0; y < M.h; y++) { const x = M.rows[y].indexOf(d); if (x >= 0) return [x, y]; } return [1, 1]; }
  spawnPeople() {
    const M = this.M; this.npcs = [];
    const add = (key, x, y) => {
      const def = M.people && M.people[key]; if (!def) return;
      if (def.flag && !this.flag(def.flag)) return; if (def.notFlag && this.flag(def.notFlag)) return;
      if (def.when && !def.when(this)) return;
      this.npcs.push({ key, def, s: typeof def.s === 'function' ? def.s(this) : def.s, x, y, hx: x, hy: y, dir: 'down', walk: !!def.walk, t: Math.random() * 3, mv: null });
    };
    M.rows.forEach((r, y) => [...r].forEach((c, x) => { if (/[A-Z]/.test(c)) add(c, x, y); }));
    for (const [k, x, y] of M.extra || []) add(k, x, y);
    if (M.boss && !this.flag(M.boss.flag) && (!M.boss.need || this.flag(M.boss.need))) {
      const [bx, by] = this.findDigit(M, 'z');
      this.npcs.push({ key: 'boss', boss: M.boss, s: M.boss.s || M.boss.art || ART_OF(M.boss.id), x: bx, y: by, hx: bx, hy: by, dir: 'down', walk: false, t: 0 });
    }
    for (const b of M.beasts || []) if (!this.flag(b.flag)) this.npcs.push({ key: 'beast_' + b.id, boss: b, beast: 1, s: b.s || ENEMIES[b.id].art || b.id, x: b.x, y: b.y, hx: b.x, hy: b.y, dir: 'down', walk: false, t: 0 });
    // the camp: the monsters resting there wander their pens
    if (M.pens) {
      const spots = []; M.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === M.pens) spots.push([x, y]); }));
      this.camp.filter((m) => m.kind === 'mon').slice(0, spots.length).forEach((m, i) => {
        const [x, y] = spots[i]; this.npcs.push({ key: 'pet' + m.uid, pet: m, s: m.who, x, y, hx: x, hy: y, dir: 'down', walk: true, t: Math.random() * 3, mv: null, def: { say: (S) => this.petTalk(m) } });
      });
    }
  }
  flag(f) { return f.split('|').some((x) => (x[0] === '!' ? !this.flags[x.slice(1)] : !!this.flags[x])); }
  setupActors() {
    const v = this.view; this.dressUp();
    this.heroA = v.actor('hero', this.onShip ? shipLook() : memberLook(this.party[0]));
    this.followA = [];
    for (let i = 1; i < this.party.length; i++) { const a = v.actor('f' + i, memberLook(this.party[i])); a.visible(!this.onShip); this.followA.push(a); }
    this.shipA = this.map === 'world' && this.ship && !this.onShip ? v.actor('ship', shipLook()) : null;
    for (const n of this.npcs) n.actor = v.actor('npc' + n.key + n.x + n.y, lookOf(n.s));
    v.camReady = false;
  }
  // the party changed (someone joined, left or swapped places): new followers on the map
  refreshParty() {
    if (!this.view || !this.heroA) return;
    for (let i = 1; i < 8; i++) this.view.drop('f' + i);
    this.view.drop('hero');
    this.heroA = this.view.actor('hero', this.onShip ? shipLook() : memberLook(this.party[0]));
    this.followA = [];
    for (let i = 1; i < this.party.length; i++) { const a = this.view.actor('f' + i, memberLook(this.party[i])); a.visible(!this.onShip); this.followA.push(a); }
    this.dollSig = null; this.dressUp();
  }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.stats.time += dt; this.anim += dt;
    if (this.mode !== 'field') return this.draw(dt);
    if (this.moving) {
      const m = this.moving; m.t += dt / m.dur;
      if (m.t >= 1) { this.moving = null; this.afterStep(); }
    } else if (!this.busy) {
      const d = this.input.dir();
      if (d) this.tryMove(d);
    }
    for (const n of this.npcs) {
      if (n.mv) { n.mv.t += dt / 0.3; if (n.mv.t >= 1) n.mv = null; continue; }
      if (!n.walk || this.busy) continue;
      n.t -= dt; if (n.t > 0) continue; n.t = 1.5 + Math.random() * 2.5;
      const ds = Object.keys(DIRS), d = ds[Math.floor(Math.random() * 4)], [dx, dy] = DIRS[d], nx = n.x + dx, ny = n.y + dy;
      n.dir = d;
      if (Math.abs(nx - n.hx) > 2 || Math.abs(ny - n.hy) > 2) continue;
      const c = this.tile(nx, ny); if (c == null || (TILES[c] && TILES[c].solid) || /[1-9cdg]/.test(c)) continue;
      if (this.npcAt(nx, ny) || (nx === this.x && ny === this.y) || (this.moving && nx === this.moving.tx && ny === this.moving.ty) || this.trail.some((p) => p.x === nx && p.y === ny)) continue;
      n.mv = { fx: n.x, fy: n.y, t: 0 }; n.x = nx; n.y = ny;
    }
    this.draw(dt);
  }
  tryMove(d) {
    this.dir = d; const [dx, dy] = DIRS[d], nx = this.x + dx, ny = this.y + dy;
    if (!this.passable(nx, ny)) { if (!this.bumpT || this.anim - this.bumpT > 0.3) { this.audio.sfx('bump'); this.bumpT = this.anim; } this.worldGateHint(nx, ny); return false; }
    const dur = this.fast ? 0.0001 : (this.map === 'world' ? (this.onShip ? 0.16 : 0.2) : 0.17);
    this.moving = { fx: this.x, fy: this.y, tx: nx, ty: ny, t: 0, dur };
    this.pushTrail();
    this.x = nx; this.y = ny; return true;
  }
  pushTrail() {
    this.trailPrev = this.trail.map((p) => ({ ...p }));
    const n = Math.max(0, this.party.length - 1);
    while (this.trail.length < n) this.trail.push({ x: this.x, y: this.y });
    this.trail.unshift({ x: this.x, y: this.y }); this.trail.length = n;
    while (this.trailPrev.length < n) this.trailPrev.push(this.trail[this.trailPrev.length]);
  }
  worldGateHint(nx, ny) {
    if (this.map !== 'world' || this.busy) return; const c = this.tile(nx, ny);
    const msg = c === 'X' ? L('橋斷了，只剩幾根木樁立在急流裡。', 'The bridge is broken: only a few posts stand in the rushing water.')
      : c === 'H' ? L('一條粗大的鐵鍊攔住了港口。', 'A thick iron chain bars the harbour mouth.')
        : c === 'K' ? L('一道冰牆擋住了山路，冷得刺骨。', 'A wall of ice blocks the mountain path, bitterly cold.')
          : (c === '~' && !this.onShip) ? null : null;
    if (msg && this.hintAt !== nx + ',' + ny) { this.hintAt = nx + ',' + ny; this.run(async () => { await this.ui.say(null, msg); }); }
  }
  async run(fn) { this.busy++; try { return await fn(); } finally { this.busy--; } }

  async afterStep() {
    this.stats.steps++; this.hintAt = null;
    await this.run(async () => {
      const c = this.tile(this.x, this.y);
      if (this.map !== 'world' && c === null) { const P = PLACE_AT[this.M.place]; this.audio.sfx('stairs'); await this.turnOut(); await this.enterWorld(P[0], P[1]); await this.turnIn(); return; }
      // the ship: boarding from the shore, landing from the sea
      if (this.map === 'world') {
        if (!this.onShip && this.shipAt(this.x, this.y)) { this.onShip = true; this.ship = null; this.audio.sfx('door'); this.refreshShip(); this.audio.play('sea'); return; }
        if (this.onShip && c !== '~' && c !== 'H') { const p = this.moving ? null : null; this.onShip = false; this.ship = { x: this.prevX, y: this.prevY }; this.refreshShip(); this.audio.play('field'); }
      }
      this.prevX = this.x; this.prevY = this.y;
      for (const m of this.party) if (m.hp > 0 && m.poison) { m.hp = Math.max(1, m.hp - 1); this.flashRed(); }
      for (const m of this.party) { const rg = R.gear(m, 'regen'); if (rg) { m.regenAcc = (m.regenAcc || 0) + rg; while (m.regenAcc >= 10) { m.regenAcc -= 10; m.mp = Math.min(R.stat(m).maxMp, m.mp + 1); } } }
      if (this.map === 'world' && c === 'w') { for (const m of this.party) if (m.hp > 0) m.hp = Math.max(1, m.hp - 1); this.flashRed(); }
      if (this.ward > 0) { this.ward--; if (this.ward === 0) await this.ui.say(null, L('驅邪的效力消失了。', 'The ward fades.')); }
      if (this.map === 'world') {
        if (!this.onShip) for (const [pid, [px, py]] of Object.entries(PLACE_AT)) if (px === this.x && py === this.y) return this.enterPlace(pid);
      } else {
        if (/[1-9]/.test(c) && this.M.links && this.M.links[c]) {
          const [to, d] = this.M.links[c]; const T = MAPS[to];
          if (T.dark && !this.has('lantern') && !MAPS[this.map].dark) { await this.ui.say(null, L('前面一片漆黑，伸手不見五指。沒有燈籠是走不下去的。', 'Ahead is pitch black. Without a lantern you cannot go on.')); return; }
          if (T.need && !this.flag(T.need[0])) { await this.ui.say(null, T.need[1]); return; }
          this.audio.sfx('stairs'); await this.turnOut(); const [tx, ty] = this.findDigit(T, String(d)); await this.enterMap(to, tx, ty, this.dir); await this.turnIn(); return;
        }
        const st = this.M.steps && this.M.steps[this.x + ',' + this.y];
        if (st && (!st.flag || !this.flag(st.flag))) { if (st.flag) this.flags[st.flag] = 1; await st.fn(this.scripts()); }
      }
      await this.encounter(c);
    });
  }
  refreshShip() {
    if (!this.view) return;
    this.view.drop('ship'); this.shipA = null;
    if (this.ship) { this.shipA = this.view.actor('ship', shipLook()); }
    this.view.drop('hero'); this.heroA = this.view.actor('hero', this.onShip ? shipLook() : memberLook(this.party[0]));
    for (const a of this.followA || []) { a.visible(!this.onShip); a.shown = undefined; }
    this.trail = [];
  }
  async enterPlace(pid) {
    const P = PLACES[pid], M = MAPS[P.map];
    if (M.dark && !this.has('lantern')) { await this.ui.say(null, L('裡面一片漆黑，伸手不見五指。沒有燈籠是進不去的。', 'It is pitch black inside. You cannot go in without a lantern.')); return; }
    if (P.need && !this.flag(P.need[0])) { await this.ui.say(null, P.need[1]); return; }
    this.audio.sfx('stairs'); await this.turnOut(); await this.enterMap(P.map); await this.turnIn();
  }

  // ---------------------------------------------------------------- random encounters
  zoneHere(c) {
    if (this.map !== 'world') return this.M.enc;
    const z = ZONE[this.y][this.x]; return z === 'a' ? 's1' : z === 'b' ? 's2' : z;
  }
  formation(key) {
    const Z = ZONES[key]; if (!Z) return null;
    if (RARE[key] && Math.random() < RARE_CHANCE) return [RARE[key]];
    let r = Math.random(), n = 1; for (let i = 0; i < Z.n.length; i++) { if (r < Z.n[i]) { n = i + 1; break; } r -= Z.n[i]; n = i + 2; }
    n = Math.min(4, Math.max(1, n));
    const pick = () => { let id = Z.pool[Math.floor(Math.random() * Z.pool.length)]; if (MONEY_FOES.includes(id) && Math.random() < 0.7) id = Z.pool[0]; return id; };
    const first = pick(); if (MONEY_FOES.includes(first)) return [first];
    const out = [first]; const same = Math.random() < 0.6;
    for (let i = 1; i < n; i++) { let id = same ? first : pick(); if (MONEY_FOES.includes(id)) id = first; out.push(id); }
    return out;
  }
  async encounter(c) {
    let rate = 0, scene = 'grass';
    if (this.map === 'world') { rate = this.onShip ? ENCOUNTER['~'] : (ENCOUNTER[c] ?? 1 / 20); scene = this.onShip ? 'sea' : ({ f: 'forest', h: 'hill', s: 'sand', w: 'swamp', n: 'snow', b: 'bamboo' }[c] || 'grass'); }
    else { const M = this.M; if (!M.enc) return; rate = M.rate || 1 / 16; scene = M.scene || { forest: 'forest', fort: 'fort', sea: 'sea', tower: 'tower', tomb: 'tomb', ice: 'ice', lair: 'lair', cave: 'cave', snowpeak: 'snow', mansion: 'mansion', temple: 'temple', bamboo: 'bamboo', swamp: 'swamp', volcano: 'volcano', pagoda: 'bell' }[M.theme] || 'cave'; }
    if (this.encCool > 0) { this.encCool--; return; }
    if (this.noEnc || Math.random() >= rate) return;
    const ids = this.formation(this.zoneHere(c)); if (!ids) return;
    if (this.ward > 0) { const minDef = Math.min(...this.party.filter((m) => m.hp > 0).map(R.defOf)); if (ids.every((id) => ENEMIES[id].atk < minDef * 1.2)) return; }
    this.encCool = 3;
    await this.fight(ids, { scene });
  }
  async fight(ids, opts = {}) {
    this.audio.sfx('encounter'); this.mode = 'battle';
    if (this.view && !this.fast) { for (let i = 0; i < 6; i++) { this.view.flash(i % 2 ? 0.6 : 0); await sleep(45); } this.view.flash(0); }
    const r = await battle(this, ids, opts);
    this.mode = 'field';
    if (r === 'lose') { if (opts.loseOk) { for (const m of this.party) if (m.hp <= 0) m.hp = 1; this.audio.play(this.map === 'world' ? 'field' : (this.M.music || 'dungeon')); return 'lose'; } await this.die(); return 'lose'; }
    this.audio.play(this.map === 'world' ? (this.onShip ? 'sea' : 'field') : (this.M.music || 'dungeon'));
    return r;
  }
  async die() {
    this.stats.deaths++;
    for (const m of [...this.party, ...this.camp]) R.fullHeal(m);
    this.inv.gold = Math.floor(this.inv.gold / 2); this.ward = 0; this.onShip = false;
    if (this.flags.ship && (!this.ship || this.ship.lost)) this.ship = { x: SHIP_START[0], y: SHIP_START[1] };
    await this.turnOut();
    const ls = this.lastSave; await this.enterMap(ls.map, ls.x, ls.y, 'up');
    await this.turnIn();
    await this.ui.say(null, L('……醒來時，已經回到了最後記錄的地方。銀兩丟了一半，人都還在，就好。', '...You wake where you last rested. Half your silver is gone, but everyone is alive.'));
  }

  // ---------------------------------------------------------------- monsters that join
  canRecruit(id) {
    const all = [...this.party, ...this.camp];
    if (this.party.length >= MAX_ACTIVE && !this.flags.campOpen) return false;
    if (all.length >= MAX_ACTIVE + MAX_CAMP) return false;
    return all.filter((m) => m.who === id).length < SAME_KIND;
  }
  async recruit(id) {
    const ui = this.ui, E = ENEMIES[id], S = SPECIES[id];
    if (!(await ui.yesno(L('要讓' + E.zh + '加入嗎？', 'Let the ' + E.en + ' join you?')))) { await ui.say(null, L(E.zh + '失望地垂下頭，慢慢走開了。', 'The ' + E.en + ' hangs its head and wanders off.')); return; }
    const m = R.newMember(id, Math.max(1, S.lv - 1));
    m.name = await this.pickName(m);
    this.stats.recruited[id] = (this.stats.recruited[id] || 0) + 1;
    await this.audio.jingle('j_join');
    const nm = R.nameOf(m, getLang());
    if (this.party.length < MAX_ACTIVE) { this.party.push(m); this.refreshParty(); await ui.say(null, L(nm + '加入了隊伍！', nm + ' joins the party!')); }
    else { this.camp.push(m); await ui.say(null, L(nm + '加入了！隊伍滿了，牠會自己跑到百獸山寨去等你們。', nm + ' joins! The party is full, so it trots off to the Hundred Beasts Camp to wait for you.')); }
    if (!this.flags.firstPet) { this.flags.firstPet = 1; await ui.say(null, L('（加入的妖物會跟著你們一起戰鬥、升級，到一定等級會學會絕技。項圈和佩飾可以給牠們戴。）', '(Creatures that join fight beside you, level up and learn skills. They can wear collars and pendants.)')); }
  }
  async pickName(m) {
    const E = ENEMIES[m.who], ui = this.ui;
    const pool = PET_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const opts = [{ label: [E.zh, E.en], sub: t(['原名', 'as is']) }].concat(pool.map((n) => ({ label: n }))).concat([{ label: ['自己取名', 'Type a name'] }]);
    const i = await ui.choose(opts, { title: L('給牠取個名字吧', 'Give it a name'), ctx: 'petname', cls: 'shoplist' });
    if (i <= 0) return null;
    if (i <= pool.length) return { zh: pool[i - 1][0], en: pool[i - 1][1] };
    let s = null; try { s = window.prompt(t(['名字（最多六個字）', 'Name (up to 8 letters)']), ''); } catch (e) {}
    s = (s || '').trim().slice(0, 8);
    return s || null;
  }
  async petTalk(m) {
    const nm = R.nameOf(m, getLang()), E = ENEMIES[m.who];
    const lines = [[nm + '開心地蹭了蹭你。', nm + ' nuzzles you happily.'], [nm + '正在曬太陽，懶洋洋地看了你一眼。', nm + ' is sunning itself and gives you a lazy look.'], [nm + '叼來一根樹枝，想跟你玩。', nm + ' brings you a stick to play with.'], [nm + '偷偷吃了牛飽飽的肉包。', nm + ' has secretly eaten one of Niu Baobao\'s buns.']];
    await this.ui.say(null, L(...lines[(m.uid + Math.floor(this.anim)) % lines.length]));
    await this.ui.say(null, L(`（${nm}　${E.zh}　等級${m.lv}　體力${m.hp}/${R.stat(m).maxHp}）`, `(${nm}, ${E.en}, Lv ${m.lv}, HP ${m.hp}/${R.stat(m).maxHp})`));
  }
  // a person joins the story party (at a level near the party's)
  async join(who, lv = 1) {
    if (this.memberOf(who)) return this.memberOf(who);
    const avg = Math.round(this.party.reduce((s, m) => s + m.lv, 0) / Math.max(1, this.party.length));
    const m = R.newMember(who, Math.max(lv, avg - 1), STARTER[who] || {});
    R.fullHeal(m);
    await this.audio.jingle('j_join');
    const nm = CHARS[who];
    if (this.party.length < MAX_ACTIVE) { this.party.push(m); this.refreshParty(); await this.ui.say(null, L(nm.zh + '加入了隊伍！', nm.en + ' joins the party!')); }
    else { this.camp.push(m); await this.ui.say(null, L(nm.zh + '加入了！隊伍滿了，' + nm.zh + '會先到百獸山寨或客棧等你調度。', nm.en + ' joins! The party is full, so ' + nm.en + ' will wait at the camp or any inn until you swap.')); }
    return m;
  }

  // ---------------------------------------------------------------- talking and checking
  async interact() {
    if (this.busy || this.moving || this.mode !== 'field') return;
    await this.run(async () => {
      const [dx, dy] = DIRS[this.dir]; let x = this.x + dx, y = this.y + dy;
      let n = this.npcAt(x, y);
      if (!n && this.map !== 'world' && this.tile(x, y) === '=') { x += dx; y += dy; n = this.npcAt(x, y); }
      if (n) { n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[this.dir]; return this.talk(n); }
      if (this.map === 'world') return this.ui.say(null, L('四下無人。', 'There is no one here.'));
      const c = this.tile(x, y), k = x + ',' + y;
      if (c === 'c') return this.openChest(x, y);
      if (c === 'd' && !this.isOpen(k)) {
        const key = this.M.doorKey;
        if (key && this.has(key)) { this.setOpenKey(k); this.audio.sfx('door'); this.refreshView(); return this.ui.say(null, L('用' + ITEMS[key].zh + '打開了門。', 'The ' + ITEMS[key].en + ' opens the door.')); }
        return this.ui.say(null, this.M.doorMsg || L('門鎖著，推不開。', 'The door is locked.'));
      }
      const look = this.M.looks && this.M.looks[k];
      if (look) return typeof look === 'function' ? look(this.scripts()) : this.ui.say(null, look);
      if (c === 'u' && this.M.tablet) return this.ui.say(null, this.M.tablet);
      if (c === 'u') return this.ui.say(null, L('一尊莊嚴的佛像。', 'A solemn statue.'));
      if (c === 'k') return this.ui.say(null, L('架上擺滿了舊書和罈罈罐罐。', 'The shelf is full of old books and jars.'));
      if (c === 'w') return this.ui.say(null, L('井水清涼。', 'The well water is cool.'));
      if (c === 'q') return this.ui.say(null, L('一口沉重的棺材。', 'A heavy coffin.'));
      if (c === '@') return this.ui.say(null, L('空空的獸籠，門已經打開了。', 'An empty cage; its door hangs open.'));
      if (c === '?') return this.ui.say(null, this.M.sign || L('木牌上的字被雨打得看不清了。', 'The rain has worn the sign unreadable.'));
      return this.ui.say(null, L('什麼也沒有。', 'Nothing here.'));
    });
  }
  async openChest(x, y) {
    const k = x + ',' + y, M = this.M;
    if (this.isOpen(k)) return this.ui.say(null, L('箱子是空的。', 'The chest is empty.'));
    let i = 0; outer: for (let yy = 0; yy < M.h; yy++) for (let xx = 0; xx < M.w; xx++) { if (M.rows[yy][xx] === 'c') { if (xx === x && yy === y) break outer; i++; } }
    const C = M.chests[i] || { gold: 50 }; this.audio.sfx('chest');
    if (C.gold) { this.setOpenKey(k); this.inv.gold += C.gold; this.refreshView(); return this.ui.say(null, L('打開寶箱，得到 ' + C.gold + ' 兩銀子！', 'You open the chest: ' + C.gold + ' gold!')); }
    if (!R.canAdd(this.inv, C.item)) return this.ui.say(null, L('行囊滿了，拿不下' + ITEMS[C.item].zh + '。先去賣掉或丟掉一些東西吧。', 'Your pack is full: no room for the ' + ITEMS[C.item].en + '. Sell or drop something first.'));
    this.setOpenKey(k); R.addItem(this.inv, C.item); this.refreshView();
    const it = ITEMS[C.item]; if (isGear(C.item) || it.kind === 'key') await this.audio.jingle('j_item');
    await this.ui.say(null, L('打開寶箱，得到了' + it.zh + '！', 'You open the chest: ' + it.en + '!'));
    if (isGear(C.item)) await this.offerEquip(C.item);
  }
  // a new piece: offer it to whoever it would suit best
  async offerEquip(id) {
    const it = ITEMS[id];
    const who = this.party.filter((m) => R.canWear(m, id) && R.gearScore(id) > R.gearScore(m[it.kind])).sort((a, b) => (R.gearScore(a[it.kind]) - R.gearScore(b[it.kind])))[0];
    if (!who) return;
    if (await this.ui.yesno(L('要讓' + R.nameOf(who, 'zh') + '裝備' + it.zh + '嗎？', 'Have ' + R.nameOf(who, 'en') + ' wear the ' + it.en + '?'))) { this.wear(who, id); this.audio.sfx('ok'); }
  }
  refreshView() { if (this.view) this.view.refresh({ isOpen: (k) => this.isOpen(k) }); }
  scripts() {
    const G = this, ui = this.ui;
    return {
      G, say: (who, text) => ui.say(who, text), ask: (text, who) => ui.yesno(text, who), flag: (f) => G.flag(f), set: (f) => { G.flags[f] = 1; }, unset: (f) => { delete G.flags[f]; },
      has: (id) => G.has(id), gold: (n) => { G.inv.gold += n; }, money: () => G.inv.gold,
      give: async (id, quiet) => { if (!R.canAdd(G.inv, id)) await G.makeRoom(id); else R.addItem(G.inv, id); if (!quiet) { await G.audio.jingle('j_item'); await ui.say(null, L('得到了' + ITEMS[id].zh + '！', 'Received the ' + ITEMS[id].en + '!')); } },
      take: (id) => R.removeItem(G.inv, id),
      shop: (id) => G.shop(id), inn: (p) => G.inn(p), storyteller: () => G.storyteller(), camp: () => G.campMenu(), swap: () => G.swapMenu(), jia: () => G.jiaShop(),
      teach: async (who, k) => { const m = G.memberOf(who) || G.hero; if (!m.learned.includes(k)) m.learned.push(k); await G.audio.jingle('j_item'); await ui.say(null, L(R.nameOf(m, 'zh') + '學會了「' + SKILLS[k].zh + '」！', R.nameOf(m, 'en') + ' learned ' + SKILLS[k].en + '!')); },
      join: (who, lv) => G.join(who, lv), inParty: (who) => !!G.memberOf(who), active: (who) => G.party.some((m) => m.who === who),
      battle: (ids, opts) => G.fight(ids, opts || {}), jingle: (n) => G.audio.jingle(n), sfx: (n) => G.audio.sfx(n), music: (n) => (n ? G.audio.play(n) : G.audio.stop()),
      wait: (ms) => (G.fast ? Promise.resolve() : sleep(ms)), fadeOut: () => G.fadeOut(), fadeIn: () => G.fadeIn(), flash: async () => { if (G.view && !G.fast) for (let i = 0; i < 6; i++) { G.view.flash(i % 2 ? 0.8 : 0.1); await sleep(80); } if (G.view) G.view.flash(0); },
      respawn: () => { G.spawnPeople(); if (G.view) G.setupActors(); }, heal: () => { for (const m of [...G.party, ...G.camp]) R.fullHeal(m); },
      choose: (items, opts) => ui.choose(items, opts), worldOpen: () => { if (G.view && G.map === 'world') G.view.setOpen(G.worldOpen()); },
      partyLv: () => Math.max(...G.party.map((m) => m.lv)),
    };
  }
  async talk(n) {
    if (n.boss) return this.bossFight(n);
    this.audio.sfx('cursor');
    await n.def.say(this.scripts(), n);
  }
  async bossFight(n) {
    const B = n.boss, S = this.scripts();
    for (const [who, l] of B.pre || []) await this.ui.say(who, l);
    if (B.preFn) await B.preFn(S);
    if (B.ask && !(await this.ui.yesno(B.ask))) return;
    const E = ENEMIES[B.id];
    const scene = B.scene || this.M.scene || { forest: 'forest', fort: 'fort', sea: 'sea', tower: 'tower', tomb: 'tomb', ice: 'ice', snowpeak: 'snow', lair: 'lair', mansion: 'mansion', temple: 'temple', bamboo: 'bamboo', swamp: 'swamp', volcano: 'volcano', pagoda: 'bell', town: 'arena' }[this.M.theme] || 'cave';
    const ids = (E.escorts || []).slice(0, 1).concat([B.id]).concat((E.escorts || []).slice(1));
    const r = await this.fight(ids, { scene, final: E.final, music: B.music, loseOk: B.loseOk, recruit: false, lead: B.id });
    if (r !== 'win') { if (B.loseOk && B.onLose) await B.onLose(S); return; }
    this.flags[B.flag] = 1; this.stats['boss_' + B.id] = { lv: this.hero.lv, t: Math.round(this.stats.time), battles: this.stats.battles, deaths: this.stats.deaths };
    for (const [who, l] of B.post || []) await this.ui.say(who, l);
    if (B.give) await S.give(B.give);
    this.npcs = this.npcs.filter((x) => x !== n); if (n.actor && this.view) this.view.drop('npc' + n.key + n.x + n.y);
    if (B.postFn) await B.postFn(S);
    this.autosave();
  }

  // ---------------------------------------------------------------- the storyteller, inns, shops, the camp
  async storyteller() {
    const ui = this.ui, B = 'baixian', F = this.flags;
    const hint = storyHint(this);
    await ui.say(B, hint);
    const lead = this.hero, n = R.xpToNext(lead);
    if (n > 0) await ui.say(B, L('依老夫看，奕叡再得 ' + n + ' 點經驗，功力便可更上一層。', 'By my reckoning, ' + n + ' more experience and Yi Rui will grow stronger again.'));
    if (await ui.yesno(L('要把你們的事蹟記錄下來嗎？', 'Shall I write down your deeds so far?'), B)) await this.saveMenu({ map: 'longmen', x: 15, y: 4 });
  }
  async saveMenu(here) {
    const items = SAVE_KEYS.map((k, i) => { const s = Game.slotInfo(i); return { label: t(STR.slot) + ' ' + (i + 1), sub: s ? t(STR.lv) + s.lv + ' ' + mapName(s.map) : t(STR.empty) }; });
    const i = await this.ui.choose(items, { title: L('記錄在哪一冊？', 'Which record?'), ctx: 'save' });
    if (i < 0) return;
    this.lastSave = here || this.lastSave; this.saveSlot(i);
    await this.audio.jingle('j_save'); await this.ui.say(null, L('記錄好了。', 'Your deeds are recorded.'));
  }
  async inn(price) {
    const ui = this.ui, n = this.party.length, cost = price * n;
    const opts = [{ label: ['住宿', 'Stay'], sub: cost + t('gp') }];
    if (this.flags.campOpen) opts.push({ label: ['找牛家夥計調度隊伍', 'Swap party (Niu family)'] });
    opts.push({ label: STR.leave });
    await ui.say('innkeeper', L('歡迎光臨！住一晚每人 ' + price + ' 兩銀子。', 'Welcome! A night is ' + price + ' gold a head.'), { keep: true, noWait: !ui.driver });
    const c = await ui.choose(opts, { ctx: 'inn', cls: 'yn' }); ui.hideMsg();
    if (c === 1 && this.flags.campOpen) { await ui.say('niubaobao', L('我是牛飽飽的表弟牛又飽！山寨的夥伴，我飛鴿傳書，一會兒就到。', 'I\'m Niu Youbao, Baobao\'s cousin! I\'ll send a pigeon to the camp; your friends will be here in no time.')); return this.swapMenu(); }
    if (c !== 0) return ui.say('innkeeper', L('歡迎再來。', 'Come again.'));
    if (this.inv.gold < cost) return ui.say('innkeeper', L('客官，銀兩不夠啊。', 'You don\'t have enough, friend.'));
    this.inv.gold -= cost; for (const m of [...this.party, ...this.camp]) R.fullHeal(m);
    await this.fadeOut(); await this.audio.jingle('j_inn'); await this.fadeIn();
    await ui.say('innkeeper', L('早安！昨晚睡得好嗎？', 'Good morning! Did you sleep well?'));
    if (this.memberOf('suxiaowan') && this.party.some((m) => m.who === 'suxiaowan') && !this.flags.xwInn) { this.flags.xwInn = 1; await ui.say('suxiaowan', L('我一夜沒睡，可是一點也不睏……奇怪，我好像很久沒睏過了。', 'I didn\'t sleep a wink, yet I\'m not tired at all... how odd. I don\'t think I\'ve been tired in years.')); }
    this.lastSave = { map: this.map, x: this.x, y: this.y };
    if (await ui.yesno(L('要寫下旅途的記錄嗎？', 'Will you write in your travel journal?'), 'innkeeper')) await this.saveMenu({ map: this.map, x: this.x, y: this.y });
  }
  async shop(id, list0) {
    const ui = this.ui, inv = this.inv;
    for (;;) {
      const mode = await ui.choose([STR.buy, STR.sell, STR.leave], { title: L('要什麼？', 'What will it be?'), ctx: 'shopmode' });
      if (mode === 0) {
        for (;;) {
          const list = list0 || SHOPS[id];
          const gold = ui.panel('goldwin', `${t('gold')} ${inv.gold}`);
          const i = await ui.choose(list.map((k) => ({ label: ITEMS[k], sub: ITEMS[k].price + t('gp') })), { title: STR.buy, cls: 'shoplist', ctx: 'buy', keys: list, onMove: (j) => this.showCompare(list[j]) });
          gold.remove(); this.hideCompare();
          if (i < 0) break;
          const k = list[i], it = ITEMS[k];
          if (inv.gold < it.price) { await ui.say(null, L('銀兩不夠。', 'Not enough gold.')); continue; }
          if (it.kind === 'key' && this.has(k)) { await ui.say(null, L('你已經有了。', 'You already have one.')); continue; }
          if (!R.canAdd(inv, k)) { await ui.say(null, L('行囊滿了。', 'Your pack is full.')); continue; }
          inv.gold -= it.price; R.addItem(inv, k); this.audio.sfx('buy');
          if (isGear(k)) {
            const can = this.party.filter((m) => R.canWear(m, k));
            if (!can.length) { await ui.say(null, L('現在隊伍裡沒有人能裝備它。先收著吧。', 'No one in the party can wear it now. Keep it for later.')); continue; }
            const j = await ui.choose(can.map((m) => ({ label: R.nameOf(m, getLang()), sub: m[it.kind] ? ITEMS[m[it.kind]] : STR.none })).concat([{ label: ['先不穿', 'Not now'] }]), { title: L('給誰裝備？', 'Who wears it?'), ctx: 'buywho', cls: 'shoplist', onMove: (q) => this.showCompare(k, can[q]) });
            this.hideCompare();
            if (j >= 0 && j < can.length) {
              const m = can[j], old = m[it.kind]; this.wear(m, k);
              if (old && ITEMS[old].price && await ui.yesno(L('舊的' + ITEMS[old].zh + '，' + Math.floor(ITEMS[old].price / 2) + '兩收了吧？', 'Sell the old ' + ITEMS[old].en + ' for ' + Math.floor(ITEMS[old].price / 2) + ' gold?'))) { R.removeItem(inv, old); inv.gold += Math.floor(ITEMS[old].price / 2); this.audio.sfx('buy'); }
            }
          } else await ui.say(null, L('謝謝惠顧！', 'Thank you!'));
        }
      } else if (mode === 1) {
        const sell = inv.bag.filter((b) => ITEMS[b.id].kind !== 'key' && ITEMS[b.id].price);
        if (!sell.length) { await ui.say(null, STR.noItem); continue; }
        const gold = ui.panel('goldwin', `${t('gold')} ${inv.gold}`);
        const i = await ui.choose(sell.map((b) => ({ label: ITEMS[b.id], sub: '×' + b.n + '　' + Math.floor(ITEMS[b.id].price / 2) + t('gp') })), { title: STR.sell, ctx: 'sell', cls: 'shoplist', onMove: (j) => this.desc(ITEMS[sell[j].id]) });
        gold.remove(); this.desc(null);
        if (i < 0) continue;
        R.removeItem(inv, sell[i].id); inv.gold += Math.floor(ITEMS[sell[i].id].price / 2); this.audio.sfx('buy');
      } else return ui.say(null, L('慢走！', 'Safe travels!'));
    }
  }
  // 賈八方's stall: what is left of his own things, by chapter
  async jiaShop() {
    const ch = chapterOf(this.flags), list = [];
    for (let i = 0; i <= Math.min(ch - 1, JIA_STOCK.length - 1); i++) for (const k of JIA_STOCK[i]) if (!list.includes(k)) list.push(k);
    return this.shop('jia', list);
  }
  // what a piece would change for a member (green up, red down); the doll previews it on 奕叡
  showCompare(id, m) {
    this.hideCompare();
    if (!id) return;
    const it = ITEMS[id];
    if (!isGear(id)) { this.cmp = this.ui.panel('cmpwin', t([it.dz || '', it.de || ''])); return; }
    const slot = it.kind;
    const who = m || this.party.filter((x) => R.canWear(x, id))[0];
    if (!who) { this.cmp = this.ui.panel('cmpwin', t([it.dz || '', it.de || '']) + `<div class="cmpnow">${t(['隊伍裡沒有人能用', 'No one in the party can use it'])}</div>`); return; }
    const now = R.withGear(who, slot, who[slot]), then = R.withGear(who, slot, id);
    const rows = [['atk', STR.atk], ['def', STR.def], ['agi', STR.agi], ['maxHp', ['體力上限', 'Max HP']], ['maxMp', ['內力上限', 'Max MP']], ['crit', ['會心', 'Crit']]];
    const fmt = (k, v) => (k === 'crit' ? Math.round(v * 100) + '%' : v);
    const lines = rows.filter(([k]) => then[k] !== now[k] || k === 'atk' || k === 'def').map(([k, n]) => { const d = then[k] - now[k], ds = k === 'crit' ? Math.round(d * 100) + '%' : d; return `<div class="cmprow"><span>${t(n)}</span><span>${fmt(k, now[k])}→${fmt(k, then[k])}</span><b class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' + ds : d < 0 ? ds : ''}</b></div>`; }).join('');
    const fx = GEAR_FX.filter(([k]) => it[k]).map(([k, zh, en, mm, u]) => t([zh, en]) + '+' + Math.round(it[k] * mm) + u).join('　');
    const pic = who.who === 'yirui' ? `<img class="cmpdoll" src="${this.dollPics({ [slot]: id }).down}">` : `<div class="cmpdoll cmppic">${this.picHTML(who)}</div>`;
    const cur = who[slot] ? `<div class="cmpnow">${t(['現在', 'Now'])}：${t(ITEMS[who[slot]])}</div>` : '';
    this.cmp = this.ui.panel('cmpwin cmpgear', `${pic}<div class="cmpstats"><div class="cmpname">${t(it)}　<span>${R.nameOf(who, getLang())}</span></div>${lines}${fx ? `<div class="cmpfx">${fx}</div>` : ''}${cur}</div>`);
  }
  hideCompare() { if (this.cmp) { this.cmp.remove(); this.cmp = null; } }
  // a small picture of a member: 奕叡's doll, a person's portrait, a monster's field sprite
  picHTML(m, big) {
    if (m.who === 'yirui') return `<img class="mpic" src="${this.dollPics().down}">`;
    if (m.kind === 'human' && CAST[m.who]) return `<img class="mpic por" src="${CAST[m.who].portrait}">`;
    const a = ENEMY_ART[ART_OF(m.who)]; if (!a) return '';
    if (big) return `<div class="mpic bust" style="width:${a.w}px;height:${a.h}px;background-image:url(${ENEMY_IMG});background-position:-${a.x}px -${a.y}px"></div>`;
    const f = a.f || [a.x, a.y, a.w, a.h];
    return `<div class="mpic spr" style="width:${f[2]}px;height:${f[3]}px;background-image:url(${ENEMY_IMG});background-position:-${f[0]}px -${f[1]}px"></div>`;
  }
  // ---------------------------------------------------------------- the camp keeper and swapping
  async campMenu() {
    const ui = this.ui;
    for (;;) {
      const c = await ui.choose([['調度隊伍', 'Swap the party'], ['改名', 'Rename'], ['看看大家', 'Look at everyone'], ['放生', 'Set one free'], STR.leave], { title: L('百獸山寨', 'Hundred Beasts Camp'), ctx: 'camp' });
      if (c === 0) await this.swapMenu();
      else if (c === 1) await this.renameMenu();
      else if (c === 2) await this.rosterMenu();
      else if (c === 3) await this.releaseMenu();
      else return ui.say('niubaobao', L('有空常來！肉包……我先替你們吃了。', 'Come again! The buns... I\'ll eat them for you.'));
    }
  }
  memberRow(m, extra = '') { const s = R.stat(m); return { label: R.nameOf(m, getLang()), sub: `${t('lv')}${m.lv} ${m.hp > 0 ? m.hp + '/' + s.maxHp : t(['倒下', 'down'])}${extra}` }; }
  async swapMenu() {
    const ui = this.ui;
    for (;;) {
      const rows = this.party.map((m) => this.memberRow(m));
      if (this.party.length < MAX_ACTIVE) rows.push({ label: ['（空位）', '(empty)'], sub: '' });
      const i = await ui.choose(rows, { title: L('換下誰？', 'Swap out whom?'), ctx: 'swapout', cls: 'shoplist', onMove: (j) => this.memberPanel(this.party[j]) });
      this.memberPanel(null);
      if (i < 0) return;
      const out = this.party[i] || null;
      if (out && out.who === 'yirui') { await ui.say(null, L('奕叡得帶隊，不能下場。', 'Yi Rui leads the party; he stays.')); continue; }
      const pool = this.camp.slice();
      const opts = pool.map((m) => this.memberRow(m, m.kind === 'mon' ? ' ' + t(ENEMIES[m.who]) : ''));
      if (out) opts.push({ label: ['讓牠/他休息就好', 'Just let them rest'], sub: '' });
      if (!opts.length) { await ui.say(null, L('山寨裡沒有可以換上的夥伴。', 'There is no one at the camp to bring in.')); continue; }
      const j = await ui.choose(opts, { title: L('換上誰？', 'Bring in whom?'), ctx: 'swapin', cls: 'shoplist', onMove: (q) => this.memberPanel(pool[q]) });
      this.memberPanel(null);
      if (j < 0) continue;
      const inn = pool[j];
      if (out) { this.party.splice(this.party.indexOf(out), 1); this.camp.push(out); }
      if (inn) { this.camp.splice(this.camp.indexOf(inn), 1); if (out) this.party.splice(i, 0, inn); else this.party.push(inn); }
      if (!this.party.length) { this.party.push(out); this.camp.splice(this.camp.indexOf(out), 1); }
      this.audio.sfx('ok'); this.refreshParty();
    }
  }
  memberPanel(m) { if (this.mp) { this.mp.remove(); this.mp = null; } if (m) this.mp = this.ui.panel('cmpwin memwin', this.memberHTML(m)); }
  memberHTML(m) {
    const s = R.stat(m), nm = R.nameOf(m, getLang());
    const kind = m.kind === 'mon' ? `${t(ENEMIES[m.who])}・${t(MROLE_NAME[SPECIES[m.who].role])}` : t([CHARS[m.who].tzh, CHARS[m.who].ten]);
    return `<div class="mrow">${this.picHTML(m)}<div><div class="cmpname">${nm}</div><div class="cmpnow">${kind}</div><div>${t('lv')} ${m.lv}${m.kind === 'mon' ? '/' + SPECIES[m.who].cap : ''}　${t('hp')} ${m.hp}/${s.maxHp}　${t('mp')} ${m.mp}/${s.maxMp}</div><div>${t('atk')} ${R.atkOf(m)}　${t('def')} ${R.defOf(m)}　${t('agi')} ${s.agi}</div></div></div><div class="stsk">${R.known(m).map((k) => t(SKILLS[k])).join('　') || t(STR.none)}</div>`;
  }
  async renameMenu() {
    const mons = [...this.party, ...this.camp].filter((m) => m.kind === 'mon');
    if (!mons.length) return this.ui.say('niubaobao', L('還沒有妖物夥伴呢。', 'You have no creature friends yet.'));
    const i = await this.ui.choose(mons.map((m) => this.memberRow(m)), { title: L('幫誰改名？', 'Rename whom?'), ctx: 'rename', cls: 'shoplist' });
    if (i < 0) return;
    mons[i].name = await this.pickName(mons[i]); this.audio.sfx('ok');
    await this.ui.say('niubaobao', L('好名字！叫起來比肉包還香。', 'Good name! It sounds tastier than a meat bun.'));
  }
  async rosterMenu() {
    const all = [...this.party, ...this.camp];
    await this.ui.choose(all.map((m) => this.memberRow(m, this.party.includes(m) ? ' ★' : '')), { title: L('夥伴 ' + all.length + '/' + (MAX_ACTIVE + MAX_CAMP), 'Companions ' + all.length + '/' + (MAX_ACTIVE + MAX_CAMP)), ctx: 'roster', cls: 'shoplist', onMove: (j) => this.memberPanel(all[j]) });
    this.memberPanel(null);
  }
  async releaseMenu() {
    const mons = this.camp.filter((m) => m.kind === 'mon');
    if (!mons.length) return this.ui.say('niubaobao', L('山寨裡沒有可以放生的妖物。', 'There are no creatures at the camp to set free.'));
    const i = await this.ui.choose(mons.map((m) => this.memberRow(m)), { title: L('放誰回山林？', 'Set whom free?'), ctx: 'release', cls: 'shoplist', onMove: (j) => this.memberPanel(mons[j]) });
    this.memberPanel(null);
    if (i < 0) return;
    const m = mons[i]; if (!(await this.ui.yesno(L('真的要讓' + R.nameOf(m, 'zh') + '回山林去嗎？', 'Really set ' + R.nameOf(m, 'en') + ' free?')))) return;
    for (const s of SLOTS) if (m[s]) R.addItem(this.inv, m[s]);
    this.camp.splice(this.camp.indexOf(m), 1);
    await this.ui.say(null, L(R.nameOf(m, 'zh') + '回頭看了好幾眼，才慢慢走進山林裡。', R.nameOf(m, 'en') + ' looks back again and again, then walks slowly into the hills.'));
  }

  // ---------------------------------------------------------------- the field menu
  async menu() {
    if (this.busy || this.moving || this.mode !== 'field') return;
    this.mode = 'menu';
    await this.run(async () => {
      const ui = this.ui;
      for (;;) {
        const panel = ui.panel('fieldstat', this.partyHTML());
        const c = await ui.choose([STR.skill, STR.item, STR.equip, STR.status, ['隊伍', 'Party'], STR.book, STR.config, STR.save, STR.close], { cls: 'fieldmenu', ctx: 'field' });
        panel.remove();
        if (c < 0 || c === 8) break;
        if (c === 0) { if (await this.fieldSkill()) break; }
        else if (c === 1) { if (await this.itemMenu()) break; }
        else if (c === 2) await this.equipMenu();
        else if (c === 3) await this.statusMenu();
        else if (c === 4) await this.orderMenu();
        else if (c === 5) await this.bestiary();
        else if (c === 6) await this.settings();
        else if (c === 7) await this.saveMenu();
      }
    });
    if (this.mode === 'menu') this.mode = 'field';
  }
  partyHTML() {
    return this.party.map((m) => { const s = R.stat(m); return `<div class="pmem${m.hp <= 0 ? ' dead' : m.hp <= s.maxHp / 4 ? ' low' : ''}"><b>${R.nameOf(m, getLang())}</b><span>${t('lv')}${m.lv}</span><span>${t('hp')}${m.hp}/${s.maxHp}</span><span>${t('mp')}${m.mp}/${s.maxMp}</span>${m.poison ? `<span class="psn">${t(['毒', 'PSN'])}</span>` : ''}</div>`; }).join('') + `<div class="pgold">${t('gold')} ${this.inv.gold}</div>`;
  }
  async pickMember(title, filter = () => true, ctx = 'who') {
    const list = this.party.filter(filter);
    if (!list.length) return null;
    const i = await this.ui.choose(list.map((m) => this.memberRow(m)), { title, ctx, cls: 'shoplist', onMove: (j) => this.memberPanel(list[j]) });
    this.memberPanel(null);
    return i >= 0 ? list[i] : null;
  }
  async statusMenu() {
    const m = await this.pickMember(STR.status); if (!m) return;
    const p = this.ui.panel('statuswin', this.statusHTML(m)); await this.ui.choose([STR.close], { cls: 'tiny', ctx: 'close' }); p.remove();
  }
  async orderMenu() {
    if (this.party.length < 2) return this.ui.say(null, L('隊伍裡只有一個人。', 'There is only one in the party.'));
    const i = await this.ui.choose(this.party.map((m) => this.memberRow(m)), { title: L('和誰換位置？', 'Move whom?'), ctx: 'order1', cls: 'shoplist' });
    if (i < 0) return;
    const j = await this.ui.choose(this.party.map((m) => this.memberRow(m)), { title: L('換到哪裡？', 'Swap with?'), ctx: 'order2', cls: 'shoplist', start: i });
    if (j < 0 || j === i) return;
    [this.party[i], this.party[j]] = [this.party[j], this.party[i]]; this.audio.sfx('ok'); this.refreshParty();
  }
  async bestiary() {
    const seen = this.stats.seen || {}, rec = this.stats.recruited || {};
    const ids = Object.keys(ENEMIES).filter((id) => seen[id]);
    if (!ids.length) { await this.ui.say(null, L('還沒有遇過任何敵人。', 'You have not met any foes yet.')); return; }
    const total = Object.keys(ENEMIES).length, nRec = Object.keys(SPECIES).filter((id) => rec[id]).length;
    let card = null;
    const show = (j) => {
      if (card) card.remove();
      const id = ids[j], E = ENEMIES[id], info = ENEMY_INFO[ART_OF(id)] || ENEMY_INFO[id];
      const pic = E.por ? `<div class="bkpic"><img src="${CAST[E.por] ? CAST[E.por].portrait : ''}"></div>` : (() => { const a = ENEMY_ART[ART_OF(id)]; return a ? `<div class="bkpic"><div class="bkspr" style="width:${a.w}px;height:${a.h}px;background-image:url(${ENEMY_IMG});background-position:-${a.x}px -${a.y}px"></div></div>` : ''; })();
      const meta = info ? `${t(info.habitat)}` : t(['首領', 'Boss']);
      const S = SPECIES[id];
      const join = S ? (rec[id] ? `<div class="bkjoin">★ ${t(['已有夥伴', 'A friend joined'])} ×${rec[id]}　${t(MROLE_NAME[S.role])}</div>` : `<div class="bkjoin dim">${t(['可能會加入', 'May join'])}　${t(MROLE_NAME[S.role])}</div>`) : '';
      const got = (this.stats.got || {})[id] || {};
      const drops = E.drop.length ? E.drop.map(([d]) => (got[d] ? t(ITEMS[d]) : '？？？')).join('、') : '—';
      card = this.ui.panel('bookwin', `${pic}<div class="bktext"><div class="bkname">${t(E)}</div><div class="bkmeta">${meta}</div><div class="bkbio">${info ? t(info.bio) : ''}</div>${join}<div class="bkmeta">${t(['擊敗', 'Defeated'])} ${(this.stats.kills || {})[id] || 0}</div><div class="bkdrop">${t(STR.drop)}：${drops}</div></div>`);
    };
    await this.ui.choose(ids.map((id) => ({ label: ENEMIES[id], sub: rec[id] ? '★' : '' })), { title: L('圖鑑 ' + ids.length + '/' + total + '　★' + nRec, 'Bestiary ' + ids.length + '/' + total + '  ★' + nRec), cls: 'booklist', ctx: 'book', onMove: show });
    if (card) card.remove();
  }
  statusHTML(m) {
    const s = R.stat(m), nm = R.nameOf(m, getLang());
    const fx = GEAR_FX.map(([k, zh, en, mm, u]) => [Math.min(R.gear(m, k), u === '%' ? 1 : 99), zh, en, mm, u]).filter(([v]) => v).map(([v, zh, en, mm, u]) => t([zh, en]) + '+' + Math.round(v * mm) + u).join('　');
    const title = m.kind === 'mon' ? `${nm}　${t(ENEMIES[m.who])}（${t(MROLE_NAME[SPECIES[m.who].role])}）` : `${nm}　${t([CHARS[m.who].tzh, CHARS[m.who].ten])}`;
    const pic = m.who === 'yirui' ? this.dollHTML(m) : `<div class="dollbox">${this.picHTML(m, true)}<div class="dcol">${R.slotsOf(m).map((sl) => `<div class="dslot"><span>${t(SLOT_NAME[sl])}</span><b>${m[sl] ? t(ITEMS[m[sl]]) : '—'}</b></div>`).join('')}</div></div>`;
    return `<div class="stname">${title}</div>
      <div class="stwrap">${pic}<div class="stright"><div class="stgrid"><span>${t('lv')}</span><b>${m.lv}${m.kind === 'mon' ? '/' + SPECIES[m.who].cap : ''}</b><span>${t('xp')}</span><b>${m.xp}</b>
      <span>${t('hp')}</span><b>${m.hp}/${s.maxHp}</b><span>${t('mp')}</span><b>${m.mp}/${s.maxMp}</b>
      <span>${t('str')}</span><b>${s.str}</b><span>${t('agi')}</span><b>${s.agi}</b>
      <span>${t('atk')}</span><b>${R.atkOf(m)}</b><span>${t('def')}</span><b>${R.defOf(m)}</b>
      <span>${t(['下一級', 'Next'])}</span><b>${R.xpToNext(m)}</b></div>
      </div>${fx ? `<div class="stfx">${fx}</div>` : ''}</div></div>
      <div class="stsk">${t('skill')}：${R.known(m).map((k) => t(SKILLS[k])).join('　') || t(STR.none)}</div>`;
  }
  async fieldSkill() {
    const casters = this.party.filter((m) => m.hp > 0 && R.known(m).some((k) => SKILLS[k].field));
    if (!casters.length) { await this.ui.say(null, STR.noSkill); return false; }
    const m = casters.length === 1 ? casters[0] : await this.pickMember(L('誰來施展？', 'Who uses an art?'), (x) => casters.includes(x));
    if (!m) return false;
    const ks = R.known(m).filter((k) => SKILLS[k].field);
    const i = await this.ui.choose(ks.map((k) => ({ label: SKILLS[k], sub: SKILLS[k].mp + '', disabled: m.mp < SKILLS[k].mp })), { title: R.nameOf(m, getLang()), ctx: 'fskill', keys: ks, onMove: (j) => this.desc(SKILLS[ks[j]]) });
    this.desc(null);
    if (i < 0) return false;
    const k = ks[i], S = SKILLS[k];
    if (S.kind === 'escape' && (this.map === 'world' || this.M.town)) { await this.ui.say(null, L('這裡用不著。', 'Not needed here.')); return false; }
    let target = null;
    if (S.target === 'ally') { target = await this.pickMember(t(S), (x) => x.hp > 0); if (!target) return false; }
    if (S.target === 'fallen') { target = await this.pickMember(t(S), (x) => x.hp <= 0); if (!target) { await this.ui.say(null, L('沒有倒下的同伴。', 'No one is down.')); return false; } }
    m.mp -= S.mp;
    await this.ui.say(null, L(R.nameOf(m, 'zh') + '使出了「' + S.zh + '」！', R.nameOf(m, 'en') + ' uses ' + S.en + '!'));
    return this.fieldEffect(S, target, k);
  }
  async fieldEffect(S, target, k) {
    const heal = (m, v) => { const b = m.hp; m.hp = Math.min(R.stat(m).maxHp, m.hp + v); return m.hp - b; };
    if (S.kind === 'heal') { const v = heal(target, R.rand(S.lo, S.hi)); this.audio.sfx('heal'); await this.ui.say(null, L(R.nameOf(target, 'zh') + '回復了' + v + '點體力。', R.nameOf(target, 'en') + ' recovers ' + v + ' HP.')); return false; }
    if (S.kind === 'healall') { for (const m of this.party) if (m.hp > 0) heal(m, R.rand(S.lo, S.hi)); this.audio.sfx('heal'); await this.ui.say(null, L('全隊的體力回復了。', 'The whole party recovers.')); return false; }
    if (S.kind === 'revive') { target.hp = Math.max(1, Math.round(R.stat(target).maxHp * S.frac)); this.audio.sfx('heal'); await this.ui.say(null, L(R.nameOf(target, 'zh') + '醒過來了！', R.nameOf(target, 'en') + ' comes round!')); return false; }
    if (S.kind === 'cure') { target.poison = false; this.audio.sfx('heal'); await this.ui.say(null, L('毒解了。', 'The poison is gone.')); return false; }
    if (S.kind === 'home' || S.home) { this.audio.sfx('run'); await this.whiteOut(); await this.turnOut(); const ls = this.lastSave; await this.enterMap(ls.map, ls.x, ls.y, 'up'); await this.turnIn(); return true; }
    if (S.kind === 'escape') { const P = PLACE_AT[this.M.place]; this.audio.sfx('run'); await this.whiteOut(); await this.turnOut(); await this.enterWorld(P[0], P[1]); await this.turnIn(); return true; }
    if (S.kind === 'ward' || S.ward) { this.ward = 150; this.audio.sfx('skill'); await this.ui.say(null, L('一身正氣，弱小的妖物不敢靠近了。', 'Weak creatures will keep their distance.')); return false; }
    return false;
  }
  desc(x) { if (this.descP) { this.descP.remove(); this.descP = null; } if (x && (x.dz || x.de)) this.descP = this.ui.panel('descwin', t([x.dz, x.de])); }
  async itemMenu() {
    const inv = this.inv;
    if (!inv.bag.length) { await this.ui.say(null, STR.noItem); return false; }
    const i = await this.ui.choose(inv.bag.map((b) => ({ label: ITEMS[b.id], sub: ITEMS[b.id].kind === 'key' ? '' : '×' + b.n })), { title: t(STR.item) + ' ' + inv.bag.length + '/' + BAG_MAX, ctx: 'fitem', cls: 'shoplist', onMove: (j) => this.desc(ITEMS[inv.bag[j].id]) });
    this.desc(null);
    if (i < 0) return false;
    const id = inv.bag[i].id, it = ITEMS[id];
    if (isGear(id)) {
      const m = await this.pickMember(L('給誰裝備？', 'Who wears it?'), (x) => R.canWear(x, id));
      if (!m) { if (!this.party.some((x) => R.canWear(x, id))) await this.ui.say(null, L('隊伍裡沒有人能裝備它。', 'No one in the party can wear it.')); return false; }
      this.wear(m, id); this.audio.sfx('ok'); await this.ui.say(null, L(R.nameOf(m, 'zh') + '裝備了' + it.zh + '。', R.nameOf(m, 'en') + ' now wears the ' + it.en + '.')); return false;
    }
    if (it.kind === 'key') { await this.ui.say(null, [it.dz, it.de]); return false; }
    if (it.kind === 'mat') { if (await this.ui.yesno(L('這是拿去賣錢的。要丟掉' + it.zh + '嗎？', 'This is for selling. Drop the ' + it.en + '?'))) R.removeItem(inv, id); return false; }
    const what = await this.ui.choose([STR.use, STR.toss], { ctx: 'usetoss', cls: 'tiny' });
    if (what === 1) { if (await this.ui.yesno(L('丟掉' + it.zh + '嗎？', 'Drop the ' + it.en + '?'))) R.removeItem(inv, id); return false; }
    if (what !== 0) return false;
    if (it.home || it.ward) { R.removeItem(inv, id); return this.fieldEffect(it); }
    const m = await this.pickMember(L('給誰用？', 'On whom?'), (x) => (it.revive ? x.hp <= 0 : x.hp > 0));
    if (!m) { if (it.revive) await this.ui.say(null, L('沒有倒下的同伴。', 'No one is down.')); return false; }
    R.removeItem(inv, id);
    const nm = R.nameOf(m, getLang());
    if (it.revive) { m.hp = Math.max(1, Math.round(R.stat(m).maxHp * it.revive)); this.audio.sfx('heal'); await this.ui.say(null, L(nm + '醒過來了！', nm + ' comes round!')); return false; }
    if (it.heal) { const b = m.hp; m.hp = Math.min(R.stat(m).maxHp, m.hp + R.rand(it.heal[0], it.heal[1])); this.audio.sfx('heal'); await this.ui.say(null, L(nm + '回復了' + (m.hp - b) + '點體力。', nm + ' recovers ' + (m.hp - b) + ' HP.')); return false; }
    if (it.mp) { const b = m.mp; m.mp = Math.min(R.stat(m).maxMp, m.mp + it.mp); this.audio.sfx('heal'); await this.ui.say(null, L(nm + '的內力回復了' + (m.mp - b) + '點。', nm + ' recovers ' + (m.mp - b) + ' MP.')); return false; }
    if (it.cure) { m.poison = false; this.audio.sfx('heal'); await this.ui.say(null, L(nm + '的毒解了。', nm + ' is cured.')); return false; }
    return false;
  }
  async equipMenu() {
    const m = this.party.length === 1 ? this.party[0] : await this.pickMember(STR.equip);
    if (!m) return;
    const ui = this.ui, inv = this.inv; let at = 0;
    const slots = R.slotsOf(m);
    for (;;) {
      const doll = ui.panel('eqdoll', m.who === 'yirui' ? this.dollHTML(m) : `<div class="dollbox">${this.picHTML(m, true)}</div>`);
      const i = await ui.choose(slots.map((s) => ({ label: SLOT_NAME[s], sub: m[s] ? ITEMS[m[s]] : STR.none })), { title: R.nameOf(m, getLang()), ctx: 'eqslot', cls: 'wide eqmenu', start: at });
      doll.remove();
      if (i < 0) return;
      at = i; const s = slots[i];
      const own = inv.bag.filter((b) => ITEMS[b.id].kind === s && R.canWear(m, b.id));
      const opts = own.map((b) => ({ label: ITEMS[b.id], sub: shortStats(b.id) }));
      if (m[s]) opts.push({ label: STR.unequip, sub: '' });
      if (!opts.length) { await ui.say(null, L('沒有可以換的。', 'Nothing to change to.')); continue; }
      const j = await ui.choose(opts, { title: SLOT_NAME[s], ctx: 'eqpick', cls: 'eqpick', keys: own.map((b) => b.id), onMove: (k) => (k < own.length ? this.showCompare(own[k].id, m) : this.hideCompare()) });
      this.hideCompare();
      if (j < 0) continue;
      if (j < own.length) this.wear(m, own[j].id);
      else if (!R.unequip(inv, m, s)) { await ui.say(null, L('行囊滿了，卸不下來。', 'Your pack is full.')); continue; }
      else if (m.who === 'yirui') this.dressUp();
      this.audio.sfx('ok');
    }
  }
  dollHTML(m) {
    const h = m || this.hero, P = this.dollPics();
    const slot = (s) => `<div class="dslot"><span>${t(SLOT_NAME[s])}</span><b>${h[s] ? t(ITEMS[h[s]]) : '—'}</b></div>`;
    return `<div class="dollbox"><div class="dcol">${['hd', 'ck', 'a', 'c'].map(slot).join('')}</div><div class="dfig"><img class="dbig" src="${P.down}"><div class="dsmall"><img src="${P.side}"><img src="${P.up}"></div></div><div class="dcol">${['w', 'pd', 'bt'].map(slot).join('')}</div></div>`;
  }
  async settings() {
    const ui = this.ui, a = this.audio;
    const step = (v) => { const n = Math.round(v * 10) + 2; return n > 10 ? 0 : n / 10; };
    let at = 0;
    for (;;) {
      const q = this.view ? this.view.quality : 'high';
      const i = await ui.choose([
        { label: getLang() === 'zh' ? '語言：中文' : 'Language: English' },
        { label: STR.music, sub: Math.round(a.vol.music * 10) + '' }, { label: STR.sound, sub: Math.round(a.vol.sfx * 10) + '' },
        { label: STR.quality, sub: { low: STR.qlow, medium: STR.qmed, high: STR.qhigh }[q] },
        { label: ['戰鬥速度', 'Battle speed'], sub: this.quick ? t(['快', 'fast']) : t(['普通', 'normal']) },
      ], { title: STR.config, ctx: 'settings', cls: 'wide', start: at });
      if (i < 0) return;
      at = i;
      if (i === 0) { setLang(getLang() === 'zh' ? 'en' : 'zh'); }
      if (i === 1) { a.vol.music = step(a.vol.music); a.applyVol(); }
      if (i === 2) { a.vol.sfx = step(a.vol.sfx); a.applyVol(); a.sfx('ok'); }
      if (i === 3) { const nq = { low: 'medium', medium: 'high', high: 'low' }[q]; try { localStorage.setItem('lq2_quality', nq); } catch (e) {} this.autosave(); await ui.say(null, L('畫質將在重新載入後套用。', 'Graphics change applies after a reload.')); location.reload(); return; }
      if (i === 4) { this.quick = !this.quick; try { localStorage.setItem('lq2_quick', this.quick ? '1' : ''); } catch (e) {} }
    }
  }

  // ---------------------------------------------------------------- fades and drawing
  async whiteOut() { if (!this.view || this.fast) return; for (const v of [1, 0, 1, 0.3, 1]) { this.view.flash(v); await sleep(45); } this.view.flash(0); }
  async turnOut() { if (!this.view || this.fast) return; await this.view.turnOut(); }
  async turnIn() { if (!this.view || this.fast) return; await this.view.turnIn(); }
  async fadeOut() { if (!this.view || this.fast) return; for (let i = 1; i <= 6; i++) { this.view.fade(i / 6); await sleep(30); } }
  async fadeIn() { if (!this.view || this.fast) return; for (let i = 5; i >= 0; i--) { this.view.fade(i / 6); await sleep(30); } }
  flashRed() { this.audio.sfx('poison'); const s = document.getElementById('screen'); if (s && !this.fast) { s.classList.remove('red'); void s.offsetWidth; s.classList.add('red'); } }
  draw(dt) {
    const v = this.view; if (!v || !this.heroA) return;
    const fr = Math.floor(this.anim * 4) % 2;
    let hx = this.x, hy = this.y;
    const k = this.moving ? Math.min(1, this.moving.t) : 1;
    if (this.moving) { const m = this.moving; hx = m.fx + (m.tx - m.fx) * k; hy = m.fy + (m.ty - m.fy) * k; }
    this.heroA.set(this.onShip ? 'down' : this.dir, this.onShip ? 0 : fr); this.heroA.place(hx, hy);
    // the others walk in a line behind the leader, each on the tile the one ahead just left
    if (this.followA && !this.onShip) {
      let ax = hx, ay = hy;
      for (let i = 0; i < this.followA.length; i++) {
        const a = this.followA[i], p = this.trail[i] || { x: this.x, y: this.y }, q = (this.moving && this.trailPrev && this.trailPrev[i]) || p;
        const fx = q.x + (p.x - q.x) * k, fy = q.y + (p.y - q.y) * k;
        const d = ay < fy ? 'up' : ay > fy ? 'down' : ax > fx ? 'right' : ax < fx ? 'left' : this.dir;
        const here = Math.abs(fx - hx) < 0.01 && Math.abs(fy - hy) < 0.01;   // still on the leader's tile (just arrived): tucked away
        if (a.shown !== !here) { a.shown = !here; a.visible(!here); }
        a.set(d, fr); a.place(fx, fy); ax = fx; ay = fy;
      }
    }
    if (this.shipA && this.ship) { this.shipA.set('down', 0); this.shipA.place(this.ship.x, this.ship.y); }
    for (const n of this.npcs) { if (!n.actor) continue; let x = n.x, y = n.y; if (n.mv) { const q = Math.min(1, n.mv.t); x = n.mv.fx + (n.x - n.mv.fx) * q; y = n.mv.fy + (n.y - n.mv.fy) * q; } n.actor.set(n.dir, fr); n.actor.place(x, y); }
    v.frame(dt, { x: hx + 0.5, z: hy + 0.5 });
  }
}
// the gist of a piece in a few characters (the equip list)
function shortStats(id) { const it = ITEMS[id], o = []; for (const [k, zh, en] of [['atk', '攻', 'A'], ['def', '防', 'D'], ['agi', '敏', 'Ag'], ['mhp', '體', 'HP'], ['mmp', '氣', 'MP']]) if (it[k]) o.push(t([zh, en]) + it[k]); return o.slice(0, 2).join(' '); }
export function mapName(id) { if (id === 'world') return t(['野外', 'Wilds']); const M = MAPS[id]; return M ? t(M.name) : id; }
// which chapter the story has reached (1-4)
export function chapterOf(F) { return F.ch3Done ? 4 : F.shipGot ? 3 : F.ch1Done ? 2 : 1; }
// 白先生's hint for what to do next
function storyHint(G) {
  const F = G.flags;
  if (!F.campOpen) return L('杏花村北邊有座廢寨，聽說住了個怪人，專收被打醒的妖物。去看看吧。', 'North of Xinghua Village is an old stockade where an odd fellow takes in creatures that come to their senses. Go and see.');
  if (!F.yelangDone) return L('野狼坡的狼群發了狂，劫了一支鏢隊。鏢頭據說還困在坡上的洞裡。去救人吧。', 'The wolves of Wolf Slope have gone mad and attacked a caravan. They say the escort is still trapped in the cave on the slope. Go and save him.');
  if (!F.ch1Done) return L('鈴聲是從東北的鈴音寺傳來的。寺裡的和尚都逃了，取而代之的是一群搖鈴的怪人。過了落霞鎮往北，沿著山路上去。', 'The bell rings from the Bell Temple to the north-east. The monks have fled; strange men with bells have taken it. Go past Luoxia Town and up the mountain path.');
  if (!F.wenJoined) return L('斷橋修好了。橋東是水鄉蘇河城，城裡茶樓有個只用對聯說話的書生，學問大得很，你們用得著他。', 'The bridge is mended. East of it lies the canal city of Suhe; in a teahouse there is a scholar who speaks only in couplets. You will want his learning.');
  if (!F.sujiaDone) return L('蘇河城北邊的蘇家舊宅，夜夜有人奉茶，卻二十年沒住過活人。燈籠帶上。', 'In the old Su mansion north of Suhe someone pours tea every night, though no living soul has lived there for twenty years. Take a lantern.');
  if (!F.biboDone) return L('碧波洞裡的江蛟也被鈴聲縛住了。水魄就在牠守著的潭底。碧波湖在蘇河城南邊。', 'The river jiao of Green Wave Cave is bell-bound too, and the Water Soul lies in the pool it guards, south of Suhe.');
  if (!F.shipGot) return L('望月渡的船王欠柳閣主一個人情。拿下江蛟，河道太平了，他自然肯借船。', 'The Ship King of Wangyue Ferry owes Mistress Liu a favour. With the jiao calmed and the river safe, he will lend you a ship.');
  if (!F.dulongDone) return L('有了船，往南走。南疆青竹寨的阿蠻聽得懂妖物說話，她說毒龍沼的妖物哭了一個月了。', 'With a ship, sail south. A-Man of the Green Bamboo village understands creatures; she says the beasts of Poison Dragon Marsh have been weeping for a month.');
  if (!F.chiyanDone) return L('火魄在南疆東邊的赤焰窟，火山口下。焰口村的人會告訴你怎麼上去。', 'The Fire Soul is in the Red Flame Caves under the volcano in the east of the south. The people of Yankou will show you the way.');
  if (!F.ch3Done) return L('兩魄到手，就該送到安全的地方……漁火島的客棧是個歇腳的好地方，先去那裡喘口氣。', 'With two souls in hand, they should go somewhere safe... The inn on Fishing-fire Isle is a good place to catch your breath first.');
  if (!F.bingpoDone) return L('莫記得帶著兩魄往北去了。北雁關的鐵鍊已經放下，冰魄窟就在北地東邊。', 'Mo Jide has fled north with the two souls. The chain of Beiyan Pass is lowered; the Ice Soul Caves lie in the east of the north.');
  if (!F.finalDone) return L('冰牆已化，萬妖峰就在眼前。這段書，就差最後一回了。', 'The ice wall has melted and the Peak of Ten Thousand Beasts stands before you. This tale lacks only its last chapter.');
  return L('這段書，總算說完了。', 'This tale is finally told.');
}
