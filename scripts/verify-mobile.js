import { chromium } from 'playwright-chromium';
import fs from 'fs';

const url = process.env.URL || 'http://localhost:5174/';
const outDir = './screenshots-mobile';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const viewports = [
  { label: 'iphone-se', width: 320, height: 568 },
  { label: 'pixel-360x640', width: 360, height: 640 },
  { label: 'iphone-x', width: 375, height: 812 },
  { label: 'pixel-412x915', width: 412, height: 915 },
  { label: 'small-tablet', width: 768, height: 1024 }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    console.log(`Checking ${vp.label} ${vp.width}x${vp.height}`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'networkidle' });
    // wait for investments container
    try {
      await page.waitForSelector('.investments-list-container', { timeout: 5000 });
    } catch (e) {
      console.error('Investments container not found');
    }
    const path = `${outDir}/investments-${vp.label}-${vp.width}x${vp.height}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log('Saved', path);
  }

  await browser.close();
  console.log('Done.');
})();
