// Chapter 3 「南疆」 The Southlands (by ship): Fishing-fire Isle, Green Bamboo village, the Bamboo Sea, Poison Dragon
// Marsh, Yankou and the Red Flame Caves. The chapter ends with the theft at the island inn.
import { L, P, lines, chapter, freeBeasts, huPredict, huoBrag, jiaTalk } from './maps_base.js?v=4';

// the night at the inn of Fishing-fire Isle: Mo Jide's sleeping draught, and Tie Wusi
async function innTheft(S) {
  const active = (w) => S.active(w);
  await lines(S, [[null, '夜裡，客棧的門被輕輕敲響。', 'In the night there is a soft knock at the inn door.'],
    ['mojide', '是我，莫記得！聽說你們從火山回來，一身是傷，我特地坐船趕來。來，喝碗安神湯。', 'It\'s me, Mo Jide! I heard you came back from the volcano all battered, so I took a boat over. Here, a bowl of calming soup.']]);
  await S.fadeOut();
  await lines(S, [[null, '湯很香。大家喝下之後，眼皮越來越重……', 'The soup smells wonderful. After a few sips, everyone\'s eyelids grow heavy...']]);
  if (active('suxiaowan') || S.inParty('suxiaowan')) await lines(S, [['suxiaowan', '你們怎麼都睡著了？……莫大夫，你在翻他們的行囊做什麼？', 'Why is everyone asleep? ...Doctor Mo, why are you going through their packs?'],
    ['mojide', '喲，還有一個醒著的？……原來是個鬼。也好，鬼的記性也不好。', 'Oh, one still awake? ...Ah, a ghost. Never mind; ghosts don\'t remember things either.']]);
  await lines(S, [['mojide', '告訴你們一件事吧：我從來沒忘記過任何事。二十年來，我記得每一味藥，每一個病人……和每一個仇人。', 'Let me tell you something: I have never forgotten anything. For twenty years I have remembered every herb, every patient... and every enemy.']]);
  S.take('shuipo'); S.take('huopo');
  await S.fadeIn();
  await lines(S, [[null, '天亮時，水魄和火魄都不見了。桌上留著一張字條：「多謝保管。——藥王鬼手　莫記得」', 'At dawn, the Water and Fire Souls are gone. On the table lies a note: "Thank you for keeping them safe. - Mo Jide, the Ghost-handed Healer."'],
    ['wudadan', '我就說那個大夫有問題！……我、我只是沒說出口。', 'I KNEW that doctor was trouble! ...I just never said it out loud.'],
    ['tiewusi', '武林盟執法堂，鐵無私。……來晚了一步。莫記得是馭妖宗的藥王鬼手，盟裡追了他三年。', 'Tie Wusi, of the Alliance\'s Hall of Law. ...One step too late. Mo Jide is the Beastbinder Sect\'s Ghost-handed Healer; we have hunted him for three years.'],
    ['tiewusi', '他的船往北去了。北雁關港口的鐵鍊，我已傳令放下。這是關防令，拿著。', 'His ship went north. I have ordered the chain of Beiyan Pass lowered. Here is a pass warrant.'],
    ['tiewusi', '記住：只認證據，不認交情。萬妖峰上的人，不管是誰，都要問個清楚。', 'Remember: evidence, not friendship. Whoever stands on that peak, we ask our questions first.']]);
  await S.give('guanfang');
  S.set('ch3Done'); S.set('chain');
  await chapter(S, 4, '萬妖峰', 'The Peak of Ten Thousand Beasts');
}

