import { describe, expect, it } from "vitest";

import {
  OAUTH_PROVIDERS,
  normalizeIdentityProvider,
  normalizeOAuthProviderId,
  oauthRedirectTo,
  parseEnabledOAuthProviders,
  readOAuthProviderList,
  resolveSafeNextPath,
  toSupabaseProvider,
} from "@/lib/auth/oauth-providers";

describe("oauth providers", () => {
  it("exposes Google, Apple, Microsoft and GitHub", () => {
    expect(OAUTH_PROVIDERS.map((item) => item.id)).toEqual([
      "google",
      "apple",
      "microsoft",
      "github",
    ]);
  });

  it("maps Microsoft to the Supabase azure provider", () => {
    expect(toSupabaseProvider("microsoft")).toBe("azure");
    expect(toSupabaseProvider("google")).toBe("google");
    expect(normalizeOAuthProviderId("azure")).toBe("microsoft");
    expect(normalizeIdentityProvider("azure")).toBe("microsoft");
    expect(normalizeOAuthProviderId("not-a-provider")).toBeNull();
  });

  it("builds a same-origin callback and preserves a safe next", () => {
    expect(oauthRedirectTo()).toBe("/auth/callback");
    expect(oauthRedirectTo("/compare")).toBe("/auth/callback?next=%2Fcompare");
    expect(oauthRedirectTo("https://evil.example/phish")).toBe("/auth/callback");
  });

  it("resolves safe post-auth destinations only", () => {
    expect(resolveSafeNextPath("/compare", "/account")).toBe("/compare");
    expect(resolveSafeNextPath("https://evil.example", "/account")).toBe("/account");
    expect(resolveSafeNextPath("//evil.example", "/account")).toBe("/account");
  });

  it("enables only providers turned on in GoTrue settings (azure = microsoft)", () => {
    expect(
      parseEnabledOAuthProviders({
        google: false,
        apple: false,
        azure: true,
        github: false,
        email: true,
      }),
    ).toEqual(["microsoft"]);
    expect(
      parseEnabledOAuthProviders({
        google: true,
        apple: true,
        azure: false,
        github: true,
      }),
    ).toEqual(["google", "apple", "github"]);
    expect(parseEnabledOAuthProviders(null)).toEqual([]);
  });

  it("does not invent providers when the config list is empty or unknown", () => {
    expect(readOAuthProviderList(undefined)).toEqual([]);
    expect(readOAuthProviderList([])).toEqual([]);
    expect(readOAuthProviderList(["not-a-provider"])).toEqual([]);
    expect(readOAuthProviderList(["github", "google", "nope"])).toEqual([
      "google",
      "github",
    ]);
    expect(readOAuthProviderList(["azure"])).toEqual(["microsoft"]);
  });
});
