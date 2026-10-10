/** Local-only rendered evidence. No production session or remote writes. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const base = process.env.RADAR_QA_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base);
assert(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname), 'QA requires localhost');
const out = resolve(process.env.RADAR_QA_OUTPUT_DIR ?? '.tmp-qa/radar-instrument-v2');
const snapshots = process.env.RADAR_QA_SNAPSHOT_DIR;
const widths = process.env.RADAR_QA_STATES_ONLY ? [] : process.env.RADAR_QA_WIDTHS ? process.env.RADAR_QA_WIDTHS.split(",").map(Number) : [320,344,360,375,390,393,414,430,480,768,1024,1280,1440,1600,1728,1920];
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

const phase=process.env.RADAR_QA_PHASE ?? 'after';
assert(live,'Instrument QA requires captured public snapshots');
const baseline=phase==='after'?JSON.parse(await readFile(resolve(out,'BEFORE-DISPLAY.json'),'utf8')):null;
const display={};
async function settled(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function record(page,key,range){
 await settled(page);
 const markers=await page.locator('.tv-rx-blip').evaluateAll(els=>els.map(el=>({label:el.querySelector('.tv-rx-blip__hit').getAttribute('aria-label'),transform:el.style.transform,cluster:el.getAttribute('data-cluster'),radius:el.querySelector('.tv-rx-blip__dot').getAttribute('r'),centre:[el.querySelector('.tv-rx-blip__dot').getAttribute('cx'),el.querySelector('.tv-rx-blip__dot').getAttribute('cy')],hitRadius:el.querySelector('.tv-rx-blip__hit').getAttribute('r')})));
 display[key]=markers.map(m=>({id:live[range].items.find(i=>m.label.startsWith(i.name+'.')).id,...m}));
 if(baseline)assert.deepEqual(display[key],baseline[key],`${key}: frozen rendered centres/radii/labels/hit targets`);
 await geometry(page,key);
 const labels=await page.locator('.tv-rx-map__ring-label').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),svg=el.closest('svg').getBoundingClientRect();return {text:el.textContent,x:r.x-svg.x,y:r.y-svg.y,right:r.right-svg.x,bottom:r.bottom-svg.y,height:r.height,width:svg.width};}));
 assert(labels.every(l=>l.x>=0&&l.y>=0&&l.right<=l.width&&l.bottom<=l.width),`${key}: label bounds`);
 report.checks.push({tag:key+'-labels',labels});
}
async function captureInstrument(page,name){
 await page.locator('.tv-rx-map').screenshot({path:resolve(out,`${phase==='before'?'before/':''}${name}.png`),style:'.tv-rx-preview,.mobile-bottom-shell,.tv-compare-dock { visibility:hidden; }'});
}
async function physicalSelections(page,key){
 const hits=page.locator('.tv-rx-blip__hit');
 for(let i=0;i<await hits.count();i++){
  const label=await hits.nth(i).getAttribute('aria-label');await hits.nth(i).click();
  const name=await page.locator('.tv-rx-preview__title').textContent();report.selectionChecks++;
  if(!label.startsWith(name+'.'))report.wrongSelection++;assert(label.startsWith(name+'.'),key+' wrong selection');
  await page.keyboard.press('Escape');await page.locator('.tv-rx-preview').waitFor({state:'detached'});
 }
}
async function axe(page,key){
 if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({path:resolve('node_modules/axe-core/axe.min.js')});
 const violations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('.tv-rx'))).violations.map(({id,impact,nodes})=>({id,impact,targets:nodes.map(n=>n.target)})));
 report.checks.push({tag:key+'-axe',violations});assert(!violations.some(v=>['serious','critical'].includes(v.impact)),key+' axe');
}
try{
 await mkdir(resolve(out,'before'),{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();report.browsers.push(engine);
  for(const width of widths){
   const ctx=await contextFor(browser,width);const page=await ctx.newPage();page.on('pageerror',e=>report.issues.push({engine,width,kind:'pageerror',message:e.message}));
   await open(page);
   for(const [mode,range] of [['GLOBAL','day'],['LOCAL','day'],['SELECTED','day'],['7D','week'],['30D','month']]){
    if(mode==='LOCAL')await page.getByRole('button',{name:/Sviluppo & Coding/}).first().click();
    if(mode==='SELECTED')await page.locator('.tv-rx-blip__hit').first().click();
    if(mode==='7D'){
     await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tutti',exact:true}).click();
     await Promise.all([page.waitForResponse(r=>r.url().includes('range=week')),page.getByRole('button',{name:'7G',exact:true}).click()]);
    }
    if(mode==='30D')await Promise.all([page.waitForResponse(r=>r.url().includes('range=month')),page.getByRole('button',{name:'30G',exact:true}).click()]);
    const key=`${engine}-${width}-${mode}`;await record(page,key,range);
    const hours=range==='day'?24:range==='week'?168:720;
    const violations=live[range].items.filter(i=>i.launchedAt&&(Date.parse(live[range].updatedAt)-Date.parse(i.launchedAt))/3600000>hours).length;report.rangeViolation+=violations;assert.equal(violations,0);
    if(phase==='after'&&mode==='LOCAL')await physicalSelections(page,key);
    const required=width===390||(width===1440&&['GLOBAL','LOCAL','SELECTED'].includes(mode))||(width===1920&&['GLOBAL','SELECTED'].includes(mode));
    if(required&&engine==='chromium'){
     const name=`RADAR-INSTRUMENT-V2-${width===390?'':width===1440?'DESKTOP-':'ULTRAWIDE-'}${mode}`;
     await captureInstrument(page,name+'-ISOLATED');
     if(phase==='after'){
      if(mode!=='SELECTED'||width>=1024)await page.evaluate(()=>{document.querySelector('.marketing-shell')?.scrollTo({top:0,left:0,behavior:'instant'});window.scrollTo(0,0);});
      await page.screenshot({path:resolve(out,name+'.png')});
     }
    }
    if(phase==='after'&&[390,1440,1920].includes(width))await axe(page,key);
   }
   if(phase==='after'){
    const decorative=await page.locator('[data-instrument-layer]').evaluateAll(els=>els.map(el=>({layer:el.getAttribute('data-instrument-layer'),hidden:el.getAttribute('aria-hidden'),pointer:getComputedStyle(el).pointerEvents})));
    assert(decorative.every(d=>d.hidden==='true'&&d.pointer==='none'),'Decorative layers never intercept input');
    report.checks.push({tag:`${engine}-${width}-layers`,decorative});
   }
   await ctx.close();console.log(`${phase} ${engine} ${width}: passed`);
  }
  await browser.close();
 }
 if(phase==='after'){report.positionDelta=0;assert.equal(report.wrongSelection,0);assert.equal(report.rangeViolation,0);assert.equal(report.issues.length,0);}
}finally{
 await writeFile(resolve(out,phase==='before'?'BEFORE-DISPLAY.json':'AFTER-DISPLAY.json'),JSON.stringify(display,null,2));
 await writeFile(resolve(out,`RADAR-INSTRUMENT-V2-${phase.toUpperCase()}-QA.json`),JSON.stringify(report,null,2));
}
