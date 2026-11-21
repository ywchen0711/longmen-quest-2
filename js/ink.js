// 水墨 / 青綠: the Chinese storybook look shared by both Longmen games. Everything is drawn in code at start-up,
// in NES-palette pixels like the rest of the art (no image files): Chinese pop-up scenery (pines, plum, willows,
// bamboo, Taihu rocks, stone lions, lanterns, pagodas, paifang gates, arched bridges, blue-green mountains with mist
// bands), new printed faces (white walls and dark tiles, flagstones, red doors, carved tomb stone), the ink washes
// laid over the printed ground (shore ink, mountain mist, forest shade), and the page dressing (回紋 border,
// vermilion seals).
export const NES = [
  0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400, 0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
  0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10, 0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
  0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044, 0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
  0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8, 0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000,
];
function rng(seed) { let s = seed >>> 0 || 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function face(seed, f, w = 16, h = 16) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed), img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = f(i, j, r); const o = (j * w + i) * 4; if (k < 0) { img.data[o + 3] = 0; continue; }
    const v = NES[k]; img.data[o] = v >> 16 & 255; img.data[o + 1] = v >> 8 & 255; img.data[o + 2] = v & 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}
// a little pixel painter (NES indexes): rect, poly, ellipse, line; empty pixels next to the picture become the outline
function paint(w, h, fn, outline = 0x0D) {
  const b = new Int16Array(w * h).fill(-1);
  const put = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h && c >= 0) b[y * w + x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? b[y * w + x] : -1);
  const val = (c, x, y) => (typeof c === 'function' ? c(x, y) : c);
  const P = {
    px: put, get,
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) put(x + i, y + j, val(c, x + i, y + j)); },
    poly(pts, c) {
      const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
      for (let y = y0; y <= y1; y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b2) => a - b2);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(x, y, val(c, x, y));
      }
    },
    ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) put(x, y, val(c, x, y)); } },
    line(x0, y0, x1, y1, c, wd = 1) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1; for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let a = 0; a < wd; a++) for (let q = 0; q < wd; q++) put(x - (wd - 1) / 2 + a, y - (wd - 1) / 2 + q, val(c, x, y)); } },
  };
  fn(P);
  if (outline >= 0) { const o = b.slice(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (b[y * w + x] >= 0) continue; if ((x > 0 && b[y * w + x - 1] >= 0) || (x < w - 1 && b[y * w + x + 1] >= 0) || (y > 0 && b[(y - 1) * w + x] >= 0) || (y < h - 1 && b[(y + 1) * w + x] >= 0)) o[y * w + x] = outline; } b.set(o); }
  return face(1, (i, j) => b[j * w + i], w, h);
}
const K = 0x0D;
// roof tiles (dark grey, rows of round tile ends) and the upturned-eave house used by every world-map town
export const tileP = (d, m, l) => (x, y) => (y % 3 === 2 ? d : (x % 3 === 0 ? d : y % 3 === 0 ? l : m));
export const GREYROOF = [0x0D, 0x2D, 0x00], GOLDROOF = [0x07, 0x28, 0x38], GREENROOF = [0x0B, 0x1A, 0x2A], BLUEROOF = [0x0C, 0x1C, 0x2C], THATCHROOF = [0x08, 0x18, 0x28];
// x: left of the wall, base: ground row, w: wall width, wallH/roofH: heights, roof: [dark, mid, light]
export function chouse(P, x, base, w, wallH, roofH, roof, door = true, wall = 0x30) {
  P.rect(x, base - wallH, w, wallH, (X, Y) => (Y === base - wallH ? 0x2D : wall));            // white wall under the eave's shadow
  P.rect(x, base - wallH, 1, wallH, 0x06); P.rect(x + w - 1, base - wallH, 1, wallH, 0x06);    // red corner pillars
  if (door) { P.rect(x + (w >> 1) - 1, base - 3, 2, 3, 0x06); P.px(x + (w >> 1), base - 2, 0x28); }
  if (w > 7) { P.rect(x + 2, base - wallH + 2, 2, 2, (X, Y) => ((X + Y) % 2 ? 0x08 : 0x18)); P.rect(x + w - 4, base - wallH + 2, 2, 2, (X, Y) => ((X + Y) % 2 ? 0x08 : 0x18)); }
  const eave = base - wallH, top = eave - roofH;
  // the roof sweeps down and turns up at both ends (飛簷)
  P.poly([[x - 3, eave - 1.6], [x - 1, eave + 0.2], [x + w + 1, eave + 0.2], [x + w + 3, eave - 1.6], [x + w + 0.5, eave - 1], [x + w - 1, top], [x + 1, top], [x - 0.5, eave - 1]], tileP(...roof));
  P.rect(x, top - 1, w, 1, roof[0]);                                     // the ridge
  P.px(x - 1, top - 2, roof[0]); P.px(x + w, top - 2, roof[0]);          // its curled ends (鴟吻)
}
// 青綠 mountains: a cluster of tall rounded pinnacles drawn back to front, 石青 blue up top, 石綠 green below, ink
// contours and 皴 strokes, and a white mist band hiding their feet
function mountain(snow, seed = 3) {
  const r = rng(seed), W = 34, H = 34;
  return paint(W, H, (P) => {
    const n = 3 + Math.floor(r() * 2), peaks = [];
    for (let i = 0; i < n; i++) { const cx = 5 + (i + 0.5) * (24 / n) + (r() - 0.5) * 4, w = 8 + r() * 6, top = i === 1 ? 1 + r() * 3 : 6 + r() * 10; peaks.push([cx, top, w]); }
    peaks.sort((a, b) => a[1] - b[1]);   // the tallest first (behind), the shorter ones in front of it
    for (const [cx, top, w] of peaks) {
      const pts = [[cx - w / 2, H], [cx - w * 0.46, top + 9], [cx - w * 0.36, top + 3], [cx - w * 0.15, top + 0.5], [cx + w * 0.12, top], [cx + w * 0.34, top + 2.5], [cx + w * 0.44, top + 8], [cx + w / 2, H]];
      P.poly(pts, (x, y) => {
        const f = (y - top) / (H - top), lit = x < cx - 0.5;
        if (snow) return f < 0.3 ? (lit ? 0x30 : 0x10) : lit ? ((x + y) % 5 === 0 ? 0x2D : 0x10) : ((x + y * 2) % 4 === 0 ? 0x2D : 0x00);
        if (f < 0.32) return lit ? ((x * 3 + y) % 9 === 0 ? 0x0C : 0x1C) : 0x0C;
        if (f < 0.7) return lit ? ((x + y * 3) % 7 === 0 ? 0x0B : 0x1A) : ((x * 2 + y) % 5 === 0 ? 0x0C : 0x0B);
        return lit ? 0x2A : 0x1A;
      });
      // the ink contour down both sides (so peaks in front read against the ones behind)
      const ink = snow ? 0x2D : 0x0C;
      for (let y = Math.ceil(top + 1); y < H; y++) {
        const f = Math.min(1, (y - top) / 9), hw = w * (0.15 + 0.31 * f) + (y > top + 9 ? (w * 0.04) * (y - top - 9) / (H - top - 9) : 0);
        P.px(Math.floor(cx - hw), y, ink); if (y > top + 2) P.px(Math.floor(cx + hw * 0.95), y, ink);
      }
      // 皴 strokes: short slanting lines on the shaded side, and a few dark moss dots (點苔) on the crest
      for (let k = 0; k < 4; k++) { const y0 = top + 4 + r() * (H - top - 14), x0 = cx + r() * w * 0.3; P.line(x0, y0, x0 + 1.5, y0 + 3, ink); }
      if (!snow) for (let k = 0; k < 3; k++) P.px(Math.floor(cx - w * 0.2 + r() * w * 0.35), Math.floor(top + 1 + r() * 2), 0x0B);
    }
    // the mist band, level; below it only pale feet
    for (let x = 0; x < W; x++) {
      const y0 = 23;   // a level band of mist
      for (let y = y0; y < H; y++) if (P.get(x, y) >= 0) P.px(x, y, y < H - 3 ? 0x30 : y === H - 1 ? (snow ? 0x00 : 0x1A) : (snow ? 0x10 : 0x3A));
    }
  });
}

