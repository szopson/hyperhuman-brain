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

  // Bonus 1: drawer-open shot — kliknij score w problems
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

  // Bonus 2: PlayDetailDrawer dla P-020 (Codzienny briefing dla zarządu)
  await page.goto('http://localhost:3000/opportunities', { waitUntil: 'networkidle' });
  // First triggers in DOM should map to top row (P-020 = position 1)
  const playTrigger = page.locator('[data-inspect-trigger]').first();
  if ((await playTrigger.count()) > 0) {
    await playTrigger.click();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: 'data/cases/stock-hurt/debug/screenshots/opportunities-drawer-p020.png',
      fullPage: true,
    });
    console.log('✓ opportunities-drawer-p020.png (tab 1: overview)');

    // Switch to scoring tab
    const scoringTab = page.locator('button[role="tab"]:has-text("Scoring")').first();
    if ((await scoringTab.count()) > 0) {
      await scoringTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: 'data/cases/stock-hurt/debug/screenshots/opportunities-drawer-p020-scoring.png',
        fullPage: true,
      });
      console.log('✓ opportunities-drawer-p020-scoring.png (tab 2: scoring)');
    }
  }

  await browser.close();
})();
