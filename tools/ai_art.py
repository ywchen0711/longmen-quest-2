"""Brings in the AI-painted art made for Longmen Tactics (C:\\LongmenTactics, tools/ai_art.py and tools/ai_chibi.py).

    C:/sdenv/Scripts/python tools/ai_art.py

    assets/ai/por/<id>.webp    the portrait, 240 x 280 (the 6:7 frame the windows use)
    assets/ai/map/<id>.webp    the map card: front, side and back side by side, 160 x 180 each (twice the size
                               Tactics uses, since the pop-up book shows its cards large)
    js/ai_art.js               AI_POR and AI_MAP: the ids that have them

Ids are the Character Gallery's: the named cast as they are, townsfolk as tf_<kind>, foes without their e_ or bx_.
Characters not painted yet are simply left out and keep their pixel art.
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAC = 'C:/LongmenTactics'
sys.path.insert(0, os.path.join(TAC, 'tools'))
import ai_chibi  # noqa: E402

ai_chibi.H, ai_chibi.MAXW = 176, 156
CW, CH = 160, 180


def sizes():
    """{ gallery id: { m, b, a } } measured from the pixel art the paintings replace."""
    import subprocess
    import numpy as np
    js = ("Promise.all([import('./js/data.js'), import('./js/people_art.js'), import('./js/enemy_art.js')]).then(([D, P, E]) => {"
          " const foes = {}; for (const k of Object.keys(D.ENEMIES)) foes[k] = { art: D.ART_OF(k), por: D.ENEMIES[k].por || null };"
          " console.log(JSON.stringify({ cast: P.CAST, people: P.PEOPLE, img: P.PEOPLE_IMAGE, art: E.ENEMY_ART, foes })); });")
    d = json.loads(subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, encoding='utf-8').stdout)
    imgs = {}

    def tall(path, x, y, w, h):
        if path not in imgs:
            imgs[path] = np.asarray(Image.open(os.path.join(ROOT, path.split('?')[0])).convert('RGBA'))[:, :, 3] > 0
        rows = np.where(imgs[path][y:y + h, x:x + w].any(axis=1))[0]
        return int(rows[-1] - rows[0] + 1) if len(rows) else h

    out = {}
    for k, c in d['cast'].items():
        fh, r = c['fh'], c['rows']
        back = d['people'].get(k + '_back')
        a = tall(d['img'], back[0]['x'], back[0]['y'], back[0]['w'], back[0]['h']) if back else \
            tall(c['sheet'], 0, r.get('walk_up', r.get('walk', 1)) * fh, c['fw'], fh)
        out[k] = {'m': round(tall(c['sheet'], 0, r.get('walk', 1) * fh, c['fw'], fh) / 16, 3), 'a': a, 'b': 56}
    for k, f in d['people'].items():
        if isinstance(f, dict):
            out.setdefault('tf_' + k, {'m': round(tall(d['img'], f['x'], f['y'], f['w'], f['h']) / 16, 3), 'a': 24, 'b': 56})
    for k, f in d['foes'].items():
        A = d['art'].get(f['art'])
        if not A:
            continue
        gid = f['por'] or (f['art'].split('_', 1)[1] if f['art'].startswith(('e_', 'bx_')) else f['art'])
        big = 1.5 if k.startswith(('bx_', 'b_', 'g_')) else 1   # the map draws the big beasts half again as large
        hf = tall('assets/enemies.png', *A['f']) if A.get('f') else A['h']
        o = out.setdefault(gid, {})
        o.setdefault('m', round(hf * big / 16, 3))
        o.setdefault('a', hf)
        if not f['por']:
            o['b'] = tall('assets/enemies.png', A['x'], A['y'], A['w'], A['h'])
    return out


def main():
    os.makedirs(os.path.join(ROOT, 'assets', 'ai', 'por'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets', 'ai', 'map'), exist_ok=True)
    cut = os.path.join(TAC, 'art', 'cut')
    por = []
    for f in sorted(os.listdir(cut)):
        if f.endswith('_portrait.webp'):
            k = f[:-len('_portrait.webp')]
            im = Image.open(os.path.join(cut, f)).convert('RGBA')
            w = round(im.height * 6 / 7)
            im = im.crop(((im.width - w) // 2, 0, (im.width - w) // 2 + w, im.height)).resize((240, 280), Image.LANCZOS)
            bg = Image.new('RGBA', im.size, (243, 232, 207, 255))
            bg.alpha_composite(im)
            bg.convert('RGB').save(os.path.join(ROOT, 'assets', 'ai', 'por', k + '.webp'), quality=88)
            por.append(k)
    raw = os.path.join(TAC, 'art', 'chibi')
    done = []
    for f in sorted(os.listdir(raw)):
        if not f.endswith('_back.png'):
            continue
        k = f[:-len('_back.png')]
        dst = os.path.join(ROOT, 'assets', 'ai', 'map', k + '.webp')
        if os.path.exists(dst) and all(os.path.getmtime(dst) > os.path.getmtime(os.path.join(raw, f'{k}_{v}.png')) for v in ('front', 'side', 'back')):
            done.append(k)
            continue
        try:
            views = [ai_chibi.cut(Image.open(os.path.join(raw, f'{k}_{v}.png'))) for v in ('front', 'side', 'back')]
        except (OSError, ValueError):  # still being painted
            continue
        if not all(views):
            continue
        if k not in ai_chibi.PAINTED_RIGHT:
            views[1] = views[1].transpose(Image.FLIP_LEFT_RIGHT)   # painted looking left; the map's side views face right
        strip = Image.new('RGBA', (CW * 3, CH))
        for i, im in enumerate(views):
            strip.alpha_composite(im, (i * CW + (CW - im.width) // 2, CH - 1 - im.height))
        strip.save(dst, quality=90, method=6)
        done.append(k)
    size = sizes()
    with open(os.path.join(ROOT, 'js', 'ai_art.js'), 'w', encoding='utf-8') as fh:
        fh.write('// Made by tools/ai_art.py: the characters with AI-painted art in assets/ai/. Do not edit by hand.\n')
        fh.write(f'export const AI_POR = new Set({json.dumps(por)});\n')
        fh.write(f'export const AI_MAP = new Set({json.dumps(done)});\n')
        fh.write('// how tall each one stood in the pixel art, so the paintings keep the sizes of the original design (a child\n')
        fh.write('// smaller than a man, a bat smaller than a tiger): m = the map figure in tiles; b = the battle picture and\n')
        fh.write('// a = seen from behind in the party row, in art pixels\n')
        fh.write(f'export const AI_SIZE = {json.dumps(size, separators=(",", ":"))};\n')
    print(len(por), 'portraits,', len(done), 'map cards')


if __name__ == '__main__':
    main()
