#!/usr/bin/env node
// Generates the schematic SVGs and 3D models in hangboard-models/ from each
// board's layout.json. Pure Node, no dependencies.
//
//   node scripts/gen-hangboard-models.mjs            # all boards
//   node scripts/gen-hangboard-models.mjs beastmaker-2000
//
// Outputs per board (next to layout.json):
//   board.svg   clean front view, one <path id="<hold id>"> per hold (app-ready)
//   layout.svg  same view with labels, depths and angles
//   model.obj   heightmap mesh of the board plus one flat marker group per hold
//   model.glb   the same as binary glTF 2.0 (one node per hold marker, named by id)
//
// Coordinates in layout.json: x from the left edge, y from the top edge, mm.
// 3D: X right, Y up, Z towards the climber (Z = 0 is the wall).

import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'hangboard-models');
const STEP = 1.5; // mm per heightmap cell
const FILLET = 3; // mm, softens pocket lips so normals shade nicely

// ---------- 2D shape helpers (signed distance, negative inside) ----------

function sdRect(px, py, h) {
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  const dx = Math.abs(px - cx) - h.w / 2;
  const dy = Math.abs(py - cy) - h.h / 2;
  return Math.max(dx, dy);
}

function sdStadium(px, py, h) {
  const r = Math.min(h.w, h.h) / 2;
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  const ex = Math.max(h.w / 2 - r, 0);
  const ey = Math.max(h.h / 2 - r, 0);
  const qx = Math.max(Math.abs(px - cx) - ex, 0);
  const qy = Math.max(Math.abs(py - cy) - ey, 0);
  return Math.hypot(qx, qy) - r;
}

function sdCircle(px, py, h) {
  const r = Math.min(h.w, h.h) / 2;
  return Math.hypot(px - (h.x + h.w / 2), py - (h.y + h.h / 2)) - r;
}

function sdHold(px, py, h) {
  if (h.shape === 'circle') return sdCircle(px, py, h);
  if (h.shape === 'rect') return sdRect(px, py, h);
  return sdStadium(px, py, h);
}

function smoothstep(t) {
  t = Math.min(Math.max(t, 0), 1);
  return t * t * (3 - 2 * t);
}

