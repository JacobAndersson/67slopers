import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { BOARD_IDS, getBoard, getHold, gripFor, gripName, grips, isBoardId } from './index';

const inUnit = (v: number) => v >= 0 && v <= 1;

test('every board is registered with a consistent manifest', () => {
  assert.deepEqual(BOARD_IDS, [
    'beastmaker-1000',
    'beastmaker-2000',
    'tension-grindstone-mk2',
    'metolius-simulator-3d',
    'metolius-project',
    'metolius-wood-grips-compact',
    'metolius-wood-grips-deluxe',
    'fika-vetelangd',
  ]);
  for (const id of BOARD_IDS) {
    const board = getBoard(id)!;
    assert.ok(board.width > 0 && board.height > 0, `${id} has a size`);
    assert.ok(board.holds.length >= 10, `${id} has holds`);
    const ids = board.holds.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `${id}: unique hold ids`);
    for (const hold of board.holds) {
      const { box, overlay } = hold;
      assert.ok([box.x, box.y, box.w, box.h].every(inUnit), `${hold.id} box in unit square`);
      assert.ok([overlay.x, overlay.y, overlay.w, overlay.h].every(inUnit), `${hold.id} overlay`);
      assert.ok(overlay.x <= box.x && overlay.y <= box.y, `${hold.id} overlay contains its box`);
      assert.ok(overlay.x + overlay.w >= box.x + box.w - 1e-4, `${hold.id} overlay right edge`);
      if (hold.pair) {
        const twin = getHold(board, hold.pair);
        assert.equal(twin?.pair, hold.id, `${hold.id} pairs back`);
        assert.notEqual(twin?.side, hold.side, `${hold.id} pair is on the other side`);
      } else {
        assert.equal(hold.side, 'center', `${hold.id} without a pair sits in the centre`);
      }
    }
  }
  assert.equal(isBoardId('beastmaker-3000'), false);
  assert.equal(getBoard(undefined), undefined);
});

test('grips collapse pairs, keep centre holds and read naturally', () => {
  const bm1000 = getBoard('beastmaker-1000')!;
  const bm2000 = getBoard('beastmaker-2000')!;
  assert.equal(grips(bm1000).length, 12);
  assert.equal(grips(bm2000).length, 14);
  assert.deepEqual(gripFor(bm1000, ['edge-medium-r', 'edge-medium-l'])?.holdIds, [
    'edge-medium-l',
    'edge-medium-r',
  ]);
  assert.equal(gripName(bm1000, ['edge-medium-l', 'edge-medium-r']), 'Medium edges · 20 mm');
  assert.equal(gripName(bm1000, ['sloper-20']), '20° sloper');
  assert.equal(gripName(bm1000, ['jug-l', 'jug-r']), 'Jugs');
  assert.equal(gripName(bm1000, ['slot-flat']), 'Big flat slot · 53 mm');
  assert.equal(gripName(bm2000, ['edge-22']), '22 mm middle edge', 'no repeated depth');
  assert.match(gripName(bm2000, ['edge-top-deep-l', 'edge-top-shallow-r']), /\+/);
  assert.equal(gripFor(bm1000, ['jug-l']), undefined, 'half a pair is not a grip');
  assert.equal(gripName(bm1000, []), '');
  const rows = grips(bm1000).map((g) => g.row);
  assert.deepEqual(
    rows,
    [...rows].sort((a, b) => a - b),
    'ordered by row'
  );
});

test(
  'manifests match the layouts they were generated from',
  { skip: !existsSync('hangboard-models') },
  () => {
    for (const id of BOARD_IDS) {
      const layout = JSON.parse(readFileSync(`hangboard-models/${id}/layout.json`, 'utf8'));
      const board = getBoard(id)!;
      assert.deepEqual(
        board.holds.map((h) => h.id),
        layout.holds.map((h: { id: string }) => h.id),
        id
      );
    }
  }
);
