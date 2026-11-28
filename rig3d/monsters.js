// Monsters on the human skeleton: a skin colour, a body shape, parts on bones (horns, ears, tails, a talisman),
// a stance and gait from the animation library, and a little motion of their own (tails sway, a jiangshi hops with its
// arms out). Every part is placed by where it goes on the body, so they fit any build. A new monster is an entry here.
import * as THREE from 'three';
import { GRAD } from './rig.js?v=1';

const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD, ...o });
const mesh = (g, m) => new THREE.Mesh(g, m);
const curve = (pts, r, m) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 20, r, 7), m);
function paper(text, w, h, bg, ink) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 64, 160); x.fillStyle = ink; x.font = 'bold 34px serif'; x.textAlign = 'center';
  [...text].forEach((ch, i) => x.fillText(ch, 32, 40 + i * 38));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.PlaneGeometry(w, h), toon(0xffffff, { map: t, side: THREE.DoubleSide }));
}

export const PARTS = {
  horns: (c = 0xe8dcc0) => { const g = new THREE.Group(); for (const s of [-1, 1]) g.add(curve([[0.05 * s, 0, 0], [0.16 * s, 0.05, 0], [0.24 * s, 0.16, 0.02], [0.22 * s, 0.3, 0.06]], 0.03, toon(c))); return g; },
  ears: (c) => { const g = new THREE.Group(); for (const s of [-1, 1]) { const e = mesh(new THREE.ConeGeometry(0.05, 0.14, 4), toon(c)); e.position.set(0.08 * s, 0.05, 0); e.rotation.z = -0.35 * s; g.add(e); } return g; },
  bigEars: (c) => { const g = new THREE.Group(); for (const s of [-1, 1]) { const e = mesh(new THREE.ConeGeometry(0.06, 0.22, 4), toon(c)); e.position.set(0.12 * s, 0, 0); e.rotation.z = -1.25 * s; g.add(e); } return g; },
  noseRing: () => { const r = mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 14), toon(0xd4a83a)); return r; },
  qingHat: () => { const g = new THREE.Group(); const top = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 16), toon(0x2a2a3a)); top.position.y = 0.05; const brim = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 20), toon(0x2a2a3a)); const knob = mesh(new THREE.SphereGeometry(0.025, 8, 6), toon(0xb02a1e)); knob.position.y = 0.12; g.add(top, brim, knob); return g; },
  talisman: () => { const p = paper('敕令', 0.07, 0.17, '#e8c850', '#b02a1e'); p.position.y = -0.08; p.rotation.x = -0.12; return p; },
  // a tail: a chain of segments, each a child of the last (so a sway at the root travels down it)
  tail: (c, n = 7, len = 0.09, tip = 0xffffff) => {
    const root = new THREE.Group(); let at = root;
    for (let i = 0; i < n; i++) { const r = 0.05 + Math.sin((i / n) * Math.PI) * 0.05; const s = mesh(new THREE.SphereGeometry(r, 8, 6), toon(i === n - 1 ? tip : c)); s.scale.y = 1.5; const seg = new THREE.Group(); seg.position.y = i ? len : 0; seg.add(s); at.add(seg); at = seg; }
    root.userData.tail = true; return root;
  },
};

// sway every tail on a body: each segment bends a little more, a little later
function swayTails(ch, t, k = 1) { for (const p of ch.props) if (p.userData.tail) { let s = p.children[0], i = 0; while (s) { s.rotation.x = Math.sin(t * 2.2 - i * 0.5 + p.userData.ph) * 0.16 * k; s.rotation.z = Math.cos(t * 1.7 - i * 0.4 + p.userData.ph) * 0.1 * k; s = s.children.find((c) => c.isGroup); i++; } } }

