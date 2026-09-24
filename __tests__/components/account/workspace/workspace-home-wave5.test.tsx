// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

const actions = vi.hoisted(() => ({
  markWorkspaceToolUsing: vi.fn(),
  setWorkspaceRevisit: vi.fn(),
  markWorkspaceRevisited: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
}));

const { navRuntime } = vi.hoisted(() => ({
  navRuntime: {
    pathname: "/account",
    search: "",
    push: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navRuntime.pathname,
  useSearchParams: () => new URLSearchParams(navRuntime.search),
  useRouter: () => ({ push: navRuntime.push }),
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
  toggleWorkspaceCompare: vi.fn(),
}));

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: undefined,
    isLoading: false,
    isFetching: false,
  }),
}));

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
import { workspaceViewHref } from "@/components/account/workspace/workspace-model";
import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";

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

describe("Workspace Home — Wave 5", () => {
  beforeEach(() => {
    catalogRuntime.value = [];
    actions.markWorkspaceToolUsing.mockReset();
    actions.setWorkspaceRevisit.mockReset();
    actions.markWorkspaceRevisited.mockReset();
    actions.reopenWorkspaceDecision.mockReset();
    navRuntime.pathname = "/account";
    navRuntime.search = "";
    navRuntime.push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("W5-T1 renders WorkspaceShell without the live HUD", () => {
    render(createElement(WorkspaceShell));
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
  });

  it("W5-T2 does not render the five-cell HUD strip", () => {
    render(createElement(WorkspaceShell));
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
    expect(pageText()).not.toMatch(/0 Salvati/);
    expect(pageText()).not.toMatch(/0\/5/);
  });

  it("W5-T3 orients a new user without KPI zeros", () => {
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(pageText()).not.toMatch(/\b0\b/);
    expect(screen.queryByText(/Ciao/)).toBeNull();
    expect(screen.getByText("Il tuo spazio è pronto")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trova il primo tool" }).getAttribute("href")).toBe(
      "/archivio",
    );
  });

  it("W5-T4 continues an open compare", () => {
    renderHome(workspaceTestFixtures.withCompare);
    // GM-08: compact summary row — count title + "Completa la tua valutazione" sub.
    expect(screen.getByText("Completa la tua valutazione")).toBeTruthy();
    expect(screen.getByRole("link", { name: /confronto in corso/ }).getAttribute("href")).toBe(
      "/compare",
    );
  });

  it("W5-T5 drops compare resume after an atomic decide", () => {
    const decided = reduceWorkspaceState(workspaceTestFixtures.withCompare, {
      type: "workspace/decide",
      slug: "cursor",
      outcome: "selected",
      at: "2026-06-04T10:00:00.000Z",
    });
    renderHome(decided);
    expect(screen.queryByText("Completa la tua valutazione")).toBeNull();
    expect(screen.getByRole("button", { name: "Lo sto usando" })).toBeTruthy();
  });

  it("W5-T6 keeps resume evaluation and may show Stack attivi when stacks exist", () => {
    renderHome(workspaceTestFixtures.withStacks);
    // GM-08: saved evaluation lives in the compact summary rows.
    expect(screen.getByText("Da rivedere")).toBeTruthy();
    expect(screen.getByRole("link", { name: /tool salvati/ }).getAttribute("href")).toBe(
      workspaceViewHref("salvati"),
    );
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "AI Coding" })).toBeTruthy();
  });

  it("W5-T7 confirms usage from a selected decision", () => {
    renderHome(workspaceTestFixtures.withDecisions);
    expect(screen.getAllByText("Conferma se lo usi").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Lo sto usando" })).toBeTruthy();
  });

  it("W5-T8 surfaces a due deferred decision", () => {
    renderHome(workspaceTestFixtures.reviewDue);
    // GM-08: deferred decision surfaces as a compact decision row link.
    expect(
      screen.getByRole("link", { name: /decisione da confermare/ }),
    ).toBeTruthy();
  });

  it("W5-T9 stays quiet when the revisit is still in the future", () => {
    renderHome(workspaceTestFixtures.reviewFuture);
    expect(screen.queryByText("Meku")).toBeNull();
    expect(screen.getByText("Niente da riprendere.")).toBeTruthy();
  });

  it("W5-T10 caps due objects at three", () => {
    renderHome(workspaceTestFixtures.reviewManyDue);
    // GM-08: review queue caps at three; decisions section shows the count line.
    expect(screen.getByText(/decisioni salvate/)).toBeTruthy();
  });

  it("W5-T11 treats a finished workspace as quiet", () => {
    renderHome(workspaceTestFixtures.quietReturning);
    expect(screen.getByText("Niente da riprendere.")).toBeTruthy();
    expect(screen.queryByText("Completa la tua valutazione")).toBeNull();
    expect(pageText()).not.toMatch(/0 da rivedere/);
    expect(pageText()).not.toMatch(/0 recensioni/);
  });

  it("W5-T12 orients a new user without KPI zeros", () => {
    renderHome(workspaceTestFixtures.newAuthenticated);
    expect(pageText()).not.toMatch(/\b0\b/);
    expect(screen.queryByText(/Ciao/)).toBeNull();
    expect(screen.getByText("Il tuo spazio è pronto")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trova il primo tool" })).toBeTruthy();
  });

  it("W5-T13 does not dump Salvati on a quiet home", () => {
    renderHome(workspaceTestFixtures.quietReturning);
    expect(screen.queryByRole("heading", { name: "Salvati" })).toBeNull();
    expect(screen.queryAllByRole("link", { name: "Cursor" })).toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: "v0" })).toHaveLength(0);
  });

  it("W5-T14 has no Recenti heading on Home", () => {
    renderHome(workspaceTestFixtures.mature);
    expect(screen.queryByRole("heading", { name: "Recenti" })).toBeNull();
  });

  it("W5-T15 does not render Signal on Home", () => {
    renderHome(workspaceTestFixtures.mature);
    expect(screen.queryByText("Segnale")).toBeNull();
    expect(pageText()).not.toMatch(/\bSP\b/);
    expect(document.querySelector(".tv-signal-meter")).toBeNull();
  });

  it("W5-T16 removes the old Home modules", () => {
    renderHome(workspaceTestFixtures.mature);
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Confronto attivo" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Memoria software" })).toBeNull();
    expect(screen.queryByText("Recenti")).toBeNull();
    expect(screen.queryByText("Segnale")).toBeNull();
  });

  it("W5-T17 stays bounded with a large using set", () => {
    const at = "2026-06-04T10:00:00.000Z";
    let state = createEmptyWorkspaceState();
    for (let index = 0; index < 150; index += 1) {
      const slug = `bulk-${String(index + 1).padStart(3, "0")}`;
      state = reduceWorkspaceState(state, { type: "saved/set", slug, saved: true, at });
      state = reduceWorkspaceState(state, {
        type: "tool/decision",
        slug,
        outcome: "selected",
        at,
      });
      state = reduceWorkspaceState(state, { type: "tool/usage", slug, usage: "using", at });
    }
    renderHome(state);
    expect(screen.queryAllByRole("link").length).toBeLessThan(40);
    expect(screen.queryAllByRole("link").length).not.toBe(150);
    expect(document.querySelectorAll(".tv-home-row").length).toBeLessThan(10);
  });
});
