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

    const open = screen.getByRole("link", { name: "Apri" });
    expect(open.getAttribute("href")).toBe("/account?view=decisioni&focus=cursor");
  });

  it("hides In uso and Stack attivi when they are empty", () => {
    render(createElement(WorkspaceRiprendi, { state: workspaceTestFixtures.withDecisions }));

    expect(screen.queryByRole("heading", { name: "In uso" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Stack attivi" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Confronto attivo" })).toBeNull();
  });

  it("lists tools in use and stack counts when present", () => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.mature);
    render(createElement(WorkspaceRiprendi, { state: workspaceTestFixtures.mature }));

    expect(screen.getByRole("heading", { name: "In uso" })).toBeTruthy();
    const usingRow = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/toools/cursor");
    expect(usingRow).toBeTruthy();
    expect(usingRow?.textContent).toMatch(/Cursor/i);
    expect(screen.getByRole("heading", { name: "Stack attivi" })).toBeTruthy();
    expect(screen.getByText("1 in uso")).toBeTruthy();
    expect(screen.getByText("1 in valutazione")).toBeTruthy();
  });
});
