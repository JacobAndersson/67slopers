// node film.mjs <svg> <out-prefix> <ms,ms,...> [w] [h] : frames of a CSS-animated SVG at given times
import { chromium } from '/home/jacob/workspace/67slopers/design/.local/node/node_modules/playwright/index.mjs';
const [, , svg, out, times, w = '720', h = '440'] = process.argv;
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto('http://127.0.0.1:8765/rivet/motion/' + svg);
for (const t of times.split(',').map(Number)) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
  await p.screenshot({ path: `${out}-${String(t).padStart(4, '0')}.png` });
}
await b.close();
