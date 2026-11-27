// The painted paper doll: 奕叡 as AI paintings (tools/ai_doll.py) - a plain base per view (front, side, back and a
// bust) and one painted layer per kind of gear, each painted in greys and whites so it takes the item's colours here.
// The layers stack in the order the old pixel doll drew them; a slot with nothing in it adds nothing.
import { NES } from './tiles.js?v=8';
import { DOLL } from './doll_ai_data.js?v=8';

const VIEWS = ['front', 'side', 'back', 'bust'];
const ORDER = ['a', 'bt', 'c', 'pd', 'ck', 'w', 'hd'];
const PAPER = '#f3e8cf';
const imgs = {};
let ready = false;
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export function preloadDoll() {
  const jobs = [];
  for (const v of VIEWS) if (DOLL.views[v]) jobs.push(load(`assets/ai/doll/${v}_base.webp?v=3`).then((i) => { imgs[v + '_base'] = i; }));
  for (const [n, vs] of Object.entries(DOLL.layers)) for (const v of vs) jobs.push(load(`assets/ai/doll/${n}_${v}.webp?v=3`).then((i) => { imgs[n + '_' + v] = i; }));
  return Promise.all(jobs).then(() => { ready = VIEWS.every((v) => !DOLL.views[v] || imgs[v + '_base']); });
}
export const dollReady = () => ready;

const dark = (c) => (c >= 0x10 ? c - 0x10 : 0x0F);
const light = (c) => (c < 0x30 ? c + 0x10 : 0x30);
// an NES colour, softened a fifth of the way to grey so it sits in a painting
const rgb = (i) => { const n = NES[i] ?? 0x808080, c = [n >> 16 & 255, n >> 8 & 255, n & 255], m = (c[0] + c[1] + c[2]) / 3; return c.map((v) => v * 0.8 + m * 0.2); };
// which layer an item's look puts on, and its colours (dark, middle, light)
function layerOf(slot, lk) {
  const a = lk.a ?? 0x10, pal = [dark(a), a, lk.b ?? light(a)];
  if (slot === 'w') return ['w_' + lk.f, lk.a == null ? [0x00, 0x10, 0x30] : pal];
  if (slot === 'hd') return [lk.veil ? 'hd_veil' : 'hd_' + lk.f, pal];
  if (slot === 'a') return ['a_' + (lk.p || 'trim'), pal];
  if (slot === 'ck') return ['ck', pal];
  if (slot === 'c') return ['c_' + (lk.f || 'bracer'), pal];
  if (slot === 'pd') return ['pd_' + (lk.f || 'jade'), pal];
  if (slot === 'bt') return ['bt_' + (lk.f || 'boots'), pal];
  return [null, pal];
}
// the layer in the item's colours: greys and whites follow a dark-middle-light ramp; skin and anything with colour
// of its own (a red tassel, a hand) stays as painted
const tintCache = new Map();
function tinted(name, view, pal) {
  const key = `${name}|${view}|${pal}`; if (tintCache.has(key)) return tintCache.get(key);
  const src = imgs[name + '_' + view]; if (!src) return null;
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, P = pal.map(rgb);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
    const L = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
    // outlines and hair (dark) and skin keep their paint
    if (L < 0.34 || (r > gg && gg > b && r - b > 25 && L > 0.45)) continue;
    const k = Math.max(0, Math.min(1, (0.3 - sat) / 0.18)) * Math.min(1, (L - 0.34) / 0.12); if (!k) continue;
    const [p, q, t] = L < 0.5 ? [P[0], P[1], L / 0.5] : [P[1], P[2], (L - 0.5) / 0.5];
    for (let j = 0; j < 3; j++) d[i + j] = d[i + j] * (1 - k) + (p[j] + (q[j] - p[j]) * t) * k;
  }
  g.putImageData(id, 0, 0);
  if (tintCache.size > 120) tintCache.clear();
  tintCache.set(key, c); return c;
}
// one view with what he wears; looks = { w, hd, a, ck, c, pd, bt } (item looks or null)
export function dollView(view, looks) {
  const [W, H] = DOLL.views[view], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  if (view === 'bust') { g.fillStyle = PAPER; g.fillRect(0, 0, W, H); }
  g.drawImage(imgs[view + '_base'], 0, 0);
  const worn = { ...looks };
  // no headgear, or a crown over his topknot: he keeps his blue headband
  if (!worn.hd || worn.hd.f === 'crown') g.drawImage(tinted('hd_band', view, [0x11, 0x21, 0x31]) || c, 0, 0);
  for (const slot of ORDER) {
    const lk = worn[slot]; if (!lk || (view === 'bust' && slot !== 'hd')) continue;   // the bust shows his headgear
    const [name, pal] = layerOf(slot, lk); if (!name || !DOLL.layers[name] || !DOLL.layers[name].includes(view)) continue;
    const t = tinted(name, view, pal); if (t) g.drawImage(t, 0, 0);
  }
  return c;
}
// the three map views in one strip of equal cells (feet on the bottom edge), for the map card and the battle card
export function dollStrip(looks) {
  const cw = Math.max(...['front', 'side', 'back'].map((v) => DOLL.views[v][0])), ch = Math.max(...['front', 'side', 'back'].map((v) => DOLL.views[v][1]));
  const s = document.createElement('canvas'); s.width = cw * 3; s.height = ch; const g = s.getContext('2d');
  ['front', 'side', 'back'].forEach((v, i) => { const c = dollView(v, looks); g.drawImage(c, i * cw + Math.floor((cw - c.width) / 2), ch - c.height); });
  s.cw = cw; s.ch = ch;
  return s;
}
