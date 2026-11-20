// Game data for 龍門刀客傳 貳 · 萬妖鈴: the party (people and recruited monsters), arts, items and gear, enemies,
// formations and where they live. Every number the party and the enemies use comes from the same rules
// (rules.js / battle.js); bosses are hard only through their stats, gear-like numbers, the same arts, formations
// (a boss may bring escorts) and a smarter AI. Nothing scales with the party's level.

// ---------------------------------------------------------------- levels
export const MAX_LV = 40;
// total experience needed for each level (index = level)
export const XP_FOR = [0, 0];
for (let L = 2; L <= MAX_LV; L++) XP_FOR.push(Math.round(5 * Math.pow(L - 1, 2.55) + 4 * (L - 1)));
// a curve from the value at level 1 to the value at level 40 (p bends it)
export const curve = (a, b, L, p = 1) => Math.round(a + (b - a) * Math.pow((Math.min(L, MAX_LV) - 1) / (MAX_LV - 1), p));

// ---------------------------------------------------------------- the people who can travel with you
// growth: [hp, mp, str, agi, def] at level 1 (g0) and at level 40 (g1), bent by p. wc: weapon classes they can wield.
// arts: [level, art] learned on the way up. eva: extra chance to slip a blow (蘇小婉 is a ghost).
export const CHARS = {
  yirui: { zh: '奕叡', en: 'Yi Rui', tzh: '啟程刀客', ten: 'the Departing Blade', g0: [20, 4, 7, 5, 3], g1: [440, 170, 195, 132, 88], p: 1.05,
    wc: ['dao', 'sword', 'spear', 'staff', 'fan'], arts: [[3, 'heal'], [4, 'qi'], [6, 'sleep'], [8, 'home'], [10, 'escape'], [12, 'seal'], [14, 'heal2'], [15, 'ward'], [17, 'qi2'], [20, 'sweep'], [24, 'heal3'], [30, 'qi3']] },
  yishuo: { zh: '奕碩', en: 'Yi Shuo', tzh: '旋風小子', ten: 'the Whirlwind Kid', g0: [15, 3, 5, 8, 2], g1: [340, 110, 160, 175, 62], p: 1.05,
    wc: ['ball'], arts: [[1, 'ball'], [4, 'cheer'], [7, 'steal'], [10, 'dbl'], [15, 'kickall'], [22, 'ball2'], [28, 'kickall2']] },
  wudadan: { zh: '武大膽', en: 'Wu Dadan', tzh: '膽小鏢頭', ten: 'the Timid Escort', g0: [30, 2, 7, 3, 6], g1: [540, 60, 180, 80, 135], p: 1.0,
    wc: ['club', 'staff'], arts: [[1, 'guard'], [3, 'cover'], [6, 'faint'], [9, 'roar'], [13, 'smash'], [18, 'guardall'], [26, 'quake']] },
  wenduizhang: { zh: '文對仗', en: 'Wen Duizhang', tzh: '對聯書生', ten: 'the Couplet Scholar', g0: [15, 12, 3, 5, 2], g1: [300, 290, 98, 112, 62], p: 1.0,
    wc: ['brush'], arts: [[1, 'ink'], [5, 'inkall'], [9, 'sleepall'], [11, 'seal'], [14, 'ink2'], [18, 'thunder'], [24, 'inkall2'], [30, 'ink3']] },
  suxiaowan: { zh: '蘇小婉', en: 'Su Xiaowan', tzh: '不知己逝的小姐', ten: 'the Lady Who Forgot She Died', g0: [16, 10, 3, 7, 3], g1: [310, 270, 100, 140, 72], p: 1.0, eva: 0.08,
    wc: ['fan'], arts: [[1, 'heal'], [3, 'cure'], [8, 'healall'], [10, 'mistall'], [12, 'revive'], [14, 'heal2'], [18, 'lampall'], [24, 'healall2'], [28, 'revive2']] },
  chutiankuo: { zh: '楚天闊', en: 'Chu Tiankuo', tzh: '屢敗屢戰', ten: 'the Undefeated Loser', g0: [26, 6, 8, 7, 4], g1: [470, 120, 205, 150, 92], p: 1.0,
    wc: ['sword'], arts: [[1, 'dbl'], [10, 'guard'], [20, 'skysword'], [22, 'sweep'], [30, 'qi3']] },
};
export const HUMANS = Object.keys(CHARS);

// ---------------------------------------------------------------- arts (武功; monsters call theirs 絕技). MP = 內力
// kind: heal | healall | revive | cure | hurt (one foe, ignores defence) | hurtall | hit (a physical blow times mul,
//   n blows) | hitall | sleep | sleepall | seal | guard | guardall | cover | roar (draws the foes' blows) | cheer |
//   steal | faint | home | escape | ward
// target: one | all | ally | fallen | allies | self | none
export const SKILLS = {
  heal:    { zh: '調息', en: 'Breathe', mp: 4, kind: 'heal', lo: 26, hi: 34, field: true, battle: true, dz: '運氣調息，回復一人的體力。', de: 'Restores some HP to one ally.' },
  heal2:   { zh: '大調息', en: 'Deep Breath', mp: 9, kind: 'heal', lo: 90, hi: 110, field: true, battle: true, dz: '大周天運轉，回復一人大量體力。', de: 'Restores much HP to one ally.' },
  heal3:   { zh: '周天回春', en: 'Full Circle', mp: 15, kind: 'heal', lo: 240, hi: 280, field: true, battle: true, dz: '回復一人幾乎全部體力。', de: 'Restores nearly all HP to one ally.' },
  healall: { zh: '春風化雨', en: 'Spring Rain', mp: 14, kind: 'healall', lo: 60, hi: 75, field: true, battle: true, dz: '回復全隊的體力。', de: 'Restores HP to the whole party.' },
  healall2:{ zh: '萬物回春', en: 'Ten Thousand Springs', mp: 28, kind: 'healall', lo: 160, hi: 190, field: true, battle: true, dz: '大大回復全隊的體力。', de: 'Restores much HP to the whole party.' },
  revive:  { zh: '還魂', en: 'Call Back', mp: 18, kind: 'revive', frac: 0.5, field: true, battle: true, dz: '喚回倒下的同伴，回復一半體力。', de: 'Revives a fallen ally with half HP.' },
  revive2: { zh: '起死回生', en: 'Back from the Dead', mp: 36, kind: 'revive', frac: 1, field: true, battle: true, dz: '喚回倒下的同伴，體力全滿。', de: 'Revives a fallen ally with full HP.' },
  cure:    { zh: '解毒', en: 'Purge', mp: 3, kind: 'cure', field: true, battle: true, dz: '解除一人的中毒。', de: 'Cures one ally of poison.' },
  qi:      { zh: '氣刀', en: 'Qi Blade', mp: 2, kind: 'hurt', lo: 10, hi: 15, battle: true, fx: 'qi', dz: '刀氣離刃，不看防禦。', de: 'Sword qi leaves the blade; ignores defence.' },
  qi2:     { zh: '天河刀氣', en: 'Sky River Blade', mp: 7, kind: 'hurt', lo: 58, hi: 70, battle: true, fx: 'beam', dz: '一刀如天河倒瀉。', de: 'One cut like the Milky Way pouring down.' },
  qi3:     { zh: '一刀啟程', en: 'One Cut to Set Out', mp: 15, kind: 'hurt', lo: 150, hi: 180, battle: true, fx: 'beam', dz: '奕叡的看家刀法，一刀斬開前路。', de: 'Yi Rui\'s own art: one cut that opens the road ahead.' },
  ink:     { zh: '墨點', en: 'Ink Dot', mp: 2, kind: 'hurt', lo: 10, hi: 15, battle: true, fx: 'ink', dz: '一點濃墨射向敵人。', de: 'A dot of thick ink shot at a foe.' },
  ink2:    { zh: '墨龍出海', en: 'Ink Dragon', mp: 8, kind: 'hurt', lo: 70, hi: 85, battle: true, fx: 'ink', dz: '筆走龍蛇，墨化蛟龍。', de: 'The brush runs like a dragon and the ink becomes one.' },
  ink3:    { zh: '一字千鈞', en: 'One Word, a Ton', mp: 16, kind: 'hurt', lo: 175, hi: 205, battle: true, fx: 'ink', dz: '寫下一個字，重如千鈞。', de: 'One written word that weighs a ton.' },
  inkall:  { zh: '潑墨', en: 'Splash Ink', mp: 5, kind: 'hurtall', lo: 16, hi: 22, battle: true, fx: 'ink', dz: '潑出一片濃墨，打中所有敵人。', de: 'Splashes ink over every foe.' },
  inkall2: { zh: '狂草千軍', en: 'Wild Cursive Army', mp: 18, kind: 'hurtall', lo: 80, hi: 96, battle: true, fx: 'ink', dz: '狂草如千軍萬馬，席捲敵陣。', de: 'Wild cursive strokes charge like an army.' },
  thunder: { zh: '驚雷', en: 'Thunderclap', mp: 9, kind: 'hurtall', lo: 44, hi: 56, battle: true, fx: 'bolt', dz: '一聲驚雷落在敵陣中。', de: 'Thunder falls among the foes.' },
  lampall: { zh: '冥燈', en: 'Ghost Lanterns', mp: 10, kind: 'hurtall', lo: 46, hi: 58, battle: true, fx: 'fire', dz: '一盞盞冥燈飄向敵人。', de: 'Ghost lanterns drift onto the foes.' },
  fire:    { zh: '鬼火', en: 'Ghost Fire', mp: 3, kind: 'hurt', lo: 12, hi: 18, battle: true, fx: 'fire', dz: '一團鬼火燒向敵人。', de: 'A ghost flame at one foe.' },
  fire2:   { zh: '冥火', en: 'Nether Blaze', mp: 6, kind: 'hurtall', lo: 26, hi: 34, battle: true, fx: 'fire', dz: '冥火燒遍敵陣。', de: 'Nether fire over every foe.' },
  fire3:   { zh: '業火', en: 'Karmic Blaze', mp: 12, kind: 'hurtall', lo: 62, hi: 76, battle: true, fx: 'fire', dz: '業火焚盡敵陣。', de: 'Karmic fire over every foe.' },
  frost:   { zh: '寒冰刺', en: 'Ice Spike', mp: 5, kind: 'hurt', lo: 36, hi: 46, battle: true, fx: 'qi', dz: '冰刺射向一個敵人。', de: 'An ice spike at one foe.' },
  frost2:  { zh: '暴風雪', en: 'Blizzard', mp: 11, kind: 'hurtall', lo: 55, hi: 68, battle: true, fx: 'qi', dz: '暴風雪捲過敵陣。', de: 'A blizzard over every foe.' },
  mist:    { zh: '毒霧', en: 'Venom Mist', mp: 4, kind: 'hurtall', lo: 10, hi: 15, poison: 0.4, battle: true, fx: 'mist', dz: '毒霧籠罩敵陣，可能中毒。', de: 'Venom mist over every foe; may poison.' },
  mist2:   { zh: '瘴氣', en: 'Miasma', mp: 9, kind: 'hurtall', lo: 38, hi: 48, poison: 0.5, battle: true, fx: 'mist', dz: '濃濃的瘴氣，可能中毒。', de: 'Thick miasma over every foe; may poison.' },
  ball:    { zh: '旋風球', en: 'Whirlwind Ball', mp: 2, kind: 'hit', mul: 1.5, pierce: 0.5, battle: true, fx: 'ball', dz: '一腳踢出旋風般的球，半穿防禦。', de: 'A kicked whirlwind of a ball; half ignores defence.' },
  ball2:   { zh: '流星球', en: 'Meteor Ball', mp: 7, kind: 'hit', mul: 2.4, pierce: 0.5, battle: true, fx: 'ball', dz: '球如流星墜地。', de: 'The ball falls like a meteor.' },
  kickall: { zh: '滿天球雨', en: 'Rain of Balls', mp: 6, kind: 'hitall', mul: 0.75, battle: true, fx: 'ball', dz: '一連踢出好幾顆球，打中所有敵人。', de: 'Kicks a volley of balls at every foe.' },
  kickall2:{ zh: '風火滿天', en: 'Wind and Fire Volley', mp: 14, kind: 'hitall', mul: 1.25, battle: true, fx: 'ball', dz: '帶火的球打遍敵陣。', de: 'Burning balls rain on every foe.' },
  dbl:     { zh: '連擊', en: 'Double Strike', mp: 3, kind: 'hit', mul: 0.8, n: 2, battle: true, dz: '連出兩招。', de: 'Two blows in a row.' },
  rush:    { zh: '疾風亂舞', en: 'Gale Frenzy', mp: 6, kind: 'hit', mul: 0.7, n: 3, battle: true, dz: '快得看不清的三連擊。', de: 'Three blows too quick to see.' },
  sweep:   { zh: '橫掃千軍', en: 'Sweep the Ranks', mp: 6, kind: 'hitall', mul: 0.8, battle: true, dz: '一招橫掃所有敵人。', de: 'One sweep across every foe.' },
  smash:   { zh: '重擊', en: 'Heavy Blow', mp: 4, kind: 'hit', mul: 1.9, acc: 0.8, battle: true, dz: '用盡全力的一擊，有時會落空。', de: 'An all-out blow that sometimes misses.' },
  quake:   { zh: '震地', en: 'Ground Shaker', mp: 10, kind: 'hitall', mul: 1.15, battle: true, dz: '一棍砸地，震倒所有敵人。', de: 'A blow to the ground that shakes every foe.' },
  skysword:{ zh: '天闊一劍', en: 'Sky-wide Sword', mp: 8, kind: 'hit', mul: 2.6, battle: true, dz: '楚天闊苦練多年的一劍。', de: 'The one sword stroke Chu Tiankuo trained for years.' },
  sleep:   { zh: '點穴', en: 'Pressure Point', mp: 3, kind: 'sleep', battle: true, dz: '點中穴道，使一個敵人動彈不得。', de: 'Freezes one foe.' },
  sleepall:{ zh: '定字訣', en: 'Word of Stillness', mp: 6, kind: 'sleepall', battle: true, dz: '寫下一個「定」字，敵人都可能動彈不得。', de: 'Writes "still": every foe may freeze.' },
  mistall: { zh: '鬼迷', en: 'Ghostly Daze', mp: 5, kind: 'sleepall', battle: true, dz: '鬼氣迷人，敵人都可能昏睡。', de: 'A ghostly haze that may put every foe to sleep.' },
  seal:    { zh: '封脈', en: 'Seal Meridians', mp: 3, kind: 'seal', battle: true, dz: '封住經脈，敵人無法施展武功。', de: 'Seals a foe\'s arts.' },
  guard:   { zh: '金剛護體', en: 'Diamond Body', mp: 3, kind: 'guard', battle: true, dz: '本場戰鬥自己的防禦大增。', de: 'Your defence rises greatly for this fight.' },
  guardall:{ zh: '鐵壁陣', en: 'Iron Wall', mp: 8, kind: 'guardall', battle: true, dz: '全隊的防禦提高。', de: 'Raises the whole party\'s defence.' },
  cover:   { zh: '掩護', en: 'Cover', mp: 0, kind: 'cover', battle: true, dz: '替一名同伴擋下這一回合的攻擊。', de: 'Takes the blows meant for one ally this round.' },
  roar:    { zh: '怒吼', en: 'Roar', mp: 2, kind: 'roar', battle: true, dz: '大吼一聲，引敵人這一回合都來打自己。', de: 'Draws every foe\'s blows this round.' },
  faint:   { zh: '裝死', en: 'Play Dead', mp: 0, kind: 'faint', battle: true, dz: '倒地裝死，這一回合敵人不理你，還能回點體力。', de: 'Plays dead: foes ignore you this round and you catch your breath.' },
  cheer:   { zh: '加油', en: 'Cheer', mp: 3, kind: 'cheer', battle: true, dz: '大聲加油，全隊的攻擊力提高。', de: 'A loud cheer: the party\'s attack rises.' },
  steal:   { zh: '撿東西', en: 'Pick Up', mp: 0, kind: 'steal', battle: true, dz: '從敵人身上撿走一樣東西。', de: 'Picks something off a foe.' },
  sealall: { zh: '鎖魂', en: 'Soul Lock', mp: 6, kind: 'seal', battle: true, dz: '封住一個敵人的經脈。', de: 'Seals one foe\'s arts.' },
  home:    { zh: '歸鄉', en: 'Homeward', mp: 6, kind: 'home', field: true, dz: '施展輕功，回到上次記錄的地方。', de: 'Light-foot back to where you last saved.' },
  escape:  { zh: '遁地', en: 'Slip Away', mp: 4, kind: 'escape', field: true, dz: '從洞窟或塔中脫身到外面。', de: 'Get out of a cave or tower at once.' },
  ward:    { zh: '驅邪', en: 'Ward', mp: 3, kind: 'ward', field: true, dz: '一身正氣，弱小的妖物不敢近身。', de: 'Righteous qi: weak creatures keep away.' },
};
const TARGET = { heal: 'ally', revive: 'fallen', cure: 'ally', hurt: 'one', hit: 'one', sleep: 'one', seal: 'one', cover: 'ally', steal: 'one',
  healall: 'allies', hurtall: 'all', hitall: 'all', sleepall: 'all', guardall: 'allies', cheer: 'allies', guard: 'self', roar: 'self', faint: 'self' };
