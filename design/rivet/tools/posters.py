"""Page 03 Posters: print-size poster artboards, exported to PNG for the 3D wall render."""
from book import *
from pp import Board, Scaled
from ch_print import poster, series_poster, SERIES, print_poster, PRINT_SERIES
bk = Book('03 Posters')
out = LOCAL / 'posters'; out.mkdir(exist_ok=True)
bs = []
for i, k in enumerate(['summit', 'layback', 'allez', 'peak']):
    b = Board(bk.d, bk.pg, 'poster/' + k, f'Poster · {k}', i * 1300, 0, 1200, 1800, C['snow'])
    poster(Scaled(b, 0, 0, 1), k); bs.append(b)
for i, (verb, ph_) in enumerate(SERIES):
    b = Board(bk.d, bk.pg, 'poster/series-' + verb.lower(), f'Poster · {verb} Harder.', i * 1300, 2000, 1200, 1800, C['night'])
    series_poster(Scaled(b, 0, 0, 1), verb, ph_); bs.append(b)
for i, (k, ph_) in enumerate(PRINT_SERIES):
    b = Board(bk.d, bk.pg, 'poster/print-' + k, f'Print · {k}', i * 1300, 4000, 1200, 1800, '#FFFFFF')
    print_poster(Scaled(b, 0, 0, 1), ph_); bs.append(b)
bk.d.publish(bs)
for b in bs: bk.d.render(b, out / f'{b.key.split("/")[1]}.png', 1)
