/** Local-only rendered evidence. No production session or remote writes. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const base = process.env.RADAR_QA_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base);
assert(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname), 'QA requires localhost');
const out = resolve(process.env.RADAR_QA_OUTPUT_DIR ?? '.tmp-qa/radar-vnext');
const snapshots = process.env.RADAR_QA_SNAPSHOT_DIR;
const widths = process.env.RADAR_QA_STATES_ONLY ? [] : process.env.RADAR_QA_WIDTHS ? process.env.RADAR_QA_WIDTHS.split(",").map(Number) : [320, 344, 360, 375, 390, 393, 414, 430, 480, 768, 1024, 1280, 1440, 1600, 1728, 1920];
await mkdir(out, { recursive: true });
const live = snapshots ? Object.fromEntries(await Promise.all(['day', 'week', 'month'].map(async range => [range, JSON.parse(await readFile(resolve(snapshots, `${range}.json`), 'utf8'))]))) : null;
const report = { data: live ? 'Captured public Product Hunt snapshots; original source timestamps retained' : 'Existing labelled development fixture', browsers: [], wrongSelection: 0, rangeViolation: 0, selectionChecks: 0, checks: [], issues: [] };
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', email: 'radar-qa@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-10-08T12:00:00Z' };

async function contextFor(browser, width, authenticated = true) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: 'reduce', colorScheme: 'dark', locale: 'it-IT', timezoneId: 'Europe/Rome' });
  if (authenticated) await ctx.addInitScript(({ user }) => {
    const payload = btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 86400 }));
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.qa`, refresh_token: 'local-qa-only', expires_at: Math.floor(Date.now() / 1000) + 86400, expires_in: 86400, token_type: 'bearer', user }));
  }, { user });
  await ctx.route('**/auth/v1/**', route => route.fulfill({ json: user }));
  await ctx.route('**/api/workspace**', route => route.fulfill({ json: { ok: false, meta: { mode: 'local', remote_available: false, viewer_kind: authenticated ? 'account' : 'guest' } } }));
  await ctx.route('**/api/signal-progression/**', route => route.fulfill({ json: { ok: true, deliveries: [], pending: [], items: [] } }));
  await ctx.route('**/api/rewards/**', route => route.fulfill({ json: { ok: true, items: [] } }));
  // Interception never extends to a non-local application origin.
  await ctx.route('**/api/product-hunt?**', async route => {
    const url = new URL(route.request().url());
    assert.equal(url.origin, origin.origin);
    if (live) await route.fulfill({ json: live[url.searchParams.get('range') ?? 'day'] });
    else await route.continue();
  });
  return ctx;
}
async function open(page, query = '') {
  const response = await page.goto(`${base}/radar${query}`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  if (await page.getByRole('button', { name: 'Rifiuta non necessari' }).count()) await page.getByRole('button', { name: 'Rifiuta non necessari' }).click();
  await page.locator('.tv-rx').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({content: "nextjs-portal { display: none; }"});
}
async function geometry(page, tag) {
  const result = await page.evaluate(() => {
    const map = document.querySelector('.tv-rx-map')?.getBoundingClientRect();
    const controls = [...document.querySelectorAll('.tv-rx__tab,.tv-rx-range__option,.tv-rx-preview__actions > *')].map(el => {
      const r = el.getBoundingClientRect(); return { text: el.textContent, x: r.x, right: r.right, width: r.width, height: r.height };
    });
    const tabs = document.querySelector('.tv-rx__tabs');
    return { width: innerWidth, scrollX, root: document.querySelector(".tv-rx").getBoundingClientRect().toJSON(), ancestors: (()=>{let el=document.querySelector(".tv-rx");const items=[];while(el){items.push({class:el.className,scrollLeft:el.scrollLeft,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflowX:getComputedStyle(el).overflowX,x:el.getBoundingClientRect().x});el=el.parentElement;}return items;})(), scrollWidth: document.documentElement.scrollWidth, circular: !map || Math.abs(map.width - map.height) < 1, controls, clippedTabs: tabs.scrollWidth > tabs.clientWidth + 1 };
  });
  report.checks.push({ tag, ...result });
  if (result.controls.some(control => control.x < -1)) await page.screenshot({path: resolve(out, `${tag}-failure.png`)});
  assert(result.scrollWidth <= result.width + 1, `${tag}: overflow`);
  assert(result.circular, `${tag}: non-circular instrument`);
  assert(!result.clippedTabs, `${tag}: clipped modes`);
  for (const control of result.controls) assert(control.x >= -1 && control.right <= result.width + 1 && control.height >= 43, `${tag}: clipped/short control ${control.text}`);
}
async function shot(page, name, fullPage = false) {
  await page.evaluate(() => {
    document.querySelector('.marketing-shell')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: resolve(out, name), fullPage });
}
async function selectAll(page, tag) {
  const hits = page.locator('.tv-rx-blip__hit');
  const count = await hits.count();
  for (let index = 0; index < count; index++) {
    const label = await hits.nth(index).getAttribute('aria-label');
    await hits.nth(index).click();
    const title = await page.locator('.tv-rx-preview__title').textContent();
    if (!label.startsWith(`${title}.`)) report.wrongSelection++;
    assert(label.startsWith(`${title}.`), `${tag}: wrong selected signal`);
    report.selectionChecks++;
    assert(await page.locator('.tv-rx-map').isVisible());
    await page.keyboard.press('Escape');
    await page.locator('.tv-rx-preview').waitFor({ state: 'detached' });
  }
}

async function verifyStates(browser, engine) {
  for (const width of [390, 1440]) {
    for (const state of ['loading', 'empty', 'error', 'missing-token', 'stale']) {
      const ctx = await contextFor(browser, width);
      let release;
      const pending = new Promise(resolve => { release = resolve; });
      await ctx.route('**/api/product-hunt?**', async route => {
        const range = new URL(route.request().url()).searchParams.get('range');
        const payload = { ...(live?.[range] ?? { range, source: 'none', updatedAt: new Date().toISOString() }), status: 'ok', stale: false, items: [] };
        if (state === 'loading') await pending;
        if (state === 'error' || state === 'missing-token') payload.status = state;
        if (state === 'stale') Object.assign(payload, live?.[range], { stale: true, updatedAt: '2026-10-08T12:00:00Z' });
        await route.fulfill({ json: payload });
      });
      const page = await ctx.newPage();
      if (state === 'loading') {
        await page.goto(`${base}/radar`, { waitUntil: 'domcontentloaded' });
        await page.locator('.tv-rx-map--skeleton').waitFor();
      } else await open(page);
      assert.equal(await page.locator('.tv-rx').getAttribute('data-state'), state);
      await geometry(page, `${engine}-${width}-${state}`);
      await shot(page, `${engine}-${width}-${state}.png`);
      if (state !== 'stale') assert.equal(await page.locator('.tv-rx-blip__hit').count(), 0);
      if (state === 'error' || state === 'missing-token') assert(await page.getByRole('button', { name: 'Aggiorna i dati', exact: true }).count());
      release();
      await ctx.close();
    }
    const ctx = await contextFor(browser, width);
    // Existing, explicitly labelled development fixture exercises catalog CTA contracts.
    await ctx.route('**/api/product-hunt?**', route => route.continue());
    const page = await ctx.newPage();
    await open(page);
    assert.equal(await page.locator('.tv-rx').getAttribute('data-state'), 'fixture');
    await page.getByRole('tab', { name: 'Per te', exact: true }).click();
    assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'), 'cold');
    await shot(page, `${engine}-${width}-personal-cold.png`, true);
    await page.getByRole('tab', { name: 'Watchlist', exact: true }).click();
    assert(await page.getByText('La tua Watchlist è vuota.', { exact: false }).count());
    await shot(page, `${engine}-${width}-watch-empty.png`, true);
    await page.getByRole('tab', { name: 'Panoramica', exact: true }).click();
    await page.locator('.tv-rx-chip').filter({ hasText: 'Sviluppo & Coding' }).first().click();
    const blink = page.locator('.tv-rx-blip__hit[aria-label^="Blink."]');
    await blink.focus();
    await page.keyboard.press("Enter");
    await page.locator(".tv-rx-preview").waitFor();
    assert.equal(await page.locator('.tv-rx-preview').getAttribute('data-catalog-status'), 'linked');
    assert(await page.locator('.tv-rx-preview a[href="/toools/blink"]').count());
    const save = page.locator('.tv-rx-preview [data-sonic-action="save"]');
    await save.click();
    assert.equal(await save.getAttribute('aria-pressed'), 'true');
    const compare = page.locator('.tv-rx-preview [data-sonic-action="compare"]');
    await compare.click();
    assert.equal(await compare.getAttribute('aria-pressed'), 'true');
    await page.locator('.tv-rx-preview__watch').evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.locator(".tv-compare-dock").waitFor();
    const clearance = await page.locator('.tv-rx-preview__watch').evaluate(el => {
      const action = el.getBoundingClientRect();
      const dock = document.querySelector('.tv-compare-dock');
      return { bottom: action.bottom, dockTop: dock?.getBoundingClientRect().top ?? innerHeight, padding: parseFloat(getComputedStyle(document.querySelector('.tv-rx')).paddingBottom) };
    });
    assert(clearance.bottom <= clearance.dockTop + 1, 'Watch action reachable above Compare Dock');
    report.checks.push({ tag: `${engine}-${width}-dock-reachability`, ...clearance });
    await geometry(page, `${engine}-${width}-save-compare-dock`);
    await page.screenshot({ path: resolve(out, `${engine}-${width}-linked-save-compare.png`) });
    assert.equal(await page.locator('.tv-rx-preview__close').evaluate(el => el === document.activeElement), false);
    await page.keyboard.press('Escape');
    await page.locator(".tv-rx-preview").waitFor({state:"detached"});
    assert.equal(await blink.evaluate(el => el === document.activeElement), true);
    await page.getByRole('tab', { name: 'Per te', exact: true }).click();
    assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'), 'useful');
    await ctx.route('**/api/product-hunt?**', route => route.fulfill({ json: { status: 'ok', source: 'product-hunt-live', stale: false, range: 'month', updatedAt: new Date().toISOString(), items: [] } }));
    await open(page, '?v=per-te&r=month');
    assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'), 'partial');
    await shot(page, `${engine}-${width}-personal-partial.png`, true);
    await ctx.close();
  }
}

try {
for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await browserType.launch();
  report.browsers.push(engine);
  for (const width of widths) {
    const ctx = await contextFor(browser, width);
    const page = await ctx.newPage();
    page.on('pageerror', error => report.issues.push({ engine, width, kind: 'pageerror', message: error.message }));
    page.on('console', message => { if (message.type() === 'error') report.issues.push({ engine, width, kind: 'console', message: message.text() }); });
    await open(page);
    await geometry(page, `${engine}-${width}-overview`);
    if (engine === 'chromium') await shot(page, `RADAR-VNEXT-RESPONSIVE-${width}.png`);
    const category = page.locator('.tv-rx-chip').filter({ hasText: 'Sviluppo & Coding' }).first();
    await category.click();
    await geometry(page, `${engine}-${width}-local`);
    // Physical click verifies painting and hit testing use the same display map.
    await selectAll(page, `${engine}-${width}-local`);
    const first = page.locator('.tv-rx-blip__hit').first();
    await first.click();
    await geometry(page, `${engine}-${width}-selected`);
    await page.keyboard.press('Escape');
    if ([390, 1440].includes(width)) {
      const device = width === 390 ? 'MOBILE' : 'DESKTOP';
      const prefix = engine === 'chromium' ? '' : 'WEBKIT-';
      await page.getByRole('button', { name: 'Panoramica', exact: true }).click();
      await shot(page, `${prefix}RADAR-VNEXT-${device}-OVERVIEW.png`, true);
      await category.click();
      await shot(page, `${prefix}RADAR-VNEXT-${device}-LOCAL.png`, true);
      await first.click();
      await page.screenshot({ path: resolve(out, `${prefix}RADAR-VNEXT-${device}-SELECTED.png`) });
      await page.locator('.tv-rx-preview__watch').click();
      assert.equal(await page.locator('.tv-rx-preview__watch').getAttribute('aria-pressed'), 'true');
      await page.keyboard.press('Escape');
      await page.getByRole('tab', { name: 'Trend', exact: true }).click();
      await geometry(page, `${engine}-${width}-trend`);
      await shot(page, `${prefix}RADAR-VNEXT-${device}-TREND.png`, true);
      assert(await page.getByText('Dati storici in raccolta', { exact: true }).count());
      await page.getByRole('tab', { name: 'Per te', exact: true }).click();
      await geometry(page, `${engine}-${width}-personal`);
      await shot(page, `${prefix}RADAR-VNEXT-${device}-PERSONAL.png`, true);
      assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'), 'useful');
      await page.getByRole('tab', { name: 'Watchlist', exact: true }).click();
      await geometry(page, `${engine}-${width}-watchlist`);
      await shot(page, `${prefix}RADAR-VNEXT-${device}-WATCHLIST.png`, true);
      assert.equal(await page.locator('.tv-rx-watch__monitored-list > li').count(), 1);
      const watchBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('tooolvibes:workspace:v1:account:00000000-0000-4000-8000-000000000001')).radarWatch);
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('.tv-rx[data-qa-radar-ready="true"]').waitFor();
      const watchAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('tooolvibes:workspace:v1:account:00000000-0000-4000-8000-000000000001')).radarWatch);
      assert.deepEqual(watchAfter, watchBefore, 'Watch durable persistence');
      report.checks.push({tag: `${engine}-${width}-watch-reload`, durablePersistence: true, displayedMatches: await page.locator('.tv-rx-watch__monitored-list > li').count(), baselineLimitation: 'Existing store hydrate projects collections but omits radarWatch fields; canonical storage is preserved. Frozen store not changed.'});
      await page.getByRole('tab', { name: 'Panoramica', exact: true }).click();
      await page.getByRole('button', { name: 'Tutti', exact: true }).click();
      for (const [label, range, hours] of [['24H', 'day', 24], ['7G', 'week', 168], ['30G', 'month', 720]]) {
        const rangeButton = page.getByRole('button', { name: label, exact: true });
        if (await rangeButton.getAttribute('aria-pressed') !== 'true') await Promise.all([page.waitForResponse(response => response.url().includes(`/api/product-hunt?range=${range}`)), rangeButton.click()]);
        const payload = live?.[range] ?? await (await page.request.get(`${base}/api/product-hunt?range=${range}`)).json();
        const violations = payload.items.filter(item => item.launchedAt && (Date.parse(payload.updatedAt) - Date.parse(item.launchedAt)) / 3600000 > hours);
        report.rangeViolation += violations.length;
        assert.equal(violations.length, 0, `range ${range}`);
        await geometry(page, `${engine}-${width}-${range}`);
      }
      await page.addScriptTag({ path: resolve('node_modules/axe-core/axe.min.js') });
      for (const tab of ['Panoramica', 'Trend', 'Per te', 'Watchlist']) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        const axe = await page.evaluate(async () => {
          const results = await window.axe.run(document.querySelector('.tv-rx'));
          return results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
        });
        report.checks.push({ tag: `${engine}-${width}-${tab}-axe`, violations: axe });
        assert(!axe.some(item => ['serious', 'critical'].includes(item.impact)), `axe ${engine} ${width} ${tab}`);
      }
      // Roving keyboard focus must follow selection and preserve tab semantics.
      const overview = page.getByRole('tab', { name: 'Panoramica', exact: true });
      await overview.click(); await overview.focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.getByRole('tab', { name: 'Trend', exact: true }).getAttribute('aria-selected'), 'true');
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await geometry(page, `${engine}-${width}-light-reduced-motion`);
    }
    await ctx.close();
    console.log(`${engine} ${width}: passed`);
  }
  const guest = await contextFor(browser, 390, false);
  const guestPage = await guest.newPage(); let radarRequests = 0;
  guestPage.on('request', request => { if (request.url().includes('/api/product-hunt')) radarRequests++; });
  await guestPage.goto(`${base}/radar`, { waitUntil: 'networkidle' });
  assert.equal(await guestPage.locator('.tv-rx').count(), 0);
  assert(await guestPage.getByRole('link', { name: 'Entra per continuare' }).count());
  assert.equal(radarRequests, 0);
  await guestPage.screenshot({ path: resolve(out, `${engine}-guest-gate.png`) });
  await guest.close();
  if (process.env.RADAR_QA_STATES_ONLY) await verifyStates(browser, engine);
  await browser.close();
}
} finally {
  await writeFile(resolve(out, process.env.RADAR_QA_REPORT_NAME ?? 'RADAR-VNEXT-QA.json'), JSON.stringify(report, null, 2));
}
assert.equal(report.wrongSelection, 0);
assert.equal(report.rangeViolation, 0);
assert.equal(report.issues.filter(issue => issue.kind === 'pageerror' || /hydration/i.test(issue.message)).length, 0);
console.log(`QA complete: ${report.selectionChecks} physical selections, 0 wrong selections, 0 range violations`);
