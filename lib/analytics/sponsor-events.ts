/**
 * Sponsor analytics — lightweight, non-fatal event tracking.
 *
 * Events are logged to console in development and can be piped
 * to any analytics backend. Failure is always non-fatal.
 */

export type SponsorImpressionEvent = {
  kind: "sponsor_impression";
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
};

export type SponsorClickEvent = {
  kind: "sponsor_click";
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  destination: string;
};

export type SponsorOpportunityClickEvent = {
  kind: "sponsor_opportunity_click";
  placementId: string;
  route: string;
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

function emit(event: SponsorAnalyticsEvent): void {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[sponsor-analytics]", event);
    }
  } catch {
    // Analytics failure is non-fatal
  }
}
