// Chapter 2 「水鄉」 The Water Country: Suhe City, the old Su mansion, Green Wave Cave and Wangyue Ferry.
import { L, P, lines, chapter, huPredict, huoBrag, jiaTalk } from './maps_base.js?v=7';

// 文對仗's couplet contest: he gives the first line, you choose the second
const COUPLETS = [
  { up: ['風吹水面層層浪', 'Wind on the water: wave on wave'], ok: 0,
    opts: [['雨打沙灘點點坑', 'Rain on the sand: pit by pit'], ['月照山頭亮堂堂', 'Moon on the hilltop, ever so bright'], ['我在河邊吃包子', 'I eat a bun beside the stream']] },
  { up: ['書山有路勤為徑', 'The mountain of books has a road: diligence'], ok: 1,
    opts: [['茶館無人水自涼', 'The teahouse is empty, the water cools'], ['學海無涯苦作舟', 'The sea of learning is boundless: hardship the boat'], ['包子有餡肉當先', 'A bun has filling: meat goes first']] },
  { up: ['刀客一刀開大道', 'The swordsman: one cut opens the great road'], ok: [0, 2],
    opts: [['書生半筆寫春秋', 'The scholar: half a stroke writes the ages'], ['書生一碗吃麵條', 'The scholar: one bowl of noodles eaten'], ['小弟一腳踢皮球', 'The kid brother: one kick sends the ball']] },
];
async function coupletContest(S) {
  await lines(S, [['wenduizhang', '茶香一盞迎來客，筆墨三杯試友人。', 'One cup of fragrant tea to greet a guest; three rounds of ink to test a friend.'],
    ['wenduizhang', '上聯我出君來對，對得工整我同行。', 'I give the first line, you give the second; match them well, and I shall come along.']]);
  for (let i = 0; i < COUPLETS.length; i++) {
    const C = COUPLETS[i];
    await S.say('wenduizhang', L('上聯：「' + C.up[0] + '」', 'First line: "' + C.up[1] + '"'));
    const j = await S.choose(C.opts.map((o) => ({ label: o })), { title: L('下聯是？', 'The second line?'), ctx: 'couplet', cls: 'shoplist' });
    const ok = Array.isArray(C.ok) ? C.ok.includes(j) : j === C.ok;
    if (!ok) {
      if (j === 2 && i < 2) await S.say('yishuo', L('（得意）我對的！', '(Proudly) That one was mine!'));
      await lines(S, [['wenduizhang', '此聯不工難成對，閣下回去再思量。', 'This line does not match, it cannot pair; go home, my friend, and think it through with care.']]);
      return false;
    }
    if (i === 2 && j === 2) await lines(S, [['wenduizhang', '妙！……雖然俗了點，對仗卻是工整的！', 'Splendid! ...A little vulgar, but the match is perfect!'], ['yishuo', '嘿嘿。', 'Heh heh.']]);
    else await S.say('wenduizhang', L('妙對！', 'A fine match!'));
  }
  return true;
}

