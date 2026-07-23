import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';

const BASE = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:3100';
const OUT = '/tmp/opencode/runtime/screenshots';

const ROUTES = [
  { path: '/', id: 'home' },
  { path: '/archivio', id: 'archivio' },
  { path: '/radar', id: 'radar' },
  { path: '/compare', id: 'compare' },
  { path: '/shortlist', id: 'shortlist' },
  { path: '/collections', id: 'collections' },
  { path: '/collections/ai-stack-solo-founders', id: 'collection-ai-stack-solo-founders' },
  { path: '/toools/blink', id: 'tool-detail-blink' },
];

const VIEWPORTS = [
  { name: '360x800', w: 360, h: 800 },
  { name: '390x844', w: 390, h: 844 },
  { name: '430x932', w: 430, h: 932 },
  { name: '768x1024', w: 768, h: 1024 },
  { name: '820x1180', w: 820, h: 1180 },
  { name: '912x1368', w: 912, h: 1368 },
  { name: '1024x768', w: 1024, h: 768 },
  { name: '1180x820', w: 1180, h: 820 },
  { name: '1280x800', w: 1280, h: 800 },
  { name: '1366x768', w: 1366, h: 768 },
  { name: '1440x1024', w: 1440, h: 1024 },
  { name: '1536x960', w: 1536, h: 960 },
  { name: '1920x1080', w: 1920, h: 1080 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function analyze(page) {
  return await page.evaluate(() => {
    const data = {
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      docH: document.documentElement.scrollHeight,
      headings: [],
      realLowContrast: [],
      surfaceIssues: [],
      emptyContainers: [],
      clippedHeadings: [],
      hasMainOffset: null,
      hasMobileNav: false,
      pageErrors: [],
    };
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    for (const h of headings) {
      if (h.closest('.sr-only')) continue;
      const r = h.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const text = h.textContent?.trim() ?? '';
      if (!text) continue;
      const cs = window.getComputedStyle(h);
      const fontSize = parseFloat(cs.fontSize);
      data.headings.push({ tag: h.tagName, text: text.slice(0, 60), fontSize, x: Math.round(r.x), w: Math.round(r.width), lineHeight: cs.lineHeight });
      if (h.scrollWidth > h.clientWidth + 4) {
        data.clippedHeadings.push({ tag: h.tagName, text: text.slice(0, 50), sw: h.scrollWidth, cw: h.clientWidth });
      }
    }
    // Check headings + body text for real low contrast (skip sr-only)
    const textEls = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button, a, li, dt, dd, label, strong'));
    const seen = new Set();
    for (const el of textEls) {
      if (el.closest('.sr-only')) continue;
      const t = el.textContent?.trim() ?? '';
      if (!t || t.length < 8) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const key = `${el.tagName}|${t.slice(0, 50)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cs = window.getComputedStyle(el);
      const fgRgb = (() => {
        const m = cs.color.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b] = m[1].split(',').map((x) => parseFloat(x.trim()));
        if ([r, g, b].some((v) => Number.isNaN(v))) return null;
        return { r, g, b };
      })();
      if (!fgRgb) continue;
      // walk up to find the most-opaque non-transparent bg ancestor.
      // Most-opaque wins because translucent wrappers (e.g. bg-[rgba(255,255,255,0.72)])
      // sit ABOVE the actual painted surface but let the deeper color through.
      let bestBg = null;
      let bestAlpha = -1;
      let cur = el;
      while (cur) {
        const bg = window.getComputedStyle(cur).backgroundColor;
        const m = bg.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const [r, g, b, a] = m[1].split(',').map((x) => parseFloat(x.trim()));
          if (![r, g, b].some((v) => Number.isNaN(v))) {
            const alpha = a === undefined ? 1 : a;
            if (alpha >= 0.5 && alpha > bestAlpha) {
              bestBg = { r, g, b };
              bestAlpha = alpha;
              if (alpha >= 0.95) break; // fully opaque — stop early
            }
          }
        }
        cur = cur.parentElement;
      }
      const bgRgb = bestBg ?? { r: 8, g: 8, b: 10 }; // default to canvas when nothing found
      const toLin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const fL = 0.2126 * toLin(fgRgb.r) + 0.7152 * toLin(fgRgb.g) + 0.0722 * toLin(fgRgb.b);
      const bL = 0.2126 * toLin(bgRgb.r) + 0.7152 * toLin(bgRgb.g) + 0.0722 * toLin(bgRgb.b);
      const ratio = (Math.max(fL, bL) + 0.05) / (Math.min(fL, bL) + 0.05);
      // flag if ratio < 3 AND element is large text or has text length > 15
      if (ratio < 3.0 && t.length > 10) {
        data.realLowContrast.push({ tag: el.tagName, text: t.slice(0, 50), ratio: ratio.toFixed(2), fg: cs.color });
      }
    }
    const main = document.querySelector('main');
    if (main) {
      const r = main.getBoundingClientRect();
      data.hasMainOffset = r.top >= 60;
    }
    const bottomNav = document.querySelector('.site-mobile-footer-nav, .mobile-bottom-nav');
    data.hasMobileNav = !!bottomNav;
    return data;
  });
}

const allResults = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  page.on('pageerror', () => {});
  for (const route of ROUTES) {
    const fileName = `${route.id}_${vp.name}.png`;
    try {
      const resp = await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(700);
      const status = resp ? resp.status() : 'no-response';
      const analysis = await analyze(page);
      await page.screenshot({ path: `${OUT}/${fileName}`, fullPage: false });
      // Dedupe and group low contrast by text
      const lcByText = new Map();
      for (const lc of analysis.realLowContrast) {
        const key = lc.text.slice(0, 40);
        if (!lcByText.has(key)) lcByText.set(key, { ...lc, count: 1 });
        else lcByText.get(key).count++;
      }
      const uniqueLowContrast = [...lcByText.values()].sort((a, b) => b.count - a.count).slice(0, 10);
      allResults.push({
        route: route.path,
        id: route.id,
        viewport: vp.name,
        status,
        horizontalOverflow: analysis.horizontalOverflow,
        docW: analysis.docW,
        winW: analysis.winW,
        docH: analysis.docH,
        clippedHeadings: analysis.clippedHeadings,
        lowContrastCount: analysis.realLowContrast.length,
        lowContrastExamples: uniqueLowContrast,
        headingsCount: analysis.headings.length,
        headingsSample: analysis.headings.slice(0, 6),
        hasMainOffset: analysis.hasMainOffset,
        hasMobileNav: analysis.hasMobileNav,
        file: fileName,
      });
    } catch {
      allResults.push({ route: route.path, id: route.id, viewport: vp.name, error: e.message });
    }
  }
  await ctx.close();
}

await browser.close();

const summary = {
  total: allResults.length,
  successful: allResults.filter((r) => r.status === 200).length,
  failed: allResults.filter((r) => r.status && r.status !== 200).length,
  errored: allResults.filter((r) => !!r.error).length,
  withHorizontalOverflow: allResults.filter((r) => r.horizontalOverflow).length,
  withRealLowContrast: allResults.filter((r) => r.lowContrastCount > 5).length,
  withMainOffsetIssues: allResults.filter((r) => r.hasMainOffset === false).length,
  withoutMobileNavAtMobile: allResults.filter((r) => parseInt(r.viewport.split('x')[0]) < 768 && !r.hasMobileNav).length,
};
writeFileSync('/tmp/opencode/runtime/visual-qa-report.json', JSON.stringify({ summary, results: allResults }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('\n--- ISSUES ---');
const overflowRoutes = allResults.filter((r) => r.horizontalOverflow);
if (overflowRoutes.length) console.log('Horizontal overflow:', overflowRoutes.map((r) => `${r.route}@${r.viewport}`));
else console.log('Horizontal overflow: none');
const offsetRoutes = allResults.filter((r) => r.hasMainOffset === false);
if (offsetRoutes.length) console.log('Main offset issues:', offsetRoutes.map((r) => `${r.route}@${r.viewport}`));
else console.log('Main offset issues: none');
const noNavRoutes = allResults.filter((r) => parseInt(r.viewport.split('x')[0]) < 768 && !r.hasMobileNav);
if (noNavRoutes.length) console.log('No mobile nav (<768):', noNavRoutes.map((r) => `${r.route}@${r.viewport}`));
else console.log('No mobile nav: none');
const lcRoutes = allResults.filter((r) => r.lowContrastCount > 5);
if (lcRoutes.length) {
  console.log('\n--- LOW CONTRAST HOTSPOTS (>5 elements) ---');
  for (const r of lcRoutes.slice(0, 15)) {
    console.log(`${r.route}@${r.viewport}: ${r.lowContrastCount} elements`);
    for (const ex of r.lowContrastExamples.slice(0, 3)) {
      console.log(`   ${ex.tag} "${ex.text}" ratio=${ex.ratio} fg=${ex.fg} (x${ex.count})`);
    }
  }
}
