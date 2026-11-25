// Turns every hangboard's layout.json into diagram geometry for the app.
//
//   node scripts/gen-board-diagrams.mjs
//
// Writes src/lib/boards/generated/diagrams.ts: per board its size in mm, the plate (silhouette),
// the lower tier's step when it has one, and one SVG path per hold, all in board millimetres.
// `HangboardDiagram` (src/components/hangboard-diagram.tsx) draws them: the brand photographs
// and diagrams, it never illustrates. A port of `hangboard()` in design/rivet/app/boards.py, so
// the app and the Penpot file draw the same boards.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BOARDS = [
  'beastmaker-1000',
  'beastmaker-2000',
  'tension-grindstone-mk2',
  'metolius-simulator-3d',
  'metolius-project',
  'metolius-wood-grips-compact',
  'metolius-wood-grips-deluxe',
  'fika-vetelangd',
];

const n = (v) => Number(v.toFixed(2));
const f = (v) => String(n(v));

function roundRect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  );
}

function ellipse(x, y, w, h) {
  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
  return `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
}

/** The Beastmaker's rounded end: the top strip wraps the corner and runs down the side. */
function cornerJug(h, R, W) {
  const c = 0.5523;
  const iw = h.inner.w;
  const ih = h.inner.h;
  const x1 = h.side === 'right' ? h.w : h.x + h.w;
  const hh = h.h;
  const r = Math.min(R, hh);
  const rx = r - iw;
  const ry = r - ih;
  const pts = [
    ['M', x1, 0],
    ['L', r, 0],
    ['C', r - r * c, 0, 0, r - r * c, 0, r],
    ['L', 0, hh],
    ['L', iw, hh],
    ['L', iw, r],
    ['C', iw, r - ry * c, r - rx * c, ih, r, ih],
    ['L', x1, ih],
  ];
  return (
    pts
      .map(([cmd, ...v]) => {
        const vals = h.side === 'right' ? v.map((num, i) => (i % 2 === 0 ? W - num : num)) : v;
        return cmd + vals.map(f).join(' ');
      })
      .join(' ') + ' Z'
  );
}

function topChain(outline) {
  let best = 0;
  for (let j = 0; j < outline.length; j++) {
    const [x, y] = outline[j];
    const [bx, by] = outline[best];
    if (x > bx || (x === bx && -y > -by)) best = j;
  }
  return outline.slice(0, best + 1).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function yTop(chain, px) {
  for (let i = 0; i < chain.length - 1; i++) {
    const [ax, ay] = chain[i];
    const [bx, by] = chain[i + 1];
    if (ax <= px && px <= bx) return bx === ax ? ay : ay + ((by - ay) * (px - ax)) / (bx - ax);
  }
  return px < chain[0][0] ? chain[0][1] : chain[chain.length - 1][1];
}

function ledgeOf(id) {
  const file = join(root, 'assets', 'boards', id, 'base.svg');
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(/id="lower-face"[^>]*?y1="([\d.]+)"/);
  return m ? Number(m[1]) : null;
}

const out = {};
for (const id of BOARDS) {
  const L = JSON.parse(readFileSync(join(root, 'hangboard-models', id, 'layout.json'), 'utf8'));
  const bw = L.size_mm.width;
  const bh = L.size_mm.height;
  const R = Math.min(L.corner_radius_mm ?? 8, bh / 2);
  const outline = L.outline;
  const plate = outline
    ? 'M' + outline.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z'
    : roundRect(0, 0, bw, bh, R);
  const ledgeY = L.lower_tier ? ledgeOf(id) : null;
  const inset = R > 20 ? R * 0.35 : 0;
  const ledge = ledgeY ? { x: n(inset + 4), y: n(ledgeY), w: n(bw - 2 * inset - 8) } : null;
  const holds = [];
  for (const h of L.holds) {
    const { x: hx, y: hy, w: hw, h: hh } = h;
    const shape = h.shape ?? 'rect';
    let d;
    let faint = false;
    if (shape === 'corner') d = cornerJug(h, R, bw);
    else if (shape === 'circle') d = ellipse(hx, hy, hw, hh);
    else if (shape === 'stadium') d = roundRect(hx, hy, hw, hh, Math.min(hw, hh) / 2);
    else if (outline && hy < 60) {
      // A rail on a shaped top follows the board's own outline, so it never leaves the board.
      const chain = topChain(outline);
      const g = 2.5;
      const xs = Array.from({ length: 9 }, (_, i) => hx + g + ((hw - 2 * g) * i) / 8);
      const top = xs.map((px) => Math.max(hy, yTop(chain, px)) + g);
      const bottom = hy + hh - g;
      if (Math.min(...top) >= bottom - 2) continue;
      const pts = [
        ...xs.map((px, i) => [px, Math.min(top[i], bottom - 2)]),
        [xs[xs.length - 1], bottom],
        [xs[0], bottom],
      ];
      d = 'M' + pts.map(([px, py]) => `${f(px)} ${f(py)}`).join(' L') + ' Z';
      faint = true;
    } else {
      // Flat edges and top strips: separate strips with a small gap and soft corners.
      const g = 1.5;
      const top = hy <= 0.5;
      d = roundRect(
        hx + g,
        hy + (top ? 2 : g),
        hw - 2 * g,
        hh - g - (top ? 2 : g),
        Math.min(hh / 2, 5)
      );
    }
    holds.push(faint ? { id: h.id, d, faint } : { id: h.id, d });
  }
  out[id] = { width: bw, height: bh, plate, ledge, holds };
}

const body = `// Generated by scripts/gen-board-diagrams.mjs from hangboard-models/*/layout.json. Do not edit.
import type { BoardDiagram } from '../types';

export const BOARD_DIAGRAMS: Record<string, BoardDiagram> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync(join(root, 'src/lib/boards/generated/diagrams.ts'), body);
console.log(`Wrote diagrams for ${BOARDS.length} boards.`);
