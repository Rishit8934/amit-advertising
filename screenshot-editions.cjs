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
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 1: edition grid (should show All Editions button highlighted)
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/booking-editions-allselected.png', fullPage: true });
  console.log('Screenshot 1: All Editions default done');

  // Click Chandigarh edition to select a specific one
  const editionBtns = await page.$$('.grid .cursor-pointer');
  if (editionBtns.length > 1) {
    await editionBtns[1].click(); // click first real edition (index 0 is All Editions)
    await new Promise(r => setTimeout(r, 400));
  }
  await page.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/booking-editions-specific.png', fullPage: true });
  console.log('Screenshot 2: Specific edition selected done');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
