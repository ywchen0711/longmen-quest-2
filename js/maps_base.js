// What each map character is, and small helpers the chapter files share.
// solid = blocks walking; h = block height (world units); kind = how view.js draws it.
export const L = (zh, en) => ({ zh, en });

export const TILES = {
  '#': { solid: 1, h: 1, kind: 'wall' },
  '.': { kind: 'floor' },
  ',': { kind: 'grass' },
  ':': { kind: 'pave' },
  '"': { solid: 1, kind: 'tree' },
  '~': { solid: 1, kind: 'water' },
  'h': { solid: 1, h: 0.85, kind: 'house' },
  'o': { kind: 'wood' },
  '=': { solid: 1, h: 0.45, kind: 'counter', over: 1 },
  'd': { solid: 1, h: 0.85, kind: 'door' },
  'c': { solid: 1, kind: 'chest' },
  'b': { solid: 1, kind: 'bed' },
  't': { solid: 1, kind: 'table' },
  'k': { solid: 1, h: 0.85, kind: 'shelf' },
  'p': { solid: 1, kind: 'pot' },
  'l': { solid: 1, kind: 'lamp' },
  'w': { solid: 1, kind: 'well' },
  'f': { kind: 'flowers' },
  'r': { solid: 1, kind: 'rock' },
  'x': { solid: 1, kind: 'fence' },
  'i': { solid: 1, h: 1.2, kind: 'pillar' },
  'g': { solid: 1, h: 0.85, kind: 'gate' },
  'v': { solid: 1, kind: 'void' },
  'n': { kind: 'snow' },
  's': { kind: 'sand' },
  'u': { solid: 1, kind: 'statue' },
  'q': { solid: 1, kind: 'coffin' },
  'm': { kind: 'carpet' },
  'e': { kind: 'plank' },
  'z': { kind: 'floor' },
  '%': { solid: 1, kind: 'bush' },
  '&': { solid: 1, kind: 'brazier' },
  '^': { kind: 'ice' },
  // the sequel's tiles
  'j': { solid: 1, kind: 'bamboo' },
  'y': { solid: 1, kind: 'lotus' },
  'a': { solid: 1, kind: 'lava' },
  '$': { solid: 1, kind: 'yurt' },
  '!': { solid: 1, kind: 'banner' },
  '*': { solid: 1, kind: 'crystal' },
  '?': { solid: 1, kind: 'sign' },
  '@': { solid: 1, kind: 'cage' },
  '_': { solid: 1, kind: 'willow' },
  '+': { solid: 1, kind: 'bell' },
  ';': { kind: 'reed' },
  '<': { solid: 1, kind: 'spring' },
  '`': { kind: 'pen' },
};
for (let i = 1; i <= 9; i++) TILES[String(i)] = { kind: 'stairs' };

// a person: sprite, talk, options (walk: 1 wanders; flag / notFlag: shown only when a flag is set / unset)
export const P = (s, say, o = {}) => ({ s, say, ...o });
// say a list of [who, zh, en] lines
export async function lines(S, list) { for (const [w, z, e] of list) await S.say(w, L(z, e)); }
// a short chapter card over the map
export async function chapter(S, n, zh, en) {
  const G = S.G; if (G.fast) { G.flags['chap' + n] = 1; return; }
  G.flags['chap' + n] = 1;
  const box = document.getElementById('ending'); box.classList.remove('hidden'); box.innerHTML = '';
  const d = document.createElement('div'); d.className = 'chapcard'; d.innerHTML = `<div class="chapn">${['', '第一章', '第二章', '第三章', '第四章', '終章'][n] || ''}</div><div class="chapt">${zh}</div><div class="chape">${en}</div>`; box.appendChild(d);
  await new Promise((r) => setTimeout(r, 60)); d.classList.add('in');
  await new Promise((r) => setTimeout(r, 2600));
  box.classList.add('fadeout'); await new Promise((r) => setTimeout(r, 450)); box.classList.add('hidden'); box.classList.remove('fadeout'); box.innerHTML = '';
}
// a few free beasts follow you home to the camp (story rewards)
export async function freeBeasts(S, ids) {
  const G = S.G, R = await import('./rules.js?v=2'), { ENEMIES } = await import('./data.js?v=2');
  const names = [];
  for (const id of ids) { const m = R.newMember(id, ENEMIES[id].lv); G.camp.push(m); names.push(ENEMIES[id].zh); G.stats.recruited[id] = (G.stats.recruited[id] || 0) + 1; }
  await G.audio.jingle('j_join');
  await S.say(null, L(names.join('、') + '跟著你們回了百獸山寨，成了你們的夥伴！', 'The freed creatures follow you home to the Hundred Beasts Camp: new friends!'));
}

// ---------------------------------------------------------------- recurring characters, shared by every chapter
import { HU_LINES, HUO_LINES, JIA_LINES } from './story_lines.js?v=2';
const chap = (G) => (G.flags.ch3Done ? 4 : G.flags.shipGot ? 3 : G.flags.ch1Done ? 2 : 1);
// 胡半仙 the fortune-teller: every prophecy is the opposite of what happens
export async function huPredict(S) { const k = chap(S.G); await lines(S, HU_LINES[k]); }
// 霍天下 the braggart: claims whatever the party did last
export async function huoBrag(S) { const k = chap(S.G); await lines(S, HUO_LINES[k]); }
// 賈八方 the peddler: sells everything, his own clothes included
export async function jiaTalk(S) { const k = chap(S.G); await lines(S, JIA_LINES[k]); await S.jia(); }
