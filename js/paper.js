// Paper, card and table pictures for the pop-up book look, all drawn in code once at start-up (no image files):
// paper grain, wood for the table, the stacked page edges, die-cut white borders round the pixel art, and the CSS
// pictures (grain tile, deckled paper edge) used by the windows.
function rng(seed) { let s = seed >>> 0 || 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// a tiling grey grain (values near white) with soft blotches and a few long fibres
export function grainCanvas(n = 256, seed = 3, blot = 1) {
  const c = canvas(n, n), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#fff'; g.fillRect(0, 0, n, n);
  // soft blotches: big faint discs, wrapped so the tile repeats without seams
  for (let i = 0; i < 70; i++) {
    const x = r() * n, y = r() * n, rad = 6 + r() * 26, a = (0.025 + r() * 0.035) * blot;
    for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); gr.addColorStop(0, `rgba(120,100,70,${a})`); gr.addColorStop(1, 'rgba(120,100,70,0)');
      g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
  // fibres
  g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    let x = r() * n, y = r() * n, a = r() * Math.PI * 2; const len = 6 + r() * 18, dark = r() < 0.6;
    g.strokeStyle = dark ? `rgba(110,90,60,${0.05 + r() * 0.07})` : `rgba(255,255,255,${0.3 + r() * 0.3})`; g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * len / 4; y += Math.sin(a) * len / 4; g.lineTo(x, y); }
    g.stroke();
  }
  // fine speckle
  const id = g.getImageData(0, 0, n, n), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 16; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
  g.putImageData(id, 0, 0);
  return c;
}

// warm wooden planks for the table under the book (tiles across planks)
export function woodCanvas(n = 256, seed = 11) {
  const c = canvas(n, n), g = c.getContext('2d'), r = rng(seed);
  const planks = 4, ph = n / planks;
  for (let p = 0; p < planks; p++) {
    const base = [96 + r() * 18, 62 + r() * 12, 38 + r() * 8];
    g.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`; g.fillRect(0, p * ph, n, ph);
    for (let k = 0; k < 26; k++) {   // grain lines, wrapping in x
      const y0 = p * ph + r() * ph, amp = 1 + r() * 3, f = (1 + (r() * 3 | 0)) * Math.PI * 2 / n, ph0 = r() * 6;
      g.strokeStyle = r() < 0.5 ? `rgba(40,22,10,${0.10 + r() * 0.14})` : `rgba(180,130,80,${0.06 + r() * 0.08})`; g.lineWidth = 0.6 + r() * 1.4;
      g.beginPath(); for (let x = 0; x <= n; x += 4) { const y = y0 + Math.sin(x * f + ph0) * amp; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    }
    g.fillStyle = 'rgba(25,12,5,0.55)'; g.fillRect(0, p * ph, n, 2);   // the seam between planks
    g.fillStyle = 'rgba(255,220,170,0.08)'; g.fillRect(0, p * ph + 2, n, 1);
  }
  return c;
}

// the side of a stack of pages: fine cream lines with darker gaps
export function edgeCanvas(seed = 5) {
  const c = canvas(64, 64), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 2) { g.fillStyle = `rgba(120,95,60,${0.12 + r() * 0.2})`; g.fillRect(0, y, 64, 1); }
  return c;
}

// a die-cut card from pixel art: the art scaled up (nearest), on a white paper border of radius `rad` pixels with a
// thin grey cut line round the outside. Returns a canvas `pad` pixels larger on every side.
export function dieCut(src, scale = 4, pad = 6, rad = 5, col = '#fffcf2', line = '#bdb29c') {
  const W = src.width * scale, H = src.height * scale, c = canvas(W + pad * 2, H + pad * 2), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const sil = (fill) => { const s = canvas(W, H), x = s.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, W, H); x.globalCompositeOperation = 'source-in'; x.fillStyle = fill; x.fillRect(0, 0, W, H); return s; };
  const disc = (s, R) => { const R2 = R * R + 0.5; for (let dy = -Math.ceil(R); dy <= R; dy++) for (let dx = -Math.ceil(R); dx <= R; dx++) if (dx * dx + dy * dy <= R2) g.drawImage(s, pad + dx, pad + dy); };
  if (rad > 0) { disc(sil(line), rad); disc(sil(col), rad - 1); }
  g.drawImage(src, pad, pad, W, H);
  return c;
}

// ---------------------------------------------------------------- CSS pictures for the windows
// a cream paper tile with grain (for window backgrounds) and a deckled-edge frame (for border-image)
export const PAPER = '#f3e8cf';
export function paperTileURL() {
  const n = 128, c = canvas(n, n), g = c.getContext('2d');
  g.drawImage(grainCanvas(n, 9, 0.22), 0, 0);
  // keep only the darkening: the window background colour shows through
  const id = g.getImageData(0, 0, n, n), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = d[i]; const a = Math.max(0, 255 - v) / 255; d[i] = 110; d[i + 1] = 88; d[i + 2] = 56; d[i + 3] = Math.min(255, a * 255 * 1.1); }
  g.putImageData(id, 0, 0);
  return c.toDataURL('image/png');
}
// border-image source: 96x96, slice 24. Transparent outside a torn edge, cream inside, a soft shadow below-right.
export function deckleURL(seed = 21, fill = PAPER) {
  const n = 96, s = 24, c = canvas(n, n), g = c.getContext('2d'), r = rng(seed);
  const inset = 9;   // where the torn edge runs, from the outside
  const pts = [];
  const side = (x0, y0, x1, y1) => { const steps = 22; for (let i = 0; i < steps; i++) { const f = i / steps, j = (r() - 0.5) * 3.2; const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny); pts.push([x0 + (x1 - x0) * f + nx / l * j, y0 + (y1 - y0) * f + ny / l * j]); } };
  side(inset, inset, n - inset, inset); side(n - inset, inset, n - inset, n - inset); side(n - inset, n - inset, inset, n - inset); side(inset, n - inset, inset, inset);
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  g.save(); g.shadowColor = 'rgba(40,25,10,0.45)'; g.shadowBlur = 5; g.shadowOffsetX = 2; g.shadowOffsetY = 3; g.fillStyle = fill; path(); g.fill(); g.restore();
  // fibres along the torn edge: a lighter rim
  g.save(); path(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; path(); g.stroke(); g.restore();
  // fill the middle solid so the slices meet the window background exactly
  g.fillStyle = fill; g.fillRect(s - 1, s - 1, n - 2 * s + 2, n - 2 * s + 2);
  g.fillRect(inset + 4, s - 1, n - 2 * inset - 8, n - 2 * s + 2); g.fillRect(s - 1, inset + 4, n - 2 * s + 2, n - 2 * inset - 8);
  return c.toDataURL('image/png');
}
export function woodURL() { return woodCanvas(256).toDataURL('image/jpeg', 0.85); }
