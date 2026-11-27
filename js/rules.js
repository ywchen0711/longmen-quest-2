// The one set of rules every fighter shares - 奕叡, his companions, the monsters that join, and every enemy:
// stats, damage, arts, items, levels, gear and the shared pack.
import { MAX_LV, XP_FOR, curve, CHARS, SPECIES, SKILLS, ITEMS, BAG_MAX, SLOTS, HUMAN_SLOTS, MON_SLOTS, ENEMIES } from './data.js?v=8';

export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
let UID = 1;
export const setUid = (n) => { UID = Math.max(UID, n); };

// ---------------------------------------------------------------- members of the party
// a person: { uid, kind: 'human', who, lv, xp, hp, mp, <gear slots>, learned, poison }
// a monster: { uid, kind: 'mon', who: species id, name, lv, xp, hp, mp, cl, pd, poison }
export function newMember(who, lv = 1, o = {}) {
  const human = !!CHARS[who];
  const m = { uid: UID++, kind: human ? 'human' : 'mon', who, lv: 1, xp: 0, hp: 1, mp: 0, learned: [], poison: false, name: null };
  for (const s of SLOTS) m[s] = null;
  Object.assign(m, o);
  m.lv = Math.max(1, Math.min(capOf(m), lv)); m.xp = XP_FOR[m.lv];
  const s = stat(m); m.hp = s.maxHp; m.mp = s.maxMp;
  return m;
}
export const isMon = (m) => m.kind === 'mon';
export const capOf = (m) => (isMon(m) ? SPECIES[m.who].cap : MAX_LV);
export const slotsOf = (m) => (isMon(m) ? MON_SLOTS : HUMAN_SLOTS);
export const speciesName = (m) => ENEMIES[m.who] || { zh: '?', en: '?' };
// the name to show: a person's own, a monster's given name (or its kind)
export function nameOf(m, lang = 'zh') {
  if (!isMon(m)) return CHARS[m.who][lang];
  if (m.name) return typeof m.name === 'string' ? m.name : m.name[lang] || m.name.zh;
  return speciesName(m)[lang];
}

// the sum of one number over everything worn
export const gear = (m, k) => { let s = 0; for (const sl of SLOTS) { const id = m[sl]; if (id && ITEMS[id] && ITEMS[id][k]) s += ITEMS[id][k]; } return s; };
export function base(m, L = m.lv) {
  if (!isMon(m)) { const C = CHARS[m.who], p = C.p || 1; return C.g0.map((a, i) => curve(a, C.g1[i], L, p)); }
  const S = SPECIES[m.who], q = S.q, g = S.g;
  // a monster on the people's curve: [hp, mp, str, agi, def] bent by its role and kind
  const A = [16, 2, 5, 5, 3], Z = [400, 130, 172, 132, 92];
  return A.map((a, i) => Math.round(curve(a, Z[i], L, 1.02) * g[i] * q));
}
export function stat(m) {
  const [hp, mp, str, agi, def] = base(m);
  return { maxHp: hp + gear(m, 'mhp'), maxMp: mp + gear(m, 'mmp'), str, agi: agi + gear(m, 'agi'), def };
}
export const atkOf = (m) => stat(m).str + gear(m, 'atk');
export const defOf = (m) => { const s = stat(m); return s.def + Math.floor(s.agi / 4) + gear(m, 'def'); };
export const critOf = (m) => CRIT + gear(m, 'crit');
export const evaOf = (m) => (!isMon(m) && CHARS[m.who].eva) || 0;
export const resist = (m, k) => Math.min(1, gear(m, k));   // rpsn | rpin | rseal
export function known(m) {
  const list = isMon(m) ? SPECIES[m.who].arts : CHARS[m.who].arts;
  const out = list.filter(([l]) => m.lv >= l).map(([, k]) => k).filter((k) => SKILLS[k]);
  for (const k of m.learned || []) if (!out.includes(k)) out.push(k);
  return out;
}
export const xpToNext = (m) => (m.lv >= capOf(m) ? 0 : XP_FOR[m.lv + 1] - m.xp);
export const alive = (m) => m.hp > 0;
// can this member wear that piece?
export function canWear(m, id) {
  const it = ITEMS[id]; if (!it || !SLOTS.includes(it.kind)) return false;
  if (!slotsOf(m).includes(it.kind)) return false;
  if (it.kind === 'w') return CHARS[m.who].wc.includes(it.wc);
  return true;
}
// how good a piece is, all told (for "is it better?" prompts and the test bot)
export const gearScore = (id) => { const it = id && ITEMS[id]; if (!it) return -1; return (it.atk || 0) * 1.2 + (it.def || 0) + (it.agi || 0) * 0.6 + (it.mhp || 0) * 0.3 + (it.mmp || 0) * 0.3 + (it.crit || 0) * 120 + ((it.rpsn || 0) + (it.rpin || 0) + (it.rseal || 0)) * 6 + (it.regen || 0) * 3 + (it.chm || 0) * 8; };
// the member's numbers as they would be with `id` worn in `slot` instead (null: that slot emptied)
export function withGear(m, slot, id) { const o = { ...m, [slot]: id }; const s = stat(o); return { atk: atkOf(o), def: defOf(o), agi: s.agi, maxHp: s.maxHp, maxMp: s.maxMp, crit: critOf(o) }; }
// keep HP/MP within their (gear-dependent) maximum
export function clamp(m) { const s = stat(m); m.hp = Math.min(m.hp, s.maxHp); m.mp = Math.min(m.mp, s.maxMp); }
export function fullHeal(m) { const s = stat(m); m.hp = s.maxHp; m.mp = s.maxMp; m.poison = false; }

