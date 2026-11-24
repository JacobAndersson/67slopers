"""Writes rivet-loading.svg and rivet-startup.svg from the brand geometry (design/rivet/tools/brand.py)."""
import sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / 'tools'))
import brand
from brand import C
d, w, cap, upm = brand.wordmark_path(900)
bars = [(9 + 30 * i, 7 + (2 - i) * 14) for i in range(3)]
rect = lambda x, y, cls: f'<rect class="{cls}" x="{x}" y="{y}" width="22" height="58" rx="11"/>'
(HERE / 'rivet-loading.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 100 114" width="100" height="114" role="img" aria-label="Loading">
<style>
.b{{fill:{C['night']};animation:lift 1.2s cubic-bezier(.3,.7,.2,1) infinite}}
.b2{{animation-delay:.12s}} .b3{{animation-delay:.24s}}
@keyframes lift{{0%,60%,100%{{transform:translateY(0)}}20%{{transform:translateY(-8px)}}38%{{transform:translateY(1.5px)}}}}
@media (prefers-reduced-motion:reduce){{.b{{animation:fade 1.6s ease-in-out infinite}}@keyframes fade{{50%{{opacity:.45}}}}}}
</style>
{rect(*bars[0], 'b b1')}{rect(*bars[1], 'b b2')}{rect(*bars[2], 'b b3')}</svg>''')
k = 0.034
(HERE / 'rivet-startup.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="720" height="440" role="img" aria-label="Rivet">
<style>
.g{{fill:{C['glow']}}}
.b{{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:rise .52s cubic-bezier(.2,.9,.25,1.12) forwards}}
.b2{{animation-delay:.08s}} .b3{{animation-delay:.16s}}
.sym{{animation:settle .4s cubic-bezier(.3,.7,.2,1) .48s both}}
.wm{{opacity:0;transform:translateY(10px);animation:in .42s cubic-bezier(.2,.8,.2,1) .62s forwards}}
@keyframes rise{{to{{transform:scaleY(1)}}}}
@keyframes settle{{from{{transform:translateY(8px)}}to{{transform:translateY(0)}}}}
@keyframes in{{to{{opacity:1;transform:none}}}}
@media (prefers-reduced-motion:reduce){{.b,.sym,.wm{{animation:none;transform:none;opacity:1}}}}
</style>
<rect width="360" height="220" fill="{C['night']}"/>
<g class="sym"><g transform="translate(141 34) scale(.78)">{rect(*bars[0], 'g b b1')}{rect(*bars[1], 'g b b2')}{rect(*bars[2], 'g b b3')}</g></g>
<g class="wm"><path fill="{C['snow']}" transform="translate({180 - w * k / 2} {150 + cap * k}) scale({k})" d="{d}"/></g>
</svg>''')
print('written')
