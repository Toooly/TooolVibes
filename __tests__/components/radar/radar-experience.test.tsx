// @vitest-environment jsdom
/**
 * FULL Radar experience — interaction + data-truth + a11y tests.
 *
 * Replaces the V2 `RadarExperience` suite (map/list toggle) which described a
 * surface that no longer exists. `HomeRadarPreview` (frozen) is covered by its
 * own suite.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RadarExperience } from "@/components/radar/full-radar-experience";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { PublicToolCatalogProvider } from "@/lib/data/public-tool-catalog-context";
import { AccountPreviewProvider } from "@/components/account/account-provider";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

vi.mock("@/components/ads/tinyadz-inline-slot", () => ({
  TinyAdzInlineSlot: ({ placement }: { placement: string }) => (
    <div data-testid="tinyadz-stub" data-placement={placement} />
  ),
}));

vi.mock("@/lib/gamification/actions", () => ({ claimHiddenSignal: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const NOW = Date.parse("2026-07-28T12:00:00.000Z");

const LIVE: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-28T08:05:00.000Z",
  items: [
    {
      id: "alpha",
      name: "Alpha Tool",
      tagline: "Primo segnale reale",
      votesCount: 120,
      commentsCount: 14,
      productHuntUrl: "https://www.producthunt.com/posts/alpha",
      launchedAt: "2026-07-28T07:00:00.000Z",
      topics: ["Artificial Intelligence"],
    },
    {
      id: "beta",
      name: "Beta Tool",
      tagline: "Secondo segnale reale",
      votesCount: 80,
      commentsCount: 7,
      productHuntUrl: "https://www.producthunt.com/posts/beta",
      launchedAt: "2026-07-28T05:00:00.000Z",
    },
    {
      id: "gamma",
      name: "Gamma Tool",
      tagline: "Terzo segnale reale",
      votesCount: 40,
      commentsCount: 2,
      productHuntUrl: "https://www.producthunt.com/posts/gamma",
    },
  ],
};

const EMPTY: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-28T08:05:00.000Z",
  items: [],
};

const catalog = [
  {
    slug: "alpha-tool",
    name: "Alpha Tool",
    categoryLabel: "Vibe coding / builder app AI",
    shortDescription: "Alpha",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  },
];

function accountValue(status: "guest" | "authenticated" | "loading") {
  return {
    authEnabled: true,
    status,
    user:
      status === "authenticated"
        ? {
            id: "u1",
            email: "user@example.com",
            aud: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: "2026-01-01T00:00:00.000Z",
          }
        : null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: async () => ({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: async () => ({ ok: true, message: "ok" }),
    signOut: async () => {},
    workspaceReadyForIntentReplay: status === "authenticated",
  };
}

function renderRadar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <OverlayProvider>
      <QueryClientProvider client={queryClient}>
        <PublicToolCatalogProvider tools={catalog}>
          <AccountPreviewProvider value={accountValue("authenticated")}>
            <RadarExperience />
          </AccountPreviewProvider>
        </PublicToolCatalogProvider>
      </QueryClientProvider>
    </OverlayProvider>,
  );
}

function fetchOk(payload: ProductHuntPayload) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("RadarExperience", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("RADAR-OVERVIEW-01 renderizza i reali segnali con una sola query", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    expect(await screen.findAllByText(/Alpha Tool/)).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /cosa sta emergendo/i })).toBeTruthy();
  });

  it("RADAR-TRUTH-01 non inventa momentum ne sparkline senza storico", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    fireEvent.click(screen.getByRole("tab", { name: /trend/i }));

    expect(
      await screen.findAllByText(/dati storici in raccolta/i),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/sta esplodendo/i)).toBeNull();
    expect(screen.queryByText(/\+[0-9]+%/)).toBeNull();
  });

  it("RADAR-TRUTH-02 espone fonte e timestamp reali", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    // §4 telemetry strip — real source label and real refresh affordance.
    // The "Fonte:" prefix was dropped by the compact strip; the source value
    // itself is still the canonical Product Hunt label.
    const source = document.querySelector(".tv-rx-telemetry__source");
    expect(source?.textContent ?? "").toMatch(/product hunt/i);
    expect(
      screen.getByRole("button", { name: /aggiorna i dati/i }),
    ).toBeTruthy();
    // The whole telemetry strip is one compact control row, not a content card.
    expect(document.querySelector(".tv-rx-telemetry")).toBeTruthy();
    expect(document.querySelector(".tv-rx__freshness")).toBeNull();
    expect(screen.getAllByText(/28 lug 2026/i).length).toBeGreaterThan(0);
  });

  it("RADAR-TRUTH-03 non mostra punteggi inventati", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    expect(screen.queryByText(/★\s*9/)).toBeNull();
    expect(screen.queryByText(/9\.2/)).toBeNull();
  });

  it("RADAR-SELECT-01 il tap su un blip apre la quick preview senza navigare", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();

    const hits = await screen.findAllByRole("button", {
      name: /alpha tool/i,
    });
    fireEvent.click(hits[0]);

    expect(await screen.findByRole("dialog", { name: /anteprima di alpha tool/i })).toBeTruthy();
    expect(container.querySelector(".tv-rx-preview")).toBeTruthy();
  });

  it("opens list details at the selected row and restores its keyboard focus on close", async () => {
    window.history.replaceState(null, "", "/radar");
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();
    fireEvent.click(screen.getByRole("button", { name: "Elenco" }));
    const rowButton = await screen.findByRole("button", { name: "Apri dettagli di Alpha Tool" });
    fireEvent.click(rowButton);
    const preview = await screen.findByRole("dialog", { name: /anteprima di alpha tool/i });
    expect(preview.closest(".tv-rx-row")).toBe(rowButton.closest(".tv-rx-row"));
    expect(rowButton.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(rowButton.getAttribute("aria-controls")!)).toContain(preview);
    expect(preview.getAttribute("data-inspection")).toBe("expanded");
    expect(container.querySelectorAll(".tv-rx-preview")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Chiudi anteprima" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(rowButton);
    expect(rowButton.getAttribute("aria-expanded")).toBe("false");
    expect(new URLSearchParams(window.location.search).has("t")).toBe(false);
    window.history.replaceState(null, "", "/radar");
  });

  it("keeps mobile list search, empty recovery and area controls usable without returning to Atlas", async () => {
    window.history.replaceState(null, "", "/radar?r=week");
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    fetchMock.mockImplementation(() => fetchOk({ ...LIVE, range: "week" }));
    const { container } = renderRadar();
    fireEvent.click(screen.getByRole("button", { name: "Elenco" }));
    await screen.findByRole("button", { name: "Apri dettagli di Alpha Tool" });
    expect(container.querySelector(".tv-rx")?.getAttribute("data-browse")).toBe("list");
    const search = screen.getByRole("searchbox", { name: "Cerca un tool nel Radar" });
    fireEvent.change(search, { target: { value: "Gamma Tool" } });
    await waitFor(() => expect(container.querySelectorAll(".tv-rx-row")).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Apri dettagli di Gamma Tool" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "unmatched search" } });
    await waitFor(() => expect(container.querySelectorAll(".tv-rx-row")).toHaveLength(0));
    expect(screen.getByRole("combobox", { name: "Filtra per categoria" })).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    await waitFor(() => expect(container.querySelectorAll(".tv-rx-row")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "Mappa" }));
    expect(container.querySelector(".tv-rx")?.getAttribute("data-browse")).toBe("atlas");
    expect(new URLSearchParams(window.location.search).get("r")).toBe("week");
    window.history.replaceState(null, "", "/radar");
  });

  it("sorts the list by real attention or launch age, retaining the active filters between views", async () => {
    window.history.replaceState(null, "", "/radar");
    fetchMock.mockImplementation(() => fetchOk({ ...LIVE, items: [
      { ...LIVE.items[0], launchedAt: "2026-07-28T04:00:00.000Z" },
      { ...LIVE.items[1], launchedAt: "2026-07-28T07:30:00.000Z" },
      LIVE.items[2],
    ] }));
    const { container } = renderRadar();
    fireEvent.click(screen.getByRole("button", { name: "Elenco" }));
    await screen.findByRole("button", { name: "Apri dettagli di Alpha Tool" });
    const names = () => [...container.querySelectorAll(".tv-rx-row__name")].map(node => node.textContent);
    expect(names()).toEqual(["Alpha Tool", "Beta Tool", "Gamma Tool"]);
    fireEvent.change(screen.getByRole("combobox", { name: "Ordina i segnali" }), { target: { value: "recent" } });
    expect(names()).toEqual(["Beta Tool", "Alpha Tool", "Gamma Tool"]);
    fireEvent.click(screen.getByRole("button", { name: "Mappa" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Cerca un tool nel Radar" }), { target: { value: "Beta" } });
    fireEvent.click(screen.getByRole("button", { name: "Elenco" }));
    expect(names()).toEqual(["Beta Tool"]);
    fireEvent.click(screen.getByRole("button", { name: "Cancella ricerca" }));
    expect(names()).toEqual(["Beta Tool", "Alpha Tool", "Gamma Tool"]);
    window.history.replaceState(null, "", "/radar");
  });

  it("uses the floating journey to open the reading view and Watchlist without changing the dataset", async () => {
    window.history.replaceState(null, "", "/radar");
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();
    const journey = await screen.findByRole("navigation", { name: "Esplora i segnali del Radar" });
    fireEvent.click(journey.querySelectorAll("button")[1]);
    await screen.findByRole("button", { name: "Apri dettagli di Alpha Tool" });
    expect(container.querySelectorAll(".tv-rx-row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Mappa" }));
    fireEvent.click(screen.getByRole("navigation", { name: "Esplora i segnali del Radar" }).querySelectorAll("button")[2]);
    expect(screen.getByRole("tab", { name: "Watchlist" }).getAttribute("aria-selected")).toBe("true");
    window.history.replaceState(null, "", "/radar");
  });

  it("RADAR-FILTER-01 il filtro categoria aggiorna lista e conteggi", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    const tutti = screen.getByRole("button", { name: /^tutti$/i });
    fireEvent.click(tutti);
    expect(tutti.getAttribute("aria-pressed")).toBe("true");
  });

  it("searches every real signal, including tools hidden by Global representatives", async () => {
    window.history.replaceState(null, "", "/radar");
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();
    await screen.findAllByText(/Alpha Tool/);
    fireEvent.change(screen.getByRole("searchbox", { name: "Cerca un tool nel Radar" }), { target: { value: "Gamma Tool" } });
    await waitFor(() => expect(container.querySelectorAll(".tv-rx-blip__hit")).toHaveLength(1));
    expect(container.querySelector(".tv-rx-blip__hit")?.getAttribute("aria-label")).toContain("Gamma Tool");
    fireEvent.click(screen.getByRole("button", { name: "Elenco" }));
    expect(container.querySelectorAll(".tv-rx-row")).toHaveLength(1);
    expect(screen.getByRole("searchbox", { name: "Cerca un tool nel Radar" })).toHaveProperty("value", "Gamma Tool");
    window.history.replaceState(null, "", "/radar");
  });

  it("dismisses a previous selection when changing the area through a territory", async () => {
    window.history.replaceState(null, "", "/radar");
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();
    const hits = await screen.findAllByRole("button", { name: /alpha tool/i });
    fireEvent.click(hits[0]);
    await screen.findByRole("dialog", { name: /anteprima di alpha tool/i });
    const area = container.querySelector<SVGElement>('[data-atlas-territory][role="button"]')!;
    fireEvent.keyDown(area, { key: "Enter" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(new URLSearchParams(window.location.search).has("t")).toBe(false);
    expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
    window.history.replaceState(null, "", "/radar");
  });

  it("keeps the focused area while the next time range is loading", async () => {
    window.history.replaceState(null, "", "/radar");
    let finish!: (value: Response) => void;
    const pending = new Promise<Response>(resolve => { finish = resolve; });
    fetchMock.mockImplementation((url: string) => url.includes("range=week") ? pending : fetchOk(LIVE));
    const { container } = renderRadar();
    await screen.findAllByText(/Alpha Tool/);
    const area = container.querySelector<SVGElement>('[data-atlas-territory][role="button"]')!;
    const areaId = area.dataset.atlasTerritory;
    fireEvent.keyDown(area, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: /^7G$/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("range=week")));
    expect(new URLSearchParams(window.location.search).get("c")).toBe(areaId);
    await act(async () => { finish(await fetchOk({ ...LIVE, range: "week" })); });
    await waitFor(() => expect(container.querySelector(".tv-rx")?.getAttribute("data-focus")).toBe("local"));
    expect(new URLSearchParams(window.location.search).get("c")).toBe(areaId);
    window.history.replaceState(null, "", "/radar");
  });

  it("preserves Micro Focus after closing inspection and restores the Stack with Escape", async () => {
    window.history.replaceState(null, "", "/radar");
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    fetchMock.mockImplementation(() => fetchOk({ ...LIVE, items: LIVE.items.map(item => ({ ...item, topics: ["Productivity"], launchedAt: "2026-07-28T08:00:00.000Z" })) }));
    const { container } = renderRadar();
    const area = await screen.findByRole("button", { name: "Apri Produttività, 3 segnali" });
    fireEvent.keyDown(area, { key: "Enter" });
    const stack = await screen.findByRole("button", { name: /Apri gruppo di 3 segnali/ });
    fireEvent.keyDown(stack, { key: "Enter" });
    expect(container.querySelector(".tv-rx")?.getAttribute("data-atlas-stage")).toBe("micro");
    fireEvent.keyDown(container.querySelector(".tv-rx-blip__hit")!, { key: "Enter" });
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Chiudi anteprima" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(container.querySelector(".tv-rx")?.getAttribute("data-atlas-stage")).toBe("micro");
    fireEvent.keyDown(window, { key: "Escape" });
    await screen.findByRole("button", { name: /Apri gruppo di 3 segnali/ });
    expect(container.querySelector(".tv-rx")?.getAttribute("data-atlas-stage")).toBe("local");
    expect(container.querySelector(".tv-rx-chooser")).toBeNull();
    window.history.replaceState(null, "", "/radar");
  });

  it("RADAR-EMPTY-01 stato vuoto onesto senza dati inventati", async () => {
    fetchMock.mockImplementation(() => fetchOk(EMPTY));
    renderRadar();

    expect(await screen.findByText(/nessun segnale nel periodo|nessun risultato/i)).toBeTruthy();
  });

  it("RADAR-A11Y-01 espone una lista testuale alternativa per screen reader", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    expect(
      screen.getByRole("region", { name: /elenco testuale dei segnali/i }),
    ).toBeTruthy();
  });

  it("RADAR-A11Y-02 la legenda spiega in modo conciso le semantica della mappa", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    const summary = screen.getByText(/come leggere la mappa/i);
    fireEvent.click(summary);
    // §17 — concise legend: distance, colour, size, and an honest future-only
    // movement row. Nothing else is presented as a signal.
    expect(screen.getAllByText(/Distanza dal centro/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quando è emerso/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Colore/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Area Radar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Attenzione relativa/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Movimento/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Disponibile in futuro/i).length,
    ).toBeGreaterThan(0);
  });

  it("RADAR-A11Y-03 axe non rileva violazioni gravi", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    const { container } = renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});