for (const S of Object.values(SKILLS)) S.target = TARGET[S.kind] || 'none';

// ---------------------------------------------------------------- items and gear
// kind: use | key | mat | gear (SLOTS). Gear numbers: atk, def, agi, mhp, mmp; effects: crit, rpsn, rpin, rseal,
// regen (MP back per 10 steps), chm (charm: monsters are likelier to want to join). wc: a weapon's class.
// look: how a piece shows on 奕叡's paper doll (js/doll.js).
export const ITEMS = {
  herb:     { zh: '金創藥', en: 'Wound Salve', kind: 'use', price: 10, heal: [32, 40], battle: true, field: true, dz: '回復一人約三十五點體力。', de: 'Restores about 35 HP to one.' },
  herb2:    { zh: '大還丹', en: 'Great Return Pill', kind: 'use', price: 90, heal: [130, 150], battle: true, field: true, dz: '回復一人約一百四十點體力。', de: 'Restores about 140 HP to one.' },
  antidote: { zh: '解毒草', en: 'Antidote Herb', kind: 'use', price: 8, cure: true, battle: true, field: true, dz: '解除中毒。', de: 'Cures poison.' },
  soul:     { zh: '還魂丹', en: 'Soul Pill', kind: 'use', price: 300, revive: 0.5, battle: true, field: true, dz: '讓倒下的同伴醒來，回復一半體力。', de: 'Revives a fallen ally with half HP.' },
  qipill:   { zh: '回氣丹', en: 'Qi Pill', kind: 'use', price: 120, mp: 30, battle: true, field: true, dz: '回復一人三十點內力。', de: 'Restores 30 MP to one.' },
  bun:      { zh: '肉包', en: 'Meat Bun', kind: 'use', price: 6, bun: 1, heal: [12, 16], battle: true, field: true, dz: '熱騰騰的肉包。丟給妖物，牠會對你們多一分好感；給同伴吃也能回點體力。', de: 'A hot meat bun. Thrown to a creature it warms to you; it also heals a little.' },
  lingguo:  { zh: '靈果', en: 'Spirit Fruit', kind: 'use', price: 240, bun: 3, heal: [60, 80], battle: true, field: true, dz: '山中靈果，香氣讓妖物難以抗拒。丟給牠，牠會很想跟著你。', de: 'A fruit from the deep hills no creature can resist. Thrown to one, it will long to follow you.' },
  wing:     { zh: '歸雁符', en: 'Homing Charm', kind: 'use', price: 25, home: true, field: true, dz: '回到上次記錄的地方。', de: 'Returns you to where you last saved.' },
  incense:  { zh: '驅獸香', en: 'Beast-ward Incense', kind: 'use', price: 40, ward: true, field: true, dz: '一段時間內弱小的妖物不敢靠近。', de: 'Weak creatures keep away for a while.' },
  lantern:  { zh: '燈籠', en: 'Lantern', kind: 'key', price: 60, dz: '照亮黑暗的地方。', de: 'Lights up dark places.' },
  // ---- story items
  lingpian: { zh: '鈴片', en: 'Bell Shard', kind: 'key', dz: '一片青銅鈴的碎片，上面刻著「萬妖」二字。', de: 'A shard of a bronze bell, engraved "Ten Thousand Beasts".' },
  couplet:  { zh: '春聯', en: 'Spring Couplet', kind: 'key', dz: '文對仗寫的春聯，墨跡未乾。', de: 'A spring couplet in Wen Duizhang\'s hand, the ink still wet.' },
  shuipo:   { zh: '水魄', en: 'Water Soul', kind: 'key', dz: '萬妖鈴的三魄之一，像一滴不會落下的水。', de: 'One of the bell\'s three souls: a drop of water that never falls.' },
  huopo:    { zh: '火魄', en: 'Fire Soul', kind: 'key', dz: '萬妖鈴的三魄之一，捧在手心卻不燙。', de: 'One of the bell\'s three souls: a flame that does not burn the hand.' },
  bingpo:   { zh: '冰魄', en: 'Ice Soul', kind: 'key', dz: '萬妖鈴的三魄之一，冷得像一句忘了的話。', de: 'One of the bell\'s three souls: cold as a forgotten word.' },
  shipling: { zh: '船令', en: 'Ship Warrant', kind: 'key', dz: '船王的令牌：望月渡的「破浪號」歸你使用。', de: 'The Ship King\'s warrant: the Wavebreaker of Wangyue Ferry is yours.' },
  guanfang: { zh: '關防令', en: 'Pass Warrant', kind: 'key', dz: '鐵無私簽發的通行令，北雁關的鐵鍊會為你放下。', de: 'A warrant from Tie Wusi: the chain of Beiyan Pass will be lowered for you.' },
  amulet:   { zh: '阿蠻的骨哨', en: 'A-Man\'s Bone Whistle', kind: 'key', chm: 0.3, dz: '吹起來只有妖物聽得見。帶著它，妖物更願意親近你。', de: 'Only creatures can hear it. While you carry it, creatures warm to you more.' },
  teacup:   { zh: '小婉的茶杯', en: 'Xiaowan\'s Teacup', kind: 'key', dz: '一隻缺了口的青瓷杯。杯裡的茶，二十年沒有涼過。', de: 'A chipped celadon cup. The tea in it has not cooled in twenty years.' },
  // ---- materials: monster drops that sell for silver (half the price)
  pelt:      { zh: '獸皮', en: 'Beast Pelt', kind: 'mat', price: 30, dz: '野獸的毛皮。', de: 'A beast\'s hide.' },
  venom:     { zh: '毒囊', en: 'Venom Sac', kind: 'mat', price: 40, dz: '藥鋪收購的毒囊。', de: 'A venom sac; apothecaries buy them.' },
  talisman:  { zh: '黃符紙', en: 'Talisman Paper', kind: 'mat', price: 60, dz: '畫過符的黃紙。', de: 'Yellow paper with a spell on it.' },
  ore:       { zh: '鐵礦石', en: 'Iron Ore', kind: 'mat', price: 90, dz: '沉甸甸的礦石。', de: 'Heavy ore a smith will buy.' },
  pearl:     { zh: '明珠', en: 'Bright Pearl', kind: 'mat', price: 300, dz: '水底的明珠。', de: 'A pearl from deep water.' },
  emberstone:{ zh: '火晶石', en: 'Ember Stone', kind: 'mat', price: 220, dz: '火山裡撿來的紅晶石，摸起來溫溫的。', de: 'A red crystal from the volcano, warm to the touch.' },
  frostjade: { zh: '寒玉', en: 'Frost Jade', kind: 'mat', price: 400, dz: '北地冰窟裡的寒玉。', de: 'Cold jade from the northern ice.' },
  bellcopper:{ zh: '鈴銅', en: 'Bell Bronze', kind: 'mat', price: 520, dz: '萬妖塔裡的鈴銅，敲一下會嗡嗡作響。', de: 'Bronze from the bell tower; it hums when struck.' },
  tigerbone: { zh: '虎骨', en: 'Tiger Bone', kind: 'mat', price: 500, dz: '名貴的藥材。', de: 'A costly medicine.' },
  // ======== gear: weapons (wc = class)
  w0:  { zh: '舊環首刀', en: 'Old Ring Saber', kind: 'w', wc: 'dao', atk: 5, price: 10, look: { f: 'dao' } },
  w1:  { zh: '精鋼刀', en: 'Steel Dao', kind: 'w', wc: 'dao', atk: 11, price: 120, look: { f: 'dao', c: 0x30 } },
  w7:  { zh: '白蠟槍', en: 'Waxwood Spear', kind: 'w', wc: 'spear', atk: 14, agi: 2, price: 240, look: { f: 'spear', a: 0x10, b: 0x30, c: 0x17 } },
  w2:  { zh: '雁翎刀', en: 'Goose-feather Dao', kind: 'w', wc: 'dao', atk: 19, price: 480, look: { f: 'dao', c: 0x31 } },
  w8:  { zh: '青鋼劍', en: 'Blue Steel Sword', kind: 'w', wc: 'sword', atk: 22, crit: 0.03, price: 780, look: { f: 'sword', a: 0x21, b: 0x31, c: 0x28 } },
  w6:  { zh: '藏鋒刀', en: 'Hidden-edge Dao', kind: 'w', wc: 'dao', atk: 27, price: 1150, look: { f: 'dao', c: 0x00 } },
  w3:  { zh: '斬馬刀', en: 'Horse-cutter', kind: 'w', wc: 'dao', atk: 34, price: 1900, look: { f: 'bigdao', b: 0x30, c: 0x16 } },
  w16: { zh: '虎頭槍', en: 'Tiger-head Spear', kind: 'w', wc: 'spear', atk: 38, agi: 3, price: 2600, look: { f: 'spear', a: 0x28, b: 0x38, c: 0x16 } },
  w4:  { zh: '寒鐵刀', en: 'Cold Iron Dao', kind: 'w', wc: 'dao', atk: 45, price: 3800, look: { f: 'dao', c: 0x21 } },
  w12: { zh: '寒江劍', en: 'Cold River Sword', kind: 'w', wc: 'sword', atk: 48, agi: 3, crit: 0.03, price: 4600, look: { f: 'sword', a: 0x31, b: 0x30, c: 0x21 } },
  w5:  { zh: '龍吟刀', en: 'Dragon Song Dao', kind: 'w', wc: 'dao', atk: 58, price: 7800, look: { f: 'dao', c: 0x28 } },
  w13: { zh: '七星劍', en: 'Seven Star Sword', kind: 'w', wc: 'sword', atk: 62, crit: 0.05, price: 9600, look: { f: 'sword', a: 0x28, b: 0x30, c: 0x16 } },
  w10: { zh: '赤霄刀', en: 'Crimson Sky Dao', kind: 'w', wc: 'dao', atk: 72, crit: 0.03, price: 12800, look: { f: 'dao', c: 0x16 }, dz: '火鴉巢中撿到的寶刀，刀身微紅。', de: 'A treasure dao from the fire crow\'s nest, faintly red.' },
  w11: { zh: '鳴鴻刀', en: 'Crying Swan Dao', kind: 'w', wc: 'dao', atk: 84, crit: 0.05, mmp: 10, price: 18000, look: { f: 'bigdao', b: 0x31, c: 0x28 }, dz: '萬妖塔頂供著的古刀，揮動時如鴻雁長鳴。', de: 'An old dao kept atop the tower; it cries like a swan when swung.' },
  // 奕碩's balls
  b1: { zh: '皮球', en: 'Leather Ball', kind: 'w', wc: 'ball', atk: 4, price: 10, dz: '奕碩從小踢到大的球。誰都不准碰。', de: 'The ball Yi Shuo has kicked since he was little. No one touches it.' },
  b2: { zh: '藤球', en: 'Rattan Ball', kind: 'w', wc: 'ball', atk: 10, agi: 1, price: 140 },
  b3: { zh: '牛皮球', en: 'Oxhide Ball', kind: 'w', wc: 'ball', atk: 17, agi: 2, price: 520 },
  b4: { zh: '鐵心球', en: 'Iron-core Ball', kind: 'w', wc: 'ball', atk: 26, price: 1200 },
  b5: { zh: '火紋球', en: 'Flame-pattern Ball', kind: 'w', wc: 'ball', atk: 36, agi: 3, price: 2900 },
  b6: { zh: '風火球', en: 'Wind-and-Fire Ball', kind: 'w', wc: 'ball', atk: 50, agi: 5, price: 7200 },
  b7: { zh: '天外飛球', en: 'Ball from Beyond the Sky', kind: 'w', wc: 'ball', atk: 66, agi: 6, crit: 0.05, price: 14000, dz: '從天上掉下來的球……大概。', de: 'A ball that fell from the sky... probably.' },
  // 武大膽's clubs (and staves anyone strong can swing)
  k1: { zh: '哨棒', en: 'Escort\'s Cudgel', kind: 'w', wc: 'club', atk: 7, def: 1, price: 30 },
  w14:{ zh: '鐵棍', en: 'Iron Cudgel', kind: 'w', wc: 'staff', atk: 13, def: 1, price: 200, look: { f: 'staff', a: 0x00, c: 0x07 } },
  k2: { zh: '狼牙棒', en: 'Wolf-tooth Club', kind: 'w', wc: 'club', atk: 21, price: 640 },
  w9: { zh: '鐵禪杖', en: 'Iron Monk Staff', kind: 'w', wc: 'staff', atk: 28, def: 3, price: 1300, look: { f: 'staff', a: 0x28, c: 0x08 } },
  k3: { zh: '開山斧', en: 'Mountain-splitter Axe', kind: 'w', wc: 'club', atk: 40, price: 3300 },
  k4: { zh: '金剛杵', en: 'Vajra Pestle', kind: 'w', wc: 'club', atk: 52, def: 5, price: 7400 },
  k5: { zh: '鎮岳錘', en: 'Mountain-pinning Hammer', kind: 'w', wc: 'club', atk: 68, def: 6, price: 13500 },
  // 文對仗's brushes
  p1: { zh: '狼毫筆', en: 'Wolf-hair Brush', kind: 'w', wc: 'brush', atk: 4, mmp: 4, price: 40 },
  p2: { zh: '紫毫筆', en: 'Purple-hair Brush', kind: 'w', wc: 'brush', atk: 10, mmp: 8, price: 420 },
  p3: { zh: '鐵筆', en: 'Iron Brush', kind: 'w', wc: 'brush', atk: 18, mmp: 12, price: 1400 },
  p4: { zh: '判官筆', en: 'Judge\'s Brush', kind: 'w', wc: 'brush', atk: 28, mmp: 18, crit: 0.03, price: 3800 },
  p5: { zh: '如椽大筆', en: 'Rafter-sized Brush', kind: 'w', wc: 'brush', atk: 40, mmp: 30, price: 10500 },
  // 蘇小婉's fans (奕叡 can use a fan too)
  f1: { zh: '團扇', en: 'Round Fan', kind: 'w', wc: 'fan', atk: 4, agi: 1, price: 50, look: { f: 'fan', a: 0x30, b: 0x26 } },
  f2: { zh: '絲帶扇', en: 'Ribbon Fan', kind: 'w', wc: 'fan', atk: 11, agi: 2, mmp: 6, price: 480, look: { f: 'fan', a: 0x35, b: 0x25 } },
  f3: { zh: '羽扇', en: 'Feather Fan', kind: 'w', wc: 'fan', atk: 19, agi: 3, mmp: 10, price: 1500, look: { f: 'fan', a: 0x30, b: 0x10 } },
  f4: { zh: '月華扇', en: 'Moonlight Fan', kind: 'w', wc: 'fan', atk: 30, agi: 4, mmp: 16, price: 4400, look: { f: 'fan', a: 0x31, b: 0x21 } },
  f5: { zh: '千秋白骨扇', en: 'Bone Fan of Ages', kind: 'w', wc: 'fan', atk: 44, crit: 0.05, mmp: 20, price: 11000, look: { f: 'fan', a: 0x30, b: 0x36 }, dz: '屠千秋留下的白骨扇，賈八方不知從哪弄來的。', de: 'Tu Qianqiu\'s bone fan. Who knows where Jia Bafang found it.' },
  // armour
  a0: { zh: '粗布衣', en: 'Plain Robe', kind: 'a', def: 2, price: 10 },
  a1: { zh: '皮甲', en: 'Leather Vest', kind: 'a', def: 5, price: 60, look: { a: 0x17, b: 0x27, p: 'trim' } },
  a6: { zh: '鏢師短褂', en: 'Escort\'s Jacket', kind: 'a', def: 8, agi: 1, price: 180, look: { a: 0x08, b: 0x18, p: 'trim', t: 0x16 } },
  a2: { zh: '鎖子甲', en: 'Chain Shirt', kind: 'a', def: 12, price: 380, look: { a: 0x10, b: 0x00, p: 'chain' } },
  a7: { zh: '水犀甲', en: 'Water-rhino Hide', kind: 'a', def: 17, rpsn: 0.2, price: 900, look: { a: 0x1C, b: 0x2C, p: 'scale', t: 0x0C } },
  a3: { zh: '鐵鱗甲', en: 'Iron Scale', kind: 'a', def: 22, price: 1500, look: { a: 0x00, b: 0x10, p: 'scale', t: 0x0C } },
  a8: { zh: '藤甲', en: 'Rattan Armour', kind: 'a', def: 26, agi: 2, price: 2300, look: { a: 0x18, b: 0x28, p: 'chain', t: 0x08 } },
  a4: { zh: '玄鐵甲', en: 'Dark Iron Mail', kind: 'a', def: 33, price: 3600, look: { a: 0x0C, b: 0x1C, p: 'scale', t: 0x0C } },
  a9: { zh: '雪狼裘甲', en: 'Snow-wolf Hauberk', kind: 'a', def: 40, mhp: 20, price: 5600, look: { a: 0x30, b: 0x10, p: 'chain', t: 0x00 } },
  a5: { zh: '天蠶衣', en: 'Heaven Silk Robe', kind: 'a', def: 46, agi: 3, price: 8200, look: { a: 0x30, b: 0x31, p: 'trim', t: 0x30 } },
  a10:{ zh: '金縷玉衣', en: 'Gold-thread Jade Suit', kind: 'a', def: 56, mmp: 10, price: 13000, look: { a: 0x28, b: 0x2A, p: 'scale', t: 0x18 } },
  // 護具: bracers
  c1: { zh: '木護腕', en: 'Wood Bracer', kind: 'c', def: 2, price: 20, look: { f: 'bracer', a: 0x17 } },
  c2: { zh: '銅護腕', en: 'Bronze Bracer', kind: 'c', def: 5, price: 150, look: { f: 'bracer', a: 0x18 } },
  c3: { zh: '鐵護腕', en: 'Iron Bracer', kind: 'c', def: 9, price: 700, look: { f: 'bracer', a: 0x10 } },
  c4: { zh: '金絲護腕', en: 'Gold-thread Bracer', kind: 'c', def: 14, price: 2000, look: { f: 'bracer', a: 0x28 } },
  c_jiao: { zh: '蛟鱗護腕', en: 'Jiao-scale Bracer', kind: 'c', def: 16, agi: 2, price: 2600, look: { f: 'bracer', a: 0x2C }, dz: '江蛟的鱗片打成的護腕。', de: 'Bracers of River Jiao scales.' },
  c5: { zh: '龍鱗護心鏡', en: 'Dragon-scale Mirror', kind: 'c', def: 21, price: 6400, look: { f: 'mirror', a: 0x10, b: 0x31 } },
  c6: { zh: '玄武護臂', en: 'Black Tortoise Guard', kind: 'c', def: 27, mhp: 15, price: 11000, look: { f: 'mirror', a: 0x0C, b: 0x1C } },
  // 頭: head
  hd1: { zh: '紅頭巾', en: 'Red Headband', kind: 'hd', def: 1, agi: 1, price: 25, look: { f: 'band', a: 0x16 } },
  hd2: { zh: '竹斗笠', en: 'Bamboo Hat', kind: 'hd', def: 3, rpin: 0.2, price: 150, look: { f: 'hat', a: 0x27, b: 0x37, c: 0x17 } },
  hd3: { zh: '鐵額護', en: 'Iron Brow Guard', kind: 'hd', def: 6, price: 560, look: { f: 'brow', a: 0x10, b: 0x30, c: 0x00 } },
  hd_jia: { zh: '賈八方的帽子', en: 'Jia Bafang\'s Hat', kind: 'hd', def: 5, agi: 3, chm: 0.1, price: 800, look: { f: 'hat', a: 0x06, b: 0x16, c: 0x0F }, dz: '賈八方頭上摘下來的帽子，還是熱的。', de: 'Jia Bafang took it off his own head. Still warm.' },
  hd4: { zh: '鐵盔', en: 'Iron Helm', kind: 'hd', def: 9, price: 1500, look: { f: 'helm', a: 0x10, b: 0x30, c: 0x00 } },
  hd_veil: { zh: '黑紗斗笠', en: 'Black-veil Hat', kind: 'hd', def: 8, agi: 4, crit: 0.02, price: 2100, look: { f: 'hat', a: 0x00, b: 0x10, c: 0x0F, veil: 1 } },
  hd5: { zh: '紫金冠', en: 'Purple-gold Crown', kind: 'hd', def: 12, mmp: 12, price: 4200, look: { f: 'crown', a: 0x28, b: 0x38, c: 0x14 } },
  hd_crow: { zh: '金烏羽冠', en: 'Golden-crow Crown', kind: 'hd', def: 14, agi: 3, mmp: 12, price: 5200, look: { f: 'crown', a: 0x16, b: 0x27, c: 0x28 }, dz: '火鴉的羽毛做的冠。', de: 'A crown of fire-crow feathers.' },
  hd_lion: { zh: '獅頭盔', en: 'Lion-head Helm', kind: 'hd', def: 17, mhp: 12, price: 6800, look: { f: 'helm', a: 0x28, b: 0x38, c: 0x18 }, dz: '石獅口中銜著的頭盔。', de: 'The helm the stone lion held in its jaws.' },
  hd6: { zh: '鳳翅盔', en: 'Phoenix-wing Helm', kind: 'hd', def: 20, agi: 2, price: 10500, look: { f: 'helm', a: 0x16, b: 0x28, c: 0x06 } },
  // 靴: boots
  bt1: { zh: '草鞋', en: 'Straw Sandals', kind: 'bt', agi: 2, price: 20, look: { f: 'boots', a: 0x27 } },
  bt_jia: { zh: '賈八方的布鞋', en: 'Jia Bafang\'s Shoes', kind: 'bt', def: 1, agi: 4, price: 90, look: { f: 'boots', a: 0x0F }, dz: '賈八方從自己腳上脫下來賣給你的鞋。有點臭。', de: 'Jia Bafang took them off his own feet to sell to you. A bit smelly.' },
  bt2: { zh: '布靴', en: 'Cloth Boots', kind: 'bt', def: 1, agi: 3, price: 110, look: { f: 'boots', a: 0x00 } },
  bt3: { zh: '鹿皮靴', en: 'Deerskin Boots', kind: 'bt', def: 2, agi: 5, price: 520, look: { f: 'boots', a: 0x17 } },
  bt4: { zh: '鐵脛靴', en: 'Iron Greaves', kind: 'bt', def: 6, agi: 1, price: 1400, look: { f: 'greaves', a: 0x10, b: 0x30 } },
  bt_tiger: { zh: '虎紋靴', en: 'Tiger-stripe Boots', kind: 'bt', def: 4, agi: 7, price: 1900, look: { f: 'boots', a: 0x28, b: 0x38 } },
  bt5: { zh: '踏雲靴', en: 'Cloud-step Boots', kind: 'bt', def: 4, agi: 10, price: 4400, look: { f: 'boots', a: 0x31, b: 0x30 } },
  bt6: { zh: '神行靴', en: 'Swift-god Boots', kind: 'bt', def: 7, agi: 14, price: 9800, look: { f: 'boots', a: 0x16, b: 0x30 } },
  // 披風: cloaks
  ck1: { zh: '麻布披風', en: 'Hemp Cape', kind: 'ck', def: 1, mhp: 4, price: 70, look: { a: 0x27, b: 0x37 } },
  ck_wolf: { zh: '灰狼皮披風', en: 'Wolf-pelt Cape', kind: 'ck', def: 2, mhp: 8, price: 260, look: { a: 0x00, b: 0x10 } },
  ck2: { zh: '青布披風', en: 'Green Cloth Cape', kind: 'ck', def: 3, mhp: 10, price: 420, look: { a: 0x1B, b: 0x2B } },
  ck3: { zh: '錦緞披風', en: 'Brocade Cape', kind: 'ck', def: 5, mhp: 16, price: 1100, look: { a: 0x16, b: 0x26 } },
  ck_tiger: { zh: '虎皮披風', en: 'Tiger-skin Cape', kind: 'ck', def: 6, mhp: 16, agi: 2, price: 1600, look: { a: 0x28, b: 0x38 } },
  ck4: { zh: '玄狐裘', en: 'Black Fox Cloak', kind: 'ck', def: 8, mhp: 26, rpsn: 0.3, price: 3200, look: { a: 0x00, b: 0x30 } },
  ck_fox: { zh: '九尾狐裘', en: 'Nine-tail Fox Cloak', kind: 'ck', def: 10, mhp: 30, mmp: 10, rpin: 0.3, price: 5200, look: { a: 0x30, b: 0x31 }, dz: '九尾狐留下的白狐裘。', de: 'The white fox fur the Nine-tailed Fox left behind.' },
  ck5: { zh: '火浣布披風', en: 'Fire-washed Cape', kind: 'ck', def: 12, mhp: 36, rseal: 0.3, price: 8800, look: { a: 0x06, b: 0x27 } },
  // 佩飾: pendants (monsters can wear these too)
  pd1: { zh: '平安符', en: 'Safe-travel Charm', kind: 'pd', def: 1, rpsn: 0.25, price: 50, look: { f: 'charm', a: 0x16, b: 0x28 } },
  pd_flute: { zh: '牧童短笛', en: 'Herd-boy\'s Flute', kind: 'pd', mmp: 4, chm: 0.25, price: 180, look: { f: 'charm', a: 0x17, b: 0x27 }, dz: '牛飽飽賣的短笛。吹一吹，妖物比較願意跟著你。', de: 'A flute from Niu Baobao. Play it and creatures are likelier to follow you.' },
  pd2: { zh: '青玉佩', en: 'Green Jade Pendant', kind: 'pd', mmp: 8, regen: 1, price: 420, look: { f: 'jade', a: 0x2A, b: 0x1A } },
  pd3: { zh: '避毒珠', en: 'Venom-ward Pearl', kind: 'pd', rpsn: 1, price: 1100, look: { f: 'jade', a: 0x30, b: 0x34 } },
  pd_sachet: { zh: '百花香囊', en: 'Hundred-flower Sachet', kind: 'pd', mmp: 8, chm: 0.4, rpin: 0.3, price: 1800, look: { f: 'charm', a: 0x24, b: 0x34 }, dz: '阿蠻做的香囊，妖物聞了就想親近。', de: 'A sachet A-Man sewed; creatures want to come close.' },
  pd4: { zh: '定神香囊', en: 'Calm-mind Sachet', kind: 'pd', mmp: 6, rpin: 0.6, rseal: 0.6, price: 1600, look: { f: 'charm', a: 0x14, b: 0x24 } },
  pd_beads: { zh: '金剛念珠', en: 'Vajra Prayer Beads', kind: 'pd', def: 4, mmp: 12, rpin: 0.5, rseal: 0.5, price: 2600, look: { f: 'beads', a: 0x18, b: 0x28 } },
  pd5: { zh: '龍紋玉佩', en: 'Dragon Jade', kind: 'pd', def: 3, mmp: 16, regen: 2, crit: 0.02, price: 5000, look: { f: 'jade', a: 0x2B, b: 0x28 } },
  pd_moon: { zh: '冷月佩', en: 'Cold Moon Pendant', kind: 'pd', agi: 5, mmp: 12, crit: 0.05, price: 6000, look: { f: 'jade', a: 0x31, b: 0x21 }, dz: '冷笑天塞給你的玉佩：「拿去，別丟我的臉。」', de: 'Leng Xiaotian pressed it on you: "Take it. Don\'t shame me."' },
  // 項圈: collars, for monsters only
  cl1: { zh: '皮項圈', en: 'Leather Collar', kind: 'cl', def: 3, price: 40 },
  cl2: { zh: '銅鈴項圈', en: 'Brass-bell Collar', kind: 'cl', def: 6, agi: 2, price: 320, dz: '叮叮噹噹，這種鈴聲可不會讓妖物發狂。', de: 'Jingle jangle: this kind of bell drives no creature mad.' },
  cl3: { zh: '鐵刺項圈', en: 'Spiked Iron Collar', kind: 'cl', def: 10, atk: 4, price: 1100 },
  cl4: { zh: '金項圈', en: 'Gold Collar', kind: 'cl', def: 15, mhp: 20, price: 2800 },
  cl5: { zh: '龍鱗項圈', en: 'Dragon-scale Collar', kind: 'cl', def: 21, atk: 6, price: 6200 },
  cl6: { zh: '麒麟項圈', en: 'Qilin Collar', kind: 'cl', def: 28, atk: 8, mhp: 30, price: 12000 },
};
export const BAG_MAX = 100;   // kinds of items carried (stacks of up to 9)
// the places on the body, in menu order. People wear the first seven; monsters a collar and a pendant.
export const SLOTS = ['w', 'hd', 'a', 'ck', 'c', 'pd', 'bt', 'cl'];
export const HUMAN_SLOTS = ['w', 'hd', 'a', 'ck', 'c', 'pd', 'bt'];
export const MON_SLOTS = ['cl', 'pd'];
export const SLOT_NAME = { w: ['兵器', 'Weapon'], hd: ['頭', 'Head'], a: ['衣甲', 'Armour'], ck: ['披風', 'Cloak'], c: ['護具', 'Bracer'], pd: ['佩飾', 'Pendant'], bt: ['靴', 'Boots'], cl: ['項圈', 'Collar'] };
export const WC_NAME = { dao: ['刀', 'dao'], sword: ['劍', 'sword'], spear: ['槍', 'spear'], staff: ['棍杖', 'staff'], fan: ['扇', 'fan'], ball: ['球', 'ball'], club: ['重兵', 'club'], brush: ['筆', 'brush'] };
export const isGear = (id) => !!ITEMS[id] && SLOTS.includes(ITEMS[id].kind);
export const GEAR_STATS = [['atk', '攻', 'Atk'], ['def', '防', 'Def'], ['agi', '身法', 'Agi'], ['mhp', '體力', 'HP'], ['mmp', '內力', 'MP']];
export const GEAR_FX = [['crit', '會心', 'Crit', 100, '%'], ['rpsn', '抗毒', 'Poison res', 100, '%'], ['rpin', '抗點穴', 'Pin res', 100, '%'], ['rseal', '抗封脈', 'Seal res', 100, '%'], ['regen', '回內力', 'MP regen', 1, '/10'], ['chm', '親和', 'Charm', 100, '%']];
for (const it of Object.values(ITEMS)) {   // a description for gear without its own words
  if (!SLOTS.includes(it.kind)) continue;
  const z = [], e = [];
  if (it.wc) { z.push('〔' + WC_NAME[it.wc][0] + '〕'); e.push('[' + WC_NAME[it.wc][1] + ']'); }
  if (it.kind === 'cl') { z.push('〔妖物用〕'); e.push('[creatures]'); }
  for (const [k, zh, en] of GEAR_STATS) if (it[k]) { z.push(zh + '+' + it[k]); e.push(en + '+' + it[k]); }
  for (const [k, zh, en, m, u] of GEAR_FX) if (it[k]) { z.push(zh + '+' + Math.round(it[k] * m) + u); e.push(en + '+' + Math.round(it[k] * m) + u); }
  it.dz = (it.dz ? it.dz + ' ' : '') + z.join(' '); it.de = (it.de ? it.de + ' ' : '') + e.join(' ');
}

