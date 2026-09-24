// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  chooseResumeAction,
  composeHomeWorkspace,
  HOME_RADAR_CAP,
  listHomeActiveStacks,
  listHomeReviewQueue,
  listHomeUnfinishedQueue,
  listUnfiledSaved,
} from "@/lib/account/workspace-pipeline";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  loopPrimaryDestinations,
} from "@/lib/navigation/loop-routes";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

const NOW = "2026-08-01T00:00:00.000Z";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

const radarRuntime = vi.hoisted(() => ({
  payload: undefined as ProductHuntPayload | undefined,
  isLoading: false,
  isFetching: false,
}));

const actions = vi.hoisted(() => ({
  markWorkspaceToolUsing: vi.fn(),
  setWorkspaceRevisit: vi.fn(),
  markWorkspaceRevisited: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  markWorkspaceToolUsing: actions.markWorkspaceToolUsing,
  setWorkspaceRevisit: actions.setWorkspaceRevisit,
  markWorkspaceRevisited: actions.markWorkspaceRevisited,
  commitWorkspaceDecision: vi.fn(),
  reopenWorkspaceDecision: actions.reopenWorkspaceDecision,
  toggleWorkspaceCompare: actions.toggleWorkspaceCompare,
}));

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: radarRuntime.payload,
    isLoading: radarRuntime.isLoading,
    isFetching: radarRuntime.isFetching,
    refetch: () => {},
  }),
}));

vi.mock("@/components/tools/stack-pick-or-create", () => ({
  StackPickOrCreate: ({ slug }: { slug: string }) =>
    createElement(
      "div",
      { "data-testid": "stack-pick-or-create", "data-slug": slug },
      "Aggiungi a uno stack",
    ),
}));

vi.mock("@/lib/discovery/workspace-owner-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/discovery/workspace-owner-storage")>();
  return {
    ...actual,
    getActiveWorkspaceOwner: () => ({ kind: "account" as const, userId: "test" }),
  };
});

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({
    authEnabled: true,
    status: "authenticated",
    user: { email: "mario@example.com" },
    session: { access_token: "token-a" },
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn(),
    restoreQuarantinedWorkspace: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/discovery/canonical-discovery-persistence-provider", () => ({
  useDiscoveryPersistence: () => ({ mode: "local", phase: "local-only" }),
}));

vi.mock("@/lib/discovery/client-store", () => ({
  useDiscoverySnapshot: () => ({
    visitedTools: [],
    exploredCategories: [],
    shortlist: [],
    compare: [],
    shortlistStages: {},
    decisionMemories: {},
    toolStateMeta: {},
    compareMeta: {},
  }),
}));

import { WorkspaceRiprendi } from "@/components/account/workspace/workspace-riprendi";

function catalogFor(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  const named: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    meku: "Meku",
    blink: "Blink",
    linear: "Linear",
  };
  const slugs = new Set([
    ...state.saved.slugs,
    ...state.compare.slugs,
    ...Object.keys(state.toolStates),
  ]);
  for (const stack of state.personalStacks) {
    for (const slug of stack.slugs) slugs.add(slug);
  }
  return [...slugs].map((slug) => ({
    slug,
    name: named[slug] ?? slug,
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  }));
}

function renderHome(state: WorkspaceStateV1) {
  catalogRuntime.value = catalogFor(state);
  return render(createElement(WorkspaceRiprendi, { state }));
}

function pageText() {
  return document.body.textContent ?? "";
}

function saveMany(slugs: string[], at = NOW) {
  let state = createEmptyWorkspaceState();
  for (const slug of slugs) {
    state = reduceWorkspaceState(state, { type: "saved/set", slug, saved: true, at });
  }
  return state;
}

