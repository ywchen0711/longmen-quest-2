"""Field sprites for the people of 龍門刀客傳 Longmen Quest: unnamed townsfolk (NPCs) and the hero's back views.

    python -P tools/people.py               (from C:\\LongmenQuest)
    python -P tools/people.py --sheet PATH  also writes a 4x contact sheet

Writes assets/people/npcs.png (one atlas, 1x pixels, transparent, 1px gap) and js/people_art.js:
  PEOPLE  rects per sprite id (front views 16x24; hero_back / yishuo_back are lists of walk frames)
  CAST    the named Longmen characters, copied from the Character Gallery exports
          (C:\\CharacterGallery\\chars\\<id>\\nes\\) to assets/people/<id>_portrait.png and <id>_sheet.png.

Same rules as the gallery's `nes` field sprites (C:\\CharacterGallery\\src\\nes_sprites.py): 16x24, typed as rows of
slot letters, '.' transparent, 'k' black, 'S' and 'c' two more 2C02 colours - 3 colours + transparent per sprite.
Shorter people stand on the bottom row. NPCs are drawn facing front only; the game mirrors them for the walk.
"""
import json
import os
import shutil
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY = r'C:\CharacterGallery\chars'
OUT_DIR = os.path.join(ROOT, 'assets', 'people')

# the common 2C02 palette table (same as tools/nes.py and the gallery)
NES = [
    0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400,
    0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
    0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10,
    0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
    0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044,
    0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
    0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8,
    0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000,
]


def rgba(i):
    v = NES[i]
    return (v >> 16 & 255, v >> 8 & 255, v & 255, 255)


def G(t, h=24):
    """A 16-wide sprite grid; short figures stand on the bottom row (copied from the gallery's nes_sprites.G)."""
    rows = [ln.strip() for ln in t.strip('\n').split('\n')]
    rows = ['.' * 16] * (h - len(rows)) + rows
    for r in rows:
        if len(r) != 16:
            raise ValueError('sprite row is %d wide: %s' % (len(r), r))
    if len(rows) != h:
        raise ValueError('sprite has %d rows' % len(rows))
    return rows


def sprite_image(rows, slots):
    """A small NES sprite: '.' transparent, other chars -> NES index (at most 3 of them). (gallery nes.sprite_image)"""
    used = {slots[c] for r in rows for c in r if c != '.'}
    if len(used) > 3:
        raise ValueError('sprite uses %d colours (max 3 + transparent)' % len(used))
    h, w = len(rows), len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    P = im.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.':
                P[x, y] = rgba(slots[c])
    return im


def legs_swapped(rows, start):
    """A second walk frame for a back view: the same body with the legs (rows from `start`) mirrored."""
    return rows[:start] + [r[::-1] for r in rows[start:]]


SKIN = 0x37
P = {}          # id -> (pal, [frames])


def npc(cid, c, grid, S=SKIN):
    P[cid] = (dict(k=0x0F, S=S, c=c), [G(grid)])


