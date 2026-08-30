import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const h1 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260829120000_community_experiences.sql"),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

const h7 = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260830180000_community_experience_reports_dismissed.sql",
  ),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("H7 community report dismissed migration", () => {
  it("H7-DB-01/02/03 permits open resolved dismissed", () => {
    expect(h7).toContain("check (status in ('open', 'resolved', 'dismissed'))");
  });

  it("H7-DB-04 does not keep the two-state check", () => {
    expect(h7).toContain("drop constraint if exists community_experience_reports_status_chk");
    expect(h7).not.toContain("check (status in ('open', 'resolved'))");
  });

  it("H7-DB-07 is additive: no drop table / no rewrite", () => {
    expect(h7).not.toContain("drop table");
    expect(h7).not.toContain("create table");
    expect(h7).not.toContain("truncate");
  });

  it("H7-DB-08 does not touch experiences or workspace", () => {
    expect(h7).not.toContain("community_experiences");
    expect(h7).not.toContain("viewer_workspace");
    expect(h7).not.toContain("schemaversion");
  });

  it("H1 experience schema remains the source of the tables", () => {
    expect(h1).toContain("create table if not exists public.community_experiences");
    expect(h1).toContain("create table if not exists public.community_experience_reports");
    expect(h1).toContain("check (status in ('open', 'resolved'))");
  });
});
