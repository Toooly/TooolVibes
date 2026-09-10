import { expect, test } from "./fixtures/release-fixture";

const coreRoutes = [
  { path: "/", title: /TooolVibes/i },
  { path: "/archivio", title: /Catalogo di tool AI/i },
  { path: "/toools/blink", title: /Blink/i },
  { path: "/shortlist", title: /Salvati/i },
  { path: "/compare", title: /Confronta tool AI/i },
  { path: "/radar", title: /Radar/i },
  { path: "/account", title: /Account/i },
] as const;

test.describe("core route smoke", () => {
  for (const route of coreRoutes) {
    test(`${route.path} renders without console, runtime or hydration errors`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response, `${route.path} did not return a document response`).not.toBeNull();
      expect(response?.status(), `${route.path} returned an unexpected status`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${route.path === "/" ? "/$" : route.path}`));
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("#main-content")).not.toBeEmpty();
    });
  }
});
