// Chapter 4 「萬妖峰」 The Peak of Ten Thousand Beasts: Beiyan Pass, the Snow Wolf camp, the Ice Soul Caves and the
// Tower of Ten Thousand Beasts. The last fight starts the ending (story.js).
import { L, P, lines, huPredict, huoBrag, jiaTalk } from './maps_base.js?v=7';

// ================================================================= 北雁關 Beiyan Pass (the harbour fortress)
const beiyan = {
  name: L('北雁關', 'Beiyan Pass'), theme: 'fortress', music: 'town3', floor: ':',
  rows: [
    '##########################',
    '#nnnnnnnnnnnnnnnnnnnnnnnn#',
    '#n#######nnnnnnnn#######n#',
    '#n#..K..#nnn!!nnn#..L..#n#',
    '#n#=====#nnnnnnnn#=====#n#',
    '#n#.....#nnnTnnnn#.....#n#',
    '#n###.###nnnnnnnn###.###n#',
    '#nnnn:nnnnnnnnnnnnnn:nnnn#',
    '#nl::::::::::::::::::::lnn#',
    '#nnnnnnnnnnn:nnnnnnnnnnnn#',
    '#n#######nnn:nnnnn#######n#',
    '#n#..I..#nnn:nnJnn#.....#n#',
    '#n#=====#nnn:nnnnn#..B..#n#',
    '#n#.....#nnn:nHnnn#.....#n#',
    '#n###.###nnn:nnnnn###.###n#',
    '#nnnnnnnnnnn::nnnnnnnnnnnn#',
    '############::#############',
  ],
  start: [12, 16],
  extra: [['S', 4, 9], ['U', 20, 15]],
  people: {
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('北地寒鐵，天下第一硬！', 'Northern cold iron, the hardest under heaven!')); await S.shop('beiyan'); }),
    L: P('innkeeper', async (S) => { await S.inn(24); }),
    I: P('merchant', async (S) => { await S.shop('beiyan_i'); }),
    B: P('hubanxian', async (S) => huPredict(S)),
    J: P('jiabafang', async (S) => jiaTalk(S)),
    H: P('huotianxia', async (S) => huoBrag(S)),
    T: P('tiewusi', async (S) => {
      if (S.flag('bingpoDone')) return S.say('tiewusi', L('冰牆塌了，萬妖峰的路通了。盟裡的人手擋住山下的馭妖宗徒，峰頂……就交給你們了。', 'The ice wall has fallen and the way to the Peak is open. The Alliance will hold the sect below; the summit... is yours.'));
      await lines(S, [['tiewusi', '莫記得的船昨夜靠了岸，往東邊的冰魄窟去了。他要的是最後一魄。', 'Mo Jide\'s ship landed last night; he went east to the Ice Soul Caves. He wants the last soul.'],
        ['tiewusi', '冰魄窟後面就是萬妖峰，峰前有一道終年不化的冰牆。據說冰牆的寒氣，就是冰魄在撐著。', 'Beyond the caves stands the Peak, fronted by a wall of ice that never melts. They say the Ice Soul\'s cold holds it up.'],
        ['tiewusi', '北地的妖物比南邊兇得多。雪狼部的人熟悉這片雪原，先去問問他們。', 'The creatures of the north are far fiercer than the south\'s. The Snow Wolf tribe knows these fields; ask them first.']]);
    }),
    S: P('guard', async (S) => {
      await S.say('guard', L('鐵大人一到，整座關都安靜了。他一個笑容都沒有，比北風還冷。', 'Since Lord Tie arrived the whole pass has gone quiet. He never smiles; he\'s colder than the north wind.'));
      if (!S.flag('bingpoDone')) await S.say('guard', L('出關往西北的大路通雪狼部；往東的大路通冰魄窟。', 'The north-west road out of the pass goes to the Snow Wolf camp; the east road to the Ice Soul Caves.'));
    }, { walk: 1 }),
    U: P('guard', async (S) => {
      await S.say('guard', L('港口的鐵鍊是祖上傳下來的，一百年沒放下過。', 'The harbour chain came down from our forefathers; it hasn\'t been lowered in a hundred years.'));
      if (S.flag('bingpoDone')) await S.say('guard', L('冰牆塌了？那萬妖塔的路就在冰魄窟東邊，穿過山口就是。', 'The ice wall fell? Then the way to the Tower is east of the Ice Soul Caves, through the gap in the peaks.'));
      else await S.say('guard', L('冰魄窟裡冷得要命，聽說最深處的冰心藏著冰魄。冰窟的路：一層往東北，冰河那層往正中下去。', 'The Ice Soul Caves are bitterly cold; they say the Ice Soul lies in the Heart of Ice at the bottom. The way: north-east on the first level, down through the middle on the Frozen River.'));
    }),
  },
};

