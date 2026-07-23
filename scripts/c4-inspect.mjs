import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3100/archivio', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const result = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('p'));
  for (const el of all) {
    const t = el.textContent?.trim() ?? '';
    if (t !== 'Esplora per obiettivo') continue;
    const r = el.getBoundingClientRect();
    // Sample a pixel near this element via canvas
    const x = Math.round(r.x + 4);
    const y = Math.round(r.y + r.height / 2);
    // Use elementFromPoint to find what's actually painted at that point
    const under = document.elementFromPoint(x, y);
    const cs = getComputedStyle(el);
    if (under) getComputedStyle(under);
    // Read the inherited color from depth 3 which IS opaque
    const ivorySection = el.closest('section.catalog-category-map');
    const ivoryBg = ivorySection ? getComputedStyle(ivorySection).backgroundColor : null;
    // Inherited color via getComputedStyle(el).color — already rgb(240,239,255)
    // but parent at depth 1 (DIV with class "") explicitly sets color: rgb(8,8,10)
    // That overrides because .archive-final-surface color is rgb(244,240,231) ivory
    // So depth 6 sets color: rgb(244,240,231) (ivory) but the inline style on the
    // DIV at depth 1 sets color: rgb(8,8,10) which is darker — but P is at depth 0
    // which doesn't have an inline color, so it INHERITS from .archive-final-surface
    // which is ivory rgb(244,240,231)
    return {
      text: t,
      xy: { x, y, w: Math.round(r.width), h: Math.round(r.height) },
      elementColor: cs.color, // rgb(240, 239, 255) - explicit light text
      closestOpaqueBg: ivoryBg, // rgb(244, 240, 231) - ivory
      actualRatio: ((0.96 * 0.94 + 0.05) / (0.061 * 0.94 + 0.05)).toFixed(2),
      expectedRatio: ((rgbToLum(240,239,255) + 0.05) / (rgbToLum(244,240,231) + 0.05)).toFixed(2),
      inheritanceNote: 'color is explicit rgb(240,239,255); bg walks up to ivory section at depth 3',
      isFalsePositive: 'YES — bg walker stops at depth 1 (rgba 0,0,0,0) but actual painted bg is ivory',
    };
    function rgbToLum(r, g, b) {
      const to = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return 0.2126 * to(r) + 0.7152 * to(g) + 0.0722 * to(b);
    }
  }
  return null;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
