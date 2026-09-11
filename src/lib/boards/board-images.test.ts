import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { Resvg } from '@resvg/resvg-js';

import { BOARD_MANIFESTS } from './generated';
import { BOARD_IDS } from './index';

/**
 * base.svg is the source of the board artwork and base.png is what the app ships. They drift
 * when someone edits the SVG without running `npm run boards`; this catches that in CI.
 */
for (const id of BOARD_IDS) {
  test(`${id}: base.png is rendered from base.svg (run npm run boards after editing)`, () => {
    const dir = `assets/boards/${id}`;
    const svg = readFileSync(`${dir}/base.svg`, 'utf8');
    const { width, height } = BOARD_MANIFESTS[id];
    assert.ok(
      svg.includes(`viewBox="0 0 ${width} ${height}"`),
      'overlays assume an unpadded board viewBox'
    );
    // Same options as scripts/gen-board-images.mjs: the labels use the bundled Geist Mono.
    const expected = new Resvg(svg, {
      fitTo: { mode: 'original' },
      font: {
        loadSystemFonts: false,
        fontFiles: ['assets/fonts/GeistMono_500Medium.ttf'],
        defaultFontFamily: 'Geist Mono',
      },
    })
      .render()
      .asPng();
    const actual = readFileSync(`${dir}/base.png`);
    assert.ok(
      expected.equals(actual),
      `${dir}/base.png is stale: edit base.svg, then run \`npm run boards\` and commit both`
    );
  });
}
