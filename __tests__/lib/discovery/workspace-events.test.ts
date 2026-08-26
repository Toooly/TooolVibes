import { describe, expect, it } from "vitest";

import { buildWorkspaceExportPayload } from "@/lib/account/workspace-export";
import { MAX_RELATIONSHIP_EVENTS } from "@/lib/discovery/workspace-constants";
import {
  createEmptyWorkspaceState,
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";
import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import type { WorkspaceAction, WorkspaceRelationshipEvent } from "@/lib/discovery/types";

const T0 = "2026-08-26T10:00:00.000Z";
const T1 = "2026-08-26T11:00:00.000Z";
const T2 = "2026-08-26T12:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function decidedEvent(
  overrides: Partial<WorkspaceRelationshipEvent> = {},
): WorkspaceRelationshipEvent {
  return {
    id: "evt-decided-cursor",
    type: "decided",
    slug: "cursor",
    at: T1,
    outcome: "selected",
    alternatives: ["cursor", "v0"],
    ...overrides,
  };
}

describe("relationship events — normalize / persist", () => {
  it("T1: legacy blob without events loads as events = []", () => {
    const state = normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: null,
      saved: { slugs: ["cursor"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      personalStacks: [],
      toolStates: {},
    });

    expect(state.events).toEqual([]);
    expect(state.saved.slugs).toEqual(["cursor"]);
    expect(state.schemaVersion).toBe(1);
  });

  it("T2: events survive normalize roundtrip", () => {
    const event = decidedEvent();
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [event],
    });
    expect(state.events).toEqual([event]);
    expect(normalizeWorkspaceState(state).events).toEqual([event]);
  });

  it("T16: does not backfill decided events from legacy snapshot decisions", () => {
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

    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.events).toEqual([]);
  });

  it("drops malformed events and duplicate ids", () => {
    const event = decidedEvent();
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [event, { ...event, slug: "v0" }, { type: "decided" }, null],
    });
    expect(state.events).toEqual([event]);
  });

  it("caps events at MAX_RELATIONSHIP_EVENTS without dropping latest decided", () => {
    const extras: WorkspaceRelationshipEvent[] = Array.from(
      { length: MAX_RELATIONSHIP_EVENTS + 5 },
      (_, index) => ({
        id: `revisit-${index}`,
        type: "revisit_set",
        slug: "cursor",
        at: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const decided = decidedEvent({ at: "2026-12-01T00:00:00.000Z" });
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [...extras, decided],
    });
    expect(state.events).toHaveLength(MAX_RELATIONSHIP_EVENTS);
    expect(state.events.some((item) => item.id === decided.id)).toBe(true);
  });
});

describe("relationship events — reopen / replace / revisit", () => {
  it("T9: reopen appends history and keeps the prior decided event", () => {
    const decided = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "decide-1",
      },
    ]);
    const reopened = reduceWorkspaceState(decided, {
      type: "tool/decision",
      slug: "cursor",
      outcome: null,
      at: T2,
    });

    expect(reopened.toolStates.cursor?.decision?.outcome).toBeNull();
    expect(reopened.events.map((event) => event.type)).toEqual([
      "decided",
      "reopened",
    ]);
    expect(reopened.events[0]?.id).toBe("decide-1");
  });

  it("T10: replace writes snapshot pointer and a replaced event", () => {
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
    expect(state.toolStates.linear?.replacedBy).toBe("cursor");
    expect(state.events).toEqual([
      {
        id: "replaced:linear:2026-08-26T11:00:00.000Z",
        type: "replaced",
        slug: "linear",
        at: T1,
        replacementSlug: "cursor",
      },
    ]);
  });

  it("T11: revisit snapshot and event stay consistent", () => {
    const state = apply([
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "tool/revisit", slug: "v0", revisitAt: T2, at: T1 },
    ]);
    expect(state.toolStates.v0?.revisitAt).toBe(T2);
    expect(state.events[0]).toMatchObject({
      type: "revisit_set",
      slug: "v0",
      revisitAt: T2,
    });
  });
});

describe("relationship events — merge / export / reset", () => {
  it("T12/T13: attach unions events by id without duplicates", () => {
    const shared = decidedEvent({ id: "shared-decide" });
    const account = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [shared, decidedEvent({ id: "account-only", slug: "linear" })],
    });
    const guest = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [shared, decidedEvent({ id: "guest-only", slug: "v0" })],
    });

    const merged = mergeGuestWorkspaceContribution(account, guest);
    const ids = merged.events.map((event) => event.id).sort();
    expect(ids).toEqual(["account-only", "guest-only", "shared-decide"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sync merge unions events by id", () => {
    const left = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [decidedEvent({ id: "left" })],
    });
    const right = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [decidedEvent({ id: "right", slug: "v0" })],
    });
    expect(
      mergeWorkspaceStates(left, right).events.map((event) => event.id).sort(),
    ).toEqual(["left", "right"]);
  });

  it("T14: export includes events", () => {
    const state = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [decidedEvent()],
    });
    const payload = buildWorkspaceExportPayload(state, new Date(T2));
    expect(payload.state.events).toEqual(state.events);
  });

  it("T15: reset clears events", () => {
    const seeded = normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      events: [decidedEvent()],
    });
    const cleared = reduceWorkspaceState(seeded, {
      type: "workspace/clear",
      at: T2,
    });
    expect(cleared.events).toEqual([]);
    expect(cleared.clearedAt).toBe(T2);
  });
});
