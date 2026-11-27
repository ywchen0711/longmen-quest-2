"""Paints 奕叡's paper doll in the AI style: a plain base (front, side, back and a bust), then one layer per kind of
gear, inpainted onto the base in neutral colours so the game can tint each item.

    C:/sdenv/Scripts/python tools/ai_doll.py base [seed]      art/doll/base_<view>.png
    C:/sdenv/Scripts/python tools/ai_doll.py layers           art/doll/<layer>_<view>.png
"""
import os, sys
sys.path.insert(0, 'C:/LongmenTactics/tools')
import ai_art

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art', 'doll')
WHO = '1boy, teenage boy, black hair, short spiky hair, blue hanfu robe, sash, black trousers, black cloth shoes, empty hands, arms at sides, ancient china'
VIEWS = {
    'front': 'chibi, full body, front view, standing, green background, simple background',
    'side': 'chibi, full body, from side, profile, standing, green background, simple background',
    'back': 'chibi, full body, from behind, facing away, standing, green background, simple background',
    'bust': 'portrait, upper body, close-up, looking at viewer, green background, simple background',
}
NEG = 'weapon, sword, holding, hat, headband, hair ornament, armor, cape, shadow, '
CHIBI_WHO = '1boy, teenage boy, black hair, short spiky hair, blue hanfu robe, sash, black trousers, black cloth shoes, empty hands'


def base(seed, views=None):
    """The map views use the very prompt shape of the gallery's chibis (C:\LongmenTactics\tools\ai_chibi.py), so he
    has their proportions (big head, short body) and stands the same size beside his companions."""
    import ai_chibi
    from ai_tags import FACES
    P = ai_art.pipe(False)
    os.makedirs(OUT, exist_ok=True)
    for v, lead in VIEWS.items():
        if views and v not in views:
            continue
        if v != 'bust':
            face = '' if v == 'back' else ', ' + FACES['yirui'].lstrip('!')
            pr = f'chibi, full body, {ai_chibi.VIEWS[v]}, green background, simple background, {CHIBI_WHO}{face}, solo, masterpiece'
            neg = NEG + ('looking at viewer, face, eyes, ' if v == 'back' else '')
            ai_art.paint(P, pr, 832, 1216, seed, False, neg).save(os.path.join(OUT, f'base_{v}_{seed}.png'))
            print(v, flush=True)
            continue
        neg = NEG + ('looking at viewer, face, ' if v == 'back' else '')
        w, h = (896, 1152) if v == 'bust' else (832, 1216)
        ai_art.paint(P, f'{lead}, {WHO}, solo, masterpiece', w, h, seed, False, neg).save(os.path.join(OUT, f'base_{v}_{seed}.png'))
        print(v, flush=True)




# ---------------------------------------------------------------- layers
import numpy as np
from PIL import Image, ImageFilter
import ai_cut as C

PICK = {'front': 21, 'side': 21, 'back': 21, 'bust': 41}


