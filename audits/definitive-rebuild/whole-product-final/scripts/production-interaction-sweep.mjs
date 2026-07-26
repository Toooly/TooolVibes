import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const evidenceRoot = path.join(
  root,
  "audits/definitive-rebuild/whole-product-final",
);
const stateRoot = path.join(evidenceRoot, "after/states");
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3200";

await fs.mkdir(stateRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

async function goto(pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {});
  return response?.status() ?? null;
}

const report = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  search: {},
  keyboard: {},
  utilities: {},
  workspace: {},
  routeState: {},
  reducedMotion: {},
  consoleErrors,
  pageErrors,
};

await goto("/");
await page.keyboard.press("Meta+k");
const desktopDialog = page.locator("[role='dialog']").first();
await desktopDialog.waitFor({ state: "visible" });
const desktopSearchInput = desktopDialog.locator("input").first();
await desktopSearchInput.fill("Blink");
await page.waitForTimeout(150);
report.search.desktopShortcutOpened = await desktopDialog.isVisible();
report.search.desktopQueryResultVisible = await desktopDialog
  .getByText(/Blink/i)
  .first()
  .isVisible()
  .catch(() => false);
await page.screenshot({
  path: path.join(stateRoot, "search-desktop.png"),
  fullPage: false,
  animations: "disabled",
});
await page.keyboard.press("Escape");
await page.waitForTimeout(450);
report.search.desktopEscapeClosed =
  !(await desktopDialog.isVisible().catch(() => false));

for (let index = 0; index < 12; index += 1) {
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return null;
    const style = getComputedStyle(active);
    return {
      tag: active.tagName.toLowerCase(),
      label:
        active.getAttribute("aria-label") ??
        active.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ??
        "",
      href: active instanceof HTMLAnchorElement ? active.getAttribute("href") : null,
      focusVisible: active.matches(":focus-visible"),
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  if (
    focus?.focusVisible &&
    ["a", "button", "input", "select", "textarea", "summary"].includes(
      focus.tag,
    )
  ) {
    report.keyboard.firstVisibleFocus = focus;
    break;
  }
}
report.keyboard.focusVisibleReached = Boolean(
  report.keyboard.firstVisibleFocus?.focusVisible,
);

const soundButton = page.getByRole("button", {
  name: "Disattiva suoni TooolVibes",
});
await soundButton.click();
report.utilities.soundToggleChanged =
  (await page.getByRole("button", { name: "Attiva suoni TooolVibes" }).count()) ===
  1;
const musicButton = page.getByRole("button", {
  name: "Attiva musica TooolVibes",
});
await musicButton.click();
report.utilities.musicToggleChanged =
  (await page
    .getByRole("button", { name: "Disattiva musica TooolVibes" })
    .count()) === 1;

await goto("/archivio?q=Blink&group=vibe-coding&level=featured");
report.routeState.archiveQueryRestored =
  (await page
    .locator("input[type='search']")
    .first()
    .inputValue()
    .catch(() => "")) === "Blink";
report.routeState.archiveGroupRestored = await page
  .locator("button.ar4-chip")
  .filter({ hasText: "Vibe coding" })
  .first()
  .evaluate((button) => button.classList.contains("is-active"))
  .catch(() => false);
report.routeState.nonHomeIntroAbsent =
  (await page.locator("[data-intro-mode]").count()) === 0;

await goto("/archivio");
const firstSaveButton = page.getByRole("button", { name: "Salva tool" }).first();
const savedTool = await firstSaveButton.evaluate((button) => {
  const card = button.closest(".ar4-card, article, [data-slot='card']");
  return card?.querySelector("h2, h3")?.textContent?.trim() ?? "";
});
await firstSaveButton.click();

for (let index = 0; index < 5; index += 1) {
  await page
    .getByRole("button", { name: "Aggiungi al confronto" })
    .first()
    .click();
}
const selectedBefore = await page
  .getByRole("button", { name: "Rimuovi dal confronto" })
  .count();
const sixthCandidate = page
  .getByRole("button", { name: "Aggiungi al confronto" })
  .first();
const sixthCandidateDisabled =
  (await sixthCandidate.getAttribute("disabled")) !== null ||
  (await sixthCandidate.getAttribute("aria-disabled")) === "true";
if (await sixthCandidate.isEnabled().catch(() => false)) {
  await sixthCandidate.click();
}
const selectedAfter = await page
  .getByRole("button", { name: "Rimuovi dal confronto" })
  .count();

report.workspace.savedTool = savedTool;
report.workspace.compareSelectedBeforeCap = selectedBefore;
report.workspace.compareSelectedAfterSixthAttempt = selectedAfter;
report.workspace.sixthCandidateDisabled = sixthCandidateDisabled;
report.workspace.compareCapHeld =
  selectedBefore === 5 && selectedAfter === 5;

await goto("/compare");
report.workspace.comparePersistedAfterNavigation =
  (await page.locator(".desktop-compare__score-row").count()) === 5;
report.workspace.compareIncludesCanonicalBlinkScore =
  (await page.getByText("8.4", { exact: true }).count()) > 0;
await page.screenshot({
  path: path.join(stateRoot, "compare-five-desktop.png"),
  fullPage: true,
  animations: "disabled",
});

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {});
report.workspace.comparePersistedAfterReload =
  (await page.locator(".desktop-compare__score-row").count()) === 5;

