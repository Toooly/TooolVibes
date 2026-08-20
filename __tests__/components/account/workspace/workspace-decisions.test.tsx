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

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  deferWorkspaceTool: vi.fn(),
  markWorkspaceToolReplaced: vi.fn(),
  markWorkspaceToolStopped: vi.fn(),
  markWorkspaceToolUsing: vi.fn(),
  setWorkspaceDecision: vi.fn(),
  setWorkspaceNote: vi.fn(),
  setWorkspacePinned: vi.fn(),
  setWorkspaceUseCase: vi.fn(),
}));

import { WorkspaceDecisions } from "@/components/account/workspace/workspace-decisions";

function catalogFor(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  const named: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    meku: "Meku",
  };
  return Object.keys(state.toolStates).map((slug) => ({
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

describe("WorkspaceDecisions", () => {
  beforeEach(() => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.mature);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows outcome and use case in the overview when they exist", () => {
    render(createElement(WorkspaceDecisions, { state: workspaceTestFixtures.mature }));

    expect(screen.getAllByText("Cursor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scelto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("pair programming").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scelto per il daily coding.").length).toBeGreaterThan(0);
    expect(screen.getByText("Fissato")).toBeTruthy();
  });

  it("resets the journal sheet when switching entries", () => {
    render(createElement(WorkspaceDecisions, { state: workspaceTestFixtures.mature }));

    const useCase = screen.getByLabelText("Caso d’uso") as HTMLInputElement;
    expect(useCase.value).toBe("pair programming");

    fireEvent.click(screen.getAllByRole("button", { name: /v0/i })[0]);

    const nextUseCase = screen.getByLabelText("Caso d’uso") as HTMLInputElement;
    expect(nextUseCase.value).toBe("");
    expect(screen.getByRole("heading", { name: "v0" })).toBeTruthy();
  });

  it("shows In uso and Sostituito da in the journal", () => {
    render(createElement(WorkspaceDecisions, { state: workspaceTestFixtures.mature }));

    expect(screen.getAllByText("In uso").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sostituito da Cursor").length).toBeGreaterThan(0);
  });

  it("opens the matching tool when focusSlug is in the journal", () => {
    render(
      createElement(WorkspaceDecisions, {
        state: workspaceTestFixtures.mature,
        focusSlug: "v0",
      }),
    );

    expect(screen.getByRole("heading", { name: "v0" })).toBeTruthy();
    const useCase = screen.getByLabelText("Caso d’uso") as HTMLInputElement;
    expect(useCase.value).toBe("");
  });
});
