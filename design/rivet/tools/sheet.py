"""python sheet.py out.png first last : contact sheet of rendered spreads."""
import sys, glob
from PIL import Image
out, a, z = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
import os, time
NEWEST = max(os.path.getmtime(f) for f in glob.glob('/home/jacob/workspace/67slopers/design/.local/rivet/renders/*.png'))
import json
MAN = set(json.load(open('/home/jacob/workspace/67slopers/design/.local/rivet/renders/manifest.json')))
fs = [f for f in sorted(glob.glob('/home/jacob/workspace/67slopers/design/.local/rivet/renders/*.png')) if a <= int(f.split('/')[-1][:2]) <= z and f.split('/')[-1] in MAN]
ims = [Image.open(f) for f in fs]; w, h = ims[0].size
sheet = Image.new('RGB', (w * 2 + 20, (h + 20) * ((len(ims) + 1) // 2)), '#888')
for i, im in enumerate(ims): sheet.paste(im, ((i % 2) * (w + 20), (i // 2) * (h + 20)))
sheet.save(out)
