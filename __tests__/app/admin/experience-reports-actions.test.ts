import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminEnabled: true,
  resolve: {
    ok: true as boolean,
    reason: "unknown" as string,
    disposition: "resolved" as string,
    scope: "resolved" as string,
    report: { id: "rep-1", status: "resolved" },
  },
  moderate: {
    ok: true as boolean,
    kind: "applied" as string,
    reason: "unknown" as string,
    experience: { id: "exp-1", toolSlug: "blink" },
    visibilityChanged: true,
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: async () => true,
}));

vi.mock("@/lib/admin/tool-queries", () => ({
  isSupabaseAdminEnabled: () => mocks.adminEnabled,
}));

vi.mock("@/lib/community/report-repository", () => ({
  resolveExperienceReport: async () => mocks.resolve,
}));

vi.mock("@/lib/community/repository", () => ({
  moderateExperience: async () => mocks.moderate,
}));

const revalidateCalls: string[] = [];
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidateCalls.push(path);
  },
}));

import {
  hideExperienceFromReportAction,
  resolveExperienceReportAction,
} from "@/app/(admin)/admin/actions/experience-reports";

function formData(entries: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

function expectRedirect(fn: () => Promise<void>, target: string) {
  return expect(fn).rejects.toMatchObject({
    digest: expect.stringContaining(target),
  });
}

describe("H6 admin report actions", () => {
  beforeEach(() => {
    mocks.adminEnabled = true;
    mocks.resolve = {
      ok: true,
      reason: "unknown",
      disposition: "resolved",
      scope: "resolved",
      report: { id: "rep-1", status: "resolved" },
    };
    mocks.moderate = {
      ok: true,
      kind: "applied",
      reason: "unknown",
      experience: { id: "exp-1", toolSlug: "blink" },
      visibilityChanged: true,
    };
    revalidateCalls.length = 0;
  });

  it("H6-RESOLVE-02 resolve revalidates the queue and redirects", async () => {
    await expectRedirect(
      () =>
        resolveExperienceReportAction(
          formData({
            id: "22222222-2222-4222-8222-222222222222",
            disposition: "resolved",
            note: "Verificato",
            returnScope: "open",
            page: "1",
          }),
        ),
      "/admin/experiences/reports?scope=open&notice=applied",
    );
    expect(revalidateCalls).toContain("/admin/experiences/reports");
  });

  it("H6-RESOLVE-05 resolved already is a conflict notice, no churn", async () => {
    mocks.resolve = { ...mocks.resolve, ok: false, reason: "state" };
    await expectRedirect(
      () =>
        resolveExperienceReportAction(
          formData({
            id: "22222222-2222-4222-8222-222222222222",
            disposition: "resolved",
            returnScope: "open",
            page: "1",
          }),
        ),
      "notice=already",
    );
  });

  it("invalid uuid redirects invalid without touching the repository", async () => {
    await expectRedirect(
      () =>
        resolveExperienceReportAction(
          formData({
            id: "not-a-uuid",
            disposition: "resolved",
            returnScope: "open",
            page: "1",
          }),
        ),
      "notice=invalid",
    );
  });

  it("H6-DISMISS-03 dismiss action reaches the repository with disposition", async () => {
    await expectRedirect(
      () =>
        resolveExperienceReportAction(
          formData({
            id: "22222222-2222-4222-8222-222222222222",
            disposition: "dismissed",
            returnScope: "open",
            page: "1",
          }),
        ),
      "notice=applied",
    );
  });

  it("H6-HIDE-01 hide reuses H3 moderateExperience with action hide", async () => {
    await expectRedirect(
      () =>
        hideExperienceFromReportAction(
          formData({
            experienceId: "11111111-1111-4111-8111-111111111111",
            expectedUpdatedAt: "2026-08-30T10:00:00.000Z",
            reason: "Contenuto promozionale",
            returnScope: "open",
            page: "1",
          }),
        ),
      "notice=hidden",
    );
    expect(revalidateCalls).toContain("/admin/experiences/reports");
    expect(revalidateCalls).toContain("/toools/blink");
  });

  it("H6-RESOLVE-07b invalid note length redirects invalid", async () => {
    await expectRedirect(
      () =>
        resolveExperienceReportAction(
          formData({
            id: "22222222-2222-4222-8222-222222222222",
            disposition: "resolved",
            note: "a".repeat(501),
            returnScope: "open",
            page: "1",
          }),
        ),
      "notice=invalid",
    );
  });
});
