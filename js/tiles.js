// Pixel textures for the pop-up book maps, drawn in code with colours from the NES (2C02) palette only.
// Each tile face is 16x16 (printed on the page, or on the walls' cards); pop-up pieces (trees, pots, statues, fire) are
// small typed grids, and mountains, waves and the world map's towns and caves are drawn with shapes (POP).
import { INK_POP, INK_FACES, chouse, GREYROOF } from './ink.js?v=6';
export const NES = [
  0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400, 0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
  0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10, 0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
  0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044, 0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
  0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8, 0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000,
];
export const hex = (i) => '#' + NES[i].toString(16).padStart(6, '0');

function rng(seed) { let s = seed >>> 0 || 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// draw a 16x16 face from a pattern function f(x, y, r) -> NES index (or -1 for transparent)
function face(seed, f, w = 16, h = 16) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed), img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = f(i, j, r); const o = (j * w + i) * 4; if (k < 0) { img.data[o + 3] = 0; continue; }
    const v = NES[k]; img.data[o] = v >> 16 & 255; img.data[o + 1] = v >> 8 & 255; img.data[o + 2] = v & 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}
// a typed grid (rows of chars) with a palette {char: NES index}; '.' transparent
export function grid(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  return face(1, (i, j) => { const ch = rows[j][i] || '.'; return ch === '.' ? -1 : pal[ch]; }, w, h);
}

