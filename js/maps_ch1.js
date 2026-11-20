// Chapter 1 「鈴聲」 The Bell: Longmen, Xinghua Village, the Hundred Beasts Camp, the Wolf Slope, Luoxia Town and
// the Bell Temple.
import { L, P, lines, chapter, freeBeasts } from './maps_base.js?v=2';

// ================================================================= 龍門鎮 Longmen Town (home)
const longmen = {
  name: L('龍門鎮', 'Longmen Town'), theme: 'town', music: 'town', floor: ':',
  rows: [
    '"""""""""""""""""""""""""""""""',
    '"",,,,,,,,hhhhhhhhhhhh,,,,,,,""',
    '",hhhhhhh,hkm&mmmm&mkh,hhhhhh,"',
    '",hbooobh,hmmmmAmmmmmh,hoKokh,"',
    '",hcooooh,htmmtmmtmmth,h====h,"',
    '",hoooooh,hmmmmmmmmmmh,hooooh,"',
    '",hhhohhh,hhhhhmmhhhhh,hhhohh,"',
    '",,,:,,,,,,,,,:mm:,,,,,,,,:,,,"',
    '",f,:,,l,,::::::::::::,,l,:,f,"',
    '",,,:::::::::::w::::::::::::,,"',
    '"",,,,,,,:,,,,:::::,,,,,:,,,,""',
    '",hhhhhh,:,,B,::::::C,,,:hhhhh"',
    '",hoLokh,:,,,,::::::,,,,:hoook"',
    '",h====h,:,,,,::::::,,,,:h=M=h"',
    '",hooooh,:,,f,::::::,f,,:hoooh"',
    '",hhhohh,:,,,,::::::,,,,:hhohh"',
    '",,,,:,,,:,,,,::::::,,,,,,,:,,"',
    '",,,,::::::::::::::::::::::::,"',
    '",f,,,,,,,,l,,::::::,,l,,,,,f,"',
    '"",,,,,,,,,,,,::::::,,,,,,,,,""',
    '"""""""",,,,,,::::::,,,,,""""""',
    '      ",,,,,,,::::::,,,,,,"    ',
  ],
  start: [16, 21],
  chests: [{ item: 'herb' }],
  extra: [['D', 6, 9], ['E', 21, 18]],
  people: {
    A: P('baixian', async (S) => {
      if (!S.flag('metBai')) {
        S.set('metBai');
        await lines(S, [
          ['baixian', '「話說那龍門刀客，一刀斬開東海霧——」啪！醒木一拍。……咦，兩位少爺來了。', '"And so the blade of Longmen cut through the fog of the eastern sea..." Clack! The block falls. ...Ah, the two young masters.'],
          ['baixian', '剛才那陣鈴聲，你們也聽見了吧？屠千秋一倒，江湖才安生了半年，如今四方的妖物又發了狂。', 'You heard that bell just now? Half a year of peace since Tu Qianqiu fell, and now creatures everywhere are going mad again.'],
          ['baixian', '杏花村北邊有座廢寨，住著一個叫牛飽飽的怪人，專收被打醒的妖物。先去找他——有妖物當幫手，路好走得多。', 'North of Xinghua Village is an old stockade where an odd fellow named Niu Baobao takes in creatures that come to their senses. Find him first: with creatures to help you, the road is easier.'],
          ['baixian', '還有，野狼坡的狼群也瘋了，聽說劫了一支鏢隊。順路去看看吧。', 'And the wolves of Wolf Slope have gone wild; they say they fell on a caravan. Look in on the way.'],
        ]);
      }
      await S.storyteller();
    }),
    B: P('oldman', async (S) => {
      if (S.flag('ch3Done')) return S.say('oldman', L('老奴聽說，兩位少爺連北邊的冰山都要去了？……多穿件衣裳啊。', 'This old servant hears the young masters are off to the icy north? ...Wear something warm.'));
      if (S.flag('ch1Done')) return S.say('oldman', L('鈴音寺的事都傳開了！老爺地下有知，也會笑的。', 'Word of the Bell Temple is everywhere! Your father would smile, wherever he is.'));
      await S.say('oldman', L('二少爺！您又要跟著大少爺出門？……唉，老奴攔不住。這是給您二位路上買傷藥的錢。', 'Young master! Off with your brother again? ...I can\'t stop you. Here is money for salves on the road.'));
      if (!S.flag('stewardGold')) { S.set('stewardGold'); S.gold(60); S.sfx('buy'); await S.say(null, L('得到 60 兩銀子。', 'Received 60 gold.')); }
    }, { walk: 1 }),
    C: P('hubanxian', async (S) => {
      const F = (f) => S.flag(f);
      if (!F('metHu')) { S.set('metHu'); await lines(S, [['hubanxian', '鐵口直斷，不準不要錢！在下胡半仙，算盡天下事。', 'An iron mouth, a sure word, no charge if I\'m wrong! I am Hu Banxian, and I can read anything.'], ['yishuo', '哥，他算命從來沒收過錢。', 'Brother, he has never been paid for a fortune.']]); }
      if (!F('yelangDone')) return lines(S, [['hubanxian', '小兄弟，你印堂發亮！此去必定一路平安，連一隻狼都碰不到！', 'Your brow is shining! The road will be smooth: you will not meet a single wolf!'], [null, '（旁邊的人都在偷笑。）', '(The bystanders are trying not to laugh.)']]);
      if (!F('ch1Done')) return S.say('hubanxian', L('鈴音寺？我算過了，裡面全是吃素的老和尚，太平得很！', 'The Bell Temple? I have read it: nothing but gentle old vegetarian monks. Perfectly safe!'));
      if (!F('sujiaDone')) return S.say('hubanxian', L('蘇家舊宅？乾淨得很，連一隻鬼都沒有！', 'The old Su mansion? Spotless. Not a single ghost!'));
      if (!F('ch3Done')) return S.say('hubanxian', L('那位莫大夫啊？天下第一好人，記性也是天下第一好！', 'Doctor Mo? The kindest man under heaven, with the best memory under heaven!'));
      return S.say('hubanxian', L('萬妖峰？你們上去……一定打不贏。不準不要錢！', 'The Peak of Ten Thousand Beasts? Go up there and... you will surely lose. No charge if I\'m wrong!'));
    }),
    D: P('child', async (S) => { await S.say('child', L('奕碩哥哥的球，上次把一隻瘋狗踢得飛過了屋頂！', 'Yi Shuo\'s ball once kicked a mad dog right over a roof!')); }, { walk: 1 }),
    E: P('guard', async (S) => {
      if (S.flag('ch1Done')) return S.say('guard', L('聽說東邊的斷橋修好了，蘇河城的商隊又能過來了。', 'They say the broken bridge to the east is mended; the Suhe caravans can come again.'));
      await S.say('guard', L('鎮外的灰狼一到夜裡就嚎，嚎得跟哭一樣。我守了十年門，沒聽過這種聲音。', 'The grey wolves outside town howl every night, almost like weeping. Ten years on this gate and I\'ve never heard the like.'));
    }),
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('龍門鐵匠鋪！刀、棍、球，連小少爺的球都有。', 'Longmen Smithy! Blades, cudgels, even balls for the young master.')); await S.shop('longmen_w'); }),
    L: P('innkeeper', async (S) => { await S.inn(5); }),
    M: P('woman', async (S) => { await S.say('woman', L('傷藥、解毒草、肉包，出門必備。', 'Salves, antidotes and meat buns for the road.')); await S.shop('longmen_i'); }),
  },
};

