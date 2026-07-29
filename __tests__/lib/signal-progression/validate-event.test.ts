import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import { validateSignalEventPayload } from "@/lib/signal-progression/validate-event";

describe("validateSignalEventPayload", () => {
  const userId = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid tool_saved event", () => {
    const result = validateSignalEventPayload(
      { eventType: "tool_saved", context: { slug: "blink" } },
      userId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.dedupeKey).toBe(`save:${userId}:blink`);
      expect(result.value.rule.spDelta).toBe(5);
    }
  });

  it("rejects unknown context keys and client reward amounts", () => {
    expect(
      validateSignalEventPayload(
        { eventType: "tool_saved", context: { slug: "blink", hack: "1" } },
        userId,
      ).ok,
    ).toBe(false);
    expect(
      validateSignalEventPayload(
        { eventType: "tool_saved", context: { slug: "blink" }, xpDelta: 99 },
        userId,
      ).ok,
    ).toBe(false);
  });

  it("rejects tool_unsaved reward farming payloads with points", () => {
    const result = validateSignalEventPayload(
      { eventType: "tool_unsaved", context: { slug: "blink" }, points: 10 },
      userId,
    );
    expect(result.ok).toBe(false);
  });
});