export const INK_POP = {
  // 松: a leaning trunk with flat cloud-pads of needles
  cpine: () => paint(26, 26, (P) => {
    P.poly([[11, 25], [15, 25], [14, 18], [12, 13], [13, 8], [11, 8], [10, 13], [11, 19]], (x, y) => (x < 12 ? 0x18 : 0x08));
    P.line(12, 13, 5, 11, 0x08, 1); P.line(13, 9, 19, 6, 0x08, 1); P.line(13, 17, 20, 15, 0x08, 1); P.line(12, 20, 6, 19, 0x08, 1);
    for (const [cx, cy, rx, ry] of [[6, 10, 6, 2.3], [18, 5, 6.5, 2.4], [12, 3, 4.5, 2], [20, 14, 5.5, 2.1], [6, 18, 5, 2]]) {
      P.ell(cx, cy, rx, ry, (x, y) => (y < cy - 0.3 ? ((x + y) % 4 === 0 ? 0x0B : 0x1B) : ((x * 3 + y) % 5 === 0 ? 0x1B : 0x0B)));
    }
  }),
  // 梅: a dark gnarled branch, pink and white blossoms
  cplum: () => paint(22, 24, (P) => {
    P.line(11, 23, 10, 15, 0x08, 2); P.line(10, 15, 5, 9, 0x08, 2); P.line(10, 16, 16, 10, 0x08, 2); P.line(5, 9, 3, 3, 0x08, 1); P.line(16, 10, 18, 4, 0x08, 1); P.line(8, 12, 11, 6, 0x08, 1); P.line(14, 12, 20, 12, 0x08, 1);
    P.rect(9, 22, 4, 2, 0x08);
    const bl = [[3, 3], [5, 6], [2, 8], [7, 9], [11, 6], [10, 4], [13, 9], [17, 4], [19, 7], [16, 11], [20, 12], [6, 12], [12, 14], [18, 2]];
    bl.forEach(([x, y], i) => { const c = i % 4 === 0 ? 0x30 : i % 3 === 0 ? 0x26 : 0x35; P.px(x, y, c); P.px(x + 1, y, c); P.px(x, y + 1, c); P.px(x + 1, y + 1, i % 2 ? 0x28 : c); });
  }),
  // 柳: a short trunk, long drooping strands
  cwillow: () => paint(24, 28, (P) => {
    P.poly([[10, 27], [14, 27], [13, 16], [11, 16]], (x) => (x < 12 ? 0x18 : 0x08));
    P.ell(12, 7, 9, 5, (x, y) => ((x + y) % 3 === 0 ? 0x1A : 0x2A));
    for (let i = 0; i < 9; i++) { const x0 = 4 + i * 2, len = 10 + ((i * 7) % 5) * 2; P.line(x0, 8, x0 + (i < 4 ? -1.5 : i > 5 ? 1.5 : 0), 8 + len, i % 2 ? 0x1A : 0x2A); }
  }),
  // 竹: three culms with nodes and dark blade leaves
  cbamboo: () => paint(16, 30, (P) => {
    for (const [x, y0] of [[3, 5], [7, 0], [11, 3]]) {
      P.rect(x, y0 + 2, 2, 30 - y0 - 2, (X, Y) => ((Y + x) % 6 === 0 ? 0x0B : X === x ? 0x2A : 0x1A));
      for (let k = 0; k < 3; k++) { const yy = y0 + 4 + k * 7; P.line(x + 1, yy, x - 3, yy - 2, 0x0B); P.line(x + 1, yy + 3, x + 5, yy + 1, 0x0B); }
    }
  }),
  // 太湖石: a tall grey limestone with holes
  crock: () => paint(14, 20, (P) => {
    P.poly([[2, 19], [1, 13], [3, 8], [2, 3], [6, 0.5], [9, 2], [12, 6], [11, 11], [13, 15], [12, 19]], (x, y) => ((x * 3 + y * 5) % 11 === 0 ? 0x2D : x > 8 ? 0x00 : 0x10));
    P.ell(6, 5, 1.6, 1.4, K); P.ell(8.5, 11, 1.4, 2, K); P.ell(4.5, 14, 1.2, 1, 0x2D);
    P.rect(1, 18, 12, 2, 0x2D);
  }),
  // 石獅: a seated stone lion on a plinth
  clion: () => paint(14, 18, (P) => {
    P.rect(1, 15, 12, 3, (x, y) => (y === 15 ? 0x10 : 0x00));
    P.poly([[3, 15], [3, 9], [5, 7], [10, 7], [11, 10], [11, 15]], (x, y) => ((x + y) % 4 === 0 ? 0x00 : 0x10));
    P.ell(6.5, 5, 4, 3.6, (x, y) => ((x * 3 + y) % 4 === 0 ? 0x00 : 0x10));                       // the curly mane
    P.px(5, 4, K); P.px(8, 4, K); P.rect(5, 6, 4, 1, 0x2D);                                        // eyes, mouth
    P.ell(10.5, 13.5, 1.6, 1.6, 0x00); P.rect(3, 12, 2, 3, 0x00);                                   // the ball under its paw
  }),
  // a red paper lantern hanging from its cord
  clantern: () => paint(8, 14, (P) => {
    P.rect(4, 0, 1, 3, 0x08);
    P.rect(2, 3, 4, 1, 0x28); P.ell(4, 6.5, 3.6, 3.2, (x, y) => (y === 6 ? 0x26 : x <= 2 ? 0x06 : 0x16)); P.rect(2, 9, 4, 1, 0x28);
    P.rect(3, 10, 2, 1, 0x16); P.line(4, 11, 4, 13, 0x16); P.px(3, 13, 0x06);
  }),
  // a red lantern on a wooden post (street lamps)
  clamp: () => paint(12, 22, (P) => {
    P.rect(5, 6, 2, 16, (x) => (x === 5 ? 0x18 : 0x08)); P.rect(3, 21, 6, 1, 0x08);
    P.rect(5, 2, 6, 1, 0x08); P.rect(9, 3, 1, 1, 0x08);
    P.rect(8, 4, 3, 1, 0x28); P.ell(9.5, 7, 2.6, 2.6, (x, y) => (y === 7 ? 0x26 : 0x16)); P.rect(8, 9, 3, 1, 0x28); P.px(9, 10, 0x16); P.px(9, 11, 0x16);
  }),
  // 香爐: a bronze censer with three incense sticks
  cincense: () => paint(16, 18, (P) => {
    P.rect(3, 10, 10, 5, (x, y) => (y === 10 ? 0x28 : (x + y) % 4 === 0 ? 0x07 : 0x18)); P.rect(2, 9, 12, 1, 0x18);
    P.rect(4, 15, 1, 3, 0x08); P.rect(11, 15, 1, 3, 0x08); P.rect(7, 15, 2, 3, 0x08);
    P.rect(1, 10, 1, 3, 0x08); P.rect(14, 10, 1, 3, 0x08);
    for (const x of [6, 8, 10]) { P.line(x, 8, x, 4, 0x18); P.px(x, 3, 0x16); }
  }),
  // an upturned eave tip (飛簷) for the corners of house roofs
  ceave: () => paint(10, 7, (P) => {
    P.poly([[9.5, 6], [3, 6], [1, 4.5], [0.5, 1], [2, 3.5], [4, 4.5], [9.5, 4]], (x, y) => (y >= 5 ? 0x0D : (x % 3 === 0 ? 0x2D : 0x00)));
    P.px(0, 0, 0x2D);
  }),
  // 牌坊: four red pillars, a plaque, tiled roofs with upturned eaves
  cpaifang: () => paint(34, 26, (P) => {
    for (const x of [3, 11, 21, 29]) P.rect(x, 9, 2, 17, (X) => (X === x ? 0x16 : 0x06));
    for (const x of [2, 10, 20, 28]) P.rect(x, 24, 4, 2, 0x00);
    P.rect(2, 9, 30, 2, 0x06); P.rect(12, 11, 10, 4, (x, y) => (x === 12 || x === 21 || y === 11 || y === 14 ? 0x28 : 0x0C)); P.rect(15, 12, 1, 2, 0x28); P.rect(18, 12, 1, 2, 0x28);
    P.poly([[-1, 7], [1, 9], [33, 9], [35, 7], [31, 7.5], [29, 4], [5, 4], [3, 7.5]], tileP(...GREENROOF));
    P.poly([[9, 3], [11, 4.5], [23, 4.5], [25, 3], [22, 3.2], [20, 0.5], [14, 0.5], [12, 3.2]], tileP(...GREENROOF));
  }),
  // 拱橋: an arched stone bridge
  cbridge: () => paint(34, 14, (P) => {
    P.poly([[0, 13], [4, 6], [10, 2], [24, 2], [30, 6], [34, 13], [27, 13], [24, 9], [17, 6], [10, 9], [7, 13]], (x, y) => ((x + (y >> 1) * 2) % 5 === 0 || y % 3 === 0 ? 0x00 : 0x10));
    P.line(3, 6, 10, 1, 0x2D); P.line(10, 1, 24, 1, 0x2D); P.line(24, 1, 31, 6, 0x2D);
    for (const x of [6, 12, 17, 22, 28]) P.rect(x, x < 10 || x > 25 ? 2 : 0, 1, 2, 0x2D);
  }),
  // a sect banner on a pole
  cbanner: () => paint(12, 26, (P) => {
    P.rect(2, 0, 1, 26, 0x08); P.px(2, 0, 0x28);
    P.poly([[3, 2], [11, 2], [11, 14], [7, 17], [3, 14]], (x, y) => (x === 3 || x === 10 || y === 2 ? 0x28 : 0x16));
    P.rect(5, 5, 4, 1, 0x30); P.rect(6, 4, 2, 6, 0x30); P.rect(5, 9, 4, 1, 0x30);   // a white character
  }),
  // a tall paper lantern string for festival towns
  clanterns: () => paint(30, 8, (P) => {
    P.line(0, 1, 15, 3, 0x08); P.line(15, 3, 30, 1, 0x08);
    for (const x of [4, 11, 18, 25]) { const y = 2 + (x > 10 && x < 20 ? 1 : 0); P.ell(x, y + 2.5, 2, 2.2, (X, Y) => (Y === y + 2 ? 0x26 : 0x16)); P.px(x, y + 5, 0x28); }
  }, -1),
  // 青綠 mountains and snowy ink mountains (world map peaks)
  cmount: () => mountain(false, 3),
  cmount2: () => mountain(false, 8),
  csnowmount: () => mountain(true, 5),
  // soft green hills in the 青綠 manner
  chill: () => paint(18, 10, (P) => {
    P.poly([[0, 9.5], [3, 5], [7, 2], [11, 3], [15, 6], [18, 9.5]], (x, y) => (y < 4 ? 0x1C : y < 7 ? ((x + y) % 4 === 0 ? 0x0B : 0x1A) : 0x0B));
    for (let x = 1; x < 17; x++) if (P.get(x, 7) >= 0 && x % 3) P.px(x, 7, 0x30);
  }),
  // 海水紋: curling wave crests (water on the world map)
  wave: () => paint(20, 7, (P) => {
    for (let i = 0; i < 2; i++) {
      const x0 = 1 + i * 9;
      P.poly([[x0, 6], [x0 + 1.5, 3], [x0 + 4, 1], [x0 + 7, 1.2], [x0 + 8, 3], [x0 + 6.5, 4.2], [x0 + 5.5, 3], [x0 + 6, 2.4], [x0 + 4.4, 2.6], [x0 + 3.5, 4.5], [x0 + 4, 6]], (x, y) => (y < 3 ? 0x30 : 0x21));
    }
    P.rect(1, 5, 18, 2, 0x11);
  }),
  // a stele on a tortoise (贔屭)
  stele: () => paint(16, 22, (P) => {
    P.ell(8, 19, 7, 2.6, (x, y) => ((x + y) % 3 === 0 ? 0x0C : 0x1C)); P.ell(14, 19, 1.8, 1.4, 0x1C); P.px(14, 18, K);
    P.poly([[3, 18], [3, 4], [5, 1.5], [11, 1.5], [13, 4], [13, 18]], (x, y) => ((x * 3 + y * 5) % 13 === 0 ? 0x00 : x > 10 ? 0x2D : 0x10));
    for (let y = 5; y < 16; y += 3) P.rect(6, y, 1, 2, 0x2D), P.rect(9, y, 1, 2, 0x2D);
  }),
  // a blue-and-white porcelain jar (pots)
  pot: () => paint(14, 14, (P) => {
    P.rect(5, 1, 4, 2, (x, y) => (y === 1 ? 0x12 : 0x30));
    P.ell(7, 8, 6, 5.5, (x, y) => ((y === 6 || y === 10) ? 0x12 : ((x + y) % 4 === 0 && y > 6 && y < 10) ? 0x12 : x < 4 ? 0x10 : 0x30));
    P.rect(4, 13, 6, 1, 0x12);
  }),
  // a bamboo fence
  fence: () => paint(16, 12, (P) => {
    for (let x = 0; x < 16; x += 3) P.rect(x, 1, 2, 11, (X, Y) => (Y % 5 === 0 ? 0x0B : X % 3 === 0 ? 0x2A : 0x1A));
    P.rect(0, 3, 16, 1, 0x18); P.rect(0, 8, 16, 1, 0x18);
  }),
  // street lamp: the red lantern post
  lamp: () => INK_POP.clamp(),
  // 亭: a hexagonal pavilion with a pointed upturned roof over a terrace
  pavilion: () => paint(30, 28, (P) => {
    P.rect(3, 24, 24, 3, (x, y) => (y === 24 ? 0x10 : (x % 4 === 0 ? 0x2D : 0x00)));
    for (const x of [6, 14, 22]) P.rect(x, 13, 2, 11, (X) => (X === x ? 0x16 : 0x06));
    P.rect(5, 19, 20, 1, 0x06); for (let x = 6; x < 24; x += 2) P.px(x, 20, 0x06);   // railing
    P.poly([[-0.5, 11], [2, 13.5], [28, 13.5], [30.5, 11], [26, 11.5], [17, 3], [13, 3], [4, 11.5]], tileP(...BLUEROOF));
    P.rect(14, 0, 2, 3, 0x28); P.px(14, 0, 0x38);
  }),
  // 寺: a red hall with yellow glazed double roofs and an incense burner
  temple: () => paint(36, 28, (P) => {
    P.rect(5, 16, 26, 9, (x, y) => (x % 5 === 0 ? 0x06 : (y > 21 ? 0x16 : 0x26)));
    P.rect(14, 19, 8, 6, (x, y) => ((x + y) % 2 ? 0x06 : 0x16)); P.rect(3, 25, 30, 2, 0x10);
    P.poly([[-0.5, 13.5], [2, 16.5], [34, 16.5], [36.5, 13.5], [32, 14], [29, 10], [7, 10], [4, 14]], tileP(...GOLDROOF));
    P.rect(9, 7, 18, 3, (x) => (x % 4 === 0 ? 0x06 : 0x16));
    P.poly([[5, 6], [7, 8], [29, 8], [31, 6], [28, 6.5], [25, 2], [11, 2], [8, 6.5]], tileP(...GOLDROOF));
    P.px(10, 1, 0x07); P.px(25, 1, 0x07); P.rect(11, 1, 14, 1, 0x07);
  }),
  // 塔: a five-storey pagoda with upturned eaves at every floor
  tower: () => paint(22, 44, (P) => {
    for (let i = 0; i < 5; i++) {
      const w = 12 - i * 2, x = 11 - w / 2, base = 43 - i * 8;
      P.rect(x, base - 5, w, 5, (xx) => (xx % 3 === 0 ? 0x06 : 0x30));
      P.poly([[x - 4, base - 6.5], [x - 2, base - 5], [x + w + 2, base - 5], [x + w + 4, base - 6.5], [x + w + 1, base - 6.2], [x + w - 0.5, base - 8], [x + 0.5, base - 8], [x - 1, base - 6.2]], tileP(...GREYROOF));
    }
    P.rect(10, 0, 2, 4, 0x28); P.px(10, 1, 0x38);
  }),
  // world-map town: a crenellated grey-brick wall with a gate tower (城樓)
  town_f: () => paint(36, 14, (P) => {
    P.rect(1, 6, 34, 7, (x, y) => { const row = y >> 1, off = row % 2 ? 2 : 0; return (y % 2 === 1 || (x + off) % 4 === 3) ? 0x2D : 0x00; });
    for (let x = 1; x < 35; x += 3) P.rect(x, 5, 2, 1, 0x00);
    P.rect(15, 8, 6, 5, K); P.ell(18, 8.5, 3, 2, K); P.rect(16, 9, 4, 4, 0x07);
    P.rect(13, 3, 10, 3, (x) => (x === 13 || x === 22 ? 0x06 : 0x30));
    P.poly([[10, 2], [12, 3.5], [24, 3.5], [26, 2], [23, 2.3], [21, 0], [15, 0], [13, 2.3]], tileP(...GREYROOF));
  }),
  city_f: () => paint(38, 16, (P) => {
    P.rect(1, 7, 36, 8, (x, y) => { const row = y >> 1, off = row % 2 ? 2 : 0; return (y % 2 === 1 || (x + off) % 4 === 3) ? 0x2D : 0x00; });
    for (let x = 1; x < 37; x += 3) P.rect(x, 5, 2, 2, 0x00);
    P.rect(15, 9, 8, 6, K); P.ell(19, 9.5, 4, 2.4, K); P.rect(16, 10, 6, 5, 0x17); P.rect(18, 10, 2, 5, 0x07);
    P.rect(12, 3, 14, 3, (x) => (x % 4 === 0 ? 0x06 : 0x30));
    P.poly([[8, 2.2], [10, 3.6], [28, 3.6], [30, 2.2], [27, 2.5], [25, 0], [13, 0], [11, 2.5]], tileP(...GREYROOF));
  }),
  village_f: () => paint(34, 10, (P) => {
    for (let x = 1; x < 33; x += 3) P.rect(x, 3, 2, 7, (X, Y) => (Y % 4 === 0 ? 0x0B : X % 3 === 1 ? 0x2A : 0x1A));
    P.rect(1, 5, 32, 1, 0x18); P.rect(1, 8, 32, 1, 0x18);
    P.rect(14, 0, 1, 10, 0x06); P.rect(20, 0, 1, 10, 0x06); P.rect(13, 1, 9, 2, (x) => (x % 2 ? 0x06 : 0x16)); P.rect(15, 3, 5, 7, -1);
  }),
};

