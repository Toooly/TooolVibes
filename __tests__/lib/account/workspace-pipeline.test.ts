import { describe, expect, it } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { recommendWorkspaceTools } from "@/lib/account/personalization";
import {
  chooseResumeAction,
  derivePersonalRecords,
  deriveResurfaceSignals,
  listPipelineItems,
  pipelineColumnForTool,
} from "@/lib/account/workspace-pipeline";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { normalizeWorkspaceState, reduceWorkspaceState } from "@/lib/discovery/workspace-contract";

const NOW = "2026-08-01T00:00:00.000Z";

describe("workspace pipeline", () => {
  it("maps existing stages and outcomes without new storage keys", () => {
    expect(pipelineColumnForTool({ stage: "saved", outcome: null })).toBe("salvato");
    expect(pipelineColumnForTool({ stage: "review", outcome: null })).toBe("da_valutare");
    expect(pipelineColumnForTool({ stage: "top", outcome: null })).toBe("candidato");
    expect(pipelineColumnForTool({ stage: "top", outcome: "selected" })).toBe("scelto");
    expect(pipelineColumnForTool({ stage: "saved", outcome: "rejected" })).toBe("scartato");
    expect(pipelineColumnForTool({ stage: "review", outcome: "deferred" })).toBe("rimandato");
  });

  it("prefers an open compare as the resume action", () => {
    expect(chooseResumeAction(workspaceTestFixtures.withCompare, NOW)).toEqual({
      kind: "continue_compare",
      slug: "cursor",
    });
  });

  it("resurfaces stale saved tools and deferred decisions", () => {
    const state = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "saved/set",
        slug: "cursor",
        saved: true,
        at: "2026-05-01T00:00:00.000Z",
      }),
      {
        type: "tool/decision",
        slug: "v0",
        outcome: "deferred",
        at: "2026-04-01T00:00:00.000Z",
      },
    );
    const withRevisit = reduceWorkspaceState(state, {
      type: "tool/revisit",
      slug: "v0",
      revisitAt: "2026-05-01T00:00:00.000Z",
      at: "2026-04-01T00:00:00.000Z",
    });

    const signals = deriveResurfaceSignals(withRevisit, NOW);
    expect(signals.some((item) => item.kind === "stale_saved" && item.slug === "cursor")).toBe(true);
    expect(signals.some((item) => item.kind === "deferred_due" && item.slug === "v0")).toBe(true);
  });

  it("lists pipeline items from saved membership", () => {
    const items = listPipelineItems(workspaceTestFixtures.withDecisions);
    expect(items.find((item) => item.slug === "cursor")?.column).toBe("scelto");
    expect(items.find((item) => item.slug === "v0")?.column).toBe("scartato");
  });

  it("includes note and active stack names on pipeline items", () => {
    const items = listPipelineItems(workspaceTestFixtures.mature);
    const cursor = items.find((item) => item.slug === "cursor");
    expect(cursor?.note).toBe("Scelto per il daily coding.");
    expect(cursor?.stackNames).toContain("AI Coding");
    expect(cursor?.pinned).toBe(true);
    const linear = items.find((item) => item.slug === "linear");
    expect(linear?.stackNames).toContain("Client stack");
    expect(linear?.note).toBeNull();
  });
});

describe("workspace personalization", () => {
  it("explains compare-category recommendations", () => {
    const recs = recommendWorkspaceTools({
      workspace: workspaceTestFixtures.withCompare,
      catalog: [
        { slug: "cursor", name: "Cursor", categoryLabel: "Coding" },
        { slug: "v0", name: "v0", categoryLabel: "Coding" },
        { slug: "windsurf", name: "Windsurf", categoryLabel: "Coding" },
      ],
    });

    expect(recs[0]).toMatchObject({
      slug: "windsurf",
      reason: "open_compare_category",
    });
  });

  it("matches engineering focus against real Italian catalog labels", () => {
    const recs = recommendWorkspaceTools({
      workspace: createEmptyWorkspaceState(),
      catalog: [
        { slug: "cursor", name: "Cursor", categoryLabel: "Coding AI / builder UI" },
        { slug: "jasper", name: "Jasper", categoryLabel: "Scrittura AI / ricerca" },
      ],
      focusArea: "engineering",
    });

    expect(recs[0]).toMatchObject({
      slug: "cursor",
      reason: "declared_focus",
    });
    expect(recs[0]?.detail).toContain("Engineering");
    expect(recs.map((item) => item.slug)).not.toContain("jasper");
  });

  it("uses primaryGoal as its own reason when focus does not fill the list", () => {
    const recs = recommendWorkspaceTools({
      workspace: createEmptyWorkspaceState(),
      catalog: [
        { slug: "jasper", name: "Jasper", categoryLabel: "Scrittura AI / ricerca" },
        { slug: "cursor", name: "Cursor", categoryLabel: "Coding AI / builder UI" },
      ],
      primaryGoal: "learn",
    });

    expect(recs[0]).toMatchObject({
      slug: "jasper",
      reason: "declared_goal",
      detail: "Per il tuo obiettivo: Capire il panorama",
    });
  });

  it("skips rejected slugs even when they are not saved", () => {
    const rejected = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/decision",
      slug: "v0",
      outcome: "rejected",
      at: NOW,
    });
    const recs = recommendWorkspaceTools({
      workspace: rejected,
      catalog: [
        { slug: "v0", name: "v0", categoryLabel: "Coding AI / builder UI" },
        { slug: "windsurf", name: "Windsurf", categoryLabel: "Coding AI / builder UI" },
      ],
      focusArea: "engineering",
    });

    expect(recs.map((item) => item.slug)).toEqual(["windsurf"]);
    expect(recs.every((item) => item.slug !== "v0")).toBe(true);
  });
});

