import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.env.TOOOLVIBES_TEST_USER_EMAIL;
const testPassword = process.env.TOOOLVIBES_TEST_USER_PASSWORD;
const canRun =
  process.env.TOOOLVIBES_RUN_SUPABASE_SECURITY_TESTS === "1" &&
  Boolean(url && anonKey && serviceRoleKey && testEmail && testPassword);

describe.runIf(canRun)("SEC-105 live Supabase role matrix", () => {
  let anonymous: SupabaseClient;
  let authenticated: SupabaseClient;
  let service: SupabaseClient;
  let authenticatedUserId = "";
  const createdToolIds: string[] = [];
  const createdAffiliateIds: string[] = [];

  beforeAll(async () => {
    anonymous = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    authenticated = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    service = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authenticated.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });
    if (error || !data.user) {
      throw error ?? new Error("Missing security-test user");
    }
    authenticatedUserId = data.user.id;
  });

  afterAll(async () => {
    if (createdToolIds.length > 0) {
      await service.from("tool_requests").delete().in("id", createdToolIds);
    }
    if (createdAffiliateIds.length > 0) {
      await service
        .from("affiliate_requests")
        .delete()
        .in("id", createdAffiliateIds);
    }
    await authenticated.auth.signOut();
  });

  it.each([
    ["anon", () => anonymous],
    ["authenticated", () => authenticated],
    ["service direct", () => service],
  ])("blocks %s direct tool-request insert", async (_role, client) => {
    const { error } = await client().from("tool_requests").insert({
      tool_name: "SEC-105 direct insert",
      tool_url: "https://security-test.invalid/tool",
      category: "Security",
      level: "beginner",
    });
    expect(error).toBeTruthy();
  });

  it.each([
    ["anon", () => anonymous],
    ["authenticated", () => authenticated],
    ["service direct", () => service],
  ])("blocks %s direct affiliate-request insert", async (_role, client) => {
    const { error } = await client().from("affiliate_requests").insert({
      first_name: "Security",
      last_name: "Test",
      email: "security-direct@fixture.invalid",
      message: "SEC-105 direct insert must be denied.",
    });
    expect(error).toBeTruthy();
  });

  it.each([
    ["anon", () => anonymous],
    ["authenticated", () => authenticated],
  ])("blocks %s controlled submission RPC execution", async (_role, client) => {
    const { error } = await client().rpc("submit_tool_request", {
      p_submitter_type: "community",
      p_tool_name: "SEC-105 forbidden RPC",
      p_tool_url: "https://security-test.invalid/forbidden",
      p_category: "Security",
      p_level: "beginner",
      p_email: null,
      p_message: null,
      p_use_case: null,
      p_referral_url: null,
      p_media_url: null,
      p_personal_notes: null,
      p_founder_name: null,
      p_company_role: null,
      p_launch_stage: null,
      p_budget_range: null,
      p_requested_services: [],
    });
    expect(error).toBeTruthy();
  });

  it("allows service-role execution of validated submission RPCs", async () => {
    const nonce = crypto.randomUUID();
    const tool = await service
      .rpc("submit_tool_request", {
        p_submitter_type: "community",
        p_tool_name: `SEC-105 ${nonce}`,
        p_tool_url: `https://security-test.invalid/${nonce}`,
        p_category: "Security",
        p_level: "beginner",
        p_email: `tool-${nonce}@fixture.invalid`,
        p_message: "Security role matrix fixture.",
        p_use_case: null,
        p_referral_url: null,
        p_media_url: null,
        p_personal_notes: null,
        p_founder_name: null,
        p_company_role: null,
        p_launch_stage: null,
        p_budget_range: null,
        p_requested_services: [],
      })
      .single();
    expect(tool.error).toBeNull();
    createdToolIds.push((tool.data as { id: string }).id);

    const affiliate = await service
      .rpc("submit_affiliate_request", {
        p_first_name: "Security",
        p_last_name: "Test",
        p_email: `affiliate-${nonce}@fixture.invalid`,
        p_brand_name: null,
        p_website_url: `https://security-test.invalid/${nonce}`,
        p_audience: null,
        p_channels: null,
        p_message: "Security role matrix fixture.",
      })
      .single();
    expect(affiliate.error).toBeNull();
    createdAffiliateIds.push((affiliate.data as { id: string }).id);
  });

  it("binds profile and claim mutations to auth.uid()", async () => {
    const profile = await authenticated.rpc("get_or_create_game_profile");
    expect(profile.error).toBeNull();

    const directUpdate = await authenticated
      .from("game_profiles")
      .update({ xp: 999_999 })
      .eq("user_id", authenticatedUserId);
    expect(directUpdate.error).toBeTruthy();

    const forgedUserId = crypto.randomUUID();
    const mission = await authenticated.rpc("claim_mission", {
      p_mission_id: crypto.randomUUID(),
      p_user_id: forgedUserId,
    });
    expect(mission.error).toBeTruthy();

    const hiddenSignal = await authenticated.rpc("claim_hidden_signal", {
      p_user_id: forgedUserId,
      p_context_date: "2026-07-16",
      p_tool_slug: "fixture",
      p_expected_slug: "fixture",
    });
    expect(hiddenSignal.error).toBeTruthy();
  });
});
