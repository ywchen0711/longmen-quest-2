// The pop-up book view. The map is the open double page of a book lying on a wooden table: the ground tiles are
// printed flat on cream paper (one baked texture, paper grain, a soft gutter shadow down the middle, page edges and
// the cover round the border). Everything that stands up is a die-cut cardboard pop-up - trees, rocks, walls,
// houses (facade + roof flap), mountains, people - with a white cut border, a visible card thickness, a little tab
// at the hinge and a soft shadow on the page. Pieces near the edge of the view unfold up from flat as the camera
// comes near and fold down when it leaves; people hop on their tab when they walk. Map changes turn the page.
//
// Speed: all the pop-ups of a map are ONE instanced draw (plus one for their card edges and one for their
// shadows), from ONE texture atlas; the ground is one quad; no shadow maps, no lights (the paper shading is done
// in the shaders), and one full-screen pass (a light tilt-shift + the colour grade) instead of bloom + two blurs.
import * as THREE from 'three';
import { EffectComposer } from '../lib/addons/EffectComposer.js';
import { RenderPass } from '../lib/addons/RenderPass.js';
import { ShaderPass } from '../lib/addons/ShaderPass.js';
import { tex, spr, FACES, SPR, POP } from './tiles.js?v=6';
import { TILES } from './maps.js?v=6';
import { grainCanvas, woodCanvas, edgeCanvas, dieCut } from './paper.js?v=6';
import { inkWash, fretBorder, sealCanvas } from './ink.js?v=6';
const SEAL_WORLD = '龍門萬妖';   // the seal printed on the world map's page

// the one full-screen pass: a light depth-of-field blur away from the focus band (one pass, 9 taps where blurred,
// 1 tap in focus), the linear -> sRGB step and the grade (warm tint, vignette, fades and flashes)
const Final = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, focus: { value: 0.52 }, band: { value: 0.16 }, amount: { value: 0.0 },
    vig: { value: 0.55 }, fade: { value: 0 }, flash: { value: 0 }, tint: { value: new THREE.Vector3(1.03, 1.0, 0.94) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float focus, band, amount, vig, fade, flash; uniform vec3 tint; varying vec2 vUv;
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main(){
      float d = max(0.0, abs(vUv.y - focus) - band);
      float r = clamp(d * 3.5, 0.0, 1.0) * amount;
      vec4 c = texture2D(tDiffuse, vUv);
      if (r > 0.05) {
        vec2 o = r / res, p = o * 0.7;
        c = c * 0.2
          + (texture2D(tDiffuse, vUv + vec2(o.x, 0.0)) + texture2D(tDiffuse, vUv - vec2(o.x, 0.0)) + texture2D(tDiffuse, vUv + vec2(0.0, o.y)) + texture2D(tDiffuse, vUv - vec2(0.0, o.y))) * 0.12
          + (texture2D(tDiffuse, vUv + p) + texture2D(tDiffuse, vUv - p) + texture2D(tDiffuse, vUv + vec2(p.x, -p.y)) + texture2D(tDiffuse, vUv + vec2(-p.x, p.y))) * 0.08;
      }
      c.rgb = toSRGB(c.rgb) * tint;
      vec2 q = vUv - 0.5; c.rgb *= 1.0 - dot(q, q) * vig * 1.6;
      c.rgb = mix(c.rgb, vec3(1.0), flash);
      c.rgb *= 1.0 - fade;
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0);
    }`,
};

// ---------------------------------------------------------------- shaders of the paper world
const PAPER_GLSL = `
  uniform vec3 uLampDir, uLampCol, uAmb, uLanternCol, uFog, uFogCol;
  uniform vec4 uLantern; uniform float uLanternR; uniform vec3 uSpot;
  bool has(float f, float bit) { return mod(floor(f / bit + 0.001), 2.0) > 0.5; }
  vec3 shade(vec3 col, vec3 N, vec3 W, float depth) {
    vec3 L = uAmb + uLampCol * max(dot(N, uLampDir), 0.0);
    vec2 sd = (W.xz - uSpot.xy) * vec2(1.0, 1.35); L *= 1.0 + uSpot.z * (exp(-dot(sd, sd) * 0.0055) - 0.55);   // the desk lamp's pool of light
    if (uLantern.w > 0.0) { float a = clamp(1.0 - distance(W, uLantern.xyz) / uLanternR, 0.0, 1.0); L += uLanternCol * uLantern.w * a * a; }
    col *= L;
    return mix(col, uFogCol, uFog.z * smoothstep(uFog.x, uFog.y, depth));
  }`;
const TEXGRAD = `vec4 texG(sampler2D s, vec2 uv, vec2 gx, vec2 gy) {
  #if __VERSION__ >= 300
    return textureGrad(s, uv, gx, gy);
  #else
    return texture2D(s, uv);
  #endif
  }
  // pixel art without shimmer: sample at the texel centre except within one screen pixel of a texel edge, where the
  // (linear) filter blends the two texels. gx, gy: the uv gradients (continuous even across a repeat seam)
  vec4 texPix(sampler2D s, vec2 uv, vec2 gx, vec2 gy) {
  #if __VERSION__ >= 300
    vec2 size = vec2(textureSize(s, 0)), p = uv * size, fw = max((abs(gx) + abs(gy)) * size, vec2(1e-4)), f = fract(p);
    vec2 sx = clamp(f / fw, 0.0, 0.5) + clamp((f - 1.0) / fw + 0.5, 0.0, 0.5);
    return textureGrad(s, (floor(p) + sx) / size, gx, gy);
  #else
    return texture2D(s, uv);
  #endif
  }`;
const GROUND_VS = `varying vec3 vW; varying float vDepth;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const GROUND_FS = `${PAPER_GLSL}
  ${TEXGRAD}
  uniform sampler2D uMap, uGrain; uniform vec4 uPrint, uPage; uniform float uGutter; uniform vec3 uPaper, uInk;
  varying vec3 vW; varying float vDepth;
  void main(){
    vec2 q = (vW.xz - uPrint.xy) / (uPrint.zw - uPrint.xy);
    vec3 col = uPaper;
    if (q.x >= 0.0 && q.y >= 0.0 && q.x <= 1.0 && q.y <= 1.0) { vec4 t = texPix(uMap, q, dFdx(q), dFdy(q)); vec3 tc = t.rgb / max(t.a, 0.02); vec3 ink = mix(tc, vec3(dot(tc, vec3(0.3, 0.55, 0.15))), 0.3); ink.b = mix(ink.b, max(ink.b, ink.g * 0.8), 0.35); ink *= uInk; col = mix(col, ink * mix(vec3(1.0), uPaper, 0.38), t.a * 0.86); }
    float gr = texture2D(uGrain, vW.xz * 0.19).r; col *= 0.8 + 0.2 * gr;
    float g = vW.x - uGutter, ag = abs(g) - 1.7;
    col *= 1.0 - 0.34 * exp(-g * g * 1.1) + 0.05 * exp(-ag * ag * 0.9);       // the gutter: shadow, then the page's lift
    vec2 e = min(vW.xz - uPage.xy, uPage.zw - vW.xz);
    col *= 0.88 + 0.12 * smoothstep(0.0, 1.4, min(e.x, e.y));                  // the page edges curl down a little
    gl_FragColor = vec4(shade(col, vec3(0.0, 1.0, 0.0), vW, vDepth), 1.0);
    #include <colorspace_fragment>
  }`;
// a card: part 0 = the face, 1 = the folded tab at its foot, 2 = the lid / roof flap hinged at its top
const CARD_VS = `${PAPER_GLSL}
  attribute vec4 iPos; attribute vec4 iSize; attribute vec4 iUV; attribute vec4 iUV2; attribute vec4 iMisc; attribute vec2 iRoll; attribute float iRise;
  uniform float uTime;
  varying vec2 vLoc, vRep, vSz; varying vec4 vRect; varying vec3 vN, vW; varying float vDepth, vPart, vFlags;
  void main(){
    float part = position.z, W = iSize.x, H = iSize.y, D = iSize.z, LA = iSize.w, b = iPos.w, fl = iMisc.y;
    if (W == 0.0 || (part > 0.5 && part < 1.5 && has(fl, 32.0)) || (part > 1.5 && D == 0.0)) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
    float th = (1.0 - iRise) * 1.5707963;
    vec3 p, n; vRect = iUV; vRep = vec2(iMisc.z, 1.0); vSz = vec2(abs(W), H);
    if (part < 0.5) { p = vec3(position.x * W, position.y * H - b, 0.0); n = vec3(0.0, 0.0, sign(W)); }
    else if (part < 1.5) { p = vec3(position.x * abs(W) * 0.5, 0.0035, position.y * 0.09); n = vec3(0.0, 1.0, 0.0); }
    else { float a = LA * clamp(iRise, 0.0, 1.0); p = vec3(position.x * W, H - b, 0.0) + vec3(0.0, cos(a), -sin(a)) * (position.y * D); n = vec3(0.0, sin(a), cos(a)) * sign(W); vRect = iUV2; vRep = vec2(iMisc.z, max(1.0, floor(D + 0.5))); vSz = vec2(abs(W), D); }
  #ifdef EDGE
    if (part > 0.5 && part < 1.5) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
    p -= n * sign(W) * 0.03;
  #endif
    if (part < 0.5 || part > 1.5) {
      float c = cos(th), s = sin(th);
      p = vec3(p.x, p.y * c + p.z * s, -p.y * s + p.z * c); n = vec3(n.x, n.y * c + n.z * s, -n.y * s + n.z * c);
      if (iRoll.x != 0.0) { float c2 = cos(iRoll.x), s2 = sin(iRoll.x); p.xy = vec2(p.x * c2 - p.y * s2, p.x * s2 + p.y * c2); }
    }
    if (has(fl, 1.0)) { float t = uTime * 1.6 + iMisc.w; p.y += 0.03 + sin(t) * 0.03; }   // waves bob gently (no sideways sway)
    float cy = cos(iMisc.x), sy = sin(iMisc.x);
    p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy); n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
    vec4 w = vec4(p + iPos.xyz, 1.0);
    if (part < 0.5 || part > 1.5) w.y += 0.012 * (1.0 - clamp(iRise, 0.0, 1.0));
    vW = w.xyz; vN = n; vLoc = vec2(position.x + 0.5, position.y); vPart = part; vFlags = fl;
    vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
  }`;
