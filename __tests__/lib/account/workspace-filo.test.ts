import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  commitWorkspaceDecision,
  markWorkspaceRevisited,
  reopenWorkspaceDecision,
  setWorkspaceRevisit,
} from "@/lib/account/workspace-actions";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  formatFiloSummary,
  humanizeFiloEvent,
  listFiloEvents,
  summarizeFilo,
} from "@/lib/account/workspace-filo";
import {
  HOME_REVIEW_CAP,
  chooseResumeAction,
  listHomeReviewQueue,
} from "@/lib/account/workspace-pipeline";
import { revisitAtFromPreset } from "@/lib/account/workspace-lifecycle";
import type {
  WorkspaceAction,
  WorkspaceRelationshipEvent,
  WorkspaceStateV1,
} from "@/lib/discovery/types";
import { MAX_RELATIONSHIP_EVENTS } from "@/lib/discovery/workspace-constants";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-01-01T10:00:00.000Z";
const T1 = "2026-02-01T10:00:00.000Z";
const T2 = "2026-03-01T10:00:00.000Z";
const T3 = "2026-04-01T10:00:00.000Z";
const NOW = "2026-08-01T00:00:00.000Z";

function apply(actions: WorkspaceAction[], start: WorkspaceStateV1 = createEmptyWorkspaceState()) {
  return actions.reduce((state, action) => reduceWorkspaceState(state, action), start);
}

function names(slug: string) {
  const catalog: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    linear: "Linear",
  };
  return catalog[slug] ?? slug;
}

