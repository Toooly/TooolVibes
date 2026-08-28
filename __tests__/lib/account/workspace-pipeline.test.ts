import { describe, expect, it } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { recommendWorkspaceTools } from "@/lib/account/personalization";
import {
  chooseResumeAction,
  composeHomeWorkspace,
  derivePersonalRecords,
  deriveResurfaceSignals,
  HOME_RADAR_CAP,
  HOME_REVIEW_CAP,
  HOME_STACKS_CAP,
  HOME_UNFILED_CAP,
  HOME_UNFINISHED_CAP,
  listHomeActiveStacks,
  listHomeReviewQueue,
  listHomeUnfinishedQueue,
  listPipelineItems,
  listUnfiledSaved,
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
    expect(cursor?.usage).toBe("using");
    expect(cursor?.compareObjective).toBe("save-time");
    const linear = items.find((item) => item.slug === "linear");
    expect(linear?.stackNames).toContain("Client stack");
    expect(linear?.note).toBeNull();
    expect(linear?.usage).toBe("replaced");
    expect(linear?.replacedBy).toBe("cursor");
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
      usage: null,
      replacedBy: null,
      compareObjective: null,
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
    state = reduceWorkspaceState(state, {
      type: "tool/usage",
      slug: "cursor",
      usage: "using",
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

describe("software memory resume", () => {
  it("asks to confirm usage after a selected tool with no open candidate", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: NOW,
    });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "cursor",
      outcome: "selected",
      at: NOW,
    });
    expect(deriveResurfaceSignals(state, NOW).some((item) => item.kind === "selected_follow_up")).toBe(true);
    expect(chooseResumeAction(state, NOW)).toEqual({
      kind: "confirm_usage",
      slug: "cursor",
    });
  });

  it("prefers a candidate without verdict over usage confirmation", () => {
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
    state = reduceWorkspaceState(state, {
      type: "tool/stage",
      slug: "v0",
      stage: "top",
      at: NOW,
    });
    expect(chooseResumeAction(state, NOW)).toEqual({
      kind: "close_decision",
      slug: "v0",
    });
  });

  it("keeps unfinished compare ahead of usage confirmation", () => {
    expect(chooseResumeAction(workspaceTestFixtures.mature, NOW)).toEqual({
      kind: "continue_compare",
      slug: "cursor",
    });
    expect(chooseResumeAction(workspaceTestFixtures.withCompare, NOW)).toEqual({
      kind: "continue_compare",
      slug: "cursor",
    });
  });
});

describe("listHomeReviewQueue", () => {
  it("does not include a future revisit", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewFuture, { nowIso: NOW });
    expect(queue.some((item) => item.slug === "meku")).toBe(false);
  });

  it("includes a past revisit", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewDue, { nowIso: NOW });
    expect(queue.some((item) => item.kind === "deferred_due" && item.slug === "meku")).toBe(true);
  });

  it("caps the queue at 3", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewManyDue, {
      nowIso: NOW,
      cap: 3,
    });
    expect(queue).toHaveLength(3);
  });

  it("excludes a slug from the queue", () => {
    const queue = listHomeReviewQueue(workspaceTestFixtures.reviewManyDue, {
      nowIso: NOW,
      excludeSlug: "meku",
      cap: 3,
    });
    expect(queue.every((item) => item.slug !== "meku")).toBe(true);
    expect(queue).toHaveLength(3);
  });

  it("W10-T16 future revisitAt after revisited drops a 90d-old deferred item", () => {
    const future = "2099-01-01T00:00:00.000Z";
    const next = reduceWorkspaceState(workspaceTestFixtures.reviewDue, {
      type: "workspace/revisited",
      slug: "meku",
      at: NOW,
      eventId: "still-true",
      revisitAt: future,
    });
    expect(listHomeReviewQueue(next, { nowIso: NOW }).some((item) => item.slug === "meku")).toBe(
      false,
    );
  });

  it("W10-T18 preserves HOME_REVIEW_CAP of 3", () => {
    expect(HOME_REVIEW_CAP).toBe(3);
    expect(
      listHomeReviewQueue(workspaceTestFixtures.reviewManyDue, { nowIso: NOW, cap: HOME_REVIEW_CAP }),
    ).toHaveLength(3);
  });
});

