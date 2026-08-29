// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { SAVE_HOLD_MS } from "@/components/tools/save-hold";
import {
  closeSaveOverflow,
  getOpenSaveOverflowKey,
} from "@/components/tools/save-overflow-state";
import { makeCatalogTool } from "../directory/catalog-test-fixtures";
import { setWorkspaceDecision } from "@/lib/account/workspace-actions";
import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import type { WorkspaceAction } from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

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

function seedAccountWorkspace(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, apply(actions));
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function stubMatchMedia(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop && query.includes("min-width: 1024px"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function collectKeys(value: unknown, acc = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, acc));
    return acc;
  }
  for (const [key, nested] of Object.entries(value)) {
    acc.add(key);
    collectKeys(nested, acc);
  }
  return acc;
}

function renderCard(
  overrides: Parameters<typeof makeCatalogTool>[0] = { slug: "cursor", name: "Cursor" },
) {
  return render(
    <OverlayProvider>
      <ArchiveV4ToolCard tool={makeCatalogTool(overrides)} />
    </OverlayProvider>,
  );
}

function renderCards(slugs: string[]) {
  return render(
    <OverlayProvider>
      {slugs.map((slug) => (
        <ArchiveV4ToolCard
          key={slug}
          tool={makeCatalogTool({ slug, name: slug })}
        />
      ))}
    </OverlayProvider>,
  );
}

async function openOverflow(toolName = "Cursor") {
  fireEvent.click(screen.getByRole("button", { name: `Altre azioni per ${toolName}` }));
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
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
  window.localStorage.clear();
  stubMatchMedia(false);
  seedWorkspace();
  closeSaveOverflow();
});

afterEach(() => {
  cleanup();
  closeSaveOverflow();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.useRealTimers();
});

