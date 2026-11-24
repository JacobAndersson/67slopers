"""Placeholder photography from Wikimedia Commons and Flickr (free licences only), recorded with credits.
python photos.py fsheet <out.jpg> <query>...   -> Flickr contact sheet (CC BY, BY-SA, CC0, PDM) + <out>.json
python photos.py fget <out.json> <index> <name> -> download a Flickr pick at the largest size offered
python photos.py search "<query>" [n]      -> candidates (title, size, licence, author)
python photos.py sheet <out.jpg> <query>...  -> contact sheet of candidates, numbered, + sheet.json index
python photos.py get "<File:title>" <name>  -> design/.local/rivet/photos/<name>.jpg (<=2600px) + credits.json"""
import io, json, re, sys, urllib.request, urllib.parse
from pathlib import Path
OUT = Path(__file__).resolve().parents[2] / '.local/rivet/photos'; OUT.mkdir(parents=True, exist_ok=True)
CREDITS = OUT / 'credits.json'
UA = {'User-Agent': 'rivet-brandbook/1.0 (local design tooling; placeholder photography)'}
API = 'https://commons.wikimedia.org/w/api.php?format=json&'
def fetch(url):
    import time
    for i in range(6):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == 5: raise
            time.sleep(8 * (i + 1))
def strip(s): return re.sub(r'<[^>]+>', '', s or '').strip()
def search(q, n=20, minw=1200):
    r = json.loads(fetch(API + 'action=query&generator=search&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=330&gsrsearch=' + urllib.parse.quote(q)))
    out = []
    for p in sorted(r.get('query', {}).get('pages', {}).values(), key=lambda p: p['index']):
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        lic = strip(m.get('LicenseShortName', {}).get('value'))
        if ii['mime'] != 'image/jpeg' or ii['width'] < minw or not re.search(r'CC|Public domain|CC0', lic, re.I) or 'NC' in lic: continue
        out.append(dict(title=p['title'], w=ii['width'], h=ii['height'], lic=lic, author=strip(m.get('Artist', {}).get('value'))[:40], thumb=ii['thumburl']))
        if len(out) >= n: break
    return out
cmd = sys.argv[1]
if cmd == 'search':
    for c in search(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 20): print(f"{c['w']}x{c['h']} {c['lic']:<14} {c['title'][:80]}")
