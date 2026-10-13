"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import type { MutableRefObject } from "react";

import {
  OpenSlotPreviewCreative,
  PartnerCreativeRenderer,
} from "@/components/monetization/partner-creatives";
import { partnerThemeKey } from "@/lib/sponsors/partner-theme";
import type { PartnerResolutionContext } from "@/lib/sponsors/partner-resolver";
import {
  SponsorClickHandler,
  SponsorImpressionTracker,
} from "@/components/monetization/sponsor-analytics-tracker";
import {
  trackSponsorOpportunityClick,
  type SponsorFormatVariant,
} from "@/lib/analytics/sponsor-events";
import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
  resolutionNowMs,
  type MonetizationPlacement,
  type MonetizationPlacementKey,
  type PublicMonetizationPlacement,
} from "@/lib/monetization/placements";
import { cn } from "@/lib/utils";
import { useCommercialNow } from "@/components/monetization/commercial-clock";

type PartnerPlacementProps = {
  placementKey: MonetizationPlacementKey;
  className?: string;
  /**
   * Route where the placement renders. Surfaced as `data-tracker-route` so
   * analytics can attribute impressions to the page that served the
   * placement. Does not change partner identity, copy or visibility.
   */
  trackerRoute?: string;
  /**
   * Subject context for contextual surfaces (tool slug, catalogue
   * segments/tags, free text). Rotation surfaces ignore it.
   */
  context?: Partial<PartnerResolutionContext>;
  formatVariant?: SponsorFormatVariant;
  impressionStateRef?: MutableRefObject<boolean>;
};

function usePartnerContext(
  context?: Partial<PartnerResolutionContext>,
): Partial<PartnerResolutionContext> {
  const now = useCommercialNow();
  return { ...context, now: context?.now ?? now };
}

export function resolvePublicPlacement(
  placementKey: MonetizationPlacementKey,
  context?: Partial<PartnerResolutionContext>,
): PublicMonetizationPlacement | null {
  const placement = getMonetizationPlacement(placementKey, context);
  return isPublicMonetizationPlacement(placement, resolutionNowMs(context))
    ? placement
    : null;
}

function isOpenSlotPlacement(
  placement: MonetizationPlacement | undefined,
): placement is MonetizationPlacement {
  return Boolean(
    placement && placement.placementId === "tool-sponsored-alternative",
  );
}

function SponsorDisclosure({ text }: { text: string }) {
  return (
    <span className="partner-placement__disclosure" data-sponsored="true">
      <LocalizedText>{text}</LocalizedText>
    </span>
  );
}

export function SponsorOpenSlot({
  placement,
  className,
  trackerRoute = "",
}: {
  placement: MonetizationPlacement;
  className?: string;
  trackerRoute?: string;
}) {
  return (
    <SponsorImpressionTracker
      campaignId="open-slot"
      sponsorId="open-slot"
      placementId={placement.placementId ?? placement.key}
      route={trackerRoute}
    >
      <LocalizedAttributes><aside
        aria-label="Opportunità sponsor"
        className={cn(
          "partner-placement",
          "partner-placement--featured",
          "partner-placement--open",
          "partner-open",
          className,
        )}
        data-placement-id={placement.placementId ?? placement.key}
        data-placement-surface={placement.surface}
        data-sponsored="false"
        data-partner-experience="open-slot"
        data-tracking-id={placement.trackingId}
      >
        <div className="partner-open__editorial">
          <PartnerMeta formatLabel="Disponibile" disclosure={placement.label} showFormat />
          <h2 className="partner-open__headline"><LocalizedText>{"Il prossimo tool qui potrebbe essere il tuo. "}</LocalizedText></h2>
          <p className="partner-open__lede"><LocalizedText>{"Identità, messaggio e visual narrativo costruiti intorno al tuo prodotto. "}</LocalizedText></p>
          <div className="partner-placement__action partner-open__action">
            <Link
              href="/sponsorizza"
              rel="sponsored"
              data-tracking-id={placement.trackingId}
              onClick={() => {
                try {
                  trackSponsorOpportunityClick({
                    placementId: "tool-detail-open-slot",
                    route: trackerRoute || "/",
                    destination: "/sponsorizza",
                  });
                } catch {
                  // Analytics failure is non-fatal and must not block navigation.
                }
              }}
            >
              <span><LocalizedText>{"Sponsorizza il tuo tool su TooolVibes"}</LocalizedText></span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <p className="partner-open__cue partner-open__kicker" data-typography="metadata"><LocalizedText>{"Partner Experience curate da TooolVibes"}</LocalizedText></p>
        </div>
        <div className="partner-open__visual" aria-hidden="true">
          <OpenSlotPreviewCreative />
        </div>
      </aside></LocalizedAttributes>
    </SponsorImpressionTracker>
  );
}

