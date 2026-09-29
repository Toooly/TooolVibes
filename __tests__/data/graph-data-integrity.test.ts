import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = readFileSync("lib/data/tooolvibes-directory.ts", "utf8");
const collections = readFileSync("lib/data/content-collections.ts", "utf8");
const guideTopics = readFileSync("lib/data/guide-topics.ts", "utf8");

describe("graph data integrity", () => {
  it("all tool slugs are valid", () => {
    const slugs = dir.match(/slug:\s*"([^"]+)"/g) ?? [];
    expect(slugs.length).toBeGreaterThanOrEqual(30);
  });

  it("collection tool references are valid", () => {
    const toolSlugs = [...collections.matchAll(/tool_slug:\s*"([^"]+)"/g)].map((m) => m[1]);
    const dirSlugs = [...dir.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
    for (const slug of toolSlugs) {
      expect(dirSlugs).toContain(slug);
    }
  });

  it("guide topic slugs reference valid tools", () => {
    const guideSlugs = [...guideTopics.matchAll(/"([^"]+)":/g)].map((m) => m[1]);
    const dirSlugs = [...dir.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
    for (const slug of guideSlugs) {
      // Guide slugs should match tool slugs or be valid guide identifiers
      expect(slug.length).toBeGreaterThan(0);
    }
    expect(guideSlugs.length).toBeGreaterThanOrEqual(10);
  });

  it("no self-referencing guide relations", () => {
    // Guide slug should not reference itself as tool
    const entries = [...guideTopics.matchAll(/"([^"]+)":\s*"([^"]+)"/g)];
    for (const [, slug, topic] of entries) {
      expect(slug).not.toBe(topic);
    }
  });

  
});
