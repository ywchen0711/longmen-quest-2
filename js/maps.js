// Towns, dungeons and the people in them. Each map is typed as rows of tiles (legend in maps_base.js TILES); an
// uppercase letter is a person standing on the map's floor, described in `people`. Digits 1-9 are stairs/doors that
// link to the same digit in another map (`links`). Walking off the edge of a town or the first floor of a dungeon
// leads back to the overworld. Talk scripts are async functions run by game.js with the helpers in `S`
// (game.js scripts()). The maps themselves live in maps_ch1.js ... maps_ch4.js, one file per chapter of the story.
import { L, TILES } from './maps_base.js?v=4';
import { CH1 } from './maps_ch1.js?v=4';
import { CH2 } from './maps_ch2.js?v=4';
import { CH3 } from './maps_ch3.js?v=4';
import { CH4 } from './maps_ch4.js?v=4';
export { L, TILES };

export const MAPS = { ...CH1, ...CH2, ...CH3, ...CH4 };

// overworld places: which map each opens, and its look on the world map
export const PLACES = {
  longmen: { map: 'longmen', look: 'town' }, xinghua: { map: 'xinghua', look: 'village' }, camp: { map: 'camp', look: 'ranch' },
  yelang: { map: 'yelang1', look: 'grove' }, luoxia: { map: 'luoxia', look: 'town' }, lingyin: { map: 'lingyin1', look: 'belltemple' },
  suhe: { map: 'suhe', look: 'city' }, sujia: { map: 'sujia1', look: 'mansion' }, bibo: { map: 'bibo1', look: 'cave' }, wangyue: { map: 'wangyue', look: 'port' },
  yuhuo: { map: 'yuhuo', look: 'village' }, qingzhu: { map: 'qingzhu', look: 'miao' }, zhulin: { map: 'zhulin1', look: 'bamboo' }, dulong: { map: 'dulong1', look: 'swampgrove' },
  yankou: { map: 'yankou', look: 'village' }, chiyan: { map: 'chiyan1', look: 'volcano' },
  beiyan: { map: 'beiyan', look: 'fortress' }, xuelang: { map: 'xuelang', look: 'yurts' }, bingpo: { map: 'bingpo1', look: 'icecave' }, wanyao: { map: 'wanyao1', look: 'pagoda' },
};
for (const [pid, p] of Object.entries(PLACES)) { p.name = MAPS[p.map].name; MAPS[p.map].place = pid; }
// the deeper floors of each place know it too (so leaving puts you back outside)
const FLOORS = { yelang2: 'yelang', lingyin2: 'lingyin', lingyin3: 'lingyin', sujia2: 'sujia', sujia3: 'sujia', bibo2: 'bibo', bibo3: 'bibo',
  zhulin2: 'zhulin', dulong2: 'dulong', chiyan2: 'chiyan', chiyan3: 'chiyan', bingpo2: 'bingpo', bingpo3: 'bingpo',
  wanyao2: 'wanyao', wanyao3: 'wanyao', wanyao4: 'wanyao', wanyao5: 'wanyao' };
for (const [m, pid] of Object.entries(FLOORS)) MAPS[m].place = pid;
// rows typed a little ragged are padded to the widest row with the row's own first character
for (const m of Object.values(MAPS)) { const w = Math.max(...m.rows.map((r) => r.length)); m.rows = m.rows.map((r) => r.padEnd(w, r[0] === ' ' ? ' ' : r[0])); m.w = w; m.h = m.rows.length; }
export const TOWNS = ['longmen', 'xinghua', 'camp', 'luoxia', 'suhe', 'wangyue', 'yuhuo', 'qingzhu', 'yankou', 'beiyan', 'xuelang'];
for (const t of TOWNS) MAPS[t].town = 1;
