// Rasterises every hangboard for the app from hangboard-models/<board>/layout.json.
//
//   npm run boards
//
// For each board it writes:
//   assets/boards/<board>/base.png            the board in the app palette, 2 px per mm
//   assets/boards/<board>/holds/<hold>.png    one highlight overlay per hold, cropped to the
//                                              hold plus a glow margin, transparent elsewhere
//   assets/boards/<board>/base.svg            the vector source of base.png, for inspection
//   assets/boards/<board>/highlights.svg      the board with every hold highlighted, to check
//                                              the overlay style without running the app
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

// Stella palette, mirrored from src/global.css, plus a few wood tones between its stops.
const C = {
  body: '#E8DBC9', // 35 40% 85% (border)
  strip: '#D6C3A9', // top sloper/jug band, a shade darker than the body
  stripDark: '#A88F6C', // the front face of a steep sloper
  lip: '#F6F1EA', // 35 40% 94% (muted): the flat lip of an edge catching the light
  hold: '#7A6952', // 35 20% 40% (muted-foreground): pockets and deep edges
  holdShallow: '#A08B6E', // a shallow edge, lighter because there is less cavity
  recess: '#5A4B39', // the shadow at the top of a pocket
  outline: '#8F6D3D', // chart-4
  primary: '#FFC16B', // 35 100% 71%
  edge: '#CC8C33', // chart-3
};

const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

// The board being rendered: corner radius and width, needed by corner-shaped jugs.
let CURRENT = { rx: 12, W: 580 };

/**
 * Path for a jug that wraps the rounded end of the board (shape "corner"), mirroring
 * cornerPath() in gen-hangboard-models.mjs: the strip along the top plus the strip down the
 * side, rounded by the board's corner radius.
 */
function cornerPath(h) {
  const { rx: r, W } = CURRENT;
  const inner = h.inner ?? { w: 30, h: 28 };
  const top = h.y;
  const bottom = h.y + h.h;
  if (h.side === 'right') {
    return `M${h.x} ${top}H${W - r}A${r} ${r} 0 0 1 ${W} ${top + r}V${bottom}H${W - inner.w}V${top + inner.h}H${h.x}Z`;
  }
  return `M${h.x + h.w} ${top}H${h.x + r}A${r} ${r} 0 0 0 ${h.x} ${top + r}V${bottom}H${h.x + inner.w}V${top + inner.h}H${h.x + h.w}Z`;
}

/** SVG element for a hold, mirroring holdPath() in gen-hangboard-models.mjs. */
function holdShape(h, attrs) {
  if (h.shape === 'corner') return `<path d="${cornerPath(h)}" ${attrs}/>`;
  if (h.shape === 'circle') {
    const r = Math.min(h.w, h.h) / 2;
    return `<circle cx="${h.x + h.w / 2}" cy="${h.y + h.h / 2}" r="${r}" ${attrs}/>`;
  }
  const rx = h.shape === 'rect' ? 7 : h.h / 2;
  return `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="${rx}" ${attrs}/>`;
}

function boardCornerRadius(id, layout) {
  if (layout?.corner_radius_mm) return layout.corner_radius_mm;
  // Older layouts: board.svg knows the corner radius; fall back to a gentle one.
  try {
    const svg = readFileSync(join(root, 'hangboard-models', id, 'board.svg'), 'utf8');
    const m = /<rect id="board"[^>]*\brx="(\d+(?:\.\d+)?)"/.exec(svg);
    if (m) return Number(m[1]);
  } catch {
    // no svg, use the default
  }
  return 12;
}

