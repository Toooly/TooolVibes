// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  addToolToPersonalStack: vi.fn(),
  createPersonalStack: vi.fn(),
  createPersonalStackId: vi.fn((name: string) => name),
  deferWorkspaceTool: vi.fn(),
  markWorkspaceToolReplaced: vi.fn(),
  markWorkspaceToolStopped: vi.fn(),
  markWorkspaceToolUsing: vi.fn(),
  commitWorkspaceDecision: vi.fn(),
  reopenWorkspaceDecision: vi.fn(),
  removeToolFromPersonalStack: vi.fn(),
  setWorkspaceDecision: vi.fn(),
  setWorkspaceNote: vi.fn(),
  setWorkspacePinned: vi.fn(),
  setWorkspaceStage: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
  toggleWorkspaceSaved: vi.fn(),
}));

import { WorkspaceBiblioteca } from "@/components/account/workspace/workspace-biblioteca";
import { markWorkspaceToolUsing } from "@/lib/account/workspace-actions";

function catalogFor(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  return state.saved.slugs.map((slug) => {
    const named: Record<string, string> = {
      cursor: "Cursor",
      v0: "v0",
      meku: "Meku",
      blink: "Blink",
      linear: "Linear",
    };
    const category =
      slug === "cursor" || slug === "v0" || slug === "meku"
        ? "Coding"
        : slug === "blink" || slug === "linear"
          ? "Product"
          : "Altro";
    return {
      slug,
      name: named[slug] ?? slug.replace("qa-tool-", "QA "),
      categoryLabel: category,
      shortDescription: "",
      featured: false,
      toolOfWeek: false,
      tags: [],
      levelLabel: null,
    };
  });
}

function rowSlugs() {
  return screen.getAllByRole("listitem").map((row) => row.getAttribute("data-slug"));
}

function selectedOnly(): WorkspaceStateV1 {
  return [
    { type: "saved/set" as const, slug: "cursor", saved: true, at: "2026-06-01T10:00:00.000Z" },
    { type: "tool/decision" as const, slug: "cursor", outcome: "selected" as const, at: "2026-06-03T10:00:00.000Z" },
  ].reduce((state, action) => reduceWorkspaceState(state, action), createEmptyWorkspaceState());
}

describe("WorkspaceBiblioteca", () => {
  beforeEach(() => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.mature);
    vi.mocked(markWorkspaceToolUsing).mockClear();
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
  });

  afterEach(() => {
    cleanup();
  });

  it("renders every saved tool without a 20-item cutoff", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));

    expect(workspaceTestFixtures.mature.saved.slugs.length).toBeGreaterThan(20);
    expect(rowSlugs()).toHaveLength(workspaceTestFixtures.mature.saved.slugs.length);
    expect(screen.queryByText(/Mostra tutti/)).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("list", { name: "Libreria software" })).toBeTruthy();
  });

  it("filters rows by name, slug, or category", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));

    const search = screen.getByLabelText("Cerca in Salvati");
    fireEvent.change(search, { target: { value: "Cursor" } });
    expect(rowSlugs()).toEqual(["cursor"]);

    fireEvent.change(search, { target: { value: "qa-tool-12" } });
    expect(rowSlugs()).toEqual(["qa-tool-12"]);

    fireEvent.change(search, { target: { value: "Coding" } });
    expect([...rowSlugs()].sort()).toEqual(["cursor", "meku", "v0"]);
  });

  it("changes row order when sort changes", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));

    const recent = rowSlugs();
    fireEvent.change(screen.getByLabelText("Ordina"), {
      target: { value: "alpha" },
    });
    const alpha = rowSlugs();

    expect(alpha).not.toEqual(recent);
    expect(alpha[0]).toBe("blink");
    expect(alpha).toEqual(
      [...alpha].sort((left, right) => {
        const names = new Map(
          catalogRuntime.value.map((tool) => [tool.slug, tool.name]),
        );
        return (names.get(left ?? "") ?? left ?? "").localeCompare(
          names.get(right ?? "") ?? right ?? "",
          "it",
        );
      }),
    );
  });

  it("keeps the empty library calm", () => {
    catalogRuntime.value = [];
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.guestEmpty }));
    expect(screen.getByText("Nessun tool salvato ancora")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Inizia dal catalogo" })).toHaveProperty(
      "href",
      expect.stringContaining("/archivio"),
    );
    expect(screen.queryByRole("group", { name: "Relazione" })).toBeNull();
    expect(screen.queryByText(/12 Salvati|KPI|Scelti 3/i)).toBeNull();
  });

  it("hides relationship filters on a few-item library", () => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.fewSaved);
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.fewSaved }));
    expect(rowSlugs()).toHaveLength(3);
    expect(screen.queryByRole("group", { name: "Relazione" })).toBeNull();
  });

  it("filters In uso from the relationship chips", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));

    fireEvent.click(screen.getByRole("button", { name: /In uso/ }));
    expect(rowSlugs()).toEqual(["cursor"]);
  });

  it("shows compare membership and opens DecisionSheet from Valuta", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));
    const blink = document.querySelector('[data-slug="blink"]');
    expect(blink).toBeInstanceOf(HTMLElement);
    expect(within(blink as HTMLElement).getByText("Nel confronto")).toBeTruthy();

    const blank = document.querySelector('[data-slug="qa-tool-12"]');
    expect(blank).toBeInstanceOf(HTMLElement);
    fireEvent.click(within(blank as HTMLElement).getByRole("button", { name: "Valuta" }));
    expect(document.querySelector("[data-decision-sheet]")).toBeTruthy();
    expect(document.querySelector("[data-decision-source='salvati']")).toBeTruthy();
  });

  it("surfaces a restrained Review signal and Rivedi action", () => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.reviewDue);
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.reviewDue }));
    expect(screen.getByText("Da rivedere")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rivedi" })).toBeTruthy();
  });

  it("calls markWorkspaceToolUsing from Conferma uso", () => {
    const state = selectedOnly();
    catalogRuntime.value = catalogFor(state);
    render(createElement(WorkspaceBiblioteca, { state }));

    const row = document.querySelector('[data-slug="cursor"]');
    expect(row).toBeInstanceOf(HTMLElement);
    fireEvent.click(
      within(row as HTMLElement).getByRole("button", { name: "Conferma uso" }),
    );

    expect(markWorkspaceToolUsing).toHaveBeenCalledWith("cursor");
  });

  it("does not render a KPI HUD or a second library", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));
    expect(screen.queryByText("Biblioteca")).toBeNull();
    expect(screen.queryByText(/12 Salvati/)).toBeNull();
    expect(document.querySelector(".tv-home")).toBeNull();
    expect(document.querySelector("[data-kpi]")).toBeNull();
  });
});