# ================================================================ the hero and his brother, from behind
# 奕叡 (gallery SPRITES['yirui']: k, S 0x37, c 0x12): topknot through a silver ring, the blue headband knotted at the
# back with its ties flying, the ring-pommel saber's hilt over his right shoulder, indigo robe and black boots
YIRUI_BACK = G('''
.......kk.......
......kSSk......
.....kkkkkk.....
...kkkkkkkkkk...
..kkkkkkkkkkkk..
.kccccccccccccck
cckkkkkcckkkkkk.
c.kkkkkkkkkkkk..
..kkkkkkkkkkkk..
..kSkkkkkkkkSk..
...kkkkkkkkkkkSk
....kkSSSSkkkkkk
..kkkcccccckkck.
.kcccccccckkcck.
.kccccccckkccck.
.kcccccckkcccck.
.kcckkkkkkkkkck.
.kSSkcccccccSSk.
..kkkcccccccck..
...kcccccccck...
...kcccckcccck..
...kkkkk.kkkkk..
...kkkkk..kkk...
.........kkkk...
''')
# 奕碩 (gallery SPRITES['yishuo']: k, S 0x37, c 0x16): spiky hair, red headband tied at the back, vermilion jacket
YISHUO_BACK = G('''
..k..k..k..k....
..kk.kk.kk.kk...
..kkkkkkkkkkkk..
ckccccccccccck..
c.kkkkkkkkkkkk..
..kkkkkkkkkkkk..
..kkkkkkkkkkkk..
..kSkkkkkkkkSk..
..kkkkkkkkkkkk..
...kkkkkkkkkk...
....kSSSSSSk....
..kkcccccccckk..
.kcccccccccccck.
.kSSkcccccckSSk.
..kkkcccccccck..
....kcccccccck..
....kkkkk.kkk...
....kkkk..kkkk..
''', 24)
P['hero_back'] = (dict(k=0x0F, S=SKIN, c=0x12), [YIRUI_BACK, legs_swapped(YIRUI_BACK, 18)])
P['yishuo_back'] = (dict(k=0x0F, S=SKIN, c=0x16), [YISHUO_BACK, legs_swapped(YISHUO_BACK, 14)])

# ================================================================ townsfolk (front view)
# villager: hair in a cloth knot, short brown jacket over trousers
npc('man', 0x18, '''
.......kk.......
......kcck......
.....kkkkkk.....
....kkkkkkkk....
...kkkkkkkkkk...
...kSSSSSSSSk...
..kSSSSSSSSSSk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSSkkSSSk...
....kkSSSSkk....
..kkcckSSkcckk..
.kccccckkcccccck
.kckcccckcccckck
.kckcccckcccckck
.kSSkkkkkkkkkSSk
..kkkcccccccckk.
...kcccckcccck..
...kcccckcccck..
...kcccckcccck..
...kkkkk.kkkkk..
...kkkkk..kkk...
.........kkkk...
''')

# woman: hair in a bun with a pin, a long green dress
npc('woman', 0x2A, '''
................
......kkkk......
.....kkkkkk.....
......kkkkS.....
....kkkkkkkk....
...kkkkkkkkkk...
..kkkSSSSSSkkk..
..kkSSSSSSSSkk..
..kkSkkSSkkSkk..
..kkSSSSSSSSkk..
...kSSSkkSSSk...
....kkSSSSkk....
...kkcckkcckk...
..kccccckccccck.
..kckccckcccckk.
..kSSkccckcckSSk
...kkcccckcccck.
...kccccckcccck.
...kcccckcccccck
..kcccckcccccck.
..kccccccccccck.
..kkkkkkkkkkkk..
....kkk...kk....
................
''')

# old man: white hair and a long white beard, a pale grey robe, a cane
npc('oldman', 0x10, '''
................
................
.....kkkkkk.....
....kcccccck....
...kcccccccck...
...kcSSSSSSck...
..kcSSSSSSSSck..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kcccSScccck..
...kcccccccck...
..kkkccccccck.k.
.kcckkcccckkkSk.
.kcckckcckcckSk.
.kSSkckkkkcckkk.
..kkkcccccccck.k
...kccckcccck..k
...kccckcccck..k
..kcccckccccck.k
..kcccckccccck.k
..kkkkkkkkkkkk.k
....kkk...kkk..k
...............k
''')

# old woman: grey hair in a low bun, a dark robe, a cane
npc('oldwoman', 0x10, '''
................
................
......kkkk......
.....kcccck.....
....kcccccck....
...kcccccccck...
...kcSSSSSSck...
..kcSkkSSkkSck..
..kcSSSSSSSSck..
..kcSSSkkSSSck..
...kkSSSSSSkk...
....kkkSSkkk....
...kkkkkkkkkk.k.
..kkkkkkkkkkkSk.
..kSSkkkkkkkkSk.
..kSSkkkkkkkkkk.
...kkkkkckkkk.k.
...kkkkkckkkk.k.
...kkkkkckkkk.k.
..kkkkkkckkkkkk.
..kkkkkkckkkkkk.
..kcccccccccccc.
....kkk...kkk.k.
..............k.
''')

