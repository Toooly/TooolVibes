import { describe, expect, it } from "vitest";

import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";

function withSaved(slugs: string[]) {
  const empty = createEmptyWorkspaceState();
  return {
    ...empty,
    saved: { slugs, updatedAt: "2026-08-15T12:00:00.000Z" },
  };
}

function withCompare(slugs: string[]) {
  const empty = createEmptyWorkspaceState();
  return {
    ...empty,
    compare: { slugs, updatedAt: "2026-08-15T12:00:00.000Z" },
  };
}

describe("guest → account merge contract", () => {
  it("unions saved tools instead of replacing", () => {
    const merged = mergeGuestWorkspaceContribution(
      withSaved(["blink"]),
      withSaved(["meku"]),
    );
    expect(merged.saved.slugs.sort()).toEqual(["blink", "meku"]);
  });

  it("deduplicates overlapping slugs", () => {
    const merged = mergeGuestWorkspaceContribution(
      withSaved(["blink", "meku"]),
      withSaved(["meku"]),
    );
    expect(merged.saved.slugs.sort()).toEqual(["blink", "meku"]);
  });

  it("unions compare candidates", () => {
    const merged = mergeGuestWorkspaceContribution(
      withCompare(["v0"]),
      withCompare(["meku"]),
    );
    expect(merged.compare.slugs.sort()).toEqual(["meku", "v0"]);
  });

  it("empty guest does not erase account", () => {
    const merged = mergeGuestWorkspaceContribution(
      withSaved(["blink"]),
      createEmptyWorkspaceState(),
    );
    expect(merged.saved.slugs).toEqual(["blink"]);
  });

  it("empty account accepts guest", () => {
    const merged = mergeGuestWorkspaceContribution(
      createEmptyWorkspaceState(),
      withSaved(["meku"]),
    );
    expect(merged.saved.slugs).toEqual(["meku"]);
  });
});
