import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE_DIR = "/Users/gianmariacaltagirone/Tooolvibes/audits/final-route-presentation-closure-2026-07-28/post-deploy-truth";
const BASE_URL = "https://tooolvibes.eu";

const routes = [
  { label: "Home", path: "/" },
  { label: "Archive", path: "/archivio" },
  { label: "Radar", path: "/radar" },
  { label: "Compare", path: "/compare" },
  { label: "Shortlist", path: "/shortlist", clean: true },
  { label: "Collection", path: "/collections/research-synthesis-toolkit", fallback: "/collections/indie-launch-stack" },
  { label: "Posts", path: "/posts" },
  { label: "Affiliati", path: "/affiliati" },
  { label: "Account", path: "/account" },
  { label: "Tool", path: "/toools/blink" },
];

const viewports = [
  { name: "mobile", w: 390, h: 844 },
  { name: "tablet", w: 1024, h: 768 },
  { name: "desktop", w: 1440, h: 1000 },
];

function exec(args, session) {
  return new Promise((resolve) => {
    const proc = spawn("bun", ["/Users/gianmariacaltagirone/.bun/bin/agent-browser", "--session", session, "--json", ...args], {
      cwd: "/Users/gianmariacaltagirone/Tooolvibes",
      env: { ...process.env, AGENT_BROWSER_HIDE_SCROLLBARS: "false" },
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", d => out += d);
    proc.stderr.on("data", d => err += d);
    proc.on("close", () => {
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ _raw: out, _err: err });
      }
    });
  });
}

async function navigate(url, session) {
  await exec(["open", url], session);
  await exec(["wait", "--load", "networkidle"], session);
  await exec(["wait", "2000"], session);
}

async function setViewport(w, h, session) {
  return exec(["set", "viewport", String(w), String(h)], session);
}

async function screenshot(path, full, session) {
  const args = full ? ["screenshot", "--full", path] : ["screenshot", path];
  return exec(args, session);
}

async function evalJs(js, session) {
  const r = await exec(["eval", js], session);
  return r?.data?.result ?? r;
}

async function getConsole(session) {
  const r = await exec(["console"], session);
  return r?.data?.messages ?? [];
}

async function getErrors(session) {
  const r = await exec(["errors"], session);
  return r?.data?.errors ?? [];
}

async function getNetwork(session) {
  const r = await exec(["network", "requests"], session);
  return r?.data?.requests ?? [];
}

async function clearStorage(session) {
  await exec(["storage", "local", "clear"], session);
  await exec(["storage", "session", "clear"], session);
}

async function getUrl(session) {
  const r = await exec(["get", "url"], session);
  return r?.data?.url ?? "";
}