export function SponsorOpportunityLink({
  className,
  placementId = "sponsor-opportunity",
  route = "",
}: {
  className?: string;
  placementId?: string;
  route?: string;
}) {
  return (
    <Link
      href="/sponsorizza"
      className={cn("partner-placement__opportunity", className)}
      data-tracking-id="tv-sponsor-opportunity"
      onClick={() => {
        try {
          trackSponsorOpportunityClick({
            placementId,
            route: route || "/",
            destination: "/sponsorizza",
          });
        } catch {
          // Analytics failure is non-fatal and must not block navigation.
        }
      }}
    >
      <span><LocalizedText>{"Vuoi presentare il tuo tool qui?"}</LocalizedText></span>
      <ArrowRight size={12} aria-hidden="true" style={{ marginLeft: "var(--tv-space-micro-xs)", verticalAlign: "middle" }} />
    </Link>
  );
}

function PartnerMeta({
  formatLabel,
  disclosure,
  showFormat = false,
}: {
  formatLabel?: string;
  disclosure: string;
  showFormat?: boolean;
}) {
  return (
    <div className="partner-placement__meta">
      <SponsorDisclosure text={disclosure} />
      {showFormat && formatLabel ? (
        <span className="partner-placement__format"><LocalizedText>{formatLabel}</LocalizedText></span>
      ) : null}
    </div>
  );
}


function PartnerEditorial({
  placement,
}: {
  placement: PublicMonetizationPlacement;
}) {
  return (
    <div className="partner-placement__editorial">
      <h2><LocalizedText>{placement.title}</LocalizedText></h2>
      <p><LocalizedText>{placement.editorialReason}</LocalizedText></p>
    </div>
  );
}

function PartnerAction({
  placement,
  trackerRoute,
  variant = "primary",
}: {
  placement: PublicMonetizationPlacement;
  trackerRoute?: string;
  variant?: "primary" | "secondary";
}) {
  const isExternal = /^https?:\/\//.test(placement.partner.href);

  return (
    <div className="partner-placement__action">
      <Link
        href={placement.partner.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "sponsored noopener noreferrer" : "sponsored"}
        data-tracking-id={placement.trackingId}
        data-tracker-route={trackerRoute}
        className={cn(
          variant === "primary" && "partner-placement__action--primary",
          variant === "secondary" && "partner-placement__action--secondary",
        )}
      >
        <span><LocalizedText>{placement.ctaLabel}</LocalizedText></span>
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </div>
  );
}


function placementShellProps(
  placement: PublicMonetizationPlacement,
  className: string | undefined,
  variant: string,
  trackerRoute: string | undefined,
  experience?: "stage" | "insert" | "tool" | "contextual" | "collection",
) {
  return {
    "aria-label": `Contenuto sponsorizzato: ${placement.partner.name}`,
    className: cn("partner-placement", variant, className),
    "data-placement-id": placement.placementId ?? placement.key,
    "data-placement-surface": placement.surface,
    "data-tracking-id": placement.trackingId,
    "data-tracker-route": trackerRoute,
    "data-sponsored": "true" as const,
    "data-partner-theme": partnerThemeKey(placement.creativeTheme),
    ...(experience ? { "data-partner-experience": experience } : {}),
  };
}

function resolveVariantPlacement(
  placementKey: MonetizationPlacementKey,
  trackerRoute: string = "",
  context?: Partial<PartnerResolutionContext>,
):
  | { kind: "open-slot"; placement: MonetizationPlacement; trackerRoute: string }
  | { kind: "public"; placement: PublicMonetizationPlacement; trackerRoute: string }
  | { kind: "empty"; trackerRoute: string } {
  const placement = getMonetizationPlacement(placementKey, context);
  const publicPlacement = resolvePublicPlacement(placementKey, context);

  if (publicPlacement) {
    return { kind: "public", placement: publicPlacement, trackerRoute };
  }
  if (isOpenSlotPlacement(placement)) {
    return { kind: "open-slot", placement, trackerRoute };
  }
  return { kind: "empty", trackerRoute };
}

