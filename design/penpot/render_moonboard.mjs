import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = 'design/exports/moonboard';
const inventory = JSON.parse(
  fs.readFileSync('design/explorations/moonboard/inventory.json', 'utf8')
);
const fontFiles = [
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
  [700, 'Bold'],
  [800, 'ExtraBold'],
].map(
  ([weight, suffix]) =>
    `node_modules/@expo-google-fonts/geist-mono/${weight}${suffix}/GeistMono_${weight}${suffix}.ttf`
);
const font = { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Geist Mono' };
for (const board of inventory) {
  const svg = fs.readFileSync(path.join(root, `${board.key}.svg`), 'utf8');
  const png = new Resvg(svg, { font, fitTo: { mode: 'zoom', value: board.width > 400 ? 1 : 2 } })
    .render()
    .asPng();
  fs.writeFileSync(path.join(root, `${board.key}.png`), png);
}
// One contact sheet per flow, keyed by the letter that starts each board name.
const flows = [...new Set(inventory.filter((b) => b.width < 400).map((b) => b.name[0]))];
for (const flow of flows) {
  const boards = inventory.filter((b) => b.width < 400 && b.name[0] === flow);
  const cell = 300,
    height = Math.max(...boards.map((b) => (b.height * 280) / b.width)) + 60;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${boards.length * cell + 20}" height="${height}"><rect width="100%" height="100%" fill="#e3e4df"/>`,
  ];
  boards.forEach((board, i) => {
    const data = fs.readFileSync(path.join(root, `${board.key}.png`)).toString('base64');
    parts.push(
      `<text x="${20 + i * cell}" y="24" font-family="Geist Mono" font-size="11">${board.name.replace(/&/g, '&amp;')}</text><image x="${20 + i * cell}" y="40" width="280" height="${(board.height * 280) / board.width}" href="data:image/png;base64,${data}"/>`
    );
  });
  parts.push('</svg>');
  fs.writeFileSync(
    path.join(root, `review-${flow}.png`),
    new Resvg(parts.join(''), { font, fitTo: { mode: 'zoom', value: 2 } }).render().asPng()
  );
}
console.log(`Rendered ${inventory.length} MoonBoard boards and ${flows.length} review sheets.`);