def figure(img):
    """The figure's mask (full size) and its bounding box."""
    a = np.asarray(img.convert('RGB').resize((img.width // 4, img.height // 4), Image.BOX)).astype(np.int16)
    bg = C.flood_bg(a, 40)
    m = Image.fromarray((~bg * 255).astype(np.uint8)).resize(img.size, Image.NEAREST)
    return m, m.getbbox()


def region(box, frac, size, feather=12):
    """A repaint mask: rectangles given as fractions of the figure's box (they may reach outside it)."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    m = Image.new('L', size, 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(m)
    for fx0, fy0, fx1, fy1 in frac:
        d.rounded_rectangle((x0 + fx0 * w, y0 + fy0 * h, x0 + fx1 * w, y0 + fy1 * h), radius=24, fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))


_INP = None


def inpainter():
    global _INP
    if _INP is None:
        from diffusers import StableDiffusionXLInpaintPipeline
        P = ai_art.pipe(False)
        _INP = StableDiffusionXLInpaintPipeline(**P.components)
        _INP.enable_model_cpu_offload()
    return _INP


def inpaint(view, prompt, frac, seed=11, neg=''):
    import torch
    src = Image.open(os.path.join(OUT, f'base_{view}_{PICK[view]}.png')).convert('RGB')
    fig, box = figure(src)
    mask = region(box, frac, src.size)
    lead = VIEWS[view]
    g = torch.Generator('cuda').manual_seed(seed)
    out = inpainter()(prompt=f'{lead}, 1boy, {prompt}, solo, masterpiece', negative_prompt=neg + 'shadow, ' + ai_art.NEG,
                      image=src, mask_image=mask, width=src.width, height=src.height, strength=0.99,
                      num_inference_steps=30, guidance_scale=6, generator=g).images[0]
    return src, out, mask


# Each layer: the prompt (gear in neutral greys and whites, so the game can tint it) and, per view, the rectangles to
# repaint as fractions of the figure's box. Head pieces stop above the eyes; weapons sit in his right hand (the
# viewer's left) or across his back.
# (fractions for the chibi base: the head takes the top ~45%, the body to ~88%, the feet below)
HEAD_F = {'front': [(0.1, 0.04, 0.9, 0.24)], 'side': [(0.05, 0.04, 1.0, 0.24)], 'back': [(0.0, 0.04, 1.0, 0.3)], 'bust': [(0.12, -0.04, 0.88, 0.26)]}
HAT_F = {'front': [(-0.22, -0.28, 1.22, 0.2)], 'side': [(-0.2, -0.28, 1.2, 0.2)], 'back': [(-0.22, -0.28, 1.22, 0.32)], 'bust': [(-0.05, -0.2, 1.05, 0.2)]}
BODY_F = {'front': [(0.04, 0.46, 0.96, 0.88)], 'side': [(0.1, 0.46, 0.95, 0.88)], 'back': [(0.04, 0.44, 0.96, 0.88)], 'bust': [(0.0, 0.55, 1.0, 1.0)]}
HAND_W = {'front': [(-0.5, 0.36, 0.36, 1.0)], 'side': [(-0.5, 0.36, 0.6, 1.0)], 'back': [(-0.05, 0.3, 1.05, 0.95)]}
TALL_W = {'front': [(-0.5, -0.35, 0.36, 1.0)], 'side': [(-0.5, -0.35, 0.6, 1.0)], 'back': [(-0.05, -0.3, 1.05, 0.95)]}
LAYERS = {
    'hd_band': ('blue headband tied around forehead', HEAD_F),
    'hd_brow': ('white metal forehead guard, brow plate on forehead', HEAD_F),
    'hd_hat': ('white conical straw hat, wide brim', HAT_F),
    'hd_veil': ('white conical hat with long dark veil hanging from the brim', {**HAT_F, 'front': [(-0.22, -0.28, 1.22, 0.55)], 'side': [(-0.2, -0.28, 1.2, 0.55)], 'bust': [(-0.05, -0.2, 1.05, 0.7)]}),
    'hd_helm': ('round white iron helmet', {k: [(-0.05, -0.15, 1.05, 0.22)] if k != 'back' else [(-0.05, -0.15, 1.05, 0.34)] for k in HEAD_F}),
    'hd_crown': ('small white crown on top of head, topknot', {k: [(0.25, -0.2, 0.75, 0.1)] for k in HEAD_F}),
    'a_trim': ('white leather armor vest with trim over robe', BODY_F),
    'a_chain': ('white chainmail armor over robe', BODY_F),
    'a_scale': ('white scale armor, lamellar armor over robe', BODY_F),
    'ck': ('long white cape, cloak over shoulders', {'front': [(-0.14, 0.42, 0.2, 0.97), (0.8, 0.42, 1.14, 0.97), (0.1, 0.42, 0.9, 0.54)],
            'side': [(0.4, 0.42, 1.25, 0.97)], 'back': [(-0.12, 0.42, 1.12, 0.97)], 'bust': [(-0.05, 0.5, 1.05, 1.0)]}),
    'c_bracer': ('white leather bracers on forearms', {'front': [(-0.06, 0.56, 0.26, 0.78), (0.74, 0.56, 1.06, 0.78)], 'side': [(0.2, 0.56, 0.8, 0.78)],
                 'back': [(-0.06, 0.56, 0.26, 0.78), (0.74, 0.56, 1.06, 0.78)]}),
    'c_mirror': ('round white metal chest plate, protective mirror on chest', {'front': [(0.28, 0.47, 0.72, 0.68)], 'side': [(0.2, 0.47, 0.7, 0.68)]}),
    'bt_boots': ('white leather boots', {k: [(0.02, 0.86, 0.98, 1.03)] for k in ('front', 'side', 'back')}),
    'bt_greaves': ('white metal greaves, shin guards over boots', {k: [(0.02, 0.8, 0.98, 1.03)] for k in ('front', 'side', 'back')}),
    'pd_jade': ('white jade pendant necklace', {'front': [(0.36, 0.45, 0.64, 0.62)], 'side': [(0.2, 0.45, 0.6, 0.62)], 'bust': [(0.35, 0.6, 0.65, 0.95)]}),
    'pd_charm': ('small white charm amulet necklace', {'front': [(0.36, 0.45, 0.64, 0.62)], 'side': [(0.2, 0.45, 0.6, 0.62)], 'bust': [(0.35, 0.6, 0.65, 0.95)]}),
    'pd_beads': ('white prayer beads necklace', {'front': [(0.2, 0.43, 0.8, 0.62)], 'side': [(0.15, 0.43, 0.7, 0.62)], 'bust': [(0.2, 0.55, 0.8, 0.95)]}),
    'w_dao': ('holding white steel dao, chinese saber with ring pommel', {**HAND_W, 'back': [(-0.05, 0.12, 1.05, 0.92)]}),
    'w_sword': ('holding white steel sword, jian', HAND_W),
    'w_spear': ('holding long spear, white steel spearhead, red tassel', TALL_W),
    'w_bigdao': ('holding large white guandao, long-handled big saber', TALL_W),
    'w_staff': ('holding long white staff, quarterstaff with metal caps', TALL_W),
    'w_fan': ('holding white folding fan', {'front': [(-0.32, 0.45, 0.32, 0.82)], 'side': [(-0.3, 0.45, 0.45, 0.82)], 'back': []}),
}
BACKWEAR = {'w_dao': 'white steel dao sheathed on his back, scabbard across back', 'w_sword': 'white steel sword sheathed on his back, scabbard across back',
            'w_spear': 'long spear slung across his back', 'w_bigdao': 'large guandao slung across his back', 'w_staff': 'long white staff slung across his back'}


def layers():
    os.makedirs(OUT, exist_ok=True)
    for name, (prompt, views) in LAYERS.items():
        for view, frac in views.items():
            dst = os.path.join(OUT, f'{name}_{view}.png')
            if not frac or os.path.exists(dst):
                continue
            pr = BACKWEAR.get(name, prompt) if view == 'back' else prompt
            neg = ('looking at viewer, face, ' if view == 'back' else '') + ('hat, ' if not name.startswith('hd') else '')
            _, out, _ = inpaint(view, pr, frac, neg=neg)
            out.save(dst)
            print(name, view, flush=True)


if __name__ == '__main__':
    if sys.argv[1] == 'base':
        for s in sys.argv[2:] or ['11']:
            base(int(s), ['front', 'side', 'back'])
    elif sys.argv[1] == 'layers':
        layers()


# ---------------------------------------------------------------- pack for the game
def _fg(img):
    a = np.asarray(img.convert('RGB').resize((img.width // 4, img.height // 4), Image.BOX)).astype(np.int16)
    # the green ground (a gradient on the bust): green-leaning pixels joined to the border
    key = (((a[:, :, 1] - a[:, :, 0]) > 10) | ((a.sum(axis=2) > 600) & (a[:, :, 1] >= a[:, :, 0]))) & ((a[:, :, 1] - a[:, :, 2]) > -18)
    found, label = C.figures(key)
    bg = np.zeros(key.shape, bool)
    for _, (x0, y0, x1, y1), n in found:
        if x0 == 0 or y0 == 0 or x1 == key.shape[1] or y1 == key.shape[0]:
            bg |= label == n
    bg |= C.flood_bg(a, 40)
    m = ~bg
    m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(1.5))) / 255.0


def _layer(view, name):
    """The gear alone: what the inpainting changed, inside its mask, that is not background."""
    src = Image.open(os.path.join(OUT, f'base_{view}_{PICK[view]}.png')).convert('RGB')
    out = Image.open(os.path.join(OUT, f'{name}_{view}.png')).convert('RGB')
    _, box = figure(src)
    prompt, views = LAYERS[name]
    mask = np.asarray(region(box, views[view], src.size)) / 255.0
    diff = np.abs(np.asarray(out).astype(np.int16) - np.asarray(src).astype(np.int16)).sum(axis=2) > 45
    d = np.asarray(Image.fromarray((diff * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))) / 255.0
    alpha = mask * d * _fg(out)
    rgba = np.dstack([np.asarray(out), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def pack():
    import json
    dst = os.path.join(ROOT, 'assets', 'ai', 'doll')
    os.makedirs(dst, exist_ok=True)
    info = {'views': {}, 'layers': {}}
    for view in ('front', 'side', 'back', 'bust'):
        src = Image.open(os.path.join(OUT, f'base_{view}_{PICK[view]}.png')).convert('RGB')
        base_rgba = src.convert('RGBA'); base_rgba.putalpha(Image.fromarray((_fg(src) * 255).astype(np.uint8)))
        layers = {n: _layer(view, n) for n, (_, vs) in LAYERS.items() if vs.get(view) and os.path.exists(os.path.join(OUT, f'{n}_{view}.png'))}
        if view == 'bust':
            w = src.width * 6 // 7
            crop, size = ((src.width - w) // 2, 0, (src.width - w) // 2 + w, src.width * 7 // 6), (240, 280)
        else:
            _, fb = figure(src)
            box = list(fb)
            for im in layers.values():
                b = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
                if b:
                    box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
            s = 176 / (fb[3] - fb[1])
            crop, size = tuple(box), (round((box[2] - box[0]) * s), round((box[3] - box[1]) * s))
        def fit(im):
            im = im.crop(crop)
            col = im.convert('RGB').resize(size, Image.LANCZOS)
            if view != 'bust':
                col = col.filter(ImageFilter.UnsharpMask(1, 60, 2))
            out = col.convert('RGBA'); out.putalpha(im.getchannel('A').resize(size, Image.LANCZOS))
            return out
        if view == 'side':   # painted looking left (eye and nose on the left); the map's side views face right
            fit0 = fit
            fit = lambda im: fit0(im).transpose(Image.FLIP_LEFT_RIGHT)
        fit(base_rgba).save(os.path.join(dst, f'{view}_base.webp'), quality=92, method=6)
        for n, im in layers.items():
            fit(im).save(os.path.join(dst, f'{n}_{view}.webp'), quality=92, method=6)
            info['layers'].setdefault(n, []).append(view)
        info['views'][view] = list(size)
        print(view, size, len(layers), flush=True)
    with open(os.path.join(ROOT, 'js', 'doll_ai_data.js'), 'w', encoding='utf-8') as f:
        f.write('// Made by tools/ai_doll.py pack: the painted paper doll in assets/ai/doll/. Do not edit by hand.\n')
        f.write(f'export const DOLL = {json.dumps(info, separators=(",", ":"))};\n')


if __name__ == '__main__' and sys.argv[1] == 'pack':
    pack()
