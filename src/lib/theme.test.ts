import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { DARK_THEME, LIGHT_THEME } from './theme-tokens';

/** Keep NativeWind tokens and SVG/navigation inline colours in sync. */
test('light and dark CSS palettes match the inline theme', () => {
  const css = readFileSync(new URL('../global.css', import.meta.url), 'utf8');
  const [light, dark] = css.split('  .dark:root {');
  const toCss = (value: string) =>
    value.startsWith('#')
      ? [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' ')
      : value;
  for (const [block, theme] of [
    [light, LIGHT_THEME],
    [dark, DARK_THEME],
  ] as const) {
    for (const [name, value] of Object.entries(theme)) {
      const token = name
        .replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
        .replace(/(\D)(\d)/, '$1$2');
      const match = block.match(new RegExp(`--${token}: ([^;]+);`));
      assert.ok(match, `missing --${token}`);
      assert.equal(match[1], toCss(value), `${token} palette drift`);
    }
  }
});
