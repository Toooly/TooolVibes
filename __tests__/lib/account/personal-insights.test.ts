import { describe, expect, it } from "vitest";

import {
  derivePersonalInsights,
  derivePersonalInsightsForSlugs,
  MAX_COMPARE_INSIGHTS,
  MAX_TOOL_PAGE_INSIGHTS,
} from "@/lib/account/personal-insights";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

const T0 = "2026-06-01T10:00:00.000Z";
const T1 = "2026-06-02T10:00:00.000Z";
const PAST = "2026-01-01T10:00:00.000Z";
const FUTURE = "2027-01-01T10:00:00.000Z";
const NOW = "2026-08-29T12:00:00.000Z";

const catalog = [
  { slug: "cursor", name: "Cursor", categoryLabel: "Vibe coding" },
  { slug: "windsurf", name: "Windsurf", categoryLabel: "Vibe coding" },
  { slug: "descript", name: "Descript", categoryLabel: "Video" },
  { slug: "riverside", name: "Riverside", categoryLabel: "Video" },
  { slug: "v0", name: "v0", categoryLabel: "AI app builder" },
] as const;

function apply(
  actions: Parameters<typeof reduceWorkspaceState>[1][],
  base: WorkspaceStateV1 = createEmptyWorkspaceState(),
) {
  return actions.reduce(
    (current, action) => reduceWorkspaceState(current, action),
    base,
  );
}

function insights(slug: string, state: WorkspaceStateV1, limit = MAX_TOOL_PAGE_INSIGHTS) {
  return derivePersonalInsights({
    toolSlug: slug,
    workspace: state,
    catalog,
    nowIso: NOW,
    limit,
  });
}

