import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionOk: true,
  adminEnabled: true,
  moderate: {
    ok: true as boolean,
    kind: "applied" as "applied" | "noop",
    reason: "conflict" as string,
    visibilityChanged: true,
    experience: { toolSlug: "blink" },
  },
  redirects: [] as string[],
  revalidates: [] as string[],
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: async () => {
    if (!mocks.sessionOk) {
      const { redirect } = await import("next/navigation");
      redirect("/admin-login");
    }
  },
}));

vi.mock("@/lib/supabase/admin-client", () => ({
  isSupabaseAdminEnabled: () => mocks.adminEnabled,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    mocks.revalidates.push(path);
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mocks.redirects.push(path);
    const error = new Error(`REDIRECT:${path}`);
    (error as Error & { digest: string }).digest = `NEXT_REDIRECT;${path}`;
    throw error;
  },
}));

vi.mock("@/lib/community/repository", () => ({
  moderateExperience: async () => mocks.moderate,
}));

import { moderateExperienceAction } from "@/app/(admin)/admin/actions/experiences";

const id = "11111111-1111-4111-8111-111111111111";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function run(values: Record<string, string>) {
  try {
    await moderateExperienceAction(form(values));
  } catch {
    // redirect
  }
}

describe("H3 admin moderation actions", () => {
  beforeEach(() => {
    mocks.sessionOk = true;
    mocks.adminEnabled = true;
    mocks.moderate = {
      ok: true,
      kind: "applied",
      reason: "conflict",
      visibilityChanged: true,
      experience: { toolSlug: "blink" },
    };
    mocks.redirects = [];
    mocks.revalidates = [];
  });

  it("H3-AUTH-01 denies unauthenticated action", async () => {
    mocks.sessionOk = false;
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
    });
    expect(mocks.redirects.join(" ")).toContain("/admin-login");
    expect(mocks.revalidates).toEqual([]);
  });

  it("H3-AUTH-05 ignores client moderatedBy", async () => {
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
      moderatedBy: "attacker@example.com",
      reason: "should-not-publish-reason",
    });
    expect(mocks.redirects[0]).toContain("notice=published");
    expect(mocks.revalidates).toEqual(["/admin/experiences", "/toools/blink"]);
  });

  it("H3-PUBLISH-08 revalidates tool path after publish", async () => {
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
    });
    expect(mocks.revalidates).toContain("/toools/blink");
  });

  it("H3-REJECT-07 does not revalidate public tool on reject", async () => {
    mocks.moderate.visibilityChanged = false;
    await run({
      id,
      action: "reject",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
      reason: "Spam evidente nel testo.",
    });
    expect(mocks.revalidates).toEqual(["/admin/experiences"]);
    expect(mocks.redirects[0]).toContain("notice=rejected");
  });

  it("H3-CONCUR-04 redirects conflict without revalidate", async () => {
    mocks.moderate.ok = false;
    mocks.moderate.reason = "conflict";
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
    });
    expect(mocks.redirects[0]).toContain("notice=conflict");
    expect(mocks.revalidates).toEqual([]);
  });

  it("does not revalidate on noop double publish", async () => {
    mocks.moderate.kind = "noop";
    mocks.moderate.visibilityChanged = false;
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
    });
    expect(mocks.redirects[0]).toContain("notice=noop");
    expect(mocks.revalidates).toEqual([]);
  });

  it("rejects unsafe tool slug revalidation", async () => {
    mocks.moderate.experience = { toolSlug: "//evil.example" };
    await run({
      id,
      action: "publish",
      expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
    });
    expect(mocks.revalidates).toEqual(["/admin/experiences"]);
  });
});
