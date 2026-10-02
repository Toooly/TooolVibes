// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, useEffect, useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/archivio",
}));

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { SaveOverflow } from "@/components/tools/save-overflow";
import { WorkspaceBiblioteca } from "@/components/account/workspace/workspace-biblioteca";
import { WorkspaceStacks } from "@/components/account/workspace/workspace-stacks";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import {
  closeSaveOverflow,
} from "@/components/tools/save-overflow-state";
import { makeCatalogTool } from "../directory/catalog-test-fixtures";
import {
  addToolToPersonalStack,
  archivePersonalStack,
  commitWorkspaceDecision,
  renamePersonalStack,
} from "@/lib/account/workspace-actions";
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/workspace-events";
import type { WorkspaceAction, WorkspaceStateV1 } from "@/lib/discovery/types";
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

function seedGuest(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "guest" }, apply(actions));
}

function seedAccount(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, apply(actions));
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

function catalogFor(slugs: string[]): PublicToolCatalogItem[] {
  return slugs.map((slug) => ({
    slug,
    name: slug === "cursor" ? "Cursor" : slug === "v0" ? "v0" : slug,
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  }));
}

function catalogFromState(state: WorkspaceStateV1): PublicToolCatalogItem[] {
  const slugs = new Set([
    ...state.saved.slugs,
    ...state.personalStacks.flatMap((stack) => stack.slugs),
  ]);
  return catalogFor([...slugs]);
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

function guestAccountValue() {
  return {
    authEnabled: true,
    status: "guest" as const,
    user: null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    signOut: vi.fn().mockResolvedValue(undefined),
    workspaceReadyForIntentReplay: false,
  };
}

function renderCard(
  overrides: Parameters<typeof makeCatalogTool>[0] = { slug: "cursor", name: "Cursor" },
) {
  const tool = makeCatalogTool(overrides);
  return render(
    <OverlayProvider>
      <ArchiveV4ToolCard tool={tool} />
      <SaveOverflow slug={tool.slug} toolName={tool.name} />
    </OverlayProvider>,
  );
}

function renderCardWithGuestGate(
  overrides: Parameters<typeof makeCatalogTool>[0] = { slug: "cursor", name: "Cursor" },
) {
  const tool = makeCatalogTool(overrides);
  return render(
    <OverlayProvider>
      <AccountPreviewProvider value={guestAccountValue()}>
        <AuthContinuationProvider>
          <ArchiveV4ToolCard tool={tool} />
          <SaveOverflow slug={tool.slug} toolName={tool.name} />
        </AuthContinuationProvider>
      </AccountPreviewProvider>
    </OverlayProvider>,
  );
}

function LiveBiblioteca() {
  const [state, setState] = useState(getCanonicalToolWorkspaceState);
  useEffect(() => {
    const bump = () => setState(getCanonicalToolWorkspaceState());
    window.addEventListener(DISCOVERY_SYNC_EVENT, bump);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, bump);
  }, []);
  return (
    <PublicToolCatalogProvider tools={catalogFromState(state)}>
      <WorkspaceBiblioteca state={state} />
    </PublicToolCatalogProvider>
  );
}

function renderBiblioteca() {
  return render(<LiveBiblioteca />);
}

function renderStacks(state = getCanonicalToolWorkspaceState()) {
  return render(
    <PublicToolCatalogProvider tools={catalogFromState(state)}>
      {createElement(WorkspaceStacks, { state })}
    </PublicToolCatalogProvider>,
  );
}

async function openOverflow(toolName = "Cursor") {
  fireEvent.click(screen.getByRole("button", { name: `Altre azioni per ${toolName}` }));
  await waitFor(() => {
    expect(document.querySelector("[data-save-overflow-title]")).toBeTruthy();
  });
}

function workspaceJson() {
  return JSON.stringify(getCanonicalToolWorkspaceState());
}

function clickConfrontaQuesti() {
  const link = screen.getByRole("link", { name: "Confronta questi tool" });
  link.addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(link);
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
  seedGuest();
  closeSaveOverflow();
});

