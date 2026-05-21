import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const views = [
  { name: 'snapshot', path: '/snapshot' },
  { name: 'problems', path: '/problems' },
  { name: 'processes', path: '/processes' },
  { name: 'leakage', path: '/leakage' },
  { name: 'risks', path: '/risks' },
  { name: 'opportunities', path: '/opportunities' },
  { name: 'competitive', path: '/competitive' },
  { name: 'actions', path: '/actions' },
  { name: 'next-step', path: '/next-step' },
];

(async () => {
  mkdirSync('data/cases/stock-hurt/debug/screenshots', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  for (const v of views) {
    await page.goto(`http://localhost:3000${v.path}`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: `data/cases/stock-hurt/debug/screenshots/${v.name}.png`,
      fullPage: true,
    });
    console.log(`✓ ${v.name}.png`);
  }

  // Bonus: drawer-open shot — kliknij score w problems
  await page.goto('http://localhost:3000/problems', { waitUntil: 'networkidle' });
  const trigger = page.locator('[data-inspect-trigger]').first();
  if ((await trigger.count()) > 0) {
    await trigger.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'data/cases/stock-hurt/debug/screenshots/problems-drawer-open.png',
      fullPage: true,
    });
    console.log('✓ problems-drawer-open.png');
  }

  await browser.close();
})();