export function FeaturedPartner({
  placementKey,
  className,
  trackerRoute = "",
  context,
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute, usePartnerContext(context));

  if (resolved.kind === "open-slot") {
    return (
      <SponsorOpenSlot
        placement={resolved.placement}
        className={className}
        trackerRoute={trackerRoute}
      />
    );
  }
  if (resolved.kind === "empty") return null;

  const placement = resolved.placement;

  const trackerProps = {
    campaignId: placement.trackingId ?? placement.key,
    sponsorId: placement.partner.name,
    placementId: placement.placementId ?? placement.key,
    route: "/",
  };

  return (
    <SponsorImpressionTracker {...trackerProps}>
      <aside
        {...placementShellProps(
          placement,
          className,
          "partner-placement--featured partner-placement--xl partner-stage partner-luminous partner-pe--hero",
          trackerRoute,
          "stage",
        )}
      >
        <span className="partner-luminous__halo" aria-hidden="true" />
        <div className="partner-stage__editorial">
          <PartnerMeta disclosure={placement.label} />
          <h2 className="partner-stage__headline"><LocalizedText>{placement.title}</LocalizedText></h2>
          <p className="partner-stage__lede"><LocalizedText>{placement.editorialReason}</LocalizedText></p>
          <div className="partner-placement__cta-row partner-stage__cta-row">
            <SponsorClickHandler
              {...trackerProps}
              destination={placement.partner.href}
            >
              <PartnerAction placement={placement} trackerRoute={trackerRoute} />
            </SponsorClickHandler>
          </div>
        </div>
        <div className="partner-stage__visual" aria-hidden="true">
          <PartnerCreativeRenderer
            creativeVariant={placement.creativeVariant}
            creativeTheme={placement.creativeTheme}
            brandAsset={placement.brandAsset}
            partnerName={placement.partner.name}
            density="stage"
          />
        </div>
      </aside>
    </SponsorImpressionTracker>
  );
}

/**
 * Partner Experience — editorial insert for the catalogue.
 *
 * A magazine-style feature strip that visibly interrupts the organic card
 * grammar: dark vertical identity marker, editorial headline, concise
 * proposition, mini partner narrative and CTA. No score, no rank, no
 * tool-card shell — the silhouette is deliberately not a tool card.
 */
export function PartnerEditorialInsert({
  placementKey,
  className,
  trackerRoute = "",
  context,
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute, usePartnerContext(context));

  if (resolved.kind === "open-slot") {
    return (
      <SponsorOpenSlot
        placement={resolved.placement}
        className={className}
        trackerRoute={trackerRoute}
      />
    );
  }
  if (resolved.kind === "empty") return null;

  const placement = resolved.placement;

  const trackerProps = {
    campaignId: placement.trackingId ?? placement.key,
    sponsorId: placement.partner.name,
    placementId: placement.placementId ?? placement.key,
    route: trackerRoute,
  };

  return (
    <SponsorImpressionTracker {...trackerProps}>
      <aside
        {...placementShellProps(
          placement,
          className,
          "partner-placement--insert partner-insert partner-luminous partner-pe--ribbon",
          trackerRoute,
          "insert",
        )}
      >
        <span className="partner-luminous__halo" aria-hidden="true" />
        <div className="partner-insert__main">
          <PartnerMeta disclosure={placement.label} />
          <h2 className="partner-insert__headline"><LocalizedText>{placement.title}</LocalizedText></h2>
          <p className="partner-insert__lede"><LocalizedText>{placement.editorialReason}</LocalizedText></p>
          <SponsorClickHandler
            {...trackerProps}
            destination={placement.partner.href}
          >
            <PartnerAction placement={placement} trackerRoute={trackerRoute} />
          </SponsorClickHandler>
        </div>
        <div className="partner-insert__visual" aria-hidden="true">
          <PartnerCreativeRenderer
            creativeVariant={placement.creativeVariant}
            creativeTheme={placement.creativeTheme}
            brandAsset={placement.brandAsset}
            partnerName={placement.partner.name}
            density="ribbon"
          />
        </div>
      </aside>
    </SponsorImpressionTracker>
  );
}

