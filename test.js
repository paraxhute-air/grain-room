const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8080');
  
  // click first tab
  await page.evaluate(() => {
    document.querySelector('.mobile-nav-item').click();
  });
  
  await new Promise(r => setTimeout(r, 500)); // wait for transition
  
  const box = await page.evaluate(() => {
    const el = document.querySelector('.controls-sidebar');
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left,
      width: rect.width, height: rect.height,
      display: style.display,
      visibility: style.visibility,
      transform: style.transform,
      activeHasClass: el.classList.contains('active'),
      firstSectionActive: document.querySelector('.control-section').classList.contains('active'),
      firstSectionHeight: document.querySelector('.control-section').getBoundingClientRect().height
    };
  });
  console.log(JSON.stringify(box, null, 2));
  await browser.close();
})();
