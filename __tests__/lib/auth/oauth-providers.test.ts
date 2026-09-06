import { describe, expect, it } from "vitest";

import {
  OAUTH_PROVIDERS,
  oauthRedirectTo,
  parseEnabledOAuthProviders,
} from "@/lib/auth/oauth-providers";

describe("oauth providers", () => {
  it("exposes Google, Apple and GitHub", () => {
    expect(OAUTH_PROVIDERS.map((item) => item.id)).toEqual([
      "google",
      "apple",
      "github",
    ]);
  });

  it("builds a same-origin callback", () => {
    expect(oauthRedirectTo()).toBe("/auth/callback");
  });

  it("enables only providers turned on in GoTrue settings", () => {
    expect(
      parseEnabledOAuthProviders({
        google: true,
        apple: false,
        github: false,
        email: true,
      }),
    ).toEqual(["google"]);
    expect(parseEnabledOAuthProviders(null)).toEqual([]);
  });
});
