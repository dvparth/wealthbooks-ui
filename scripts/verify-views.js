import { chromium } from 'playwright-chromium';
import fs from 'fs';

const base = process.env.URL || 'http://localhost:5174';
const outDir = './screenshots-views';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const routes = [
  { path: '/', label: 'home' },
  { path: '/investments', label: 'investments-list' },
  { path: '/investments/new', label: 'investments-new' },
  { path: '/investments/1', label: 'investments-detail' }
];

const viewports = [
  { label: 'iphone-se', width: 320, height: 568 },
  { label: 'pixel-360x640', width: 360, height: 640 },
  { label: 'iphone-x', width: 375, height: 812 }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const r of routes) {
    const url = base + r.path;
    for (const vp of viewports) {
      console.log(`Checking ${r.label} on ${vp.label} ${vp.width}x${vp.height}`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'networkidle' });
      try {
        await page.waitForSelector('.investments-list-container, .investments-table-wrapper, .adjustment-modal, .closure-modal, form', { timeout: 4000 });
      } catch (e) {
        // ignore
      }
      const path = `${outDir}/${r.label}-${vp.label}-${vp.width}x${vp.height}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log('Saved', path);
    }
  }

  await browser.close();
  console.log('Done.');
})();
