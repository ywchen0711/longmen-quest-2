// The example page: one Character (rig.js) on a dais, dressed from the 角色 tab, reshaped from 身形, armed from 武器,
// turned into a monster from 怪物. Everything goes through the same few calls a game would make.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { Library, Character, GRAD } from './rig.js?v=1';
import { WEAPONS, weaponDef, projectile } from './weapons.js?v=1';
import { MONSTERS, becomeMonster } from './monsters.js?v=1';

const $ = (id) => document.getElementById(id);
const canvas = $('view'), R = new THREE.WebGLRenderer({ canvas, antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.outputColorSpace = THREE.SRGBColorSpace; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const outline = new OutlineEffect(R, { defaultThickness: 0.003, defaultColor: [0.15, 0.08, 0.04] });
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2e1d10);
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100); camera.position.set(0, 1.4, 5.2);
scene.add(new THREE.HemisphereLight(0xfff0d8, 0x5a4028, 1.7));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.3); sun.position.set(2.5, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); sun.shadow.bias = -0.0004; scene.add(sun);
const toonC = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD });
{ const d = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.16, 48), toonC(0x8a6a48)); d.position.y = -0.08; d.receiveShadow = true; scene.add(d);
  const r = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 8, 64), toonC(0xc9a45a)); r.rotation.x = Math.PI / 2; scene.add(r);
  const f = new THREE.Mesh(new THREE.CircleGeometry(20, 48), toonC(0x4a3420)); f.rotation.x = -Math.PI / 2; f.position.y = -0.16; f.receiveShadow = true; scene.add(f); }
