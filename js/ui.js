// Paper windows: cream notes with torn edges and dark ink in the Cubic 11 pixel font (the look is in style.css).
// Messages type out, menus move a ▶ cursor. Every prompt returns a promise. A test driver (UI.driver) may answer prompts instead of a person.
import { CAST } from './people_art.js?v=8';

export const STR = {
  attack: ['攻擊', 'Attack'], skill: ['武功', 'Arts'], item: ['道具', 'Items'], run: ['逃走', 'Run'],
  status: ['狀態', 'Status'], equip: ['裝備', 'Equip'], config: ['設定', 'Settings'], close: ['關閉', 'Close'],
  yes: ['是', 'Yes'], no: ['否', 'No'], buy: ['買', 'Buy'], sell: ['賣', 'Sell'], leave: ['離開', 'Leave'],
  lv: ['等級', 'Lv'], hp: ['體力', 'HP'], mp: ['內力', 'MP'], gold: ['銀兩', 'Gold'], xp: ['經驗', 'XP'],
  str: ['力量', 'Strength'], agi: ['身法', 'Agility'], atk: ['攻擊力', 'Attack'], def: ['防禦力', 'Defence'],
  weapon: ['兵器', 'Weapon'], armour: ['衣甲', 'Armour'], charm: ['護具', 'Bracer'], none: ['（無）', '(none)'],
  noSkill: ['還沒有學會武功。', 'You know no arts yet.'], noItem: ['什麼也沒有。', 'You carry nothing.'],
  lang: ['語言：中文', 'Language: English'], music: ['音樂', 'Music'], sound: ['音效', 'Sound'], quality: ['畫質', 'Graphics'],
  qlow: ['低', 'Low'], qmed: ['中', 'Medium'], qhigh: ['高', 'High'],
  newgame: ['開始新的旅程', 'New Journey'], cont: ['繼續（自動記錄）', 'Continue (autosave)'], load: ['讀取記錄', 'Load'],
  slot: ['記錄', 'Record'], empty: ['（空白）', '(empty)'], gp: ['兩', 'g'],
  unequip: ['（卸下）', '(take off)'], drop: ['掉落', 'Drops'],
  save: ['記錄', 'Save'], clue: ['線索', 'Clues'], book: ['圖鑑', 'Bestiary'], use: ['使用', 'Use'], toss: ['丟掉', 'Drop'], who: ['', ''],
};
let lang = 'zh';
try { const l = localStorage.getItem('lq2_lang'); if (l === 'en' || l === 'zh') lang = l; } catch (e) {}
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem('lq2_lang', l); } catch (e) {} document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en'; }
// t(x): a STR key, a [zh, en] pair or a {zh, en} object
export function t(x) {
  if (x == null) return '';
  if (typeof x === 'string') return STR[x] ? STR[x][lang === 'zh' ? 0 : 1] : x;
  if (Array.isArray(x)) return x[lang === 'zh' ? 0 : 1];
  return x[lang] ?? x.zh ?? '';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => (document.hidden ? setTimeout(r, 16) : requestAnimationFrame(r)));