const COLLECT_SCRIPT = `(() => {
  const data = {
    url: location.href,
    title: document.title,
    bodyFont: window.getComputedStyle(document.body).fontFamily,
    h1s: [],
    mainCount: document.querySelectorAll('main').length,
    h1Count: document.querySelectorAll('h1').length,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    focusableCount: document.querySelectorAll('a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])').length,
    backdropFilterElements: [],
    nearWhiteAlphaCards: [],
    gradients: [],
    fontsOnVisibleText: new Set(),
    partnerNodes: [],
    detailsElements: [],
  };
  document.querySelectorAll('h1').forEach(h1 => {
    const style = window.getComputedStyle(h1);
    data.h1s.push({
      text: h1.textContent.trim().slice(0, 100),
      fontFamily: style.fontFamily,
      visible: style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0',
    });
  });
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
    if (visible) {
      const bf = style.backdropFilter;
      if (bf && bf !== 'none') {
        data.backdropFilterElements.push({ tag: el.tagName, class: el.className?.slice(0, 100), backdropFilter: bf, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
      }
      const bg = style.backgroundImage;
      if (bg && bg.includes('gradient')) {
        data.gradients.push({ tag: el.tagName, class: el.className?.slice(0, 100), backgroundImage: bg, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
      }
      const bgColor = style.backgroundColor;
      if (bgColor && bgColor.startsWith('rgba')) {
        const parts = bgColor.match(/rgba?\\(([^)]+)\\)/);
        if (parts) {
          const vals = parts[1].split(',').map(s => parseFloat(s.trim()));
          if (vals[3] !== undefined && vals[3] > 0 && vals[3] < 1 && vals[0] > 240 && vals[1] > 240 && vals[2] > 240) {
            data.nearWhiteAlphaCards.push({ tag: el.tagName, class: el.className?.slice(0, 100), backgroundColor: bgColor, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
          }
        }
      }
      if (el.children.length === 0 || el.textContent.trim().length > 0) {
        const font = style.fontFamily;
        if (font) data.fontsOnVisibleText.add(font);
      }
    }
  }
  const partnerTerms = ['Spazio partner', 'Partner editoriale', 'Prenotabile', 'reserved', 'planned'];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    for (const term of partnerTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        const el = node.parentElement;
        if (!el) continue;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        let ancestor = el;
        let hiddenAncestor = null;
        while (ancestor && ancestor !== document.body) {
          const as = window.getComputedStyle(ancestor);
          if (as.display === 'none' || as.visibility === 'hidden' || as.opacity === '0') {
            hiddenAncestor = ancestor.tagName + (ancestor.className ? '.' + ancestor.className.split(' ')[0] : '');
            break;
          }
          if (ancestor.tagName.toLowerCase() === 'details' && !ancestor.open) {
            hiddenAncestor = 'details[closed]';
            break;
          }
          ancestor = ancestor.parentElement;
        }
        data.partnerNodes.push({
          term,
          text: text.trim().slice(0, 200),
          tag: el.tagName,
          class: el.className?.slice(0, 100),
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          occupiesSpace: rect.width > 0 && rect.height > 0,
          hiddenAncestor,
          ariaHidden: el.getAttribute('aria-hidden'),
          tabIndex: el.getAttribute('tabindex'),
          focusable: el.matches('a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'),
        });
      }
    }
  }
  document.querySelectorAll('details').forEach(d => {
    data.detailsElements.push({ open: d.open, summaryText: d.querySelector('summary')?.textContent?.trim().slice(0, 100) || '' });
  });
  data.fontsOnVisibleText = Array.from(data.fontsOnVisibleText).slice(0, 50);
  return data;
})();`;

const RADAR_SCRIPT = `(() => {
  const states = [];
  document.querySelectorAll('[data-state]').forEach(el => {
    states.push({ tag: el.tagName, dataState: el.getAttribute('data-state'), text: el.textContent.trim().slice(0, 200), visible: window.getComputedStyle(el).display !== 'none' });
  });
  const statusEls = document.querySelectorAll('[data-status], .status, [class*="status"]');
  const statusTexts = Array.from(statusEls).map(el => ({ text: el.textContent.trim().slice(0, 100), class: el.className?.slice(0, 100), visible: window.getComputedStyle(el).display !== 'none' }));
  const phReqs = performance.getEntriesByType('resource').filter(r => r.name.includes('producthunt') || r.name.includes('ph.co') || r.name.includes('api.phu'));
  return {
    states,
    statusTexts,
    phRequests: phReqs.map(r => ({ name: r.name, duration: r.duration, status: r.responseStatus })),
    hasLoading: !!document.querySelector('[class*="loading"], [class*="skeleton"], [aria-busy="true"]'),
    hasRetry: !!document.querySelector('button, a').textContent?.toLowerCase().includes('retry') || !!document.querySelector('[class*="retry"]'),
    terminalState: document.querySelector('[data-state="live"]') ? 'live' : document.querySelector('[data-state="stale"]') ? 'stale' : document.querySelector('[data-state="empty"]') ? 'empty' : document.querySelector('[data-state="error"]') ? 'error' : 'unknown',
  };
})();`;

