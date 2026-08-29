import { describe, expect, it } from "vitest";

import {
  createExperienceSchema,
  updateExperienceSchema,
} from "@/lib/community/schema";

const valid = {
  toolSlug: "blink",
  displayName: "Gianmaria",
  useCase: "AI coding",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  durationBucket: "months_1_3" as const,
  captchaToken: "token-token",
};

describe("community experience schemas", () => {
  it("accepts a valid create payload", () => {
    expect(createExperienceSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown keys and privileged fields", () => {
    expect(
      createExperienceSchema.safeParse({ ...valid, status: "published" }).success,
    ).toBe(false);
    expect(
      createExperienceSchema.safeParse({ ...valid, authorId: "x" }).success,
    ).toBe(false);
    expect(
      createExperienceSchema.safeParse({ ...valid, author_id: "x" }).success,
    ).toBe(false);
  });

  it("rejects short body and overflow", () => {
    expect(
      createExperienceSchema.safeParse({ ...valid, body: "too short" }).success,
    ).toBe(false);
    expect(
      createExperienceSchema.safeParse({ ...valid, body: "x".repeat(2001) }).success,
    ).toBe(false);
  });

  it("keeps internal newlines after outer trim", () => {
    const parsed = createExperienceSchema.safeParse({
      ...valid,
      body: `  ${valid.body}\nSecond line.  `,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.body.startsWith("Used")).toBe(true);
      expect(parsed.data.body.includes("\n")).toBe(true);
    }
  });

  it("rejects switchedFrom slug and label together and self slug", () => {
    expect(
      createExperienceSchema.safeParse({
        ...valid,
        switchedFromSlug: "weweb",
        switchedFromLabel: "Framer",
      }).success,
    ).toBe(false);
    expect(
      createExperienceSchema.safeParse({
        ...valid,
        switchedFromSlug: "blink",
      }).success,
    ).toBe(false);
  });

  it("rejects empty and oversized bullet lists", () => {
    expect(createExperienceSchema.safeParse({ ...valid, pros: [] }).success).toBe(
      false,
    );
    expect(
      createExperienceSchema.safeParse({
        ...valid,
        limits: ["short"],
      }).success,
    ).toBe(false);
  });

  it("requires expectedUpdatedAt and a content field on update", () => {
    expect(updateExperienceSchema.safeParse({}).success).toBe(false);
    expect(
      updateExperienceSchema.safeParse({ expectedUpdatedAt: "2026-01-01T00:00:00.000Z" })
        .success,
    ).toBe(false);
    expect(
      updateExperienceSchema.safeParse({
        expectedUpdatedAt: "2026-01-01T00:00:00.000Z",
        useCase: "video editing",
      }).success,
    ).toBe(true);
  });
});