/** True when (x, y) lies inside the board's traced outline (or anywhere, for plain rectangles). */
function insideBoard(board, x, y) {
  const poly = board.outline;
  if (!poly?.length) return true;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---------- heightmap ----------

// Thickness of the board (distance from the wall) at front-view point (x, y).
function thicknessAt(board, x, y) {
  const D = board.size_mm.depth;
  let z = D;
  for (const h of board.holds) {
    if (h.shape === 'corner') {
      const inner = h.inner ?? { w: 30, h: 28 };
      if (x < h.x || x > h.x + h.w || y < h.y || y > h.y + h.h) continue;
      const side = h.side === 'right' ? h.x + h.w - x : x - h.x;
      const inTop = y - h.y <= inner.h;
      const inSide = side <= inner.w;
      if (!inTop && !inSide) continue;
      // 0 at the outer edge of the board, 1 where the jug meets the flat front face.
      const t = Math.min(1, inTop ? (y - h.y) / inner.h : 1, inSide ? side / inner.w : 1);
      z = Math.min(z, D - 24 * Math.cos((t * Math.PI) / 2) ** 0.7);
      continue;
    }
    if (h.type === 'sloper' || h.type === 'jug') {
      if (x < h.x || x > h.x + h.w || y < h.y || y > h.y + h.h) continue;
      if (h.type === 'sloper') {
        const tan = Math.tan(((h.angle_deg ?? 20) * Math.PI) / 180);
        const z0 = Math.max(0, D - h.h / tan);
        z = Math.min(z, z0 + (y - h.y) / tan);
      } else {
        // Jug: a rounded incut scoop at the top of the board.
        const t = (y - h.y) / h.h;
        z = Math.min(z, D - 24 * Math.cos((t * Math.PI) / 2) ** 0.7);
      }
      continue;
    }
    if (h.depth_mm == null) continue;
    const d = sdHold(x, y, h);
    if (d >= FILLET) continue;
    const inside = 1 - smoothstep((d + FILLET) / (2 * FILLET));
    // Inside the hold the board is recessed by depth_mm; the lip is filleted.
    z = Math.min(z, D - h.depth_mm * inside);
  }
  return Math.max(z, 0.5);
}

function buildMesh(board) {
  const W = board.size_mm.width;
  const H = board.size_mm.height;
  const nx = Math.round(W / STEP) + 1;
  const ny = Math.round(H / STEP) + 1;
  const sx = W / (nx - 1);
  const sy = H / (ny - 1);
  const positions = [];
  const normals = [];
  const indices = [];
  const idx = (i, j) => j * nx + i;

  // Front surface vertices. Y up, so front-view y (from top) maps to H - y.
  const zs = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      zs[idx(i, j)] = thicknessAt(board, i * sx, j * sy);
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      positions.push(i * sx, H - j * sy, zs[idx(i, j)]);
      const zl = zs[idx(Math.max(i - 1, 0), j)];
      const zr = zs[idx(Math.min(i + 1, nx - 1), j)];
      const zu = zs[idx(i, Math.max(j - 1, 0))];
      const zd = zs[idx(i, Math.min(j + 1, ny - 1))];
      // dz/dx and dz/dy(up). y index grows downwards, so flip.
      const dzdx = (zr - zl) / (2 * sx);
      const dzdy = (zu - zd) / (2 * sy);
      const n = [-dzdx, -dzdy, 1];
      const len = Math.hypot(...n);
      normals.push(n[0] / len, n[1] / len, n[2] / len);
    }
  }
  // A cell is part of the board when all four of its corners are inside the outline.
  const inside = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) inside[idx(i, j)] = insideBoard(board, i * sx, j * sy) ? 1 : 0;
  }
  const cell = (i, j) =>
    i >= 0 &&
    j >= 0 &&
    i < nx - 1 &&
    j < ny - 1 &&
    inside[idx(i, j)] &&
    inside[idx(i + 1, j)] &&
    inside[idx(i, j + 1)] &&
    inside[idx(i + 1, j + 1)];

  // Back face: the same grid at Z = 0, facing the wall.
  const backBase = positions.length / 3;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      positions.push(i * sx, H - j * sy, 0);
      normals.push(0, 0, -1);
    }
  }
  const addVert = (x, y, z, n) => {
    positions.push(x, y, z);
    normals.push(...n);
    return positions.length / 3 - 1;
  };
  // Wall between two front vertices and their back copies, facing outwards along n.
  const wall = (v0, v1, n) => {
    const f0 = addVert(positions[v0 * 3], positions[v0 * 3 + 1], positions[v0 * 3 + 2], n);
    const f1 = addVert(positions[v1 * 3], positions[v1 * 3 + 1], positions[v1 * 3 + 2], n);
    const b0 = addVert(positions[v0 * 3], positions[v0 * 3 + 1], 0, n);
    const b1 = addVert(positions[v1 * 3], positions[v1 * 3 + 1], 0, n);
    indices.push(f0, b0, f1, f1, b0, b1);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      if (!cell(i, j)) continue;
      const a = idx(i, j);
      const b = idx(i + 1, j);
      const c = idx(i, j + 1);
      const d = idx(i + 1, j + 1);
      // Front, counter-clockwise seen from +Z (the climber); back the other way round.
      indices.push(a, c, b, b, c, d);
      indices.push(
        backBase + a,
        backBase + b,
        backBase + c,
        backBase + b,
        backBase + d,
        backBase + c
      );
      // Walls wherever the neighbouring cell is missing. Edges run so the quad faces outwards.
      if (!cell(i, j - 1)) wall(b, a, [0, 1, 0]); // top edge (+Y)
      if (!cell(i, j + 1)) wall(c, d, [0, -1, 0]); // bottom edge (-Y)
      if (!cell(i - 1, j)) wall(a, c, [-1, 0, 0]); // left edge (-X)
      if (!cell(i + 1, j)) wall(d, b, [1, 0, 0]); // right edge (+X)
    }
  }

  return { positions, normals, indices };
}

