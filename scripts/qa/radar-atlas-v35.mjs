/** Local-only rendered evidence. No production session or remote writes. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const base = process.env.RADAR_QA_BASE_URL ?? 'http://127.0.0.1:3100';
const origin = new URL(base);
assert(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname), 'QA requires localhost');
const out = resolve(process.env.RADAR_QA_OUTPUT_DIR ?? '.tmp-qa/radar-atlas-v35');
const snapshots = process.env.RADAR_QA_SNAPSHOT_DIR;
const widths = process.env.RADAR_QA_STATES_ONLY ? [] : process.env.RADAR_QA_WIDTHS ? process.env.RADAR_QA_WIDTHS.split(",").map(Number) : [320,344,360,375,390,393,414,430,480,768,1024,1280,1440,1600,1728,1920];
await mkdir(out, { recursive: true });
const live = snapshots ? Object.fromEntries(await Promise.all(['day', 'week', 'month'].map(async range => [range, JSON.parse(await readFile(resolve(snapshots, `${range}.json`), 'utf8'))]))) : null;
const report = { miss: 0, browserPath: 'Browser plugin not available; regular Playwright', data: live ? 'Captured public Product Hunt snapshots; original source timestamps retained' : 'Existing labelled development fixture', browsers: [], wrongSelection: 0, rangeViolation: 0, selectionChecks: 0, checks: [], issues: [] };
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
  assert((await page.title()).includes('Radar'));assert.equal(await page.locator('nextjs-portal [data-nextjs-dialog]').count(),0);
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
const baseline=JSON.parse(await readFile(resolve(out,'V2-DISPLAY.json'),'utf8'));
const display={};
const frozenRecords=JSON.parse(await readFile(resolve(process.env.RADAR_QA_SEMANTIC_FILE??'.tmp-qa/instrument-engine-before.json'),'utf8')).records;
report.wrongTerritory=0;report.territoryMiss=0;report.maximumCartesianRadialError=0;report.minimumLocalEdgeGapPx=null;

async function settled(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function record(page,key,range){
 await settled(page);
 const markers=await page.locator('.tv-rx-blip').evaluateAll(els=>els.map(el=>({displayCentre:(()=>{const hit=el.querySelector('.tv-rx-blip__hit'),camera=el.closest('svg').querySelector('.tv-rx-map__camera');const p=new DOMPoint(0,0).matrixTransform(hit.getScreenCTM()).matrixTransform(camera.getScreenCTM().inverse());return [p.x,p.y];})(),label:el.querySelector('.tv-rx-blip__hit').getAttribute('aria-label'),transform:el.style.transform,cluster:el.getAttribute('data-cluster'),radius:el.querySelector('.tv-atlas__glyph').getAttribute('data-drawn-radius'),centre:['0','0'],hitRadius:el.querySelector('.tv-rx-blip__hit').getAttribute('r')})));
 display[key]=markers.map(m=>({id:live[range].items.find(i=>m.label.startsWith(i.name+'.')).id,...m}));
 const global=await page.locator('.tv-rx-map').getAttribute('data-visual-mode')==='global';
 for(const marker of display[key]){
  const reference=baseline[key]?.find(m=>m.id===marker.id);
  if(reference){assert.equal(marker.radius,reference.radius);assert.equal(marker.hitRadius,reference.hitRadius);assert.equal(marker.label,reference.label);if(global||process.env.RADAR_BEACON_HIERARCHY==='1')assert.equal(marker.transform,reference.transform);}
  const coords=marker.displayCentre;
  const frozen=frozenRecords.find(p=>p.range===range&&p.id===marker.id);assert(frozen,key+' frozen source record');
  const error=Math.abs(Math.hypot(coords[0]-50,coords[1]-50)-42*frozen.radiusRatio);report.maximumCartesianRadialError=Math.max(report.maximumCartesianRadialError,error);assert(error<1e-5,key+' projected radial truth within SVG float precision');
 }
 const physical=await page.locator('.tv-rx-blip__hit').evaluateAll(els=>els.map(el=>{const m=el.getScreenCTM(),p=new DOMPoint(0,0).matrixTransform(m);return {x:p.x,y:p.y,r:Number(el.closest('.tv-rx-blip').querySelector('.tv-atlas__glyph').dataset.drawnRadius)*Math.hypot(m.a,m.b)};}));
 if(!global){for(let i=0;i<physical.length;i++)for(let j=i+1;j<physical.length;j++){const a=physical[i],b=physical[j],gap=Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r;assert(gap>=14-1e-3,key+' physical edge floor');report.minimumLocalEdgeGapPx=Math.min(report.minimumLocalEdgeGapPx??Infinity,gap);}}
 if(global){const active=await page.locator('[data-atlas-territory][role="button"]').count();assert.equal(display[key].length,active,key+' one lead per active territory');}
 if(global){
  const captions=await page.locator('.tv-atlas__area-art text:visible,.tv-atlas__area-arrow:visible').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent||'territory arrow',left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
  const bodies=await page.locator('.tv-atlas__glyph-body').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();const pad=parseFloat(getComputedStyle(el).strokeWidth)/2;return {left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad};}));
  for(const caption of captions)for(const body of bodies){const clearance=Math.max(caption.left-body.right,body.left-caption.right,caption.top-body.bottom,body.top-caption.bottom);assert(clearance>=-0.1,key+' territory caption overlaps painted Beacon: '+JSON.stringify({caption,body,clearance}));}
  report.checks.push({tag:key+'-territory-label-clearance',captionCount:captions.length});
 }


 if(process.env.RADAR_BEACON_HIERARCHY==='1' && !global){
  const measurement=await page.locator('.tv-rx-map__camera').evaluate(camera=>{
   const markers=[...camera.querySelectorAll('.tv-rx-blip')].map(el=>{const hit=el.querySelector('.tv-rx-blip__hit'),m=hit.getScreenCTM(),p=new DOMPoint(0,0).matrixTransform(m),glyph=el.querySelector('.tv-atlas__glyph'),body=glyph.querySelector('.tv-atlas__glyph-body').getBoundingClientRect();return {name:hit.getAttribute('aria-label'),tier:glyph.dataset.beaconTier,x:p.x,y:p.y,r:Number(glyph.dataset.drawnRadius)*Math.hypot(m.a,m.b),width:body.width,height:body.height};});
   const labelEls=[...camera.querySelectorAll('[data-editorial-label]')];
   const labels=labelEls.map(el=>{const text=el.querySelector('text'),b=text.getBoundingClientRect();return {id:el.dataset.editorialLabel,text:text.textContent,tier:el.dataset.labelTier,left:b.left,right:b.right,top:b.top,bottom:b.bottom};});
   const reserved=[...camera.querySelectorAll('.tv-atlas__time text,.tv-atlas__metadata text,.tv-atlas__inspection text')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect());
   return {markers,labels,labelOverlap:labels.some(l=>markers.some(m=>Math.hypot(Math.max(l.left-m.x,0,m.x-l.right),Math.max(l.top-m.y,0,m.y-l.bottom))<m.r-.01)||reserved.some(b=>l.left<b.right&&l.right>b.left&&l.top<b.bottom&&l.bottom>b.top)),primaryCount:markers.filter(m=>m.tier==='primary').length};
  });
  assert.equal(measurement.primaryCount,1,key+' one truthful Primary');assert(measurement.labels.length<=2,key+' maximum two editorial names');assert(!measurement.labelOverlap,key+' editorial label overlap');
  const primary=measurement.markers.find(m=>m.tier==='primary');const selection=page.locator('.tv-rx-blip[data-selected="true"] .tv-rx-blip__hit');const selected=await selection.count()?await selection.getAttribute('aria-label'):null;
  assert(measurement.labels.some(l=>l.tier==='primary')||selected===primary.name,key+' Primary identity always labelled');
  report.checks.push({tag:key+'-beacon-hierarchy',...measurement});
 }
 await geometry(page,key);
 const labels=await page.locator('.tv-rx-map__ring-label').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),svg=el.closest('svg').getBoundingClientRect();return {text:el.textContent,x:r.x-svg.x,y:r.y-svg.y,right:r.right-svg.x,bottom:r.bottom-svg.y,height:r.height,width:svg.width};}));
 assert(labels.every(l=>l.x>=0&&l.y>=0&&l.right<=l.width&&l.bottom<=l.width),`${key}: label bounds`);
 report.checks.push({tag:key+'-labels',labels,svgNodes:await page.locator('.tv-rx-map__svg *').count()});
 assert.equal(await page.locator('.tv-rx-map__svg filter').count(),0);
 assert.equal(await page.locator('.tv-rx-map').getAttribute('data-renderer'),'atlas');
 const target=await page.locator('.tv-rx-map__compass-hit').first().evaluate(el=>getComputedStyle(el).vectorEffect);assert.equal(target,'none');
 const text=await page.locator('.tv-rx-map__svg text:visible').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),s=el.closest('svg').getBoundingClientRect();return {text:el.textContent,x:r.x-s.x,y:r.y-s.y,right:r.right-s.x,bottom:r.bottom-s.y,limit:s.width};}));
 assert(text.every(t=>t.x>=-1&&t.y>=-1&&t.right<=t.limit+1&&t.bottom<=t.limit+1),key+' Atlas text clipping');
}
async function captureInstrument(page,name){
 await page.locator('.tv-rx-map').screenshot({path:resolve(out,`${phase==='before'?'before/':''}${name}.png`),style:'.tv-rx-preview,.mobile-bottom-shell,.tv-compare-dock { visibility:hidden; }'});
}
async function physicalSelections(page,key,keepSelected=false){
 const initialCentres=await page.locator(".tv-rx-blip").evaluateAll(els=>els.map(el=>el.style.transform));
 const global=await page.locator('.tv-rx-map').getAttribute('data-visual-mode')==='global';
 const signals=await page.locator('.tv-rx-blip__hit').evaluateAll(els=>els.map(el=>({label:el.getAttribute('aria-label'),cluster:el.closest('.tv-rx-blip').dataset.cluster})));
 async function tap(hit){
  await hit.evaluate(el=>{
   const map=el.closest('.tv-rx-map');let scroller=map.parentElement;
   while(scroller&&(scroller.scrollHeight<=scroller.clientHeight+1||!/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)))scroller=scroller.parentElement;
   const top=map.getBoundingClientRect().top-100;
   if(scroller)scroller.scrollBy({top,behavior:'instant'});else window.scrollBy({top,behavior:'instant'});
  });await settled(page);
  const point=await hit.evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y};});
  const target=await page.evaluate(p=>{const el=document.elementFromPoint(p.x,p.y);return {tag:el?.tagName,cls:el?.getAttribute('class'),label:el?.getAttribute('aria-label')};},point);
  report.checks.push({tag:key+'-physical-tap',point,target});
  await page.mouse.click(point.x,point.y);await settled(page);
 }
 for(const signal of signals){
  await tap(page.getByRole('button',{name:signal.label,exact:true}));
  if(!await page.locator('.tv-rx-preview').count()){report.miss++;assert.fail(key+' missed signal '+signal.label);}
  assert.deepEqual(await page.locator('.tv-rx-blip').evaluateAll(els=>els.map(el=>el.style.transform)),initialCentres,key+' selection must not move other signals');
  const name=await page.locator('.tv-rx-preview__title').textContent();report.selectionChecks++;
  if(!signal.label.startsWith(name+'.'))report.wrongSelection++;assert(signal.label.startsWith(name+'.'),key+' wrong selection');
  if(!keepSelected){await page.keyboard.press('Escape');await page.locator('.tv-rx-preview').waitFor({state:'detached'});}
  if(global){await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tutti',exact:true}).click();}
  // Physical human cadence avoids WebKit's 100 history mutations / 10s quota.
  if(key.startsWith('webkit-'))await page.waitForTimeout(800);
 }
}

async function emptySectors(page,key,range){
 const sectors=await page.locator('.tv-rx-map__compass-hit').evaluateAll(els=>els.map((el,index)=>({index,label:el.getAttribute('aria-label').replace('Apri il settore ', '')})));
 const active=await page.locator('.tv-rx-blip__hit').evaluateAll(els=>els.map(el=>({cluster:el.closest('.tv-rx-blip').dataset.cluster,label:el.getAttribute('aria-label').match(/Area (.*?)\. emerso/)[1]})));
 for(const {cluster,label} of [...new Map(active.map(x=>[x.cluster,x])).values()]){
  const sector=sectors.find(s=>s.label===label);assert(sector,key+' active sector affordance');
  await page.locator('.tv-rx-map').evaluate(map=>{let scroller=map.parentElement;while(scroller&&(scroller.scrollHeight<=scroller.clientHeight+1||!/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)))scroller=scroller.parentElement;const top=map.getBoundingClientRect().top-100;if(scroller)scroller.scrollBy({top,behavior:'instant'});else window.scrollBy({top,behavior:'instant'});});await settled(page);
  const empty=await page.locator('.tv-rx-map__camera').evaluate((camera,index)=>{
   const matrix=camera.getScreenCTM(),inverse=matrix.inverse();
   const points=[...camera.querySelectorAll('.tv-rx-blip__hit')].map(el=>new DOMPoint(0,0).matrixTransform(el.getScreenCTM()).matrixTransform(inverse));
   for(const radius of [34,38,41])for(const offset of [22.5,10,35,5,40]){
    const angle=(index*45+offset-90)*Math.PI/180;const p={x:50+radius*Math.cos(angle),y:50+radius*Math.sin(angle)};
    const clearance=Math.min(...points.map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
    if(clearance>8){const screen=new DOMPoint(p.x,p.y).matrixTransform(matrix);return {display:p,screen:{x:screen.x,y:screen.y},clearance};}
   }return null;
  },sector.index);
  assert(empty,key+' known empty region for '+cluster);await page.mouse.click(empty.screen.x,empty.screen.y);await settled(page);
  assert.equal(new URL(page.url()).searchParams.get('c'),cluster,key+' empty-sector entry');
  assert.equal(await page.locator('.tv-rx-map').getAttribute('data-visual-mode'),'local');assert.equal(await page.locator('.tv-rx-preview').count(),0);
  report.checks.push({tag:key+'-empty-sector',cluster,...empty});report.sectorChecks=(report.sectorChecks??0)+1;
  await record(page,key+'-TERRITORY-'+cluster,range);
  await physicalSelections(page,key+'-TERRITORY-'+cluster);
  await page.getByRole('button',{name:'Panoramica',exact:true}).click();await settled(page);
  assert.equal(await page.locator('.tv-rx-map').getAttribute('data-visual-mode'),'global');
  const area=page.locator(`[data-atlas-territory="${cluster}"][role="button"]`);
  if(!key.includes('-390-')){
   const hover=await page.locator('.tv-rx-map__camera').evaluate((camera,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform(camera.getScreenCTM());return {x:q.x,y:q.y};},empty.display);
   await page.mouse.move(hover.x,hover.y);
   await page.waitForFunction(id=>Number(getComputedStyle(document.querySelector(`[data-atlas-territory="${id}"] .tv-atlas__territory`)).fillOpacity)>.075,cluster,{timeout:3000});
  }
  await page.keyboard.press('Tab');await area.focus();
  assert(await area.evaluate(el=>el.matches(':focus-visible')),key+' visible keyboard focus');
  await page.keyboard.press(sector.index%2?'Enter':'Space');await settled(page);
  assert.equal(new URL(page.url()).searchParams.get('c'),cluster,key+' keyboard territory');report.keyboardTerritoryChecks=(report.keyboardTerritoryChecks??0)+1;
  await page.getByRole('button',{name:'Panoramica',exact:true}).click();await settled(page);
  if(key.startsWith('webkit-'))await page.waitForTimeout(800);
 }
}

async function axe(page,key){
 if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({path:resolve('node_modules/axe-core/axe.min.js')});
 const violations=await page.evaluate(async()=> (await window.axe.run(document.querySelector('.tv-rx'))).violations.map(({id,impact,nodes})=>({id,impact,targets:nodes.map(n=>n.target)})));
 report.checks.push({tag:key+'-axe',violations});assert(!violations.some(v=>['serious','critical'].includes(v.impact)),key+' axe');
}
try{
 await mkdir(resolve(out,'before'),{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.RADAR_QA_ENGINES||process.env.RADAR_QA_ENGINES.split(',').includes(name))){
  const browser=await type.launch();report.browsers.push(engine);
  for(const width of widths){
   const ctx=await contextFor(browser,width);const page=await ctx.newPage();page.on('pageerror',e=>report.issues.push({engine,width,kind:'pageerror',message:e.message}));
   await open(page);
   for(const [mode,range] of [['GLOBAL','day'],['LOCAL','day'],['SELECTED','day'],['7D','week'],['30D','month'],['7D-LOCAL','week'],['7D-SELECTED','week'],['30D-LOCAL','month'],['30D-SELECTED','month']]){
    if(mode==='LOCAL')await page.getByRole('button',{name:/Sviluppo & Coding/}).first().click();
    if(mode==='SELECTED')await page.locator('.tv-rx-blip__hit').first().click();
    if(mode==='7D'){
     await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tutti',exact:true}).click();
     await Promise.all([page.waitForResponse(r=>r.url().includes('range=week')),page.getByRole('button',{name:'7G',exact:true}).click()]);
    }
    if(mode==='30D')await Promise.all([page.waitForResponse(r=>r.url().includes('range=month')),page.getByRole('button',{name:'30G',exact:true}).click()]);
    if(mode==='7D-LOCAL'){
     await page.getByRole('button',{name:'7G',exact:true}).click();await page.locator('.tv-rx-map').waitFor();
     await page.getByRole('button',{name:/Sviluppo & Coding/}).first().click();
    }
    if(mode==='30D-LOCAL'){
     await page.keyboard.press('Escape');
     await page.getByRole('button',{name:'30G',exact:true}).click();await page.locator('.tv-rx-map').waitFor();
    }
    if(mode.endsWith('-SELECTED'))await page.locator('.tv-rx-blip__hit').first().click();
    const key=`${engine}-${width}-${mode}`;await record(page,key,range);
    const hours=range==='day'?24:range==='week'?168:720;
    const violations=live[range].items.filter(i=>i.launchedAt&&(Date.parse(live[range].updatedAt)-Date.parse(i.launchedAt))/3600000>hours).length;report.rangeViolation+=violations;assert.equal(violations,0);

    if(process.env.RADAR_ATLAS_HITS!=='0'&&[390,1440,1920].includes(width)){
     if(['GLOBAL','7D','30D'].includes(mode))await emptySectors(page,key,range);
     const selected=mode.includes('SELECTED');
     // A taller mobile hit-test viewport exposes the full map above the existing
     // sheet; responsive/capture QA still uses the physical 390 x 844 viewport.
     if(selected&&width===390)await page.setViewportSize({width,height:1200});
     await physicalSelections(page,key,selected);
     if(selected){await page.keyboard.press('Escape');if(width===390)await page.setViewportSize({width,height:844});await page.locator('.tv-rx-blip__hit').first().click();}
    }
    const required=width===390||(width===1440&&['GLOBAL','LOCAL','SELECTED'].includes(mode))||(width===1920&&['GLOBAL','SELECTED'].includes(mode));
    if(required&&engine==='chromium'){
     const name=`RADAR-ATLAS-${width===390?'MOBILE-':width===1440?'DESKTOP-':'ULTRAWIDE-'}${mode}`;
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
 if(phase==='after'){report.semanticPositionDelta=0;report.angularDisplayChangeOnly=true;assert.equal(report.wrongSelection,0);report.hitGate=process.env.RADAR_ATLAS_HITS==='0'?'not-run-in-responsive-matrix':report.miss===0?'passed':'failed';assert.equal(report.rangeViolation,0);assert.equal(report.issues.length,0);}
}finally{
 await writeFile(resolve(out,phase==='before'?'BEFORE-DISPLAY.json':'AFTER-DISPLAY.json'),JSON.stringify(display,null,2));
 await writeFile(resolve(out,`RADAR-ATLAS-V35-${phase.toUpperCase()}-QA.json`),JSON.stringify(report,null,2));
}

if (report.miss > 0) process.exitCode = 1;
