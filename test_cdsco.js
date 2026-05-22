const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  
  await page.goto('https://cdscomdonline.gov.in/NewMedDev/ListOfApprovedDevices', {waitUntil: 'networkidle'});
  
  try {
      await page.locator('a.cardtext').filter({ hasText: 'Manufacturer' }).first().click();
      console.log("Clicked Manufacturer button");
  } catch(e) {
      console.log("Failed to click", e.message);
  }

  try {
      await page.waitForSelector('table tbody tr', {timeout: 10000});
      console.log('Table loaded!');
      const text = await page.locator('table tbody tr').first().innerText();
      console.log('First row text:', text);
  } catch (e) {
      console.log('Table timeout', e.message);
      const html = await page.content();
      console.log("HTML snippet:", html.substring(html.indexOf('tableContainer') - 100, html.indexOf('tableContainer') + 500));
  }
  await browser.close();
})();
