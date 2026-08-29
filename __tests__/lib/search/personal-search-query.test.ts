import { describe, expect, it } from "vitest";

import {
  parsePersonalSearchQuery,
  filtersFromSalvatiChip,
} from "@/lib/search/personal-search-query";

describe("personal search parser", () => {
  it("SEARCH-PARSE-01 plain text", () => {
    const parsed = parsePersonalSearchQuery("video editor");
    expect(parsed.personal).toBe(false);
    expect(parsed.text).toBe("video editor");
    expect(parsed.filters).toEqual([]);
  });

  it("SEARCH-PARSE-02 single filter", () => {
    const parsed = parsePersonalSearchQuery("usage:using");
    expect(parsed.personal).toBe(true);
    expect(parsed.filters).toEqual([{ type: "usage", value: "using" }]);
    expect(parsed.text).toBe("");
  });

  it("SEARCH-PARSE-03 multiple filters", () => {
    const parsed = parsePersonalSearchQuery("in:saved usage:using");
    expect(parsed.filters.map((filter) => filter.type).sort()).toEqual([
      "in",
      "usage",
    ]);
  });

  it("SEARCH-PARSE-04 quoted Stack", () => {
    const parsed = parsePersonalSearchQuery('stack:"AI Coding"');
    expect(parsed.filters).toEqual([{ type: "stack", value: "AI Coding" }]);
  });

  it("SEARCH-PARSE-05 quoted note", () => {
    const parsed = parsePersonalSearchQuery('q_note:"troppo costoso"');
    expect(parsed.filters).toEqual([{ type: "q_note", value: "troppo costoso" }]);
    expect(parsed.personal).toBe(true);
  });

  it("SEARCH-PARSE-06 unknown filter becomes text", () => {
    const parsed = parsePersonalSearchQuery("foo:bar cursor");
    expect(parsed.unknownFilters).toEqual(["foo"]);
    expect(parsed.text).toContain("foo:bar");
    expect(parsed.personal).toBe(false);
  });

  it("SEARCH-PARSE-07 malformed quote", () => {
    const parsed = parsePersonalSearchQuery('stack:"AI Coding');
    expect(parsed.errors).toContain("unclosed-quote");
  });

  it("SEARCH-PARSE-08 case normalization", () => {
    const parsed = parsePersonalSearchQuery("STATUS:SCELTI");
    expect(parsed.filters).toEqual([{ type: "status", value: "scelti" }]);
  });

  it("SEARCH-PARSE-09 Unicode", () => {
    const parsed = parsePersonalSearchQuery('q_note:"caffè"');
    expect(parsed.filters[0]).toEqual({ type: "q_note", value: "caffè" });
  });

  it("SEARCH-PARSE-10 empty query", () => {
    const parsed = parsePersonalSearchQuery("   ");
    expect(parsed.filters).toEqual([]);
    expect(parsed.personal).toBe(false);
  });

  it("SEARCH-PARSE-11 duplicate filters", () => {
    const parsed = parsePersonalSearchQuery("usage:using usage:using");
    expect(parsed.filters.filter((filter) => filter.type === "usage")).toHaveLength(2);
  });

  it("SEARCH-PARSE-12 conflicting filters stay typed", () => {
    const parsed = parsePersonalSearchQuery("status:scelti status:scartati");
    expect(parsed.filters).toHaveLength(2);
  });

  it("compiles aliases into personal filters", () => {
    expect(parsePersonalSearchQuery("rimandati").personal).toBe(true);
    expect(parsePersonalSearchQuery("in uso").filters).toEqual([
      { type: "usage", value: "using" },
    ]);
    expect(parsePersonalSearchQuery("con note").filters).toEqual([
      { type: "note", value: "yes" },
    ]);
  });

  it("category is public", () => {
    const parsed = parsePersonalSearchQuery('category:"video"');
    expect(parsed.personal).toBe(false);
    expect(parsed.filters).toEqual([{ type: "category", value: "video" }]);
  });

  it("compiles Salvati chips", () => {
    expect(filtersFromSalvatiChip("in_uso")).toEqual([{ type: "usage", value: "using" }]);
    expect(filtersFromSalvatiChip("tutti")).toEqual([]);
  });
});
