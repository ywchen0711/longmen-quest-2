// A 3D paper doll: one skeleton, and parts taken from four different characters - head, hat, body, arms, legs, cape,
// a weapon in each hand - mixed freely, each part dyed on its own. The same dressed figure walks a little map and
// fights a skeleton. Models: KayKit Adventurers and Skeletons by Kay Lousberg (CC0); they share one rig, so any part
// fits any body, and 76 animations come with it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const $ = (id) => document.getElementById(id);
const FILES = { knight: 'Knight', barb: 'Barbarian', mage: 'Mage', rogue: 'Rogue', hood: 'Rogue_Hooded', skel: 'Skeleton_Minion' };

// ---------------------------------------------------------------- the wardrobe: slot -> choices [source, node(s), name, kind]
const SLOTS = {
  head: { name: '頭', dye: false, list: [['knight', ['Knight_Head'], '騎士'], ['barb', ['Barbarian_Head'], '蠻族'], ['mage', ['Mage_Head'], '法師'], ['rogue', ['Rogue_Head'], '盜賊'], ['hood', ['Rogue_Head_Hooded'], '兜帽']] },
  hat: { name: '頭飾', dye: true, list: [null, ['knight', ['Knight_Helmet'], '頭盔'], ['barb', ['Barbarian_Hat'], '毛帽'], ['mage', ['Mage_Hat'], '尖帽']] },
  body: { name: '上衣', dye: true, list: [['knight', ['Knight_Body'], '鎧甲'], ['barb', ['Barbarian_Body'], '皮甲'], ['mage', ['Mage_Body'], '法袍'], ['rogue', ['Rogue_Body'], '短衣']] },
  arms: { name: '袖子', dye: true, list: [['knight', ['Knight_ArmLeft', 'Knight_ArmRight'], '鐵臂甲'], ['barb', ['Barbarian_ArmLeft', 'Barbarian_ArmRight'], '赤臂'], ['mage', ['Mage_ArmLeft', 'Mage_ArmRight'], '寬袖'], ['rogue', ['Rogue_ArmLeft', 'Rogue_ArmRight'], '綁袖']] },
  legs: { name: '褲子', dye: true, list: [['knight', ['Knight_LegLeft', 'Knight_LegRight'], '鐵靴'], ['barb', ['Barbarian_LegLeft', 'Barbarian_LegRight'], '皮靴'], ['mage', ['Mage_LegLeft', 'Mage_LegRight'], '布鞋'], ['rogue', ['Rogue_LegLeft', 'Rogue_LegRight'], '短靴']] },
  cape: { name: '披風', dye: true, list: [null, ['knight', ['Knight_Cape'], '騎士披風'], ['barb', ['Barbarian_Cape'], '毛皮'], ['mage', ['Mage_Cape'], '法師斗篷'], ['rogue', ['Rogue_Cape'], '盜賊披肩']] },
  main: { name: '主手', dye: false, list: [null, ['knight', ['1H_Sword'], '單手劍', '1h'], ['knight', ['2H_Sword'], '雙手劍', '2h'], ['barb', ['1H_Axe'], '手斧', '1h'], ['barb', ['2H_Axe'], '巨斧', '2h'],
    ['rogue', ['Knife'], '短刀', '1h'], ['mage', ['1H_Wand'], '魔杖', 'wand'], ['mage', ['2H_Staff'], '法杖', 'staff'], ['rogue', ['1H_Crossbow'], '手弩', 'bow1'], ['rogue', ['2H_Crossbow'], '十字弓', 'bow2'], ['barb', ['Mug'], '酒杯', 'mug']] },
  off: { name: '副手', dye: false, list: [null, ['knight', ['Round_Shield'], '圓盾'], ['knight', ['Badge_Shield'], '徽盾'], ['knight', ['Rectangle_Shield'], '方盾'], ['knight', ['Spike_Shield'], '刺盾'],
    ['barb', ['Barbarian_Round_Shield'], '木盾'], ['mage', ['Spellbook'], '法書'], ['knight', ['1H_Sword_Offhand'], '副劍'], ['barb', ['1H_Axe_Offhand'], '副斧'], ['rogue', ['Knife_Offhand'], '副刀']] },
};
const TWO_HANDED = new Set(['2h', 'staff', 'bow2']);
// dyes: [name, css colour, mode (1 set hue, 2 black, 3 white), hue]
const DYES = [['原色', null, 0, 0], ['朱紅', '#c0392b', 1, 0.0], ['橘黃', '#d68a2e', 1, 0.08], ['金', '#d4b03a', 1, 0.14], ['翠綠', '#3e9a4e', 1, 0.33], ['青', '#2e9a9a', 1, 0.5],
  ['靛藍', '#3450a8', 1, 0.63], ['紫', '#7a3aa0', 1, 0.78], ['桃紅', '#c84a8a', 1, 0.9], ['墨黑', '#2a2420', 2, 0], ['素白', '#ece4d4', 3, 0]];