// ================================================================= 漁火島 Fishing-fire Isle
const yuhuo = {
  name: L('漁火島', 'Fishing-fire Isle'), theme: 'isle', music: 'village', floor: ',',
  rows: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~,,,,,,,,,,,,,,,,,,,,,,,,~',
    '~,hhhhhhh,,,,,,,,hhhhhhh,~',
    '~,hoKokkh,,,,_,,,hooLooh,~',
    '~,h=====h,,,,,,,,h=====h,~',
    '~,hoooooh,,,,,,,,hoooooh,~',
    '~,hhhohhh,,B,,,,,hhhohhh,~',
    '~,,,,s,,,,,,,,,,,,,s,,,,,~',
    '~,,,,sssssssssssssss,,,,,~',
    '~,,,,,,,,,,s,,,,,,,,,,,,,~',
    '~,hhhhhh,,,s,,J,,,,hhhhh,~',
    '~,hoIokh,,,s,,,,,,,hoook,~',
    '~,h====h,,,s,,,,,,,hoAoh,~',
    '~,hooooh,,,s,,,,,,,hoooh,~',
    '~,hhhohh,,,s,,,,,,,hhohh,~',
    '~,,,,,,,,,,sss,,,,,,,,,,,~',
    '~eeeeeeee,,s,,,,eeeeeeeee~',
    '~~~~~~~~~~,s,~~~~~~~~~~~~~',
    '         ~,s,~           ',
  ],
  start: [11, 18],
  people: {
    K: P('blacksmith', async (S) => { await S.shop('yuhuo'); }),
    L: P('innkeeper', async (S) => {
      if (S.flag('dulongDone') && S.flag('chiyanDone') && !S.flag('ch3Done')) { await S.say('innkeeper', L('客官回來啦！房間給你們留著呢，今晚好好睡一覺。', 'Welcome back! Your rooms are ready; get a good night\'s sleep.')); S.heal(); return innTheft(S); }
      await S.inn(16);
    }),
    I: P('merchant', async (S) => { await S.shop('yuhuo_i'); }),
    B: P('hubanxian', async (S) => huPredict(S)),
    J: P('jiabafang', async (S) => jiaTalk(S)),
    A: P('fisherman', async (S) => {
      if (S.flag('ch3Done')) return S.say('fisherman', L('那個大夫坐的船，帆是黑的，往北邊去了。', 'The doctor\'s ship had black sails. It went north.'));
      await lines(S, [['fisherman', '漁火島的魚湯，天下第一。……往西是南疆，青竹寨的苗人好客，就是說話聽不懂。', 'Fishing-fire Isle\'s fish soup is the best under heaven. ...West lies the southland. The Green Bamboo folk are friendly; you just can\'t understand a word.']]);
    }),
  },
};

// ================================================================= 青竹寨 Green Bamboo village (A-Man)
const qingzhu = {
  name: L('青竹寨', 'Green Bamboo Village'), theme: 'jungle', music: 'village', floor: ',',
  rows: [
    'jjjjjjjjjjjjjjjjjjjjjjjj',
    'j,,,,,,,,,,,,,,,,,,,,,,j',
    'j,hhhhhh,,,,j,,,,hhhhhh,j',
    'j,hoLooh,,,,,,,,,hoIooh,j',
    'j,h====h,,,,A,,,,h====h,j',
    'j,hooooh,,,,,,,,,hooooh,j',
    'j,hhohhh,,,,,,,,,hhohhh,j',
    'j,,,,,,,,,,,,,,,,,,,,,,,j',
    'j,j,,,,,,,::::,,,,,,,j,,j',
    'j,,,,,,,,,::w:,,,,,,,,,,j',
    'j,hhhhhh,,::::,,,hhhhhh,j',
    'j,hoCooh,,,:,,,,,hooooh,j',
    'j,hooooh,,,:,,H,,hooBoh,j',
    'j,hhohhh,,,:,,,,,hhhohh,j',
    'j,,,,,,,,,,:,,,,,,,,,,,,j',
    'jjjjjjjjj,,:,,jjjjjjjjjjj',
    '        j,,:,,j          ',
  ],
  start: [11, 16],
  people: {
    L: P('innkeeper', async (S) => { await S.inn(18); }),
    I: P('merchant', async (S) => { await S.say('merchant', L('苗寨的香囊、藤甲、靈果，外面買不到！', 'Miao sachets, rattan armour and spirit fruit: you won\'t find them elsewhere!')); await S.shop('qingzhu'); }),
    H: P('huotianxia', async (S) => huoBrag(S)),
    A: P('aman', async (S) => {
      if (S.flag('dulongDone')) {
        if (!S.flag('amanGift')) {
          S.set('amanGift');
          await lines(S, [['aman', '咕嚕咕嚕～嗷！（她笑得眼睛都瞇了起來。）', 'Gurgle gurgle~ awoo! (She smiles until her eyes are crescents.)'],
            ['oldman', '阿蠻說，謝謝你們救了毒龍沼的妖物。這個骨哨和香囊，送給你們。', 'A-Man says thank you for saving the creatures of the marsh. This bone whistle and this sachet are for you.']]);
          await S.give('amulet'); await S.give('pd_sachet');
          return S.say('oldman', L('帶著骨哨，妖物會更願意跟著你們。', 'With the whistle, creatures will be gladder to follow you.'));
        }
        return S.say('aman', L('汪！（她摸了摸你們隊裡妖物的頭。）', 'Woof! (She pats the heads of the creatures in your party.)'));
      }
      if (!S.flag('amanMet')) {
        S.set('amanMet');
        await lines(S, [['aman', '嗷嗚——咕嚕咕嚕，汪！', 'Awoo - gurgle gurgle, woof!'], ['yishuo', '哥，我懂！她說……她肚子餓了！', 'Brother, I get it! She says... she\'s hungry!']]);
        const pet = S.G.party.find((m) => m.kind === 'mon');
        if (pet) { const R = await import('./rules.js?v=4'); const nm = R.nameOf(pet, 'zh'), ne = R.nameOf(pet, 'en'); await lines(S, [[null, nm + '豎起耳朵聽了一會兒，對你們低低叫了兩聲。', ne + ' pricks up its ears, listens, then gives two low cries.'], [null, '（牠好像在說：「毒龍沼的妖物在哭。牠們身上的鈴鐺，好痛。」）', '(It seems to say: "The creatures of the marsh are weeping. The bells on them hurt so much.")']]); }
        else await S.say('oldman', L('阿蠻說，毒龍沼的妖物在哭，牠們身上的鈴鐺讓牠們很痛。毒龍沼在寨子西邊。', 'A-Man says the creatures of the marsh are weeping; the bells on them hurt. The marsh is west of the village.'));
        return S.say('yishuo', L('……原來不是餓了。', '...So she wasn\'t hungry.'));
      }
      await S.say('aman', L('嗚……（她指著西邊的沼澤。）', 'Ooh... (She points west, towards the marsh.)'));
    }),
    C: P('oldman', async (S) => { await S.say('oldman', L('我是寨老。阿蠻從小在林子裡跟狼長大，聽得懂妖物說話，卻不太會說人話。', 'I am the village elder. A-Man grew up in the forest with wolves; she understands creatures, but hardly speaks our tongue.')); }),
    B: P('dancer', async (S) => { await S.say('dancer', L('竹海裡住著一隻白猿和一隻九尾狐，誰也不敢進去。', 'A white ape and a nine-tailed fox live in the Bamboo Sea. No one dares go in.')); }),
  },
};