export const MONSTERS = {
  jiangshi: { name: '殭屍', sex: 'male', skin: 0xa8c0b0, hair: null, outfit: { body: 'Peasant_Body', arms: 'Peasant_Arms', legs: 'Peasant_Legs', feet: 'Peasant_Feet' }, dye: { body: [1, 0.62, 0.5], arms: [1, 0.62, 0.5], legs: [2, 0, 1] },
    shape: { height: 1.02, arms: 1.08 }, weapon: 'none', stance: 'Idle_Loop', walk: 'Walk_Formal_Loop', attack: 'Zombie_Scratch',
    parts: [['Head', 'qingHat', { u: 0.2, f: 0.01 }], ['Head', 'talisman', { u: 0.13, f: 0.12 }]],
    // arms held straight out ahead, stiff; it hops instead of walking
    pose(ch, B, t) { const fw = new THREE.Vector3(0, 0.05, 1); for (const s of ['l', 'r']) { ch.aim('upperarm_' + s, fw, 1); ch.aim('lowerarm_' + s, fw, 1); }
      ch.model.position.y = ch.walking ? Math.abs(Math.sin(t * 5)) * 0.22 : 0; } },
  bull: { name: '牛魔王', sex: 'male', skin: 0x9a5038, hair: 'Hair_Buzzed', outfit: { body: 'Ranger_Body', acc: 'Ranger_Acc_Pauldron', legs: 'Ranger_Legs', feet: 'Ranger_Feet_Boots' }, dye: { body: [2, 0, 1], legs: [1, 0.02, 0.9] },
    shape: { height: 1.3, build: 1.45, shoulders: 1.3, arms: 1.06, head: 0.92, faceW: 1.15 }, weapon: 'qiang', stance: 'Sword_Idle', walk: 'Walk_Loop', attack: 'Sword_Heavy_Combo',
    parts: [['Head', 'horns', { u: 0.16, f: 0.0 }], ['Head', 'noseRing', { u: 0.02, f: 0.13 }]] },
  fox: { name: '九尾狐', sex: 'female', skin: 0xf8e8e0, hair: 'Hair_Long', hairDye: [3, 0, 1], outfit: { body: 'Peasant_Body', arms: 'Peasant_Arms', legs: 'Peasant_Legs', feet: 'Peasant_Feet' }, dye: { body: [1, 0.9, 0.7], arms: [3, 0, 1], legs: [1, 0.9, 0.7] },
    shape: { height: 1.0, head: 1.05, faceL: 0.94 }, weapon: 'shan', stance: 'Spell_Simple_Idle_Loop', walk: 'Walk_Formal_Loop', attack: 'Spell_Simple_Shoot',
    parts: [['Head', 'ears', { u: 0.17 }], ...Array.from({ length: 9 }, (_, i) => ['pelvis', 'tail', { u: -0.05, f: -0.14, r: (i - 4) * 0.02 }, { spread: (i - 4) * 0.2 }])],
    pose(ch, B, t) { swayTails(ch, t); } },
  shanxiao: { name: '山魈', sex: 'male', skin: 0x7a9a58, hair: null, outfit: { legs: 'Peasant_Legs' }, dye: { legs: [1, 0.08, 0.6] },
    shape: { height: 0.72, head: 1.45, arms: 1.28, legs: 0.78, build: 1.15, hunch: 0.7, faceW: 1.12 }, weapon: 'dao', stance: 'Zombie_Idle_Loop', walk: 'Zombie_Walk_Fwd_Loop', attack: 'Sword_Regular_B',
    parts: [['Head', 'bigEars', { u: 0.06 }], ['pelvis', 'tail', { u: -0.03, f: -0.12 }, { n: 4 }]],
    pose(ch, B, t) { swayTails(ch, t, 0.6); } },
};

// dress a character as a monster (rig.js Character): skin, shape, clothes, parts, weapon; returns its stance/gait
export async function becomeMonster(ch, id, weaponDef) {
  const M = MONSTERS[id], pre = ch.sex === 'female' ? 'Female_' : 'Male_';
  ch.clearProps(); ch.setSkin(M.skin);
  Object.assign(ch.shape, { height: 1, head: 1, faceW: 1, faceL: 1, shoulders: 1, arms: 1, legs: 1, build: 1, hunch: 0 }, M.shape);
  for (const slot of ['head', 'body', 'acc', 'arms', 'legs', 'feet']) { const f = M.outfit[slot]; let file = f ? pre + f : null; if (file && ch.sex === 'female') file = file.replace('Ranger_Feet_Boots', 'Ranger_Feet').replace('Acc_Pauldron', 'Acc_Pauldrons'); await ch.wear(slot, file ? [file] : []); }
  for (const [k, d] of Object.entries(ch.dyes)) d.value.set(...((M.dye && M.dye[k]) || [0, 0, 1]));
  await ch.setHair(M.hair); ch.hairDye.value.set(...(M.hairDye || [2, 0, 1]));
  for (const [bone, part, place, opt = {}] of M.parts) {
    const o = part === 'tail' ? PARTS.tail(M.skin, opt.n || 7, 0.09, id === 'fox' ? 0xffffff : M.skin) : PARTS[part](M.skin);
    if (o.userData.tail) { o.userData.ph = Math.random() * 6; o.rotation.set(-1.1, 0, opt.spread || 0); }   // (tilted back, fanned out)
    ch.attach(bone, o, place);
  }
  ch.setWeapon(weaponDef(M.weapon));
  ch.onPose = M.pose ? (B, t) => M.pose(ch, B, t) : null;
  return M;
}
