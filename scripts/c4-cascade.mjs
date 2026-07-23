import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:3100/archivio', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const result = await page.evaluate(() => {
  const ps = Array.from(document.querySelectorAll('p'));
  for (const p of ps) {
    if (p.textContent.trim() !== 'Esplora per obiettivo') continue;
    // Use CDP-like: getMatchedCSSRules is gone. Instead enumerate inline + stylesheets.
    const cs = getComputedStyle(p);
    // Find every stylesheet that has rules matching this element
    const matches = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule.selectorText) continue;
        try {
          if (p.matches(rule.selectorText)) {
            const color = rule.style.color || '(inherit)';
            matches.push({ selector: rule.selectorText, color, href: sheet.href || '(inline)' });
          }
        } catch {}
      }
    }
    return { text: p.textContent.trim(), computedColor: cs.color, matchingRules: matches.filter(m => m.color !== '(inherit)') };
  }
  return null;
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
