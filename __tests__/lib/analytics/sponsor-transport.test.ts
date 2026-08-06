/**
 * Production transport boundary tests.
 *
 * These exercise the real `sendSponsorAnalytics` transport functions, not a
 * mocked high-level `emit`. They prove a keepalive/sendBeacon navigation-safe
 * delivery is used, the payload shape is correct, and failures are non-fatal.
 */

// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SPONSOR_ANALYTICS_INGEST_URL,
  sendSponsorAnalytics,
  type SponsorTransportPayload,
} from "@/lib/analytics/sponsor-transport";

const payload: SponsorTransportPayload = {
  name: "sponsor_click",
  ts: 1_700_000_000_000,
  campaignId: "taylora-v1-2026",
  sponsorId: "taylora",
  placementId: "home-partner-spotlight",
  route: "/",
  destination: "https://taylora.com",
  toolSlug: "taylora",
};

afterEach(() => {
  vi.restoreAllMocks();
});

function readBlobText(blob: Blob | undefined): Promise<string> {
  if (!blob) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("sendSponsorAnalytics transport", () => {
  it("uses navigator.sendBeacon to the ingest URL when available", () => {
    const beacon = vi
      .fn<(url: string, data?: BodyInit) => boolean>()
      .mockReturnValue(true);

    const accepted = sendSponsorAnalytics(payload, { sendBeacon: beacon });

    expect(accepted).toBe(true);
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]?.[0]).toBe(SPONSOR_ANALYTICS_INGEST_URL);
    const blob = beacon.mock.calls[0]?.[1] as Blob;
    expect(blob.type).toBe("application/json");
  });

  it("falls back to fetch with keepalive when sendBeacon rejects", () => {
    const beacon = vi
      .fn<(url: string, data?: BodyInit) => boolean>()
      .mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });

    const accepted = sendSponsorAnalytics(payload, {
      sendBeacon: beacon,
      fetch: fetchMock,
    });

    expect(accepted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      unknown,
      RequestInit,
    ];
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.credentials).toBe("same-origin");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("uses fetch keepalive when sendBeacon is unavailable", () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));

    const accepted = sendSponsorAnalytics(payload, { fetch: fetchMock });

    expect(accepted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      unknown,
      RequestInit,
    ];
    expect(init.keepalive).toBe(true);
  });

  it("does not throw and returns false when no transport exists", () => {
    expect(() =>
      sendSponsorAnalytics(payload, {
        fetch: undefined,
        sendBeacon: undefined,
      }),
    ).not.toThrow();
  });

  it("does not throw when a fetch rejection occurs (non-fatal)", () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("boom"));
    expect(() =>
      sendSponsorAnalytics(payload, { fetch: fetchMock }),
    ).not.toThrow();
  });

  it("sends the expected anonymous fields and no email in the body", async () => {
    const beacon = vi
      .fn<(url: string, data?: BodyInit) => boolean>()
      .mockReturnValue(true);
    sendSponsorAnalytics(payload, { sendBeacon: beacon });

    const blob = beacon.mock.calls[0]?.[1] as Blob;
    const serialized = await readBlobText(blob);
    expect(serialized).not.toContain("@");
    expect(serialized).toContain('"name":"sponsor_click"');
    expect(serialized).toContain('"placementId":"home-partner-spotlight"');
    expect(serialized).toContain('"campaignId":"taylora-v1-2026"');
    expect(serialized).toContain('"destination":"https://taylora.com"');
  });
});