// ---------------------------------------------------------------- printed faces
const sp = (r, list) => { const v = r(); let a = 0; for (const [p, c] of list) { a += p; if (v < a) return c; } return list[list.length - 1][1]; };
export const INK_FACES = {
  // grass: a calm wash with a few dark moss dots in pairs (苔點), so it neither looks noisy nor sparkles in motion
  grass: () => face(11, (i, j) => { const t = ((i + 3) % 8 === 0 && (j + 2) % 8 < 2) || ((i + 7) % 8 === 0 && (j + 6) % 8 < 2) || ((i + 5) % 8 < 2 && (j + 4) % 16 === 0); return t ? 0x0A : 0x1A; }),
  grass2: () => face(71, (i, j) => { const t = ((i + 1) % 6 === 0 && (j + 3) % 6 < 2); return t ? 0x0A : ((i + j * 3) % 23 === 0 ? 0x2A : 0x1A); }),
  forestFloor: () => face(15, (i, j) => (((i + j * 2) % 7 === 0 && j % 3 === 0) ? 0x0B : ((i * 3 + j) % 11 === 0 ? 0x1A : 0x0A))),
  road: () => face(16, (i, j) => ((i * 5 + j * 3) % 13 === 0 ? 0x18 : 0x27)),
  sand: () => face(17, (i, j) => ((j + (i >> 2)) % 6 === 0 && i % 3 ? 0x27 : 0x37)),
  // water: pale 石青 with brushed ripple lines
  water: () => face(56, (i, j) => { const w = ((i + (j >> 3) * 6) % 16 < 5) && j % 8 === 0; return w ? 0x31 : (j % 8 === 4 && (i + 8) % 16 < 3) ? 0x21 : 0x11; }, 32, 32),
  // 青石板: blue-grey flagstones
  pave: () => face(28, (i, j, r) => { const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x2D; return r() < 0.06 ? 0x00 : 0x10; }),
  // 粉牆: a white wall in a dark timber frame with a lattice window
  plaster: () => face(37, (i, j) => {
    if (j < 1 || j > 14 || i < 1 || i > 14) return 0x08;
    if (j > 12) return 0x2D;
    if (i >= 4 && i <= 11 && j >= 3 && j <= 9) return (i === 4 || i === 11 || j === 3 || j === 9) ? 0x08 : ((i + j) % 2 === 0 || i === 7 || j === 6) ? 0x08 : 0x37;
    return 0x30;
  }),
  // 黛瓦: dark grey roof tiles, round tile ends in rows
  roofTile: () => face(85, (i, j) => (j % 4 === 3 ? K : (i % 4 === 0 ? 0x2D : j % 4 === 0 ? 0x10 : 0x00))),
  roofTileTop: () => face(86, (i, j) => (i % 4 === 0 ? K : (i % 4 === 1 ? 0x10 : 0x00))),
  // grey brick with a dark tile coping (courtyard walls)
  wallStone: () => face(32, (i, j) => { if (j < 3) return j === 2 ? K : (i % 4 === 0 ? 0x2D : 0x00); const row = j >> 2, off = row % 2 ? 4 : 0; if (j % 4 === 3 || (i + off) % 8 === 7) return 0x2D; return (i * 3 + j * 5) % 17 === 0 ? 0x00 : 0x10; }),
  wallStoneTop: () => face(33, (i, j) => (i % 4 === 0 ? K : (j % 4 === 1 ? 0x10 : 0x00))),
  // a red double door with gold studs and ring knockers
  door: () => face(59, (i, j) => { if (i === 0 || i === 15 || j === 0) return 0x08; if (i === 7 || i === 8) return 0x07; if ((i === 5 || i === 10) && j === 8) return 0x28; if (j % 4 === 2 && (i % 3 === 1)) return 0x38; return 0x06; }),
  // tomb stone carved with 祥雲 clouds
  tombWall: () => face(48, (i, j) => { const c = Math.sin(i * 0.9) * 2 + Math.cos(j * 0.8 + i * 0.3) * 2; if (j % 8 === 7) return 0x08; return c > 2.6 ? 0x27 : c < -2.4 ? 0x08 : 0x18; }),
  // 朱牆: a red temple wall over a grey plinth, with a yellow band under the eave
  templeWall: () => face(51, (i, j) => { if (j < 2) return 0x28; if (j > 12) return (i + j) % 4 === 0 ? 0x2D : 0x00; return (i % 8 === 0) ? 0x06 : 0x16; }),
};

