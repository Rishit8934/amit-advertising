const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  // --- Screenshot 1: Full newspaper grid ---
  await page.goto('http://localhost:3000/booking', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => document.querySelectorAll('[class*="cursor-pointer"]').length > 5, { timeout: 10000 });
  } catch(e) {}
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/booking-1-newspapers.png', fullPage: true });
  console.log('Screenshot 1: newspapers done');

  // --- Screenshot 2: Type in search bar to show dropdown ---
  await page.click('input[placeholder*="newspapers"]');
  await page.type('input[placeholder*="newspapers"]', 'Tribune');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/booking-2-search.png' });
  console.log('Screenshot 2: search dropdown done');

  // --- Screenshot 3: Select The Tribune, go to rates ---
  // Click "The Tribune" from dropdown
  await page.click('text=The Tribune');
  await new Promise(r => setTimeout(r, 500));
  // Click Next
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 400));
  // Select a category (click first category)
  await page.click('.grid .cursor-pointer:first-child');
  await new Promise(r => setTimeout(r, 300));
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 300));
  // Skip ad heading step
  await page.click('button:has-text("Next")');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/booking-3-rates.png' });
  console.log('Screenshot 3: rates done');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
