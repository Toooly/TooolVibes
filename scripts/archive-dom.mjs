import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3100/archivio', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(500);

const data = await page.evaluate(() => {
  const main = document.querySelector('main');
  const result = [];
  let cur = main?.firstElementChild;
  while (cur) {
    const r = cur.getBoundingClientRect();
    const cs = window.getComputedStyle(cur);
    result.push({
      tag: cur.tagName,
      cls: (cur.className || '').toString().slice(0, 80),
      top: Math.round(r.top),
      h: Math.round(r.height),
      padTop: parseInt(cs.paddingTop) || 0,
      margTop: parseInt(cs.marginTop) || 0,
    });
    cur = cur.nextElementSibling;
  }
  return result;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