// ---------------------------------------------------------------- ink washes over the printed ground
// `kind(x, z)` names a tile's class: 'water', 'mount', 'snow', 'forest', 'sand', 'land', 'wall' or null (blank page).
// The washes are drawn at one pixel a tile, blurred, then scaled up smoothly onto the 16-pixels-a-tile print; brush
// strokes follow the shore.
function blurA(a, w, h, rad) {
  const t = new Float32Array(w * h), o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -rad; x <= rad; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[y * w + x] = s / (2 * rad + 1); s += a[y * w + Math.min(w - 1, x + rad + 1)] - a[y * w + Math.max(0, x - rad)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -rad; y <= rad; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { o[y * w + x] = s / (2 * rad + 1); s += t[Math.min(h - 1, y + rad + 1) * w + x] - t[Math.max(0, y - rad) * w + x]; } }
  return o;
}
export function inkWash(g, W, H, kind, ox = 0, oy = 0, T = 16, seed = 1) {
  const r = rng(seed * 977 + W * 31 + H);
  const K2 = []; for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) K2.push(kind(x, z));
  const mask = (f) => { const a = new Float32Array(W * H); for (let i = 0; i < a.length; i++) a[i] = f(K2[i]) ? 1 : 0; return a; };
  const layer = (a, rgb, alpha, shape = (v) => v) => {
    const c = canvas(W, H), x = c.getContext('2d'), id = x.createImageData(W, H);
    for (let i = 0; i < a.length; i++) { const v = shape(a[i]); id.data[i * 4] = rgb[0]; id.data[i * 4 + 1] = rgb[1]; id.data[i * 4 + 2] = rgb[2]; id.data[i * 4 + 3] = Math.max(0, Math.min(255, v * alpha * 255)); }
    x.putImageData(id, 0, 0);
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H, ox, oy, W * T, H * T); g.restore();   // one flat tone per tile: shading never crosses a tile edge
  };
  const water = mask((k) => k === 'water'), land = mask((k) => k && k !== 'water');
  const hasWater = water.some((v) => v), hasLand = land.some((v) => v);
  if (hasWater && hasLand) {
    // the land's edge darkens toward the shore (an ink wash), and the water deepens away from it
    const wb = blurA(water, W, H, 2), lb = blurA(land, W, H, 2);
    layer(wb.map((v, i) => (land[i] ? v : 0)), [70, 62, 48], 0.32, (v) => Math.min(1, v * 1.6));
    layer(lb.map((v, i) => (water[i] ? 1 - v : 0)), [24, 52, 74], 0.22);
  }
  const mt = mask((k) => k === 'mount' || k === 'snow');
  if (mt.some((v) => v)) {   // blue-green wash round the ranges, then a pale mist halo below them
    const b1 = blurA(mt, W, H, 2), b2 = blurA(mt, W, H, 4);
    layer(b1, [40, 110, 110], 0.26, (v) => Math.min(1, v * 1.4));
    layer(b2.map((v, i) => v * (1 - mt[i])), [252, 248, 236], 0.35, (v) => Math.min(1, v * 2));
  }
  const fo = mask((k) => k === 'forest');
  if (fo.some((v) => v)) layer(blurA(fo, W, H, 1), [12, 40, 20], 0.22);
  // the shore: a straight ink rule on the water side of every land/water tile edge (corners meet cleanly), with a
  // pale line of foam inside it
  if (hasWater && hasLand) {
    g.save();
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      if (K2[z * W + x] !== 'water') continue;
      const X = ox + x * T, Y = oy + z * T;
      const landAt = (dx, dz) => { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= H) return false; const k = K2[nz * W + nx]; return !!k && k !== 'water'; };
      const L = landAt(-1, 0), R = landAt(1, 0), U = landAt(0, -1), D = landAt(0, 1);
      g.fillStyle = 'rgb(30,34,44)';
      if (L) g.fillRect(X, Y, 2, T); if (R) g.fillRect(X + T - 2, Y, 2, T); if (U) g.fillRect(X, Y, T, 2); if (D) g.fillRect(X, Y + T - 2, T, 2);
      g.fillStyle = 'rgba(236,244,248,0.75)';
      if (L) g.fillRect(X + 3, Y + (U ? 3 : 0), 1, T - (U ? 3 : 0) - (D ? 3 : 0)); if (R) g.fillRect(X + T - 4, Y + (U ? 3 : 0), 1, T - (U ? 3 : 0) - (D ? 3 : 0));
      if (U) g.fillRect(X + (L ? 3 : 0), Y + 3, T - (L ? 3 : 0) - (R ? 3 : 0), 1); if (D) g.fillRect(X + (L ? 3 : 0), Y + T - 4, T - (L ? 3 : 0) - (R ? 3 : 0), 1);
    }
    g.restore();
  }
}

