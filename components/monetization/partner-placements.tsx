"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  Building2,
  Layers3,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  SponsorClickHandler,
  SponsorImpressionTracker,
} from "@/components/monetization/sponsor-analytics-tracker";
import { trackSponsorOpportunityClick } from "@/lib/analytics/sponsor-events";
import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
  type MonetizationPlacement,
  type MonetizationPlacementKey,
  type PublicMonetizationPlacement,
} from "@/lib/monetization/placements";
import { cn } from "@/lib/utils";

type PartnerPlacementProps = {
  placementKey: MonetizationPlacementKey;
  className?: string;
  formatLabelOverride?: string;
  /**
   * Route where the placement renders. Surfaced as `data-tracker-route` so
   * analytics can attribute impressions to the page that served the
   * placement. Does not change partner identity, copy or visibility.
   */
  trackerRoute?: string;
};

export function resolvePublicPlacement(
  placementKey: MonetizationPlacementKey,
): PublicMonetizationPlacement | null {
  const placement = getMonetizationPlacement(placementKey);
  return isPublicMonetizationPlacement(placement) ? placement : null;
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
      {text}
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
      <aside
        aria-label="Opportunità sponsor"
        className={cn(
          "partner-placement",
          "partner-placement--featured",
          "partner-placement--open",
          className,
        )}
        data-placement-id={placement.placementId ?? placement.key}
        data-placement-surface={placement.surface}
        data-sponsored="false"
        data-tracking-id={placement.trackingId}
      >
        <div className="partner-placement__rail" aria-hidden="true">
          <Zap />
        </div>
        <div className="partner-placement__body">
          <PartnerMeta formatLabel="Disponibile" disclosure={placement.label} />
          <div className="partner-placement__editorial">
            <h2>Il prossimo tool in evidenza potrebbe essere il tuo.</h2>
            <p>Porta il tuo tool davanti a chi sta già cercando cosa usare.</p>
          </div>
        </div>
        <div className="partner-placement__action">
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
            <span>Sponsorizza il tuo tool su TooolVibes</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </aside>
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
      <span>Vuoi presentare il tuo tool qui?</span>
      <ArrowRight size={12} aria-hidden="true" style={{ marginLeft: "var(--tv-space-micro-xs)", verticalAlign: "middle" }} />
    </Link>
  );
}

function PartnerMeta({
  formatLabel,
  disclosure,
}: {
  formatLabel: string;
  disclosure: string;
}) {
  return (
    <div className="partner-placement__meta">
      <SponsorDisclosure text={disclosure} />
      <span className="partner-placement__format">{formatLabel}</span>
    </div>
  );
}

function PartnerIdentity({
  placement,
}: {
  placement: PublicMonetizationPlacement;
}) {
  const logo = placement.partner.logo ?? placement.logo ?? null;

  return (
    <div className="partner-placement__identity">
      <span className="partner-placement__identity-mark" aria-hidden="true">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" loading="lazy" decoding="async" />
        ) : (
          <Building2 />
        )}
      </span>
      <span className="partner-placement__identity-copy">
        <strong>{placement.partner.name}</strong>
        <span>{placement.partner.category}</span>
      </span>
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
      <p className="partner-placement__reason-label">Perché è rilevante</p>
      <h2>{placement.title}</h2>
      <p>{placement.editorialReason}</p>
    </div>
  );
}

