import { expect, settleForScreenshot, test } from "./fixtures/release-fixture";

// Phase 0.2 — minimal behavioural safety. Mirrors core-routes.spec.ts pattern
// (which is known to pass under the chromium gate-setup warmup).
// Asserts route renders, returns <400, has visible chrome, no blocking console errors.
const smokeRoutes = [
  { path: "/", name: "home" },
  { path: "/archivio", name: "archivio" },
  { path: "/collections", name: "collections" },
  { path: "/compare", name: "compare" },
  { path: "/shortlist", name: "shortlist" },
  { path: "/radar", name: "radar" },
  { path: "/toools/blink", name: "tool-detail-blink" },
  { path: "/tags", name: "tags" },
] as const;

test.describe("baseline smoke — route + chrome + console", () => {
  for (const route of smokeRoutes) {
    test(`${route.path} renders without blocking errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const handler = (msg: { type: () => string; text: () => string }) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      };
      page.on("console", handler);

      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response, `${route.path} did not return a document response`).not.toBeNull();
      expect(response?.status(), `${route.path} returned an unexpected status`).toBeLessThan(400);
      await expect(page, `${route.path} redirected unexpectedly`).toHaveURL(
        new RegExp(`${route.path === "/" ? "/$" : `${route.path}$`}`),
      );

      await settleForScreenshot(page);

      await expect(page.locator("#main-content"), `${route.path} main content visible`).toBeVisible();

      const blocking = consoleErrors.filter(
        (m) =>
          !/hydrat/i.test(m) &&
          !/favicon/i.test(m) &&
          !/Failed to load resource/i.test(m),
      );
      expect(
        blocking,
        `${route.path} unexpected console errors: ${blocking.slice(0, 2).join(" | ")}`,
      ).toEqual([]);

      page.off("console", handler);
    });
  }

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleForScreenshot(page);
    await page.keyboard.press("Control+K");
    await expect(
      page.locator('[role="dialog"], [cmdk-root], [data-cmdk-root]').first(),
      "command palette opens on Ctrl+K",
    ).toBeVisible({ timeout: 5_000 });
  });
});