const SHORTLIST_SCRIPT = `(() => {
  const recs = document.querySelectorAll('[class*="recommendation"], [class*="suggestion"], [class*="shortlist-item"]');
  const entries = Array.from(recs).map(el => ({ text: el.textContent.trim().slice(0, 100), visible: window.getComputedStyle(el).display !== 'none' }));
  const archiveLink = !!document.querySelector('a[href*="archivio"], a[href*="archive"]');
  const radarLink = !!document.querySelector('a[href*="radar"]');
  const suggestTrigger = document.querySelector('button, a').textContent?.toLowerCase().includes('suggest') || !!document.querySelector('[class*="suggest"]');
  const formVisible = !!document.querySelector('form, textarea, input[type="email"]');
  return { entries, archiveLink, radarLink, suggestTrigger, formVisible };
})();`;

const AFFILIATI_SCRIPT = `(() => {
  const details = Array.from(document.querySelectorAll('details')).map(d => ({ open: d.open, summary: d.querySelector('summary')?.textContent?.trim().slice(0, 100) }));
  const honeypot = Array.from(document.querySelectorAll('input')).map(i => ({
    type: i.type, name: i.name, id: i.id, style: i.getAttribute('style'),
    computedDisplay: window.getComputedStyle(i).display,
    computedVisibility: window.getComputedStyle(i).visibility,
    computedOpacity: window.getComputedStyle(i).opacity,
    tabIndex: i.getAttribute('tabindex'),
    rect: { width: i.getBoundingClientRect().width, height: i.getBoundingClientRect().height },
    ariaHidden: i.getAttribute('aria-hidden'),
  })).filter(i => i.type === 'hidden' || i.computedDisplay === 'none' || i.computedVisibility === 'hidden' || i.computedOpacity === '0');
  const companyInputs = Array.from(document.querySelectorAll('input')).filter(i => i.name?.toLowerCase().includes('company') || i.id?.toLowerCase().includes('company') || i.placeholder?.toLowerCase().includes('company') || i.getAttribute('aria-label')?.toLowerCase().includes('company'));
  return { details, honeypot, companyInputs: companyInputs.map(i => ({ name: i.name, id: i.id, type: i.type })) };
})();`;

const COMPARE_SCRIPT = `(() => {
  const slots = document.querySelectorAll('[class*="slot"], [class*="compare"], [class*="card"]').length;
  const actions = Array.from(document.querySelectorAll('button, a')).map(el => el.textContent.trim().slice(0, 100));
  const copy = document.querySelector('main, [class*="content"]')?.textContent?.trim().slice(0, 500) || '';
  return { slots, actions: actions.slice(0, 20), copy };
})();`;

const ACCOUNT_SCRIPT = `(() => {
  const authIndicators = Array.from(document.querySelectorAll('button, a, div, span, h1, h2, p')).map(el => ({
    text: el.textContent.trim().slice(0, 100),
    class: el.className?.slice(0, 100),
  })).filter(x => /login|log in|sign in|register|account|guest|auth|session|profile/i.test(x.text));
  const forms = document.querySelectorAll('form').length;
  const inputs = document.querySelectorAll('input').length;
  return { authIndicators: authIndicators.slice(0, 10), forms, inputs };
})();`;

