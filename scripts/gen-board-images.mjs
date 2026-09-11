// Rasterises every hangboard for the app from hangboard-models/<board>/layout.json.
//
//   npm run boards
//
// For each board it writes:
//   assets/boards/<board>/base.png            the board in the app palette, 2 px per mm
//   assets/boards/<board>/holds/<hold>.png    one highlight overlay per hold, cropped to the
//                                              hold plus a glow margin, transparent elsewhere
//   assets/boards/<board>/base.svg            the SOURCE of base.png. Hand-edit it freely; the
//                                              generator only draws it from layout.json when it
//                                              is missing or `--draw` is passed
//   assets/boards/<board>/highlights.svg      base.svg plus every hold highlighted, to check the
//                                              overlay style without running the app
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
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALL_BOARDS = [
  'beastmaker-1000',
  'beastmaker-2000',
  'tension-grindstone-mk2',
  'metolius-simulator-3d',
  'metolius-project',
  'metolius-wood-grips-compact',
  'metolius-wood-grips-deluxe',
  'fika-vetelangd',
];
// `npm run boards -- --draw [board...]` redraws base.svg from layout.json for the named boards
// (all when none are named), replacing any hand edits.
const args = process.argv.slice(2);
const draw = args.includes('--draw');
const named = args.filter((a) => !a.startsWith('--'));
const BOARDS = named.length ? named : ALL_BOARDS;
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

// Corner radius of the board being rendered, needed by corner-shaped jugs.
let CURRENT = { id: '', rx: 12, width: 580, stepped: false };

/** Rounded jug cap, with a curved inside corner instead of a square trim strip. */
function cornerPath(h) {
  const r = Math.min(CURRENT.rx, h.h);
  const inner = h.inner ?? { w: 30, h: 28 };
  // Draw in local coordinates and reflect the right jug to keep the pair identical.
  return `M${h.w - 8} 0 Q${h.w} 0 ${h.w} 8
    V${inner.h - 8} Q${h.w} ${inner.h} ${h.w - 8} ${inner.h}
    H${inner.w + 20} Q${inner.w} ${inner.h} ${inner.w} ${inner.h + 20}
    V${h.h - 4} Q${inner.w} ${h.h} ${inner.w - 4} ${h.h}
    H0 A${r} ${r} 0 0 1 ${r} 0 Z`;
}

function holdTransform(h) {
  return h.side === 'right'
    ? `translate(${h.x + h.w} ${h.y}) scale(-1 1)`
    : `translate(${h.x} ${h.y})`;
}

/** The projected front edge falls further down the board as the slope gets steeper. */
function sloperGeometry(h) {
  const slope = Math.tan(((h.angle_deg ?? 20) * Math.PI) / 180);
  const drop = h.h * (0.4 + 0.6 * slope);
  // Only side slopers on the top edge of a board whose layout declares `stepped_top` (the
  // Beastmaker 1000, where each sloper steps down from its neighbour) get a notch and end cheek.
  const stepped = CURRENT.stepped && h.y === 0 && h.side !== 'center';
  const run = stepped ? 20 : 0;
  const notch = run * slope;
  return { drop, notch, run };
}

function sloperPath(h) {
  const { drop, notch, run } = sloperGeometry(h);
  if (CURRENT.id === 'beastmaker-2000') {
    const outer = h.x === 0 || h.x + h.w === CURRENT.width;
    const r = outer ? CURRENT.rx : 0;
    // The 2000 has one continuous top. Only its front arris steps down between slopes.
    return `M0 ${r} Q0 0 ${r} 0 H${h.w} V${drop - 5}
      Q${h.w} ${drop} ${h.w - 5} ${drop}
      H5 Q0 ${drop} 0 ${drop - 5} Z`;
  }
  return `M0 ${notch} L${run} 0 H${h.w - 3} Q${h.w} 0 ${h.w} 3
    V${drop - 3} Q${h.w} ${drop} ${h.w - 3} ${drop}
    H3 Q0 ${drop} 0 ${drop - 3} Z`;
}

