// The character system: one humanoid skeleton (the Unreal-style 65 bones of Quaternius' Universal kit) that
// everything fits - bodies, clothes, hair, weapons, monster parts - and one animation library that drives every body.
//   Library      loads the models and the animations once
//   Character    a body on that skeleton: wear(slot, parts), hair, skin, setWeapon(def), addProp(bone, obj),
//                shape { height, head, faceW, faceL, shoulders, arms, legs, build, hunch }, play(clip), update(dt)
// Bones are reshaped after each animation step: lengths by moving a child bone along its bone, thickness by scaling
// across it, so animations made for one build play on any other.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const HSV = `vec3 rgb2hsv(vec3 c){ vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)); vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y); float e = 1.0e-10; return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x); }
  vec3 hsv2rgb(vec3 c){ vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }`;
// a toon material from a model's own; dye (a shared { value: Vector3(mode, hue, sat) } uniform) recolours its cloth,
// tint multiplies the whole of it (skin colour, a monster's green), inflate (a uniform of one number per bone of the
// mesh's skeleton) pushes the skin out along its normals by its bones' amounts - a heavier build, without scaling bones
export function toonMat(src, { dye = null, tint = null, inflate = null, all = false, skin = null } = {}) {
  const m = new THREE.MeshToonMaterial({ map: src.map || null, color: src.color ? src.color.clone() : new THREE.Color(1, 1, 1), gradientMap: GRAD, transparent: !!src.transparent, alphaTest: src.alphaTest || (src.map && src.transparent ? 0.5 : 0), side: src.side });
  if (tint) m.color = tint;   // (shared, so one change reaches every part)
  if (dye || inflate || skin) {
    m.onBeforeCompile = (sh) => {
      if (inflate) {
        sh.uniforms.uInflate = inflate;
        sh.vertexShader = 'uniform float uInflate[65];\n' + sh.vertexShader.replace('#include <skinning_vertex>', `#ifdef USE_SKINNING
          float inf = uInflate[int(skinIndex.x)] * skinWeight.x + uInflate[int(skinIndex.y)] * skinWeight.y + uInflate[int(skinIndex.z)] * skinWeight.z + uInflate[int(skinIndex.w)] * skinWeight.w;
          transformed += normalize(objectNormal) * inf;
        #endif
        #include <skinning_vertex>`);
      }
      if (skin) {   // skin takes a new colour, keeping each texel's light and shade (the texture's skin averages 0.205)
        sh.uniforms.uSkin = skin;
        sh.fragmentShader = 'uniform vec4 uSkin;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          if (uSkin.w > 0.5) diffuseColor.rgb = uSkin.rgb * clamp(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)) / 0.205, 0.0, 1.8);`);
      }
      if (!dye) return;
      sh.uniforms.uDye = dye;
      sh.fragmentShader = 'uniform vec3 uDye;\n' + HSV + '\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        if (uDye.x > 0.5) { vec3 h = rgb2hsv(diffuseColor.rgb); bool skin = h.x > 0.02 && h.x < 0.11 && h.y < 0.62 && h.z > 0.4;
          if ((h.y > 0.12 && !skin) || ${all ? 'true' : 'false'}) { if (uDye.x < 1.5) { h.x = uDye.y; h.y = clamp(max(h.y, 0.4) * uDye.z, 0.0, 1.0); } else if (uDye.x < 2.5) { h.y *= 0.12; h.z *= 0.3; } else { h.y *= 0.06; h.z = 0.6 + h.z * 0.4; }
            diffuseColor.rgb = hsv2rgb(h); } }`);
    };
    m.customProgramCacheKey = () => (dye ? 'dye' : '') + (all ? 'all' : '') + (inflate ? 'inf' : '') + (skin ? 'skin' : '');
  }
  return m;
}

// ---------------------------------------------------------------- the library
export class Library {
  constructor(base = 'models/') { this.base = base; this.loader = new GLTFLoader(); this.cache = {}; }
  gltf(path) { return (this.cache[path] = this.cache[path] || this.loader.loadAsync(this.base + path).then((g) => { g.scene.updateMatrixWorld(true); return g; })); }
  async load(onStep) {
    const [m, f, a1, a2] = await Promise.all(['body/Superhero_Male_FullBody.gltf', 'body/Superhero_Female_FullBody.gltf', 'UAL1.glb', 'UAL2.glb'].map((p) => this.gltf(p).then((g) => (onStep && onStep(p), g))));
    this.bodies = { male: m, female: f };
    // the animations: rotations for every bone, the pelvis' height, nothing else (bone lengths come from the body)
    const mann = {}; a1.scene.traverse((o) => { if (o.isBone) mann[o.name] = o; });
    this.mannPelvis = new THREE.Vector3(); mann.pelvis.getWorldPosition(this.mannPelvis);
    this.clips = {};
    for (const c of [...a1.animations, ...a2.animations]) {
      const tracks = c.tracks.filter((t) => t.name.endsWith('.quaternion') || t.name === 'pelvis.position');
      this.clips[c.name] = new THREE.AnimationClip(c.name, c.duration, tracks);
    }
  }
}

// the clothing slots. What a piece covers is read from the piece itself: the bones that move enough of it. While it is
// worn, the bare body's triangles on those bones are hidden (no skin poking through, and less to draw)
export const SLOTS = ['head', 'body', 'acc', 'arms', 'legs', 'feet'];
function bonesOf(mesh, min = 24) {
  const g = mesh.geometry, sk = g.attributes.skinIndex, sw = g.attributes.skinWeight, names = mesh.skeleton.bones.map((b) => b.name), n = {};
  for (let v = 0; v < sk.count; v++) { let best = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(v, k); if (x > w) { w = x; best = sk.getComponent(v, k); } } n[names[best]] = (n[names[best]] || 0) + 1; }
  return Object.keys(n).filter((b) => n[b] >= min);
}
// the bones each shape setting moves: [bone, what] - 'len' moves its child bones out along it, 'wide' scales it across
const SHAPE_BONES = {
  shoulders: [['clavicle_l', 'len'], ['clavicle_r', 'len']],
  arms: [['upperarm_l', 'len'], ['upperarm_r', 'len'], ['lowerarm_l', 'len'], ['lowerarm_r', 'len']],
  legs: [['thigh_l', 'len'], ['thigh_r', 'len'], ['calf_l', 'len'], ['calf_r', 'len']],
};
// how far (metres, at build 2) a heavier build pushes the skin out on each bone
const BULK = { pelvis: 0.07, spine_01: 0.08, spine_02: 0.08, spine_03: 0.07, neck_01: 0.03, clavicle_l: 0.05, clavicle_r: 0.05, upperarm_l: 0.04, upperarm_r: 0.04, lowerarm_l: 0.028, lowerarm_r: 0.028, thigh_l: 0.05, thigh_r: 0.05, calf_l: 0.03, calf_r: 0.03 };

export class Character {
  constructor(lib, sex = 'male') {
    this.lib = lib; this.sex = sex;
    const g = lib.bodies[sex];
    this.model = SkeletonUtils.clone(g.scene);
    this.root = new THREE.Group(); this.root.add(this.model);
    this.bones = {}; this.model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.bind = {}; for (const [n, b] of Object.entries(this.bones)) this.bind[n] = { p: b.position.clone(), s: b.scale.clone() };
    // each bone's own length axis: the local direction to its first child bone
    this.axis = {}; for (const [n, b] of Object.entries(this.bones)) { const c = b.children.find((x) => x.isBone); if (c) this.axis[n] = c.position.clone().normalize(); }
    this.skin = { value: new THREE.Vector4(0, 0, 0, 0) }; this.hairDye = { value: new THREE.Vector3(0, 0, 1) };
    this.dyes = {}; for (const k of SLOTS) this.dyes[k] = { value: new THREE.Vector3(0, 0, 1) };
    this.covers = {}; this.inflaters = [];
    this.model.traverse((o) => {
      if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
      if (/hair|eyebrow/i.test(o.material.name) || o.name === 'Eyebrows') o.material = toonMat(o.material, { dye: this.hairDye, all: true });
      else if (/eye/i.test(o.material.name)) o.material = toonMat(o.material);
      else { o.material = toonMat(o.material, { skin: this.skin, inflate: this.inflater(o) }); this.body = o; }
    });
    this.prepMask();
    const pel = new THREE.Vector3(); this.bones.pelvis.getWorldPosition(pel); this.pelvisRatio = pel.y / lib.mannPelvis.y;
    this.worn = {}; this.props = []; this.weapon = null; this.hair = null;
    this.shape = { height: 1, head: 1, faceW: 1, faceL: 1, shoulders: 1, arms: 1, legs: 1, build: 1, hunch: 0 };
    this.mixer = new THREE.AnimationMixer(this.model); this.cur = null;
    this.sockets = {};
    for (const [k, b] of [['hand_r', 'hand_r'], ['hand_l', 'hand_l'], ['back', 'spine_03'], ['hip', 'pelvis'], ['head', 'Head']]) { const s = new THREE.Group(); s.name = 'socket_' + k; this.bones[b].add(s); this.sockets[k] = s; }
    this.fitHand('r'); this.fitHand('l');
    for (const bn of ['Head', 'neck_01', 'spine_03', 'spine_02', 'pelvis', 'hand_l', 'hand_r']) this.frame(bn);   // (taken at rest)
  }
  // a hand's grip, from its finger bones: the weapon's +y runs across the knuckles (out of the thumb side of the fist), +x along the fingers, and it sits where the fingers close round it
  fitHand(s) {
    const B = this.bones, idx = B['index_01_' + s].position, pin = B['pinky_01_' + s].position, mid = B['middle_01_' + s].position;
    const y = pin.clone().sub(idx).normalize(), f = mid.clone().normalize();   // (in this rig the fingers run so: checked by eye)
    const x = f.clone().sub(y.clone().multiplyScalar(f.dot(y))).normalize(), z = new THREE.Vector3().crossVectors(x, y);
    const sock = this.sockets['hand_' + s];
    sock.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    sock.position.copy(mid).multiplyScalar(1.15).addScaledVector(z, s === 'r' ? 0.02 : -0.02);
    this.palm = this.palm || {}; this.palm[s] = z;
  }
  // one bulk number per bone of a mesh's own skeleton, in the mesh's own units (filled each frame from the build)
  inflater(mesh) {
    const s = new THREE.Vector3(); mesh.getWorldScale(s); const u = { value: new Array(65).fill(0) };
    this.inflaters.push({ u, names: mesh.skeleton.bones.map((b) => b.name), k: 1 / (s.x || 1) }); return u;
  }
  // the bare body's triangles, each with the bone that moves it most (so clothing can hide what it covers)
  prepMask() {
    const g = this.body.geometry = this.body.geometry.clone(), idx = g.index.array, sk = g.attributes.skinIndex, sw = g.attributes.skinWeight, names = this.body.skeleton.bones.map((b) => b.name);
    const main = (v) => { let best = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(v, k); if (x > w) { w = x; best = sk.getComponent(v, k); } } return names[best]; };
    this.tris = []; for (let i = 0; i < idx.length; i += 3) this.tris.push([idx[i], idx[i + 1], idx[i + 2], main(idx[i]), main(idx[i + 1]), main(idx[i + 2])]);
    this.fullIndex = Array.from(idx);
  }
  remask() {
    const hide = new Set(Object.values(this.covers).flat());
    const keep = []; for (const t of this.tris) if (!(hide.has(t[3]) && hide.has(t[4]) && hide.has(t[5]))) keep.push(t[0], t[1], t[2]);
    this.body.geometry.setIndex(keep);
  }
  // put on clothing: the parts (glTF files under models/outfit/) are rebound to this skeleton, bone by bone
  async wear(slot, files) {
    for (const o of this.worn[slot] || []) o.parent && o.parent.remove(o);
    this.worn[slot] = []; this.covers[slot] = [];
    for (const f of files || []) {
      const g = await this.lib.gltf('outfit/' + f + '.gltf');
      g.scene.traverse((o) => {
        if (!o.isSkinnedMesh) return;
        const skin = /Regular|Superhero/.test(o.material.name);   // (bare arms and hands that come with a garment)
        const m = new THREE.SkinnedMesh(o.geometry, toonMat(o.material, { dye: skin ? null : this.dyes[slot], skin: skin ? this.skin : null, inflate: this.inflater(o) }));
        this.covers[slot].push(...bonesOf(o));
        m.bind(new THREE.Skeleton(o.skeleton.bones.map((b) => this.bones[b.name]), o.skeleton.boneInverses), o.bindMatrix);
        m.castShadow = true; m.frustumCulled = false; this.body.parent.add(m); this.worn[slot].push(m);
      });
    }
    this.remask();
  }
  // skin colour (any CSS colour or hex), or null for the texture's own
  setSkin(c) { if (c == null) { this.skin.value.w = 0; return; } const k = new THREE.Color(c); this.skin.value.set(k.r, k.g, k.b, 1); }
  async setHair(file) {
    if (this.hair) this.hair.forEach((o) => o.parent.remove(o)); this.hair = [];
    if (!file) return;
    const g = await this.lib.gltf('hair/' + file + '.gltf');
    g.scene.traverse((o) => { if (!o.isSkinnedMesh) return;
      const m = new THREE.SkinnedMesh(o.geometry, toonMat(o.material, { dye: this.hairDye, all: true })); m.bind(new THREE.Skeleton(o.skeleton.bones.map((b) => this.bones[b.name]), o.skeleton.boneInverses), o.bindMatrix);
      m.castShadow = true; m.frustumCulled = false; this.body.parent.add(m); this.hair.push(m); });
  }
  // a weapon (weapons.js): its mesh into a hand socket at its grip, its stance and attacks
  setWeapon(def) {
    for (const o of this.weaponObjs || []) o.parent && o.parent.remove(o);
    this.weaponObjs = []; this.weapon = def || null; if (!def) return;
    for (const [sock, obj, place] of def.build()) {
      if (this.sockets[sock] && sock.startsWith('hand')) this.sockets[sock].add(obj); else this.attach(place.bone, obj, place, false);
      obj.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.weaponObjs.push(obj);
    }
  }
  // a bone's own frame for the body's up, forward and right (at rest), so a part can be placed on any bone by saying
  // where on the body it goes, whatever way the bone itself happens to point
  frame(bn) {
    if (this._frames && this._frames[bn]) return this._frames[bn];
    const b = this.bones[bn]; this.model.updateMatrixWorld(true);
    const inv = new THREE.Quaternion(); b.getWorldQuaternion(inv); inv.invert();
    const s = new THREE.Vector3(); b.getWorldScale(s); const k = 1 / s.x;
    const f = { up: new THREE.Vector3(0, 1, 0).applyQuaternion(inv).multiplyScalar(k), fwd: new THREE.Vector3(0, 0, 1).applyQuaternion(inv).multiplyScalar(k), right: new THREE.Vector3(-1, 0, 0).applyQuaternion(inv).multiplyScalar(k) };
    return ((this._frames = this._frames || {})[bn] = f);
  }
  // put obj on a bone: u, f, r metres up, forward, to the right of the bone (in the body's terms); its +y up and +z forward
  attach(bn, obj, { u = 0, f = 0, r = 0 } = {}, prop = true) {
    const F = this.frame(bn), b = this.bones[bn];
    obj.position.copy(F.up).multiplyScalar(u).addScaledVector(F.fwd, f).addScaledVector(F.right, r);
    const x = F.right.clone().normalize().negate(), y = F.up.clone().normalize(), z = F.fwd.clone().normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); obj.quaternion.premultiply(q);
    obj.scale.multiplyScalar(F.up.length());   // (undo the bone's own scale)
    b.add(obj); if (prop) this.props.push(obj); return obj;
  }
  // turn a bone (after the animation) so its length points along dir (body space: +z ahead, +y up), by weight w
  aim(bn, dir, w = 1) {
    const b = this.bones[bn], a = this.axis[bn]; if (!b || !a) return;
    const wq = new THREE.Quaternion(); b.getWorldQuaternion(wq);
    const rq = new THREE.Quaternion(); this.root.getWorldQuaternion(rq);
    const cur = a.clone().applyQuaternion(wq).normalize(), want = dir.clone().normalize().applyQuaternion(rq);
    const delta = new THREE.Quaternion().setFromUnitVectors(cur, want); const tq = new THREE.Quaternion().identity().slerp(delta, w);
    const pq = new THREE.Quaternion(); b.parent.getWorldQuaternion(pq);
    b.quaternion.copy(pq.invert().multiply(tq.multiply(wq))); b.updateMatrixWorld(true);
  }
  // anything else on a bone: horns, tails, claws
  addProp(sock, obj) { (this.sockets[sock] || this.bones[sock]).add(obj); this.props.push(obj); return obj; }
  clearProps() { for (const o of this.props) o.parent && o.parent.remove(o); this.props = []; }

  play(name, { once = false, fade = 0.2, speed = 1 } = {}) {
    const c = this.lib.clips[name] || this.lib.clips.Idle_Loop; const a = this.mixer.clipAction(c);
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.timeScale = speed; a.fadeIn(fade).play();
    if (this.cur && this.cur !== a) this.cur.fadeOut(fade); this.cur = a; this.curName = name;
    return new Promise((res) => setTimeout(res, (c.duration / speed) * 1000 - fade * 500));
  }
  update(dt, t = 0) {
    for (const [n, b] of Object.entries(this.bones)) { b.position.copy(this.bind[n].p); b.scale.copy(this.bind[n].s); }
    this.mixer.update(dt);
    const S = this.shape, B = this.bones;
    B.pelvis.position.multiplyScalar(this.pelvisRatio);
    if (S.build !== this._build) { this._build = S.build; const d = S.build - 1; for (const f of this.inflaters) f.names.forEach((n, i) => { f.u.value[i] = (BULK[n] || 0) * d * f.k; }); }
    // lengths: move each child bone out along its parent; thickness: scale the bone across its length
    for (const [k, list] of Object.entries(SHAPE_BONES)) {
      const v = S[k]; if (v === 1) continue;
      for (const [bn, how] of list) {
        const b = B[bn]; if (!b) continue;
        if (how === 'len') for (const c of b.children) if (c.isBone) c.position.multiplyScalar(v);
        if (how === 'wide') { const a = this.axis[bn] || new THREE.Vector3(0, 1, 0); b.scale.set(1 + (v - 1) * (1 - Math.abs(a.x)), 1 + (v - 1) * (1 - Math.abs(a.y)), 1 + (v - 1) * (1 - Math.abs(a.z))); }
      }
    }
    // the head: its size (a big head reads younger, or chibi), and the face's width and length
    if (S.head !== 1 || S.faceW !== 1 || S.faceL !== 1) { const a = this.axis.Head || new THREE.Vector3(0, 1, 0), w = S.faceW, l = S.faceL;
      B.Head.scale.set(S.head * (Math.abs(a.x) > 0.5 ? l : w), S.head * (Math.abs(a.y) > 0.5 ? l : w), S.head * (Math.abs(a.z) > 0.5 ? l : w)); }
    this.root.scale.setScalar(S.height);
    this.model.updateMatrixWorld(true);
    if (S.hunch) { const fw = new THREE.Vector3(0, 0, 1); this.aim('spine_03', new THREE.Vector3(0, 1, 0).lerp(fw, S.hunch * 0.55), 1); this.aim('neck_01', new THREE.Vector3(0, 1, 0).lerp(fw, S.hunch * 0.15), 1); }
    if (this.weapon && this.weapon.pose) this.weapon.pose(B, this.curName, t);
    if (this.onPose) this.onPose(B, t);
  }
}
