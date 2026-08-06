/**
 * Sponsor analytics production transport.
 *
 * Navigation-safe, non-fatal delivery of sponsor events to the first-party
 * ingest endpoint. Uses `navigator.sendBeacon` when available and falls back
 * to `fetch` with `keepalive: true` so a click that triggers immediate
 * navigation is not silently dropped.
 *
 * Only anonymous, consent-permitted fields are sent. No email, IP, name,
 * account identifier, query-string personal data, cookie, or fingerprint data.
 */

export const SPONSOR_ANALYTICS_INGEST_URL = "/api/sponsor-analytics";

export type SponsorTransportPayload = {
  /** Canonical event name, e.g. "sponsor_impression". */
  name: string;
  /** Anonymous client timestamp (epoch ms). Upserted by the server otherwise. */
  ts: number;
  campaignId?: string;
  sponsorId?: string;
  placementId: string;
  route: string;
  destination?: string;
  toolSlug?: string;
};

type BrowserTransport = {
  sendBeacon?: (url: string, data?: BodyInit) => boolean;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>;
};

function isBrowserLike(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator !== "string"
  );
}

function encodePayload(payload: SponsorTransportPayload): Blob {
  return new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
}

/**
 * Deliver a single sponsor event. Returns true when the beacon is accepted or
 * the fetch is dispatched. Never throws and never blocks the caller.
 */
export function sendSponsorAnalytics(
  payload: SponsorTransportPayload,
  transport?: Partial<BrowserTransport>,
): boolean {
  try {
    const nav =
      transport?.sendBeacon !== undefined
        ? transport
        : isBrowserLike()
          ? ({ sendBeacon: navigator.sendBeacon } as Partial<BrowserTransport>)
          : ({} as Partial<BrowserTransport>);

    if (typeof nav.sendBeacon === "function") {
      try {
        const accepted = nav.sendBeacon(
          SPONSOR_ANALYTICS_INGEST_URL,
          encodePayload(payload),
        );
        if (accepted) return true;
        // Beacon rejected (payload queued but not sent); fall through to fetch.
      } catch {
        return false;
      }
    }

    const doFetch =
      transport?.fetch !== undefined
        ? transport.fetch
        : (input: RequestInfo | URL, init?: RequestInit) =>
            globalThis.fetch(input, init);

    if (typeof doFetch === "function") {
      const promise = doFetch(SPONSOR_ANALYTICS_INGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "same-origin",
      });
      if (
        promise &&
        typeof (promise as Promise<unknown>).catch === "function"
      ) {
        (promise as Promise<unknown>).catch(() => undefined);
      }
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
