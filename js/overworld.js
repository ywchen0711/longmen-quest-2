// The world map's scenery printed on the page, the way 8-bit and 16-bit overworlds draw it: every forest, bamboo,
// hill and mountain tile is a 16x16 picture that stays inside its own square (a clump of trees, a peak), with edge
// and corner pieces so a forest or a range reads as one shape with a neat inked border. Only a short row of
// pop-up peaks along the front of each range stands up from the page (cards no taller than their own tile, so they
// never cover the row behind). Shared by both Longmen games; drawn in code in NES-palette pixels like the rest.
const NES = [
  0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400, 0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
  0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10, 0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
  0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044, 0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
  0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8, 0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000,
];
const T = 16;
const hash = (x, z, k = 0) => { let h = (Math.imul(x | 0, 73856093) ^ Math.imul(z | 0, 19349663) ^ Math.imul(k, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };

// ---------------------------------------------------------------- a little pixel buffer (NES indexes, -1 = clear)
function Buf(w = T, h = T) {
  const b = new Int16Array(w * h).fill(-1);
  const put = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h && c >= 0) b[y * w + x] = c; };
  const val = (c, x, y) => (typeof c === 'function' ? c(x, y) : c);
  return {
    w, h, b, put, get: (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? b[y * w + x] : -1),
    ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) put(x, y, val(c, x, y)); } },
    poly(pts, c) {
      const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
      for (let y = y0; y <= y1; y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, q) => a - q);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(x, y, val(c, x, y));
      }
    },
    line(x0, y0, x1, y1, c) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1; for (let i = 0; i <= n; i++) put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
    // empty pixels next to the picture become the outline
    outline(c) { const o = b.slice(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (b[y * w + x] >= 0) continue; if ((x > 0 && b[y * w + x - 1] >= 0) || (x < w - 1 && b[y * w + x + 1] >= 0) || (y > 0 && b[(y - 1) * w + x] >= 0) || (y < h - 1 && b[(y + 1) * w + x] >= 0)) o[y * w + x] = c; } b.set(o); },
    canvas() {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), id = g.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { const k = b[i]; if (k < 0) continue; const v = NES[k]; id.data[i * 4] = v >> 16 & 255; id.data[i * 4 + 1] = v >> 8 & 255; id.data[i * 4 + 2] = v & 255; id.data[i * 4 + 3] = 255; }
      g.putImageData(id, 0, 0); return c;
    },
  };
}

// ---------------------------------------------------------------- palettes
// lit / shaded sides of a peak from the top down, its ink, the foothills it stands on and the region's outline
const RANGE = {
  mount: { lit: [0x1C, 0x2A, 0x3A], shade: [0x0C, 0x1A, 0x2A], ink: 0x0C, foot: 0x1A, fleck: 0x0A, edge: 0x0B, moss: 0x0B },
  snowmount: { lit: [0x30, 0x30, 0x10], shade: [0x10, 0x00, 0x00], ink: 0x2D, foot: 0x10, fleck: 0x00, edge: 0x00 },
  volcano: { lit: [0x16, 0x17, 0x07], shade: [0x06, 0x07, 0x08], ink: 0x0D, foot: 0x08, fleck: 0x07, edge: 0x0D, cap: 0x27 },
};
const GROUP = { forest: 'wood', bamboo: 'bamboo', mount: 'range', snowmount: 'range', volcano: 'range', hill: 'hill' };