function source(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("Filo selectors", () => {
  it("W10-T1 legacy snapshot without events keeps current state and fabricates no history", () => {
    const state = normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: null,
      saved: { slugs: ["cursor"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      personalStacks: [],
      toolStates: {
        cursor: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: { outcome: "selected", updatedAt: T0 },
          updatedAt: T0,
        },
      },
    });

    expect(state.events).toEqual([]);
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(listFiloEvents(state, "cursor")).toEqual([]);
    expect(summarizeFilo(state, "cursor")).toEqual({ count: 1, lastAt: T0 });
    expect(formatFiloSummary(summarizeFilo(state, "cursor"), false)).toBe("1 stato");
    expect(formatFiloSummary(summarizeFilo(state, "cursor"), false)).not.toMatch(/Deciso il/);
  });

  it("W10-T1b blank save-only has no Filo summary", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    expect(summarizeFilo(state, "cursor")).toEqual({ count: 0, lastAt: null });
    expect(formatFiloSummary(summarizeFilo(state, "cursor"), false)).toBeNull();
  });

  it("W10-T2 single decided becomes a human Filo line", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "decide-1",
      },
    ]);
    const events = listFiloEvents(state, "cursor");
    expect(events).toHaveLength(1);
    expect(humanizeFiloEvent(events[0]!, names).line).toBe("Scelto");
    expect(formatFiloSummary(summarizeFilo(state, "cursor"), true)).toMatch(/^1 evento/);
  });

  it("W10-T3 decided with reason, useCase and alts keeps optional context", () => {
    const state = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "decide-ctx",
        reason: "Per il daily",
        useCase: "pair programming",
        alternatives: ["cursor", "v0"],
      },
    ]);
    const line = humanizeFiloEvent(listFiloEvents(state, "cursor")[0]!, names).line;
    expect(line).toContain("Scelto");
    expect(line).toMatch(/pair programming|Per il daily|v0/);
  });

  it("W10-T4 reopen preserves the prior decided event", () => {
    const decided = apply([
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "decide-keep",
      },
    ]);
    const reopened = reduceWorkspaceState(decided, {
      type: "tool/decision",
      slug: "cursor",
      outcome: null,
      at: T2,
    });
    const types = listFiloEvents(reopened, "cursor").map((event) => event.type);
    expect(types).toEqual(["decided", "reopened"]);
    expect(reopened.events[0]?.id).toBe("decide-keep");
    expect(humanizeFiloEvent(reopened.events[1]!, names).line).toBe("Riaperta");
  });

  it("W10-T5 re-decide chain stays chronological", () => {
    const state = apply([
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "deferred",
        at: T1,
        eventId: "d1",
      },
      { type: "tool/decision", slug: "cursor", outcome: null, at: T2 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T3,
        eventId: "d2",
      },
    ]);
    expect(listFiloEvents(state, "cursor").map((event) => event.id)).toEqual([
      "d1",
      "reopened:cursor:2026-03-01T10:00:00.000Z",
      "d2",
    ]);
    expect(listFiloEvents(state, "cursor").map((event) => event.at)).toEqual([T1, T2, T3]);
  });

  it("W10-T6 usage events are humanized", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T1 },
      { type: "tool/usage", slug: "cursor", usage: "stopped", at: T2 },
    ]);
    const lines = listFiloEvents(state, "cursor").map(
      (event) => humanizeFiloEvent(event, names).line,
    );
    expect(lines).toEqual(["In uso", "Non in uso"]);
  });

  it("W10-T7 replacement is A → B with catalog names", () => {
    const state = apply([
      { type: "saved/set", slug: "linear", saved: true, at: T0 },
      {
        type: "tool/usage",
        slug: "linear",
        usage: "replaced",
        replacedBy: "cursor",
        at: T1,
      },
    ]);
    expect(humanizeFiloEvent(listFiloEvents(state, "linear")[0]!, names).line).toBe(
      "Linear → Cursor",
    );
  });

  it("W10-T8 revisit_set copy is not revisited copy", () => {
    const setLine = humanizeFiloEvent(
      {
        id: "set-1",
        type: "revisit_set",
        slug: "cursor",
        at: T1,
        revisitAt: T3,
      },
      names,
    ).line;
    const revisitedLine = humanizeFiloEvent(
      {
        id: "rev-1",
        type: "revisited",
        slug: "cursor",
        at: T2,
        revisitAt: T3,
      },
      names,
    ).line;
    expect(setLine).toMatch(/^Rivedi il /);
    expect(revisitedLine).toBe("Riconsiderata");
    expect(setLine).not.toBe(revisitedLine);
  });

  it("W10-T9 unknown slug falls back to the slug itself", () => {
    const line = humanizeFiloEvent(
      {
        id: "rep-1",
        type: "replaced",
        slug: "mystery-a",
        at: T1,
        replacementSlug: "mystery-b",
      },
      names,
    ).line;
    expect(line).toBe("mystery-a → mystery-b");
  });

  it("W10-T10 compact L2 stays one bounded line", () => {
    const summary = formatFiloSummary({ count: 12, lastAt: T3 }, true);
    expect(summary).toBeTruthy();
    expect(summary!.split("\n")).toHaveLength(1);
    expect(summary!.length).toBeLessThan(80);
    expect(summary).not.toMatch(/storia completa/);
  });

  it("W10-T12 unrelated events are excluded", () => {
    const state = apply([
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "c1",
      },
      {
        type: "workspace/decide",
        slug: "v0",
        outcome: "rejected",
        at: T1,
        eventId: "v1",
      },
    ]);
    expect(listFiloEvents(state, "cursor").every((event) => event.slug === "cursor")).toBe(
      true,
    );
    expect(listFiloEvents(state, "cursor")).toHaveLength(1);
  });

  it("W10-T13 a 200-event workspace still lists Filo for one slug", () => {
    const extras: WorkspaceRelationshipEvent[] = Array.from(
      { length: MAX_RELATIONSHIP_EVENTS },
      (_, index) => ({
        id: `evt-${String(index).padStart(3, "0")}`,
        type: "revisit_set",
        slug: "cursor",
        at: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: extras,
    });
    const events = listFiloEvents(state, "cursor");
    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(MAX_RELATIONSHIP_EVENTS);
    expect(formatFiloSummary(summarizeFilo(state, "cursor"), true)).not.toMatch(
      /storia completa/,
    );
  });

  it("W10-T17 Filo ordering is deterministic on equal timestamps", () => {
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [
        { id: "b", type: "revisited", slug: "cursor", at: T1 },
        { id: "a", type: "decided", slug: "cursor", at: T1, outcome: "selected" },
      ],
    });
    expect(listFiloEvents(state, "cursor").map((event) => event.id)).toEqual(["a", "b"]);
    expect(listFiloEvents(state, "cursor").map((event) => event.id)).toEqual(
      listFiloEvents(state, "cursor").map((event) => event.id),
    );
  });
});

describe("Review selector", () => {
  it("W10-T14 a future revisit is not due", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewFuture, { nowIso: NOW });
    expect(queue.some((item) => item.slug === "meku")).toBe(false);
  });

  it("W10-T15 a past revisit / deferred due item is due", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewDue, { nowIso: NOW });
    expect(queue.some((item) => item.kind === "deferred_due" && item.slug === "meku")).toBe(
      true,
    );
  });

  it("W10-T16 after Ancora vero the item is not falsely due", () => {
    const future = revisitAtFromPreset("3m", new Date(NOW).getTime());
    const next = reduceWorkspaceState(workspaceTestFixtures.reviewDue, {
      type: "workspace/revisited",
      slug: "meku",
      at: NOW,
      eventId: "still-true",
      revisitAt: future,
    });
    expect(next.toolStates.meku?.decision?.outcome).toBe("deferred");
    expect(listHomeReviewQueue(next, { nowIso: NOW }).some((item) => item.slug === "meku")).toBe(
      false,
    );
  });

  it("W10-T18 Home review cap stays 3", () => {
    expect(HOME_REVIEW_CAP).toBe(3);
    expect(
      listHomeReviewQueue(workspaceTestFixtures.reviewManyDue, { nowIso: NOW }),
    ).toHaveLength(3);
  });

  it("W10-T31 resume still outranks review", () => {
    expect(chooseResumeAction(workspaceTestFixtures.withCompare, NOW).kind).toBe(
      "continue_compare",
    );
    expect(chooseResumeAction(workspaceTestFixtures.reviewDue, NOW)).toEqual({
      kind: "review_decision",
      slug: "meku",
    });
  });
});

