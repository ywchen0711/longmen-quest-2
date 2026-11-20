// The story's set pieces: the opening, the last confrontation on the tower, and the ending with its epilogue.
import { L, lines } from './maps_base.js?v=2';
import { CAST } from './people_art.js?v=2';
import { t } from './ui.js?v=2';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- the opening (after the prologue page)
export async function opening(G) {
  const S = G.scripts();
  await lines(S, [
    [null, '龍門鎮，聽雨樓前。屠千秋倒下已經半年。', 'Longmen Town, outside the Listening Rain House. Half a year has passed since Tu Qianqiu fell.'],
    [null, '叮——噹——遠處傳來一陣奇怪的鈴聲。鎮外的狼群，忽然一齊嚎叫起來。', 'Ding... dong... A strange bell rings far away. All at once, the wolves outside town begin to howl.'],
    ['yishuo', '哥！你聽，又來了！這個月第三次了！', 'Brother! Listen, there it goes again! That\'s the third time this month!'],
    ['yirui', '嗯。我去鎮外看看。', 'Mm. I\'ll go and have a look outside town.'],
    ['yishuo', '我也要去！上次你一個人去救我，這次換我幫你！球我也帶了！', 'I\'m coming too! Last time you came alone to save me; this time I help you! I brought my ball!'],
    ['yirui', '……跟緊我。', '...Stay close.'],
    [null, '（方向鍵移動，Z／A 鍵交談、調查，X／B 鍵打開選單。先去聽雨樓找白先生吧。）', '(Arrows move. Z / A talks and checks. X / B opens the menu. First, see Mr Bai in the Listening Rain House.)'],
  ]);
}

// ---------------------------------------------------------------- the last confrontation (before the fight)
export async function finalPre(S) {
  const G = S.G, here = (w) => G.party.some((m) => m.who === w);
  await lines(S, [
    [null, '塔頂的鈴心殿裡，一口巨大的青銅鈴懸在半空。三團光——水、火、冰——在鈴心裡打轉。', 'In the Hall of the Bell\'s Heart a huge bronze bell hangs in the air. Three lights, water, fire and ice, turn inside it.'],
    ['mowuya', '你們來了。我等這一天，等了二十年。', 'You have come. I have waited twenty years for this day.'],
  ]);
  if (here('chutiankuo') || G.memberOf('chutiankuo')) await lines(S, [['chutiankuo', '爹！收手吧！那些妖物……那些被鈴鏈燒著的妖物，牠們好痛！', 'Father! Stop this! Those creatures... the ones burning in your bell chains, they hurt so much!'],
    ['mowuya', '天闊。你還小，不懂。', 'Tiankuo. You are young. You do not understand.']]);
  await lines(S, [
    ['mowuya', '二十年前，一群發狂的妖物衝進蘇河城。我的妹妹……就死在那天晚上。', 'Twenty years ago a horde of maddened beasts broke into Suhe. My sister... died that night.'],
    ['mowuya', '從那天起，我發誓要讓天下的妖物都聽話。萬妖鈴一響，再也沒有一隻妖物能傷人。', 'From that day I swore every creature under heaven would obey. When this bell rings, no beast will ever harm anyone again.'],
    ['mowuya', '而且……傳說三魄齊鳴，能把散了的魂魄，召回人間。', 'And... the legend says when the three souls ring together, a scattered spirit can be called back to the world.'],
  ]);
  if (!here('suxiaowan')) await S.say(null, L('一陣涼風拂過。小婉不知什麼時候，已經飄到了大家前面。', 'A cool breeze passes. Without anyone seeing how, Xiaowan has drifted to the front.'));
  await lines(S, [
    ['suxiaowan', '……哥？', '...Brother?'],
    [null, '墨無涯的手一顫。', 'Mo Wuya\'s hand trembles.'],
    ['mowuya', '……你是誰？', '...Who are you?'],
    ['suxiaowan', '是我呀，小婉。你說過今年會回來接我的……你怎麼老了這麼多？', 'It\'s me, Xiaowan. You said you\'d come back for me this year... why have you grown so old?'],
    ['mowuya', '小……婉？……不，不可能。你二十年前就……', 'Xiao... wan? ...No. Impossible. Twenty years ago you...'],
    ['suxiaowan', '二十年前？……（她低頭看著自己透明的手）……原來是這樣。原來，我早就……', 'Twenty years ago? ...(She looks down at her own see-through hands) ...So that\'s it. So I was already...'],
    ['mowuya', '鈴！只要鈴響，你就能回來！真正地回來！誰也別想攔我！', 'The bell! When it rings, you can come back! Truly come back! No one will stop me!'],
    [null, '萬妖鈴嗡嗡作響，三魄的光芒越來越刺眼！', 'The great bell hums, and the light of the three souls blazes ever brighter!'],
  ]);
}

