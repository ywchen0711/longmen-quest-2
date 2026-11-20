// Where the story stands and what to do next, worked out from the flags alone (so an old record knows its
// objective too). Used by the 線索 / Clues window, by Mr Bai, by townsfolk and the recurring cast who talk about the
// current goal, and for the signposts at the forks of the world map. No imports: maps_base.js imports this file.
const L = (zh, en) => ({ zh, en });

// the story stage, in the order the tale is told
export function stage(G) {
  const F = G.flags;
  if (F.finalDone || F.ending) return 'end';
  if (F.bingpoDone) return 'peak';
  if (F.ch3Done) return 'north';
  if (F.shipGot) return F.dulongDone && F.chiyanDone ? 'inn' : 'south';
  if (F.biboDone) return 'ship';
  if (F.ch1Done) return 'water';
  if (F.yelangDone) return 'temple';
  if (!F.metBai) return 'bai';
  if (!F.campOpen) return 'camp';
  return 'yelang';
}
const inParty = (G, w) => !!(G.memberOf && G.memberOf(w));

// { now: one or two lines, more: a few lines of detail } for the Clues window
export function objective(G) {
  const F = G.flags, s = stage(G), more = [];
  switch (s) {
    case 'bai': return { now: L('四方的妖物又發狂了。先去聽雨樓找白先生問問那陣鈴聲。', 'Creatures everywhere are going mad again. First ask Mr Bai at the Listening Rain House about that bell.'),
      more: [L('聽雨樓是龍門鎮北邊正中的大屋。', 'The Listening Rain House is the big hall in the middle of the north side of Longmen Town.')] };
    case 'camp': return { now: L('去杏花村北邊的百獸山寨找牛飽飽：他教你們讓打醒的妖物當夥伴。', 'Find Niu Baobao at the Hundred Beasts Camp north of Xinghua Village: he will show you how creatures can become friends.'),
      more: [L('出龍門鎮沿大路往東北走就是杏花村，從村子再往東北一點就是山寨。', 'Follow the road north-east from Longmen to Xinghua Village; the camp is a little further north-east.'),
        L('野狼坡的狼群也發了狂：在龍門往杏花村的岔路口改往西北走。', 'The wolves of Wolf Slope have gone wild too: at the fork on the Xinghua road, turn north-west.')] };
    case 'yelang': return { now: L('野狼坡的狼群劫了鏢隊，鏢頭還困在坡上的狼窟裡。去救人！', 'The wolves of Wolf Slope fell on a caravan and the escort is trapped in their den. Go and save him!'),
      more: [L('從龍門往杏花村的大路，在岔路口往西北走到底就是野狼坡（杏花村的路牌也寫著）。', 'On the road from Longmen to Xinghua, turn north-west at the fork and follow it to the end (the Xinghua signpost says so too).'),
        L('坡上岔路多，狼窟的洞口在東北角。洞底守著一頭戴銅鈴的白額虎。', 'The slope is full of forks; the den\'s mouth is in the north-east corner. A white-browed tiger with brass bells waits at the bottom.'),
        L('大約六級再去，帶足傷藥。戰鬥中丟肉包給妖物，牠們會想加入。', 'Go at about level 6 with plenty of salves. Throw meat buns to creatures in battle and they may want to join.')] };
    case 'temple': {
      if (!inParty(G, 'wudadan')) more.push(L('狼窟正中那口發抖的大酒罈，去敲敲看——裡面有人。', 'The shaking wine jar in the middle of the wolf den: give it a knock. Someone is inside.'));
      if (!F.kuchanTaught) more.push(L('苦禪大師到了落霞鎮。帶著虎頸上掉下的鈴片去見他，他會教你們護體的武功。', 'Abbot Kuchan has come to Luoxia Town. Show him the bell shard from the tiger and he will teach you a guarding art.'));
      more.push(L('寺有三層：一樓的樓梯在正北；大殿的樓梯在東南角（兩邊鈴形的門用鈴片能開，裡面是寶物）；鐘樓上是馭妖宗的御妖使。', 'Three floors: the stairs on the first are due north; in the Great Hall they are in the south-east corner (the bell-shaped side doors open to the shard and hide treasure); the sect\'s envoy waits atop the bell tower.'));
      more.push(L('御妖使大約要十級。', 'The envoy wants about level 10.'));
      return { now: L('鈴聲來自落霞鎮東北山上的鈴音寺。從落霞鎮往北走山路上去。', 'The bell rings from the Bell Temple on the mountain north-east of Luoxia Town. Take the mountain path north from Luoxia.'), more };
    }
    case 'water': {
      if (!F.wenJoined) more.push(L('蘇河城西北角的茶攤，有個只用對聯說話的書生文對仗。對上他的三副對聯，他就會同行。', 'At the tea stall in the north-west of Suhe sits Wen Duizhang, who speaks only in couplets. Match his three couplets and he will travel with you.'));
      if (!F.sujiaDone) more.push(L('城東北的蘇家舊宅，夜夜有人奉茶。裡面漆黑，要先在城裡雜貨鋪買燈籠。舊宅樓梯：前廳在東北角，內院在東南角。', 'In the old Su mansion north-east of the city someone pours tea every night. It is pitch dark: buy a lantern at the city\'s general store first. Stairs: north-east corner in the front hall, south-east in the inner rooms.'));
      more.push(L('碧波洞：出城往南走大路到湖邊。洞的出口一層在東北角、一層在東南角，江蛟在最底下的深潭。大約十七級。', 'Green Wave Cave: take the road south from the city to the lake. Exits: north-east on the first floor, south-east on the second; the jiao is in the deep pool at the bottom. About level 17.'));
      return { now: F.metLiu ? L('水魄在蘇河城南的碧波洞，由發狂的江蛟守著。平了江蛟，望月渡的船王才肯借船。', 'The Water Soul lies in Green Wave Cave south of Suhe, guarded by a maddened jiao. Calm it and the Ship King of Wangyue Ferry will lend you a ship.')
        : L('斷橋修好了。過橋往東到水鄉蘇河城，柳閣主正在城裡打聽萬妖鈴的消息。', 'The bridge is mended. Cross it east to the canal city of Suhe, where Mistress Liu is gathering news of the bell.'), more };
    }
    case 'ship': return { now: L('江蛟平靜了！去蘇河城東南的望月渡，找船王借船。', 'The jiao is calm! Go to Wangyue Ferry south-east of Suhe and borrow the Ship King\'s ship.'),
      more: [L('從蘇河城沿往東南的大路走到海邊就是望月渡。船王就站在棧橋邊。', 'Follow the south-east road from Suhe to the sea: that is Wangyue Ferry. The Ship King stands by the pier.')].concat(F.sujiaDone ? [] : [L('還沒去蘇家舊宅？出海以前，帶著燈籠去城東北看看也不遲。', 'Not been to the old Su mansion yet? There is still time to visit it, north-east of the city, with a lantern, before you sail.')]) };
    case 'south': {
      if (!F.dulongDone) more.push(L('毒龍沼：從青竹寨往西，穿過一大片沼澤地。一層的出口在東北角，龍潭裡是背滿銅鈴的毒蟾。帶解毒草。', 'Poison Dragon Marsh: west of Green Bamboo village, across the wide marshland. The first floor exits in the north-east; the dragon pool holds a venom toad covered in bells. Bring antidotes.'));
      if (!F.chiyanDone) more.push(L('赤焰窟：焰口村東邊的火山。一層有人等著跟你們比（樓梯在西北角）；熔岩道正中有赤使擋路，樓梯在東南角；火山口上鎖著火鴉。', 'Red Flame Caves: the volcano east of Yankou. Someone waits on the first floor to race you (stairs north-west); Envoy Chi blocks the middle of the lava road (stairs south-east); a fire crow is chained at the crater.'));
      more.push(L('破浪號：從岸邊走上船就能出海，碰到陸地就會下船，船留在你們上岸的地方。南疆在望月渡的西南方，靠北岸上岸，往南走就是青竹寨。', 'The Wavebreaker: step aboard from the shore to sail; touch land and you step off, and the ship waits where you landed. The southlands lie south-west of Wangyue; land on their north shore and walk south to Green Bamboo village.'));
      more.push(L('漁火島在南疆東邊的海上，客棧是歇腳的好地方。竹海（青竹寨西北）住著白猿和九尾狐，不去也行。', 'Fishing-fire Isle lies in the sea east of the southlands; its inn is a good place to rest. The Bamboo Sea (north-west of Green Bamboo) is home to a white ape and a nine-tailed fox: optional.'));
      const left = [!F.dulongDone && L('毒龍沼', 'Poison Dragon Marsh'), !F.chiyanDone && L('赤焰窟', 'the Red Flame Caves')].filter(Boolean);
      return { now: L('坐船往南到南疆。還要去：' + left.map((l) => l.zh).join('、') + '。青竹寨的阿蠻聽得懂妖物說話。', 'Sail south to the southlands. Still to do: ' + left.map((l) => l.en).join(' and ') + '. A-Man of Green Bamboo village understands creatures.'), more };
    }
    case 'inn': return { now: L('水魄、火魄都到手了。回漁火島的客棧好好歇一晚。', 'You hold the Water and Fire Souls. Go back to the inn on Fishing-fire Isle and rest for the night.'),
      more: [L('漁火島在南疆東邊的海上。找客棧掌櫃住店。', 'Fishing-fire Isle is in the sea east of the southlands. Talk to the innkeeper.')] };
    case 'north': return { now: L('莫記得偷了兩魄往北逃了。北雁關的鐵鍊已經放下：坐船往北進港，就是北雁關。', 'Mo Jide stole the two souls and fled north. The chain of Beiyan Pass is down: sail north into the harbour to reach the pass.'),
      more: [L('北雁關的港口在北方雪山腳下的海灣裡，船從海灣口一直往北開。', 'Beiyan\'s harbour is an inlet at the foot of the northern snow peaks; sail straight up it.'),
        L('冰魄窟在北雁關東邊，沿雪原上的大路走。出口：一層東北角，冰河層在正中下方。莫記得在冰心。', 'The Ice Soul Caves are east of Beiyan along the road over the snow. Exits: north-east on the first floor, the bottom middle on the Frozen River. Mo Jide is in the Heart of Ice.'),
        L('北地的妖物很兇。雪狼部在北雁關西北，有好裝備。莫記得大約要三十級。', 'Northern creatures are fierce. The Snow Wolf camp, north-west of Beiyan, sells good gear. Mo Jide wants about level 30.')] };
    case 'peak': return { now: L('冰牆塌了。登上萬妖塔，阻止墨無涯敲響萬妖鈴。', 'The ice wall has fallen. Climb the Tower of Ten Thousand Beasts and stop Mo Wuya ringing the bell.'),
      more: [L('從冰魄窟往東，穿過冰牆的缺口，群山圍著的就是萬妖塔。', 'East of the Ice Soul Caves, through the gap in the ice wall; the tower stands inside the ring of peaks.'),
        L('塔有五層：一樓樓梯在正北，二樓東南角，三樓石獅守在正中（樓梯在東北角），四樓西南角，頂層是鈴心殿。', 'Five floors: due north on the first, south-east on the second, a stone lion in the middle of the third (stairs north-east), south-west on the fourth, and the Hall of the Bell\'s Heart on top.'),
        L('最後一戰前把裝備換到最好，多帶回氣丹和還魂丹。大約三十五級。', 'Before the last fight buy the best gear and carry qi pills and soul pills. About level 35.')] };
    default: return { now: L('故事說完了。到處走走，交更多妖物朋友吧。', 'The tale is told. Wander a while and make more creature friends.'),
      more: [L('竹海的白猿、九尾狐，各地的珍獸，還有圖鑑上沒填滿的格子……', 'The white ape and the fox of the Bamboo Sea, rare beasts in the wilds, and the empty pages of your bestiary...')] };
  }
}

