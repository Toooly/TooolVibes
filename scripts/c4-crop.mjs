import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3100/archivio', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.locator('p:has-text("Esplora per obiettivo")').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
// Crop a 600x80 region around the element
const el = page.locator('p:has-text("Esplora per obiettivo")').first();
const box = await el.boundingBox();
console.log('Element box:', box);
// Sample pixels using html2canvas-style: use the element's bounding rect and screenshot that area
await page.screenshot({ path: '/tmp/c4-crop.png', clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(1440, box.width + 40), height: 80 } });
// Also use the script to evaluate the actual visible painted rgb via canvas-readback would be too involved.
// Just print the dominant background of the closest opaque ancestor + the rect's topmost element's color
const data = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll('p')).find(e => e.textContent.trim() === 'Esplora per obiettivo');
  const r = p.getBoundingClientRect();
  // What's the actual stack? Use the .catalog-category-map section (depth 3) and check visibility: is it actually on top?
  const section = p.closest('section.catalog-category-map');
  const sectionRect = section.getBoundingClientRect();
  return {
    element: { x: r.x, y: r.y, w: r.width, h: r.height },
    section: { x: sectionRect.x, y: sectionRect.y, w: sectionRect.width, h: sectionRect.height, class: section.className },
    sectionBg: getComputedStyle(section).backgroundColor,
    elementColor: getComputedStyle(p).color,
    inheritsColorFrom: (() => {
      // walk up and find the nearest ancestor with explicit color
      let cur = p.parentElement;
      const chain = [];
      while (cur && chain.length < 6) {
        const cs = getComputedStyle(cur);
        if (cs.color !== 'rgb(8, 8, 10)') chain.push({ tag: cur.tagName, class: cur.className?.toString().slice(0, 50), color: cs.color });
        cur = cur.parentElement;
      }
      return chain;
    })(),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
