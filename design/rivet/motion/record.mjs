// Steps film.html's animations frame by frame: node record.mjs <outdir> [fps]
import { chromium } from '/home/jacob/workspace/67slopers/design/.local/node/node_modules/playwright/index.mjs';
const out = process.argv[2], fps = +(process.argv[3] || 24);
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await p.goto('http://127.0.0.1:8765/rivet/motion/film.html');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const total = 8400, n = Math.round(total / 1000 * fps);
for (let i = 0; i <= n; i++) {
  const t = i * 1000 / fps;
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
  await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 85 });
}
await b.close();
