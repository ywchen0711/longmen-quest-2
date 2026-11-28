"""Copies the Quaternius Universal models (CC0) into rig3d/models for the web: each glTF keeps only its base-colour
texture, shrunk to 1024 and shared between parts (the toon shading needs no normal or roughness maps), and its
binary buffer as it was.

    C:/sdenv/Scripts/python rig3d/tools/bake.py <folder the packs were unzipped into>
"""
import json, os, shutil, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
BASE = f'{SRC}/base/Universal Base Characters[Standard]'
FITS = f'{SRC}/modular-character-outfits-fantasy/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Modular Parts'
JOBS = [(f'{BASE}/Base Characters/Godot - UE/{n}.gltf', 'body') for n in ('Superhero_Male_FullBody', 'Superhero_Female_FullBody')]
JOBS += [(f'{BASE}/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/{f}', 'hair') for f in os.listdir(f'{BASE}/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)') if f.endswith('.gltf')]
JOBS += [(f'{FITS}/{f}', 'outfit') for f in os.listdir(FITS) if f.endswith('.gltf')]
done_tex = {}


def texture(src_png):
    """the shrunk copy of a base-colour texture: png when it has see-through parts, else jpg"""
    if src_png in done_tex: return done_tex[src_png]
    im = Image.open(src_png); im.load()
    stem = os.path.splitext(os.path.basename(src_png))[0].replace('_png', '')
    alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
    im = im.convert('RGBA' if alpha else 'RGB').resize((1024, 1024), Image.LANCZOS)
    name = f'tex/{stem}.' + ('png' if alpha else 'jpg')
    os.makedirs(f'{OUT}/tex', exist_ok=True)
    im.save(f'{OUT}/{name}', optimize=True) if alpha else im.save(f'{OUT}/{name}', quality=88)
    done_tex[src_png] = name
    return name


for path, kind in JOBS:
    j = json.load(open(path, encoding='utf-8')); here = os.path.dirname(path)
    images, textures, remap = [], [], {}
    for m in j.get('materials', []):
        for k in ('normalTexture', 'occlusionTexture', 'emissiveTexture'): m.pop(k, None)
        pbr = m.setdefault('pbrMetallicRoughness', {}); pbr.pop('metallicRoughnessTexture', None)
        t = pbr.get('baseColorTexture')
        if t is None: continue
        src_img = j['images'][j['textures'][t['index']]['source']]
        uri = texture(os.path.join(here, src_img['uri']))
        if uri not in remap: remap[uri] = len(textures); images.append({'uri': '../' + uri}); textures.append({'source': len(images) - 1})
        pbr['baseColorTexture'] = {'index': remap[uri]}
    j['images'], j['textures'] = images, textures
    j.pop('samplers', None)
    name = os.path.splitext(os.path.basename(path))[0]
    os.makedirs(f'{OUT}/{kind}', exist_ok=True)
    for b in j.get('buffers', []):
        shutil.copy(os.path.join(here, b['uri']), f'{OUT}/{kind}/{b["uri"]}')
    json.dump(j, open(f'{OUT}/{kind}/{name}.gltf', 'w', encoding='utf-8'), separators=(',', ':'))
    print(kind, name)
for f, d in [('universal-animation-library/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb', 'UAL1.glb'),
             ('universal-animation-library-2/Universal Animation Library 2[Standard]/Unreal-Godot/UAL2_Standard.glb', 'UAL2.glb')]:
    shutil.copy(f'{SRC}/{f}', f'{OUT}/{d}')
shutil.copy(f'{BASE}/License_Standard.txt', f'{OUT}/LICENSE-Quaternius.txt')
print('textures', len(done_tex))
