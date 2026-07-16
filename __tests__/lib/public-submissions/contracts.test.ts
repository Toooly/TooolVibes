import { describe, expect, it } from "vitest";

import {
  affiliateRequestSchema,
  toolRequestSchema,
  waitlistPublicRequestSchema,
} from "@/lib/public-submissions/contracts";

describe("public submission contracts", () => {
  it("normalizes waitlist input and rejects client-controlled fields", () => {
    expect(
      waitlistPublicRequestSchema.parse({
        email: "  PERSON@Example.COM ",
      }),
    ).toEqual({
      email: "person@example.com",
      companyWebsite: "",
      captchaToken: "",
    });

    expect(
      waitlistPublicRequestSchema.safeParse({
        email: "person@example.com",
        source: "forged",
      }).success,
    ).toBe(false);
  });

  it("bounds and normalizes every tool-request field", () => {
    const valid = toolRequestSchema.parse({
      submitterType: "founder",
      toolName: " Tool ",
      toolUrl: "https://example.com/tool",
      category: "Automation",
      level: "intermediate",
      email: "FOUNDER@EXAMPLE.COM",
      requestedServices: ["Launch support"],
    });

    expect(valid.email).toBe("founder@example.com");
    expect(valid.toolName).toBe("Tool");
    expect(
      toolRequestSchema.safeParse({
        ...valid,
        status: "approved",
      }).success,
    ).toBe(false);
    expect(
      toolRequestSchema.safeParse({
        ...valid,
        toolUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      toolRequestSchema.safeParse({
        ...valid,
        requestedServices: ["Launch support", "Launch support"],
      }).success,
    ).toBe(false);
    expect(
      toolRequestSchema.safeParse({
        ...valid,
        message: "x".repeat(2_001),
      }).success,
    ).toBe(false);
  });

  it("keeps affiliate payload strict and bounded", () => {
    const valid = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ADA@EXAMPLE.COM",
      websiteUrl: "https://example.com",
      message: "Vorrei presentare TooolVibes alla mia community.",
    };

    expect(affiliateRequestSchema.parse(valid).email).toBe(
      "ada@example.com",
    );
    expect(
      affiliateRequestSchema.safeParse({
        ...valid,
        adminNotes: "forged",
      }).success,
    ).toBe(false);
    expect(
      affiliateRequestSchema.safeParse({
        ...valid,
        websiteUrl: "https://user:password@example.com",
      }).success,
    ).toBe(false);
    expect(
      affiliateRequestSchema.safeParse({
        ...valid,
        message: "x".repeat(4_001),
      }).success,
    ).toBe(false);
  });
});
