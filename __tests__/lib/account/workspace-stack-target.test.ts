import { describe, expect, it } from "vitest";

import {
  leftoverLegacyStackSlugs,
  reduceAddToWorkingPersonalStack,
  reduceAdoptLegacyListaStack,
  workingPersonalStackSlugs,
} from "@/lib/account/workspace-stack-target";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";

const T0 = "2026-08-01T10:00:00.000Z";

describe("working personal stack target", () => {
  it("creates Lista and adopts leftover legacy slugs on first add", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stack/add",
      slug: "cursor",
      at: T0,
    });
    state = reduceAddToWorkingPersonalStack(state, "v0", T0);

    expect(leftoverLegacyStackSlugs(state)).toEqual([]);
    expect(workingPersonalStackSlugs(state)).toEqual(["cursor", "v0"]);
    expect(state.personalStacks[0]).toMatchObject({
      id: "lista",
      name: "Lista",
    });
    expect(state.stack.slugs).toEqual([]);
  });

  it("adds to the most recently updated existing personal stack", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "AI Coding",
      at: T0,
    });
    state = reduceAddToWorkingPersonalStack(state, "cursor", T0);
    expect(workingPersonalStackSlugs(state)).toEqual(["cursor"]);
    expect(state.personalStacks[0]?.id).toBe("ai-coding");
  });

  it("adopts leftover legacy slugs into Lista on demand", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stack/add",
      slug: "linear",
      at: T0,
    });
    expect(leftoverLegacyStackSlugs(state)).toEqual(["linear"]);
    state = reduceAdoptLegacyListaStack(state, T0);
    expect(leftoverLegacyStackSlugs(state)).toEqual([]);
    expect(workingPersonalStackSlugs(state)).toEqual(["linear"]);
  });
});
