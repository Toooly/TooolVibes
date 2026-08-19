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
  addToolToPersonalStack: vi.fn(),
  setWorkspaceDecision: vi.fn(),
  setWorkspaceNote: vi.fn(),
  setWorkspacePinned: vi.fn(),
  setWorkspaceStage: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
  toggleWorkspaceSaved: vi.fn(),
}));

import { WorkspaceBiblioteca } from "@/components/account/workspace/workspace-biblioteca";

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

describe("WorkspaceBiblioteca", () => {
  beforeEach(() => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.mature);
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
  });

  it("filters rows by name, slug, or category", () => {
    render(createElement(WorkspaceBiblioteca, { state: workspaceTestFixtures.mature }));

    const search = screen.getByLabelText("Cerca nella biblioteca");
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
  });
});