// Flat marker shape for one hold, 0.6 mm in front of the board surface.
function holdMarker(board, h) {
  const D = board.size_mm.depth;
  const H = board.size_mm.height;
  const pts = outlinePoints(h, 12, board);
  const positions = [];
  const normals = [];
  const indices = [];
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  positions.push(cx, H - cy, D + 0.6);
  normals.push(0, 0, 1);
  for (const [x, y] of pts) {
    positions.push(x, H - y, D + 0.6);
    normals.push(0, 0, 1);
  }
  for (let k = 0; k < pts.length; k++) {
    indices.push(0, 1 + k, 1 + ((k + 1) % pts.length));
  }
  return { positions, normals, indices };
}

// Polygon outline (clockwise in screen space) for a hold shape.
function outlinePoints(h, segs = 12, board) {
  const pts = [];
  if (h.shape === 'corner') {
    const r = board?.corner_radius_mm ?? 8;
    const W = board?.size_mm.width ?? h.x + h.w;
    const inner = h.inner ?? { w: 30, h: 28 };
    const right = h.side === 'right';
    const ox = right ? W : h.x; // the outer edge of the board
    const dir = right ? -1 : 1; // inwards
    const far = right ? h.x : h.x + h.w;
    pts.push([far, h.y]);
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * (Math.PI / 2);
      pts.push([ox + dir * r * (1 - Math.sin(a)), h.y + r * (1 - Math.cos(a))]);
    }
    pts.push(
      [ox, h.y + h.h],
      [ox + dir * inner.w, h.y + h.h],
      [ox + dir * inner.w, h.y + inner.h],
      [far, h.y + inner.h]
    );
    return right ? pts.reverse() : pts;
  }
  if (h.shape === 'rect') {
    return [
      [h.x, h.y],
      [h.x + h.w, h.y],
      [h.x + h.w, h.y + h.h],
      [h.x, h.y + h.h],
    ];
  }
  const r = Math.min(h.w, h.h) / 2;
  const cx = h.x + h.w / 2;
  const cy = h.y + h.h / 2;
  const ex = h.shape === 'circle' ? 0 : h.w / 2 - r;
  const ey = h.shape === 'circle' ? 0 : h.h / 2 - r;
  const corners = [
    [cx + ex, cy - ey, -Math.PI / 2],
    [cx + ex, cy + ey, 0],
    [cx - ex, cy + ey, Math.PI / 2],
    [cx - ex, cy - ey, Math.PI],
  ];
  for (const [ox, oy, a0] of corners) {
    for (let s = 0; s <= segs; s++) {
      const a = a0 + (s / segs) * (Math.PI / 2);
      pts.push([ox + r * Math.cos(a), oy + r * Math.sin(a)]);
    }
  }
  return pts;
}

// ---------- writers ----------

function writeObj(file, board, mesh, markers) {
  const out = [
    `# ${board.brand} ${board.model} - generated by scripts/gen-hangboard-models.mjs`,
    '# units: mm',
  ];
  let base = 1;
  const emit = (name, m) => {
    out.push(`o ${name}`);
    for (let i = 0; i < m.positions.length; i += 3) {
      out.push(
        `v ${m.positions[i].toFixed(2)} ${m.positions[i + 1].toFixed(2)} ${m.positions[i + 2].toFixed(2)}`
      );
    }
    for (let i = 0; i < m.normals.length; i += 3) {
      out.push(
        `vn ${m.normals[i].toFixed(3)} ${m.normals[i + 1].toFixed(3)} ${m.normals[i + 2].toFixed(3)}`
      );
    }
    for (let i = 0; i < m.indices.length; i += 3) {
      const a = m.indices[i] + base;
      const b = m.indices[i + 1] + base;
      const c = m.indices[i + 2] + base;
      out.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
    }
    base += m.positions.length / 3;
  };
  emit('board', mesh);
  for (const [id, m] of markers) emit(`hold_${id}`, m);
  writeFileSync(file, out.join('\n') + '\n');
}

