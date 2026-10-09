/** Extract current app content for design recreation without touching user data. */
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import ts from 'typescript';
import { PRESETS } from '../../src/lib/store/presets';
import { summaryLine, estimateDuration, workoutFacts } from '../../src/lib/workout-summary';
import { encodeWorkout } from '../../src/lib/workout-codec';
import { BOARD_IDS, getBoard, grips } from '../../src/lib/boards';

const presets = PRESETS.map((preset) => ({
  ...preset,
  summary: summaryLine(preset),
  duration: estimateDuration(preset),
  facts: workoutFacts(preset),
}));
const boards = BOARD_IDS.map((id) => ({ ...getBoard(id)!, grips: grips(getBoard(id)!) }));
const qr = QRCode.create(encodeWorkout(PRESETS.find((p) => p.id === 'repeaters-7-3')!), {
  errorCorrectionLevel: 'M',
}).modules;
// Stable design keys and layer counts preserve existing Penpot component links.
// The visible vector uses Phosphor; extra legacy layers become hidden anchors.
const iconSpecs: [string, string, number][] = [
  ['play', 'Play', 1],
  ['pause', 'Pause', 2],
  ['x', 'X', 2],
  ['chevron-left', 'CaretLeft', 1],
  ['chevron-right', 'CaretRight', 1],
  ['chevron-down', 'CaretDown', 1],
  ['plus', 'Plus', 2],
  ['repeat', 'Repeat', 4],
  ['ellipsis-vertical', 'DotsThreeVertical', 3],
  ['grip-vertical', 'DotsSixVertical', 6],
  ['settings-2', 'SlidersHorizontal', 4],
  ['skip-back', 'SkipBack', 2],
  ['skip-forward', 'SkipForward', 2],
  ['scan-qr-code', 'Scan', 8],
  ['qr-code', 'QrCode', 12],
  ['copy', 'Copy', 2],
  ['library', 'Books', 4],
  ['snail', 'BatteryLow', 5],
  ['thumbs-up', 'ThumbsUp', 2],
  ['biceps-flexed', 'Barbell', 3],
  ['check', 'Check', 1],
];
const icons: Record<string, { name: string; slots: number; paths: Record<string, string> }> = {};
for (const [key, name, slots] of iconSpecs) {
  const filename = path.join('node_modules/phosphor-react-native/src/defs', `${name}.tsx`);
  const source = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const paths: Record<string, string> = {};
  const visit = (node: ts.Node) => {
    if (ts.isArrayLiteralExpression(node) && node.elements.length === 2) {
      const [weight, vector] = node.elements;
      if (ts.isStringLiteral(weight) && ['regular', 'bold'].includes(weight.text)) {
        const pieces: string[] = [];
        const readPath = (child: ts.Node) => {
          if (ts.isJsxSelfClosingElement(child) && child.tagName.getText(source) === 'Path') {
            const d = child.attributes.properties.find(
              (attr) => ts.isJsxAttribute(attr) && attr.name.getText(source) === 'd'
            );
            if (d && ts.isJsxAttribute(d) && d.initializer && ts.isStringLiteral(d.initializer)) {
              pieces.push(d.initializer.text);
            }
          }
          ts.forEachChild(child, readPath);
        };
        readPath(vector);
        if (!pieces.length) throw new Error(`Missing Phosphor paths: ${name}/${weight.text}`);
        paths[weight.text] = pieces.join(' ');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!paths.regular || !paths.bold) throw new Error(`Missing Phosphor weights: ${name}`);
  icons[key] = { name, slots, paths };
}
fs.mkdirSync('design/.local', { recursive: true });
fs.writeFileSync(
  'design/.local/app-reference.json',
  JSON.stringify({
    presets,
    boards,
    icons,
    qr: { size: qr.size, data: Array.from(qr.data) },
  })
);
