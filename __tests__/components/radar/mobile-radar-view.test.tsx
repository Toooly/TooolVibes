// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

// Le server actions non sono esercitate in questo test: il mock evita di
// caricare la catena "use server" (server-only, next/cache) in jsdom.
vi.mock("@/lib/gamification/actions", () => ({
  claimHiddenSignal: vi.fn(),
}));

import { MobileRadarView } from "@/components/radar/mobile-radar-view";

// B44: la view consuma la query condivisa (PERF-1202); ogni render ha un
// Query Client fresco per isolare cache e network count tra i test.
function renderMobileRadarView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MobileRadarView />
    </QueryClientProvider>,
  );
}

const LIVE_PAYLOAD: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-18T08:00:00.000Z",
  items: [
    {
      id: "ph-1",
      name: "Alpha Tool",
      tagline: "Primo segnale",
      votesCount: 120,
      commentsCount: 10,
      productHuntUrl: "https://www.producthunt.com/posts/alpha",
    },
    {
      id: "ph-2",
      name: "Beta Tool",
      tagline: "Secondo segnale",
      votesCount: 80,
      commentsCount: 5,
      productHuntUrl: "https://www.producthunt.com/posts/beta",
    },
  ],
};

const WEEK_PAYLOAD: ProductHuntPayload = {
  ...LIVE_PAYLOAD,
  range: "week",
  items: [
    {
      id: "ph-3",
      name: "Gamma Tool",
      tagline: "Segnale settimanale",
      votesCount: 240,
      commentsCount: 22,
      productHuntUrl: "https://www.producthunt.com/posts/gamma",
    },
  ],
};

function fetchOk(payload: ProductHuntPayload) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
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
  vi.stubGlobal(
    "IntersectionObserver",
    class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  // Il layer canvas non è oggetto del test: context assente → effetto in uscita.
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(
    null,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("MobileRadarView — stati onesti del radar (B36 / FLOW-606)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("live: una sola fetch per range, provenienza e timestamp dichiarati", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_PAYLOAD));

    renderMobileRadarView();

    expect(await screen.findByText("Classifica radar")).toBeTruthy();
    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    expect(
      screen.getByText(/Dati live Product Hunt, aggiornati alle 08:00 UTC/),
    ).toBeTruthy();
    expect(screen.getByText("Radar live")).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/product-hunt?range=day",
    );
  });

  it("stale: dichiara esplicitamente il fallback con timestamp di origine", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        message: "Aggiornamento live non riuscito.",
      }),
    );

    renderMobileRadarView();

    expect(await screen.findByText("Radar (ultima sync)")).toBeTruthy();
    expect(
      screen.getByText(/Ultima sincronizzazione Product Hunt: 08:00 UTC/),
    ).toBeTruthy();
    const statuses = await screen.findAllByRole("status");
    expect(statuses.some((status) => status.textContent?.includes("Aggiornamento live non riuscito"))).toBe(true);
    expect(statuses.some((status) => status.textContent?.includes("08:00 UTC"))).toBe(true);
    // I dati reali dell'ultima sync restano visibili, non sostituiti da placeholder.
    expect(await screen.findAllByText("Beta Tool")).not.toHaveLength(0);
  });

  it("error: nessun dato inventato, stato di pausa dichiarato", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    renderMobileRadarView();

    expect(await screen.findByText("Radar non disponibile")).toBeTruthy();
    // Stato dichiarato nell'header, senza nodi simulati nello strumento.
    expect((await screen.findAllByText("Radar in pausa")).length).toBeGreaterThan(0);
    expect(screen.getByText("Feed Product Hunt non disponibile")).toBeTruthy();
    expect(screen.queryByText("Classifica radar")).toBeNull();
    expect(document.querySelectorAll(".radar-mobile__node")).toHaveLength(0);
  });

  it("missing-token: messaggio del backend e nessuna classifica finta", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        status: "missing-token",
        source: "none",
        stale: false,
        range: "day",
        updatedAt: "2026-07-18T08:00:00.000Z",
        items: [],
        message: "Classifica Product Hunt non configurata.",
      }),
    );

    renderMobileRadarView();

    expect((await screen.findAllByText("Radar in pausa")).length).toBeGreaterThan(0);
    expect(
      await screen.findByText("Classifica Product Hunt non configurata."),
    ).toBeTruthy();
    expect(screen.queryByText("Classifica radar")).toBeNull();
  });

  it("empty: dichiara assenza di segnali senza inventare dati", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        status: "ok",
        source: "product-hunt-live",
        stale: false,
        range: "day",
        updatedAt: "2026-07-18T08:00:00.000Z",
        items: [],
      }),
    );

    renderMobileRadarView();

    await waitFor(() =>
      expect(screen.getByText("Nessun segnale disponibile")).toBeTruthy(),
    );
    expect(screen.queryByText("Classifica radar")).toBeNull();
  });

  it("cambio periodo: aggiorna la query e mantiene aria-pressed coerente", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      String(input).includes("range=week")
        ? fetchOk(WEEK_PAYLOAD)
        : fetchOk(LIVE_PAYLOAD),
    );

    renderMobileRadarView();
    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Settimana" }));

    expect(await screen.findAllByText("Gamma Tool")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Settimana" }).getAttribute("aria-pressed")).toBe("true");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/product-hunt?range=week");
  });
});
