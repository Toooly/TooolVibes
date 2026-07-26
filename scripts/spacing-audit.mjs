import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

const routes = [
  { path: '/', id: 'home' },
  { path: '/archivio', id: 'archivio' },
  { path: '/radar', id: 'radar' },
  { path: '/toools/blink', id: 'tool-detail' },
  { path: '/collections/ai-stack-solo-founders', id: 'collection-detail' },
  { path: '/compare', id: 'compare' },
  { path: '/shortlist', id: 'shortlist' },
];

const out = [];
for (const r of routes) {
  await page.goto('http://127.0.0.1:3100' + r.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  
  const data = await page.evaluate(() => {
    const header = document.querySelector('.site-header-v2');
    const main = document.querySelector('main');
    const firstSection = main?.querySelector('section, [class*="hero"], [class*="stage"]');
    if (!header || !main || !firstSection) return null;
    
    const headerRect = header.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const firstSectionRect = firstSection.getBoundingClientRect();
    
    return {
      headerBottom: Math.round(headerRect.bottom),
      mainTop: Math.round(mainRect.top),
      mainPaddingTop: parseInt(window.getComputedStyle(main).paddingTop) || 0,
      firstSectionTop: Math.round(firstSectionRect.top),
      gapBetweenMainContent: Math.round(firstSectionRect.top - mainRect.top),
      headerToContent: Math.round(firstSectionRect.top - headerRect.bottom),
      firstSectionClass: firstSection.className?.slice(0, 80),
      firstSectionPaddingTop: parseInt(window.getComputedStyle(firstSection).paddingTop) || 0,
    };
  });
  out.push({ route: r.path, ...data });
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
