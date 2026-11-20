"""8-bit Famicom / NES helpers for the `nes` style (三國志 霸王の大陸-like portraits).

Pictures are typed as rows of slot characters. A row may be written as 'N:content' to mean
N backdrop pixels followed by the content; every row is padded on the right with backdrop
to the picture width. Slots map to indexes of the standard 2C02 palette, so every colour
in the picture is a real NES colour.

Hardware rules that check() enforces on a portrait:
  * background layer: one shared backdrop colour ($0F black) plus, in every 16x16
    attribute area, at most 3 colours that all come from ONE of at most 4 sub-palettes;
  * sprite layer (small overlays such as a catchlight or lip colour, the way real games
    did it): 8x8 tiles, 3 colours per tile from at most 4 sprite sub-palettes, and no more
    than 8 sprite tiles on any scanline.
"""
from PIL import Image

# the common 2C02 palette table (as used by FCEUX and most NES dev references)
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
BACKDROP = 0x0F
BG_CHARS = '.k'          # both are the backdrop: '.' empty, 'k' a black line


def rgba(i):
    v = NES[i]
    return (v >> 16 & 255, v >> 8 & 255, v & 255, 255)


def parse(text, w, h=None, name='grid'):
    rows = []
    for ln in text.strip('\n').split('\n'):
        s = ln.strip()
        if not s:
            continue
        if s.startswith('|'):
            s = s[1:]
        if s.endswith('|'):          # a full row: must be exactly w wide
            s = s[:-1]
            if len(s) != w:
                raise ValueError('%s row %d is %d wide, want %d: %s' % (name, len(rows), len(s), w, s))
        elif ':' in s:
            n, s = s.split(':', 1)
            s = '.' * int(n) + s
        s = s.replace(' ', '.')
        if len(s) > w:
            raise ValueError('%s row %d is %d wide (max %d): %s' % (name, len(rows), len(s), w, s))
        rows.append(s.ljust(w, '.'))
    if h is not None:
        if len(rows) > h:
            raise ValueError('%s has %d rows (max %d)' % (name, len(rows), h))
        rows += ['.' * w] * (h - len(rows))
    return rows


def mirror(rows):
    """Mirror left halves: each row's left half is reflected onto its right half."""
    out = []
    for r in rows:
        w = len(r)
        left = r[:w // 2]
        out.append(left + left[::-1])
    return out


def overlay(base, top):
    """Lay rows over rows; '.' in top keeps the base pixel."""
    return [''.join(t if t != '.' else b for b, t in zip(br, tr)) for br, tr in zip(base, top)]


class Pic:
    """A picture: background rows + optional sprite rows, slot -> NES index maps,
    the background sub-palettes and sprite sub-palettes (tuples of 3 NES indexes)."""

    def __init__(self, bg, slots, palettes, sprite=None, sprite_slots=None, sprite_palettes=(), name='pic',
                 backdrop=BACKDROP, transparent=False):
        self.bg, self.slots, self.palettes = bg, dict(slots), [tuple(p) for p in palettes]
        self.w, self.h = len(bg[0]), len(bg)
        self.sprite = sprite or ['.' * self.w] * self.h
        self.sprite_slots = dict(sprite_slots or {})
        self.sprite_palettes = [tuple(p) for p in sprite_palettes]
        self.name, self.backdrop, self.transparent = name, backdrop, transparent
        for c in BG_CHARS:
            self.slots.setdefault(c, backdrop)

    def index(self, x, y):
        c = self.sprite[y][x]
        if c != '.':
            return self.sprite_slots[c]
        return self.slots[self.bg[y][x]]

    def check(self, strict=True):
        errs = []
        if len(self.palettes) > 4:
            errs.append('more than 4 background sub-palettes')
        if len(self.sprite_palettes) > 4:
            errs.append('more than 4 sprite sub-palettes')
        for p in self.palettes + self.sprite_palettes:
            if len(p) > 3:
                errs.append('sub-palette %r has more than 3 colours' % (p,))
        amap = {}
        for ay in range(0, self.h, 16):
            for ax in range(0, self.w, 16):
                cols = set()
                for y in range(ay, min(ay + 16, self.h)):
                    for x in range(ax, min(ax + 16, self.w)):
                        c = self.bg[y][x]
                        if c not in self.slots:
                            errs.append('%s: no colour for %r at %d,%d' % (self.name, c, x, y))
                            continue
                        i = self.slots[c]
                        if i != self.backdrop:
                            cols.add(i)
                fit = [k for k, p in enumerate(self.palettes) if cols <= set(p)]
                if not fit:
                    errs.append('%s: area %d,%d uses %s - no sub-palette has them all' %
                                (self.name, ax, ay, ' '.join('%02X' % i for i in sorted(cols))))
                amap[(ax, ay)] = fit[0] if fit else None
        lines = {}
        for ty in range(0, self.h, 8):
            for tx in range(0, self.w, 8):
                cols = set()
                for y in range(ty, min(ty + 8, self.h)):
                    for x in range(tx, min(tx + 8, self.w)):
                        c = self.sprite[y][x]
                        if c != '.':
                            cols.add(self.sprite_slots[c])
                if not cols:
                    continue
                for y in range(ty, ty + 8):
                    lines[y] = lines.get(y, 0) + 1
                if not any(cols <= set(p) for p in self.sprite_palettes):
                    errs.append('%s: sprite tile %d,%d uses %s - no sprite sub-palette has them' %
                                (self.name, tx, ty, ' '.join('%02X' % i for i in sorted(cols))))
        if lines and max(lines.values()) > 8:
            errs.append('%s: %d sprite tiles on one scanline (max 8)' % (self.name, max(lines.values())))
        self.areas = amap
        self.sprite_tiles = sum(lines.values()) // 8 if lines else 0
        if errs and strict:
            raise ValueError('\n'.join(errs))
        return errs

    def image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        P = im.load()
        for y in range(self.h):
            for x in range(self.w):
                if self.transparent and self.bg[y][x] == '.' and self.sprite[y][x] == '.':
                    continue
                P[x, y] = rgba(self.index(x, y))
        return im


def sprite_image(rows, slots):
    """A small NES sprite: '.' transparent, other chars -> NES index (at most 3 of them)."""
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
