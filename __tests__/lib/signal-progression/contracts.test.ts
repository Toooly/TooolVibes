import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

// Import via dynamic path that doesn't pull server-only into bad graphs:
// validate uses server-only — test pure pieces from contracts without server-only
import {
  FORBIDDEN_CLIENT_REWARD_FIELDS,
  assertNoClientRewardFields,
  signalEventIngestSchema,
} from "@/lib/signal-progression/contracts";

describe("signal event contracts", () => {
  it("rejects forbidden client reward fields", () => {
    expect(assertNoClientRewardFields({ xpDelta: 10 })).toBe("forbidden_field:xpDelta");
    expect(assertNoClientRewardFields({ spDelta: 5 })).toBe("forbidden_field:spDelta");
    expect(assertNoClientRewardFields({ userId: "x" })).toBe("forbidden_field:userId");
    expect(assertNoClientRewardFields({ eventType: "tool_saved" })).toBeNull();
  });

  it("accepts minimal valid ingest shape", () => {
    const parsed = signalEventIngestSchema.safeParse({
      eventType: "tool_saved",
      context: { slug: "blink" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown event types and unknown fields", () => {
    expect(
      signalEventIngestSchema.safeParse({
        eventType: "not_real",
        context: {},
      }).success,
    ).toBe(false);
    expect(
      signalEventIngestSchema.safeParse({
        eventType: "tool_saved",
        context: { slug: "blink" },
        spDelta: 9,
      }).success,
    ).toBe(false);
  });

  it("lists all forbidden fields for audit", () => {
    expect(FORBIDDEN_CLIENT_REWARD_FIELDS).toContain("xpDelta");
    expect(FORBIDDEN_CLIENT_REWARD_FIELDS).toContain("newBalance");
  });
});