// ---------------------------------------------------------------- shops
export const SHOPS = {
  longmen_w: ['w1', 'b2', 'k1', 'a1', 'c1', 'hd1', 'bt1', 'ck1'],
  longmen_i: ['herb', 'antidote', 'bun', 'wing'],
  xinghua:   ['w1', 'b2', 'k1', 'f1', 'p1', 'a1', 'a6', 'c1', 'hd1', 'bt1', 'pd1'],
  xinghua_i: ['herb', 'antidote', 'bun', 'wing', 'incense'],
  camp:      ['bun', 'herb', 'cl1', 'cl2', 'pd_flute'],
  luoxia:    ['w7', 'w14', 'b3', 'k2', 'p1', 'f1', 'a6', 'a2', 'c2', 'hd2', 'bt2', 'ck2', 'pd1'],
  luoxia_i:  ['herb', 'antidote', 'bun', 'wing', 'incense', 'cl2'],
  suhe:      ['w2', 'w8', 'b3', 'b4', 'k2', 'p2', 'f2', 'a2', 'a7', 'c2', 'c3', 'hd2', 'hd3', 'bt3', 'ck2', 'ck3', 'pd2'],
  suhe_i:    ['herb', 'herb2', 'antidote', 'bun', 'wing', 'incense', 'lantern', 'cl2', 'cl3'],
  wangyue:   ['w6', 'w9', 'b4', 'p3', 'f3', 'a7', 'a3', 'c3', 'hd3', 'hd4', 'bt3', 'bt4', 'ck3', 'pd3'],
  wangyue_i: ['herb', 'herb2', 'antidote', 'bun', 'soul', 'wing', 'incense', 'cl3'],
  yuhuo:     ['w3', 'w16', 'b5', 'k3', 'p3', 'f3', 'a3', 'a8', 'c4', 'hd4', 'bt_tiger', 'ck_tiger', 'pd4'],
  yuhuo_i:   ['herb', 'herb2', 'antidote', 'bun', 'soul', 'qipill', 'wing', 'cl3', 'cl4'],
  qingzhu:   ['a8', 'hd_veil', 'ck4', 'pd_sachet', 'herb2', 'antidote', 'bun', 'lingguo', 'cl4'],
  yankou:    ['w4', 'w12', 'b5', 'k3', 'p4', 'f4', 'a4', 'c4', 'c5', 'hd5', 'bt5', 'ck4', 'pd5'],
  yankou_i:  ['herb2', 'antidote', 'soul', 'qipill', 'wing', 'bun', 'cl4', 'cl5'],
  beiyan:    ['w5', 'w13', 'b6', 'k4', 'p4', 'f4', 'a9', 'a5', 'c5', 'hd6', 'bt5', 'ck5', 'pd5'],
  beiyan_i:  ['herb2', 'soul', 'qipill', 'wing', 'antidote', 'bun', 'lingguo', 'cl5'],
  xuelang:   ['a9', 'c6', 'bt6', 'herb2', 'soul', 'qipill', 'bun', 'cl6'],
};
// 賈八方's travelling stall: what he has left to sell, by how far the story has gone (he sells his own clothes)
export const JIA_STOCK = [['bt_jia', 'bun', 'herb'], ['hd_jia', 'herb2', 'lingguo'], ['f5', 'soul', 'lingguo'], ['b7', 'p5', 'k5', 'lingguo', 'soul']];

