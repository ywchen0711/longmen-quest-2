# 3D 角色系統範例 (rig3d)

One humanoid skeleton that every body, garment, hairstyle, weapon and monster part fits, and one animation library
(about 85 clips) that drives all of them. Open `index.html` through any web server.

- `rig.js`: `Library` (models and animations, loaded once) and `Character`:
  - `wear(slot, files)`, `setHair(file)`, `setSkin(colour)` for appearance.
  - `setWeapon(def)`, `attach(bone, obj, {u, f, r})` and `aim(bone, dir)` for weapons, parts and poses.
  - `shape` (height, head, faceW, faceL, shoulders, arms, legs, build, hunch) and `play(clip)` for build and animation.
- `weapons.js`: the weapons as data, with builders for 劍, 刀, 刀＋藤牌, 槍, 弓 (and quiver), 暗器 (and pouch) and 扇.
- `monsters.js`: monsters on the same skeleton (殭屍, 牛魔王, 九尾狐, 山魈).
- `main.js`: the example page.
- `tools/bake.py`: copies the Quaternius packs in for the web, keeping base-colour textures at 1024 only.

## Adding things

- **A garment:** put its glTF (skinned to the same 65-bone skeleton) in `models/outfit/` and list it in `main.js`
  `OUTFIT`. What it covers is read from the garment itself, and the bare body under it is hidden.
- **A weapon:** write a builder in `weapons.js` with the grip at the origin and the blade along +y, then add a line to
  `WEAPONS`: which socket it goes in (`hand_r`, `hand_l`, `back`, `hip`), its stance, attacks, block, and what it
  shoots. The grip is fitted to the hand from the finger bones, so it fits any body.
- **A body shape:** set `shape`.
  - Bone lengths change by moving child bones along their bone.
  - A heavier build pushes the skin out along its normals by bone weight, so clothes follow.
  - The head scales on its own bone.
  - Animations made for one build play on every build.
- **A monster:** add an entry in `monsters.js` with a skin colour, a shape, clothes, parts on bones (placed by up,
  forward and right on the body), a stance and gait, and optionally a `pose` for motion of its own (tails sway, a
  jiangshi hops). Beasts with other skeletons (four legs, snakes, birds) need their own rig and animations.
- **Animations:** any clip on the same bone names plays. Only rotations and the pelvis height are kept, so bone
  lengths stay each body's own. Mixamo-rigged clips can be renamed to these bones.

## Licences

The models and animations are from Quaternius:

- Universal Base Characters
- Modular Character Outfits – Fantasy
- Universal Animation Library 1 & 2

They are the free Standard versions, CC0 (see `models/LICENSE-Quaternius.txt`). The weapons and monster parts are
made in code here.