const SAVE = 'doll3d';
let outfit = { head: 0, hat: 1, body: 0, arms: 0, legs: 0, cape: 1, main: 1, off: 1, dye: {} };
try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s) outfit = { ...outfit, ...s, dye: s.dye || {} }; } catch (e) {}
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(outfit)); } catch (e) {} };

// ---------------------------------------------------------------- renderer, light, toon look
const canvas = $('view'), R = new THREE.WebGLRenderer({ canvas, antialias: true });
R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.outputColorSpace = THREE.SRGBColorSpace; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const outline = new OutlineEffect(R, { defaultThickness: 0.0035, defaultColor: [0.16, 0.09, 0.05] });
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2e1d10); scene.fog = new THREE.Fog(0x2e1d10, 18, 46);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xfff0d8, 0x5a4028, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.2); sun.position.set(4, 9, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); sun.shadow.bias = -0.0005; scene.add(sun); scene.add(sun.target);
const GRAD = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.minDistance = 3; controls.maxDistance = 12; controls.maxPolarAngle = 1.5;
function resize() { const r = canvas.parentElement.getBoundingClientRect(); R.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

// a dye per slot: the part's coloured cloth takes a new hue (skin and grey metal keep theirs)
const dyeU = {}; for (const k in SLOTS) dyeU[k] = { value: new THREE.Vector2(0, 0) };
const HSV = `vec3 rgb2hsv(vec3 c){ vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)); vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y); float e = 1.0e-10; return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x); }
  vec3 hsv2rgb(vec3 c){ vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }`;
function toon(src, slot) {
  const m = new THREE.MeshToonMaterial({ map: src.map || null, color: src.color ? src.color.clone() : 0xffffff, gradientMap: GRAD });
  if (slot && SLOTS[slot] && SLOTS[slot].dye) m.onBeforeCompile = (sh) => {
    sh.uniforms.uDye = dyeU[slot];
    sh.fragmentShader = 'uniform vec2 uDye;\n' + HSV + '\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (uDye.x > 0.5) { vec3 h = rgb2hsv(diffuseColor.rgb); bool skin = h.x > 0.02 && h.x < 0.11 && h.y < 0.62 && h.z > 0.45;
        if (h.y > 0.2 && !skin) {
          if (uDye.x < 1.5) { h.x = uDye.y; h.y = max(h.y, 0.45); }
          else if (uDye.x < 2.5) { h.y *= 0.15; h.z *= 0.32; }
          else { h.y *= 0.08; h.z = 0.55 + h.z * 0.45; }
          diffuseColor.rgb = hsv2rgb(h); } }`);
  };
  m.customProgramCacheKey = () => 'toon-' + (slot && SLOTS[slot] && SLOTS[slot].dye ? slot : '');
  return m;
}

// ---------------------------------------------------------------- loading
const loader = new GLTFLoader(), G = {};
await Promise.all(Object.entries(FILES).map(async ([k, f]) => { G[k] = await loader.loadAsync(`models/${f}.glb`); G[k].scene.updateMatrixWorld(true); }));   // (the local matrices are read when parts are copied)
$('loading').remove();
const findNode = (src, name) => { let f = null; G[src].scene.traverse((o) => { if (!f && o.name === name) f = o; }); return f; };
const clip = (clips, name) => THREE.AnimationClip.findByName(clips, name);

// an animated figure: a mixer and a play() that cross-fades, optionally once (resolving when it ends)
class Rig {
  constructor(root, clips) { this.root = root; this.clips = clips; this.mixer = new THREE.AnimationMixer(root); this.cur = null; }
  play(name, { once = false, fade = 0.18, speed = 1 } = {}) {
    const c = clip(this.clips, name) || clip(this.clips, 'Idle'); const a = this.mixer.clipAction(c);
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.timeScale = speed; a.fadeIn(fade).play();
    if (this.cur && this.cur !== a) this.cur.fadeOut(fade); this.cur = a; this.curName = name;
    return new Promise((res) => setTimeout(res, (c.duration / speed) * 1000));
  }
}

// ---------------------------------------------------------------- the doll: the knight's skeleton, wearing whatever is chosen
const doll = SkeletonUtils.clone(G.knight.scene), bones = {}, nodes = {};
doll.traverse((o) => { nodes[o.name] = o; if (o.isBone) bones[o.name] = o; });
{ const meshes = []; doll.traverse((o) => { if (o.isMesh) meshes.push(o); }); for (const m of meshes) m.parent.remove(m); }
const me = new Rig(doll, G.knight.animations);
const worn = {};   // slot -> [objects]
function wear(slot, idx) {
  for (const o of worn[slot] || []) o.parent && o.parent.remove(o);
  worn[slot] = [];
  const ch = SLOTS[slot].list[idx]; if (!ch) return;
  const [src, names] = ch;
  for (const name of names) {
    const sn = findNode(src, name); if (!sn) continue;
    sn.traverse((o) => {
      if (!o.isMesh) return; let m;
      if (o.isSkinnedMesh) {   // rebind the part to our skeleton, bone by bone (same names in every model)
        m = new THREE.SkinnedMesh(o.geometry, toon(o.material, slot));
        m.bind(new THREE.Skeleton(o.skeleton.bones.map((b) => bones[b.name]), o.skeleton.boneInverses), o.bindMatrix);
        (nodes[o.parent.name] || doll).add(m);
      } else {   // a rigid part (hat, cape, weapon): onto the same bone it hangs from in its own model
        m = new THREE.Mesh(o.geometry, toon(o.material, slot));
        const holder = o === sn ? o.parent : sn.parent; m.applyMatrix4(o === sn ? o.matrix : new THREE.Matrix4().multiplyMatrices(sn.matrix, o.matrix));
        (nodes[holder.name] || doll).add(m);
      }
      m.castShadow = true; m.frustumCulled = false; worn[slot].push(m);
    });
  }
}
function dye(slot, i) { const d = DYES[i] || DYES[0]; dyeU[slot].value.set(d[2], d[3]); }
function dressAll() {
  for (const k in SLOTS) { if (k === 'off' && TWO_HANDED.has(kindOf())) wear('off', 0); else wear(k, outfit[k] || 0); dye(k, outfit.dye[k] || 0); }
}
const kindOf = () => { const c = SLOTS.main.list[outfit.main]; return c ? c[3] : 'none'; };
const idleClip = () => (TWO_HANDED.has(kindOf()) && kindOf() !== 'staff' ? '2H_Melee_Idle' : 'Idle');
const ATTACK = { none: 'Unarmed_Melee_Attack_Punch_A', '1h': '1H_Melee_Attack_Slice_Diagonal', '2h': '2H_Melee_Attack_Chop', wand: 'Spellcast_Shoot', staff: 'Spellcast_Long', bow1: '1H_Ranged_Shoot', bow2: '2H_Ranged_Shoot', mug: 'Use_Item' };
const RANGED = new Set(['wand', 'staff', 'bow1', 'bow2']);
dressAll(); scene.add(doll); me.play(idleClip());

// ---------------------------------------------------------------- the three places
const places = { dress: new THREE.Group(), field: new THREE.Group(), battle: new THREE.Group() };
for (const g of Object.values(places)) { g.visible = false; scene.add(g); }
const toonC = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD });
{ // a round dais to turn on
  const d = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 48), toonC(0x8a6a48)); d.position.y = -0.15; d.receiveShadow = true; places.dress.add(d);
  const r = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.06, 8, 64), toonC(0xc9a45a)); r.rotation.x = Math.PI / 2; places.dress.add(r);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(30, 48), toonC(0x4a3420)); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.3; fl.receiveShadow = true; places.dress.add(fl);
}
const field = { size: 30, trees: [] };
{ // a grassy clearing with a path, trees and stones (no collisions: it is a sketch)
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = (i + j) % 2 ? '#6a9a48' : '#73a34e'; x.fillRect(i * 32, j * 32, 32, 32); }
  x.fillStyle = '#c9a874'; x.fillRect(224, 0, 64, 512); x.fillRect(0, 224, 512, 64);
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(30,60,20,${Math.random() * 0.25})`; x.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(field.size, field.size), new THREE.MeshToonMaterial({ map: t, gradientMap: GRAD })); gm.rotation.x = -Math.PI / 2; gm.receiveShadow = true; places.field.add(gm);
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const px = (rnd() - 0.5) * field.size * 0.92, pz = (rnd() - 0.5) * field.size * 0.92; if (Math.abs(px) < 2.2 || Math.abs(pz) < 2.2) continue;
    const g = new THREE.Group(); g.position.set(px, 0, pz);
    if (rnd() < 0.7) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.2, 6), toonC(0x6a4a2a)); tr.position.y = 0.6; g.add(tr);
      for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(1.1 - k * 0.25, 1.2, 7), toonC([0x3a7a3a, 0x468a40, 0x529a48][k])); l.position.y = 1.4 + k * 0.6; g.add(l); } }
    else { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + rnd() * 0.4), toonC(0x8a8478)); st.position.y = 0.3; st.scale.y = 0.7; g.add(st); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); places.field.add(g);
  }
}
const foe = SkeletonUtils.clone(G.skel.scene); foe.traverse((o) => { if (o.isMesh) { o.material = toon(o.material); o.castShadow = true; o.frustumCulled = false; } });
const foeRig = new Rig(foe, G.skel.animations);
{ // a stone floor for the fight
  const d = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.4, 0.3, 40), toonC(0x7a7268)); d.position.y = -0.15; d.receiveShadow = true; places.battle.add(d);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; if (Math.sin(a) > -0.1) continue;   // only behind the fight, never between it and the camera
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3, 8), toonC(0x9a9286)); p.position.set(Math.cos(a) * 7, 1.5, Math.sin(a) * 7 - 2); p.castShadow = true; places.battle.add(p); }
  foe.position.set(2.2, 0, 0); foe.rotation.y = -Math.PI / 2; places.battle.add(foe);
}

