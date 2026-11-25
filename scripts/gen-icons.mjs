// Rivet: one vector source for every platform icon and the splash image, the Pitch symbol from the
// brand kit (design/rivet/kit/logo/rivet-app-icon.svg). The app icon is the Hang screen in miniature:
// the symbol in Night on Glow. Dark (iOS): the symbol in Glow on Night. Tinted/themed: system colours.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NIGHT = '#141A2E';
const GLOW = '#F28C6E';

// Three equal bars, each a step higher, in a 100-unit box (PITCH in src/lib/logo-motion.ts).
const BARS = [
  [9, 35],
  [39, 21],
  [69, 7],
];
const pitch = (fill) =>
  BARS.map(
    ([x, y]) => `<rect x="${x}" y="${y}" width="22" height="58" rx="11" fill="${fill}"/>`
  ).join('');
// The symbol's box at `fraction` of a 1024 canvas, centred (the tight bounds are centred in the box).
const centred = (fill, fraction) => {
  const box = 1024 * fraction;
  const offset = (1024 - box) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${box / 100})">${pitch(fill)}</g>`;
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

// The kit's construction: the box is 66 % of the tile.
const ICON = 0.66;
// Android shows only the middle 72 of the adaptive layer's 108 dp, so the same look needs 66 % of 72/108.
const ADAPTIVE = ICON * (72 / 108);

const full = svg(`<rect width="1024" height="1024" fill="${GLOW}"/>${centred(NIGHT, ICON)}`);
write('assets/icon.svg', full);
write('assets/images/icon.png', png(full, 1024));
write('assets/images/android-icon-foreground.png', png(svg(centred(NIGHT, ADAPTIVE)), 1024));
write('assets/images/android-icon-monochrome.png', png(svg(centred('#FFFFFF', ADAPTIVE)), 1024));
// Splash: the symbol in Glow at its tight bounds (82 x 86 in its 100 box), for the Night launch screen.
// app.json draws it 96 wide; src/components/rivet-splash.tsx starts on exactly that frame.
write(
  'assets/images/splash-icon.png',
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 7 82 86" width="82" height="86">${pitch(GLOW)}</svg>`,
    { fitTo: { mode: 'width', value: 768 } }
  )
    .render()
    .asPng()
);
write('assets/images/favicon.png', png(full, 96));

// iOS (Icon Composer): Glow ground and a Night symbol; in dark mode a Night ground and a Glow symbol.
const srgb = (hex) =>
  'extended-srgb:' +
  [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(5)).join(',') +
  ',1.00000';
rmSync(resolve(root, 'assets/expo.icon/Assets/sloper.svg'), { force: true });
write('assets/expo.icon/Assets/pitch.svg', svg(centred(NIGHT, ICON)));
write(
  'assets/expo.icon/icon.json',
  JSON.stringify(
    {
      'fill-specializations': [
        { value: { solid: srgb(GLOW) } },
        { appearance: 'dark', value: { solid: srgb(NIGHT) } },
      ],
      groups: [
        {
          layers: [
            {
              'image-name': 'pitch.svg',
              name: 'Pitch',
              'fill-specializations': [{ appearance: 'dark', value: { solid: srgb(GLOW) } }],
            },
          ],
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