// ================================================================= 杏花村 Xinghua Village
const xinghua = {
  name: L('杏花村', 'Xinghua Village'), theme: 'village', music: 'village', floor: ',',
  rows: [
    '"""""""""""""""""""""""""',
    '",,,,f,,,,,,,,,,,,,,f,,,"',
    '",hhhhhh,,,,f,,,,hhhhhh,"',
    '",hoKokh,,,,,,,,,hoLoob,"',
    '",h====h,f,,,,f,,h====h,"',
    '",hooooh,,,,w,,,,hooooh,"',
    '",hhohhh,,,,,,,,,hhhohh,"',
    '",,,:,,,,,,A,,,,,,,:,,,,"',
    '",,,::::::::::::::::,,,,"',
    '",f,,,,,,,:,,,,,,,,,,,f,"',
    '",,xxxxx,,:,,B,,,xxxxx,,"',
    '",,x,,,x,,:,,,,,,x,,,x,,"',
    '",,x,,,x,,:,,,,,,x,,,x,,"',
    '",,xx,xx,,:,,,,,,xx,xx,,"',
    '",hhhhh,,,:::::::::,,?,,"',
    '",hoMoh,,,,,:,,,,,,C,,,,"',
    '",h===h,,,,,:,,,,,,,,,,,"',
    '",hoooo,,,,,:,,,,,,,,,,,"',
    '",hhohh,,,,,:,,,,,,,,,,,"',
    '""""""",,,,:,,,,""""""""',
    '      ",,,,:,,,,"       ',
  ],
  start: [11, 20],
  sign: L('「北：百獸山寨。西北：野狼坡（狼多，慎行）。」', '"North: Hundred Beasts Camp. North-west: Wolf Slope (many wolves; take care)."'),
  people: {
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('杏花村的鐵器，打狼正好！', 'Xinghua iron: just right for wolves!')); await S.shop('xinghua'); }),
    L: P('innkeeper', async (S) => { await S.inn(6); }),
    M: P('woman', async (S) => { await S.say('woman', L('肉包剛出籠！妖物最愛這個。', 'Meat buns fresh from the steamer! Creatures love them.')); await S.shop('xinghua_i'); }),
    A: P('oldman', async (S) => {
      if (S.flag('yelangDone')) return S.say('oldman', L('狼不嚎了。這幾夜，村裡總算睡得著覺。', 'The wolves have stopped howling. The village can sleep at last.'));
      await lines(S, [['oldman', '北邊廢寨的牛飽飽啊，養了一屋子妖怪，雞都不敢往那邊走。', 'Niu Baobao up at the old stockade keeps a whole house of creatures; even the chickens won\'t go that way.'],
        ['oldman', '西北的野狼坡，最近狼嚎得厲害。一支鏢隊上去，就再沒下來。', 'Wolf Slope to the north-west howls worse every night. A caravan went up and never came down.']]);
    }),
    B: P('woman', async (S) => {
      if (S.flag('yelangDone')) {
        if (!S.flag('xhBun')) { S.set('xhBun'); await S.say('woman', L('狼不來了！謝謝你們！這幾個肉包，自家蒸的，拿著！', 'The wolves are gone! Thank you! Here, buns I steamed myself!')); await S.give('bun', true); await S.give('bun', true); await S.give('bun'); return; }
        return S.say('woman', L('雞又敢出門啦。', 'The chickens dare go out again.'));
      }
      await S.say('woman', L('我家的雞被狼叼走了三隻……要是有人能讓那些狼安分點就好了。', 'The wolves took three of my hens... if only someone could calm them.'));
    }, { walk: 1 }),
    C: P('child', async (S) => { await S.say('child', L('牛叔叔說，被打醒的妖怪，會想跟著打醒牠的人！我也想要一隻。', 'Uncle Niu says a creature you knock sense into wants to follow you! I want one too.')); }, { walk: 1 }),
  },
};

