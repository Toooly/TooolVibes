// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import {
  buildProductHuntErrorPayload,
  productHuntRadarQueryKey,
  useProductHuntRadar,
} from "@/lib/radar/use-product-hunt-radar";

const LIVE_DAY_PAYLOAD: ProductHuntPayload = {
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

const LIVE_WEEK_PAYLOAD: ProductHuntPayload = {
  ...LIVE_DAY_PAYLOAD,
  range: "week",
  items: [
    {
      id: "ph-9",
      name: "Gamma Tool",
      tagline: "Segnale settimanale",
      votesCount: 240,
      commentsCount: 21,
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

function createQueryHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

describe("useProductHuntRadar — query unica per key (B44 / PERF-1202)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("live: restituisce il payload e chiama l'endpoint con la key di range", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY_PAYLOAD));
    const { Wrapper } = createQueryHarness();

    const { result } = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.payload?.source).toBe("product-hunt-live"),
    );
    expect(result.current.payload?.items[0]?.name).toBe("Alpha Tool");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/product-hunt?range=day",
    );
  });

  it("dedup: due consumer sulla stessa key producono UNA sola request", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY_PAYLOAD));
    const { Wrapper } = createQueryHarness();

    const first = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });
    const second = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(first.result.current.payload).toBeDefined(),
    );
    await waitFor(() =>
      expect(second.result.current.payload).toBeDefined(),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.result.current.payload?.items[0]?.name).toBe("Alpha Tool");
  });

  it("cache: un nuovo consumer entro lo staleTime non rifà la request", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY_PAYLOAD));
    const { Wrapper } = createQueryHarness();

    const first = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(first.result.current.payload).toBeDefined(),
    );
    first.unmount();

    const second = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(second.result.current.payload).toBeDefined(),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.result.current.payload?.source).toBe("product-hunt-live");
  });

  it("range change: nuova key = nuova request; ritorno su key nota = cache", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      String(input).includes("range=week")
        ? fetchOk(LIVE_WEEK_PAYLOAD)
        : fetchOk(LIVE_DAY_PAYLOAD),
    );
    const { Wrapper } = createQueryHarness();

    const { result, rerender } = renderHook(
      ({ range }: { range: "day" | "week" }) => useProductHuntRadar(range),
      { wrapper: Wrapper, initialProps: { range: "day" } },
    );

    await waitFor(() =>
      expect(result.current.payload?.range).toBe("day"),
    );

    rerender({ range: "week" });
    await waitFor(() =>
      expect(result.current.payload?.range).toBe("week"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("range=week");

    rerender({ range: "day" });
    await waitFor(() =>
      expect(result.current.payload?.range).toBe("day"),
    );
    // Nessuna nuova request: la key "day" è servita dalla cache condivisa.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.payload?.items[0]?.name).toBe("Alpha Tool");
  });

  it("error di rete: fallback unico di contratto, nessun dato inventato, nessun retry automatico", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const { Wrapper } = createQueryHarness();

    const { result } = renderHook(() => useProductHuntRadar("month"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.payload?.status).toBe("error"),
    );

    const payload = result.current.payload;
    expect(payload?.source).toBe("none");
    expect(payload?.stale).toBe(false);
    expect(payload?.range).toBe("month");
    expect(payload?.items).toEqual([]);
    expect(payload?.message).toBe(
      "Classifica Product Hunt temporaneamente non disponibile.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("error HTTP non-ok: stesso fallback unico del caso rete", async () => {
    fetchMock.mockResolvedValue(
      new Response("upstream error", { status: 502 }),
    );
    const { Wrapper } = createQueryHarness();

    const { result } = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.payload?.status).toBe("error"),
    );
    expect(result.current.payload?.source).toBe("none");
    expect(result.current.payload?.items).toEqual([]);
  });

  it("retry manuale: refetch dopo errore emette una nuova request", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY_PAYLOAD));
    const { Wrapper } = createQueryHarness();

    const { result } = renderHook(() => useProductHuntRadar("day"), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.payload?.status).toBe("error"),
    );

    act(() => result.current.refetch());

    await waitFor(() =>
      expect(result.current.payload?.source).toBe("product-hunt-live"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("la query key è stabile e namespaced per range", () => {
    expect(productHuntRadarQueryKey("day")).toEqual(["product-hunt-radar", "day"]);
    expect(productHuntRadarQueryKey("week")).toEqual([
      "product-hunt-radar",
      "week",
    ]);
    expect(productHuntRadarQueryKey("month")).not.toEqual(
      productHuntRadarQueryKey("day"),
    );
  });

  it("buildProductHuntErrorPayload rispetta il contratto B36", () => {
    const payload = buildProductHuntErrorPayload("week");

    expect(payload.status).toBe("error");
    expect(payload.source).toBe("none");
    expect(payload.stale).toBe(false);
    expect(payload.range).toBe("week");
    expect(payload.items).toEqual([]);
    expect(typeof payload.updatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(payload.updatedAt))).toBe(false);
    expect(payload.message).toBeTruthy();
  });
});
