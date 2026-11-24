"""Build the Rivet asset kit (design/rivet/kit): logo masters, tokens, icons, fonts, posters, motion."""
import json, shutil, subprocess
from pathlib import Path
import brand
from brand import C, SCALES, BRAND_STEP
HERE = Path(__file__).resolve().parent; RIVET = HERE.parent; KIT = RIVET / 'kit'; LOCAL = RIVET.parent / '.local/rivet'

def sym_paths(x, y, size, color):
    s = size / 100
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({s:.4f})" fill="{color}">' + ''.join(f'<path d="{d}"/>' for d in brand.PITCH) + '</g>'

def wm_path(x, y, cap_h, color):
    d, width, cap, upm = brand.wordmark_path(900); s = cap_h / cap
    return f'<path fill="{color}" transform="translate({x:.2f} {y + cap * s:.2f}) scale({s:.5f})" d="{d}"/>', width * s

def symbol_svg(color):  # tight box around the bars (9..91 x 7..93)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 7 82 86" width="82" height="86">' + sym_paths(0, 0, 100, color) + '</svg>'

def wordmark_svg(color):
    cap = 100; body, w = wm_path(0, 0, cap, color)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -12 {w:.0f} {cap * 1.32:.0f}" width="{w:.0f}" height="{cap * 1.32:.0f}">{body}</svg>'

def lockup_svg(color, sym=None):
    cap = 100; S = cap * 1.3 / 0.86; x = 0.09 * S; base = cap + 0.07 * S
    g = sym_paths(x - 0.09 * S, base - 0.93 * S + 0.0, S, sym or color)
    body, w = wm_path(x + 0.82 * S + 0.30 * S, base - cap, cap, color)
    W = x + 0.82 * S + 0.30 * S + w; top = base - 0.93 * S + 0.07 * S
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top:.1f} {W:.0f} {base - top:.0f}" width="{W:.0f}" height="{base - top:.0f}">{g}{body}</svg>'

def stacked_svg(color, sym=None):
    cap = 100; S = cap * 2.4; d, width, capu, upm = brand.wordmark_path(900); ww = width * cap / capu
    W = max(S * 0.82, ww); cx = W / 2
    g = sym_paths(cx - S / 2, 0, S, sym or color)
    body, _ = wm_path(cx - ww / 2, S * 0.93 + cap * 0.55, cap, color)
    H = S * 0.93 + cap * 1.6
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {0.07 * S:.0f} {W:.0f} {H - 0.07 * S:.0f}" width="{W:.0f}" height="{H - 0.07 * S:.0f}">{g}{body}</svg>'

def fit(svg):
    """Re-crop an SVG's viewBox to its painted bounds (measured on a raster), with no padding."""
    import re, io
    from PIL import Image
    vb = list(map(float, re.search(r'viewBox="([^"]+)"', svg)[1].split()))
    pad = max(vb[2], vb[3]) * 0.3; big = [vb[0] - pad, vb[1] - pad, vb[2] + 2 * pad, vb[3] + 2 * pad]
    t = re.sub(r'viewBox="[^"]+"', 'viewBox="%g %g %g %g"' % tuple(big), svg); t = re.sub(r' width="[^"]+" height="[^"]+"', '', t, count=1)
    k = 4; W = int(big[2] * k)
    im = Image.open(io.BytesIO(subprocess.run(['rsvg-convert', '-w', str(W)], input=t.encode(), capture_output=True, check=True).stdout))
    x0, y0, x1, y1 = im.getchannel('A').getbbox(); sc = big[2] / im.width
    nb = (big[0] + x0 * sc, big[1] + y0 * sc, (x1 - x0) * sc, (y1 - y0) * sc)
    return re.sub(r'viewBox="[^"]+"', 'viewBox="%.2f %.2f %.2f %.2f" width="%.0f" height="%.0f"' % (*nb, nb[2], nb[3]), t, count=1)

def png(svg_path, width):
    out = svg_path.with_suffix('.png')
    subprocess.run(['rsvg-convert', '-w', str(width), str(svg_path), '-o', str(out)], check=True)

