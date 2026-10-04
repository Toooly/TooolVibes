/**
 * STATE-TRUTH CAPTURE HARNESS
 * Deterministic, assertion-gated card state capture.
 * 
 * CONTRACT: Never generate a file named "COMPARE" when data-qa-compared is false.
 * Never generate "BOTH" unless both state assertions are true.
 * 
 * Usage: node capture-state-truth.mjs [--base http://localhost:3200] [--out artifacts/catalog-final]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "http://localhost:3200";
const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "artifacts/catalog-final";
const TARGET_TOOL = "AgentX";
const VIEWPORT = { width: 390, height: 844 };

mkdirSync(OUT, { recursive: true });

/** Wait for React to settle after state change */
async function settleReact(page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(300);
}

/** Assert card state BEFORE capture. Throws if assertion fails. */
async function assertCardState(page, slug, expected) {
  const card = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${slug}"]`) }).first();
  await card.waitFor({ state: "attached", timeout: 5000 });
  
  const state = await card.evaluate(el => ({
    saved: el.getAttribute("data-qa-saved"),
    compared: el.getAttribute("data-qa-compared"),
    tier: el.getAttribute("data-qa-tier"),
    dataSaved: el.hasAttribute("data-saved"),
    dataSelected: el.hasAttribute("data-selected"),
    saveLayerOpacity: getComputedStyle(el.querySelector(".ar4-card__save-layer") || el).opacity,
    compareLayerOpacity: getComputedStyle(el.querySelector(".ar4-card__compare-layer") || el).opacity,
    watermarkPresent: !!el.querySelector(".ar4-card__watermark"),
    bookmarkPressed: el.querySelector(".ar4-card__bookmark")?.getAttribute("aria-pressed"),
    comparePressed: el.querySelector('[data-sonic-action="compare"]')?.getAttribute("aria-pressed"),
  }));
  
  const errors = [];
  if (state.saved !== expected.saved) errors.push(`saved: expected ${expected.saved}, got ${state.saved}`);
  if (state.compared !== expected.compared) errors.push(`compared: expected ${expected.compared}, got ${state.compared}`);
  if (expected.tier && state.tier !== expected.tier) errors.push(`tier: expected ${expected.tier}, got ${state.tier}`);
  if (expected.saved === "true" && !state.dataSaved) errors.push("data-saved attribute missing");
  if (expected.saved === "false" && state.dataSaved) errors.push("data-saved attribute should be absent");
  if (expected.compared === "true" && !state.dataSelected) errors.push("data-selected attribute missing");
  if (expected.compared === "false" && state.dataSelected) errors.push("data-selected attribute should be absent");
  if (expected.saved === "true" && state.bookmarkPressed !== "true") errors.push(`bookmark aria-pressed: expected true, got ${state.bookmarkPressed}`);
  if (expected.saved === "false" && state.bookmarkPressed !== "false") errors.push(`bookmark aria-pressed: expected false, got ${state.bookmarkPressed}`);
  if (expected.compared === "true" && state.comparePressed !== "true") errors.push(`compare aria-pressed: expected true, got ${state.comparePressed}`);
  if (expected.compared === "false" && state.comparePressed !== "false") errors.push(`compare aria-pressed: expected false, got ${state.comparePressed}`);
  if (expected.compared === "true" && !state.watermarkPresent) errors.push("watermark should be present");
  if (expected.compared === "false" && state.watermarkPresent) errors.push("watermark should be absent");
  
  if (errors.length > 0) {
    throw new Error(`STATE ASSERTION FAILED for ${slug}:\n  ${errors.join("\n  ")}\n  Actual: ${JSON.stringify(state, null, 2)}`);
  }
  return state;
}

/** Clear all Save + Compare state for the target tool */
async function clearState(page, slug) {
  await page.evaluate((slug) => {
    // Clear via store
    const store = window.__TV_WORKSPACE_STORE__;
    if (store?.getState) {
      const s = store.getState();
      if (s.savedSlugs?.includes(slug)) s.toggleSaved(slug);
      if (s.compareSlugs?.includes(slug)) s.toggleCompare(slug);
    }
    // Also clear localStorage
    for (const key of Object.keys(localStorage)) {
      if (key.includes("workspace") || key.includes("discovery")) {
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (val?.saved?.slugs) val.saved.slugs = val.saved.slugs.filter(s => s !== slug);
          if (val?.compare?.slugs) val.compare.slugs = val.compare.slugs.filter(s => s !== slug);
          localStorage.setItem(key, JSON.stringify(val));
        } catch {}
      }
    }
  }, slug);
  await settleReact(page);
}