const controls = new OrbitControls(camera, canvas); controls.target.set(0, 1.0, 0); controls.enableDamping = true; controls.minDistance = 1.5; controls.maxDistance = 9; controls.maxPolarAngle = 1.55;
function resize() { const r = canvas.parentElement.getBoundingClientRect(); R.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const lib = new Library('models/');
let n = 0; await lib.load(() => { $('loading').textContent = `載入模型與動作庫… ${++n}/4`; });
$('loading').remove();

// ---------------------------------------------------------------- the character and its settings
const DYES = [['原色', null, [0, 0, 1]], ['朱紅', '#c0392b', [1, 0.0, 1]], ['橘黃', '#d68a2e', [1, 0.08, 1]], ['金', '#d4b03a', [1, 0.14, 1]], ['翠綠', '#3e9a4e', [1, 0.33, 1]], ['青', '#2e9a9a', [1, 0.5, 1]],
  ['靛藍', '#3450a8', [1, 0.63, 1]], ['紫', '#7a3aa0', [1, 0.78, 1]], ['桃紅', '#c84a8a', [1, 0.9, 1]], ['墨黑', '#2a2420', [2, 0, 1]], ['素白', '#ece4d4', [3, 0, 1]]];
const SKINS = [null, '#f6dcc4', '#e8bc98', '#c48a62', '#8a5a3c', '#f2ece8'];   // null: the texture's own
const HAIRS = [[null, '光頭'], ['Hair_SimpleParted', '旁分'], ['Hair_Buzzed', '平頭'], ['Hair_Long', '長髮'], ['Hair_Buns', '雙髻'], ['Hair_BuzzedFemale', '短髮'], ['Hair_Beard', '鬍子']];
// clothing: slot -> choices [name, file part] (Male_ / Female_ in front)
const OUTFIT = { head: [['無'], ['兜帽', 'Ranger_Head_Hood']], body: [['無'], ['布衣', 'Peasant_Body'], ['遊俠', 'Ranger_Body']], acc: [['無'], ['肩甲', 'Ranger_Acc_Pauldron']],
  arms: [['無'], ['布袖', 'Peasant_Arms'], ['護腕', 'Ranger_Arms']], legs: [['無'], ['布褲', 'Peasant_Legs'], ['皮褲', 'Ranger_Legs']], feet: [['無'], ['布鞋', 'Peasant_Feet'], ['長靴', 'Ranger_Feet_Boots']] };
const SLOT_NAME = { head: '頭巾', body: '上衣', acc: '肩飾', arms: '袖', legs: '褲', feet: '鞋' };
const fileOf = (slot, i) => { const c = OUTFIT[slot][i]; if (!c || !c[1]) return null; let f = (S.sex === 'female' ? 'Female_' : 'Male_') + c[1]; if (S.sex === 'female') f = f.replace('Ranger_Feet_Boots', 'Ranger_Feet').replace('Acc_Pauldron', 'Acc_Pauldrons'); return f; };
const S = { sex: 'male', hair: 1, hairDye: 9, skin: 1, outfit: { head: 0, body: 1, acc: 0, arms: 1, legs: 1, feet: 1 }, dye: { body: 6, legs: 9 }, weapon: 'jian', monster: null };
let ch = null, mon = null;

async function rebuild() {
  const shape = ch ? { ...ch.shape } : null;
  if (ch) scene.remove(ch.root);
  ch = new Character(lib, S.sex); scene.add(ch.root);
  if (shape) Object.assign(ch.shape, shape);
  await dress(); ch.setWeapon(weaponDef(S.weapon)); stance();
}
async function dress() {
  for (const slot of Object.keys(OUTFIT)) { const f = fileOf(slot, S.outfit[slot]); await ch.wear(slot, f ? [f] : []); }
  for (const [k, d] of Object.entries(ch.dyes)) d.value.set(...DYES[S.dye[k] || 0][2]);
  await ch.setHair(S.outfit.head ? null : HAIRS[S.hair][0]); ch.hairDye.value.set(...DYES[S.hairDye][2]);
  ch.setSkin(SKINS[S.skin]);
}
const W = () => (mon ? { ...weaponDef(mon.weapon), stance: mon.stance, attacks: [mon.attack], heavy: mon.attack } : weaponDef(S.weapon));
function stance() { ch.walking = false; ch.play(W().stance); }
let atk = 0;
async function attack(kind = 'attack') {
  const w = W(); const clip = kind === 'heavy' ? w.heavy : kind === 'block' ? w.block : w.attacks[atk++ % w.attacks.length];
  const p = ch.play(clip, { once: true });
  if (w.shoot && kind !== 'block') setTimeout(() => fire(w.shoot), 380);
  await p; stance();
}
// whatever it throws or shoots flies straight ahead from the hand
function fire(kind) {
  const o = projectile(kind), from = new THREE.Vector3(); ch.sockets.hand_r.getWorldPosition(from);
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(ch.root.quaternion); o.position.copy(from); scene.add(o);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); if (kind === 'wind') o.rotation.y += Math.PI / 2;
  const t0 = performance.now(); const step = () => { const k = (performance.now() - t0) / 600; o.position.copy(from).addScaledVector(dir, k * 7); if (kind === 'dart') o.rotateY(0.6); if (kind === 'wind') o.scale.setScalar(1 + k * 2); if (k < 1) requestAnimationFrame(step); else scene.remove(o); }; step();
}