describe("listHomeUnfinishedQueue", () => {
  it("excludes the resume slug and does not duplicate the primary relationship", () => {
    const resume = chooseResumeAction(workspaceTestFixtures.withCompare, NOW);
    const queue = listHomeUnfinishedQueue(workspaceTestFixtures.withCompare, {
      nowIso: NOW,
      resume,
    });
    expect(resume).toEqual({ kind: "continue_compare", slug: "cursor" });
    expect(queue.every((item) => item.slug !== "cursor")).toBe(true);
    expect(queue.every((item) => item.slug !== "v0")).toBe(true);
  });

  it("when resume is continue_compare, excludes every compare slug", () => {
    const resume = chooseResumeAction(workspaceTestFixtures.mature, NOW);
    expect(resume.kind).toBe("continue_compare");
    const queue = listHomeUnfinishedQueue(workspaceTestFixtures.mature, {
      nowIso: NOW,
      resume,
    });
    for (const slug of workspaceTestFixtures.mature.compare.slugs) {
      expect(queue.some((item) => item.slug === slug)).toBe(false);
    }
  });

  it("does not take deferred_due items (owned by Da rivedere)", () => {
    const resume = chooseResumeAction(workspaceTestFixtures.reviewDue, NOW);
    const queue = listHomeUnfinishedQueue(workspaceTestFixtures.reviewDue, {
      nowIso: NOW,
      resume,
    });
    expect(queue.some((item) => item.slug === "meku")).toBe(false);
  });

  it("follows kind priority then leftover saved without verdict, capped at 3", () => {
    let state = createEmptyWorkspaceState();
    const slugs = ["top-a", "top-b", "follow", "review-a", "stale", "open-a", "open-b"];
    for (const slug of slugs) {
      state = reduceWorkspaceState(state, {
        type: "saved/set",
        slug,
        saved: true,
        at: slug === "stale" ? "2026-05-01T00:00:00.000Z" : NOW,
      });
    }
    state = reduceWorkspaceState(state, { type: "tool/stage", slug: "top-a", stage: "top", at: NOW });
    state = reduceWorkspaceState(state, { type: "tool/stage", slug: "top-b", stage: "top", at: NOW });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "follow",
      outcome: "selected",
      at: NOW,
    });
    state = reduceWorkspaceState(state, {
      type: "tool/stage",
      slug: "review-a",
      stage: "review",
      at: NOW,
    });

    const resume = chooseResumeAction(state, NOW);
    expect(resume).toEqual({ kind: "close_decision", slug: "top-a" });
    const queue = listHomeUnfinishedQueue(state, { nowIso: NOW, resume, cap: HOME_UNFINISHED_CAP });
    expect(queue).toHaveLength(3);
    expect(queue.map((item) => item.kind)).toEqual([
      "top_without_verdict",
      "selected_follow_up",
      "review_without_verdict",
    ]);
    expect(queue.map((item) => item.slug)).toEqual(["top-b", "follow", "review-a"]);
  });

  it("fills leftover saved with outcome null after resurface kinds", () => {
    let state = createEmptyWorkspaceState();
    state = reduceWorkspaceState(state, { type: "saved/set", slug: "first", saved: true, at: NOW });
    state = reduceWorkspaceState(state, { type: "saved/set", slug: "second", saved: true, at: NOW });
    state = reduceWorkspaceState(state, { type: "saved/set", slug: "third", saved: true, at: NOW });
    const resume = chooseResumeAction(state, NOW);
    expect(resume).toEqual({ kind: "evaluate_saved", slug: "first" });
    const queue = listHomeUnfinishedQueue(state, { nowIso: NOW, resume });
    expect(queue.map((item) => item.slug)).toEqual(["second", "third"]);
    expect(queue.every((item) => item.kind === "saved_open")).toBe(true);
  });

  it("returns an empty list when nothing remains", () => {
    const resume = chooseResumeAction(workspaceTestFixtures.quietReturning, NOW);
    expect(resume.kind).toBe("empty");
    expect(
      listHomeUnfinishedQueue(workspaceTestFixtures.quietReturning, { nowIso: NOW, resume }),
    ).toEqual([]);
  });
});

describe("listHomeActiveStacks", () => {
  it("returns active personal stacks sorted by updatedAt desc", () => {
    const stacks = listHomeActiveStacks(workspaceTestFixtures.mature);
    expect(stacks.map((stack) => stack.id)).toEqual(["free-stack", "client-stack", "ai-coding"]);
  });

  it("caps at HOME_STACKS_CAP", () => {
    expect(HOME_STACKS_CAP).toBe(4);
    let state = createEmptyWorkspaceState();
    for (let index = 0; index < 6; index += 1) {
      const id = `stack-${index}`;
      state = reduceWorkspaceState(state, {
        type: "stacks/create",
        id,
        name: `Stack ${index}`,
        at: `2026-06-0${index + 1}T10:00:00.000Z`,
      });
    }
    expect(listHomeActiveStacks(state)).toHaveLength(4);
    expect(listHomeActiveStacks(state)[0]?.id).toBe("stack-5");
  });

  it("returns empty when there are no active stacks", () => {
    expect(listHomeActiveStacks(workspaceTestFixtures.withSaved)).toEqual([]);
  });
});

