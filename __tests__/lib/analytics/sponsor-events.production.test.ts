/**
 * Production emitter tests.
 *
 * These verify the real `emit()` path calls the production transport in
 * production mode and still logs to console in development — not by mocking
 * the high-level `track*` functions, but by stubbing the transport boundary.
 */

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  trackSponsorClick,
  trackSponsorImpression,
  trackSponsorOpportunityClick,
} from "@/lib/analytics/sponsor-events";
import type { MockInstance } from "vitest";
import * as transport from "@/lib/analytics/sponsor-transport";

let send: MockInstance | undefined;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  send = vi
    .spyOn(transport, "sendSponsorAnalytics")
    .mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("production emit() calls the real transport", () => {
  it("one impression produces exactly one network delivery", () => {
    trackSponsorImpression({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "home-partner-spotlight",
      route: "/",
    });

    expect(send!).toHaveBeenCalledTimes(1);
    const payload = send!.mock.calls[0]?.[0] as transport.SponsorTransportPayload;
    expect(payload.name).toBe("sponsor_impression");
    expect(payload.campaignId).toBe("taylora-v1-2026");
    expect(payload.placementId).toBe("home-partner-spotlight");
    expect(payload).not.toHaveProperty("destination");
  });

  it("sponsor click sends sponsor_click only (never an opportunity event)", () => {
    trackSponsorClick({
      campaignId: "taylora-v1-2026",
      sponsorId: "taylora",
      placementId: "archive-sponsored-tool",
      route: "/archivio",
      destination: "https://taylora.com",
      toolSlug: "taylora",
    });

    expect(send!).toHaveBeenCalledTimes(1);
    const payload = send!.mock.calls[0]?.[0] as transport.SponsorTransportPayload;
    expect(payload.name).toBe("sponsor_click");
    expect(payload.destination).toBe("https://taylora.com");
    expect(payload.toolSlug).toBe("taylora");
  });

  it("opportunity CTA sends sponsor_opportunity_click only", () => {
    trackSponsorOpportunityClick({
      placementId: "home-opportunity-cta",
      route: "/",
      destination: "/sponsorizza",
    });

    expect(send!).toHaveBeenCalledTimes(1);
    const payload = send!.mock.calls[0]?.[0] as transport.SponsorTransportPayload;
    expect(payload.name).toBe("sponsor_opportunity_click");
    expect(payload.destination).toBe("/sponsorizza");
    expect(payload).not.toHaveProperty("sponsorId");
  });

  it("transport rejection is non-fatal in production", () => {
    send!.mockImplementation(() => false);
    expect(() =>
      trackSponsorImpression({
        campaignId: "c",
        sponsorId: "s",
        placementId: "p",
        route: "/",
      }),
    ).not.toThrow();
  });
});

describe("development emit() logs to console", () => {
  it("keeps useful dev console output and does not call the transport", () => {
    vi.stubEnv("NODE_ENV", "development");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    trackSponsorImpression({
      campaignId: "c",
      sponsorId: "s",
      placementId: "p",
      route: "/",
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(send!).not.toHaveBeenCalled();
  });
});
