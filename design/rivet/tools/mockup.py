"""Photo mockups: print Rivet artwork onto real photographs of blank products.
The artwork is rendered from vector, warped into place, displaced along the fabric's folds and lit
by the photo's own shading and texture, so it reads as printed or embroidered, not pasted."""
import io, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, str(Path(__file__).parent))
import brand
from brand import C
PH = Path(__file__).resolve().parents[2] / '.local/rivet/photos'
OUT = Path(__file__).resolve().parents[2] / '.local/rivet/mock'

def svg_symbol(color):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 7 82 86">' + ''.join(f'<path d="{d}" fill="{color}"/>' for d in brand.PITCH) + '</svg>'

def svg_text(lines, color, size=100):
    d, w, cap, upm = brand.wordmark_path(900)  # ensures fonts dir known
    font = brand.FONTS_DIR / 'Nunito-900.ttf'
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = TTFont(font); gs = f.getGlyphSet(); cm = f.getBestCmap(); upm = f['head'].unitsPerEm
    paths, maxw = [], 0
    for li, line in enumerate(lines):
        x = 0
        for ch in line:
            g = cm[ord(ch)]; pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, (li + 1) * upm * 0.95)))
            paths.append(pen.getCommands()); x += gs[g].width - 0.03 * upm
        maxw = max(maxw, x)
    h = (len(lines) * 0.95 + 0.25) * upm
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {maxw:.0f} {h:.0f}"><path d="{" ".join(paths)}" fill="{color}"/></svg>'