describe("Review writers", () => {
  it("W10-T19 Ancora vero appends revisited and a future revisitAt", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.reviewDue);
    const before = getCanonicalToolWorkspaceState().events.map((event) => event.id);
    markWorkspaceRevisited("meku", revisitAtFromPreset("3m"));
    const state = getCanonicalToolWorkspaceState();
    const revisited = state.events.filter((event) => event.type === "revisited");
    expect(revisited).toHaveLength(1);
    expect(state.toolStates.meku?.decision?.outcome).toBe("deferred");
    expect(new Date(state.toolStates.meku?.revisitAt as string).getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(before.every((id) => state.events.some((event) => event.id === id))).toBe(true);
    expect(state.schemaVersion).toBe(1);
  });

  it("W10-T20/T22 Non più reopens and keeps the old decided event", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "deferred",
      eventId: "old-decided",
    });
    const compareAfterDecide = getCanonicalToolWorkspaceState().compare.slugs;
    reopenWorkspaceDecision("cursor");
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBeNull();
    expect(state.events.some((event) => event.id === "old-decided")).toBe(true);
    expect(state.events.some((event) => event.type === "reopened")).toBe(true);
    expect(compareAfterDecide).toEqual([]);
    expect(state.compare.slugs).toEqual([]);
  });

  it("W10-T23 a new decide appends a second decided event", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    commitWorkspaceDecision({ slug: "cursor", outcome: "selected", eventId: "first" });
    reopenWorkspaceDecision("cursor");
    commitWorkspaceDecision({ slug: "cursor", outcome: "rejected", eventId: "second" });
    const decided = getCanonicalToolWorkspaceState().events.filter(
      (event) => event.type === "decided",
    );
    expect(decided.map((event) => event.id)).toEqual(["first", "second"]);
  });

  it("W10-T24 compare.slugs are not resurrected by review", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withCompare);
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "deferred",
      alternatives: ["v0"],
      eventId: "battle-decide",
    });
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    markWorkspaceRevisited("cursor", revisitAtFromPreset("3m"));
    setWorkspaceRevisit("cursor", revisitAtFromPreset("1w"));
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
  });

  it("W10-T33/T34 events stay append-only and schemaVersion stays 1", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    commitWorkspaceDecision({ slug: "cursor", outcome: "selected", eventId: "keep-me" });
    markWorkspaceRevisited("cursor", revisitAtFromPreset("3m"));
    const state = getCanonicalToolWorkspaceState();
    expect(state.events.some((event) => event.id === "keep-me")).toBe(true);
    expect(state.events.some((event) => event.type === "revisited")).toBe(true);
    expect(state.schemaVersion).toBe(1);
  });
});

describe("Wave 10 boundaries", () => {
  it("W10-T26/T27 Filo and Review are not LoopShell destinations", () => {
    const routes = source("lib/navigation/loop-routes.ts");
    expect(routes).toContain('"home" | "salvati" | "stack" | "catalogo"');
    expect(routes).not.toMatch(/id: "filo"/);
    expect(routes).not.toMatch(/id: "review"/);
    expect(routes).not.toMatch(/label: "Filo"/);
    expect(routes).not.toMatch(/label: "Review"/);
  });

  it("W10-T28 Filo does not read deriveWorkspaceActivity", () => {
    expect(source("lib/account/workspace-filo.ts")).not.toContain("deriveWorkspaceActivity");
    expect(source("components/account/workspace/filo.tsx")).not.toContain(
      "deriveWorkspaceActivity",
    );
  });

  it("W10-T29 view=decisioni still aliases Home", () => {
    expect(source("components/account/workspace/workspace-shell.tsx")).toContain(
      'requestedView === "decisioni" ? "riprendi"',
    );
  });

  it("W10-T30 review eligibility is not from Signal", () => {
    expect(source("lib/account/workspace-pipeline.ts")).not.toContain("signal-progression");
    expect(source("lib/account/workspace-filo.ts")).not.toContain("signal-progression");
  });

  it("W10-T32 DecisionSheet remains the sole decide form", () => {
    const sheet = source("components/account/workspace/decision-sheet.tsx");
    const home = source("components/account/workspace/workspace-riprendi.tsx");
    const filo = source("components/account/workspace/filo.tsx");
    expect(sheet).toContain("commitWorkspaceDecision");
    expect(home).not.toContain("commitWorkspaceDecision");
    expect(home).not.toContain("ReviewDecisionForm");
    expect(filo).not.toContain("commitWorkspaceDecision");
    expect(home).toContain("Ancora vero");
    expect(home).toContain("Non più");
    expect(home).toContain("Rimanda");
  });
});
