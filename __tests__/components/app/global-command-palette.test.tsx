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
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import { searchTools } from "@/lib/search/tool-search";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

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
    levelLabel: "In evidenza",
  },
  {
    slug: "vibecode",
    name: "VibeCode",
    categoryLabel: "Vibe coding / builder app AI",
    shortDescription: "Builder AI per iterare una app mobile o web da prompt.",
    featured: true,
    toolOfWeek: false,
    tags: ["vibe coding", "builder app AI"],
    levelLabel: "In evidenza",
  },
  {
    slug: "weweb",
    name: "WeWeb",
    categoryLabel: "No-code / builder web app",
    shortDescription: "Piattaforma visuale no-code/AI per creare web app.",
    featured: true,
    toolOfWeek: false,
    tags: ["no-code", "builder web app"],
    levelLabel: "In evidenza",
  },
];

function renderPalette() {
  return render(
    <PublicToolCatalogProvider tools={CATALOG}>
      <GlobalCommandPalette />
    </PublicToolCatalogProvider>,
  );
}

function openPalette() {
  act(() => {
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  });
}

beforeEach(() => {
  pushMock.mockClear();
  act(() => {
    useToolWorkspaceStore.setState({ isCommandOpen: false, selectedSlug: null });
  });
});

afterEach(() => {
  cleanup();
});

describe("GlobalCommandPalette — unified search (B31 / IA-504)", () => {
  it("opens with Ctrl+K and shows the static groups on an empty query", () => {
    renderPalette();
    openPalette();

    expect(screen.getByPlaceholderText("Cerca tool, azioni o sezioni...")).toBeTruthy();
    expect(screen.getByText("Apri catalogo tool")).toBeTruthy();
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

    expect(pushMock).toHaveBeenCalledWith("/archivio?tool=blink");
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
    expect(screen.getByText("Apri catalogo tool")).toBeTruthy();
  });
});
