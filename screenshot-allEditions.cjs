const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000/booking', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Search and select The Tribune
  await page.click('input[placeholder*="newspapers"]');
  await page.type('input[placeholder*="newspapers"]', 'Tribune');
  await new Promise(r => setTimeout(r, 400));
  await page.click('text=The Tribune');
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot: edition grid — find and click "All Editions" edition card
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/allEd-1-grid.png', fullPage: true });
  console.log('Screenshot 1: edition grid done');

  // Click "All Editions" edition (first card in the edition grid)
  const allEdBtn = await page.$('text=All Editions');
  if (allEdBtn) { await allEdBtn.click(); }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/allEd-2-selected.png', fullPage: true });
  console.log('Screenshot 2: All Editions selected done');

  // Go Next
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 400));
  // Pick first category
  const cats = await page.$$('.cursor-pointer');
  if (cats.length > 0) await cats[0].click();
  await new Promise(r => setTimeout(r, 300));
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 300));
  // Skip Ad Heading
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 800));
  // Screenshot rates
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/allEd-3-rates.png', fullPage: true });
  console.log('Screenshot 3: rates done');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