// ---------------------------------------------------------------- enemies
// A regular foe is made from its level and role on one smooth curve (so the 60-odd foes stay in line with each
// other and with the party): hp, atk, def, agi, xp, gold. Roles bend it: fast (agi up, hp/def down), tank (hp and
// def up, agi down), brute (hp and atk up), caster / spirit (arts, resistances), man (carries salves, more silver).
// sk = [art, chance] tried in order; items = salves carried (used by the same rules as the party's); res = chance
// to shrug off pressure points and sealing; poison: its bite may poison. skName: its own name for a shared art.
const ROLE = { plain: [1, 1, 1, 1], fast: [0.85, 1, 0.85, 1.6], tank: [1.25, 0.95, 1.4, 0.5], brute: [1.25, 1.08, 1, 0.8], caster: [0.9, 0.9, 1, 1], spirit: [0.9, 0.92, 1.12, 1.1], man: [1, 1, 1, 1] };
function F(zh, en, lv, role = 'plain', o = {}) {
  const [mh, ma, md, mg] = ROLE[role];
  const hp = Math.round((3 + 6.6 * lv + 0.08 * lv * lv) * mh), atk = Math.round((4 + 5.6 * lv) * ma), def = Math.round((1 + 4 * lv) * md), agi = Math.round((3 + 3.1 * lv) * mg);
  const xp = Math.round((1.5 + 0.4 * Math.pow(lv, 1.62)) * (role === 'tank' ? 1.15 : 1)), gold = Math.round((3 + 1.6 * lv + 0.05 * lv * lv) * (role === 'man' ? 1.6 : 1));
  return { zh, en, lv, role, hp, atk, def, agi, xp, gold, mp: 0, ...o };
}
const B = (zh, en, hp, atk, def, agi, xp, gold, o = {}) => ({ zh, en, hp, atk, def, agi, xp, gold, boss: 1, ...o });
export const ENEMIES = {
  // ---- the west (Ch1): fields round Longmen and Xinghua, the Wolf Slope, Luoxia and the Bell Temple
  e_greywolf: F('灰狼', 'Grey Wolf', 1, 'plain'),
  e_bambooviper: F('竹葉青', 'Bamboo Viper', 1, 'plain', { poison: 0.25 }),
  e_cavebat: F('洞蝠', 'Cave Bat', 1, 'fast'),
  e_wisp: F('鬼火', "Will-o'-wisp", 2, 'spirit', { sk: [['fire', 0.3]], res: 0.3, mp: 12 }),
  e_rivercrab: F('河蟹', 'River Crab', 2, 'tank'),
  e_mountainmonkey: F('山猴', 'Mountain Monkey', 2, 'fast'),
  e_lackey: F('黑風嘍囉', 'Black Wind Lackey', 3, 'man', { items: 1 }),
  e_wildboar: F('山豬', 'Wild Boar', 3, 'brute'),
  e_dummy: F('木人樁', 'Living Training Dummy', 4, 'tank', { res: 1 }),
  e_redsnake: F('赤鍊蛇', 'Red Chain Snake', 4, 'fast', { poison: 0.3 }),
  e_tigerhornet: F('虎頭蜂', 'Tiger Hornet', 5, 'fast', { poison: 0.2 }),
  e_centipede: F('蜈蚣', 'Centipede', 5, 'plain', { poison: 0.3 }),
  e_toadstool: F('毒菇妖', 'Toadstool Imp', 5, 'caster', { sk: [['mist', 0.3]], poison: 0.2, skName: { mist: ['毒粉', 'Spore Cloud'] }, mp: 16 }),
  e_cudgeler: F('黑風棍手', 'Black Wind Cudgeler', 6, 'man', { items: 1 }),
  e_windsprite: F('風精', 'Wind Sprite', 6, 'spirit', { sk: [['qi', 0.3]], res: 0.4, skName: { qi: ['旋風刃', 'Whirlwind Edge'] }, mp: 16 }),
  e_treesprite: F('樹精', 'Tree Sprite', 7, 'tank', { sk: [['heal', 0.3]], mp: 20 }),
  e_littlejiangshi: F('小殭屍', 'Little Jiangshi', 7, 'tank', { poison: 0.2, res: 0.8 }),
  e_archer: F('山賊弓手', 'Bandit Archer', 7, 'man', { items: 1, sk: [['qi', 0.25]], skName: { qi: ['冷箭', 'Cold Arrow'] }, mp: 12 }),
  e_bloodbat: F('吸血蝠', 'Blood Bat', 8, 'fast'),
  e_roguemonk: F('惡僧', 'Rogue Monk', 8, 'man', { items: 1, sk: [['guard', 0.2], ['heal', 0.25]], res: 0.3, mp: 20 }),
  e_papereffigy: F('紙人', 'Paper Effigy', 9, 'spirit', { sk: [['sleep', 0.25]], res: 0.5, mp: 18 }),
  e_inkspirit: F('墨靈', 'Ink Spirit', 9, 'spirit', { sk: [['seal', 0.15], ['inkall', 0.25]], res: 0.4, skName: { inkall: ['墨雨', 'Ink Rain'] }, mp: 24 }),
  e_acolyte: F('馭妖宗徒', 'Beastbinder Acolyte', 9, 'man', { items: 1, sk: [['fire', 0.3], ['heal', 0.2]], skName: { fire: ['鈴火', 'Bell Fire'] }, mp: 24 }),
  e_bronzeman: F('銅人', 'Bronze Guardian', 10, 'tank', { sk: [['guard', 0.25]], res: 1 }),
  // ---- the canal lands (Ch2): around Suhe, the Su Mansion, Green Wave Cave
  e_drowned: F('水鬼', 'Drowned Ghost', 10, 'caster', { sk: [['sleep', 0.2], ['qi', 0.25]], res: 0.3, skName: { qi: ['水箭', 'Water Arrow'] }, mp: 24 }),
  e_pirate: F('水寇', 'River Pirate', 10, 'man', { items: 1 }),
  e_goldmonkey: F('金毛猴', 'Golden Monkey', 11, 'fast', { items: 1 }),
  e_bloodwolf: F('血狼', 'Blood Wolf', 11, 'fast'),
  e_mudspirit: F('泥靈', 'Mud Spirit', 12, 'spirit', { sk: [['mist', 0.25]], res: 0.4, skName: { mist: ['泥漿', 'Mud Splash'] }, mp: 20 }),
  e_skeleton: F('骷髏劍客', 'Skeleton Swordsman', 12, 'plain', { res: 0.6 }),
  e_ironboar: F('鐵鬃豬', 'Ironbristle Boar', 12, 'brute'),
  e_glowcap: F('熒光菇', 'Glowcap', 13, 'caster', { sk: [['mistall', 0.2], ['mist', 0.25]], skName: { mistall: ['迷孢', 'Dream Spores'] }, mp: 24 }),
  e_lotusghost: F('蓮池鬼', 'Lotus Pond Ghost', 13, 'caster', { sk: [['heal', 0.25], ['sleep', 0.2], ['qi', 0.2]], skName: { qi: ['荷刺', 'Lotus Thorn'] }, res: 0.5, mp: 30 }),
  e_redpaper: F('紅紙人', 'Red Paper Effigy', 14, 'spirit', { sk: [['sleep', 0.2], ['fire', 0.25]], skName: { fire: ['喜燭火', 'Wedding Candle'] }, res: 0.5, mp: 30 }),
  e_assassin: F('斗笠刺客', 'Bamboo-hat Assassin', 15, 'fast', { items: 1, sk: [['sleep', 0.2]], mp: 12 }),
  e_daoist: F('妖道', 'Rogue Daoist', 15, 'caster', { items: 1, sk: [['heal', 0.25], ['seal', 0.15], ['fire2', 0.3]], res: 0.4, skName: { fire2: ['符火', 'Talisman Fire'] }, mp: 40 }),
  e_ironcrab: F('鐵甲蟹', 'Iron Crab', 16, 'tank'),
  e_goldcentipede: F('金頭蜈蚣', 'Golden Centipede', 16, 'plain', { poison: 0.4, sk: [['mist', 0.2]], skName: { mist: ['金毒', 'Golden Venom'] }, mp: 16 }),
  // ---- the south (Ch3): the isles, the sea, the bamboo jungle, the swamp and the volcano
  e_goldsnake: F('金環蛇', 'Gold-ring Snake', 17, 'fast', { poison: 0.35 }),
  e_thundersprite: F('雷精', 'Thunder Sprite', 18, 'spirit', { sk: [['thunder', 0.3]], res: 0.5, skName: { thunder: ['落雷', 'Thunderclap'] }, mp: 30 }),
  e_ghosthornet: F('鬼面蜂', 'Ghostface Hornet', 18, 'fast', { poison: 0.35 }),
  e_netherflame: F('冥火', 'Nether Flame', 19, 'spirit', { sk: [['fire2', 0.4]], res: 0.5, mp: 30 }),
  e_bamboosprite: F('竹精', 'Bamboo Sprite', 19, 'tank', { sk: [['heal2', 0.2], ['healall', 0.15]], mp: 40 }),
  e_deadwood: F('枯木精', 'Deadwood Sprite', 20, 'tank', { sk: [['heal2', 0.2]], mp: 30 }),
  e_firehornet: F('火蜂', 'Fire Hornet', 21, 'fast', { poison: 0.25 }),
  e_lavacrab: F('火蟹', 'Lava Crab', 21, 'tank', { sk: [['fire', 0.2]], skName: { fire: ['噴火', 'Spit Fire'] }, mp: 12 }),
  e_lavawolf: F('熔岩狼', 'Lava Wolf', 22, 'fast', { sk: [['fire2', 0.15]], skName: { fire2: ['熔岩吐息', 'Lava Breath'] }, mp: 12 }),
  e_bloodthug: F('血刀門打手', 'Blood Saber Thug', 22, 'man', { items: 1, sk: [['qi2', 0.12]], skName: { qi2: ['血刀', 'Blood Saber'] }, mp: 14 }),
  e_irondummy: F('鐵木人', 'Iron-bound Dummy', 22, 'tank', { sk: [['guard', 0.2]], res: 1 }),
  e_lavascorpion: F('火蠍', 'Lava Scorpion', 23, 'plain', { poison: 0.4 }),
  e_ironmonk: F('鐵頭惡僧', 'Iron-head Monk', 23, 'brute', { sk: [['guard', 0.2]], res: 0.4, items: 1, mp: 12 }),
  e_bellguard: F('鈴衛', 'Bell Guard', 24, 'fast', { items: 1, sk: [['sleep', 0.2], ['seal', 0.15]], res: 0.5, mp: 20 }),
  // ---- the north (Ch4): snowfields, the ice caves, the Tower of Ten Thousand Beasts
  e_frostwolf: F('霜狼', 'Frost Wolf', 25, 'fast'),
  e_icebat: F('冰蝠', 'Ice Bat', 25, 'fast', { sk: [['frost', 0.2]], skName: { frost: ['冰牙', 'Ice Fang'] }, mp: 10 }),
  e_snowmonkey: F('雪猴', 'Snow Monkey', 26, 'fast', { items: 1 }),
  e_snowsprite: F('雪精', 'Snow Sprite', 26, 'spirit', { sk: [['frost2', 0.3]], res: 0.5, mp: 30 }),
  e_iceboar: F('雪鬃豬', 'Snowbristle Boar', 27, 'brute'),
  e_coldpool: F('寒潭鬼', 'Cold Pool Ghost', 27, 'caster', { sk: [['sleepall', 0.15], ['frost', 0.3]], res: 0.5, mp: 36 }),
  e_inkscorpion: F('墨蠍', 'Ink Scorpion', 27, 'plain', { poison: 0.4 }),
  e_bronzejiangshi: F('銅甲小殭屍', 'Bronze-armoured Jiangshi', 28, 'tank', { sk: [['seal', 0.2]], res: 0.8, poison: 0.2, mp: 12 }),
  e_icejiangshi: F('冰屍', 'Frozen Jiangshi', 29, 'tank', { sk: [['frost', 0.25]], res: 0.8, mp: 20 }),
  e_bellfire: F('鈴火', 'Bellfire', 30, 'spirit', { sk: [['fire3', 0.3], ['sleepall', 0.1]], res: 0.6, mp: 40 }),
  e_netherarcher: F('幽冥弓手', 'Netherworld Archer', 30, 'man', { items: 1, sk: [['qi2', 0.15]], skName: { qi2: ['冥火箭', 'Nether Arrow'] }, mp: 20 }),
  e_blackbone: F('黑骨劍客', 'Black-bone Swordsman', 30, 'plain', { sk: [['seal', 0.15]], res: 0.7, mp: 10 }),
  e_bellpuppet: F('鈴偶', 'Bell Puppet', 31, 'tank', { sk: [['guard', 0.2], ['sealall', 0.15]], res: 1, mp: 20 }),
  e_vajraguardian: F('金剛銅人', 'Vajra Guardian', 31, 'tank', { sk: [['guard', 0.25]], res: 1, mp: 10 }),
  e_netherassassin: F('幽冥刺客', 'Netherworld Assassin', 32, 'fast', { items: 1, sk: [['sleep', 0.2], ['qi2', 0.12]], mp: 24 }),
  e_blackdaoist: F('黑袍妖道', 'Black-robed Daoist', 32, 'caster', { items: 1, sk: [['fire3', 0.3], ['seal', 0.15], ['heal2', 0.2]], res: 0.6, skName: { fire3: ['黑符冥火', 'Black Talisman Blaze'] }, mp: 60 }),
  e_goldbone: F('金骨將', 'Golden-bone General', 33, 'brute', { sk: [['sweep', 0.2]], res: 0.7, mp: 20 }),
  // ---- money foes: hard to hurt, they run off with their silver
  e_stonetoad: F('石蟾', 'Stone Toad', 8, 'tank', { res: 1, flee: 0.5, hp: 20, def: 120, agi: 60, xp: 60, gold: 220 }),
  e_jadetoad: F('玉蟾', 'Jade Toad', 22, 'tank', { res: 1, flee: 0.5, hp: 40, def: 320, agi: 140, xp: 420, gold: 900 }),
  // ---- big beasts met now and then in the wild (they can be fled, and may join)
  bx_tiger:   F('吊睛白額虎', 'White-Browed Tiger', 12, 'brute', { big: 1, res: 0.3, hpx: 2.4 }),
  bx_ape:     F('白猿', 'White Ape', 16, 'fast', { big: 1, items: 2, sk: [['guard', 0.2], ['dbl', 0.25]], res: 0.6, hpx: 2.4, mp: 30 }),
  bx_shanxiao:F('山魈', 'Shanxiao', 20, 'brute', { big: 1, items: 2, sk: [['sleep', 0.15], ['roar', 0.1]], res: 0.5, hpx: 2.4, mp: 20 }),
  bx_toad:    F('毒蟾', 'Venom Toad', 21, 'tank', { big: 1, poison: 0.4, sk: [['mist2', 0.3]], res: 0.6, hpx: 2.2, mp: 40 }),
  bx_crow:    F('三足火鴉', 'Fire Crow', 23, 'fast', { big: 1, sk: [['fire3', 0.25]], skName: { fire3: ['三足金焰', 'Three-foot Blaze'] }, res: 0.5, hpx: 2.4, mp: 40 }),
  bx_jiao:    F('江蛟', 'River Jiao', 18, 'caster', { big: 1, sk: [['qi2', 0.25], ['heal2', 0.15]], skName: { qi2: ['翻江浪', 'Overturning Wave'] }, res: 0.5, hpx: 2.4, mp: 50 }),
  bx_fox:     F('九尾狐', 'Nine-Tailed Fox', 26, 'caster', { big: 1, sk: [['mistall', 0.2], ['fire3', 0.25], ['heal2', 0.2]], skName: { fire3: ['狐火', 'Fox Fire'] }, res: 0.7, hpx: 2.4, mp: 60 }),
  bx_lion:    F('鎮宅石獅', 'Stone Guardian Lion', 29, 'tank', { big: 1, sk: [['guard', 0.3], ['roar', 0.1]], res: 1, hpx: 2.2, mp: 30 }),
  bx_jiangshi:F('符咒殭屍', 'Talisman Jiangshi', 15, 'tank', { big: 1, poison: 0.3, sk: [['seal', 0.2], ['mist', 0.25]], res: 1, hpx: 2.2, mp: 30 }),
  // ---- bosses. People are shown by their gallery portrait (por); creatures by a gallery beast (art).
  // escorts: who stands with it (a formation). Only plain numbers, shared arts and a careful AI make them hard.
  b_tiger:    B('鈴縛白額虎', 'Bell-bound Tiger', 260, 38, 22, 30, 120, 150, { art: 'bx_tiger', mp: 20, res: 0.4, sk: [['roar', 0.15], ['dbl', 0.25]], skName: { dbl: ['撲咬', 'Pounce and Bite'] } }),
  chu1:       B('楚天闊', 'Chu Tiankuo', 150, 34, 20, 26, 80, 60, { por: 'chutiankuo', items: 2, mp: 12, sk: [['dbl', 0.3]], skName: { dbl: ['連斬', 'Twin Cut'] }, res: 0.3 }),
  b_qing:     B('御妖使・青', 'Envoy Qing', 420, 62, 40, 40, 360, 400, { art: 'e_acolyte', big: 1.3, items: 3, mp: 80, sk: [['heal2', 0.25], ['fire2', 0.3], ['sleep', 0.15]], skName: { fire2: ['青鈴火', 'Green Bell Fire'] }, res: 0.6, escorts: ['e_acolyte', 'e_acolyte'] }),
  chu2:       B('楚天闊', 'Chu Tiankuo', 420, 70, 46, 52, 300, 200, { por: 'chutiankuo', items: 3, mp: 30, sk: [['dbl', 0.3], ['guard', 0.15]], skName: { dbl: ['連斬', 'Twin Cut'] }, res: 0.4 }),
  b_jiangshi: B('符咒殭屍', 'Talisman Jiangshi', 900, 92, 66, 30, 900, 600, { art: 'bx_jiangshi', mp: 60, poison: 0.35, sk: [['seal', 0.2], ['mist2', 0.25], ['roar', 0.1]], res: 1, escorts: ['e_redpaper', 'e_redpaper'] }),
  b_jiao:     B('鈴縛江蛟', 'Bell-bound River Jiao', 1250, 104, 72, 44, 1300, 800, { art: 'bx_jiao', mp: 120, sk: [['qi2', 0.3], ['heal2', 0.2], ['mistall', 0.12]], skName: { qi2: ['翻江浪', 'Overturning Wave'] }, res: 0.6 }),
  b_toad:     B('鈴縛毒蟾', 'Bell-bound Venom Toad', 1500, 120, 84, 30, 1800, 900, { art: 'bx_toad', mp: 120, poison: 0.45, sk: [['mist2', 0.35], ['heal2', 0.15]], res: 0.7, escorts: ['e_mudspirit', 'e_mudspirit'] }),
  b_chi:      B('御妖使・赤', 'Envoy Chi', 1350, 132, 92, 70, 1900, 1200, { art: 'e_bellguard', big: 1.3, items: 3, mp: 120, sk: [['fire3', 0.3], ['heal2', 0.2], ['sealall', 0.15]], skName: { fire3: ['赤鈴業火', 'Red Bell Blaze'] }, res: 0.7, escorts: ['e_bellguard'] }),
  chu3:       B('楚天闊', 'Chu Tiankuo', 1300, 150, 96, 92, 1600, 400, { por: 'chutiankuo', items: 4, mp: 60, sk: [['skysword', 0.25], ['dbl', 0.3], ['guard', 0.12]], res: 0.5 }),
  b_crow:     B('鈴縛火鴉', 'Bell-bound Fire Crow', 1900, 150, 98, 96, 2600, 1400, { art: 'bx_crow', mp: 160, sk: [['fire3', 0.35], ['heal2', 0.12]], skName: { fire3: ['三足金焰', 'Three-foot Blaze'] }, res: 0.7 }),
  b_mojide:   B('藥王鬼手・莫記得', 'Mo Jide, the Ghost-handed Healer', 2300, 168, 112, 110, 3800, 2000, { por: 'mojide', items: 4, mp: 220, sk: [['healall2', 0.2], ['mist2', 0.3], ['sleepall', 0.12], ['seal', 0.15]], skName: { mist2: ['百草瘴', 'Hundred-herb Miasma'], healall2: ['回春妙手', 'Miracle Hands'] }, res: 0.8, escorts: ['e_bellguard', 'e_bellguard'] }),
  b_lion:     B('鎮塔石獅', 'Tower Guardian Lion', 2300, 182, 150, 50, 4000, 1800, { art: 'bx_lion', mp: 60, sk: [['guard', 0.3], ['roar', 0.15], ['quake', 0.25]], res: 1 }),
  b_bell:     B('萬妖鈴', 'Bell of Ten Thousand Beasts', 1500, 150, 140, 80, 0, 0, { art: 'e_greatbell', mp: 160, sk: [['sleepall', 0.15], ['thunder', 0.3], ['sealall', 0.12]], skName: { thunder: ['萬妖鳴', 'Cry of Ten Thousand'], sleepall: ['迷魂鈴音', 'Spellbinding Peal'] }, res: 1 }),
  b_mowuya:   B('墨無涯', 'Mo Wuya', 2500, 192, 132, 122, 0, 0, { por: 'mowuya', items: 3, mp: 200, sk: [['ink3', 0.22], ['healall2', 0.12], ['inkall2', 0.25], ['seal', 0.12]], skName: { ink3: ['萬妖朝宗', 'All Beasts Bow'], inkall2: ['百獸奔騰', 'Stampede'] }, res: 1, escorts: ['b_bell'], final: 1 }),
  // optional guardians (the Bamboo Sea)
  g_ape:      B('白猿', 'White Ape', 1500, 140, 90, 100, 2000, 600, { art: 'bx_ape', items: 3, mp: 60, sk: [['guard', 0.2], ['rush', 0.3]], res: 0.6 }),
  g_fox:      B('九尾狐', 'Nine-Tailed Fox', 2400, 170, 110, 120, 4200, 1600, { art: 'bx_fox', mp: 220, sk: [['mistall', 0.2], ['fire3', 0.3], ['heal2', 0.2]], skName: { fire3: ['狐火', 'Fox Fire'] }, res: 0.8 }),
};
for (const [id, E] of Object.entries(ENEMIES)) {
  if (E.hpx) { E.hp = Math.round(E.hp * E.hpx); E.xp = Math.round(E.xp * 2.5); E.gold = Math.round(E.gold * 2); E.atk = Math.round(E.atk * 1.08); }
  if (E.sk) E.sk = E.sk.filter(([k, p]) => SKILLS[k] && p > 0);
}
export const ART_OF = (id) => ENEMIES[id].art || id;

