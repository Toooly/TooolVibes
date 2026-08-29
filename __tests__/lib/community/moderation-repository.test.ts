import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  updateResult: null as Record<string, unknown> | null,
  updateCalls: [] as Array<Record<string, unknown>>,
  selectEq: [] as Array<[string, string]>,
  range: { from: 0, to: 0 },
  listRows: [] as Array<Record<string, unknown>>,
  count: 0,
  error: null as { code?: string } | null,
}));

function chain(result: { data: unknown; error: unknown; count?: number }) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn((key: string, value: string) => {
    db.selectEq.push([key, value]);
    return query;
  });
  query.order = vi.fn(() => query);
  query.range = vi.fn((from: number, to: number) => {
    db.range = { from, to };
    return query;
  });
  query.update = vi.fn((patch: Record<string, unknown>) => {
    db.updateCalls.push(patch);
    return query;
  });
  query.maybeSingle = vi.fn(async () => result);
  query.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return query;
}

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: () => ({
    from: () => {
      if (db.updateCalls.length >= 0 && db.updateResult !== undefined) {
        // first maybeSingle is the load; subsequent update path uses same from()
      }
      const load = chain({
        data: db.row,
        error: db.error,
        count: db.count,
      });
      load.update = vi.fn((patch: Record<string, unknown>) => {
        db.updateCalls.push(patch);
        const updated = chain({
          data: db.updateResult,
          error: db.error,
        });
        return updated;
      });
      load.range = vi.fn((from: number, to: number) => {
        db.range = { from, to };
        return Promise.resolve({
          data: db.listRows,
          error: db.error,
          count: db.count,
        });
      });
      return load;
    },
  }),
}));

import {
  listExperiencesForModeration,
  moderateExperience,
} from "@/lib/community/repository";
import { ADMIN_COLUMNS } from "@/lib/community/schema";
import { COMMUNITY_MODERATOR_ACTOR } from "@/lib/community/moderation";

const pendingRow = {
  id: "11111111-1111-4111-8111-111111111111",
  tool_slug: "blink",
  display_name: "Gianmaria",
  use_case: "AI coding",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  duration_bucket: "months_1_3",
  switched_from_slug: null,
  switched_from_label: null,
  published_at: null,
  updated_at: "2026-08-30T10:00:00.000Z",
  status: "pending",
  created_at: "2026-08-30T09:00:00.000Z",
  submitted_at: "2026-08-30T09:00:00.000Z",
  moderated_at: null,
  moderation_reason: null,
  moderated_by: null,
};

describe("moderation repository", () => {
  beforeEach(() => {
    db.row = { ...pendingRow };
    db.updateResult = {
      ...pendingRow,
      status: "published",
      published_at: "2026-08-30T12:00:00.000Z",
      moderated_at: "2026-08-30T12:00:00.000Z",
      moderated_by: COMMUNITY_MODERATOR_ACTOR,
    };
    db.updateCalls = [];
    db.selectEq = [];
    db.listRows = [];
    db.count = 0;
    db.error = null;
  });

  it("H3-CONCUR stale expectedUpdatedAt does not update", async () => {
    const result = await moderateExperience({
      id: pendingRow.id,
      action: "publish",
      expectedUpdatedAt: "2026-08-29T00:00:00.000Z",
      reason: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("conflict");
    expect(db.updateCalls).toHaveLength(0);
  });

  it("H3-PUBLISH applies server actor and ignores client moderatedBy", async () => {
    const result = await moderateExperience({
      id: pendingRow.id,
      action: "publish",
      expectedUpdatedAt: pendingRow.updated_at,
      reason: "client-reason-ignored",
      nowIso: "2026-08-30T12:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(db.updateCalls[0]?.moderated_by).toBe(COMMUNITY_MODERATOR_ACTOR);
    expect(db.updateCalls[0]?.moderation_reason).toBeNull();
    expect(ADMIN_COLUMNS.includes("author_id")).toBe(false);
    expect(ADMIN_COLUMNS.includes("moderated_by")).toBe(true);
  });

  it("H3-LIST pending uses oldest-first page size 20", async () => {
    db.listRows = [pendingRow];
    db.count = 1;
    const result = await listExperiencesForModeration({ status: "pending", page: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageSize).toBe(20);
      expect(db.range).toEqual({ from: 0, to: 19 });
      expect(result.page[0]?.displayName).toBe("Gianmaria");
      expect(JSON.stringify(result.page[0])).not.toContain("author_id");
      expect(JSON.stringify(result.page[0])).not.toContain("@");
    }
  });
});
