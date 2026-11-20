// Lines of the recurring characters, by chapter (1-4): [who, zh, en].

// 胡半仙: "an iron mouth, a sure word, no charge if I'm wrong" - and he is always wrong (until the very end)
export const HU_LINES = {
  1: [['hubanxian', '鐵口直斷，不準不要錢！小兄弟，你印堂發亮，此去一路平安，連一隻狼都碰不到！', 'An iron mouth, a sure word, no charge if I\'m wrong! Your brow shines: the road will be smooth, not a single wolf!'],
      [null, '（旁邊的人都在偷笑。）', '(The bystanders are trying not to laugh.)']],
  2: [['hubanxian', '又是你們！我掐指一算：蘇家舊宅乾淨得很，連一隻鬼都沒有！江裡的蛟龍嘛，溫順得像隻貓。', 'You again! By my fingers: the old Su mansion is spotless, not a single ghost! And the river jiao is gentle as a kitten.'],
      ['yishuo', '哥，那就是說，有鬼，蛟龍也很兇。', 'Brother, that means there ARE ghosts, and the jiao is fierce.']],
  3: [['hubanxian', '我算到了！南邊天氣晴朗，一路順風。還有那位莫大夫——天下第一好人，記性也是天下第一好！', 'I have foreseen it! Fair skies to the south, a following wind. And that Doctor Mo: the kindest man alive, with the best memory alive!'],
      ['wudadan', '……奕少俠，我們要不要提防一下那位大夫？', '...Master Yi, should we keep an eye on that doctor?']],
  4: [['hubanxian', '萬妖峰？你們上去……一定打不贏！不準不要錢！', 'The Peak of Ten Thousand Beasts? Go up there and... you will surely lose! No charge if I\'m wrong!'],
      ['yirui', '……多謝，這下放心了。', '...Thank you. Now I feel much better.']],
};

// 霍天下: claims the party's last deed as his own
export const HUO_LINES = {
  1: [['huotianxia', '我就是霍天下！野狼坡那頭白額虎，是我一拳打跑的！', 'I am Huo Tianxia! The tiger of Wolf Slope - one punch from me and it fled!']],
  2: [['huotianxia', '鈴音寺？哼，那些搖鈴的傢伙，一聽到我霍天下的名字，就嚇得把寺讓出來了！', 'The Bell Temple? Hah! Those bell-ringers heard the name Huo Tianxia and handed the temple over in fright!'],
      ['yishuo', '哥，他說的是我們打的那個……', 'Brother, he means the one WE beat...']],
  3: [['huotianxia', '江蛟？是我潛到湖底，跟牠講了一夜的道理，牠就乖了！……被水寇綁住？那、那是我故意的，打入敵人內部！', 'The river jiao? I dived to the bottom and reasoned with it all night until it calmed! ...Tied up by pirates? Th-that was on purpose. Infiltration!']],
  4: [['huotianxia', '赤焰窟的火鴉？我吹了口氣，就把牠的火吹熄了！北邊冷？我霍天下一身是火，不怕冷！……阿嚏！', 'The fire crow of the Red Flame Caves? I blew out its flames with one breath! The cold north? Huo Tianxia is all fire inside, cold can\'t touch me! ...Achoo!']],
};

