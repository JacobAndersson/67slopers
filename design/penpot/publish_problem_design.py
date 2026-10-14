"""Publish only the revised MoonBoard problem references; keep all other live boards untouched."""

import json
from pathlib import Path

from api import Penpot, ROOT
from moonboard import (
    PAGE, SCENE, build,
)

TARGETS = ('mb-detail', 'mb-lit', 'mb-lost', 'mb-log-send', 'mb-sent', 'mb-detail-scrolled')
OWNERSHIP = ROOT / 'design/.local/moonboard-owned.json'


def main():
    build()
    SCENE.resolve()
    boards = [b for b in SCENE.boards if b.key in TARGETS]
    assert {b.key for b in boards} == set(TARGETS)
    p = Penpot()
    live = p.file()['data']['pagesIndex'][PAGE]['objects']
    owned = set(json.loads(OWNERSHIP.read_text()))
    additions = []
    all_ids = set()
    for board in boards:
        previous = set(live[board.id]['shapes']) if board.id in live else set()
        assert previous <= owned, f'{board.key}: unowned layer; stop before overwriting a manual edit'
        generated = {o['id'] for o in board.objects}
        all_ids.update(generated)
        for old in previous - generated:
            additions.append(dict(type='del-obj', id=old, pageId=PAGE))
        for obj in board.objects:
            if obj['id'] in live:
                if obj['type'] != live[obj['id']]['type']:
                    additions.append(dict(type='del-obj', id=obj['id'], pageId=PAGE))
                    old_exists = False
                else:
                    old_exists = True
            else:
                old_exists = False
            if old_exists:
                reset = dict(hidden=False, opacity=1, shadow=[], interactions=[], locked=False,
                             r1=0, r2=0, r3=0, r4=0)
                attrs = reset | {k: v for k, v in obj.items() if k not in ('id','type','shapes')}
                additions.append(dict(type='mod-obj', id=obj['id'], pageId=PAGE,
                                      operations=[dict(type='assign', value=attrs)]))
            else:
                additions.append(dict(type='add-obj', id=obj['id'], pageId=PAGE,
                                      frameId=obj['frameId'], parentId=obj['parentId'], obj=obj))
    for start in range(0, len(additions), 250):
        p.update(additions[start:start+250])
        print('Published', min(start+250, len(additions)), '/', len(additions), flush=True)
    order = [dict(type='mod-obj', id=b.id, pageId=PAGE,
                  operations=[dict(type='assign',value={'shapes':[o['id'] for o in b.objects[1:]]})])
             for b in boards]
    p.update(order)
    final = p.file()['data']['pagesIndex'][PAGE]['objects']
    for b in boards:
        assert len(final[b.id]['shapes']) == len(b.objects)-1, b.key
    # Keep the owned reference IDs in sync for future intentional regeneration.
    old_target_ids = set()
    for b in boards:
        if b.id in live:
            old_target_ids.add(b.id)
            old_target_ids.update(live[b.id].get('shapes',[]))
    OWNERSHIP.write_text(json.dumps(sorted((owned-old_target_ids)|all_ids)))
    inventory = ROOT/'design/explorations/moonboard/inventory.json'
    items = json.loads(inventory.read_text())
    for b in boards:
        row = dict(key=b.key,name=b.name,pageId=b.page,boardId=b.id,route=b.route,
                   width=b.w,height=b.h,note=b.note,shapes=len(b.objects))
        if not any(item['key'] == b.key for item in items): items.append(row)
        else: items[next(i for i,item in enumerate(items) if item['key']==b.key)] = row
    inventory.write_text(json.dumps(items,indent=2)+'\n')
    for b in boards:
        p.render(PAGE,b.id,ROOT/'design/exports/moonboard'/f'{b.key}.png',scale=2)
    print('Export bytes', p.export(ROOT/'design/penpot/67slopers.penpot'))


if __name__ == '__main__':
    main()