// ================================================================= 竹海 the Bamboo Sea (optional, 2 floors)
const zhulin1 = {
  name: L('竹海', 'The Bamboo Sea'), theme: 'bamboo', music: 'dungeon', floor: ',', enc: 'zhulin', rate: 1 / 15,
  rows: [
    'jjjjjjjjjjjjjjjjjjjjjjjjjj',
    'j,,,,,j,,,,,,,,j,,,,,,,1,j',
    'j,jjj,j,jjjjjj,j,jjjjjj,,j',
    'j,j,,,,,j,,,,j,,,j,,,,j,,j',
    'j,j,jjjjj,jj,jjjjj,jj,j,,j',
    'j,,,j,,,,,j,,,,,,,,j,,,,,j',
    'jjj,j,jjjjj,jjjjjj,j,jjjjj',
    'j,,,,,,,,,,,,,,,,j,,,,,,cj',
    'j,jjjjjjj,jjjj,j,jjjjjj,,j',
    'j,j,,,,,j,,,,j,j,,,,,,j,,j',
    'j,j,c,,,j,jj,j,jjjj,j,j,,j',
    'j,,,,,,,,,,,,,,,,,,,j,,,,j',
    'jjjjjjjjjjj,,,jjjjjjjjjjjj',
    '          j,,,j           ',
  ],
  start: [12, 13],
  chests: [{ item: 'lingguo' }, { item: 'herb2' }],
  links: { 1: ['zhulin2', 1] },
  beasts: [{ id: 'g_ape', flag: 'apeDone', x: 6, y: 5, s: 'bx_ape', ask: L('白猿抱著一顆靈果，警惕地看著你們。要挑戰牠嗎？', 'The white ape clutches a spirit fruit and eyes you warily. Challenge it?'),
    pre: [[null, L('林子深處，一隻雪白的大猿蹲在竹梢上。', 'Deep in the grove a great snow-white ape crouches on a bamboo tip.')]],
    post: [[null, L('白猿把靈果拋給你們，翻身消失在竹海裡。', 'The ape tosses you its fruit and vanishes into the bamboo.')]] }],
};
const zhulin2 = {
  name: L('竹海深處', 'Heart of the Bamboo Sea'), theme: 'bamboo', music: 'dungeon', floor: ',', enc: 'zhulin', rate: 1 / 14,
  rows: [
    'jjjjjjjjjjjjjjjjjjjj',
    'j1,,,,,j,,,,,,,,,,,j',
    'j,jjjj,j,jjjjjjjj,,j',
    'j,j,,,,,,j,,,,,,j,,j',
    'j,j,jjjjjj,jjjj,j,,j',
    'j,,,,,,,,,,j,,,,,,,j',
    'jjjjj,jjjj,j,jjjjj,j',
    'j,,,,,,,,j,,,,,,,,,j',
    'j,c,jj,,,,,,jj,,c,,j',
    'jjjjjjjjjjjjjjjjjjjj',
  ],
  chests: [{ item: 'f4' }, { item: 'lingguo' }],
  links: { 1: ['zhulin1', 1] },
  beasts: [{ id: 'g_fox', flag: 'foxDone', x: 13, y: 7, s: 'bx_fox', ask: L('九尾狐瞇著眼睛，尾巴在月光下像九朵火焰。要挑戰牠嗎？', 'The nine-tailed fox narrows its eyes; its tails are like nine flames in the moonlight. Challenge it?'),
    pre: [[null, L('竹海的盡頭，月光下坐著一隻雪白的狐狸。', 'At the end of the bamboo a snow-white fox sits in the moonlight.')], ['suxiaowan', L('牠……在笑嗎？', 'Is it... smiling?')]],
    post: [[null, L('九尾狐低頭行了一禮，留下一件白狐裘，化作月光散去。', 'The fox bows its head, leaves behind a white fox fur, and melts into the moonlight.')]] }],
};

