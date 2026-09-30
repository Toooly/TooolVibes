import { describe, expect, it } from "vitest";

import { normalizeUserProfile, profileDisplayName } from "@/lib/auth/profile-normalization";

describe("profile normalization", () => {
  it("prefers full_name, then given/family, then username fallbacks", () => {
    expect(
      normalizeUserProfile({
        email: "mario@example.com",
        user_metadata: { full_name: "Mario Rossi", avatar_url: "https://cdn.example/a.png" },
        identities: [{ provider: "google" }],
        app_metadata: {},
      } as never),
    ).toMatchObject({
      displayName: "Mario Rossi",
      firstName: "Mario",
      lastName: "Rossi",
      avatarUrl: "https://cdn.example/a.png",
      email: "mario@example.com",
      provider: "google",
    });

    expect(
      normalizeUserProfile({
        email: "anna@example.com",
        user_metadata: { given_name: "Anna", family_name: "Bianchi", picture: "https://cdn.example/b.png" },
        identities: [],
        app_metadata: {},
      } as never).displayName,
    ).toBe("Anna Bianchi");
  });

  it("survives Apple private-relay metadata (email only)", () => {
    const profile = normalizeUserProfile({
      email: "abc@privaterelay.appleid.com",
      user_metadata: {},
      identities: [{ provider: "apple" }],
      app_metadata: {},
    } as never);
    expect(profile.email).toBe("abc@privaterelay.appleid.com");
    expect(profile.provider).toBe("apple");
    expect(profile.displayName).toBe("abc");
    expect(profile.avatarUrl).toBeNull();
  });

  it("maps azure identities to microsoft and tolerates missing GitHub email", () => {
    const profile = normalizeUserProfile({
      email: null,
      user_metadata: { user_name: "octocat", avatar_url: "https://cdn.example/o.png" },
      identities: [{ provider: "azure" }],
      app_metadata: {},
    } as never);
    expect(profile.provider).toBe("microsoft");
    expect(profile.displayName).toBe("octocat");
    expect(profileDisplayName(null)).toBe("account");
  });

  it("rejects non-http avatar schemes", () => {
    const profile = normalizeUserProfile({
      email: "x@example.com",
      user_metadata: { full_name: "X", avatar_url: "data:text/html,<script>alert(1)</script>" },
      identities: [],
      app_metadata: {},
    } as never);
    expect(profile.avatarUrl).toBeNull();
  });
});
