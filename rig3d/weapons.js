// Weapons as data. Each is built in one frame - the grip at the origin, the blade (or shaft) along +y, the flat of it
// facing +z - and the hand sockets turn that frame to fit whatever hand holds it (rig.js works the grip out from the
// finger bones). A new weapon is a builder and a line in WEAPONS: which socket, which stance and attacks, and what
// it throws or shoots, if anything.
import * as THREE from 'three';
import { GRAD } from './rig.js?v=1';

const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD, ...o });
const M = { steel: toon(0xd8dde4), dark: toon(0x3a3438), gold: toon(0xd4a83a), red: toon(0xb02a1e), wood: toon(0x6a4024), lacq: toon(0x5a1a14), string: toon(0xeee8d8), white: toon(0xf2ece0), green: toon(0x3a6a3a) };
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const group = (...a) => { const g = new THREE.Group(); a.forEach((o) => g.add(o)); return g; };
// a flat blade from an outline (points in x, y), a little thickness
const blade = (pts, depth = 0.008) => { const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 }); g.translate(0, 0, -depth / 2); return g; };
const tassel = (len = 0.14) => { const g = group(); for (let i = 0; i < 7; i++) { const c = mesh(new THREE.CylinderGeometry(0.004, 0.002, len, 3), M.red, Math.sin(i * 2.4) * 0.012, -len / 2, Math.cos(i * 2.4) * 0.012); c.rotation.z = Math.sin(i) * 0.12; g.add(c); } return g; };

// ---------------------------------------------------------------- the builders
export const build = {
  jian() {   // the straight double-edged sword
    const b = mesh(blade([[-0.018, 0], [0.018, 0], [0.016, 0.66], [0, 0.72], [-0.016, 0.66]]), M.steel, 0, 0.09, 0);
    const guard = mesh(new THREE.BoxGeometry(0.1, 0.022, 0.03), M.gold, 0, 0.08, 0);
    const grip = mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.16, 8), M.lacq, 0, 0, 0);
    const pommel = mesh(new THREE.SphereGeometry(0.02, 8, 6), M.gold, 0, -0.09, 0);
    const t = tassel(); t.position.y = -0.1;
    return group(b, guard, grip, pommel, t);
  },
  dao() {   // the broad single-edged sabre, curving to its tip, with a ring at the pommel
    const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push([0.016 + Math.sin(k * Math.PI * 0.9) * 0.022 + k * 0.01, k * 0.62]); }
    pts.push([-0.004, 0.66]); for (let i = 10; i >= 0; i--) { const k = i / 10; pts.push([-0.02 + k * k * 0.012, k * 0.6]); }
    const b = mesh(blade(pts, 0.007), M.steel, 0, 0.085, 0);
    const guard = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.016, 12), M.dark, 0, 0.078, 0);
    const grip = mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.15, 8), M.wood);
    const ring = mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 14), M.gold, 0, -0.1, 0);
    return group(b, guard, grip, ring);
  },
  qiang() {   // the spear: a long shaft held a third of the way up, a leaf head, a red horsehair tassel
    const shaft = mesh(new THREE.CylinderGeometry(0.016, 0.018, 2.1, 8), M.wood, 0, 0.35, 0);
    const head = mesh(blade([[-0.02, 0], [0.02, 0], [0.032, 0.08], [0, 0.24], [-0.032, 0.08]], 0.01), M.steel, 0, 1.42, 0);
    const collar = mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.06, 8), M.gold, 0, 1.4, 0);
    const t = tassel(0.16); t.position.y = 1.4; t.scale.set(2.4, 1, 2.4);
    const butt = mesh(new THREE.ConeGeometry(0.02, 0.06, 8), M.dark, 0, -0.72, 0); butt.rotation.x = Math.PI;
    return group(shaft, head, collar, t, butt);
  },
  gong() {   // the recurve bow, held at its middle
    const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16 * 2 - 1, y = k * 0.62; pts.push(new THREE.Vector3(0, y, 0.12 * (1 - k * k) - 0.06 * Math.pow(Math.abs(k), 6) * 2)); }
    const limb = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.013, 6), M.lacq);
    const grip = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), M.dark, 0, 0, 0.12);
    const top = pts[pts.length - 1], bot = pts[0], len = top.distanceTo(bot);
    const str = mesh(new THREE.CylinderGeometry(0.003, 0.003, len, 3), M.string, 0, 0, bot.z);
    const g = group(limb, grip, str); g.position.z = -0.12; return g;
  },
  quiver() {   // on the back: a lacquered quiver of arrows
    const q = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 10, 1, true), M.lacq);
    for (let i = 0; i < 6; i++) { const a = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.62, 4), M.wood, Math.sin(i * 1.7) * 0.03, 0.1, Math.cos(i * 1.7) * 0.03); const f = mesh(new THREE.BoxGeometry(0.03, 0.08, 0.002), M.white, 0, 0.27, 0); a.add(f); q.add(a); }
    return q;
  },
  dart() {   // a rope-dart head (biao): a steel point with a red silk tail
    const p = mesh(new THREE.ConeGeometry(0.018, 0.12, 6), M.steel, 0, 0.1, 0);
    const b = mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.06, 6), M.dark, 0, 0.01, 0);
    const t = tassel(0.1); t.position.y = -0.02;
    return group(p, b, t);
  },
  pouch() { const p = mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), M.wood); for (let i = 0; i < 3; i++) { const d = build.dart(); d.scale.setScalar(0.8); d.position.set(-0.03 + i * 0.03, 0.06, 0); p.add(d); } return p; },
  shan() {   // a folding fan: painted paper over bamboo ribs
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#f2ead6'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#2a2420'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(20, 110); x.quadraticCurveTo(70, 30, 120, 90); x.quadraticCurveTo(170, 20, 236, 105); x.stroke();
    x.fillStyle = '#b02a1e'; x.beginPath(); x.arc(200, 40, 14, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const paper = mesh(new THREE.RingGeometry(0.12, 0.34, 24, 1, Math.PI * 0.12, Math.PI * 0.76), toon(0xffffff, { map: t, side: THREE.DoubleSide }));
    const g = group(paper); for (let i = 0; i < 9; i++) { const a = Math.PI * 0.12 + i / 8 * Math.PI * 0.76, r = mesh(new THREE.BoxGeometry(0.008, 0.34, 0.004), M.wood); r.position.set(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.002); r.rotation.z = a - Math.PI / 2; g.add(r); }
    g.rotation.z = 0; return g;
  },
  tengpai() {   // a round rattan shield
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#b08a4a'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#7a5a2a'; x.lineWidth = 5; for (let r = 18; r < 128; r += 14) { x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); }
    x.fillStyle = '#b02a1e'; x.beginPath(); x.arc(128, 128, 36, 0, 7); x.fill(); x.fillStyle = '#d4a83a'; x.font = 'bold 44px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('虎', 128, 130);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 32), [toon(0x8a6a3a), toon(0xffffff, { map: t }), toon(0x6a4a2a)]); s.rotation.x = Math.PI / 2; s.position.z = 0.06;
    return group(s);
  },
};

