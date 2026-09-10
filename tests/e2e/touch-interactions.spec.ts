import { expect, test } from "./fixtures/release-fixture";

/**
 * Mobile touch interaction contract (v3.2).
 *
 * Regression guard for the P0 catalog card bug: taps on a catalog card
 * body MUST open the tool detail, while Save/Compare remain independent
 * controls. Runs with real touch emulation (hasTouch, mobile UA).
 */

test.describe("touch interaction contract (390)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  async function dismissConsentIfPresent(page: import("@playwright/test").Page) {
    const accept = page.getByRole("button", { name: "Accetta tutto" });
    if (await accept.isVisible().catch(() => false)) {
      await accept.tap();
      await expect(page.locator(".tv-consent-banner")).toHaveCount(0);
    }
  }

  test("CONSENT banner stays compact on mobile and is dismissable by tap", async ({
    page,
  }) => {
    await page.goto("/archivio", { waitUntil: "domcontentloaded" });
    const banner = page.locator(".tv-consent-banner");
    await expect(banner).toBeVisible();

    const height = await banner.evaluate((el) => el.getBoundingClientRect().height);
    // v3.2 compact contract: never more than a short bar (~1/6 of viewport).
    expect(height, `consent banner height ${height}px swallows the viewport`).toBeLessThan(180);

    await page.getByRole("button", { name: "Rifiuta non necessari" }).tap();
    await expect(banner).toHaveCount(0);
  });

  test("CATALOG card body taps open the tool detail", async ({ page }) => {
    await page.goto("/archivio", { waitUntil: "domcontentloaded" });
    await dismissConsentIfPresent(page);

    const card = page.locator(".ar4-card").first();
    await expect(card).toBeVisible();
    const href = await card.locator(".ar4-card__name-link").getAttribute("href");
    expect(href).toMatch(/^\/toools\//);

    const box = await card.boundingBox();
    if (!box) throw new Error("catalog card has no bounding box");

    // Three zones: title, body middle, and the previously-dead action rail
    // strip (left of the toggles). All must navigate.
    const zones: [string, number, number][] = [
      ["title", box.x + box.width * 0.35, box.y + 24],
      ["body", box.x + box.width * 0.5, box.y + box.height * 0.5],
      ["rail-empty", box.x + 30, box.y + box.height - 22],
    ];

    for (const [label, x, y] of zones) {
      await page.touchscreen.tap(x, y);
      await expect(page, `${label} tap did not open the tool detail`).toHaveURL(
        /\/toools\//,
      );
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.locator(".ar4-card").first().waitFor({ state: "visible" });
    }
  });

  test("CATALOG save and compare toggles are independent of card navigation", async ({
    page,
  }) => {
    await page.goto("/archivio", { waitUntil: "domcontentloaded" });
    await dismissConsentIfPresent(page);

    const card = page.locator(".ar4-card").first();
    await expect(card).toBeVisible();

    const save = card.getByRole("button", { name: /^Salva / }).first();
    const compare = card.getByRole("button", { name: /^Aggiungi .* al confronto/ }).first();

    await save.tap();
    await expect(page).toHaveURL(/\/archivio/);
    await expect(save).toHaveAttribute("aria-pressed", "true");

    await compare.tap();
    await expect(page).toHaveURL(/\/archivio/);
    await expect(card).toHaveClass(/is-selected/);

    // Cleanup so other tests start from a neutral workspace.
    await save.tap();
    await compare.tap();
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await expect(card).not.toHaveClass(/is-selected/);
  });
});
