// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import type { RadarDesktopVisual } from "@/lib/radar/radar-view-config";

// Il layer 3D (three/@react-three/fiber) non è oggetto del test: il mock
// tiene il jsdom leggero e deterministico.
vi.mock("@/components/3d-maestoso/radar-3d-layer", () => ({
  Radar3DLayer: () => null,
}));

import { DesktopVibeRadar } from "@/components/desktop/desktop-vibe-radar";

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

function fetchByRange(fetchMock: ReturnType<typeof vi.fn>) {
  fetchMock.mockImplementation((input: RequestInfo | URL) =>
    String(input).includes("range=week")
      ? fetchOk(LIVE_WEEK_PAYLOAD)
      : fetchOk(LIVE_DAY_PAYLOAD),
  );
}

function renderDesktopRadar(initialVisual: RadarDesktopVisual) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DesktopVibeRadar threeDEnabled={false} initialVisual={initialVisual} />
    </QueryClientProvider>,
  );
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("DesktopVibeRadar — composizione unica e query condivisa (B44 / DESK-804 / PERF-1202)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("visual table (default config): monta solo la tabella, una sola request per key", async () => {
    fetchByRange(fetchMock);
    renderDesktopRadar("table");

    expect(
      await screen.findByRole("region", { name: "Classifica Product Hunt" }),
    ).toBeTruthy();
    // Render esclusivo: lo stage nodes non è montato.
    expect(screen.queryByLabelText("Radar visuale Product Hunt")).toBeNull();
    expect(document.querySelectorAll(".radar-command-signal")).toHaveLength(0);

    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    // Header composizione + tabella condividono la stessa key: UNA request.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/product-hunt?range=day",
    );
    // Provenienza e timestamp coerenti col contratto B36 (UTC deterministico).
    expect(
      screen.getByText(/Dati live Product Hunt, aggiornati alle 08:00 UTC/),
    ).toBeTruthy();
    expect(screen.getByText("Aggiornato: 08:00 UTC")).toBeTruthy();
  });

  it("visual nodes (config): monta solo i nodi reali, tabella assente", async () => {
    fetchByRange(fetchMock);
    renderDesktopRadar("nodes");

    expect(await screen.findByLabelText("Radar visuale Product Hunt")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Classifica Product Hunt" })).toBeNull();

    await waitFor(() =>
      expect(document.querySelectorAll(".radar-command-signal")).toHaveLength(2),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("toggle lazy: lo switch di visual è esclusivo, non perde il range e usa la cache", async () => {
    fetchByRange(fetchMock);
    renderDesktopRadar("table");

    expect(
      await screen.findByRole("region", { name: "Classifica Product Hunt" }),
    ).toBeTruthy();

    // Cambio range: nuova key, nuova request.
    fireEvent.click(screen.getByRole("button", { name: "Settimana" }));
    expect(await screen.findAllByText("Gamma Tool")).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Switch su nodes: tabella smontata, nodi montati, range preservato.
    fireEvent.click(screen.getByRole("button", { name: "Radar" }));
    expect(await screen.findByLabelText("Radar visuale Product Hunt")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Classifica Product Hunt" })).toBeNull();
    await waitFor(() =>
      expect(document.querySelectorAll(".radar-command-signal")).toHaveLength(1),
    );
    expect(screen.getByRole("button", { name: "Settimana" }).getAttribute("aria-pressed")).toBe("true");
    // Nessuna nuova request: la key "week" è in cache condivisa.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Ritorno alla tabella: ancora cache, stesso range.
    fireEvent.click(screen.getByRole("button", { name: "Tabella" }));
    expect(
      await screen.findByRole("region", { name: "Classifica Product Hunt" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Radar visuale Product Hunt")).toBeNull();
    expect(await screen.findAllByText("Gamma Tool")).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Ritorno al range "day": servito da cache, nessuna terza request.
    fireEvent.click(screen.getByRole("button", { name: "Giorno" }));
    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("error: fallback unico onesto in tabella e nodi, nessun dato inventato", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    renderDesktopRadar("table");

    expect(
      await screen.findByText(
        "Classifica Product Hunt temporaneamente non disponibile.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Feed Product Hunt non disponibile"),
    ).toBeTruthy();
    expect(screen.getByText("Aggiornamento non disponibile")).toBeTruthy();
    // Nessun item di classifica inventato.
    expect(screen.queryByText("Alpha Tool")).toBeNull();
    expect(document.querySelectorAll(".radar-command-table__row:not(.is-loading)")).toHaveLength(0);

    // Anche la visual nodes dichiara lo stato senza nodi finti.
    fireEvent.click(screen.getByRole("button", { name: "Radar" }));
    expect(await screen.findByLabelText("Radar visuale Product Hunt")).toBeTruthy();
    const statuses = await screen.findAllByRole("status");
    expect(statuses.some((status) => status.textContent?.includes(
      "Classifica Product Hunt temporaneamente non disponibile.",
    ))).toBe(true);
    expect(document.querySelectorAll(".radar-command-signal")).toHaveLength(0);
    // I vecchi fallback inventati B36 (nomi/voti finti) non esistono più.
    expect(screen.queryByText("Blink")).toBeNull();
    expect(screen.queryByText("VibeCode")).toBeNull();
    expect(screen.queryByText("Cosmic JS")).toBeNull();
  });

  it("stale: fallback dichiarato con timestamp di origine in header, topbar e banner", async () => {
    fetchMock.mockImplementation(() =>
      fetchOk({
        ...LIVE_DAY_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        message: "Aggiornamento live non riuscito.",
      }),
    );
    renderDesktopRadar("table");

    expect(
      await screen.findByText(/Ultima sincronizzazione Product Hunt: 08:00 UTC/),
    ).toBeTruthy();
    expect(screen.getByText("Ultima sync: 08:00 UTC")).toBeTruthy();
    const statuses = await screen.findAllByRole("status");
    expect(statuses.some((status) => status.textContent?.includes("Aggiornamento live non riuscito."))).toBe(true);
    expect(statuses.some((status) => status.textContent?.includes("08:00 UTC"))).toBe(true);
    // I dati reali dell'ultima sync restano visibili.
    expect(await screen.findAllByText("Beta Tool")).not.toHaveLength(0);
  });

  it("keyboard/table semantics: gruppi di button nativi con aria-pressed", async () => {
    fetchByRange(fetchMock);
    renderDesktopRadar("table");

    const rangeGroup = screen.getByRole("group", { name: "Periodo" });
    expect(rangeGroup).toBeTruthy();
    const dayButton = screen.getByRole("button", { name: "Giorno" });
    expect(dayButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Mese" }).getAttribute("aria-pressed")).toBe("false");

    const visualGroup = screen.getByRole("group", { name: "Vista" });
    expect(visualGroup).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tabella" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Radar" }).getAttribute("aria-pressed"),
    ).toBe("false");

    // Tutti i controlli sono button nativi: focusabili da tastiera.
    for (const name of ["Giorno", "Settimana", "Mese"]) {
      expect(screen.getByRole("button", { name }).tagName).toBe("BUTTON");
    }
    for (const name of ["Tabella", "Radar"]) {
      expect(screen.getByRole("button", { name }).tagName).toBe("BUTTON");
    }

    await screen.findByRole("region", { name: "Classifica Product Hunt" });
  });

  it("accessibilità: nessuna violazione axe sulla composizione", async () => {
    fetchByRange(fetchMock);
    const { container } = renderDesktopRadar("table");

    expect(await screen.findAllByText("Alpha Tool")).not.toHaveLength(0);
    await expectNoAxeViolations(container);
  });
});
