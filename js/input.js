// Keyboard (arrows/WASD, Z/Enter/Space = A, X/Esc/Backspace = B), gamepad and the touch pad.
// Presses go to whoever is listening on top (menus, messages); held directions move the hero.
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'A', Enter: 'A', Space: 'A', NumpadEnter: 'A', KeyX: 'B', Escape: 'B', Backspace: 'B', KeyC: 'B' };
export class Input {
  constructor() {
    this.held = new Set(); this.stack = []; this.order = [];
    window.addEventListener('keydown', (e) => {
      const k = KEYS[e.code]; if (!k) return; e.preventDefault();
      if (!this.held.has(k)) { this.held.add(k); this.order.push(k); }
      this.press(k, e.repeat);
    });
    window.addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (!k) return; this.release(k); });
    window.addEventListener('blur', () => { this.held.clear(); this.order = []; });
    this.pads = [false, false, false, false]; this.padPrev = {};
  }
  release(k) { this.held.delete(k); this.order = this.order.filter((o) => o !== k); }
  press(k, repeat = false) { const h = this.stack[this.stack.length - 1]; if (h) h(k, repeat); }
  // a listener on top of the stack gets every press until it pops itself
  push(fn) { this.stack.push(fn); return () => { const i = this.stack.lastIndexOf(fn); if (i >= 0) this.stack.splice(i, 1); }; }
  // the most recently pressed direction still held
  dir() { for (let i = this.order.length - 1; i >= 0; i--) { const k = this.order[i]; if (k === 'up' || k === 'down' || k === 'left' || k === 'right') return k; } return null; }
  pollPad(dt) {
    const gps = navigator.getGamepads ? navigator.getGamepads() : []; const gp = gps && [...gps].find((g) => g && g.connected);
    if (!gp) return;
    const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const st = { up: b(12) || ay < -0.5, down: b(13) || ay > 0.5, left: b(14) || ax < -0.5, right: b(15) || ax > 0.5, A: b(0), B: b(1) || b(9) };
    for (const [k, v] of Object.entries(st)) {
      const p = this.padPrev[k];
      if (v && !p) { this.held.add(k); this.order.push(k); this.press(k); this.padRep = 0.35; }
      else if (v && p && (k !== 'A' && k !== 'B')) { this.padRep -= dt; if (this.padRep <= 0) { this.padRep = 0.1; this.press(k, true); } }
      else if (!v && p) this.release(k);
      this.padPrev[k] = v;
    }
  }
  // the on-screen pad: a d-pad (slide between arrows) and A/B buttons
  bindTouch(root) {
    const dpad = root.querySelector('#dpad'), A = root.querySelector('#btnA'), B = root.querySelector('#btnB');
    let cur = null, repT = null;
    const setDir = (d) => {
      if (d === cur) return; if (cur) this.release(cur); clearInterval(repT); cur = d;
      if (d) { this.held.add(d); this.order.push(d); this.press(d); repT = setInterval(() => this.press(d, true), 140); }
      dpad.dataset.dir = d || '';
    };
    const dirAt = (t) => { const r = dpad.getBoundingClientRect(); const x = t.clientX - r.left - r.width / 2, y = t.clientY - r.top - r.height / 2; if (Math.hypot(x, y) < r.width * 0.12) return cur; return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'); };
    const track = (e) => { e.preventDefault(); let d = null; for (const t of e.touches) { const el = document.elementFromPoint(t.clientX, t.clientY); if (el && (el === dpad || dpad.contains(el))) d = dirAt(t); } setDir(d); };
    dpad.addEventListener('touchstart', track, { passive: false }); dpad.addEventListener('touchmove', track, { passive: false });
    dpad.addEventListener('touchend', track, { passive: false }); dpad.addEventListener('touchcancel', () => setDir(null));
    const btn = (el, k) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); el.classList.add('on'); this.held.add(k); this.press(k); }, { passive: false });
      const up = (e) => { e.preventDefault(); el.classList.remove('on'); this.release(k); };
      el.addEventListener('touchend', up, { passive: false }); el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); this.press(k); });
    };
    btn(A, 'A'); btn(B, 'B');
    // mouse on the d-pad for desktop testing
    dpad.addEventListener('mousedown', (e) => { const d = dirAt(e); setDir(d); const up = () => { setDir(null); window.removeEventListener('mouseup', up); }; window.addEventListener('mouseup', up); });
  }
}
