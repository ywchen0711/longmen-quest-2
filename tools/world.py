"""Builds the overworld of 龍門刀客傳 貳 · 萬妖鈴 as text rows (js/world_map.js).

    python -P tools/world.py [--png PATH]

The jianghu of the sequel: the west (Longmen, chapter 1), the canal lands across the Broken Bridge (chapter 2), the
southern isles, bamboo jungle and volcano reached by ship (chapter 3) and the snowy north behind the harbour chain of
Beiyan Pass (chapter 4). The world is painted from simple shapes in a fixed order, so it is the same every time.
Legend (one character per 16x16 tile):
  ~ sea / river (blocked on foot; the ship sails it)   . grass   f forest   h hills   M mountain (blocked)
  s sand   w swamp   n snow   N snow peak (blocked)   b bamboo   V volcano peak (blocked)   = road
  X the Broken Bridge (open once mended)   H the harbour chain of Beiyan Pass (water; open once lowered)
  K the ice wall before the Tower of Ten Thousand Beasts (open once the ice soul is taken)
Places (towns, caves, towers) stand on top of these and are listed in js/maps.js (PLACES).
Also writes ZONE: one character per tile for which foes live there (js/data.js ZONES).
"""
import os
import random
import sys
from collections import deque

W, H = 128, 96
g = [['~'] * W for _ in range(H)]


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def ell(cx, cy, rx, ry, c, rough=0.0, seed=1, only=None):
    r = random.Random(seed)
    for y in range(int(cy - ry - 2), int(cy + ry + 3)):
        for x in range(int(cx - rx - 2), int(cx + rx + 3)):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1 + (r.random() - 0.5) * rough:
                if 0 <= x < W and 0 <= y < H and (only is None or g[y][x] in only):
                    g[y][x] = c


def rect(x0, y0, x1, y1, c, only=None):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H and (only is None or g[y][x] in only):
                g[y][x] = c


def stroke(pts, c, w=1, only=None):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(n + 1):
            x = round(x0 + (x1 - x0) * i / n)
            y = round(y0 + (y1 - y0) * i / n)
            for dy in range(w):
                for dx in range(w):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H and (only is None or g[yy][xx] in only):
                        g[yy][xx] = c


def scatter(x0, y0, x1, y1, c, p, seed, only='.'):
    r = random.Random(seed)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H and g[y][x] in only and r.random() < p:
                g[y][x] = c


