import { describe, expect, it } from "vitest";

import { OAUTH_PROVIDERS, oauthRedirectTo } from "@/lib/auth/oauth-providers";

describe("oauth providers", () => {
  it("exposes Google, Apple and GitHub", () => {
    expect(OAUTH_PROVIDERS.map((item) => item.id)).toEqual(["google", "apple", "github"]);
  });

  it("builds a same-origin callback", () => {
    expect(oauthRedirectTo()).toBe("/auth/callback");
  });
});
