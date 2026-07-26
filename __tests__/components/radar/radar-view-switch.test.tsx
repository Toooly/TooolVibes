// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import type { RadarDesktopVisual } from "@/lib/radar/radar-view-config";

// Le server actions non sono oggetto del test: il mock tiene il jsdom
// deterministico (come nei test delle singole view).
vi.mock("@/lib/gamification/actions", () => ({
  claimHiddenSignal: vi.fn(),
}));

import { RadarViewSwitch } from "@/components/radar/radar-view-switch";

const LIVE_PAYLOAD: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-19T08:00:00.000Z",
  items: [
    {
      id: "ph-1",
      name: "Alpha Tool",
      tagline: "Primo segnale",
      votesCount: 120,
      commentsCount: 10,
      productHuntUrl: "https://www.producthunt.com/posts/alpha",
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

type MatchMediaController = {
  setWidth: (width: number) => void;
};

function stubMatchMedia(initialWidth: number): MatchMediaController {
  let width = initialWidth;
  const listeners = new Set<(event: { matches: boolean }) => void>();
  // Arità miste: addEventListener(type, cb) e legacy addListener(cb).
  const pickListener = (args: unknown[]) =>
    args.find((arg): arg is (event: { matches: boolean }) => void => typeof arg === "function");
  const add = (...args: unknown[]) => {
    const listener = pickListener(args);
    if (listener) listeners.add(listener);
  };
  const remove = (...args: unknown[]) => {
    const listener = pickListener(args);
    if (listener) listeners.delete(listener);
  };

  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        get matches() {
          return width >= 1280;
        },
        media: query,
        onchange: null,
        addEventListener: add,
        removeEventListener: remove,
        addListener: add,
        removeListener: remove,
        dispatchEvent: () => true,
      }) as unknown as MediaQueryList,
  );

  return {
    setWidth(nextWidth: number) {
      width = nextWidth;
      const event = { matches: width >= 1280 };
      listeners.forEach((listener) => listener(event));
    },
  };
}

function renderSwitch(initialDesktopVisual: RadarDesktopVisual = "table") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RadarViewSwitch initialDesktopVisual={initialDesktopVisual} />
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  // Stub persistente sul prototype: non è rimosso da vi.unstubAllGlobals.
  // Il layer canvas non è oggetto del test: context assente → effetto in uscita.
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(
    null,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

function stubBrowserObservers() {
  // Re-stub a ogni test: vi.unstubAllGlobals in afterEach rimuove anche gli
  // stub globali, quindi ResizeObserver/IntersectionObserver/RAF vanno
  // reinstallati prima di ogni render (framer-motion whileInView li richiede).
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
}

describe("RadarViewSwitch — render responsive esclusivo (B44 / quota PERF-1201)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    stubBrowserObservers();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => fetchOk(LIVE_PAYLOAD));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("SSR: fallback identico senza leggere window durante il render", () => {
    // renderToString gira senza matchMedia: se il componente leggesse window
    // durante il render lancerebbe. Deve invece produrre il fallback stabile.
    const html = renderToString(
      <RadarViewSwitch initialDesktopVisual="table" />,
    );

    expect(html).toContain("Caricamento del radar…");
    expect(html).not.toContain("radar-mobile");
    expect(html).not.toContain("radar-command--desktop");
  });

  it.each([390, 768, 1024, 1279])(
    "viewport %i px: monta solo la mobile view",
    async (width) => {
      stubMatchMedia(width);
      const { container } = renderSwitch();

      expect(
        await screen.findByText("Lanci Product Hunt ordinati per periodo, senza dati simulati.", undefined, {
          timeout: 10_000,
        }),
      ).toBeTruthy();
      expect(container.querySelector(".radar-mobile")).toBeTruthy();
      expect(container.querySelector(".radar-command--desktop")).toBeNull();
    },
    15_000,
  );

  it.each([1280, 1440, 1920])(
    "viewport %i px: monta solo la desktop view",
    async (width) => {
      stubMatchMedia(width);
      const { container } = renderSwitch();

      expect(
        await screen.findByRole(
          "region",
          { name: "Classifica Product Hunt" },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(container.querySelector(".radar-command--desktop")).toBeTruthy();
      expect(container.querySelector(".radar-mobile")).toBeNull();
    },
  );

  it("passa la visual iniziale da config alla composizione desktop", async () => {
    stubMatchMedia(1440);
    const { container } = renderSwitch("nodes");

    expect(
      await screen.findByRole("region", { name: "Radar visuale Product Hunt" }, { timeout: 5000 }),
    ).toBeTruthy();
    expect(container.querySelector(".radar-command--desktop")).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: "Classifica Product Hunt" }),
    ).toBeNull();
  });

  it("resize oltre il boundary: swap esclusivo dei tree e UNA request per key (cache condivisa)", async () => {
    const viewport = stubMatchMedia(1440);
    const { container } = renderSwitch();

    // Desktop pronto: una request per range=day (composizione + tabella deduplicate).
    expect(
      await screen.findByText("Alpha Tool", undefined, { timeout: 5000 }),
    ).toBeTruthy();
    expect(container.querySelector(".radar-command--desktop")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Resize sotto il boundary: desktop smontata, mobile montata.
    act(() => viewport.setWidth(390));

    expect(
      await screen.findByText("Lanci Product Hunt ordinati per periodo, senza dati simulati.", undefined, {
          timeout: 5000,
        }),
    ).toBeTruthy();
    expect(container.querySelector(".radar-mobile")).toBeTruthy();
    expect(container.querySelector(".radar-command--desktop")).toBeNull();
    // La mobile view è servita dalla cache condivisa: ancora UNA request.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Resize di ritorno: swap inverso, ancora esclusivo e senza nuove request.
    act(() => viewport.setWidth(1920));

    expect(
      await screen.findByRole(
        "region",
        { name: "Classifica Product Hunt" },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(container.querySelector(".radar-command--desktop")).toBeTruthy();
    expect(container.querySelector(".radar-mobile")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
