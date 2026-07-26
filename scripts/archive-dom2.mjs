import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3100/archivio', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(500);

const data = await page.evaluate(() => {
  const result = [];
  const main = document.querySelector('main');
  if (!main) return result;
  // Walk ALL descendants of main, capture the first 8 with non-zero height and top < 700
  const all = [...main.querySelectorAll('*')];
  for (let i = 0; i < 200 && result.length < 15; i++) {
    const el = all[i];
    if (!el || el === main) continue;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > 700 || r.height === 0) continue;
    const cs = window.getComputedStyle(el);
    result.push({
      tag: el.tagName,
      cls: (el.className || '').toString().slice(0, 100),
      top: Math.round(r.top),
      h: Math.round(r.height),
      padTop: parseInt(cs.paddingTop) || 0,
    });
  }
  return result;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
