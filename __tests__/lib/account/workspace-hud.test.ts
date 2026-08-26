import { describe, expect, it } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { readWorkspaceHud, workspaceHudInstruments } from "@/lib/account/workspace-hud";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";

describe("workspace HUD", () => {
  it("reads empty zeros without inventing work", () => {
    const hud = readWorkspaceHud(createEmptyWorkspaceState());
    expect(hud).toEqual({
      saved: 0,
      compare: 0,
      compareMax: 5,
      stacks: 0,
      using: 0,
      deciding: 0,
      traces: 0,
      pinned: 0,
    });
    expect(workspaceHudInstruments(hud).every((item) => item.active === false)).toBe(true);
  });

  it("surfaces mature workspace counts from existing state", () => {
    const hud = readWorkspaceHud(workspaceTestFixtures.mature);
    expect(hud.saved).toBe(52);
    expect(hud.stacks).toBeGreaterThan(0);
    expect(hud.traces).toBeGreaterThan(0);
    expect(hud.pinned).toBeGreaterThan(0);
    expect(hud.compareMax).toBe(5);
    const instruments = workspaceHudInstruments(hud);
    expect(instruments.map((item) => item.id)).toEqual([
      "saved",
      "compare",
      "stacks",
      "using",
      "deciding",
    ]);
    expect(instruments[0]?.href).toBe("/account?view=salvati");
  });
});
