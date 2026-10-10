import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const root = 'design/exports/dock-icons';
const fonts = [
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
].map(
  ([weight, suffix]) =>
    `node_modules/@expo-google-fonts/geist-mono/${weight}${suffix}/GeistMono_${weight}${suffix}.ttf`
);
for (const key of ['overview', 'scale']) {
  const path = `${root}/dock-icons-${key}`;
  fs.writeFileSync(
    `${path}.png`,
    new Resvg(fs.readFileSync(`${path}.svg`), {
      font: { fontFiles: fonts, loadSystemFonts: false },
    })
      .render()
      .asPng()
  );
}
console.log('Rendered dock icon overview and optical checks.');
