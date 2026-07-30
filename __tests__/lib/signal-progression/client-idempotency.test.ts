// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSignalClientIdempotencyForTests,
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
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
    vi.unstubAllGlobals();
    __resetSignalClientIdempotencyForTests();
  });

  it("does not resend the same save key", async () => {
    emitToolSaved("notion", true);
    emitToolSaved("notion", true);
    await new Promise((r) => setTimeout(r, 20));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("skips when API disabled (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "disabled" }), { status: 404 })),
    );
    __resetSignalClientIdempotencyForTests();
    emitToolUnsaved("notion");
    await new Promise((r) => setTimeout(r, 20));
    expect(fetch).toHaveBeenCalled();
  });
});