// ---------------------------------------------------------------- how a foe's blows look in battle (presentation only)
// atkFx: claw | bite | ram | blunt | sting | arrow | magic | spore | slash (default: a weapon swing)
const ATK_FX_OF = {
  claw: ['e_mountainmonkey', 'e_goldmonkey', 'e_snowmonkey', 'e_rivercrab', 'e_ironcrab', 'e_lavacrab', 'e_littlejiangshi', 'e_bronzejiangshi', 'e_icejiangshi', 'bx_tiger', 'bx_shanxiao', 'bx_ape', 'bx_crow', 'bx_jiangshi', 'b_tiger', 'b_jiangshi', 'b_crow', 'g_ape'],
  bite: ['e_cavebat', 'e_bloodbat', 'e_icebat', 'e_bambooviper', 'e_redsnake', 'e_goldsnake', 'e_greywolf', 'e_bloodwolf', 'e_frostwolf', 'e_lavawolf', 'e_centipede', 'e_goldcentipede', 'bx_toad', 'bx_jiao', 'bx_lion', 'bx_fox', 'e_stonetoad', 'e_jadetoad', 'b_jiao', 'b_toad', 'b_lion', 'g_fox'],
  ram: ['e_wildboar', 'e_ironboar', 'e_iceboar'],
  blunt: ['e_cudgeler', 'e_dummy', 'e_irondummy', 'e_bellpuppet', 'e_bronzeman', 'e_vajraguardian', 'e_roguemonk', 'e_ironmonk', 'e_treesprite', 'e_deadwood', 'e_bamboosprite', 'e_lackey', 'e_pirate', 'b_bell'],
  sting: ['e_tigerhornet', 'e_ghosthornet', 'e_firehornet', 'e_lavascorpion', 'e_inkscorpion'],
  arrow: ['e_archer', 'e_netherarcher'],
  magic: ['e_wisp', 'e_windsprite', 'e_papereffigy', 'e_redpaper', 'e_inkspirit', 'e_thundersprite', 'e_netherflame', 'e_bellfire', 'e_drowned', 'e_lotusghost', 'e_coldpool', 'e_snowsprite', 'e_daoist', 'e_blackdaoist', 'e_mudspirit', 'e_acolyte', 'b_qing', 'b_mowuya'],
  spore: ['e_toadstool', 'e_glowcap'],
};
const MAGIC_COL = {
  e_wisp: [0x1C, 0x2C, 0x3C], e_windsprite: [0x1A, 0x2A, 0x3A], e_papereffigy: [0x06, 0x16, 0x30], e_redpaper: [0x06, 0x16, 0x38], e_inkspirit: [0x00, 0x10, 0x30],
  e_thundersprite: [0x28, 0x38, 0x30], e_netherflame: [0x14, 0x24, 0x34], e_bellfire: [0x14, 0x25, 0x35], e_drowned: [0x12, 0x22, 0x32], e_coldpool: [0x11, 0x21, 0x31],
  e_snowsprite: [0x11, 0x31, 0x30], e_lotusghost: [0x15, 0x25, 0x2A], e_mudspirit: [0x07, 0x17, 0x27], e_glowcap: [0x1C, 0x2C, 0x3B], e_acolyte: [0x0A, 0x1A, 0x2A],
  e_daoist: [0x16, 0x27, 0x38], e_blackdaoist: [0x04, 0x14, 0x24], bx_jiao: [0x12, 0x21, 0x31], b_jiao: [0x12, 0x21, 0x31], bx_fox: [0x15, 0x25, 0x35], g_fox: [0x15, 0x25, 0x35],
  e_toadstool: [0x14, 0x24, 0x29], e_goldcentipede: [0x18, 0x28, 0x38], bx_toad: [0x14, 0x24, 0x29], b_toad: [0x14, 0x24, 0x29], bx_jiangshi: [0x1A, 0x29, 0x39], b_jiangshi: [0x1A, 0x29, 0x39],
  bx_crow: [0x16, 0x27, 0x38], b_crow: [0x16, 0x27, 0x38], b_qing: [0x0A, 0x1A, 0x2A], b_chi: [0x06, 0x16, 0x27], b_mojide: [0x0B, 0x1B, 0x2B], b_bell: [0x18, 0x28, 0x38], b_mowuya: [0x00, 0x10, 0x30],
  e_lavawolf: [0x06, 0x16, 0x27], e_lavacrab: [0x06, 0x16, 0x27], e_icebat: [0x11, 0x21, 0x31], e_icejiangshi: [0x11, 0x21, 0x31],
};
for (const [fx, ids] of Object.entries(ATK_FX_OF)) for (const id of ids) if (ENEMIES[id]) ENEMIES[id].atkFx = fx;
for (const [id, E] of Object.entries(ENEMIES)) { if (!E.atkFx) E.atkFx = 'slash'; E.mc = MAGIC_COL[id] || null; }

