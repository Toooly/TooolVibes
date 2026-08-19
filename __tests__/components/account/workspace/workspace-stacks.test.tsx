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

const actionsRuntime = vi.hoisted(() => ({
  createPersonalStack: vi.fn((name: string, description?: string | null) => ({
    personalStacks: [
      {
        id: "created-stack",
        name,
        description: description ?? null,
        slugs: [],
        archivedAt: null,
        updatedAt: "2026-06-03T10:00:00.000Z",
      },
    ],
  })),
  renamePersonalStack: vi.fn(),
  archivePersonalStack: vi.fn(),
  addToolToPersonalStack: vi.fn(),
  removeToolFromPersonalStack: vi.fn(),
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/account/workspace-actions", () => ({
  createPersonalStack: (...args: unknown[]) =>
    actionsRuntime.createPersonalStack(...(args as [string, string | null | undefined])),
  renamePersonalStack: (...args: unknown[]) =>
    actionsRuntime.renamePersonalStack(...args),
  archivePersonalStack: (...args: unknown[]) =>
    actionsRuntime.archivePersonalStack(...args),
  addToolToPersonalStack: (...args: unknown[]) =>
    actionsRuntime.addToolToPersonalStack(...args),
  removeToolFromPersonalStack: (...args: unknown[]) =>
    actionsRuntime.removeToolFromPersonalStack(...args),
}));

import { WorkspaceStacks } from "@/components/account/workspace/workspace-stacks";

function catalogFor(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  return state.saved.slugs.map((slug) => ({
    slug,
    name: slug === "cursor" ? "Cursor" : slug,
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  }));
}

describe("WorkspaceStacks", () => {
  beforeEach(() => {
    catalogRuntime.value = catalogFor(workspaceTestFixtures.withStacks);
    actionsRuntime.createPersonalStack.mockClear();
    actionsRuntime.renamePersonalStack.mockClear();
    actionsRuntime.archivePersonalStack.mockClear();
    actionsRuntime.addToolToPersonalStack.mockClear();
    actionsRuntime.removeToolFromPersonalStack.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates a stack with an optional description", () => {
    catalogRuntime.value = [];
    render(createElement(WorkspaceStacks, { state: workspaceTestFixtures.guestEmpty }));

    fireEvent.change(screen.getByPlaceholderText("Es. AI Coding"), {
      target: { value: "Client work" },
    });
    fireEvent.change(screen.getByPlaceholderText("A cosa serve questo gruppo"), {
      target: { value: "Per le consegne di maggio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));

    expect(actionsRuntime.createPersonalStack).toHaveBeenCalledWith(
      "Client work",
      "Per le consegne di maggio",
    );
  });

  it("shows name, description, and tool count in the overview", () => {
    render(createElement(WorkspaceStacks, { state: workspaceTestFixtures.withStacks }));

    expect(screen.getAllByText("AI Coding").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agenti e editor").length).toBeGreaterThan(0);
    expect(screen.getByText("1 tool")).toBeTruthy();
    expect(screen.getAllByText("Cursor").length).toBeGreaterThan(0);
  });
});
