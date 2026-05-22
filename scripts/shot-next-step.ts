import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/next-step', {
    waitUntil: 'networkidle',
  });
  // Wait extra for mermaid client-side render
  await page.waitForSelector('svg[id^="architecture-next-step"]', {
    timeout: 10_000,
  });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: 'data/cases/stock-hurt/debug/screenshots/next-step.png',
    fullPage: true,
  });
  console.log('✓ next-step.png re-shot with diagram');
  await browser.close();
})();
