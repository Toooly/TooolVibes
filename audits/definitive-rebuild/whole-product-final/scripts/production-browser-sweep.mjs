import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const evidenceRoot = path.join(
  root,
  "audits/definitive-rebuild/whole-product-final",
);
const rawRoot = path.join(evidenceRoot, "final/raw");
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3200";

const widths = [
  360, 390, 430, 768, 820, 912, 1024, 1180, 1279, 1280, 1366, 1440,
  1536, 1920,
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

await fs.mkdir(rawRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  for (const route of routes) {
    const consoleErrors = [];
    const pageErrors = [];
    const assetErrors = [];

    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(error.message);
    const onResponse = (response) => {
      const request = response.request();
      const type = request.resourceType();
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
      timeout: 20_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    const metrics = await page.evaluate(() => {
      const visible = (element) => {
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

      const clippedControls = [...document.querySelectorAll("a, button")]
        .filter(
          (element) =>
            visible(element) &&
            element.textContent?.trim() &&
            element.scrollWidth > element.clientWidth + 2,
        )
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));

      const tinyMainText = [...document.querySelectorAll("main p, main a, main button, main label")]
        .filter(
          (element) =>
            visible(element) &&
            element.textContent?.trim() &&
            Number.parseFloat(getComputedStyle(element).fontSize) < 12,
        )
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
          fontSize: getComputedStyle(element).fontSize,
        }));

      const mobileNav = document.querySelector(
        "nav[aria-label='Navigazione mobile principale']",
      );
      const desktopCommand = document.querySelector(".command-bar");
      const mobileTop = document.querySelector(".mobile-top-bar");

      return {
        title: document.title,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth + 1,
        clippedControls,
        tinyMainText,
        hasMain: Boolean(document.querySelector("main")),
        hasFooter: Boolean(document.querySelector("footer")),
        mobileNavVisible: mobileNav ? visible(mobileNav) : false,
        desktopCommandVisible: desktopCommand ? visible(desktopCommand) : false,
        mobileTopVisible: mobileTop ? visible(mobileTop) : false,
        accountMobileNavAbsent:
          location.pathname !== "/account" || mobileNav === null,
      };
    });

    const widthDir = path.join(rawRoot, String(width));
    await fs.mkdir(widthDir, { recursive: true });
    await page.screenshot({
      path: path.join(widthDir, `${route.id}.png`),
      fullPage: false,
      animations: "disabled",
    });

    if (width === 390 || width === 1440) {
      const target =
        width === 390
          ? path.join(evidenceRoot, "after/mobile", `${route.id}.png`)
          : path.join(evidenceRoot, "after/desktop", `${route.id}.png`);
      await page.screenshot({
        path: target,
        fullPage: true,
        animations: "disabled",
      });
    }

    results.push({
      route: route.id,
      pathname: route.pathname,
      width,
      status: response?.status() ?? null,
      consoleErrors,
      pageErrors,
      assetErrors,
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
  widths,
  routes: routes.map(({ id, pathname }) => ({ id, pathname })),
  totals: {
    checks: results.length,
    non200: results.filter((entry) => entry.status !== 200).length,
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
    clippedControls: results.reduce(
      (count, entry) => count + entry.clippedControls.length,
      0,
    ),
    tinyMainText: results.reduce(
      (count, entry) => count + entry.tinyMainText.length,
      0,
    ),
    accountNavViolations: results.filter(
      (entry) => !entry.accountMobileNavAbsent,
    ).length,
  },
  results,
};

await fs.writeFile(
  path.join(evidenceRoot, "final/responsive-sweep.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(JSON.stringify(summary.totals, null, 2));
