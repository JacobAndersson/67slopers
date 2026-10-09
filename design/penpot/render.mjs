import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = 'design/exports/current-app';
const inventory = JSON.parse(fs.readFileSync('design/screens/inventory.json', 'utf8'));
const fonts = [
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
  [700, 'Bold'],
  [800, 'ExtraBold'],
].map(
  ([weight, suffix]) =>
    `node_modules/@expo-google-fonts/geist-mono/${weight}${suffix}/GeistMono_${weight}${suffix}.ttf`
);
const options = {
  font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Geist Mono' },
};
for (const board of inventory) {
  const svg = fs.readFileSync(path.join(root, `${board.key}.svg`), 'utf8');
  const png = new Resvg(svg, {
    ...options,
    fitTo: { mode: 'width', value: board.width > 790 ? 1120 : board.width },
  })
    .render()
    .asPng();
  fs.writeFileSync(path.join(root, `${board.key}.png`), png);
}
const pages = [...new Set(inventory.map((board) => board.pageId))];
for (const [pageIndex, page] of pages.entries()) {
  const boards = inventory.filter((board) => board.pageId === page);
  const cols = 5,
    cellWidth = 250,
    cellHeight = 570;
  const width = cols * cellWidth + 40,
    height = Math.ceil(boards.length / cols) * cellHeight + 60;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#e8e9ea"/>`,
  ];
  for (const [index, board] of boards.entries()) {
    const x = 20 + (index % cols) * cellWidth,
      y = 20 + Math.floor(index / cols) * cellHeight;
    const image = fs.readFileSync(path.join(root, `${board.key}.png`)).toString('base64');
    const h = Math.min(520, (board.height * 224) / board.width),
      w = (h * board.width) / board.height;
    parts.push(
      `<text x="${x}" y="${y + 15}" font-family="Geist Mono" font-size="12">${board.key}</text><image x="${x}" y="${y + 30}" width="${w}" height="${h}" href="data:image/png;base64,${image}"/>`
    );
  }
  parts.push('</svg>');
  fs.writeFileSync(
    `design/exports/review-${pageIndex + 1}.png`,
    new Resvg(parts.join(''), options).render().asPng()
  );
}
console.log(`Rendered ${inventory.length} boards and ${pages.length} review sheets.`);