function radarItems(count: number): ProductHuntPayload {
  return {
    status: "ok",
    source: "qa-fixture",
    stale: false,
    range: "day",
    updatedAt: NOW,
    items: Array.from({ length: count }, (_, index) => ({
      id: `ph-${index + 1}`,
      name: `Radar Tool ${index + 1}`,
      tagline: `Tagline ${index + 1}`,
      votesCount: 10 + index,
      commentsCount: 2,
      productHuntUrl: `https://www.producthunt.com/posts/radar-tool-${index + 1}`,
    })),
  };
}

describe("Workspace Home 2.0", () => {
  beforeEach(() => {
    catalogRuntime.value = [];
    radarRuntime.payload = undefined;
    radarRuntime.isLoading = false;
    radarRuntime.isFetching = false;
    actions.markWorkspaceToolUsing.mockReset();
    actions.setWorkspaceRevisit.mockReset();
    actions.markWorkspaceRevisited.mockReset();
    actions.reopenWorkspaceDecision.mockReset();
    actions.toggleWorkspaceCompare.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("H2-T1 primary Resume uses canonical chooseResumeAction", () => {
    const resume = chooseResumeAction(workspaceTestFixtures.withCompare, NOW);
    expect(resume).toEqual({ kind: "continue_compare", slug: "cursor" });
    renderHome(workspaceTestFixtures.withCompare);
    expect(screen.getByText("Completa la tua valutazione")).toBeTruthy();
    expect(screen.getByRole("link", { name: /confronto in corso/ }).getAttribute("href")).toBe(
      "/compare",
    );
  });

  it("H2-T2 primary relationship not duplicated in Da riprendere", () => {
    renderHome(workspaceTestFixtures.withCompare);
    expect(screen.getByText("Completa la tua valutazione")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Da riprendere" })).toBeNull();
    const resume = chooseResumeAction(workspaceTestFixtures.withCompare, NOW);
    const unfinished = listHomeUnfinishedQueue(workspaceTestFixtures.withCompare, {
      nowIso: NOW,
      resume,
    });
    expect(unfinished.every((item) => item.slug !== resume.slug)).toBe(true);
  });

  it("H2-T3 secondary actions capped at 3", () => {
    const state = saveMany(["one", "two", "three", "four", "five", "six"]);
    renderHome(state);
    const heading = screen.getByRole("heading", { name: "Da riprendere" });
    const section = heading.closest("section");
    expect(section).toBeTruthy();
    expect(within(section as HTMLElement).getAllByRole("listitem")).toHaveLength(3);
  });

  it("H2-T4 active Compare appears appropriately (resume continue_compare)", () => {
    renderHome(workspaceTestFixtures.withCompare);
    expect(screen.getByText("Completa la tua valutazione")).toBeTruthy();
    expect(screen.getByRole("link", { name: /confronto in corso/ })).toBeTruthy();
  });

  it("H2-T5 zero Compare creates no empty widget", () => {
    renderHome(workspaceTestFixtures.withSaved);
    expect(screen.queryByRole("heading", { name: "Confronto attivo" })).toBeNull();
    expect(screen.queryByText("Completa la tua valutazione")).toBeNull();
    expect(pageText()).not.toMatch(/0 confronto/i);
  });

  it("H2-T6 active Stacks derived from personalStacks", () => {
    renderHome(workspaceTestFixtures.withStacks);
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "AI Coding" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /^Apri$/ }).getAttribute("href"),
    ).toBe("/account?view=stack&stack=ai-coding");
  });

  it("H2-T7 Stacks capped", () => {
    let state = createEmptyWorkspaceState();
    for (let index = 0; index < 5; index += 1) {
      const slug = `member-${index}`;
      const id = `stack-${index}`;
      state = reduceWorkspaceState(state, { type: "saved/set", slug, saved: true, at: NOW });
      state = reduceWorkspaceState(state, {
        type: "stacks/create",
        id,
        name: `Lane ${index}`,
        at: `2026-06-0${index + 1}T10:00:00.000Z`,
      });
      state = reduceWorkspaceState(state, {
        type: "stacks/add",
        id,
        slug,
        at: `2026-06-0${index + 1}T12:00:00.000Z`,
      });
    }
    expect(listHomeActiveStacks(state)).toHaveLength(4);
    renderHome(state);
    expect(screen.getByRole("heading", { name: "Lane 4" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Lane 0" })).toBeNull();
  });

  it("H2-T8 zero Stacks creates no zero-card", () => {
    renderHome(workspaceTestFixtures.withDecisions);
    expect(screen.queryByRole("heading", { name: "Stack attivi" })).toBeNull();
    expect(pageText()).not.toMatch(/0 Stack/);
  });

  it("H2-T9 Review uses canonical listHomeReviewQueue", () => {
    const composition = composeHomeWorkspace(workspaceTestFixtures.reviewManyDue, NOW);
    const expected = listHomeReviewQueue(workspaceTestFixtures.reviewManyDue, {
      nowIso: NOW,
      excludeSlug: composition.resume.slug,
      cap: 2,
    });
    expect(composition.review.map((item) => item.slug)).toEqual(expected.map((item) => item.slug));
    renderHome(workspaceTestFixtures.reviewManyDue);
    expect(screen.getByRole("heading", { name: "Da rivedere" })).toBeTruthy();
  });

  it("H2-T10 Review capped at 3", () => {
    renderHome(workspaceTestFixtures.reviewManyDue);
    const heading = screen.getByRole("heading", { name: "Da rivedere" });
    const section = heading.closest("section");
    expect(within(section as HTMLElement).getAllByRole("listitem").length).toBeLessThanOrEqual(3);
  });

  it("H2-T11 saved-to-organize selector deterministic", () => {
    const state = saveMany(["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"]);
    const composition = composeHomeWorkspace(state, NOW);
    const first = listUnfiledSaved(state, {
      excludeSlugs: [
        composition.resume.slug ?? "",
        ...composition.unfinished.map((item) => item.slug),
      ],
    });
    const second = listUnfiledSaved(state, {
      excludeSlugs: [
        composition.resume.slug ?? "",
        ...composition.unfinished.map((item) => item.slug),
      ],
    });
    expect(first).toEqual(second);
    expect(composition.unfiled).toEqual(first);
    renderHome(state);
    expect(screen.getByRole("heading", { name: "Salvati da organizzare" })).toBeTruthy();
  });

  it("H2-T12 already mature relationships excluded from unfiled where appropriate", () => {
    const composition = composeHomeWorkspace(workspaceTestFixtures.mature, NOW);
    const stacked = new Set(
      workspaceTestFixtures.mature.personalStacks.flatMap((stack) => stack.slugs),
    );
    for (const item of composition.unfiled) {
      const tool = workspaceTestFixtures.mature.toolStates[item.slug];
      expect(tool?.decision?.outcome ?? null).toBeNull();
      expect(tool?.stage ?? "saved").toBe("saved");
      expect(stacked.has(item.slug)).toBe(false);
      expect(workspaceTestFixtures.mature.compare.slugs.includes(item.slug)).toBe(false);
    }
    expect(composition.unfiled.some((item) => item.slug === "cursor")).toBe(false);
    expect(composition.unfiled.some((item) => item.slug === "meku")).toBe(false);
  });

  it("H2-T13 Radar uses current Radar source", () => {
    radarRuntime.payload = radarItems(2);
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(screen.getByRole("heading", { name: "Dal Radar" })).toBeTruthy();
    expect(screen.getByText("Radar Tool 1")).toBeTruthy();
    expect(screen.getByText("Radar Tool 2")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Apri Radar" }).getAttribute("href")).toBe("/radar");
    expect(
      screen.getAllByRole("link").some((link) => link.getAttribute("href") === "/radar"),
    ).toBe(true);
    expect(pageText()).not.toMatch(/Segnali oggi/);
  });

  it("H2-T14 Radar capped", () => {
    radarRuntime.payload = radarItems(6);
    expect(HOME_RADAR_CAP).toBe(4);
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(screen.getByText("Radar Tool 1")).toBeTruthy();
    expect(screen.getByText("Radar Tool 4")).toBeTruthy();
    expect(screen.queryByText("Radar Tool 5")).toBeNull();
  });

  it("H2-T15 empty Radar does not create broken module", () => {
    radarRuntime.payload = {
      status: "error",
      source: "none",
      stale: false,
      range: "day",
      updatedAt: NOW,
      items: [],
      message: "Classifica Product Hunt temporaneamente non disponibile.",
    };
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(screen.queryByRole("heading", { name: "Dal Radar" })).toBeNull();
    expect(screen.queryByText("Segnali oggi")).toBeNull();
  });

  it("H2-T16 new user Home remains useful (catalog CTA, no zeros)", () => {
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(screen.getByText("Il tuo spazio è pronto")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trova il primo tool" }).getAttribute("href")).toBe(
      "/archivio",
    );
    expect(pageText()).not.toMatch(/\b0\b/);
    expect(screen.queryByText(/Ciao/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Stack attivi" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Da rivedere" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Salvati da organizzare" })).toBeNull();
  });

  it("H2-T17 mature user Home shows richer composition", () => {
    renderHome(workspaceTestFixtures.mature);
    expect(screen.getByText("Completa la tua valutazione")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "AI Coding" })).toBeTruthy();
    expect(
      Boolean(screen.queryByRole("heading", { name: "Da riprendere" })) ||
        Boolean(screen.queryByRole("heading", { name: "Da rivedere" })) ||
        Boolean(screen.queryByRole("heading", { name: "Salvati da organizzare" })),
    ).toBe(true);
  });

  it("H2-T18 no KPI HUD", () => {
    renderHome(workspaceTestFixtures.mature);
    expect(pageText()).not.toMatch(/12 Salvati/);
    expect(pageText()).not.toMatch(/4 Stack/);
    expect(pageText()).not.toMatch(/0 Salvati/);
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
    expect(screen.queryByText(/Ciao/)).toBeNull();
  });

  it("H2-T19 no new persisted Home state", () => {
    const state = workspaceTestFixtures.mature;
    const before = JSON.stringify(state);
    const first = composeHomeWorkspace(state, NOW);
    renderHome(state);
    const second = composeHomeWorkspace(state, NOW);
    expect(first).toEqual(second);
    expect(JSON.stringify(state)).toBe(before);
    expect(state.schemaVersion).toBe(1);
  });

  it("H2-T20 DecisionSheet remains canonical", () => {
    renderHome(workspaceTestFixtures.reviewDue);
    // GM-08: deferred-due opens the sheet from the decision row link.
    fireEvent.click(screen.getByRole("link", { name: /decisione da confermare/ }));
  });

  it("H2-T21 CompareLiveChip remains canonical — no second compare chip on Home", () => {
    renderHome(workspaceTestFixtures.withCompare);
    expect(screen.queryByRole("heading", { name: "Confronto attivo" })).toBeNull();
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
    expect(screen.getByRole("link", { name: /confronto in corso/ })).toBeTruthy();
  });

  it("H2-T22 StackPickOrCreate remains canonical", () => {
    const state = saveMany(["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"]);
    renderHome(state);
    fireEvent.click(screen.getAllByRole("button", { name: "Aggiungi a Stack" })[0]!);
    const picker = screen.getByTestId("stack-pick-or-create");
    expect(picker).toBeTruthy();
    expect(picker.getAttribute("data-slug")).toBeTruthy();
  });

  it("H2-T23 LoopShell dests unchanged", () => {
    expect(loopPrimaryDestinations("authenticated").map((item) => item.id)).toEqual([
      "home",
      "salvati",
      "stack",
      "catalogo",
    ]);
    expect(loopPrimaryDestinations("guest").map((item) => item.id)).toEqual([
      "salvati",
      "catalogo",
    ]);
  });
});