function writeGlb(file, board, mesh, markers) {
  const bufs = [];
  let byteLength = 0;
  const bufferViews = [];
  const accessors = [];
  const pushBuffer = (buf, target) => {
    const pad = (4 - (buf.length % 4)) % 4;
    const padded = pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
    bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: buf.length, target });
    bufs.push(padded);
    byteLength += padded.length;
    return bufferViews.length - 1;
  };
  const addAccessor = (arr, type, componentType, target, withBounds) => {
    const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    const view = pushBuffer(buf, target);
    const n = type === 'VEC3' ? 3 : 1;
    const acc = { bufferView: view, componentType, count: arr.length / n, type };
    if (withBounds) {
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < arr.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], arr[i + k]);
          max[k] = Math.max(max[k], arr[i + k]);
        }
      }
      acc.min = min;
      acc.max = max;
    }
    accessors.push(acc);
    return accessors.length - 1;
  };
  const meshes = [];
  const nodes = [];
  const addMesh = (name, m, material) => {
    const pos = addAccessor(Float32Array.from(m.positions), 'VEC3', 5126, 34962, true);
    const nor = addAccessor(Float32Array.from(m.normals), 'VEC3', 5126, 34962, false);
    const ind = addAccessor(Uint32Array.from(m.indices), 'SCALAR', 5125, 34963, false);
    meshes.push({
      name,
      primitives: [{ attributes: { POSITION: pos, NORMAL: nor }, indices: ind, material }],
    });
    nodes.push({ name, mesh: meshes.length - 1 });
  };
  addMesh('board', mesh, 0);
  for (const [id, m] of markers) addMesh(id, m, 1);

  const json = {
    asset: { version: '2.0', generator: 'hangboard/scripts/gen-hangboard-models.mjs' },
    scene: 0,
    scenes: [{ name: `${board.brand} ${board.model}`, nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: [
      {
        name: 'wood',
        pbrMetallicRoughness: {
          baseColorFactor: [0.78, 0.66, 0.46, 1],
          metallicFactor: 0,
          roughnessFactor: 0.85,
        },
      },
      {
        name: 'hold-marker',
        alphaMode: 'BLEND',
        doubleSided: true,
        pbrMetallicRoughness: {
          baseColorFactor: [1, 0.35, 0.1, 0.55],
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    buffers: [{ byteLength }],
    bufferViews,
    accessors,
    extras: { units: 'mm', holds: board.holds.map((h) => h.id) },
  };
  let jsonBuf = Buffer.from(JSON.stringify(json));
  const jpad = (4 - (jsonBuf.length % 4)) % 4;
  if (jpad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jpad, 0x20)]);
  const bin = Buffer.concat(bufs);
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  writeFileSync(file, Buffer.concat([header, jsonHeader, jsonBuf, binHeader, bin]));
}

/**
 * SVG path for a jug that wraps the rounded end of the board (shape "corner"): the strip
 * along the top (inner.h tall) plus the strip down the side (inner.w wide), rounded by the
 * board's corner radius. Left jugs start at x = 0, right jugs end at x = W.
 */
function cornerPath(h, r, W) {
  const inner = h.inner ?? { w: 30, h: 28 };
  const top = h.y;
  const bottom = h.y + h.h;
  if (h.side === 'right') {
    return `M${h.x} ${top}H${W - r}A${r} ${r} 0 0 1 ${W} ${top + r}V${bottom}H${W - inner.w}V${top + inner.h}H${h.x}Z`;
  }
  return `M${h.x + h.w} ${top}H${h.x + r}A${r} ${r} 0 0 0 ${h.x} ${top + r}V${bottom}H${h.x + inner.w}V${top + inner.h}H${h.x + h.w}Z`;
}

function holdPath(h, board) {
  if (h.shape === 'corner') return cornerPath(h, board.corner_radius_mm ?? 8, board.size_mm.width);
  if (h.shape === 'rect') return `M${h.x} ${h.y}h${h.w}v${h.h}h${-h.w}z`;
  if (h.shape === 'circle') {
    const r = Math.min(h.w, h.h) / 2;
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  }
  const r = Math.min(h.w, h.h) / 2;
  return `M${h.x + r} ${h.y}h${h.w - 2 * r}a${r} ${r} 0 0 1 0 ${h.h}h${-(h.w - 2 * r)}a${r} ${r} 0 0 1 0 ${-h.h}z`;
}

function writeSvg(file, board, labeled) {
  const W = board.size_mm.width;
  const H = board.size_mm.height;
  const pad = labeled ? 14 : 2;
  const cornerR = board.corner_radius_mm ?? 8;
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}" width="${(W + 2 * pad) * 2}" height="${(H + 2 * pad) * 2}" font-family="Geist Mono, ui-monospace, monospace">`
  );
  parts.push(`<title>${board.brand} ${board.model}</title>`);
  parts.push(
    board.outline?.length
      ? `<path id="board" d="${board.outline.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')} Z" stroke-linejoin="round" fill="#d9c9a3" stroke="#6b5a3a" stroke-width="1"/>`
      : `<rect id="board" x="0" y="0" width="${W}" height="${H}" rx="${cornerR}" fill="#d9c9a3" stroke="#6b5a3a" stroke-width="1"/>`
  );
  parts.push('<g id="holds">');
  for (const h of board.holds) {
    const top = h.type === 'sloper' || h.type === 'jug';
    const asRect = top && h.shape !== 'corner';
    const fill = top ? '#b8a57c' : '#5a4630';
    const stroke = top ? '#6b5a3a' : '#3b2d1c';
    const attrs = [
      `id="${h.id}"`,
      `data-type="${h.type}"`,
      `data-fingers="${h.fingers}"`,
      h.depth_mm != null ? `data-depth="${h.depth_mm}"` : '',
      h.angle_deg != null ? `data-angle="${h.angle_deg}"` : '',
      h.pair ? `data-pair="${h.pair}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const rx = top ? ` rx="${h.h / 4}"` : '';
    if (asRect) {
      parts.push(
        `<rect ${attrs} x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}"${rx} fill="${fill}" stroke="${stroke}" stroke-width="0.8"><title>${h.label}</title></rect>`
      );
    } else {
      parts.push(
        `<path ${attrs} d="${holdPath(h, board)}" fill="${fill}" stroke="${stroke}" stroke-width="0.8"><title>${h.label}</title></path>`
      );
    }
  }
  parts.push('</g>');
  for (const s of board.screw_holes ?? []) {
    parts.push(
      `<circle cx="${s.x}" cy="${s.y}" r="1.6" fill="#f2ece0" stroke="#3b2d1c" stroke-width="0.5"/>`
    );
  }
  if (labeled) {
    parts.push('<g id="labels" font-size="5" fill="#1f1a12" text-anchor="middle">');
    for (const h of board.holds) {
      const cx = h.x + h.w / 2;
      const cy = h.y + h.h / 2;
      let text = '';
      if (h.angle_deg != null) text = `${h.angle_deg}°`;
      else if (h.depth_mm != null) text = `${h.depth_mm}`;
      else if (h.type === 'jug') text = 'jug';
      const fill = h.type === 'sloper' || h.type === 'jug' ? '#1f1a12' : '#f6f0e4';
      parts.push(`<text x="${cx}" y="${cy + 7.5}" fill="${fill}">${text}</text>`);
    }
    parts.push('</g>');
    parts.push(
      `<text x="${W / 2}" y="${H + 9}" font-size="5" fill="#5a4a30" text-anchor="middle">${board.brand} ${board.model} · ${W} × ${H} × ${board.size_mm.depth} mm · numbers are hold depths in mm (community measured)</text>`
    );
  }
  parts.push('</svg>');
  writeFileSync(file, parts.join('\n') + '\n');
}

// ---------- main ----------

const only = process.argv.slice(2);
const boards = readdirSync(ROOT).filter((d) => existsSync(join(ROOT, d, 'layout.json')));
for (const dir of boards) {
  if (only.length && !only.includes(dir)) continue;
  const board = JSON.parse(readFileSync(join(ROOT, dir, 'layout.json'), 'utf8'));
  const mesh = buildMesh(board);
  const markers = board.holds.map((h) => [h.id, holdMarker(board, h)]);
  writeSvg(join(ROOT, dir, 'board.svg'), board, false);
  writeSvg(join(ROOT, dir, 'layout.svg'), board, true);
  writeObj(join(ROOT, dir, 'model.obj'), board, mesh, markers);
  writeGlb(join(ROOT, dir, 'model.glb'), board, mesh, markers);
  console.log(
    `${dir}: ${board.holds.length} holds, ${mesh.positions.length / 3} vertices, ${mesh.indices.length / 3} triangles`
  );
}
