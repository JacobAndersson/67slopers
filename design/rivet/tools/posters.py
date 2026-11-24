"""Page 03 Posters: print-size 5:7 poster artboards (50 x 70 cm).

Writes design/.local/rivet/posters/<name>.png (1200 px, used by the photo mockups) and
<name>.pdf (vector print master, photos at source resolution; kit.py converts it to CMYK).
"""
from book import *
from pp import Board, Scaled, uid
from ch_print import poster, series_poster, SERIES, print_poster, PRINT_SERIES, PW, PH_
bk = Book('03 Posters')
out = LOCAL / 'posters'; out.mkdir(exist_ok=True)
for old in ['allez']:  # boards renamed since; remove them so the page holds only the current set
    if uid('board', 'poster/' + old) in bk.d.p.file()['data']['pagesIndex'][bk.pg]['objects']:
        bk.d.p.update([dict(type='del-obj', id=uid('board', 'poster/' + old), pageId=bk.pg)])
    (out / f'{old}.png').unlink(missing_ok=True)
bs = []
for i, k in enumerate(['summit', 'layback', 'mist', 'peak']):
    b = Board(bk.d, bk.pg, 'poster/' + k, f'Poster · {k}', i * 1300, 0, PW, PH_, C['snow'])
    poster(Scaled(b, 0, 0, 1), k); bs.append(b)
for i, (verb, ph_) in enumerate(SERIES):
    b = Board(bk.d, bk.pg, 'poster/series-' + verb.lower(), f'Poster · {verb} Harder.', i * 1300, 1900, PW, PH_, C['night'])
    series_poster(Scaled(b, 0, 0, 1), verb, ph_); bs.append(b)
for i, (k, ph_) in enumerate(PRINT_SERIES):
    b = Board(bk.d, bk.pg, 'poster/print-' + k, f'Print · {k}', i * 1300, 3800, PW, PH_, '#FFFFFF')
    print_poster(Scaled(b, 0, 0, 1), ph_); bs.append(b)
bk.d.publish(bs)
for b in bs:
    name = b.key.split('/')[1]
    bk.d.render(b, out / f'{name}.png', 1)
    bk.d.render(b, out / f'{name}.pdf', 1, 'pdf')
    print('poster', name, flush=True)
