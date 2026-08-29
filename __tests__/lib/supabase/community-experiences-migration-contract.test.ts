import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260829120000_community_experiences.sql",
);
const sql = readFileSync(migrationPath, "utf8")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("H1 community experiences migration contract", () => {
  it("H1-SQL-01 defines community_experiences", () => {
    expect(sql).toContain(
      "create table if not exists public.community_experiences",
    );
    expect(sql).toContain("id uuid primary key default gen_random_uuid()");
  });

  it("H1-SQL-02 defines community_experience_reports", () => {
    expect(sql).toContain(
      "create table if not exists public.community_experience_reports",
    );
  });

  it("H1-SQL-03 unique author/tool", () => {
    expect(sql).toContain("unique (author_id, tool_slug)");
  });

  it("H1-SQL-04 unique reporter/experience", () => {
    expect(sql).toContain("unique (reporter_id, experience_id)");
  });

  it("H1-SQL-05/06 enable and force rls on both tables", () => {
    expect(sql).toContain(
      "alter table public.community_experiences enable row level security",
    );
    expect(sql).toContain(
      "alter table public.community_experiences force row level security",
    );
    expect(sql).toContain(
      "alter table public.community_experience_reports enable row level security",
    );
    expect(sql).toContain(
      "alter table public.community_experience_reports force row level security",
    );
  });

  it("H1-SQL-07 does not grant public table select (author_id leak)", () => {
    expect(sql).not.toContain(
      "grant select on table public.community_experiences to anon",
    );
    expect(sql).not.toContain(
      "grant select on table public.community_experiences to authenticated",
    );
    expect(sql).not.toContain(
      'create policy "public can read published community experiences"',
    );
  });

  it("H1-SQL-08 owner select policy exists as defense in depth", () => {
    expect(sql).toContain(
      'create policy "users can read own community experiences"',
    );
    expect(sql).toContain("using (author_id = auth.uid())");
  });

  it("H1-SQL-09/10/11 revokes client insert/update/delete", () => {
    expect(sql).toContain(
      "revoke all privileges on table public.community_experiences from public, anon, authenticated",
    );
    expect(sql).toContain(
      "revoke all privileges on table public.community_experience_reports from public, anon, authenticated",
    );
    expect(sql).not.toContain(
      "grant insert on table public.community_experiences to anon",
    );
    expect(sql).not.toContain(
      "grant insert on table public.community_experiences to authenticated",
    );
    expect(sql).not.toContain(
      "grant update on table public.community_experiences to authenticated",
    );
    expect(sql).not.toContain(
      "grant delete on table public.community_experiences to authenticated",
    );
  });

  it("H1-SQL-12 reports are not client-readable", () => {
    expect(sql).not.toContain(
      "grant select on table public.community_experience_reports to anon",
    );
    expect(sql).not.toContain(
      "grant select on table public.community_experience_reports to authenticated",
    );
  });

  it("H1-SQL-13/14 status defaults pending and is constrained", () => {
    expect(sql).toContain("status text not null default 'pending'");
    expect(sql).toContain(
      "check (status in ('pending', 'published', 'hidden', 'rejected'))",
    );
  });

  it("H1-SQL-15 report reason is constrained", () => {
    expect(sql).toContain(
      "check ( reason in ( 'spam', 'abuse', 'misleading', 'personal_data', 'other' ) )",
    );
  });

  it("H1-SQL-16/17 auth.users cascade on author and reporter", () => {
    expect(sql).toContain(
      "author_id uuid not null references auth.users (id) on delete cascade",
    );
    expect(sql).toContain(
      "reporter_id uuid not null references auth.users (id) on delete cascade",
    );
  });

  it("H1-SQL-18 reports cascade when experience is deleted", () => {
    expect(sql).toContain(
      "experience_id uuid not null references public.community_experiences (id) on delete cascade",
    );
  });

  it("H1-SQL-19 creates justified indexes", () => {
    expect(sql).toContain("community_experiences_published_tool_idx");
    expect(sql).toContain("where status = 'published'");
    expect(sql).toContain("community_experiences_author_idx");
    expect(sql).toContain("community_experiences_pending_idx");
    expect(sql).toContain("community_experience_reports_open_idx");
    expect(sql).toContain("community_experience_reports_experience_idx");
  });

  it("H1-SQL-20 does not touch workspace state", () => {
    expect(sql).not.toContain("workspace_state");
    expect(sql).not.toContain("schemaversion");
    expect(sql).not.toContain("drop table");
    expect(sql).not.toContain("viewer_workspaces");
    expect(sql).not.toContain("create function");
    expect(sql).not.toContain("security definer");
  });

  it("locks duration, switched-from xor, array cardinality, and timestamps", () => {
    expect(sql).toContain("check ( duration_bucket in (");
    expect(sql).toContain("'under_1_month'");
    expect(sql).toContain("'year_plus'");
    expect(sql).toContain(
      "not ( switched_from_slug is not null and switched_from_label is not null )",
    );
    expect(sql).toContain("switched_from_slug <> tool_slug");
    expect(sql).toContain("check (cardinality(pros) between 1 and 5)");
    expect(sql).toContain("check (cardinality(limits) between 1 and 5)");
    expect(sql).toContain("pros text[] not null");
    expect(sql).toContain("published_at timestamptz null");
    expect(sql).toContain("execute function public.set_updated_at()");
    expect(sql).toContain(
      "grant select, insert, update, delete on table public.community_experiences to service_role",
    );
    expect(sql).not.toContain("security definer");
  });
});
