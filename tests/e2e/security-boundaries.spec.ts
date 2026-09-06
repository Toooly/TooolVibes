import { expect, test } from "./fixtures/release-fixture";

test.describe("release security boundaries", () => {
  test("serves enforced framing protection and report-only rollout separately", async ({
    page,
  }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.headers()["content-security-policy"]).toBe(
      "frame-ancestors 'none'",
    );
    const reportOnly =
      response?.headers()["content-security-policy-report-only"] ?? "";
    expect(reportOnly).toContain("default-src 'self'");
    expect(reportOnly).not.toContain("frame-ancestors");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
  });

  test("keeps admin and gated routes closed to anonymous transport variants", async ({
    baseURL,
    playwright,
  }) => {
    expect(baseURL).toBeTruthy();
    const anonymous = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });

    try {
      const admin = await anonymous.get("/admin", {
        headers: {
          RSC: "1",
          "Next-Router-Prefetch": "1",
        },
        maxRedirects: 0,
      });
      expect([307, 308]).toContain(admin.status());
      expect(new URL(admin.headers().location).pathname).toBe("/admin/login");

      const gated = await anonymous.get("/archivio", { maxRedirects: 0 });
      expect([307, 308]).toContain(gated.status());
      expect(new URL(gated.headers().location).pathname).toBe("/");
    } finally {
      await anonymous.dispose();
    }
  });

  test("renders an invalid auth callback without exposing a runtime error", async ({
    page,
  }) => {
    const response = await page.goto(
      "/auth/callback?error=access_denied",
      { waitUntil: "domcontentloaded" },
    );

    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/accesso interrotto/i)).toBeVisible();
  });

  test("accepts an approved optimized image and rejects an unapproved host", async ({
    request,
  }) => {
    const approved = await request.get(
      "/_next/image?url=%2Fbrand%2Ftooolvibes-logo.png&w=128&q=75",
    );
    expect(approved.status()).toBe(200);
    expect(approved.headers()["content-type"]).toMatch(/^image\//);

    const rejected = await request.get(
      "/_next/image?url=https%3A%2F%2Fevil.example%2Fimage.png&w=128&q=75",
    );
    expect(rejected.status()).toBe(400);
  });
});
