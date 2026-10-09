import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = 'design/exports/design-system';
const library = JSON.parse(fs.readFileSync('design/foundations/library.json', 'utf8'));
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
for (const board of library.boards) {
  const svg = fs.readFileSync(path.join(root, `${board.key}.svg`), 'utf8');
  fs.writeFileSync(path.join(root, `${board.key}.png`), new Resvg(svg, { font }).render().asPng());
}
for (const [index, page] of library.pages.entries()) {
  const boards = library.boards.filter((b) => b.pageId === page.id);
  const width = 1500,
    height = Math.ceil(boards.length / 3) * 670 + 40;
  const items = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#dfe0db"/>`,
  ];
  boards.forEach((board, i) => {
    const data = fs.readFileSync(path.join(root, `${board.key}.png`)).toString('base64');
    items.push(
      `<image x="${20 + (i % 3) * 500}" y="${20 + Math.floor(i / 3) * 670}" width="460" height="${(board.height * 460) / 1200}" href="data:image/png;base64,${data}"/>`
    );
  });
  items.push('</svg>');
  fs.writeFileSync(
    path.join(root, `review-${index + 1}.png`),
    new Resvg(items.join(''), { font }).render().asPng()
  );
}
console.log(`Rendered ${library.boards.length} design-system boards and 3 review sheets.`);
