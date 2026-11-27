// Boot: build the view, the title screen, the opening, and run the fixed-timestep loop.
import { View, pickQuality, loadImage, registerSheet } from './view.js?v=8';
import { Input } from './input.js?v=8';
import { UI, t, STR, getLang, setLang } from './ui.js?v=8';
import { Audio } from './audio.js?v=8';
import { Game, mapName, preloadAiCards } from './game.js?v=8';
import { preloadDoll } from './doll_ai.js?v=8';
import { CAST, PEOPLE_IMAGE } from './people_art.js?v=8';
import { preloadBattleArt, ENEMY_IMG } from './battle.js?v=8';
import { paperTileURL, deckleURL, woodURL } from './paper.js?v=8';
import { fretFrameURL, sealURL, brushURL } from './ink.js?v=8';
import { opening as storyOpening } from './story.js?v=8';

const params = new URLSearchParams(location.search);
const NORENDER = params.has('norender');
setLang(getLang());
{ const st = document.documentElement.style; st.setProperty('--grain', `url(${paperTileURL()})`); st.setProperty('--deckle', `url(${deckleURL()})`); st.setProperty('--wood', `url(${woodURL()})`);
  // the Chinese dressing: a vermilion 回紋 frame for the windows, the game's seal, a dry-brush underline
  st.setProperty('--deckle', `url(${fretFrameURL()})`); st.setProperty('--seal', `url(${sealURL('萬妖', 20)})`); st.setProperty('--brush', `url(${brushURL()})`); }

const input = new Input(), audio = new Audio();
const ui = new UI(document.getElementById('ui'), input, audio);
let view = null;
if (!NORENDER) { try { view = new View(document.getElementById('view'), pickQuality()); } catch (e) { console.warn('no WebGL', e); } }
const G = new Game({ view, ui, input, audio });
try { G.quick = localStorage.getItem('lq2_quick') === '1'; } catch (e) {}
window.LQ = { G, ui, input, audio, view };

const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window || params.has('touch');
document.body.classList.toggle('touch', touch);
if (touch) input.bindTouch(document);

// layout: on touch screens the pad sits beside the picture in landscape and under it in portrait
function layout() {
  const W = document.body.clientWidth, H = document.body.clientHeight, st = document.documentElement.style, b = document.body.classList;
  let sw = W, sh = H;
  b.remove('land', 'port');
  if (touch) {
    if (W >= H) { const side = Math.round(Math.min(Math.max(H * 0.42, 120), W * 0.22)); st.setProperty('--side', side + 'px'); st.setProperty('--pad', Math.round(side * 0.88) + 'px'); sw = W - 2 * side; b.add('land'); }
    else { sh = Math.round(Math.min(H * 0.62, W * 1.15)); st.setProperty('--sh', sh + 'px'); st.setProperty('--pad', Math.round(Math.min(W * 0.42, (H - sh) * 0.8)) + 'px'); b.add('port'); }
  }
  const fs = Math.max(11, Math.min(28, Math.round(Math.min(sw / 32, sh / 19))));
  st.setProperty('--fs', fs + 'px'); st.setProperty('--bd', Math.max(2, Math.round(fs / 7)) + 'px');
  st.setProperty('--pz', String(Math.max(1, Math.round(fs * 4.4 / 56 * 2) / 2)));
  // the battle stage (240x135): as big as fits above the party strip and the log
  const bz = Math.max(0.75, Math.floor(Math.min(sw * 0.94 / 240, (sh - fs * 12.6) / 135) * 4) / 4);
  st.setProperty('--bz', String(bz));
  b.toggle('narrow', sw < 760);
  if (view) view.resize();
}
window.addEventListener('resize', layout); window.addEventListener('orientationchange', () => setTimeout(layout, 200));
layout();

input.push((k) => {
  if (G.mode !== 'field') return;
  if (k === 'A') G.interact(); else if (k === 'B') G.menu();
});

async function loadArt() {
  const jobs = [loadImage(PEOPLE_IMAGE).then((i) => registerSheet('npcs', i)), loadImage(ENEMY_IMG).then((i) => registerSheet('enemies', i))];
  for (const [id, c] of Object.entries(CAST)) jobs.push(loadImage(c.sheet).then((i) => registerSheet('cast_' + id, i)));
  jobs.push(preloadAiCards(), preloadDoll().then(() => { G.dollSig = null; G.dressUp(); }));
  await Promise.all(jobs); preloadBattleArt();
}