// ================================================================= 毒龍沼 Poison Dragon Marsh (2 floors)
const dulong1 = {
  name: L('毒龍沼', 'Poison Dragon Marsh'), theme: 'swamp', music: 'dungeon', floor: '.', enc: 'dulong', rate: 1 / 15,
  rows: [
    '##########################',
    '#..;;...~~~~~....;;....1.#',
    '#.~~~~..~~~~~..~~~~~.....#',
    '#.~~~~.........~~~~~.###.#',
    '#......;;.@.;;.......#c#.#',
    '#.##########.#########.#.#',
    '#.....~~~~...~~~~........#',
    '#.;;..~~~~...~~~~..;;.##.#',
    '#..........@.........#...#',
    '###.#######.#######.##.###',
    '#c....;;...........;;....#',
    '#~~~~~~~~....~~~~~~~~~~~~#',
    '############...###########',
  ],
  start: [13, 12],
  chests: [{ item: 'antidote' }, { item: 'pd3' }],
  links: { 1: ['dulong2', 1] },
  looks: Object.fromEntries(['10,4', '11,8'].map((k) => [k, async (S) => S.say(null, S.flag('dulongDone') ? L('籠子空了。', 'The cage is empty.') : L('籠子裡的竹精戴著銅鈴，枝葉都枯了。', 'A bamboo sprite in the cage wears a brass bell; its leaves have withered.'))])),
};
const dulong2 = {
  name: L('毒龍沼・龍潭', 'Poison Dragon Marsh: the Dragon Pool'), theme: 'swamp', music: 'dungeon', floor: '.', enc: null,
  rows: [
    '#####################',
    '#~~~~~~~.....~~~~~~~#',
    '#~~~~.....z.....~~~~#',
    '#~~...;.......;...~~#',
    '#~.......@.@.......~#',
    '#~..c....mmm....c..~#',
    '#~~......mmm......~~#',
    '#~~~.....m1m.....~~~#',
    '#####################',
  ],
  chests: [{ item: 'herb2' }, { item: 'lingguo' }],
  links: { 1: ['dulong1', 1] },
  boss: { id: 'b_toad', flag: 'dulongDone', art: 'bx_toad',
    pre: [[null, L('龍潭中蹲著一隻巨大的毒蟾，背上嵌滿了銅鈴，每呼吸一次，毒霧就湧出來。', 'A giant venom toad squats in the pool, brass bells sunk into its back. Each breath pours out poison mist.')],
          ['wenduizhang', L('毒霧千重遮日月，鈴聲一陣斷肝腸。', 'A thousand veils of poison hide the sun and moon; each peal of bells breaks the heart in two.')]],
    post: [[null, L('毒蟾背上的銅鈴一個個崩落。牠咕嚕一聲，鑽進泥裡睡著了。籠子裡的妖物也安靜下來。', 'One by one the bells fall from the toad\'s back. With a gurgle it burrows into the mud and sleeps. The caged creatures fall quiet.')]],
    postFn: async (S) => { if (S.flag('campOpen')) await freeBeasts(S, ['e_goldsnake', 'e_bamboosprite']); await S.say('yishuo', L('回青竹寨告訴阿蠻吧！', 'Let\'s go back and tell A-Man!')); } },
  looks: { '9,4': async (S) => S.say(null, L('籠子空了。', 'The cage is empty.')), '11,4': async (S) => S.say(null, L('籠子空了。', 'The cage is empty.')) },
};