// 胡半仙's prophecy for the current stage: always the opposite of the truth (flip it and it is a real hint)
export const HU_STAGE = {
  bai: [['hubanxian', '白先生？我算準了，他今天一定不在聽雨樓，去了也是白去！', 'Mr Bai? I have read it: he is surely NOT in the Listening Rain House today. Don\'t bother going!']],
  camp: [['hubanxian', '杏花村北邊那座廢寨？荒得很，連個人影都沒有，更別說什麼妖物！', 'The old stockade north of Xinghua? Deserted. Not a soul there, let alone any creatures!'], ['yishuo', '哥，照他說的反過來……那裡有人，還有妖物。', 'Brother, if we flip what he says... someone IS there, with creatures.']],
  yelang: [['hubanxian', '野狼坡頂東北角那個洞？千萬別進去，裡頭空空的，什麼也沒有！', 'That cave in the north-east corner at the top of Wolf Slope? Don\'t go in. It\'s empty, nothing at all!']],
  temple: [['hubanxian', '鈴音寺在西南邊的平地上，走大路就到，一點坡都不用爬！', 'The Bell Temple is on the flat land to the south-west. Just follow the road; no climbing at all!'], ['yishuo', '……那就是東北邊，要爬山。', '...So it\'s north-east, up a mountain.']],
  water: [['hubanxian', '碧波洞在城北，江蛟溫順得像隻貓。蘇家舊宅亮堂堂的，燈籠千萬別買！', 'Green Wave Cave is north of the city, and the jiao is gentle as a kitten. The Su mansion is bright as day: whatever you do, don\'t buy a lantern!']],
  ship: [['hubanxian', '望月渡的船王最小氣了，一條船都不會借你們！', 'The Ship King of Wangyue is the stingiest man alive. He will never lend you a boat!']],
  south: [['hubanxian', '南疆？往北走就到啦！毒龍沼在青竹寨東邊，火山在西邊，記清楚了！', 'The southlands? Just go north! Poison Dragon Marsh is EAST of Green Bamboo and the volcano is WEST. Remember that!'], ['wudadan', '……奕少俠，全部反過來記，對吧？', '...Master Yi, we remember it all backwards, right?']],
  inn: [['hubanxian', '漁火島的客棧？去住吧，安全得很，今晚一定什麼事都不會發生！', 'The inn on Fishing-fire Isle? Stay there, it\'s perfectly safe. Nothing at all will happen tonight!'], ['suxiaowan', '（小聲）……那我今晚不睡，替大家看著。', '(Quietly) ...Then I won\'t sleep tonight. I\'ll keep watch.']],
  north: [['hubanxian', '北雁關的鐵鍊還鎖得死死的，往南逃才對！冰魄窟嘛，在西邊。', 'The chain of Beiyan Pass is still locked tight: flee south! And the Ice Soul Caves are in the west.']],
  peak: [], end: [],
};

