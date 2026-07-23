import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:3100';
const OUT = '/tmp/opencode/runtime/visual-pixel';
await mkdir(OUT, { recursive: true });

const ROUTES = [
  { path: '/', id: 'home' },
  { path: '/archivio', id: 'archivio' },
  { path: '/toools/blink', id: 'tool-detail' },
  { path: '/collections/ai-stack-solo-founders', id: 'collection-detail' },
];
const VIEWPORTS = [
  { name: '360x800', w: 360, h: 800 },
  { name: '1440x1024', w: 1440, h: 1024 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(600);

      // Full-page screenshot — this is the source of truth
      const fullPath = `${OUT}/${route.id}_${vp.name}_FULL.png`;
      await page.screenshot({ path: fullPath, fullPage: true });

      // Collect flagged elements. After fullPage screenshot, pageYOffset stays 0
      // because the document is the only "page" — getBoundingClientRect gives
      // viewport-relative coords which equal fullpage coords because document
      // height matches the screenshot height.
      const flagged = await page.evaluate(() => {
        const out = [];
        const textEls = [...document.querySelectorAll('h1, h2, h3, h4, p, span, button, a, li, dt, dd, label, strong')];
        const seen = new Set();
        for (const el of textEls) {
          if (el.closest('.sr-only')) continue;
          const t = (el.textContent || '').trim();
          if (!t || t.length < 6) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const key = `${el.tagName}|${t.slice(0, 30)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const cs = window.getComputedStyle(el);
          let bestBg = null, bestAlpha = -1;
          let cur = el;
          while (cur) {
            const bg = window.getComputedStyle(cur).backgroundColor;
            const m = bg.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const [rr, gg, bb, a] = m[1].split(',').map((x) => parseFloat(x.trim()));
              if (![rr, gg, bb].some((v) => Number.isNaN(v))) {
                const alpha = a === undefined ? 1 : a;
                if (alpha >= 0.5 && alpha > bestAlpha) {
                  bestBg = { r: rr, g: gg, b: bb };
                  bestAlpha = alpha;
                  if (alpha >= 0.95) break;
                }
              }
            }
            cur = cur.parentElement;
          }
          if (!bestBg) bestBg = { r: 8, g: 8, b: 10 };
          const fgM = cs.color.match(/rgba?\(([^)]+)\)/);
          if (!fgM) continue;
          const [fr, fg_, fb] = fgM[1].split(',').map((x) => parseFloat(x.trim()));
          if ([fr, fg_, fb].some((v) => Number.isNaN(v))) continue;
          const toLin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
          const fL = 0.2126 * toLin(fr) + 0.7152 * toLin(fg_) + 0.0722 * toLin(fb);
          const bL = 0.2126 * toLin(bestBg.r) + 0.7152 * toLin(bestBg.g) + 0.0722 * toLin(bestBg.b);
          const ratio = (Math.max(fL, bL) + 0.05) / (Math.min(fL, bL) + 0.05);
          if (ratio < 3.0 && t.length > 8) {
            // After fullPage screenshot, scrollY should be 0; rect is already
            // at document-relative coordinates in headless Chromium.
            out.push({
              tag: el.tagName,
              text: t.slice(0, 50),
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.width),
              h: Math.round(r.height),
              walkerRatio: Math.round(ratio * 100) / 100,
              walkerFg: `rgb(${fr},${fg_},${fb})`,
              walkerBg: `rgb(${bestBg.r},${bestBg.g},${bestBg.b})`,
            });
          }
        }
        return out;
      });

      for (let i = 0; i < flagged.length; i++) {
        const f = flagged[i];
        results.push({
          route: route.path, routeId: route.id, viewport: vp.name,
          text: f.text.slice(0, 50), tag: f.tag,
          walkerRatio: f.walkerRatio, walkerFg: f.walkerFg, walkerBg: f.walkerBg,
          fullPath, x: f.x, y: f.y, w: f.w, h: f.h,
        });
      }
    } catch (e) {
      results.push({ route: route.path, viewport: vp.name, error: e.message });
    }
  }
  await ctx.close();
}

await browser.close();

const summary = {
  total: results.length,
  routes: ROUTES.length,
  viewports: VIEWPORTS.length,
  fullpageCaptures: results.filter((r) => r.fullPath).length,
};
writeFileSync('/tmp/opencode/runtime/visual-pixel-summary.json', JSON.stringify({ summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
