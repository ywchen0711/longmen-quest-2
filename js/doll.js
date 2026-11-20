// The paper doll (紙娃娃): what 奕叡 wears changes how he looks - on the field (all four directions, both walk
// frames), on his battle card, in the status window and in his dialogue portrait.
// Everything is composited from his own 16x24 NES sprite (doll_base.js) and small 8-bit pieces stamped on top of it,
// in NES palette indices: an armour recolours his robe (with a pattern), boots his feet, a headband his band; hats,
// helmets, crowns, cloaks, pendants, bracers and weapons are hand-typed pixel pieces per view. The walk rule holds:
// a piece is the same on both walk frames, only the legs (the bottom 5 rows) step.
// Pure functions on index grids (no DOM), so the game builds a sheet once per change of gear and a test can run it.
import { SPRITE, PORTRAIT } from './doll_base.js?v=1';

export const K = 0x0F, SKIN = 0x37, BLUE = 0x12;
const W = 16, H = 24;
const dark = (c) => (c >= 0x10 ? c - 0x10 : 0x0F);
const light = (c) => (c < 0x30 ? c + 0x10 : 0x30);

function decode(g) {
  const w = g.rows[0].length, h = g.rows.length, p = new Int16Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = g.rows[y][x]; p[y * w + x] = ch === '.' ? -1 : g.pal[parseInt(ch, 36)]; }
  return p;
}
let BASE = null;
const base = () => BASE || (BASE = { down: SPRITE.down.map(decode), side: SPRITE.side.map(decode), up: SPRITE.up.map(decode), por: decode(PORTRAIT) });

// ---------------------------------------------------------------- stamping
// a piece: { x, y, g: [rows], under } - '#' black, 'a' 'b' 'c' the look's colours, 'k' skin, 'x' erase, '.' leave.
// under: only fills where nothing is drawn yet (it hangs behind him).
function stamp(p, w, pc, L) {
  const rows = pc.g;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    const x = pc.x + i, y = pc.y + j; if (x < 0 || y < 0 || x >= w || y * w >= p.length) continue;
    const o = y * w + x; if (pc.under && p[o] >= 0) continue;
    p[o] = ch === '#' ? K : ch === 'x' ? -1 : ch === 'k' ? SKIN : (L[ch] ?? L.a);
  }
}
function recolour(p, w, pts, from, to) { for (const [x, y] of pts) { const o = y * w + x; if (from == null ? p[o] >= 0 : p[o] === from) p[o] = to; } }
function line(p, w, x0, y0, x1, y1, c, under) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n), o = y * w + x; if (x < 0 || x >= w || y < 0 || o >= p.length) continue; if (under && p[o] >= 0) continue; p[o] = c; }
}