const NAMES = {
  yirui: ['奕叡', 'Yi Rui'], yishuo: ['奕碩', 'Yi Shuo'], baixian: ['白先生', 'Mr Bai'], liuhanyan: ['柳寒煙', 'Liu Hanyan'], kuchan: ['苦禪', 'Kuchan'],
  xiaotian: ['冷笑天', 'Leng Xiaotian'], heixiong: ['黑熊', 'Black Bear'], daoba: ['刀疤', 'Scar'], shouhou: ['瘦猴', 'Skinny Monkey'], tuqianqiu: ['屠千秋', 'Tu Qianqiu'],
  tiewusi: ['鐵無私', 'Tie Wusi'], qianwanli: ['錢萬里', 'Qian Wanli'], wenruyu: ['溫如玉', 'Wen Ruyu'], xiaolian: ['小蓮', 'Xiaolian'], lihanshan: ['厲寒山', 'Li Hanshan'],
  yuweng: ['獨臂漁翁', 'One-Armed Fisherman'], guimian: ['鬼面護法', 'Ghost-mask Warden'],
  hubanxian: ['胡半仙', 'Hu Banxian'], jiabafang: ['賈八方', 'Jia Bafang'], wudadan: ['武大膽', 'Wu Dadan'], wenduizhang: ['文對仗', 'Wen Duizhang'],
  suxiaowan: ['蘇小婉', 'Su Xiaowan'], chutiankuo: ['楚天闊', 'Chu Tiankuo'], niubaobao: ['牛飽飽', 'Niu Baobao'], mojide: ['莫記得', 'Mo Jide'],
  huotianxia: ['霍天下', 'Huo Tianxia'], mowuya: ['墨無涯', 'Mo Wuya'], aman: ['阿蠻', 'A-Man'], qing: ['御妖使・青', 'Envoy Qing'], chi: ['御妖使・赤', 'Envoy Chi'],
  linwei: ['鈴衛', 'Bell Guard'],
  oldman: ['老人', 'Old man'], woman: ['婦人', 'Woman'], man: ['村民', 'Villager'], child: ['孩子', 'Child'], guard: ['守衛', 'Guard'], merchant: ['商人', 'Merchant'],
  innkeeper: ['掌櫃', 'Innkeeper'], monk: ['僧人', 'Monk'], nun: ['寒江弟子', 'Cold River disciple'], boatman: ['船夫', 'Boatman'], scholar: ['書生', 'Scholar'],
  blacksmith: ['鐵匠', 'Smith'], fisherman: ['漁夫', 'Fisherman'], dancer: ['姑娘', 'Girl'], beggar: ['乞丐', 'Beggar'], oldwoman: ['老婆婆', 'Old woman'],
};
export const nameOf = (who) => t(NAMES[who] || ['', '']);

export class UI {
  constructor(root, input, audio) {
    this.root = root; this.input = input; this.audio = audio; this.driver = null; this.fast = false; this.por = {};   // por: portraits drawn at run time (the paper doll), by who
    this.msgBox = this.el('div', 'win msg hidden'); this.msgText = this.el('div', 'mtext', this.msgBox); this.msgPor = this.el('div', 'mpor', this.msgBox);
    this.msgName = this.el('div', 'mname', this.msgBox); this.msgArrow = this.el('div', 'marrow', this.msgBox); this.msgArrow.textContent = '▼';
    this.banner = this.el('div', 'banner hidden');
  }
  el(tag, cls, parent = this.root) { const e = document.createElement(tag); if (cls) e.className = cls; parent.appendChild(e); return e; }
  // ---------------------------------------------------------------- messages
  async say(who, text, opts = {}) {
    const s = t(text);
    if (this.driver) { this.driver.onSay && this.driver.onSay(who, s); return; }
    const box = this.msgBox; box.classList.remove('hidden');
    const cast = who && CAST[who];
    box.classList.toggle('withpor', !!cast);
    this.msgPor.style.backgroundImage = cast ? `url(${this.por[who] || cast.portrait})` : '';
    this.msgName.textContent = who ? nameOf(who) : ''; this.msgName.classList.toggle('hidden', !who);
    this.msgArrow.classList.add('hidden');
    let done = false, skip = false;
    const off = this.input.push((k) => { if (k === 'A' || k === 'B') { if (!done) skip = true; else close(); } });
    let close; const closed = new Promise((r) => { close = r; });
    this.msgText.textContent = '';
    // type by elapsed time on animation frames (not one timer per letter), so a busy frame never makes the text stutter:
    // the letters due by now all appear at once
    const cps = lang === 'zh' ? 33 : 70, t0 = performance.now(); let shown = 0;
    this.talking = true;
    while (shown < s.length) {
      if (skip || this.fast) break;
      await nextFrame();
      const n = Math.min(s.length, Math.floor((performance.now() - t0) / 1000 * cps) + 1);
      if (n > shown) {
        if (Math.floor(n / 2) > Math.floor(shown / 2) && s[n - 1] !== ' ') this.audio.sfx('talk');
        shown = n; this.msgText.textContent = s.slice(0, n);
      }
    }
    this.msgText.textContent = s;
    done = true; this.msgArrow.classList.remove('hidden');
    if (opts.noWait) { off(); return; }
    await closed; off(); this.audio.sfx('cursor');
    if (!opts.keep) { box.classList.add('hidden'); this.talking = false; }
  }
  hideMsg() { this.msgBox.classList.add('hidden'); this.talking = false; }
  async banner2(text, ms = 1600) { if (this.driver) return; const b = this.banner; b.textContent = t(text); b.classList.remove('hidden'); b.classList.add('show'); clearTimeout(this.bt); this.bt = setTimeout(() => { b.classList.remove('show'); b.classList.add('hidden'); }, ms); }

