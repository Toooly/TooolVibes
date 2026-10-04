/**
 * CLEAN VISUAL CAPTURE HARNESS
 * Assertion-gated, obstructing-UI-suppressed card state capture.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const BASE = "http://localhost:3200";
const OUT = "artifacts/catalog-final";
const TARGET = "agentx";
const VP = { width: 390, height: 844 };

mkdirSync(OUT, { recursive: true });

const OBSTRUCTING_SELECTORS = [
  ".tv-install-sheet",
  ".tv-consent-banner",
  ".tv-save-ack",
  ".tv-reward-ach-pill",
  "[data-sonner-toast]",
  "[data-sonner-toaster]",
  ".sonner-toast-wrapper",
];

async function suppressObstructions(page) {
  await page.evaluate((selectors) => {
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => el.style.display = "none");
    }
    // Also suppress via style tag for dynamically added ones
    if (!document.getElementById("qa-suppress-style")) {
      const style = document.createElement("style");
      style.id = "qa-suppress-style";
      style.textContent = selectors.map(s => `${s} { display: none !important; }`).join("\n");
      document.head.appendChild(style);
    }
  }, OBSTRUCTING_SELECTORS);
}

async function settle(page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(300);
}

async function assertState(page, slug, expected) {
  const state = await page.evaluate((slug) => {
    const cards = document.querySelectorAll(".ar4-card");
    for (const c of cards) {
      const link = c.querySelector(".ar4-card__name-link");
      if (link && link.getAttribute("href")?.includes(slug)) {
        const cs = getComputedStyle(c);
        return {
          qaSaved: c.getAttribute("data-qa-saved"),
          qaCompared: c.getAttribute("data-qa-compared"),
          qaTier: c.getAttribute("data-qa-tier"),
          saveLayerOpacity: getComputedStyle(c.querySelector(".ar4-card__save-layer")).opacity,
          compareLayerOpacity: getComputedStyle(c.querySelector(".ar4-card__compare-layer")).opacity,
          watermarkMounted: !!c.querySelector(".ar4-card__watermark"),
          bookmarkPressed: c.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed"),
          comparePressed: c.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed"),
          density: c.getAttribute("data-density"),
          railPresent: !!c.querySelector(".ar4-card__enriched-rail"),
          railText: c.querySelector(".ar4-card__enriched-rail")?.textContent?.trim(),
          tagCount: c.querySelectorAll(".ar4-card__enriched-chip").length,
        };
      }
    }
    return null;
  }, slug);

  if (!state) throw new Error(`Card ${slug} not found`);

  const errors = [];
  if (state.qaSaved !== expected.saved) errors.push(`saved: ${state.qaSaved} != ${expected.saved}`);
  if (state.qaCompared !== expected.compared) errors.push(`compared: ${state.qaCompared} != ${expected.compared}`);
  if (expected.saved === "false" && state.saveLayerOpacity !== "0") errors.push(`saveLayer: ${state.saveLayerOpacity}`);
  if (expected.compared === "false" && state.compareLayerOpacity !== "0") errors.push(`compareLayer: ${state.compareLayerOpacity}`);
  if (expected.compared === "false" && state.watermarkMounted) errors.push("watermark mounted");
  if (expected.compared === "true" && !state.watermarkMounted) errors.push("watermark missing");
  if (state.bookmarkPressed !== expected.saved) errors.push(`bookmark: ${state.bookmarkPressed}`);
  if (state.comparePressed !== expected.compared) errors.push(`compare: ${state.comparePressed}`);
  if (expected.density && state.density !== expected.density) errors.push(`density: ${state.density}`);

  if (errors.length) throw new Error(`ASSERT FAIL ${slug}:\n  ${errors.join("\n  ")}\n  ${JSON.stringify(state)}`);
  return state;
}

async function clearState(page, slug) {
  await page.evaluate((slug) => {
    const cards = document.querySelectorAll(".ar4-card");
    for (const c of cards) {
      const link = c.querySelector(".ar4-card__name-link");
      if (link && link.getAttribute("href")?.includes(slug)) {
        const bm = c.querySelector(".ar4-card__bookmark[data-saved]");
        if (bm) bm.click();
        const cmp = c.querySelector('[data-sonic-action="compare"].is-active');
        if (cmp) cmp.click();
      }
    }
  }, slug);
  await settle(page);
}

async function applyState(page, slug, state) {
  await clearState(page, slug);
  if (state.saved === "true") {
    await page.evaluate((slug) => {
      for (const c of document.querySelectorAll(".ar4-card")) {
        if (c.querySelector(".ar4-card__name-link")?.getAttribute("href")?.includes(slug)) {
          c.querySelector(".ar4-card__bookmark").click();
        }
      }
    }, slug);
    await settle(page);
  }
  if (state.compared === "true") {
    await page.evaluate((slug) => {
      for (const c of document.querySelectorAll(".ar4-card")) {
        if (c.querySelector(".ar4-card__name-link")?.getAttribute("href")?.includes(slug)) {
          c.querySelector('[data-sonic-action="compare"]').click();
        }
      }
    }, slug);
    await settle(page);
  }
}

async function capture(page, slug, state, filename) {
  await applyState(page, slug, state);
  await suppressObstructions(page);
  const actual = await assertState(page, slug, state);
  
  const card = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${slug}"]`) }).first();
  const path = join(OUT, filename);
  await card.screenshot({ path });
  
  const sidecar = { filename, tool: slug, expected: state, actual, ts: new Date().toISOString(), sha: process.env.GIT_SHA || "local" };
  writeFileSync(path.replace(".png", ".json"), JSON.stringify(sidecar, null, 2));
  console.log(`  ✓ ${filename} (assertions passed)`);
  return actual;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  
  // === CLEAN-STATE-PARITY ===
  console.log("=== CLEAN-STATE-PARITY ===");
  await page.goto(`${BASE}/archivio`, { waitUntil: "networkidle" });
  await settle(page);
  await suppressObstructions(page);
  
  const states = [
    { saved: "false", compared: "false", f: "CLEAN-STATE-01-DEFAULT.png" },
    { saved: "true",  compared: "false", f: "CLEAN-STATE-02-SAVED.png" },
    { saved: "false", compared: "true",  f: "CLEAN-STATE-03-COMPARE.png" },
    { saved: "true",  compared: "true",  f: "CLEAN-STATE-04-BOTH.png" },
  ];
  
  for (const s of states) {
    await capture(page, TARGET, s, s.f);
  }
  
  // === CLEAN-GUEST-VS-LOGGED ===
  console.log("\n=== CLEAN-GUEST-VS-LOGGED ===");
  
  // GUEST
  await page.goto(`${BASE}/archivio`, { waitUntil: "networkidle" });
  await settle(page);
  await suppressObstructions(page);
  await clearState(page, TARGET);
  const guestState = await assertState(page, TARGET, { saved: "false", compared: "false", density: "compact" });
  console.log(`  Guest: density=${guestState.density}, rail=${guestState.railPresent}`);
  
  const guestCard = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${TARGET}"]`) }).first();
  await guestCard.screenshot({ path: join(OUT, "CLEAN-GUEST.png") });
  console.log("  ✓ CLEAN-GUEST.png");
  
  // LOGGED (inject real Supabase session before page load)
  const sessionData = JSON.parse(readFileSync("/tmp/supabase-storage-value.json", "utf-8"));
  await page.addInitScript((session) => {
    localStorage.setItem("sb-127-auth-token", JSON.stringify(session));
  }, sessionData);
  await ctx.addCookies([{ name: "tv-density", value: "enriched", domain: "localhost", path: "/", expires: Math.floor(Date.now() / 1000) + 86400 }]);
  await page.goto(`${BASE}/archivio`, { waitUntil: "networkidle" });
  // Wait for account provider to settle
  await page.waitForTimeout(2000);
  await settle(page);
  await suppressObstructions(page);
  await clearState(page, TARGET);
  const loggedState = await assertState(page, TARGET, { saved: "false", compared: "false", density: "enriched" });
  console.log(`  Logged: density=${loggedState.density}, rail=${loggedState.railPresent}, tags=${loggedState.tagCount}`);
  console.log(`  Rail: ${loggedState.railText}`);
  
  const loggedCard = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${TARGET}"]`) }).first();
  await loggedCard.screenshot({ path: join(OUT, "CLEAN-LOGGED.png") });
  console.log("  ✓ CLEAN-LOGGED.png");
  
  await browser.close();
  console.log("\n✓ All clean captures complete with assertions.");
}

main().catch(err => {
  console.error(`\n✗ CAPTURE ABORTED: ${err.message}`);
  process.exit(1);
});
