import { describe, expect, it } from "vitest";

import {
  getPremiumEntitlementMeta,
  resolveCollectionPremiumAccess,
} from "@/lib/premium/access";

describe("collections V1 access", () => {
  it("keeps legacy premium values fully readable for every visitor", () => {
    const access = resolveCollectionPremiumAccess("premium", {
      entitlement: "guest",
      surface: "special-issue",
    });

    expect(access).toMatchObject({
      tier: "free",
      state: "open",
      is_premium: false,
      is_previewable: false,
      is_locked: false,
      has_full_access: true,
      entry_label: "Apri raccolta",
      upgrade_href: "#collection-content",
    });
    expect(access.preview_tool_limit).toBeGreaterThan(100);
    expect(access.preview_highlight_limit).toBeGreaterThan(100);
  });

  it("does not advertise a membership gate in account metadata", () => {
    for (const status of ["guest", "account", "member"] as const) {
      const meta = getPremiumEntitlementMeta(status);

      expect(meta.tier).toBe("free");
      expect(meta.cta_href).toBe("/collections");
      expect(`${meta.label} ${meta.description} ${meta.badge}`).not.toMatch(
        /premium|riservat|sblocca|anteprima/i,
      );
    }
  });
});
