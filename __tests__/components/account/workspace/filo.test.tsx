// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceFilo } from "@/components/account/workspace/filo";
import { WorkspaceBiblioteca } from "@/components/account/workspace/workspace-biblioteca";
import { WorkspaceRiprendi } from "@/components/account/workspace/workspace-riprendi";
import { WorkspaceDecisioni } from "@/components/account/workspace/workspace-decisioni";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceAction, WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

const actions = vi.hoisted(() => ({
  markWorkspaceRevisited: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
  setWorkspaceRevisit: vi.fn(),
  markWorkspaceToolUsing: vi.fn(),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: undefined,
    isLoading: false,
    isFetching: false,
  }),
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  markWorkspaceRevisited: (...args: unknown[]) => actions.markWorkspaceRevisited(...args),
  reopenWorkspaceDecision: (...args: unknown[]) => actions.reopenWorkspaceDecision(...args),
  setWorkspaceRevisit: (...args: unknown[]) => actions.setWorkspaceRevisit(...args),
  markWorkspaceToolUsing: (...args: unknown[]) => actions.markWorkspaceToolUsing(...args),
  commitWorkspaceDecision: vi.fn(),
  addToolToPersonalStack: vi.fn(),
  createPersonalStack: vi.fn(),
  createPersonalStackId: vi.fn((name: string) => name),
  deferWorkspaceTool: vi.fn(),
  markWorkspaceToolReplaced: vi.fn(),
  markWorkspaceToolStopped: vi.fn(),
  removeToolFromPersonalStack: vi.fn(),
  setWorkspaceDecision: vi.fn(),
  setWorkspaceNote: vi.fn(),
  setWorkspacePinned: vi.fn(),
  setWorkspaceStage: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
  toggleWorkspaceSaved: vi.fn(),
}));

const T0 = "2026-01-01T10:00:00.000Z";
const T1 = "2026-02-01T10:00:00.000Z";
const T2 = "2026-03-01T10:00:00.000Z";

const catalog: PublicToolCatalogItem[] = [
  {
    slug: "cursor",
    name: "Cursor",
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
  {
    slug: "v0",
    name: "v0",
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
  {
    slug: "meku",
    name: "Meku",
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
];

function apply(actionsList: WorkspaceAction[]) {
  return actionsList.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function pageText() {
  return document.body.textContent ?? "";
}

describe("WorkspaceFilo", () => {
  beforeEach(() => {
    catalogRuntime.value = catalog;
  });

  afterEach(() => {
    cleanup();
  });

  it("NOTE-FILO snapshot shows current note without a noted event", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "Scelto per il daily coding.", at: T0 },
    ]);
    render(createElement(WorkspaceFilo, { state, slug: "cursor", catalog }));
    expect(screen.getByText("Nota: Scelto per il daily coding.")).toBeTruthy();
    expect(state.events).toEqual([]);
  });

  it("W10-T1 legacy snapshot shows L2 fallback and no empty timeline", () => {
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
    render(createElement(WorkspaceFilo, { state, slug: "cursor", catalog }));
    expect(screen.getByText("1 stato")).toBeTruthy();
    expect(document.querySelector(".tv-filo-events")).toBeNull();
    expect(pageText()).not.toMatch(/Deciso il/);
    expect(pageText()).not.toMatch(/storia completa/);
  });

  it("W10-T10 L2 stays compact under the row meta", () => {
    const state = apply([
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "d1",
      },
    ]);
    render(createElement(WorkspaceFilo, { state, slug: "cursor", catalog }));
    const summary = document.querySelector(".tv-filo__summary");
    expect(summary?.textContent).toMatch(/1 evento/);
    expect((summary?.textContent ?? "").split("\n")).toHaveLength(1);
    expect((document.querySelector(".tv-filo") as HTMLDetailsElement).open).toBe(false);
  });

  it("W10-T11 expanded Filo contains the relationship events", () => {
    const state = apply([
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "d1",
        reason: "Per il daily",
        useCase: "pair programming",
        alternatives: ["v0"],
      },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T2 },
    ]);
    render(createElement(WorkspaceFilo, { state, slug: "cursor", catalog }));
    fireEvent.click(screen.getByText(/1 evento|2 eventi/));
    expect(document.querySelector(".tv-filo-events")).toBeTruthy();
    expect(pageText()).toMatch(/Scelto/);
    expect(pageText()).toMatch(/In uso/);
    expect(pageText()).toMatch(/pair programming|Per il daily|v0/);
    expect(pageText()).not.toContain("d1");
    expect(pageText()).not.toContain("started_using");
    expect(pageText()).not.toMatch(/storia completa/);
  });

  it("does not render Filo for a blank save-only row", () => {
    const state = apply([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    const { container } = render(
      createElement(WorkspaceFilo, { state, slug: "cursor", catalog }),
    );
    expect(container.textContent).toBe("");
  });
});

describe("Filo on Salvati", () => {
  beforeEach(() => {
    catalogRuntime.value = catalog;
  });

  afterEach(() => {
    cleanup();
  });

  it("does not add extra listitems under a library row", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "workspace/decide",
        slug: "cursor",
        outcome: "selected",
        at: T1,
        eventId: "d1",
      },
    ]);
    render(createElement(WorkspaceBiblioteca, { state }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText(/1 evento/)).toBeTruthy();
  });
});

describe("Home review verbs", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "matchMedia",
      (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );
    HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => undefined;
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  });

  beforeEach(() => {
    catalogRuntime.value = catalog;
    actions.markWorkspaceRevisited.mockReset();
    actions.reopenWorkspaceDecision.mockReset();
    actions.setWorkspaceRevisit.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  function reviewState(): WorkspaceStateV1 {
    return apply([
      { type: "saved/set", slug: "meku", saved: true, at: T0 },
      { type: "tool/decision", slug: "meku", outcome: "deferred", at: T0 },
      { type: "tool/revisit", slug: "meku", revisitAt: "2020-01-01T00:00:00.000Z", at: T0 },
    ]);
  }

  it("W10-T21 Non più reopens then opens DecisionSheet", () => {
    // GM-08: review actions live on the decision row (Rivedi opens the sheet).
    render(createElement(WorkspaceDecisioni, { state: reviewState() }));
    fireEvent.click(screen.getAllByRole("button", { name: /Rivedi la decisione/ })[0]!);
    expect(document.querySelector("[data-decision-sheet]")).toBeTruthy();
    expect(document.querySelector("[data-decision-source]")?.getAttribute("data-decision-source")).toBe(
      "home",
    );
  });

  it("Ancora vero marks revisited with a future date", () => {
    // GM-08: revisit confirm lives in the DecisionSheet, not the home review row.
    render(createElement(WorkspaceDecisioni, { state: reviewState() }));
    fireEvent.click(screen.getAllByRole("button", { name: /Rivedi la decisione/ })[0]!);
    expect(document.querySelector("[data-decision-sheet]")).toBeTruthy();
  });

  it("Rimanda snoozes through setWorkspaceRevisit, not revisited", () => {
    // GM-08: revisit chips live in the DecisionSheet revisit control.
    render(createElement(WorkspaceDecisioni, { state: reviewState() }));
    fireEvent.click(screen.getAllByRole("button", { name: /Rivedi la decisione/ })[0]!);
    expect(screen.getByText("Conferma se lo usi tra 1 mese")).toBeTruthy();
    expect(actions.markWorkspaceRevisited).not.toHaveBeenCalled();
  });
});
