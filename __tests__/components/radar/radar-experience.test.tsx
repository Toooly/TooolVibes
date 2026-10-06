// @vitest-environment jsdom
/**
 * FULL Radar experience — interaction + data-truth + a11y tests.
 *
 * Replaces the V2 `RadarExperience` suite (map/list toggle) which described a
 * surface that no longer exists. `HomeRadarPreview` (frozen) is covered by its
 * own suite.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("RADAR-FILTER-01 il filtro categoria aggiorna lista e conteggi", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    const tutti = screen.getByRole("button", { name: /^tutti$/i });
    fireEvent.click(tutti);
    expect(tutti.getAttribute("aria-pressed")).toBe("true");
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

  it("RADAR-A11Y-02 la legenda spiega colore, dimensione, raggio e alone", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE));
    renderRadar();

    await screen.findAllByText(/Alpha Tool/);
    const summary = screen.getByText(/come leggere la mappa/i);
    fireEvent.click(summary);
    expect(screen.getAllByText(/Settore/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Attenzione misurata/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Alone \/ momentum/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/servono pi\u00f9 snapshot per calcolare la variazione|Non disponibile/i).length,
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