// ---------------------------------------------------------------- the panels
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function chips(parent, list, on, pick) { const row = el('div', 'chips'); list.forEach((t, i) => { const b = el('button', 'chip' + (i === on ? ' on' : ''), t); b.onclick = () => pick(i); row.append(b); }); parent.append(row); }
function dyes(parent, on, pick) { const row = el('div', 'dyes'); DYES.forEach((d, i) => { const b = el('button', 'dye' + (d[1] ? '' : ' none') + (i === on ? ' on' : '')); b.title = d[0]; if (d[1]) b.style.background = d[1]; b.onclick = () => pick(i); row.append(b); }); parent.append(row); }
function lookPane() {
  const P = $('pane-look'); P.innerHTML = '';
  P.append(el('h3', null, '性別')); chips(P, ['男', '女'], S.sex === 'female' ? 1 : 0, async (i) => { S.sex = i ? 'female' : 'male'; mon = null; await rebuild(); lookPane(); });
  P.append(el('h3', null, '膚色')); { const row = el('div', 'dyes'); SKINS.forEach((s, i) => { const b = el('button', 'dye' + (s ? '' : ' none') + (i === S.skin ? ' on' : '')); if (s) b.style.background = s; b.onclick = () => { S.skin = i; dress(); lookPane(); }; row.append(b); }); P.append(row); }
  P.append(el('h3', null, '髮型')); chips(P, HAIRS.map((h) => h[1]), S.hair, (i) => { S.hair = i; dress(); lookPane(); });
  dyes(P, S.hairDye, (i) => { S.hairDye = i; ch.hairDye.value.set(...DYES[i][2]); lookPane(); });
  for (const slot of Object.keys(OUTFIT)) {
    P.append(el('h3', null, SLOT_NAME[slot])); chips(P, OUTFIT[slot].map((c) => c[0]), S.outfit[slot], (i) => { S.outfit[slot] = i; dress(); lookPane(); });
    if (slot !== 'head') dyes(P, S.dye[slot] || 0, (i) => { S.dye[slot] = i; ch.dyes[slot].value.set(...DYES[i][2]); lookPane(); });
  }
  P.append(el('p', 'note', '衣服、頭髮都是零件，套在同一副骨架上；被衣服蓋住的身體自動隱藏，不會穿模。新增衣服只要放進一個模型檔、寫一行清單。'));
}
const SHAPES = [['height', '身高', 0.65, 1.45], ['head', '頭的大小', 0.8, 1.8], ['faceW', '臉寬', 0.8, 1.3], ['faceL', '臉長', 0.8, 1.3], ['shoulders', '肩寬', 0.7, 1.5], ['arms', '手臂長', 0.75, 1.4], ['legs', '腿長', 0.65, 1.35], ['build', '體格', 0.75, 1.7], ['hunch', '駝背', 0, 1]];
const PRESETS = [['標準', {}], ['Q 版', { head: 1.65, legs: 0.72, arms: 0.82, height: 0.82, faceW: 1.1 }], ['少年', { head: 1.18, height: 0.86, build: 0.88, shoulders: 0.9 }], ['壯漢', { build: 1.45, shoulders: 1.3, height: 1.1, faceW: 1.1 }],
  ['高瘦', { height: 1.15, build: 0.82, legs: 1.15, arms: 1.08, faceL: 1.1 }], ['矮胖', { height: 0.8, build: 1.5, legs: 0.82, faceW: 1.2 }]];
