import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260716000002_create_waitlist.sql",
);
const sql = readFileSync(migrationPath, "utf8")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("SEC-103 waitlist migration contract", () => {
  it("defines canonical email, consent, source, status and retention fields", () => {
    expect(sql).toContain("create table if not exists public.waitlist");
    expect(sql).toContain("email = lower(btrim(email))");
    expect(sql).toContain("create unique index if not exists waitlist_email_unique_idx");
    expect(sql).toContain("consent_version text not null");
    expect(sql).toContain("consent_at timestamptz not null");
    expect(sql).toContain("source text not null");
    expect(sql).toContain("created_at timestamptz not null");
    expect(sql).toContain("retention_expires_at timestamptz not null");
    expect(sql).toContain(
      "retention_expires_at <= created_at + interval '24 months'",
    );
    expect(sql).toContain("add constraint waitlist_pkey primary key (id)");
    expect(sql).toContain("legacy primary key requires review");
    expect(sql).toContain("index_row.indisunique");
    expect(sql).toContain("unique email index requires review");
    expect(sql).toContain("interval '24 months'");
  });

  it("makes registration atomic and duplicate-safe in the database", () => {
    expect(sql).toContain("function public.register_waitlist_entry(");
    expect(sql).toContain("on conflict (email) do nothing");
    expect(sql).toContain("get diagnostics affected_rows = row_count");
    expect(sql).toContain("return affected_rows = 1");
  });

  it("blocks direct public table access and exposes only service-role RPC access", () => {
    expect(sql).toContain("alter table public.waitlist enable row level security");
    expect(sql).toContain("alter table public.waitlist force row level security");
    expect(sql).toContain(
      "revoke all privileges on table public.waitlist from public, anon, authenticated",
    );
    expect(sql).not.toContain(
      "grant insert on table public.waitlist to anon",
    );
    expect(sql).toContain(
      "grant execute on function public.register_waitlist_entry(text, text, text) to service_role",
    );
  });

  it("provides an explicit, least-privilege retention operation", () => {
    expect(sql).toContain(
      "function public.purge_expired_waitlist_entries()",
    );
    expect(sql).toContain(
      "where retention_expires_at <= timezone('utc', now())",
    );
    expect(sql).toContain(
      "revoke all on function public.purge_expired_waitlist_entries() from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.purge_expired_waitlist_entries() to service_role",
    );
  });
});