// ---------------------------------------------------------------- after the last fight
export async function finalPost(S) {
  const G = S.G;
  G.audio.stop();
  await lines(S, [
    [null, '萬妖鈴發出一聲長長的哀鳴。鈴身裂開，三魄化作三道光，散向天空。', 'The bell lets out a long, mournful cry. It splits apart, and the three souls fly up into the sky as three beams of light.'],
    ['mowuya', '……鈴……碎了……', '...The bell... is broken...'],
    ['suxiaowan', '哥，夠了。我一直都在。在蘇家的院子裡，泡著茶，等你回來。', 'Brother, enough. I was always here. In the Su garden, making tea, waiting for you to come home.'],
    ['suxiaowan', '這一路上，我遇見了好多好多妖物。有的兇，有的笨，有的會偷吃肉包……', 'On this journey I met so many creatures. Fierce ones, silly ones, ones that steal meat buns...'],
    ['suxiaowan', '可是牠們跟著奕叡他們，不是因為鈴聲。是因為心。', 'But they follow Yi Rui and the others not because of any bell. Because of the heart.'],
    [null, '墨無涯跪倒在地，放聲大哭。', 'Mo Wuya falls to his knees and weeps aloud.'],
  ]);
  if (G.memberOf('chutiankuo')) await S.say('chutiankuo', L('爹……我們回家吧。', 'Father... let\'s go home.'));
  await ending(G);
}

