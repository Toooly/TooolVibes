import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const evidenceRoot = path.join(
  root,
  "audits/definitive-rebuild/whole-product-final",
);
const outputRoot = path.join(evidenceRoot, "final/production");
const baseUrl =
  process.env.QA_BASE_URL ??
  "https://tooolvibes.square-shape-3527.workers.dev";

const viewports = [
  { id: "mobile", width: 390, height: 844 },
  { id: "desktop", width: 1440, height: 900 },
];
const routes = [
  { id: "home", pathname: "/" },
  { id: "archive", pathname: "/archivio" },
  { id: "tool-detail", pathname: "/toools/blink" },
  { id: "radar", pathname: "/radar" },
  { id: "compare", pathname: "/compare" },
  { id: "saved", pathname: "/shortlist" },
  { id: "collections", pathname: "/collections" },
  {
    id: "collection-detail",
    pathname: "/collections/ai-stack-solo-founders",
  },
  { id: "account", pathname: "/account" },
];

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const viewportRoot = path.join(outputRoot, viewport.id);
  await fs.mkdir(viewportRoot, { recursive: true });

  for (const route of routes) {
    const consoleErrors = [];
    const pageErrors = [];
    const assetErrors = [];

    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(error.message);
    const onResponse = (response) => {
      const type = response.request().resourceType();
      if (
        (type === "script" || type === "stylesheet") &&
        response.status() >= 400
      ) {
        assetErrors.push(`${response.status()} ${response.url()}`);
      }
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("response", onResponse);

    const response = await page.goto(`${baseUrl}${route.pathname}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    const introSkip = page.locator("[aria-label='Salta introduzione']");
    const introWasVisible = await introSkip.isVisible().catch(() => false);
    if (route.pathname === "/" && introWasVisible) {
      await introSkip.click();
      await introSkip.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
    }
    const introVisibleAfterDismissal = await introSkip
      .isVisible()
      .catch(() => false);

    const metrics = await page.evaluate(() => {
      const visible = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const assets = [
        ...document.querySelectorAll("link[rel='stylesheet'][href], script[src]"),
      ].map((element) =>
        new URL(element.getAttribute("href") ?? element.getAttribute("src"), location.href)
          .pathname,
      );
      const mobileNav = document.querySelector(
        "nav[aria-label='Navigazione mobile principale']",
      );
      const desktopCommand = document.querySelector(".command-bar");
      const mobileTop = document.querySelector(".mobile-top-bar");
      const isDesktop = window.innerWidth >= 1280;
      const isAccount = location.pathname.startsWith("/account");
      const mobileNavVisible = visible(mobileNav);
      const desktopCommandVisible = visible(desktopCommand);
      const mobileTopVisible = visible(mobileTop);
      return {
        title: document.title,
        hasMain: Boolean(document.querySelector("main")),
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth + 1,
        mobileNavVisible,
        desktopCommandVisible,
        mobileTopVisible,
        shellContractPass: isDesktop
          ? desktopCommandVisible && !mobileNavVisible && !mobileTopVisible
          : mobileTopVisible && (isAccount ? !mobileNavVisible : mobileNavVisible),
        assets: [...new Set(assets)].filter((asset) =>
          asset.includes("/_next/static/"),
        ),
      };
    });

    await page.screenshot({
      path: path.join(viewportRoot, `${route.id}.png`),
      fullPage: false,
      animations: "disabled",
    });

    results.push({
      viewport: viewport.id,
      route: route.id,
      pathname: route.pathname,
      status: response?.status() ?? null,
      consoleErrors,
      pageErrors,
      assetErrors,
      introWasVisible,
      introVisibleAfterDismissal,
      ...metrics,
    });

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }

  await context.close();
}

await browser.close();

const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  totals: {
    checks: results.length,
    non200: results.filter((entry) => entry.status !== 200).length,
    missingMain: results.filter((entry) => !entry.hasMain).length,
    horizontalOverflow: results.filter((entry) => entry.horizontalOverflow)
      .length,
    consoleErrors: results.reduce(
      (count, entry) => count + entry.consoleErrors.length,
      0,
    ),
    pageErrors: results.reduce(
      (count, entry) => count + entry.pageErrors.length,
      0,
    ),
    assetErrors: results.reduce(
      (count, entry) => count + entry.assetErrors.length,
      0,
    ),
    nonHomeIntroViolations: results.filter(
      (entry) => entry.pathname !== "/" && entry.introWasVisible,
    ).length,
    homeIntroDismissalFailures: results.filter(
      (entry) => entry.pathname === "/" && entry.introVisibleAfterDismissal,
    ).length,
    shellViolations: results.filter((entry) => !entry.shellContractPass).length,
  },
  assetFingerprints: [
    ...new Set(results.flatMap((entry) => entry.assets)),
  ].sort(),
  results,
};

await fs.writeFile(
  path.join(evidenceRoot, "final/production-verification.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(JSON.stringify(summary.totals, null, 2));