// ---------------------------------------------------------------- ground faces
const speck = (base, dark, light, pd = 0.12, pl = 0.06) => (i, j, r) => { const v = r(); return v < pd ? dark : v < pd + pl ? light : base; };
export const FACES = {
  grass: () => face(11, (i, j, r) => { const v = r(); const tuft = ((i + 3) % 8 === 0 && (j + 2) % 8 < 2) || ((i + 7) % 8 === 0 && (j + 6) % 8 < 2); if (tuft) return 0x0A; return v < 0.04 ? 0x0A : v < 0.07 ? 0x2A : 0x1A; }),
  grass2: () => face(71, (i, j, r) => { const v = r(); const tuft = ((i + 1) % 6 === 0 && (j + 3) % 6 < 2); if (tuft) return 0x0A; if (v < 0.03) return 0x29; return v < 0.09 ? 0x0A : 0x1A; }),
  roofRed: () => face(72, (i, j) => (j % 4 === 3 ? 0x07 : i % 4 === 0 ? 0x06 : j % 4 === 0 ? 0x26 : 0x16)),
  roofBlue: () => face(73, (i, j) => (j % 4 === 3 ? 0x0C : i % 4 === 0 ? 0x02 : j % 4 === 0 ? 0x21 : 0x12)),
  roofGreen: () => face(74, (i, j) => (j % 4 === 3 ? 0x0B : i % 4 === 0 ? 0x0A : j % 4 === 0 ? 0x2A : 0x1A)),
  roofThatch: () => face(75, (i, j, r) => (j % 4 === 3 ? 0x08 : r() < 0.3 ? 0x27 : 0x18)),
  roofGold: () => face(76, (i, j) => (j % 4 === 3 ? 0x07 : i % 4 === 0 ? 0x18 : j % 4 === 0 ? 0x38 : 0x28)),
  roofDark: () => face(77, (i, j) => (j % 4 === 3 ? 0x0D : i % 4 === 0 ? 0x08 : 0x07)),
  roofPurple: () => face(78, (i, j) => (j % 4 === 3 ? 0x0D : i % 4 === 0 ? 0x03 : j % 4 === 0 ? 0x13 : 0x04)),
  rockPeak: () => face(81, (i, j, r) => { const v = r(), stripe = (i + j * 2) % 7 === 0; if (j < 3) return v < 0.4 ? 0x10 : 0x00; if (stripe) return 0x08; return v < 0.25 ? 0x07 : v < 0.35 ? 0x27 : 0x17; }),
  snowPeak: () => face(82, (i, j, r) => { const v = r(); if (j < 7) return v < 0.15 ? 0x31 : 0x30; const stripe = (i + j * 2) % 7 === 0; return stripe ? 0x0D : v < 0.3 ? 0x00 : 0x10; }),
  leafTop: () => face(83, (i, j, r) => { const a = ((i * 5 + j * 3) % 7 === 0); if (a) return 0x2A; const v = r(); return v < 0.25 ? 0x0A : v < 0.3 ? 0x0B : 0x1A; }),
  leafSide: () => face(84, (i, j, r) => { if (j > 13) return r() < 0.5 ? 0x08 : 0x0B; const v = r(); return (i + j) % 5 === 0 ? 0x1A : v < 0.3 ? 0x0B : 0x0A; }),
  grassSide: () => face(12, (i, j, r) => j < 3 ? (r() < 0.3 ? 0x0A : 0x1A) : (r() < 0.15 ? 0x07 : r() < 0.1 ? 0x18 : 0x08)),
  dirtSide: () => face(13, (i, j, r) => (j % 5 === 4 && r() < 0.6) ? 0x07 : (r() < 0.15 ? 0x18 : 0x08)),
  hill: () => face(14, (i, j, r) => { const a = ((i + 4) % 8 - 4) ** 2 + ((j + (i >> 3) * 4) % 8 - 5) ** 2 * 1.4; if (a < 6) return a < 2.5 ? 0x2A : 0x1A; if (a < 9) return 0x0A; return r() < 0.1 ? 0x0A : 0x1A; }),
  forestFloor: () => face(15, speck(0x0A, 0x0B, 0x1A, 0.08, 0.06)),
  road: () => face(16, (i, j, r) => { const v = r(); return v < 0.12 ? 0x18 : v < 0.18 ? 0x37 : 0x27; }),
  sand: () => face(17, (i, j, r) => { const v = r(); if ((j + (i >> 2)) % 6 === 0 && v < 0.5) return 0x27; return v < 0.1 ? 0x27 : 0x37; }),
  sandSide: () => face(18, (i, j, r) => r() < 0.2 ? 0x17 : 0x27),
  swamp: () => face(19, (i, j, r) => { const v = r(); const w = Math.sin(i * 0.8 + j * 0.3) > 0.6; return w ? 0x0C : v < 0.15 ? 0x04 : v < 0.25 ? 0x1B : 0x0B; }),
  snow: () => face(20, (i, j, r) => { const v = r(); return v < 0.08 ? 0x31 : v < 0.12 ? 0x10 : 0x30; }),
  snowSide: () => face(21, (i, j, r) => j < 3 ? 0x30 : (r() < 0.2 ? 0x00 : 0x10)),
  rockTop: () => face(22, (i, j, r) => { const e = (i % 8 === 0 || j % 6 === 0) && r() < 0.7; return e ? 0x08 : r() < 0.2 ? 0x07 : r() < 0.1 ? 0x27 : 0x17; }),
  rockSide: () => face(23, (i, j, r) => { const crack = ((i * 5 + j * 3) % 13 === 0); return crack ? 0x0D : (j % 5 === 0 && r() < 0.5) ? 0x08 : r() < 0.25 ? 0x07 : 0x18; }),
  snowRock: () => face(24, (i, j, r) => { const e = (i % 8 === 0 || j % 6 === 0) && r() < 0.6; return e ? 0x00 : r() < 0.2 ? 0x10 : 0x30; }),
  snowRockSide: () => face(25, (i, j, r) => ((i * 5 + j * 3) % 13 === 0) ? 0x0D : r() < 0.3 ? 0x00 : 0x10),
  plank: () => face(26, (i, j, r) => (j % 4 === 3) ? 0x08 : (i === (j >> 2) * 5 % 16) ? 0x08 : r() < 0.15 ? 0x07 : 0x17),
  plankSide: () => face(27, (i, j) => (j % 4 === 3 ? 0x08 : 0x07)),
  pave: () => face(28, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x00; return r() < 0.12 ? 0x2D : 0x10; }),
  floor: () => face(29, (i, j, r) => { if (j % 8 === 7 || i % 8 === 7) return 0x08; return r() < 0.12 ? 0x07 : 0x18; }),
  wood: () => face(30, (i, j, r) => { if (j % 4 === 3) return 0x08; if (i === ((j >> 2) * 7) % 16) return 0x08; return r() < 0.12 ? 0x18 : 0x17; }),
  carpet: () => face(31, (i, j) => { if (i === 0 || i === 15) return 0x28; if (i === 1 || i === 14) return 0x06; return ((i + j) % 6 === 0 || (i - j + 16) % 6 === 0) ? 0x16 : 0x06; }),
  wallStone: () => face(32, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x0D; if (j % 4 === 0) return 0x10; return r() < 0.15 ? 0x2D : 0x00; }),
  wallStoneTop: () => face(33, (i, j, r) => r() < 0.15 ? 0x2D : 0x10),
  wallCave: () => face(34, (i, j, r) => { const v = Math.sin(i * 0.9 + j * 0.4) + Math.sin(j * 1.3 - i * 0.2); return v > 1.1 ? 0x2D : v < -1.0 ? 0x0D : r() < 0.15 ? 0x0D : 0x00; }),
  wallCaveTop: () => face(35, (i, j, r) => r() < 0.2 ? 0x2D : 0x00),
  caveFloor: () => face(36, (i, j, r) => { const v = r(); return v < 0.1 ? 0x0D : v < 0.18 ? 0x2D : 0x00; }),
  plaster: () => face(37, (i, j, r) => { if (j < 2 || j > 13 || i < 1 || i > 14) return 0x07; return r() < 0.1 ? 0x10 : 0x36; }),
  plasterTop: () => face(38, (i, j) => (j % 4 === 1 ? 0x07 : (i % 4 === 0 ? 0x06 : 0x16))),
  tile: () => face(39, (i, j) => (j % 4 === 3 ? 0x0C : (i % 4 === 0 ? 0x0C : 0x1C))),
  palisade: () => face(40, (i, j, r) => { if (i % 4 === 3) return 0x0D; if (j < 2 && i % 4 === 1) return 0x37; return r() < 0.2 ? 0x07 : 0x18; }),
  palisadeTop: () => face(41, (i) => (i % 4 === 3 ? 0x0D : 0x18)),
  ice: () => face(42, (i, j, r) => { const v = (i + j) % 9 === 0; return v ? 0x30 : r() < 0.1 ? 0x21 : 0x31; }),
  iceWall: () => face(43, (i, j, r) => { const v = Math.sin(i * 0.7 + j * 0.5) > 0.7; return v ? 0x30 : r() < 0.2 ? 0x11 : 0x21; }),
  iceWallTop: () => face(44, (i, j, r) => r() < 0.2 ? 0x31 : 0x30),
  lairWall: () => face(45, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x0D; return r() < 0.12 ? 0x13 : 0x03; }),
  lairWallTop: () => face(46, (i, j, r) => r() < 0.15 ? 0x13 : 0x03),
  lairFloor: () => face(47, (i, j, r) => { if (j % 8 === 7 || i % 8 === 7) return 0x0D; return r() < 0.12 ? 0x03 : 0x04; }),
  tombWall: () => face(48, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x08; return r() < 0.15 ? 0x27 : 0x18; }),
  tombWallTop: () => face(49, (i, j, r) => r() < 0.15 ? 0x27 : 0x18),
  tombFloor: () => face(50, (i, j, r) => { if (j % 8 === 7 || i % 8 === 7) return 0x08; return r() < 0.15 ? 0x18 : 0x17; }),
  templeWall: () => face(51, (i, j, r) => { if (j < 3) return 0x28; if (j > 12) return 0x07; return (i % 8 === 0) ? 0x07 : 0x16; }),
  templeWallTop: () => face(52, (i, j) => (j % 4 === 1 ? 0x07 : 0x18)),
  fortWall: () => face(53, (i, j, r) => { if (i % 4 === 3) return 0x08; if (j < 2 && i % 4 === 1) return 0x27; return r() < 0.2 ? 0x07 : 0x17; }),
  stairs: () => face(54, (i, j) => { const s = j >> 2; if (j % 4 === 0) return 0x30; return s % 2 ? 0x2D : 0x10; }),
  stairsDown: () => face(55, (i, j) => { const s = j >> 2; if (i < 1 || i > 14) return 0x0D; return j % 4 === 3 ? 0x0D : [0x2D, 0x00, 0x0D, 0x0D][s]; }),
  water: () => face(56, (i, j, r) => { const w = ((i + (j >> 2) * 5) % 16 < 4) && j % 4 === 0; return w ? 0x31 : r() < 0.05 ? 0x11 : (j + (i >> 3)) % 8 < 1 ? 0x11 : 0x12; }, 32, 32),
  chasm: () => face(57, (i, j, r) => r() < 0.06 ? 0x08 : 0x0D),
  shelf: () => face(58, (i, j) => { if (j % 5 === 0 || i === 0 || i === 15) return 0x08; return [0x16, 0x12, 0x19, 0x27, 0x30][(i >> 1) % 5]; }),
  door: () => face(59, (i, j) => { if (i === 0 || i === 15 || j === 0) return 0x08; if (i === 11 && j === 8) return 0x28; if (i === 8) return 0x08; return (j % 4 === 3) ? 0x07 : 0x17; }),
  gate: () => face(60, (i, j) => (i % 4 === 1 ? 0x00 : (j === 2 || j === 13) ? 0x2D : -1)),
  counter: () => face(61, (i, j) => (j < 3 ? 0x27 : j === 3 ? 0x08 : (i % 8 === 0 ? 0x08 : 0x17))),
  bed: () => face(62, (i, j) => { if (j < 5) return i < 2 || i > 13 ? 0x07 : 0x30; if (i < 1 || i > 14) return 0x07; return (j % 3 === 0) ? 0x02 : 0x12; }),
  table: () => face(63, (i, j) => (i === 0 || j === 0 || i === 15 || j === 15) ? 0x08 : (j % 5 === 0 ? 0x07 : 0x17)),
  coffin: () => face(64, (i, j) => (i < 2 || i > 13 || j < 1 || j > 14) ? 0x08 : (j === 4 ? 0x28 : 0x07)),
  flowersG: () => face(65, (i, j, r) => { const v = r(); return v < 0.06 ? 0x26 : v < 0.1 ? 0x38 : v < 0.13 ? 0x30 : v < 0.25 ? 0x0A : 0x1A; }),
  void: () => face(66, () => 0x0D),
  // ---- the sequel's places: lava, volcanic rock, mud, the bamboo floor, the haunted mansion, felt, the bell tower
  lava: () => face(90, (i, j, r) => { const w = Math.sin(i * 0.7 + j * 0.45) + Math.sin(j * 1.1 - i * 0.3); return w > 1.2 ? 0x38 : w > 0.4 ? 0x27 : r() < 0.1 ? 0x06 : 0x16; }),
  volcRock: () => face(91, (i, j, r) => { const e = (i % 8 === 0 || j % 6 === 0) && r() < 0.6; return e ? 0x0D : r() < 0.15 ? 0x06 : r() < 0.2 ? 0x2D : 0x00; }),
  volcRockSide: () => face(92, (i, j, r) => ((i * 5 + j * 3) % 13 === 0 ? 0x16 : (j % 5 === 0 && r() < 0.5) ? 0x0D : r() < 0.25 ? 0x2D : 0x00)),
  volcFloor: () => face(105, (i, j, r) => { const v = r(); return v < 0.08 ? 0x16 : v < 0.2 ? 0x0D : v < 0.3 ? 0x2D : 0x00; }),
  mud: () => face(93, (i, j, r) => { const v = r(); const w = Math.sin(i * 0.9 + j * 0.4) > 0.75; return w ? 0x0C : v < 0.15 ? 0x07 : v < 0.25 ? 0x0B : 0x08; }),
  bambooFloor: () => face(94, (i, j, r) => { const v = r(); const leaf = (i + j * 3) % 11 === 0; return leaf ? 0x28 : v < 0.08 ? 0x0A : v < 0.2 ? 0x2A : 0x1A; }),
  mansionWall: () => face(95, (i, j, r) => { if (j < 2) return 0x08; if (j > 13) return 0x0D; if (i % 8 === 0) return 0x03; return r() < 0.1 ? 0x13 : 0x04; }),
  mansionWallTop: () => face(96, (i, j) => (j % 4 === 1 ? 0x0D : 0x03)),
  darkWood: () => face(97, (i, j, r) => { if (j % 4 === 3) return 0x0D; if (i === ((j >> 2) * 7) % 16) return 0x0D; return r() < 0.12 ? 0x08 : 0x07; }),
  felt: () => face(99, (i, j) => ((i + j) % 8 === 0 ? 0x17 : j % 6 === 0 ? 0x27 : 0x37)),
  pagodaWall: () => face(100, (i, j, r) => { if (j < 3) return 0x28; if (j > 12) return 0x0D; return i % 8 === 0 ? 0x0D : r() < 0.1 ? 0x13 : 0x04; }),
  pagodaWallTop: () => face(101, (i, j) => (j % 4 === 1 ? 0x0D : 0x18)),
  pagodaFloor: () => face(102, (i, j, r) => { if (j % 8 === 7 || i % 8 === 7) return 0x0D; return r() < 0.12 ? 0x13 : 0x03; }),
  bluePave: () => face(103, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x0C; return r() < 0.12 ? 0x10 : 0x2D; }),
  stilt: () => face(104, (i, j, r) => (j % 4 === 3 ? 0x08 : i % 5 === 0 ? 0x08 : r() < 0.15 ? 0x27 : 0x17)),
};
const cache = {};
export function tex(name) { return cache[name] || (cache[name] = FACES[name]()); }