async function runAudit() {
  const results = [];
  const issues = [];
  const hiddenCorrect = [];
  const visibleDefects = [];
  const radarSequences = [];
  const partnerFindings = [];
  const shortlistFindings = [];
  const affiliatiFindings = [];
  const fontFindings = [];
  const glassFindings = [];
  const evidencePaths = [];
  mkdirSync(join(BASE_DIR, "screenshots"), { recursive: true });

  for (const route of routes) {
    const session = route.clean ? `audit-${route.label}-clean` : `audit-${route.label}`;
    if (route.clean) {
      await clearStorage(session);
    }
    for (const vp of viewports) {
      console.log(`[AUDIT] ${route.label} @ ${vp.name} (${vp.w}x${vp.h})`);
      const entry = {
        route: route.label,
        path: route.path,
        viewport: vp.name,
        width: vp.w,
        height: vp.h,
        screenshots: [],
        console: [],
        errors: [],
        network: [],
        pageData: null,
        timestamp: new Date().toISOString(),
      };
      try {
        await setViewport(vp.w, vp.h, session);
        const navStart = Date.now();
        await navigate(BASE_URL + route.path, session);
        entry.navDuration = Date.now() - navStart;
        const currentUrl = await getUrl(session);
        entry.actualUrl = currentUrl;
        if (route.fallback && !currentUrl.includes(route.path.replace('/collections/', ''))) {
          console.log(`  Fallback for ${route.label}: ${currentUrl}`);
          entry.usedFallback = true;
        }
        if (["Radar", "Compare", "Account"].includes(route.label)) {
          const earlyPath = join(BASE_DIR, "screenshots", `${route.label}-${vp.name}-early.png`);
          await screenshot(earlyPath, true, session);
          entry.screenshots.push({ type: "early", path: earlyPath });
        }
        await exec(["wait", "3000"], session);
        const finalPath = join(BASE_DIR, "screenshots", `${route.label}-${vp.name}-final.png`);
        await screenshot(finalPath, true, session);
        entry.screenshots.push({ type: "final", path: finalPath });
        evidencePaths.push(finalPath);
        entry.console = await getConsole(session);
        entry.errors = await getErrors(session);
        entry.network = await getNetwork(session);
        entry.pageData = await evalJs(COLLECT_SCRIPT, session);
        if (entry.pageData) {
          fontFindings.push({ route: route.label, viewport: vp.name, bodyFont: entry.pageData.bodyFont, h1Fonts: entry.pageData.h1s.map(h => h.fontFamily), visibleFonts: entry.pageData.fontsOnVisibleText });
          if (entry.pageData.backdropFilterElements.length > 0) {
            glassFindings.push({ route: route.label, viewport: vp.name, backdropFilterElements: entry.pageData.backdropFilterElements });
          }
          if (entry.pageData.nearWhiteAlphaCards.length > 0) {
            glassFindings.push({ route: route.label, viewport: vp.name, nearWhiteAlphaCards: entry.pageData.nearWhiteAlphaCards });
          }
          if (entry.pageData.gradients.length > 0) {
            glassFindings.push({ route: route.label, viewport: vp.name, gradients: entry.pageData.gradients });
          }
          if (entry.pageData.partnerNodes.length > 0) {
            for (const node of entry.pageData.partnerNodes) {
              partnerFindings.push({ route: route.label, viewport: vp.name, ...node });
              if (node.occupiesSpace && !node.hiddenAncestor) {
                visibleDefects.push({ type: "partner-visible", route: route.label, viewport: vp.name, term: node.term, text: node.text });
              } else {
                hiddenCorrect.push({ type: "partner-hidden", route: route.label, viewport: vp.name, term: node.term, reason: node.hiddenAncestor || "collapsed" });
              }
            }
          }
        }
        if (route.label === "Radar") {
          const radarStart = Date.now();
          const radarStates = [];
          for (let i = 0; i < 6; i++) {
            const state = await evalJs(RADAR_SCRIPT, session);
            radarStates.push({ t: Date.now() - radarStart, ...state });
            await exec(["wait", "1500"], session);
          }
          radarSequences.push({ route: route.label, viewport: vp.name, states: radarStates });
        }
        if (route.label === "Compare") {
          entry.compareData = await evalJs(COMPARE_SCRIPT, session);
        }
        if (route.label === "Account") {
          entry.accountData = await evalJs(ACCOUNT_SCRIPT, session);
        }
        if (route.label === "Shortlist") {
          const shortlistData = await evalJs(SHORTLIST_SCRIPT, session);
          entry.shortlistData = shortlistData;
          shortlistFindings.push({ route: route.label, viewport: vp.name, ...shortlistData });
          await exec(["wait", "1000"], session);
          await exec(["find", "text", "Suggest", "click"], session).catch(() => null);
          await exec(["wait", "2000"], session);
          entry.shortlistAfterSuggest = await evalJs(SHORTLIST_SCRIPT, session);
          await exec(["press", "Escape"], session).catch(() => null);
          await exec(["wait", "1000"], session);
        }
        if (route.label === "Affiliati") {
          const affiliatiData = await evalJs(AFFILIATI_SCRIPT, session);
          entry.affiliatiData = affiliatiData;
          affiliatiFindings.push({ route: route.label, viewport: vp.name, ...affiliatiData });
          const detailsCount = await evalJs(`document.querySelectorAll('details').length`, session);
          for (let i = 0; i < detailsCount; i++) {
            await evalJs(`document.querySelectorAll('details')[${i}]?.setAttribute('open', 'true')`, session);
          }
          await exec(["wait", "1000"], session);
          entry.affiliatiOpenData = await evalJs(AFFILIATI_SCRIPT, session);
        }
        if (entry.errors.length > 0) {
          issues.push({ route: route.label, viewport: vp.name, type: "page-errors", details: entry.errors });
        }
        if (entry.pageData?.horizontalOverflow) {
          issues.push({ route: route.label, viewport: vp.name, type: "horizontal-overflow" });
        }
        const failedFonts = entry.network?.filter(r => r.resourceType === 'font' && (r.responseStatus >= 400 || !r.responseStatus)) || [];
        if (failedFonts.length > 0) {
          issues.push({ route: route.label, viewport: vp.name, type: "failed-fonts", details: failedFonts.map(f => f.url) });
        }
      } catch (e) {
        console.error(`  ERROR on ${route.label} @ ${vp.name}:`, e.message);
        entry.error = e.message;
        issues.push({ route: route.label, viewport: vp.name, type: "audit-exception", details: e.message });
      }
      results.push(entry);
    }
    await exec(["close"], session).catch(() => {});
  }

  const jsonPath = join(BASE_DIR, "json", "audit-results.json");
  mkdirSync(join(BASE_DIR, "json"), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify({
    meta: { date: new Date().toISOString(), url: BASE_URL, workerVersion: "5e048104-487a-4ed3-9d77-8a3e0acd6a91", viewports: viewports.map(v => `${v.w}x${v.h}`), routes: routes.map(r => r.label) },
    results, issues, hiddenCorrect, visibleDefects, radarSequences, partnerFindings, shortlistFindings, affiliatiFindings, fontFindings, glassFindings, evidencePaths,
  }, null, 2));

  const mdPath = join(BASE_DIR, "reports", "audit-report.md");
  mkdirSync(join(BASE_DIR, "reports"), { recursive: true });
  let md = `# Production Audit Report: ${BASE_URL}\\n\\n`;
  md += `**Date:** ${new Date().toISOString()}\\n\\n`;
  md += `**Worker Version:** 5e048104-487a-4ed3-9d77-8a3e0acd6a91\\n\\n`;
  md += `## Truth Table\\n\\n`;
  md += `| Route | Viewport | Status | H1 Count | Body Font | Issues |\\n`;
  md += `|-------|----------|--------|----------|-----------|--------|\\n`;
  for (const r of results) {
    const status = r.error ? "ERROR" : "OK";
    const h1c = r.pageData?.h1Count ?? "?";
    const bf = r.pageData?.bodyFont?.slice(0, 30) ?? "?";
    const iss = issues.filter(i => i.route === r.route && i.viewport === r.viewport).map(i => i.type).join(", ") || "None";
    md += `| ${r.route} | ${r.viewport} | ${status} | ${h1c} | ${bf} | ${iss} |\\n`;
  }
  md += `\\n## Confirmed Real Issues\\n\\n`;
  if (issues.length === 0) md += "_None detected._\\n";
  for (const i of issues) md += `- **${i.route}** (${i.viewport}): ${i.type}${i.details ? " — " + JSON.stringify(i.details).slice(0, 200) : ""}\\n`;
  md += `\\n## Present in DOM but Correctly Hidden/Collapsed\\n\\n`;
  if (hiddenCorrect.length === 0) md += "_None detected._\\n";
  for (const h of hiddenCorrect) md += `- **${h.route}** (${h.viewport}): ${h.type} "${h.term}" — ${h.reason}\\n`;
  md += `\\n## Actual Visible Defects\\n\\n`;
  if (visibleDefects.length === 0) md += "_None detected._\\n";
  for (const v of visibleDefects) md += `- **${v.route}** (${v.viewport}): ${v.type} "${v.term}" — "${v.text}"\\n`;
  md += `\\n## Radar State Sequence\\n\\n`;
  for (const rs of radarSequences) {
    md += `### ${rs.route} @ ${rs.viewport}\\n\\n`;
    for (const s of rs.states) md += `- t+${s.t}ms: terminal=${s.terminalState}, loading=${s.hasLoading}, retry=${s.hasRetry}\\n`;
    md += `\\n`;
  }
  md += `\\n## Partner Visibility / Accessibility\\n\\n`;
  for (const p of partnerFindings) md += `- **${p.route}** @ ${p.viewport}: "${p.term}" in <${p.tag}> display=${p.display} visibility=${p.visibility} opacity=${p.opacity} occupiesSpace=${p.occupiesSpace} hiddenAncestor=${p.hiddenAncestor} ariaHidden=${p.ariaHidden} tabIndex=${p.tabIndex} focusable=${p.focusable}\\n`;
  md += `\\n## Shortlist Initial Hierarchy\\n\\n`;
  for (const s of shortlistFindings) {
    md += `### ${s.route} @ ${s.viewport}\\n`;
    md += `- Entries: ${s.entries?.length ?? 0}\\n`;
    md += `- Archive link: ${s.archiveLink}\\n`;
    md += `- Radar link: ${s.radarLink}\\n`;
    md += `- Suggest trigger: ${s.suggestTrigger}\\n`;
    md += `- Form visible initially: ${s.formVisible}\\n\\n`;
  }
  md += `\\n## Affiliati Disclosure / Honeypot\\n\\n`;
  for (const a of affiliatiFindings) {
    md += `### ${a.route} @ ${a.viewport}\\n`;
    md += `- Details: ${JSON.stringify(a.details)}\\n`;
    md += `- Honeypot fields: ${a.honeypot?.length ?? 0}\\n`;
    md += `- Company inputs: ${JSON.stringify(a.companyInputs)}\\n\\n`;
  }
  md += `\\n## Computed Fonts\\n\\n`;
  for (const f of fontFindings) md += `- **${f.route}** @ ${f.viewport}: body=${f.bodyFont} h1s=${JSON.stringify(f.h1Fonts)} visible=${JSON.stringify(f.visibleFonts)}\\n`;
  md += `\\n## Glass / Contrast Findings\\n\\n`;
  for (const g of glassFindings) {
    md += `- **${g.route}** @ ${g.viewport}: `;
    if (g.backdropFilterElements) md += `backdrop-filter=${g.backdropFilterElements.length} `;
    if (g.nearWhiteAlphaCards) md += `near-white-alpha=${g.nearWhiteAlphaCards.length} `;
    if (g.gradients) md += `gradients=${g.gradients.length} `;
    md += `\\n`;
  }
  md += `\\n## Evidence Paths\\n\\n`;
  for (const ep of evidencePaths) md += `- \`${ep}\`\\n`;
  writeFileSync(mdPath, md);
  console.log(`\\nAudit complete. JSON: ${jsonPath}, Report: ${mdPath}`);
}

runAudit().catch(console.error);