function PartnerAction({
  placement,
  trackerRoute,
}: {
  placement: PublicMonetizationPlacement;
  trackerRoute?: string;
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
      >
        <span>{placement.ctaLabel}</span>
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
) {
  return {
    "aria-label": `Contenuto sponsorizzato: ${placement.partner.name}`,
    className: cn("partner-placement", variant, className),
    "data-placement-id": placement.placementId ?? placement.key,
    "data-placement-surface": placement.surface,
    "data-tracking-id": placement.trackingId,
    "data-tracker-route": trackerRoute,
    "data-sponsored": "true" as const,
  };
}

function resolveVariantPlacement(
  placementKey: MonetizationPlacementKey,
  trackerRoute: string = "",
):
  | { kind: "open-slot"; placement: MonetizationPlacement; trackerRoute: string }
  | { kind: "public"; placement: PublicMonetizationPlacement; trackerRoute: string }
  | { kind: "empty"; trackerRoute: string } {
  const placement = getMonetizationPlacement(placementKey);
  const publicPlacement = resolvePublicPlacement(placementKey);

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
  formatLabelOverride,
  trackerRoute = "",
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute);

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
          "partner-placement--featured",
          trackerRoute,
        )}
      >
        <div className="partner-placement__rail" aria-hidden="true">
          <Sparkles />
        </div>
        <div className="partner-placement__body">
          <PartnerMeta
            formatLabel={formatLabelOverride ?? "Partner in evidenza"}
            disclosure={placement.label}
          />
          <PartnerIdentity placement={placement} />
          <PartnerEditorial placement={placement} />
        </div>
        <SponsorClickHandler
          {...trackerProps}
          destination={placement.partner.href}
        >
          <PartnerAction placement={placement} trackerRoute={trackerRoute} />
        </SponsorClickHandler>
      </aside>
    </SponsorImpressionTracker>
  );
}

export function PartnerToolCard({
  placementKey,
  className,
  formatLabelOverride,
  trackerRoute = "",
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute);

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
          "partner-placement--tool",
          trackerRoute,
        )}
      >
        <div className="partner-placement__tool-heading">
          <PartnerMeta
            formatLabel={formatLabelOverride ?? "Partner tool"}
            disclosure={placement.label}
          />
          <BadgeCheck aria-hidden="true" />
        </div>
        <div className="partner-placement__body">
          <PartnerIdentity placement={placement} />
          <PartnerEditorial placement={placement} />
        </div>
        <SponsorClickHandler
          {...trackerProps}
          destination={placement.partner.href}
        >
          <PartnerAction placement={placement} trackerRoute={trackerRoute} />
        </SponsorClickHandler>
      </aside>
    </SponsorImpressionTracker>
  );
}

export function ContextualPartnerBlock({
  placementKey,
  className,
  formatLabelOverride,
  trackerRoute = "",
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute);

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
          "partner-placement--contextual",
          trackerRoute,
        )}
      >
        <div className="partner-placement__context-marker" aria-hidden="true">
          <BookOpenText />
        </div>
        <div className="partner-placement__body">
          <PartnerMeta
            formatLabel={formatLabelOverride ?? "Partner della lettura"}
            disclosure={placement.label}
          />
          <PartnerEditorial placement={placement} />
          <PartnerIdentity placement={placement} />
        </div>
        <SponsorClickHandler
          {...trackerProps}
          destination={placement.partner.href}
        >
          <PartnerAction placement={placement} trackerRoute={trackerRoute} />
        </SponsorClickHandler>
      </aside>
    </SponsorImpressionTracker>
  );
}

export function PartnerCollectionModule({
  placementKey,
  className,
  formatLabelOverride,
  trackerRoute = "",
}: PartnerPlacementProps) {
  const resolved = resolveVariantPlacement(placementKey, trackerRoute);

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
          "partner-placement--collection",
          trackerRoute,
        )}
      >
        <div className="partner-placement__collection-index" aria-hidden="true">
          <span>Partner</span>
          <Layers3 />
        </div>
        <div className="partner-placement__body">
          <PartnerMeta
            formatLabel={formatLabelOverride ?? "Partner della raccolta"}
            disclosure={placement.label}
          />
          <PartnerIdentity placement={placement} />
          <PartnerEditorial placement={placement} />
        </div>
        <SponsorClickHandler
          {...trackerProps}
          destination={placement.partner.href}
        >
          <PartnerAction placement={placement} trackerRoute={trackerRoute} />
        </SponsorClickHandler>
      </aside>
    </SponsorImpressionTracker>
  );
}
