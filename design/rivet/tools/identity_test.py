import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).parent))
from pp import Doc, Board; from brand import *; import brand
d = Doc(); pg = d.page('00 Test')
b = Board(d, pg, 'idtest', 'Identity test', 0, 0, 1600, 900, C['snow'])
variants = [dict(step=0, h=58), dict(step=14), dict(step=10, h=66), dict(step=18, h=50)]
for i, v in enumerate(variants):
    brand.PITCH = pitch_parts(**v); pitch(b, 80 + i * 380, 60, 260, C['night'])
    pitch(b, 80 + i * 380, 360, 48, C['night']); b.rect(160 + i*380, 340, 88, 88, C['glow'], r=22); pitch(b, 172+i*380, 352, 64, C['night'])
    b.rect(270 + i*380, 340, 88, 88, C['night'], r=22); pitch(b, 282+i*380, 352, 64, C['snow'])
brand.PITCH = pitch_parts()
lockup(b, 80, 560, 80, C['night'])
lockup(b, 900, 580, 44, C['night'], C['glow'])
pitch(b, 900, 700, 16, C['night']); pitch(b, 930, 700, 24, C['night'])
d.publish([b]); d.render(b, sys.argv[1], 0.6)
