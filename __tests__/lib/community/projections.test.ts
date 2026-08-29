import { describe, expect, it } from "vitest";

import { toOwnerExperience, toPublicExperience } from "@/lib/community/projections";

const row = {
  id: "11111111-1111-1111-1111-111111111111",
  tool_slug: "blink",
  display_name: "Gianmaria",
  use_case: "AI coding",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  duration_bucket: "months_1_3" as const,
  switched_from_slug: null,
  switched_from_label: null,
  published_at: "2026-08-30T00:00:00.000Z",
  updated_at: "2026-08-30T00:00:00.000Z",
  status: "published" as const,
  created_at: "2026-08-29T00:00:00.000Z",
  submitted_at: "2026-08-29T00:00:00.000Z",
  moderated_at: "2026-08-30T00:00:00.000Z",
  moderation_reason: null,
  author_id: "should-never-leak",
  moderated_by: "admin@tooolvibes.eu",
};

describe("community projections", () => {
  it("omits author_id and moderator identity from public JSON", () => {
    const publicJson = JSON.stringify(toPublicExperience(row));
    expect(publicJson).not.toContain("author_id");
    expect(publicJson).not.toContain("authorId");
    expect(publicJson).not.toContain("should-never-leak");
    expect(publicJson).not.toContain("moderated_by");
    expect(publicJson).not.toContain("admin@tooolvibes.eu");
    expect(publicJson).not.toContain("status");
  });

  it("omits author_id and moderated_by from owner JSON", () => {
    const ownerJson = JSON.stringify(toOwnerExperience(row));
    expect(ownerJson).not.toContain("author_id");
    expect(ownerJson).not.toContain("should-never-leak");
    expect(ownerJson).not.toContain("moderated_by");
    expect(ownerJson).not.toContain("admin@tooolvibes.eu");
    expect(ownerJson).toContain("published");
  });
});