# child: a tuft of hair, a red tunic, small (17 rows)
npc('child', 0x26, '''
......kk........
.....kkkk.......
....kkkkkkk.....
...kkkkkkkkk....
...kSSSSSSSk....
...kSkSSSkSk....
...kSSSSSSSk....
...kSSSkSSSk....
....kkSSSkk.....
...kkcccccck....
..kcckcccckck...
..kSkcccccckSk..
...kkcccccckk...
....kcccccck....
....kckkkkck....
....kkk..kkk....
................
''')

# guard: red-tasselled helmet, red armour over black, a spear
npc('guard', 0x16, '''
..............k.
.......cc....kSk
......kcck...kSk
.....kkkkkk..kSk
....kcccccck..k.
...kccccccccc.k.
...kkkkkkkkkk.k.
...kSSSSSSSSk.k.
..kSkkSSSSkkSkk.
..kSSkSSSSkSSkk.
..kSSSSSSSSSSkk.
...kSSSkkSSSk.k.
....kkSSSSkk..k.
..kkcckkkkcckkk.
.kccccckkccccSSk
.kcckcckkcckcSSk
.kSSkcckkcckkkk.
..kkkkkkkkkkk.k.
...kcccckcccc.k.
...kkkkkkkkkk.k.
...kkkkk.kkkk.k.
...kkkkk.kkkk.k.
...kkkkk..kkk.k.
.........kkkk.k.
''')

# merchant: fat, a round hat, a gold silk robe, hands in his sleeves
npc('merchant', 0x28, '''
................
......kkkk......
.....kkkkkk.....
...kkkkkkkkkk...
..kccccccccccck.
...kkkkkkkkkk...
..kSSSSSSSSSSk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
.kSSSSSSSSSSSSk.
.kSSSSkkkkSSSSk.
..kkSSSSSSSSkk..
.kkcckkSSkkcckk.
kccccccckccccccc
kcccccccckcccccc
kcccckkkkkkkcccc
kcccckSSSSSkcccc
kccccckkkkkccccc
.kcccccckcccccck
.kcccccckcccccck
..kccccckccccck.
..kkkkkkkkkkkkk.
....kkkk..kkkk..
................
''')

# innkeeper: a white headcloth, black clothes, a long white apron, a cloth over one shoulder
npc('innkeeper', 0x30, '''
................
................
.....kkkkkk.....
....kcccccck....
...kcccccccck...
...kkkkkkkkkk...
..kkSSSSSSSSkk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSkkkkSSk...
....kkSSSSkk....
..kkcckkkkkkkk..
.kccckkkkkkkkkk.
.kcckkkkkkkkkkk.
.kSSkcccccccSSk.
..kkkcccccccck..
...kkcccccccck..
...kkcccccccck..
...kkcccccccck..
...kkcccccccck..
...kkkkkkkkkkk..
...kkkkk..kkk...
.........kkkk...
''')

# monk: shaven head, saffron robe, prayer beads, hands together
npc('monk', 0x27, '''
................
................
.....kkkkkk.....
....kSSSSSSk....
...kSSSSSSSSk...
...kSSSSSSSSk...
..kSSSSSSSSSSk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSSkkSSSk...
....kkSSSSkk....
..kkcckkkkcckk..
.kccckSkkSkccck.
.kcckcSkkSckcck.
.kcckckSSkckcck.
.kcckckkkkckcck.
..kkkcccccccckk.
...kcccckcccck..
...kccccckccccck
..kcccccckccccck
..kkkkkkkkkkkkk.
....kkkk..kkkk..
................
''')