// ================================================================= 蘇河城 Suhe City (canals)
const suhe = {
  name: L('蘇河城', 'Suhe City'), theme: 'canal', music: 'town2', floor: ':',
  rows: [
    '################################',
    '#::::::::::::::~~::::::::::::::#',
    '#:hhhhhhh::::::~~::::hhhhhhh:::#',
    '#:hoKokkh::W:t:ee::::hooLooh:::#',
    '#:h=====h::::::~~::::h=====h:::#',
    '#:hoooooh::::::~~::::hoooooh:::#',
    '#:hhhohhh::::::~~::::hhhohhh:::#',
    '#::::::::::::::~~::::::::::::::#',
    '#:l::::::B:::::~~::::::::l:::::#',
    '#::::::::::::::ee::::::::::::::#',
    '#:_::::::::::::~~::::::::::_:::#',
    '#:hhhhhh:::::::~~::::hhhhhh::::#',
    '#:hoIokh:::H:::~~::::hoMooh::::#',
    '#:h====h:::::::~~::::hmmmmh::::#',
    '#:hooooh:::::::~~::::hmmbbh::::#',
    '#:hhhohh:::::::ee::::hhmhhh::::#',
    '#::::::::::J:::~~::::::::::C:::#',
    '#:yyy::::::::::~~::Y:::::::::::#',
    '#:yyy::_:::::::~~::::::::_:yyy:#',
    '#::::::::::::::ee::::::::::::::#',
    '#############::::###############',
  ],
  start: [14, 20],
  extra: [['T', 6, 9], ['U', 24, 18]],
  people: {
    K: P('blacksmith', async (S) => { await S.say('blacksmith', L('蘇河兵器坊，南北名刀都有！', 'Suhe Armoury: famous blades from north and south!')); await S.shop('suhe'); }),
    L: P('innkeeper', async (S) => { await S.inn(12); }),
    I: P('merchant', async (S) => {
      await S.say('merchant', L('燈籠、傷藥、項圈，應有盡有。', 'Lanterns, salves, collars, all you need.'));
      if (!S.has('lantern') && !S.flag('sujiaDone')) await S.say('merchant', L('要去蘇家舊宅？沒燈籠，連大門都摸不進去。六十兩一盞。', 'Going to the old Su mansion? Without a lantern you won\'t even find the door. Sixty gold.'));
      await S.shop('suhe_i');
    }),
    B: P('hubanxian', async (S) => huPredict(S)),
    H: P('huotianxia', async (S) => huoBrag(S)),
    J: P('jiabafang', async (S) => jiaTalk(S)),
    W: P('wenduizhang', async (S) => {
      if (!S.flag('metWen')) { S.set('metWen'); await lines(S, [[null, '茶攤邊坐著一個書生，搖頭晃腦，筆不離手。', 'By the tea stall sits a scholar, swaying his head, brush ever in hand.'], ['wenduizhang', '在下複姓不姓文，名叫對仗字無雙。', 'My surname is Wen, and only Wen; my name is Duizhang, matched by none.'], ['yishuo', '哥，他說話怎麼都是兩句兩句的？', 'Brother, why does he always talk in pairs of lines?']]); }
      if (await coupletContest(S)) {
        await lines(S, [['wenduizhang', '三聯皆對知音在，一路同行不問期。', 'Three lines matched: a kindred soul is here; I\'ll travel on with you, whatever the year.'], ['wenduizhang', '萬妖鈴響天下亂，書生也要盡綿薄。', 'When the bell of beasts rings, the world falls to strife; even a scholar must lend his life.']]);
        S.set('wenJoined');
        await S.join('wenduizhang', 8);
        await S.give('couplet', true);
      }
    }, { notFlag: 'wenJoined' }),
    M: P('mojide', async (S) => {
      if (!S.flag('metMo')) { S.set('metMo'); await lines(S, [['mojide', '我是莫記得，蘇河城的大夫。你們是……？算了，記不得。', 'I am Mo Jide, the doctor of Suhe. And you are...? Never mind, I won\'t remember.'], ['mojide', '來來來，躺下，我給你們看看。看病不收錢——收了錢，我也會忘了。', 'Come, come, lie down and I\'ll have a look. No fee: if I took one, I\'d only forget.']]); }
      S.heal(); S.sfx('heal');
      await S.say('mojide', L('好了，都治好了！……咦，我剛剛給誰看病來著？', 'There, all better! ...Eh? Who was I just treating?'));
      if (S.flag('biboDone') && !S.flag('moAsked')) { S.set('moAsked'); await lines(S, [['mojide', '……你們身上，有一股水氣。水魄？那可是好東西……我是說，危險的東西！要小心收好。', '...You carry a breath of water. The Water Soul? A fine thing... I mean, a dangerous thing! Keep it safe.'], ['suxiaowan', '（小聲）這位大夫的眼神，怎麼一點也不糊塗？', '(Quietly) For a forgetful man, his eyes look very sharp.']]); }
    }, { notFlag: 'ch3Done' }),
    Y: P('liuhanyan', async (S) => {
      if (S.flag('shipGot')) return S.say('liuhanyan', L('南邊的海不太平。保重。', 'The southern sea is not peaceful. Take care.'));
      if (S.flag('biboDone')) { if (!S.flag('letter')) { S.set('letter'); await lines(S, [['liuhanyan', '江蛟平靜了？好。望月渡的船王欠我一個人情，我已經寫信給他。', 'The jiao is calm? Good. The Ship King of Wangyue Ferry owes me a favour; I have written to him.'], ['liuhanyan', '去望月渡吧，他會借你們船。南邊還有火魄。', 'Go to Wangyue Ferry; he will lend you a ship. The Fire Soul lies south.']]); } else await S.say('liuhanyan', L('望月渡在城東，沿著大路走。', 'Wangyue Ferry is east of the city along the high road.')); return; }
      if (!S.flag('metLiu')) {
        S.set('metLiu');
        return lines(S, [['liuhanyan', '奕家兄弟。我來蘇河辦事，順道打聽萬妖鈴的消息。', 'The Yi brothers. I came to Suhe on business, and to learn what I can of the bell.'],
          ['liuhanyan', '城北的蘇家舊宅，二十年前一場妖禍，全家都死了。最近卻夜夜有人奉茶。', 'The old Su mansion north of the city: twenty years ago a beast raid killed the whole family. Yet lately someone pours tea there every night.'],
          ['liuhanyan', '城南碧波湖的江蛟也發了狂，船都不敢走。水魄，恐怕就在碧波洞裡。', 'The river jiao of Green Wave Lake to the south has gone mad too; no boat dares sail. The Water Soul is likely in its cave.'],
          ['liuhanyan', '舊宅裡伸手不見五指，記得買燈籠。', 'The mansion is pitch black inside. Buy a lantern.']]);
      }
      await S.say('liuhanyan', L('舊宅在城北，碧波洞在城南。先去哪裡，你們自己決定。', 'The mansion is north of the city, the cave south. Choose your own order.'));
    }),
    C: P('chutiankuo', async (S) => {
      if (S.flag('chu2Done')) return S.say('chutiankuo', L('第二敗……我回去閉關練劍了！下次見面，你們會認不出我！', 'Defeat number two... I\'m off to train in seclusion! Next time you won\'t recognise me!'));
      await lines(S, [['chutiankuo', S.flag('chu1Done') ? '又是你！冊子上「第一敗」那頁，我天天看！今天要把它撕掉！' : '又是你！上次我贏了，這次也一樣！', S.flag('chu1Done') ? 'You again! I look at the page that says "defeat number one" every day! Today I tear it out!' : 'You again! I won last time and I\'ll win again!']]);
      if (!(await S.ask(L('要接受楚天闊的挑戰嗎？', 'Accept Chu Tiankuo\'s challenge?')))) return S.say('chutiankuo', L('哼，我就在這裡等！', 'Hmph. I\'ll wait right here!'));
      const r = await S.battle(['chu2'], { scene: 'town', loseOk: true, recruit: false });
      if (r === 'win') { S.set('chu2Done'); await lines(S, [['chutiankuo', '第……第二敗！', 'Defeat... number two!'], ['chutiankuo', '你們到底跟誰學的武功？……不說就算了。這個給你們。', 'Who taught you to fight like that? ...Fine, don\'t tell me. Take this.']]); await S.give('herb2'); }
      else await S.say('chutiankuo', L('哈！我寫進冊子裡了：勝！……你們去歇歇吧。', 'Ha! Into the book: a win! ...Go and rest.'));
    }, { flag: 'ch1Done', notFlag: 'shipGot' }),
    T: P('scholar', async (S) => {
      await S.say('scholar', L('蘇家的小姐，當年是蘇河城有名的美人。她哥哥去京城學馴獸，就再沒回來。', 'The Su daughter was the beauty of Suhe in her day. Her brother went to the capital to learn the taming of beasts, and never came back.'));
      if (!S.flag('sujiaDone')) await S.say('scholar', L('蘇家舊宅在城東北，出城沿大路走就到。宅裡夜夜有人奉茶……我是不敢去的。', 'The old Su mansion is north-east of the city, along the road. Someone pours tea there every night... I would never dare go.'));
    }, { walk: 1 }),
    U: P('fisherman', async (S) => {
      if (S.flag('biboDone')) return S.say('fisherman', S.flag('shipGot') ? L('湖上又能打魚了！', 'We can fish the lake again!') : L('湖上又能打魚了！你們要出海？望月渡在東南邊的海邊。', 'We can fish the lake again! Going to sea? Wangyue Ferry is on the coast to the south-east.'));
      await S.say('fisherman', L('碧波湖裡那條蛟，一甩尾巴就翻了三條船。', 'The jiao in Green Wave Lake overturned three boats with one flick of its tail.'));
      await S.say('fisherman', L('碧波洞就在城南的湖邊，出南門順著大路走。洞裡還有水寇，小心了。', 'Green Wave Cave is by the lake south of the city: out of the south gate and along the road. There are river pirates in there too; take care.'));
    }, { walk: 1 }),
  },
};

