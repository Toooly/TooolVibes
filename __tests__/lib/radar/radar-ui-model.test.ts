import { describe, expect, it } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import {
  formatRadarSignal,
  RADAR_RANGE_OPTIONS,
  resolveRadarUiModel,
} from "@/lib/radar/radar-ui-model";

const LIVE_PAYLOAD: ProductHuntPayload = {
  status: "ok",
  source: "product-hunt-live",
  stale: false,
  range: "day",
  updatedAt: "2026-07-28T08:05:00.000Z",
  items: [
    {
      id: "alpha",
      name: "Alpha",
      tagline: "A real Product Hunt signal",
      votesCount: 120,
      commentsCount: 14,
      productHuntUrl: "https://www.producthunt.com/posts/alpha",
    },
  ],
};

describe("Radar UI model", () => {
  it("separa live e stale senza riscrivere timestamp o dati reali", () => {
    const live = resolveRadarUiModel(LIVE_PAYLOAD, "day");
    // stale di default usa `now = Date.now()` (testiamo con un
    // updatedAt vecchio di 5 giorni per garantire "old").
    const stalePayload = {
      ...LIVE_PAYLOAD,
      source: "product-hunt-stale" as const,
      stale: true,
      updatedAt: "2026-07-23T08:05:00.000Z", // 5+ giorni fa
    };
    const stale = resolveRadarUiModel(stalePayload, "day");

    // V2: nessuna parola "LIVE" — il live è "Dati aggiornati".
    expect(live.state).toBe("live");
    expect(live.statusLabel).toBe("Dati aggiornati");
    expect(live.stageTitle).toBe("Segnali di oggi");
    expect(live.stageBody).toBe(
      "Ordinati in base ai dati disponibili da Product Hunt. Apri un lancio per verificarlo alla fonte.",
    );
    expect(live.isAnimated).toBe(true);
    expect(live.updatedAtLabel).toBe("28 lug 2026 · 08:05 UTC");
    expect(live.sourceLabel).toBe(
      "Fonte: Product Hunt. Disponibilità e frequenza di aggiornamento dipendono dalla fonte.",
    );

    // Closure check 2026-08-03 §4: stale "old" (age > soglia 1h).
    expect(stale.state).toBe("stale");
    expect(stale.staleVariant).toBe("old");
    expect(stale.statusLabel).toBe("Aggiornamento non recente");
    expect(stale.stageTitle).toBe("I dati potrebbero non essere aggiornati");
    expect(stale.stageBody).toBe(
      "L'ultimo aggiornamento risale al 23 lug 2026 · 08:05 UTC. Puoi consultare i risultati disponibili oppure riprovare.",
    );
    expect(stale.isAnimated).toBe(false);
    expect(stale.canRetry).toBe(true);
    expect(stale.items).toEqual(stalePayload.items);
    expect(stale.updatedAtLabel).toBe("23 lug 2026 · 08:05 UTC");
  });

  it("distingue stale 'recent' vs stale 'old' in base all'età del payload", () => {
    // Closure check 2026-08-03 §4: due payload `stale: true`,
    // uno con updatedAt recente (1h fa) e uno vecchio (3h fa).
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const hourAgo = "2026-08-03T11:00:00.000Z"; // age 1h — borderline
    const threeHoursAgo = "2026-08-03T09:00:00.000Z"; // age 3h — old

    const recentStale = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: hourAgo,
      },
      "day",
      now,
    );
    expect(recentStale.state).toBe("stale");
    expect(recentStale.staleVariant).toBe("old"); // 1h esatti = NON < 1h
    expect(recentStale.statusLabel).toBe("Aggiornamento non recente");

    const oldStale = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: threeHoursAgo,
      },
      "day",
      now,
    );
    expect(oldStale.state).toBe("stale");
    expect(oldStale.staleVariant).toBe("old");
    expect(oldStale.statusLabel).toBe("Aggiornamento non recente");
  });

  it("usa copy 'Ultimo aggiornamento disponibile' quando stale + age < soglia", () => {
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const fiveMinAgo = "2026-08-03T11:55:00.000Z"; // age 5min — recent

    const recent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: fiveMinAgo,
      },
      "day",
      now,
    );

    expect(recent.staleVariant).toBe("recent");
    expect(recent.statusLabel).toBe("Ultimo aggiornamento disponibile");
    expect(recent.stageTitle).toBe(
      "Stai visualizzando l'ultimo aggiornamento disponibile",
    );
    expect(recent.stageBody).toBe(
      "Non siamo riusciti a recuperare dati più recenti. I risultati mostrati risalgono al 03 ago 2026 · 11:55 UTC.",
    );
  });

  // =====================================================================
  // Closure 2026-08-03 §1-3: soglie RANGE-AWARE
  // day=30min, week=3h, month=12h. Verifica boundary cases.
  // =====================================================================

  it("boundary day: 20 minuti → recent, 45 minuti → old", () => {
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const twentyMinAgo = "2026-08-03T11:40:00.000Z"; // age 20min
    const fortyFiveMinAgo = "2026-08-03T11:15:00.000Z"; // age 45min

    const dayRecent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: twentyMinAgo,
      },
      "day",
      now,
    );
    expect(dayRecent.state).toBe("stale");
    expect(dayRecent.staleVariant).toBe("recent"); // 20 < 30
    expect(dayRecent.statusLabel).toBe("Ultimo aggiornamento disponibile");
    expect(dayRecent.stageTitle).toBe(
      "Stai visualizzando l'ultimo aggiornamento disponibile",
    );

    const dayOld = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: fortyFiveMinAgo,
      },
      "day",
      now,
    );
    expect(dayOld.state).toBe("stale");
    expect(dayOld.staleVariant).toBe("old"); // 45 >= 30
    expect(dayOld.statusLabel).toBe("Aggiornamento non recente");
    expect(dayOld.stageTitle).toBe("I dati potrebbero non essere aggiornati");
  });

  it("boundary week: 2 ore → recent, 4 ore → old", () => {
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const twoHoursAgo = "2026-08-03T10:00:00.000Z"; // age 2h
    const fourHoursAgo = "2026-08-03T08:00:00.000Z"; // age 4h

    const weekRecent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: twoHoursAgo,
      },
      "week",
      now,
    );
    expect(weekRecent.state).toBe("stale");
    expect(weekRecent.staleVariant).toBe("recent"); // 2h < 3h
    expect(weekRecent.statusLabel).toBe("Ultimo aggiornamento disponibile");

    const weekOld = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: fourHoursAgo,
      },
      "week",
      now,
    );
    expect(weekOld.state).toBe("stale");
    expect(weekOld.staleVariant).toBe("old"); // 4h >= 3h
    expect(weekOld.statusLabel).toBe("Aggiornamento non recente");
  });

  it("boundary month: 6 ore → recent, 13 ore → old", () => {
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const sixHoursAgo = "2026-08-03T06:00:00.000Z"; // age 6h
    const thirteenHoursAgo = "2026-08-02T23:00:00.000Z"; // age 13h

    const monthRecent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: sixHoursAgo,
      },
      "month",
      now,
    );
    expect(monthRecent.state).toBe("stale");
    expect(monthRecent.staleVariant).toBe("recent"); // 6h < 12h
    expect(monthRecent.statusLabel).toBe("Ultimo aggiornamento disponibile");

    const monthOld = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: thirteenHoursAgo,
      },
      "month",
      now,
    );
    expect(monthOld.state).toBe("stale");
    expect(monthOld.staleVariant).toBe("old"); // 13h >= 12h
    expect(monthOld.statusLabel).toBe("Aggiornamento non recente");
  });

  it("cambio range ricalcola la variante stale in base alla soglia del range", () => {
    // Stesso payload (4h fa), tre range: per day (30min) è old,
    // per week (3h) è old, per month (12h) è recent.
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const fourHoursAgo = "2026-08-03T08:00:00.000Z";
    const payload = {
      ...LIVE_PAYLOAD,
      source: "product-hunt-stale" as const,
      stale: true,
      updatedAt: fourHoursAgo,
    };

    const dayView = resolveRadarUiModel(payload, "day", now);
    expect(dayView.staleVariant).toBe("old"); // 4h >= 30min

    const weekView = resolveRadarUiModel(payload, "week", now);
    expect(weekView.staleVariant).toBe("old"); // 4h >= 3h

    const monthView = resolveRadarUiModel(payload, "month", now);
    expect(monthView.staleVariant).toBe("recent"); // 4h < 12h
  });

  it("stale non modifica updatedAt: il timestamp di origine resta intatto", () => {
    // Closure 2026-08-03 §1-3: la variante stale non deve mai
    // riscrivere l'updatedAt del payload. Il modello espone
    // updatedAtLabel derivato dal payload.updatedAt invariato.
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const fourHoursAgo = "2026-08-03T08:00:00.000Z";

    const dayOld = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: fourHoursAgo,
      },
      "day",
      now,
    );
    expect(dayOld.updatedAtLabel).toBe("03 ago 2026 · 08:00 UTC");
    // Anche cambiando range, l'updatedAtLabel è identico (dipende
    // solo dal payload, non dalla soglia).
    const weekRecent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: fourHoursAgo,
      },
      "week",
      now,
    );
    expect(weekRecent.updatedAtLabel).toBe("03 ago 2026 · 08:00 UTC");
  });

  it("stale non altera dataset né ordinamento", () => {
    // Closure 2026-08-03 §1-3: i dati reali restano visibili in
    // entrambe le varianti stale. Solo il copy cambia.
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const twentyMinAgo = "2026-08-03T11:40:00.000Z";
    const fourHoursAgo = "2026-08-03T08:00:00.000Z";
    const items = LIVE_PAYLOAD.items;
    const range = "day" as const;

    const recent = resolveRadarUiModel(
      { ...LIVE_PAYLOAD, source: "product-hunt-stale", stale: true, updatedAt: twentyMinAgo },
      range,
      now,
    );
    const old = resolveRadarUiModel(
      { ...LIVE_PAYLOAD, source: "product-hunt-stale", stale: true, updatedAt: fourHoursAgo },
      range,
      now,
    );

    expect(recent.items).toEqual(items);
    expect(old.items).toEqual(items);
    expect(recent.signalCount).toBe(items.length);
    expect(old.signalCount).toBe(items.length);
  });

  it("mai 'Dati aggiornati' per stato stale: solo recent/old", () => {
    // Closure 2026-08-03 §1-3: V2 vieta il claim "live" (label
    // "Dati aggiornati") per dati serviti come fallback stale.
    // Verifica che la label "Dati aggiornati" non appaia mai
    // in nessuna variante stale, anche quando l'età è recent.
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();
    const oneMinAgo = "2026-08-03T11:59:00.000Z";

    const recent = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: oneMinAgo,
      },
      "day",
      now,
    );
    expect(recent.state).toBe("stale");
    expect(recent.statusLabel).not.toBe("Dati aggiornati");
    expect(recent.staleVariant).toBe("recent");
  });

  it("updatedAt mancante o invalido non produce Invalid Date", () => {
    // Closure 2026-08-03 §1-3: timestamp mancante o malformato
    // non deve generare 'Invalid Date' né causare eccezioni.
    // Forza la variante 'old' per coerenza con la regola V2 §3
    // (no 'Dati aggiornati' senza timestamp verificabile).
    const now = new Date("2026-08-03T12:00:00.000Z").getTime();

    const noTimestamp = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: "",
      },
      "day",
      now,
    );
    expect(noTimestamp.state).toBe("stale");
    expect(noTimestamp.staleVariant).toBe("old");
    expect(noTimestamp.updatedAtLabel).toBe("orario sconosciuto");
    expect(noTimestamp.statusLabel).toBe("Aggiornamento non recente");
    expect(noTimestamp.stageBody).not.toContain("Invalid Date");
    expect(noTimestamp.stageBody).toContain("orario sconosciuto");

    const malformed = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
        updatedAt: "not-a-date",
      },
      "day",
      now,
    );
    expect(malformed.staleVariant).toBe("old");
    expect(malformed.updatedAtLabel).toBe("orario sconosciuto");
    expect(malformed.stageBody).not.toContain("Invalid Date");
  });

  it("dichiara esplicitamente la fixture locale senza animarla come live", () => {
    const fixture = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "qa-fixture",
      },
      "day",
    );

    // "QA FIXTURE" resta solo come segnale di debug dev-only
    // (mai visibile in produzione).
    expect(fixture.state).toBe("fixture");
    expect(fixture.statusLabel).toBe("QA FIXTURE");
    expect(fixture.sourceLabel).toBe(
      "Fixture QA locale · dati simulati · 28 lug 2026 · 08:05 UTC",
    );
    expect(fixture.isAnimated).toBe(false);
    expect(fixture.items).toEqual(LIVE_PAYLOAD.items);
  });

  it.each([
    {
      name: "loading",
      payload: undefined,
      state: "loading",
      count: null,
      canRetry: false,
      status: "Connessione a Product Hunt",
    },
    {
      name: "empty",
      payload: { ...LIVE_PAYLOAD, items: [] },
      state: "empty",
      count: 0,
      canRetry: true,
      status: "Nessun segnale disponibile",
    },
    {
      name: "missing token",
      payload: {
        ...LIVE_PAYLOAD,
        status: "missing-token" as const,
        source: "none" as const,
        items: [],
      },
      state: "missing-token",
      count: null,
      canRetry: true,
      status: "Dati non disponibili",
    },
    {
      name: "error",
      payload: {
        ...LIVE_PAYLOAD,
        status: "error" as const,
        source: "none" as const,
        items: [],
      },
      state: "error",
      count: null,
      canRetry: true,
      status: "Dati non disponibili",
    },
  ])(
    "risolve lo stato $name senza segnali fittizi",
    ({ payload, state, count, canRetry, status }) => {
      const model = resolveRadarUiModel(payload, "week");
      expect(model.state).toBe(state);
      expect(model.signalCount).toBe(count);
      expect(model.canRetry).toBe(canRetry);
      expect(model.statusLabel).toBe(status);
      expect(model.isAnimated).toBe(false);
      expect(model.items).toHaveLength(0);
    },
  );

  it("mantiene timestamp e provenienza anche quando il feed live è vuoto", () => {
    const empty = resolveRadarUiModel({ ...LIVE_PAYLOAD, items: [] }, "day");

    expect(empty.updatedAtLabel).toBe("28 lug 2026 · 08:05 UTC");
    expect(empty.sourceLabel).toBe(
      "Product Hunt non ha restituito dati per questo periodo.",
    );
  });

  it("formatta soltanto metriche presenti", () => {
    const item = LIVE_PAYLOAD.items[0];
    expect(formatRadarSignal(item)).toBe("120 voti · 14 commenti");
    expect(
      formatRadarSignal({ ...item, votesCount: 1, commentsCount: 0 }),
    ).toBe("1 voto");
    expect(
      formatRadarSignal({ ...item, votesCount: 0, commentsCount: 0 }),
    ).toBe("Dato non disponibile");
  });

  it("espone H2 live dinamico per range", () => {
    // Per coerenza con il data contract: `payload.range` è la fonte
    // canonica del range del modello (B36). Costruisco payload per
    // ciascun range invece di riusare LIVE_PAYLOAD (range "day").
    const day = resolveRadarUiModel(LIVE_PAYLOAD, "day");
    const week = resolveRadarUiModel(
      { ...LIVE_PAYLOAD, range: "week" },
      "week",
    );
    const month = resolveRadarUiModel(
      { ...LIVE_PAYLOAD, range: "month" },
      "month",
    );

    expect(day.stageTitle).toBe("Segnali di oggi");
    expect(week.stageTitle).toBe("Segnali degli ultimi 7 giorni");
    expect(month.stageTitle).toBe("Segnali degli ultimi 30 giorni");
  });

  it("usa i label di periodo V2 (rolling)", () => {
    // Spec §3 — compact 24H / 7G / 30G control.
    expect(RADAR_RANGE_OPTIONS).toEqual([
      { key: "day", label: "24H" },
      { key: "week", label: "7G" },
      { key: "month", label: "30G" },
    ]);
  });
});