// 霍天下 also brags of the deed you are about to do (so he names the place: a plain hint in his voice)
export const HUO_STAGE = {
  temple: [['huotianxia', '鈴音寺那幫搖鈴的？等我改天上山——落霞鎮往北那條山路，一拳一個！', 'Those bell-ringers at the Bell Temple? One of these days I\'ll go up - that mountain path north of Luoxia - and floor them one punch each!']],
  water: [['huotianxia', '碧波洞的江蛟？等我吃飽了就去城南的湖邊，把牠打成泥鰍！', 'The jiao of Green Wave Cave? Once I\'ve eaten I\'ll go down to the lake south of the city and beat it into an eel!']],
  ship: [['huotianxia', '望月渡的船王一見我霍天下，船都是白送的！就在東南的海邊，不信你們去問！', 'The Ship King of Wangyue gives his ships away free to Huo Tianxia! Down on the south-east shore. Go ask him!']],
  south: [['huotianxia', '南疆我熟！毒龍沼在青竹寨西邊，赤焰窟在焰口村東邊的火山裡，都是我的地盤！', 'I know the south! Poison Dragon Marsh is west of Green Bamboo, the Red Flame Caves are in the volcano east of Yankou. All my turf!']],
  inn: [['huotianxia', '回漁火島的客棧歇歇？去吧去吧，那裡的魚湯是我發明的！', 'Back to the inn on Fishing-fire Isle for a rest? Go, go: I invented their fish soup!']],
  north: [['huotianxia', '冰魄窟？就在北雁關東邊，沿大路走就到。我先……先暖暖手。', 'The Ice Soul Caves? Just east of Beiyan Pass, along the road. I\'ll... warm my hands first.']],
  peak: [['huotianxia', '萬妖塔？我先上去探路了，你們慢慢來！', 'The Tower? I\'ll scout ahead, you take your time!'], [null, '（他往反方向走了。）', '(He walks off the other way.)']],
};

// 賈八方 throws in a bit of news with his wares
export const JIA_STAGE = {
  temple: [['jiabafang', '消息免費送：鈴音寺大殿兩旁那兩扇鈴形的門，用鈴片就開得了，裡面的寶貝我眼紅好久了。', 'Free news with every sale: the two bell-shaped doors on either side of the temple\'s Great Hall open to the bell shard. I\'ve had my eye on what\'s inside for ages.']],
  water: [['jiabafang', '要去蘇家舊宅？燈籠一定要帶，裡面黑得很！我的燈籠賣完了，去城裡的雜貨鋪買吧。', 'Off to the old Su mansion? Take a lantern, it\'s black as ink in there! I\'m sold out; try the general store in town.']],
  ship: [['jiabafang', '想出海？望月渡的船王最講義氣，報上柳閣主的名字準沒錯。', 'Want to sail? The Ship King of Wangyue is a man of honour. Mention Mistress Liu and you\'re set.']],
  south: [['jiabafang', '南疆的毒蟾會噴毒，解毒草多帶幾棵！我這兒……也賣完了。', 'The venom toad of the south spits poison: take plenty of antidotes! Mine are... sold out too.']],
  north: [['jiabafang', '北地冷，冰魄窟更冷。雪狼部的皮襖比我這只木桶暖多了。雪狼部在北雁關西北。', 'The north is cold, the Ice Soul Caves colder. Snow Wolf hides are warmer than my barrel. The camp is north-west of Beiyan.']],
  peak: [['jiabafang', '萬妖塔頂？聽說要帶還魂丹，越多越好。我這兒正好有……一顆都沒有。', 'The top of the Tower? They say take soul pills, as many as you can. I happen to have... none at all.']],
};

// 賈八方: sells a little more of himself in every chapter
export const JIA_LINES = {
  1: [['jiabafang', '賈八方，天下沒有我不賣的東西！鞋？已經賣了。今天賣這雙……啊，那是你們要買回去的我的鞋。', 'Jia Bafang: nothing under heaven I won\'t sell! Shoes? Sold already. Today... ah, those ARE my shoes, if you want to buy them back.']],
  2: [['jiabafang', '又見面了！這頂帽子跟了我二十年，今天忍痛割愛。', 'We meet again! This hat has been with me twenty years. Today it breaks my heart to part with it.'],
      ['jiabafang', '頭有點涼……沒關係，生意要緊！', 'My head\'s a little cold... never mind, business first!']],
  3: [['jiabafang', '這把白骨扇？我在東海邊撿的，聽說是個大魔頭的。我連外衣都賣了，就剩這件單衣。', 'This bone fan? Found it by the eastern sea; they say it belonged to some great villain. I\'ve sold my coat too; only this shirt left.']],
  4: [['jiabafang', '（裹著一只木桶）衣服？全賣了。北地真冷啊……不過，最好的貨都留到了最後！', '(Wrapped in a barrel) Clothes? All sold. The north is so cold... but I kept the best goods for last!']],
};
