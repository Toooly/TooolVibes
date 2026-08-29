import { describe, expect, it } from "vitest";

import { parsePublicExperience, parsePublicExperiencePage } from "@/lib/community/public-page";

const valid = {
  id: "11111111-1111-4111-8111-111111111111",
  toolSlug: "blink",
  displayName: "Gianmaria",
  useCase: "AI coding",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  durationBucket: "months_1_3",
  switchedFromSlug: null,
  switchedFromLabel: null,
  publishedAt: "2026-08-30T12:00:00.000Z",
  updatedAt: "2026-08-30T12:00:00.000Z",
};

describe("public experience parser", () => {
  it("H4-SEC strips author and moderation fields", () => {
    const parsed = parsePublicExperience({
      ...valid,
      authorId: "user-secret",
      author_id: "user-secret",
      moderatedBy: "founder-admin",
      moderationReason: "hidden reason",
      email: "a@example.com",
    });
    expect(parsed).toMatchObject({
      displayName: "Gianmaria",
      toolSlug: "blink",
    });
    expect(JSON.stringify(parsed)).not.toMatch(/author|moderated|email|user-secret/i);
  });

  it("parses a page and next cursor", () => {
    const page = parsePublicExperiencePage({
      experiences: [valid],
      nextCursor: "abc",
    });
    expect(page?.experiences).toHaveLength(1);
    expect(page?.nextCursor).toBe("abc");
  });
});