// ================================================================= 蘇家舊宅 the old Su mansion (dark; 3 floors)
const sujia1 = {
  name: L('蘇家舊宅', 'The Old Su Mansion'), theme: 'mansion', music: 'mansion', floor: '.', enc: 'sujia', rate: 1 / 16, dark: 1,
  rows: [
    '######################',
    '#k..k#....mm....#k..1#',
    '#....#....mm....#....#',
    '#.t..#....mm....#..t.#',
    '#........Xmm.........#',
    '######....mm....######',
    '#q...#....mm....#...c#',
    '#....#....mm....#....#',
    '#.........mm.........#',
    '#c...#&...mm...&#..q.#',
    '######....mm....######',
    '#.........mm.........#',
    '#########?mm##########',
  ],
  start: [10, 12],
  looks: { '9,12': L('門邊褪色的木牌：「蘇宅。內院的樓梯在前廳東北角，後院的樓梯在內院東南角。」', 'A faded board by the door: "The Su residence. The stairs to the inner rooms are in the north-east corner of the front hall; to the back garden, in the south-east corner of the inner rooms."') },
  chests: [{ item: 'herb2' }, { item: 'antidote' }],
  links: { 1: ['sujia2', 1] },
  people: {
    X: P('suxiaowan', async (S) => {
      if (!S.flag('sujiaMet')) {
        S.set('sujiaMet');
        return lines(S, [
          [null, '大廳裡，一位穿淡綠衣裙的小姐端著茶盤，對你們盈盈一笑。', 'In the hall, a young lady in pale green holds a tea tray and smiles at you.'],
          ['suxiaowan', '有客人！真是稀客。我是蘇家的小婉。今天家裡特別安靜，僕人們都不知跑哪去了……請用茶。', 'Guests! How rare. I am Xiaowan of the Su family. The house is so quiet today; the servants have all wandered off... Please, have some tea.'],
          [null, '茶杯冒著熱氣。你伸手去接，手指卻穿過了杯子。', 'The cup steams. You reach for it, and your fingers pass right through.'],
          ['yishuo', '（小聲）哥……她、她的腳沒有碰到地……', '(Whispering) Brother... her... her feet aren\'t touching the floor...'],
          ['wudadan', '（武大膽兩眼一翻，靠在牆上。）', '(Wu Dadan\'s eyes roll up and he leans against the wall.)'],
          ['suxiaowan', '咦，你們怎麼不喝？……對了，我哥哥送我的那只青瓷杯不見了。後院鬧哄哄的，好像有人在辦喜事……你們能幫我去看看嗎？', 'Oh, you\'re not drinking? ...And my brother\'s gift, my celadon cup, is missing. There\'s such a racket in the back garden, like a wedding... Would you go and look for me?'],
        ]);
      }
      await S.say('suxiaowan', L('我哥哥去京城學馴獸了，說好今年回來接我……今年是哪一年來著？', 'My brother went to the capital to learn the taming of beasts. He promised to come back for me this year... what year is it again?'));
    }, { notFlag: 'sujiaDone' }),
  },
};
const sujia2 = {
  name: L('蘇家舊宅・內院', 'The Old Su Mansion: Inner Rooms'), theme: 'mansion', music: 'mansion', floor: '.', enc: 'sujia', rate: 1 / 15, dark: 1,
  rows: [
    '########################',
    '#1.....#.......#......c#',
    '#.####.#.#####.#.####..#',
    '#.#bb#.#.#k..#.#.#..#..#',
    '#.#..#...#...#...#..#..#',
    '#.##.#####.###.###.##..#',
    '#......t.......t.......#',
    '#.####.#####.#####.###.#',
    '#.#q.#.#...#.#...#.#.#.#',
    '#.#..#...#.....#...#.#.#',
    '#.##.#####.#####.###.#.#',
    '#c...........#........2#',
    '########################',
  ],
  chests: [{ item: 'f3' }, { item: 'soul' }],
  links: { 1: ['sujia1', 1], 2: ['sujia3', 2] },
};
const sujia3 = {
  name: L('蘇家舊宅・後院', 'The Old Su Mansion: Back Garden'), theme: 'mansion', music: 'mansion', floor: '.', enc: null, dark: 1,
  rows: [
    '######################',
    '#_..yyyy.....yyyy.._.#',
    '#...yyyy.....yyyy....#',
    '#.......t.z.t........#',
    '#..&.............&...#',
    '#.......mmmmmm.......#',
    '#_......mmmmmm......_#',
    '#c......mmmmmm......c#',
    '#.......mmmmmm.....2.#',
    '######################',
  ],
  chests: [{ item: 'lantern' }, { gold: 600 }],
  links: { 2: ['sujia2', 2] },
  boss: { id: 'b_jiangshi', flag: 'sujiaDone', art: 'bx_jiangshi',
    pre: [[null, L('後院擺著一桌喜宴，一群紅紙人圍著一具貼滿符咒的殭屍，吹吹打打。', 'A wedding feast is laid in the garden. Red paper figures play pipes and drums round a jiangshi covered in talismans.')],
          [null, L('殭屍胸前掛著一只銅鈴。鈴聲一響，紙人們齊齊轉過頭來。', 'A brass bell hangs on the jiangshi\'s chest. It rings, and every paper face turns towards you.')]],
    post: [[null, L('殭屍身上的符咒片片飄落，露出懷中一只缺了口的青瓷杯。', 'The talismans flutter off the jiangshi, and a chipped celadon cup falls from its arms.')]],
    postFn: async (S) => {
      await S.give('teacup');
      await lines(S, [
        ['suxiaowan', '那是……我的杯子！你們替我找回來了！', 'That\'s... my cup! You found it for me!'],
        ['suxiaowan', '奇怪，院子怎麼這麼荒……花都謝了，池子也乾了一半。好像我睡了很久很久。', 'How strange, the garden is so overgrown... the flowers are dead and the pond half dry. As if I\'d slept for a very long time.'],
        ['suxiaowan', '我要去找我哥哥。他說過，他會回來接我的。……帶我一起走，好嗎？', 'I want to go and find my brother. He said he would come back for me. ...Will you take me with you?'],
        ['wudadan', '（牙齒打顫）她、她要跟我們走？', '(Teeth chattering) Sh-she wants to come with us?'],
        ['yishuo', '武大哥，你看，她剛剛幫你擋了一隻紙人耶。', 'Big Wu, look, she just blocked a paper man for you.'],
        ['wudadan', '……蘇姑娘，歡迎歡迎！', '...Welcome, Miss Su, welcome!'],
      ]);
      await S.join('suxiaowan', 10);
    } },
};

