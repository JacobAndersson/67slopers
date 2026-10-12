import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/** Keep NativeWind tokens and SVG/navigation inline colors in sync. */
test('light and dark CSS palettes match the inline theme', async () => {
  const source = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
  const palette = (name: string) => {
    const block = source.split(`export const ${name} = {`)[1].split('} as const;')[0];
    return Object.fromEntries(
      [...block.matchAll(/(\w+): 'hsl\(([^)]+)\)'/g)].map((m) => [m[1], m[2]])
    );
  };
  const lightTheme = palette('LIGHT_THEME');
  const darkTheme = palette('DARK_THEME');
  const css = readFileSync(new URL('../global.css', import.meta.url), 'utf8');
  const light = css.split('  .dark {')[0];
  const dark = css.split('  .dark {')[1];
  for (const [name, lightValue] of Object.entries(lightTheme)) {
    const token = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const cssName = token.replace(/^chart(\d)$/, 'chart-$1');
    for (const [block, value] of [
      [light, lightValue],
      [dark, darkTheme[name]],
    ]) {
      const match = block.match(new RegExp(`--${cssName}: ([^;]+);`));
      assert.ok(match, `missing --${cssName}`);
      const normalize = (text: string) =>
        text.replace(/(\d+)\.(\d+)(?=[ %]|$)/g, (_, whole: string, fraction: string) => {
          const trimmed = fraction.replace(/0+$/, '');
          return trimmed ? `${whole}.${trimmed}` : whole;
        });
      assert.equal(normalize(value), normalize(match[1]), `${cssName} palette drift`);
    }
  }
});