// a peak inside a box: apex (ax, ay), feet from x0 to x1 on row `base`; lit to the left of the ridge
function peak(B, P, ax, ay, x0, x1, base, seed) {
  // a pinnacle: steep near the top, its flanks curving out to the feet
  const w = x1 - x0, h = base - ay, pts = [[x0, base], [x0 + w * 0.17, base - h * 0.2], [ax - (ax - x0) * 0.42, base - h * 0.5], [ax - (ax - x0) * 0.17, ay + h * 0.2], [ax, ay], [ax + (x1 - ax) * 0.2, ay + h * 0.22], [ax + (x1 - ax) * 0.45, base - h * 0.48], [x1 - w * 0.16, base - h * 0.18], [x1, base]];
  const ridge = (y) => ax + (y - ay) * -0.18;   // the ridge line runs down a little to the left: more of the face is in shade
  B.poly(pts, (x, y) => {
    const f = (y - ay) / Math.max(1, base - ay), band = f < 0.34 ? 0 : f < 0.72 ? 1 : 2, lit = x + 0.5 < ridge(y);
    if (P.cap != null && f < 0.2) return lit ? P.cap : 0x16;
    return lit ? P.lit[band] : P.shade[band];
  });
  // 皴 strokes on the shaded face and a few moss dots on the crest
  const r = hash(seed, ax * 7 + ay, 3);
  for (let k = 0; k < 2; k++) { const y0 = ay + 3 + ((r >> (k * 4)) & 3) + k * 3, x = ridge(y0) + 1.5 + ((r >> (k * 3 + 9)) & 1); if (y0 + 2 < base - 1) B.line(x, y0, x + 1, y0 + 2, P.ink); }
  if (P.moss != null) { B.put(ax - 1, ay + 1.5, P.moss); B.put(ax + 1, ay + 2.5, P.moss); }
  return pts;
}
// the ink contour round a peak (only on the pixels that stayed clear or are foothill)
function contour(B, pts, ink, keep) {
  const C = Buf(B.w, B.h); C.poly(pts, 1);
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
    if (C.get(x, y) >= 0) continue;
    if (C.get(x - 1, y) >= 0 || C.get(x + 1, y) >= 0 || C.get(x, y - 1) >= 0) { const v = B.get(x, y); if (v < 0 || keep(v)) B.put(x, y, ink); }
  }
}

// ---------------------------------------------------------------- one printed tile
// m: which neighbours belong to the same shape (n, e, s, w, ne, se, sw, nw); x, z: the tile (for variety)
function regionMask(m) {
  // inside the tile but outside the shape: a one-pixel margin on open sides, rounded outer corners, notched inner ones
  return (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if ((!m.n && y < 1) || (!m.s && y > 14) || (!m.w && x < 1) || (!m.e && x > 14)) return false;
    const R = 3.2, round = (cx, cy) => Math.hypot(px - cx, py - cy) <= R;
    if (!m.n && !m.w && px < 4.2 && py < 4.2 && !round(4.2, 4.2)) return false;
    if (!m.n && !m.e && px > 11.8 && py < 4.2 && !round(11.8, 4.2)) return false;
    if (!m.s && !m.w && px < 4.2 && py > 11.8 && !round(4.2, 11.8)) return false;
    if (!m.s && !m.e && px > 11.8 && py > 11.8 && !round(11.8, 11.8)) return false;
    if (m.n && m.w && !m.nw && x < 1 && y < 1) return false;
    if (m.n && m.e && !m.ne && x > 14 && y < 1) return false;
    if (m.s && m.w && !m.sw && x < 1 && y > 14) return false;
    if (m.s && m.e && !m.se && x > 14 && y > 14) return false;
    return true;
  };
}
const fleckOf = (tx, tz) => ((((tx * 80 + tz * 48) % 11) + 11) % 11);
function base(B, m, floor, fleck, edge, x0, z0) {
  const inside = regionMask(m), fk = fleckOf(x0, z0);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (inside(x, y)) B.put(x, y, (x * 5 + y * 3 + fk) % 11 === 0 ? fleck : floor);
  // the outline: shape pixels next to a pixel outside the shape (in this tile)
  const o = []; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (!inside(x, y)) continue;
    const out = (dx, dy) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= T || Y >= T) return false; return !inside(X, Y); };
    if (out(1, 0) || out(-1, 0) || out(0, 1) || out(0, -1)) o.push([x, y]);
  }
  for (const [x, y] of o) B.put(x, y, edge);
  return inside;
}