// ================================================================= 碧波洞 Green Wave Cave (3 floors)
const bibo1 = {
  name: L('碧波洞', 'Green Wave Cave'), theme: 'sea', music: 'dungeon', floor: '.', enc: 'bibo', rate: 1 / 16,
  rows: [
    '########################',
    '#..~~~~..#.......~~~.1.#',
    '#..~~~~..#.###...~~~...#',
    '#........#.#H#.........#',
    '#.###.####.#.#.#######.#',
    '#.#c#......#.#.#.....#.#',
    '#.#.#.######.#.#.~~~.#.#',
    '#...#........#...~~~...#',
    '###.##########.#########',
    '#~~...........e.......c#',
    '#~~~~.#######.e.######.#',
    '#......................#',
    '#########?...###########',
  ],
  start: [11, 12],
  looks: { '9,12': L('漁夫釘的木牌：「洞往下兩層：先東北角，再東南角。深潭有蛟，水寇出沒。」背面還有一行：「北邊石縫裡掛著一個人，吵死了。」', 'A fisherman\'s board: "Two levels down: first the north-east corner, then the south-east. A jiao in the deep pool; pirates about." On the back: "Some man is hanging in a crack to the north. So noisy."') },
  chests: [{ item: 'herb2' }, { item: 'cl3' }],
  links: { 1: ['bibo2', 1] },
  people: {
    H: P('huotianxia', async (S) => {
      S.set('huoSaved');
      await lines(S, [[null, '一個被五花大綁的漢子掛在石縫裡，嘴裡塞著布。', 'A man trussed up like a festival pig hangs in a crack in the rock, gagged with cloth.'],
        ['huotianxia', '唔唔唔！……呸！是你們！我、我是故意被水寇抓的！我在打入敵人內部！', 'Mmph mmph! ...Pah! It\'s you! I-I let the pirates catch me on purpose! I was infiltrating!'],
        ['yishuo', '那你打入到哪裡了？', 'So how far in did you get?'],
        ['huotianxia', '……這裡。好了好了，算我欠你們一次。這是我的私房錢，別告訴別人。', '...This far. Fine, fine, I owe you one. Here\'s my secret savings. Don\'t tell anyone.']]);
      S.gold(500); S.sfx('buy'); await S.say(null, L('得到 500 兩銀子。', 'Received 500 gold.'));
      S.respawn();
    }, { notFlag: 'huoSaved' }),
  },
};
const bibo2 = {
  name: L('碧波洞・水寇窩', 'Green Wave Cave: Pirates\' Den'), theme: 'sea', music: 'dungeon', floor: '.', enc: 'bibo', rate: 1 / 15,
  rows: [
    '##########################',
    '#1.....#...~~~~~...#....c#',
    '#.####.#...~~~~~...#.##..#',
    '#.#..#.#.....e.....#.#...#',
    '#.#..#.###.#####.###.#.###',
    '#.#........#&.&#.....#...#',
    '#.####.###.#...#.###.###.#',
    '#....#...#.#.t.#.#.....#.#',
    '####.###.#.##.##.#.###.#.#',
    '#c.......#.......#...#...#',
    '#.~~~~~~.###.#####.#.#####',
    '#.~~~~~~.....#.....#....2#',
    '##########################',
  ],
  chests: [{ item: 'a7' }, { item: 'qipill' }],
  links: { 1: ['bibo1', 1], 2: ['bibo3', 2] },
};
const bibo3 = {
  name: L('碧波洞・深潭', 'Green Wave Cave: the Deep Pool'), theme: 'sea', music: 'dungeon', floor: '.', enc: null,
  rows: [
    '###################',
    '#~~~~~~~~~~~~~~~~~#',
    '#~~~~~.......~~~~~#',
    '#~~~.....z.....~~~#',
    '#~~...........c.~~#',
    '#~.......e.......~#',
    '#~.c.....e.......~#',
    '#~~......e......~~#',
    '#~~~.....e.....2~~#',
    '###################',
  ],
  chests: [{ item: 'c_jiao' }, { item: 'pearl' }],
  links: { 2: ['bibo2', 2] },
  boss: { id: 'b_jiao', flag: 'biboDone', music: 'final', art: 'bx_jiao', give: 'shuipo',
    pre: [[null, L('深潭中央浮起一條青鱗巨蛟，額上釘著一只銅鈴，鈴聲在洞裡迴盪。', 'A huge blue-scaled jiao rises from the pool, a brass bell nailed to its brow, its peal echoing through the cave.')],
          ['wenduizhang', L('蛟龍本是江中客，鈴響何曾得自由！', 'The jiao should roam the river wide; with that bell, it has no freedom left inside!')]],
    post: [[null, L('銅鈴碎裂，江蛟長吟一聲，沉回潭底。潭水退開，露出一滴懸在半空、不肯落下的水珠。', 'The bell breaks. The jiao gives a long cry and sinks to the depths. The water draws back from a single drop hanging in the air, refusing to fall.')]],
    postFn: async (S) => { await lines(S, [['yishuo', '這就是水魄？', 'Is that the Water Soul?'], ['suxiaowan', '好涼……可是又好溫柔。', 'So cool... and yet so gentle.']]); } },
};