// ---------------------------------------------------------------- what a beaten foe may drop: [item, chance] each rolled on its own
const DROPS = {
  e_greywolf: [['pelt', 0.15], ['ck_wolf', 0.02]], e_bambooviper: [['venom', 0.12]], e_cavebat: [['herb', 0.08]], e_wisp: [['talisman', 0.1]],
  e_rivercrab: [['ore', 0.06]], e_mountainmonkey: [['bun', 0.12], ['hd1', 0.03]], e_lackey: [['herb', 0.15], ['bt1', 0.05]], e_wildboar: [['pelt', 0.22]],
  e_dummy: [['ore', 0.1]], e_redsnake: [['venom', 0.2], ['antidote', 0.1]], e_tigerhornet: [['venom', 0.2]], e_centipede: [['venom', 0.2], ['antidote', 0.1]],
  e_toadstool: [['antidote', 0.25]], e_cudgeler: [['herb', 0.15], ['w14', 0.04]], e_windsprite: [['talisman', 0.12], ['bt2', 0.04]], e_treesprite: [['herb', 0.25], ['pd2', 0.02]],
  e_littlejiangshi: [['talisman', 0.15]], e_archer: [['herb', 0.2], ['hd2', 0.04]], e_bloodbat: [['pelt', 0.15]], e_roguemonk: [['herb', 0.2], ['w9', 0.03]],
  e_papereffigy: [['talisman', 0.25]], e_inkspirit: [['talisman', 0.2], ['qipill', 0.04]], e_acolyte: [['bun', 0.2], ['cl2', 0.04]], e_bronzeman: [['ore', 0.3], ['c3', 0.03]],
  e_drowned: [['pearl', 0.05], ['qipill', 0.05]], e_pirate: [['herb', 0.2], ['a7', 0.02]], e_goldmonkey: [['bun', 0.2], ['bt3', 0.03]], e_bloodwolf: [['pelt', 0.25], ['ck_wolf', 0.04]],
  e_mudspirit: [['antidote', 0.2]], e_skeleton: [['ore', 0.12], ['hd3', 0.03]], e_ironboar: [['pelt', 0.3]], e_glowcap: [['antidote', 0.2], ['qipill', 0.04]],
  e_lotusghost: [['pearl', 0.08], ['herb2', 0.05]], e_redpaper: [['talisman', 0.25], ['soul', 0.02]], e_assassin: [['herb', 0.2], ['hd_veil', 0.03]], e_daoist: [['talisman', 0.25], ['pd1', 0.05]],
  e_ironcrab: [['ore', 0.3], ['pearl', 0.04]], e_goldcentipede: [['venom', 0.3], ['pd3', 0.02]], e_goldsnake: [['venom', 0.3], ['bun', 0.1]], e_thundersprite: [['talisman', 0.15], ['qipill', 0.06]],
  e_ghosthornet: [['venom', 0.3]], e_netherflame: [['talisman', 0.2], ['emberstone', 0.04]], e_bamboosprite: [['herb2', 0.15], ['lingguo', 0.03]], e_deadwood: [['herb2', 0.15], ['pd2', 0.04]],
  e_firehornet: [['venom', 0.25], ['emberstone', 0.06]], e_lavacrab: [['emberstone', 0.15], ['ore', 0.2]], e_lavawolf: [['pelt', 0.3], ['emberstone', 0.08]], e_bloodthug: [['herb2', 0.15], ['ck3', 0.03]],
  e_irondummy: [['ore', 0.35], ['bt4', 0.03]], e_lavascorpion: [['venom', 0.3], ['emberstone', 0.1]], e_ironmonk: [['qipill', 0.08], ['pd_beads', 0.02]], e_bellguard: [['soul', 0.04], ['cl4', 0.03]],
  e_frostwolf: [['pelt', 0.3], ['ck4', 0.02]], e_icebat: [['frostjade', 0.04]], e_snowmonkey: [['bun', 0.25], ['lingguo', 0.03]], e_snowsprite: [['frostjade', 0.08], ['qipill', 0.06]],
  e_iceboar: [['pelt', 0.35], ['frostjade', 0.04]], e_coldpool: [['pearl', 0.1], ['w12', 0.02]], e_inkscorpion: [['venom', 0.3]], e_bronzejiangshi: [['ore', 0.2], ['hd4', 0.03]],
  e_icejiangshi: [['frostjade', 0.1], ['soul', 0.03]], e_bellfire: [['bellcopper', 0.06], ['qipill', 0.08]], e_netherarcher: [['herb2', 0.2], ['qipill', 0.08]], e_blackbone: [['ore', 0.2], ['ck5', 0.02]],
  e_bellpuppet: [['bellcopper', 0.12], ['cl5', 0.03]], e_vajraguardian: [['ore', 0.4], ['pd4', 0.03]], e_netherassassin: [['qipill', 0.1], ['bt6', 0.02]], e_blackdaoist: [['talisman', 0.3], ['pd5', 0.03]],
  e_goldbone: [['bellcopper', 0.1], ['hd6', 0.02]], e_stonetoad: [['pearl', 0.3]], e_jadetoad: [['frostjade', 0.3], ['lingguo', 0.1]],
  bx_tiger: [['ck_tiger', 0.5], ['tigerbone', 0.6]], bx_ape: [['lingguo', 0.6]], bx_shanxiao: [['pelt', 1], ['bt_tiger', 0.4]], bx_toad: [['pd3', 0.6], ['venom', 1]],
  bx_crow: [['hd_crow', 0.5]], bx_jiao: [['c_jiao', 0.5], ['pearl', 1]], bx_fox: [['ck_fox', 0.4]], bx_lion: [['hd_lion', 0.5]], bx_jiangshi: [['talisman', 1], ['soul', 0.3]],
  b_tiger: [['ck_tiger', 1]], chu1: [['bun', 1]], b_qing: [['cl2', 1], ['qipill', 1]], chu2: [['herb2', 1]], b_jiangshi: [['soul', 1]], b_jiao: [['c_jiao', 1]],
  b_toad: [['pd3', 1]], b_chi: [['cl4', 1]], chu3: [['herb2', 1]], b_crow: [['hd_crow', 1]], b_mojide: [['soul', 1], ['qipill', 1]], b_lion: [['hd_lion', 1]],
  g_ape: [['lingguo', 1], ['c5', 1]], g_fox: [['ck_fox', 1]],
};
for (const [id, d] of Object.entries(DROPS)) if (ENEMIES[id]) ENEMIES[id].drop = d;
for (const E of Object.values(ENEMIES)) if (!E.drop) E.drop = [];

