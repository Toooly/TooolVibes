import { describe, expect, it } from "vitest";

import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import type { ProductHuntItem } from "@/lib/radar/product-hunt-contract";
import { listRadarPersonalSignals } from "@/lib/radar/radar-personal-signals";

const T0 = "2026-06-01T10:00:00.000Z";
const T1 = "2026-06-02T10:00:00.000Z";
const PAST = "2026-01-01T10:00:00.000Z";
const NOW = "2026-08-29T12:00:00.000Z";

const catalog = [
  { slug: "blink", name: "Blink", categoryLabel: "Vibe coding" },
  { slug: "weweb", name: "WeWeb", categoryLabel: "No-code" },
  { slug: "cursor", name: "Cursor", categoryLabel: "Vibe coding" },
];

function apply(actions: Parameters<typeof reduceWorkspaceState>[1][]) {
  return actions.reduce(
    (current, action) => reduceWorkspaceState(current, action),
    createEmptyWorkspaceState(),
  );
}

function ph(id: string, name: string, path: string): ProductHuntItem {
  return {
    id,
    name,
    tagline: name,
    votesCount: 10,
    commentsCount: 1,
    productHuntUrl: `https://www.producthunt.com/posts/${path}`,
  };
}

function signals(items: ProductHuntItem[], workspace: WorkspaceStateV1) {
  return listRadarPersonalSignals({
    items,
    workspace,
    catalog,
    nowIso: NOW,
  });
}

describe("radar personal signals", () => {
  it("RADAR-PERSONAL-01 empty workspace yields no signals", () => {
    expect(signals([ph("1", "Blink", "blink")], createEmptyWorkspaceState())).toEqual([]);
  });

  it("RADAR-PERSONAL-02 already saved", () => {
    const state = apply([{ type: "saved/set", slug: "blink", saved: true, at: T0 }]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("saved");
  });

  it("RADAR-PERSONAL-03 using", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      { type: "tool/usage", slug: "blink", usage: "using", at: T1 },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("using");
  });

  it("RADAR-PERSONAL-05 rejected beats saved", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "blink",
        outcome: "rejected",
        at: T1,
        eventId: "rej-1",
      },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("rejected");
  });

  it("RADAR-PERSONAL-06 stopped", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      { type: "tool/usage", slug: "blink", usage: "stopped", at: T1 },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("stopped");
  });

  it("RADAR-PERSONAL-07 replaced", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      { type: "saved/set", slug: "weweb", saved: true, at: T0 },
      { type: "tool/usage", slug: "blink", usage: "replaced", replacedBy: "weweb", at: T1 },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("replaced");
  });

  it("RADAR-PERSONAL-08 postponed", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "blink",
        outcome: "deferred",
        at: T1,
        eventId: "def-1",
      },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("postponed");
  });

  it("RADAR-PERSONAL-09 review due", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "blink",
        outcome: "deferred",
        at: PAST,
        eventId: "def-due",
      },
      { type: "tool/revisit", slug: "blink", revisitAt: PAST, at: PAST },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe("review-due");
  });

  it("RADAR-PERSONAL-10 stack membership", () => {
    const state = apply([
      { type: "saved/set", slug: "weweb", saved: true, at: T0 },
      { type: "stacks/create", id: "nocode", name: "No-code", at: T0 },
      { type: "stacks/add", id: "nocode", slug: "weweb", at: T1 },
    ]);
    const signal = signals([ph("2", "WeWeb", "weweb")], state)[0];
    expect(signal?.kind).toBe("stack");
    expect(signal?.explanation).toContain("No-code");
  });

  it("RADAR-PERSONAL-11 explicit alternative to using", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "blink",
        outcome: "selected",
        at: T1,
        eventId: "alt-1",
        alternatives: ["cursor"],
      },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)[0]?.kind).toBe(
      "alternative-to-using",
    );
  });

  it("RADAR-PERSONAL-12 category-only is insufficient", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state)).toEqual([]);
  });

  it("RADAR-PERSONAL-13 unmatched radar item never receives context", () => {
    const state = apply([{ type: "saved/set", slug: "blink", saved: true, at: T0 }]);
    expect(signals([ph("x", "Fixture Canvas", "fixture-canvas")], state)).toEqual([]);
  });

  it("RADAR-PERSONAL-15 output is stable", () => {
    const state = apply([{ type: "saved/set", slug: "blink", saved: true, at: T0 }]);
    const items = [ph("1", "Blink", "blink")];
    expect(signals(items, state)).toEqual(signals(items, state));
  });

  it("RADAR-PERSONAL-16 derive does not mutate workspace", () => {
    const state = apply([{ type: "saved/set", slug: "blink", saved: true, at: T0 }]);
    const before = JSON.stringify(state);
    signals([ph("1", "Blink", "blink")], state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("RADAR-PRIORITY-01 rejected beats saved", () => {
    const state = apply([
      { type: "saved/set", slug: "blink", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "blink",
        outcome: "rejected",
        at: T1,
        eventId: "rej-2",
      },
    ]);
    expect(signals([ph("1", "Blink", "blink")], state).map((item) => item.kind)).toEqual([
      "rejected",
    ]);
  });

  it("does not invent copy for public-only items", () => {
    const text = JSON.stringify(
      signals([ph("x", "Fixture Canvas", "fixture-canvas")], apply([])),
    );
    expect(text).not.toMatch(/Stack|scartato|nota/i);
  });
});
