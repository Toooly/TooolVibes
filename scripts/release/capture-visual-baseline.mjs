// Phase 0.1 — Visual baseline capture (standalone, bypasses playwright test runner).
//
// Why standalone: the test runner's settleForScreenshot calls page.waitForLoadState("networkidle")
// which never resolves for TooolVibes (Supabase realtime subscriptions, middleware keepalive,
// orbital physics rAF). This is pre-existing infrastructure debt, documented in
// the local release workspace rather than the source tree.
//
// Capture: 9 routes × 9 viewports = 81 screenshots outside the repository.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.CAPTURE_BASE_URL ?? "http://127.0.0.1:3100";
const OUT_DIR = path.resolve(
  process.env.CAPTURE_OUTPUT_DIR ??
    path.join(os.tmpdir(), "tooolvibes-visual-baseline"),
);

const VIEWPORTS = [
  { name: "320x740", width: 320, height: 740 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1728x1000", width: 1728, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const ROUTES = [
  "/",
  "/archivio",
  "/collections",
  "/compare",
  "/shortlist",
  "/radar",
  "/toools/blink",
  "/tags",
  "/account",
];

const ROUTE_TO_FILE = (p) =>
  p.replace(/^\//, "").replace(/\//g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "home";

const SETTLE_MS = 1500; // brief fixed wait; no networkidle

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[capture] start ${startedAt}`);
  console.log(`[capture] base=${BASE_URL} out=${OUT_DIR}`);

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {
    capturedAt: startedAt,
    baseUrl: BASE_URL,
    outDir: OUT_DIR,
    viewports: VIEWPORTS,
    routes: ROUTES,
    results: [],
  };

  const browser = await chromium.launch({ headless: true });

  let okCount = 0;
  let failCount = 0;

  for (const vp of VIEWPORTS) {
    const vpDir = path.join(OUT_DIR, vp.name);
    await mkdir(vpDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: "it-IT",
      timezoneId: "Europe/Rome",
      colorScheme: "dark",
      reducedMotion: "reduce",
    });

    for (const route of ROUTES) {
      const fileName = `${ROUTE_TO_FILE(route) || "home"}.png`;
      const filePath = path.join(vpDir, fileName);
      const result = {
        viewport: vp.name,
        route,
        file: path.relative(OUT_DIR, filePath),
        status: null,
        httpStatus: null,
        bytes: null,
        error: null,
        capturedAt: new Date().toISOString(),
      };

      try {
        const page = await context.newPage();
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        result.httpStatus = response?.status() ?? null;
        if (!response || response.status() >= 400) {
          throw new Error(`Unexpected document status: ${response?.status() ?? "no response"}`);
        }
        if (new URL(page.url()).pathname !== route) {
          throw new Error(`Unexpected final route: ${new URL(page.url()).pathname}`);
        }
        // Brief settle for fonts and one render frame.
        await page.waitForTimeout(SETTLE_MS);
        await page.screenshot({ path: filePath, fullPage: true });
        result.status = "ok";
        result.bytes = existsSync(filePath) ? statSync(filePath).size : 0;
        okCount++;
        await page.close();
      } catch (err) {
        result.status = "fail";
        result.error = String(err?.message ?? err).slice(0, 240);
        failCount++;
      }
      manifest.results.push(result);
      console.log(
        `[capture] vp=${vp.name} route=${route} status=${result.status} http=${result.httpStatus} bytes=${result.bytes ?? "-"}`,
      );
    }

    await context.close();
  }

  await browser.close();

  manifest.summary = {
    total: VIEWPORTS.length * ROUTES.length,
    ok: okCount,
    fail: failCount,
    finishedAt: new Date().toISOString(),
  };

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(
    `[capture] done. ok=${okCount}/${VIEWPORTS.length * ROUTES.length} fail=${failCount}`,
  );
  if (failCount > 0) {
    console.error(`[capture] ${failCount} screenshots failed; see manifest.json`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[capture] fatal:", err);
  process.exit(2);
});