# lady disciple of the Cold River Pavilion: a high bun, white over pale blue, a slim sword at her back
npc('nun', 0x31, '''
......kkkk......
.....kkkkkk.....
......kkkk......
....kkkkkkkk.k..
...kkkkkkkkkkSk.
..kkkkkSSkkkkSk.
..kkkkSSSSkkkkk.
..kkkSSSSSSkkk..
..kkSkkSSkkSkk..
..kkSSSSSSSSkk..
..kkkSSSSSSkkk..
..kkkkSSSSkkkk..
..kkkkkSSkkkkk..
..kkkcccSccckk..
.kkkcccckcccckk.
.kkcckccckckcck.
.kkcckcccckkcck.
..kSSkcccccckSSk
..kkkcccccccckk.
...kccccckcccck.
...kcccckccccck.
..kcccckccccccck
..kkkkkkkkkkkkk.
....kkk...kk....
''')

# boatman: a wide straw hat, a straw cape, rolled-up trousers, bare shins
npc('boatman', 0x38, '''
................
.......kk.......
.....kkcckk.....
...kkcccccckk...
.kkcccccccccckk.
kccccccccccccccc
.kkkkkkkkkkkkkk.
...kSSSSSSSSk...
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSSkkSSSk...
..kkkkSSSSkkkk..
.kckckckckckckk.
kckckckckckckckk
kkckckckckckckck
.kSSkkkkkkkkSSk.
..kkkkkkkkkkkk..
...kkkkkkkkkk...
...kkkkk.kkkkk..
...kSSSk..kSSSk.
...kSSSk..kSSSk.
...kkkkk..kkkkk.
................
''')

# bandit: a Black Wind lackey, black head scarf, cloth over the face, grey clothes, a cudgel
npc('bandit', 0x00, '''
................
................
.....kkkkkkk....
....kkkkkkkkkk..
...kkkkkkkkkk.kk
...kkkkkkkkkk...
..kkSSSSSSSSkk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kcccccccccck..
..kcccccccccck..
...kcccccccck...
..kkkkkkkkkkkk..
.kccccckkcccccck
.kckcccckccccckk
.kckcccckcccckSk
.kSSkkkkkkkkkSSk
..kkkcccccccckSk
...kcccckcccckk.
...kcccckcccck..
...kkkkk.kkkkk..
...kkkkk.kkkkk..
...kkkkk..kkk...
.........kkkk...
''')

# cultist of the Netherworld Sect: a purple hood, a white ghost mask, a purple robe to the ground
npc('cultist', 0x04, '''
................
......kkkk......
.....kcccck.....
....kcccccck....
...kcccccccck...
...kcSSSSSSck...
..kccSkSSkScck..
..kccSkSSkScck..
..kccSSSSSSScck.
..kccSSkkSSScck.
..kcckSSSSkcck..
..kccckkkkccck..
..kcccccccccck..
.kccckcccckccck.
.kcckcccccckcck.
.kSSkccckcccckSk
..kkkccckccccck.
...kccccckcccck.
...kccccckcccck.
..kcccccckccccck
..kcccccckccccck
..kkkkkkkkkkkkk.
....kkk...kkk...
................
''', S=0x30)

# scholar: a black gauze cap, a long sky-blue robe, a folding fan in hand
npc('scholar', 0x21, '''
................
.....kkkkkk.....
.....kkkkkk.....
....kkkkkkkk....
...kkkkkkkkkk...
...kkkkkkkkkk...
..kkSSSSSSSSkk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSSkkSSSk...
....kkSSSSkk....
..kkcckSSkcckkk.
.kcccccckcccckSk
.kckccccckccckSk
.kckcccccckckSSk
.kSSkcccccckkkk.
..kkkccccccccck.
...kcccccckcccck
...kccccccckccck
..kcccccccckccck
..kkkkkkkkkkkkk.
....kkkk..kkkk..
................
''')

