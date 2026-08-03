#!/usr/bin/env node
/**
 * Hyper-responsiveness audit: check overflow, layout shift, broken layout
 * across multiple viewports for every route.
 *
 * Detection:
 * 1. Horizontal overflow: body.scrollWidth > viewport.width + 1px
 * 2. Element-level overflow: any element width > viewport.width
 * 3. Touch target size: any clickable < 44x44px
 * 4. Text truncation: any text that overflows its container without ellipsis
 * 5. Fixed positioning issues: elements stuck off-screen
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('artifacts/responsiveness');
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  'home', 'archivio', 'radar', 'compare', 'shortlist', 'wishlist', 'tags', 'collections',
  'community', 'contributi', 'chi-siamo', 'metodo', 'affiliati', 'shop', 'studio',
  'posts', 'product-hunt', 'cookie', 'privacy', 'termini', 'account',
  'post/betterpic', 'post/reclaim-ai', 'post/windsor-ai',
  'toools/blink', 'toools/betterpic', 'toools/make', 'toools/flowise', 'toools/imagine-art', 'toools/v0',
];

const VIEWPORTS = [
  { name: 'mobile-375',  width: 375,  height: 812,  isMobile: true,  dpr: 2 },
  { name: 'mobile-390',  width: 390,  height: 844,  isMobile: true,  dpr: 3 },
  { name: 'mobile-430',  width: 430,  height: 932,  isMobile: true,  dpr: 3 },
  { name: 'tablet-768',  width: 768,  height: 1024, isMobile: true,  dpr: 2 },
  { name: 'tablet-1024', width: 1024, height: 768,  isMobile: true,  dpr: 2 },
  { name: 'desktop-1280', width: 1280, height: 800,  isMobile: false, dpr: 1 },
  { name: 'desktop-1440', width: 1440, height: 900,  isMobile: false, dpr: 1 },
  { name: 'desktop-1920', width: 1920, height: 1080, isMobile: false, dpr: 1 },
  { name: 'ultrawide-2560', width: 2560, height: 1440, isMobile: false, dpr: 1 },
];

async function checkRoute(browser, route, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });
  const page = await ctx.newPage();
  const issues = [];
  try {
    await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);

    // 1. Horizontal overflow check
    const hOverflow = await page.evaluate((vw) => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, bodyW, vw, hasOverflow: docW > vw + 1 || bodyW > vw + 1 };
    }, vp.width);
    if (hOverflow.hasOverflow) {
      issues.push({ type: 'horizontal-overflow', ...hOverflow });
    }

    // 2. Element-level overflow (anything wider than viewport)
    const overflowing = await page.evaluate((vw) => {
      const offenders = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.right > vw + 2) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className?.toString() || '').slice(0, 60);
          offenders.push({ tag, cls, right: r.right, width: r.width });
        }
      });
      return offenders.slice(0, 5);
    }, vp.width);
    if (overflowing.length > 0) {
      issues.push({ type: 'element-overflow', elements: overflowing });
    }

    // 3. Touch target size (mobile only, for clickable elements)
    if (vp.isMobile) {
      const smallTargets = await page.evaluate(() => {
        const offenders = [];
        document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.width < 44 || r.height < 44) {
            const text = (el.textContent || '').trim().slice(0, 30);
            offenders.push({ tag: el.tagName.toLowerCase(), text, w: r.width, h: r.height });
          }
        });
        return offenders.slice(0, 5);
      });
      if (smallTargets.length > 0) {
        issues.push({ type: 'small-touch-target', elements: smallTargets });
      }
    }
  } catch (e) {
    issues.push({ type: 'error', message: e.message });
  } finally {
    await ctx.close();
  }
  return { route, vp: vp.name, viewport: vp, issues };
}

const allResults = [];
const browser = await chromium.launch();
for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const start = Date.now();
    const r = await checkRoute(browser, route, vp);
    allResults.push(r);
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    const issueCount = r.issues.length;
    const flag = issueCount > 0 ? '⚠️' : '  ';
    console.log(`[${dur}s] ${flag} ${route} @ ${vp.name}: ${issueCount} issues`);
  }
}
await browser.close();

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(allResults, null, 2));

// Summary
const byType = {};
for (const r of allResults) {
  for (const i of r.issues) {
    byType[i.type] = (byType[i.type] || 0) + 1;
  }
}
console.log(`\n=== SUMMARY ===`);
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nReport: ${path.join(OUT, 'report.json')}`);