// ---------------------------------------------------------------- billboard sprites
export const SPR = {
  tree: () => grid([
    '......kkkk......',
    '....kkGGGgkk....',
    '...kGGGgGGGgk...',
    '..kGGgGGGGgGGk..',
    '..kGGGGgGGGGgk..',
    '.kgGGGGGGgGGGGk.',
    '.kGGgGGGGGGgGGk.',
    '.kGGGGGgGGGGGgk.',
    'kgGGGgGGGGGgGGGk',
    'kGGGGGGGgGGGGGgk',
    'kgGgGGGGGGGgGGGk',
    '.kGGGGgGGGGGGgk.',
    '.kggGGGGGgGGggk.',
    '..kkggGGGGggkk..',
    '....kkggggkk....',
    '......kbbk......',
    '......kbbk......',
    '.....kbbbbk.....',
    '.....kkkkkk.....',
  ], { k: 0x0D, G: 0x1A, g: 0x0A, b: 0x07 }),
  pine: () => grid([
    '.......kk.......',
    '......kGGk......',
    '.....kGgGGk.....',
    '....kGGGgGGk....',
    '.....kgGGGk.....',
    '....kGGgGGGk....',
    '...kGgGGGgGGk...',
    '..kGGGGgGGGGGk..',
    '....kgGGGGgk....',
    '...kGGGgGGGGk...',
    '..kGgGGGGGgGGk..',
    '.kGGGGgGGGGGgGk.',
    '.kkggggggggggkk.',
    '......kbbk......',
    '......kbbk......',
    '......kkkk......',
  ], { k: 0x0D, G: 0x0A, g: 0x0B, b: 0x08 }),
  snowpine: () => grid([
    '.......kk.......',
    '......kWWk......',
    '.....kWGGWk.....',
    '....kWWGgGWk....',
    '.....kgWWGk.....',
    '....kWWgGWWk....',
    '...kWgGGWgGWk...',
    '..kWWGGgGGWWWk..',
    '....kgGWWGgk....',
    '...kWWGgGWWWk...',
    '..kWgGGWWGgGWk..',
    '.kWWWGgGGWGgWWk.',
    '.kkggggggggggkk.',
    '......kbbk......',
    '......kkkk......',
  ], { k: 0x0D, G: 0x0A, g: 0x0B, W: 0x30, b: 0x08 }),
  deadtree: () => grid([
    '..k.......k..k..',
    '..bk.....kb.kb..',
    '...bk...kb.kb...',
    '.k..bk.kb.kb..k.',
    '.bk..bkbkbb..kb.',
    '..bk..bbbb..kb..',
    '...bbk.bb.kbb...',
    '.....bbbbbb.....',
    '......kbbk......',
    '......kbbk......',
    '......kbbk......',
    '.....kbbbbk.....',
    '....kkkkkkkk....',
  ], { k: 0x0D, b: 0x00 }),
  palm: () => grid([
    '...kkk....kkk...',
    '..kGGGk..kGGGk..',
    '.kGgk.kkkk.kgGk.',
    '.kk..kGGGGk..kk.',
    '....kGgkkgGk....',
    '...kGk.bb.kGk...',
    '...kk..bk..kk...',
    '.......kb.......',
    '.......bk.......',
    '......kb........',
    '......bk........',
    '.....kbbk.......',
    '.....kkkk.......',
  ], { k: 0x0D, G: 0x1A, g: 0x0A, b: 0x18 }),
  mound: () => grid([
    '................',
    '.....kkkkkk.....',
    '...kkLLLLGGkk...',
    '..kLLLGGGGGGgk..',
    '.kLLGGGGGGGGGgk.',
    'kLGGGGGGGGGGGggk',
    'kGGGGGGGGGGGgggk',
    'kggGGGGGGGGggggk',
    '.kkggggggggggkk.',
    '...kkkkkkkkkk...',
  ], { k: 0x0D, L: 0x2A, G: 0x1A, g: 0x0A }),
  bush: () => grid([
    '................',
    '.....kkkkk......',
    '...kkGGgGGkk....',
    '..kGGgGGGgGGk...',
    '.kGgGGGGGGGgGk..',
    '.kGGGgGGgGGGGk..',
    'kgGGGGGGGGGgGGk.',
    'kGGgGGfGGGGGGgk.',
    'kgGGGGGGgGGGGGk.',
    '.kggGGGGGGGggk..',
    '..kkgggggggkk...',
    '....kkkkkkk.....',
  ], { k: 0x0D, G: 0x1A, g: 0x0A, f: 0x26 }),
  pot: () => grid([
    '................',
    '....kkkkkkkk....',
    '...kGGgGGgGGk...',
    '..kGgGGGGGgGGk..',
    '...kGGgGGGGk....',
    '....kkkkkkkk....',
    '...kOOOOOOOOk...',
    '..kOooOOOOOOOk..',
    '..kOoOOOOOOOOk..',
    '..kOOOOOOOOOdk..',
    '...kOOOOOOOdk...',
    '....kkkkkkkk....',
  ], { k: 0x0D, G: 0x1A, g: 0x0A, O: 0x17, o: 0x27, d: 0x07 }),
  rock: () => grid([
    '................',
    '.....kkkkk......',
    '...kkGGGGGkk....',
    '..kGGgGGGGGGk...',
    '.kGGGGGGGgGGGk..',
    '.kGgGGGGGGGGdk..',
    'kGGGGGGgGGGGddk.',
    'kGGGGGGGGGGdddk.',
    '.kdGGGGGGddddk..',
    '..kkddddddddk...',
    '....kkkkkkkk....',
  ], { k: 0x0D, G: 0x10, g: 0x30, d: 0x00 }),
  statue: () => grid([
    '......kkkk......',
    '.....kYYYYk.....',
    '....kYyYYyYk....',
    '....kYYYYYYk....',
    '....kYykkyYk....',
    '.....kYYYYk.....',
    '...kkYYYYYYkk...',
    '..kYYYYyyYYYYk..',
    '.kYYyYYYYYYyYYk.',
    '.kYYYkYYYYkYYYk.',
    '.kYYkYYYYYYkYYk.',
    '..kkYYYYYYYYkk..',
    '..kYYYYYYYYYYk..',
    '.kYYYYyYYyYYYYk.',
    '.kkkkkkkkkkkkkk.',
    '.kssssssssssssk.',
    '.kSSSSSSSSSSSSk.',
    '.kkkkkkkkkkkkkk.',
  ], { k: 0x0D, Y: 0x28, y: 0x18, s: 0x10, S: 0x00 }),
  fire: () => grid([
    '.......r........',
    '......rr........',
    '......ryr..r....',
    '.....ryyr.rr....',
    '....rryWyrryr...',
    '....ryWWWyyr....',
    '....ryWWWWyr....',
    '.....ryWWyr.....',
    '......rrrr......',
  ], { r: 0x16, y: 0x28, W: 0x30 }),
  brazier: () => grid([
    '................',
    '..kkkkkkkkkkkk..',
    '..kCCCCCCCCCCk..',
    '...kCcCCCCcCk...',
    '....kkkkkkkk....',
    '......kCCk......',
    '......kcCk......',
    '.....kCCCCk.....',
    '....kkkkkkkk....',
  ], { k: 0x0D, C: 0x2D, c: 0x00 }),
  lamp: () => grid([
    '.....kkkkkk.....',
    '....kRRRRRRk....',
    '...kRyyyyyyRk...',
    '...kRyWWWWyRk...',
    '...kRyWWWWyRk...',
    '...kRyyyyyyRk...',
    '....kRRRRRRk....',
    '.....kkkkkk.....',
    '.......kk.......',
    '.......bb.......',
    '.......bb.......',
    '.......bb.......',
    '.......bb.......',
    '.......bb.......',
    '......kbbk......',
    '.....kkkkkk.....',
  ], { k: 0x0D, R: 0x16, y: 0x28, W: 0x38, b: 0x07 }),
  well: () => grid([
    '..kkkkkkkkkkkk..',
    '..kbk......kbk..',
    '..kbk......kbk..',
    '.kkkkkkkkkkkkkk.',
    'kSSsSSSsSSSsSSSk',
    'kSkkkkkkkkkkkkSk',
    'kSsSSSsSSSsSSSsk',
    'kSSSsSSSSsSSSSSk',
    '.kkkkkkkkkkkkkk.',
  ], { k: 0x0D, b: 0x07, S: 0x10, s: 0x00 }),
  chest: () => grid([
    '..kkkkkkkkkkkk..',
    '.kRRRRRRRRRRRRk.',
    '.kRrRRRRRRRRrRk.',
    '.kYYYYYYYYYYYYk.',
    '.kRRRRRkYkRRRRk.',
    '.kRrRRRkkkRRrRk.',
    '.kRRRRRRRRRRRRk.',
    '.kYYYYYYYYYYYYk.',
    '.kkkkkkkkkkkkkk.',
  ], { k: 0x0D, R: 0x06, r: 0x16, Y: 0x28 }),
  chestOpen: () => grid([
    '.kkkkkkkkkkkkkk.',
    '.kRRRRRRRRRRRRk.',
    '.kYYYYYYYYYYYYk.',
    '.kkkkkkkkkkkkkk.',
    '.kkkkkkkkkkkkkk.',
    '.kRrRRRRRRRRrRk.',
    '.kRRRRRRRRRRRRk.',
    '.kYYYYYYYYYYYYk.',
    '.kkkkkkkkkkkkkk.',
  ], { k: 0x0D, R: 0x06, r: 0x16, Y: 0x28 }),
  fence: () => grid([
    '..kk......kk....',
    '.kbbk....kbbk...',
    'kkbbkkkkkkbbkkkk',
    'bbbbbbbbbbbbbbbb',
    'kkbbkkkkkkbbkkkk',
    '..bb......bb....',
    'kkbbkkkkkkbbkkkk',
    'bbbbbbbbbbbbbbbb',
    'kkbbkkkkkkbbkkkk',
    '..bb......bb....',
    '..kk......kk....',
  ], { k: 0x0D, b: 0x17 }),
  pillar: () => grid([
    'kkkkkkkk',
    'kYYYYYYk',
    '.kRRRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    '.kRrRRk.',
    'kYYYYYYk',
    'kkkkkkkk',
  ], { k: 0x0D, Y: 0x28, R: 0x06, r: 0x16 }),
  rope: () => grid([
    'k..............k',
    'bk............kb',
    '.bk..........kb.',
    '..bbk......kbb..',
    '....bbbbbbbb....',
  ], { k: 0x0D, b: 0x27 }),
  boat: () => grid([
    '.......kk.......',
    '.......kWk......',
    '.......kWWk.....',
    '.......kWWWk....',
    '.......kWWWWk...',
    '.......kkkkkkk..',
    'kk.....k.....kk.',
    'kbkkkkkkkkkkkbk.',
    '.kbbbbbbbbbbbk..',
    '..kbBbbBbbBbk...',
    '...kkkkkkkkk....',
  ], { k: 0x0D, W: 0x30, b: 0x17, B: 0x07 }),
  crane: () => grid([
    '....kk..',
    '...kWWk.',
    'kkkWWk..',
    '.kWWWWk.',
    '..kWWk..',
    '...kk...',
  ], { k: 0x0D, W: 0x30 }),
  stairsUp: () => grid([
    'kkkkkkkkkkkkkkkk',
    'kWWWWWWWWWWWWWWk',
    'kGGGGGGGGGGGGGGk',
    'kkkkkkkkkkkkkkkk',
    '.kWWWWWWWWWWWWk.',
    '.kGGGGGGGGGGGGk.',
    '.kkkkkkkkkkkkkk.',
    '..kWWWWWWWWWWk..',
    '..kGGGGGGGGGGk..',
    '..kkkkkkkkkkkk..',
  ], { k: 0x0D, W: 0x30, G: 0x10 }),
};
// ---------------------------------------------------------------- pop-up pieces drawn with shapes
// paint(w, h, fn): fn gets a little painter (rect, poly, px) working in NES indexes; afterwards every empty pixel
// next to the picture becomes the black outline, like the typed sprites.
function paint(w, h, fn, outline = 0x0D) {
  const b = new Int16Array(w * h).fill(-1);
  const put = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h && c >= 0) b[y * w + x] = c; };
  const P = {
    px: put,
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) put(x + i, y + j, typeof c === 'function' ? c(i, j, x + i, y + j) : c); },
    // filled polygon (scanline, pixel centres)
    poly(pts, c) {
      const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
      for (let y = y0; y <= y1; y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b2) => a - b2);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    },
  };
  fn(P);
  if (outline >= 0) { const o = b.slice(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (b[y * w + x] >= 0) continue; if ((x > 0 && b[y * w + x - 1] >= 0) || (x < w - 1 && b[y * w + x + 1] >= 0) || (y > 0 && b[(y - 1) * w + x] >= 0) || (y < h - 1 && b[(y + 1) * w + x] >= 0)) o[y * w + x] = outline; } b.set(o); }
  return face(1, (i, j) => b[j * w + i], w, h);
}
// patterns (x, y) -> NES index
const roofP = (d, m, l) => (x, y) => (y % 3 === 2 ? d : (x + ((y / 3) | 0) * 2) % 4 === 0 ? d : y % 3 === 0 ? l : m);
const brickP = (mortar, a, b2) => (x, y) => { const row = y >> 1, off = row % 2 ? 2 : 0; return (y % 2 === 1 || (x + off) % 4 === 3) ? mortar : ((x * 7 + y * 3) % 5 === 0 ? b2 : a); };
const plankP = (d, a) => (x) => (x % 3 === 2 ? d : a);
const plasterP = (x, y) => (y === 0 ? 0x07 : 0x36);
// a Chinese house: white wall, red corner pillars, a tiled roof with upturned eaves (red roofs become dark tiles)
function house(P, x, base, w, wallH, roofH, roof, door = true) { chouse(P, x, base, w, wallH, roofH, roof === RED ? GREYROOF : roof, door); }
const RED = [0x07, 0x16, 0x26], BLUE = [0x02, 0x12, 0x21], GREEN = [0x0B, 0x1A, 0x2A], THATCH = [0x08, 0x18, 0x28], GOLD = [0x07, 0x28, 0x38], DARKR = [0x0D, 0x08, 0x07], PURPLE = [0x0D, 0x04, 0x13];
const rockP = (x, y) => ((x * 3 + y * 5) % 11 === 0 ? 0x07 : (x + y * 2) % 7 === 0 ? 0x27 : 0x17);
const greyRockP = (x, y) => ((x * 3 + y * 5) % 11 === 0 ? 0x2D : (x + y * 2) % 7 === 0 ? 0x10 : 0x00);
function mountain(snow) {
  return paint(34, 24, (P) => {
    // two shaded faces: lit left, shadowed right, with ridge streaks
    P.poly([[1, 23], [17, 1.5], [17, 23]], (x, y) => (snow && y < 9 + ((x * 5) % 3) ? 0x30 : snow ? ((x + y) % 6 === 0 ? 0x10 : 0x00) : rockP(x, y)));
    P.poly([[17, 1.5], [33, 23], [17, 23]], (x, y) => (snow && y < 8 + ((x * 7) % 3) ? 0x31 : snow ? ((x + y) % 5 === 0 ? 0x00 : 0x2D) : ((x * 3 + y * 5) % 9 === 0 ? 0x08 : 0x07)));
    P.poly([[6, 23], [11, 13], [14, 23]], snow ? 0x10 : 0x27);
    P.poly([[22, 23], [26, 15], [30, 23]], snow ? 0x2D : 0x08);
  });
}
export const POP = {
  peak: () => mountain(false),
  snowpeak: () => mountain(true),
  // a strip of paper waves (blue card, white crests)
  wave: () => paint(20, 6, (P) => {
    for (let i = 0; i < 2; i++) { const x0 = 1 + i * 9; P.poly([[x0, 5], [x0 + 2, 2], [x0 + 5, 0.5], [x0 + 8, 2], [x0 + 6, 2.5], [x0 + 5, 5]], (x, y) => (y < 2 ? 0x30 : 0x21)); }
    P.rect(1, 4, 18, 2, 0x11);
  }),
  // world-map places: a back layer and a front layer each, stood one behind the other
  town_b: () => paint(32, 18, (P) => { house(P, 2, 17, 9, 5, 5, RED); house(P, 12, 17, 8, 6, 6, BLUE); house(P, 22, 17, 8, 5, 5, GREEN); }),
  town_f: () => paint(34, 9, (P) => { P.rect(1, 2, 32, 6, brickP(0x0D, 0x10, 0x00)); for (let x = 1; x < 33; x += 4) P.rect(x, 1, 2, 1, 0x10); P.rect(14, 3, 6, 5, 0x0D); P.rect(15, 4, 4, 4, 0x07); }),
  city_b: () => paint(34, 24, (P) => { house(P, 3, 23, 9, 6, 5, RED); house(P, 13, 23, 9, 8, 7, GOLD); house(P, 23, 23, 8, 6, 5, BLUE); P.rect(1, 9, 4, 14, brickP(0x0D, 0x10, 0x00)); P.rect(29, 9, 4, 14, brickP(0x0D, 0x10, 0x00)); P.poly([[0, 9], [6, 9], [3, 5]], roofP(...RED)); P.poly([[28, 9], [34, 9], [31, 5]], roofP(...RED)); }),
  city_f: () => paint(36, 11, (P) => { P.rect(1, 3, 34, 7, brickP(0x0D, 0x10, 0x00)); for (let x = 1; x < 35; x += 3) P.rect(x, 1, 2, 2, 0x10); P.rect(14, 4, 8, 6, 0x0D); P.rect(15, 5, 6, 5, 0x17); P.rect(17, 5, 2, 5, 0x07); }),
  village_b: () => paint(30, 16, (P) => { house(P, 2, 15, 10, 5, 6, THATCH); house(P, 17, 15, 10, 4, 5, THATCH); }),
  village_f: () => paint(32, 7, (P) => { for (let x = 1; x < 31; x += 3) P.rect(x, 1, 1, 6, 0x17); P.rect(1, 2, 30, 1, 0x07); P.rect(1, 4, 30, 1, 0x07); }),
  pavilion: () => paint(30, 26, (P) => { P.rect(3, 22, 24, 3, plankP(0x07, 0x17)); for (const x of [6, 14, 22]) P.rect(x, 11, 2, 11, 0x06); P.poly([[0, 12], [30, 12], [25, 5], [5, 5]], roofP(...BLUE)); P.poly([[6, 5], [24, 5], [18, 1], [12, 1]], roofP(...BLUE)); }),
  temple: () => paint(34, 26, (P) => { P.rect(5, 15, 24, 9, (x, y) => (x % 6 === 0 ? 0x07 : 0x16)); P.rect(14, 18, 6, 6, 0x07); P.rect(3, 23, 28, 2, 0x10); P.poly([[0, 15], [34, 15], [29, 9], [5, 9]], roofP(...GOLD)); P.rect(9, 6, 16, 3, (x, y) => (x % 4 === 0 ? 0x07 : 0x16)); P.poly([[6, 7], [28, 7], [24, 2], [10, 2]], roofP(...GOLD)); }),
  tower: () => paint(20, 42, (P) => { for (let i = 0; i < 5; i++) { const w = 12 - i * 2, x = 10 - w / 2, base = 41 - i * 8; P.rect(x, base - 5, w, 5, (xx) => (xx % 3 === 0 ? 0x07 : 0x16)); P.poly([[x - 3, base - 5], [x + w + 3, base - 5], [x + w, base - 8], [x, base - 8]], roofP(...GREEN)); } P.rect(9, 0, 2, 3, 0x28); }),
  fort_b: () => paint(16, 28, (P) => { P.rect(4, 8, 8, 19, plankP(0x07, 0x17)); P.rect(3, 6, 10, 3, 0x08); P.poly([[1, 7], [15, 7], [8, 1]], roofP(...DARKR)); P.rect(7, 12, 2, 2, 0x0D); }),
  fort_f: () => paint(34, 14, (P) => { for (let x = 1; x < 33; x += 2) { P.rect(x, 3, 2, 10, plankP(0x07, 0x17)); P.poly([[x, 3], [x + 2, 3], [x + 1, 1]], 0x17); } P.rect(1, 6, 32, 1, 0x08); P.rect(14, 7, 6, 6, 0x0D); }),
  desertfort_b: () => paint(14, 26, (P) => { P.rect(2, 4, 10, 21, brickP(0x08, 0x18, 0x27)); for (let x = 2; x < 12; x += 3) P.rect(x, 2, 2, 2, 0x18); P.rect(6, 9, 2, 3, 0x0D); }),
  desertfort_f: () => paint(34, 14, (P) => { P.rect(1, 3, 32, 10, brickP(0x08, 0x18, 0x27)); for (let x = 1; x < 33; x += 4) P.rect(x, 1, 2, 2, 0x18); P.rect(14, 6, 6, 7, 0x0D); }),
  tomb: () => paint(30, 22, (P) => { P.rect(1, 15, 28, 6, brickP(0x08, 0x18, 0x27)); P.rect(5, 9, 20, 6, brickP(0x08, 0x18, 0x27)); P.rect(9, 4, 12, 5, brickP(0x08, 0x18, 0x27)); P.rect(12, 1, 6, 3, 0x18); P.rect(12, 15, 6, 6, 0x0D); }),
  cave: () => paint(32, 22, (P) => { P.poly([[1, 21], [6, 8], [13, 3], [20, 4], [27, 10], [31, 21]], greyRockP); P.poly([[17, 4], [27, 10], [31, 21], [20, 21]], (x, y) => ((x + y) % 5 === 0 ? 0x2D : 0x0D)); P.poly([[10, 21], [11, 14], [16, 11], [21, 14], [22, 21]], 0x0D); P.rect(9, 12, 14, 1, 0x10); }),
  lair: () => paint(32, 30, (P) => { P.rect(4, 14, 24, 15, brickP(0x0D, 0x03, 0x13)); P.rect(1, 6, 5, 23, brickP(0x0D, 0x03, 0x13)); P.rect(26, 6, 5, 23, brickP(0x0D, 0x03, 0x13)); P.poly([[2, 15], [30, 15], [24, 8], [8, 8]], roofP(...PURPLE)); P.rect(13, 20, 6, 9, 0x24); P.rect(14, 21, 4, 8, 0x34); P.poly([[0, 7], [7, 7], [3.5, 2]], roofP(...PURPLE)); P.poly([[25, 7], [32, 7], [28.5, 2]], roofP(...PURPLE)); }),
  // ---- the sequel's props (pop-up cards)
  bamboo: () => paint(14, 30, (P) => {
    for (const [x, y0] of [[2, 4], [6, 0], [10, 3]]) {
      P.rect(x, y0 + 3, 2, 30 - y0 - 3, (i, j, X, Y) => ((Y + x) % 6 === 0 ? 0x0A : i === 0 ? 0x2A : 0x1A));
      P.poly([[x + 1, y0 + 4], [x - 2.5, y0 + 1], [x - 1, y0 + 4.5]], 0x1A); P.poly([[x + 1, y0 + 9], [x + 4.5, y0 + 6], [x + 3, y0 + 9.5]], 0x2A);
      P.poly([[x + 1, y0 + 3], [x + 2, y0], [x + 2, y0 + 3]], 0x2A);
    }
  }),
  lotus: () => paint(18, 9, (P) => {
    P.poly([[1, 6], [4, 3], [8, 3], [9, 6], [6, 8], [2, 8]], (x, y) => (y < 5 ? 0x2A : 0x1A)); P.poly([[10, 7], [12, 5], [16, 5], [17, 7], [14, 8.5]], (x, y) => (y < 6 ? 0x2A : 0x1A));
    P.poly([[6, 5], [7, 1], [8, 4], [9, 0.5], [10, 4], [11, 1], [12, 5]], (x, y) => (y < 3 ? 0x35 : 0x25)); P.rect(8, 4, 3, 1, 0x38);
  }),
  junk: () => paint(30, 24, (P) => {
    P.poly([[1, 15], [29, 15], [26, 22], [5, 22]], (x, y) => (y === 15 ? 0x27 : y > 19 ? 0x07 : (x % 5 === 0 ? 0x07 : 0x17)));
    P.rect(2, 13, 3, 3, 0x17); P.rect(25, 12, 4, 4, 0x17);
    P.rect(14, 1, 1, 14, 0x08); P.rect(22, 5, 1, 10, 0x08);
    P.poly([[7, 2], [14, 1.5], [14, 13], [6, 12.5]], (x, y) => (y % 3 === 0 ? 0x06 : 0x16)); P.poly([[16, 5], [22, 5], [22, 13], [16, 12.5]], (x, y) => (y % 3 === 0 ? 0x06 : 0x16));
    P.rect(13, 0, 3, 1, 0x28);
  }),
  yurt: () => paint(24, 17, (P) => {
    P.poly([[2, 16], [2, 8], [6, 4], [12, 2], [18, 4], [22, 8], [22, 16]], (x, y) => (y === 8 || y === 9 ? 0x16 : y < 8 ? (x < 12 ? 0x30 : 0x10) : (x < 12 ? 0x37 : 0x27)));
    P.rect(10, 11, 4, 5, 0x06); P.rect(11, 12, 2, 4, 0x16); P.rect(11, 1, 2, 2, 0x08);
  }),
  banner: () => paint(10, 24, (P) => { P.rect(1, 0, 1, 24, 0x08); P.rect(2, 1, 7, 12, (i, j) => (j === 0 || j === 11 ? 0x28 : 0x16)); P.rect(4, 4, 3, 5, 0x28); }),
  crystal: () => paint(12, 16, (P) => { P.poly([[6, 0.5], [10, 6], [8, 15], [4, 15], [2, 6]], (x, y) => (x < 6 ? 0x31 : x < 8 ? 0x21 : 0x11)); P.poly([[2, 8], [0.5, 12], [2, 15], [4, 15]], 0x21); P.rect(5, 3, 1, 4, 0x30); }),
  sign: () => paint(14, 14, (P) => { P.rect(6, 7, 2, 7, 0x07); P.rect(1, 1, 12, 7, (i, j) => (j === 0 || j === 6 ? 0x07 : 0x27)); P.rect(3, 3, 8, 1, 0x08); P.rect(3, 5, 6, 1, 0x08); }),
  cage: () => paint(18, 18, (P) => { P.rect(1, 2, 16, 2, 0x07); P.rect(1, 15, 16, 2, 0x07); for (let x = 1; x < 17; x += 3) P.rect(x, 4, 1, 11, 0x17); P.rect(5, 10, 8, 5, 0x0D); P.rect(7, 9, 4, 2, 0x00); }),
  willow: () => paint(20, 28, (P) => {
    P.rect(9, 12, 2, 16, (i) => (i ? 0x07 : 0x17));
    P.poly([[2, 8], [6, 2], [14, 1], [18, 7], [17, 12], [3, 12]], (x, y) => ((x + y) % 4 === 0 ? 0x0A : 0x1A));
    for (let x = 2; x < 18; x += 2) P.rect(x, 10, 1, 8 + ((x * 7) % 9), (i, j) => (j % 3 === 0 ? 0x2A : 0x1A));
  }),
  reed: () => paint(12, 14, (P) => { for (const [x, h] of [[2, 11], [5, 13], [8, 10], [10, 12]]) { P.rect(x, 14 - h, 1, h, 0x1A); P.rect(x, 14 - h, 1, 3, 0x07); } }),
  greatbell: () => paint(18, 20, (P) => {
    P.rect(7, 0, 4, 2, 0x08); P.poly([[4, 3], [14, 3], [16, 15], [17, 18], [1, 18], [2, 15]], (x, y) => (y === 9 || y === 10 ? 0x08 : x < 9 ? 0x28 : 0x18));
    P.rect(4, 5, 2, 2, 0x38); P.rect(8, 12, 2, 2, 0x07); P.rect(1, 18, 16, 1, 0x08);
  }),
  hotspring: () => paint(18, 10, (P) => { P.poly([[1, 6], [4, 3], [14, 3], [17, 6], [14, 9], [4, 9]], (x, y) => (y < 5 ? 0x31 : 0x21)); P.rect(5, 0, 1, 3, 0x30); P.rect(9, 1, 1, 2, 0x30); P.rect(13, 0, 1, 3, 0x30); }),
  // ---- the sequel's world-map places
  ranch_b: () => paint(30, 16, (P) => { house(P, 3, 15, 10, 5, 5, THATCH); P.rect(17, 10, 10, 5, plankP(0x07, 0x17)); P.poly([[16, 10], [28, 10], [22, 6]], roofP(...THATCH)); }),
  ranch_f: () => paint(34, 8, (P) => { for (let x = 1; x < 33; x += 3) { P.rect(x, 1, 2, 7, plankP(0x07, 0x17)); P.px(x, 0, 0x17); } P.rect(1, 3, 32, 1, 0x07); P.rect(14, 2, 6, 6, 0x0D); }),
  port_b: () => paint(32, 20, (P) => { house(P, 2, 19, 10, 5, 5, BLUE); house(P, 14, 19, 8, 4, 4, THATCH); P.rect(26, 2, 1, 17, 0x08); P.poly([[22, 4], [26, 3], [26, 13], [22, 12]], (x, y) => (y % 3 === 0 ? 0x06 : 0x16)); }),
  port_f: () => paint(34, 7, (P) => { P.rect(1, 2, 32, 2, plankP(0x07, 0x17)); for (let x = 2; x < 33; x += 5) P.rect(x, 4, 1, 3, 0x07); }),
  mansion: () => paint(32, 24, (P) => {
    P.rect(4, 12, 24, 11, (x, y) => (y === 12 ? 0x0D : x % 6 === 0 ? 0x03 : 0x04)); P.rect(14, 16, 4, 7, 0x0D);
    P.poly([[1, 13], [31, 13], [26, 6], [6, 6]], roofP(...PURPLE)); P.rect(9, 16, 2, 2, 0x28); P.rect(21, 16, 2, 2, 0x28);
    P.rect(1, 9, 2, 14, 0x08); P.poly([[0, 6], [5, 11], [0, 13]], 0x0A);
  }),
  miao: () => paint(32, 24, (P) => {
    for (const [x, w] of [[2, 12], [17, 13]]) { for (let k = 0; k <= w; k += 4) P.rect(x + k, 16, 1, 7, 0x08); P.rect(x - 1, 15, w + 3, 2, plankP(0x08, 0x17)); P.rect(x, 10, w, 5, plasterP); P.poly([[x - 2.5, 10], [x + w + 2.5, 10], [x + w / 2, 3]], roofP(...THATCH)); }
  }),
  volcano: () => paint(40, 28, (P) => {
    P.poly([[1, 27], [15, 5], [25, 5], [39, 27]], (x, y) => (y < 9 ? ((x + y) % 3 === 0 ? 0x27 : 0x16) : x < 20 ? ((x * 3 + y * 5) % 11 === 0 ? 0x16 : 0x07) : ((x + y) % 5 === 0 ? 0x16 : 0x08)));
    P.poly([[15, 5], [25, 5], [23, 7], [17, 7]], 0x38); P.rect(17, 0, 2, 4, 0x10); P.rect(21, 1, 2, 3, 0x00);
  }),
  yurts: () => paint(34, 16, (P) => {
    for (const [x, s] of [[1, 1], [16, 0.8]]) { const w = 16 * s, b = 15; P.poly([[x, b], [x, b - 6 * s], [x + w / 2, b - 12 * s], [x + w, b - 6 * s], [x + w, b]], (X, Y) => (Y === Math.round(b - 6 * s) ? 0x16 : X < x + w / 2 ? 0x30 : 0x10)); P.rect(x + w / 2 - 1, b - 4, 3, 4, 0x06); }
    P.rect(30, 2, 1, 13, 0x08); P.rect(31, 2, 3, 3, 0x16);
  }),
  pagoda: () => paint(24, 52, (P) => {
    for (let i = 0; i < 6; i++) { const w = 15 - i * 2, x = 12 - w / 2, base = 51 - i * 8; P.rect(x, base - 5, w, 5, (xx) => (xx % 3 === 0 ? 0x0D : 0x04)); P.poly([[x - 3, base - 5], [x + w + 3, base - 5], [x + w, base - 8], [x, base - 8]], roofP(...PURPLE)); }
    P.rect(11, 0, 2, 4, 0x28); P.poly([[9, 4], [15, 4], [16, 8], [8, 8]], 0x28);
  }),
  fortress: () => paint(36, 22, (P) => {
    P.rect(1, 10, 34, 11, brickP(0x0D, 0x10, 0x00)); for (let x = 1; x < 35; x += 4) P.rect(x, 8, 2, 2, 0x10);
    P.rect(12, 4, 12, 6, (x, y) => (x % 4 === 0 ? 0x07 : 0x16)); P.poly([[9, 5], [27, 5], [24, 0.5], [12, 0.5]], roofP(...BLUE)); P.rect(15, 14, 6, 7, 0x0D); P.rect(16, 15, 4, 6, 0x07);
  }),
  bambooGrove: () => paint(30, 30, (P) => { for (const [x, y0] of [[3, 6], [13, 0], [22, 4]]) { P.rect(x, y0 + 3, 2, 30 - y0 - 3, (i, j, X, Y) => (Y % 6 === 0 ? 0x0A : i === 0 ? 0x2A : 0x1A)); P.rect(x + 3, y0 + 6, 2, 24 - y0, (i, j, X, Y) => ((Y + 3) % 6 === 0 ? 0x0A : i === 0 ? 0x2A : 0x1A)); P.poly([[x + 1, y0 + 4], [x - 3, y0], [x - 1, y0 + 5]], 0x2A); P.poly([[x + 4, y0 + 7], [x + 8, y0 + 3], [x + 6, y0 + 8]], 0x1A); } }),
  swampGrove: () => paint(30, 22, (P) => {
    for (const [x, h] of [[4, 18], [14, 21], [24, 16]]) { P.rect(x, 22 - h, 2, h, (i) => (i ? 0x08 : 0x07)); P.rect(x - 3, 22 - h + 3, 3, 1, 0x08); P.rect(x + 2, 22 - h + 6, 3, 1, 0x08); P.rect(x - 2, 22 - h, 1, 3, 0x08); }
    P.poly([[0, 21], [30, 21], [28, 22], [2, 22]], 0x0B);
  }),
  icecave: () => paint(32, 22, (P) => { P.poly([[1, 21], [6, 8], [13, 3], [20, 4], [27, 10], [31, 21]], (x, y) => ((x * 3 + y * 5) % 11 === 0 ? 0x10 : y < 8 ? 0x30 : (x + y * 2) % 7 === 0 ? 0x31 : 0x21)); P.poly([[17, 4], [27, 10], [31, 21], [20, 21]], (x, y) => ((x + y) % 5 === 0 ? 0x21 : 0x11)); P.poly([[10, 21], [11, 14], [16, 11], [21, 14], [22, 21]], 0x0C); P.rect(9, 12, 14, 1, 0x31); }),
  belltemple: () => paint(34, 30, (P) => {
    P.rect(5, 19, 24, 9, (x, y) => (x % 6 === 0 ? 0x07 : 0x16)); P.rect(14, 22, 6, 6, 0x07); P.rect(3, 27, 28, 2, 0x10); P.poly([[0, 19], [34, 19], [29, 13], [5, 13]], roofP(...GREEN));
    P.rect(13, 4, 8, 9, (x, y) => (x % 3 === 0 ? 0x07 : 0x17)); P.poly([[11, 5], [23, 5], [20, 0.5], [14, 0.5]], roofP(...GREEN)); P.poly([[15, 6], [19, 6], [20, 11], [14, 11]], 0x28);
  }),
  volcanopeak: () => paint(34, 24, (P) => {
    P.poly([[1, 23], [17, 1.5], [17, 23]], (x, y) => (y < 5 ? 0x16 : (x * 3 + y * 5) % 11 === 0 ? 0x16 : 0x07));
    P.poly([[17, 1.5], [33, 23], [17, 23]], (x, y) => (y < 5 ? 0x06 : (x + y) % 5 === 0 ? 0x07 : 0x08));
    P.poly([[13, 6], [17, 1.5], [21, 6], [17, 4]], 0x27);
  }),
  icewall: () => paint(18, 20, (P) => { P.poly([[1, 19], [3, 4], [8, 1], [12, 3], [16, 6], [17, 19]], (x, y) => ((x * 3 + y * 5) % 9 === 0 ? 0x30 : x < 9 ? 0x31 : 0x21)); P.rect(5, 6, 1, 8, 0x30); P.rect(11, 8, 1, 6, 0x11); }),
  chain: () => paint(18, 8, (P) => { for (let x = 1; x < 17; x += 4) { P.rect(x, 2, 3, 1, 0x10); P.rect(x, 5, 3, 1, 0x10); P.rect(x, 3, 1, 2, 0x10); P.rect(x + 2, 3, 1, 2, 0x00); } P.rect(0, 0, 1, 8, 0x08); P.rect(17, 0, 1, 8, 0x08); }),
};
// the Chinese storybook pieces and faces (ink.js) join and replace the plain ones
for (const [k, f] of Object.entries(INK_POP)) { if (k in SPR) SPR[k] = f; else POP[k] = f; }
Object.assign(FACES, INK_FACES);
const scache = {};
export function spr(name) { return scache[name] || (scache[name] = (SPR[name] || POP[name])()); }