// ================================================================= 雪狼部 the Snow Wolf camp
const xuelang = {
  name: L('雪狼部', 'Snow Wolf Camp'), theme: 'snowcamp', music: 'village', floor: 'n',
  rows: [
    '########################',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '#nn$nnnnnn!nnnnnnn$nnnn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '#nnnnn$nnnnnnnnn$nnnnnn#',
    '#nnnnnnnnnAnnnnnnnnnnnn#',
    '#nnLnnnnnnnnnnnnnnnnInn#',
    '#nnnnn$nnnnnn$nnnnnnnnn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '#nnnnnnnnnnnnnnnnWnnnnn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '##########nnnn##########',
    '         #nnnn#         ',
  ],
  start: [11, 12],
  people: {
    L: P('innkeeper', async (S) => { await S.inn(24); }),
    I: P('merchant', async (S) => { await S.say('merchant', L('雪狼的皮、神行的靴，雪原上活命全靠它們。', 'Snow-wolf hides and swift boots: on the snowfields, your life depends on them.')); await S.shop('xuelang'); }),
    A: P('man', async (S) => {
      if (S.flag('bingpoDone')) return S.say('man', L('冰牆塌的那一刻，被抓走的雪狼一隻隻跑回來了。雪狼部欠你們一份大情。', 'The moment the ice wall fell, our stolen wolves came running home one by one. The tribe owes you a great debt.'));
      await lines(S, [['man', '我是雪狼部的族長。一個月前，馭妖宗的人抓走了我們的雪狼，把牠們趕上了萬妖峰。', 'I am chief of the Snow Wolf tribe. A month ago the sect took our wolves and drove them up the Peak.'],
        ['man', '冰魄窟在東邊，洞裡冷得連呼吸都會結冰。北地的妖物，你們若能打醒牠們，也許會跟你們走。', 'The Ice Soul Caves are east; inside it is cold enough to freeze your breath. If you can knock sense into the northern creatures, they may follow you.']]);
    }),
    W: P('e_frostwolf', async (S) => { await S.say(null, L('一隻小雪狼趴在雪地上，望著東邊的山，低低地嗚咽。', 'A snow-wolf pup lies in the snow, gazing at the eastern mountains and whimpering softly.')); }),
  },
};