// ================================================================= 百獸山寨 the Hundred Beasts Camp
const camp = {
  name: L('百獸山寨', 'Hundred Beasts Camp'), theme: 'ranch', music: 'camp', floor: ',', pens: '`',
  rows: [
    'xxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'x,,,,,,,,,,,,,,,,,,,,,,,,,x',
    'x,hhhhhhh,,,,,,,,,,hhhhhh,x',
    'x,hooNoob,,,,!,,,,,hoIooh,x',
    'x,h=====h,,,,,,,,,,h====h,x',
    'x,hoooooh,,,,,,,,,,hooooh,x',
    'x,hhhohhh,,,,,,,,,,hhohhh,x',
    'x,,,,:,,,,,,,,,,,,,,,:,,,,x',
    'x,,,,::::::::::::::::::,,,x',
    'x,,,,,,,,,,,,:,,,,,,,,,,,,x',
    'x,xxxxxxxx,,,:,,,xxxxxxxx,x',
    'x,x``````x,,,:,,,x``````x,x',
    'x,x``````x,,,:,,,x``````x,x',
    'x,x``````x,,,:,,,x``````x,x',
    'x,x``````x,,?:,,,x``````x,x',
    'x,xxx`xxxx,,,:,,,xxxx`xxx,x',
    'x,,,,,,,,,,,,:,,,,,,,,,,,,x',
    'x,x``````x,,,:,,,x``````x,x',
    'x,x``````x,,,:,,,x``````x,x',
    'x,xxxxxxxx,,,:,,,xxxxxxxx,x',
    'xxxxxxxxxxxx,,:,,xxxxxxxxxx',
    '           x,,:,,x         ',
  ],
  start: [14, 21],
  sign: L('「百獸山寨：吃飽了才有力氣交朋友。——牛飽飽」', '"Hundred Beasts Camp: you need a full belly to make friends. - Niu Baobao"'),
  people: {
    N: P('niubaobao', async (S) => {
      if (!S.flag('campOpen')) {
        await lines(S, [
          ['niubaobao', '（嚼嚼嚼）……嗯？有客人！歡迎來到百獸山寨！我是寨主牛飽飽，最愛吃肉包。', '(Munch munch)... Hm? Guests! Welcome to the Hundred Beasts Camp! I\'m the master here, Niu Baobao. I love meat buns.'],
          ['niubaobao', '最近到處的妖物都發了狂。可是你們知道嗎？狂性被打散的妖物，有時會自己爬起來，用期待的眼神看著你。', 'Creatures are going mad everywhere. But did you know? When the madness is knocked out of one, sometimes it gets up and looks at you, hoping.'],
          ['niubaobao', '那是牠想跟著你啦！隊伍最多四個，多出來的夥伴就送到我這兒，我替你們養著。', 'That means it wants to come with you! A party holds four; any more, send them here and I\'ll look after them.'],
          ['niubaobao', '戰鬥時把肉包丟給妖物，牠會對你們多一分好感。最後倒下的那一隻，最容易起來。來，送你們四個肉包……', 'In a fight, throw a meat bun to a creature and it warms to you. The last one you beat is the likeliest to get up. Here, four buns for you...'],
          ['niubaobao', '（嚼）……三個。', '(Munch)... three.'],
        ]);
        S.set('campOpen'); await S.give('bun', true); await S.give('bun', true); await S.give('bun');
        await S.say('niubaobao', L('以後要換夥伴、給妖物改名，都來找我。各地客棧也有我們牛家的表親，飛鴿傳書，一叫就到！', 'Come to me to swap friends or rename them. And my Niu cousins work at inns everywhere: one pigeon and your friends come running!'));
      }
      await S.camp();
    }),
    I: P('child', async (S) => { await S.say('child', L('這些是寨主還沒吃掉的東西，便宜賣！', 'These are things the master hasn\'t eaten yet. Cheap!')); await S.shop('camp'); }),
  },
};

