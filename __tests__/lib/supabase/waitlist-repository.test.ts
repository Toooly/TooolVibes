import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  getAdminEnv: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: supabase.createAdminClient,
}));
vi.mock("@/lib/supabase/env", () => ({
  getSupabaseAdminEnv: supabase.getAdminEnv,
}));

import {
  isWaitlistRegistrationEnabled,
  registerWaitlistEntry,
} from "@/lib/supabase/waitlist-repository";

describe("waitlist repository", () => {
  const originalFlag = process.env.TOOOLVIBES_WAITLIST_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TOOOLVIBES_WAITLIST_ENABLED;
    supabase.getAdminEnv.mockReturnValue({
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role",
    });
    supabase.createAdminClient.mockReturnValue({ rpc: supabase.rpc });
    supabase.rpc.mockResolvedValue({ data: true, error: null });
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.TOOOLVIBES_WAITLIST_ENABLED;
    } else {
      process.env.TOOOLVIBES_WAITLIST_ENABLED = originalFlag;
    }
  });

  it("requires both the kill switch and service-role persistence", () => {
    expect(isWaitlistRegistrationEnabled()).toBe(true);

    process.env.TOOOLVIBES_WAITLIST_ENABLED = "0";
    expect(isWaitlistRegistrationEnabled()).toBe(false);

    delete process.env.TOOOLVIBES_WAITLIST_ENABLED;
    supabase.getAdminEnv.mockReturnValue({
      url: "https://example.supabase.co",
      serviceRoleKey: undefined,
    });
    expect(isWaitlistRegistrationEnabled()).toBe(false);
  });

  it.each([
    [true, true],
    [false, false],
  ])("maps the RPC boolean %s to created=%s", async (rpcData, created) => {
    supabase.rpc.mockResolvedValue({ data: rpcData, error: null });

    await expect(
      registerWaitlistEntry({
        email: "person@example.com",
        source: "coming-soon",
        consentVersion: "waitlist-v1",
      }),
    ).resolves.toEqual({ created });

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(
      "register_waitlist_entry",
      {
        p_email: "person@example.com",
        p_source: "coming-soon",
        p_consent_version: "waitlist-v1",
      },
    );
  });

  it("fails closed on RPC errors and malformed responses", async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "XX000", message: "failure" },
    });

    await expect(
      registerWaitlistEntry({
        email: "person@example.com",
        source: "coming-soon",
        consentVersion: "waitlist-v1",
      }),
    ).rejects.toThrow("WAITLIST_PERSISTENCE_ERROR");

    supabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      registerWaitlistEntry({
        email: "person@example.com",
        source: "coming-soon",
        consentVersion: "waitlist-v1",
      }),
    ).rejects.toThrow("WAITLIST_INVALID_RPC_RESPONSE");
  });
});