/** Mixes two hex colours; t = 0 gives a, t = 1 gives b. */
function mix(a, b, t) {
  const ch = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * One hold on the base board, drawn so the kind reads at a glance:
 * - slopers: a light top face that falls into a darker front band; the steeper the angle,
 *   the taller and darker the band (20° is a gentle shade, 45° a clear step)
 * - jugs: the light strip with a rounded highlight, an incut you can wrap
 * - edges: a cavity whose darkness grows with depth, with a bright flat lip along the
 *   bottom, so a 15 mm edge and a 45 mm edge look different and neither looks like a pocket
 * - pockets and monos: dark holes with a shadow under the top rim
 */
function baseHold(h, defs) {
  const id = `clip-${h.id}`;
  defs.push(`<clipPath id="${id}">${holdShape(h, '')}</clipPath>`);
  const outline = holdShape(h, `fill="none" stroke="${C.outline}" stroke-width="0.7"`);
  if (h.type === 'sloper') {
    const angle = h.angle_deg ?? 20;
    const band = Math.min(0.75, 0.2 + (angle / 45) * 0.45); // fraction of the strip in shadow
    const dark = mix(C.strip, C.stripDark, Math.min(1, angle / 45));
    const gid = `grad-${h.id}`;
    defs.push(
      `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="${C.strip}"/>` +
        `<stop offset="${(1 - band).toFixed(2)}" stop-color="${C.strip}"/>` +
        `<stop offset="1" stop-color="${dark}"/></linearGradient>`
    );
    return `${holdShape(h, `fill="url(#${gid})"`)}${outline}`;
  }
  if (h.type === 'jug') {
    let glow;
    if (h.shape === 'corner') {
      // A bright rim that follows the top and wraps around the end of the board, so the jug
      // reads as the rounded bulge you grab rather than another strip of the top.
      const { rx: r, W } = CURRENT;
      const inset = 5;
      const ri = Math.max(1, r - inset);
      const right = h.side === 'right';
      const xOuter = right ? W - inset : h.x + inset;
      const xFar = right ? h.x + 4 : h.x + h.w - 4;
      const xArc = right ? W - r : h.x + r;
      const sweep = right ? 1 : 0;
      const d = `M${xFar} ${h.y + inset}H${xArc}A${ri} ${ri} 0 0 ${sweep} ${xOuter} ${h.y + r}V${h.y + h.h - 6}`;
      glow = `<path d="${d}" fill="none" stroke="${C.lip}" stroke-width="${inset * 1.6}" stroke-linecap="round" opacity="0.75" clip-path="url(#${id})"/>`;
    } else {
      glow = `<rect x="${h.x + 6}" y="${h.y + 4}" width="${h.w - 12}" height="${h.h * 0.45}" rx="6" fill="${C.lip}" opacity="0.7" clip-path="url(#${id})"/>`;
    }
    return `${holdShape(h, `fill="${C.strip}"`)}${glow}${outline}`;
  }
  if (h.type === 'edge') {
    const depth = h.depth_mm ?? 20;
    const fill = mix(C.holdShallow, C.hold, Math.min(1, Math.max(0, (depth - 10) / 35)));
    const lipH = Math.max(2.5, Math.min(5, h.h * 0.22));
    const lip = `<rect x="${h.x}" y="${h.y + h.h - lipH}" width="${h.w}" height="${lipH}" fill="${C.lip}" clip-path="url(#${id})"/>`;
    const shade = `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h * 0.3}" fill="${C.recess}" opacity="0.5" clip-path="url(#${id})"/>`;
    return `${holdShape(h, `fill="${fill}"`)}${shade}${lip}${outline}`;
  }
  // pockets and monos
  const rim = `<ellipse cx="${h.x + h.w / 2}" cy="${h.y + h.h * 0.22}" rx="${h.w / 2}" ry="${h.h * 0.32}" fill="${C.recess}" opacity="0.6" clip-path="url(#${id})"/>`;
  return `${holdShape(h, `fill="${C.hold}"`)}${rim}${outline}`;
}

function baseSvg(layout, W, H) {
  const rx = boardCornerRadius(layout.id, layout);
  CURRENT = { rx, W };
  const defs = [];
  const holds = layout.holds.map((h) => baseHold(h, defs)).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * SCALE}" height="${H * SCALE}">
<defs>${defs.join('')}</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${rx}" fill="${C.body}" stroke="${C.outline}" stroke-width="1"/>
${holds}
</svg>`;
}

const GLOW_FILTER =
  '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>';

/** The highlight for one hold: a soft glow, then the hold itself in the primary colour. */
function highlightShapes(h) {
  return (
    holdShape(
      h,
      `fill="${C.primary}" stroke="${C.primary}" stroke-width="6" opacity="0.55" filter="url(#glow)"`
    ) + holdShape(h, `fill="${C.primary}" stroke="${C.edge}" stroke-width="1.2"`)
  );
}

/** Overlay for one hold, cropped to its box plus the glow margin. */
function overlaySvg(h, W, H) {
  const x0 = Math.max(0, h.x - GLOW_MM);
  const y0 = Math.max(0, h.y - GLOW_MM);
  const x1 = Math.min(W, h.x + h.w + GLOW_MM);
  const y1 = Math.min(H, h.y + h.h + GLOW_MM);
  const w = x1 - x0;
  const hh = y1 - y0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${hh}" width="${w * SCALE}" height="${hh * SCALE}">
<defs>${GLOW_FILTER}</defs>
${highlightShapes(h)}
</svg>`;
  return { svg, box: { x: x0, y: y0, w, h: hh } };
}

/** The base board with every hold highlighted, as one SVG to open in a browser or editor. */
function highlightsSvg(layout, W, H) {
  const base = baseSvg(layout, W, H);
  const layer = `<g id="highlights"><defs>${GLOW_FILTER}</defs>${layout.holds.map(highlightShapes).join('\n')}</g>`;
  return base.replace('</svg>', `${layer}\n</svg>`);
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
  CURRENT = { rx: boardCornerRadius(id, layout), W };

  const base = baseSvg(layout, W, H);
  write(`${assetDir}/base.png`, png(base));
  write(`${assetDir}/base.svg`, base);
  write(`${assetDir}/highlights.svg`, highlightsSvg(layout, W, H));

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
