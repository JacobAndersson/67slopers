// Render an HTML file to PNG: node shot.mjs in.html out.png [width] [height] [scale]
import { chromium } from '/home/jacob/workspace/67slopers/design/.local/node/node_modules/playwright/index.mjs';
const [, , input, out, w = '1600', h = '1000', s = '1'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +s });
await page.goto('file://' + input);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => window.__ready !== false, null, { timeout: 60000 });
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
