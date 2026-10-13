// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalCommandPalette } from "@/components/app/global-command-palette";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { searchTools } from "@/lib/search/tool-search";
import {
  activateToolWorkspaceOwner,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/lib/config/sound", () => ({
  playTooolvibesSound: vi.fn(),
}));

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
  Element.prototype.scrollIntoView = vi.fn();
});

/* Fixture: same shape the root layout feeds into PublicToolCatalogProvider,
   including the production false-positive trap (WeWeb's source URL mentions
   "blink"; URLs are not searchable). */
const CATALOG = [
  {
    slug: "blink",
    name: "Blink",
    categoryLabel: "Vibe coding / builder app AI",
    shortDescription:
      "AI app builder che trasforma un'idea in un'app funzionante in pochi minuti.",
    featured: true,
    toolOfWeek: true,
    tags: ["vibe coding", "ai app builder", "prompt-to-app"],
    levelLabel: "Segnalato",
  },
  {
    slug: "vibecode",
    name: "VibeCode",
    categoryLabel: "Vibe coding / builder app AI",
    shortDescription: "Builder AI per iterare una app mobile o web da prompt.",
    featured: true,
    toolOfWeek: false,
    tags: ["vibe coding", "builder app AI"],
    levelLabel: "Segnalato",
  },
  {
    slug: "weweb",
    name: "WeWeb",
    categoryLabel: "No-code / builder web app",
    shortDescription: "Piattaforma visuale no-code/AI per creare web app.",
    featured: true,
    toolOfWeek: false,
    tags: ["no-code", "builder web app"],
    levelLabel: "Segnalato",
  },
];

const WORKSPACE_CATALOG = [
  ...CATALOG,
  {
    slug: "cursor",
    name: "Cursor",
    categoryLabel: "Coding",
    shortDescription: "Editor AI.",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: "Segnalato",
  },
  {
    slug: "v0",
    name: "v0",
    categoryLabel: "Coding",
    shortDescription: "Generatore UI.",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: "Segnalato",
  },
  {
    slug: "meku",
    name: "Meku",
    categoryLabel: "Coding",
    shortDescription: "Builder.",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: "Segnalato",
  },
  {
    slug: "linear",
    name: "Linear",
    categoryLabel: "Product",
    shortDescription: "Issue tracking.",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: "Segnalato",
  },
];

function renderPalette(tools: PublicToolCatalogItem[] = CATALOG) {
  return render(
    <PublicToolCatalogProvider tools={tools}>
      <GlobalCommandPalette />
    </PublicToolCatalogProvider>,
  );
}

function renderWorkspacePalette(
  state = workspaceTestFixtures.mature,
) {
  act(() => {
    activateToolWorkspaceOwner({ kind: "account", userId: "qa-user" }, state);
  });
  return renderPalette(WORKSPACE_CATALOG);
}

function renderAuthenticatedPalette(
  state = createEmptyWorkspaceState(),
  tools: PublicToolCatalogItem[] = CATALOG,
) {
  act(() => {
    activateToolWorkspaceOwner({ kind: "account", userId: "qa-user" }, state);
  });
  return renderPalette(tools);
}

function openPalette() {
  act(() => {
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  });
}

beforeEach(() => {
  pushMock.mockClear();
  act(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    useToolWorkspaceStore.setState({ isCommandOpen: false, selectedSlug: null });
  });
});

afterEach(() => {
  cleanup();
  act(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });
});

