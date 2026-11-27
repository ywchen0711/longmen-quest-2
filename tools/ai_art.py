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
        if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(os.path.join(raw, f)):
            done.append(k)
            continue
        try:
            views = [ai_chibi.cut(Image.open(os.path.join(raw, f'{k}_{v}.png'))) for v in ('front', 'side', 'back')]
        except (OSError, ValueError):  # still being painted
            continue
        if not all(views):
            continue
        strip = Image.new('RGBA', (CW * 3, CH))
        for i, im in enumerate(views):
            strip.alpha_composite(im, (i * CW + (CW - im.width) // 2, CH - 1 - im.height))
        strip.save(dst, quality=90, method=6)
        done.append(k)
    with open(os.path.join(ROOT, 'js', 'ai_art.js'), 'w', encoding='utf-8') as fh:
        fh.write('// Made by tools/ai_art.py: the characters with AI-painted art in assets/ai/. Do not edit by hand.\n')
        fh.write(f'export const AI_POR = new Set({json.dumps(por)});\n')
        fh.write(f'export const AI_MAP = new Set({json.dumps(done)});\n')
    print(len(por), 'portraits,', len(done), 'map cards')


if __name__ == '__main__':
    main()
