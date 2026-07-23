import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

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

async function checkPageDefects(page) {
  const defects = [];
  const findings = await page.evaluate(() => {
    const out = { lowContrast: 0, clippedHeadings: [], overflowingBoxes: [], tinyHeadings: [], hugeHeadings: [], emptyHeroPanels: [], orphans: [], totalHeadings: 0, mobileNavMissing: false, mainOffsetOK: null };
    // Check for elements with computed color equal to background (low contrast)
    const all = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button, a, li, label, dt, dd'));
    for (const el of all) {
      const text = el.textContent?.trim() ?? '';
      if (!text || text.length < 2) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = window.getComputedStyle(el);
      const fg = cs.color;
      // walk up to find first non-transparent background
      let bg = 'rgba(0, 0, 0, 0)';
      let cur = el;
      while (cur && bg === 'rgba(0, 0, 0, 0)') {
        const bcs = window.getComputedStyle(cur);
        bg = bcs.backgroundColor;
        cur = cur.parentElement;
      }
      // detect contrast ratio (simplified WCAG relative luminance)
      const parseRgb = (s) => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, b] = m[1].split(',').map((x) => parseFloat(x.trim()));
        if ([r, g, b].some((v) => isNaN(v))) return null;
        return { r, g, b };
      };
      const lum = (rgb) => {
        if (!rgb) return null;
        const toLin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
      };
      const fgRgb = parseRgb(fg);
      const bgRgb = parseRgb(bg);
      if (fgRgb && bgRgb && bg !== 'rgba(0, 0, 0, 0)') {
        const fL = lum(fgRgb), bL = lum(bgRgb);
        const ratio = (Math.max(fL, bL) + 0.05) / (Math.min(fL, bL) + 0.05);
        if (ratio < 3.0 && text.length > 5) {
          out.lowContrast++;
        }
      }
      // Detect clipped headings
      if (['H1', 'H2', 'H3'].includes(el.tagName)) {
        out.totalHeadings++;
        if (el.scrollWidth > el.clientWidth + 4) {
          out.clippedHeadings.push({ tag: el.tagName, text: text.slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth });
        }
      }
    }
    // check main top offset
    const main = document.querySelector('main');
    if (main) {
      const r = main.getBoundingClientRect();
      out.mainOffsetOK = r.top >= 60; // header is 64px
    }
    // check mobile bottom nav presence below 768
    const bottomNav = document.querySelector('.site-mobile-footer-nav, .mobile-bottom-nav, [data-mobile-bottom-nav]');
    out.mobileNavPresent = !!bottomNav;
    return out;
  });
  return { findings, defects };
}

const allResults = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const fileName = `${route.id}_${vp.name}.png`;
    try {
      const resp = await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(600);
      const status = resp ? resp.status() : 'no-response';
      const overflow = await page.evaluate(() => ({
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        docH: document.documentElement.scrollHeight,
      }));
      const { findings } = await checkPageDefects(page, route.id, vp);
      await page.screenshot({ path: `${OUT}/${fileName}`, fullPage: false });
      allResults.push({
        route: route.path,
        id: route.id,
        viewport: vp.name,
        status,
        horizontalOverflow: overflow.docW > overflow.winW + 2,
        docW: overflow.docW,
        winW: overflow.winW,
        docH: overflow.docH,
        lowContrastElements: findings.lowContrast,
        totalHeadings: findings.totalHeadings,
        clippedHeadings: findings.clippedHeadings,
        mainOffsetOK: findings.mainOffsetOK,
        mobileNavPresent: findings.mobileNavPresent,
        file: fileName,
      });
    } catch (e) {
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
  withClippedHeadings: allResults.filter((r) => r.clippedHeadings?.length > 0).length,
  withLowContrast: allResults.filter((r) => r.lowContrastElements > 30).length,  // only flag pages with many low-contrast
  withMainOffsetIssues: allResults.filter((r) => r.mainOffsetOK === false).length,
  withoutMobileNavAtMobile: allResults.filter((r) => {
    const w = parseInt(r.viewport.split('x')[0]);
    return w < 768 && !r.mobileNavPresent;
  }).length,
};
import { writeFileSync } from 'node:fs';
writeFileSync('/tmp/opencode/runtime/visual-qa-report.json', JSON.stringify({ summary, results: allResults }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('\n--- ISSUES ---');
console.log('Horizontal overflow:', allResults.filter((r) => r.horizontalOverflow).map((r) => `${r.route}@${r.viewport}`));
console.log('Clipped headings:', allResults.filter((r) => r.clippedHeadings?.length > 0).map((r) => `${r.route}@${r.viewport}: ${r.clippedHeadings.length}`));
console.log('Main offset issues:', allResults.filter((r) => r.mainOffsetOK === false).map((r) => `${r.route}@${r.viewport}`));
console.log('No mobile nav (<768):', allResults.filter((r) => parseInt(r.viewport.split('x')[0]) < 768 && !r.mobileNavPresent).map((r) => `${r.route}@${r.viewport}`));
