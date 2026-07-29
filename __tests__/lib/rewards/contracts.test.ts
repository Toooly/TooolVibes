import { describe, expect, it } from "vitest";

import {
  isEnvelopeExpired,
  isHostPresentableTier,
  parseRewardEnvelope,
} from "@/lib/rewards/contracts";
import { makeAchievementEnvelope, makeMicroEnvelope } from "@/lib/rewards/test-fixtures";

describe("reward envelope contract", () => {
  it("accepts a valid micro envelope", () => {
    const result = parseRewardEnvelope(makeMicroEnvelope());
    expect(result.ok).toBe(true);
  });

  it("rejects malformed envelopes", () => {
    expect(parseRewardEnvelope({}).ok).toBe(false);
    expect(parseRewardEnvelope({ grantId: "x", tier: "micro" }).ok).toBe(false);
    expect(
      parseRewardEnvelope(
        makeMicroEnvelope({ grantId: "short" as unknown as string }),
      ).ok,
    ).toBe(false);
  });

  it("rejects client-like xp payloads without full envelope", () => {
    expect(parseRewardEnvelope({ xpDelta: 50, level: 2 }).ok).toBe(false);
  });

  it("classifies host tiers and expiry", () => {
    expect(isHostPresentableTier("micro")).toBe(true);
    expect(isHostPresentableTier("milestone")).toBe(false);
    const expired = makeAchievementEnvelope({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(isEnvelopeExpired(expired)).toBe(true);
  });
});