def raster(svg, width):
    png = subprocess.run(['rsvg-convert', '-w', str(width)], input=svg.encode(), capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGBA')

def place(base, art, quad):
    """Warp art (RGBA) into quad [(x,y) tl, tr, br, bl] on a canvas the size of base."""
    W, H = base.size; w, h = art.size
    import numpy.linalg as la
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    A, B = [], []
    for (x, y), (u, v) in zip(quad, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    coeffs = la.solve(np.array(A, float), np.array(B, float))
    return art.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)

def print_on(base, layer, mode='ink', displace=6, strength=1.0):
    """mode 'ink': screen print; 'stitch': embroidery (adds raised thread texture)."""
    b = np.asarray(base.convert('RGB')).astype(np.float32) / 255
    lum = b @ np.array([0.299, 0.587, 0.114])
    blur = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))).astype(np.float32) / 255
    shade = np.clip(lum / np.maximum(blur, 0.04), 0.55, 1.45)                      # folds and creases
    fine = lum - np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    big = np.asarray(Image.fromarray((blur * 255).astype(np.uint8))).astype(np.float32) / 255
    # displacement along the fold gradient
    gy, gx = np.gradient(big)
    L = np.asarray(layer).astype(np.float32) / 255
    H, W = lum.shape; yy, xx = np.mgrid[0:H, 0:W]
    sx = np.clip(xx + gx * displace * 40, 0, W - 1).astype(int); sy = np.clip(yy + gy * displace * 40, 0, H - 1).astype(int)
    L = L[sy, sx]
    ink, a = L[..., :3], L[..., 3:4] * strength
    lit = ink * shade[..., None] * (0.82 + 0.18 * blur[..., None] / max(blur.mean(), 0.05)) + fine[..., None] * 0.9
    if mode == 'stitch':
        stripes = (np.sin((xx + yy) * 1.6) * 0.5 + 0.5)[..., None] * 0.18
        edge = np.asarray(Image.fromarray((L[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
        lit = lit * (0.9 + stripes) * (0.85 + 0.15 * edge)
        a = np.clip(a * 1.0, 0, 1)
    out = b * (1 - a) + np.clip(lit, 0, 1) * a
    return Image.fromarray((out * 255).astype(np.uint8))

def mock_tee_front():
    base = Image.open(PH / 'blank-tee-white.jpg').convert('RGB'); W, H = base.size
    art = raster(svg_symbol(C['night']), 400)
    cx, cy, s = W * 0.63, H * 0.355, W * 0.075   # left chest (wearer's left = image right)
    quad = [(cx - s / 2, cy - s * 0.52), (cx + s / 2, cy - s * 0.5), (cx + s / 2, cy + s * 0.55), (cx - s / 2, cy + s * 0.53)]
    out = print_on(base, place(base, art, quad), 'ink', displace=3)
    out.save(OUT / 'tee-front.jpg', quality=92); return out

def mock_tee_back():
    base = Image.open(PH / 'blank-tee-black.jpg').convert('RGB'); W, H = base.size
    txt = raster(svg_text(['Climb', 'Harder.'], C['snow']), 900)
    tw = W * 0.42; th = tw * txt.size[1] / txt.size[0]
    x0, y0 = W * 0.30, H * 0.22
    quad = [(x0, y0), (x0 + tw, y0 + 4), (x0 + tw, y0 + th + 4), (x0, y0 + th)]
    layer = place(base, txt, quad)
    sym = raster(svg_symbol(C['snow']), 300); ss = W * 0.08   # Glow only on Night, so Snow on black cloth
    q2 = [(x0, y0 + th + H * 0.03), (x0 + ss, y0 + th + H * 0.03), (x0 + ss, y0 + th + H * 0.03 + ss * 1.05), (x0, y0 + th + H * 0.03 + ss * 1.05)]
    l2 = place(base, sym, q2); layer = Image.alpha_composite(layer, l2)
    out = print_on(base, layer, 'ink', displace=5, strength=0.94)
    out.save(OUT / 'tee-back.jpg', quality=92); return out

def mock_cap():
    base = Image.open(PH / 'blank-cap.jpg').convert('RGB'); W, H = base.size
    art = raster(svg_symbol(C['night']), 400)
    # front panel, slightly turned: narrower on the right, tilted
    cx, cy, s = W * 0.47, H * 0.47, W * 0.12
    quad = [(cx - s * 0.46, cy - s * 0.5), (cx + s * 0.5, cy - s * 0.56), (cx + s * 0.48, cy + s * 0.45), (cx - s * 0.44, cy + s * 0.52)]
    out = print_on(base, place(base, art, quad), 'stitch', displace=4)
    out.save(OUT / 'cap.jpg', quality=92); return out

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for f in (mock_tee_front, mock_tee_back, mock_cap): f(); print('ok', f.__name__)


# ---------------- hard goods and print ----------------
def cover_art(w=1200, h=1700):
    """The Field Notes cover as a flat image."""
    from PIL import ImageDraw, ImageFont
    im = Image.new('RGB', (w, h), C['night'])
    ph = Image.open(PH / 'halfdome-glow.jpg').convert('RGB')
    s = max(w / ph.width, (h * 0.58) / ph.height); ph = ph.resize((int(ph.width * s), int(ph.height * s)))
    im.paste(ph.crop(((ph.width - w) // 2, 0, (ph.width - w) // 2 + w, int(h * 0.58))), (0, int(h * 0.42)))
    grad = Image.linear_gradient('L').resize((w, int(h * 0.2))).point(lambda v: 255 - v)
    im.paste(Image.new('RGB', (w, int(h * 0.2)), C['night']), (0, int(h * 0.42)), grad)
    d = ImageDraw.Draw(im); F9 = brand.FONTS_DIR / 'Nunito-900.ttf'; F7 = brand.FONTS_DIR / 'Nunito-700.ttf'
    sym = raster(svg_symbol(C['glow']), 120); im.paste(sym, (110, 120), sym)
    d.text((110, 300), 'Unstuck', font=ImageFont.truetype(str(F9), 170), fill=C['snow'])
    d.text((114, 500), 'How forty climbers got unstuck', font=ImageFont.truetype(str(F7), 48), fill='#C9CCD6')
    d.text((114, 580), 'RIVET FIELD NOTES  ·  VOL. 1', font=ImageFont.truetype(str(F9), 34), fill=C['snow'])
    return im.convert('RGBA')

def card_front(w=850, h=550):
    im = Image.new('RGBA', (w, h), C['night']); sym = raster(svg_symbol(C['glow']), 200)
    im.paste(sym, ((w - sym.width) // 2, (h - sym.height) // 2), sym); return im

def paper_on(base, layer, gloss=0.0, flat=False):
    """Printed paper: art takes the photo's light falloff and grain, keeps its own colour."""
    b = np.asarray(base.convert('RGB')).astype(np.float32) / 255
    lum = b @ np.array([0.299, 0.587, 0.114])
    blur = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))).astype(np.float32) / 255
    L = np.asarray(layer).astype(np.float32) / 255; ink, a = L[..., :3], L[..., 3:4]
    if flat:
        H_, W_ = lum.shape; light = (0.86 + 0.12 * np.linspace(1, 0, W_)[None, :] * np.ones((H_, 1)))[..., None]
    else: light = np.clip(blur / max(np.percentile(blur[a[..., 0] > 0.5], 90) if (a > 0.5).any() else 1, 0.05), 0.55, 1.08)[..., None]
    out = b * (1 - a) + np.clip(ink * light, 0, 1) * a
    return Image.fromarray((out * 255).astype(np.uint8))

def drop_shadow(base, quad, blur=18, off=(10, 14), opacity=0.45):
    from PIL import ImageDraw
    m = Image.new('L', base.size, 0); ImageDraw.Draw(m).polygon([(x + off[0], y + off[1]) for x, y in quad], fill=int(255 * opacity))
    m = m.filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new('RGB', base.size, (15, 12, 10))
    return Image.composite(sh, base, m)

def mock_book():
    base = Image.open(PH / 'blank-pad.jpg').convert('RGB')
    quad = [(478, 102), (994, 203), (818, 996), (232, 864)]
    out = paper_on(base, place(base, cover_art(), quad))
    out.save(OUT / 'book.jpg', quality=92); return out

def mock_card():
    base = Image.open(PH / 'blank-table.jpg').convert('RGB')
    quad = [(470, 195), (1535, 150), (1585, 860), (440, 900)]
    base = drop_shadow(base, quad, blur=22, off=(14, 18), opacity=0.5)
    out = paper_on(base, place(base, card_front(), quad), flat=True)
    out.save(OUT / 'card.jpg', quality=92); return out

def mock_frame(poster='summit'):
    base = Image.open(PH / 'blank-frame.jpg').convert('RGB')
    art = Image.open(Path(__file__).resolve().parents[2] / '.local/rivet/posters' / f'{poster}.png').convert('RGBA')
    quad = [(380, 285), (893, 438), (893, 1452), (380, 1580)]
    out = paper_on(base, place(base, art, quad))
    out.save(OUT / f'frame-{poster}.jpg', quality=92); return out

def mock_frames():
    for p in ['summit', 'layback', 'mist', 'series-hang', 'series-rest', 'series-climb']: mock_frame(p)

def mock_board():
    base = Image.open(PH / 'blank-board.jpg').convert('RGB')
    txt = raster(svg_text(['Rivet'], '#000'), 600)
    sym = raster(svg_symbol('#000'), 200)
    lock = Image.new('RGBA', (sym.width + 40 + txt.width, max(sym.height, txt.height)), (0, 0, 0, 0))
    lock.paste(sym, (0, (lock.height - sym.height) // 2), sym); lock.paste(txt, (sym.width + 40, (lock.height - txt.height) // 2), txt)
    W, H = base.size
    x0, y0, w = W * 0.075, H * 0.565, W * 0.13; h = w * lock.height / lock.width
    quad = [(x0, y0), (x0 + w, y0 - 4), (x0 + w, y0 + h - 4), (x0, y0 + h)]
    L = np.asarray(place(base, lock, quad)).astype(np.float32) / 255
    b = np.asarray(base).astype(np.float32) / 255; a = L[..., 3:4] * 0.85
    burn = b * np.array([0.42, 0.30, 0.2])                     # laser burn: darker, warmer wood
    out = b * (1 - a) + burn * a
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(OUT / 'board.jpg', quality=92)

if __name__ == '__main__' and len(sys.argv) > 1:
    for n in sys.argv[1:]: globals()[n](); print('ok', n)