describe("backward compatible workspace payloads", () => {
  it("normalizes a v1 payload without stacks or journal extras", () => {
    const normalized = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["cursor"], updatedAt: NOW },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        cursor: {
          stage: "saved",
          note: "prova",
          saveReason: "test",
          pinned: false,
          decision: null,
          updatedAt: NOW,
        },
      },
    });

    expect(normalized.personalStacks).toEqual([]);
    expect(normalized.toolStates.cursor).toMatchObject({
      note: "prova",
      useCase: null,
      alternatives: [],
      revisitAt: null,
    });
  });
});

describe("derivePersonalRecords", () => {
  it("hides zero vanity stats", () => {
    expect(derivePersonalRecords(createEmptyWorkspaceState()).map((item) => item.id)).toEqual([]);
  });
});

describe("decision loop resume", () => {
  it("prefers an open compare before deferred or candidate work", () => {
    expect(chooseResumeAction(workspaceTestFixtures.withCompare, NOW)).toEqual({
      kind: "continue_compare",
      slug: "cursor",
    });
  });

  it("resurfaces a due deferred decision after compare is clear", () => {
    const state = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "saved/set",
        slug: "v0",
        saved: true,
        at: "2026-04-01T00:00:00.000Z",
      }),
      {
        type: "tool/decision",
        slug: "v0",
        outcome: "deferred",
        at: "2026-04-01T00:00:00.000Z",
      },
    );
    const withRevisit = reduceWorkspaceState(state, {
      type: "tool/revisit",
      slug: "v0",
      revisitAt: "2026-07-01T00:00:00.000Z",
      at: "2026-04-01T00:00:00.000Z",
    });
    expect(chooseResumeAction(withRevisit, NOW)).toEqual({
      kind: "review_decision",
      slug: "v0",
    });
  });

  it("exposes revisitAt on pipeline items", () => {
    const state = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "saved/set",
        slug: "cursor",
        saved: true,
        at: NOW,
      }),
      {
        type: "tool/revisit",
        slug: "cursor",
        revisitAt: "2026-08-08T00:00:00.000Z",
        at: NOW,
      },
    );
    expect(listPipelineItems(state)[0]?.revisitAt).toBe("2026-08-08T00:00:00.000Z");
  });

  it("does not use a decided first save as fallback", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: NOW,
    });
    state = reduceWorkspaceState(state, {
      type: "saved/set",
      slug: "v0",
      saved: true,
      at: NOW,
    });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "cursor",
      outcome: "selected",
      at: NOW,
    });
    expect(chooseResumeAction(state, NOW)).toEqual({
      kind: "evaluate_saved",
      slug: "v0",
    });
  });

  it("treats review without verdict as unfinished evaluation", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: NOW,
    });
    state = reduceWorkspaceState(state, {
      type: "tool/stage",
      slug: "cursor",
      stage: "review",
      at: NOW,
    });
    expect(deriveResurfaceSignals(state, NOW).some((item) => item.kind === "review_without_verdict")).toBe(true);
    expect(chooseResumeAction(state, NOW)).toEqual({
      kind: "evaluate_saved",
      slug: "cursor",
    });
  });
});

describe("finished compare resume", () => {
  it("does not keep a finished compare as the resume action", () => {
    expect(chooseResumeAction(workspaceTestFixtures.withDecisions, NOW).kind).not.toBe(
      "continue_compare",
    );
  });
});
