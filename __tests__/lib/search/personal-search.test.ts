import { describe, expect, it } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { searchPersonal } from "@/lib/search/personal-search";
import { parsePersonalSearchQuery } from "@/lib/search/personal-search-query";

const CATALOG = [
  { slug: "cursor", name: "Cursor", categoryLabel: "Coding", shortDescription: "Editor AI", tags: ["ai"] },
  { slug: "v0", name: "v0", categoryLabel: "Coding", shortDescription: "UI generator", tags: ["ui"] },
  { slug: "meku", name: "Meku", categoryLabel: "Video", shortDescription: "Video tool", tags: ["video"] },
  { slug: "blink", name: "Blink", categoryLabel: "Vibe coding / builder app AI", shortDescription: "App builder", tags: ["ai"] },
  { slug: "linear", name: "Linear", categoryLabel: "Product", shortDescription: "Issue tracking", tags: [] },
  { slug: "descript", name: "Descript", categoryLabel: "Video", shortDescription: "Editor video", tags: ["video"] },
];

function slugs(query: string, state = workspaceTestFixtures.mature) {
  return searchPersonal({ query, catalog: CATALOG, state }).map((hit) => hit.slug);
}

describe("personal search data", () => {
  it("SEARCH-DATA-01 in:saved", () => {
    expect(slugs("in:saved", workspaceTestFixtures.withSaved)).toEqual(["cursor"]);
  });

  it("SEARCH-DATA-02 status scelti", () => {
    expect(slugs("status:scelti", workspaceTestFixtures.withDecisions)).toEqual(["cursor"]);
  });

  it("SEARCH-DATA-03 status postponed", () => {
    expect(slugs("status:rimandati")).toContain("meku");
  });

  it("SEARCH-DATA-04 status rejected", () => {
    expect(slugs("status:scartati", workspaceTestFixtures.withDecisions)).toEqual(["v0"]);
  });

  it("SEARCH-DATA-05 usage using", () => {
    expect(slugs("usage:using", workspaceTestFixtures.quietReturning).sort()).toEqual([
      "cursor",
      "v0",
    ]);
  });

  it("SEARCH-DATA-06 usage stopped", () => {
    const state = reduceWorkspaceState(workspaceTestFixtures.withSaved, {
      type: "tool/usage",
      slug: "cursor",
      usage: "stopped",
      at: "2026-06-04T10:00:00.000Z",
    });
    expect(slugs("usage:stopped", state)).toEqual(["cursor"]);
  });

  it("SEARCH-DATA-07 usage replaced", () => {
    expect(slugs("usage:replaced")).toContain("linear");
  });

  it("SEARCH-DATA-08 Stack", () => {
    expect(slugs('stack:"AI Coding"', workspaceTestFixtures.withStacks)).toEqual(["cursor"]);
    expect(slugs("stack:ai-coding", workspaceTestFixtures.withStacks)).toEqual(["cursor"]);
  });

  it("SEARCH-DATA-09 revisit due", () => {
    expect(slugs("revisit:due", workspaceTestFixtures.reviewDue)).toEqual(["meku"]);
  });

  it("SEARCH-DATA-10 note yes", () => {
    expect(slugs("note:yes")).toContain("cursor");
  });

  it("SEARCH-DATA-11 q_note", () => {
    expect(slugs('q_note:"daily coding"')).toEqual(["cursor"]);
    expect(slugs('q_note:"<script>alert(1)</script>"')).toEqual([]);
  });

  it("SEARCH-DATA-12 not rejected", () => {
    const hits = slugs("not:rejected", workspaceTestFixtures.withDecisions);
    expect(hits).toContain("cursor");
    expect(hits).not.toContain("v0");
  });

  it("SEARCH-DATA-13 alternative-to", () => {
    const hits = slugs("alternative-to:descript");
    expect(hits).toContain("meku");
    expect(hits).not.toContain("descript");
  });

  it("SEARCH-DATA-14 category", () => {
    expect(slugs('category:"video"')).toEqual(["descript", "meku"]);
  });

  it("SEARCH-DATA-15 free text + personal filter", () => {
    expect(slugs("cursor usage:using", workspaceTestFixtures.quietReturning)).toEqual([
      "cursor",
    ]);
  });

  it("SEARCH-DATA-16 multiple filters intersection", () => {
    expect(slugs("in:saved status:scartati", workspaceTestFixtures.withDecisions)).toEqual([
      "v0",
    ]);
  });

  it("does not return note content in reasons", () => {
    const hits = searchPersonal({
      query: "note:yes",
      catalog: CATALOG,
      state: workspaceTestFixtures.mature,
    });
    const cursor = hits.find((hit) => hit.slug === "cursor");
    expect(cursor?.reasons.join(" ")).not.toContain("daily");
  });

  it("empty query returns nothing", () => {
    expect(slugs("")).toEqual([]);
  });

  it("conflicting filters yield empty", () => {
    expect(slugs("status:scelti status:scartati", workspaceTestFixtures.withDecisions)).toEqual([]);
  });

  it("indexes a large workspace without stalling", () => {
    let state = createEmptyWorkspaceState();
    const catalog = [];
    for (let i = 0; i < 80; i += 1) {
      const slug = `tool-${i}`;
      catalog.push({
        slug,
        name: `Tool ${i}`,
        categoryLabel: i % 2 ? "Coding" : "Video",
        shortDescription: "desc",
        tags: [],
      });
      state = reduceWorkspaceState(state, {
        type: "saved/set",
        slug,
        saved: true,
        at: "2026-06-01T10:00:00.000Z",
      });
    }
    const started = Date.now();
    const hits = searchPersonal({
      query: "in:saved category:Coding",
      catalog,
      state,
    });
    expect(Date.now() - started).toBeLessThan(50);
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("parse + search aliases", () => {
  it("rimandati compiles and matches", () => {
    const parsed = parsePersonalSearchQuery("rimandati");
    expect(parsed.personal).toBe(true);
    expect(slugs("rimandati")).toContain("meku");
  });
});
