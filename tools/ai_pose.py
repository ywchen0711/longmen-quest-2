"""Paints battle poses for the party (seen from behind) and the bosses (from the front): a strike and a flinch, in
the same style and seed as their map cards (C:\\LongmenTactics\\tools\\ai_chibi.py).

    C:/sdenv/Scripts/python tools/ai_pose.py [paint|cut|both]
        art/pose/<id>_<pose>.png          the paintings
        assets/ai/pose/<id>_<pose>.webp   cut like the map cards, 160 x 180
        js/ai_pose.js                     AI_POSE: the ids that have both poses
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, 'C:/LongmenTactics/tools')
import ai_art, ai_chibi  # noqa: E402

ai_chibi.H, ai_chibi.MAXW = 176, 156
RAW = os.path.join(ROOT, 'art', 'pose')
OUT = os.path.join(ROOT, 'assets', 'ai', 'pose')
PARTY = ['yishuo', 'wudadan', 'wenduizhang', 'suxiaowan', 'chutiankuo']
BOSSES = ['tiger', 'chutiankuo', 'acolyte', 'jiangshi', 'jiao', 'toad', 'bellguard', 'crow', 'mojide', 'lion', 'greatbell',
          'mowuya', 'ape', 'fox']
# poses that came out wrong (the bell turned into a figure; her flinch faces the camera): animated by code instead
REJECT = {'greatbell', 'suxiaowan'}
POSES = {
    'back': {'atk': 'from behind, facing away, attacking, swinging, dynamic pose, action', 'hurt': 'from behind, facing away, flinching, knocked back, staggering'},
    'front': {'atk': 'front view, attacking, lunging at viewer, dynamic pose, action', 'hurt': 'front view, hurt, flinching, recoiling, pained'},
}


def jobs():
    out = [(c, 'back', p) for c in PARTY for p in ('atk', 'hurt')]
    out += [(c, 'front', p) for c in BOSSES for p in ('atk', 'hurt')]
    return out


def prompt(cid, view, pose):
    base, neg = ai_chibi.prompt(cid, 'back' if view == 'back' else 'front')
    lead = ai_chibi.VIEWS['back' if view == 'back' else 'front']
    if ai_chibi.TAGS[cid].startswith('no humans'):
        lead = 'from behind' if view == 'back' else 'front view'
    return base.replace(lead, POSES[view][pose], 1), neg


def paint():
    os.makedirs(RAW, exist_ok=True)
    todo = [j for j in jobs() if not os.path.exists(os.path.join(RAW, f'{j[0]}_{j[2]}.png'))]
    if not todo:
        return
    P = ai_art.pipe(False)
    for i, (c, view, pose) in enumerate(todo):
        pr, neg = prompt(c, view, pose)
        ai_art.paint(P, pr, 832, 1216, 11, False, neg).save(os.path.join(RAW, f'{c}_{pose}.png'))
        print(f'pose {i + 1}/{len(todo)} {c} {pose}', flush=True)


def cut():
    os.makedirs(OUT, exist_ok=True)
    have = []
    for c, view, pose in jobs():
        src = os.path.join(RAW, f'{c}_{pose}.png')
        if not os.path.exists(src):
            continue
        im = ai_chibi.cut(Image.open(src))
        if not im:
            continue
        cell = Image.new('RGBA', (160, 180))
        cell.alpha_composite(im, ((160 - im.width) // 2, 179 - im.height))
        cell.save(os.path.join(OUT, f'{c}_{pose}.webp'), quality=90, method=6)
        have.append(f'{c}_{pose}')
    ids = sorted({h.rsplit('_', 1)[0] for h in have if f"{h.rsplit('_', 1)[0]}_atk" in have and f"{h.rsplit('_', 1)[0]}_hurt" in have} - REJECT)
    with open(os.path.join(ROOT, 'js', 'ai_pose.js'), 'w', encoding='utf-8') as f:
        f.write('// Made by tools/ai_pose.py: the characters with painted battle poses in assets/ai/pose/. Do not edit by hand.\n')
        f.write(f'export const AI_POSE = new Set({json.dumps(ids)});\n')
    print(len(ids), 'with poses')


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'both'
    if what in ('paint', 'both'):
        paint()
    if what in ('cut', 'both'):
        cut()