// a forest: rows of round crowns and pines, the back row first; the crowns on a tile's left and right edges are
// shared with the next tile (each draws its half), unless that side is the forest's edge
function crown(B, cx, cy, kind) {
  if (kind === 0) { B.ell(cx, cy, 3.6, 3.4, (x, y) => (x + 0.5 < cx - 0.6 && y + 0.5 < cy - 0.4 ? 0x3A : (x + 0.5 > cx + 1.6 || y + 0.5 > cy + 1.9) ? 0x1A : 0x2A)); }
  else { B.poly([[cx, cy - 4.4], [cx + 2.2, cy - 1], [cx + 1.4, cy - 1], [cx + 3.6, cy + 2.6], [cx - 3.6, cy + 2.6], [cx - 1.4, cy - 1], [cx - 2.2, cy - 1]], (x) => (x + 0.5 < cx ? 0x2B : 0x1B)); }
}
function crownLine(B, cx, cy, kind, ink) {
  // the crown's own dark rim (drawn under it, one pixel bigger)
  if (kind === 0) B.ell(cx, cy + 0.3, 4.4, 4.1, ink);
  else B.poly([[cx, cy - 5.4], [cx + 3.1, cy - 1], [cx + 2.3, cy - 1], [cx + 4.6, cy + 3.5], [cx - 4.6, cy + 3.5], [cx - 2.3, cy - 1], [cx - 3.1, cy - 1]], ink);
}
function forestTile(m, tx, tz) {
  const B = Buf(); base(B, m, 0x0A, 0x0B, 0x0D, tx, tz);
  const kind = (gx, gy) => (hash(gx, gy, 11) % 10 < 4 ? 1 : 0);   // about four pines in ten
  const back = [[4, 4.3], [12, 4.3]], front = [[0, 11.3], [8, 11.3], [16, 11.3]];
  for (const row of [back, front]) {
    const list = row.filter(([x]) => !(x === 0 && !m.w) && !(x === 16 && !m.e));
    for (const [x, y] of list) crownLine(B, x, y, kind(tx * 16 + x, tz * 16 + y), 0x0D);
    for (const [x, y] of list) crown(B, x, y, kind(tx * 16 + x, tz * 16 + y));
  }
  if (!m.s) for (const [x] of front) if (!(x === 0 && !m.w) && !(x === 16 && !m.e)) { B.put(x, 15, 0x08); B.put(x - 1, 15, 0x07); }
  return B;
}
// a bamboo grove: tall culms with nodes, running on through the tiles above and below; leaf sprays at the top edge
function bambooTile(m, tx, tz) {
  const B = Buf(); base(B, m, 0x0A, 0x0B, 0x0B, tx, tz);
  const top = m.n ? -1 : 3, bot = m.s ? 16 : 14;
  for (const [x0, k] of [[2, 0], [7, 1], [12, 2]]) {
    const x = x0 + (hash(tx, tz, k) % 2), ph = hash(tx, 0, k + 5) % 5;
    for (let y = Math.max(0, top); y < bot; y++) { const node = (y + ph) % 5 === 0; B.put(x - 1, y, 0x0B); B.put(x, y, node ? 0x0A : 0x2A); B.put(x + 1, y, node ? 0x0A : 0x1A); B.put(x + 2, y, 0x0B); }
    // leaves: two slanting blades off the culm
    const ly = 5 + ((ph * 3 + k) % 6); B.line(x + 2, ly, x + 4, ly - 2, 0x1A); B.line(x - 1, ly + 3, x - 3, ly + 1, 0x2A);
    if (!m.n) { B.line(x, top, x - 2.5, top - 2, 0x2A); B.line(x + 1, top, x + 3.5, top - 2, 0x1A); B.put(x, top - 1, 0x1A); }
  }
  return B;
}
// a range: foothills printed flat with one or two peaks in every tile; `foot` leaves the peak off (a pop-up stands there)
function rangeTile(kind, m, tx, tz, foot) {
  const P = RANGE[kind], B = Buf(); base(B, m, P.foot, P.fleck, P.edge, tx, tz);
  if (foot) return B;
  const v = hash(tx, tz, 21) % 4, sd = hash(tx, tz, 23) % 6, isFoot = (c) => c === P.foot || c === P.fleck || c === P.edge;
  if (v === 1) { const a = peak(B, P, 5, 1.5, 0, 11, 16, sd); contour(B, a, P.ink, isFoot); const b = peak(B, P, 11.5, 6, 6, 16, 16, sd + 7); contour(B, b, P.ink, () => true); }
  else { const ax = v === 2 ? 9.5 : v === 3 ? 6.5 : 8; const a = peak(B, P, ax, 1 + (v === 3 ? 1 : 0), 0.5, 15.5, 16, sd); contour(B, a, P.ink, isFoot); }
  return B;
}
// hills: a soft mound (or two) in the lower part of each tile, on the grass
function hillTile(tx, tz) {
  const B = Buf(), two = hash(tx, tz, 31) % 3 === 0;
  const mound = (x0, x1, top, bse) => { const w = x1 - x0, cx = x0 + w * 0.45; B.poly([[x0, bse], [x0 + w * 0.14, bse - (bse - top) * 0.62], [cx - w * 0.16, top + 0.4], [cx + w * 0.1, top], [x1 - w * 0.18, bse - (bse - top) * 0.6], [x1, bse]], (x, y) => (y < top + 2 ? 0x1C : x + 0.5 < cx - 1 ? 0x2A : x + 0.5 > cx + w * 0.2 ? 0x0A : 0x1A)); };
  if (two) { mound(0.5, 9.5, 6.5, 14.5); mound(6.5, 15.5, 8.5, 15.5); } else mound(0.5, 15.5, 5.5, 15);
  for (let x = 2; x < 14; x++) if (B.get(x, 12) >= 0 && B.get(x, 12) !== 0x0A && x % 3) B.put(x, 12, 0x3A);   // a thread of mist
  B.outline(0x0B);
  return B;
}