// ---------------------------------------------------------------- the weapons: where each piece goes, and how it is used
// stance / attacks / heavy / block: clips from the animation library; shoot: what flies (arrow, dart, wind)
export const WEAPONS = {
  none: { name: '空手', stance: 'Idle_Loop', attacks: ['Punch_Jab', 'Punch_Cross'], heavy: 'Melee_Hook', block: 'Idle_Shield_Loop', parts: [] },
  jian: { name: '劍', stance: 'Sword_Idle', attacks: ['Sword_Regular_A', 'Sword_Regular_B', 'Sword_Regular_C'], heavy: 'Sword_Heavy_Combo', block: 'Sword_Block', parts: [['hand_r', 'jian']] },
  dao: { name: '刀', stance: 'Sword_Idle', attacks: ['Sword_Regular_B', 'Sword_Regular_A'], heavy: 'Sword_Heavy_Combo', block: 'Sword_Block', parts: [['hand_r', 'dao']] },
  daopai: { name: '刀＋藤牌', stance: 'Idle_Shield_Loop', attacks: ['Sword_Regular_A', 'Sword_Regular_C'], heavy: 'Shield_Dash', block: 'Shield_OneShot', parts: [['hand_r', 'dao'], ['hand_l', 'tengpai']] },
  qiang: { name: '槍', stance: 'Sword_Idle', attacks: ['Sword_Dash', 'Melee_Hook'], heavy: 'Sword_Heavy_Combo', block: 'Sword_Block', parts: [['hand_r', 'qiang']],
    // the spear is held low and level, pointing ahead, the left hand on the shaft
    pose(B, clip) { if (clip === 'Sword_Idle') { B.upperarm_l.rotateY(-0.5); B.lowerarm_l.rotateZ(0.6); } } },
  gong: { name: '弓', stance: 'Pistol_Idle_Loop', attacks: ['Pistol_Shoot'], heavy: 'Pistol_Shoot', block: 'Roll', aim: 'Pistol_Aim_Neutral', shoot: 'arrow', parts: [['hand_r', 'gong'], ['back', 'quiver']] },
  anqi: { name: '暗器', stance: 'Idle_Loop', attacks: ['OverhandThrow'], heavy: 'OverhandThrow', block: 'Roll', shoot: 'dart', parts: [['hand_r', 'dart'], ['hip', 'pouch']] },
  shan: { name: '扇', stance: 'Spell_Simple_Idle_Loop', attacks: ['Spell_Simple_Shoot'], heavy: 'Spell_Simple_Shoot', block: 'Roll', shoot: 'wind', parts: [['hand_r', 'shan']] },
};
// where a piece that is not in a hand sits: on which bone, how far up / forward / right of it (rig.js attach)
const PLACE = {
  back: { bone: 'spine_03', u: 0.05, f: -0.17, tilt: -0.45 },
  hip: { bone: 'pelvis', u: -0.02, f: 0.02, r: 0.17 },
};
export function weaponDef(id) {
  const w = WEAPONS[id]; if (!w) return null;
  return { ...w, id, build: () => w.parts.map(([sock, b]) => { const o = build[b](); const p = PLACE[sock]; if (p && p.tilt) o.rotation.z = p.tilt; return [sock, o, p]; }) };
}
// a thing in flight: from where to where, over how long
export function projectile(kind) {
  if (kind === 'arrow') { const a = group(mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.7, 4), M.wood), mesh(new THREE.ConeGeometry(0.014, 0.06, 4), M.steel, 0, 0.38, 0), mesh(new THREE.BoxGeometry(0.04, 0.1, 0.002), M.white, 0, -0.3, 0)); return a; }
  if (kind === 'dart') return build.dart();
  const w = mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 20, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.7 })); return w;
}