// ---------------------------------------------------------------- modes
let mode = 'dress';
function setMode(m) {
  mode = m; for (const [k, g] of Object.entries(places)) g.visible = k === m;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + m));
  $('hud').hidden = m !== 'battle'; $('msg').textContent = ''; busy = false;
  controls.enabled = m === 'dress';
  if (m === 'dress') { doll.position.set(0, 0, 0); doll.rotation.y = 0; camera.position.set(0, 2.6, 7); controls.target.set(0, 1.2, 0); me.play(idleClip()); $('hint').textContent = '拖曳旋轉．滾輪縮放'; }
  if (m === 'field') { doll.position.set(0, 0, 0); goal = null; me.play(idleClip()); $('hint').textContent = 'WASD／方向鍵走路．Shift 跑．點地面走過去'; }
  if (m === 'battle') { doll.position.set(-2.2, 0, 0); doll.rotation.y = Math.PI / 2; foe.position.set(2.2, 0, 0); hp = { me: 100, foe: 100 }; bars(); me.play(idleClip()); foeRig.play('Idle_Combat'); $('hint').textContent = ''; }
  bar();
}
document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));

// the wardrobe panel
function panel() {
  const P = $('pane-dress'); P.innerHTML = '';
  for (const [k, S] of Object.entries(SLOTS)) {
    const h = document.createElement('h3'); h.textContent = S.name; P.append(h);
    const row = document.createElement('div'); row.className = 'chips'; P.append(row);
    S.list.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'chip' + ((outfit[k] || 0) === i ? ' on' : ''); b.textContent = c ? c[2] : '無';
      if (k === 'off' && TWO_HANDED.has(kindOf()) && i) { b.disabled = true; b.title = '雙手武器'; }
      b.addEventListener('click', () => { outfit[k] = i; save(); if (k === 'main') dressAll(); else wear(k, i); panel(); if (k === 'main' && !busy) me.play(idleClip()); });
      row.append(b);
    });
    if (S.dye) {
      const dr = document.createElement('div'); dr.className = 'dyes';
      DYES.forEach((d, i) => { const b = document.createElement('button'); b.className = 'dye' + (d[1] ? '' : ' none') + ((outfit.dye[k] || 0) === i ? ' on' : ''); b.title = d[0]; if (d[1]) b.style.background = d[1];
        b.addEventListener('click', () => { outfit.dye[k] = i; save(); dye(k, i); panel(); }); dr.append(b); });
      P.append(dr);
    }
  }
  const h = document.createElement('h3'); h.textContent = '隨機'; P.append(h);
  const r = document.createElement('button'); r.className = 'chip'; r.textContent = '隨機搭配一套';
  r.addEventListener('click', () => { for (const k in SLOTS) { outfit[k] = Math.floor(Math.random() * SLOTS[k].list.length); if (SLOTS[k].dye) outfit.dye[k] = Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * (DYES.length - 1)); } if (!SLOTS.main.list[outfit.main]) outfit.main = 1; save(); dressAll(); panel(); me.play(idleClip()); });
  P.append(r);
}
// the buttons under the view
let busy = false;
function bar() {
  const B = $('bar'); B.innerHTML = '';
  const btn = (t, f, big) => { const b = document.createElement('button'); b.textContent = t; if (big) b.className = 'big'; b.disabled = busy; b.addEventListener('click', f); B.append(b); return b; };
  if (mode === 'dress') for (const [t, a, once] of [['待機', null], ['走路', 'Walking_A'], ['跑步', 'Running_A'], ['攻擊', 'atk', 1], ['防禦', 'Blocking'], ['歡呼', 'Cheer', 1], ['受傷', 'Hit_A', 1], ['跳躍', 'Jump_Full_Short', 1]])
    btn(t, async () => { const n = a === 'atk' ? ATTACK[kindOf()] : a || idleClip(); if (once) { await me.play(n, { once: true }); me.play(idleClip()); } else me.play(n); });
  if (mode === 'battle') { btn('攻擊', () => turn('attack'), true); btn('防禦', () => turn('guard')); if (hp.foe <= 0 || hp.me <= 0) btn('再來一場', () => setMode('battle')); }
}

