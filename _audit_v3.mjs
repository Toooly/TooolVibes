#!/usr/bin/env node
/**
 * Audit v3 — single-pass page.evaluate to avoid Playwright locator issues.
 * Returns: for each visible text element, computed color + effective bg + ratio.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('artifacts/audit-v3');
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  'home', 'archivio', 'radar', 'compare', 'shortlist', 'wishlist', 'tags', 'collections',
  'community', 'contributi', 'chi-siamo', 'metodo', 'affiliati', 'shop', 'studio',
  'posts', 'product-hunt', 'cookie', 'privacy', 'termini', 'account',
  'posts/betterpic', 'posts/reclaim-ai', 'posts/windsor-ai',
  'toools/blink', 'toools/betterpic', 'toools/make', 'toools/flowise', 'toools/imagine-art', 'toools/v0',
];

const VIEWPORTS = process.env.AUDIT_FAST
  ? [
      { name: 'mobile-375',  width: 375,  height: 812,  isMobile: true,  dpr: 2 },
      { name: 'desktop-1440', width: 1440, height: 900,  isMobile: false, dpr: 1 },
    ]
  : [
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

// WCAG utilities (same as v2)
function parseColor(c) {
  if (!c || c === 'transparent') return null;
  const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}
function lum({ r, g, b }) {
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}
function composite(fg, bg) {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
  };
}
function ratio(fg, bg) {
  const L1 = Math.max(lum(fg), lum(bg));
  const L2 = Math.min(lum(fg), lum(bg));
  return (L1 + 0.05) / (L2 + 0.05);
}

async function auditRoute(browser, route, vp) {
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
    await page.waitForTimeout(800);
    const safe = route.replace(/\//g, '-');
    await page.screenshot({ path: path.join(OUT, `${safe}_${vp.name}.png`), fullPage: true });

    // Single-pass: walk all elements, compute effective bg for each, return issues
    const found = await page.evaluate(() => {
      const parseRgb = (c) => {
        if (!c) return null;
        const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
      };
      const composite = (fg, bg) => {
        if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 };
        return {
          r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
          g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
          b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
          a: 1,
        };
      };
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.1;
      };
      const TEXTY = new Set(['p','h1','h2','h3','h4','h5','h6','span','a','li','dt','dd','button','label','small','strong','em','b','i','u','td','th','figcaption','time']);
      const toLin = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = ({r,g,b}) => 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
      const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
      const issues = [];
      const seen = new Set();
      // Use querySelectorAll('*') to walk every element
      document.querySelectorAll('*').forEach((el) => {
        if (!isVisible(el)) return;
        const tag = el.tagName.toLowerCase();
        let directText = '';
        for (const c of el.childNodes) {
          if (c.nodeType === 3) directText += c.textContent;
        }
        const text = directText.trim();
        if (!text) return;
        if (text.length > 200) return;
        const k = `${tag}:${text}`;
        if (seen.has(k)) return;
        seen.add(k);
        const cs = getComputedStyle(el);
        const color = parseRgb(cs.color);
        if (!color) return;
        const fontSize = parseFloat(cs.fontSize) || 16;
        // Walk up layers
        let acc = { r: 8, g: 8, b: 10, a: 1 };
        const bodyBg = parseRgb(getComputedStyle(document.body).backgroundColor);
        if (bodyBg) acc = { ...bodyBg, a: bodyBg.a };
        const layers = [];
        let cur = el;
        while (cur && cur !== document.documentElement) {
          const ccs = getComputedStyle(cur);
          ['::before', '::after'].forEach((p) => {
            const pcs = getComputedStyle(cur, p);
            const pbg = pcs.backgroundColor;
            const pimg = pcs.backgroundImage;
            if (pimg && pimg !== 'none' && /gradient/.test(pimg)) {
              const pm = parseRgb(pbg);
              if (pm && pm.a > 0.05) layers.push({ type: 'pseudo', color: pm });
            }
          });
          const bg = parseRgb(ccs.backgroundColor);
          if (bg && bg.a > 0.05) layers.push({ type: 'solid', color: bg });
          cur = cur.parentElement;
        }
        for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i];
          if (layer.type === 'solid' || layer.type === 'pseudo') {
            acc = composite(layer.color, acc);
          }
        }
        const bgSolid = { r: acc.r, g: acc.g, b: acc.b };
        const effectiveFg = composite(color, bgSolid);
        const r = ratio(effectiveFg, bgSolid);
        const isLargeText = fontSize >= 24;
        const minRatio = isLargeText ? 3 : 4.5;
        if (r < minRatio) {
          issues.push({ type: 'critical-contrast', ratio: r.toFixed(2), minRatio, tag, text: text.slice(0, 80), color: cs.color, bg: `rgb(${bgSolid.r}, ${bgSolid.g}, ${bgSolid.b})`, fontSize, isLargeText });
        } else if (r < minRatio + 2) {
          issues.push({ type: 'poor-contrast', ratio: r.toFixed(2), minRatio, tag, text: text.slice(0, 80), color: cs.color, bg: `rgb(${bgSolid.r}, ${bgSolid.g}, ${bgSolid.b})`, fontSize, isLargeText });
        }
      });
      return { issues, total: seen.size };
    });

    issues.push(...found.issues);
  } catch (e) {
    issues.push({ type: 'error', message: e.message });
  } finally {
    await ctx.close();
  }
  return { route, vp: vp.name, issues };
}

const allResults = [];
const browser = await chromium.launch();
for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const start = Date.now();
    const r = await auditRoute(browser, route, vp);
    allResults.push(r);
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    const crit = r.issues.filter(i => i.type === 'critical-contrast').length;
    const poor = r.issues.filter(i => i.type === 'poor-contrast').length;
    const err = r.issues.filter(i => i.type === 'error').length;
    console.log(`[${dur}s] ${route} @ ${vp.name}: crit=${crit} poor=${poor} err=${err}`);
  }
}
await browser.close();

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(allResults, null, 2));
console.log(`\nReport saved to ${path.join(OUT, 'report.json')}`);