afterEach(() => {
  cleanup();
  closeSaveOverflow();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("Wave 9 stack from Save", () => {
  it("W9-T1 auth Save → create stack → tool in stack.slugs AND saved.slugs", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "AI Coding" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toContain("cursor");
    expect(state.personalStacks).toHaveLength(1);
    expect(state.personalStacks[0]?.name).toBe("AI Coding");
    expect(state.personalStacks[0]?.slugs).toEqual(["cursor"]);
    expect(state.personalStacks[0]?.description).toBeNull();
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeNull();
    });
  });

  it("W9-T2 cancel/close without create → still saved, personalStacks unchanged", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "Wave9DraftNomeTransient" },
    });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeNull();
    });
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toEqual(["cursor"]);
    expect(state.personalStacks).toEqual([]);
  });

  it("W9-T3 add existing stack", async () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
    ]);
    renderCard();
    await openOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((stack) => stack.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor"]);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("cursor");
  });

  it("W9-T4 duplicate add does not duplicate slug", async () => {
    seedAccount([
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
    renderCard();
    await openOverflow();
    const member = screen.getByRole("button", { name: /Nello stack · AI Coding/ });
    expect(member).toHaveProperty("disabled", true);
    fireEvent.click(member);
    addToolToPersonalStack("ai-coding", "cursor");
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((stack) => stack.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor"]);
  });

  it("W9-T5 auth + 0 stacks shows Nuovo stack (not I tuoi stack dead link)", async () => {
    seedAccount();
    renderCard();
    await openOverflow();
    expect(screen.getByLabelText("Nuovo stack")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crea" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "I tuoi stack" })).toBeNull();
    expect(screen.queryByText("I tuoi stack")).toBeNull();
  });

  it("W9-T6 many stacks: filter/list bounded", async () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      ...Array.from({ length: 8 }, (_, index) => ({
        type: "stacks/create" as const,
        id: `stack-${index + 1}`,
        name: `Stack ${index + 1}`,
        description: null,
        at: T0,
      })),
    ]);
    renderCard();
    await openOverflow();
    const filter = screen.getByLabelText("Filtra stack");
    const list = document.querySelector("[data-stack-pick-list]");
    expect(filter).toBeTruthy();
    expect(list).toBeTruthy();
    expect(list?.className).toMatch(/max-h-48/);
    expect(list?.className).toMatch(/overflow-y-auto/);
    expect(screen.getByRole("button", { name: "Aggiungi a Stack 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aggiungi a Stack 8" })).toBeTruthy();
    fireEvent.change(filter, { target: { value: "Stack 3" } });
    expect(screen.getByRole("button", { name: "Aggiungi a Stack 3" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Aggiungi a Stack 1" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Aggiungi a Stack 8" })).toBeNull();
  });

  it("W9-T7 Salvati create uses same helper/component", () => {
    seedAccount([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);
    renderBiblioteca();
    fireEvent.click(screen.getByLabelText("Azioni per Cursor"));
    expect(document.querySelector("[data-stack-pick]")).toBeTruthy();
    expect(document.querySelector("[data-stack-pick-create]")).toBeTruthy();
    expect(screen.getByLabelText("Nuovo stack")).toBeTruthy();
  });

  it("W9-T8 Salvati add existing", () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
    ]);
    renderBiblioteca();
    fireEvent.click(screen.getByLabelText("Azioni per Cursor"));
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((stack) => stack.id === "ai-coding")
        ?.slugs,
    ).toEqual(["cursor"]);
  });

  it("W9-T9 new stack appears in WorkspaceStacks index", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "Desk work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));
    cleanup();
    renderStacks();
    expect(screen.getAllByText("Desk work").length).toBeGreaterThan(0);
  });

  it("W9-T10 detail members correct", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "Desk work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));
    const state = getCanonicalToolWorkspaceState();
    const created = state.personalStacks.find((stack) => stack.name === "Desk work");
    expect(created?.slugs).toEqual(["cursor"]);
    cleanup();
    renderStacks(state);
    expect(screen.getAllByText("Cursor").length).toBeGreaterThan(0);
  });

  it("W9-T11 remove from stack does not unsave", () => {
    seedAccount([
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
    renderStacks();
    fireEvent.click(screen.getByRole("button", { name: "Togli" }));
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toContain("cursor");
    expect(state.personalStacks.find((stack) => stack.id === "ai-coding")?.slugs).toEqual([]);
  });

  it("W9-T12 archive stack does not unsave", () => {
    seedAccount([
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
    archivePersonalStack("ai-coding");
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toContain("cursor");
    expect(state.personalStacks.find((stack) => stack.id === "ai-coding")?.archivedAt).toBeTruthy();
    expect(state.personalStacks.find((stack) => stack.id === "ai-coding")?.slugs).toEqual([
      "cursor",
    ]);
  });

  it("W9-T13 archive preserves events/decisions on toolStates", () => {
    seedAccount([
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
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "selected",
      reason: "Per il daily",
    });
    const before = getCanonicalToolWorkspaceState();
    archivePersonalStack("ai-coding");
    const after = getCanonicalToolWorkspaceState();
    expect(after.saved.slugs).toContain("cursor");
    expect(after.events).toEqual(before.events);
    expect(after.toolStates.cursor?.decision).toEqual(before.toolStates.cursor?.decision);
    expect(after.personalStacks[0]?.archivedAt).toBeTruthy();
  });

  it("W9-T14 rename preserves membership", () => {
    seedAccount([
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
    renamePersonalStack("ai-coding", "Coding desk");
    const stack = getCanonicalToolWorkspaceState().personalStacks.find(
      (item) => item.id === "ai-coding",
    );
    expect(stack?.name).toBe("Coding desk");
    expect(stack?.slugs).toEqual(["cursor"]);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("cursor");
  });

  it("W9-T15 queueStackCompare writes compare.slugs", () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "v0", at: T0 },
    ]);
    renderStacks();
    clickConfrontaQuesti();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["cursor", "v0"]);
  });

  it("W9-T16 respects MAX 5", () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "compare/toggle", slug: "a", at: T0 },
      { type: "compare/toggle", slug: "b", at: T0 },
      { type: "compare/toggle", slug: "c", at: T0 },
      { type: "compare/toggle", slug: "d", at: T0 },
      { type: "compare/toggle", slug: "e", at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "v0", at: T0 },
    ]);
    renderStacks();
    expect(screen.getByText(/Il confronto tiene al massimo 5/)).toBeTruthy();
    clickConfrontaQuesti();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("W9-T17 compareSlugs length updates", () => {
    seedAccount([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "compare/toggle", slug: "linear", at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "v0", at: T0 },
    ]);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toHaveLength(1);
    renderStacks();
    clickConfrontaQuesti();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toHaveLength(3);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([
      "linear",
      "cursor",
      "v0",
    ]);
  });

  it("W9-T18 guest Speed 1 save still no login", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    expect(screen.queryByText(/Accedi/i)).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["cursor"]);
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });

  it("W9-T19 guest overflow opens AuthSheet instead of creating a stack", async () => {
    renderCardWithGuestGate();
    await openOverflow();
    expect(screen.getByRole("button", { name: "Confronta" })).toBeTruthy();
    expect(screen.queryByText(/Accedi/i)).toBeNull();
    expect(document.querySelector("[data-stack-pick-create]")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "AI Coding" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Tieni lo stack con te")).toBeTruthy();
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });

  it("guest with existing stacks can see them but add opens AuthSheet", async () => {
    seedGuest([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        description: null,
        at: T0,
      },
    ]);
    renderCardWithGuestGate();
    await openOverflow();
    expect(screen.getByRole("button", { name: "Aggiungi a AI Coding" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi a AI Coding" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(
      getCanonicalToolWorkspaceState().personalStacks.find((stack) => stack.id === "ai-coding")
        ?.slugs,
    ).toEqual([]);
  });

  it("W9-T24 draft name not in persisted workspace JSON", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "Wave9DraftNomeTransient" },
    });
    expect(workspaceJson()).not.toContain("Wave9DraftNomeTransient");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeNull();
    });
    expect(workspaceJson()).not.toContain("Wave9DraftNomeTransient");
    const keys = collectKeys(JSON.parse(workspaceJson()));
    expect(keys.has("draftName")).toBe(false);
    expect(keys.has("overflow")).toBe(false);
  });

  it("W9-T25 only personalStacks (no new store)", async () => {
    seedAccount();
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Salva Cursor" }));
    await openOverflow();
    fireEvent.change(screen.getByLabelText("Nuovo stack"), {
      target: { value: "AI Coding" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));
    const state = getCanonicalToolWorkspaceState();
    expect(Object.keys(state).sort()).toEqual(
      [
        "schemaVersion",
        "clearedAt",
        "saved",
        "compare",
        "stack",
        "personalStacks",
        "toolStates",
        "events",
      ].sort(),
    );
    expect(state.stack.slugs).toEqual([]);
    expect(state.personalStacks).toHaveLength(1);

    const root = process.cwd();
    const pick = readFileSync(join(root, "components/tools/stack-pick-or-create.tsx"), "utf8");
    const overflow = readFileSync(join(root, "components/tools/save-overflow.tsx"), "utf8");
    const biblioteca = readFileSync(
      join(root, "components/account/workspace/workspace-biblioteca.tsx"),
      "utf8",
    );
    for (const source of [pick, overflow, biblioteca]) {
      expect(source).not.toContain("addToolToWorkingPersonalStack");
      expect(source).not.toContain("reduceAddToWorkingPersonalStack");
      expect(source).not.toContain("LISTA_STACK_ID");
      expect(source).not.toContain("addToStack(");
    }
    expect(pick).toContain("createPersonalStack(");
    expect(pick).toContain("addToolToPersonalStack(");
    expect(pick).toContain("createPersonalStackId(");
    expect(pick).not.toContain('type: "stacks/create"');
    expect(pick).not.toContain('type: "stacks/add"');
  });
});