// ================================================================= 冰魄窟 the Ice Soul Caves (3 floors)
const bingpo1 = {
  name: L('冰魄窟', 'Ice Soul Caves'), theme: 'ice', music: 'dungeon', floor: 'n', enc: 'bingpo', rate: 1 / 15,
  rows: [
    '##########################',
    '#n^^^^n#nnnnn*nnnnn#nnn1n#',
    '#n^^^^n#n#######nn#n#nnnn#',
    '#nnnnnn#n#*nnn#nnn#n#n####',
    '#n###n##n#nnn^#nnnnn#nnnn#',
    '#n#c#nnnn#nn^^###n#####n##',
    '#n#n####n#nnnnnnnnnnnnnnn#',
    '#nnnn*nnn####n#####n###nn#',
    '###n####nnnnnn#nnn*n#nnnn#',
    '#nnnnnn#n####n#n###n#n#c##',
    '#n*nnnnnnn^^^n#nnnnnnn#nn#',
    '##########?nnn############',
  ],
  start: [12, 11],
  looks: { '10,11': L('雪狼部獵人的刻痕：「冰窟三層。上層往東北，冰河那層從正中往下。冰心最冷。」', 'A Snow Wolf hunter\'s marks: "Three levels. North-east on the top level; down through the middle on the Frozen River. The Heart of Ice is coldest."') },
  chests: [{ item: 'frostjade' }, { item: 'herb2' }],
  links: { 1: ['bingpo2', 1] },
};
const bingpo2 = {
  name: L('冰魄窟・冰河', 'Ice Soul Caves: Frozen River'), theme: 'ice', music: 'dungeon', floor: 'n', enc: 'bingpo', rate: 1 / 14,
  rows: [
    '########################',
    '#1nnnn#^^^^^^^^^^#nnnnc#',
    '#n###n#^########^#n###n#',
    '#n#nnn#^#nnnnnn#^#nnn#n#',
    '#n#n###^#n#nn#n#^###n#n#',
    '#n#n^^^^#n#nn#n#^^^^n#n#',
    '#n#nnnnn#n#nn#n#nnnnn#n#',
    '#n#####n#n#nn#n#n#####n#',
    '#nnnnnnnnn#22#nnnnnnnnn#',
    '#c######################',
  ],
  chests: [{ item: 'a9' }, { item: 'soul' }],
  links: { 1: ['bingpo1', 1], 2: ['bingpo3', 2] },
};
const bingpo3 = {
  name: L('冰魄窟・冰心', 'Ice Soul Caves: the Heart of Ice'), theme: 'ice', music: 'dungeon', floor: 'n', enc: null,
  rows: [
    '###################',
    '#*nnnn*nnnnn*nnnn*#',
    '#nnnn^^^^z^^^^nnnn#',
    '#nn*n^^^^^^^^^n*nn#',
    '#nnnnnnnnnnnnnnnnn#',
    '#n*nc^^^^^^^^^c*nn#',
    '#nnnnnn^^^^^nnnnnn#',
    '#*nnnnnnn2nnnnnnn*#',
    '###################',
  ],
  chests: [{ item: 'w13' }, { item: 'qipill' }],
  links: { 2: ['bingpo2', 2] },
  boss: { id: 'b_mojide', flag: 'bingpoDone', music: 'final', s: 'mojide',
    pre: [['mojide', L('喲，你們還真追來了。我還以為那碗安神湯，夠你們睡上三天。', 'Oh, you actually followed me. I thought that soup would keep you asleep three days.')],
          ['mojide', L('冰魄我已經拿到手了。三魄齊了，宗主的鈴，就要響了。', 'I have the Ice Soul. All three are together; the master\'s bell is about to ring.')],
          ['suxiaowan', L('你為什麼要幫他？', 'Why do you help him?')],
          ['mojide', L('為什麼？二十年前，我的藥鋪被發狂的妖物踏平，妻兒都沒了。宗主說，要讓天下的妖物都乖乖聽話——這件事，我記得清清楚楚。', 'Why? Twenty years ago maddened creatures trampled my shop, and my wife and son with it. The master said he would make every creature obey. THAT I remember, very clearly.')]],
    post: [['mojide', L('……就算打贏我，也來不及了。三魄……我早送上山了……', '...Even if you beat me, you\'re too late. The souls... are already on the Peak...')],
           [null, L('莫記得吞下一顆藥丸，化作一團綠煙逃走了。冰窟深處傳來轟隆一聲——冰魄一走，冰開始融化了。', 'Mo Jide swallows a pill and escapes in a puff of green smoke. A rumble from deep in the caves: with the Ice Soul gone, the ice begins to melt.')]],
    postFn: async (S) => { S.set('icewall'); await lines(S, [[null, '遠處萬妖峰前的冰牆，轟然崩塌了。', 'In the distance, the ice wall before the Peak crashes down.'], ['chutiankuo', '爹……我來了。', 'Father... I\'m coming.']]); } },
};

// ================================================================= 萬妖塔 the Tower of Ten Thousand Beasts (5 floors)
const T = (name, rows, extra = {}) => ({ name, theme: 'pagoda', music: 'tower', floor: '.', enc: 'tower', rate: 1 / 15, scene: 'bell', rows, ...extra });
const wanyao1 = T(L('萬妖塔', 'Tower of Ten Thousand Beasts'), [
  '#####################',
  '#&.......1.......&..#',
  '#.##.###.#.###.###..#',
  '#.#c...#...#.....#..#',
  '#.####.#####.###.#..#',
  '#......!...!.#c..#..#',
  '#.######.#######.##.#',
  '#........X..........#',
  '#####.####.#####.####',
  '#&.......mmm.......&#',
  '########?mmm#########',
], { start: [10, 10], looks: { '8,10': L('塔門的石碑：「萬妖塔五重。一重北上，二重東南，三重石獅，四重西南，五重鈴心。」', 'A stele at the tower gate: "Five storeys. North from the first, south-east from the second, the stone lion on the third, south-west from the fourth; the bell\'s heart on the fifth."') }, chests: [{ item: 'herb2' }, { item: 'cl6' }], links: { 1: ['wanyao2', 1] },
  people: {
    X: P('xiaotian', async (S) => {
      if (!S.flag('lengMet')) {
        S.set('lengMet');
        await lines(S, [[null, '塔門前，一個銀髮金角的男人單手擋住了一群鈴衛。', 'At the tower gate a silver-haired man with golden horns holds back a crowd of bell guards with one hand.'],
          ['xiaotian', '哼、哼、哼。……龍門的小子，你也來了。', 'Heh. Heh. Heh. ...The Longmen boy. You came too.'],
          ['xiaotian', '這座塔吵得我睡不著覺。底下這些搖鈴的，我來收拾。你們上去，把那口破鈴給我砸了。', 'This tower is too noisy for me to sleep. I\'ll deal with these bell-ringers. You go up and smash that wretched bell for me.'],
          ['xiaotian', '拿著。別丟我的臉。', 'Take this. Don\'t shame me.']]);
        return S.give('pd_moon');
      }
      await S.say('xiaotian', L('還不上去？滾。', 'Not gone up yet? Go.'));
    }, { notFlag: 'finalDone' }),
  } });