export function PartnerToolCard({
  placementKey,
  className,
  trackerRoute = "",
  context,
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute, usePartnerContext(context));

  if (resolved.kind === "open-slot") {
    return (
      <SponsorOpenSlot
        placement={resolved.placement}
        className={className}
        trackerRoute={trackerRoute}
      />
    );
  }
  if (resolved.kind === "empty") return null;

  const placement = resolved.placement;

  const trackerProps = {
    campaignId: placement.trackingId ?? placement.key,
    sponsorId: placement.partner.name,
    placementId: placement.placementId ?? placement.key,
    route: trackerRoute,
  };

  return (
    <SponsorImpressionTracker {...trackerProps}>
      <aside
        {...placementShellProps(
          placement,
          className,
          "partner-placement--tool partner-luminous partner-pe--contextual",
          trackerRoute,
          "tool",
        )}
      >
        <span className="partner-luminous__halo" aria-hidden="true" />
        <div className="partner-placement__body">
          <PartnerMeta disclosure={placement.label} />
          <PartnerEditorial placement={placement} />
          <SponsorClickHandler
            {...trackerProps}
            destination={placement.partner.href}
          >
            <PartnerAction placement={placement} trackerRoute={trackerRoute} />
          </SponsorClickHandler>
        </div>
        {placement.brandAsset || placement.creativeVariant ? (
          <div className="partner-placement__tool-visual" aria-hidden="true">
            <PartnerCreativeRenderer
              creativeVariant={placement.creativeVariant}
              creativeTheme={placement.creativeTheme}
              brandAsset={placement.brandAsset}
              partnerName={placement.partner.name}
              density="contextual"
            />
          </div>
        ) : null}
      </aside>
    </SponsorImpressionTracker>
  );
}

export function ContextualPartnerBlock({
  placementKey,
  className,
  trackerRoute = "",
  context,
  formatVariant,
  impressionStateRef,
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute, usePartnerContext(context));

  if (resolved.kind === "open-slot") {
    return (
      <SponsorOpenSlot
        placement={resolved.placement}
        className={className}
        trackerRoute={trackerRoute}
      />
    );
  }
  if (resolved.kind === "empty") return null;

  const placement = resolved.placement;

  const trackerProps = {
    campaignId: placement.trackingId ?? placement.key,
    sponsorId: placement.partner.name,
    placementId: placement.placementId ?? placement.key,
    route: trackerRoute,
    formatVariant,
  };

  return (
    <SponsorImpressionTracker
      {...trackerProps}
      impressionStateRef={impressionStateRef}
    >
      <aside
        {...placementShellProps(
          placement,
          className,
          "partner-placement--contextual partner-luminous partner-luminous--soft partner-pe--contextual",
          trackerRoute,
          "contextual",
        )}
      >
        <span className="partner-luminous__halo" aria-hidden="true" />
        <div className="partner-placement__body">
          <PartnerMeta disclosure={placement.label} />
          <PartnerEditorial placement={placement} />
          <SponsorClickHandler
            {...trackerProps}
            destination={placement.partner.href}
          >
            <PartnerAction
              placement={placement}
              trackerRoute={trackerRoute}
              variant="secondary"
            />
          </SponsorClickHandler>
        </div>
        {placement.brandAsset || placement.creativeVariant ? (
          <div className="partner-placement__context-visual" aria-hidden="true">
            <PartnerCreativeRenderer
              creativeVariant={placement.creativeVariant}
              creativeTheme={placement.creativeTheme}
              brandAsset={placement.brandAsset}
              partnerName={placement.partner.name}
              density="contextual"
            />
          </div>
        ) : null}
      </aside>
    </SponsorImpressionTracker>
  );
}

export function PartnerCollectionModule({
  placementKey,
  className,
  trackerRoute = "",
  context,
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute, usePartnerContext(context));

  if (resolved.kind === "open-slot") {
    return (
      <SponsorOpenSlot
        placement={resolved.placement}
        className={className}
        trackerRoute={trackerRoute}
      />
    );
  }
  if (resolved.kind === "empty") return null;

  const placement = resolved.placement;

  const trackerProps = {
    campaignId: placement.trackingId ?? placement.key,
    sponsorId: placement.partner.name,
    placementId: placement.placementId ?? placement.key,
    route: trackerRoute,
  };

  return (
    <SponsorImpressionTracker {...trackerProps}>
      <aside
        {...placementShellProps(
          placement,
          className,
          "partner-placement--collection partner-luminous partner-luminous--soft partner-pe--ending",
          trackerRoute,
          "collection",
        )}
      >
        <span className="partner-luminous__halo" aria-hidden="true" />
        <div className="partner-placement__body">
          <PartnerMeta disclosure={placement.label} />
          <PartnerEditorial placement={placement} />
          <SponsorClickHandler
            {...trackerProps}
            destination={placement.partner.href}
          >
            <PartnerAction placement={placement} trackerRoute={trackerRoute} />
          </SponsorClickHandler>
        </div>
        {placement.brandAsset || placement.creativeVariant ? (
          <div className="partner-placement__collection-visual" aria-hidden="true">
            <PartnerCreativeRenderer
              creativeVariant={placement.creativeVariant}
              creativeTheme={placement.creativeTheme}
              brandAsset={placement.brandAsset}
              partnerName={placement.partner.name}
              density="ending"
            />
          </div>
        ) : null}
      </aside>
    </SponsorImpressionTracker>
  );
}