describe("GlobalCommandPalette — unified search (B31 / IA-504)", () => {
  it("opens with Ctrl+K and shows the static groups on an empty query", () => {
    renderPalette();
    openPalette();

    expect(screen.getByPlaceholderText("Cerca tool, azioni o sezioni...")).toBeTruthy();
    expect(screen.getByText("Trova")).toBeTruthy();
    expect(screen.getByText("Vai")).toBeTruthy();
    expect(screen.getByText("Catalogo")).toBeTruthy();
    expect(screen.queryByText("Fai")).toBeNull();
    expect(screen.queryByText("Apri catalogo tool")).toBeNull();
  });

  it("returns the same tools as the canonical search service for the same query", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blink" } });

    const expected = searchTools(CATALOG, "blink").map((tool) => tool.slug);
    expect(expected).toEqual(["blink"]);

    // The palette renders exactly those tools — Blink first, and WeWeb is
    // NOT a match despite its tracked source URL containing "blink".
    expect(screen.getByText("Blink")).toBeTruthy();
    expect(screen.queryByText("WeWeb")).toBeNull();
    expect(screen.queryByText("VibeCode")).toBeNull();
  });

  it("selects the first result with Enter (keyboard) and deep-links the tool", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blink" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/toools/blink");
    expect(useToolWorkspaceStore.getState().isCommandOpen).toBe(false);
  });

  it("offers the archive deep link carrying the query into the URL", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blink" } });
    fireEvent.click(screen.getByText("Cerca “blink” nell’archivio"));

    expect(pushMock).toHaveBeenCalledWith("/archivio?q=blink");
  });

  it("tolerates typos ('blnik' still finds Blink)", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blnik" } });

    expect(screen.getByText("Blink")).toBeTruthy();
  });

  it("shows the empty state when nothing matches", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "zzzz-niente" } });

    expect(
      screen.getByText("Nessun risultato. Prova con categoria, nome o caso d’uso."),
    ).toBeTruthy();
    expect(screen.queryByText("Trova")).toBeNull();
    expect(screen.queryByText("Vai")).toBeNull();
    expect(screen.queryByText("Fai")).toBeNull();
  });

  it("resets the query when the palette is closed and reopened", () => {
    renderPalette();
    openPalette();

    const input = screen.getByPlaceholderText(
      "Cerca tool, azioni o sezioni...",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "blink" } });
    expect(input.value).toBe("blink");

    act(() => {
      useToolWorkspaceStore.getState().setCommandOpen(false);
    });
    openPalette();

    const reopened = screen.getByPlaceholderText(
      "Cerca tool, azioni o sezioni...",
    ) as HTMLInputElement;
    expect(reopened.value).toBe("");
    expect(screen.getByText("Catalogo")).toBeTruthy();
  });

  it("sends salvati to the workspace library, not /shortlist", () => {
    renderAuthenticatedPalette();
    openPalette();

    fireEvent.click(screen.getByText("Salvati"));

    expect(pushMock).toHaveBeenCalledWith("/account?view=salvati");
    expect(pushMock).not.toHaveBeenCalledWith("/shortlist");
  });

  it("lists workspace destinations in empty-query navigation", () => {
    renderAuthenticatedPalette();
    openPalette();

    expect(screen.getByText("Vai")).toBeTruthy();
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Salvati")).toBeTruthy();
    expect(screen.getByText("Stack")).toBeTruthy();
    expect(screen.getByText("Catalogo")).toBeTruthy();
    expect(screen.getByText("Catalogo · Radar")).toBeTruthy();
    expect(screen.getByText("Impostazioni")).toBeTruthy();
    expect(screen.queryByText("Decisioni")).toBeNull();
    expect(screen.queryByText("Recenti")).toBeNull();
    expect(screen.queryByText("Segnale")).toBeNull();
    expect(screen.queryByText("Biblioteca")).toBeNull();
    expect(screen.queryByText("Radar")).toBeNull();
    fireEvent.click(screen.getByText("Home"));

    expect(pushMock).toHaveBeenCalledWith("/account");
  });

  it("lists a deferred tool for the rimandati alias", () => {
    renderWorkspacePalette(workspaceTestFixtures.mature);
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "rimandati" } });

    expect(screen.getByText("Rimandati")).toBeTruthy();
    expect(screen.getByText("Meku")).toBeTruthy();
    expect(screen.queryByText("Tool per “rimandati”")).toBeNull();
  });

  it("opens a named stack with the stack id in the href", () => {
    renderWorkspacePalette(workspaceTestFixtures.withStacks);
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "AI Coding" } });
    fireEvent.click(screen.getByText("AI Coding"));

    expect(pushMock).toHaveBeenCalledWith("/account?view=stack&stack=ai-coding");
  });
});

