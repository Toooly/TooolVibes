import { describe, expect, it } from "vitest";

import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
import {
  formatRadarSignal,
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
    const stale = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "product-hunt-stale",
        stale: true,
      },
      "day",
    );

    expect(live.state).toBe("live");
    expect(live.statusLabel).toBe("LIVE");
    expect(live.isAnimated).toBe(true);
    expect(live.updatedAtLabel).toBe("28 lug 2026 · 08:05 UTC");

    expect(stale.state).toBe("stale");
    expect(stale.statusLabel).toBe("ULTIMA SYNC");
    expect(stale.isAnimated).toBe(false);
    expect(stale.canRetry).toBe(true);
    expect(stale.items).toEqual(LIVE_PAYLOAD.items);
    expect(stale.updatedAtLabel).toBe("28 lug 2026 · 08:05 UTC");
  });

  it("dichiara esplicitamente la fixture locale senza animarla come live", () => {
    const fixture = resolveRadarUiModel(
      {
        ...LIVE_PAYLOAD,
        source: "qa-fixture",
      },
      "day",
    );

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
    },
    {
      name: "empty",
      payload: { ...LIVE_PAYLOAD, items: [] },
      state: "empty",
      count: 0,
      canRetry: true,
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
      canRetry: false,
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
    },
  ])(
    "risolve lo stato $name senza segnali fittizi",
    ({ payload, state, count, canRetry }) => {
      const model = resolveRadarUiModel(payload, "week");
      expect(model.state).toBe(state);
      expect(model.signalCount).toBe(count);
      expect(model.canRetry).toBe(canRetry);
      expect(model.isAnimated).toBe(false);
      expect(model.items).toHaveLength(0);
    },
  );

  it("mantiene timestamp e provenienza anche quando il feed live è vuoto", () => {
    const empty = resolveRadarUiModel({ ...LIVE_PAYLOAD, items: [] }, "day");

    expect(empty.updatedAtLabel).toBe("28 lug 2026 · 08:05 UTC");
    expect(empty.sourceLabel).toBe(
      "Feed Product Hunt verificato · nessun lancio · 28 lug 2026 · 08:05 UTC",
    );
  });

  it("formatta soltanto metriche presenti", () => {
    const item = LIVE_PAYLOAD.items[0];
    expect(formatRadarSignal(item)).toBe("120 voti · 14 commenti");
    expect(
      formatRadarSignal({ ...item, votesCount: 0, commentsCount: 0 }),
    ).toBe("Segnale in verifica");
  });
});
