import { describe, expect, it, vi } from "vitest";

import { linkSocialIdentity, signInWithSocialProvider } from "@/lib/auth/social-auth";

function clientWith(result: { error?: { message?: string; code?: string } | null }) {
  const client = {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: result.error ?? null }),
      linkIdentity: vi.fn().mockResolvedValue({ error: result.error ?? null }),
    },
  };
  return client as unknown as Parameters<typeof signInWithSocialProvider>[0] & typeof client;
}

describe("social auth service", () => {
  it("calls Supabase with the exact SDK provider and safe next redirect", async () => {
    const client = clientWith({});
    const result = await signInWithSocialProvider(client, "microsoft", { next: "/compare" });
    expect(result.ok).toBe(true);
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "azure",
      options: expect.objectContaining({
        redirectTo: "/auth/callback?next=%2Fcompare",
        skipBrowserRedirect: false,
      }),
    });
  });

  it("drops unsafe next destinations instead of open-redirecting", async () => {
    const client = clientWith({});
    await signInWithSocialProvider(client, "google", { next: "https://evil.example/x" });
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: expect.objectContaining({ redirectTo: "/auth/callback" }),
    });
  });

  it("maps provider failures to Italian copy without raw errors", async () => {
    const client = clientWith({ error: { message: "access_denied" } });
    const result = await signInWithSocialProvider(client, "google");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/interrotto|non completato|non \u00e8 stato/i);
    expect(result.message).not.toMatch(/access_denied/);
  });

  it("rejects unknown providers without calling Supabase", async () => {
    const client = clientWith({});
    const result = await signInWithSocialProvider(client, "facebook-evil");
    expect(result.ok).toBe(false);
    expect(client.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("links identities through the same canonical redirect model", async () => {
    const client = clientWith({});
    const result = await linkSocialIdentity(client, "github", { next: "/account/settings" });
    expect(result.ok).toBe(true);
    expect(client.auth.linkIdentity).toHaveBeenCalledWith({
      provider: "github",
      options: expect.objectContaining({
        redirectTo: "/auth/callback?next=%2Faccount%2Fsettings",
      }),
    });
  });
});