describe("GlobalCommandPalette — WAVE 12 Trova / Vai / Fai", () => {
  it("labels populated groups Trova / Vai / Fai", () => {
    renderWorkspacePalette(workspaceTestFixtures.withCompare);
    openPalette();

    expect(screen.getByText("Trova")).toBeTruthy();
    expect(screen.getByText("Vai")).toBeTruthy();
    expect(screen.getByText("Fai")).toBeTruthy();
  });

  it("labels Radar as Catalogo · Radar, not a peer dest", () => {
    renderAuthenticatedPalette();
    openPalette();

    expect(screen.getByText("Catalogo · Radar")).toBeTruthy();
    expect(screen.queryByText("Radar")).toBeNull();
    fireEvent.click(screen.getByText("Catalogo · Radar"));
    expect(pushMock).toHaveBeenCalledWith("/radar");
  });

  it("hides Decisioni, Recenti, Segnale and Biblioteca from Vai", () => {
    renderAuthenticatedPalette();
    openPalette();

    expect(screen.queryByText("Decisioni")).toBeNull();
    expect(screen.queryByText("Recenti")).toBeNull();
    expect(screen.queryByText("Segnale")).toBeNull();
    expect(screen.queryByText("Biblioteca")).toBeNull();
    expect(screen.queryByText("Decisioni / Da riprendere")).toBeNull();
    expect(screen.queryByText("Vai ai tool salvati")).toBeNull();
    expect(screen.queryByText("Apri i tuoi stack")).toBeNull();
  });

  it("hides Confronta when compare is empty", () => {
    renderPalette();
    openPalette();
    expect(screen.queryByText("Apri confronto")).toBeNull();
    expect(screen.queryByText("Fai")).toBeNull();
  });

  it("shows Confronta in Fai only when compare is live", () => {
    renderWorkspacePalette(workspaceTestFixtures.withCompare);
    openPalette();
    expect(screen.getByText("Fai")).toBeTruthy();
    expect(screen.getByText("Apri confronto")).toBeTruthy();
    fireEvent.click(screen.getByText("Apri confronto"));
    expect(pushMock).toHaveBeenCalledWith("/compare");
  });

  it("routes a salvati query to the Salvati dest, not /shortlist", () => {
    renderAuthenticatedPalette();
    openPalette();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "salvati" } });

    expect(screen.getByText("Vai")).toBeTruthy();
    expect(screen.getByText("Salvati")).toBeTruthy();
    expect(screen.queryByText("Trova")).toBeNull();
    expect(screen.queryByText("Fai")).toBeNull();
    fireEvent.click(screen.getByText("Salvati"));

    expect(pushMock).toHaveBeenCalledWith("/account?view=salvati");
    expect(pushMock).not.toHaveBeenCalledWith("/shortlist");
  });

  it("matches home, catalogo, stack and radar queries to Vai rows", () => {
    renderAuthenticatedPalette();
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");

    fireEvent.change(input, { target: { value: "home" } });
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Vai")).toBeTruthy();

    fireEvent.change(input, { target: { value: "catalogo" } });
    expect(screen.getByText("Catalogo")).toBeTruthy();
    expect(screen.queryByText("Catalogo · Radar")).toBeNull();

    fireEvent.change(input, { target: { value: "stack" } });
    expect(screen.getByText("Stack")).toBeTruthy();

    fireEvent.change(input, { target: { value: "radar" } });
    expect(screen.getByText("Catalogo · Radar")).toBeTruthy();
    expect(screen.queryByText("Radar")).toBeNull();
  });

  it("hides empty groups", () => {
    renderPalette();
    openPalette();

    expect(screen.queryByText("Fai")).toBeNull();

    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blink" } });
    expect(screen.getByText("Trova")).toBeTruthy();
    expect(screen.queryByText("Vai")).toBeNull();
    expect(screen.queryByText("Fai")).toBeNull();
  });
});


describe("GlobalCommandPalette — Wave D personal search", () => {
  it("PALETTE-D-01 basic guest search unchanged", () => {
    renderPalette();
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "blink" } });
    expect(screen.getByText("Blink")).toBeTruthy();
    expect(screen.queryByText("Cerca nel tuo spazio")).toBeNull();
  });

  it("PALETTE-D-02 auth alias in uso", () => {
    renderWorkspacePalette(workspaceTestFixtures.quietReturning);
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "in uso" } });
    expect(screen.getAllByText("In uso").length).toBeGreaterThan(0);
    expect(screen.getByText("Cursor")).toBeTruthy();
  });

  it("PALETTE-D-03 auth alias rimandati", () => {
    renderWorkspacePalette(workspaceTestFixtures.mature);
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "rimandati" } });
    expect(screen.getByText("Rimandati")).toBeTruthy();
    expect(screen.getByText("Meku")).toBeTruthy();
  });

  it("PALETTE-D-04 auth alias da rivedere", () => {
    renderWorkspacePalette(workspaceTestFixtures.reviewDue);
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "da rivedere" } });
    expect(screen.getByText("Da rivedere")).toBeTruthy();
    expect(screen.getByText("Meku")).toBeTruthy();
  });

  it("PALETTE-D-05 auth alias con note", () => {
    renderWorkspacePalette(workspaceTestFixtures.mature);
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "con note" } });
    expect(screen.getByText("Nota presente")).toBeTruthy();
    expect(screen.getByText("Cursor")).toBeTruthy();
  });

  it("PALETTE-D-06 guest personal alias does not dead-end to /account", () => {
    renderPalette();
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "rimandati" } });
    expect(screen.getByText("Cerca nel tuo spazio")).toBeTruthy();
    expect(screen.queryByText("Meku")).toBeNull();
    fireEvent.click(screen.getByText("Cerca nel tuo spazio"));
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining("/account"));
  });

  it("PALETTE-D-07 personal result navigates to the tool page", () => {
    renderWorkspacePalette(workspaceTestFixtures.quietReturning);
    openPalette();
    const input = screen.getByPlaceholderText("Cerca tool, azioni o sezioni...");
    fireEvent.change(input, { target: { value: "usage:using" } });
    fireEvent.click(screen.getByText("Cursor"));
    expect(pushMock).toHaveBeenCalledWith("/toools/cursor");
  });
});

// This suite tests destination selection; document transport is covered separately.
vi.mock("@/lib/shell/document-navigation", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/shell/document-navigation")>();
  return { ...actual, navigateSite: (href: string, router: { push: (href: string) => void; replace: (href: string) => void }, replace = false) => {
    if (replace) router.replace(href);
    else router.push(href);
  } };
});
