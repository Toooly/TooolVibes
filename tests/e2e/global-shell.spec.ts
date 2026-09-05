import { expect, test } from "@playwright/test";

test.describe("global shell continuity", () => {
  test("SHELL-NAV guest 390 Home → Archivio → Tool → Raccolte → Shortlist", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const cookieReject = page.getByRole("button", { name: /Rifiuta/i });
    if (await cookieReject.isVisible().catch(() => false)) {
      await cookieReject.click();
    }

    const dock = page.getByRole("navigation", {
      name: "Navigazione mobile principale",
    });
    const top = page.locator(".mobile-top-bar");
    await expect(dock).toBeVisible();

    async function assertShell(active: RegExp) {
      await expect(top).toBeVisible();
      await expect(dock).toBeVisible();
      await expect(page.locator(".tv-loop")).toHaveCount(0);
      await expect(page.locator("[data-loop-shell]")).toHaveCount(0);
      await expect(dock.getByRole("link", { name: active })).toHaveAttribute(
        "aria-current",
        "page",
      );
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }

    await assertShell(/Home/i);

    await dock.getByRole("link", { name: /Catalogo/i }).click();
    await expect(page).toHaveURL(/\/archivio/);
    await assertShell(/Catalogo/i);

    await page.getByRole("link", { name: /Apri la scheda di Blink/i }).click();
    await expect(page).toHaveURL(/\/toools\/blink/);
    await assertShell(/Catalogo/i);

    await dock.getByRole("link", { name: /Raccolte/i }).click();
    await expect(page).toHaveURL(/\/collections/);
    await assertShell(/Raccolte/i);

    await dock.getByRole("link", { name: /Salvati/i }).click();
    await expect(page).toHaveURL(/\/shortlist/);
    await assertShell(/Salvati/i);
  });
});
