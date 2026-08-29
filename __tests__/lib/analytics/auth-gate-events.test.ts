import { afterEach, describe, expect, it, vi } from "vitest";

import { trackAuthGateFromIntent } from "@/lib/analytics/auth-gate-events";

describe("auth gate telemetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("emits only capability, origin, and return context", () => {
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    trackAuthGateFromIntent({
      name: "auth_gate_continue",
      capability: "stack.create",
      origin: "save-overflow",
      returnTo: "/toools/blink",
    });
    expect(log).toHaveBeenCalledTimes(1);
    const payload = log.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload).toEqual({
      name: "auth_gate_continue",
      capability: "stack.create",
      origin: "save-overflow",
      returnContext: "tool",
    });
    expect(JSON.stringify(payload)).not.toMatch(/email|jwt|note|workspace/i);
  });
});