const wanyao2 = T(L('萬妖塔・二層', 'Tower: Second Storey'), [
  '#####################',
  '#1..#.....#.....#..c#',
  '#.#.#.###.#.###.#.###',
  '#.#...#.#...#.#.....#',
  '#.#####.#####.#####.#',
  '#.....#.......#.....#',
  '#.###.#.#####.#.###.#',
  '#c..#...#...#...#..2#',
  '#####################',
], { chests: [{ item: 'k4' }, { item: 'soul' }], links: { 1: ['wanyao1', 1], 2: ['wanyao3', 2] } });
const wanyao3 = T(L('萬妖塔・三層', 'Tower: Third Storey'), [
  '#####################',
  '#2.......###.....c.3#',
  '#.#####..###..####..#',
  '#.#c......z.......#.#',
  '#.#......###......#.#',
  '#...#....###....#...#',
  '#####################',
], { enc: 'tower2', chests: [{ item: 'p5' }, { item: 'qipill' }], links: { 2: ['wanyao2', 2], 3: ['wanyao4', 3] },
  boss: { id: 'b_lion', flag: 'lionDone', music: 'final', art: 'bx_lion',
    pre: [[null, L('一頭石獅蹲在樓梯口，脖子上掛著一口銅鈴，石眼裡燃著紅光。', 'A stone lion crouches at the stairway, a brass bell at its neck and red fire in its stone eyes.')]],
    post: [[null, L('石獅的鈴碎了。牠緩緩趴下，又變回一尊普通的石像，口中銜著一頂頭盔。', 'The lion\'s bell shatters. It lies down slowly and becomes a plain statue again, a helm held in its mouth.')]],
    give: 'hd_lion' } });
const wanyao4 = T(L('萬妖塔・四層', 'Tower: Fourth Storey'), [
  '#####################',
  '#3.#.......#.......c#',
  '#..#.#####.#.#####..#',
  '#..#.#...#.#.#...#..#',
  '#..#.#.#.#...#.#.#..#',
  '#....#.#.#####.#....#',
  '######.#.......######',
  '#4.....#####.......c#',
  '#####################',
], { enc: 'tower2', chests: [{ item: 'a10' }, { item: 'b7' }], links: { 3: ['wanyao3', 3], 4: ['wanyao5', 4] } });
const wanyao5 = T(L('萬妖塔・鈴心殿', 'Tower: Hall of the Bell\'s Heart'), [
  '###################',
  '#&...i...+...i...&#',
  '#.................#',
  '#....mmmmzmmmm....#',
  '#....mmmmmmmmm....#',
  '#i...mmmmmmmmm...i#',
  '#.......mmm.......#',
  '#&......mmm......&#',
  '#.......mmm.....4.#',
  '###################',
], { enc: null, music: 'tower', links: { 4: ['wanyao4', 4] },
  boss: { id: 'b_mowuya', flag: 'finalDone', s: 'mowuya', music: 'beasts',
    preFn: async (S) => {
      const story = await import('./story.js?v=7'); await story.finalPre(S);
    },
    postFn: async (S) => {
      const story = await import('./story.js?v=7'); await story.finalPost(S);
    } } });

export const CH4 = { beiyan, xuelang, bingpo1, bingpo2, bingpo3, wanyao1, wanyao2, wanyao3, wanyao4, wanyao5 };