describe("listUnfiledSaved", () => {
  it("keeps only saved, undecided, unstacked tools at stage saved", () => {
    const items = listUnfiledSaved(workspaceTestFixtures.withStacks);
    expect(items.map((item) => item.slug)).toEqual([]);
  });

  it("excludes stacked, decided, and excludeSlugs", () => {
    let state = createEmptyWorkspaceState();
    for (const slug of ["alpha", "beta", "gamma", "delta", "epsilon"]) {
      state = reduceWorkspaceState(state, { type: "saved/set", slug, saved: true, at: NOW });
    }
    state = reduceWorkspaceState(state, {
      type: "stacks/create",
      id: "pack",
      name: "Pack",
      at: NOW,
    });
    state = reduceWorkspaceState(state, { type: "stacks/add", id: "pack", slug: "beta", at: NOW });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "gamma",
      outcome: "selected",
      at: NOW,
    });
    state = reduceWorkspaceState(state, { type: "tool/stage", slug: "delta", stage: "top", at: NOW });

    const items = listUnfiledSaved(state, { excludeSlugs: ["alpha"], cap: HOME_UNFILED_CAP });
    expect(items.map((item) => item.slug)).toEqual(["epsilon"]);
  });

  it("caps at HOME_UNFILED_CAP", () => {
    expect(HOME_UNFILED_CAP).toBe(3);
    let state = createEmptyWorkspaceState();
    for (const slug of ["a", "b", "c", "d", "e"]) {
      state = reduceWorkspaceState(state, { type: "saved/set", slug, saved: true, at: NOW });
    }
    expect(listUnfiledSaved(state, { cap: HOME_UNFILED_CAP })).toHaveLength(3);
  });
});

describe("composeHomeWorkspace", () => {
  it("composes one derived model without duplicating resume/unfinished/review/unfiled", () => {
    const composition = composeHomeWorkspace(workspaceTestFixtures.mature, NOW);
    expect(composition.nowIso).toBe(NOW);
    expect(composition.blank).toBe(false);
    expect(composition.resume).toEqual(chooseResumeAction(workspaceTestFixtures.mature, NOW));
    expect(composition.unfinished.length).toBeLessThanOrEqual(HOME_UNFINISHED_CAP);
    expect(composition.stacks.length).toBeLessThanOrEqual(HOME_STACKS_CAP);
    expect(composition.review.length).toBeLessThanOrEqual(HOME_REVIEW_CAP);
    expect(composition.unfiled.length).toBeLessThanOrEqual(HOME_UNFILED_CAP);

    const seen = new Set<string>();
    if (composition.resume.slug) seen.add(composition.resume.slug);
    if (composition.resume.kind === "continue_compare") {
      for (const slug of workspaceTestFixtures.mature.compare.slugs) seen.add(slug);
    }
    for (const item of composition.unfinished) {
      expect(seen.has(item.slug)).toBe(false);
      seen.add(item.slug);
    }
    for (const item of composition.review) {
      expect(seen.has(item.slug)).toBe(false);
      seen.add(item.slug);
    }
    for (const item of composition.unfiled) {
      expect(seen.has(item.slug)).toBe(false);
    }
  });

  it("shrinks review cap when resume is a due decision", () => {
    const composition = composeHomeWorkspace(workspaceTestFixtures.reviewManyDue, NOW);
    expect(composition.resume.kind).toBe("review_decision");
    expect(composition.review).toHaveLength(HOME_REVIEW_CAP - 1);
    expect(composition.review.every((item) => item.slug !== composition.resume.slug)).toBe(true);
  });

  it("is pure and does not write schemaVersion or mutate state", () => {
    const state = workspaceTestFixtures.withDecisions;
    const before = JSON.stringify(state);
    const first = composeHomeWorkspace(state, NOW);
    const second = composeHomeWorkspace(state, NOW);
    expect(first).toEqual(second);
    expect(JSON.stringify(state)).toBe(before);
    expect(state.schemaVersion).toBe(1);
    expect(HOME_RADAR_CAP).toBe(4);
  });

  it("returns a blank composition for an empty workspace", () => {
    const composition = composeHomeWorkspace(createEmptyWorkspaceState(), NOW);
    expect(composition.blank).toBe(true);
    expect(composition.resume.kind).toBe("empty");
    expect(composition.unfinished).toEqual([]);
    expect(composition.stacks).toEqual([]);
    expect(composition.review).toEqual([]);
    expect(composition.unfiled).toEqual([]);
  });
});
