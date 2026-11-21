# Credits

龍門刀客傳 貳 · 萬妖鈴 Longmen Quest II is an original game. Its story, characters, maps, dialogue, battle and
recruiting systems, art, music and code were made for it (building on its own predecessor, Longmen Quest). It is a
genre take on 8-bit and 16-bit console RPGs with monster companions and uses none of their names, monsters, music,
text or interface art.

## Art (original)
- **People:** the 龍門武林 cast (奕叡, 奕碩, 白先生, 柳寒煙, 苦禪, 冷笑天, 鐵無私 ...) and the new people of this game
  (胡半仙, 賈八方, 武大膽, 文對仗, 蘇小婉, 楚天闊, 牛飽飽, 莫記得, 霍天下, 墨無涯, 阿蠻): original art from the Character
  Gallery (ywchen0711/character-gallery), `nes` style: hand-typed 16x24 sprites with back views, and 48x56 portraits
  in the gallery's 霸王之路 bust style.
- **Creatures:** the gallery's common foes and big beasts, plus 23 new ones for this game (palette swaps of its bases
  and the Bell of Ten Thousand Beasts), original art from the Character Gallery.
- **Townsfolk, 奕叡's paper doll, map textures, props and the world's pop-up places:** drawn in code from NES palette
  colours (`tools/people.py`, `js/doll.js`, `js/tiles.js`).
- **The pop-up book:** drawn in code (`js/paper.js`, `js/view.js`, `style.css`).

- **The Chinese storybook look (pines, plum, willows, bamboo, Taihu rocks, stone lions, lanterns, pagodas, paifang, arched bridges, blue-green mountains, white walls and dark tiles, ink washes, the fret border, seals, the thread-bound cover, ink-wash battle backdrops):** drawn in code from NES palette colours, no image files and no outside assets (`js/ink.js`). Headings use the device's own Kai/Song fonts when present.
## Music and sound (original)
- **Soundtrack:** composed for this game (the score is `tools/music.py`) and played by recorded instruments with the
  game's own sampler and mixer, `tools/orch.py` (arrangement, added pads and percussion, reverb and mastering made
  for this game; the instrument samples are listed under Third-party):
  萬妖鈴 · The Bell of Ten Thousand Beasts; 市井 · Market Streets; 水鄉茶館 · A Teahouse in the Water Country;
  北雁關 · Beiyan Pass; 杏花炊煙 · Cookfire Smoke among the Apricot Blossoms; 百獸山寨 · The Hundred Beasts Camp;
  江湖再行 · Back on the Road of the Jianghu; 破浪 · Breaking the Waves; 幽洞 · Hollow Dark; 鈴音寺 · The Bell Temple;
  舊宅幽魂 · The Ghost of the Old Mansion; 萬妖塔 · The Tower of Ten Thousand Beasts; 群戰 · Many Against Many;
  宗門魔影 · Shadows of the Sect; 鈴心決戰 · Battle at the Heart of the Bell;
  萬妖亂舞 · Riot of Ten Thousand Beasts (the last battle, an original war-drum piece); 江湖又一年 · Another Year in the Jianghu;
  and seven jingles (including 新夥伴 · A New Friend).
- **Sound effects:** synthesised in the browser with Web Audio.

## Third-party
- **Instrument samples for the soundtrack** (every file is listed in `tools/orch_sources.json`). All are
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication); they are credited here
  with thanks, not because the licence asks for it. Changes made: notes cut, trimmed, retuned, level-matched,
  pitch-shifted and mixed into the rendered music.
  - **VS Chamber Orchestra: Community Edition (VSCO-2 CE)** by Versilian Studios (recorded by Sam Gossner and Simon
    Dalzell, sample cutting by Elan Hickler / Soundemote): violin, viola, cello and contrabass sections (sustain,
    spiccato, pizzicato, tremolo), harp, flute, bassoon, French horn, tenor trombone, glockenspiel, timpani, bass
    drum, snare and tenor drums, large ethnic drum, clash and suspended cymbals, tam-tam (gong), slit drum, claves,
    shaker, tambourine, finger cymbal, wind chimes and Nepalese bells. https://github.com/sgossner/VSCO-2-CE
  - **Erhu:** "Chinese Erhu" pack by tarane468 (freesound.org). https://freesound.org/people/tarane468/packs/26451/
  - **Dizi:** "Flute Dizi C all notes + pitched semitones" pack by Hypnotriod (freesound.org).
    https://freesound.org/people/Hypnotriod/packs/21613/
  - **Guzheng:** "LOVELY CHINESE GUZHENG PLUCKED.wav" by Pufermufin (freesound.org); single plucked notes were cut
    from it. https://freesound.org/people/Pufermufin/sounds/396868/
  - **Muyu:** "Mokugyo.wav" by jonopodmore. https://freesound.org/people/jonopodmore/sounds/607215/
  - **Temple blocks:** "Temple Blocks (5pcs) - Hard Wood Mallets" by sazanami12.
    https://freesound.org/people/sazanami12/sounds/863784/
  - **Opera cymbal:** "cymbal splash hit nearby chinese opera in park" by kyles.
    https://freesound.org/people/kyles/sounds/452400/
  - **Taiko:** "taiko.wav" and "taiko2.wav" by Anuj_Shrestha1.
    https://freesound.org/people/Anuj_Shrestha1/sounds/486140/ and https://freesound.org/people/Anuj_Shrestha1/sounds/486141/
- **Cubic 11 (俐方體11號)** by ACh-K and contributors, SIL Open Font License 1.1 (`fonts/Cubic_11-LICENSE.txt`). It
  includes glyphs from JF Dot M+H 12 and the M+ bitmap fonts.
- **three.js r160** and its post-processing examples (EffectComposer, RenderPass, ShaderPass, OutputPass),
  © three.js authors, MIT License.
