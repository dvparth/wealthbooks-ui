import { chromium } from 'playwright-chromium';
import fs from 'fs';

const base = process.env.URL || 'http://localhost:5174';
const outDir = './screenshots-inv-scss';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const route = '/investments/inv-scss-001';
const viewports = [
  { label: 'iphone-se', width: 320, height: 568 },
  { label: 'pixel-360x640', width: 360, height: 640 },
  { label: 'iphone-x', width: 375, height: 812 }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const vp of viewports) {
    console.log(`Capturing ${route} at ${vp.label} ${vp.width}x${vp.height}`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(base + route, { waitUntil: 'networkidle' });
    try { await page.waitForSelector('.investments-list-container, .investments-table-wrapper, .investment-info, form', { timeout: 5000 }); } catch (e) {}

    // Try to open the Premature Closure modal by clicking known buttons
    try {
      // Prefer the small close button in header
      if (await page.$('.action-btn.close-btn')) {
        await page.click('.action-btn.close-btn');
      } else if (await page.$('.primary-btn.premature-btn')) {
        await page.click('.primary-btn.premature-btn');
      } else if (await page.$('button:has-text("Premature Closure")')) {
        await page.click('button:has-text("Premature Closure")');
      }
      // Wait for modal to appear
      await page.waitForSelector('.closure-modal', { timeout: 3000 });
    } catch (e) {
      // Modal did not open; continue to capture page as-is
    }
    const path = `${outDir}/inv-scss-001-${vp.label}-${vp.width}x${vp.height}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log('Saved', path);
  }
  await browser.close();
  console.log('Done');
})();
