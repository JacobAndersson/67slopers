// Slab: one vector source for every platform icon. Colours mirror the Pulse theme.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#20221F';
const AMBER = '#F9C65D';
// Real cutouts keep foreground and monochrome layers transparent.
const mark = (
  fill
) => `<defs><mask id="slab" x="0" y="0" width="100" height="100" maskUnits="userSpaceOnUse">
  <path d="M15 74 34 22c3-8 11-12 20-10l29 7-18 56c-2 8-10 12-18 10L15 74Z" fill="#fff"/>
  <path d="m32 62 12-30 23 6-12 31Z" fill="#000"/>
  <path d="m32 62 23 7-3 9-24-6Z" fill="#fff"/>
</mask></defs><rect width="100" height="100" fill="${fill}" mask="url(#slab)"/>`;
// Optical bounds of the approved mark; adaptive layers fit inside the 66% safe zone.
const centred = (fill, fraction) => {
  const scale = (1024 * fraction) / 75;
  return `<g transform="translate(${512 - 49 * scale} ${512 - 48.5 * scale}) scale(${scale})">${mark(fill)}</g>`;
};
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${body}</svg>`;
const png = (body, size) =>
  new Resvg(body, { fitTo: { mode: 'width', value: size } }).render().asPng();
const write = (name, data) => {
  const target = resolve(root, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
  console.log('wrote', name);
};
const full = svg(`<rect width="1024" height="1024" fill="${AMBER}"/>${centred(INK, 0.67)}`);
write('assets/icon.svg', full);
write('assets/images/icon.png', png(full, 1024));
write('assets/images/android-icon-foreground.png', png(svg(centred(INK, 0.56)), 1024));
write('assets/images/android-icon-monochrome.png', png(svg(centred('#FFFFFF', 0.56)), 1024));
write('assets/images/splash-icon.png', png(svg(centred(INK, 0.8)), 512));
write('assets/images/favicon.png', png(full, 96));
write('assets/expo.icon/Assets/sloper.svg', svg(centred(INK, 0.67)));
write(
  'assets/expo.icon/icon.json',
  JSON.stringify(
    {
      fill: { solid: 'extended-srgb:0.97647,0.77647,0.36471,1.00000' },
      groups: [
        {
          layers: [{ 'image-name': 'sloper.svg', name: 'Slab' }],
          shadow: { kind: 'neutral', opacity: 0 },
          translucency: { enabled: false, value: 0 },
        },
      ],
      'supported-platforms': { circles: ['watchOS'], squares: 'shared' },
    },
    null,
    2
  ) + '\n'
);
