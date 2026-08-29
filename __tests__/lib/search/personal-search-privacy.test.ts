import { describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { searchPersonal } from "@/lib/search/personal-search";
import { parsePersonalSearchQuery } from "@/lib/search/personal-search-query";

describe("personal search privacy", () => {
  it("PRIV-D-01 q_note query is not a reason string", () => {
    const spy = vi.spyOn(console, "log");
    const hits = searchPersonal({
      query: 'q_note:"client X pricing"',
      catalog: [
        {
          slug: "cursor",
          name: "Cursor",
          categoryLabel: "Coding",
          shortDescription: "Editor",
          tags: [],
        },
      ],
      state: workspaceTestFixtures.mature,
    });
    expect(JSON.stringify(hits)).not.toContain("client X");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("PRIV-D-05 parser keeps q_note local", () => {
    const parsed = parsePersonalSearchQuery('q_note:"secret"');
    expect(parsed.personal).toBe(true);
    expect(parsed.filters[0]).toEqual({ type: "q_note", value: "secret" });
  });
});