// ================================================================= 焰口村 Yankou (the volcano's foot)
const yankou = {
  name: L('焰口村', 'Yankou Village'), theme: 'volcvillage', music: 'village', floor: '.',
  rows: [
    '########################',
    '#......................#',
    '#.hhhhhh.......hhhhhh..#',
    '#.hoKokh..<<...hoLooh..#',
    '#.h====h..<<...h====h..#',
    '#.hooooh.......hooooh..#',
    '#.hhohhh...A...hhohhh..#',
    '#......................#',
    '#....::::::::::::::....#',
    '#.hhhhhh...:...........#',
    '#.hoIooh...:....<<..B..#',
    '#.h====h...:....<<.....#',
    '#.hoooo....:...........#',
    '#.hhohhh...:...........#',
    '#########..:..##########',
    '        #..:..#         ',
  ],
  start: [11, 15],
  people: {
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('火山口打的刀，見血不卷刃！', 'Blades forged at the crater: they never dull!')); await S.shop('yankou'); }),
    L: P('innkeeper', async (S) => { await S.inn(20); }),
    I: P('merchant', async (S) => { await S.shop('yankou_i'); }),
    A: P('man', async (S) => {
      if (S.flag('chiyanDone')) return S.say('man', L('火山不吼了！那隻火鴉飛走以後，連溫泉都變溫柔了。', 'The volcano has stopped roaring! Since the fire crow flew away even the hot springs feel gentler.'));
      await lines(S, [['man', '我是礦工。赤焰窟就在村子東邊的火山裡。洞口有熔岩，別踩上去。', 'I\'m a miner. The Red Flame Caves are in the volcano east of the village. There\'s lava at the mouth: don\'t step in it.'],
        ['man', '前幾天有個背劍的年輕人也上去了，說要比誰先拿到什麼「火魄」。', 'A young man with a sword on his back went up a few days ago, talking about being first to some "Fire Soul".']]);
    }),
    B: P('oldwoman', async (S) => { await S.say('oldwoman', L('泡泡溫泉吧，什麼累都泡掉了。', 'Have a soak in the springs; it washes all your weariness away.')); }),
  },
};

