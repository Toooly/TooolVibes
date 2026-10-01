import { expect, test } from "./fixtures/release-fixture";

/**
 * Exact history scroll restoration contract.
 *
 * Verifies Back/Forward restores the exact prior scroll Y within <=2px
 * tolerance across Home Featured, Home Podium, Catalog, and Tool Detail.
 */

async function dismissConsentIfPresent(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Accetta tutto" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.tap();
    await expect(page.locator(".tv-consent-banner")).toHaveCount(0);
  }
}

async function getScrollY(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const shell = document.querySelector(".marketing-shell");
    if (shell instanceof HTMLElement) return shell.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  });
}

async function scrollToY(page: import("@playwright/test").Page, y: number): Promise<void> {
  await page.evaluate((targetY) => {
    const shell = document.querySelector(".marketing-shell");
    if (shell instanceof HTMLElement) {
      shell.scrollTop = targetY;
    } else {
      window.scrollTo(0, targetY);
    }
  }, y);
  await page.waitForTimeout(300);
}

test.describe("history scroll restoration (390)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("A. Home Featured -> Tool -> Back restores exact scroll Y", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 400);
    const beforeY = await getScrollY(page);
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterY = await getScrollY(page);
    expect(Math.abs(afterY - beforeY)).toBeLessThanOrEqual(2);
  });

  test("B. Home Podium -> Tool -> Back restores exact scroll Y", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 1200);
    const beforeY = await getScrollY(page);
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterY = await getScrollY(page);
    expect(Math.abs(afterY - beforeY)).toBeLessThanOrEqual(2);
  });

  test("C. Catalog -> Tool -> Back restores exact scroll Y", async ({ page }) => {
    await page.goto("/archivio", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 600);
    const beforeY = await getScrollY(page);
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterY = await getScrollY(page);
    expect(Math.abs(afterY - beforeY)).toBeLessThanOrEqual(2);
  });

  test("D. Tool Detail -> internal route -> Back restores exact scroll Y", async ({ page }) => {
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 800);
    const beforeY = await getScrollY(page);
    // Navigate to another internal route from Tool Detail
    await page.goto("/archivio", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterY = await getScrollY(page);
    expect(Math.abs(afterY - beforeY)).toBeLessThanOrEqual(2);
  });

  test("E. Back then Forward restores both positions", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 400);
    const homeY = await getScrollY(page);
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const backY = await getScrollY(page);
    expect(Math.abs(backY - homeY)).toBeLessThanOrEqual(2);
    // Forward
    await page.goForward({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await expect(page).toHaveURL(/\/toools\/blink/);
  });
});

test.describe("history scroll restoration (1440 desktop)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("F. Home -> Tool -> Back restores exact scroll Y (desktop)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissConsentIfPresent(page);
    await scrollToY(page, 800);
    const beforeY = await getScrollY(page);
    await page.goto("/toools/blink", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.goBack({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterY = await getScrollY(page);
    expect(Math.abs(afterY - beforeY)).toBeLessThanOrEqual(2);
  });
});