function shapePane() {
  const P = $('pane-shape'); P.innerHTML = '';
  P.append(el('h3', null, '預設體型')); chips(P, PRESETS.map((p) => p[0]), -1, (i) => { Object.assign(ch.shape, { height: 1, head: 1, faceW: 1, faceL: 1, shoulders: 1, arms: 1, legs: 1, build: 1, hunch: 0 }, PRESETS[i][1]); shapePane(); });
  P.append(el('h3', null, '細調'));
  for (const [k, name, lo, hi] of SHAPES) {
    const row = el('label', 'slider'); const v = el('span', null, ch.shape[k].toFixed(2)); const inp = el('input'); Object.assign(inp, { type: 'range', min: lo, max: hi, step: 0.01, value: ch.shape[k] });
    inp.oninput = () => { ch.shape[k] = +inp.value; v.textContent = (+inp.value).toFixed(2); }; row.append(el('span', null, name), inp, v); row.firstChild.style.textAlign = 'left'; P.append(row);
  }
  P.append(el('p', 'note', '同一副骨架改骨頭的長短粗細：動作照樣能用，衣服、武器跟著身體走。頭身比調大就是 Q 版，再加上駝背、長手就能做成怪物。'));
}
function armsPane() {
  const P = $('pane-arms'); P.innerHTML = '';
  P.append(el('h3', null, '兵器')); const ids = Object.keys(WEAPONS);
  chips(P, ids.map((k) => WEAPONS[k].name), ids.indexOf(S.weapon), (i) => { S.weapon = ids[i]; if (!mon) { ch.setWeapon(weaponDef(S.weapon)); stance(); } armsPane(); });
  P.append(el('h3', null, '試招')); chips(P, ['攻擊', '重擊', '防禦／閃避'], -1, (i) => attack(['attack', 'heavy', 'block'][i]));
  P.append(el('p', 'note', '每把兵器只是資料：模型、拿在哪隻手（或背上、腰間）、架勢、招式、會射出什麼。握把的位置和方向由手指的骨頭自動算出，換任何身體、任何新兵器都對得上。弓會背箭筒、暗器有腰包，射出的箭、飛鏢、扇風會往前飛。'));
}
function monPane() {
  const P = $('pane-mon'); P.innerHTML = '';
  P.append(el('h3', null, '用同一副骨架做怪物'));
  const ids = Object.keys(MONSTERS);
  chips(P, ids.map((k) => MONSTERS[k].name), mon ? ids.indexOf(mon.id) : -1, async (i) => {
    const id = ids[i], M = MONSTERS[id]; if (ch.sex !== M.sex) { S.sex = M.sex; await rebuild(); }
    mon = { ...(await becomeMonster(ch, id, weaponDef)), id }; stance(); monPane(); shapePane();
  });
  const back = el('button', 'chip', '變回人'); back.onclick = async () => { mon = null; ch.onPose = null; ch.clearProps(); ch.model.position.y = 0; Object.assign(ch.shape, { height: 1, head: 1, faceW: 1, faceL: 1, shoulders: 1, arms: 1, legs: 1, build: 1, hunch: 0 }); await dress(); ch.setWeapon(weaponDef(S.weapon)); stance(); monPane(); shapePane(); };
  const row = el('div', 'chips'); row.append(back); P.append(row);
  P.append(el('p', 'note', '殭屍：清朝官帽、額頭貼符，雙手平舉、用跳的。牛魔王：牛角、鼻環、壯大的身形，拿長槍。九尾狐：狐耳、九條會擺動的尾巴，拿扇子。山魈：矮小、大頭、長手、駝背、大耳朵、小尾巴。每隻怪物都是一段設定：膚色、身形、衣服、掛在骨頭上的零件、架勢和招式。'));
}
document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + b.dataset.t));
}));
{ // the action bar
  const B = $('bar'); for (const [t, f, big] of [['架勢', () => stance()], ['走路', () => { const m = mon; ch.walking = true; ch.play(m ? m.walk : 'Walk_Loop'); }], ['跑步', () => { ch.walking = true; ch.play('Jog_Fwd_Loop'); }],
    ['攻擊', () => attack('attack'), 1], ['重擊', () => attack('heavy')], ['防禦', () => attack('block')], ['受傷', async () => { await ch.play('Hit_Chest', { once: true }); stance(); }], ['倒下', async () => { await ch.play('Death01', { once: true }); }], ['跳舞', () => ch.play('Dance_Loop')]]) {
    const b = el('button', big ? 'big' : '', t); b.onclick = f; B.append(b);
  }
}

await rebuild(); lookPane(); shapePane(); armsPane(); monPane();
const clock = new THREE.Clock(); let T = 0;
function frame() { const dt = Math.min(0.05, clock.getDelta()); T += dt; ch.update(dt, T); controls.update(); outline.render(scene, camera); requestAnimationFrame(frame); }
frame();
window.__rig = { get ch() { return ch; }, camera, controls, S, rebuild, attack, becomeMonster: async (id) => { const M = MONSTERS[id]; if (ch.sex !== M.sex) { S.sex = M.sex; await rebuild(); } mon = { ...(await becomeMonster(ch, id, weaponDef)), id }; stance(); }, setWeapon: (id) => { S.weapon = id; ch.setWeapon(weaponDef(id)); stance(); } };