// ================================================================= 野狼坡 the Wolf Slope (2 floors)
const yelang1 = {
  name: L('野狼坡', 'Wolf Slope'), theme: 'forest', music: 'dungeon', floor: ',', enc: 'yelang', rate: 1 / 15,
  rows: [
    '""""""""""""""""""""""""',
    '",,,,,,"",,,,,,,"",,,1""',
    '",""",,,,,,"""",,,,,,,""',
    '",",,,,rr,,,,,",""",,,,"',
    '",",""",,,,"",,,,,,",""',
    '",,,,,,,,r,""",""",,,,,"',
    '"""",""",,,,,,,,,,,"",,"',
    '",c,,,,,",""""p,p,,,,,,"',
    '",,""""",,,,,,,J,,,""",,"',
    '",,,,,,,""",,,p,,,,,,,,"',
    '"""",,,,,,,,""",,,,,""""',
    '",,,,"""",,,,,,,,""",c,"',
    '","",,,,,,,""",,,,,,,,,"',
    '",,,,,,"",,,,,,,""",,,,"',
    '"""""""""",,,,""""""""""',
    '         ",,,,"         ',
  ],
  start: [11, 15],
  chests: [{ item: 'herb' }, { gold: 60 }],
  links: { 1: ['yelang2', 1] },
  people: {
    J: P('jiabafang', async (S) => {
      if (!S.flag('metJia')) {
        S.set('metJia');
        await lines(S, [
          ['jiabafang', '哎喲喲，救命恩人！在下賈八方，人稱「八方通」，天底下沒有我不賣的東西！', 'Oh, my saviours! I am Jia Bafang, "Jia of the Eight Directions". There is nothing under heaven I won\'t sell!'],
          ['jiabafang', '我的鏢隊被狼群衝散，貨全丟了。為了脫身，我連腳上的鞋都賣給了一個路過的獵戶……', 'Wolves scattered my caravan and the goods are gone. To get away I even sold the shoes off my feet to a passing hunter...'],
          ['jiabafang', '我的鏢頭武大膽往洞裡跑了——他說是去「誘敵深入」。你們要是見到他，叫他回來！', 'My escort, Wu Dadan, ran into the cave. "Luring the enemy in," he said. If you see him, tell him to come back!'],
          ['yishuo', '哥，他真的光著腳。', 'Brother, he really is barefoot.'],
        ]);
      }
      await S.say('jiabafang', L('要買點什麼？我只剩這箱貨……和這頂帽子。', 'Buy something? All I have left is this crate... and this hat.'));
      await S.jia();
    }, { notFlag: 'yelangDone' }),
  },
};
const yelang2 = {
  name: L('野狼坡・狼窟', 'Wolf Slope: the Den'), theme: 'cave', music: 'dungeon', floor: '.', enc: 'yelang', rate: 1 / 15,
  rows: [
    '####################',
    '#....#.....#....c..#',
    '#.##.#.###.#.##.##.#',
    '#.#..#...#...#...#.#',
    '#.#.####.#####.#.#.#',
    '#.#......z.....#...#',
    '#.####.#####.###.###',
    '#....#.#...#...#...#',
    '#.##.#.#.p.#.#.###.#',
    '#c#..#...#...#....1#',
    '####################',
  ],
  chests: [{ item: 'c2' }, { item: 'wing' }],
  links: { 1: ['yelang1', 1] },
  looks: {
    '9,8': async (S) => {
      if (!S.flag('yelangDone')) return S.say(null, L('一口大酒罈在發抖。裡面好像有人。', 'A big wine jar is shaking. Someone seems to be inside.'));
      if (S.inParty('wudadan')) return S.say(null, L('一口空酒罈，還有點汗味。', 'An empty wine jar. It smells faintly of sweat.'));
      await lines(S, [
        [null, '酒罈「咚」地一聲倒了，滾出一個高大的漢子。', 'The jar tips over with a thud and a big man rolls out.'],
        ['wudadan', '別、別打我！……咦？老虎呢？', 'D-don\'t hit me! ...Eh? Where\'s the tiger?'],
        ['yirui', '跑了。你就是鏢頭武大膽？', 'Gone. You\'re the escort, Wu Dadan?'],
        ['wudadan', '正、正是！我剛才是在……埋伏！對，埋伏！等老虎經過，我就從罈子裡跳出來……', 'I-indeed! Just now I was... lying in ambush! Yes! When the tiger passed I\'d leap out of the jar and...'],
        ['yishuo', '那你怎麼不跳？', 'So why didn\'t you leap?'],
        ['wudadan', '……腿麻了。', '...My legs went numb.'],
        ['wudadan', '兩位少俠救命之恩，武某無以為報！從今天起，我給你們當鏢師！刀山火海，我、我走在……中間！', 'You saved my life and I can never repay you! From today I am your escort! Through blades and fire I will walk... in the middle!'],
      ]);
      await S.join('wudadan', 3);
    },
  },
  boss: { id: 'b_tiger', flag: 'yelangDone', art: 'bx_tiger', give: 'lingpian',
    pre: [[null, L('一頭額上帶白斑的猛虎攔在洞底，脖子上掛著一串銅鈴，叮噹作響。', 'A tiger with a white blaze on its brow blocks the end of the den. A string of brass bells jingles at its neck.')],
          ['yishuo', L('哥，牠的眼睛是紅的！', 'Brother, its eyes are red!')],
          [null, L('鈴聲一響，猛虎發出震耳的咆哮！', 'The bells ring, and the tiger roars!')]],
    post: [[null, L('猛虎頸上的銅鈴碎了。牠甩甩頭，眼裡的紅光退去，轉身跑進了山林。', 'The bells at its neck shatter. It shakes its head, the red light leaves its eyes, and it bounds away into the hills.')],
           ['yishuo', L('哥，你看！碎片上刻著字……「萬妖」？', 'Brother, look! There are words on the shards... "Ten Thousand Beasts"?')],
           [null, L('角落裡的大酒罈，好像抖得更厲害了。', 'The big wine jar in the corner seems to be shaking harder than ever.')]] },
};

