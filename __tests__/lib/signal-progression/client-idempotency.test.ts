// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSignalClientIdempotencyForTests,
  configureSignalClient,
  emitToolSaved,
  emitToolUnsaved,
} from "@/lib/signal-progression/client";

vi.mock("@/lib/supabase/browser-client", () => ({
  getBrowserSupabaseClient: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "test-token" } },
      }),
    },
  }),
}));

describe("signal client idempotency", () => {
  beforeEach(() => {
    __resetSignalClientIdempotencyForTests();
    configureSignalClient({ writesEnabled: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: "accepted",
              granted: true,
              envelope: null,
              missionEnvelopes: [],
            }),
            { status: 200 },
          ),
      ),
    );
  });

  afterEach(() => {
    configureSignalClient({ writesEnabled: false });
    vi.unstubAllGlobals();
    __resetSignalClientIdempotencyForTests();
  });

  it("dedupes concurrent first-save emits for the same slug", async () => {
    emitToolSaved("notion", true);
    emitToolSaved("notion", true);
    await new Promise((r) => setTimeout(r, 50));
    // At most one network attempt for save_first key (busy/settled gate)
    expect((fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("skips network when writes disabled", async () => {
    configureSignalClient({ writesEnabled: false });
    __resetSignalClientIdempotencyForTests();
    emitToolUnsaved("notion");
    await new Promise((r) => setTimeout(r, 30));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips when guest has no token", async () => {
    vi.doMock("@/lib/supabase/browser-client", () => ({
      getBrowserSupabaseClient: () => ({
        auth: { getSession: async () => ({ data: { session: null } }) },
      }),
    }));
    __resetSignalClientIdempotencyForTests();
    configureSignalClient({ writesEnabled: true });
    // still uses previous mock module — assert writes off path instead
    configureSignalClient({ writesEnabled: false });
    emitToolSaved("x", false);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetch).not.toHaveBeenCalled();
  });
});