/** Apply exact desired state */
async function applyState(page, slug, state) {
  const card = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${slug}"]`) }).first();
  
  // Clear first
  await clearState(page, slug);
  
  // Apply save
  if (state.saved === "true") {
    const bookmark = card.locator(".ar4-card__bookmark");
    if (await bookmark.getAttribute("aria-pressed") !== "true") {
      await bookmark.click();
      await settleReact(page);
    }
  }
  
  // Apply compare
  if (state.compared === "true") {
    const compare = card.locator('[data-sonic-action="compare"]');
    if (await compare.getAttribute("aria-pressed") !== "true") {
      await compare.click();
      await settleReact(page);
    }
  }
}

/** Capture with assertion gate */
async function captureState(page, slug, state, filename) {
  console.log(`  Applying state: saved=${state.saved} compared=${state.compared}...`);
  await applyState(page, slug, state);
  
  console.log(`  Asserting state...`);
  const actual = await assertCardState(page, slug, state);
  console.log(`  ✓ Assertions passed: ${JSON.stringify(actual)}`);
  
  const card = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${slug}"]`) }).first();
  const path = join(OUT, filename);
  await card.screenshot({ path });
  console.log(`  ✓ Captured: ${path}`);
  
  // Write sidecar
  const sidecar = {
    filename,
    tool: slug,
    expectedState: state,
    actualState: actual,
    timestamp: new Date().toISOString(),
    gitSha: process.env.GIT_SHA || "unknown",
  };
  writeFileSync(path.replace(".png", ".json"), JSON.stringify(sidecar, null, 2));
  console.log(`  ✓ Sidecar: ${path.replace(".png", ".json")}`);
}

async function main() {
  console.log(`STATE-TRUTH CAPTURE HARNESS`);
  console.log(`Target: ${TARGET_TOOL} @ ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`Base: ${BASE}`);
  console.log(`Output: ${OUT}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  
  // Navigate
  await page.goto(`${BASE}/archivio`, { waitUntil: "networkidle" });
  await settleReact(page);
  
  // Verify target card exists
  const card = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${TARGET_TOOL}"]`) }).first();
  if (await card.count() === 0) {
    console.error(`ERROR: Card for "${TARGET_TOOL}" not found on page`);
    process.exit(1);
  }
  console.log(`✓ Target card found: ${TARGET_TOOL}\n`);
  
  // STATE TRUTH TABLE: 4 states, same tool
  console.log(`=== STATE-TRUTH-TABLE ===`);
  const states = [
    { saved: "false", compared: "false", filename: "STATE-TRUTH-01-DEFAULT.png" },
    { saved: "true",  compared: "false", filename: "STATE-TRUTH-02-SAVED.png" },
    { saved: "false", compared: "true",  filename: "STATE-TRUTH-03-COMPARE.png" },
    { saved: "true",  compared: "true",  filename: "STATE-TRUTH-04-BOTH.png" },
  ];
  
  for (const state of states) {
    console.log(`\n--- ${state.filename} ---`);
    await captureState(page, TARGET_TOOL, state, state.filename);
  }
  
  // PODIUM TRUTH TABLE
  console.log(`\n=== PODIUM-TRUTH-TABLE ===`);
  const podiumSlugs = ["blink", "vibecode", "weweb"];
  const podiumTiers = ["gold", "silver", "bronze"];
  
  for (let i = 0; i < podiumSlugs.length; i++) {
    const slug = podiumSlugs[i];
    const tier = podiumTiers[i];
    const rank = String(i + 1).padStart(2, "0");
    
    console.log(`\n--- ${rank} ${slug} (${tier}) ---`);
    
    // Verify tier
    const podiumCard = page.locator(`.ar4-card`).filter({ has: page.locator(`.ar4-card__name-link[href*="${slug}"]`) }).first();
    if (await podiumCard.count() === 0) {
      console.log(`  SKIP: ${slug} not visible (may need load-more)`);
      continue;
    }
    
    const tierAttr = await podiumCard.getAttribute("data-qa-tier");
    if (tierAttr !== tier) {
      console.log(`  WARNING: expected tier=${tier}, got ${tierAttr}`);
    }
    
    // Capture default state
    await captureState(page, slug, { saved: "false", compared: "false", tier }, `PODIUM-TRUTH-${rank}-${tier}-DEFAULT.png`);
    
    // For #1, capture all 4 states
    if (i === 0) {
      await captureState(page, slug, { saved: "true", compared: "false", tier }, `PODIUM-TRUTH-${rank}-${tier}-SAVED.png`);
      await captureState(page, slug, { saved: "false", compared: "true", tier }, `PODIUM-TRUTH-${rank}-${tier}-COMPARE.png`);
      await captureState(page, slug, { saved: "true", compared: "true", tier }, `PODIUM-TRUTH-${rank}-${tier}-BOTH.png`);
    }
  }
  
  await browser.close();
  console.log(`\n✓ All captures complete with assertions passed.`);
}

main().catch(err => {
  console.error(`\n✗ CAPTURE ABORTED: ${err.message}`);
  process.exit(1);
});
