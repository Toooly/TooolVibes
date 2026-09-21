// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/account/workspace-actions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account/workspace-actions")>(
    "@/lib/account/workspace-actions",
  );
  return {
    ...actual,
    addToolToPersonalStack: vi.fn((id: string, slug: string) =>
      actual.addToolToPersonalStack(id, slug),
    ),
    markWorkspaceToolUsing: vi.fn(),
  };
});

import { ToolDetailActionSurface } from "@/components/tool-detail-final/tool-detail-action-surface";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { closeSaveOverflow } from "@/components/tools/save-overflow-state";
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
    <OverlayProvider>
      <ToolDetailActionSurface
        slug="cursor"
        name="Cursor"
        externalUrl="https://cursor.com"
        primaryLabel="Apri"
      />
    </OverlayProvider>,
  );
}

async function openOverflow() {
  fireEvent.click(screen.getByRole("button", { name: "Altre azioni per Cursor" }));
  await waitFor(() => {
    expect(document.querySelector("[data-save-overflow-title]")).toBeTruthy();
  });
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
  window.localStorage.clear();
  seedWorkspace();
  closeSaveOverflow();
  vi.mocked(markWorkspaceToolUsing).mockClear();
  vi.mocked(addToolToPersonalStack).mockClear();
});

afterEach(() => {
  cleanup();
  closeSaveOverflow();
});

describe("ToolDetailActionSurface personal workspace", () => {
  it("does not throw or add personal chrome for a guest empty workspace", () => {
    expect(() => renderSurface()).not.toThrow();

    expect(screen.queryByText("In uso")).toBeNull();
    expect(screen.queryByText("Scelto")).toBeNull();
    expect(screen.queryByText("Il tuo stato")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lo sto usando" })).toBeNull();
    expect(screen.queryByLabelText("Aggiungi allo stack")).toBeNull();
    expect(screen.queryByRole("link", { name: "Aggiungi allo stack" })).toBeNull();
    expect(screen.getByRole("button", { name: "Salva Cursor" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confronta Cursor" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Visita il sito ufficiale di Cursor" })).toBeTruthy();
  });

  it("hides personal chrome on the first view even when the tool is selected", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
    ]);

    renderSurface();

    expect(screen.queryByText("Scelto")).toBeNull();
    expect(screen.queryByText("Il tuo stato")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lo sto usando" })).toBeNull();
    expect(screen.getByRole("button", { name: "Rimuovi Cursor dai Salvati" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confronta Cursor" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Visita il sito ufficiale di Cursor" })).toBeTruthy();
  });

  it("hides In uso and keeps the three public actions when already using", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T0 },
    ]);

    renderSurface();

    expect(screen.queryByText("In uso")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lo sto usando" })).toBeNull();
    expect(screen.getByRole("button", { name: "Rimuovi Cursor dai Salvati" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confronta Cursor" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Visita il sito ufficiale di Cursor" })).toBeTruthy();
  });

  it("offers Aggiungi allo stack from Speed 2 overflow", async () => {
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

    expect(screen.queryByLabelText("Aggiungi allo stack")).toBeNull();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(addToolToPersonalStack).not.toHaveBeenCalled();
  });

  it("does not offer a stack select when the tool is already in every stack", async () => {
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
    expect(screen.queryByText("Nello stack: AI Coding")).toBeNull();
    await openOverflow();
    expect(screen.getByRole("button", { name: /Nello stack/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Aggiungi a AI Coding" })).toBeNull();
  });
});

describe("ToolDetailActionSurface public CTA order", () => {
  it("orders Confronta, then Visita, then Salva", () => {
    renderSurface();

    const group = screen.getByRole("group", { name: "Azioni scheda" });
    const kids = Array.from(group.children);

    expect(kids[0]?.className).toContain("td-final-cta--primary");
    expect(kids[0]?.textContent).toContain("Confronta");
    expect(kids[1]?.className).toContain("td-final-cta--secondary");
    expect(kids[1]?.className).not.toContain("td-final-cta--primary");
    expect(kids[1]?.className).not.toContain("is-ready");
    expect(kids[1]?.getAttribute("href")).toBe("https://cursor.com");
    expect(kids[2]?.className).toContain("td-final-save-cluster");
    expect(kids[2]?.textContent).toContain("Salva");
  });

  it("keeps Visita outline/secondary and Confronta as the yellow primary", () => {
    renderSurface();

    const compare = screen.getByRole("button", { name: "Confronta Cursor" });
    const visit = screen.getByRole("link", { name: "Visita il sito ufficiale di Cursor" });
    const save = screen.getByRole("button", { name: "Salva Cursor" });

    expect(compare.className).toContain("td-final-cta--primary");
    expect(save.className).toContain("td-final-cta--save");
    expect(save.className).not.toContain("td-final-cta--primary");
    expect(visit.className).toContain("td-final-cta--secondary");
    expect(visit.className).not.toContain("td-final-cta--primary");
    expect(visit.className).not.toContain("is-ready");
  });

  it("keeps compare rank and Apri confronto in the DOM for desktop", () => {
    seedWorkspace([{ type: "compare/toggle", slug: "cursor", at: T0 }]);
    renderSurface();

    expect(document.querySelector(".td-final-compare-rank")).toBeTruthy();
    const openCompare = screen.getByRole("link", { name: "Aggiungi ancora 1 tool per attivare il confronto" });
    expect(openCompare.className).toContain("td-final-cta--open-compare");
    expect(openCompare.className).toContain("td-final-cta--secondary");
    expect(openCompare.className).not.toContain("td-final-cta--primary");
    expect(openCompare.getAttribute("href")).toBe("/compare");
  });
});
