// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/account/workspace-actions", () => ({
  addToolToPersonalStack: vi.fn(),
  markWorkspaceToolUsing: vi.fn(),
}));

import { ToolDetailActionSurface } from "@/components/tool-detail-final/tool-detail-action-surface";
import {
  addToolToPersonalStack,
  markWorkspaceToolUsing,
} from "@/lib/account/workspace-actions";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import type { WorkspaceAction } from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "guest" }, apply(actions));
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function renderSurface() {
  return render(
    <ToolDetailActionSurface
      slug="cursor"
      name="Cursor"
      externalUrl="https://cursor.com"
      primaryLabel="Apri"
    />,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  seedWorkspace();
  vi.mocked(markWorkspaceToolUsing).mockClear();
  vi.mocked(addToolToPersonalStack).mockClear();
});

afterEach(() => {
  cleanup();
});

describe("ToolDetailActionSurface personal workspace", () => {
  it("does not throw or add personal chrome for a guest empty workspace", () => {
    expect(() => renderSurface()).not.toThrow();

    expect(screen.queryByText("In uso")).toBeNull();
    expect(screen.queryByText("Scelto")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lo sto usando" })).toBeNull();
    expect(screen.queryByLabelText("Aggiungi allo stack")).toBeNull();
    expect(screen.queryByRole("link", { name: "Aggiungi allo stack" })).toBeNull();
    expect(screen.getByRole("button", { name: "Salva" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aggiungi al confronto" })).toBeTruthy();
  });

  it("shows Lo sto usando when selected and unused, then calls markWorkspaceToolUsing", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
    ]);

    renderSurface();

    expect(screen.getByText("Scelto")).toBeTruthy();
    const using = screen.getByRole("button", { name: "Lo sto usando" });
    fireEvent.click(using);
    expect(markWorkspaceToolUsing).toHaveBeenCalledWith("cursor");
  });

  it("shows In uso without Lo sto usando when already using", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T0 },
    ]);

    renderSurface();

    expect(screen.getByText("In uso")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lo sto usando" })).toBeNull();
    expect(screen.getByRole("button", { name: "Rimuovi dai salvati" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aggiungi al confronto" })).toBeTruthy();
  });

  it("offers Aggiungi allo stack for stacks that do not already include the tool", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
    ]);

    renderSurface();

    const select = screen.getByLabelText("Aggiungi allo stack");
    fireEvent.change(select, { target: { value: "ai-coding" } });
    expect(addToolToPersonalStack).toHaveBeenCalledWith("ai-coding", "cursor");
  });

  it("does not offer the stack select when the tool is already in every stack", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
    ]);

    renderSurface();

    expect(screen.queryByLabelText("Aggiungi allo stack")).toBeNull();
    expect(screen.getByText("Nello stack: AI Coding")).toBeTruthy();
  });
});
