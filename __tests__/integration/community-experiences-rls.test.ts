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

const body80 =
  "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.";

describe.runIf(canRun)("H1 live community experiences role matrix", () => {
  let anonymous: SupabaseClient;
  let authenticated: SupabaseClient;
  let service: SupabaseClient;
  let authenticatedUserId = "";
  const createdExperienceIds: string[] = [];

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
    if (createdExperienceIds.length > 0) {
      await service
        .from("community_experiences")
        .delete()
        .in("id", createdExperienceIds);
    }
    await authenticated.auth.signOut();
  });

  it("AUTHZ-H1-07/10 denies client and anon direct insert", async () => {
    const payload = {
      tool_slug: "h1-rls-probe",
      author_id: authenticatedUserId,
      display_name: "Test User",
      use_case: "AI coding",
      body: body80,
      pros: ["Fast preview cycle"],
      limits: ["Weak collaboration"],
      duration_bucket: "months_1_3",
    };
    const anonInsert = await anonymous.from("community_experiences").insert(payload);
    const authInsert = await authenticated
      .from("community_experiences")
      .insert(payload);
    expect(anonInsert.error).toBeTruthy();
    expect(authInsert.error).toBeTruthy();
  });

  it("service role can insert pending and clients cannot read it", async () => {
    const { data, error } = await service
      .from("community_experiences")
      .insert({
        tool_slug: "h1-rls-probe",
        author_id: authenticatedUserId,
        display_name: "Test User",
        use_case: "AI coding",
        body: body80,
        pros: ["Fast preview cycle"],
        limits: ["Weak collaboration"],
        duration_bucket: "months_1_3",
        status: "pending",
      })
      .select("id, status, author_id")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    createdExperienceIds.push(data!.id);

    const anonRead = await anonymous
      .from("community_experiences")
      .select("id")
      .eq("id", data!.id);
    const authRead = await authenticated
      .from("community_experiences")
      .select("id, author_id")
      .eq("id", data!.id);

    expect(anonRead.data ?? []).toEqual([]);
    expect(authRead.data ?? []).toEqual([]);
  });

  it("AUTHZ-H1-08/09 denies client update and delete", async () => {
    const id = createdExperienceIds[0];
    if (!id) {
      return;
    }
    const update = await authenticated
      .from("community_experiences")
      .update({ status: "published" })
      .eq("id", id);
    const del = await authenticated
      .from("community_experiences")
      .delete()
      .eq("id", id);
    expect(update.error).toBeTruthy();
    expect(del.error).toBeTruthy();
  });

  it("AUTHZ-H1-11/12 denies client report select and insert", async () => {
    const id = createdExperienceIds[0];
    const select = await authenticated
      .from("community_experience_reports")
      .select("id");
    const insert = await authenticated.from("community_experience_reports").insert({
      experience_id: id,
      reporter_id: authenticatedUserId,
      reason: "spam",
    });
    expect((select.data ?? []).length).toBe(0);
    expect(insert.error).toBeTruthy();
  });
});
