import { beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  rpc: vi.fn(),
  single: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: supabase.createAdminClient,
}));

import { createAffiliateRequestInSupabase } from "@/lib/supabase/affiliate-request-repository";
import { createToolRequestInSupabase } from "@/lib/supabase/suggestion-repository";

describe("controlled public submission repositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.createAdminClient.mockReturnValue({ rpc: supabase.rpc });
    supabase.rpc.mockReturnValue({ single: supabase.single });
    supabase.single.mockResolvedValue({
      data: { id: "created-id" },
      error: null,
    });
  });

  it("uses the service-only tool submission RPC", async () => {
    await createToolRequestInSupabase({
      submitter_type: "founder",
      tool_name: "Tool",
      tool_url: "https://example.com",
      category: "Automation",
      level: "beginner",
      email: "founder@example.com",
      requested_services: ["Launch"],
    });

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(
      "submit_tool_request",
      expect.objectContaining({
        p_submitter_type: "founder",
        p_tool_name: "Tool",
        p_email: "founder@example.com",
        p_requested_services: ["Launch"],
      }),
    );
  });

  it("uses the service-only affiliate submission RPC", async () => {
    await createAffiliateRequestInSupabase({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      message: "Una candidatura sufficientemente completa.",
    });

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(
      "submit_affiliate_request",
      expect.objectContaining({
        p_first_name: "Ada",
        p_last_name: "Lovelace",
        p_email: "ada@example.com",
      }),
    );
  });
});
