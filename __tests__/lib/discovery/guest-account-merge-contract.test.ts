import { describe, expect, it } from "vitest";

import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { workspaceSyncStateV1Schema } from "@/lib/discovery/schema";
import { MAX_COMPARE_TOOLS, MAX_RELATIONSHIP_EVENTS } from "@/lib/discovery/workspace-constants";
import type { WorkspaceToolState } from "@/lib/discovery/types";

const T_OLD = "2026-08-01T12:00:00.000Z";
const T_NEW = "2026-08-20T12:00:00.000Z";
const T_MID = "2026-08-15T12:00:00.000Z";

function tool(overrides: Partial<WorkspaceToolState> = {}): WorkspaceToolState {
  return {
    stage: "saved",
    note: null,
    saveReason: null,
    pinned: false,
    decision: null,
    useCase: null,
    alternatives: [],
    revisitAt: null,
    usage: null,
    replacedBy: null,
    compareObjective: null,
    updatedAt: null,
    ...overrides,
  };
}

function withSaved(slugs: string[]) {
  const empty = createEmptyWorkspaceState();
  return {
    ...empty,
    saved: { slugs, updatedAt: T_MID },
  };
}

function withCompare(slugs: string[]) {
  const empty = createEmptyWorkspaceState();
  return {
    ...empty,
    compare: { slugs, updatedAt: T_MID },
  };
}

function withTool(
  slug: string,
  state: Partial<WorkspaceToolState>,
  extras: Partial<ReturnType<typeof createEmptyWorkspaceState>> = {},
) {
  const empty = createEmptyWorkspaceState();
  return {
    ...empty,
    saved: { slugs: [slug], updatedAt: T_MID },
    toolStates: { [slug]: tool(state) },
    ...extras,
  };
}