// ================================================================= 落霞鎮 Luoxia Town (the arena)
const luoxia = {
  name: L('落霞鎮', 'Luoxia Town'), theme: 'town', music: 'town', floor: ':',
  rows: [
    '""""""""""""""""""""""""""""""',
    '",,,,,,,,,,,,,,,,,,,,,,,,,,,,"',
    '",hhhhhhh,,,,!sssssss!,,hhhhh,"',
    '",hoKokkh,,,,ssssssss,,,hoLoh,"',
    '",h=====h,,,,sssCssss,,,h===h,"',
    '",hoooooh,,,,ssssssss,,,hoooh,"',
    '",hhhohhh,,,,!sssssss!,,hhohh,"',
    '",,,,:,,,,,,,,,,s,,,,,,,,:,,,"',
    '",l,,::::::::::::::::::::::,l,"',
    '",,,,,,,,,,,:,,,,,,,:,,,,,,,,"',
    '",hhhhhh,,,,:,,,H,,,:,,hhhhhh,"',
    '",hoIokh,,,,:,,,,,,,:,,hooooh,"',
    '",h====h,,f,:,,J,,,,:,,hoQooh,"',
    '",hooooh,,,,:,,,,,,,:,,hooooh,"',
    '",hhhohh,,,,:,,,W,,,:,,hhhohh,"',
    '",,,,:,,,,,,::::::::::,,,:,,,,"',
    '",f,,::::::::,,,,,,,,,,::::,f,"',
    '"",,,,,,,,,,:,,,,X,,,,,,,,,,""',
    '"""""""""",,:,,""""""""""""""""',
    '         ",,:,,"               ',
  ],
  start: [12, 19],
  people: {
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('落霞兵器行！擂台上用的傢伙，都在這兒買的。', 'Luoxia Arms! Every fighter on the arena buys here.')); await S.shop('luoxia'); }),
    L: P('innkeeper', async (S) => { await S.inn(8); }),
    I: P('merchant', async (S) => { await S.shop('luoxia_i'); }),
    C: P('chutiankuo', async (S) => {
      if (S.flag('chu1Done')) return S.say('chutiankuo', L('下一座城鎮見！我的冊子上，還有好多空白頁！', 'See you in the next town! My little book still has plenty of blank pages!'));
      if (!S.flag('metChu')) { S.set('metChu'); await lines(S, [['chutiankuo', '站住！你就是打跑白額虎的龍門刀客？', 'Halt! Are you the Longmen blade who drove off the tiger?'], ['chutiankuo', '我楚天闊，將來要做天下第一劍客！上擂台，跟我比一場！', 'I am Chu Tiankuo, future greatest swordsman under heaven! Onto the arena: fight me!']]); }
      if (!(await S.ask(L('要接受楚天闊的挑戰嗎？', 'Accept Chu Tiankuo\'s challenge?')))) return S.say('chutiankuo', L('怕了？哼，我等你！', 'Scared? Hmph. I\'ll wait!'));
      const r = await S.battle(['chu1'], { scene: 'arena', loseOk: true, recruit: false });
      if (r === 'win') {
        S.set('chu1Done');
        await lines(S, [['chutiankuo', '……輸了？我輸了？', '...I lost? I LOST?'], [null, '楚天闊從懷裡掏出一本小冊子，認真地寫了幾個字。', 'Chu Tiankuo takes a little book from his coat and solemnly writes in it.'], ['chutiankuo', '第、第一敗……記下了！這是我的傷藥，拿去。下一座城，我們再比！', 'D-defeat number one... noted! Here, my salve, take it. In the next town we fight again!']]);
        await S.give('herb2');
      } else await S.say('chutiankuo', L('哈！第一勝！……喂，你們沒事吧？我只是想贏，不是想要你們的命。去客棧歇歇吧。', 'Ha! Victory number one! ...Hey, are you all right? I only wanted to win, not to kill you. Go rest at the inn.'));
    }, { notFlag: 'ch1Done' }),
    H: P('huotianxia', async (S) => {
      await lines(S, [['huotianxia', '我就是霍天下！聽說了嗎？野狼坡那頭白額虎，是我一拳打跑的！', 'I am Huo Tianxia! Have you heard? The tiger of Wolf Slope - I drove it off with one punch!'],
        ['yishuo', '明明是我們……', 'But that was us...'],
        ['huotianxia', '小朋友，大人說話別插嘴。我還打跑過一百條狼、三頭熊，和一隻很兇的雞。', 'Little friend, don\'t interrupt your elders. I have also beaten a hundred wolves, three bears, and one very fierce chicken.']]);
    }, { flag: 'yelangDone' }),
    J: P('jiabafang', async (S) => {
      await S.say('jiabafang', L('又見面了！我在落霞擺了個攤。鞋？早賣了。今天賣的是我的帽子……還有一些別的。', 'We meet again! I\'ve set up a stall in Luoxia. Shoes? Long sold. Today it\'s my hat... and a few other things.'));
      await S.jia();
    }, { flag: 'yelangDone' }),
    Q: P('kuchan', async (S) => {
      if (S.flag('ch1Done')) return S.say('kuchan', L('斷橋已經修好了。過了橋，就是水鄉蘇河城。施主保重。', 'The bridge is mended. Across it lies the canal city of Suhe. Take care, friend.'));
      if (S.has('lingpian') && !S.flag('kuchanTaught')) {
        S.set('kuchanTaught');
        await lines(S, [
          ['kuchan', '阿彌陀佛。老衲苦禪。鈴音寺的師弟們逃到千佛寺求救，老衲便下山來看看。', 'Amitabha. I am Kuchan. The brothers of the Bell Temple fled to my temple for help, so I came down the mountain.'],
          ['kuchan', '這鈴片……刻著「萬妖」，是萬妖鈴的碎片。傳說此鈴一搖，萬妖俯首；一響，百獸發狂。', 'This shard... "Ten Thousand Beasts". It is from the Bell of Ten Thousand Beasts. Shake it and every creature bows; ring it and they all go mad.'],
          ['kuchan', '如今佔了鈴音寺的，是一個叫「馭妖宗」的門派。施主要去，老衲教你一門護體的心法。', 'The ones who took the Bell Temple call themselves the Beastbinder Sect. If you are going, let me teach you an art to guard your body.'],
        ]);
        await S.teach('yirui', 'guard');
        return S.say('kuchan', L('鈴音寺在鎮子東北的山上。寺裡的門，用這鈴片或許打得開。', 'The temple is on the mountain north-east of town. Its doors may open to this shard.'));
      }
      await S.say('kuchan', L('阿彌陀佛。鈴音寺在東北的山上……施主若找到什麼線索，再來告訴老衲。', 'Amitabha. The Bell Temple is on the mountain to the north-east... Tell me if you find anything.'));
    }, { flag: 'yelangDone' }),
    W: P('man', async (S) => {
      if (S.flag('ch1Done')) return S.say('man', L('斷橋修好了！用的是鈴音寺的舊樑，結實得很。', 'The bridge is fixed! Made from the Bell Temple\'s old beams. Solid as anything.'));
      await S.say('man', L('東邊的大橋被發狂的河怪撞斷了。要修，得有好木料……鈴音寺裡倒是有不少老樑。', 'A maddened river beast smashed the big bridge to the east. Mending it needs good timber... the Bell Temple has plenty of old beams.'));
    }, { walk: 1 }),
    X: P('woman', async (S) => { await S.say('woman', L('擂台上那個楚家小子，天天找人比劍，輸了就往小冊子上記。', 'That Chu boy on the arena challenges everyone, and writes every loss in his little book.')); }, { walk: 1 }),
  },
};