def smooth(times=2):
    for _ in range(times):
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                n = sum(g[y + dy][x + dx] != '~' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if g[y][x] != '~' and n <= 1:
                    g[y][x] = '~'
                elif g[y][x] == '~' and n >= 3:
                    g[y][x] = '.'


# ---------------------------------------------------------------- land
ell(26, 46, 22, 19, '.', rough=0.25, seed=3)        # the west: Longmen's country
ell(12, 40, 7, 9, '.', rough=0.3, seed=4)
ell(70, 46, 21, 15, '.', rough=0.25, seed=5)        # the canal lands
ell(84, 52, 9, 7, '.', rough=0.3, seed=6)
ell(46, 84, 32, 8, '.', rough=0.2, seed=7)          # the south: jungle and volcano
ell(18, 84, 9, 7, '.', rough=0.3, seed=8)
ell(101, 75, 7, 5, '.', rough=0.2, seed=9)          # 漁火島 the Fishing-fire Isle
ell(80, 14, 34, 10, '.', rough=0.2, seed=10)        # the north
ell(110, 10, 9, 7, '.', rough=0.2, seed=11)
smooth(3)
rect(0, 0, W - 1, 1, '~'); rect(0, H - 2, W - 1, H - 1, '~'); rect(0, 0, 1, H - 1, '~'); rect(W - 2, 0, W - 1, H - 1, '~')
rect(0, 66, W - 1, 73, '~')                          # the strait between the middle lands and the south
rect(0, 26, W - 1, 30, '~')                          # the northern channel
rect(48, 24, 52, 70, '~')                            # the river between west and east, coast to coast

# ---------------------------------------------------------------- the west (chapter 1)
ell(12, 32, 7, 5, 'h', rough=0.4, seed=21, only='.')            # Wolf Slope hills
ell(8, 28, 4, 3, 'M', rough=0.4, seed=22, only='.h')
ell(42, 40, 5, 6, 'M', rough=0.3, seed=23, only='.')            # Bell Temple mountain
ell(42, 41, 2, 2, 'h', seed=24, only='M')
stroke([(40, 47), (41, 44), (42, 41)], 'h', 1, only='M')       # the temple path
ell(30, 30, 5, 3, 'f', rough=0.4, seed=25, only='.')
ell(14, 52, 6, 5, 'f', rough=0.4, seed=26, only='.')
ell(30, 60, 6, 3, 'h', rough=0.4, seed=27, only='.')
scatter(6, 28, 46, 64, 'f', 0.05, 28)
scatter(6, 28, 46, 64, 'h', 0.03, 29)
# ---------------------------------------------------------------- the canal lands (chapter 2): lakes and willow marsh
ell(76, 38, 5, 3, 'w', rough=0.4, seed=31, only='.')
ell(62, 59, 5, 3, '~', rough=0.3, seed=32)                      # Green Wave Lake
ell(72, 53, 3, 2, '~', rough=0.3, seed=33)
stroke([(66, 34), (66, 42)], '~', 1)                             # a canal north of the city
ell(58, 40, 4, 3, 'f', rough=0.4, seed=34, only='.')
ell(86, 44, 4, 3, 'h', rough=0.4, seed=35, only='.')
scatter(54, 32, 92, 62, 'f', 0.04, 36)
# ---------------------------------------------------------------- the south (chapter 3)
ell(40, 82, 12, 5, 'b', rough=0.4, seed=41, only='.')           # bamboo jungle
ell(32, 80, 4, 3, 'b', seed=42, only='.b')
ell(20, 86, 7, 5, 'w', rough=0.4, seed=43, only='.b')           # Poison Dragon Marsh
ell(72, 85, 6, 4, 'V', rough=0.4, seed=44, only='.')            # the volcano
ell(72, 87, 2, 1.5, 's', seed=45, only='V')
stroke([(64, 87), (71, 87)], 's', 1, only='V.')
ell(62, 80, 4, 2, 's', rough=0.4, seed=46, only='.')
ell(101, 75, 3, 2, 'f', rough=0.4, seed=47, only='.')
# ---------------------------------------------------------------- the north (chapter 4): snow behind a wall of peaks
rect(40, 2, W - 3, 25, 'n', only='.fh')
ell(66, 10, 5, 3, 'N', rough=0.4, seed=51, only='n')
ell(84, 17, 4, 2, 'N', rough=0.4, seed=52, only='n')
for y in range(2, 26):                                         # every northern coast is cliff
    for x in range(2, W - 2):
        if g[y][x] == 'n' and any(g[y + dy][x + dx] == '~' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            g[y][x] = 'N'
# the harbour of Beiyan Pass: an inlet through the cliffs, closed by the chain
stroke([(72, 26), (72, 20)], '~', 1)
for y in range(20, 26):
    for x in (71, 73):
        if g[y][x] in 'nN~':
            g[y][x] = 'N'
put(72, 25, 'H')
# the ice wall: a ring of peaks round the tower, its one gap closed by ice
ell(111, 9, 6, 5, 'N', rough=0.0, seed=54, only='n.N')
ell(111, 9, 4, 3, 'n', seed=55, only='N')
for y in range(3, 16):
    for x in range(100, W - 2):
        if g[y][x] == '~':
            continue
        d = ((x - 111) / 6) ** 2 + ((y - 9) / 5) ** 2
        if 0.55 < d <= 1.35 and g[y][x] in 'n.':
            g[y][x] = 'N'
put(104, 9, 'K'); put(105, 9, 'n'); put(106, 9, 'n')

# ---------------------------------------------------------------- roads
ROADS = [
    [(22, 50), (26, 44), (30, 39)],          # 龍門 - 杏花
    [(30, 38), (35, 35)],                    # 杏花 - 山寨
    [(22, 50), (30, 53), (36, 55)],          # 龍門 - 落霞
    [(36, 55), (40, 50), (40, 47)],          # 落霞 - 鈴音寺 path
    [(36, 55), (44, 50), (47, 47)],          # 落霞 - the bridge
    [(53, 47), (60, 47), (66, 47)],          # the bridge - 蘇河
    [(66, 47), (74, 41), (77, 39)],          # 蘇河 - 蘇家
    [(66, 47), (62, 52), (61, 56)],          # 蘇河 - 碧波
    [(66, 48), (76, 50), (85, 53)],          # 蘇河 - 望月
    [(26, 44), (16, 37), (12, 35)],          # 杏花 road - 野狼坡
    [(44, 84), (54, 84), (62, 84)],          # 青竹 - 焰口
    [(44, 84), (36, 82), (33, 81)],          # 青竹 - 竹海
    [(72, 20), (64, 16), (56, 13)],          # 北雁 - 雪狼
    [(72, 20), (84, 13), (96, 10)],          # 北雁 - 冰魄
    [(96, 10), (103, 9)],                    # 冰魄 - the ice wall
]
for pts in ROADS:
    stroke(pts, '=', 1, only='.fhbsn')
for x in range(48, 53):
    put(x, 47, 'X')                          # the Broken Bridge
put(47, 47, '='); put(53, 47, '=')

# ---------------------------------------------------------------- places
PLACES = {
    'longmen': (22, 50), 'xinghua': (30, 38), 'camp': (36, 34), 'yelang': (12, 34), 'luoxia': (36, 55), 'lingyin': (42, 41),
    'suhe': (66, 47), 'sujia': (77, 38), 'bibo': (61, 56), 'wangyue': (85, 53),
    'yuhuo': (101, 75), 'qingzhu': (44, 84), 'zhulin': (33, 80), 'dulong': (20, 87), 'yankou': (62, 84), 'chiyan': (72, 87),
    'beiyan': (72, 19), 'xuelang': (56, 12), 'bingpo': (96, 9), 'wanyao': (111, 9),
}
for k, (x, y) in PLACES.items():
    snow = k in ('beiyan', 'xuelang', 'bingpo', 'wanyao')
    if g[y][x] in '~MNV':
        g[y][x] = 'n' if snow else '.'
    if g[y + 1][x] in 'MNV' and k not in ('beiyan',):
        g[y + 1][x] = 'n' if snow else '.'
g[18][72] = 'n'; g[18][71] = 'n'; g[18][73] = 'n'; g[19][71] = 'n'; g[19][73] = 'n'; g[20][72] = '~'
# the ship waits off the pier of Wangyue Ferry
SHIP = (87, 53)
for x in range(86, 98):
    g[53][x] = '~'

# ---------------------------------------------------------------- zones (which foes live where)
ZONE = [['0'] * W for _ in range(H)]


def region(x, y):
    if y <= 26:
        return 'north'
    if y >= 74:
        return 'south'
    if x >= 92 and y >= 66:
        return 'isle'
    return 'west' if x < 50 else 'east'


for y in range(H):
    for x in range(W):
        c = g[y][x]
        rg = region(x, y)
        if c in '~H':
            ZONE[y][x] = 'b' if y < 34 else 'a'
            continue
        if rg == 'west':
            d = ((x - 22) ** 2 + (y - 50) ** 2) ** 0.5
            z = '1' if d < 11 else '2' if (x < 22 or y < 37) else '3'
        elif rg == 'east':
            d = ((x - 66) ** 2 + (y - 47) ** 2) ** 0.5
            z = '4' if d < 12 else '5'
        elif rg == 'isle':
            z = '6'
        elif rg == 'south':
            z = '6' if x < 34 or x > 84 else '7'
        else:
            z = '9' if x > 100 else '8'
        ZONE[y][x] = z


# ---------------------------------------------------------------- reachability by stage
BLOCK = '~MNVXHK'


def walk(open_, ship=False):
    sx, sy = PLACES['longmen']
    seen = {(sx, sy)}
    q = deque([(sx, sy)])

    def ok(c):
        return c not in BLOCK or c in open_

    def flood():
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and ok(g[ny][nx]):
                    seen.add((nx, ny)); q.append((nx, ny))
    flood()
    if ship and PLACES['wangyue'] in seen:
        # sail from the ship over water (and the chain if open), landing on any shore
        water = {SHIP}; wq = deque([SHIP])
        while wq:
            x, y = wq.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H):
                    continue
                c = g[ny][nx]
                if (c == '~' or (c == 'H' and 'H' in open_)) and (nx, ny) not in water:
                    water.add((nx, ny)); wq.append((nx, ny))
                elif c not in BLOCK and (nx, ny) not in seen:
                    seen.add((nx, ny)); q.append((nx, ny))
        flood()
    return seen


STAGES = [('', False, ['longmen', 'xinghua', 'camp', 'yelang', 'luoxia', 'lingyin']),
          ('X', False, ['suhe', 'sujia', 'bibo', 'wangyue']),
          ('X', True, ['yuhuo', 'qingzhu', 'zhulin', 'dulong', 'yankou', 'chiyan']),
          ('XH', True, ['beiyan', 'xuelang', 'bingpo']),
          ('XHK', True, ['wanyao'])]
FAIL = []
prev = set()
for open_, ship, names in STAGES:
    r = walk(open_, ship)
    for n in names:
        if PLACES[n] not in r:
            FAIL.append(('cannot reach', n, 'with', open_, ship))
        if PLACES[n] in prev:
            FAIL.append(('reached too early', n, open_, ship))
    prev = r
print('reachability ok' if not FAIL else FAIL)

rows = [''.join(r) for r in g]
zrows = [''.join(r) for r in ZONE]
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'js', 'world_map.js')
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Generated by tools/world.py - do not edit by hand.\n')
    f.write('export const WORLD_W = %d, WORLD_H = %d;\n' % (W, H))
    f.write('export const WORLD = [\n')
    for r in rows:
        f.write("  '%s',\n" % r)
    f.write('];\n')
    f.write('// which foes live on each tile (js/data.js ZONES): 1-9 land, a / b the southern and northern seas\n')
    f.write('export const ZONE = [\n')
    for r in zrows:
        f.write("  '%s',\n" % r)
    f.write('];\n')
    f.write('export const PLACE_AT = {%s};\n' % ', '.join('%s: [%d, %d]' % (k, x, y) for k, (x, y) in PLACES.items()))
    f.write('export const SHIP_START = [%d, %d];\n' % SHIP)
if '--png' in sys.argv:
    from PIL import Image
    COL = {'~': (40, 80, 200), '.': (90, 180, 70), 'f': (30, 110, 40), 'h': (150, 160, 70), 'M': (120, 90, 60), 's': (220, 200, 130), 'w': (70, 90, 60),
           'n': (235, 240, 245), 'N': (160, 170, 190), 'b': (120, 200, 80), 'V': (170, 40, 30), '=': (200, 150, 90), 'X': (255, 0, 255), 'H': (255, 0, 0), 'K': (0, 255, 255)}
    im = Image.new('RGB', (W, H))
    for y in range(H):
        for x in range(W):
            im.putpixel((x, y), COL.get(g[y][x], (0, 0, 0)))
    for k, (x, y) in PLACES.items():
        im.putpixel((x, y), (255, 255, 0))
    im.putpixel(SHIP, (255, 128, 0))
    im = im.resize((W * 6, H * 6), Image.NEAREST)
    im.save(sys.argv[sys.argv.index('--png') + 1])

if FAIL:
    sys.exit(1)
