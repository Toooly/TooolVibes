import { chromium } from "playwright";

const BASE_URL = process.env.TINYADZ_QA_BASE_URL ?? process.env.RESPONSIVE_QA_BASE_URL ?? "http://127.0.0.1:3000";
const PATHS = (process.env.TINYADZ_QA_PATHS ?? "/,/archivio,/toools/blink,/radar")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const SCRIPT_URL = "https://cdn.apitiny.net/scripts/v2.0/main.js";

function isFirstParty(url) {
  try {
    const host = new URL(url).hostname;
    const origin = new URL(BASE_URL).hostname;
    return host === origin || host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

const browser = await chromium.launch({ headless: true, args: ["--disable-extensions"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const vendor = [];
const firstPartyErrors = [];

page.on("response", (response) => {
  const url = response.url();
  if (url.includes("cdn.apitiny.net")) {
    vendor.push({ status: response.status(), url: url.slice(0, 180) });
  }
  if (response.status() >= 400 && isFirstParty(url)) {
    firstPartyErrors.push({ status: response.status(), url: url.slice(0, 180) });
  }
});

await page.goto(new URL("/", BASE_URL).toString(), {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});
await page.waitForTimeout(800);
const accept = page.getByRole("button", { name: /Accetta tutto/i });
if ((await accept.count()) > 0) {
  await accept.first().click();
  await page.waitForTimeout(2000);
}

const results = [];
for (const route of PATHS) {
  await page.goto(new URL(route, BASE_URL).toString(), {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(1500);
  const snap = await page.evaluate((scriptUrl) => {
    const script = document.getElementById("tinyadz-v2");
    return {
      script: Boolean(script),
      scriptSrc: script?.getAttribute("src") ?? null,
      siteId: script?.getAttribute("site-id") ?? null,
      slots: [...document.querySelectorAll("[data-tinyadz-placement]")].map((el) =>
        el.getAttribute("data-tinyadz-placement"),
      ),
      containers: document.querySelectorAll("[ta-ad-container]").length,
      runtime: Boolean(window.$ta2_ads),
      expectedSrc: scriptUrl,
    };
  }, SCRIPT_URL);
  results.push({ route, ...snap });
}

await browser.close();

const scriptOk = results.every((row) => row.script && row.scriptSrc === SCRIPT_URL && row.siteId);
const homeSlots = results.find((row) => row.route === "/")?.slots ?? [];
const vendorScript = vendor.filter((row) => row.url.includes("/scripts/v2.0/main.js"));
const vendorGsc = vendor.filter((row) => row.url.includes("/api/gsc"));
const vendorNoFill = vendorGsc.some((row) => row.status === 204 || row.status === 200);
const vendorConfigMissing = vendorGsc.some((row) => row.status === 403);

const summary = {
  baseUrl: BASE_URL,
  integration: scriptOk && homeSlots.includes("home-editorial") ? "healthy" : "broken",
  vendor: vendorConfigMissing ? "config-missing" : vendorNoFill ? "response" : vendorScript.length ? "script-only" : "no-vendor-request",
  firstPartyErrors,
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (firstPartyErrors.length > 0) {
  console.error("TinyAdz smoke failed: first-party HTTP errors");
  process.exit(1);
}
if (summary.integration !== "healthy") {
  console.error("TinyAdz smoke failed: integration contract broken");
  process.exit(1);
}
process.exit(0);
