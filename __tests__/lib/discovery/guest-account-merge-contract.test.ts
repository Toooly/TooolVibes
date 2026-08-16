import { describe, expect, it } from "vitest";

import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";

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

  it("unions personal stacks by id and keeps the account stack on collision", () => {
    const at = "2026-08-15T12:00:00.000Z";
    const account = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "Account stack",
      at,
    });
    const guest = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "stacks/create",
        id: "ai-coding",
        name: "Guest stack",
        at,
      }),
      {
        type: "stacks/create",
        id: "free-stack",
        name: "Free stack",
        at,
      },
    );

    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.personalStacks.map((stack) => stack.id).sort()).toEqual([
      "ai-coding",
      "free-stack",
    ]);
    expect(
      merged.personalStacks.find((stack) => stack.id === "ai-coding")?.name,
    ).toBe("Account stack");
  });