const cache = new Map();
function tilePixels(kind, m, tx, tz, foot) {
  // tiles that print the same picture share one set of pixels
  const mk = (m.n ? 1 : 0) | (m.e ? 2 : 0) | (m.s ? 4 : 0) | (m.w ? 8 : 0) | (m.ne ? 16 : 0) | (m.se ? 32 : 0) | (m.sw ? 64 : 0) | (m.nw ? 128 : 0);
  let vk;
  if (kind === 'forest') { const k = (gx, gy) => (hash(gx, gy, 11) % 10 < 4 ? 1 : 0); vk = [[4, 4.3], [12, 4.3], [0, 11.3], [8, 11.3], [16, 11.3]].map(([x, y]) => k(tx * 16 + x, tz * 16 + y)).join('') + ':' + fleckOf(tx, tz); }
  else if (kind === 'bamboo') vk = [0, 1, 2].map((k) => (hash(tx, tz, k) % 2) + '' + (hash(tx, 0, k + 5) % 5)).join('') + ':' + fleckOf(tx, tz);
  else if (kind === 'hill') vk = hash(tx, tz, 31) % 3 === 0 ? 'b' : 'a';
  else vk = (foot ? 'f' : (hash(tx, tz, 21) % 4) + '' + (hash(tx, tz, 23) % 6)) + ':' + fleckOf(tx, tz);
  const key = kind + '|' + mk + '|' + vk;
  let px = cache.get(key);
  if (!px) {
    const B = kind === 'forest' ? forestTile(m, tx, tz) : kind === 'bamboo' ? bambooTile(m, tx, tz) : kind === 'hill' ? hillTile(tx, tz) : rangeTile(kind, m, tx, tz, foot);
    px = new Int32Array(T * T).fill(-1); for (let i = 0; i < T * T; i++) if (B.b[i] >= 0) px[i] = NES[B.b[i]];
    if (cache.size > 4000) cache.clear(); cache.set(key, px);
  }
  return px;
}

// print the scenery over the ground already on the page. kindAt(x, z) -> 'forest' | 'bamboo' | 'mount' | 'snowmount' |
// 'volcano' | 'hill' | null; footAt(x, z): a pop-up peak stands on this tile, so only its foothills are printed.
// The scenery's pixels are written with alpha 245/255: the page's shader reads that as "print in stronger ink"
export function printScenery(g, x0, z0, x1, z1, kindAt, ox, oy, footAt = () => false) {
  const W = (x1 - x0) * T, H = (z1 - z0) * T, id = g.getImageData(ox, oy, W, H), d = id.data;
  for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
    const k = kindAt(x, z); if (!k) continue;
    const grp = GROUP[k], same = (dx, dz) => GROUP[kindAt(x + dx, z + dz)] === grp;
    const m = { n: same(0, -1), e: same(1, 0), s: same(0, 1), w: same(-1, 0), ne: same(1, -1), se: same(1, 1), sw: same(-1, 1), nw: same(-1, -1) };
    const px = tilePixels(k, m, x, z, footAt(x, z)), X = (x - x0) * T, Y = (z - z0) * T;
    for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
      const v = px[j * T + i]; if (v < 0) continue;
      const o = ((Y + j) * W + X + i) * 4; d[o] = v >> 16 & 255; d[o + 1] = v >> 8 & 255; d[o + 2] = v & 255; d[o + 3] = 245;
    }
  }
  g.putImageData(id, ox, oy);
}
// is this tile on the front (south) edge of its range? (where the pop-up peaks stand)
export function frontOfRange(kindAt, x, z) { const g = GROUP[kindAt(x, z)]; return g === 'range' && GROUP[kindAt(x, z + 1)] !== 'range'; }