// signposts at the forks of the world map: [x, y, text]
export const SIGNS = [
  [24, 49, L('↗ 東北：杏花村・百獸山寨　↖ 西北：野狼坡　↘ 東南：落霞鎮', '↗ North-east: Xinghua Village, Hundred Beasts Camp   ↖ North-west: Wolf Slope   ↘ South-east: Luoxia Town')],
  [24, 45, L('↖ 西北：野狼坡（狼多，慎行）　↗ 東北：杏花村・百獸山寨　↓ 南：龍門鎮', '↖ North-west: Wolf Slope (many wolves; take care)   ↗ North-east: Xinghua Village, Hundred Beasts Camp   ↓ South: Longmen Town')],
  [38, 55, L('↑ 北：山路通鈴音寺　↗ 東北：大橋→水鄉蘇河城　← 西：龍門鎮', '↑ North: the mountain path to the Bell Temple   ↗ North-east: the great bridge, then Suhe   ← West: Longmen Town')],
  [41, 47, L('↑ 往上走：鈴音寺（山路陡，小心腳下）', '↑ Uphill: the Bell Temple (steep path; mind your step)')],
  [54, 46, L('→ 東：蘇河城　← 西：大橋・落霞鎮', '→ East: Suhe City   ← West: the bridge, Luoxia Town')],
  [64, 46, L('↗ 東北：蘇家舊宅　↓ 南：碧波湖・碧波洞　↘ 東南：望月渡', '↗ North-east: the old Su mansion   ↓ South: Green Wave Lake and Cave   ↘ South-east: Wangyue Ferry')],
  [45, 85, L('← 西：竹海・毒龍沼（沼澤地更西）　→ 東：焰口村・赤焰窟', '← West: the Bamboo Sea, Poison Dragon Marsh (beyond the marshland)   → East: Yankou Village, the Red Flame Caves')],
  [63, 84, L('→ 東：赤焰窟（火山）。熔岩燙腳，莫踩。', '→ East: the Red Flame Caves (the volcano). Lava burns: don\'t step in it.')],
  [73, 19, L('↖ 西北：雪狼部　↗ 東：冰魄窟，再往東是萬妖峰的冰牆', '↖ North-west: Snow Wolf Camp   ↗ East: the Ice Soul Caves, and beyond them the ice wall of the Peak')],
  [102, 10, L('冰牆後：萬妖峰。「冰魄不散，此牆不化。」', 'Behind the ice: the Peak of Ten Thousand Beasts. "While the Ice Soul holds, this wall will not melt."')],
];
export const SIGN_AT = {}; for (const [x, y, l] of SIGNS) SIGN_AT[x + ',' + y] = l;