const CARD_FS = `${PAPER_GLSL}
  ${TEXGRAD}
  uniform sampler2D uAtlas, uGrain; uniform vec3 uBorder, uCut, uPaper, uEdge; uniform float uTime;
  varying vec2 vLoc, vRep, vSz; varying vec4 vRect; varying vec3 vN, vW; varying float vDepth, vPart, vFlags;
  // how much of the pixel the cut-out covers: a soft edge one pixel wide when the picture is multisampled
  // (alpha-to-coverage turns it into sample coverage), else the plain alpha test
  float cover(float a) {
  #ifdef A2C
    return clamp((a - 0.5) / max(fwidth(a), 1e-3) + 0.5, 0.0, 1.0);
  #else
    return a < 0.5 ? 0.0 : 1.0;
  #endif
  }
  void main(){
    vec3 col; float alpha = 1.0;
    if (vPart > 0.5 && vPart < 1.5) col = uPaper * (vLoc.y < 0.3 ? 0.78 : 0.94);
    else {
      vec2 r = vLoc * vRep, f = fract(r);
      vec4 t = texPix(uAtlas, vRect.xy + vec2(f.x, 1.0 - f.y) * vRect.zw, dFdx(r) * vRect.zw, dFdy(r) * vRect.zw);
      vec3 tc = t.rgb / max(t.a, 0.02);   // (transparent texels are black: undo the darkening the filter mixes in)
      if (has(vFlags, 8.0)) {
        vec2 dd = min(vLoc, 1.0 - vLoc) * vSz; float e = min(dd.x, (1.0 - vLoc.y) * vSz.y);
        bool rim = vPart > 1.5 ? !has(vFlags, 128.0) : !has(vFlags, 64.0);
        if (rim) {
          float aw = max(fwidth(e), 1e-5), inner = smoothstep(0.05 - aw * 0.5, 0.05 + aw * 0.5, e);
          alpha = max(1.0 - inner, cover(t.a));
          col = mix(uBorder, t.a < 0.5 ? uBorder : tc, inner);
          col = mix(col, uCut, (1.0 - smoothstep(0.014 - aw * 0.5, 0.014 + aw * 0.5, e)) * min(1.0, 0.014 / aw + 0.35));
        } else { alpha = cover(t.a); col = tc; }
      } else { alpha = cover(t.a); col = tc; }
    }
    if (alpha <= 0.0) discard;
  #ifdef EDGE
    col = uEdge;
  #endif
    col *= 0.9 + 0.1 * texture2D(uGrain, vW.xy * 0.37 + vW.z * 0.21).r;
    if (has(vFlags, 2.0)) gl_FragColor = vec4(col * (1.2 + 0.18 * sin(uTime * 13.0 + vW.x * 5.0)), alpha);
    else gl_FragColor = vec4(shade(col, normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0), vW, vDepth), alpha);
    #include <colorspace_fragment>
  }`;