if __name__ == '__main__':
    if KIT.exists(): shutil.rmtree(KIT)
    logo = KIT / 'logo'; logo.mkdir(parents=True)
    colours = {'night': C['night'], 'snow': C['snow']}
    for cn, cv in colours.items():
        for kind, fn in [('symbol', symbol_svg), ('wordmark', wordmark_svg), ('lockup', lockup_svg), ('lockup-stacked', stacked_svg)]:
            p = logo / f'rivet-{kind}-{cn}.svg'; p.write_text(fit(fn(cv))); png(p, 1600)
    for kind, fn in [('symbol', symbol_svg)]:
        p = logo / f'rivet-{kind}-glow.svg'; p.write_text(fit(fn(C['glow']))); png(p, 1600)
    p = logo / 'rivet-lockup-snow-glow.svg'; p.write_text(fit(lockup_svg(C['snow'], C['glow']))); png(p, 1600)
    # app icon master
    s = 1024
    icon = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}"><rect width="{s}" height="{s}" fill="{C["glow"]}"/>'
            + sym_paths(s * 0.17, s * 0.17, s * 0.66, C['night']) + '</svg>')
    (logo / 'rivet-app-icon.svg').write_text(icon); png(logo / 'rivet-app-icon.svg', 1024)
    # tokens
    tok = KIT / 'tokens'; tok.mkdir()
    named = {k: v for k, v in C.items()}
    scales = {k: {f'{i + 1}00': v for i, v in enumerate(vals)} for k, vals in SCALES.items()}
    roles = {'light': {'canvas': C['snow'], 'surface': '#FFFFFF', 'text': C['night'], 'text-muted': C['granite'], 'action': C['night'], 'on-action': C['snow'],
                       'state-hang': C['glow'], 'state-rest': C['glacier'], 'line': '#141A2E1F'},
             'dark': {'canvas': '#0B0F1C', 'surface': C['night'], 'text': C['snow'], 'text-muted': '#8C92A6', 'action': C['snow'], 'on-action': C['night'],
                      'state-hang': C['glow'], 'state-rest': C['glacier'], 'line': '#FFFFFF1A'}}
    other = {'radius': {'pill': 9999, 'card': 28, 'input': 12, 'app-icon': '24%'}, 'space': {'unit': 4}, 'font': {'family': 'Nunito', 'weights': [300, 400, 500, 600, 700, 800, 900]},
             'motion': {'lift': '8px', 'spring': {'stiffness': 380, 'damping': 32}, 'quick': '160ms', 'settle': '320ms', 'reduced': '120ms crossfade'},
             'glow-rule': 'Glow is the colour of the hang. It fills the Hang screen and the app icon, and colours the symbol on Night. Nowhere else.'}
    (tok / 'rivet.tokens.json').write_text(json.dumps({'color': named, 'scale': scales, 'role': roles, **other}, indent=2))
    css = [':root {'] + [f'  --{k}: {v};' for k, v in named.items()] + [f'  --{k}-{s}: {v};' for k, d in scales.items() for s, v in d.items()]
    css += [f'  --{k}: {v};' for k, v in roles['light'].items()] + ['  --radius-pill: 9999px;', '  --radius-card: 28px;', '  --radius-input: 12px;', '  --space: 4px;', "  --font: 'Nunito', system-ui, sans-serif;", '}',
            '@media (prefers-color-scheme: dark) {', '  :root {'] + [f'    --{k}: {v};' for k, v in roles['dark'].items()] + ['  }', '}']
    (tok / 'rivet.css').write_text('\n'.join(css) + '\n')
    tw = {'theme': {'extend': {'colors': {**named, **{k: d for k, d in scales.items()}}, 'fontFamily': {'sans': ['Nunito', 'system-ui', 'sans-serif']},
                                'borderRadius': {'pill': '9999px', 'card': '28px', 'input': '12px'}}}}
    (tok / 'tailwind.rivet.js').write_text('// Rivet tokens for Tailwind / NativeWind: spread into tailwind.config.js\nmodule.exports = ' + json.dumps(tw, indent=2) + ';\n')
    # icons
    ic = KIT / 'icons'; ic.mkdir()
    for f in (RIVET / 'icons' / 'custom').glob('*.svg'): shutil.copy(f, ic / f.name)
    # fonts
    fo = KIT / 'fonts'; fo.mkdir()
    for f in (RIVET / 'fonts').glob('Nunito-*.ttf'): shutil.copy(f, fo / f.name)
    (fo / 'LICENSE.txt').write_text('Nunito is licensed under the SIL Open Font License 1.1. https://openfontlicense.org\nCopyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)\n')
    # posters, motion
    po = KIT / 'posters'; po.mkdir()
    for f in (LOCAL / 'posters').glob('*.png'): shutil.copy(f, po / f.name)
    mo = KIT / 'motion'; mo.mkdir()
    for f in ['rivet-loading.svg', 'rivet-startup.svg', 'film.html', 'rivet-film.webp']: shutil.copy(RIVET / 'motion' / f, mo / f)
    print('kit built:', sum(1 for _ in KIT.rglob('*') if _.is_file()), 'files')