// ---------------------------------------------------------------- the loop (fixed 60 Hz logic, render once per frame)
let acc = 0, last = performance.now(), fps = 60, slow = 0, lastMode = null, still = 0, lastTalk = false;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
  input.pollPad(dt);
  const step = 1 / 60; let n = 0;
  while (acc >= step && n < 6) { G.update(step); acc -= step; n++; }
  if (acc > step) acc = 0;
  if (G.mode !== lastMode) { lastMode = G.mode; still = 0; }
  const rest = view && !view.dirty;
  if (rest && G.mode === 'menu' && still++ >= 2) { requestAnimationFrame(loop); return; }
  const talk = ui.talking && !G.moving && view && view.settled && !G.npcs.some((q) => q.mv) && !(ui.msgBox && ui.msgBox.classList.contains('hidden'));
  if (talk !== lastTalk) { lastTalk = talk; still = 0; }
  if (rest && talk && G.mode === 'field' && still++ >= 2) { requestAnimationFrame(loop); return; }
  if (rest && G.mode === 'field' && !G.moving && view.settled && (still++ & 1)) { requestAnimationFrame(loop); return; }
  if (view && (G.mode === 'field' || G.mode === 'menu')) {
    view.render(); view.dirty = false;
    fps = fps * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;
    if (G.mode === 'field' && fps < 48 && performance.now() > 6000) {
      if (++slow > 120) {
        slow = 0; fps = 60;
        if (!view.prCap) { view.prCap = 1; view.resize(); }
        else if (view.dropMSAA()) { /* stepped down */ }
        else if (view.post) { view.post = false; view.composer = null; }
        else if (!view.cheap) view.setCheap();
      }
    } else slow = 0;
  }
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- title
async function title() {
  G.mode = 'title';
  const tl = document.getElementById('title'); tl.classList.remove('hidden', 'open', 'gone');
  audio.play('title');
  for (;;) {
    const auto = Game.slotInfo('auto'); const any = [0, 1, 2].some((i) => Game.slotInfo(i));
    const items = [{ label: STR.newgame }];
    if (auto) items.push({ label: STR.cont, sub: t(STR.lv) + auto.lv + ' ' + mapName(auto.map) });
    if (any) items.push({ label: STR.load });
    items.push({ label: getLang() === 'zh' ? 'English' : '中文' });
    const i = await ui.choose(items, { cls: 'titlemenu', cancel: false, ctx: 'title' });
    const pick = items[i].label;
    if (pick === STR.newgame) { G.newGame(); await openCover(true); await opening(); return; }
    if (pick === STR.cont) { G.load(auto.raw); await resume(); return openCover(); }
    if (pick === STR.load) {
      const slots = [0, 1, 2].map((k) => { const s = Game.slotInfo(k); return { label: t(STR.slot) + ' ' + (k + 1), sub: s ? t(STR.lv) + s.lv + ' ' + mapName(s.map) : t(STR.empty), disabled: !s }; });
      const j = await ui.choose(slots, { title: STR.load, ctx: 'loadslot' });
      if (j >= 0) { G.load(Game.slotInfo(j).raw); await resume(); return openCover(); }
      continue;
    }
    setLang(getLang() === 'zh' ? 'en' : 'zh'); drawTitle();
  }
}
async function openCover(toPage) {
  const tl = document.getElementById('title'); if (tl.classList.contains('hidden')) return;
  if (toPage) { const box = document.getElementById('ending'); box.classList.remove('hidden'); box.innerHTML = ''; }
  tl.classList.add('open'); if (!G.fast) await new Promise((r) => setTimeout(r, 900));
  tl.classList.add('gone'); if (!G.fast) await new Promise((r) => setTimeout(r, 380));
  tl.classList.add('hidden'); tl.classList.remove('open', 'gone');
}
function drawTitle() {
  document.getElementById('title').classList.toggle('en', getLang() !== 'zh');
  document.getElementById('tname').textContent = t(['龍門刀客傳', 'Longmen Quest']);
  document.getElementById('tnum').textContent = t(['貳', 'II']);
  document.getElementById('tsub').textContent = t(['萬妖鈴', 'The Bell of Ten Thousand Beasts']);
  document.getElementById('tpress').textContent = '© 2026  ' + t(['原創 8-bit 武俠立體書 RPG・妖物同行', 'An original 8-bit wuxia pop-up book RPG with creature friends']);
  const em = document.getElementById('temb'); if (em && CAST.yirui) em.src = CAST.yirui.portrait;
}
async function resume() {
  if (G.map === 'world') await G.enterWorld(G.x, G.y); else await G.enterMap(G.map, G.x, G.y, G.dir);
  G.mode = 'field';
}
async function opening() {
  const box = document.getElementById('ending'); box.classList.remove('hidden'); box.innerHTML = '';
  const lines = [
    ['屠千秋倒下之後，江湖太平了半年。', 'For half a year after Tu Qianqiu fell, the jianghu was at peace.'],
    ['然後，鈴聲響了。', 'Then the bells began to ring.'],
    ['每響一次，四方的妖物就瘋一次：狼嚎如哭，虎下山林，江裡的蛟翻起了船。', 'With every peal the creatures of the land went mad: wolves howled like weeping, tigers came down from the hills, river dragons overturned boats.'],
    ['龍門鎮的奕家兄弟，又要出門了。', 'And the Yi brothers of Longmen set out once more.'],
  ];
  const skip = { v: false }; const off = input.push((k) => { if (k === 'A' || k === 'B') skip.v = true; });
  const wait = async (ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms && !skip.v && !G.fast) await new Promise((r) => setTimeout(r, 50)); };
  audio.play('title');
  for (const l of lines) { if (skip.v) break; const p = document.createElement('p'); p.textContent = t(l); box.appendChild(p); await wait(30); p.classList.add('in'); await wait(2800); }
  await wait(600); off();
  await G.enterMap('longmen', 15, 7, 'down'); G.mode = 'field';
  box.classList.add('fadeout'); if (!G.fast) await new Promise((r) => setTimeout(r, 450));
  box.classList.add('hidden'); box.classList.remove('fadeout'); box.innerHTML = '';
  await G.run(() => storyOpening(G));
}
G.onEnd = () => title();

window.addEventListener('pagehide', () => G.autosave());
document.addEventListener('visibilitychange', () => { if (document.hidden) G.autosave(); });
setInterval(() => G.autosave(), 30000);

(async () => {
  drawTitle();
  await loadArt();
  document.getElementById('loading').classList.add('hidden');
  requestAnimationFrame(loop);
  if (params.has('bot')) return;
  title();
})();
export { G, title, resume };
