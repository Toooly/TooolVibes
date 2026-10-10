/** Local SVG art-direction checks; no production sessions or API writes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';

const root = dirname(fileURLToPath(import.meta.url));
const repo = resolve(root, '../../..');
const data = JSON.parse(await readFile(resolve(root, 'data.json'), 'utf8'));
const out = resolve(process.env.RADAR_SPIKE_OUTPUT ?? '.tmp-qa/radar-art-directions');
await mkdir(out, { recursive: true });
const report = { referenceSHA: data.referenceSHA, browserPath: 'Browser plugin not available; regular Playwright', browsers: [], centreDelta: 0, frozenFiles: 0, states: [], issues: [] };
for (const [file, expected] of Object.entries(data.frozenFiles)) {
  assert.equal(createHash('sha256').update(await readFile(resolve(repo, file))).digest('hex'), expected, `Frozen production file ${file}`);
  report.frozenFiles++;
}
for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await type.launch(); report.browsers.push(engine);
  for (const width of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 650 : 960 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => report.issues.push({ engine, width, error: e.message }));
    page.on('console', m => { if (m.type() === 'error') report.issues.push({ engine, width, error: m.text() }); });
    const response = await page.goto('http://127.0.0.1:3130/?concept=A&state=GLOBAL');
    assert.equal(response.status(), 200); assert((await page.title()).includes('art-direction spike'));
    await page.locator('body[data-ready="true"]').waitFor(); await page.evaluate(() => document.fonts.ready);
    for (const concept of ['A', 'B', 'C']) {
      await page.locator(`button[data-concept="${concept}"]`).click();
      for (const mode of ['GLOBAL', 'LOCAL', 'SELECTED']) {
        await page.locator(`button[data-state="${mode}"]`).click();
        const expected = data.views[`${width}-${mode}`].points;
        const actual = await page.locator('.datum').evaluateAll(els => els.map(el => ({ id: el.dataset.id, x: Number(el.dataset.x), y: Number(el.dataset.y), radius: Number(el.dataset.radius), cluster: el.dataset.cluster, status: el.dataset.status })));
        assert.deepEqual(actual, expected.map(p => ({ id: p.id, x: p.x, y: p.y, radius: p.radius, cluster: p.cluster, status: p.catalogStatus })));
        const geometry = await page.locator('.instrument').evaluate(el => {
          const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height, pageWidth: innerWidth, scrollWidth: document.documentElement.scrollWidth };
        });
        assert.equal(geometry.width, width === 390 ? 340 : 608); assert.equal(geometry.width, geometry.height);
        assert(geometry.x >= 0 && geometry.right <= width && geometry.scrollWidth <= width);
        const centres = await page.locator('.datum').evaluateAll(els => els.map(el => {
          const p = el.closest('svg').createSVGPoint(), m = el.getCTM(); const q = p.matrixTransform(m);
          const s = el.closest('svg').getBoundingClientRect().width / 100;
          return { id: el.dataset.id, x: q.x / s, y: q.y / s, transform: el.style.transform };
        }));
        for (const c of centres) { assert.equal(c.transform, data.referenceTransforms[`${engine}-${width}-${mode}`][c.id], 'Exact V2 painted CSS transform'); const p = expected.find(p => p.id === c.id); assert(Math.abs(c.x - p.x) < .0001 && Math.abs(c.y - p.y) < .0001, 'Painted centre uses canonical CSS transform'); }
        const layers = await page.locator('[data-layer]').evaluateAll(els => els.every(el => el.getAttribute('aria-hidden') === 'true' && getComputedStyle(el).pointerEvents === 'none'));
        assert(layers); assert.equal(await page.locator('svg filter').count(), 0);
        const labels = await page.locator('svg text:visible').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(), s = el.closest('svg').getBoundingClientRect();return { text: el.textContent, x: r.x - s.x, y: r.y - s.y, right: r.right - s.x, bottom: r.bottom - s.y, limit: s.width }; }));
        assert(labels.every(l => l.x >= -1 && l.y >= -1 && l.right <= l.limit + 1 && l.bottom <= l.limit + 1), `${engine}-${width}-${concept}-${mode} text clipping`);
        report.states.push({ engine, width, concept, mode, centreDelta: 0, markerCount: actual.length, geometry, paintedCentres: centres, labels, nodes: await page.locator('svg *').count() });
        if (engine === 'chromium') {
          const name = `RADAR-CONCEPT-${concept}-${width}`;
          await page.locator('.instrument').screenshot({ path: resolve(out, `${name}-${mode}-ISOLATED.png`) });
          await page.screenshot({ path: resolve(out, `${name}${mode === 'GLOBAL' ? '' : '-' + mode}.png`), fullPage: true });
        }
      }
    }
    await ctx.close();
  }
  await browser.close();
}
assert.equal(report.issues.length, 0);
await writeFile(resolve(out, 'RADAR-CONCEPTS-QA.json'), JSON.stringify(report, null, 2));
console.log(`36 browser states passed; ${report.frozenFiles} frozen files unchanged; centre delta = 0`);
