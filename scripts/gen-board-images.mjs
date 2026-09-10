// Rasterises every hangboard for the app from hangboard-models/<board>/layout.json.
//
//   npm run boards
//
// For each board it writes:
//   assets/boards/<board>/base.png            the board in the app palette, 2 px per mm
//   assets/boards/<board>/holds/<hold>.png    one highlight overlay per hold, cropped to the
//                                              hold plus a glow margin, transparent elsewhere
//   src/lib/boards/generated/<board>.ts       the manifest: hold data, boxes and overlay
//                                              rectangles as fractions of the board (pure data,
//                                              safe to import from Node tests)
//   src/lib/boards/generated/index.ts         the list of boards
//   src/lib/boards/generated/images.ts        require() calls for every image, imported only
//                                              by the board view so logic never touches assets
//
// A hang shows one grip, so the app composes base + one or two overlays; nothing is drawn at
// runtime. Positions are fractions of the board (viewBox 0 0 W H, no padding), so the same
// numbers place overlays at any rendered width.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BOARDS = ['beastmaker-1000', 'beastmaker-2000'];
const SCALE = 2; // px per mm
const GLOW_MM = 8; // margin around each hold overlay for the glow

// Stella palette, mirrored from src/global.css.
const C = {
  body: '#E8DBC9', // 35 40% 85% (border)
  strip: '#D6C3A9', // top sloper/jug band, a shade darker than the body
  hold: '#7A6952', // 35 20% 40% (muted-foreground)
  outline: '#8F6D3D', // chart-4
  primary: '#FFC16B', // 35 100% 71%
  edge: '#CC8C33', // chart-3
};

const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

/** SVG element for a hold, mirroring holdPath() in gen-hangboard-models.mjs. */
function holdShape(h, attrs) {
  if (h.shape === 'circle') {
    const r = Math.min(h.w, h.h) / 2;
    return `<circle cx="${h.x + h.w / 2}" cy="${h.y + h.h / 2}" r="${r}" ${attrs}/>`;
  }
  const rx = h.shape === 'rect' ? 7 : h.h / 2;
  return `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="${rx}" ${attrs}/>`;
}

function boardCornerRadius(id) {
  // The user's board.svg knows the corner radius; fall back to a gentle one.
  try {
    const svg = readFileSync(join(root, 'hangboard-models', id, 'board.svg'), 'utf8');
    const m = /<rect id="board"[^>]*\brx="(\d+(?:\.\d+)?)"/.exec(svg);
    if (m) return Number(m[1]);
  } catch {
    // no svg, use the default
  }
  return 12;
}

function baseSvg(layout, W, H) {
  const rx = boardCornerRadius(layout.id);
  const holds = layout.holds
    .map((h) => {
      const top = h.shape === 'rect';
      return holdShape(
        h,
        `fill="${top ? C.strip : C.hold}" stroke="${C.outline}" stroke-width="${top ? 0.8 : 0.6}"`
      );
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * SCALE}" height="${H * SCALE}">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${rx}" fill="${C.body}" stroke="${C.outline}" stroke-width="1"/>
${holds}
</svg>`;
}

/** Overlay for one hold: glow, then the hold itself, cropped to its box plus the glow margin. */
function overlaySvg(h, W, H) {
  const x0 = Math.max(0, h.x - GLOW_MM);
  const y0 = Math.max(0, h.y - GLOW_MM);
  const x1 = Math.min(W, h.x + h.w + GLOW_MM);
  const y1 = Math.min(H, h.y + h.h + GLOW_MM);
  const w = x1 - x0;
  const hh = y1 - y0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${hh}" width="${w * SCALE}" height="${hh * SCALE}">
<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
${holdShape(h, `fill="${C.primary}" stroke="${C.primary}" stroke-width="6" opacity="0.55" filter="url(#glow)"`)}
${holdShape(h, `fill="${C.primary}" stroke="${C.edge}" stroke-width="1.2"`)}
</svg>`;
  return { svg, box: { x: x0, y: y0, w, h: hh } };
}

const png = (svg) => new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();

function write(p, data) {
  mkdirSync(dirname(join(root, p)), { recursive: true });
  writeFileSync(join(root, p), data);
}

const fraction = (v, total) => Number((v / total).toFixed(5));

const manifests = [];
for (const id of BOARDS) {
  const layout = read(`hangboard-models/${id}/layout.json`);
  const W = layout.size_mm.width;
  const H = layout.size_mm.height;
  const assetDir = `assets/boards/${id}`;
  rmSync(join(root, assetDir), { recursive: true, force: true });

  write(`${assetDir}/base.png`, png(baseSvg(layout, W, H)));

  const holds = layout.holds.map((h) => {
    const { svg, box } = overlaySvg(h, W, H);
    write(`${assetDir}/holds/${h.id}.png`, png(svg));
    return {
      id: h.id,
      label: h.label,
      side: h.side,
      row: h.row,
      pair: h.pair ?? null,
      type: h.type,
      fingers: h.fingers ?? null,
      depth: h.depth_mm ?? null,
      angle: h.angle_deg ?? null,
      box: { x: fraction(h.x, W), y: fraction(h.y, H), w: fraction(h.w, W), h: fraction(h.h, H) },
      overlay: {
        file: `${assetDir}/holds/${h.id}.png`,
        x: fraction(box.x, W),
        y: fraction(box.y, H),
        w: fraction(box.w, W),
        h: fraction(box.h, H),
      },
    };
  });

  const name = `${layout.brand} ${layout.model.replace(/ Series$/, '')}`;
  const holdsTs = holds
    .map((h) => {
      const { overlay, ...rest } = h;
      const data = JSON.stringify(rest).slice(1, -1);
      const ov = JSON.stringify({ x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h });
      return `    { ${data}, "overlay": ${ov} },`;
    })
    .join('\n');
  const ts = `// Generated by scripts/gen-board-images.mjs from hangboard-models/${id}/layout.json. Do not edit.
import type { BoardManifest } from '../types';

const board: BoardManifest = {
  id: '${id}',
  name: '${name}',
  width: ${W},
  height: ${H},
  holds: [
${holdsTs}
  ],
};

export default board;
`;
  write(`src/lib/boards/generated/${id}.ts`, ts);
  manifests.push({
    id,
    base: `${assetDir}/base.png`,
    holds: holds.map((h) => [h.id, h.overlay.file]),
  });
  console.log(`${id}: base + ${holds.length} overlays`);
}

const index = `// Generated by scripts/gen-board-images.mjs. Do not edit.
${BOARDS.map((id) => `import ${id.replace(/-/g, '_')} from './${id}';`).join('\n')}

export const BOARD_MANIFESTS = {
${BOARDS.map((id) => `  '${id}': ${id.replace(/-/g, '_')},`).join('\n')}
} as const;

export type BoardId = keyof typeof BOARD_MANIFESTS;
`;
write('src/lib/boards/generated/index.ts', index);

const rel = (file) => `require('../../../../${file}')`;
const images = `// Generated by scripts/gen-board-images.mjs. Do not edit.
// Image sources for every board; only the board view imports this module.
import type { BoardId } from './index';

export const BOARD_IMAGES: Record<BoardId, { base: number; holds: Record<string, number> }> = {
${manifests
  .map(
    (m) => `  '${m.id}': {
    base: ${rel(m.base)},
    holds: {
${m.holds.map(([hid, file]) => `      '${hid}': ${rel(file)},`).join('\n')}
    },
  },`
  )
  .join('\n')}
};
`;
write('src/lib/boards/generated/images.ts', images);
console.log('wrote', manifests.map((m) => m.id).join(', '));