/** Shared silhouette for the base artwork and its cropped selection overlay. */
function holdShape(h, attrs) {
  if (h.shape === 'corner')
    return `<path d="${cornerPath(h)}" transform="${holdTransform(h)}" ${attrs}/>`;
  if (h.type === 'sloper')
    return `<path d="${sloperPath(h)}" transform="${holdTransform(h)}" ${attrs}/>`;
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

/** Smooth carved planes on the 2000, with a rounded front arris and no cut-outs on top. */
function carvedSloper(h, selected) {
  const { drop } = sloperGeometry(h);
  const steepness = ((h.angle_deg ?? 20) - 20) / 25;
  const mid = selected ? C.primary : C.strip;
  const shade = selected ? C.edge : C.stripDark;
  const light = selected ? mix(C.primary, C.lip, 0.6) : C.lip;
  const grad = `surface-${h.id}-${selected ? 'selected' : 'base'}`;
  const clip = `surface-clip-${h.id}-${selected ? 'selected' : 'base'}`;
  return `<defs>
    <linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mix(light, mid, 0.4)}"/>
      <stop offset="0.35" stop-color="${mix(mid, shade, steepness * 0.3)}"/>
      <stop offset="0.8" stop-color="${mix(mid, shade, 0.15 + steepness * 0.6)}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <clipPath id="${clip}">${holdShape(h, '')}</clipPath>
  </defs>
  ${holdShape(h, `fill="url(#${grad})"`)}
  <g clip-path="url(#${clip})">
    <g transform="${holdTransform(h)}">
      <path d="M1 3 V${drop - 5} Q1 ${drop - 1} 6 ${drop - 1} H${h.w - 6} Q${h.w - 1} ${drop - 1} ${h.w - 1} ${drop - 5} V3"
        fill="none" stroke="${selected ? C.edge : C.outline}" stroke-width="0.9" opacity="0.45"/>
      <path d="M4 ${drop - 5} Q4 ${drop - 3} 8 ${drop - 3} H${h.w - 8} Q${h.w - 4} ${drop - 3} ${h.w - 4} ${drop - 5}"
        fill="none" stroke="${light}" stroke-width="2.5" opacity="0.7"/>
    </g>
  </g>
  <text x="${h.x + h.w / 2}" y="${h.y + drop / 2 + 3}"
    text-anchor="middle" font-family="Geist Mono" font-size="11.5" fill="${C.recess}">${h.angle_deg}°</text>`;
}

/** Sculpted top holds share their geometry and shading with the selected overlay. */
function topHold(h, selected = false) {
  if (CURRENT.id === 'beastmaker-2000' && h.type === 'sloper') return carvedSloper(h, selected);
  const outline = selected ? C.edge : C.outline;
  const light = selected ? mix(C.primary, C.lip, 0.55) : C.lip;
  const mid = selected ? C.primary : C.strip;
  const shadow = selected ? C.edge : C.stripDark;
  const stroke = `stroke="${outline}" stroke-width="0.8" stroke-linejoin="round"`;
  if (h.type === 'jug' && h.shape !== 'corner') {
    // A plain jug block or bar: a lit roll along the top, a darker undercut band below.
    const rx = h.shape === 'circle' ? h.h / 2 : Math.min(7, h.h / 2);
    const inset = Math.min(6, h.h * 0.3);
    return `<g transform="translate(${h.x} ${h.y})">
      <rect x="0" y="0" width="${h.w}" height="${h.h}" rx="${rx}" fill="${mid}" ${stroke}/>
      <path d="M${inset + 2} ${inset} H${h.w - inset - 2}" fill="none" stroke="${light}" stroke-width="${Math.max(2, inset)}" stroke-linecap="round"/>
      <path d="M${inset + 2} ${h.h - inset} H${h.w - inset - 2}" fill="none" stroke="${selected ? C.outline : C.recess}" stroke-width="${Math.max(1.5, inset * 0.6)}" stroke-linecap="round" opacity="0.7"/>
    </g>`;
  }
  if (h.type === 'jug') {
    const inner = h.inner ?? { w: 30, h: 28 };
    // The dark inside edge is the undercut; a broad lit roll sits in front of it.
    const undercut = `M${inner.w - 5} ${h.h - 3} V${inner.h + 18}
      Q${inner.w - 5} ${inner.h - 4} ${inner.w + 20} ${inner.h - 4}
      H${h.w - 9}`;
    const crest = `M10 ${h.h - 10} Q17 8 60 8 H${h.w - 12}`;
    return `<g transform="${holdTransform(h)}">
      <path d="${cornerPath(h)}" fill="${mid}" ${stroke}/>
      <path d="${undercut}" fill="none" stroke="${selected ? C.outline : C.recess}" stroke-width="7" stroke-linecap="round"/>
      <path d="${crest}" fill="none" stroke="${light}" stroke-width="9" stroke-linecap="round"/>
      <path d="M17 ${h.h - 8} Q23 17 61 17 H${h.w - 10}" fill="none" stroke="${shadow}" stroke-width="1.2" stroke-linecap="round"/>
    </g>`;
  }
  const { drop, notch, run } = sloperGeometry(h);
  const angle = h.angle_deg ?? 20;
  const caption = h.angle_deg != null ? `${angle}°` : h.depth_mm != null ? `${h.depth_mm} mm` : '';
  const face = mix(mid, shadow, (angle - 20) / 35);
  // A triangular end cheek exposes the actual ramp, and the front edge steps down by angle.
  const cheek = notch
    ? `<path d="M0 ${notch} L${run} 0 L${run} ${drop - 4} L0 ${drop - 3} Z" fill="${shadow}"/>
       <path d="M0 ${notch} L${run} 0" stroke="${light}" stroke-width="2"/>`
    : '';
  return `<g transform="${holdTransform(h)}">
    <path d="${sloperPath(h)}" fill="${face}" ${stroke}/>
    ${cheek}<path d="M${run + 3} 2 H${h.w - 5}" stroke="${light}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 ${drop - 2} H${h.w - 4}" stroke="${shadow}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <text x="${h.x + h.w / 2 + (h.side === 'left' ? 5 : h.side === 'right' ? -5 : 0)}" y="${h.y + drop / 2 + 4.5}"
    text-anchor="middle" font-family="Geist Mono" font-size="13" fill="${C.recess}">${caption}</text>`;
}

/** One hold on the base board: sculpted top holds, recessed edges and dark pockets. */
function baseHold(h, defs) {
  if (h.type === 'sloper' || h.type === 'jug') return topHold(h);
  const id = `clip-${h.id}`;
  defs.push(`<clipPath id="${id}">${holdShape(h, '')}</clipPath>`);
  const outline = holdShape(h, `fill="none" stroke="${C.outline}" stroke-width="0.7"`);
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

/** The bottom row is carved into a second, recessed face below the main rounded ledge. */
function lowerTier(layout, W, H, rx, defs) {
  const upperBottom = Math.max(...layout.holds.filter((h) => h.row === 3).map((h) => h.y + h.h));
  const lowerTop = Math.min(...layout.holds.filter((h) => h.row === 4).map((h) => h.y));
  const gap = lowerTop - upperBottom;
  const crest = upperBottom + gap * 0.35;
  const step = gap * 0.3;
  const turn = Math.min(rx, 32);
  const lift = turn * 0.45;
  const contour = (y) =>
    `M0 ${y - lift} Q${turn * 0.25} ${y} ${turn} ${y}
     H${W - turn} Q${W - turn * 0.25} ${y} ${W} ${y - lift}`;
  defs.push(
    `<clipPath id="body-clip"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${rx}"/></clipPath>`,
    `<linearGradient id="lower-face" gradientUnits="userSpaceOnUse" x1="0" y1="${crest + step}" x2="0" y2="${H}">
      <stop offset="0" stop-color="${C.stripDark}"/>
      <stop offset="0.28" stop-color="${C.strip}"/>
      <stop offset="1" stop-color="${mix(C.strip, C.body, 0.55)}"/>
    </linearGradient>`,
    `<linearGradient id="ledge-roll" gradientUnits="userSpaceOnUse" x1="0" y1="${crest}" x2="0" y2="${crest + step}">
      <stop offset="0" stop-color="${C.body}"/>
      <stop offset="0.4" stop-color="${C.strip}"/>
      <stop offset="1" stop-color="${C.stripDark}"/>
    </linearGradient>`
  );
  // All relief stays behind the hold images, preserving their positions and hit targets.
  return `<g clip-path="url(#body-clip)">
    <path d="${contour(crest)} V${H} H0 Z" fill="url(#lower-face)"/>
    <path d="${contour(crest)} v${step}
      Q${W - turn * 0.25} ${crest + step} ${W - turn} ${crest + step}
      H${turn} Q${turn * 0.25} ${crest + step} 0 ${crest + step - lift} Z" fill="url(#ledge-roll)"/>
    <path d="${contour(crest)}" fill="none" stroke="${C.lip}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="${contour(crest + step)}" fill="none" stroke="${C.outline}" stroke-width="0.8" opacity="0.55"/>
  </g>`;
}

/** The board's silhouette: a traced polygon when the layout has one, else a rounded rectangle. */
function bodyShape(layout, W, H, rx, attrs) {
  if (layout.outline?.length) {
    const d = layout.outline.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + ' Z';
    return `<path d="${d}" stroke-linejoin="round" ${attrs}/>`;
  }
  return `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${rx}" ${attrs}/>`;
}

function baseSvg(layout, W, H) {
  const rx = boardCornerRadius(layout.id, layout);
  CURRENT = { id: layout.id, rx, width: W, stepped: Boolean(layout.stepped_top) };
  const cuts = layout.holds
    .filter((h) => h.type === 'sloper' && h.side !== 'center')
    .map((h) => {
      const { run, notch } = sloperGeometry(h);
      return `<path d="M0 0 H${run} L0 ${notch} Z" transform="${holdTransform(h)}" fill="black"/>`;
    })
    .join('');
  const defs = [
    `<mask id="board-silhouette"><rect width="${W}" height="${H}" fill="white"/>${cuts}</mask>`,
  ];
  const tier = layout.lower_tier ? lowerTier(layout, W, H, rx, defs) : '';
  const holds = layout.holds.map((h) => baseHold(h, defs)).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * SCALE}" height="${H * SCALE}">
<defs>${defs.join('')}</defs>
${bodyShape(layout, W, H, rx, `fill="${C.body}" stroke="${C.outline}" stroke-width="1" mask="url(#board-silhouette)"`)}
${tier}
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
    ) +
    (h.type === 'sloper' || h.type === 'jug'
      ? topHold(h, true)
      : holdShape(h, `fill="${C.primary}" stroke="${C.edge}" stroke-width="1.2"`))
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
function highlightsSvg(base, layout) {
  const layer = `<g id="highlights"><defs>${GLOW_FILTER}</defs>${layout.holds.map(highlightShapes).join('\n')}</g>`;
  return base.replace('</svg>', `${layer}\n</svg>`);
}

const png = (svg) =>
  new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: {
      loadSystemFonts: false,
      fontFiles: [join(root, 'assets/fonts/GeistMono_500Medium.ttf')],
      defaultFontFamily: 'Geist Mono',
    },
  })
    .render()
    .asPng();

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
  rmSync(join(root, assetDir, 'holds'), { recursive: true, force: true });
  CURRENT = {
    id,
    rx: boardCornerRadius(id, layout),
    width: W,
    stepped: Boolean(layout.stepped_top),
  };

  // base.svg is the source of truth; it is drawn from the layout only when asked or missing.
  const baseFile = `${assetDir}/base.svg`;
  const hasBase = existsSync(join(root, baseFile));
  if (draw || !hasBase) {
    write(baseFile, baseSvg(layout, W, H));
    console.log(`${id}: ${hasBase ? 'redrew' : 'drew'} base.svg from layout.json`);
  }
  const base = readFileSync(join(root, baseFile), 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(base)?.[1];
  if (viewBox !== `0 0 ${W} ${H}`) {
    throw new Error(`${baseFile}: viewBox must be "0 0 ${W} ${H}" so hold overlays line up`);
  }
  write(`${assetDir}/base.png`, png(base));
  write(`${assetDir}/highlights.svg`, highlightsSvg(base, layout));

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
${ALL_BOARDS.map((id) => `import ${id.replace(/-/g, '_')} from './${id}';`).join('\n')}

export const BOARD_MANIFESTS = {
${ALL_BOARDS.map((id) => `  '${id}': ${id.replace(/-/g, '_')},`).join('\n')}
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
// Keep format:check green without a manual prettier pass.
execFileSync('npx', ['prettier', '--write', 'src/lib/boards/generated/*.ts'], {
  cwd: root,
  stdio: 'ignore',
});
console.log('wrote', manifests.map((m) => m.id).join(', '));
