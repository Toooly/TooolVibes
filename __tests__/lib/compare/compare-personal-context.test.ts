import { describe, expect, it } from "vitest";

import {
  comparePersonalL1Chips,
  deriveComparePersonalContext,
  listComparePersonalContexts,
} from "@/lib/compare/compare-personal-context";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

const T0 = "2026-06-01T10:00:00.000Z";
const T1 = "2026-06-02T10:00:00.000Z";
const PAST = "2026-01-01T10:00:00.000Z";
const FUTURE = "2027-01-01T10:00:00.000Z";
const NOW = "2026-08-29T12:00:00.000Z";

function apply(
  actions: Parameters<typeof reduceWorkspaceState>[1][],
  base: WorkspaceStateV1 = createEmptyWorkspaceState(),
) {
  return actions.reduce(
    (current, action) => reduceWorkspaceState(current, action),
    base,
  );
}

const names = (slug: string) =>
  ({ cursor: "Cursor", windsurf: "Windsurf", v0: "v0" }[slug] ?? slug);

describe("compare personal context derivation", () => {
  it("DEEP-DATA-01 unknown tool has no personal fact", () => {
    const context = deriveComparePersonalContext(
      createEmptyWorkspaceState(),
      "ghost",
      names,
      NOW,
    );
    expect(context.hasPersonalFact).toBe(false);
    expect(comparePersonalL1Chips(context)).toEqual([]);
  });

  it("DEEP-DATA-02 saved relationship", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.saved).toBe(true);
    expect(context.relationship).toEqual({ key: "saved", label: "Salvato" });
  });

  it("DEEP-DATA-03/04 decision selected", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "decide-cursor-1",
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.decision).toBe("selected");
    expect(context.relationship?.label).toBe("Scelto");
  });

  it("DEEP-DATA-05 decision reason stays on the event", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "nota privata", at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        reason: "per il daily",
        at: T1,
        eventId: "decide-cursor-reason",
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.note).toBe("nota privata");
    expect(context.decisionReason).toBe("per il daily");
  });

  it("DEEP-DATA-06 usage using", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.usage).toBe("using");
    expect(context.relationship?.label).toBe("In uso");
  });

  it("DEEP-DATA-07 usage stopped", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "stopped", at: T1 },
    ]);
    expect(deriveComparePersonalContext(state, "cursor", names, NOW).usage).toBe(
      "stopped",
    );
  });

  it("DEEP-DATA-08/09 replacedBy", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "windsurf", saved: true, at: T0 },
      {
        type: "tool/usage",
        slug: "cursor",
        usage: "replaced",
        replacedBy: "windsurf",
        at: T1,
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.usage).toBe("replaced");
    expect(context.replacedBy).toBe("windsurf");
    expect(context.replacedByName).toBe("Windsurf");
  });

  it("DEEP-DATA-10/11 stack memberships", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
      {
        type: "stacks/create",
        id: "content",
        name: "Content",
        description: null,
        at: T1,
      },
      { type: "stacks/add", id: "content", slug: "cursor", at: T1 },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.stackNames).toEqual(["AI Coding", "Content"]);
    expect(context.stackContext).toBe("AI Coding +1");
  });

  it("DEEP-DATA-12 note excerpt", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "pricing alto per il team", at: T1 },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.note).toBe("pricing alto per il team");
    expect(context.noteExcerpt).toBe("pricing alto per il team");
    expect(comparePersonalL1Chips(context).some((chip) => chip.key === "note")).toBe(
      true,
    );
  });

  it("DEEP-DATA-13 review due", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "deferred",
        revisitAt: PAST,
        at: T1,
        eventId: "defer-cursor",
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.reviewDue).toBe(true);
    expect(context.relationship?.label).toBe("Rimandato");
  });

  it("DEEP-DATA-14 revisit future is not due", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "deferred",
        revisitAt: FUTURE,
        at: T1,
        eventId: "defer-future",
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.reviewDue).toBe(false);
    expect(context.revisitAt).toBe(FUTURE);
  });

  it("DEEP-DATA-15 history line", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "hist-1",
      },
    ]);
    const context = deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(context.lastEventLine).toBe("Scelto");
  });

  it("DEEP-DATA-16 mixed contexts", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "daily", at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T1 },
      { type: "compare/toggle", slug: "v0", at: T1 },
    ]);
    const [cursor, v0] = listComparePersonalContexts(
      state,
      ["cursor", "v0"],
      names,
      NOW,
    );
    expect(cursor?.hasPersonalFact).toBe(true);
    expect(v0?.hasPersonalFact).toBe(false);
  });

  it("DEEP-DATA-17 derive does not mutate workspace", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "daily", at: T1 },
    ]);
    const before = JSON.stringify(state);
    deriveComparePersonalContext(state, "cursor", names, NOW);
    expect(JSON.stringify(state)).toBe(before);
  });
});