// ---------------------------------------------------------------- the pop-up pieces (cards no taller than a tile)
// a peak card 16 wide and 14 tall: it stands on the front edge of its tile and covers only that tile on the page
function peakCard(kind, v) {
  const P = RANGE[kind], B = Buf(16, 14);
  if (v === 1) { const a = peak(B, P, 5.5, 1.5, 1, 11, 14, 7); contour(B, a, P.ink, () => true); const b = peak(B, P, 11, 5.5, 6.5, 15, 14, 9); contour(B, b, P.ink, () => true); }
  else { const a = peak(B, P, v === 2 ? 9 : 7.5, 1, 1, 15, 14, 5 + v); contour(B, a, P.ink, () => true); }
  // a band of mist along the foot, as on the scroll paintings
  for (let x = 0; x < 16; x++) { if (B.get(x, 11) >= 0 && B.get(x, 11) !== P.ink) B.put(x, 11, kind === 'snowmount' ? 0x10 : 0x30); if (B.get(x, 12) >= 0 && B.get(x, 12) !== P.ink && x % 3) B.put(x, 12, kind === 'snowmount' ? 0x10 : 0x30); }
  B.outline(0x0D);
  return B.canvas();
}
// short trees for the scenery round towns (14 tall, on the front edge of their tile)
function treeCard(kind) {
  const B = Buf(16, 14);
  if (kind === 'tree') { B.put(7, 13, 0x08); B.put(8, 13, 0x07); B.put(7, 12, 0x08); B.put(8, 12, 0x07); B.ell(4.5, 8.5, 3, 2.8, (x, y) => (y + 0.5 < 8 ? 0x2A : 0x1A)); B.ell(11.5, 8.5, 3, 2.8, (x, y) => (x + 0.5 > 12.5 ? 0x0A : 0x1A)); crown(B, 8, 5.5, 0); }
  else if (kind === 'pine') { B.put(7, 13, 0x08); B.put(8, 13, 0x07); B.poly([[8, 1], [11, 5], [10, 5], [13.5, 9.5], [11.5, 9.5], [14.5, 12.5], [1.5, 12.5], [4.5, 9.5], [2.5, 9.5], [6, 5], [5, 5]], (x) => (x + 0.5 < 8 ? 0x1B : 0x0B)); }
  else { for (const [x, t] of [[3, 3], [7, 0], [11, 2]]) { for (let y = t + 1; y < 14; y++) { const node = (y + x) % 5 === 0; B.put(x, y, node ? 0x0A : 0x2A); B.put(x + 1, y, node ? 0x0A : 0x1A); } B.line(x + 1, t + 4, x + 3.5, t + 2, 0x1A); B.line(x, t + 7, x - 2.5, t + 5, 0x2A); B.put(x, t, 0x2A); } }
  B.outline(0x0D);
  return B.canvas();
}
export const OW_POP = {
  owtree: () => treeCard('tree'), owpine: () => treeCard('pine'), owbamboo: () => treeCard('bamboo'),
  owpeak0: () => peakCard('mount', 0), owpeak1: () => peakCard('mount', 1), owpeak2: () => peakCard('mount', 2),
  owsnow0: () => peakCard('snowmount', 0), owsnow1: () => peakCard('snowmount', 1),
  owvolc0: () => peakCard('volcano', 0), owvolc1: () => peakCard('volcano', 2),
};
export const TREE_CARDS = { forest: ['owtree', 'owpine', 'owtree'], bamboo: ['owbamboo'] };
export const PEAK_CARDS = { mount: ['owpeak0', 'owpeak1', 'owpeak2'], snowmount: ['owsnow0', 'owsnow1'], volcano: ['owvolc0', 'owvolc1'] };
