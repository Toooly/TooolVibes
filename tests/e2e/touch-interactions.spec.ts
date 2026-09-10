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

    // Three zones: title, body middle, and the previously-dead action rail
    // strip (left of the toggles). All must navigate. The box is re-measured
    // per zone: layout settles (images, entrance motion, scroll restore)
    // between taps, and stale coordinates would miss the card.
    const zoneOf = (label: string, box: { x: number; y: number; width: number; height: number }) => {
      if (label === "title") return [box.x + box.width * 0.35, box.y + 24] as const;
      if (label === "body") return [box.x + box.width * 0.5, box.y + box.height * 0.5] as const;
      return [box.x + 30, box.y + box.height - 22] as const;
    };

    for (const label of ["title", "body", "rail-empty"] as const) {
      const liveCard = page.locator(".ar4-card").first();
      await liveCard.waitFor({ state: "visible" });
      await page.waitForTimeout(400);
      const box = await liveCard.boundingBox();
      if (!box) throw new Error("catalog card has no bounding box");
      const [x, y] = zoneOf(label, box);
      await page.touchscreen.tap(x, y);
      await expect(page, `${label} tap did not open the tool detail`).toHaveURL(
        /\/toools\//,
      );
      await page.goBack({ waitUntil: "domcontentloaded" });
    }
  });

  test("CATALOG filter sheet opens above persistent chrome and closes cleanly", async ({
    page,
  }) => {
    await page.goto("/archivio", { waitUntil: "domcontentloaded" });
    await dismissConsentIfPresent(page);

    // Put one tool in compare so the session dock is floating.
    const card = page.locator(".ar4-card").first();
    await card.getByRole("button", { name: /Aggiungi .* al confronto/ }).first().tap();

    const trigger = page.getByRole("button", { name: /Apri filtri catalogo/i });
    await trigger.tap();
    const sheet = page.locator("#ar4-filter-sheet");
    await expect(sheet).toBeVisible();

    // Regression (v3.2 P1): the sheet is portalled to body and must NOT be
    // intercepted by the compare dock or bottom nav. Hit-test the lowest
    // group toggle through the viewport.
    const gruppo = sheet.getByRole("button", { name: "Livello" });
    await expect(gruppo).toBeVisible();
    await gruppo.tap();
    await expect(gruppo).toHaveAttribute("aria-expanded", "true");

    // Apply a level filter and confirm the sheet closes and chips appear.
    await sheet.getByRole("button", { name: "Principiante" }).tap();
    await sheet.getByRole("button", { name: /Mostra \d+ risultati/i }).tap();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator(".ar4-applied")).toBeVisible();

    await page.getByRole("button", { name: /Reimposta/i }).first().tap();
    await expect(page.locator(".ar4-applied")).toHaveCount(0);

    // Cleanup compare selection.
    await card.getByRole("button", { name: /Rimuovi .* dal confronto|Togli/i }).first().tap();
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
