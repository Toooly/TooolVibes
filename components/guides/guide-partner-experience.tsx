"use client";

import { createPortal } from "react-dom";
import { useRef } from "react";

import { ContextualPartnerBlock } from "@/components/monetization/partner-placements";
import { useGuidePartnerMode } from "@/lib/hooks/use-guide-partner-mode";
import type { PartnerResolutionContext } from "@/lib/sponsors/partner-resolver";

type GuidePartnerExperienceProps = {
  context: Partial<PartnerResolutionContext>;
  railHostId: string;
  trackerRoute: string;
};

/**
 * One commercial placement with two responsive formats. The paid subtree is
 * rendered inline or portalled into the existing editorial rail, never both.
 * The page-local ref survives format changes, so a resize cannot manufacture
 * another impression; a genuine page remount still starts a fresh session.
 */
export function GuidePartnerExperience({
  context,
  railHostId,
  trackerRoute,
}: GuidePartnerExperienceProps) {
  const formatVariant = useGuidePartnerMode();
  const impressionStateRef = useRef(false);
  const railHost =
    formatVariant === "rail" && typeof document !== "undefined"
      ? document.getElementById(railHostId)
      : null;

  const experience = (
    <ContextualPartnerBlock
      placementKey="guide-inline-promo"
      className={
        formatVariant === "rail"
          ? "guide-partner-experience guide-partner-experience--rail"
          : "guide-partner-experience guide-partner-experience--inline guides-section"
      }
      context={context}
      trackerRoute={trackerRoute}
      formatVariant={formatVariant}
      impressionStateRef={impressionStateRef}
    />
  );

  return railHost ? createPortal(experience, railHost) : experience;
}
