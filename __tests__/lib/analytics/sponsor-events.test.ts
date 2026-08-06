/**
 * Tests for the sponsor analytics layer.
 *
 * Verifies:
 *   - trackSponsorImpression fires on every call with the expected shape.
 *     Impression dedupe is a per-mount concern of the tracker component
 *     (useRef), NOT a module-level key store: a permanent Set keyed on
 *     (campaign, placement, route) would suppress legitimate new
 *     impressions after an unmount + remount or an SPA navigation.
 *   - trackSponsorClick fires on every call (no dedup).
 *   - trackSponsorOpportunityClick fires with the expected shape.
 *   - Analytics failures are non-fatal.
 *
 * The module logs to console only when NODE_ENV === "development". Each test
 * stubs NODE_ENV so the dev-only console.log branch executes deterministically.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  trackSponsorClick,
  trackSponsorImpression,
  trackSponsorOpportunityClick,
} from "@/lib/analytics/sponsor-events";

describe("trackSponsorImpression", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emits one event per call (dedupe is a per-mount component concern)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]?.[0]).toBe("[sponsor-analytics]");
    const event = logSpy.mock.calls[0]?.[1] as {
      kind: string;
      campaignId: string;
      sponsorId: string;
      placementId: string;
      route: string;
    };
    expect(event.kind).toBe("sponsor_impression");
    expect(event.campaignId).toBe("taylora-v1-2026");
    expect(event.sponsorId).toBe("taylora");
    expect(event.placementId).toBe("home-partner-spotlight");
    expect(event.route).toBe("/");
  });

  it("emits the toolSlug when provided", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/toools/taylora",
      toolSlug: "taylora",
    });

    const event = logSpy.mock.calls[0]?.[1] as { toolSlug?: string };
    expect(event.toolSlug).toBe("taylora");
  });

  it("emits a new impression for the same key when called again", () => {
    // Semantics change: a remount on a new page view must re-emit.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });
    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });
    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });

    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it("emits one event per placement and route", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });
    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/archivio",
    });
    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "archive-sponsored-tool",
      route: "/",
    });

    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it("does not emit the impression event when NODE_ENV is not 'development'", () => {
    vi.stubEnv("NODE_ENV", "production");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe("trackSponsorClick", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fires on every call (no dedup)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorClick({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
      destination: "https://taylora.com",
    });
    trackSponsorClick({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
      destination: "https://taylora.com",
    });

    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it("emits the click event with the expected payload", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorClick({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
      destination: "https://taylora.com",
      toolSlug: "taylora",
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const event = logSpy.mock.calls[0]?.[1] as {
      kind: string;
      destination: string;
      toolSlug?: string;
    };
    expect(event.kind).toBe("sponsor_click");
    expect(event.destination).toBe("https://taylora.com");
    expect(event.toolSlug).toBe("taylora");
  });
});

describe("trackSponsorOpportunityClick", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fires the opportunity click event", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorOpportunityClick({
      placementId: "tool-sponsored-alternative",
      route: "/tools/taylora",
      destination: "/sponsorizza",
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const event = logSpy.mock.calls[0]?.[1] as {
      kind: string;
      placementId: string;
      route: string;
      destination: string;
    };
    expect(event.kind).toBe("sponsor_opportunity_click");
    expect(event.placementId).toBe("tool-sponsored-alternative");
    expect(event.route).toBe("/tools/taylora");
    expect(event.destination).toBe("/sponsorizza");
  });

  it("emits on every call (no dedup)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorOpportunityClick({
      placementId: "tool-sponsored-alternative",
      route: "/tools/taylora",
      destination: "/sponsorizza",
    });
    trackSponsorOpportunityClick({
      placementId: "tool-sponsored-alternative",
      route: "/tools/taylora",
      destination: "/sponsorizza",
    });

    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});

describe("non-fatal analytics failures", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not propagate a console.log exception from trackSponsorImpression", () => {
    const explosion = vi
      .spyOn(console, "log")
      .mockImplementation(() => {
        throw new Error("console blew up");
      });

    expect(() =>
      trackSponsorImpression({
        campaignId: "taylora-v1-2026",
        sponsorId: "taylora",
        placementId: "home-partner-spotlight",
        route: "/",
      }),
    ).not.toThrow();

    expect(explosion).toHaveBeenCalled();
  });

  it("does not propagate a console.log exception from trackSponsorClick", () => {
    const explosion = vi
      .spyOn(console, "log")
      .mockImplementation(() => {
        throw new Error("console blew up");
      });

    expect(() =>
      trackSponsorClick({
        campaignId: "taylora-v1-2026",
        sponsorId: "taylora",
        placementId: "home-partner-spotlight",
        route: "/",
        destination: "https://taylora.com",
      }),
    ).not.toThrow();

    expect(explosion).toHaveBeenCalled();
  });

  it("does not propagate a console.log exception from trackSponsorOpportunityClick", () => {
    const explosion = vi
      .spyOn(console, "log")
      .mockImplementation(() => {
        throw new Error("console blew up");
      });

    expect(() =>
      trackSponsorOpportunityClick({
        placementId: "tool-sponsored-alternative",
        route: "/tools/taylora",
        destination: "https://example.com",
      }),
    ).not.toThrow();

    expect(explosion).toHaveBeenCalled();
  });
});
