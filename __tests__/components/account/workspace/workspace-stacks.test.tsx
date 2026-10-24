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
  restorePersonalStack: vi.fn(),
  adoptLegacyListaStack: vi.fn(),
  addToolToPersonalStack: vi.fn(),
  removeToolFromPersonalStack: vi.fn(),
  markWorkspaceToolUsing: vi.fn(),
  toggleWorkspaceCompare: vi.fn(),
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
  restorePersonalStack: (...args: unknown[]) =>
    actionsRuntime.restorePersonalStack(...args),
  adoptLegacyListaStack: (...args: unknown[]) =>
    actionsRuntime.adoptLegacyListaStack(...args),
  addToolToPersonalStack: (...args: unknown[]) =>
    actionsRuntime.addToolToPersonalStack(...args),
  removeToolFromPersonalStack: (...args: unknown[]) =>
    actionsRuntime.removeToolFromPersonalStack(...args),
  markWorkspaceToolUsing: (...args: unknown[]) =>
    actionsRuntime.markWorkspaceToolUsing(...args),
  toggleWorkspaceCompare: (...args: unknown[]) =>
    actionsRuntime.toggleWorkspaceCompare(...args),
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
    actionsRuntime.restorePersonalStack.mockClear();
    actionsRuntime.adoptLegacyListaStack.mockClear();
    actionsRuntime.addToolToPersonalStack.mockClear();
    actionsRuntime.removeToolFromPersonalStack.mockClear();
    actionsRuntime.markWorkspaceToolUsing.mockClear();
    actionsRuntime.toggleWorkspaceCompare.mockClear();
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
    fireEvent.change(screen.getByPlaceholderText("A cosa ti serve questo stack"), {
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

  it("shows honest member counts for a stack with mixed members", () => {
    const state = workspaceTestFixtures.mature;
    catalogRuntime.value = catalogFor(state);
    render(createElement(WorkspaceStacks, { state }));

    // AI Coding: cursor usage=using, v0 rejected → "1 in uso"
    // Free stack: blink outcome=null → "1 in valutazione"
    // Client stack: linear selected+replaced → omitted (zero)
    expect(screen.getByText("1 in uso")).toBeTruthy();
    expect(screen.getByText("1 in valutazione")).toBeTruthy();
    expect(screen.queryByText(/0 in valutazione/)).toBeNull();
    expect(screen.queryByText(/0 scelto/)).toBeNull();
    expect(screen.queryByText(/0 in uso/)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("opens the matching stack when stackId is provided", () => {
    const state = workspaceTestFixtures.mature;
    catalogRuntime.value = catalogFor(state);
    render(createElement(WorkspaceStacks, { state, stackId: "free-stack" }));

    expect(screen.getByRole("heading", { name: "Free stack" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Free stack/ }).getAttribute("aria-current"),
    ).toBe("true");
  });

  it("opens an archived stack from stackId with a restore CTA", () => {
    const archived = {
      ...workspaceTestFixtures.withStacks,
      personalStacks: workspaceTestFixtures.withStacks.personalStacks.map((stack) => ({
        ...stack,
        archivedAt: "2026-07-01T00:00:00.000Z",
      })),
    };
    catalogRuntime.value = catalogFor(archived);
    render(
      createElement(WorkspaceStacks, { state: archived, stackId: "ai-coding" }),
    );

    expect(screen.getByRole("heading", { name: "AI Coding" })).toBeTruthy();
    const restore = screen.getAllByRole("button", { name: "Ripristina" });
    expect(restore.length).toBeGreaterThan(0);
    fireEvent.click(restore[restore.length - 1]!);
    expect(actionsRuntime.restorePersonalStack).toHaveBeenCalledWith("ai-coding");
  });

  it("restores an archived stack", () => {
    const archived = {
      ...workspaceTestFixtures.withStacks,
      personalStacks: workspaceTestFixtures.withStacks.personalStacks.map((stack, index) =>
        index === 0
          ? { ...stack, archivedAt: "2026-07-01T00:00:00.000Z" }
          : stack,
      ),
    };
    catalogRuntime.value = catalogFor(archived);
    render(createElement(WorkspaceStacks, { state: archived }));

    fireEvent.click(screen.getByRole("button", { name: "Ripristina" }));
    expect(actionsRuntime.restorePersonalStack).toHaveBeenCalled();
  });
});
