"""Repair text layout data written by the generators before 9 October 2026.

The first generators stored made-up text runs (`positionData`), which Penpot's exporter and
viewer draw from, and gave icon-button labels a line height that did not match their offset.
This rewrites the runs with Penpot's real layout of Geist Mono and corrects those labels.
Only text that still carries the old made-up runs is touched: anything Penpot has laid out
itself since, including every hand-edited text, is left alone. Safe to run again.
"""

import json
import recreate
from api import Penpot, ROOT


def lines(o):
    return [p for p in o['content']['children'][0]['children']]


def is_generated(o):
    """True while the runs still follow the old formula (baseline, with the line height as height)."""
    runs = o.get('positionData') or []
    if not runs: return False
    first = lines(o)[0]
    size = float(first['fontSize']); lh = float(first['lineHeight'])*size
    return abs(runs[0]['y']-o['y']-((lh-size)/2+size*.96)) < .05 and abs(runs[0]['height']-lh) < .05


def real_runs(o):
    runs = []
    for i, (line, run) in enumerate(zip(lines(o), o['positionData'])):
        size = float(line['fontSize']); lh = float(line['lineHeight'])*size
        width = len(run['text'])*size*.6
        shift = {'center': .5, 'right': 1}.get(line.get('textAlign'), 0)*(run['width']-width)
        runs.append(run | dict(x=run['x']+shift, y=o['y']+i*lh+round((lh+size*1.3)/2), width=width, height=round(size*1.3)))
    return runs


def main():
    p = Penpot(); data = p.file()['data']
    backup = ROOT/'design/.local/before-text-repair.penpot'
    if not backup.exists(): p.export(backup)
    recreate.foundations(); recreate.app_screens(); recreate.builder_screens(); recreate.timer_screens()
    recreate.sharing_screens(); recreate.storyboards()
    fresh = {o['id']: (b.page, o) for b in recreate.SCENE.boards for o in b.objects if o['type'] == 'text'}
    changes = []; relaid = 0
    for page_id, page in data['pagesIndex'].items():
        for o in page['objects'].values():
            if o['type'] != 'text' or not is_generated(o): continue
            new = fresh.get(o['id'])
            if new and new[0] == page_id and new[1]['height'] != o['height']:
                # An icon-button label: same top, taller line, so the label centres on its icon.
                value = {k: new[1][k] for k in ('height', 'selrect', 'points', 'content', 'positionData')}; relaid += 1
            else: value = dict(positionData=real_runs(o))
            changes.append(dict(type='mod-obj', id=o['id'], pageId=page_id, operations=[dict(type='assign', value=value)]))
    for i in range(0, len(changes), 400): p.update(changes[i:i+400])
    print(f'Repaired {len(changes)} text shapes, {relaid} of them icon-button labels.')
    if changes: print('Export bytes', p.export(ROOT/'design/penpot/67slopers.penpot'))


if __name__ == '__main__': main()
