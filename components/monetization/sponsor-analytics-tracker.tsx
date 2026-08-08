"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";

import {
  trackSponsorClick,
  trackSponsorImpression,
  trackSponsorOpportunityClick,
  type SponsorFormatVariant,
} from "@/lib/analytics/sponsor-events";

export type SponsorImpressionTrackerProps = {
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  formatVariant?: SponsorFormatVariant;
  impressionStateRef?: MutableRefObject<boolean>;
  className?: string;
  children: ReactNode;
};

export function SponsorImpressionTracker({
  campaignId,
  sponsorId,
  placementId,
  route,
  toolSlug,
  formatVariant,
  impressionStateRef,
  className,
  children,
}: SponsorImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const localFiredRef = useRef(false);
  const firedRef = impressionStateRef ?? localFiredRef;

  useEffect(() => {
    const node = ref.current;
    if (!node || firedRef.current) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.1) continue;
          if (firedRef.current) return;
          firedRef.current = true;
          try {
            trackSponsorImpression({
              campaignId,
              sponsorId,
              placementId,
              route,
              toolSlug,
              ...(formatVariant ? { formatVariant } : {}),
            });
          } catch {
            // Analytics failure is non-fatal and never blocks the UI.
          }
          observer.disconnect();
          return;
        }
      },
      { threshold: [0, 0.1, 0.5, 1] },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [campaignId, sponsorId, placementId, route, toolSlug, formatVariant, firedRef]);

  return (
    <div
      ref={ref}
      className={className}
      data-sponsor-tracker="impression"
      data-campaign-id={campaignId}
      data-sponsor-id={sponsorId}
      data-placement-id={placementId}
      data-format-variant={formatVariant}
    >
      {children}
    </div>
  );
}

export type SponsorClickHandlerProps = {
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  formatVariant?: SponsorFormatVariant;
  destination: string;
  children: ReactNode;
};

export function SponsorClickHandler({
  campaignId,
  sponsorId,
  placementId,
  route,
  toolSlug,
  formatVariant,
  destination,
  children,
}: SponsorClickHandlerProps) {
  const handleClick = useCallback(() => {
    trackSponsorClick({
      campaignId,
      sponsorId,
      placementId,
      route,
      toolSlug,
      ...(formatVariant ? { formatVariant } : {}),
      destination,
    });
  }, [campaignId, sponsorId, placementId, route, toolSlug, formatVariant, destination]);

  return (
    <span
      onClick={handleClick}
      data-sponsor-tracker="click"
      data-campaign-id={campaignId}
      data-sponsor-id={sponsorId}
      data-placement-id={placementId}
      data-format-variant={formatVariant}
    >
      {children}
    </span>
  );
}

export type SponsorOpportunityClickHandlerProps = {
  placementId: string;
  route: string;
  destination?: string;
  className?: string;
  children: ReactNode;
};

export type SponsorOpportunityMailtoLinkProps = {
  placementId: string;
  route?: string;
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Mailto/anchored acquisition CTA that emits one sponsor_opportunity_click
 * on click and never interferes with navigation: no preventDefault, no href
 * swap, no extra nesting. Fires only on the user-initiated click.
 */
export function SponsorOpportunityMailtoLink({
  placementId,
  route = "/sponsorizza",
  href,
  className,
  children,
}: SponsorOpportunityMailtoLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        try {
          trackSponsorOpportunityClick({
            placementId,
            route,
            destination: href,
          });
        } catch {
          // Analytics failure is non-fatal and must not block the mail client.
        }
      }}
    >
      {children}
    </a>
  );
}

export function SponsorOpportunityClickHandler({
  placementId,
  route,
  destination,
  className,
  children,
}: SponsorOpportunityClickHandlerProps) {
  const handleClick = useCallback(() => {
    trackSponsorOpportunityClick({
      placementId,
      route,
      destination: destination ?? "/sponsorizza",
    });
  }, [placementId, route, destination]);

  return (
    <span
      onClick={handleClick}
      className={className}
      data-sponsor-tracker="opportunity"
      data-placement-id={placementId}
    >
      {children}
    </span>
  );
}