// ---------------------------------------------------------------- monsters that may join (魔物加入)
// rate: the base chance that a beaten one gets up and asks to come along (rolled for the last foe beaten).
// role decides its growth and its arts; arts: [level, art]. Its numbers grow on the same curve as the people,
// bent by role (g: hp, mp, str, agi, def) and a little by how strong the species is (q).
const MROLE = {
  plain:  { g: [1, 0.5, 1, 1, 1], arts: [[3, 'dbl'], [12, 'smash'], [22, 'sweep']] },
  fast:   { g: [0.85, 0.5, 0.96, 1.35, 0.8], arts: [[2, 'dbl'], [10, 'rush'], [20, 'sweep']] },
  tank:   { g: [1.25, 0.45, 0.9, 0.6, 1.4], arts: [[1, 'guard'], [5, 'roar'], [11, 'cover'], [18, 'guardall'], [26, 'quake']] },
  brute:  { g: [1.15, 0.4, 1.15, 0.8, 1], arts: [[2, 'smash'], [9, 'roar'], [16, 'sweep'], [26, 'quake']] },
  caster: { g: [0.85, 1.6, 0.75, 1, 0.85], arts: [[1, 'fire'], [6, 'fire2'], [11, 'sleep'], [17, 'thunder'], [25, 'fire3']] },
  spirit: { g: [0.85, 1.5, 0.75, 1.1, 0.95], arts: [[1, 'qi'], [7, 'sleep'], [12, 'seal'], [18, 'frost2'], [26, 'fire3']] },
  healer: { g: [0.95, 1.5, 0.7, 0.9, 1.05], arts: [[1, 'heal'], [4, 'cure'], [9, 'healall'], [14, 'revive'], [20, 'heal2'], [28, 'healall2']] },
};
export const MROLE_NAME = { plain: ['均衡', 'balanced'], fast: ['迅捷', 'quick'], tank: ['坦護', 'tank'], brute: ['蠻力', 'brute'], caster: ['法術', 'caster'], spirit: ['靈體', 'spirit'], healer: ['治療', 'healer'] };
const SP = (role, rate, o = {}) => ({ role, rate, ...o });
export const SPECIES = {
  e_greywolf: SP('fast', 1 / 6), e_bambooviper: SP('fast', 1 / 6, { arts: [[2, 'dbl'], [8, 'mist'], [16, 'rush']] }), e_cavebat: SP('fast', 1 / 6),
  e_wisp: SP('caster', 1 / 6), e_rivercrab: SP('tank', 1 / 7), e_mountainmonkey: SP('fast', 1 / 7, { arts: [[2, 'steal'], [6, 'dbl'], [14, 'rush']] }),
  e_wildboar: SP('brute', 1 / 8), e_dummy: SP('tank', 1 / 8), e_redsnake: SP('fast', 1 / 8, { arts: [[4, 'dbl'], [8, 'mist'], [16, 'rush']] }),
  e_tigerhornet: SP('fast', 1 / 8), e_centipede: SP('plain', 1 / 8), e_toadstool: SP('healer', 1 / 8, { arts: [[5, 'mist'], [6, 'heal'], [8, 'cure'], [12, 'healall'], [18, 'mistall'], [24, 'mist2']] }),
  e_windsprite: SP('spirit', 1 / 10), e_treesprite: SP('healer', 1 / 10), e_littlejiangshi: SP('tank', 1 / 10),
  e_bloodbat: SP('fast', 1 / 10), e_papereffigy: SP('spirit', 1 / 12, { arts: [[9, 'sleep'], [12, 'mistall'], [16, 'fire2'], [24, 'fire3']] }),
  e_inkspirit: SP('caster', 1 / 12, { arts: [[9, 'inkall'], [13, 'seal'], [18, 'ink2'], [26, 'inkall2']] }), e_bronzeman: SP('tank', 1 / 14),
  e_drowned: SP('spirit', 1 / 12, { arts: [[10, 'qi'], [13, 'sleep'], [18, 'frost2'], [24, 'heal2']] }), e_goldmonkey: SP('fast', 1 / 12, { arts: [[11, 'steal'], [13, 'dbl'], [18, 'rush']] }),
  e_bloodwolf: SP('fast', 1 / 12), e_mudspirit: SP('caster', 1 / 12, { arts: [[12, 'mist'], [15, 'mistall'], [20, 'mist2'], [28, 'healall']] }), e_skeleton: SP('plain', 1 / 14),
  e_ironboar: SP('brute', 1 / 14), e_glowcap: SP('healer', 1 / 14, { arts: [[13, 'heal'], [14, 'mistall'], [16, 'healall'], [20, 'revive'], [26, 'heal2']] }),
  e_lotusghost: SP('healer', 1 / 16), e_redpaper: SP('spirit', 1 / 16, { arts: [[14, 'fire'], [16, 'sleep'], [20, 'fire2'], [28, 'fire3']] }),
  e_ironcrab: SP('tank', 1 / 16), e_goldcentipede: SP('plain', 1 / 16, { arts: [[16, 'mist'], [20, 'dbl'], [26, 'mist2']] }),
  e_goldsnake: SP('fast', 1 / 18), e_thundersprite: SP('caster', 1 / 18, { arts: [[18, 'thunder'], [22, 'sleep'], [28, 'fire3']] }), e_ghosthornet: SP('fast', 1 / 18),
  e_netherflame: SP('caster', 1 / 18), e_bamboosprite: SP('healer', 1 / 18, { arts: [[19, 'heal2'], [20, 'healall'], [23, 'revive'], [28, 'healall2']] }), e_deadwood: SP('tank', 1 / 20),
  e_firehornet: SP('fast', 1 / 20), e_lavacrab: SP('tank', 1 / 20), e_lavawolf: SP('fast', 1 / 22, { arts: [[22, 'rush'], [24, 'fire2'], [30, 'sweep']] }), e_irondummy: SP('tank', 1 / 22),
  e_lavascorpion: SP('plain', 1 / 22), e_frostwolf: SP('fast', 1 / 24), e_icebat: SP('fast', 1 / 24, { arts: [[25, 'frost'], [27, 'rush'], [32, 'frost2']] }),
  e_snowmonkey: SP('fast', 1 / 24, { arts: [[26, 'steal'], [27, 'rush'], [32, 'sweep']] }), e_snowsprite: SP('spirit', 1 / 26, { arts: [[26, 'frost'], [27, 'frost2'], [30, 'sleepall'], [34, 'healall2']] }),
  e_iceboar: SP('brute', 1 / 26), e_coldpool: SP('spirit', 1 / 26), e_inkscorpion: SP('plain', 1 / 26), e_bronzejiangshi: SP('tank', 1 / 28), e_icejiangshi: SP('tank', 1 / 28),
  e_bellfire: SP('caster', 1 / 30), e_bellpuppet: SP('tank', 1 / 30), e_blackbone: SP('plain', 1 / 30), e_vajraguardian: SP('tank', 1 / 32), e_goldbone: SP('brute', 1 / 32),
  e_stonetoad: SP('tank', 1 / 16, { arts: [[9, 'guard'], [14, 'roar']] }), e_jadetoad: SP('tank', 1 / 24, { arts: [[22, 'guard'], [26, 'guardall']] }),
  bx_tiger: SP('brute', 1 / 40, { cap: 40, q: 1.12 }), bx_ape: SP('fast', 1 / 40, { cap: 40, q: 1.12 }), bx_shanxiao: SP('brute', 1 / 40, { cap: 40, q: 1.12 }),
  bx_toad: SP('caster', 1 / 40, { cap: 40, q: 1.12, arts: [[21, 'mist2'], [24, 'healall'], [30, 'mistall']] }), bx_crow: SP('caster', 1 / 48, { cap: 40, q: 1.14 }),
  bx_jiao: SP('caster', 1 / 40, { cap: 40, q: 1.12, arts: [[18, 'qi2'], [21, 'heal2'], [26, 'frost2'], [32, 'healall2']] }), bx_fox: SP('caster', 1 / 56, { cap: 40, q: 1.15, arts: [[26, 'fire3'], [28, 'mistall'], [32, 'heal3']] }),
  bx_lion: SP('tank', 1 / 48, { cap: 40, q: 1.14 }), bx_jiangshi: SP('tank', 1 / 40, { cap: 40, q: 1.12 }),
};
for (const [id, S] of Object.entries(SPECIES)) {
  const E = ENEMIES[id], R = MROLE[S.role];
  S.lv = E.lv; S.q = S.q || 0.86 + 0.26 * Math.min(1, E.lv / 33); S.cap = S.cap || Math.min(MAX_LV, Math.round(20 + E.lv * 0.9));
  S.g = R.g; S.arts = (S.arts || R.arts.map(([l, k]) => [Math.max(E.lv, l + Math.floor(E.lv * 0.6)), k])).filter(([, k]) => SKILLS[k]);
  S.slots = ['cl', 'pd'];
}
// suggested names when one joins (people can keep the species name or type their own)
export const PET_NAMES = [['小黑', 'Inky'], ['阿花', 'Blossom'], ['旺財', 'Lucky'], ['小虎', 'Tigger'], ['團團', 'Dumpling'], ['豆豆', 'Bean'], ['阿福', 'Fortune'], ['小雪', 'Snowy'], ['大毛', 'Fuzz'], ['小灰', 'Ashy'], ['咪咪', 'Mimi'], ['阿呆', 'Dozy'], ['胖胖', 'Chubby'], ['小金', 'Goldie'], ['圓圓', 'Pebble'], ['飯糰', 'Rice Ball']];