  // ---------------------------------------------------------------- menus
  // items: [{label, sub, disabled}] or strings. Returns index or -1 (B). opts: cls, title, cols, cancel, start, onMove(i), ctx
  choose(items, opts = {}) {
    items = items.map((it) => (typeof it === 'object' && !Array.isArray(it) && it.label !== undefined ? it : { label: it }));
    if (this.driver) return Promise.resolve(this.driver.choose(opts.ctx || 'menu', items, opts));
    return new Promise((res) => {
      const w = this.el('div', 'win menu ' + (opts.cls || ''));
      if (opts.title) { const h = this.el('div', 'mtitle', w); h.textContent = t(opts.title); }
      const list = this.el('div', 'mlist', w); const cols = opts.cols || 1; list.style.gridTemplateColumns = `repeat(${cols}, auto)`;
      const rows = items.map((it, i) => { const r = this.el('div', 'mi' + (it.disabled ? ' dis' : ''), list); const a = this.el('span', 'cur', r); a.textContent = '▶'; const l = this.el('span', 'lab', r); l.textContent = t(it.label); if (it.sub != null) { const s = this.el('span', 'sub', r); s.textContent = t(it.sub); } r.addEventListener('click', () => { idx = i; draw(); pick(); }); return r; });
      let idx = Math.min(opts.start || 0, items.length - 1);
      const draw = () => {
        rows.forEach((r, i) => r.classList.toggle('on', i === idx));
        const r = rows[idx];   // keep the cursor in view in a scrolling list
        if (r && list.scrollHeight > list.clientHeight) { if (r.offsetTop < list.scrollTop) list.scrollTop = r.offsetTop; else if (r.offsetTop + r.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = r.offsetTop + r.offsetHeight - list.clientHeight; }
        if (opts.onMove) opts.onMove(idx);
      };
      const finish = (v) => { off(); w.remove(); res(v); };
      const pick = () => { if (items[idx].disabled) { this.audio.sfx('bump'); return; } this.audio.sfx('ok'); if (opts.keepOpen) { off(); res({ index: idx, close: () => w.remove() }); } else finish(idx); };
      const off = this.input.push((k) => {
        const n = items.length;
        if (k === 'up') { idx = (idx - cols + n) % n; this.audio.sfx('cursor'); draw(); }
        else if (k === 'down') { idx = (idx + cols) % n; this.audio.sfx('cursor'); draw(); }
        else if (k === 'left' && cols > 1) { idx = (idx - 1 + n) % n; this.audio.sfx('cursor'); draw(); }
        else if (k === 'right' && cols > 1) { idx = (idx + 1) % n; this.audio.sfx('cursor'); draw(); }
        else if (k === 'A') pick();
        else if (k === 'B' && opts.cancel !== false) { this.audio.sfx('cancel'); finish(-1); }
      });
      draw();
    });
  }
  async yesno(q, who) {
    if (q) await this.say(who, q, { keep: true, noWait: !this.driver });
    const r = await this.choose([STR.yes, STR.no], { cls: 'yn', ctx: 'yesno' });
    this.hideMsg(); return r === 0;
  }
  // a plain info window (status, gold); returns a remover
  panel(cls, html) { const w = this.el('div', 'win ' + cls); w.innerHTML = html; return w; }
}
