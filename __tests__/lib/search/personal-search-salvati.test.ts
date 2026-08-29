import { describe, expect, it } from "vitest";

import { listSalvatiRelationships } from "@/lib/account/salvati-relationship";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  matchesSalvatiPersonalQuery,
} from "@/lib/search/personal-search";
import { buildWorkspaceSearchIndex } from "@/lib/search/workspace-search-index";

const catalog = {
  cursor: { name: "Cursor", categoryLabel: "Coding" },
  v0: { name: "v0", categoryLabel: "Coding" },
  meku: { name: "Meku", categoryLabel: "Video" },
};

describe("Salvati personal query", () => {
  const state = workspaceTestFixtures.mature;
  const items = listSalvatiRelationships(state);
  const index = buildWorkspaceSearchIndex(state);

  function match(slug: string, query: string) {
    const item = items.find((row) => row.slug === slug);
    if (!item) return false;
    return matchesSalvatiPersonalQuery(
      item,
      query,
      catalog[slug as keyof typeof catalog] ?? { name: slug, categoryLabel: "" },
      index,
    );
  }

  it("SALVATI-D-01 plain search unchanged", () => {
    expect(match("cursor", "cursor")).toBe(true);
    expect(match("meku", "cursor")).toBe(false);
  });

  it("SALVATI-D-02 usage:using", () => {
    const using = listSalvatiRelationships(workspaceTestFixtures.quietReturning);
    const usingIndex = buildWorkspaceSearchIndex(workspaceTestFixtures.quietReturning);
    const cursor = using.find((row) => row.slug === "cursor");
    expect(cursor).toBeTruthy();
    expect(
      matchesSalvatiPersonalQuery(
        cursor!,
        "usage:using",
        { name: "Cursor", categoryLabel: "Coding" },
        usingIndex,
      ),
    ).toBe(true);
  });

  it("SALVATI-D-03 note:yes", () => {
    expect(match("cursor", "note:yes")).toBe(true);
    expect(match("meku", "note:yes")).toBe(false);
  });

  it("SALVATI-D-04 q_note", () => {
    expect(match("cursor", 'q_note:"daily"')).toBe(true);
    expect(match("cursor", 'q_note:"pricing"')).toBe(false);
  });

  it("SALVATI-D-05 Stack filter", () => {
    expect(match("cursor", 'stack:"AI Coding"')).toBe(true);
  });

  it("SALVATI-D-07 zero results stay false", () => {
    expect(match("cursor", "usage:stopped")).toBe(false);
  });
});
