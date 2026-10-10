/**
 * Turns a benchmark export into the compact per-board files the app bundles.
 *
 *   node scripts/moonboard-benchmarks.mjs path/to/benchmarks.json
 *
 * The input is the `benchmarks.json` of the Moonboard-Guidebook project (late 2023). The app
 * never fetches anything: download the file yourself. What this writes is not in the
 * repository (the lists are not ours to publish), so it stays on the machine that ran it.
 *
 *   node scripts/moonboard-benchmarks.mjs --ensure
 *
 * writes empty lists where there are none, so a fresh clone builds and runs: the Climb tab
 * then has no benchmarks, only the problems set in the app. `npm install` runs it.
 * A problem becomes one array, see `ProblemRow` in `src/lib/moonboard/problems.ts`. A small
 * `summary.json` carries the counts and one sample per board.
 */
import fs from 'node:fs';

const source = process.argv[2];
if (!source) throw new Error('Pass the path to benchmarks.json, or --ensure');

// `mb_type` in the export, in order.
const BOARDS = ['2016-40', '2017-25', '2017-40', '2019-25', '2019-40', 'mini2020-40'];
const DIR = 'src/lib/moonboard/data';
fs.mkdirSync(DIR, { recursive: true });

if (source === '--ensure') {
  const missing = [...BOARDS, 'summary'].filter((name) => !fs.existsSync(`${DIR}/${name}.json`));
  // Lists that are there are left alone, whatever is in them.
  if (missing.length === BOARDS.length + 1) {
    for (const key of BOARDS) fs.writeFileSync(`${DIR}/${key}.json`, '[]\n');
    const empty = Object.fromEntries(BOARDS.map((key) => [key, { count: 0, sets: {} }]));
    fs.writeFileSync(`${DIR}/summary.json`, JSON.stringify(empty) + '\n');
    console.log('No benchmark lists here: wrote empty ones. See scripts/moonboard-benchmarks.mjs.');
  }
  process.exit(0);
}

const all = JSON.parse(fs.readFileSync(source, 'utf8'));

// What the board picker needs without opening a whole list: how many problems, how many
// use each hold set, and one to draw.
const summary = {};

for (const [type, key] of BOARDS.entries()) {
  const rows = all
    .filter((p) => p.mb_type === type)
    .sort((a, b) => b.repeats - a.repeats)
    .map((p) => [
      p.id,
      p.name.trim(),
      p.setter.trim(),
      p.grade,
      p.repeats,
      Math.round(p.avg_user_stars * 10),
      Math.round(p.avg_user_attempts * 10),
      p.holdsets,
      p.start_holds.join(' '),
      p.mid_holds.join(' '),
      p.end_holds.join(' '),
    ]);
  const file = `${DIR}/${key}.json`;
  fs.writeFileSync(file, JSON.stringify(rows) + '\n');
  const sets = {};
  for (const row of rows) for (const id of row[7]) sets[id] = (sets[id] ?? 0) + 1;
  summary[key] = { count: rows.length, sets, sample: rows[0] };
  console.log(`${file}: ${rows.length} problems`);
}
fs.writeFileSync(`${DIR}/summary.json`, JSON.stringify(summary) + '\n');