// ---------------------------------------------------------------- page dressing: the 回紋 border and the seals
// a fret band one unit wide (in print pixels) round a rectangle, in vermilion ink, plus a thin rule inside it
export function fretBorder(g, x0, y0, x1, y1, unit = 8, col = 'rgba(160,40,26,0.78)') {
  g.save(); g.fillStyle = col;
  const u = unit, q = u / 4;
  // one fret motif in a u x u cell: a square spiral of 1-pixel lines
  const motif = (cx, cy) => {
    const L = (x, y, w, h) => g.fillRect(Math.round(cx + x * q), Math.round(cy + y * q), Math.max(1, Math.round(w * q)), Math.max(1, Math.round(h * q)));
    L(0, 0, 4, 0.25); L(3.75, 0, 0.25, 4); L(0, 3.75, 4, 0.25); L(0, 1, 0.25, 3); L(0, 1, 2.75, 0.25); L(2.5, 1, 0.25, 1.75); L(1.25, 2.5, 1.5, 0.25);
  };
  for (let x = x0; x + u <= x1 + 0.5; x += u) { motif(x, y0); motif(x, y1 - u); }
  for (let y = y0 + u; y + u <= y1 - u + 0.5; y += u) { motif(x0, y); motif(x1 - u, y); }
  g.fillRect(x0 + u + 2, y0 + u + 2, x1 - x0 - 2 * u - 4, 1); g.fillRect(x0 + u + 2, y1 - u - 3, x1 - x0 - 2 * u - 4, 1);
  g.fillRect(x0 + u + 2, y0 + u + 2, 1, y1 - y0 - 2 * u - 4); g.fillRect(x1 - u - 3, y0 + u + 2, 1, y1 - y0 - 2 * u - 4);
  g.restore();
}
const KAI = "'Kaiti TC','STKaiti','KaiTi','DFKai-SB','BiauKai','Songti TC','STSong','SimSun','PMingLiU',serif";
// a square vermilion seal with white characters (two to four), drawn at `px` pixels, crisp (thresholded) so it
// prints like the pixel art. kind: 'white' (characters cut out, 白文) or 'red' (red characters on paper, 朱文)
export function sealCanvas(text, px = 24, kind = 'white', seed = 4) {
  const S = px * 4, c = canvas(S, S), g = c.getContext('2d'), r = rng(seed);
  const red = '#b8321e';
  g.fillStyle = kind === 'white' ? red : 'rgba(0,0,0,0)'; g.fillRect(0, 0, S, S);
  if (kind !== 'white') { g.strokeStyle = red; g.lineWidth = S * 0.08; g.strokeRect(S * 0.06, S * 0.06, S * 0.88, S * 0.88); }
  const chars = [...text], n = chars.length, cols = n > 2 ? 2 : n === 2 ? 1 : 1, rows = n > 2 ? 2 : n;
  g.fillStyle = kind === 'white' ? '#fff7ea' : red; g.textAlign = 'center'; g.textBaseline = 'middle';
  const cw = S * 0.8 / Math.max(cols, 1), ch = S * 0.8 / rows;
  g.font = `bold ${Math.floor(Math.min(cw, ch) * 0.98)}px ${KAI}`;
  // seals read right to left, top to bottom
  chars.forEach((t, i) => { const col = cols - 1 - Math.floor(i / rows), row = i % rows; g.fillText(t, S * 0.1 + cw * (col + 0.5), S * 0.1 + ch * (row + 0.53)); });
  // down to `px` with a hard threshold, and a few worn specks
  const o = canvas(px, px), og = o.getContext('2d'); og.imageSmoothingEnabled = true; og.drawImage(c, 0, 0, px, px);
  const id = og.getImageData(0, 0, px, px), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; const wear = r() < 0.05; if (a < 110 || (wear && kind === 'white' && d[i + 1] < 120)) { d[i + 3] = 0; continue; } d[i + 3] = 235; const isRed = d[i] > 150 && d[i + 1] < 120; d[i] = isRed ? 184 : 255; d[i + 1] = isRed ? 50 : 247; d[i + 2] = isRed ? 30 : 234; }
  og.putImageData(id, 0, 0);
  return o;
}
// a canvas brush stroke (for headings): a dry-brush underline, black ink, tapering
export function brushURL(w = 160, h = 14, seed = 6, col = [43, 33, 24]) {
  const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
  for (let x = 2; x < w - 2; x++) {
    const t = x / w, th = (h * 0.42) * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.75 + 0.25 * Math.sin(x * 0.11)), cy = h * 0.55 + Math.sin(x * 0.03) * 1.2;
    for (let y = Math.floor(cy - th); y <= cy + th; y++) { if (r() < 0.12 + t * 0.15) continue; g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.75 + r() * 0.2})`; g.fillRect(x, y, 1, 1); }
  }
  return c.toDataURL('image/png');
}
export function sealURL(text, px = 24, kind = 'white') { const s = sealCanvas(text, px, kind); return s.toDataURL('image/png'); }
// the 回紋 frame for the paper windows: a border-image (96x96, slice 24) with a deckled edge, a vermilion double
// rule and fret hooks in the corners
export function fretFrameURL(fill = '#f3e8cf', seed = 21) {
  const n = 96, s = 24, c = canvas(n, n), g = c.getContext('2d'), r = rng(seed);
  const inset = 9, pts = [];
  const side = (x0, y0, x1, y1) => { const steps = 22; for (let i = 0; i < steps; i++) { const f = i / steps, j = (r() - 0.5) * 3.2; const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny); pts.push([x0 + (x1 - x0) * f + nx / l * j, y0 + (y1 - y0) * f + ny / l * j]); } };
  side(inset, inset, n - inset, inset); side(n - inset, inset, n - inset, n - inset); side(n - inset, n - inset, inset, n - inset); side(inset, n - inset, inset, inset);
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  g.save(); g.shadowColor = 'rgba(40,25,10,0.45)'; g.shadowBlur = 5; g.shadowOffsetX = 2; g.shadowOffsetY = 3; g.fillStyle = fill; path(); g.fill(); g.restore();
  g.fillStyle = fill; g.fillRect(s - 1, s - 1, n - 2 * s + 2, n - 2 * s + 2); g.fillRect(inset + 4, s - 1, n - 2 * inset - 8, n - 2 * s + 2); g.fillRect(s - 1, inset + 4, n - 2 * s + 2, n - 2 * inset - 8);
  // the double rule (it runs through the middle of the edge slices so it repeats cleanly)
  const red = 'rgba(168,44,28,0.85)';
  g.fillStyle = red;
  const a = 15, b = 19;
  g.fillRect(a, a, n - 2 * a, 2); g.fillRect(a, n - a - 2, n - 2 * a, 2); g.fillRect(a, a, 2, n - 2 * a); g.fillRect(n - a - 2, a, 2, n - 2 * a);
  g.fillRect(b, b, n - 2 * b, 1); g.fillRect(b, n - b - 1, n - 2 * b, 1); g.fillRect(b, b, 1, n - 2 * b); g.fillRect(n - b - 1, b, 1, n - 2 * b);
  // fret hooks in the corners (回): a small square spiral sitting on the rules
  const hook = (x, y, sx, sy) => { const R = (dx, dy, w, h) => g.fillRect(x + (sx > 0 ? dx : -dx - w), y + (sy > 0 ? dy : -dy - h), w, h); R(0, 0, 9, 2); R(0, 0, 2, 9); R(4, 4, 5, 2); R(4, 4, 2, 5); R(7, 4, 2, 5 - 0); };
  g.fillStyle = 'rgba(168,44,28,0.9)';
  hook(a, a, 1, 1); hook(n - a, a, -1, 1); hook(a, n - a, 1, -1); hook(n - a, n - a, -1, -1);
  return c.toDataURL('image/png');
}
// an ink-wash landscape for battle backdrops, drawn small (the stage's own pixels; scaled up later with nearest): a
// sky wash and a red sun, far peaks fading down into mist, a mist band, a nearer ridge with a few ink pines.
// pal: { sky, far, near } as [r,g,b]; W: stage width; floor: the row where the floor card begins
export function inkLandscape(g, pal, seed = 1, W = 160, floor = 48, paper = [243, 232, 207]) {
  const r = rng(seed), fy = floor / 48;
  const mix = (a, b, f) => `rgb(${(a[0] * (1 - f) + b[0] * f) | 0},${(a[1] * (1 - f) + b[1] * f) | 0},${(a[2] * (1 - f) + b[2] * f) | 0})`;
  const sky = g.createLinearGradient(0, 0, 0, floor); sky.addColorStop(0, mix(pal.sky, paper, 0.7)); sky.addColorStop(1, mix(pal.sky, paper, 0.92));
  g.fillStyle = sky; g.fillRect(0, 0, W, floor);
  g.fillStyle = mix([196, 52, 34], paper, 0.3); g.beginPath(); g.arc(W * 0.8, 13 * fy, 6 * fy, 0, Math.PI * 2); g.fill();
  const peaks = (base, hmax, n, colTop, fade, jag) => {
    const xs = []; for (let i = 0; i <= n; i++) xs.push([i * W / n + (r() - 0.5) * 12, base - hmax * (0.45 + r() * 0.55)]);
    g.beginPath(); g.moveTo(-4, base + 6);
    for (let i = 0; i < xs.length; i++) {
      const [x, y] = xs[i], px = i ? xs[i - 1][0] : -4;
      g.lineTo((px + x) / 2 + (r() - 0.5) * jag, base - (base - y) * (0.25 + r() * 0.2)); g.lineTo(x - 2, y + 2); g.lineTo(x, y); g.lineTo(x + 2, y + 1.5);
    }
    g.lineTo(W + 4, base + 6); g.closePath();
    const gr = g.createLinearGradient(0, base - hmax, 0, base + 3); gr.addColorStop(0, colTop); gr.addColorStop(0.6, fade); gr.addColorStop(1, mix(paper, paper, 0));
    g.fillStyle = gr; g.fill();
  };
  peaks(41 * fy, 36 * fy, Math.round(5 * W / 160), mix(pal.far, [44, 54, 66], 0.6), mix(pal.far, paper, 0.75), 8);
  g.fillStyle = mix(paper, paper, 0); g.globalAlpha = 0.6; g.fillRect(0, 32 * fy, W, 4 * fy); g.globalAlpha = 0.35; g.fillRect(0, 30 * fy, W, 1); g.globalAlpha = 1;
  peaks(47 * fy, 20 * fy, Math.round(7 * W / 160), mix(pal.near, [22, 28, 30], 0.62), mix(pal.near, paper, 0.5), 5);
  g.fillStyle = 'rgba(28,32,30,0.88)';
  for (let i = 0; i < Math.round(4 * W / 160); i++) {
    const x = 10 + r() * (W - 20), y = (38 + r() * 5) * fy;
    g.fillRect(x | 0, y | 0, 1, 7); for (let k = 0; k < 3; k++) g.fillRect((x - 3 + k) | 0, (y + k * 2) | 0, 7 - k * 2, 1);
  }
}
