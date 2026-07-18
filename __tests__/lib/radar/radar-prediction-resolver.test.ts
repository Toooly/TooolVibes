import { describe, expect, it } from "vitest";

import {
  getUtcContextDate,
  normalizeRadarSlug,
  RADAR_PREDICTION_XP_CLOSE,
  RADAR_PREDICTION_XP_WON,
  resolveRadarPredictions,
  scoreRadarSignal,
  type RadarPredictionCandidate,
  type RadarResolverSignal,
} from "@/supabase/functions/_shared/radar-prediction-resolver";

const SIGNALS: RadarResolverSignal[] = [
  { id: "1", name: "Alpha Tool", votesCount: 120, commentsCount: 10 }, // 140
  { id: "2", name: "Beta Tool", votesCount: 80, commentsCount: 5 }, // 90
  { id: "3", name: "Gamma Tool", votesCount: 40, commentsCount: 0 }, // 40
];

const CANDIDATES: RadarPredictionCandidate[] = [
  { toolSlug: "alpha-tool", contextDate: "2026-07-17" },
  { toolSlug: "beta-tool", contextDate: "2026-07-17" },
  { toolSlug: "gamma-tool", contextDate: "2026-07-17" },
];

function bySlug(
  resolutions: ReturnType<typeof resolveRadarPredictions>,
): Map<string, (typeof resolutions)[number]> {
  return new Map(resolutions.map((resolution) => [resolution.toolSlug, resolution]));
}

describe("radar prediction resolver — integrità dati (B36 / FLOW-606)", () => {
  it("deriva lo score solo dai contatori reali del feed (nessun hash placeholder)", () => {
    expect(scoreRadarSignal(SIGNALS[0])).toBe(140);

    const resolutions = resolveRadarPredictions(CANDIDATES, SIGNALS, {
      rewardsEnabled: true,
    });
    const resolved = bySlug(resolutions);

    expect(resolved.get("alpha-tool")).toMatchObject({
      score: 140,
      evidence: "product-hunt-live",
    });
    expect(resolved.get("beta-tool")).toMatchObject({
      score: 90,
      evidence: "product-hunt-live",
    });
  });

  it("dichiara l'assenza dal feed live come evidenza reale con score 0", () => {
    const resolutions = resolveRadarPredictions(
      [{ toolSlug: "tool-sparito", contextDate: "2026-07-17" }],
      SIGNALS,
      { rewardsEnabled: true },
    );

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0]).toMatchObject({
      evidence: "absent-from-product-hunt-live",
      score: 0,
      status: "won", // unico candidato: rank 1 ma senza evidenza positiva inventata
    });
  });

  it("non risolve nulla quando il feed non è disponibile o è vuoto (fallback esplicito)", () => {
    expect(
      resolveRadarPredictions(CANDIDATES, null, { rewardsEnabled: true }),
    ).toEqual([]);
    expect(
      resolveRadarPredictions(CANDIDATES, [], { rewardsEnabled: true }),
    ).toEqual([]);
  });

  it("è deterministico: l'ordine dei candidati non cambia il risultato", () => {
    const reversed = [...CANDIDATES].reverse();
    const shuffled = [CANDIDATES[1], CANDIDATES[2], CANDIDATES[0]];

    const baseline = bySlug(
      resolveRadarPredictions(CANDIDATES, SIGNALS, { rewardsEnabled: true }),
    );

    for (const permutation of [reversed, shuffled]) {
      const resolved = bySlug(
        resolveRadarPredictions(permutation, SIGNALS, { rewardsEnabled: true }),
      );
      for (const candidate of CANDIDATES) {
        expect(resolved.get(candidate.toolSlug)).toEqual(
          baseline.get(candidate.toolSlug),
        );
      }
    }

    expect(baseline.get("alpha-tool")).toMatchObject({ rank: 1, status: "won" });
    expect(baseline.get("beta-tool")).toMatchObject({ rank: 2, status: "close" });
    expect(baseline.get("gamma-tool")).toMatchObject({ rank: 3, status: "lost" });
  });

  it("assegna lo stesso rank ai pareggi, indipendente dall'ordine di input", () => {
    const tied: RadarPredictionCandidate[] = [
      { toolSlug: "alpha-tool", contextDate: "2026-07-17" },
      { toolSlug: "alpha-tool", contextDate: "2026-07-17" },
      { toolSlug: "gamma-tool", contextDate: "2026-07-17" },
    ];

    const forward = resolveRadarPredictions(tied, SIGNALS, {
      rewardsEnabled: true,
    });
    const backward = resolveRadarPredictions([...tied].reverse(), SIGNALS, {
      rewardsEnabled: true,
    });

    const alphaForward = forward.filter((r) => r.toolSlug === "alpha-tool");
    const alphaBackward = backward.filter((r) => r.toolSlug === "alpha-tool");

    expect(alphaForward).toHaveLength(2);
    expect(alphaForward.every((r) => r.rank === 1 && r.status === "won")).toBe(true);
    expect(alphaBackward).toEqual(alphaForward.reverse());
    expect(forward.find((r) => r.toolSlug === "gamma-tool")).toMatchObject({
      rank: 3,
      status: "lost",
    });
  });

  it("con rewards disattivati (flag B04) non assegna XP ma calcola comunque lo stato", () => {
    const resolutions = resolveRadarPredictions(CANDIDATES, SIGNALS, {
      rewardsEnabled: false,
    });

    expect(resolutions.every((r) => r.xpAwarded === 0)).toBe(true);
    expect(bySlug(resolutions).get("alpha-tool")?.status).toBe("won");
  });

  it("con rewards attivi assegna XP solo da score reali (won/close/lost)", () => {
    const resolutions = bySlug(
      resolveRadarPredictions(CANDIDATES, SIGNALS, { rewardsEnabled: true }),
    );

    expect(resolutions.get("alpha-tool")?.xpAwarded).toBe(RADAR_PREDICTION_XP_WON);
    expect(resolutions.get("beta-tool")?.xpAwarded).toBe(RADAR_PREDICTION_XP_CLOSE);
    expect(resolutions.get("gamma-tool")?.xpAwarded).toBe(0);
  });

  it("normalizza i nomi del feed per il match con gli slug", () => {
    expect(normalizeRadarSlug("Alpha Tool")).toBe("alpha-tool");
    expect(normalizeRadarSlug("  Spazi   Multipli ")).toBe("-spazi-multipli-");
  });
});

describe("getUtcContextDate — timezone esplicita (B36 / FLOW-606)", () => {
  it("usa sempre UTC: lo stesso istante dà la stessa data in ogni offset", () => {
    const utc = new Date("2026-07-19T00:30:00.000Z");
    const sameInstantPlusTwo = new Date("2026-07-19T02:30:00+02:00");

    expect(getUtcContextDate(utc)).toBe("2026-07-19");
    expect(getUtcContextDate(sameInstantPlusTwo)).toBe("2026-07-19");
  });

  it("non anticipa la data prima di mezzanotte UTC", () => {
    expect(getUtcContextDate(new Date("2026-07-18T23:59:59.999Z"))).toBe(
      "2026-07-18",
    );
  });

  it("applica l'offset in giorni ai confini di mese e anno", () => {
    expect(getUtcContextDate(new Date("2026-08-01T00:30:00.000Z"), -1)).toBe(
      "2026-07-31",
    );
    expect(getUtcContextDate(new Date("2027-01-01T00:00:00.000Z"), -1)).toBe(
      "2026-12-31",
    );
    expect(getUtcContextDate(new Date("2026-07-17T12:00:00.000Z"), 1)).toBe(
      "2026-07-18",
    );
  });
});
