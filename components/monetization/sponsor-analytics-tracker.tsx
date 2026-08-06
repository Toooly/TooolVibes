"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

import {
  trackSponsorClick,
  trackSponsorImpression,
  trackSponsorOpportunityClick,
} from "@/lib/analytics/sponsor-events";

export type SponsorImpressionTrackerProps = {
  campaignId: string;
  sponsorId: string;
  placementId: string;
  route: string;
  toolSlug?: string;
  className?: string;
  children: ReactNode;
};

export function SponsorImpressionTracker({
  campaignId,
  sponsorId,
  placementId,
  route,
  toolSlug,
  className,
  children,
}: SponsorImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

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
  }, [campaignId, sponsorId, placementId, route, toolSlug]);

  return (
    <div
      ref={ref}
      className={className}
      data-sponsor-tracker="impression"
      data-campaign-id={campaignId}
      data-sponsor-id={sponsorId}
      data-placement-id={placementId}
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
  destination: string;
  children: ReactNode;
};

export function SponsorClickHandler({
  campaignId,
  sponsorId,
  placementId,
  route,
  toolSlug,
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
      destination,
    });
  }, [campaignId, sponsorId, placementId, route, toolSlug, destination]);

  return (
    <span
      onClick={handleClick}
      data-sponsor-tracker="click"
      data-campaign-id={campaignId}
      data-sponsor-id={sponsorId}
      data-placement-id={placementId}
    >
      {children}
    </span>
  );
}

export type SponsorOpportunityClickHandlerProps = {
  placementId: string;
  route: string;
  className?: string;
  children: ReactNode;
};

export function SponsorOpportunityClickHandler({
  placementId,
  route,
  className,
  children,
}: SponsorOpportunityClickHandlerProps) {
  const handleClick = useCallback(() => {
    trackSponsorOpportunityClick({
      placementId,
      route,
    });
  }, [placementId, route]);

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