// ---------------------------------------------------------------- the ending and the epilogue
export async function ending(G) {
  G.flags.ending = 1; G.mode = 'ending';
  await G.fadeOut();
  const box = document.getElementById('ending'); box.classList.remove('hidden'); box.innerHTML = '';
  G.audio.play('ending');
  const wait = (ms) => (G.fast ? Promise.resolve() : sleep(ms));
  const show = async (l, ms = 4200) => { const p = document.createElement('p'); p.textContent = t(l); box.appendChild(p); await wait(30); p.classList.add('in'); await wait(ms); };
  const page = (por) => { box.innerHTML = ''; if (por) { const row = document.createElement('div'); row.className = 'endpor'; for (const c of por) { const im = document.createElement('img'); im.src = G.ui.por[c] || (CAST[c] ? CAST[c].portrait : ''); row.appendChild(im); } box.appendChild(row); } };
  const PAGES = [
    [null, [['萬妖鈴碎的那一刻，天下發狂的妖物，在同一瞬間安靜了下來。', 'The moment the bell broke, every maddened creature under heaven fell quiet at once.']]],
    [['mowuya', 'suxiaowan'], [['墨無涯解散了馭妖宗，回到蘇河城，把蘇家舊宅收拾乾淨。', 'Mo Wuya disbanded the Beastbinder Sect, went home to Suhe and swept the old Su mansion clean.'], ['每天傍晚，他在院子裡泡兩杯茶。', 'Every evening he pours two cups of tea in the garden.']]],
    [['mojide', 'tiewusi'], [['莫記得被鐵無私押回武林盟。審問的時候，他說他什麼都記不得了。', 'Tie Wusi brought Mo Jide back to the Alliance. Under questioning he said he could remember nothing at all.'], ['這一次，好像是真的。', 'This time, it seems, he meant it.']]],
    [['chutiankuo'], [['楚天闊撕掉了那本小冊子，又買了一本新的。', 'Chu Tiankuo tore up his little book and bought a new one.'], ['第一頁寫著：「第一勝：跟奕叡他們一起，贏了。」', 'On the first page he wrote: "Win number one: together with Yi Rui and the others."']]],
    [['hubanxian', 'jiabafang', 'huotianxia'], [['胡半仙逢人就說，他早就算到鈴會碎。「這次我說對了！不準不要錢！」', 'Hu Banxian tells everyone he foresaw the bell breaking. "This time I was right! No charge if I\'m wrong!"'], ['賈八方把萬妖鈴的碎片當紀念品賣，賺回了一整套新衣服。', 'Jia Bafang sold the bell\'s shards as keepsakes and earned back a whole new suit of clothes.'], ['霍天下則到處宣揚，那口鈴是他一拳打碎的。', 'And Huo Tianxia told everyone he had broken the bell with one punch.']]],
    [['niubaobao', 'aman', 'wudadan', 'wenduizhang'], [['百獸山寨越來越熱鬧。牛飽飽說，肉包永遠不夠吃。阿蠻常常來玩，跟每一隻妖物都聊得很開心。', 'The Hundred Beasts Camp grows livelier every day. Niu Baobao says there are never enough buns. A-Man visits often and chats happily with every creature.'], ['武大膽開了一家鏢局，招牌上寫著「膽大包天」。文對仗替他寫了一副對聯。', 'Wu Dadan opened an escort agency with the sign "Boundless Courage". Wen Duizhang wrote him a couplet for the door.']]],
    [['suxiaowan'], [['一個月後的早晨，小婉在蘇家的院子裡向大家道別。', 'One morning a month later, Xiaowan said goodbye to everyone in the Su garden.'], ['「茶涼了。我也該走了。」她笑著，消失在早晨的光裡。', '"The tea has gone cold. It\'s time I went too." Smiling, she faded into the morning light.']]],
    [['baixian', 'yirui', 'yishuo'], [['龍門鎮，聽雨樓。「話說那萬妖鈴，一聲碎響，天下百獸齊歸心——」', 'Longmen Town, the Listening Rain House. "And so the bell of ten thousand beasts broke with one ring, and every creature\'s heart came home..."'], ['台下的霍天下嚷道：「那是我打碎的！」滿堂哄笑。奕碩抱著球，笑得最大聲。', 'From the floor Huo Tianxia shouts, "I broke it!" The whole house roars. Yi Shuo, hugging his ball, laughs loudest of all.'],
      ['說完了書，白先生用左手摺了一隻紙鶴，放在窗邊。', 'When the tale is done, Mr Bai folds a paper crane with his left hand and sets it on the windowsill.'], ['他望著窗外的雨，輕聲說：「江湖路遠……下一段書，也快了。」', 'He watches the rain and says softly, "The road of the jianghu is long... the next tale is not far off."']]],
  ];
  for (const [por, ls] of PAGES) { page(por); for (const l of ls) await show(l); await wait(800); }
  await wait(1200); box.innerHTML = '';
  const cr = document.createElement('div'); cr.className = 'credits'; cr.innerHTML = creditsHTML(G); box.appendChild(cr);
  await wait(50); cr.classList.add('roll');
  await wait(30000);
  const fin = document.createElement('div'); fin.className = 'fin'; fin.textContent = t(['— 完 —', '— The End —']); box.appendChild(fin);
  G.map = 'longmen'; G.x = 15; G.y = 7; G.dir = 'up'; G.lastSave = { map: 'longmen', x: 15, y: 4 };
  for (const m of [...G.party, ...G.camp]) { const s = m; s.hp = Math.max(1, s.hp); }
  try { localStorage.setItem('lq2_auto', G.serialize()); } catch (e) {}
  await new Promise((res) => { if (G.ui.driver || G.fast) return res(); const off = G.input.push((k) => { if (k === 'A') { off(); res(); } }); });
  box.classList.add('hidden'); box.innerHTML = '';
  G.mode = 'done';
  if (G.onEnd) G.onEnd();
}
function creditsHTML(G) {
  const s = G.stats, mm = Math.floor(s.time / 60), rec = Object.keys(s.recruited || {}).length;
  return `<h2>${t(['龍門刀客傳　貳', 'Longmen Quest II'])}</h2><p>${t(['萬妖鈴', 'The Bell of Ten Thousand Beasts'])}</p>
  <h3>${t(['登場人物', 'Cast'])}</h3><p>奕叡　奕碩　武大膽　文對仗　蘇小婉　楚天闊<br>白先生　苦禪　柳寒煙　冷笑天　鐵無私<br>胡半仙　賈八方　霍天下　牛飽飽　阿蠻<br>莫記得　墨無涯</p>
  <h3>${t(['美術', 'Art'])}</h3><p>${t(['人物、妖物：本作原創 8-bit 像素（人物圖庫 Character Gallery）', 'People and creatures: original 8-bit pixel art (Character Gallery)'])}</p>
  <h3>${t(['音樂', 'Music'])}</h3><p>${t(['原創晶片音樂，程式合成', 'Original chiptune, synthesised in code'])}</p>
  <h3>${t(['字型', 'Font'])}</h3><p>Cubic 11 (俐方體11號) — SIL OFL 1.1</p>
  <h3>${t(['引擎', 'Engine'])}</h3><p>three.js (MIT)</p>
  <h3>${t(['你的旅程', 'Your journey'])}</h3><p>${t(['等級', 'Level'])} ${G.hero.lv}　${t(['戰鬥', 'Battles'])} ${s.battles}　${t(['夥伴', 'Friends'])} ${rec}　${t(['時間', 'Time'])} ${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}</p>
  <p class="thanks">${t(['感謝遊玩', 'Thank you for playing'])}</p>`;
}