describe("guest → account merge contract", () => {
  it("MERGE-W-01 unions saved tools instead of replacing", () => {
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

  it("MERGE-W-02 compare respects the max cap with account-first order", () => {
    const merged = mergeGuestWorkspaceContribution(
      withCompare(["a", "b", "c", "d", "e"]),
      withCompare(["f", "g"]),
    );
    expect(merged.compare.slugs).toHaveLength(MAX_COMPARE_TOOLS);
    expect(merged.compare.slugs).toEqual(["a", "b", "c", "d", "e"]);
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

  it("MERGE-W-03/05 unions personal stacks by id and keeps the account name on collision", () => {
    const account = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "Account stack",
      at: T_MID,
    });
    const guest = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "stacks/create",
        id: "ai-coding",
        name: "Guest stack",
        at: T_MID,
      }),
      {
        type: "stacks/create",
        id: "free-stack",
        name: "Free stack",
        at: T_MID,
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

  it("MERGE-W-04 same stack id unions membership", () => {
    const account = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI",
        at: T_MID,
      }),
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T_MID },
    );
    const guest = reduceWorkspaceState(
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI",
        at: T_MID,
      }),
      { type: "stacks/add", id: "ai-coding", slug: "v0", at: T_MID },
    );
    const merged = mergeGuestWorkspaceContribution(account, guest);
    const stack = merged.personalStacks.find((item) => item.id === "ai-coding");
    expect(stack?.slugs.sort()).toEqual(["cursor", "v0"]);
  });

  it("MERGE-01 non-overlap toolStates are preserved", () => {
    const account = withTool("blink", { note: "account", updatedAt: T_MID });
    const guest = withTool("meku", { note: "guest", updatedAt: T_MID });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("account");
    expect(merged.toolStates.meku.note).toBe("guest");
  });

  it("MERGE-02 guest-only note survives when account note is empty", () => {
    const account = withTool("blink", { usage: "using", updatedAt: T_NEW });
    const guest = withTool("blink", { note: "prova questo", updatedAt: T_OLD });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("prova questo");
    expect(merged.toolStates.blink.usage).toBe("using");
  });

  it("MERGE-03 account-only note survives", () => {
    const account = withTool("blink", { note: "keep", updatedAt: T_OLD });
    const guest = withTool("blink", { usage: "using", updatedAt: T_NEW });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("keep");
    expect(merged.toolStates.blink.usage).toBe("using");
  });

  it("MERGE-04 newer guest field wins on conflict", () => {
    const account = withTool("blink", { note: "old", updatedAt: T_OLD });
    const guest = withTool("blink", { note: "fresh", updatedAt: T_NEW });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("fresh");
  });

  it("MERGE-05 newer account wins on conflict", () => {
    const account = withTool("blink", { note: "fresh", updatedAt: T_NEW });
    const guest = withTool("blink", { note: "stale", updatedAt: T_OLD });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("fresh");
  });

  it("MERGE-06 equal timestamp account wins", () => {
    const account = withTool("blink", { note: "account", updatedAt: T_MID });
    const guest = withTool("blink", { note: "guest", updatedAt: T_MID });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.note).toBe("account");
  });

  it("MERGE-07 different non-conflicting fields survive", () => {
    const account = withTool("blink", {
      usage: "using",
      pinned: true,
      updatedAt: T_MID,
    });
    const guest = withTool("blink", {
      note: "ciao",
      saveReason: "compare",
      useCase: "podcast",
      updatedAt: T_MID,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.usage).toBe("using");
    expect(merged.toolStates.blink.note).toBe("ciao");
    expect(merged.toolStates.blink.saveReason).toBe("compare");
    expect(merged.toolStates.blink.useCase).toBe("podcast");
    expect(merged.toolStates.blink.pinned).toBe(true);
  });

  it("MERGE-08 decision conflict is deterministic", () => {
    const account = withTool("blink", {
      decision: { outcome: "selected", updatedAt: T_OLD },
      updatedAt: T_OLD,
    });
    const guest = withTool("blink", {
      decision: { outcome: "rejected", updatedAt: T_NEW },
      updatedAt: T_NEW,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.decision?.outcome).toBe("rejected");
  });

  it("MERGE-09 usage conflict is deterministic", () => {
    const account = withTool("blink", { usage: "using", updatedAt: T_OLD });
    const guest = withTool("blink", {
      usage: "replaced",
      replacedBy: "descript",
      updatedAt: T_NEW,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.usage).toBe("replaced");
    expect(merged.toolStates.blink.replacedBy).toBe("descript");
  });

  it("MERGE-10 revisit survives", () => {
    const account = withTool("blink", { note: "x", updatedAt: T_NEW });
    const guest = withTool("blink", {
      revisitAt: "2026-09-01T00:00:00.000Z",
      updatedAt: T_OLD,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.revisitAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("MERGE-11 saveReason survives", () => {
    const account = withTool("blink", { stage: "top", updatedAt: T_NEW });
    const guest = withTool("blink", { saveReason: "test", updatedAt: T_OLD });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.saveReason).toBe("test");
  });

  it("MERGE-12 alternatives union with cap", () => {
    const account = withTool("blink", {
      alternatives: ["a", "b", "c"],
      updatedAt: T_MID,
    });
    const guest = withTool("blink", {
      alternatives: ["c", "d", "e", "f"],
      updatedAt: T_MID,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.alternatives).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("MERGE-13 covers remaining toolState fields", () => {
    const account = withTool("blink", {
      stage: "review",
      compareObjective: "save-time",
      updatedAt: T_OLD,
    });
    const guest = withTool("blink", {
      stage: "top",
      pinned: true,
      compareObjective: "quality",
      updatedAt: T_NEW,
    });
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.toolStates.blink.stage).toBe("top");
    expect(merged.toolStates.blink.pinned).toBe(true);
    expect(merged.toolStates.blink.compareObjective).toBe("quality");
  });

  it("MERGE-W-06/07 events union and dedupe by id", () => {
    const account = {
      ...createEmptyWorkspaceState(),
      events: [
        {
          id: "evt-1",
          type: "decided" as const,
          slug: "blink",
          at: T_OLD,
          outcome: "selected" as const,
        },
      ],
    };
    const guest = {
      ...createEmptyWorkspaceState(),
      events: [
        {
          id: "evt-1",
          type: "decided" as const,
          slug: "blink",
          at: T_OLD,
          outcome: "selected" as const,
        },
        {
          id: "evt-2",
          type: "started_using" as const,
          slug: "blink",
          at: T_NEW,
        },
      ],
    };
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.events.map((event) => event.id).sort()).toEqual(["evt-1", "evt-2"]);
  });

  it("MERGE-W-08 events respect the cap", () => {
    const accountEvents = Array.from({ length: 180 }, (_, index) => ({
      id: `acc-${index}`,
      type: "revisited" as const,
      slug: "blink",
      at: T_OLD,
    }));
    const guestEvents = Array.from({ length: 40 }, (_, index) => ({
      id: `gst-${index}`,
      type: "revisited" as const,
      slug: "meku",
      at: T_NEW,
    }));
    const merged = mergeGuestWorkspaceContribution(
      { ...createEmptyWorkspaceState(), events: accountEvents },
      { ...createEmptyWorkspaceState(), events: guestEvents },
    );
    expect(merged.events.length).toBeLessThanOrEqual(MAX_RELATIONSHIP_EVENTS);
  });

  it("MERGE-W-09 whole merge is idempotent", () => {
    const account = withTool("blink", { note: "a", usage: "using", updatedAt: T_MID });
    const guest = withTool("blink", { note: "g", saveReason: "test", updatedAt: T_OLD });
    const once = mergeGuestWorkspaceContribution(account, guest);
    const twice = mergeGuestWorkspaceContribution(once, guest);
    expect(twice).toEqual(once);
  });

  it("MERGE-W-10 repeated attach does not duplicate events or stacks", () => {
    const account = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "AI",
      at: T_MID,
    });
    const guest = {
      ...reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "stacks/create",
        id: "free-stack",
        name: "Free",
        at: T_MID,
      }),
      events: [
        { id: "evt-9", type: "decided" as const, slug: "blink", at: T_MID },
      ],
    };
    const once = mergeGuestWorkspaceContribution(account, guest);
    const twice = mergeGuestWorkspaceContribution(once, guest);
    expect(twice.personalStacks).toHaveLength(2);
    expect(twice.events.filter((event) => event.id === "evt-9")).toHaveLength(1);
  });

  it("MERGE-W-11 result is schema-valid", () => {
    const merged = mergeGuestWorkspaceContribution(
      withTool("blink", { note: "a", updatedAt: T_MID }),
      withTool("meku", { note: "g", updatedAt: T_MID }),
    );
    expect(workspaceSyncStateV1Schema.safeParse(merged).success).toBe(true);
  });
});