# blacksmith: a black head cloth, bare arms, a brown leather apron, a hammer
npc('blacksmith', 0x07, '''
................
................
.....kkkkkk.....
....kkkkkkkk....
...kkkkkkkkkk...
...kkkkkkkkkk.kk
..kkSSSSSSSSkkkk
..kSkkSSSSkkSkkk
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSkkkkSSk...
....kkSSSSkk..k.
..kkSSSSSSSSkkk.
.kSSSkSSSSkSSkk.
.kSSkcccccckSSk.
.kSSkcccccckSSk.
.kSSkcccccckSSk.
..kkkcccccckkk..
...kkcccccckk...
...kkcccccckk...
...kkcccccckk...
...kkkkkkkkkkk..
...kkkkk..kkk...
.........kkkk...
''')

# fisherman: a small conical hat, teal clothes, a rod over his shoulder and a fish on a line
npc('fisherman', 0x1C, '''
..............k.
.............k..
.......kk...k...
.....kkcckkk....
....kccccck.....
..kkkkkkkkkkk...
...kSSSSSSSk....
..kSkkSSSSkkk...
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSSSkkSSSk...
....kkSSSSkkk...
..kkcckSSkcckk..
.kccccckkcccccck
.kckcccckcccckck
.kckcccckcccckck
.kSSkkkkkkkkkSSk
..kkkcccccccckSk
...kcccckcccckSk
...kcccckcccck..
...kSSSk.kSSSk..
...kSSSk.kSSSk..
...kkkkk..kkkk..
................
''')

# musician girl: twin buns with ribbons, a pink dress with long sleeves, a pipa
npc('dancer', 0x24, '''
................
...kk......kk...
..kcck....kcck..
..kkkkkkkkkkkk..
...kkkkkkkkkk...
..kkkkkkkkkkkk..
..kkkSSSSSSkkk..
..kkSSSSSSSSkk..
..kkSkkSSkkSkk..
..kkSSSSSSSSkk..
...kSSSkkSSSk...
....kkSSSSkk....
...kkcckkcck....
..kcccckccckkk..
..kcckcckkSkkSk.
..kSSkckSSkkkkk.
..kkkcckkSkkk...
...kccccckkcck..
...kcccccckcck..
..kccccckcccccck
..kcccccckccccck
..kkkkkkkkkkkkk.
....kkk...kkk...
................
''')

# beggar: unkempt hair, patched rags, bare feet, a begging bowl
npc('beggar', 0x08, '''
................
................
....k.kkkk.k....
...kkkkkkkkkk...
..kkkkkkkkkkkk..
..kkkkkkkkkkkk..
..kkSSSSSSSSkk..
..kSkkSSSSkkSk..
..kSSkSSSSkSSk..
..kSSSSSSSSSSk..
...kSkkkkkkSk...
....kkSSSSkk....
..kkcckSSkcckk..
.kccckkkkkkkcck.
.kcckSSkcccckck.
.kcckSSkcccckck.
.kSSkkkkcccckSSk
..kkkSSSSSkkkkk.
...kkkkkkkcccck.
...kcccckkSSkck.
...kccckkSSSSkk.
...kcccckcccck..
...kSSSk.kSSSk..
...kkkkk.kkkkk..
''')

ORDER = ['man', 'woman', 'oldman', 'oldwoman', 'child', 'guard', 'merchant', 'innkeeper', 'monk', 'nun', 'boatman',
         'bandit', 'cultist', 'scholar', 'blacksmith', 'fisherman', 'dancer', 'beggar', 'hero_back', 'yishuo_back']
CAST = ['yirui', 'yishuo', 'xiaotian', 'baixian', 'liuhanyan', 'kuchan', 'heixiong', 'daoba', 'shouhou', 'tuqianqiu',
        'tiewusi', 'qianwanli', 'wenruyu', 'xiaolian', 'lihanshan', 'yuweng', 'guimian',
        'hubanxian', 'jiabafang', 'wudadan', 'wenduizhang', 'suxiaowan', 'chutiankuo', 'niubaobao', 'mojide', 'huotianxia', 'mowuya', 'aman']