// ---------------------------------------------------------------- where enemies live: pools, group sizes
// A pool lists who can turn up; `n` gives the chance of 1, 2, 3 or 4 foes; a group is usually all one kind.
export const ZONES = {
  1: { pool: ['e_greywolf', 'e_bambooviper', 'e_cavebat', 'e_greywolf', 'e_wisp'], n: [0.7, 0.3] },
  2: { pool: ['e_rivercrab', 'e_mountainmonkey', 'e_wildboar', 'e_redsnake', 'e_lackey', 'e_wisp'], n: [0.45, 0.4, 0.15] },
  3: { pool: ['e_tigerhornet', 'e_centipede', 'e_toadstool', 'e_windsprite', 'e_treesprite', 'e_cudgeler', 'e_archer', 'e_stonetoad'], n: [0.3, 0.4, 0.3] },
  4: { pool: ['e_drowned', 'e_pirate', 'e_goldmonkey', 'e_bloodwolf', 'e_mudspirit', 'e_skeleton', 'e_ironboar', 'e_stonetoad'], n: [0.25, 0.4, 0.25, 0.1] },
  5: { pool: ['e_glowcap', 'e_lotusghost', 'e_assassin', 'e_daoist', 'e_ironcrab', 'e_goldcentipede', 'e_bloodwolf'], n: [0.2, 0.35, 0.3, 0.15] },
  6: { pool: ['e_goldsnake', 'e_thundersprite', 'e_ghosthornet', 'e_netherflame', 'e_deadwood', 'e_ironcrab'], n: [0.2, 0.35, 0.3, 0.15] },
  7: { pool: ['e_bamboosprite', 'e_goldsnake', 'e_firehornet', 'e_lavawolf', 'e_bloodthug', 'e_ghosthornet', 'e_jadetoad'], n: [0.2, 0.35, 0.3, 0.15] },
  8: { pool: ['e_frostwolf', 'e_icebat', 'e_snowmonkey', 'e_snowsprite', 'e_iceboar', 'e_coldpool', 'e_jadetoad'], n: [0.15, 0.35, 0.3, 0.2] },
  9: { pool: ['e_inkscorpion', 'e_bronzejiangshi', 'e_icejiangshi', 'e_netherarcher', 'e_blackbone', 'e_snowsprite'], n: [0.15, 0.35, 0.3, 0.2] },
  // the seas
  s1: { pool: ['e_rivercrab', 'e_drowned', 'e_ironcrab', 'e_lotusghost', 'e_pirate'], n: [0.3, 0.4, 0.3] },
  s2: { pool: ['e_ironcrab', 'e_goldsnake', 'e_drowned', 'e_coldpool', 'e_thundersprite'], n: [0.2, 0.4, 0.3, 0.1] },
  // dungeons
  yelang: { pool: ['e_greywolf', 'e_cavebat', 'e_mountainmonkey', 'e_wildboar', 'e_lackey', 'e_redsnake'], n: [0.4, 0.4, 0.2] },
  lingyin: { pool: ['e_dummy', 'e_papereffigy', 'e_inkspirit', 'e_acolyte', 'e_roguemonk', 'e_bloodbat', 'e_littlejiangshi'], n: [0.3, 0.4, 0.3] },
  lingyin2: { pool: ['e_acolyte', 'e_bronzeman', 'e_papereffigy', 'e_inkspirit', 'e_roguemonk', 'e_bloodbat'], n: [0.25, 0.4, 0.35] },
  sujia: { pool: ['e_redpaper', 'e_papereffigy', 'e_lotusghost', 'e_littlejiangshi', 'e_bloodbat', 'e_inkspirit'], n: [0.2, 0.4, 0.3, 0.1] },
  bibo: { pool: ['e_drowned', 'e_ironcrab', 'e_glowcap', 'e_lotusghost', 'e_goldcentipede', 'e_pirate'], n: [0.2, 0.35, 0.3, 0.15] },
  zhulin: { pool: ['e_bamboosprite', 'e_goldsnake', 'e_ghosthornet', 'e_goldmonkey', 'e_deadwood'], n: [0.2, 0.35, 0.3, 0.15] },
  dulong: { pool: ['e_mudspirit', 'e_goldsnake', 'e_deadwood', 'e_ghosthornet', 'e_netherflame', 'e_glowcap'], n: [0.15, 0.35, 0.3, 0.2] },
  chiyan: { pool: ['e_lavacrab', 'e_lavawolf', 'e_firehornet', 'e_lavascorpion', 'e_netherflame', 'e_bellguard'], n: [0.15, 0.35, 0.3, 0.2] },
  chiyan2: { pool: ['e_lavawolf', 'e_lavascorpion', 'e_ironmonk', 'e_irondummy', 'e_bellguard', 'e_jadetoad'], n: [0.15, 0.35, 0.3, 0.2] },
  bingpo: { pool: ['e_icebat', 'e_coldpool', 'e_snowsprite', 'e_icejiangshi', 'e_frostwolf', 'e_bronzejiangshi'], n: [0.15, 0.3, 0.35, 0.2] },
  tower: { pool: ['e_bellfire', 'e_bellpuppet', 'e_netherarcher', 'e_blackbone', 'e_bellguard', 'e_vajraguardian'], n: [0.15, 0.3, 0.35, 0.2] },
  tower2: { pool: ['e_bellfire', 'e_bellpuppet', 'e_netherassassin', 'e_blackdaoist', 'e_goldbone', 'e_vajraguardian'], n: [0.15, 0.3, 0.35, 0.2] },
};
// now and then a big beast instead (by zone)
export const RARE = { 3: 'bx_tiger', 4: 'bx_tiger', 5: 'bx_jiangshi', 6: 'bx_jiao', 7: 'bx_shanxiao', 8: 'bx_fox', zhulin: 'bx_ape', dulong: 'bx_toad', chiyan: 'bx_crow', tower: 'bx_lion' };
export const RARE_CHANCE = 1 / 45;
export const MONEY_FOES = ['e_stonetoad', 'e_jadetoad'];
// chance per step to meet enemies, by world tile
export const ENCOUNTER = { '.': 1 / 22, '=': 1 / 40, f: 1 / 13, h: 1 / 12, s: 1 / 12, w: 1 / 12, n: 1 / 12, b: 1 / 12, B: 1 / 40, D: 0, '~': 1 / 26, c: 1 / 24 };