// ================================================================= 赤焰窟 the Red Flame Caves (3 floors)
const chiyan1 = {
  name: L('赤焰窟', 'Red Flame Caves'), theme: 'volcano', music: 'dungeon', floor: '.', enc: 'chiyan', rate: 1 / 15,
  rows: [
    '########################',
    '#1....aaa.......aaa....#',
    '#.###.aaa.#####.aaa.##.#',
    '#.#.....z.#...#.....#..#',
    '#.#.#####.#.#.#####.#..#',
    '#...#...#...#.....#....#',
    '###.#.#.#####.###.####.#',
    '#c..#.#.......#.....aa.#',
    '#.###.#########.###.aa.#',
    '#.....aaa.......#c.....#',
    '#########...############',
  ],
  start: [10, 10],
  chests: [{ item: 'emberstone' }, { item: 'herb2' }],
  links: { 1: ['chiyan2', 1] },
  boss: { id: 'chu3', flag: 'chu3Done', s: 'chutiankuo', scene: 'volcano',
    pre: [['chutiankuo', L('又是你！我閉關三個月，練成了一劍！這次，我們比誰先拿到火魄！', 'You again! Three months in seclusion and I have mastered a sword stroke! This time we race for the Fire Soul!')],
          ['yirui', L('你也要火魄？', 'You want the Fire Soul too?')],
          ['chutiankuo', L('我爹說，三魄集齊，天下的妖物就再也不會害人。我要拿給他看——我也能幫上忙！', 'My father says when the three souls are together, no creature will ever hurt anyone again. I\'ll bring it to him. I can help too!')]],
    post: [['chutiankuo', L('第……第三敗。', 'Defeat... number three.')]],
    postFn: async (S) => {
      await lines(S, [
        [null, '一個戴銅鈴的黑衣人從岩縫後走出來，對楚天闊單膝跪下。', 'A man in black with a brass bell steps out from a crack in the rock and kneels before Chu Tiankuo.'],
        ['linwei', '少宗主！宗主吩咐，請您即刻回萬妖峰。火魄的事，交給赤使大人。', 'Young master! The master bids you return to the Peak at once. Leave the Fire Soul to Envoy Chi.'],
        ['chutiankuo', '……什麼宗主？我爹在蘇河城外教人馴獸……', '...What master? My father teaches beast-taming outside Suhe...'],
        ['linwei', '少宗主說笑了。墨無涯宗主，不就是您的父親？', 'The young master jests. Is the master, Mo Wuya, not your own father?'],
        [null, '鈴衛轉身消失在熱氣裡。楚天闊握劍的手在發抖。', 'The bell guard vanishes into the heat haze. Chu Tiankuo\'s sword hand is shaking.'],
        ['chutiankuo', '讓妖物發狂的……是我爹？……我得親眼看看。奕叡，帶我一起走。這一次，我不跟你比了。', 'The one driving the creatures mad... is my father? ...I have to see for myself. Yi Rui, take me with you. This time, I won\'t fight you.'],
      ]);
      await S.join('chutiankuo', 20);
    } },
};
const chiyan2 = {
  name: L('赤焰窟・熔岩道', 'Red Flame Caves: Lava Road'), theme: 'volcano', music: 'dungeon', floor: '.', enc: 'chiyan2', rate: 1 / 15,
  rows: [
    '##########################',
    '#1......aaaaaaaaaa.......#',
    '#.####..a........a..####.#',
    '#.#..#..a..#..#..a..#..#.#',
    '#.#c.#.....#..#.....#.c#.#',
    '#.##.#####.#..#.#####.##.#',
    '#..........#.z#..........#',
    '#############.############',
    '#aaa......aa............2#',
    '##########################',
  ],
  chests: [{ item: 'b5' }, { item: 'soul' }],
  links: { 1: ['chiyan1', 1], 2: ['chiyan3', 2] },
  boss: { id: 'b_chi', flag: 'chiDone', s: 'cultist',
    pre: [['chi', L('龍門的人，還有……少宗主？可惜了。宗主有令：擋路者，死。', 'Longmen, and... the young master? A pity. The master\'s orders: whoever stands in the way dies.')]],
    post: [['chi', L('火魄……早晚是宗主的……', 'The Fire Soul... will be the master\'s in the end...')], [null, L('赤使化作一團火星，消失了。', 'Envoy Chi bursts into sparks and is gone.')]] },
};
const chiyan3 = {
  name: L('赤焰窟・火山口', 'Red Flame Caves: the Crater'), theme: 'volcano', music: 'dungeon', floor: '.', enc: null,
  rows: [
    '###################',
    '#aaaaaaa...aaaaaaa#',
    '#aaaa.....z...aaaa#',
    '#aa...&.....&...aa#',
    '#a...............a#',
    '#a..c....mmm..c..a#',
    '#aa......mmm....aa#',
    '#aaa.....m2m...aaa#',
    '###################',
  ],
  chests: [{ item: 'w10' }, { item: 'emberstone' }],
  links: { 2: ['chiyan2', 2] },
  boss: { id: 'b_crow', flag: 'chiyanDone', music: 'final', art: 'bx_crow', give: 'huopo',
    pre: [[null, L('火山口上，一隻三足火鴉被鎖在岩柱上，身上纏著燒紅的鈴鏈。', 'At the crater a three-legged fire crow is chained to a rock pillar, wrapped in red-hot bell chains.')],
          ['chutiankuo', L('……這就是我爹做的事？', '...This is what my father does?')]],
    post: [[null, L('鈴鏈熔斷了。火鴉振翅飛向天空，灑下一團不燙手的火焰。', 'The bell chains melt. The crow spreads its wings and soars, letting fall a flame that does not burn.')]],
    postFn: async (S) => { await lines(S, [['wudadan', '兩魄都到手了！……我們找個安全的地方歇一歇吧？漁火島的客棧不錯。', 'Two souls in hand! ...Shall we rest somewhere safe? The inn on Fishing-fire Isle is nice.']]); } },
};

export const CH3 = { yuhuo, qingzhu, zhulin1, zhulin2, dulong1, dulong2, yankou, chiyan1, chiyan2, chiyan3 };