// ---------------------------------------------------------------- the shared pack: stacks of up to 9, at most BAG_MAX kinds
export const count = (inv, id) => (inv.bag.find((b) => b.id === id) || { n: 0 }).n;
export function canAdd(inv, id) { const b = inv.bag.find((x) => x.id === id); return b ? b.n < 9 || ITEMS[id].kind === 'key' : inv.bag.length < BAG_MAX; }
export function addItem(inv, id) {
  const it = ITEMS[id];
  if (it.kind === 'key') { if (!inv.bag.find((b) => b.id === id)) inv.bag.push({ id, n: 1 }); return true; }
  const b = inv.bag.find((x) => x.id === id); if (b) { if (b.n >= 9) return false; b.n++; return true; }
  if (inv.bag.length >= BAG_MAX) return false; inv.bag.push({ id, n: 1 }); return true;
}
export function removeItem(inv, id) { const b = inv.bag.find((x) => x.id === id); if (!b) return false; b.n--; if (b.n <= 0) inv.bag.splice(inv.bag.indexOf(b), 1); return true; }
// gear is worn from the pack: the old piece goes back into it
export function equip(inv, m, id) {
  const slot = ITEMS[id].kind; const old = m[slot];
  removeItem(inv, id); m[slot] = id; if (old) addItem(inv, old);
  clamp(m);
}
// take a piece off into the pack (false if the pack is full)
export function unequip(inv, m, slot) { const id = m[slot]; if (!id) return true; if (!canAdd(inv, id)) return false; addItem(inv, id); m[slot] = null; clamp(m); return true; }

// add XP; returns a list of level-ups [{lv, gains:{hp,mp,str,agi,def}, arts:[]}]
export function gainXp(m, n) {
  const cap = capOf(m); if (m.lv >= cap) return [];
  m.xp += n; const ups = [];
  while (m.lv < cap && m.xp >= XP_FOR[m.lv + 1]) {
    const b0 = base(m), had = known(m); m.lv++; const b1 = base(m);
    const gains = { hp: b1[0] - b0[0], mp: b1[1] - b0[1], str: b1[2] - b0[2], agi: b1[3] - b0[3], def: b1[4] - b0[4] };
    if (m.hp > 0) m.hp += gains.hp; m.mp += gains.mp; clamp(m);
    ups.push({ lv: m.lv, gains, arts: known(m).filter((k) => !had.includes(k)) });
  }
  if (m.lv >= cap) m.xp = Math.min(m.xp, XP_FOR[cap]);
  return ups;
}
// what a beaten foe leaves: each [item, chance] of its table rolled on its own
export function rollDrops(E) { return (E.drop || []).filter(([, p]) => Math.random() < p).map(([id]) => id); }

// ---------------------------------------------------------------- combat numbers (the same for both sides)
export function physDamage(atk, def) {
  const b = atk - def / 2;
  if (b < 2) return Math.random() < 0.5 ? 1 : 0;
  return Math.max(1, Math.floor(b * (0.42 + Math.random() * 0.22)));
}
export const critDamage = (atk) => Math.floor(atk * (0.62 + Math.random() * 0.36));
export const dodgeChance = (defAgi, atkAgi) => Math.max(0.02, Math.min(0.15, (defAgi - atkAgi) / 220 + 1 / 32));
export const CRIT = 1 / 32;
export const skillRoll = (k) => rand(SKILLS[k].lo, SKILLS[k].hi);
export function runChance(myAgi, foeAgi) { return Math.max(0.3, Math.min(0.95, 0.55 + (myAgi - foeAgi) / 90)); }
