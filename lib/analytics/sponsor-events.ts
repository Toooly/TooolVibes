/**
 * Sponsor analytics — lightweight, non-fatal event tracking.
 *
 * Events are logged to console in development and delivered to the first-party
 * ingest endpoint in production via a navigation-safe, keepalive transport.
 * Failure is always non-fatal. Only anonymous, consent-permitted fields are
 * transmitted — never email, IP, name, account identifiers, personal data from
 * query strings, cookies, or fingerprint data.
 */

import {
  sendSponsorAnalytics,
  type SponsorTransportPayload,
} from "@/lib/analytics/sponsor-transport";

export type SponsorFormatVariant = "inline" | "rail";

export type SponsorImpressionEvent = {
  kind: "sponsor_impression";
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  formatVariant?: SponsorFormatVariant;
};

export type SponsorClickEvent = {
  kind: "sponsor_click";
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  formatVariant?: SponsorFormatVariant;
  destination: string;
};

export type SponsorOpportunityClickEvent = {
  kind: "sponsor_opportunity_click";
  placementId: string;
  route: string;
  /** Where the opportunity click leads (internal route or mailto target). */
  destination: string;
  /** Acquisition/campaign identifier when it exists for the placement. */
  campaignId?: string;
  sponsorId?: string;
  toolSlug?: string;
};

export type SponsorAnalyticsEvent =
  | SponsorImpressionEvent
  | SponsorClickEvent
  | SponsorOpportunityClickEvent;

/**
 * Impression denominators per visible mount.
 *
 * Dedupe happens at mount level in the tracker component (per-mount
 * `useRef`), so the same placement can legitimately re-emit a new
 * impression when it is unmounted and remounted on a new page view.
 * This module deliberately holds no module-level key store: a permanent
 * Set keyed on campaignId:placementId:route would suppress the new
 * impression after an SPA navigation or remount, which is wrong.
 */
export function trackSponsorImpression(
  event: Omit<SponsorImpressionEvent, "kind">,
): void {
  const fullEvent: SponsorImpressionEvent = {
    ...event,
    kind: "sponsor_impression",
  };
  emit(fullEvent);
}

export function trackSponsorClick(
  event: Omit<SponsorClickEvent, "kind">,
): void {
  const fullEvent: SponsorClickEvent = { ...event, kind: "sponsor_click" };
  emit(fullEvent);
}

export function trackSponsorOpportunityClick(
  event: Omit<SponsorOpportunityClickEvent, "kind">,
): void {
  const fullEvent: SponsorOpportunityClickEvent = {
    ...event,
    kind: "sponsor_opportunity_click",
  };
  emit(fullEvent);
}

function toTransportPayload(
  event: SponsorAnalyticsEvent,
): SponsorTransportPayload {
  const base: SponsorTransportPayload = {
    name: event.kind,
    ts: Date.now(),
    placementId: event.placementId,
    route: event.route,
  };
  if (event.kind !== "sponsor_opportunity_click") {
    base.campaignId = event.campaignId;
    base.sponsorId = event.sponsorId;
  } else {
    if (event.campaignId) base.campaignId = event.campaignId;
    if (event.sponsorId) base.sponsorId = event.sponsorId;
  }
  if (event.toolSlug) base.toolSlug = event.toolSlug;
  if (
    event.kind !== "sponsor_opportunity_click" &&
    event.formatVariant
  ) {
    base.formatVariant = event.formatVariant;
  }
  if ("destination" in event) base.destination = event.destination;
  return base;
}

function emit(event: SponsorAnalyticsEvent): void {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[sponsor-analytics]", event);
      return;
    }
    sendSponsorAnalytics(toTransportPayload(event));
  } catch {
    // Analytics failure is non-fatal
  }
}
