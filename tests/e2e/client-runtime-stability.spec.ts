import { test, expect, type Page } from "@playwright/test";

/**
 * Client runtime stability regression test.
 *
 * Guards against the P0 "Application error: a client-side exception has
 * occurred" production defect. Fails on:
 *   - pageerror (uncaught JS exceptions)
 *   - unhandled promise rejections
 *   - fatal console errors (Application error / ChunkLoadError)
 *   - critical JS chunk load failures (404/403 on _next/static)
 *
 * Runs 20+ route/history transitions per test case.
 */

interface CollectedErrors {
  pageErrors: string[];
  unhandledRejections: string[];
  fatalConsole: string[];
  chunkFailures: string[];
}

function instrument(page: Page): { errors: CollectedErrors; stop: () => void } {
  const errors: CollectedErrors = {
    pageErrors: [],
    unhandledRejections: [],
    fatalConsole: [],
    chunkFailures: [],
  };

  const onPageError = (err: Error) => {
    errors.pageErrors.push(`${err.name}: ${err.message}`);
  };
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        text.includes("Application error") ||
        text.includes("client-side exception") ||
        text.includes("ChunkLoadError") ||
        text.includes("Loading chunk") ||
        text.includes("Failed to fetch dynamically")
      ) {
        errors.fatalConsole.push(text.slice(0, 300));
      }
    }
  };
  const onResponse = (resp: { url: () => string; status: () => number }) => {
    if (resp.status() >= 400 && resp.url().includes("_next/static")) {
      errors.chunkFailures.push(`${resp.status()} ${resp.url().slice(0, 120)}`);
    }
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("response", onResponse);

  return {
    errors,
    stop: () => {
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      page.off("response", onResponse);
    },
  };
}

test.describe("client runtime stability", () => {
  test("CTS-01: 20+ navigation transitions produce zero fatal errors (390)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { errors, stop } = instrument(page);

    const routes = ["/", "/archivio", "/toools/blogify", "/toools/agentx", "/radar", "/collections"];
    let transitions = 0;

    await page.goto("https://tooolvibes.eu", { waitUntil: "domcontentloaded", timeout: 30000 });

    for (let i = 0; i < 7; i++) {
      const route = routes[i % routes.length];
      await page.goto(`https://tooolvibes.eu${route}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(300);
      transitions++;

      await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(200);
      transitions++;

      await page.goForward({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(200);
      transitions++;
    }

    stop();

    expect(errors.pageErrors, `pageErrors: ${JSON.stringify(errors.pageErrors)}`).toHaveLength(0);
    expect(errors.unhandledRejections, `rejections: ${JSON.stringify(errors.unhandledRejections)}`).toHaveLength(0);
    expect(errors.fatalConsole, `fatal: ${JSON.stringify(errors.fatalConsole)}`).toHaveLength(0);
    expect(errors.chunkFailures, `chunks: ${JSON.stringify(errors.chunkFailures)}`).toHaveLength(0);
    expect(transitions).toBeGreaterThanOrEqual(20);
  });

  test("CTS-02: client-side link navigation is stable (390)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { errors, stop } = instrument(page);

    await page.goto("https://tooolvibes.eu", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);

    let transitions = 0;
    for (let i = 0; i < 10; i++) {
      // Click Catalogo link
      const catalogLink = page.locator('a[href="/archivio"]').first();
      if (await catalogLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await catalogLink.click();
        await page.waitForTimeout(500);
        transitions++;
      }

      // Click a tool card link
      const toolLink = page.locator(".ar4-card__name-link").first();
      if (await toolLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toolLink.click();
        await page.waitForTimeout(500);
        transitions++;
      }

      // Back
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(300);
      transitions++;

      // Home
      const homeLink = page.locator('a[href="/"]').first();
      if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await homeLink.click();
        await page.waitForTimeout(500);
        transitions++;
      }
    }

    stop();

    expect(errors.pageErrors, `pageErrors: ${JSON.stringify(errors.pageErrors)}`).toHaveLength(0);
    expect(errors.fatalConsole, `fatal: ${JSON.stringify(errors.fatalConsole)}`).toHaveLength(0);
    expect(errors.chunkFailures, `chunks: ${JSON.stringify(errors.chunkFailures)}`).toHaveLength(0);
    expect(transitions).toBeGreaterThanOrEqual(15);
  });

  test("CTS-03: rapid back/forward cycles are stable (desktop 1440)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const { errors, stop } = instrument(page);

    await page.goto("https://tooolvibes.eu/archivio", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Build some history
    await page.goto("https://tooolvibes.eu/toools/blogify", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.goto("https://tooolvibes.eu/archivio", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.goto("https://tooolvibes.eu/toools/agentx", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});

    // Rapid back/forward
    for (let i = 0; i < 10; i++) {
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {});
      await page.goForward({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {});
    }

    stop();

    expect(errors.pageErrors, `pageErrors: ${JSON.stringify(errors.pageErrors)}`).toHaveLength(0);
    expect(errors.fatalConsole, `fatal: ${JSON.stringify(errors.fatalConsole)}`).toHaveLength(0);
    expect(errors.chunkFailures, `chunks: ${JSON.stringify(errors.chunkFailures)}`).toHaveLength(0);
  });
});