elif cmd == 'sheet':
    from PIL import Image, ImageDraw
    out = Path(sys.argv[2]); cands = []
    for q in sys.argv[3:]: cands += [c for c in search(q, 14) if c['title'] not in {x['title'] for x in cands}]
    cols = 7; W = 300; rows = (len(cands) + cols - 1) // cols; sheet = Image.new('RGB', (cols * W, rows * 230), 'white'); d = ImageDraw.Draw(sheet)
    for i, c in enumerate(cands):
        try: im = Image.open(io.BytesIO(fetch(c['thumb']))).convert('RGB'); im.thumbnail((W - 8, 200)); sheet.paste(im, ((i % cols) * W + 4, (i // cols) * 230 + 4))
        except Exception as e: print('fail', c['title'], e)
        d.rectangle(((i % cols) * W + 4, (i // cols) * 230 + 4, (i % cols) * W + 40, (i // cols) * 230 + 26), fill='black'); d.text(((i % cols) * W + 8, (i // cols) * 230 + 8), str(i), fill='white')
    sheet.save(out, quality=80); out.with_suffix('.json').write_text(json.dumps(cands, indent=1)); print(len(cands), 'candidates ->', out)
elif cmd == 'get':
    from PIL import Image
    title, name = sys.argv[2], sys.argv[3]
    r = json.loads(fetch(API + 'action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&titles=' + urllib.parse.quote(title)))
    ii = next(iter(r['query']['pages'].values()))['imageinfo'][0]; m = ii['extmetadata']
    im = Image.open(io.BytesIO(fetch(ii.get('thumburl') or ii['url']))).convert('RGB'); im.thumbnail((1920, 1920)); im.save(OUT / f'{name}.jpg', quality=88)
    c = json.loads(CREDITS.read_text()) if CREDITS.exists() else {}
    c[name] = dict(title=title, author=strip(m.get('Artist', {}).get('value')), licence=strip(m.get('LicenseShortName', {}).get('value')), url=ii['descriptionurl'], note='placeholder')
    CREDITS.write_text(json.dumps(c, indent=1)); print('saved', name, im.size, c[name]['author'][:40], c[name]['licence'])

FL_LIC = {4: 'CC BY 2.0', 5: 'CC BY-SA 2.0', 9: 'CC0', 10: 'Public domain'}
BUA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'}
def flickr(q, n=14):
    html = urllib.request.urlopen(urllib.request.Request('https://www.flickr.com/search/?sort=relevance&license=4%2C5%2C9%2C10&text=' + urllib.parse.quote(q), headers=BUA), timeout=60).read().decode()
    dec = json.JSONDecoder(); out = []; i = 0
    while len(out) < n:
        i = html.find('{"_flickrModelRegistry":"photo-lite-models"', i)
        if i < 0: break
        try: m, end = dec.raw_decode(html, i)
        except ValueError: i += 10; continue
        i = end
        sz = m.get('sizes', {}).get('data', {})
        best = None
        for k in ('k', 'h', 'b', 'l', 'c'):
            if k in sz: best = sz[k]['data']; break
        if not best or best['width'] < 1000 or m.get('license') not in FL_LIC: continue
        out.append(dict(title=m.get('title', ''), author=m.get('username') or m.get('ownerNsid'), lic=FL_LIC[m['license']], w=best['width'], h=best['height'],
                        url='https:' + best['url'], thumb='https:' + sz.get('n', sz.get('m', {'data': best}))['data']['url'], page=f"https://www.flickr.com/photos/{m.get('pathAlias') or m.get('ownerNsid')}/{m.get('id')}"))
    return out
if cmd == 'fsheet':
    from PIL import Image, ImageDraw
    out = Path(sys.argv[2]); cands = []
    for q in sys.argv[3:]: cands += [c for c in flickr(q) if c['url'] not in {x['url'] for x in cands}]
    cols = 7; Wd = 300; rows = (len(cands) + cols - 1) // cols; sheet = Image.new('RGB', (cols * Wd, max(1, rows) * 230), 'white'); dr = ImageDraw.Draw(sheet)
    for i, c in enumerate(cands):
        try: im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(c['thumb'], headers=BUA), timeout=60).read())).convert('RGB'); im.thumbnail((Wd - 8, 200)); sheet.paste(im, ((i % cols) * Wd + 4, (i // cols) * 230 + 4))
        except Exception as e: print('fail', e)
        dr.rectangle(((i % cols) * Wd + 4, (i // cols) * 230 + 4, (i % cols) * Wd + 40, (i // cols) * 230 + 26), fill='black'); dr.text(((i % cols) * Wd + 8, (i // cols) * 230 + 8), str(i), fill='white')
    sheet.save(out, quality=80); out.with_suffix('.json').write_text(json.dumps(cands, indent=1)); print(len(cands), 'candidates ->', out)
elif cmd == 'fget':
    from PIL import Image
    c = json.loads(Path(sys.argv[2]).read_text())[int(sys.argv[3])]; name = sys.argv[4]
    im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(c['url'], headers=BUA), timeout=120).read())).convert('RGB'); im.thumbnail((2400, 2400)); im.save(OUT / f'{name}.jpg', quality=88)
    cr = json.loads(CREDITS.read_text()) if CREDITS.exists() else {}
    cr[name] = dict(title=c['title'], author=c['author'], licence=c['lic'], url=c['page'], source='Flickr', note='placeholder')
    CREDITS.write_text(json.dumps(cr, indent=1)); print('saved', name, im.size, c['author'], c['lic'])
