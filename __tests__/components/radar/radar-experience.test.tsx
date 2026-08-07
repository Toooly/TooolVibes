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

/* The commercial mount is contracted separately (duplication/matrix tests);
   here it is isolated so the consent provider is not required. */
vi.mock("@/components/ads/tinyadz-inline-slot", () => ({
  TinyAdzInlineSlot: ({ placement }: { placement: string }) => (
    <div data-testid="tinyadz-stub" data-placement={placement} />
  ),
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
    // V2: live status è "Dati aggiornati" (no "LIVE")
    expect(screen.getByText("Dati aggiornati")).toBeTruthy();
    expect(screen.queryByText("LIVE")).toBeNull();
    // H1 V2
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Segui i lanci. Individua i segnali da approfondire.",
      }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dichiara stale 'old' e interrompe la scansione senza nascondere i dati", async () => {
    // Closure check 2026-08-03 §4: il payload di test ha updatedAt
    // vecchio (2026-07-28T08:05:00.000Z) — la soglia di 1h è
    // abbondantemente superata, quindi staleVariant = "old".
    fetchMock.mockImplementation(() =>
      fetchOk({
        ...LIVE_DAY,
        source: "product-hunt-stale",
        stale: true,
      }),
    );
    const { container } = renderRadar();

    // V2: stale "old" label "Aggiornamento non recente" appare
    // sia nello status rail sia nel badge dello state panel.
    expect(
      await screen.findAllByText("Aggiornamento non recente"),
    ).not.toHaveLength(0);
    expect(
      await screen.findByText(
        "I dati potrebbero non essere aggiornati",
      ),
    ).toBeTruthy();
    expect(await screen.findAllByText("Beta Tool")).not.toHaveLength(0);
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();
    // V2 retry: "Riprova" (pannello) e "Aggiorna i dati" (header)
    expect(
      screen.getByRole("button", { name: "Riprova" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Aggiorna i dati del Radar" }),
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

    // "QA FIXTURE" appare nello status rail (statusLabel) e non
    // viene presentato come live.
    expect(await screen.findByText("QA FIXTURE")).toBeTruthy();
    // La lede hero V2 ("Il Radar raccoglie…") NON è sostituita per
    // la fixture (la fixture conserva la lede canonica; il solo
    // segnale di debug è la statusLabel).
    expect(
      screen.getByText(
        /Il Radar raccoglie i lanci di Product Hunt/,
      ),
    ).toBeTruthy();
    expect(screen.queryByText("LIVE")).toBeNull();
    expect(screen.queryByText("Dati aggiornati")).toBeNull();
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();
  });

  it("mostra errore e retry anche nel layout unico, senza nodi inventati", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar();

    // V2: error label "Dati non disponibili" (no "OFFLINE")
    expect(await screen.findByText("Dati non disponibili")).toBeTruthy();
    expect(
      screen.getByText("Non riusciamo ad aggiornare il Radar"),
    ).toBeTruthy();
    expect(container.querySelectorAll(".tv-radar-node")).toHaveLength(0);
    expect(
      container.querySelector(".tv-radar-instrument__sweep"),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));

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
    // V2: aria-label del button periodo è
    // "Mostra i segnali di Ultimi 7 giorni" (era "Settimana").
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mostra i segnali di Ultimi 7 giorni",
      }),
    );
    expect(await screen.findAllByText("Gamma Tool")).not.toHaveLength(0);

    // V2: vista "Elenco" (era "Tabella")
    fireEvent.click(
      screen.getByRole("button", { name: "Visualizza i segnali in elenco" }),
    );
    expect(
      await screen.findByText("Tutti i segnali del periodo"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Mostra i segnali di Ultimi 7 giorni" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // V2: vista "Mappa" (era "Radar")
    fireEvent.click(
      screen.getByRole("button", {
        name: "Visualizza i segnali sulla mappa del Radar",
      }),
    );
    expect(
      await screen.findByLabelText(
        "Mappa dei segnali Product Hunt per il periodo selezionato",
      ),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("espone controlli nativi e non introduce violazioni axe strutturali", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar("table");

    await screen.findByText("Tutti i segnali del periodo");
    expect(screen.getByRole("group", { name: "Periodo" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Vista" })).toBeTruthy();
    // V2: status rail 4 dt/dd (Stato, Ultimo aggiornamento,
    // Segnali disponibili, Periodo). "Periodo" appare anche come
    // label del gruppo controlli: usa getAllByText per evitare
    // ambiguità.
    expect(screen.getByText("Stato")).toBeTruthy();
    expect(screen.getByText("Ultimo aggiornamento")).toBeTruthy();
    expect(screen.getByText("Segnali disponibili")).toBeTruthy();
    expect(screen.getAllByText("Periodo").length).toBeGreaterThanOrEqual(2);
    // V2: provenance section
    expect(screen.getByText("Informazioni sui dati")).toBeTruthy();

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });

  it("rende eyebrow desktop su desktop e eyebrow mobile su mobile", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar();
    await screen.findByText("Alpha Tool");

    // Default = desktop
    const desktopEyebrow = container.querySelector(
      ".tv-radar__eyebrow-desktop",
    );
    const mobileEyebrow = container.querySelector(".tv-radar__eyebrow-mobile");
    expect(desktopEyebrow?.textContent).toContain("Segnali da Product Hunt");
    expect(mobileEyebrow?.textContent).toContain("Product Hunt · dati reali");
  });

  it("espone una sola eyebrow all'accessibility tree (no doppia lettura)", async () => {
    fetchMock.mockImplementation(() => fetchOk(LIVE_DAY));
    const { container } = renderRadar();
    await screen.findByText("Alpha Tool");

    // Le varianti visuali (desktop + mobile) devono essere
    // marcate aria-hidden per evitare che lo screen reader legga
    // entrambe quando la CSS ne mostra solo una.
    const desktopEyebrow = container.querySelector(
      ".tv-radar__eyebrow-desktop",
    );
    const mobileEyebrow = container.querySelector(".tv-radar__eyebrow-mobile");
    expect(desktopEyebrow?.getAttribute("aria-hidden")).toBe("true");
    expect(mobileEyebrow?.getAttribute("aria-hidden")).toBe("true");

    // Esiste una sola label canonica accessibile (sr-only) per
    // entrambi i viewport.
    const srOnly = container.querySelector(".sr-only");
    expect(srOnly?.textContent).toContain("Segnali da Product Hunt");

    // Il DOM contiene entrambe le varianti (per il CSS swap) ma
    // l'accessibility tree ne espone solo una canonica + 2
    // aria-hidden. Niente "doppia eyebrow" logica.
    const eyebrowParagraph = container.querySelector(".tv-radar__eyebrow");
    // Il sr-only contiene il testo canonico; le varianti desktop
    // e mobile contengono varianti compatte. Conta quante
    // occorrenze del testo canonico "Segnali da Product Hunt"
    // appaiono nel textContent "visibile" agli screen reader.
    const ariaVisibleText = Array.from(
      eyebrowParagraph?.querySelectorAll("span") ?? [],
    )
      .filter((el) => el.getAttribute("aria-hidden") !== "true")
      .map((el) => el.textContent ?? "")
      .join(" ");
    const canonicalMatches = (ariaVisibleText.match(/Segnali da Product Hunt/g) ?? []).length;
    expect(canonicalMatches).toBe(1);
  });
});