describe("personal insight engine", () => {
  it("INSIGHT-ENGINE-01 empty workspace yields zero insights", () => {
    expect(insights("cursor", createEmptyWorkspaceState())).toEqual([]);
  });

  it("INSIGHT-ENGINE-02/03 stable output and ids", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    const first = insights("cursor", state);
    const second = insights("cursor", state);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(first[0]?.id).toBe("FIT:cursor:using");
  });

  it("INSIGHT-ENGINE-04/06 priority and max visible", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "windsurf", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "rejected",
        at: T1,
        eventId: "rej-1",
      },
      { type: "tool/usage", slug: "windsurf", usage: "using", at: T1 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.length).toBeLessThanOrEqual(MAX_TOOL_PAGE_INSIGHTS);
    expect(result[0]?.type).toBe("WHY_NOT");
    expect(result.some((item) => item.type === "ALREADY_KNOW")).toBe(false);
  });

  it("INSIGHT-ENGINE-07 derive does not mutate workspace", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    const before = JSON.stringify(state);
    insights("cursor", state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("INSIGHT-ENGINE-08 unknown catalog is safe", () => {
    const state = apply([{ type: "saved/set", slug: "ghost", saved: true, at: T0 }]);
    const result = derivePersonalInsights({
      toolSlug: "ghost",
      workspace: state,
      catalog: [],
      nowIso: NOW,
    });
    expect(result[0]?.type).toBe("ALREADY_KNOW");
    expect(result.every((item) => typeof item.explanation === "string")).toBe(true);
  });

  it("FIT-01 using tool", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.type === "FIT" && item.explanation === "Lo usi già.")).toBe(
      true,
    );
  });

  it("FIT-02 selected tool", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "sel-1",
      },
    ]);
    const text = insights("cursor", state).map((item) => item.explanation).join(" ");
    expect(text.toLowerCase()).toContain("scelt");
  });

  it("FIT-03 stack membership folds into using copy", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
      { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.explanation === "Lo usi già nello Stack AI Coding.")).toBe(
      true,
    );
    expect(result.some((item) => item.type === "STACK_FIT")).toBe(false);
  });

  it("FIT-04 same category only does not claim perfect fit", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    ]);
    const result = insights("windsurf", state);
    expect(result.some((item) => /perfett|consigliamo|92%/i.test(item.explanation))).toBe(
      false,
    );
    expect(result.some((item) => item.type === "FIT")).toBe(false);
  });

  it("WHYNOT-01 rejected", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "rejected",
        at: T1,
        eventId: "rej-2",
      },
    ]);
    expect(insights("cursor", state)[0]?.type).toBe("WHY_NOT");
    expect(insights("cursor", state)[0]?.explanation).toContain("scartato");
  });

  it("WHYNOT-02 stopped", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "stopped", at: T1 },
    ]);
    expect(insights("cursor", state)[0]?.explanation).toBe("Non lo usi più.");
  });

  it("WHYNOT-03 replaced is replacement not why-not", () => {
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
    const result = insights("cursor", state);
    expect(result.some((item) => item.type === "REPLACEMENT")).toBe(true);
    expect(result.some((item) => item.type === "WHY_NOT")).toBe(false);
  });

  it("WHYNOT-04 does not read note sentiment", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "expensive and bad", at: T0 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.type === "WHY_NOT")).toBe(false);
    expect(result.some((item) => item.explanation.includes("expensive"))).toBe(false);
  });

  it("KNOWN-01 saved only", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    expect(insights("cursor", state)[0]).toMatchObject({
      type: "ALREADY_KNOW",
      explanation: "È già nei Salvati.",
    });
  });

  it("KNOWN-05 stronger insight suppresses already-know", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    expect(insights("cursor", state).some((item) => item.type === "ALREADY_KNOW")).toBe(
      false,
    );
  });

  it("OVERLAP-01 explicit alternative to currently-used tool", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "windsurf", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
      {
        type: "workspace/decide",
        slug: "windsurf",
        outcome: "selected",
        at: T1,
        eventId: "alt-1",
        alternatives: ["cursor"],
      },
    ]);
    const result = insights("windsurf", state);
    expect(result.some((item) => item.type === "REPLACEMENT" || item.type === "OVERLAP")).toBe(
      true,
    );
    expect(result.map((item) => item.explanation).join(" ")).toContain("Cursor");
    expect(result.map((item) => item.explanation).join(" ")).not.toMatch(/dovresti sostituire/i);
  });

  it("OVERLAP-03 same broad category only below threshold", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    expect(insights("windsurf", state).some((item) => item.type === "OVERLAP")).toBe(false);
  });

  it("OVERLAP-04 no self overlap", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    expect(
      insights("cursor", state).some((item) => item.explanation.includes("Cursor") && item.type === "OVERLAP"),
    ).toBe(false);
  });

  it("STACK-INSIGHT-01 already in stack", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.explanation === "Fa già parte dello Stack AI Coding.")).toBe(
      true,
    );
  });

  it("STACK-INSIGHT-04 no predictive add-to-stack claim", () => {
    const state = apply([
      { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => /dovresti aggiunger/i.test(item.explanation))).toBe(false);
    expect(result.some((item) => item.type === "STACK_FIT")).toBe(false);
  });

  it("REPLACE-01 explicit replacedBy", () => {
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
    expect(insights("cursor", state)[0]?.explanation).toContain("Windsurf");
  });

  it("DECISION-INSIGHT-04 review due", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "deferred",
        at: T0,
        eventId: "def-1",
      },
      { type: "tool/revisit", slug: "cursor", revisitAt: PAST, at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result[0]?.type).toBe("DECISION_CONTEXT");
    expect(result[0]?.explanation).toContain("da rivedere");
  });

  it("DECISION-INSIGHT-05 future revisit is postponed not due", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "deferred",
        at: T0,
        eventId: "def-2",
      },
      { type: "tool/revisit", slug: "cursor", revisitAt: FUTURE, at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.explanation === "Lo avevi rimandato.")).toBe(true);
    expect(result.some((item) => item.explanation.includes("da rivedere"))).toBe(false);
  });

  it("DECISION-INSIGHT-07 long reason is clamped", () => {
    const reason = "x".repeat(200);
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "rejected",
        reason,
        at: T1,
        eventId: "rej-long",
      },
    ]);
    const explanation = insights("cursor", state)[0]?.explanation ?? "";
    expect(explanation.length).toBeLessThan(reason.length);
    expect(explanation).toContain("…");
  });

  it("CONTRA-01 chosen then stopped prefers current usage", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T0,
        eventId: "sel-then-stop",
      },
      { type: "tool/usage", slug: "cursor", usage: "stopped", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result[0]?.type).toBe("WHY_NOT");
    expect(result.some((item) => item.type === "FIT")).toBe(false);
  });

  it("CONTRA-04 old rejected then using prefers current usage", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "rejected",
        at: T0,
        eventId: "rej-then-use",
      },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(result.some((item) => item.type === "FIT")).toBe(true);
    expect(result.some((item) => item.type === "WHY_NOT")).toBe(false);
  });

  it("RECENT_SIGNAL stays inactive", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "sel-signal",
      },
    ]);
    expect(insights("cursor", state).some((item) => item.type === "RECENT_SIGNAL")).toBe(
      false,
    );
  });

  it("compare limit is one insight", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "windsurf", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
      {
        type: "workspace/decide",
        slug: "windsurf",
        outcome: "rejected",
        at: T1,
        eventId: "rej-cmp",
        alternatives: ["cursor"],
      },
      { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "windsurf", at: T1 },
    ]);
    const map = derivePersonalInsightsForSlugs({
      slugs: ["windsurf"],
      workspace: state,
      catalog,
      nowIso: NOW,
      limit: MAX_COMPARE_INSIGHTS,
    });
    expect(map.get("windsurf")).toHaveLength(1);
    expect(map.get("windsurf")?.[0]?.type).toBe("WHY_NOT");
  });

  it("no winner or score fields", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
    ]);
    const result = insights("cursor", state);
    expect(JSON.stringify(result)).not.toMatch(/best for you|winner|87\/100|match percentage/i);
    expect(result.every((item) => !("score" in item) && !("confidence" in item))).toBe(true);
  });
});