// ================================================================= 望月渡 Wangyue Ferry (the ship)
const wangyue = {
  name: L('望月渡', 'Wangyue Ferry'), theme: 'port', music: 'town2', floor: ',',
  rows: [
    '"""""""""""""""""""""""""~~~~',
    '",,,,,,,,,,,,,,,,,,,,,,,,~~~~',
    '",hhhhhhh,,,,,,,hhhhhh,,,~~~~',
    '",hoKokkh,,,,,,,hoLooh,,,~~~~',
    '",h=====h,,f,,,,h====h,,,~~~~',
    '",hoooooh,,,,,,,hooooh,,,~~~~',
    '",hhhohhh,,,,,,,hhohhh,,,~~~~',
    '",,,,:,,,,,,,,,,,,:,,,,,,~~~~',
    '",,,,:::::::::::::::::eeeeeee',
    '",f,,,,,,,,:,,,,,,,,,,eS~~~~~',
    '",hhhhhh,,,:,,,,,,,,,,e~~~~~~',
    '",hoIokh,,,:,,,A,,,,,,eeeeeee',
    '",h====h,,,:,,,,,,,,,,,,~~~~~',
    '",hoooo,,,,:,,,,,,,,,,,,~~~~~',
    '",hhhohh,,,:,,,,,,,,,,,,~~~~~',
    '""""""",,,,:,,,""""""""""~~~~',
    '      ",,,,:,,,"         ~~~~',
  ],
  start: [11, 16],
  people: {
    K: P('blacksmith', async (S) => { await S.shop('wangyue'); }),
    L: P('innkeeper', async (S) => { await S.inn(14); }),
    I: P('merchant', async (S) => { await S.shop('wangyue_i'); }),
    S: P('boatman', async (S) => {
      if (S.flag('shipGot')) return S.say('boatman', L('「破浪號」就泊在渡口外。從岸邊走上船就能出海，船一靠岸你們就自己下來。', 'The Wavebreaker is moored off the pier. Step aboard from the shore to sail; touch land and you\'ll step off.'));
      if (!S.flag('biboDone')) return S.say('boatman', L('我是這裡的船王。江蛟作亂，一條船都出不了港。你們要是能讓牠安分，我就欠你們一個人情。', 'I am the Ship King here. With the jiao on the rampage not one boat can leave. Calm it, and I owe you a favour.'));
      await lines(S, [['boatman', '你們就是平了江蛟的龍門少俠？柳閣主也寫信來了。', 'You\'re the Longmen heroes who calmed the jiao? Mistress Liu has written to me too.'],
        ['boatman', '我的「破浪號」借給你們！船就泊在渡口東邊。往南是漁火島和南疆，往北……北雁關的鐵鍊鎖著港，過不去。', 'My Wavebreaker is yours! She\'s moored east of the pier. South lie Fishing-fire Isle and the southlands; north... the chain of Beiyan Pass bars the harbour.']]);
      await S.give('shipling');
      S.set('ship'); S.set('shipGot');
      await chapter(S, 3, '南疆', 'The Southlands');
    }),
    A: P('woman', async (S) => {
      if (S.flag('shipGot')) return lines(S, [['woman', '聽說漁火島的魚湯，喝一口就忘不了。', 'They say one sip of Fishing-fire Isle\'s fish soup and you never forget it.'], ['woman', '南疆在西南邊的海那頭；漁火島在更東南的海上。', 'The southlands are across the sea to the south-west; Fishing-fire Isle is further south-east.']]);
      if (S.flag('biboDone')) return S.say('woman', L('湖上的蛟不鬧了？那快去跟船王說！他就在渡口東邊的棧橋上。', 'The jiao is quiet? Then go and tell the Ship King! He\'s on the pier east of the ferry.'));
      await S.say('woman', L('湖上的蛟還在鬧，港口一條船都出不去。船王說，誰平了江蛟，他就欠誰一個人情。', 'The jiao is still raging; not one boat can leave. The Ship King says he owes a favour to whoever calms it.'));
    }, { walk: 1 }),
  },
};

export const CH2 = { suhe, sujia1, sujia2, sujia3, bibo1, bibo2, bibo3, wangyue };
