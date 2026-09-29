import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = readFileSync("lib/data/tooolvibes-directory.ts", "utf8");

describe("tool data integrity", () => {
  it("AgentX pricing is verified and not regressed", () => {
    expect(dir).toContain('pricingStatus: "verified"');
    expect(dir).toContain('pricingSourceUrl: "https://agentx.so/pricing"');
    expect(dir).toContain('"Free"');
    expect(dir).toContain('"$49"');
    expect(dir).toContain('"$199"');
    expect(dir).toContain('"$299"');
  });

  it("verified pricing has source URL and verification date", () => {
    const blocks = dir.match(/pricingPlans:[\s\S]*?pricingLastVerifiedAt[^,]+/g) ?? [];
    for (const block of blocks) {
      expect(block).toContain("pricingSourceUrl");
      expect(block).toContain("pricingLastVerifiedAt");
    }
  });

  it("affiliate URLs are set where externalUrl contains affiliate params", () => {
    const affUrls = dir.match(/affiliateUrl:\s*"([^"]+)"/g) ?? [];
    expect(affUrls.length).toBeGreaterThanOrEqual(10);
  });

  it("imported logos are configured", () => {
    expect(dir).toContain('logoUrl: "/tool-logos/cosmicjs.svg"');
    expect(dir).toContain('logoUrl: "/tool-logos/synthesia-ai.svg"');
    expect(dir).toContain('logoUrl: "/tool-logos/lemon-squeezy.svg"');
    expect(dir).toContain('logoUrl: "/tool-logos/flowise.png"');
  });

  it("verified pricing from first-party sources", () => {
    expect(dir).toContain('pricingSourceUrl: "https://www.cosmicjs.com/pricing"');
    expect(dir).toContain('pricingSourceUrl: "https://www.lemonsqueezy.com/pricing"');
    expect(dir).toContain('pricingSourceUrl: "https://www.synthesia.io/pricing"');
  });

  it("every tool has a canonical name and slug", () => {
    const slugs = dir.match(/slug:\s*"([^"]+)"/g) ?? [];
    expect(slugs.length).toBeGreaterThanOrEqual(30);
  });
});
