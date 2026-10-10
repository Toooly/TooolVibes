/** Local-only rendered evidence. No production session or remote writes. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const base = process.env.RADAR_QA_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base);
assert(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname), 'QA requires localhost');
const out = resolve(process.env.RADAR_QA_OUTPUT_DIR ?? '.tmp-qa/radar-finalref');
const snapshots = process.env.RADAR_QA_SNAPSHOT_DIR;
const widths = process.env.RADAR_QA_STATES_ONLY ? [] : process.env.RADAR_QA_WIDTHS ? process.env.RADAR_QA_WIDTHS.split(",").map(Number) : [320, 390, 768, 1024, 1280, 1440, 1600, 1728, 1920];
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

async function axe(page, tag) {
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({path:resolve('node_modules/axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('.tv-rx'))).violations.map(({id,impact,nodes})=>({id,impact,targets:nodes.map(n=>n.target)})));
  report.checks.push({tag,violations}); assert(!violations.some(v=>['serious','critical'].includes(v.impact)),tag);
}
async function capture(page, engine, width, state) {
  const prefix=width===390?'':`DESKTOP-${width}-`;
  await page.screenshot({path:resolve(out,`${engine==='chromium'?'':'WEBKIT-'}RADAR-FINALREF-${prefix}${state}.png`)});
}
async function top(page) { await page.evaluate(()=>{document.querySelector('.marketing-shell')?.scrollTo({top:0,left:0,behavior:'instant'});window.scrollTo(0,0);}); }
try {
for (const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
  const browser=await type.launch();report.browsers.push(engine);
  for (const width of widths) {
    const ctx=await contextFor(browser,width); const page=await ctx.newPage();
    await page.addInitScript(()=>{
      window.__radarPerf={ready:false,startupCLS:0,interactionCLS:0,longTasks:[]};
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput) window.__radarPerf[window.__radarPerf.ready?'interactionCLS':'startupCLS']+=e.value;})).observe({type:'layout-shift',buffered:true});
      if(PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(window.__radarPerf.ready)window.__radarPerf.longTasks.push(e.duration);})).observe({type:'longtask',buffered:true});
    });
    page.on('pageerror',e=>report.issues.push({engine,width,kind:'pageerror',message:e.message}));
    page.on('console',m=>{if(m.type()==='error')report.issues.push({engine,width,kind:'console',message:m.text()});});
    await open(page);assert((await page.title()).includes('Radar'));assert.equal(await page.locator('nextjs-portal [data-nextjs-dialog]').count(),0);
    await page.evaluate(()=>{window.__radarPerf.ready=true;});
    await geometry(page,`${engine}-${width}-overview`);await capture(page,engine,width,'OVERVIEW');if(width>=1024)await axe(page,`${engine}-${width}-overview-axe`);
    await page.getByRole('button',{name:/Sviluppo & Coding/}).first().click();await top(page);await geometry(page,`${engine}-${width}-local`);
    if(width===390)await capture(page,engine,width,'LOCAL');
    await selectAll(page,`${engine}-${width}-local`);
    const first=page.locator('.tv-rx-blip__hit').first();await first.scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>({url:location.search,scroll:document.querySelector('.marketing-shell')?.scrollTop,hits:[...document.querySelectorAll('.tv-rx-blip__hit')].map(el=>[el.getAttribute('cx'),el.getAttribute('cy')])}));
    await first.focus();await page.keyboard.press('Enter');await page.locator('.tv-rx-preview').waitFor();await geometry(page,`${engine}-${width}-selected`);
    assert.equal(await page.locator('.tv-rx-preview__close').evaluate(el=>el===document.activeElement),true);
    if(width<1024){
      assert.equal(await page.locator('.tv-rx-preview__snap').getAttribute('aria-expanded'),'false');
      const visible=await page.evaluate(()=>{const s=document.querySelector('.tv-rx-preview').getBoundingClientRect(),m=document.querySelector('.tv-rx-map').getBoundingClientRect(),h=document.querySelector('header')?.getBoundingClientRect();return {sheet:s.toJSON(),map:m.toJSON(),contextRatio:s.top/innerHeight,visibleMapHeight:Math.max(0,Math.min(m.bottom,s.top)-Math.max(m.top,h?.bottom??0)),actions:[...document.querySelectorAll('.tv-rx-preview__actions > *')].map(el=>el.getBoundingClientRect().toJSON())};});
      assert(visible.visibleMapHeight>80, 'Meaningful map remains visible');
      report.checks.push({tag:`${engine}-${width}-compact-context`,...visible});
      if(width===390)await capture(page,engine,width,'SELECTED-COMPACT');await axe(page,`${engine}-${width}-selected-compact-axe`);
      await page.locator('.tv-rx-preview__snap').click();assert.equal(await page.locator('.tv-rx-preview__snap').getAttribute('aria-expanded'),'true');
      if(width===390)await capture(page,engine,width,'SELECTED-EXPANDED');await axe(page,`${engine}-${width}-selected-expanded-axe`);
      await page.locator('.tv-rx-preview__snap').click();
    }else{await top(page);await capture(page,engine,width,'SELECTED');await axe(page,`${engine}-${width}-selected-axe`);}
    assert(await page.locator('.tv-rx-preview__primary').getAttribute('href'));assert.equal(await page.locator('.tv-rx-preview__primary').getAttribute('target'),'_blank');
    await page.keyboard.press('Escape');await page.locator('.tv-rx-preview').waitFor({state:'detached'});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const after=await page.evaluate(()=>({url:location.search,scroll:document.querySelector('.marketing-shell')?.scrollTop,hits:[...document.querySelectorAll('.tv-rx-blip__hit')].map(el=>[el.getAttribute('cx'),el.getAttribute('cy')])}));
    assert.equal(after.url,before.url);assert.deepEqual(after.hits,before.hits);assert(Math.abs(after.scroll-before.scroll)<2,'Local scroll restored');assert(await first.evaluate(el=>el===document.activeElement));
    report.checks.push({tag:`${engine}-${width}-local-preserved`,before,after});
    await page.getByRole('tab',{name:'Trend',exact:true}).click();assert(await page.locator('.tv-rx-trend').isVisible());
    await page.getByRole('tab',{name:'Per te',exact:true}).click();await top(page);assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'),'cold');await capture(page,engine,width,'PERSONAL');await axe(page,`${engine}-${width}-personal-cold-axe`);
    await page.getByRole('tab',{name:'Watchlist',exact:true}).click();await top(page);assert.equal(await page.locator('.tv-rx-watch').getAttribute('data-watch-density'),'empty');await capture(page,engine,width,'WATCHLIST-EMPTY');await axe(page,`${engine}-${width}-watch-empty-axe`);
    await page.locator('.tv-rx-watch__picker summary').click();const toggles=page.locator('.tv-rx-watch__tool button');await toggles.nth(0).click();assert.equal(await page.locator('.tv-rx-watch__monitored-list > li').count(),1);await page.locator('.tv-rx-watch__picker summary').click();await top(page);await capture(page,engine,width,'WATCHLIST-ONE');
    await page.locator('.tv-rx-watch__picker summary').click();await toggles.nth(1).click();await toggles.nth(2).click();await page.locator('.tv-rx-watch__picker summary').click();await top(page);assert.equal(await page.locator('.tv-rx-watch__monitored-list > li').count(),3);await capture(page,engine,width,'WATCHLIST');await axe(page,`${engine}-${width}-watch-multi-axe`);
    await page.getByRole('tab',{name:'Per te',exact:true}).click();await top(page);assert.equal(await page.locator('.tv-rx-personal').getAttribute('data-personal-state'),'useful');await capture(page,engine,width,'PERSONAL-MATURE');await axe(page,`${engine}-${width}-personal-mature-axe`);
    await page.getByRole('tab',{name:'Panoramica',exact:true}).click();await page.getByRole('button',{name:'Tutti',exact:true}).click();
    for(const [label,range,hours] of [['24H','day',24],['7G','week',168],['30G','month',720]]) {
      const button=page.getByRole('button',{name:label,exact:true});if(await button.getAttribute('aria-pressed')!=='true')await Promise.all([page.waitForResponse(r=>r.url().includes(`/api/product-hunt?range=${range}`)),button.click()]);
      const payload=live?.[range] ?? await (await page.request.get(`${base}/api/product-hunt?range=${range}`)).json();
      assert.equal(payload.items.filter(i=>i.launchedAt&&(Date.parse(payload.updatedAt)-Date.parse(i.launchedAt))/3600000>hours).length,0);await geometry(page,`${engine}-${width}-${range}`);
    }
    const overview=page.getByRole('tab',{name:'Panoramica',exact:true});await overview.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Trend',exact:true}).getAttribute('aria-selected'),'true');
    assert(await page.getByRole("navigation",{name:width>=1280?"Destinazioni principali":"Navigazione mobile principale"}).locator('a[href="/radar"]').count());
    await page.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});await geometry(page,`${engine}-${width}-light-reduced`);
    if(width===1920){
      await overview.click();
      for(const resized of [1440,1600,1728,1920,1024,390,1920]){
        await page.setViewportSize({width:resized,height:resized<768?844:1000});
        await geometry(page,`${engine}-resize-${resized}`);
        assert.equal(await page.locator('.tv-rx-map').count(),1);
        assert.equal(await page.locator('.tv-rx__main').count(),1);
      }
    }
    report.checks.push({tag:`${engine}-${width}-performance`,...await page.evaluate(()=>window.__radarPerf)});
    await ctx.close();console.log(`${engine} ${width}: passed`);
  }
  await browser.close();
}
}finally{await writeFile(resolve(out,'RADAR-FINALREF-QA.json'),JSON.stringify(report,null,2));}
assert.equal(report.issues.filter(i=>i.kind==='pageerror'||/hydration/i.test(i.message)).length,0);
console.log(`Final reference: ${report.selectionChecks} physical selections; zero wrong selections`);