const SHADOW_VS = `${PAPER_GLSL}
  attribute vec4 iPos; attribute vec4 iSize; attribute vec4 iMisc; attribute float iRise;
  uniform vec3 uShadowDir; varying vec2 vQ; varying float vA;
  void main(){
    float W = abs(iSize.x), fl = iMisc.y;
    if (W == 0.0 || iRise < 0.02 || has(fl, 1.0) || has(fl, 4.0) || has(fl, 16.0)) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
    float cy = cos(iMisc.x), sy = sin(iMisc.x); vec3 ax = vec3(cy, 0.0, -sy);
    float len = (iSize.y * 0.5 + iSize.z * 0.35) * clamp(iRise, 0.0, 1.15);
    vec3 p = vec3(iPos.x, 0.005, iPos.z) + ax * position.x * W * 1.06 + uShadowDir * position.y * len;
    vQ = vec2(position.x * 2.0, position.y); vA = clamp(iRise, 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;
const SHADOW_FS = `uniform float uShadowA; uniform vec3 uShadowCol; varying vec2 vQ; varying float vA;
  void main(){
    float side = 1.0 - smoothstep(0.5, 1.0, abs(vQ.x));
    float a = side * vA * (pow(1.0 - vQ.y, 1.5) * uShadowA + (1.0 - smoothstep(0.0, 0.08, vQ.y)) * 0.22);
    gl_FragColor = vec4(uShadowCol, a);
    #include <colorspace_fragment>
  }`;

const WAVE = 1, GLOW = 2, FLAT = 4, RECT = 8, NOSHADOW = 16, NOTAB = 32, NORIM = 64, NOLIDRIM = 128;
const STIFF = 260, DAMP = 18, DAMP_EDGE = 27;   // (pieces rising at the view edge while walking: hardly any overshoot)
// the field camera stands this much further back than it first did (the player asked to zoom out by half: about
// 1.5x as much map in each direction), and everything tied to the size of the view is scaled with it
const ZOOM = 1.5;
const TELE = 1.69;   // how much further back the long-lens camera stands (tan 15 / tan 9): the same view, far less perspective

function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texOf(canvas, { repeat = false, mip = true, nearest = true, flip = false } = {}) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.flipY = flip;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : (nearest ? THREE.NearestFilter : THREE.LinearFilter); t.generateMipmaps = mip;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------- quality
export function pickQuality() {
  let q = 'high';
  try { const s = localStorage.getItem('lq2_quality'); if (s) return s; } catch (e) {}
  // phones and tablets: the one post pass but a lower resolution; a frame-rate watchdog in main.js steps down further
  const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window, mem = navigator.deviceMemory || 4;
  if (touch && mem <= 2) q = 'low'; else if (touch) q = 'medium';
  return q;
}

export class View {
  constructor(canvas, quality) {
    this.canvas = canvas; this.quality = quality;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping; r.shadowMap.enabled = false;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x24160c);
    this.camera = new THREE.PerspectiveCamera(18, 16 / 9, 2, 200);
    const C = (h) => new THREE.Color(h);
    this.grainTex = texOf(grainCanvas(256), { repeat: true, nearest: false });
    // uniforms shared by every paper material (one object each, so a change reaches all of them)
    this.U = {
      uTime: { value: 0 }, uLampDir: { value: new THREE.Vector3(-0.55, 0.75, 0.38).normalize() }, uLampCol: { value: C(0xffe6c4).multiplyScalar(0.46) }, uAmb: { value: C(0xd8d2cc) },
      uLantern: { value: new THREE.Vector4(0, 0, 0, 0) }, uLanternR: { value: 7 }, uLanternCol: { value: C(0xffc890) }, uFog: { value: new THREE.Vector3(10, 20, 0) }, uFogCol: { value: C(0x000000) },
      uPaper: { value: C(0xf3e8cf) }, uBorder: { value: C(0xfffcf2) }, uCut: { value: C(0xb8ac94) }, uEdge: { value: C(0xcbbd9f) }, uGrain: { value: this.grainTex },
      uShadowDir: { value: new THREE.Vector3(0.92, 0, -0.12) }, uShadowA: { value: 0.42 }, uSpot: { value: new THREE.Vector3(0, 0, 0.35) }, uShadowCol: { value: C(0x2a1a0a) },
    };
    this.buildAtlas();
    this.cardGeo = cardGeometry();
    const blobC = canvasOf(64, 64), bg = blobC.getContext('2d'), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bg.fillStyle = gr; bg.fillRect(0, 0, 64, 64);
    this.blobGeo = new THREE.PlaneGeometry(0.62, 0.42); this.blobGeo.rotateX(-Math.PI / 2);
    this.blobMat = new THREE.MeshBasicMaterial({ map: texOf(blobC, { nearest: false }), color: 0x3a2410, transparent: true, depthWrite: false });
    this.woodTex = texOf(woodCanvas(256), { repeat: true, nearest: false }); this.edgeTex = texOf(edgeCanvas(), { repeat: true, nearest: false });
    this.post = quality !== 'low';
    const gl = r.getContext();
    this.msaa = this.post && r.capabilities.isWebGL2 && !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')) && !new URLSearchParams(location.search).has('nomsaa');
    if (this.post) this.makeComposer();
    this.group = null; this.actors = new Map(); this.time = 0; this.cam = new THREE.Vector3(); this.camReady = false;
    this.lastCheck = new THREE.Vector3(1e9, 0, 0); this.fold = false; this.recheck = true; this.animating = false; this.cheap = false;
    this.pm = new THREE.Matrix4();
    this.initTurn();
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    const touch = (navigator.maxTouchPoints || 0) > 0;
    // (phones get 1.25 too since the zoom-out made the cards smaller: their picture is small, so it stays cheap, and
    // the frame-rate watchdog drops it back to 1 first)
    let pr = Math.min(window.devicePixelRatio || 1, this.quality === 'high' || (touch && this.quality === 'medium') ? 1.25 : 1, this.prCap || 9);
    if (touch) pr = Math.max(1, Math.min(pr, Math.sqrt(2000000 / (w * h))));
    // never render the 3D map taller than 720 pixels (680 on phones and tablets: a little more than before the
    // zoom-out, so the smaller cards stay sharp enough to read)
    pr = Math.min(pr, (touch ? 680 : 720) / h);
    if (this.quality === 'low') pr = Math.min(pr, 1);
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.aspect = w / h;
    if (this.composer) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); this.grade.uniforms.res.value.copy(this.renderer.getDrawingBufferSize(new THREE.Vector2())); }
    this.recheck = true;
  }
  makeComposer() {
    const r = this.renderer, size = r.getDrawingBufferSize(new THREE.Vector2());
    if (this.composer) { this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); }
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.msaa ? 4 : 0 }));
    this.composer.writeBuffer.samples = 0;   // (the scene is drawn into readBuffer; the other target is never drawn now)
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.grade = new ShaderPass(Final); this.grade.needsSwap = false; this.composer.addPass(this.grade);
  }
  // a step of the frame-rate watchdog: no multisampling (the cut-outs go back to the alpha test)
  dropMSAA() {
    if (!this.msaa) return false;
    this.msaa = false; const fade = this.grade.uniforms.fade.value, flash = this.grade.uniforms.flash.value;
    this.makeComposer(); this.grade.uniforms.fade.value = fade; this.grade.uniforms.flash.value = flash; this.resize();
    const fix = (m) => { if (m && m.defines && 'A2C' in m.defines) { delete m.defines.A2C; m.alphaToCoverage = false; m.needsUpdate = true; } };
    if (this.P) { fix(this.P.card.material); fix(this.P.edge.material); }
    for (const a of this.actors.values()) fix(a.mat);
    return true;
  }
  // the weakest step of the frame-rate watchdog: no card edges, no pop-up shadows
  setCheap() { this.cheap = true; if (this.P) { this.P.edge.visible = false; this.P.shadow.visible = false; } }

  // ---------------------------------------------------------------- the texture atlas (every tile face and sprite)
  buildAtlas() {
    const S = 2048, c = canvasOf(S, 2048), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    let x = 0, y = 0, rowH = 0; const R = this.rects = {};
    const place = (w, h) => { if (x + w > S) { x = 0; y += rowH + 2; rowH = 0; } const p = [x, y]; x += w + 2; rowH = Math.max(rowH, h); return p; };
    for (const name of Object.keys(FACES)) {   // tile faces at 4x, with 4 wrapped pixels round them so mipmaps don't bleed
      const t = tex(name), [px, py] = place(72, 72);
      g.save(); g.beginPath(); g.rect(px, py, 72, 72); g.clip();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) g.drawImage(t, 0, 0, 16, 16, px + 4 + dx * 64, py + 4 + dy * 64, 64, 64);
      g.restore(); R['t:' + name] = { x: px + 4, y: py + 4, w: 64, h: 64 };
    }
    for (const name of [...Object.keys(SPR), ...Object.keys(POP)]) {
      const s = spr(name), d = dieCut(s, 4, 6, 5), [px, py] = place(d.width, d.height);
      g.drawImage(d, px, py); R[name] = { x: px, y: py, w: d.width, h: d.height, aw: s.width, ah: s.height };
    }
    const H = Math.ceil((y + rowH + 2) / 4) * 4, out = canvasOf(S, H); out.getContext('2d').drawImage(c, 0, 0);
    for (const r of Object.values(R)) r.uv = [r.x / S, r.y / H, r.w / S, r.h / H];
    this.atlas = texOf(out, { nearest: false }); this.atlas.anisotropy = 4;
  }

  // ---------------------------------------------------------------- materials
  cardMaterial(map, edge = false) {
    const defines = {}; if (edge) defines.EDGE = 1; if (this.msaa) defines.A2C = 1;
    return new THREE.ShaderMaterial({ uniforms: { ...this.U, uAtlas: { value: map || this.atlas } }, vertexShader: CARD_VS, fragmentShader: CARD_FS, side: THREE.DoubleSide, defines, alphaToCoverage: !!this.msaa });
  }

  // ---------------------------------------------------------------- building a map
  clear() {
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((o) => { if (o.isMesh && o.geometry !== this.blobGeo && o.geometry !== this.cardGeo) o.geometry.dispose(); if (o.material && o.material !== this.blobMat) [].concat(o.material).forEach((m) => m.dispose()); });
    }
    if (this.groundTex) { this.groundTex.dispose(); this.groundTex = null; }
    for (const a of this.actors.values()) a.dispose(); this.actors.clear();
    this.group = new THREE.Group(); this.scene.add(this.group); this.dyn = {}; this.list = []; this.P = null;
    this.stretch = 1 / Math.cos(this.pitch());
    this.recheck = true; this.entry = true; this.lastCheck.set(1e9, 0, 0);   // (a page turn keeps everything folded until the leaf turns)
  }
  // a sprite pop-up: art `w` tiles wide, standing at (x, z)
  sprite(name, x, z, w = 1, o = {}) {
    const R = this.rects[name], S = this.stretch; if (!o.free) w = R.aw / 16; const k = w / (R.aw * 4);
    // cards on one row stand in the same plane and the wide ones overlap their neighbours: a hair of depth per column
    // (invisible, 0-0.012 of a tile) keeps them from z-fighting
    z += (((Math.floor(x) % 4) + 4) % 4) * 0.004;
    return this.push({ x, y: o.y || 0, z, b: 6 * k * S, w: R.w * k * (o.flip ? -1 : 1), h: R.h * k * S, uv: R.uv, yaw: o.yaw ?? 0, flags: o.flags || 0, ph: o.ph || 0 });
  }
  // a rectangular card printed with a tile face (repeated `rep` times across), optionally with a lid / roof flap
  card(face, x, z, w, h, o = {}) {
    const R = this.rects['t:' + face];
    const L = o.lid ? this.rects['t:' + o.lid] : null;
    return this.push({ x, y: 0, z, b: 0, w, h, d: o.d || 0, la: o.la ?? Math.PI / 2, uv: R.uv, uv2: L ? L.uv : R.uv, yaw: o.yaw || 0, flags: RECT | NOTAB | (o.flags || 0), rep: o.rep || Math.max(1, Math.round(w)) });
  }
  push(p) { this.list.push(p); return this.list.length - 1; }
  // pack the pieces into instanced attributes: one draw for the cards, one for their edges, one for their shadows
  finishPieces() {
    const L = this.list, n = Math.max(1, L.length);
    const A = (k) => new Float32Array(n * k);
    const pos = A(4), size = A(4), uv = A(4), uv2 = A(4), misc = A(4), roll = A(2), rise = A(1);
    L.forEach((p, i) => {
      pos.set([p.x, p.y, p.z, p.b], i * 4); size.set([p.w, p.h, p.d || 0, p.la ?? Math.PI / 2], i * 4); uv.set(p.uv, i * 4); uv2.set(p.uv2 || p.uv, i * 4);
      misc.set([p.yaw || 0, p.flags || 0, p.rep || 1, p.ph || 0], i * 4);
    });
    const g = new THREE.InstancedBufferGeometry(); g.index = this.cardGeo.index; g.setAttribute('position', this.cardGeo.attributes.position);
    const ia = (arr, k) => new THREE.InstancedBufferAttribute(arr, k);
    const P = this.P = { n: L.length, pos: ia(pos, 4), size: ia(size, 4), uv: ia(uv, 4), uv2: ia(uv2, 4), misc: ia(misc, 4), roll: ia(roll, 2), rise: ia(rise, 1) };
    P.rise.setUsage(THREE.DynamicDrawUsage);
    for (const [k, a] of [['iPos', P.pos], ['iSize', P.size], ['iUV', P.uv], ['iUV2', P.uv2], ['iMisc', P.misc], ['iRoll', P.roll], ['iRise', P.rise]]) g.setAttribute(k, a);
    g.instanceCount = L.length;
    P.card = new THREE.Mesh(g, this.cardMaterial()); P.card.frustumCulled = false;
    P.edge = new THREE.Mesh(g, this.cardMaterial(null, true)); P.edge.frustumCulled = false;
    const sg = new THREE.InstancedBufferGeometry(); sg.setIndex([0, 1, 2, 0, 2, 3]); sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    for (const [k, a] of [['iPos', P.pos], ['iSize', P.size], ['iMisc', P.misc], ['iRise', P.rise]]) sg.setAttribute(k, a);
    sg.instanceCount = L.length;
    P.shadow = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: this.U, vertexShader: SHADOW_VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    P.shadow.frustumCulled = false; P.shadow.renderOrder = 1;
    if (this.cheap) { P.edge.visible = false; P.shadow.visible = false; }
    this.group.add(P.card, P.edge, P.shadow);
    // pop-up animation state
    P.tgt = new Uint8Array(n); P.dmp = new Float32Array(n).fill(DAMP); P.vel = new Float32Array(n); P.delay = new Float32Array(n); P.act = new Uint8Array(n); P.active = [];
    P.flags = L.map((p) => p.flags || 0); P.cx = L.map((p) => p.x); P.cz = L.map((p) => p.z); P.cy = L.map((p) => p.h * 0.35);
    P.w = L.map((p) => p.w); P.hx = L.map((p) => Math.cos(p.yaw || 0) * Math.abs(p.w) / 2); P.hz = L.map((p) => -Math.sin(p.yaw || 0) * Math.abs(p.w) / 2);
    this.list = null;
  }
  // show or hide pieces (doors, gates, the palisade, the rope bridge)
  setVis(list, on) { if (!this.P || !list) return; for (const i of list) this.P.size.array[i * 4] = on ? this.P.w[i] : 0; this.P.size.needsUpdate = true; this.dirty = true; }
  setUV(i, name) { const r = this.rects[name]; if (!this.P || !r) return; this.P.uv.array.set(r.uv, i * 4); this.P.uv.needsUpdate = true; this.dirty = true; }

  // the ground printed on the page: one canvas, 16 pixels a tile; `at(x, z)` names the tile face (or null for blank)
  // deco: { kind(x, z) -> 'water' | 'mount' | 'snow' | 'forest' | 'land' | null, seal: text, small: text } (light pages only)
  printGround(x0, z0, x1, z1, at, deco = null) {
    const M = 2, T = 16, W = x1 - x0, H = z1 - z0, c = canvasOf((W + 2 * M) * T, (H + 2 * M) * T), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      const f = at(x, z); if (!f) continue;
      const t = tex(f), ox = t.width > 16 ? ((x & 1) * 16) : 0, oy = t.height > 16 ? ((z & 1) * 16) : 0;
      g.drawImage(t, ox, oy, 16, 16, (x - x0 + M) * T, (z - z0 + M) * T, T, T);
    }
    if (deco) {
      if (deco.kind) inkWash(g, W, H, (x, z) => deco.kind(x + x0, z + z0), M * T, M * T, T, W * 7 + H);
      // the 回紋 border runs round the margin, 3/4 of a tile outside the map; seals at two corners
      const b0 = Math.round(M * T - 1.25 * T), b1x = Math.round((W + M) * T + 1.25 * T), b1y = Math.round((H + M) * T + 1.25 * T);
      fretBorder(g, b0, b0, b1x, b1y, 8);
      g.imageSmoothingEnabled = false;
      if (deco.seal) { const sc = sealCanvas(deco.seal, 22, 'white', W + H); g.drawImage(sc, b1x - 30, b1y - 30); }
      if (deco.small) { const sc = sealCanvas(deco.small, 14, 'red', W * 3 + H); g.drawImage(sc, b0 + 4, b0 + 4); }
    }
    this.groundTex = texOf(c, { nearest: false });
    this.book(x0, z0, x1, z1, M);
  }
  // the open book: the page (with the print on it), the stacked page edges, the cover and the table round it
  book(x0, z0, x1, z1, M = 0) {
    const m = 1.5, px0 = x0 - m, pz0 = z0 - m, px1 = x1 + m, pz1 = z1 + m, cx = (px0 + px1) / 2, cz = (pz0 + pz1) / 2, W = px1 - px0, H = pz1 - pz0;
    const gm = new THREE.ShaderMaterial({ uniforms: { ...this.U, uMap: { value: this.groundTex }, uPrint: { value: new THREE.Vector4(x0 - M, z0 - M, x1 + M, z1 + M) }, uPage: { value: new THREE.Vector4(px0, pz0, px1, pz1) }, uGutter: { value: cx }, uInk: { value: new THREE.Color(0xfaf0dc) } }, vertexShader: GROUND_VS, fragmentShader: GROUND_FS });
    const pg = new THREE.PlaneGeometry(W, H); pg.rotateX(-Math.PI / 2); const page = new THREE.Mesh(pg, gm); page.position.set(cx, 0, cz); this.group.add(page);
    // page edges: four sides of a box under the page, in one draw
    const T = 0.34, e = 0.08, pos = [], uv = [], idx = [];
    const quad = (a, b, len) => { const i = pos.length / 3; pos.push(...a[0], ...a[1], ...b[1], ...b[0]); uv.push(0, 1, len, 1, len, 0, 0, 0); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    const c4 = [[px0 - e, pz1 + e], [px1 + e, pz1 + e], [px1 + e, pz0 - e], [px0 - e, pz0 - e]];
    for (let i = 0; i < 4; i++) { const [ax, az] = c4[i], [bx, bz] = c4[(i + 1) % 4]; quad([[ax, -0.003, az], [bx, -0.003, bz]], [[ax, -T, az], [bx, -T, bz]], Math.hypot(bx - ax, bz - az) / 2); }
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); eg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); eg.setIndex(idx);
    this.envMats = [];
    const em = new THREE.MeshBasicMaterial({ map: this.edgeTex, side: THREE.DoubleSide }); this.group.add(new THREE.Mesh(eg, em));
    const cm = new THREE.MeshBasicMaterial({ color: 0x7a2418, map: this.grainTex }); const cover = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, 0.16, H + 0.7), cm); cover.position.set(cx, -T - 0.08, cz); this.group.add(cover);
    const wt = this.woodTex; wt.repeat.set(12, 12);
    const tm = new THREE.MeshBasicMaterial({ map: wt, color: 0xd8c0a8 }); const tg = new THREE.PlaneGeometry(150, 150); tg.rotateX(-Math.PI / 2);
    const table = new THREE.Mesh(tg, tm); table.position.set(cx, -T - 0.16, cz); this.group.add(table);
    this.envMats.push([em, 0xffffff], [cm, 0x7a2418], [tm, 0xd8c0a8]);
  }

  // the overworld: rows of tile letters plus the places and which gates are open
  buildWorld(W, places, open, signs = []) {
    this.clear(); const rows = W; const H = rows.length, Wd = rows[0].length; this.size = [Wd, H];
    const r = mulberry(5), dyn = this.dyn; dyn.rope = []; dyn.chain = []; dyn.ice = [];
    const LAND = { '.': 'grass', '=': 'road', f: 'forestFloor', h: 'grass', s: 'sand', w: 'swamp', n: 'snow', M: 'grass', N: 'snow', b: 'bambooFloor', V: 'volcRock', K: 'snow' };
    const ground = [];
    for (let z = 0; z < H; z++) { ground.push([]); for (let x = 0; x < Wd; x++) {
      const c = rows[z][x];
      let f = LAND[c] || 'grass';
      if (c === '~' || c === 'H' || c === 'X') f = 'water';
      else if (f === 'grass' && ((x * 7 + z * 13) % 5 === 0 || Math.sin(x * 0.7) + Math.cos(z * 0.6) > 1.3)) f = 'grass2';
      ground[z].push(f);
      if (c === '~' && (((z % 3) + 3) % 3 === 0 && (((x + (z % 2 ? 3 : 0)) % 6) + 6) % 6 === 0)) this.sprite('wave', x + 0.5, z + 0.6, 0.7, { flags: WAVE | NOTAB, ph: r() * 6.3, flip: false });
      if (c === 'X') { dyn.rope.push(this.card('plank', x + 0.5, z + 1, 1, 1, { flags: FLAT | NOSHADOW, rep: 1 })); if (x % 2 === 0) this.sprite('sign', x + 0.5, z + 0.95, 0.35, { flags: NOTAB }); }
      if (c === 'H') dyn.chain.push(this.sprite('chain', x + 0.5, z + 0.6, 1.1, { flags: NOTAB }));
      if (c === 'K') dyn.ice.push(this.sprite('icewall', x + 0.5, z + 0.7, 1.2));
      if (c === 'b') { const n = 1; for (let i = 0; i < n; i++) this.sprite('bamboo', x + 0.5, z + 0.6, 0.75, { yaw: 0 }); }
      if (c === 'V') this.sprite('volcanopeak', x + 0.5, z + 0.7, 1.5, { yaw: 0, flip: false });
      if (c === 'f') { const n = 1; for (let i = 0; i < n; i++) { const pine = r() < 0.4; this.sprite(pine ? 'cpine' : 'tree', x + 0.5, z + 0.6, (pine ? 1.45 : 1.05), { yaw: 0, flip: false }); } }
      if (c === 'h') { this.sprite('chill', x + 0.5, z + 0.5, 0.95, { flip: false }); }
      if (c === 'M') this.sprite(r() < 0.5 ? 'cmount' : 'cmount2', x + 0.5, z + 0.7, 1.75, { yaw: 0, flip: false });
      if (c === 'N') this.sprite('csnowmount', x + 0.5, z + 0.7, 1.75, { yaw: 0, flip: false });
      if (c === '=' && ((rows[z][x - 1] === '~' && rows[z][x + 1] === '~') || ((rows[z - 1] || '')[x] === '~' && (rows[z + 1] || '')[x] === '~'))) this.sprite('cbridge', x + 0.5, z + 0.75, 1.6, { yaw: rows[z][x - 1] === '~' ? Math.PI / 2 : 0, flags: NOSHADOW });
      if (c === 'n' && r() < 0.08) this.sprite('snowpine', x + 0.5, z + 0.6, 1);
      if (c === 's' && r() < 0.03) this.sprite('palm', x + 0.5, z + 0.6, 1);
      if (c === 'w' && r() < 0.1) this.sprite('deadtree', x + 0.5, z + 0.6, 0.9);
      if (c === '.' && r() < 0.02) this.sprite('bush', x + 0.5, z + 0.6, 0.6);
    } }
    for (const [x, z, look] of Object.values(places)) this.placeModel(x, z, look);
    for (const [x, z] of signs) this.sprite('sign', x + 0.5, z + 0.6, 0.85);
    const WK = { '~': 'water', c: 'water', M: 'mount', N: 'snow', f: 'forest' };
    this.printGround(0, 0, Wd, H, (x, z) => ground[z][x], { kind: (x, z) => WK[rows[z][x]] || 'land', seal: SEAL_WORLD, small: SEAL_WORLD.slice(0, 2) });
    this.finishPieces(); this.setOpen(open);
    this.camDist = 21 * ZOOM; this.theme({ paper: 0xf3e8cf }); this.dark(false);
  }
  setOpen(open) { this.setVis(this.dyn.rope, !!open.X); this.setVis(this.dyn.chain, !open.H); this.setVis(this.dyn.ice, !open.K); }
  // towns, caves and towers on the world map: two or three cut-out layers stood one behind the other
  placeModel(x0, z0, look) {
    const L = { town: [['town_b', 1.7, -0.12], ['town_f', 1.8, 0.32]], city: [['city_b', 1.85, -0.12], ['city_f', 1.95, 0.34]], village: [['village_b', 1.65, -0.05], ['village_f', 1.7, 0.34]],
      pavilion: [['pavilion', 1.55, 0.2]], temple: [['temple', 1.75, 0.2]], tower: [['tower', 0.95, 0.2]], fort: [['fort_b', 0.85, -0.15], ['fort_f', 1.85, 0.34]], desertfort: [['desertfort_b', 0.75, -0.2], ['desertfort_f', 1.8, 0.34]],
      tomb: [['tomb', 1.65, 0.2]], cave: [['cave', 1.65, 0.25]], lair: [['lair', 1.75, 0.2]], grove: [['cpine', 1.6, 0.1]],
      ranch: [['ranch_b', 1.6, -0.1], ['ranch_f', 1.8, 0.34]], port: [['port_b', 1.75, -0.08], ['port_f', 1.8, 0.36]], mansion: [['willow', 0.9, -0.2, -0.6], ['mansion', 1.7, 0.2]], miao: [['bamboo', 0.7, -0.3, 0.7], ['miao', 1.75, 0.2]],
      volcano: [['volcano', 1.9, 0.2]], yurts: [['yurts', 1.8, 0.2]], pagoda: [['pagoda', 1.15, 0.2]], fortress: [['fortress', 1.95, 0.25]], bamboo: [['bambooGrove', 1.6, 0.2]], swampgrove: [['swampGrove', 1.6, 0.2]],
      icecave: [['icecave', 1.65, 0.25]], belltemple: [['belltemple', 1.8, 0.2]] }[look] || [];
    for (const [name, w, dz, dx = 0] of L) this.sprite(name, x0 + 0.5 + dx, z0 + 0.5 + dz, w);
  }

  // an interior map (town or dungeon)
  buildMap(M, state) {
    this.clear();
    const theme = THEMES[M.theme] || THEMES.town; const rows = M.rows, H = rows.length, W = rows[0].length; this.size = [W, H];
    const r = mulberry(9);
    const floorOf = (c) => {
      if (c === ',' || c === '"' || c === '%') return theme.grass ? 'grass' : theme.floor;
      if (c === ':') return theme.pave || 'pave'; if (c === 'o' || c === 'b' || c === 't' || c === 'k' || c === '=') return 'wood';
      if (c === 'n') return 'snow'; if (c === 's') return 'sand'; if (c === 'm') return 'carpet'; if (c === 'e') return 'plank'; if (c === '^') return 'ice';
      if (c === 'f') return 'flowersG'; if (c === 'j') return theme.grass ? 'bambooFloor' : theme.floor; if (c === '$') return theme.floor;
      return theme.floor;
    };
    this.chests = {}; this.doors = {}; this.gates = {}; this.dyn.doors = {}; this.dyn.gates = {}; this.dyn.chests = {};
    // an apron of scenery round the edge so the map does not end at its last row
    const apron = M.apron || { town: '"', village: '"', city: '"', temple: '"', pavilion: '~', forest: '"', desert: 's', fort: '#', canal: '"', port: '~', ranch: '"', bamboo: 'j', jungle: 'j', snowcamp: 'n', isle: '~', volcvillage: 'V', swamp: 'w' }[M.theme];
    const A = apron ? (apron === '~' ? 10 : 17) : 0, x0 = -A, z0 = -A, x1 = W + A, z1 = H + A;
    const G = {}; const solid = {};   // printed face per tile; standing blocks per tile
    const key = (x, z) => x + ',' + z;
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      const inside = z >= 0 && z < H && x >= 0 && x < W;
      if (inside && rows[z][x] !== ' ') continue;
      if (!apron) continue;
      if (apron === '~') { G[key(x, z)] = 'water'; if ((((z % 3) + 3) % 3 === 0 && (((x + (z % 2 ? 3 : 0)) % 6) + 6) % 6 === 0)) this.sprite('wave', x + 0.5, z + 0.6, 0.7, { flags: WAVE | NOTAB, ph: r() * 6.3, flip: false }); continue; }
      if (apron === '#') { G[key(x, z)] = theme.wallTop; solid[key(x, z)] = 'wall'; continue; }
      if (apron === 's') { G[key(x, z)] = 'sand'; if (r() < 0.06) this.sprite('palm', x + 0.5, z + 0.6, 1); continue; }
      if (apron === 'j') { G[key(x, z)] = 'bambooFloor'; if (r() < 0.5) this.sprite('bamboo', x + 0.5, z + 0.6, 0.9); continue; }
      if (apron === 'n') { G[key(x, z)] = 'snow'; if (r() < 0.25) this.sprite('snowpine', x + 0.5, z + 0.5, 1); continue; }
      if (apron === 'V') { G[key(x, z)] = 'volcRock'; if (r() < 0.12) this.sprite('rock', x + 0.5, z + 0.6, 0.8); continue; }
      if (apron === 'w') { G[key(x, z)] = 'mud'; if (r() < 0.1) this.sprite('deadtree', x + 0.5, z + 0.6, 0.9); else if (r() < 0.1) this.sprite('reed', x + 0.5, z + 0.6, 0.6); continue; }
      G[key(x, z)] = M.theme === 'forest' ? 'forestFloor' : 'grass';
      if (r() < (M.theme === 'forest' ? 0.75 : 0.45)) { const pine = r() < (M.theme === 'forest' ? 0.3 : 0.45); this.sprite(pine ? 'cpine' : 'tree', x + 0.5, z + 0.6, (pine ? 1.5 : 1.1), { yaw: 0, flip: false }); }
    }
    let ci = 0; const tree = M.theme === 'snowpeak' ? 'snowpine' : 'tree';
    const townish = !theme.card && !M.dark && /town|village|city|temple|pavilion|canal|port|isle|belltemple|fortress|ranch/.test(M.theme), holy = /temple|pavilion|belltemple/.test(M.theme);
    const TOWNTREES = [['cpine', 1.5], ['cwillow', 1.45], ['cplum', 1.3], ['tree', 1.15], ['cpine', 1.6], ['cbamboo', 1.0]];
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      let c = rows[z][x]; if (c === ' ') continue;
      if (/[A-Z]/.test(c)) c = M.floor || '.';
      const k = key(x, z);
      if (c === '~') { G[k] = 'water'; if ((((z % 3) + 3) % 3 === 0 && (((x + (z % 2 ? 3 : 0)) % 6) + 6) % 6 === 0)) this.sprite('wave', x + 0.5, z + 0.6, 0.7, { flags: WAVE | NOTAB, ph: r() * 6.3, flip: false }); continue; }
      if (c === 'v') { G[k] = 'void'; continue; }
      if (c === '#') { G[k] = theme.wallTop; solid[k] = 'wall'; continue; }
      if (c === 'h') { G[k] = 'plasterTop'; solid[k] = 'house'; continue; }
      if (c === 'x' && theme.fortFence) { G[k] = 'palisadeTop'; solid[k] = 'pal'; continue; }
      G[k] = floorOf(c);
      const cx = x + 0.5, yaw = 0;
      if (c === '"' && M.theme === 'forest') { G[k] = 'leafTop'; solid[k] = 'hedge'; if (r() < 0.22) this.sprite('tree', cx, z + 0.45, 0.9, { y: 0.8, flags: NOSHADOW | NOTAB }); }
      else if (c === '"' && townish) { const [nm, w] = TOWNTREES[Math.floor(r() * TOWNTREES.length)]; this.sprite(nm, cx, z + 0.55, w, { yaw, flip: false }); }
      else if (c === '"') this.sprite(tree, cx, z + 0.55, 1.15, { yaw });
      else if (c === '%') this.sprite('bush', cx, z + 0.6, 0.9, { yaw });
      else if (c === 'p') this.sprite('pot', cx, z + 0.6, 0.7, { yaw });
      else if (c === 'r') this.sprite(townish ? 'crock' : 'rock', cx, z + 0.6, 0.85, { yaw });
      else if (c === 'u') this.sprite(townish && !holy ? 'clion' : 'statue', cx, z + 0.5, 0.9);
      else if (c === 'l') this.sprite('lamp', cx, z + 0.5, 0.9);
      else if (c === '&' && holy) this.sprite('cincense', cx, z + 0.5, 0.85);
      else if (c === '&') { const R0 = this.rects.brazier, bh = R0.ah / 16 * this.stretch; this.sprite('brazier', cx, z + 0.5, 0.7); this.sprite('fire', cx, z + 0.52, 0.55, { free: true, y: bh * 0.62, flags: GLOW | NOSHADOW | NOTAB }); }
      else if (c === 'w') this.sprite('well', cx, z + 0.6, 0.9);
      else if (c === 'j') this.sprite('bamboo', cx, z + 0.55, 0.85, { yaw });
      else if (c === 'y') { G[k] = 'water'; this.sprite('lotus', cx, z + 0.6, 0.85, { flags: NOTAB }); }
      else if (c === 'a') { G[k] = 'lava'; if (r() < 0.3) this.sprite('fire', cx, z + 0.6, 0.45, { free: true, flags: GLOW | NOSHADOW | NOTAB }); }
      else if (c === '$') this.sprite('yurt', cx, z + 0.7, 1.4);
      else if (c === '!') this.sprite('banner', cx, z + 0.55, 0.6);
      else if (c === '*') this.sprite('crystal', cx, z + 0.6, 0.7, { flags: GLOW });
      else if (c === '?') this.sprite('sign', cx, z + 0.6, 0.75);
      else if (c === '@') this.sprite('cage', cx, z + 0.6, 0.95);
      else if (c === '_') { this.sprite('willow', cx, z + 0.55, 1.15, { yaw }); }
      else if (c === '+') { this.sprite('greatbell', cx, z + 0.6, 1.1); }
      else if (c === ';') { this.sprite('reed', cx, z + 0.6, 0.7, { yaw }); }
      else if (c === '<') { G[k] = 'water'; this.sprite('hotspring', cx, z + 0.6, 1, { flags: NOTAB | NOSHADOW }); }
      else if (c === 'x') this.sprite('fence', cx, z + 0.5, 1);
      else if (c === 'i') this.card('templeWall', cx, z + 0.66, 0.32, 1.25, { lid: 'templeWallTop', d: 0.32, rep: 1 });
      else if (c === 'b') this.card('wood', cx, z + 0.95, 0.8, 0.3, { lid: 'bed', d: 0.9, rep: 1 });
      else if (c === 't') this.card('wood', cx, z + 0.9, 0.8, 0.4, { lid: 'table', d: 0.8, rep: 1 });
      else if (c === 'q') this.card('wood', cx, z + 0.95, 0.6, 0.35, { lid: 'coffin', d: 0.9, rep: 1 });
      else if (c === 'k') this.card('shelf', cx, z + 0.75, 1, 0.9, { lid: 'wood', d: 0.5, rep: 1 });
      else if (c === '=') this.card('counter', cx, z + 1, 1, 0.45, { lid: 'counter', d: 1, rep: 1 });
      else if (c === 'd') { this.doors[k] = [x, z]; this.dyn.doors[k] = [this.card('door', cx, z + 1, 1, 0.85, { rep: 1 })]; }
      else if (c === 'g') { this.gates[k] = [x, z]; this.dyn.gates[k] = [this.card('gate', cx, z + 0.9, 1, 0.85, { rep: 1, flags: NOSHADOW })]; }
      else if (c === 'c') { this.chests[k] = { x, z, i: ci++ }; this.dyn.chests[k] = this.sprite('chest', cx, z + 0.55, 0.75); }
      else if (/[1-9]/.test(c)) G[k] = 'stairs';
    }
    // walls, houses and palisades: a card on the south edge of every tile (cut-outs stood one behind another), merged
    // along each row; the front one shows the wall (a house gets a roof flap), the ones behind show the top; and side
    // planes where a block ends
    const KIND = { wall: { h: theme.wallH || 1, face: theme.wall, back: theme.wallTop }, house: { h: 0.85, face: 'plaster', back: 'roofTile', lid: 'roofTile' }, pal: { h: 0.9, face: 'palisade', back: 'palisadeTop' }, hedge: { h: 0.8, face: 'leafSide', back: 'leafTop' } };
    const at = (x, z) => solid[key(x, z)];
    for (let z = z0; z < z1; z++) {
      let x = x0;
      while (x < x1) {
        const kd = at(x, z); if (!kd) { x++; continue; }
        const front = at(x, z + 1) !== kd; let e = x + 1;
        while (e < x1 && at(e, z) === kd && (at(e, z + 1) !== kd) === front) e++;
        const K = KIND[kd], n = e - x;
        // houses: the facade with a roof flap, roof layers behind; walls, hedges, palisades: box pop-ups (a face with a lid)
        if (kd === 'house') {
          if (front) {
            this.card(K.face, (x + e) / 2, z + 1, n, K.h, { lid: K.lid, d: 0.55, la: 1.05, rep: n });
            this.sprite('ceave', x - 0.12, z + 1.02, 0.42, { y: K.h - 0.1, flags: NOTAB | NOSHADOW }); this.sprite('ceave', e + 0.12, z + 1.02, 0.42, { y: K.h - 0.1, flip: true, flags: NOTAB | NOSHADOW });
            if (townish) for (let q = x + 1; q < e - 0.5; q += 3) this.sprite('clantern', q + 0.5, z + 1.06, 0.3, { y: K.h - 0.42, flags: NOTAB | NOSHADOW });
          } else this.card(K.back, (x + e) / 2, z + 1, n, K.h, { rep: n });
        }
        else this.card(K.face, (x + e) / 2, z + 1, n, K.h, { lid: K.back, d: 1, rep: n, flags: (front ? 0 : NORIM) | NOLIDRIM });
        x = e;
      }
    }
    for (let x = x0; x < x1; x++) for (const side of [-1, 1]) {
      let z = z0;
      while (z < z1) {
        const kd = at(x, z); if (!kd || at(x + side, z) === kd) { z++; continue; }
        let e = z + 1; while (e < z1 && at(x, e) === kd && at(x + side, e) !== kd) e++;
        const K = KIND[kd], n = e - z;
        this.card(K.face, x + (side > 0 ? 1 : 0), (z + e) / 2, n, K.h, { yaw: side * Math.PI / 2, rep: n, flags: NOSHADOW });
        z = e;
      }
    }
    const light = !theme.card && !M.dark, nm = (M.name && (M.name.zh || M.name[0])) || '';
    const FK = { water: 'water', forestFloor: 'forest', leafTop: 'forest', bambooFloor: 'forest', void: null, chasm: null };
    this.printGround(x0, z0, x1, z1, (x, z) => G[key(x, z)] || null, light ? { kind: (x, z) => { const f = G[key(x, z)]; return f ? (f in FK ? FK[f] : 'land') : null; }, seal: nm.slice(0, 4), small: null } : null);
    this.finishPieces();
    this.refresh(state);
    this.camDist = (M.town ? 16 : 15) * ZOOM;
    this.theme(theme, { dark: M.dark, lanternOn: state.lantern });
  }
  // paper, light and fog for a theme
  theme(T, M = {}) {
    const U = this.U, dark = !!M.dark, card = T.card;
    U.uPaper.value.setHex(T.paper || (card ? 0x3a3a4a : 0xf3e8cf));
    U.uBorder.value.setHex(card ? 0xe4ddce : 0xfffcf2); U.uCut.value.setHex(card ? 0x8a8070 : 0xb8ac94); U.uEdge.value.setHex(card ? 0x6a6458 : 0xcbbd9f);
    const lamp = T.sun ?? 0.85, amb = T.light ?? 0.95;
    U.uAmb.value.setHex(0xd8d2cc).multiplyScalar(0.55 + amb * 0.42); U.uLampCol.value.setHex(0xffe6c4).multiplyScalar(0.2 + lamp * 0.3);
    this.dark(dark, M.lanternOn);
    this.scene.background.setHex(dark ? 0x000000 : 0x24160c);
  }
  // doors opened, chests looted, gates raised
  refresh(state) {
    if (!this.dyn.doors) return;
    for (const [k, l] of Object.entries(this.dyn.doors)) this.setVis(l, !state.isOpen(k));
    for (const [k, l] of Object.entries(this.dyn.gates)) this.setVis(l, !state.isOpen(k));
    for (const [k, i] of Object.entries(this.dyn.chests)) this.setUV(i, state.isOpen(k) ? 'chestOpen' : 'chest');
  }
  dark(on, lantern) {
    this.isDark = on; this.hasLantern = !!lantern; const U = this.U;
    if (on) { U.uAmb.value.setHex(0x282830); U.uLampCol.value.setHex(0x000000); U.uLantern.value.w = lantern ? 1.5 : 0.7; U.uLanternR.value = lantern ? 10.5 : 5; }
    else U.uLantern.value.w = 0;
    const cd = (this.camDist || 15) * TELE; U.uFog.value.set(on ? cd - 4 : 10, on ? cd + (lantern ? 7 : 3) : 20, on ? 1 : 0);
    for (const [m, c] of this.envMats || []) m.color.setHex(c).multiplyScalar(on ? 0.06 : 1);
  }

  // ---------------------------------------------------------------- people (cut-out cards from sprite sheets)
  actor(id, look) { let a = this.actors.get(id); if (!a) { a = new Actor(this, look); this.actors.set(id, a); } return a; }
  drop(id) { const a = this.actors.get(id); if (a) { a.dispose(); this.actors.delete(id); } }
  pitch() { return Math.PI / 2 - (this.aspect < 1 ? 0.95 : 0.86); }    // how far a standing card leans from the view: matches frame()

  // ---------------------------------------------------------------- pop-ups rising and folding
  foldAll(on) { this.fold = on; this.recheck = true; if (!on) this.entry = true; this.dirty = true; }
  updatePieces(dt) {
    const P = this.P; if (!P) return;
    const c = this.camera;
    if (this.recheck || this.cam.distanceToSquared(this.lastCheck) > 0.05) {
      this.recheck = false; this.lastCheck.copy(this.cam);
      c.updateMatrixWorld(); const e = this.pm.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse).elements;
      const entry = this.entry; this.entry = false; const fx = this.cam.x, fz = this.cam.z;
      for (let i = 0; i < P.n; i++) {
        let t = 0;
        if (!this.fold && !(P.flags[i] & FLAT)) {
          // project both ends of the card: a long wall pops up as soon as any of it is in view
          const y = P.cy[i], m = P.tgt[i] ? 1.14 : 0.98;   // hysteresis: up at the edge of the view, folded only well outside it, so pieces on the border never flicker up and down
          let lo = 9, hi = -9, ylo = 9, yhi = -9;
          for (let s2 = -1; s2 <= 1; s2 += 2) {
            const x = P.cx[i] + P.hx[i] * s2, z = P.cz[i] + P.hz[i] * s2, w = e[3] * x + e[7] * y + e[11] * z + e[15];
            if (w < 0.1) { lo = -9; hi = 9; continue; }
            const nx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, ny = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
            lo = Math.min(lo, nx); hi = Math.max(hi, nx); ylo = Math.min(ylo, ny); yhi = Math.max(yhi, ny);
          }
          t = (lo < m && hi > -m && ylo < m && yhi > -m - 0.05) ? 1 : 0;
        }
        if (t !== P.tgt[i] || (entry && t)) {
          P.tgt[i] = t;
          P.delay[i] = entry ? Math.hypot(P.cx[i] - fx, P.cz[i] - fz) * (0.022 / ZOOM) + Math.random() * 0.05 : t ? Math.random() * 0.06 : 0;
          P.dmp[i] = entry ? DAMP : DAMP_EDGE;
          if (!P.act[i]) { P.act[i] = 1; P.active.push(i); }
        }
      }
    }
    const L = P.active; if (!L.length) { this.animating = false; return; }
    const rise = P.rise.array;
    for (let k = L.length - 1; k >= 0; k--) {
      const i = L[k];
      if (P.delay[i] > 0) { P.delay[i] -= dt; continue; }
      const t = P.tgt[i]; let v = P.vel[i] + (STIFF * (t - rise[i]) - P.dmp[i] * P.vel[i]) * dt, x = rise[i] + v * dt;
      if (x < 0) { x = 0; v = -v * 0.25; }
      if (Math.abs(t - x) < 0.003 && Math.abs(v) < 0.03) { x = t; v = 0; P.act[i] = 0; L[k] = L[L.length - 1]; L.pop(); }
      rise[i] = x; P.vel[i] = v;
    }
    P.rise.needsUpdate = true; this.animating = true; this.dirty = true;
  }

  // ---------------------------------------------------------------- per frame
  frame(dt, focus) {
    this.time += dt; this.U.uTime.value = this.time;
    const portrait = this.aspect < 1;
    const base = (this.camDist || 15) * TELE; const dist = portrait ? base * 1.05 : base, el = portrait ? 0.95 : 0.86;      // camera distance and elevation angle
    const want = this._want || (this._want = new THREE.Vector3()); want.set(focus.x, 0, focus.z);
    if (!this.camReady) { this.cam.copy(want); this.camReady = true; this.recheck = true; } else this.cam.lerp(want, Math.min(1, dt * 8));
    const c = this.camera; const fov = portrait ? 23 : 18; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    c.position.set(this.cam.x, this.cam.y + Math.sin(el) * dist, this.cam.z + Math.cos(el) * dist); c.lookAt(this.cam.x, 0.3, this.cam.z);
    this.updatePieces(dt);
    let busy = false; for (const a of this.actors.values()) busy = a.tick(dt) || busy;
    this.settled = this.cam.distanceToSquared(want) < 1e-5 && !this.animating && !busy;   // nothing is gliding, rising or hopping
    this.U.uSpot.value.x = this.cam.x - 3 * ZOOM; this.U.uSpot.value.y = this.cam.z - 2 * ZOOM;
    this.U.uLantern.value.x = focus.x; this.U.uLantern.value.y = 1.4; this.U.uLantern.value.z = focus.z + 0.3;
    if (this.post) this.grade.uniforms.band.value = portrait ? 0.17 : 0.15;
  }
  render() { if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera); }
  fade(v) { this.dirty = true; if (this.composer) this.grade.uniforms.fade.value = v; this.canvas.style.opacity = this.composer ? 1 : String(1 - v); }
  flash(v) { this.dirty = true; if (this.composer) this.grade.uniforms.flash.value = v; }

  // ---------------------------------------------------------------- the page turn (map changes)
  // out: the pop-ups fold flat, the picture is copied onto a paper leaf over the right half (and a still of the left
  // half). in: the new map is built and drawn flat under it, the leaf turns over to the left, the new pop-ups rise.
  initTurn() {
    const scr = this.canvas.parentElement; if (!scr) return;
    const T = this.turnEl = document.createElement('div'); T.className = 'turn hidden';
    T.innerHTML = '<canvas class="tleft"></canvas><div class="leaf"><canvas class="lfront"></canvas><div class="lshade"></div><div class="lback"></div></div>';
    scr.insertBefore(T, this.canvas.nextSibling);
  }
  async turnOut() {
    if (!this.turnEl) return;
    this.foldAll(true);
    const t0 = performance.now(); while (performance.now() - t0 < 320 && (this.animating || performance.now() - t0 < 140)) await raf();
    const T = this.turnEl, w = this.canvas.width, h = this.canvas.height, hw = Math.floor(w / 2);
    const left = T.querySelector('.tleft'), front = T.querySelector('.lfront');
    for (const [cv, sx, sw] of [[left, 0, hw], [front, hw, w - hw]]) { if (cv.width !== sw || cv.height !== h) { cv.width = sw; cv.height = h; } }
    this.render();   // draw and copy in the same task, so the drawing buffer is still there
    left.getContext('2d').drawImage(this.canvas, 0, 0, hw, h, 0, 0, hw, h);
    front.getContext('2d').drawImage(this.canvas, hw, 0, w - hw, h, 0, 0, w - hw, h);
    T.style.setProperty('--split', (hw / w * 100) + '%');
    T.classList.remove('hidden');
  }
  async turnIn() {
    if (!this.turnEl || this.turnEl.classList.contains('hidden')) return;
    const T = this.turnEl, leaf = T.querySelector('.leaf'), left = T.querySelector('.tleft'), shade = T.querySelector('.lshade'), back = T.querySelector('.lback');
    await raf(); await raf();
    this.foldAll(false);
    const D = 620, ease = 'cubic-bezier(.42,.02,.38,1)';
    const a = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: D, easing: ease, fill: 'forwards' });
    shade.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: D / 2, easing: 'ease-in', fill: 'forwards' });
    // faces swap half way (not left to backface-visibility, which Safari handles differently)
    const front = T.querySelector('.lfront');
    back.animate([{ opacity: 0 }, { opacity: 0, offset: 0.49 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: D, easing: ease, fill: 'forwards' });
    front.animate([{ opacity: 1 }, { opacity: 1, offset: 0.49 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: D, easing: ease, fill: 'forwards' });
    shade.animate([{ visibility: 'visible' }, { visibility: 'visible', offset: 0.49 }, { visibility: 'hidden', offset: 0.5 }, { visibility: 'hidden' }], { duration: D, easing: ease, fill: 'forwards' });
    left.animate([{ opacity: 1 }, { opacity: 1, offset: 0.48 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: D, fill: 'forwards' });   // the left still goes once the leaf stands up
    try { await a.finished; } catch (e) { /* cancelled */ }
    T.classList.add('hidden'); for (const el of [leaf, shade, back, left, front]) el.getAnimations().forEach((x) => x.cancel());
    this.dirty = true;
  }
}
const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

// the base card geometry: face (part 0), tab (part 1), lid (part 2); position = (x in -0.5..0.5, y in 0..1, part)
function cardGeometry() {
  const pos = [], idx = [];
  for (let part = 0; part < 3; part++) { const i = pos.length / 3; pos.push(-0.5, 0, part, 0.5, 0, part, 0.5, 1, part, -0.5, 1, part); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

// paper: cream for towns and the wilds; a dark card (charcoal, indigo, plum) for caves and dungeons
const THEMES = {
  town: { floor: 'grass', grass: 1, wall: 'wallStone', wallTop: 'wallStoneTop', paper: 0xf3e8cf },
  village: { floor: 'grass', grass: 1, wall: 'wallStone', wallTop: 'wallStoneTop', paper: 0xf3e8cf },
  city: { floor: 'pave', wall: 'wallStone', wallTop: 'wallStoneTop', grass: 1, paper: 0xf3e8cf },
  pavilion: { floor: 'grass', grass: 1, wall: 'wallStone', wallTop: 'wallStoneTop', paper: 0xf1ead8 },
  temple: { floor: 'grass', grass: 1, wall: 'templeWall', wallTop: 'templeWallTop', pave: 'pave', paper: 0xf3e8cf },
  desert: { floor: 'sand', wall: 'tombWall', wallTop: 'tombWallTop', paper: 0xf2e2c0 },
  forest: { floor: 'forestFloor', grass: 1, wall: 'rockSide', wallTop: 'rockTop', light: 0.8, sun: 0.65, paper: 0xe6dcc0 },
  fort: { floor: 'road', wall: 'fortWall', wallTop: 'palisadeTop', fortFence: 1, paper: 0xe8dcc0 },
  sea: { floor: 'caveFloor', wall: 'wallCave', wallTop: 'wallCaveTop', light: 0.7, sun: 0.5, card: 1, paper: 0x2c3a56 },
  cave: { floor: 'caveFloor', wall: 'wallCave', wallTop: 'wallCaveTop', light: 0.7, sun: 0.5, card: 1, paper: 0x34343e },
  tower: { floor: 'floor', wall: 'templeWall', wallTop: 'templeWallTop', light: 0.8, sun: 0.6, pave: 'floor', card: 1, paper: 0x4a3426 },
  tomb: { floor: 'tombFloor', wall: 'tombWall', wallTop: 'tombWallTop', card: 1, paper: 0x2e261e },
  ice: { floor: 'snow', wall: 'iceWall', wallTop: 'iceWallTop', light: 0.85, sun: 0.6, card: 1, paper: 0x34465e },
  snowpeak: { floor: 'snow', wall: 'snowRockSide', wallTop: 'snowRock', paper: 0xeef0f0 },
  lair: { floor: 'lairFloor', wall: 'lairWall', wallTop: 'lairWallTop', light: 0.65, sun: 0.45, card: 1, paper: 0x261c34 },
  // the sequel's places
  canal: { floor: 'bluePave', wall: 'wallStone', wallTop: 'wallStoneTop', grass: 1, pave: 'bluePave', paper: 0xf0ead8 },
  port: { floor: 'grass', grass: 1, wall: 'wallStone', wallTop: 'wallStoneTop', paper: 0xf3e8cf },
  ranch: { floor: 'grass', grass: 1, wall: 'fortWall', wallTop: 'palisadeTop', fortFence: 1, paper: 0xf3e8cf },
  isle: { floor: 'sand', grass: 1, wall: 'wallStone', wallTop: 'wallStoneTop', paper: 0xf2e6c8 },
  jungle: { floor: 'bambooFloor', grass: 1, wall: 'stilt', wallTop: 'roofThatch', paper: 0xe8e4c4 },
  volcvillage: { floor: 'volcFloor', wall: 'volcRockSide', wallTop: 'volcRock', paper: 0xe8d8c4 },
  snowcamp: { floor: 'snow', wall: 'snowRockSide', wallTop: 'snowRock', paper: 0xeef0f0 },
  fortress: { floor: 'pave', wall: 'wallStone', wallTop: 'wallStoneTop', pave: 'pave', paper: 0xe8e8e8 },
  mansion: { floor: 'darkWood', wall: 'mansionWall', wallTop: 'mansionWallTop', light: 0.6, sun: 0.4, card: 1, paper: 0x2a1c30 },
  bamboo: { floor: 'bambooFloor', grass: 1, wall: 'leafSide', wallTop: 'leafTop', light: 0.85, sun: 0.7, paper: 0xe0e8c8 },
  swamp: { floor: 'mud', wall: 'rockSide', wallTop: 'rockTop', light: 0.7, sun: 0.5, card: 1, paper: 0x26301c },
  volcano: { floor: 'volcFloor', wall: 'volcRockSide', wallTop: 'volcRock', light: 0.75, sun: 0.55, card: 1, paper: 0x301a14 },
  pagoda: { floor: 'pagodaFloor', wall: 'pagodaWall', wallTop: 'pagodaWallTop', light: 0.7, sun: 0.5, card: 1, paper: 0x241830 },
  belltemple: { floor: 'pave', wall: 'templeWall', wallTop: 'templeWallTop', pave: 'pave', light: 0.85, sun: 0.65, paper: 0xe8dcc0 },
};
export { THEMES };

function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- one person on the map
const SHEETS = {};
export function loadImage(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
export function registerSheet(key, img) { SHEETS[key] = img; }
// look = { sheet: key, frames: { down: [[x,y,w,h],...], up: [...], side: [...] } } (side faces right)
// A person is a die-cut card on its own little tab: it pops up when the map opens and hops a step at a time.
class Actor {
  constructor(view, look) {
    this.view = view; this.look = look; this.cache = {};
    this.cw = look.cw || 16; this.ch = look.ch || 24;
    const S = view.stretch || 1.3, s = look.scale || 1, k = (this.cw / 16) * s / (this.cw * 4);
    this.W = (this.cw * 4 + 12) * k; this.H = (this.ch * 4 + 12) * k * S; this.b = 6 * k * S;
    const base = view.cardGeo, g = new THREE.InstancedBufferGeometry();
    g.setIndex(Array.from(base.index.array)); g.setAttribute('position', new THREE.Float32BufferAttribute(base.attributes.position.array.slice(), 3));
    const ia = (a, n) => new THREE.InstancedBufferAttribute(new Float32Array(a), n);
    this.A = { pos: ia([0, 0, 0, this.b], 4), size: ia([this.W, this.H, 0, 0], 4), uv: ia([0, 0, 1, 1], 4), uv2: ia([0, 0, 1, 1], 4), misc: ia([0, 0, 1, 0], 4), roll: ia([0, 0], 2), rise: ia([0], 1) };
    for (const [k2, a] of [['iPos', this.A.pos], ['iSize', this.A.size], ['iUV', this.A.uv], ['iUV2', this.A.uv2], ['iMisc', this.A.misc], ['iRoll', this.A.roll], ['iRise', this.A.rise]]) g.setAttribute(k2, a);
    g.instanceCount = 1;
    this.mat = view.cardMaterial(null);
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; view.group.add(this.mesh);
    this.blob = new THREE.Mesh(view.blobGeo, view.blobMat); view.group.add(this.blob);
    this.rise = 0; this.vel = 0; this.delay = 0.15 + Math.random() * 0.12; this.walk = 0; this.px = null; this.pz = null; this.moved = false; this.x = 0; this.z = 0; this.y = 0;
    this.set('down', 0);
  }
  frameTex(dir, i) {
    const k = dir + i; if (this.cache[k]) return this.cache[k];
    const L = this.look, list = L.frames[dir] || L.frames.down, f = list[i % list.length];
    const img = SHEETS[f[5] || L.sheet]; const W = this.cw, H = this.ch; const c = canvasOf(W, H); const x = c.getContext('2d');
    if (img) { x.imageSmoothingEnabled = false; const flip = f[4]; if (flip) { x.translate(W, 0); x.scale(-1, 1); } x.drawImage(img, f[0], f[1], f[2], f[3], Math.floor((W - f[2]) / 2), H - f[3], f[2], f[3]);
      const lg = f[6]; if (lg) { const n = lg.rows, dx = Math.floor((W - f[2]) / 2); x.clearRect(dx, H - n, f[2], n); if (lg.mirror) { x.save(); x.translate(2 * dx + f[2], 0); x.scale(-1, 1); } x.drawImage(img, lg.x, lg.y + f[3] - n, f[2], n, dx, H - n, f[2], n); if (lg.mirror) x.restore(); } }
    return (this.cache[k] = texOf(dieCut(c, 4, 6, 5), { nearest: false }));
  }
  set(dir, i) {
    this.dir = dir; this.fi = i;
    let d = dir, flip = false; if (dir === 'left') { d = 'side'; flip = true; } else if (dir === 'right') d = 'side';
    const t = this.frameTex(d, i); if (this.mat.uniforms.uAtlas.value !== t) this.mat.uniforms.uAtlas.value = t;
    const w = flip ? -this.W : this.W; if (this.A.size.array[0] !== w) { this.A.size.array[0] = w; this.A.size.needsUpdate = true; }
  }
  place(x, z, y = 0) {
    this.x = x + 0.5; this.z = z + 0.5; this.y = y;
    if (this.px !== null) { const d = Math.abs(this.x - this.px) + Math.abs(this.z - this.pz); if (d > 0 && d < 1.5) { this.walk += d; this.moved = true; } }
    this.px = this.x; this.pz = this.z;
  }
  // per frame: the pop-up spring and the hop (one hop a tile; it finishes the hop when it stops)
  tick(dt) {
    const v = this.view;
    if (this.delay > 0) this.delay -= dt;
    else { const t = v.fold ? 0 : 1; this.vel += (STIFF * (t - this.rise) - DAMP * this.vel) * dt; this.rise += this.vel * dt; if (this.rise < 0) { this.rise = 0; this.vel = -this.vel * 0.25; } if (Math.abs(t - this.rise) < 0.003 && Math.abs(this.vel) < 0.03) { this.rise = t; this.vel = 0; } }
    if (!this.moved) { const f = this.walk % 1; if (f > 0) this.walk = Math.min(Math.ceil(this.walk), this.walk + dt * 6); }
    this.moved = false;
    const f = this.walk % 1, hop = Math.sin(f * Math.PI), sgn = Math.floor(this.walk) % 2 ? 1 : -1;
    const P = this.A.pos.array, y = this.y + hop * 0.09, rl = 0 * sgn;
    if (P[0] !== this.x || P[1] !== y || P[2] !== this.z) { P[0] = this.x; P[1] = y; P[2] = this.z; this.A.pos.needsUpdate = true; }
    if (this.A.roll.array[0] !== rl) { this.A.roll.array[0] = rl; this.A.roll.needsUpdate = true; }
    if (this.A.rise.array[0] !== this.rise) { this.A.rise.array[0] = this.rise; this.A.rise.needsUpdate = true; }
    const s = Math.min(1, Math.max(0, this.rise)) * (1 - hop * 0.25);
    this.blob.position.set(this.x + 0.1, 0.006 + this.y, this.z - 0.06); this.blob.scale.set(s, 1, s);
    return f > 0 || this.vel !== 0 || this.delay > 0;
  }
  // new clothes (the paper doll): drop the cached frame textures; the next set() cuts the new ones (once per change)
  relook(look) { const old = Object.values(this.cache); this.cache = {}; this.look = look; this.set(this.dir || 'down', this.fi || 0); for (const t of old) t.dispose(); }
  visible(v) { this.mesh.visible = v; this.blob.visible = v; }
  dispose() { this.view.group.remove(this.mesh); this.view.group.remove(this.blob); this.mesh.geometry.dispose(); this.mat.dispose(); for (const t of Object.values(this.cache)) t.dispose(); }
}
