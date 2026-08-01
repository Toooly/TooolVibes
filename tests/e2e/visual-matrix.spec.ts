import { expect, settleForScreenshot, test } from "./fixtures/release-fixture";

const visualRoutes = [
  { path: "/", snapshot: "home.png" },
  { path: "/archivio", snapshot: "archivio.png" },
  { path: "/toools/blink", snapshot: "tool-detail-blink.png" },
  { path: "/shortlist", snapshot: "shortlist.png" },
  { path: "/compare", snapshot: "compare.png" },
  { path: "/radar", snapshot: "radar.png" },
  { path: "/account", snapshot: "account.png" },
  { path: "/collections", snapshot: "collections.png" },
  { path: "/tags", snapshot: "tags.png" },
] as const;

test.describe("visual route matrix", () => {
  for (const route of visualRoutes) {
    test(`${route.path} matches its release baseline`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response?.status()).toBeLessThan(400);
      await expect(page, `${route.path} redirected unexpectedly`).toHaveURL(
        new RegExp(`${route.path === "/" ? "/$" : `${route.path}$`}`),
      );
      await settleForScreenshot(page);
      await expect(page).toHaveScreenshot(route.snapshot, {
        fullPage: true,
      });
    });
  }
});