def build():
    imgs = {cid: [sprite_image(f, P[cid][0]) for f in P[cid][1]] for cid in ORDER}
    per_row = 10
    cells = [(cid, i) for cid in ORDER for i in range(len(imgs[cid]))]
    W = per_row * 17 - 1
    H = ((len(cells) + per_row - 1) // per_row) * 25 - 1
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rects = {}
    for n, (cid, i) in enumerate(cells):
        x, y = (n % per_row) * 17, (n // per_row) * 25
        atlas.alpha_composite(imgs[cid][i], (x, y))
        r = {'x': x, 'y': y, 'w': 16, 'h': 24}
        if cid.endswith('_back'):
            rects.setdefault(cid, []).append(r)
        else:
            rects[cid] = r
    os.makedirs(OUT_DIR, exist_ok=True)
    atlas.save(os.path.join(OUT_DIR, 'npcs.png'))

    cast = {}
    for cid in CAST:
        src = os.path.join(GALLERY, cid, 'nes')
        shutil.copyfile(os.path.join(src, 'portrait.png'), os.path.join(OUT_DIR, cid + '_portrait.png'))
        shutil.copyfile(os.path.join(src, 'sheet.png'), os.path.join(OUT_DIR, cid + '_sheet.png'))
        meta = json.load(open(os.path.join(src, 'sheet.json'), encoding='utf-8'))
        an = meta['animations']
        cast[cid] = {'portrait': 'assets/people/%s_portrait.png' % cid, 'sheet': 'assets/people/%s_sheet.png' % cid,
                     'fw': meta['frameWidth'], 'fh': meta['frameHeight'],
                     'rows': {n: a['row'] for n, a in an.items()}, 'frames': max(a['frames'] for a in an.values())}

    def rect(r):
        return '{ x: %d, y: %d, w: %d, h: %d }' % (r['x'], r['y'], r['w'], r['h'])
    lines = ['// generated by tools/people.py - rects into assets/people/npcs.png (1x pixels), and the named cast',
             '// (portrait 48x56 and a sheet of 16x24 frames per character, copied from the Character Gallery)',
             'export const PEOPLE_IMAGE = \'assets/people/npcs.png\';', 'export const PEOPLE = {']
    for cid in ORDER:
        r = rects[cid]
        lines.append('  %s: %s,' % (cid, '[' + ', '.join(rect(q) for q in r) + ']' if isinstance(r, list) else rect(r)))
    lines.append('};')
    lines.append('export const CAST = {')
    for cid in CAST:
        c = cast[cid]
        rows = ', '.join('%s: %d' % (n, v) for n, v in c['rows'].items())
        lines.append("  %s: { portrait: '%s', sheet: '%s', fw: %d, fh: %d, rows: { %s }, frames: %d }," %
                     (cid, c['portrait'], c['sheet'], c['fw'], c['fh'], rows, c['frames']))
    lines.append('};')
    with open(os.path.join(ROOT, 'js', 'people_art.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')
    return imgs


def sheet(imgs, path, k=4):
    """A contact sheet: every frame at k x on a mid grey board, labelled with its id."""
    cells = [('%s%s' % (cid, '' if len(fr) == 1 else ' %d' % (i + 1)), im) for cid, fr in imgs.items()
             for i, im in enumerate(fr)]
    cols = 8
    cw, ch = 16 * k + 28, 24 * k + 22
    rows = (len(cells) + cols - 1) // cols
    S = Image.new('RGBA', (cols * cw + 8, rows * ch + 8), (110, 118, 112, 255))
    d = ImageDraw.Draw(S)
    for n, (label, im) in enumerate(cells):
        x, y = 8 + (n % cols) * cw, 8 + (n // cols) * ch
        d.text((x, y), label, fill=(255, 255, 240, 255))
        S.alpha_composite(im.resize((16 * k, 24 * k), 0), (x, y + 14))
    S.save(path)


if __name__ == '__main__':
    imgs = build()
    if '--sheet' in sys.argv:
        sheet(imgs, sys.argv[sys.argv.index('--sheet') + 1])
    print('people: %d sprites, cast %d' % (len(ORDER), len(CAST)))