describe("Wave 6 two-speed Save", () => {
  it("W6-T1 Save updates canonical saved.slugs", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("W6-T2 Save persists via the canonical path", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.saved.slugs).toEqual(["cursor"]);
  });

  it("W6-T3 Saved control shows pressed / Salvato state", () => {
    renderCard();
    const button = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Rimuovi Cursor dai salvati");
    expect(screen.getAllByText("Salvato").length).toBeGreaterThan(0);
  });

  it("W6-T4 Save does not require organization", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(document.querySelector("[data-save-overflow-title]")).toBeNull();
    expect(getOpenSaveOverflowKey()).toBeNull();
    expect(screen.queryByText("Completa il salvataggio")).toBeNull();
  });

  it("W6-T5 Guest save shows no Accedi / login overlay", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(screen.queryByText(/Accedi/i)).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("W6-T6 Guest save survives reload", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.saved.slugs).toContain("cursor");
  });

  it("W6-T7 Auth owner uses the same saved corpus", () => {
    activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, createEmptyWorkspaceState());
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("W6-T8 Unsave / undo via second click", () => {
    renderCard();
    const button = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([]);
  });

  it("W6-T9 Speed 2 Confronta adds to compare", async () => {
    renderCard();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Confronta" }));
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["cursor"]);
  });

  it("W6-T10 Confronta keeps the tool saved", async () => {
    renderCard();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Confronta" }));
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("cursor");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toContain("cursor");
  });

  it("W6-T11 compareSlugs length updates", async () => {
    renderCard();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toHaveLength(0);
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Confronta" }));
    expect(getCanonicalToolWorkspaceState().compare.slugs).toHaveLength(1);
  });

  it("W6-T12 At 5/5 Confronta does not add a 6th", async () => {
    seedWorkspace([
      { type: "compare/toggle", slug: "a", at: T0 },
      { type: "compare/toggle", slug: "b", at: T0 },
      { type: "compare/toggle", slug: "c", at: T0 },
      { type: "compare/toggle", slug: "d", at: T0 },
      { type: "compare/toggle", slug: "e", at: T0 },
    ]);
    renderCard();
    await openOverflow();
    const full = screen.getByRole("button", { name: "Pieno · apri confronto" });
    expect(full).toHaveProperty("disabled", true);
    expect(screen.getByRole("link", { name: "Apri confronto" }).getAttribute("href")).toBe(
      "/compare",
    );
    fireEvent.click(full);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("W6-T13 Rapid sequential saves of 4 slugs all remain", () => {
    renderCards(["alpha", "beta", "gamma", "delta"]);
    for (const slug of ["alpha", "beta", "gamma", "delta"]) {
      fireEvent.click(screen.getByRole("button", { name: `Salva ${slug}` }));
    }
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "alpha",
      "beta",
      "gamma",
      "delta",
    ]);
  });

  it("W6-T14 Rapid saves do not stack multiple overflows", () => {
    renderCards(["alpha", "beta", "gamma", "delta"]);
    for (const slug of ["alpha", "beta", "gamma", "delta"]) {
      fireEvent.click(screen.getByRole("button", { name: `Salva ${slug}` }));
    }
    expect(document.querySelectorAll("[data-save-overflow-title]").length).toBeLessThanOrEqual(1);
    expect(getOpenSaveOverflowKey()).toBeNull();
  });

  it("W6-T15 Dismiss overflow does not unsave", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeNull();
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("W6-T16 Guest + 0 stacks: Confronta present, no Nuovo stack", async () => {
    renderCard();
    await openOverflow();
    expect(screen.getByRole("button", { name: "Confronta" })).toBeTruthy();
    expect(screen.queryByText(/Nuovo stack/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Aggiungi a/ })).toBeNull();
    expect(screen.queryByText(/Accedi/i)).toBeNull();
  });

  it("W6-T17 Guest→auth merge still unions slugs saved through toggleSaved", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    const guest = getCanonicalToolWorkspaceState();
    const account = apply([
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
    ]);
    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.saved.slugs.sort()).toEqual(["cursor", "v0"]);
  });

  it("W6-T18 setWorkspaceDecision still clears compare", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
    ]);
    setWorkspaceDecision("cursor", "selected");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
  });

  it("W6-T19 Newly saved slug is in the Salvati corpus", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("cursor");
  });

  it("W6-T22 Opening overflow does not persist overflow keys", async () => {
    renderCard();
    await openOverflow();
    const keys = collectKeys(JSON.parse(JSON.stringify(getCanonicalToolWorkspaceState())));
    expect(keys.has("overflow")).toBe(false);
    expect(keys.has("open")).toBe(false);
    expect(keys.has("popover")).toBe(false);
    expect(JSON.stringify(getCanonicalToolWorkspaceState())).not.toMatch(/overflow|popover/i);
  });

  it("W6-T23 aria-pressed + aria-label include the tool name", () => {
    renderCard();
    const button = screen.getByRole("button", { name: "Salva Cursor" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("aria-label")).toContain("Cursor");
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toContain("Cursor");
  });

  it("W6-T24 <1024 sheet padding references the dock offset", async () => {
    stubMatchMedia(false);
    renderCard();
    await openOverflow();
    const sheet = document.querySelector("[data-save-overflow-sheet], [data-slot='sheet-content']");
    expect(sheet).toBeTruthy();
    const className = (sheet as HTMLElement).className;
    expect(className).toMatch(/tv-bottom-nav-total|tv-save-overflow-sheet|td-final-save-overflow-sheet|ar4-save-overflow-sheet/);
    expect(
      className.includes("--tv-bottom-nav-total") ||
        className.includes("tv-save-overflow-sheet") ||
        className.includes("td-final-save-overflow-sheet") ||
        className.includes("ar4-save-overflow-sheet"),
    ).toBe(true);
  });

  it("hold 400ms on ShortlistToggle opens overflow; click does not", async () => {
    vi.useFakeTimers();
    renderCard();
    const heart = screen.getByRole("button", { name: "Salva Cursor" });
    fireEvent.click(heart);
    expect(document.querySelector("[data-save-overflow-title]")).toBeNull();

    fireEvent.pointerDown(heart, { button: 0, clientX: 8, clientY: 8 });
    act(() => {
      vi.advanceTimersByTime(SAVE_HOLD_MS);
    });
    vi.useRealTimers();
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeTruthy();
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
  });

  it("filing to one of two stacks calls addToolToPersonalStack", async () => {
    seedAccountWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      {
        type: "stacks/create",
        id: "design",
        name: "Design",
        description: null,
        at: T0,
      },
    ]);
    renderCard();
    expect(getCanonicalToolWorkspaceState().personalStacks.map((stack) => stack.id)).toEqual([
      "ai-coding",
      "design",
    ]);
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    const stacks = getCanonicalToolWorkspaceState().personalStacks;
    expect(stacks.map((stack) => stack.id)).toContain("ai-coding");
    expect(stacks.find((stack) => stack.id === "ai-coding")?.slugs).toContain("cursor");
  });

  it("cap 5: Confronta disabled and /compare link present", async () => {
    seedWorkspace([
      { type: "compare/toggle", slug: "a", at: T0 },
      { type: "compare/toggle", slug: "b", at: T0 },
      { type: "compare/toggle", slug: "c", at: T0 },
      { type: "compare/toggle", slug: "d", at: T0 },
      { type: "compare/toggle", slug: "e", at: T0 },
    ]);
    renderCard();
    await openOverflow();
    expect(screen.getByRole("button", { name: "Pieno · apri confronto" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("link", { name: "Apri confronto" }).getAttribute("href")).toBe(
      "/compare",
    );
  });
});