// ---------------------------------------------------------------- the pieces, per view (down = front, side faces right, up = back)
// his ring-pommel saber shows as the ring over his shoulder; other weapons take its place
const RING = {
  down: [[1, 9], [0, 10], [1, 10], [2, 10], [0, 11], [1, 11], [2, 11]],
  side: [[2, 11], [3, 11], [4, 11], [2, 12], [3, 12], [4, 12]],
  up: [[13, 10], [14, 10], [15, 10], [12, 11], [13, 11], [14, 11], [15, 11]],
};
const RING_HOLE = { down: [[1, 10]], side: [[3, 11], [3, 12]], up: [[14, 10]] };
const WEAPON = {
  // a jian: pommel, grip and a crossguard over the shoulder; on his back the scabbard runs down the old strap
  sword: {
    down: [{ x: 0, y: 6, g: ['.#.', '#c#', '.#.', '.#.', '#a#', 'ccc'] }],
    side: [{ x: 1, y: 7, g: ['.#.', '#c#', '.#.', '.#.', 'cac', '.#.'] }],
    up: [{ x: 12, y: 6, g: ['..#.', '.#c#', '..#.', '.##.', 'cca.', '.#..'] }],
  },
  // the horse-cutter: a long two-hand grip wrapped in red, the ring high over his shoulder
  bigdao: {
    down: [{ x: 0, y: 4, g: ['.#.', '#b#', '.#.', '.c.', '.#.', '.c.', '.#.', '###'] }],
    side: [{ x: 1, y: 5, g: ['.#.', '#b#', '.#.', '.c.', '.#.', '.c.', '.#.'] }],
    up: [{ x: 12, y: 3, g: ['..#.', '.#b#', '..#.', '..c.', '..#.', '.#c.', '.#..', '##..'] }],
  },
  // a spear: the shaft behind him, its blade and red tassel over his head
  spear: {
    down: [{ x: 0, y: 0, g: ['.#.', '#b#', '#a#', '.#.', 'ccc', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.'] }],
    side: [{ x: 1, y: 0, g: ['.#.', '#b#', '#a#', '.#.', 'ccc', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.'], under: true }],
    up: [{ line: [4, 19, 13, 4], c: 'c' }, { x: 12, y: 0, g: ['.#..', '#b#.', '#a#.', '.##.', 'cc..'] }],
  },
  // a staff: a pole with iron caps
  staff: {
    down: [{ x: 0, y: 1, g: ['.#.', '#a#', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.'] }],
    side: [{ x: 1, y: 1, g: ['.#.', '#a#', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '.c.', '#a#'], under: true }],
    up: [{ line: [3, 20, 13, 2], c: 'c' }, { x: 12, y: 1, g: ['.#.', '#a#'] }, { x: 2, y: 19, g: ['#a#'] }],
  },
  // a folding fan tucked into his belt
  fan: {
    down: [{ x: 11, y: 14, g: ['.#b#', '#bab', '.#a#'] }],
    side: [{ x: 9, y: 15, g: ['#b#', 'bab', '#a#'] }],
    up: [{ x: 10, y: 14, g: ['.#b#', '#bab', '.#a#'] }],
  },
};
const HEAD = {
  // a conical bamboo hat over the head; its brim hides the headband
  hat: {
    down: [{ x: 0, y: 0, g: ['.......##.......', '......#bb#......', '.....#bbaa#.....', '...##bbaaaa##...', '.##bbaaaaaaaa##.', '#bbaaaaaaaaaaaa#', 'x##############x'] }],
    side: [{ x: 0, y: 0, g: ['......##........', '.....#bb#.......', '....#bbaa#......', '..##bbaaaa##....', '##bbaaaaaaaa##..', '#aaaaaaaaaaaaa#.', 'x############...'] }],
    up: [{ x: 0, y: 0, g: ['.......##.......', '......#bb#......', '.....#bbaa#.....', '...##bbaaaa##...', '.##bbaaaaaaaa##.', '#bbaaaaaaaaaaaa#', 'x##############x', 'x...............'] }],
  },
  // a round iron helmet with a knob, a band of rivets and a neck guard behind
  helm: {
    down: [{ x: 0, y: 0, g: ['.......##.......', '......#cc#......', '....##baaa##....', '...#bbaaaaaa#...', '..#baaaaaaaaa#..', '..#cacacacaca#xx', '..............xx'] }],
    side: [{ x: 0, y: 0, g: ['......##........', '.....#cc#.......', '...##baaa##.....', '..#bbaaaaaa#....', '.#baaaaaaaaa#...', '#cacacacacac#...', '#aa#............', '#aa#............', '.##.............'] }],
    up: [{ x: 0, y: 0, g: ['.......##.......', '......#cc#......', '....##baaa##....', '...#bbaaaaaa#...', '..#baaaaaaaaa#..', '.#cacacacacaca#.', 'x#aaaaaaaaaaa#..', 'x.#aaaaaaaaa#...', '...#########....'] }],
  },
  // a little crown on his topknot (the headband stays)
  crown: {
    down: [{ x: 4, y: 0, g: ['#.#..#.#', '#a#aa#a#', '#abccba#', '.######.'] }],
    side: [{ x: 3, y: 0, g: ['#.#..#.#', '#a#aa#a#', '#abccba#', '.######.'] }],
    up: [{ x: 4, y: 0, g: ['#.#..#.#', '#a#aa#a#', '#abaaba#', '.######.'] }],
  },
};
const HEAD_MORE = {
  brow: { down: [{ x: 7, y: 5, g: ['bb'] }], side: [{ x: 10, y: 4, g: ['b'] }], up: [] },
  veil: { down: [{ x: 1, y: 6, g: ['#.............#', '.#............#', '#.............#', '.#............#'] }], side: [{ x: 1, y: 6, g: ['#', '.', '#', '.'] }], up: [{ x: 1, y: 7, g: ['.#..........#', '#............#'] }] },
};
const CLOAK = {
  // behind him from the front: it shows past his sides and between his legs; a mantle and clasp over his shoulders
  down: [
    { x: 0, y: 12, under: true, g: ['..aaaaaaaaaaaa..', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'abaaaaaaaaaaaaba', 'abaaaaaaaaaaaaba', 'abaaaaaaaaaaaaba', '#baaaaaaaaaaaab#', '#bbaaaaaaaaaabb#', '.#bbbbbbbbbbbb#.', '..############..'] },
    { x: 1, y: 12, g: ['#aaa#.....#aa#', '.#a#.......#a#'] },
    { x: 7, y: 12, g: ['c'] },
  ],
  side: [{ x: 0, y: 11, under: true, g: ['...a', '..aa', '.aaa', '.aba', 'aaba', 'aaba', 'aaba', 'abaa', 'abaa', '#bba', '.###'] }, { x: 4, y: 12, g: ['#c'] }],
  up: [{ x: 1, y: 11, g: ['..##########..', '.#aaaaaaaaaaa#.', '#aaaaaaaaaaaaa#', '#aaabaaaaabaaa#', '#aaabaaaaabaaa#', '#aabaaaaaaabaa#', '#aabaaaaaaabaa#', '#abaaaaaaaaaba#', '#abaaaaaaaaaba#', '#bbbbbbbbbbbbb#', '.#############.'] }],
};
const PENDANT = {
  jade: { down: [{ x: 7, y: 13, g: ['#', 'a', 'b'] }], side: [{ x: 9, y: 14, g: ['a', 'b'] }], up: [] },
  charm: { down: [{ x: 7, y: 14, g: ['a', 'b'] }], side: [{ x: 9, y: 14, g: ['a', 'b'] }], up: [] },
  beads: { down: [{ x: 4, y: 12, g: ['a......a', '.a....a.', '..abba..'] }], side: [{ x: 7, y: 13, g: ['a.', '.a', 'b.'] }], up: [{ x: 4, y: 11, g: ['a......a'] }] },
};
const BRACER = { down: [[2, 15], [3, 15], [13, 15], [2, 16], [3, 16], [13, 16]], side: [[10, 15], [11, 15], [11, 16]], up: [[2, 15], [2, 16], [3, 16], [13, 15], [13, 16]] };
const MIRROR = { down: [{ x: 5, y: 13, g: ['#bb#', '#ab#', '.##.'] }], side: [{ x: 8, y: 14, g: ['b', 'a'] }], up: [] };

// ---------------------------------------------------------------- one view of the doll
// looks: { w, a, c, hd, bt, ck, pd } - each an item's look (data.js) or null
export function dressView(view, frame, looks) {
  const p = base()[view][frame].slice(), w = W, L = {};
  const pal = (lk) => { L.a = lk.a; L.b = lk.b ?? light(lk.a); L.c = lk.c ?? dark(lk.a); return L; };
  const run = (list, lk) => { if (!list) return; pal(lk); for (const pc of list) { if (pc.line) { const [x0, y0, x1, y1] = pc.line; line(p, w, x0, y0, x1, y1, L[pc.c] ?? L.a, pc.under); } else stamp(p, w, pc, L); } };
  // a cloak hangs behind him (front and side views) before anything is drawn over him
  if (looks.ck && view !== 'up') run(CLOAK[view].filter((pc) => pc.under), looks.ck);
  // the armour recolours his robe below the head: the torso (with its pattern), then the trousers
  if (looks.a) {
    const A = looks.a, b = A.b ?? light(A.a);
    for (let y = 11; y < H; y++) for (let x = 0; x < w; x++) {
      const o = y * w + x; if (p[o] !== BLUE) continue;
      if (y <= 17) {
        const pt = A.p === 'chain' ? (x + y) % 2 === 0 : A.p === 'scale' ? (y % 2 === 0 && x % 2 === 0) || (y % 2 === 1 && x % 2 === 1 && x % 4 === 1) : A.p === 'trim' ? (p[o - 1] === K || p[o + 1] === K) : false;
        p[o] = pt ? b : A.a;
      } else if (A.t != null) p[o] = A.t;
    }
  }
  if (looks.c) { const C = looks.c; if (C.f === 'mirror') run(MIRROR[view], C); else { for (const [x, y] of BRACER[view]) { const o = y * w + x; if (p[o] >= 0 && p[o] !== K && p[o] !== SKIN) p[o] = C.a; } } }
  // boots: the feet below the trousers; greaves also cover the shins
  if (looks.bt) {
    const B = looks.bt, top = view === 'side' ? 22 : 21;
    for (let y = top; y < H; y++) for (let x = 0; x < w; x++) {
      const o = y * w + x; if (p[o] !== K) continue;
      const solid = (xx, yy) => xx >= 0 && xx < w && yy >= 0 && yy < H && base()[view][frame][yy * w + xx] >= 0;
      if (solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && (solid(x, y + 1) || y === H - 1 || view === 'side')) p[o] = (y === top && B.b != null) ? B.b : B.a;
    }
    if (B.f === 'greaves') for (let y = top - 2; y < top; y++) for (let x = 0; x < w; x++) { const o = y * w + x; if (p[o] === BLUE || (looks.a && looks.a.t != null && p[o] === looks.a.t)) p[o] = y === top - 2 ? (B.b ?? light(B.a)) : B.a; }
  }
  if (looks.ck) run(CLOAK[view].filter((pc) => !pc.under), looks.ck);
  if (looks.pd) run((PENDANT[looks.pd.f] || PENDANT.jade)[view], looks.pd);
  // the head: a band recolours his headband; hats and helmets cover it
  if (looks.hd) {
    const D = looks.hd;
    if (D.f === 'band' || D.f === 'brow' || D.f === 'crown') for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) { const o = y * w + x; if (p[o] === BLUE && D.f !== 'crown') p[o] = D.f === 'brow' ? (D.c ?? D.a) : D.a; }
    if (D.f === 'brow') run(HEAD_MORE.brow[view], D);
    if (HEAD[D.f]) run(HEAD[D.f][view], D);
    if (D.f === 'hat' && D.veil) run(HEAD_MORE.veil[view], D);
  }
  // the weapon: his ring-pommel saber as drawn (a dao), or the ring gives way to another weapon
  const wl = looks.w;
  if (!wl || wl.f !== 'dao') for (const [x, y] of RING[view]) p[y * w + x] = view === 'up' && y === 11 && x === 12 ? K : -1;
  if (view === 'up' && (!wl || wl.f !== 'dao')) { for (const [x, y] of [[13, 10], [14, 10], [15, 10], [13, 11], [14, 11], [15, 11]]) p[y * w + x] = -1; }
  if (wl && wl.f === 'dao' && wl.c != null) recolour(p, w, RING_HOLE[view], null, wl.c);
  if (wl && WEAPON[wl.f]) run(WEAPON[wl.f][view], wl);
  return p;
}

// all six frames: { down: [f1, f2], side: [...], up: [...] }
export function dress(looks) { const out = {}; for (const v of ['down', 'side', 'up']) out[v] = [dressView(v, 0, looks), dressView(v, 1, looks)]; return out; }

// ---------------------------------------------------------------- the portrait (48x56): headgear and the robe's colours
export function dressPortrait(looks) {
  const p = base().por.slice(), w = 48, h = 56;
  const at = (x, y) => p[y * w + x], put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) p[y * w + x] = c; };
  if (looks.a && looks.a.a !== BLUE) {
    const a = looks.a.a, hi = a >= 0x10 ? a : light(a), lo = a >= 0x10 ? dark(a) : a;
    const pa = looks.a.p, b = looks.a.b ?? light(a);
    for (let y = 36; y < h; y++) for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === 0x02) put(x, y, pa === 'chain' && (x + y) % 2 === 0 ? b : pa === 'scale' && y % 3 === 0 && (x + Math.floor(y / 3)) % 3 === 0 ? b : lo);
      else if (c === BLUE) put(x, y, hi);
    }
  }
  const D = looks.hd; if (!D) return p;
  const band = 0x11, A = D.a, B = D.b ?? light(D.a), C = D.c ?? dark(D.a);
  if (D.f === 'band' || D.f === 'brow') {
    for (let y = 10; y < 17; y++) for (let x = 0; x < w; x++) if (at(x, y) === band) put(x, y, D.f === 'brow' ? (D.c ?? D.a) : A);
    if (D.f === 'brow') for (let y = 12; y <= 14; y++) for (let x = 21; x <= 26; x++) put(x, y, (y === 12 || x === 21 || x === 26) ? K : B);
    return p;
  }
  // the headband's flying tails go under anything worn on the head
  for (let y = 10; y < 16; y++) for (let x = 36; x < w; x++) if (at(x, y) === band) put(x, y, K);
  if (D.f === 'hat') {
    // a cone from the crown down to a wide brim, lit from the left
    for (let y = 0; y <= 13; y++) { const hw = Math.round(2 + y * 1.65); for (let x = 24 - hw; x <= 23 + hw; x++) put(x, y, (x === 24 - hw || x === 23 + hw) ? K : (x < 24 - hw + Math.max(2, hw * 0.45) ? B : A)); }
    for (let x = 1; x <= 46; x++) { put(x, 14, K); put(x, 13, x === 1 || x === 46 ? K : (x % 4 === 0 ? C : A)); }
    for (let y = 2; y <= 12; y += 3) put(24 - Math.round(1 + y * 0.4), y, C);
    if (D.veil) for (let y = 15; y <= 26; y++) for (let x = 3; x <= 44; x++) if ((x < 13 || x > 35) && (x + y) % 2 === 0) put(x, y, K);
  } else if (D.f === 'helm') {
    for (let y = 0; y <= 15; y++) { const hw = y < 2 ? 2 : Math.min(13, Math.round(Math.sqrt(Math.max(0, 169 - (15 - y) * (15 - y) * 0.75)))); if (y >= 2 && hw < 4) continue; for (let x = 24 - hw; x <= 23 + hw; x++) put(x, y, (x === 24 - hw || x === 23 + hw || y === 0) ? K : y >= 12 ? ((x % 3 === 0) ? B : C) : (x < 24 - hw + hw * 0.5 ? B : A)); }
    for (let y = 16; y <= 27; y++) for (const x0 of [10, 35]) for (let x = x0; x < x0 + 3; x++) put(x, y, (x === x0 || x === x0 + 2 || y === 27) ? K : A);
  } else if (D.f === 'crown') {
    for (let y = 0; y <= 7; y++) for (let x = 18; x <= 29; x++) {
      const spike = y < 3 && (x === 18 || x === 19 || x === 23 || x === 24 || x === 28 || x === 29);
      if (y < 3 && !spike) continue;
      put(x, y, (x === 18 || x === 29 || y === 7 || (y === 0)) ? K : (y === 4 && (x === 23 || x === 24)) ? C : (x < 21 ? B : A));
    }
  }
  return p;
}

// ---------------------------------------------------------------- to pixels (the browser side)
// paint a grid into a 2D context at (dx, dy) with NES colours (NES: 0xRRGGBB per index)
export function paint(g, grid, w, h, NES, dx = 0, dy = 0) {
  const id = g.createImageData(w, h), d = id.data;
  for (let i = 0; i < w * h; i++) { const c = grid[i]; if (c < 0) continue; const v = c === K ? 0 : NES[c]; d[i * 4] = v >> 16 & 255; d[i * 4 + 1] = v >> 8 & 255; d[i * 4 + 2] = v & 255; d[i * 4 + 3] = 255; }
  g.putImageData(id, dx, dy);
}
// the whole sheet: 2 columns (walk frames) x 3 rows (down, side, up) of 16x24, the same layout as the cast sheets
export function sheetCanvas(frames, NES, c) {
  c = c || document.createElement('canvas'); c.width = 32; c.height = 72; const g = c.getContext('2d'); g.clearRect(0, 0, 32, 72);
  ['down', 'side', 'up'].forEach((v, r) => frames[v].forEach((f, i) => paint(g, f, 16, 24, NES, i * 16, r * 24)));
  return c;
}
export function portraitCanvas(grid, NES) { const c = document.createElement('canvas'); c.width = 48; c.height = 56; paint(c.getContext('2d'), grid, 48, 56, NES); return c; }
