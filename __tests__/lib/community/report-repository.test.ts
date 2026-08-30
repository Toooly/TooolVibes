import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  target: null as Record<string, unknown> | null,
  insertResult: null as Record<string, unknown> | null,
  insertError: null as { code?: string } | null,
  listRows: [] as Array<Record<string, unknown>>,
  experiences: [] as Array<Record<string, unknown>>,
  count: 0,
  current: null as Record<string, unknown> | null,
  updateResult: null as Record<string, unknown> | null,
  updateCalls: [] as Array<Record<string, unknown>>,
  eqCalls: [] as Array<[string, unknown]>,
  range: { from: 0, to: 0 },
}));

function chain(result: { data: unknown; error: unknown; count?: number }) {
  const query: Record<string, unknown> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn((key: string, value: unknown) => {
    db.eqCalls.push([key, value]);
    return query;
  });
  query.order = vi.fn(() => query);
  query.range = vi.fn((from: number, to: number) => {
    db.range = { from, to };
    return Promise.resolve({ data: db.listRows, error: null, count: db.count });
  });
  query.maybeSingle = vi.fn(async () => result);
  query.insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => ({
        data: db.insertResult,
        error: db.insertError,
      })),
    })),
  }));
  query.update = vi.fn((patch: Record<string, unknown>) => {
    db.updateCalls.push(patch);
    return chain({ data: db.updateResult, error: null });
  });
  return query;
}

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "community_experiences") {
        if (db.experiences.length) {
          const experienceQuery = chain({
            data: db.experiences[0],
            error: null,
          });
          const inFn = vi.fn(() => Promise.resolve({ data: db.experiences, error: null }));
          experienceQuery.in = inFn;
          return experienceQuery;
        }
        return chain({ data: db.target, error: null });
      }
      return chain({ data: db.current, error: null });
    },
  }),
}));

import {
  createExperienceReport,
  resolveExperienceReport,
} from "@/lib/community/report-repository";

const EXPERIENCE_ID = "11111111-1111-4111-8111-111111111111";

describe("H6 report repository", () => {
  beforeEach(() => {
    db.target = null;
    db.insertResult = { id: "rep-1", status: "open" };
    db.insertError = null;
    db.listRows = [];
    db.experiences = [];
    db.count = 0;
    db.current = null;
    db.updateResult = { id: "rep-1", status: "resolved" };
    db.updateCalls = [];
    db.eqCalls = [];
    db.range = { from: 0, to: 0 };
  });

  it("H6-REPORT-08b refuses self report at repository level", async () => {
    db.target = { id: EXPERIENCE_ID, author_id: "user-1", status: "published" };
    const result = await createExperienceReport({
      reporterId: "user-1",
      experienceId: EXPERIENCE_ID,
      reason: "spam",
      details: null,
    });
    expect(result).toEqual({ ok: false, reason: "own" });
  });

  it("H6-REPORT-04b pending target is not reportable", async () => {
    db.target = { id: EXPERIENCE_ID, author_id: "user-2", status: "pending" };
    const result = await createExperienceReport({
      reporterId: "user-1",
      experienceId: EXPERIENCE_ID,
      reason: "spam",
      details: null,
    });
    expect(result).toEqual({ ok: false, reason: "not_published" });
  });

  it("inserts with reporter from JWT only and maps unique violation", async () => {
    db.target = { id: EXPERIENCE_ID, author_id: "user-2", status: "published" };
    db.insertError = { code: "23505" };
    const result = await createExperienceReport({
      reporterId: "user-1",
      experienceId: EXPERIENCE_ID,
      reason: "spam",
      details: "x",
    });
    expect(result).toEqual({ ok: false, reason: "duplicate" });
  });

  it("H6-RESOLVE-01 resolves an open report with server-derived actor", async () => {
    db.current = { id: "rep-1", status: "open" };
    const result = await resolveExperienceReport({
      id: "rep-1",
      disposition: "resolved",
      note: "Verificato",
    });
    expect(result.ok).toBe(true);
    const patch = db.updateCalls[0];
    expect(patch.status).toBe("resolved");
    expect(patch.resolved_by).toBe("founder-admin");
    expect(patch.resolution_note).toBe("Verificato");
    expect(patch.resolved_at).toBeTruthy();
  });

  it("H6-RESOLVE-05 double resolve on already-resolved is a conflict, not a churn", async () => {
    db.current = { id: "rep-1", status: "resolved" };
    const result = await resolveExperienceReport({
      id: "rep-1",
      disposition: "resolved",
      note: null,
    });
    expect(result).toEqual({ ok: false, reason: "state" });
    expect(db.updateCalls).toHaveLength(0);
  });

  it("H6-RESOLVE-03b race winner guard: update requires status open", async () => {
    db.current = { id: "rep-1", status: "open" };
    db.updateResult = null;
    const result = await resolveExperienceReport({
      id: "rep-1",
      disposition: "dismissed",
      note: null,
    });
    expect(result).toEqual({ ok: false, reason: "conflict" });
    expect(db.eqCalls).toContainEqual(["status", "open"]);
  });

  it("H6-PRIV-03b missing report is not found", async () => {
    db.current = null;
    const result = await resolveExperienceReport({
      id: "rep-404",
      disposition: "resolved",
      note: null,
    });
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
