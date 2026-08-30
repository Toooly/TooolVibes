import { describe, expect, it } from "vitest";

import { createReportSchema } from "@/lib/community/schema";

describe("H6 report input schema", () => {
  it("accepts every valid reason with optional details", () => {
    for (const reason of ["spam", "abuse", "misleading", "personal_data"] as const) {
      expect(createReportSchema.safeParse({ reason }).success).toBe(true);
    }
  });

  it("H6-REPORT-11 valid reasons include other with details", () => {
    const parsed = createReportSchema.safeParse({
      reason: "other",
      details: "Contenuto strano",
    });
    expect(parsed.success).toBe(true);
  });

  it("H6-REPORT-12 invalid reason rejected", () => {
    expect(createReportSchema.safeParse({ reason: "rude" }).success).toBe(false);
  });

  it("H6-REPORT-14 other without details rejected", () => {
    expect(createReportSchema.safeParse({ reason: "other" }).success).toBe(false);
  });

  it("H6-REPORT-13 details over 500 rejected", () => {
    expect(
      createReportSchema.safeParse({
        reason: "spam",
        details: "a".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("H6-REPORT-15 unknown keys rejected", () => {
    expect(
      createReportSchema.safeParse({
        reason: "spam",
        reporterId: "u-1",
      }).success,
    ).toBe(false);
  });
});
