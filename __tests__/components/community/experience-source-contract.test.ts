import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("H4 public experience source contracts", () => {
  it("H4-SEC-10 client load-more does not import the admin client", () => {
    const src = read("components/community/experience-load-more.tsx");
    expect(src).not.toMatch(/admin-client|SERVICE_ROLE|createAdminSupabaseClient/);
    expect(src).toMatch(/"use client"/);
  });

  it("H4-DATA-05 repository public list filters published", () => {
    const src = read("lib/community/repository.ts");
    expect(src).toMatch(/\.eq\("status", "published"\)/);
    expect(src).toMatch(/PUBLIC_COLUMNS/);
  });

  it("H4-SEC cards never mention author_id", () => {
    const card = read("components/community/experience-card.tsx");
    expect(card).not.toMatch(/author_id|authorId|moderatedBy|moderationReason|email/);
  });
});
