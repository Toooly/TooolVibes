import { describe, expect, it } from "vitest";

import { PENDING_AUTH_INTENT_STORAGE_KEY } from "@/lib/auth/pending-auth-intent";

const intent = {
  version: 1,
  id: "intent-cross-tab-01",
  capability: "stack.create",
  payload: { toolSlug: "blink", desiredStackName: "Podcast" },
  returnTo: "/toools/blink",
  origin: "save-overflow",
  createdAt: "2026-08-29T10:00:00.000Z",
  expiresAt: "2026-08-29T10:30:00.000Z",
};

describe("pending auth intent cross-tab localStorage", () => {
  it("INTENT-20 second page on the same origin sees localStorage and not sessionStorage", async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      await context.route("**/*", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><html><body>intent-tab</body></html>",
        }),
      );
      const pageA = await context.newPage();
      const pageB = await context.newPage();
      await pageA.goto("http://intent.local/a");
      await pageB.goto("http://intent.local/b");
      const serialized = JSON.stringify(intent);
      await pageA.evaluate(
        ([key, value]) => {
          window.sessionStorage.setItem(key, value);
          window.localStorage.setItem(key, value);
        },
        [PENDING_AUTH_INTENT_STORAGE_KEY, serialized] as const,
      );
      const fromLocalB = await pageB.evaluate(
        (key) => window.localStorage.getItem(key),
        PENDING_AUTH_INTENT_STORAGE_KEY,
      );
      const fromSessionB = await pageB.evaluate(
        (key) => window.sessionStorage.getItem(key),
        PENDING_AUTH_INTENT_STORAGE_KEY,
      );
      expect(fromLocalB).toBe(serialized);
      expect(fromSessionB).toBeNull();
      expect(fromLocalB).not.toMatch(/email|jwt|access_token/);
    } finally {
      await browser.close();
    }
  }, 30_000);
});