// ---------------------------------------------------------------- the field: walk with keys or by pointing
const keys = new Set(); let goal = null;
addEventListener('keydown', (e) => keys.add(e.code)); addEventListener('keyup', (e) => keys.delete(e.code));
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'field') return; const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) goal = p;
});
function walk(dt) {
  let dx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let dz = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  if (dx || dz) goal = null;
  else if (goal) { dx = goal.x - doll.position.x; dz = goal.z - doll.position.z; if (Math.hypot(dx, dz) < 0.15) { goal = null; dx = dz = 0; } }
  const l = Math.hypot(dx, dz), run = keys.has('ShiftLeft') || keys.has('ShiftRight') || (goal && Math.hypot(dx, dz) > 6);
  if (l > 0) {
    const sp = run ? 5.2 : 2.4; doll.position.x += dx / l * sp * dt; doll.position.z += dz / l * sp * dt;
    const lim = field.size / 2 - 1; doll.position.x = Math.max(-lim, Math.min(lim, doll.position.x)); doll.position.z = Math.max(-lim, Math.min(lim, doll.position.z));
    const want = Math.atan2(dx, dz); let d = want - doll.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); doll.rotation.y += d * Math.min(1, dt * 12);
    const n = run ? 'Running_A' : 'Walking_A'; if (me.curName !== n) me.play(n);
  } else if (me.curName === 'Walking_A' || me.curName === 'Running_A') me.play(idleClip());
  // the camera looks down from behind and above, like the 2D map
  const t = new THREE.Vector3(doll.position.x, 0, doll.position.z + 7.5);
  camera.position.lerp(new THREE.Vector3(t.x, 8.5, t.z + 1.5), 1 - Math.pow(0.002, dt)); camera.lookAt(doll.position.x, 0.8, doll.position.z);
}

