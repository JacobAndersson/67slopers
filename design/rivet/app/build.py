"""Build the Rivet app design file in Penpot and render review PNGs.

    V=design/.local/venv/bin/python
    $V design/rivet/app/build.py              # every page
    $V design/rivet/app/build.py home timer   # only these page modules
    $V design/rivet/app/build.py --render     # also export PNGs to design/exports/rivet-app/
"""
import importlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from doc import AppDoc  # noqa: E402
import pagekit as kit  # noqa: E402

PAGES = ['p00_cover', 'p01_foundations', 'p02_components', 'p03_home', 'p04_builder', 'p05_timer', 'p06_climb',
         'p07_log', 'p08_share', 'p09_dark', 'p10_flows']
OUT = HERE.parents[1] / 'exports' / 'rivet-app'


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    render = '--render' in sys.argv
    doc = AppDoc()
    mods = [m for m in PAGES if not args or any(a in m for a in args)]
    for i, m in enumerate(mods):
        mod = importlib.import_module(m)
        mod.build(doc, PAGES.index(m))
    doc.publish()
    doc.drop_default_page()
    if not args:  # full build: remove boards this generator no longer draws (e.g. a dropped screen)
        live = {b.id for b in doc.boards}
        f = doc.p.file()
        stale = [dict(type='del-obj', id=oid, pageId=pid) for pid in doc.pages.values()
                 for oid, o in f['data']['pagesIndex'][pid]['objects'].items()
                 if o.get('parentId') == '00000000-0000-0000-0000-000000000000' and oid != '00000000-0000-0000-0000-000000000000' and oid not in live]
        if stale:
            doc.p.update(stale); print(f'removed {len(stale)} stale boards', flush=True)
    import library
    library.publish(doc)
    if render:
        OUT.mkdir(parents=True, exist_ok=True)
        for page, key, b in kit.REGISTRY:
            out = OUT / f'{key}.png'
            doc.render(b, out, scale=1)
            print('rendered', out.name, flush=True)


if __name__ == '__main__':
    main()