// ================================================================= 鈴音寺 the Bell Temple (3 floors)
const lingyin1 = {
  name: L('鈴音寺', 'Bell Temple'), theme: 'belltemple', music: 'temple', floor: ',', enc: 'lingyin', rate: 1 / 16, scene: 'temple',
  rows: [
    '##########################',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,iiiiiiiiii1iiiiiiiiiiii#',
    '#,i,,,,,,,,,:,,,,,,,,,,i,#',
    '#,i,@,,@,,,,:,,,,,@,,@,i,#',
    '#,i,,,,,,,,,:,,,,,,,,,,i,#',
    '#,i,,,&,,,,,:,,,,,,&,,,i,#',
    '#,i,,,,,,,,u:u,,,,,,,,,i,#',
    '#,i,,,,,,,,,:,,,,,,,,,,i,#',
    '#,i,c,,,,,,,:,,,,,,,,c,i,#',
    '#,ii,,iiiiii:iiiiiii,,ii,#',
    '#,,,,,,,,,,,:,,,,,,,,,,,,#',
    '#,,+,,,,,,,,:,,,,,,,,,+,,#',
    '#,,,,,,,,,,,:,,,,,,,,,,,,#',
    '############:#############',
  ],
  start: [12, 14],
  chests: [{ item: 'herb' }, { item: 'cl2' }],
  links: { 1: ['lingyin2', 1] },
  onEnter: async (S) => { if (!S.flag('lyEnter')) { S.set('lyEnter'); await lines(S, [[null, '寺裡傳來一陣陣鈴聲。院子裡的獸籠中，關著雙眼通紅的妖物。', 'Bells ring all through the temple. In the courtyard, red-eyed creatures are locked in cages.'], ['wudadan', '我、我在最後面替大家看著退路……', 'I-I\'ll watch our retreat from the back...']]); } },
  looks: Object.fromEntries(['4,4', '7,4', '18,4', '21,4'].map((k) => [k, async (S) => S.say(null, S.flag('ch1Done') ? L('籠子空了。', 'The cage is empty.') : L('籠子裡的妖物戴著銅鈴，拼命撞著木欄。', 'The creature inside wears a brass bell and throws itself against the bars.'))])),
};
const lingyin2 = {
  name: L('鈴音寺・大殿', 'Bell Temple: Great Hall'), theme: 'tower', music: 'temple', floor: '.', enc: 'lingyin2', rate: 1 / 16, scene: 'temple',
  doorKey: 'lingpian', doorMsg: L('門上有一個鈴形的凹槽，鎖得死死的。', 'The door has a bell-shaped hollow in it, and is locked fast.'),
  rows: [
    '######################',
    '#1...#........#.....c#',
    '#.##.#.######.#.###..#',
    '#.#..d.#....#.d.#.#..#',
    '#.#.####.uu.#####.#..#',
    '#.#......mm.......#..#',
    '#.#####.mmmm.####.##.#',
    '#...c.#.mmmm.#..#....#',
    '#.###.#..mm..#.##.##.#',
    '#...#.####.###....#..#',
    '###.#......#...##.#.2#',
    '#...########.#....#..#',
    '#............#.......#',
    '######################',
  ],
  chests: [{ item: 'b3' }, { item: 'qipill' }],
  links: { 1: ['lingyin1', 1], 2: ['lingyin3', 2] },
};
const lingyin3 = {
  name: L('鈴音寺・鐘樓', 'Bell Temple: Bell Tower'), theme: 'tower', music: 'temple', floor: '.', enc: null, scene: 'temple',
  rows: [
    '###############',
    '#&....+.+....&#',
    '#.............#',
    '#..i...z...i..#',
    '#.............#',
    '#.....mmm.....#',
    '#&....mmm....&#',
    '#.....mmm.....#',
    '#c....m2m....c#',
    '###############',
  ],
  chests: [{ item: 'herb2' }, { gold: 300 }],
  links: { 2: ['lingyin2', 2] },
  boss: { id: 'b_qing', flag: 'ch1Done', s: 'cultist',
    pre: [[null, L('鐘樓頂上，一個青衣人搖著一只大銅鈴。', 'At the top of the tower a man in green shakes a great brass bell.')],
          ['qing', L('龍門的小子，居然追到這裡來了。宗主說得沒錯，你們果然礙事。', 'The Longmen brats, all the way up here. The master was right: you are a nuisance.')],
          ['yirui', L('是你們讓妖物發狂的？', 'You made the creatures go mad?')],
          ['qing', L('發狂？不，我們是讓牠們「聽話」。等萬妖鈴三魄歸位，天下妖物都會跪在宗主腳下！', 'Mad? No, we make them OBEY. When the bell\'s three souls are home, every creature under heaven will kneel at the master\'s feet!')]],
    post: [['qing', L('咳……宗主……墨無涯……會在萬妖峰……敲響……', 'Hk... the master... Mo Wuya... will ring it... on the Peak...')],
           [null, L('御妖使化作一陣青煙，只留下一只摔碎的銅鈴。', 'The envoy dissolves into green smoke, leaving only a broken brass bell.')]],
    postFn: async (S) => {
      if (S.flag('campOpen')) await freeBeasts(S, ['e_wildboar', 'e_wisp']);
      await lines(S, [
        ['kuchan', '阿彌陀佛，施主好身手。鈴音寺總算清靜了。', 'Amitabha. Well fought, friends. The Bell Temple is at peace again.'],
        ['kuchan', '老衲已讓落霞的工匠拆了寺後的舊樑，去修東邊的斷橋。過了橋，就是水鄉蘇河城。', 'I have had the Luoxia carpenters take the old beams behind the temple to mend the eastern bridge. Across it lies the canal city of Suhe.'],
        ['kuchan', '萬妖鈴有三魄：水、火、冰。三魄歸位，鈴聲便能傳遍天下。你們要搶在馭妖宗前頭。', 'The bell has three souls: water, fire and ice. With all three in place its voice reaches every land. You must find them before the sect does.'],
        ['yishuo', '哥，蘇河城！聽說那裡的包子特別好吃！', 'Brother, Suhe! They say the buns there are the best!'],
      ]);
      S.set('bridge');
      await chapter(S, 2, '水鄉', 'The Water Country');
    } },
};

export const CH1 = { longmen, xinghua, camp, yelang1, yelang2, luoxia, lingyin1, lingyin2, lingyin3 };