await page.setViewportSize({ width: 390, height: 844 });
await goto("/compare");
await page.screenshot({
  path: path.join(stateRoot, "compare-five-mobile.png"),
  fullPage: true,
  animations: "disabled",
});

await goto("/shortlist");
report.workspace.savedPersisted =
  savedTool.length > 0 && (await page.getByText(savedTool, { exact: true }).count()) > 0;
report.workspace.suggestionDisclosureCollapsed =
  (await page.locator("details[open]").count()) === 0;
await page.screenshot({
  path: path.join(stateRoot, "saved-populated-mobile.png"),
  fullPage: true,
  animations: "disabled",
});

await goto("/");
await page.getByRole("button", { name: "Apri ricerca" }).click();
const mobileDialog = page.locator("[role='dialog']").first();
await mobileDialog.waitFor({ state: "visible" });
const mobileNav = page.locator(
  "nav[aria-label='Navigazione mobile principale']",
);
const mobileNavState = await mobileNav.evaluate((nav) => {
  const style = getComputedStyle(nav);
  return {
    opacity: style.opacity,
    pointerEvents: style.pointerEvents,
  };
});
report.search.mobileButtonOpened = await mobileDialog.isVisible();
report.search.mobileNavSuppressed =
  mobileNavState.opacity === "0" && mobileNavState.pointerEvents === "none";
await page.screenshot({
  path: path.join(stateRoot, "search-mobile.png"),
  fullPage: false,
  animations: "disabled",
});
await page.keyboard.press("Escape");
await page.waitForTimeout(450);
report.search.mobileEscapeClosed =
  !(await mobileDialog.isVisible().catch(() => false));

await goto("/account");
report.routeState.accountMobileNavAbsent =
  (await page
    .locator("nav[aria-label='Navigazione mobile principale']")
    .count()) === 0;

const scoreRoutes = ["/", "/toools/blink"];
report.routeState.canonicalBlinkScore = {};
for (const route of scoreRoutes) {
  await goto(route);
  report.routeState.canonicalBlinkScore[route] =
    (await page.getByText("8.4", { exact: true }).count()) > 0;
}

const singleContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: "dark",
});
const singlePage = await singleContext.newPage();
await singlePage.goto(`${baseUrl}/archivio`, { waitUntil: "networkidle" });
await singlePage
  .getByRole("button", { name: "Aggiungi al confronto" })
  .first()
  .click();
await singlePage.goto(`${baseUrl}/compare`, { waitUntil: "networkidle" });
await singlePage.screenshot({
  path: path.join(stateRoot, "compare-one-mobile.png"),
  fullPage: true,
  animations: "disabled",
});
report.workspace.singleCandidateStateRendered =
  (await singlePage.getByRole("button", { name: /Rimuovi/i }).count()) === 1;
await singleContext.close();

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(`${baseUrl}/radar`, { waitUntil: "networkidle" });
report.reducedMotion.mediaQueryMatches = await reducedPage.evaluate(
  () => matchMedia("(prefers-reduced-motion: reduce)").matches,
);
report.reducedMotion.runningAnimations = await reducedPage.evaluate(
  () =>
    document
      .getAnimations()
      .filter((animation) => animation.playState === "running").length,
);
report.reducedMotion.withinContinuousMotionBudget =
  report.reducedMotion.runningAnimations <= 2;
await reducedContext.close();

report.passed = [
  report.search.desktopShortcutOpened,
  report.search.desktopQueryResultVisible,
  report.search.desktopEscapeClosed,
  report.search.mobileButtonOpened,
  report.search.mobileNavSuppressed,
  report.search.mobileEscapeClosed,
  report.keyboard.focusVisibleReached,
  report.utilities.soundToggleChanged,
  report.utilities.musicToggleChanged,
  report.workspace.compareCapHeld,
  report.workspace.comparePersistedAfterNavigation,
  report.workspace.comparePersistedAfterReload,
  report.workspace.compareIncludesCanonicalBlinkScore,
  report.workspace.savedPersisted,
  report.workspace.suggestionDisclosureCollapsed,
  report.workspace.singleCandidateStateRendered,
  report.routeState.archiveQueryRestored,
  report.routeState.archiveGroupRestored,
  report.routeState.nonHomeIntroAbsent,
  report.routeState.accountMobileNavAbsent,
  report.routeState.canonicalBlinkScore["/"],
  report.routeState.canonicalBlinkScore["/toools/blink"],
  report.reducedMotion.mediaQueryMatches,
  report.reducedMotion.withinContinuousMotionBudget,
  consoleErrors.length === 0,
  pageErrors.length === 0,
].every(Boolean);

await fs.writeFile(
  path.join(evidenceRoot, "final/interaction-sweep.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

await context.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));
