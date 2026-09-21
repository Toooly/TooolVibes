import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/archivio",
  "/toools/blink",
  "/radar",
  "/collections",
  "/collections/ai-stack-solo-founders",
  "/posts",
  "/posts/omi-app-ai",
  "/shortlist",
  "/compare",
  "/account",
  "/metodo",
] as const;

test.describe("horizontal overflow", () => {
  for (const path of routes) {
    test(`${path} does not overflow the viewport`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response, `${path} did not return a document`).not.toBeNull();
      expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(400);

      const cookieReject = page.getByRole("button", { name: /Rifiuta/i });
      if (await cookieReject.isVisible().catch(() => false)) {
        await cookieReject.click();
      }

      await page.waitForTimeout(250);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
      });

      expect(
        overflow,
        `${path} body overflowed the viewport by ${overflow}px`,
      ).toBeLessThanOrEqual(1);
    });
  }
});
