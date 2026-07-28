// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RadarExperience } from "@/components/radar/radar-experience";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

vi.mock("@/lib/gamification/actions", () => ({
  claimHiddenSignal: vi.fn(),
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

const LIVE_DAY: ProductHuntPayload = {
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
    },
    {
      id: "beta",
      name: "Beta Tool",
      tagline: "Secondo segnale reale",
      votesCount: 80,
      commentsCount: 7,
      productHuntUrl: "https://www.producthunt.com/posts/beta",
    },
  ],
};

const LIVE_WEEK: ProductHuntPayload = {
  ...LIVE_DAY,
  range: "week",
  items: [
    {
      id: "gamma",
      name: "Gamma Tool",
      tagline: "Segnale settimanale reale",
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

function renderRadar(initialVisual: "nodes" | "table" = "nodes") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RadarExperience initialVisual={initialVisual} />
    </QueryClientProvider>,
  );
}

describe("RadarExperience", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("usa un solo albero responsive, una query e nodi reali", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar();

    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    expect(container.querySelectorAll(".tv-radar")).toHaveLength(1);
    expect(container.querySelector(".radar-mobile")).toBeNull();
    expect(container.querySelector(".radar-command--desktop")).toBeNull();
    expect(container.querySelectorAll(".tv-radar-node")).toHaveLength(2);
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeTruthy();
    expect(screen.getByText("LIVE")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dichiara stale e interrompe la scansione senza nascondere i dati", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        ...LIVE_DAY,
        source: "product-hunt-stale",
        stale: true,
      }),
    );
    const { container } = renderRadar();

    expect(await screen.findByText("ULTIMA SYNC")).toBeTruthy();
    expect(
      screen.getByText(/Ultima classifica reale Product Hunt · 28 lug 2026 · 08:05 UTC/),
    ).toBeTruthy();
    expect(await screen.findAllByText("Beta Tool")).not.toHaveLength(0);
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Aggiorna ora" }),
    ).toBeTruthy();
  });

  it("etichetta la fixture QA e non la presenta come feed live", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        ...LIVE_DAY,
        source: "qa-fixture",
      }),
    );
    const { container } = renderRadar();

    expect(await screen.findByText("QA FIXTURE")).toBeTruthy();
    expect(
      screen.getByText(/Fixture QA locale · dati simulati · 28 lug 2026 · 08:05 UTC/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Fixture locale deterministica per verificare ogni breakpoint.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/Nessun dato simulato/)).toBeNull();
    expect(screen.queryByText("LIVE")).toBeNull();
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();
  });

  it("mostra errore e retry anche nel layout unico, senza nodi inventati", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar();

    expect(await screen.findByText("OFFLINE")).toBeTruthy();
    expect(container.querySelectorAll(".tv-radar-node")).toHaveLength(0);
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Aggiorna ora" }),
    );

    await waitFor(() =>
      expect(container.querySelectorAll(".tv-radar-node")).toHaveLength(2),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("preserva periodo e cache quando cambia vista", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      String(input).includes("range=week")
        ? fetchOk(LIVE_WEEK)
        : fetchOk(LIVE_DAY),
    );
    renderRadar("nodes");

    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Settimana" }));
    expect(await screen.findAllByText("Gamma Tool")).not.toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Tabella" }));
    expect(await screen.findByText("Tutti i segnali")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Settimana" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Radar" }));
    expect(await screen.findByLabelText(/Radar Product Hunt/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("espone controlli nativi e non introduce violazioni axe strutturali", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar("table");

    await screen.findByText("Tutti i segnali");
    expect(screen.getByRole("group", { name: "Periodo" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Vista" })).toBeTruthy();

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
