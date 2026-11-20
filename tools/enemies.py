"""Hand-typed Famicom pixel grids for the first enemy roster of 龍門刀客傳 Longmen Quest.

The game's enemies now come from the Character Gallery (tools/gallery.py builds assets/enemies.png and
js/enemy_art.js). This file is kept for the Golden Arhat (b_luohan), which tools/gallery.py draws with make(), and as
the record of the first roster.

    python -P tools/enemies.py --sheet PATH   writes a 4x contact sheet of the first roster

Each base design is typed as rows of slot letters (see nes.parse: 'N:content' = N empty pixels then content).
'.' is transparent, 'k' is the black outline (the backdrop colour). Other letters are colour slots; every enemy is a
palette swap that maps the slots to 2C02 indexes. Bases marked mirror are typed as their left half and reflected.
A second grid ('spr') is the sprite layer (small overlays such as glowing eyes), as the hardware did it.
Sub-palettes are packed from the colours each 16x16 area uses, and nes.Pic.check() proves the Famicom rules
(<= 3 colours from one sub-palette per 16x16 area, <= 4 sub-palettes; sprites 3 colours per 8x8 tile, <= 8 a line).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nes  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- 狗 dog: a wolf side-on, facing left, jaws open
# L light fur, M mid fur, D dark fur, w teeth/eye
DOG = dict(w=32, h=32, bg='''
.
.
.
9:k...k
8:kMk.kMk
8:kMMkMLk
7:kMLLLLLMk
6:kLLLLLLLLMk
5:kLLkkLLLLLLMk............kk
4:kLLLkwkLLLLLMk...........kMk
2:kkLLLLLLLLLLLLMkkkkkkkkkk.kMMk
1:kLLLLLLLLLLLLLLMMMMMMMMMMMkkMMk
kkLLLLLLLLLLLLLMMMMMMMMMMMMMMMk
kwwkkkkLLLLLLLMLLLLLLLMMMMMMMk
.k....kLLLLLLMLLLLLLLLLMMMMMMk
.kwwkkLLLLLLMLLLLLLLLLLLMMMMk
2:kkLLLLLLMLLLLLLLLLLLLMMMMDk
4:kLLLLLMLLLLLLLLLLLLMMMMDk
4:kLLLLLMMLLLLLLLLLMMMMMDDk
4:kLLLLkMMMMMMMMMMMMMMMMDDk
4:kLLLk.kMMMMMMMMMMMMMMDDDk
4:kLLMk..kkMMMMkkkkkMMMDDk
4:kLLMk....kMMMk...kMMMDDk
4:kLLMk....kMMMk...kMMDDk
4:kLLMk....kMMk....kMMDk
4:kLLMk....kMMk....kMMDk
4:kLMMk....kMMk....kMDDk
3:kLLMMk...kLMMk..kLMDDk
3:kkkkkk...kkkkkk.kkkkkk
''', spr='''
.
.
.
.
.
.
.
.
9:e
''')

# ---------------------------------------------------------------- 蛇 snake: coiled, head raised, facing us
# M scales, D dark scales, L belly, e eyes and tongue
SNAKE = dict(w=32, h=32, bg='''
................................|
................................|
......kkkkkkk...................|
....kkMMMMMMMkk.................|
...kMMMMMMMMMMMk................|
..kMMMkkMMMMMMMMk...............|
.kMMMkeekMMMMMMMMk..............|
kMMMMMkkMMMMMMMMMk..............|
kMMMMMMMMMMMMMMMMMk.............|
kkkkkkkkkMMMMMMMMMk.............|
eekLLLLLLkMMMMMMMMk.............|
e.ekkkkkkLLMMMMMMMk.............|
.......kkLLLMMMMMMk.............|
.........kLLLMMMMMMk............|
..........kLLLMMMMMk............|
...........kLLLMMMMMk...........|
...........kLLLMMMMMk...........|
..........kLLLMMMMMMk...........|
......kkkkkLLLMMMMMkkkkkk.......|
....kkMMMMMkLLLMMMMkMMMMMkk.....|
...kMMDMMDMMkLLMMMkMMDMMDMMk....|
..kMMMMMMMMMMkkkkkkMMMMMMMMMk...|
..kLLLMMMMMMMMMMMMMMMMMMMLLLk...|
...kLLLLLLMMMMMMMMMMMMLLLLLk....|
..kkkkkLLLLLLLLLLLLLLLLLkkkkk...|
.kMMMMkkkkkkkkkkkkkkkkkkkMMMMk..|
kMMDMMMMDMMMMDMMMMDMMMMDMMMDMMk.|
kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMk.|
kLLLMMMMMMMMMMMMMMMMMMMMMMMLLLk.|
.kLLLLLLLMMMMMMMMMMMMMMLLLLLLk..|
..kkLLLLLLLLLLLLLLLLLLLLLLLkk...|
....kkkkkkkkkkkkkkkkkkkkkkk.....|
''')

# ---------------------------------------------------------------- 蝠 bat: wings spread
# M wing skin, D body fur, w fangs, e eyes (sprite)
BAT = dict(w=32, h=24, mirror=True, bg='''
................
................
................
..k.........k...
..kk........kk..
.kMMk.......kMk.
.kMMMk......kMDk
.kMMMMk....kDDDD
kMMMMMMk..kDDDDD
kMMkMMMMkkDDDkkD
kMMMkMMMMkDDDkDD
kMMMMkMMMMkDDDDD
kMMMMMkMMMkDDkkk
kMMMMMMkMMkDDkwk
kMMkMMMMkMkDDDDD
kMk.kMMMMkkDDDDD
kk...kMMMkkDDDDD
......kMMkkDDDDD
.......kMkkDDDDk
........kk.kDDk.
...........kDk..
...........k.k..
''', spr='''
.
.
.
.
.
.
.
.
.
.
13:e
''')

# ---------------------------------------------------------------- 嘍囉 bandit: headscarf, beard, dao raised
# H scarf/vest/leg wraps, h trousers, S skin, s skin shade, B blade, g blade shade
BANDIT = dict(w=40, h=48, bg='''
........................................|
........................................|
..............kkkkkkkkkkk...............|
............kkHHHHHHHHHHHkk.............|
...........kHHHHHHHHHHHHHHHk............|
...........kHHHHHHHHHHHHHHHk............|
.......kkkkkHHHHHHHHHHHHHHHk............|
.....kHHHHHkkkkkkkkkkkkkkkkk............|
....kHHHkHHkSSSSSSSSSSSSSSSk............|
...kHHk.kHkkSkkkSSSSSSSkkkSk............|
...kHk...kkkSSSkkSSSSSkkSSSk............|
....k......kSSkkSSSsSSSkkSSk............|
...........kSSSSSSSsSSSSSSsk............|
...........kSSSSSSsSsSSSSSsk............|
...........kskkkkkkkkkkkkkSk............|
...........kkkSkkkkkkkSkkkkk............|
............kkkkkkkkkkkkkkk....kSSSSk...|
...............kkSSSSSkk.......kSkkSk...|
.........kkkkkkHHkSSSkHHkkk....kSSSSk...|
........kHHHHHHHHkSSSkHHHHHk...kSSSSk...|
.......kHHHHHHHHHkSSSSkHHHHHk..kSSSk....|
.......kHHHHHHHHkSSSSSSkHHHHHkkSSSk.....|
.......kSkHHHHHHkSSSSSSkHHHHSSSSSk......|
......kSSkHHHHHkSSSSSSSSkHHHkkkkk.......|
......kSSkHHHHHkSSSSSSSSkHHHk...........|
......kSSSkHHHHkSSSkkSSSkHHHk...........|
.......kSSkHHHHkSSSSSSSSkHHHk...........|
........kSSkHHHkSSSSSSSSkHHHk...........|
.........kSSkHHkSSSkkSSSkHHHk...........|
..........kSSkkkkkkkkkkkkkkkk...........|
..........kkkkhhhhhhhhhhhhhhk...........|
..........khhhhhhhhhhhhhhhhhk...........|
..........khhhhhhhhhhhhhhhhhk...........|
.........khhhhhhhhkkhhhhhhhhhk..........|
.........khhhhhhhk..khhhhhhhhk..........|
........khhhhhhhk....khhhhhhhk..........|
........khhhhhhhk....khhhhhhhhk.........|
.......khhhhhhhk......khhhhhhhk.........|
.......khhhhhhk.......khhhhhhhhk........|
.......kHkHkHkk........kHkHkHkHk........|
.......kHHHHHHk........kHHHHHHHk........|
.......kHkHkHk..........kHkHkHkk........|
.......kHHHHHk..........kHHHHHHk........|
......kkkkkkkk..........kkkkkkkkk.......|
.....kkkkkkkkk..........kkkkkkkkkk......|
''', over='''
35:kk
34:kBBk
33:kBBBk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
32:kBBBgk
30:kkkkkkkkk
33:kkk
''')

# ---------------------------------------------------------------- 豬 boar: side-on, facing left, tusks
# M hide, D bristles, L snout/belly, w tusks, e eye (sprite)
BOAR = dict(w=32, h=32, bg='''
.
.
.
15:k.k.k.k
13:kkDkDkDkDkk
11:kkDDDDDDDDDDDkk
6:k...kDDDDDDDDDDDDDDDkk
5:kMk.kMMDDDDDDDDDDDDDDDDk
5:kMMkMMMMMDDDDDDDDDDDDDDDk
4:kMMMMMMMMMMMMDDDDDDDDDDDDk
3:kMMkkMMMMMMMMMMMMDDDDDDDDDk
2:kMMMkkMMMMMMMMMMMMMMMDDDDDDDk
2:kMMMMMMMMMMMMMMMMMMMMMMDDDDDk
1:kMMMMMMMMMMMMMMMMMMMMMMMMMDDDk
kLLMMMMMMMMMMMMMMMMMMMMMMMMMMDk
kLLLMMMMMMMMMMMMMMMMMMMMMMMMMDk
kkLLLMMMMMMMMMMMMMMMMMMMMMMMMMk
kLkLLkMMMMMMMMMMMMMMMMMMMMMMMMk
1:kLLLwkMMMMMMMMMMMMMMMMMMMMMMMk
2:kkwwkMMMMMMMMMMMMMMMMMMMMMMk
3:kwkkMMMMMMMMMMMMMMMMMMMMMMk
4:k.kLLMMMMMMMMMMMMMMMMMMMk
6:kLLLLLLLMMMMMMMMMMLLLk
6:kMMMkkLLLLLLLLLLkMMMk
6:kMMMk.kkkkkkkkkk.kMMMk
6:kMMMk...........kMMMk
6:kMMk............kMMk
6:kMMk............kMMk
6:kkkk............kkkk
''', spr='''
.
.
.
.
.
.
.
.
.
.
6:e
''')

# ---------------------------------------------------------------- 猿 ape: front, knuckles on the ground
# M fur, L light fur, F face/chest skin, e eyes (sprite)
APE = dict(w=40, h=40, mirror=True, bg='''
....................
....................
..............kkkkkk
............kkMMMMMM
...........kMMMMMMMM
...........kMMMMLLLL
..........kMMMLLLLLL
..........kMMkkkkkkk
..........kMkFFFkkFF
..........kMkFFFFFFF
..........kMkFFFFFkF
...kkkk...kMMkFFFFFF
..kMMMMkk.kMMkFkkkkk
.kMMMMMMMkkMMMkFFFFF
.kMMMMMMMMMMMMMkkkkk
kMMMLLMMMMMMMMMMMMMM
kMMLLMMMMMMMMkFFFFFF
kMMLMMMMMMMMkFFFFFFF
kMMLMMMkMMMMkFFFFFFk
kMMLMMk.kMMMkFFFFFkF
kMMLMMk.kMMMkFFFFFFF
kMMLMMk.kMMMMkFFFFFF
kMMLMMk..kMMMkFFFFkF
kMMLMMk..kMMMkFFFFFF
kMMLMMk..kMMMMkFFFkF
kMMLMMk...kMMMkFFFFF
kMMLMMk...kMMMMkkFFF
kMMLMMk...kMMMMMMkkk
kMMMMMk...kMMMMMMMMM
kMLLMMMk..kMMMMMMMMM
kMLLLMMk..kMMMMMMMMM
kLLLLLLk..kMMMMMkkkk
kLkLkLLk..kMMMMk....
.kkkkkk...kMMMMk....
..........kMMMMk....
..........kMMMMk....
..........kLLLMk....
.........kLLLLLk....
.........kkkkkkk....
''', spr='''
.
.
.
.
.
.
.
.
16:e
''')

# ---------------------------------------------------------------- 鬼火 wisp: a ghost flame with a face
# W white core, L light flame, M outer flame
WISP = dict(w=24, h=24, mirror=True, bg='''
..........kk
.....k...kMM
.....kk..kMM
....kMk.kMMM
....kMMkkMLL
...kMMMMMMLL
..k.kMMMMLLL
..kkMMMLLLLW
..kMMMLLLWWW
.kMMMLLWWWWW
.kMMLLWWWWWW
kMMLLWkkWWWW
kMMLLWkkkWWW
kMMLLWWkkWWW
kMMLLWWWWWWW
kMMLLWWkWWWW
kMMLLWWkkkkk
.kMMLLWWkkWk
.kMMLLLWWWWW
..kMMLLLLLLL
...kkMMMMMMM
.....kkkMMMM
........kkkk
''')

# ---------------------------------------------------------------- 樹妖 tree spirit: leafy crown, face in the trunk
# G leaves, g dark leaves, T bark, t dark bark, e eyes (sprite)
TREE = dict(w=40, h=48, mirror=True, bg='''
...........kkkkkkkkk
........kkkGGGGGGGGG
......kkGGGGGgGGGGGG
.....kGGGGgGGGGGGgGG
....kGGgGGGGGGTGGGGG
...kGGGGGGGkGGTGGGgG
...kGGGGGGgGGGGTGGGG
..kGgGGGGGGGGgGTGGGT
..kGGGGTGGGGGGGGTGTG
..kGGGGGTGGGGgGGGTTG
.kGGgGGGGTGGGGGGGGTT
.kGGGGGGGGTTGGGGgGTT
.kgGGGGgGGGGTTGGGGTT
.kggGGGGGGGGGGTTTTTT
..kggGGGgGGGGGGGTTTT
..kkgggggggggggggggg
...kkgggkgggggkkgTTT
....kkkk.kkkkkktTTTT
...........ktTTTTTTT
..k.k......ktTTkTTTT
..kTk.k....ktTkkkTTT
...kTkTk...ktTkkkTTT
....kTTk...ktTTTTTTT
....kTTTkkkktTTTTTTT
.....kTTTTTTTTTTTTTT
......kkkkkTttTTTTTT
...........ktTTkkkkk
...........ktTkTTTTT
...........ktTTkkkkk
...........ktTTTTTTT
...........ktTTTtTTT
...........ktTTTTTTT
..........ktTTTTTtTT
..........ktTTTTTTTT
.........ktTTTTTTTTT
.........ktTTkkTTTTT
........ktTTTkkkTTTT
.......ktTTTk..kTTTk
......ktTTTk...kTTTk
.....ktTTTk....kTTk.
....ktTTTk.....kTTk.
...ktTTTk......kTTk.
..kkkkkk.......kkkk.
''', spr='''
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
15:e
''')

# ---------------------------------------------------------------- 蟾 toad spirit: squatting, wide mouth
# M skin, D warts, L belly / eye whites
TOAD = dict(w=32, h=32, mirror=True, bg='''
................
................
................
................
................
......kkkk......
.....kMMMMk.....
....kMLLLLMk....
....kMLkkLMk....
....kMLkkLMkkkkk
...kkMMLLMMMMMMM
..kMMMMMMMMMMDMM
.kMMDMMMMMMMMMMM
.kMMMMMMMMDMMMMM
kMMMMDMMMMMMMMMM
kMMMMMMMMMMMMMMM
kkkkMMMMMMMMMMMM
kMMMkkkkMMMMMMMM
.kMMMMMMkkkkkkkk
.kMMMLLMMMMMMMMM
kMMMLLLLLLLLLLLL
kMMLLLLLLLLLLLLL
kMMLLLLLLLLLLLLL
kMMkLLLLLLLLLLLL
kMkMkLLLLLLLLLLL
kkMMkLLLLLLLLLLL
kMMMkkLLLLLLLLLL
kMMMMkkLLLLLLLLL
kMMMMMkkkkkkkkkk
kLkLkLk..kLkLkLk
kkkkkkk..kkkkkkk
''')

# ---------------------------------------------------------------- 女鬼 ghost: long hair, robe, floating
# H hair, S face, R robe, r robe shade, e eyes (sprite)
GHOST = dict(w=32, h=48, mirror=True, bg='''
................
................
..........kkkkkk
........kkHHHHHH
.......kHHHHHHHH
......kHHHHHHHHk
......kHHHHHHkSS
.....kHHHHHHkSSS
.....kHHHHHkSSSS
.....kHHHHHkSkkk
.....kHHHHHkSSkS
.....kHHHHHkSSSS
....kHHHHHHkSSSS
....kHHHHHHkSSkk
....kHHHHHHHkSSS
....kHHHHHHHkkSS
...kHHHHHHHHHkkk
...kHHHHHHHHkRRR
..kHHHHHHHHkRRRk
..kHHHHHHHkRRRkr
..kHHHHkkkRRRkrr
..kHHHkRRRRRRkrR
.kHHHkRRRRRRRRkR
.kHHkRRRRRRRRRkR
.kHHkRRrRRRRRRkR
.kHHkRRrRRRRRRkR
.kHHkRRrRRRRRkRR
.kHHkRRrRRRRRkRR
.kHHkRRrRRRRkRRR
.kHHkrRrRRRRkRRR
.kHHkrrkkRRRkRRR
.kHHkrk..kkkRRRR
..kHkk.....kRRRR
..kHk......kRrRR
...k.......kRRRR
...........kRRrR
...........kRRRR
...........krRRR
..........krRRRR
..........krRRrR
..........krrRRR
...........krRRR
...........krrRR
............krRR
............krrk
.............kk.
''', spr='''
.
.
.
.
.
.
.
.
.
.
14:e
''')

# ---------------------------------------------------------------- 骷髏兵 skeleton soldier, rusty sword
# B bone, b bone shade, A armour/rags/rusty iron, e eyes (sprite)
SKEL = dict(w=32, h=48, bg='''
................................|
.............kkkkkk.............|
...........kkAAAAAAkk...........|
..........kAAAAAAAAAAk..........|
..........kAAAAAAAAAAk..........|
.........kkkkkkkkkkkkkk.........|
..........kBBBBBBBBBBk..........|
..........kBkkkBBkkkBk..........|
..........kBkkkBBkkkBk..........|
..........kBBkBBBBkBBk..........|
...........kBBBkkBBBk...........|
...........kbkBkBkBbk...........|
............kkBkBkBkk...........|
.............kkkkkk.............|
.........kkkkkkBBkkkkkk.........|
.......kkAAAkBBBBBBkAAAkk.......|
......kAAAAkBkkBBkkBkAAAAk......|
......kAAAkBkBBBBBBkBkAAAk......|
.......kkkBkkkkBBkkkkBkkk.......|
.......kBk.kBBBBBBBBBk.kBk......|
.......kBk.kkkkBBkkkkk.kBk......|
......kBk...kBBBBBBBk...kBk.....|
......kBk...kkkkBBkkk...kBk.....|
......kBk....kBBBBBk.....kBk....|
.....kBk......kkBBkk.....kBk....|
.....kBBk......kBBk.......kBBk..|
....kBBk....kkAAAAAAkk....kBBk..|
....kkkk...kAAAAAAAAAAk...kkkk..|
...........kAAkAAAAkAAk.........|
...........kAkkBkkBkkAk.........|
............kkBBk..kBBkk........|
............kBBk....kBBk........|
............kBBk....kBBk........|
...........kBBk......kBBk.......|
...........kBBk......kBBk.......|
..........kbBBbk....kbBBbk......|
...........kBBk......kBBk.......|
...........kBBk......kBBk.......|
...........kBk........kBk.......|
...........kBk........kBk.......|
..........kBBk........kBBk......|
.........kBBBBk......kBBBBk.....|
.........kkkkkk......kkkkkk.....|
''', over='''
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
25:kkkkkkk
27:kAbk
27:kAbk
27:kAbk
27:kAbk
27:kAbk
28:kAbk
28:kAbk
28:kAbk
28:kAbk
28:kAbk
28:kAbk
29:kk
''', spr='''
.
.
.
.
.
.
.
12:e....e
''')

# ---------------------------------------------------------------- 狐 fox spirit: sitting, big tail
# O fur, o dark fur, W white
FOX = dict(w=32, h=32, bg='''
................................|
................................|
....k....k......................|
...kOk..kOk.....................|
...kOOkkOWOk.................kk.|
...kOWOOOWOk...............kkOOk|
..kOOOOOOOOOk.............kOOOOk|
..kOOOOOOOOOOk...........kOOOOok|
.kOOkkOOOOOOOk..........kOOOOOok|
.kOOOkkOOOOOkk.........kOOOOOook|
kOOOOOOOOOOk...........kOOOOOok.|
kkWWWOOOOOk...........kOOOOOOok.|
.kWWWWOOOOk...........kOOOOOok..|
..kkWWWOOOOk.........kOOOOOOok..|
....kkWWOOOOk........kOOOOOok...|
.....kWWWOOOOk......kOOOOOOok...|
.....kWWWWOOOOk....kOOOOOOok....|
.....kWWWWOOOOOk..kOOOOOOok.....|
.....kWWWWWOOOOOkkOOOOOOok......|
....kWWWWWOOOOOOOkOOOOOok.......|
....kWWWWWOOOOOOOOkOOOok........|
....kWWWWOkOOOOOOOOkOOk.........|
....kWWWWOkOOOOOOOOOkOk.........|
....kWWWOOkOOOOOOOOOOkkkk.......|
....kWWOOOkOOOOOOOOOOOOOOkk.....|
....kOOOOkkOOOOOOOOOOOOOOOOk....|
....kOOOk.kOOOOOOOOOOOOOoWWWk...|
....kOOOk.kOOOOOOOOOOOooWWWWWk..|
....kOOOk.kOOOOOOOOooooWWWWWWk..|
...kkOOOk.kkOOOOOOoooWWWWWWWk...|
...kWkWWk.kkkkkkkkkkkkkkkkkk....|
...kkkkkk.......................|
''')

# ---------------------------------------------------------------- 羅漢 temple statue: horse stance, fists up
# L highlight, M body, D trousers/shadow
STATUE = dict(w=32, h=48, mirror=True, bg='''
................
...........kkkkk
.........kkLLLLL
........kLLLLLLL
........kLLLMMMM
.......kLLMMMMMM
.......kLMMMMMMM
......kkMMkkkMMM
......kLkMMMMMMM
......kLkMkkkMMM
......kMkMMMMMkM
.......kkMMMMMMM
........kMMMMkkk
........kDMMMMMM
.........kMMMMMM
..........kkkkkk
......kkkkkMMMMM
..kkkkLLLLLkkMMM
.kLLLLLLLLLLLkkM
kLLMMMLLkkkkkkLM
kLMMMMLkLLLLLMkL
kLMMMMkkkkkkkMkM
kLMMMMkLLLLLMMkM
kLMMMMkkkkkkkMkM
kLMMMMkLLLLLMMkM
.kMMMkkMMMMMMkMM
.kMMMMkMMMMMkMMM
..kMMMMkMMMkMMMM
...kkMMMkkkMMMMM
.....kkkMMMMMMMM
.......kMMMMMMMM
......kkkkkkkkkk
.....kDDDDDDDDDD
....kDDDDDDDDDDD
...kDDDDDDDDDDkk
..kDDDDDDDDDDk..
.kDDDDDDDDDkk...
.kDDDDDDDDk.....
.kDDDDDDDk......
.kDDDDDDk.......
.kMDDDDDk.......
..kMMMMk........
..kMMMMk........
.kMMMMMMk.......
.kkkkkkkk.......
''')

# ---------------------------------------------------------------- 蛛 spider: from the front, a face on its back
# M body, D legs, Y markings, e eyes (sprite)
SPIDER = dict(w=32, h=32, mirror=True, bg='''
................
...........kkkkk
.........kkMMMMM
........kMMMMMMM
.......kMMMMYYYY
......kMMMYYYYYY
......kMMYYYYYYY
.....kMMYYYkkYYY
.....kMMYYYYYYYY
.....kMMYYYYYYkY
.....kMMMYYYYYYY
......kMMYYkkkkk
......kMMMYYYYYY
.......kMMMMYYYY
..kk....kkMMMMMM
.kDDk.....kkkkkk
kDDDDk...kkMMMMM
kDkkDDk.kMMMMMMM
kDk.kDDkMMkMMMMM
kDk..kDDMMMMMMMM
kDk.kkDDkMMMMMMM
kDkkDDDDDkMMMMkk
kDkDDkkDDDkMMkDD
kDkDk.kkDDkkkkDk
kDkDk..kDDk.kDDk
kkkDk..kDk..kDk.
..kDk.kDDk..kDk.
..kDk.kDk...kk..
..kk..kDk.......
......kk........
''', spr='''
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
13:ee
''')

# ---------------------------------------------------------------- 教徒 cultist: hood, mask, iron claws
# R robe, r robe shade, W mask/claws, e eye glow (sprite)
CULTIST = dict(w=32, h=48, mirror=True, bg='''
...............k
..............kk
............kkRR
...........kRRRR
..........kRRRRR
.........kRRRRRR
.........kRRkkkk
........kRRkWWWW
........kRRkWWWW
........kRkWkkkW
........kRkWWkkW
........kRkWWWWW
........kRkWWWkW
........kRkWWkWk
........kRRkWWWW
.......kRRRkkWWW
......kRRRRRRkkk
....kkRRRRRRRRRR
...kRRRRRRRRRRRR
..kRRRRrRRRRRRkR
..kRRRRrRRRRRkRR
.kRRRRRrRRRRkRRR
.kRRRRkrRRRkRRRR
.kRRRkRrRRkkkkkk
.kRRRkRrRRrrrrrr
.kRRkRRrRRkkkkkk
.kRRkRRrRRRkRRRR
kRRRkRRrRRRRkRRR
kWWWkRrRRRRRRkRR
kWkWkRrRRRRRRRkR
kWkWkrRRRRRRRRRk
.k.k.krRRRRRRRRR
.....krRRRRRRRRR
....krRRRRRRRRRR
....krRRRRRRRRRR
....krRRRRRRRkRR
...krRRRRRRRRkRR
...krRRRRRRRkRRR
...krRRRRRRRkRRR
..krRRRRRRRkRRRR
..krrRRRRRRkRRRR
..kkkkkkkkkkkkkk
.....kkk.....kkk
''', spr='''
.
.
.
.
.
.
.
.
.
.
13:e
''')

# ---------------------------------------------------------------- 蠍 scorpion: side-on, facing left, tail over
# L light shell, M shell, D dark joints, e eyes (sprite)
SCORP = dict(w=32, h=32, bg='''
................................|
................................|
................................|
...............kkkkkk...........|
.............kkLLLMMMkk.........|
............kLLMMkkkMMMk........|
...........kLMMkk...kMMMk.......|
...........kMMk......kMMMk......|
..........kLMk........kMMMk.....|
.........kLLMk........kkkkkk....|
.........kMMMk........kLMMMk....|
..........kDDk........kMMMDk....|
...........kDk........kkkkkk....|
............k.........kLMMMk....|
.kkkk.................kMMMDk....|
kLLLMk...............kkkkkkk....|
kLMMMMk..............kLMMMk.....|
kkkkMMk..............kMMMDk.....|
....kMk.kkkkkkkkkkkkkkkkkk......|
kkkkMMkkLLLLLLLLLLLLLLLMk.......|
kLLMMMMkLMMkMMMkMMMkMMMMDk......|
kMMMMMkLkMMkMMMkMMMkMMMMDk......|
.kkkkMkkMMMkMMMkMMMkMMMDDk......|
.....kMMkMMMMMMMMMMMMMDDk.......|
......kkkDDDDDDDDDDDDDDk........|
........kkkkkkkkkkkkkkk.........|
.......kDk.kDk.kDk.kDk..........|
......kDk.kDk..kDk..kDk.........|
.....kDk..kDk...kDk..kDk........|
.....kk...kk.....kk...kk........|
''', spr='''
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
.
8:e
''')

# ---------------------------------------------------------------- 殭屍 jiangshi: Qing hat, talisman, arms out
# B robe/hat, S skin, Y talisman/trim, r script (sprite)
JIANG = dict(w=40, h=48, bg='''
........................................|
..................kkkk..................|
.................kBBBBk.................|
...............kkkBBBBkkk...............|
.............kkBBBBBBBBBBkk.............|
............kBBBBBBBBBBBBBBk............|
..........kkkkkkkkkkkkkkkkkkkk..........|
.........kBBBBBBBBBBBBBBBBBBBBk.........|
..........kkkkkkkkkkkkkkkkkkkk..........|
.............kSSSkYYYYYkSSSk............|
.............kSSSkYYYYYkSSSk............|
.............kSkkkYYYYYkkkSk............|
.............kSSSkYYYYYkSSSk............|
.............kSSSkYYYYYkSSSk............|
.............kSSSkYYYYYkSSSk............|
..............kSSkkYYYkkSSk.............|
..............kSkSSkkkSSkSk.............|
...............kSSSSSSSSSk..............|
................kkkkkkkkk...............|
..........kkkkkkkBBBBBBkkkkkkk..........|
........kkBBBBBBBkBBBBkBBBBBBBkk........|
.......kBBBBBBBBBBkBBkBBBBBBBBBBk.......|
......kBkkkkkBBBBBBkkBBBBBBkkkkkBk......|
......kkYYYYYkBBBBBBBBBBBBBkYYYYYkk.....|
......kYkkkkkYkBBBBBBBBBBBkYkkkkkYk.....|
......kYkSSSkYkBBkYYYYkBBBkYkSSSkYk.....|
.......kkSSSkkBBBkYBBYkBBBkkSSSkk.......|
........kSkSkBBBBkYYYYkBBBBkSkSk........|
........kSkSkBBBBkkkkkkBBBBkSkSk........|
.........k.kBBBBBBBBBBBBBBBBk.k.........|
...........kBBBBBBBBBBBBBBBBk...........|
...........kBBBBBBBkBBBBBBBBk...........|
...........kBBBBBBBkBBBBBBBBk...........|
...........kBBBBBBBkBBBBBBBBk...........|
...........kBBBBBBBkBBBBBBBBk...........|
...........kBBBBBBBkBBBBBBBBk...........|
...........kYYYYYYYYYYYYYYYYk...........|
............kkkkkkkkkkkkkkkk............|
..............kBBBk..kBBBk..............|
..............kBBBk..kBBBk..............|
.............kkkkkk..kkkkkk.............|
.............kYYYYk..kYYYYk.............|
.............kkkkkk..kkkkkk.............|
''', spr='''
.
.
.
.
.
.
.
.
.
19:r
19:rr
20:r
19:rr
19:r
''')

BASES = dict(dog=DOG, snake=SNAKE, bat=BAT, bandit=BANDIT, boar=BOAR, ape=APE, wisp=WISP, tree=TREE, toad=TOAD,
             ghost=GHOST, skel=SKEL, fox=FOX, statue=STATUE, spider=SPIDER, cultist=CULTIST, scorp=SCORP,
             jiang=JIANG)

# ---------------------------------------------------------------- the 44 enemies: (id, base, slot colours, extra)
ENEMIES = [
    ('e_dog', 'dog', dict(L=0x27, M=0x17, D=0x07, w=0x30, e=0x16), 'Wild Dog'),
    ('e_wolf', 'dog', dict(L=0x10, M=0x00, D=0x2D, w=0x30, e=0x28), 'Grey Wolf'),
    ('e_wolf2', 'dog', dict(L=0x30, M=0x31, D=0x21, w=0x30, e=0x11), 'Snow Wolf'),
    ('e_snake', 'snake', dict(M=0x2A, D=0x1A, L=0x39, e=0x16), 'Bamboo Viper'),
    ('e_snake2', 'snake', dict(M=0x16, D=0x06, L=0x37, e=0x28), 'Red Racer'),
    ('e_bat', 'bat', dict(M=0x13, D=0x00, w=0x30, e=0x28), 'Cave Bat'),
    ('e_bat2', 'bat', dict(M=0x16, D=0x05, w=0x30, e=0x28), 'Blood Bat'),
    ('e_bandit', 'bandit', dict(H=0x00, h=0x08, S=0x27, s=0x17, B=0x30, g=0x10), 'Black Wind Lackey'),
    ('e_bandit2', 'bandit', dict(H=0x16, h=0x2D, S=0x27, s=0x17, B=0x30, g=0x10), 'Black Wind Blade'),
    ('e_boar', 'boar', dict(M=0x17, D=0x07, L=0x27, w=0x30, e=0x16), 'Wild Boar'),
    ('e_boar2', 'boar', dict(M=0x00, D=0x2D, L=0x10, w=0x30, e=0x16), 'Ironback Boar'),
    ('e_monkey', 'ape', dict(M=0x17, L=0x27, F=0x37, e=0x16), 'Mountain Monkey'),
    ('e_ape', 'ape', dict(M=0x10, L=0x30, F=0x36, e=0x16), 'White Ape'),
    ('e_ape2', 'ape', dict(M=0x08, L=0x28, F=0x38, e=0x16), 'Vajra Ape'),
    ('e_wisp', 'wisp', dict(W=0x3B, L=0x2C, M=0x1C), "Will-o'-wisp"),
    ('e_wisp2', 'wisp', dict(W=0x34, L=0x24, M=0x14), 'Nether Flame'),
    ('e_wisp3', 'wisp', dict(W=0x30, L=0x26, M=0x16), 'Underworld Flame'),
    ('e_tree', 'tree', dict(G=0x2A, g=0x1A, T=0x17, t=0x07, e=0x28), 'Tree Spirit'),
    ('e_tree2', 'tree', dict(G=0x0F, g=0x0F, T=0x00, t=0x08, e=0x16), 'Withered Elder'),
    ('e_toad', 'toad', dict(M=0x18, D=0x08, L=0x38), 'Toad Spirit'),
    ('e_toad2', 'toad', dict(M=0x14, D=0x04, L=0x2A), 'Venom Toad'),
    ('e_toad3', 'toad', dict(M=0x28, D=0x17, L=0x38), 'Golden Toad'),
    ('e_ghost', 'ghost', dict(H=0x0B, S=0x3B, R=0x1B, r=0x0B, e=0x16), 'Drowned Ghost'),
    ('e_ghost2', 'ghost', dict(H=0x2D, S=0x30, R=0x30, r=0x10, e=0x16), 'Pale Ghost'),
    ('e_ghost3', 'ghost', dict(H=0x05, S=0x36, R=0x16, r=0x06, e=0x28), 'Wrathful Spirit'),
    ('e_skel', 'skel', dict(B=0x30, b=0x10, A=0x17, e=0x16), 'Bone Soldier'),
    ('e_skel2', 'skel', dict(B=0x30, b=0x10, A=0x18, e=0x16), 'Bone Captain'),
    ('e_skel3', 'skel', dict(B=0x23, b=0x13, A=0x04, e=0x16), 'Black Bone Fiend'),
    ('e_fox', 'fox', dict(O=0x27, o=0x17, W=0x30), 'Fox Spirit'),
    ('e_fox2', 'fox', dict(O=0x10, o=0x00, W=0x31), 'Silver Fox'),
    ('e_wood', 'statue', dict(L=0x27, M=0x17, D=0x07), 'Wooden Dummy'),
    ('e_bronze', 'statue', dict(L=0x38, M=0x18, D=0x08), 'Bronze Man'),
    ('e_spider', 'spider', dict(M=0x2D, D=0x00, Y=0x28, e=0x16), 'Venom Spider'),
    ('e_spider2', 'spider', dict(M=0x10, D=0x00, Y=0x36, e=0x16), 'Man-faced Spider'),
    ('e_disciple', 'cultist', dict(R=0x04, r=0x03, W=0x30, e=0x16), 'Netherworld Cultist'),
    ('e_assassin', 'cultist', dict(R=0x2D, r=0x00, W=0x30, e=0x16), 'Ghost-mask Assassin'),
    ('e_scorp', 'scorp', dict(L=0x38, M=0x28, D=0x18, e=0x16), 'Sand Scorpion'),
    ('e_scorp2', 'scorp', dict(L=0x26, M=0x16, D=0x06, e=0x28), 'Crimson Scorpion'),
    ('e_jiang', 'jiang', dict(B=0x02, S=0x3A, Y=0x28, r=0x16), 'Jiangshi'),
    ('e_jiang2', 'jiang', dict(B=0x18, S=0x3A, Y=0x38, r=0x16), 'Bronze-armoured Jiangshi'),
    ('b_yaoji', 'ghost', dict(H=0x02, S=0x30, R=0x31, r=0x21, e=0x16, P=0x30, J=0x2C, Q=0x28), 'Moonwater Siren'),
    ('b_luohan', 'statue', dict(L=0x38, M=0x28, D=0x18), 'Golden Arhat'),
    ('b_jiangjun', 'jiang', dict(B=0x06, S=0x3A, Y=0x28, r=0x16), 'Jiangshi General'),
    ('b_hufa', 'cultist', dict(R=0x16, r=0x06, W=0x30, e=0x28), 'Ghost-mask Warden'),
]

# extra sprite overlays for single enemies (a boss's ornament); same letters as the colour map
EXTRA_SPR = {
    # 水月妖姬: a crescent-moon comb on top and a pearl flower with a jade tassel at her temple
    'b_yaoji': '''
12:Q......Q
12:QQ....QQ
13:QQQQQQ
.
.
.
6:PP
5:PJJP
6:PP
6:Q
6:Q
6:Q
6:J
''',
}
LOOSE = '--loose' in sys.argv


def rows_of(base, key):
    text = base.get(key)
    w, h = base['w'], base['h']
    if text is None:
        return None
    if base.get('mirror'):
        half = nes.parse(text, w // 2, h, name=key)
        return nes.mirror([r + '.' * (w // 2) for r in half])
    return nes.parse(text, w, h, name=key)


def grids(bid):
    b = BASES[bid]
    bg = rows_of(b, 'bg')
    over = rows_of(b, 'over')
    if over:
        bg = nes.overlay(bg, over)
    spr = rows_of(b, 'spr')
    return bg, spr


def pack(sets):
    """Pack colour sets (one per area/tile) into as few 3-colour sub-palettes as possible."""
    pals = []
    for s in sorted({frozenset(s) for s in sets if s}, key=len, reverse=True):
        if any(s <= p for p in pals):
            continue
        best = None
        for i, p in enumerate(pals):
            if len(s) > 3:
                break
            u = p | s
            if len(u) <= 3 and (best is None or len(u) < len(pals[best] | s)):
                best = i
        if best is None:
            pals.append(set(s))
        else:
            pals[best] |= s
    return [tuple(sorted(p)) for p in pals]


def make(eid, bid, cmap):
    bg, spr = grids(bid)
    extra = EXTRA_SPR.get(eid)
    if extra:
        e = nes.parse(extra, len(bg[0]), len(bg), name=eid + ' extra')
        spr = nes.overlay(spr, e) if spr else e
    slots = {c: v for c, v in cmap.items()}
    w, h = len(bg[0]), len(bg)
    sets = []
    for ay in range(0, h, 16):
        for ax in range(0, w, 16):
            s = set()
            for y in range(ay, min(ay + 16, h)):
                for x in range(ax, min(ax + 16, w)):
                    c = bg[y][x]
                    if c in '.k':
                        continue
                    if c not in slots:
                        raise ValueError('%s: no colour for %r' % (eid, c))
                    if slots[c] != nes.BACKDROP:
                        s.add(slots[c])
            sets.append(s)
    spr_sets = []
    if spr:
        for ty in range(0, h, 8):
            for tx in range(0, w, 8):
                s = {slots[spr[y][x]] for y in range(ty, min(ty + 8, h)) for x in range(tx, min(tx + 8, w))
                     if spr[y][x] != '.'}
                spr_sets.append(s)
    pic = nes.Pic(bg, slots, pack(sets), sprite=spr, sprite_slots=slots, sprite_palettes=pack(spr_sets),
                  name=eid, transparent=True)
    if LOOSE:
        for e in pic.check(strict=False):
            print('  !', e)
    else:
        pic.check()
    return pic


def build():
    out = []
    for eid, bid, cmap, en in ENEMIES:
        out.append((eid, en, make(eid, bid, cmap).image()))
    return out


def atlas(items, width=256):
    from PIL import Image
    x = y = 0
    rowh = 0
    rects = {}
    for eid, en, im in items:
        if x + im.width > width:
            x, y, rowh = 0, y + rowh + 1, 0
        rects[eid] = (x, y, im.width, im.height)
        x += im.width + 1
        rowh = max(rowh, im.height)
    H = y + rowh
    sheet = Image.new('RGBA', (width, H), (0, 0, 0, 0))
    for eid, en, im in items:
        sheet.paste(im, rects[eid][:2])
    return sheet, rects


def contact(items, path, scale=4, cols=8):
    from PIL import Image, ImageDraw, ImageFont
    cw, ch = 40 * scale + 16, 48 * scale + 34
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cw, rows * ch), (0, 0, 0))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 13)
    except OSError:
        font = ImageFont.load_default()
    for i, (eid, en, im) in enumerate(items):
        cx, cy = (i % cols) * cw, (i // cols) * ch
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        sheet.paste(big, (cx + (cw - big.width) // 2, cy + 4 + 48 * scale - big.height), big)
        d.text((cx + 4, cy + 48 * scale + 8), eid, fill=(255, 255, 255), font=font)
        d.text((cx + 4, cy + 48 * scale + 20), en[:22], fill=(170, 170, 170), font=font)
    sheet.save(path)


def main():
    items = build()
    if '--sheet' in sys.argv:
        contact(items, sys.argv[sys.argv.index('--sheet') + 1])
    print('%d enemies checked (the game atlas is built by tools/gallery.py)' % len(items))


if __name__ == '__main__':
    main()
