# -*- coding: utf-8 -*-
"""
Longmen Quest II (龍門刀客傳 貳) - the original score (every melody, bass line, chord and drum pattern).

The game's music is rendered from this score by tools/orch.py with recorded instruments. Running this file
only renders a quick sketch with the old built-in chip synth, into ../audio/_sketch (the game never uses it).

Sketch synth: a small 2A03-like model - two pulse channels (12.5/25/50 % duty, 4-bit volume
envelopes, NES period-quantised pitch), a 4-bit stepped 32-step triangle for bass, and a
15-bit LFSR noise channel (long + short "metallic" mode) for drums, gongs and woodblocks.
Ornaments give the wuxia flavour: grace notes, erhu-style slides and vibrato, falls.

Score format (one string per channel, tokens separated by spaces):
  NOTE[:dur]   e.g.  A4:4   C#5:2   Bb3     (dur in 16th-note steps; sticky)
  r[:dur]      rest          -[:dur]  tie (extends the previous note)
  prefixes     ^ grace note from above   / slide up into the note   \\ fall at the end
               ~ strong vibrato          ! accent                    * staccato
  |            bar line - the parser checks that every bar is exactly one bar long
  [ ... ]*N    repeat
Drum strings: one character per 16th step: k kick  s snare  h hat  o open hat  c crash
  g gong  w woodblock high  v woodblock low  t tom  .  rest   (| and spaces ignored)

Run:  python tools/music.py            (sketches every track into ../audio/_sketch)
      python tools/music.py battle     (just one)
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
CPU = 1789773.0
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'audio', '_sketch'))
TMP = os.environ.get('LQ_MUSIC_TMP', os.path.join(OUT, '_wav'))

NOTE_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi_of(name):
    m = re.fullmatch(r'([A-G])([#b]?)(-?\d)', name)
    if not m:
        raise ValueError('bad note ' + name)
    pc = NOTE_PC[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)
    return 12 * (int(m.group(3)) + 1) + pc


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


# --------------------------------------------------------------------------- parsing
def expand(s):
    pat = re.compile(r'\[([^\[\]]*)\]\*(\d+)')
    while True:
        n = pat.sub(lambda mm: ' '.join([mm.group(1)] * int(mm.group(2))), s)
        if n == s:
            return s
        s = n


def parse(s, bar=16, name='?'):
    """-> (events [(step, dur, midi, orn)], total_steps)"""
    s = expand(s).replace('|', ' | ')
    ev, t, dur, last_bar, barno = [], 0.0, 4.0, 0.0, 0
    for tok in s.split():
        if tok == '|':
            barno += 1
            if abs((t - last_bar) - bar) > 1e-6:
                raise ValueError('%s: bar %d is %g steps' % (name, barno, t - last_bar))
            last_bar = t
            continue
        orn = ''
        while tok and tok[0] in '^/\\~!*':
            orn += tok[0]
            tok = tok[1:]
        if ':' in tok:
            tok, d = tok.split(':')
            dur = float(d)
        if tok == 'r':
            t += dur
            continue
        if tok == '-':
            st, d0, m0, o0 = ev[-1]
            ev[-1] = (st, d0 + dur, m0, o0)
            t += dur
            continue
        ev.append((t, dur, midi_of(tok), orn))
        t += dur
    return ev, t


def parse_drums(s):
    s = expand(s).replace('|', '').replace(' ', '')
    return [(i, c) for i, c in enumerate(s) if c != '.'], len(s)


# ----------------------------------------------------------------- chord helpers
QUAL = {'': (0, 4, 7), 'm': (0, 3, 7), 's2': (0, 2, 7), 's4': (0, 5, 7), 'p': (0, 7, 12),
        'q': (0, 5, 10), '6': (0, 4, 9), 'm7': (0, 3, 10)}


def chord_pcs(ch):
    m = re.fullmatch(r'([A-G][#b]?)(.*)', ch)
    root = NOTE_PC[m.group(1)[0]] + (1 if '#' in m.group(1) else -1 if 'b' in m.group(1)[1:] else 0)
    return root % 12, QUAL[m.group(2)]


def place(pc, lo, transpose):
    """midi number with pitch class pc whose transposed value lies in [lo, lo+12)."""
    m = pc
    while m + transpose < lo:
        m += 12
    while m + transpose >= lo + 12:
        m -= 12
    return m


def nn(m):
    names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    return '%s%d' % (names[m % 12], m // 12 - 1)


BASS = {  # R root, F fifth, O octave, r rest  (dur in steps)
    'drive': 'R:2 R:2 O:2 R:2 R:2 R:2 O:2 F:2',
    'gallop': 'R:3 R:1 R:2 F:2 O:3 R:1 F:2 R:2',
    'oompah': 'R:2 r:2 F:2 r:2 R:2 r:2 O:2 r:2',
    'walk': 'R:4 F:4 O:4 F:4',
    'stride': 'R:6 F:2 O:4 F:4',
    'heartbeat': 'R:2 R:3 r:11',
    'drone': 'R:16',
    'halfs': 'R:8 R:8',
    'pulse8': 'R:2 R:2 R:2 R:2 R:2 R:2 R:2 R:2',
    'toll': 'R:12 F:4',
}

ARP = {  # tone index 0..3 (root, mid, top, octave), r rest
    'up16': '0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1',
    'roll16': '0:1 2:1 3:1 2:1 1:1 2:1 3:1 2:1 0:1 2:1 3:1 2:1 1:1 2:1 3:1 2:1',
    'broken8': '0:2 1:2 2:2 3:2 2:2 1:2 2:2 1:2',
    'off': 'r:2 1:2 r:2 2:2 r:2 1:2 r:2 2:2',
    'hold': '1:8 2:8',
    'stab': '2:3 2:3 1:2 2:3 2:3 1:2',
    'pluck4': '0:4 2:4 3:4 1:4',
}


def bass_line(chords, style, transpose, lo=33):
    out = []
    for ch in chords:
        pc, q = chord_pcs(ch)
        R = place(pc, lo, transpose)
        tones = {'R': R, 'F': R + 7, 'O': R + 12}
        for tok in BASS[style].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[k]) + ':' + d)
        out.append('|')
    return ' '.join(out)


def arp_line(chords, style, transpose, lo=55):
    out = []
    for ch in chords:
        pc, q = chord_pcs(ch)
        R = place(pc, lo, transpose)
        tones = [R + q[0], R + q[1], R + q[2], R + 12]
        for tok in ARP[style].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[int(k)]) + ':' + d)
        out.append('|')
    return ' '.join(out)


# ------------------------------------------------------------------------ synth
def nes_pulse_hz(f):
    p = max(8, round(CPU / (16 * f)) - 1)
    return CPU / (16 * (p + 1))


def nes_tri_hz(f):
    p = max(2, round(CPU / (32 * f)) - 1)
    return CPU / (32 * (p + 1))


def q4(env):
    return np.round(np.clip(env, 0, 1) * 15) / 15.0


def freq_curve(f, n, orn, vib, dur_s):
    t = np.arange(n) / SR
    cents = np.zeros(n)
    if '^' in orn:                       # grace note: a whole step above, ~45 ms
        g = int(0.045 * SR)
        cents[:g] += 200
    if '/' in orn:                       # erhu slide up from a whole step below
        g = int(0.09 * SR)
        cents[:g] += -200 * (1 - np.arange(min(g, n)) / g)[:n] if g <= n else -200
    if '\\' in orn:                      # fall off the end
        s0 = int(n * 0.65)
        cents[s0:] -= 400 * ((np.arange(n - s0) / max(1, n - s0)) ** 2)
    if vib:
        depth = 40 if '~' in orn else vib
        if dur_s > 0.32 or '~' in orn:
            ramp = np.clip((t - 0.18) / 0.35, 0, 1)
            cents += depth * ramp * np.sin(2 * np.pi * 5.6 * t)
    return f * 2 ** (cents / 1200.0)


def envelope(kind, n, dur_s, gate):
    t = np.arange(n) / SR
    if kind == 'lead':
        env = 0.72 + 0.28 * np.exp(-t / 0.09)
    elif kind == 'pad':
        env = np.minimum(1, t / 0.07) * (0.8 + 0.2 * np.exp(-t / 0.3))
    elif kind == 'pluck':
        env = 0.08 + 0.92 * np.exp(-t / 0.13)
    elif kind == 'bell':
        env = np.exp(-t / 0.75)
    else:
        env = np.ones(n)
    g = int(n * gate)
    rel = int(0.02 * SR)
    env[g:] *= np.exp(-np.arange(n - g) / max(1, rel * 0.5))
    return env


def render_pulse(events, step_s, total_samples, duty=0.5, vol=1.0, kind='lead', vib=22,
                 transpose=0, gate=0.9, tail=2.0):
    buf = np.zeros(total_samples + int(tail * SR), dtype=np.float64)
    for st, d, m, orn in events:
        dur_s = d * step_s
        g = 0.5 if '*' in orn else gate
        extra = 0.03 if kind in ('lead', 'pad') else (1.2 if kind == 'bell' else 0.25)
        n = int((dur_s + extra) * SR)
        f = nes_pulse_hz(hz(m + transpose))
        fc = freq_curve(f, n, orn, vib if kind in ('lead', 'pad') else 0, dur_s)
        ph = np.cumsum(fc) / SR
        wave = np.where((ph % 1.0) < duty, 1.0, -1.0)
        nn_ = int(dur_s * SR)
        env = envelope(kind, n, dur_s, g * nn_ / n)
        a = (1.25 if '!' in orn else 1.0) * vol
        x = wave * q4(env) * a
        x[:16] *= np.linspace(0, 1, 16)
        x[-32:] *= np.linspace(1, 0, 32)
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + n] += x[:len(buf) - s0]
    return buf


TRI_TABLE = np.concatenate([np.arange(15, -1, -1), np.arange(0, 16)]) / 7.5 - 1.0


def render_tri(events, step_s, total_samples, vol=1.0, transpose=0, gate=0.88, tail=2.0):
    buf = np.zeros(total_samples + int(tail * SR))
    for st, d, m, orn in events:
        dur_s = d * step_s * (0.5 if '*' in orn else gate)
        n = int(dur_s * SR)
        f = nes_tri_hz(hz(m + transpose))
        fc = freq_curve(f, n, orn, 0, dur_s)
        ph = np.cumsum(fc) / SR
        x = TRI_TABLE[(np.floor(ph * 32).astype(np.int64)) % 32] * vol
        fade = min(64, n // 2)
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + n] += x[:len(buf) - s0]
    return buf


def _lfsr(short):
    reg, out = 1, []
    tap = 6 if short else 1
    for _ in range(93 if short else 32767):
        fb = (reg & 1) ^ ((reg >> tap) & 1)
        reg = (reg >> 1) | (fb << 14)
        out.append(1.0 if reg & 1 else -1.0)
    return np.array(out)


NOISE_LONG = _lfsr(False)
NOISE_SHORT = _lfsr(True)
NOISE_PER = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]


def noise(n, idx, short=False):
    rate = CPU / NOISE_PER[idx]
    tab = NOISE_SHORT if short else NOISE_LONG
    i = (np.arange(n) * rate / SR).astype(np.int64) % len(tab)
    return tab[i]


def tri_sweep(f0, f1, dur):
    n = int(dur * SR)
    f = f0 * (f1 / f0) ** (np.arange(n) / n)
    ph = np.cumsum(f) / SR
    return TRI_TABLE[(np.floor(ph * 32).astype(np.int64)) % 32]


def drum(c):
    def dec(n, tau):
        return q4(np.exp(-np.arange(n) / (tau * SR)))
    if c == 'k':
        a = tri_sweep(170, 45, 0.11) * 1.1
        b = noise(len(a), 11) * dec(len(a), 0.012) * 0.5
        return a + b
    if c == 's':
        n = int(0.16 * SR)
        x = noise(n, 5) * dec(n, 0.05) * 0.75
        x[:int(0.03 * SR)] += tri_sweep(240, 140, 0.03) * 0.6
        return x
    if c == 't':
        a = tri_sweep(220, 90, 0.16)
        return a * dec(len(a), 0.08) * 1.2
    if c == 'h':
        n = int(0.04 * SR)
        return noise(n, 0) * dec(n, 0.012) * 0.33
    if c == 'o':
        n = int(0.18 * SR)
        return noise(n, 1) * dec(n, 0.06) * 0.3
    if c == 'c':
        n = int(1.1 * SR)
        return noise(n, 2) * dec(n, 0.35) * 0.42
    if c == 'g':                          # gong: metallic short-mode noise + low pulse hum
        n = int(2.4 * SR)
        e = dec(n, 0.7)
        x = noise(n, 8, True) * e * 0.28 + noise(n, 11, True) * e * 0.22
        ph = np.arange(n) * 98.0 / SR
        x += np.where(ph % 1 < 0.25, 1, -1) * q4(np.exp(-np.arange(n) / (0.9 * SR))) * 0.12
        x[:int(0.02 * SR)] += noise(int(0.02 * SR), 3) * 0.4
        return x
    if c == 'T':                          # taiko: a deep, long triangle drop + a low noise thump
        a = tri_sweep(115, 34, 0.36)
        n = len(a)
        x = a * dec(n, 0.17) * 1.35
        x += noise(n, 12) * dec(n, 0.035) * 0.5
        x[:int(0.012 * SR)] += noise(int(0.012 * SR), 4) * 0.45
        return x
    if c == 'R':                          # rim shot: a tight metallic click
        n = int(0.05 * SR)
        x = noise(n, 2, True) * dec(n, 0.011) * 0.5
        x[:int(0.01 * SR)] += tri_sweep(900, 600, 0.01) * 0.35
        return x
    if c in 'wv':                         # woodblock / muyu: a short hollow pulse blip
        f = 1250.0 if c == 'w' else 820.0
        n = int(0.06 * SR)
        ph = np.arange(n) * f / SR
        return np.where(ph % 1 < 0.5, 1, -1) * dec(n, 0.014) * 0.55
    raise ValueError(c)


DRUM_CACHE = {}


def render_noise(hits, step_s, total_samples, vol=1.0, tail=2.5):
    buf = np.zeros(total_samples + int(tail * SR))
    for st, c in hits:
        if c not in DRUM_CACHE:
            DRUM_CACHE[c] = drum(c)
        x = DRUM_CACHE[c] * vol
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + len(x)] += x[:len(buf) - s0]
    return buf


# ---------------------------------------------------------------- track render
MIX = {'p1': 0.20, 'p2': 0.15, 'tri': 0.30, 'noise': 0.22}


def render_section(sec, loop):
    bar = sec.get('bar', 16)
    tr = sec.get('transpose', 0)
    step_s = 60.0 / sec['bpm'] / 4
    parts = {}
    lens = {}
    for ch in ('p1', 'p2', 'tri'):
        if isinstance(sec.get(ch), str) and sec[ch] != 'echo':
            parts[ch], lens[ch] = parse(sec[ch], bar, sec['name'] + '.' + ch)
    if 'noise' in sec:
        parts['noise'], lens['noise'] = parse_drums(sec['noise'])
    steps = sec.get('steps') or max(lens.values())
    if loop:
        for ch, L in lens.items():
            if abs(L - steps) > 1e-6:
                raise ValueError('%s.%s is %g steps, expected %g' % (sec['name'], ch, L, steps))
    total = int(round(steps * step_s * SR))
    if sec.get('p2') == 'echo':
        dly, ev = sec.get('echo_delay', 3), []
        for st, d, m, o in parts['p1']:
            s2 = st + dly
            if loop and s2 >= steps:
                s2 -= steps
            ev.append((s2, d, m, o.replace('!', '')))
        parts['p2'] = ev
    mix = np.zeros(total + int(3.0 * SR))
    p1 = sec.get('p1o', {})
    p2 = sec.get('p2o', {})
    if 'p1' in parts:
        x = render_pulse(parts['p1'], step_s, total, transpose=tr, tail=3.0,
                         **{'duty': 0.25, 'kind': 'lead', **p1})
        mix[:len(x)] += x * MIX['p1']
    if 'p2' in parts:
        x = render_pulse(parts['p2'], step_s, total, transpose=tr, tail=3.0,
                         **{'duty': 0.5, 'kind': 'pluck', 'vol': 0.8, **p2})
        mix[:len(x)] += x * MIX['p2']
    if 'tri' in parts:
        x = render_tri(parts['tri'], step_s, total, transpose=tr, tail=3.0, **sec.get('trio', {}))
        mix[:len(x)] += x * MIX['tri']
    if 'noise' in parts:
        x = render_noise(parts['noise'], step_s, total, tail=3.0, vol=sec.get('nvol', 1.0))
        mix[:len(x)] += x * MIX['noise']
    return mix, total


HP = butter(2, 38, 'highpass', fs=SR, output='sos')
LP = butter(2, 11500, 'lowpass', fs=SR, output='sos')


def nes_filter(x, loop):
    if loop:                                  # filter circularly so the loop seam is clean
        L = len(x)
        y = np.concatenate([x, x, x])
        y = sosfilt(LP, sosfilt(HP, y))
        return y[L:2 * L]
    return sosfilt(LP, sosfilt(HP, x))


def gated_rms(x):
    w = int(0.05 * SR)
    n = len(x) // w
    p = (x[:n * w].reshape(n, w) ** 2).mean(1)
    keep = p[p > p.max() * 0.01]
    return np.sqrt(keep.mean())


TARGET_RMS = 0.16
PEAK = 10 ** (-1.0 / 20)


def render_track(name, tr):
    loop = tr.get('loop', True)
    secs = tr['sections']
    if loop:
        mix, total = render_section({'name': name, **secs[0]}, True)
        y = mix[:total].copy()
        rest = mix[total:]
        k = 0
        while k < len(rest):                  # wrap the ringing tail onto the start
            seg = rest[k:k + total]
            y[:len(seg)] += seg
            k += total
    else:
        pieces, pos = [], 0
        for s in secs:
            m, total = render_section({'name': name, **s}, False)
            pieces.append((pos, m))
            pos += total
        y = np.zeros(pos + int(3.0 * SR))
        for p, m in pieces:
            y[p:p + len(m)] += m[:len(y) - p]
        nz = np.nonzero(np.abs(y) > 1e-4)[0]
        y = y[:nz[-1] + int(0.05 * SR)]
    y = nes_filter(y, loop)
    y -= y.mean()
    g = min(TARGET_RMS / gated_rms(y), PEAK / np.abs(y).max())
    y *= g
    f = int(0.003 * SR)                       # tiny fades: no click at the seam/ends
    y[:f] *= np.linspace(0, 1, f)
    fo = f if loop else int(0.08 * SR)
    y[-fo:] *= np.linspace(1, 0, fo)
    return y.astype(np.float32), loop


def write_wav(path, y):
    import wave
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode(wav, name):
    base = os.path.join(OUT, name)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'aac',
                    '-b:a', '64k', '-movflags', '+faststart', base + '.m4a'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'libvorbis',
                    '-b:a', '64k', base + '.ogg'], check=True)


# =========================================================================== SCORES
# Longmen Quest II - all melodies original, on Chinese pentatonic modes (gong C D E G A, yu A C D E G,
# shang D E G A C, zhi G A C D E), transposed per track. A recurring bell motif (E-A-E, a falling fourth answered)
# runs through the title, the tower and the final battle.
T = {}

def D(*bars):
    """drum bars (16 chars each) joined"""
    return '|'.join(bars) + '|'

# ---- title 「萬妖鈴」: the bell motif, then the brothers' theme (A yu, heroic)
_t_mel = '''
E5:4 A5:4 E5:8 | D5:4 G5:4 D5:8 | C5:4 D5:2 E5:2 G5:4 A5:4 | ~E5:12 r:4 |
A4:4 C5:2 D5:2 E5:4 A5:4 | C6:6 A5:2 G5:4 E5:4 | D5:2 E5:2 G5:4 A5:4 G5:2 E5:2 | ~A5:12 r:4 |
D6:6 C6:2 A5:4 G5:4 | A5:4 G5:2 E5:2 D5:8 | E5:4 G5:4 A5:4 C6:4 | !D6:12 r:4 |
C6:4 A5:4 G5:4 E5:4 | G5:6 A5:2 E5:4 D5:4 | C5:4 D5:2 E5:2 G5:4 E5:4 | A5:12 r:4 |'''
_t_ch = ['Am', 'G', 'C', 'Am', 'Am', 'F', 'G', 'Am', 'Dm', 'Am', 'C', 'G', 'F', 'C', 'G', 'Am']
_t_dr = D('g...........ssss', 'k.......s.s.sss.', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.k.s.ssss',
          'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.k.s.ssss',
          'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.kkt.t.tt',
          'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'g...k...s.ssssss')
T['title'] = dict(loop=True, sections=[dict(bpm=112, transpose=-2, p1=_t_mel, p1o=dict(duty=0.25, vib=22),
    p2=arp_line(_t_ch, 'up16', -2), p2o=dict(duty=0.125, vol=0.7), tri=bass_line(_t_ch, 'gallop', -2), noise=_t_dr)])

# ---- town 「市井」: Longmen and Luoxia (C gong, bouncy)
_tw = '''
G4:2 C5:2 D5:2 E5:2 G5:4 E5:4 | D5:2 E5:2 D5:2 C5:2 A4:8 | C5:2 D5:2 E5:2 G5:2 A5:4 G5:4 | E5:12 r:4 |
A5:2 G5:2 E5:2 G5:2 A5:4 C6:4 | G5:2 E5:2 D5:2 E5:2 G5:8 | E5:2 D5:2 C5:2 D5:2 E5:4 D5:2 A4:2 | C5:12 r:4 |'''
_tw_ch = ['C', 'Am', 'F', 'C', 'F', 'C', 'G', 'C']
T['town'] = dict(loop=True, sections=[dict(bpm=126, transpose=2, p1=_tw + _tw.replace('C5:12 r:4', 'C5:8 G4:4 C5:4'), p1o=dict(duty=0.5, vib=12),
    p2=arp_line(_tw_ch * 2, 'off', 2, lo=57), p2o=dict(duty=0.25, vol=0.7), tri=bass_line(_tw_ch * 2, 'oompah', 2),
    noise=D(*(['k.w.h.w.k.wvh.w.', 'k.w.h.w.k.w.hwhw'] * 8)), nvol=0.8)])

# ---- town2 「水鄉茶館」: Suhe and the canal towns (D shang, flowing, erhu slides)
_t2 = '''
D5:6 E5:2 G5:4 A5:4 | /A5:6 G5:2 E5:8 | D5:4 C5:2 A4:2 G4:4 A4:4 | D5:12 r:4 |
G5:6 A5:2 C6:4 A5:4 | G5:4 E5:4 /G5:8 | A5:4 G5:2 E5:2 D5:4 C5:4 | ~D5:12 r:4 |'''
_t2_ch = ['Dm', 'Am', 'C', 'Dm', 'C', 'Am', 'F', 'Dm']
T['town2'] = dict(loop=True, sections=[dict(bpm=96, transpose=0, p1=_t2, p1o=dict(duty=0.5, vib=26, kind='lead'),
    p2=arp_line(_t2_ch, 'pluck4', 0, lo=55), p2o=dict(duty=0.25, vol=0.65, kind='pluck'), tri=bass_line(_t2_ch, 'walk', 0),
    noise=D(*(['w.......v...w...', 'w.......v.v.w...'] * 4)), nvol=0.7)])

# ---- town3 「北雁關」: the northern fortress (E yu, stern march)
_t3 = '''
E5:4 E5:2 G5:2 A5:4 G5:4 | E5:4 D5:4 B4:8 | E5:4 G5:2 A5:2 B5:4 A5:4 | !G5:12 r:4 |
A5:4 B5:2 A5:2 G5:4 E5:4 | D5:4 E5:4 G5:8 | A5:4 G5:2 E5:2 D5:4 B4:4 | E5:12 r:4 |'''
_t3_ch = ['Em', 'Em', 'Em', 'G', 'Am', 'G', 'Am', 'Em']
T['town3'] = dict(loop=True, sections=[dict(bpm=100, transpose=0, p1=_t3, p1o=dict(duty=0.25, vib=14),
    p2=arp_line(_t3_ch, 'stab', 0, lo=52), p2o=dict(duty=0.5, vol=0.55, kind='pluck'), tri=bass_line(_t3_ch, 'walk', 0, lo=31),
    noise=D(*(['k...s...k.k.s...', 'k...s...k...s.ss'] * 4)), nvol=0.75)])

# ---- village 「杏花炊煙」: villages (G gong, gentle, light)
_vi = '''
D5:4 E5:4 G5:4 E5:4 | D5:2 C5:2 A4:4 C5:8 | D5:4 E5:4 G5:2 A5:2 G5:4 | E5:12 r:4 |
G5:4 A5:4 G5:2 E5:2 D5:4 | C5:4 D5:2 E5:2 D5:8 | E5:2 D5:2 C5:4 A4:4 C5:4 | C5:12 r:4 |'''
_vi_ch = ['C', 'Am', 'C', 'Am', 'C', 'F', 'G', 'C']
T['village'] = dict(loop=True, sections=[dict(bpm=104, transpose=7, p1=_vi, p1o=dict(duty=0.5, vib=16, kind='pad'),
    p2=arp_line(_vi_ch, 'broken8', 7, lo=52), p2o=dict(duty=0.25, vol=0.5), tri=bass_line(_vi_ch, 'stride', 7, lo=31),
    noise=D(*(['v.......w.......'] * 8)), nvol=0.6)])

# ---- camp 「百獸山寨」: the beast camp (F gong, comic, waddling)
_ca = '''
C5:2 r:2 C5:2 D5:2 E5:4 C5:4 | G5:2 r:2 G5:2 E5:2 D5:8 | C5:2 D5:2 E5:2 G5:2 A5:2 G5:2 E5:2 D5:2 | C5:4 G4:4 C5:8 |
A5:2 r:2 A5:2 G5:2 E5:4 G5:4 | D5:2 r:2 D5:2 E5:2 C5:8 | A4:2 C5:2 D5:2 E5:2 G5:2 E5:2 D5:2 E5:2 | C5:12 r:4 |'''
_ca_ch = ['C', 'G', 'F', 'C', 'F', 'C', 'G', 'C']
T['camp'] = dict(loop=True, sections=[dict(bpm=120, transpose=5, p1=_ca, p1o=dict(duty=0.125, vib=10, kind='pluck'),
    p2=arp_line(_ca_ch, 'off', 5, lo=57), p2o=dict(duty=0.5, vol=0.6), tri=bass_line(_ca_ch, 'oompah', 5),
    noise=D(*(['k...w...k.w.w...', 'k...w...k.wvwvw.'] * 4)), nvol=0.8)])

# ---- field 「江湖再行」: the overworld (G gong, striding)
_fi = '''
G4:4 C5:4 D5:4 E5:4 | G5:6 A5:2 G5:4 E5:4 | D5:4 E5:2 D5:2 C5:4 A4:4 | C5:8 D5:8 |
E5:4 G5:4 A5:4 C6:4 | D6:6 C6:2 A5:4 G5:4 | A5:4 G5:2 E5:2 D5:4 E5:4 | G5:12 r:4 |
A5:6 G5:2 E5:4 G5:4 | A5:4 C6:4 D6:8 | C6:4 A5:2 G5:2 E5:4 D5:4 | E5:8 G5:8 |
C6:6 A5:2 G5:4 E5:4 | D5:4 E5:2 G5:2 A5:8 | G5:4 E5:2 D5:2 C5:4 D5:4 | C5:12 r:4 |'''
_fi_ch = ['C', 'C', 'G', 'C', 'C', 'G', 'F', 'C', 'Am', 'F', 'Am', 'C', 'Am', 'F', 'G', 'C']
T['field'] = dict(loop=True, sections=[dict(bpm=108, transpose=7, p1=_fi, p1o=dict(duty=0.25, vib=22),
    p2=arp_line(_fi_ch, 'broken8', 7, lo=52), p2o=dict(duty=0.5, vol=0.55), tri=bass_line(_fi_ch, 'stride', 7, lo=31),
    noise=D(*(['k...h...s...h...', 'k...h...s...h.h.', 'k...h...s...h...', 'k...h...s.k.s.h.'] * 4)), nvol=0.75)])

# ---- sea 「破浪」: sailing (D gong, swinging 6/8 feel in 16ths)
_se = '''
D5:6 E5:2 G5:6 A5:2 | B5:6 A5:2 G5:8 | E5:6 G5:2 A5:6 G5:2 | E5:6 D5:2 B4:8 |
D5:6 E5:2 G5:6 B5:2 | D6:6 B5:2 A5:8 | G5:6 A5:2 B5:6 A5:2 | G5:12 r:4 |'''
_se_ch = ['G', 'Em', 'C', 'G', 'G', 'D', 'C', 'G']
T['sea'] = dict(loop=True, sections=[dict(bpm=112, transpose=-5, p1=_se, p1o=dict(duty=0.5, vib=20),
    p2=arp_line(_se_ch, 'roll16', -5, lo=55), p2o=dict(duty=0.125, vol=0.55), tri=bass_line(_se_ch, 'stride', -5, lo=31),
    noise=D(*(['k.....h.k.....h.', 'k.....h.k...s.h.'] * 4)), nvol=0.65)])

# ---- dungeon 「幽洞」: caves (A yu, sparse, echo)
_du = '''
A4:4 r:2 C5:2 E5:6 r:2 | D5:2 C5:2 A4:2 G4:2 /A4:8 | r:4 E5:2 G5:2 A5:4 G5:4 | ~E5:12 r:4 |
A4:4 r:2 D5:2 E5:6 r:2 | G5:2 E5:2 D5:2 C5:2 D5:8 | r:4 C5:2 D5:2 E5:4 D5:2 C5:2 | A4:12 r:4 |'''
_du_b = '''
[A2:2 A2:3 r:11 |]*2 F2:2 F2:3 r:11 | E2:2 E2:3 r:7 E2:4 |
[A2:2 A2:3 r:11 |]*2 G2:2 G2:3 r:11 | A2:2 A2:3 r:7 E2:4 |'''
T['dungeon'] = dict(loop=True, sections=[dict(bpm=86, transpose=-2, p1=_du, p1o=dict(duty=0.125, vib=26, vol=0.95),
    p2='echo', echo_delay=3, p2o=dict(duty=0.25, kind='lead', vol=0.42), tri=_du_b,
    noise=D(*(['g.......v.......', '....v.......v...'] * 4)), nvol=0.8)])

# ---- temple 「鈴音寺」: the bell temple (D shang, bells, slow canon)
_te = '''
D5:8 A4:4 C5:4 | D5:4 G5:4 E5:8 | A5:8 G5:4 E5:4 | D5:16 |
C6:8 A5:4 G5:4 | A5:4 E5:4 G5:8 | E5:4 D5:4 C5:4 A4:4 | D5:16 |'''
_te_ch = ['D', 'C', 'D', 'D', 'F', 'C', 'Am', 'D']
T['temple'] = dict(loop=True, sections=[dict(bpm=70, transpose=0, p1=_te, p1o=dict(duty=0.125, kind='bell', vol=1.1),
    p2='echo', echo_delay=6, p2o=dict(duty=0.25, kind='bell', vol=0.5), tri=bass_line(_te_ch, 'toll', 0, lo=33),
    noise=D(*(['g...v...v...v...', 'w...v...v...v...'] * 4)), nvol=0.7)])

# ---- mansion 「舊宅幽魂」: the haunted mansion (E yu with flat second, music box waltz feel)
_ma = '''
E5:4 F5:2 E5:2 B4:8 | C5:4 D5:2 C5:2 A4:8 | E5:4 G5:2 F5:2 E5:4 D5:4 | ~E5:12 r:4 |
A5:4 G5:2 F5:2 E5:8 | F5:4 E5:2 D5:2 C5:8 | B4:4 C5:2 D5:2 E5:4 F5:4 | ~E5:12 r:4 |'''
_ma_ch = ['Am', 'F', 'Am', 'E', 'Am', 'F', 'Dm', 'E']
T['mansion'] = dict(loop=True, sections=[dict(bpm=78, transpose=0, p1=_ma, p1o=dict(duty=0.125, kind='bell', vol=1.0),
    p2=arp_line(_ma_ch, 'pluck4', 0, lo=57), p2o=dict(duty=0.25, kind='pluck', vol=0.5), tri=bass_line(_ma_ch, 'heartbeat', 0, lo=30),
    noise=D(*(['........v.......', '....v...........'] * 4)), nvol=0.6)])

# ---- tower 「萬妖塔」: the sect's tower (bell motif, F# yu, driving dread)
_to = '''
E5:4 A5:4 E5:8 | F5:4 E5:4 C5:8 | E5:4 A5:4 B5:4 C6:4 | ~B5:12 r:4 |
A5:4 G5:2 F5:2 E5:4 C5:4 | D5:4 E5:4 F5:8 | E5:2 F5:2 E5:2 C5:2 B4:4 C5:4 | A4:12 r:4 |'''
_to_ch = ['Am', 'F', 'Am', 'E', 'Am', 'Dm', 'F', 'Am']
T['tower'] = dict(loop=True, sections=[dict(bpm=92, transpose=-3, p1=_to, p1o=dict(duty=0.25, vib=24),
    p2=arp_line(_to_ch, 'hold', -3, lo=50), p2o=dict(duty=0.125, vol=0.65, kind='pad'), tri=bass_line(_to_ch, 'pulse8', -3, lo=28),
    noise=D(*(['g.......k.......', 'k.......k...k...'] * 4)), nvol=0.85)])

# ---- battle 「群戰」: everyday fights (E yu, fast)
_ba = '''
!A4:2 A4:2 r:2 C5:2 r:2 D5:2 E5:2 G5:2 | !A5:4 G5:2 E5:2 D5:4 E5:4 | C5:2 D5:2 E5:2 G5:2 A5:4 C6:4 | B5:2 A5:2 G5:2 E5:2 A5:8 |
!A5:6 G5:2 E5:4 D5:4 | E5:2 G5:2 A5:4 D6:4 C6:4 | A5:2 G5:2 E5:2 G5:2 A5:2 C6:2 D6:2 C6:2 | A5:12 r:4 |
D6:4 C6:2 A5:2 G5:4 A5:4 | E5:2 D5:2 E5:2 G5:2 A5:8 | C6:4 A5:2 G5:2 E5:4 G5:4 | D5:2 C5:2 D5:2 E5:2 G5:8 |
A5:2 A5:2 G5:2 A5:2 C6:2 C6:2 A5:2 C6:2 | D6:2 D6:2 C6:2 D6:2 E6:4 D6:4 | !E6:6 D6:2 C6:4 A5:4 | G5:4 E5:4 D5:4 E5:4 |'''
_ba_ch = ['Am', 'Am', 'C', 'Em', 'Am', 'C', 'Am', 'Am', 'Dm', 'Am', 'C', 'G', 'Am', 'G', 'Am', 'Em']
T['battle'] = dict(loop=True, sections=[dict(bpm=170, transpose=-5, p1=_ba, p1o=dict(duty=0.5, vib=18),
    p2=arp_line(_ba_ch, 'up16', -5, lo=57), p2o=dict(duty=0.125, vol=0.68), tri=bass_line(_ba_ch, 'drive', -5),
    noise=D('k.k.s.k.k.k.s.ss', 'k.hks.h.k.hks.hh', *(['c.hks.h.k.hks.h.', 'k.hks.h.k.hks.hh', 'k.hks.h.k.hks.h.', 'k.hks.h.k.s.ssss'] * 3), 'k.hks.h.k.hks.h.', 'k.k.s.k.s.ssssss'))])

# ---- boss 「宗門魔影」: sect envoys and bell-bound beasts (D yu, flat second menace)
_bo_ost = 'A4:1 A4:1 A5:2 A4:1 A4:1 G5:2 A4:1 A4:1 E5:2 A4:1 A4:1 Bb4:2 |'
_bo = _bo_ost * 2 + '''
!A5:8 Bb5:4 A5:4 | G5:4 E5:4 D5:4 E5:4 | A5:8 C6:4 D6:4 | !E6:8 D6:2 C6:2 Bb5:4 |
A5:8 Bb5:4 A5:4 | G5:4 E5:4 D5:4 C5:4 | D5:4 E5:4 G5:2 E5:2 D5:2 C5:2 | A4:12 r:4 |
!A5:3 A5:3 G5:2 E5:3 E5:3 D5:2 | E5:3 G5:3 A5:2 C6:8 | !D6:3 D6:3 C6:2 A5:3 A5:3 G5:2 | Bb5:4 A5:4 G5:4 E5:4 |'''
_bo_ch = ['Am', 'Am', 'F', 'Em', 'F', 'Bb', 'Am', 'C', 'Dm', 'Am', 'Am', 'Am', 'Dm', 'C']
T['boss'] = dict(loop=True, sections=[dict(bpm=150, transpose=-7, p1=_bo, p1o=dict(duty=0.25, vib=22),
    p2=arp_line(_bo_ch, 'stab', -7, lo=55), p2o=dict(duty=0.5, vol=0.72, kind='pluck'), tri=bass_line(_bo_ch, 'pulse8', -7),
    noise=D('k...k...k...k.ss', 'k...k...k...ssss', *(['c.hks.hkk.hks.hk', 'k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hk', 'k.hks.hkk.s.ssss'] * 3)))])

# ---- final 「鈴心決戰」: Mo Wuya and the bell (the bell motif at full tilt, B yu)
_fn_ost = 'E5:1 A4:1 E5:1 A4:1 E5:1 A4:1 C6:2 B5:1 E5:1 B5:1 E5:1 A5:4 |'
_fn = _fn_ost * 2 + '''
!E6:4 A5:4 E6:8 | D6:4 G5:4 D6:8 | C6:2 D6:2 E6:4 G6:4 E6:4 | ~A6:12 r:4 |
!A5:3 C6:3 D6:2 E6:3 D6:3 C6:2 | D6:3 C6:3 A5:2 G5:8 | !A5:3 C6:3 D6:2 E6:3 G6:3 E6:2 | ~A6:16 |
G6:4 E6:4 D6:4 C6:4 | D6:4 C6:4 A5:4 G5:4 | A5:2 C6:2 D6:2 E6:2 G6:2 A6:2 G6:2 E6:2 | !E6:8 A5:8 |
E6:4 A5:4 E6:8 | F6:4 E6:4 C6:8 | E6:2 F6:2 E6:2 D6:2 C6:4 B5:4 | A5:12 r:4 |'''
_fn_ch = ['Am', 'Am', 'Am', 'G', 'C', 'Am', 'Am', 'G', 'Am', 'Am', 'C', 'Dm', 'Am', 'Am', 'Am', 'F', 'Dm', 'Am']
T['final'] = dict(loop=True, sections=[dict(bpm=176, transpose=2, p1=_fn, p1o=dict(duty=0.25, vib=20),
    p2=arp_line(_fn_ch, 'roll16', 2, lo=55), p2o=dict(duty=0.125, vol=0.7), tri=bass_line(_fn_ch, 'drive', 2),
    noise=D('k.s.k.s.k.s.k.ss', 'k.s.k.s.k.s.ssss', *(['c.hsk.hsk.hsk.hs', 'k.hsk.hsk.hsk.hs', 'k.hsk.hsk.hsk.hs', 'k.hsk.hsk.s.ssss'] * 4)))])

# ---- beasts 「萬妖亂舞」: Mo Wuya and the great bell at the top of the tower. An original war-drum piece: a
# relentless triangle ostinato that steps E -> F -> D -> C, taiko hits, layers entering one by one, an E yu theme that
# climbs a whole step (F# yu) for the climax. 72 bars at 160 bpm (108 s) in one seamless loop:
#   1-8 drums + ostinato | 9-16 build: calls and answers | 17-32 main theme | 33-40 breakdown (half-time drums)
#   41-56 climax: the theme a step higher, harmonised | 57-64 the soaring tag | 65-72 the bell motif, drum roll home
_PCN = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
_NOTE_TOK = re.compile(r'^([\^/\\~!*]*)([A-G][#b]?-?\d)(:[\d.]+)?$')


def _map_notes(s, fn):
    out = []
    for tok in s.split():
        m = _NOTE_TOK.match(tok)
        if not m:
            out.append(tok)
            continue
        r = fn(midi_of(m.group(2)), m.group(1))
        if r is None:
            out.append('r' + (m.group(3) or ''))
        else:
            mm, orn = r
            out.append(orn + nn(mm) + (m.group(3) or ''))
    return ' '.join(out)


def shift(s, semi):
    return _map_notes(s, lambda m, o: (m + semi, o))


def harm(s, scale, deg=-2, drop=0):
    """a diatonic line `deg` scale steps from the melody (a third below by default); accents removed"""
    sc = sorted(_PCN[x] for x in scale)
    def f(m, o):
        pc = m % 12
        if pc not in sc:
            return (m - 3 - drop, o.replace('!', ''))
        i = sc.index(pc)
        j = i + deg
        octs, j = divmod(j, len(sc))
        return (m - pc + sc[j] + 12 * octs - drop, o.replace('!', '').replace('~', ''))
    return _map_notes(s, f)


_OST = {  # (interval, dur) figures for the triangle: A the steady one, B the turn at the end of a phrase
    'A': [(0, 2), (0, 1), (0, 1), (12, 2), (0, 2), (3, 2), (0, 1), (0, 1), (5, 2), (3, 2)],
    'B': [(0, 2), (0, 1), (0, 1), (12, 2), (0, 2), (7, 2), (5, 2), (3, 2), (-2, 2)],
    'C': [(0, 1), (0, 1), (12, 1), (0, 1), (0, 1), (0, 1), (10, 1), (0, 1),
          (0, 1), (0, 1), (7, 1), (0, 1), (5, 1), (0, 1), (3, 1), (12, 1)],    # 16ths: the climax drive
}


def ostinato(spec, lo=36):
    """spec 'E E F E/B ...' -> a triangle line, one bar per root (/X picks the figure)"""
    out = []
    for b in spec.split():
        root, fig = (b.split('/') + ['A'])[:2]
        R = place(_PCN[root], lo, 0)
        out += [nn(R + iv) + ':' + str(d) for iv, d in _OST[fig]] + ['|']
    return ' '.join(out)


_STAB = {  # R root, F fifth, O octave
    'a': 'R:1 r:1 r:2 O:1 r:1 F:1 r:1 r:2 R:1 r:1 O:2 F:2',
    'b': 'r:2 R:1 R:1 r:2 F:2 r:2 O:1 O:1 r:2 F:2',
    'c': 'O:1 r:1 F:1 r:1 R:1 r:1 F:1 r:1 O:1 r:1 F:1 r:1 R:2 F:2',
    'p': 'O:1 R:1 R:1 R:1 F:1 R:1 R:1 R:1 O:1 R:1 R:1 R:1 F:1 R:1 F:1 O:1',   # 16th pulse
    'x': 'r:16',
}


def stabs(spec, lo=52):
    out = []
    for b in spec.split():
        root, pat = (b.split('/') + ['a'])[:2]
        R = place(_PCN[root], lo, 0)
        tones = {'R': R, 'F': R + 7, 'O': R + 12}
        for tok in _STAB[pat].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[k]) + ':' + d)
        out.append('|')
    return ' '.join(out)


_EYU = ['E', 'F#', 'G', 'A', 'B', 'C', 'D']           # E aeolian for the harmony
_FYU = ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E']

_bm_main = '''
!E5:6 G5:2 A5:4 B5:4 | D6:4 B5:4 A5:2 G5:2 E5:4 | !G5:6 A5:2 C6:4 B5:4 | A5:4 G5:2 A5:2 /D5:8 |
!E5:6 G5:2 A5:4 B5:4 | E6:4 D6:4 B5:2 D6:2 E6:4 | !G6:6 E6:2 D6:4 B5:4 | ~A5:12 r:4 |
!C6:3 B5:3 A5:2 G5:3 A5:3 B5:2 | E5:4 G5:4 A5:8 | !D6:3 C6:3 B5:2 A5:3 B5:3 D6:2 | E6:12 D6:2 B5:2 |
!E6:4 B5:4 D6:4 A5:4 | B5:2 A5:2 G5:2 E5:2 G5:4 A5:4 | !F5:6 E5:2 F5:2 G5:2 A5:4 | ~E5:12 r:4 |'''
_bm_p1 = ' '.join([
    'r:16 |' * 8,                                                            # 1-8 drums + ostinato
    '!E5:6 r:2 G5:2 A5:2 r:4 | r:16 | !D5:6 r:2 E5:2 G5:2 r:4 | r:16 |',     # 9-12 calls
    '!E5:4 G5:4 A5:4 B5:4 | D6:6 B5:2 A5:8 | G5:2 A5:2 B5:2 D6:2 E6:4 D6:4 | ~B5:12 r:4 |',
    _bm_main,                                                                # 17-32 main theme
    'r:16 | r:16 | r:16 | r:16 |',                                           # 33-36 breakdown
    '~E5:16 | ~F5:16 | ~G5:16 | B5:8 !D6:8 |',                               # 37-40 rising
    shift(_bm_main, 2),                                                      # 41-56 climax in F#
    '''!A6:6 F#6:2 E6:4 C#6:4 | E6:4 F#6:4 ~B5:8 | !D6:6 E6:2 F#6:4 A6:4 | E6:6 C#6:2 B5:4 C#6:4 |
       !F#6:4 A6:4 F#6:2 E6:2 C#6:4 | E6:4 F#6:2 E6:2 C#6:4 B5:4 | !A5:3 B5:3 C#6:2 E6:3 F#6:3 A6:2 | ~F#6:16 |''',
    '!E5:4 A5:4 E5:8 | !F5:4 Bb5:4 F5:8 | !E5:4 A5:4 E5:8 | ~B4:16 |',       # 65-68 the bell motif
    'r:16 | r:16 | r:16 | r:16 |'])
_bm_p2 = ' '.join([
    'r:16 |' * 4, stabs('E/b F/b E/b E/c'),                                   # 5-8 stabs enter
    stabs('E/b'), 'B4:2 A4:2 G4:2 E4:2 r:8 |', stabs('D/b'), 'A4:2 G4:2 E4:2 D4:2 r:8 |',  # 9-12 answers
    stabs('E/a E/a G/a D/c'),
    stabs('E/a E/a C/a D/a E/a E/a G/a D/c'),                                 # 17-24 stabs under the theme
    harm(' | '.join(_bm_main.split('|')[8:16]) + ' |', _EYU),                # 25-32 harmony a third below
    'r:16 | r:16 | r:16 | r:16 |', stabs('E/p E/p F/p F/p'),                 # 33-40 silence, then a 16th pulse
    harm(shift(_bm_main, 2), _FYU),                                          # 41-56 harmony a third below
    arp_line(['F#m', 'F#m', 'D', 'E', 'F#m', 'F#m', 'G', 'F#m'], 'up16', 0, lo=57),  # 57-64
    stabs('E/a F/a E/a E/c E/b D/b E/x E/x', lo=52)])
_bm_tri = ' '.join([
    ostinato('E E E E/B F F E E/B'),                                         # 1-8
    ostinato('E E D D C C D D/B'),                                           # 9-16
    ostinato('E E C D E E G D C C D D E E F E/B'),                           # 17-32
    'E2:6 r:2 E2:2 r:6 | E2:6 r:2 E2:2 r:6 | E2:6 r:2 F2:2 r:6 | F2:6 r:2 F2:2 r:6 |',
    ostinato('E E F F/B'),                                                   # 37-40
    ostinato('F#/C F#/C D/C E/C F#/C F#/C A/C E/C D/C D/C E/C E/C F#/C F#/C G/C F#/B'),   # 41-56
    ostinato('F#/C F#/C D/C E/C F#/C F#/C G/C F#/B'),                        # 57-64
    ostinato('E F E E/B E E D D/B')])                                        # 65-72
_bm_dr = D(
    'g.......T...R.R.', 'T.......T.T.R...', 'T.......T...R.R.', 'T.......T.T.R.RR',            # 1-4
    'T...s...T.T.s.R.', 'T...s...T.T.s.R.', 'T...s...T.T.s.R.', 'T...s...ssssssss',            # 5-8
    *(['T.h.s.h.T.hTs.h.', 'T.h.s.h.T.hTs.hh', 'T.h.s.h.T.hTs.h.', 'T.h.s.h.T.T.ssss'] * 1),    # 9-12
    'T.h.s.h.T.hTs.h.', 'T.h.s.h.T.hTs.hh', 'T.h.s.h.T.hTs.h.', 'T...T...t.t.tttt',            # 13-16
    *(['c.hks.hhk.hTs.hk', 'T.hks.hhk.hTs.hk', 'T.hks.hhk.hTs.hk', 'T.hks.hhk.s.ssss'] * 4),    # 17-32
    'T.......R.......', 'T.....T.R.......', 'T.......R.......', 'T.....T.R...R...',            # 33-36 half-time
    'T.......s.......', 'T...T...s.....s.', 'T.T.T.T.s...s...', 'T.T.s.s.ssssssss',            # 37-40
    *(['c.hsk.hsT.hsk.hs', 'k.hsk.hsT.hsk.hs', 'T.hsk.hsT.hsk.hs', 'k.hsk.hsT.s.ssss'] * 4),    # 41-56
    'c.hsT.hsk.hsT.hs', 'T.hsT.hsk.hsT.hs', 'T.hsT.hsk.hsT.hs', 'T.hsT.hsk.s.ssss',            # 57-60
    'c.hsT.hsk.hsT.hs', 'T.hsT.hsk.hsT.hs', 'T.hsT.hsk.hsT.ss', 'T.T.T.ssT.ssssss',            # 61-64
    'c.......T...R.R.', 'T.......T.T.R...', 'T.......T...R.R.', 'T...s...T.T.s.R.',            # 65-68
    'T...T...s.s.s.s.', 'T...T...s.s.ssss', 'T.T.T.T.t.t.t.t.', 'T.T.T.T.ssssssss')            # 69-72
T['beasts'] = dict(loop=True, sections=[dict(bpm=160, transpose=0, p1=_bm_p1, p1o=dict(duty=0.25, vib=20),
    p2=_bm_p2, p2o=dict(duty=0.5, vol=0.72, kind='pluck'), tri=_bm_tri, noise=_bm_dr, nvol=0.95)])

# ---- ending 「江湖又一年」: the title theme in triumph, then slow and gentle (no loop)
_en_slow = '''
A4:4 C5:2 D5:2 E5:4 A5:4 | G5:8 E5:8 | D5:4 E5:2 G5:2 A5:4 G5:4 | E5:16 |
C5:4 D5:4 E5:4 G5:4 | A5:8 G5:4 E5:4 | D5:4 C5:2 D5:2 E5:4 D5:4 | ~A4:16 |'''
_en_ch = ['Am', 'C', 'G', 'Am', 'C', 'F', 'G', 'Am']
T['ending'] = dict(loop=False, sections=[
    dict(bpm=112, transpose=-2, p1=_t_mel, p1o=dict(duty=0.25, vib=22), p2=arp_line(_t_ch, 'up16', -2), p2o=dict(duty=0.125, vol=0.7),
         tri=bass_line(_t_ch, 'gallop', -2), noise=_t_dr),
    dict(bpm=76, transpose=-2, p1=_en_slow, p1o=dict(duty=0.5, vib=20, kind='pad', vol=0.95), p2=arp_line(_en_ch, 'pluck4', -2, lo=50),
         p2o=dict(duty=0.25, vol=0.55), tri=bass_line(_en_ch, 'halfs', -2), noise=D(*(['v.......w.......'] * 8))),
    dict(bpm=70, transpose=-2, p1='E5:4 A5:4 E5:8 | D5:4 G5:4 D5:8 | C5:4 D5:4 E5:4 G5:4 | ~A5:16 | r:16 |', p1o=dict(duty=0.5, vib=20, kind='pad'),
         p2='C5:16 | B4:16 | G4:8 B4:8 | C5:16 | r:16 |', p2o=dict(duty=0.25, kind='pad', vol=0.5),
         tri='A2:16 | G2:16 | C3:8 G2:8 | A2:16 | r:16 |', trio=dict(gate=0.97), noise='g' + '.' * 47 + 'g' + '.' * 31),
])

# ---- jingles
T['j_win'] = dict(loop=False, sections=[dict(bpm=150, transpose=2, p1='G4:2 C5:2 E5:2 G5:2 A5:2 G5:1 A5:1 ~C6:20',
    p2='E4:2 G4:2 C5:2 E5:2 E5:2 E5:1 E5:1 G5:20', p2o=dict(kind='pad', vol=0.7), tri='C3:8 G2:4 C3:20', noise='k.......s.ss')])
T['j_level'] = dict(loop=False, sections=[dict(bpm=160, transpose=2, p1='C5:1 D5:1 E5:1 G5:1 A5:1 C6:1 D6:1 E6:1 ~G6:16', p1o=dict(duty=0.5),
    p2='r:1 C5:1 D5:1 E5:1 G5:1 A5:1 C6:1 D6:1 E6:16', p2o=dict(duty=0.125, kind='lead', vol=0.6), tri='C3:4 G3:4 C3:16', noise='w.w.w.w.c')])
T['j_inn'] = dict(loop=False, sections=[dict(bpm=90, transpose=0, p1='E5:4 D5:2 C5:2 A4:4 G4:4 ~C5:8', p1o=dict(duty=0.5, kind='pad', vib=16),
    p2='C5:4 A4:4 E4:4 E4:4 E4:8', p2o=dict(duty=0.25, kind='pad', vol=0.55), tri='C3:8 F2:8 C3:8', noise='v...............g', nvol=0.6)])
T['j_item'] = dict(loop=False, sections=[dict(bpm=140, transpose=2, p1='!E5:2 E5:1 E5:1 G5:4 A5:2 G5:2 A5:2 C6:2 ~E6:16', p1o=dict(duty=0.5),
    p2='C5:2 C5:1 C5:1 E5:4 E5:2 E5:2 E5:2 G5:2 G5:16', p2o=dict(kind='pad', vol=0.65), tri='C3:4 C3:4 F2:8 C3:16', noise='k...s...k.s.s.s.c')])
T['j_over'] = dict(loop=False, sections=[dict(bpm=70, transpose=0, p1='E5:4 D5:4 C5:4 \\A4:8', p1o=dict(duty=0.5, kind='pad', vib=24),
    p2='C5:4 Bb4:4 A4:4 E4:8', p2o=dict(duty=0.25, kind='pad', vol=0.55), tri='A2:4 G2:4 F2:4 A1:8', noise='............g', nvol=0.8)])
T['j_save'] = dict(loop=False, sections=[dict(bpm=120, transpose=0, p1='A5:1 G5:1 E5:2 D5:2 C5:2 ~G5:10', p1o=dict(duty=0.25, kind='pluck'),
    p2='r:2 C5:2 A4:2 G4:2 E5:10', p2o=dict(duty=0.5, kind='pluck', vol=0.6), tri='C3:8 G2:10', noise='w.w.v.......v', nvol=0.8)])
# a creature joins: a little hop and a heartbeat
T['j_join'] = dict(loop=False, sections=[dict(bpm=150, transpose=5, p1='C5:1 E5:1 G5:2 E5:1 G5:1 C6:2 r:2 A5:1 C6:1 ~E6:12', p1o=dict(duty=0.125, kind='pluck'),
    p2='r:4 C5:2 r:2 E5:2 r:2 G5:12', p2o=dict(duty=0.5, kind='pad', vol=0.55), tri='C3:4 G2:4 C3:16', noise='w.w.w...k.k.....c')])

NAMES = {
    'title': ('萬妖鈴', 'The Bell of Ten Thousand Beasts'),
    'town': ('市井', 'Market Streets'),
    'town2': ('水鄉茶館', 'A Teahouse in the Water Country'),
    'town3': ('北雁關', 'Beiyan Pass'),
    'village': ('杏花炊煙', 'Cookfire Smoke among the Apricot Blossoms'),
    'camp': ('百獸山寨', 'The Hundred Beasts Camp'),
    'field': ('江湖再行', 'Back on the Road of the Jianghu'),
    'sea': ('破浪', 'Breaking the Waves'),
    'dungeon': ('幽洞', 'Hollow Dark'),
    'temple': ('鈴音寺', 'The Bell Temple'),
    'mansion': ('舊宅幽魂', 'The Ghost of the Old Mansion'),
    'tower': ('萬妖塔', 'The Tower of Ten Thousand Beasts'),
    'battle': ('群戰', 'Many Against Many'),
    'boss': ('宗門魔影', 'Shadows of the Sect'),
    'final': ('鈴心決戰', 'Battle at the Heart of the Bell'),
    'beasts': ('萬妖亂舞', 'Riot of Ten Thousand Beasts'),
    'ending': ('江湖又一年', 'Another Year in the Jianghu'),
    'j_win': ('旗開得勝', 'Victory at the First Banner'),
    'j_level': ('功力精進', 'Inner Strength Grows'),
    'j_inn': ('一夜好眠', "A Night's Good Rest"),
    'j_item': ('神兵到手', 'A Treasure in Hand'),
    'j_over': ('壯志未酬', 'Ambition Unfulfilled'),
    'j_save': ('說書記事', 'The Storyteller Writes It Down'),
    'j_join': ('新夥伴', 'A New Friend'),
}


def main(which):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    meta_path = os.path.join(OUT, 'tracks.json')
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
    for name in which:
        y, loop = render_track(name, T[name])
        wav = os.path.join(TMP, name + '.wav')
        write_wav(wav, y)
        encode(wav, name)
        dur = round(len(y) / SR, 3)
        zh, en = NAMES[name]
        meta[name] = {'zh': zh, 'en': en, 'loop': loop, 'dur': dur}
        pk = 20 * np.log10(np.abs(y).max())
        print('%-8s %6.2fs loop=%-5s peak %.2f dBFS rms %.1f dB dc %.1e' % (
            name, dur, loop, pk, 20 * np.log10(gated_rms(y)), y.mean()))
    meta = {k: meta[k] for k in NAMES if k in meta}
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:] or list(T))
