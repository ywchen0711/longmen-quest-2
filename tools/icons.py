"""Icons and the lobby thumbnail for 龍門刀客傳 貳.

    python -P tools/icons.py [battle-screenshot.png]

icon-192.png, icon-512.png, apple-touch-icon.png: 奕叡's portrait on the red book cover with a gold 「貳」.
thumb.jpg (960x540): a battle screenshot (if given) under a title band.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = r'C:/Windows/Fonts/msjhbd.ttc' if os.path.exists(r'C:/Windows/Fonts/msjhbd.ttc') else r'C:/Windows/Fonts/msjh.ttc'
por = Image.open(os.path.join(ROOT, 'assets', 'people', 'yirui_portrait.png')).convert('RGBA')


def icon(n):
    im = Image.new('RGBA', (n, n), (122, 36, 24, 255))
    d = ImageDraw.Draw(im)
    b = max(2, n // 24)
    d.rectangle([b, b, n - b - 1, n - b - 1], outline=(240, 205, 108, 255), width=max(1, n // 64))
    s = (n * 0.62) / 56
    p = por.resize((round(48 * s), round(56 * s)), Image.NEAREST)
    im.alpha_composite(p, ((n - p.width) // 2 - n // 10, n - p.height - b * 2))
    f = ImageFont.truetype(FONT, int(n * 0.28))
    d.text((n * 0.66, n * 0.06), '貳', font=f, fill=(240, 205, 108, 255), stroke_width=max(1, n // 60), stroke_fill=(62, 12, 6, 255))
    return im


icon(192).save(os.path.join(ROOT, 'icon-192.png'))
icon(512).save(os.path.join(ROOT, 'icon-512.png'))
icon(180).convert('RGB').save(os.path.join(ROOT, 'apple-touch-icon.png'))
if len(sys.argv) > 1:
    shot = Image.open(sys.argv[1]).convert('RGB').resize((960, 540), Image.LANCZOS)
    d = ImageDraw.Draw(shot, 'RGBA')
    d.rectangle([0, 0, 960, 92], fill=(122, 36, 24, 235))
    f = ImageFont.truetype(FONT, 50); f2 = ImageFont.truetype(FONT, 22)
    d.text((24, 14), '龍門刀客傳 貳 · 萬妖鈴', font=f, fill=(240, 205, 108), stroke_width=2, stroke_fill=(62, 12, 6))
    d.text((620, 52), 'Longmen Quest II', font=f2, fill=(243, 232, 207))
    shot.save(os.path.join(ROOT, 'thumb.jpg'), quality=88)
print('icons ok')
