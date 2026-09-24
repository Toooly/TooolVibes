// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

const actions = vi.hoisted(() => ({
  markWorkspaceToolUsing: vi.fn(),
  setWorkspaceRevisit: vi.fn(),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  markWorkspaceToolUsing: actions.markWorkspaceToolUsing,
  setWorkspaceRevisit: actions.setWorkspaceRevisit,
  commitWorkspaceDecision: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
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
    user: { email: "mario@example.com" },
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

describe("WorkspaceRiprendi", () => {
  beforeEach(() => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.withDecisions);
    actions.markWorkspaceToolUsing.mockReset();
    actions.setWorkspaceRevisit.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("confirm_usage resume shows Lo sto usando and marks usage", () => {
    render(createElement(WorkspaceRiprendi, { state: workspaceTestFixtures.withDecisions }));

    const using = screen.getByRole("button", { name: "Lo sto usando" });
    expect(using).toBeTruthy();
    fireEvent.click(using);
    expect(actions.markWorkspaceToolUsing).toHaveBeenCalledWith("cursor");

    // GM-08: confirm_usage is a compact row — CTA only, no "Apri" link.
  });

  it("hides In uso and Stack attivi when they are empty", () => {
    render(createElement(WorkspaceRiprendi, { state: workspaceTestFixtures.withDecisions }));

    expect(screen.queryByRole("heading", { name: "In uso" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Stack attivi" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Confronto attivo" })).toBeNull();
    expect(screen.queryByText(/Ciao/)).toBeNull();
  });

  it("shows compare resume and a muted using line on mature home", () => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.mature);
    render(createElement(WorkspaceRiprendi, { state: workspaceTestFixtures.mature }));

    const compare = screen.getByRole("link", { name: /confronto in corso/ });
    expect(compare.getAttribute("href")).toBe("/compare");
    expect(screen.getByText(/In uso:/)).toBeTruthy();
    expect(screen.getByText(/In uso:/).textContent).toMatch(/Cursor/);
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Memoria software" })).toBeNull();
    expect(screen.queryByText("Segnale")).toBeNull();
  });
});
