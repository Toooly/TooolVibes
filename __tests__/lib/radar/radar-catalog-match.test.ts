import { describe, expect, it } from "vitest";

import {
  matchRadarItemToCatalog,
  productHuntPathSlug,
} from "@/lib/radar/radar-catalog-match";

const catalog = [
  { slug: "blink", name: "Blink" },
  { slug: "weweb", name: "WeWeb" },
  { slug: "make", name: "Make" },
];

function item(name: string, path: string) {
  return {
    name,
    productHuntUrl: `https://www.producthunt.com/posts/${path}`,
  };
}

describe("radar catalog match", () => {
  it("matches exact canonical slug from Product Hunt URL", () => {
    expect(productHuntPathSlug("https://www.producthunt.com/posts/blink")).toBe("blink");
    expect(matchRadarItemToCatalog(item("Blink", "blink"), catalog)).toEqual({
      status: "matched",
      slug: "blink",
      via: "slug",
    });
  });

  it("matches case-normalized name when slugified name agrees", () => {
    expect(matchRadarItemToCatalog(item("blink", "blink"), catalog).status).toBe("matched");
  });

  it("rejects unmatched external tools", () => {
    expect(matchRadarItemToCatalog(item("Fixture Canvas", "fixture-canvas"), catalog)).toEqual({
      status: "unmatched",
    });
  });

  it("rejects name collision when URL slug disagrees", () => {
    expect(matchRadarItemToCatalog(item("Make", "make-2"), catalog)).toEqual({
      status: "unmatched",
    });
  });

  it("rejects ambiguous catalog names", () => {
    const dupes = [
      { slug: "make", name: "Make" },
      { slug: "make-alt", name: "Make" },
    ];
    expect(matchRadarItemToCatalog(item("Make", "make"), dupes).status).toBe("ambiguous");
  });

  it("does not fuzzy-match token overlap", () => {
    expect(matchRadarItemToCatalog(item("Blink AI Studio", "blink-ai-studio"), catalog)).toEqual({
      status: "unmatched",
    });
  });
});