// ---------------------------------------------------------------- the battle: turn by turn
let hp = { me: 100, foe: 100 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function bars() { $('hpMe').querySelector('b').style.width = Math.max(0, hp.me) + '%'; $('hpFoe').querySelector('b').style.width = Math.max(0, hp.foe) + '%'; }
function pop(obj, text, heal) {
  const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += 2.2; v.project(camera); const r = canvas.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'pop' + (heal ? ' heal' : ''); d.textContent = text; d.style.left = ((v.x + 1) / 2 * r.width) + 'px'; d.style.top = ((1 - v.y) / 2 * r.height) + 'px';
  $('stage').append(d); setTimeout(() => d.remove(), 1000);
}
async function slide(obj, x, ms) { const x0 = obj.position.x, t0 = performance.now(); while (true) { const k = Math.min(1, (performance.now() - t0) / ms); obj.position.x = x0 + (x - x0) * (k * (2 - k)); if (k >= 1) break; await sleep(16); } }
async function bolt(from, to, col) {   // a glowing shot from one to the other
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: col })); places.battle.add(b);
  const a = new THREE.Vector3(from.position.x + 0.5, 1.3, 0), c = new THREE.Vector3(to.position.x, 1.2, 0);
  for (let k = 0; k <= 1; k += 0.06) { b.position.lerpVectors(a, c, k); b.position.y += Math.sin(k * Math.PI) * 0.4; await sleep(16); }
  places.battle.remove(b);
}
async function turn(choice) {
  if (busy || hp.me <= 0 || hp.foe <= 0) return; busy = true; bar();
  const k = kindOf(), ranged = RANGED.has(k), guard = choice === 'guard';
  if (!guard) {
    $('msg').textContent = '攻擊！';
    if (!ranged) { me.play('Running_A'); await slide(doll, 1.0, 380); }
    const atk = me.play(ATTACK[k], { once: true });
    await sleep(ranged ? 380 : 330);
    if (ranged) await bolt(doll, foe, k === 'wand' || k === 'staff' ? 0x8ae0ff : 0xffe08a);
    const dmg = ({ none: 9, mug: 6, '1h': 16, '2h': 24, wand: 18, staff: 22, bow1: 15, bow2: 20 })[k] + Math.floor(Math.random() * 6);
    hp.foe -= dmg; bars(); pop(foe, dmg);
    if (hp.foe <= 0) { foeRig.play('Death_A', { once: true }); await atk; if (!ranged) { me.play('Walking_Backwards'); await slide(doll, -2.2, 500); } me.play('Cheer'); $('msg').textContent = '勝利！'; busy = false; bar(); return; }
    foeRig.play('Hit_A', { once: true }).then(() => foeRig.play('Idle_Combat'));
    await atk; if (!ranged) { me.play('Walking_Backwards'); await slide(doll, -2.2, 500); }
    me.play(idleClip());
  } else { $('msg').textContent = '防禦'; me.play('Blocking'); await sleep(300); }
  // the skeleton's turn
  await sleep(250); $('msg').textContent = '骷髏兵攻擊！';
  foeRig.play('Running_A'); await slide(foe, -1.0, 380);
  const fa = foeRig.play('1H_Melee_Attack_Chop', { once: true }); await sleep(420);
  const dmg = Math.round((12 + Math.random() * 8) * (guard ? 0.45 : 1)); hp.me -= dmg; bars(); pop(doll, dmg);
  if (hp.me <= 0) me.play('Death_A', { once: true }); else me.play(guard ? 'Block_Hit' : 'Hit_A', { once: true }).then(() => { if (hp.me > 0) me.play(idleClip()); });
  await fa; foeRig.play('Walking_Backwards'); await slide(foe, 2.2, 500); foeRig.play(hp.me <= 0 ? 'Cheer' : 'Idle_Combat');
  $('msg').textContent = hp.me <= 0 ? '倒下了…' : ''; busy = false; bar();
}

// ---------------------------------------------------------------- the loop
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  me.mixer.update(dt); foeRig.mixer.update(dt);
  if (mode === 'dress') controls.update();
  if (mode === 'field') walk(dt);
  if (mode === 'battle') { camera.position.set(0.4, 2.8, 8.4); camera.lookAt(0, 1.1, 0); }
  sun.position.set(doll.position.x + 4, 9, doll.position.z + 5); sun.target.position.copy(doll.position);
  outline.render(scene, camera);
  requestAnimationFrame(frame);
}
resize(); panel(); setMode('dress'); frame();
window.__doll = { outfit, dressAll, setMode, wear, turn, get mode() { return mode; } };
