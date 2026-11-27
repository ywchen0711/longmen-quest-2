// The painted paper dolls (tools/ai_doll.py): 奕叡 and the party members who wear gear, each a plain base per view
// (front, side, back; 奕叡 also a bust) and one painted layer per kind of gear, painted in greys and whites so it takes
// the item's colours here. The layers stack in the order the old pixel doll drew them; an empty slot adds nothing.
import { NES } from './tiles.js?v=8';
import { DOLLS } from './doll_ai_data.js?v=8';

const VIEWS = ['front', 'side', 'back', 'bust'];
const ORDER = ['a', 'bt', 'c', 'pd', 'ck', 'w', 'hd'];
const PAPER = '#f3e8cf';
const imgs = {}, ready = {};
const dir = (who) => (who === 'yirui' ? 'assets/ai/doll/' : `assets/ai/doll/${who}/`);
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export function preloadDoll() {
  const all = [];
  for (const [who, D] of Object.entries(DOLLS)) {
    const jobs = [], im = (imgs[who] = {});
    for (const v of VIEWS) if (D.views[v]) jobs.push(load(`${dir(who)}${v}_base.webp?v=3`).then((i) => { im[v + '_base'] = i; }));
    for (const [n, vs] of Object.entries(D.layers)) for (const v of vs) jobs.push(load(`${dir(who)}${n}_${v}.webp?v=3`).then((i) => { im[n + '_' + v] = i; }));
    all.push(Promise.all(jobs).then(() => { ready[who] = VIEWS.every((v) => !D.views[v] || im[v + '_base']); }));
  }
  return Promise.all(all);
}
export const dollReady = (who = 'yirui') => !!ready[who];

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
function tinted(who, name, view, pal) {
  const key = `${who}|${name}|${view}|${pal}`; if (tintCache.has(key)) return tintCache.get(key);
  const src = imgs[who] && imgs[who][name + '_' + view]; if (!src) return null;
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
// one view with what they wear; looks = { w, hd, a, ck, c, pd, bt } (item looks or null)
export function dollView(view, looks, who = 'yirui') {
  const D = DOLLS[who], [W, H] = D.views[view], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  if (view === 'bust') { g.fillStyle = PAPER; g.fillRect(0, 0, W, H); }
  g.drawImage(imgs[who][view + '_base'], 0, 0);
  const worn = { ...looks };
  // 奕叡 with no headgear, or a crown over his topknot, keeps his blue headband
  if (who === 'yirui' && (!worn.hd || worn.hd.f === 'crown')) g.drawImage(tinted(who, 'hd_band', view, [0x11, 0x21, 0x31]) || c, 0, 0);
  for (const slot of ORDER) {
    const lk = worn[slot]; if (!lk || (view === 'bust' && slot !== 'hd')) continue;   // the bust shows his headgear
    const [name, pal] = layerOf(slot, lk); if (!name || !D.layers[name] || !D.layers[name].includes(view)) continue;
    const t = tinted(who, name, view, pal); if (t) g.drawImage(t, 0, 0);
  }
  return c;
}
// the three map views in one strip of equal cells (feet on the bottom edge), for the map card and the battle card
export function dollStrip(looks, who = 'yirui') {
  const D = DOLLS[who], cw = Math.max(...['front', 'side', 'back'].map((v) => D.views[v][0])), ch = Math.max(...['front', 'side', 'back'].map((v) => D.views[v][1]));
  const s = document.createElement('canvas'); s.width = cw * 3; s.height = ch; const g = s.getContext('2d');
  ['front', 'side', 'back'].forEach((v, i) => { const c = dollView(v, looks, who); g.drawImage(c, i * cw + Math.floor((cw - c.width) / 2), ch - c.height); });
  s.cw = cw; s.ch = ch;
  return s;
}
