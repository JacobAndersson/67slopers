// Generates every app icon asset from one vector design: a chalked sloper in the Stella palette.
//
//   npm run icons
//
// Writes assets/icon.svg (reference), assets/images/{icon,android-icon-foreground,
// android-icon-monochrome,splash-icon,favicon}.png and assets/expo.icon/Assets/sloper.svg.
// Colours mirror src/lib/theme.ts; change both if the palette changes.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => resolve(root, p);

// Stella palette as hex (hsl values from src/global.css)
const C = {
  background: '#FFFFFF', // 0 0% 100%
  muted: '#F6F1EA', // 35 40% 94%
  primary: '#FFC16B', // 35 100% 71%
  chart2: '#EBA747', // 35 80% 60%
  chart3: '#CC8C33', // 35 60% 50%
  chart4: '#8F6D3D', // 35 40% 40%
};

const SIZE = 1024;
const DEPTH = 44; // offset of the darker underside

// Face-on sloper: an organic, potato-shaped hold.
const BLOB =
  'M 250 230 C 420 120 700 140 850 280 C 970 400 940 640 820 760 C 700 880 420 900 280 800 C 130 700 90 480 160 340 C 190 280 220 250 250 230 Z';
// Bounding box of BLOB plus the depth offset, used to centre the hold on layers.
const BBOX = { x: 118, y: 156, w: 830, h: 720 + DEPTH };

const BOLT = { cx: 530, cy: 560, r: 58 };

// Chalk fingerprints from a hand palming the hold. [x, y, rx, ry, pointAtX, pointAtY]
const PALM = [420, 640];
const PRINTS = [
  [372, 340, 44, 64, ...PALM],
  [520, 330, 44, 64, ...PALM],
  [655, 400, 44, 64, ...PALM],
  [730, 530, 44, 64, ...PALM],
  [268, 548, 48, 68, 480, 620], // thumb
];

const printAngle = (x, y, px, py) => ((Math.atan2(py - y, px - x) * 180) / Math.PI + 90).toFixed(1);

const prints = (fill, opacity = 0.92, filter = '') =>
  PRINTS.map(
    ([x, y, rx, ry, px, py]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${printAngle(x, y, px, py)} ${x} ${y})" fill="${fill}" opacity="${opacity}"${filter}/>`
  ).join('');

const chalkFilter = `<filter id="chalk" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`;

// The hold itself, without background: underside, top, bolt hole, chalk.
const hold = () => `
  <defs>${chalkFilter}</defs>
  <path d="${BLOB}" fill="${C.chart2}" transform="translate(0 ${DEPTH})"/>
  <path d="${BLOB}" fill="${C.primary}"/>
  <circle cx="${BOLT.cx}" cy="${BOLT.cy}" r="${BOLT.r}" fill="${C.chart3}"/>
  <circle cx="${BOLT.cx}" cy="${BOLT.cy}" r="${BOLT.r * 0.5}" fill="${C.chart4}"/>
  ${prints(C.background, 0.92, ' filter="url(#chalk)"')}
`;

// Single-colour silhouette with the bolt hole and prints cut out (Android themed icons).
const silhouette = () => `
  <defs>
    <mask id="cut">
      <path d="${BLOB}" fill="#fff" transform="translate(0 ${DEPTH})"/>
      <path d="${BLOB}" fill="#fff"/>
      <circle cx="${BOLT.cx}" cy="${BOLT.cy}" r="${BOLT.r}" fill="#000"/>
      ${prints('#000', 1)}
    </mask>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="#fff" mask="url(#cut)"/>
`;

// Scale the hold about the canvas centre so its bounding box is `scale` of the canvas.
const centred = (inner, scale) => {
  const s = (SIZE * scale) / Math.max(BBOX.w, BBOX.h);
  const cx = BBOX.x + BBOX.w / 2;
  const cy = BBOX.y + BBOX.h / 2;
  return `<g transform="translate(${SIZE / 2 - s * cx} ${SIZE / 2 - s * cy}) scale(${s})">${inner}</g>`;
};

const svg = (body, size = SIZE) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${size}" height="${size}">${body}</svg>`;

const png = (markup, size) =>
  new Resvg(markup, { fitTo: { mode: 'width', value: size } }).render().asPng();

const write = (path, data) => {
  mkdirSync(dirname(out(path)), { recursive: true });
  writeFileSync(out(path), data);
  console.log('wrote', path);
};

// 1. Full icon: cream background, hold at 81% of the canvas (iOS/App Store, Expo Go, web).
const full = svg(
  `<rect width="${SIZE}" height="${SIZE}" fill="${C.muted}"/>${centred(hold(), 0.81)}`
);
write('assets/icon.svg', full);
write('assets/images/icon.png', png(full, 1024));

// 2. Android adaptive icon. The foreground must stay inside the central 66% safe zone
//    (the launcher mask can be a circle); background colour is set in app.json.
write('assets/images/android-icon-foreground.png', png(svg(centred(hold(), 0.6)), 1024));
write('assets/images/android-icon-monochrome.png', png(svg(centred(silhouette(), 0.6)), 1024));

// 3. Splash image: the hold alone on transparent, shown on the app background colour.
write('assets/images/splash-icon.png', png(svg(centred(hold(), 0.96)), 512));

// 4. Web favicon: the hold alone, filling the tile.
write('assets/images/favicon.png', png(svg(centred(hold(), 0.98)), 96));

// 5. iOS Icon Composer layer (assets/expo.icon/icon.json references it).
write('assets/expo.icon/Assets/sloper.svg', svg(centred(hold(), 0.81)));
